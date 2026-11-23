/*
 * Apache Guacamole Extension: Disable Host IME
 *
 * Prevents the host OS IME (e.g., Windows Shift language toggle and local
 * composition window) from activating during remote desktop interaction by
 * replacing Guacamole.InputSink's hidden <textarea> with a non-editable
 * element, while keeping visible inputs (login screen, sidebar clipboard,
 * settings forms) fully functional.
 */
(function () {
    'use strict';

    if (typeof Guacamole === 'undefined') {
        return;
    }

    // Skip overriding InputSink on touch-only mobile/tablet devices so their
    // on-screen virtual keyboards continue to work normally.
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        try {
            if (window.matchMedia('(pointer: coarse) and (hover: none)').matches) {
                return;
            }
        } catch (e) {
            // Ignore matchMedia errors in restricted environments
        }
    }

    /**
     * Checks whether the given element is an editable form control or
     * contenteditable element.
     *
     * @param {Element} el
     * @returns {boolean}
     */
    function isEditableElement(el) {
        if (!el || el === document.body || el === document.documentElement) {
            return false;
        }
        var tag = el.tagName ? el.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            return true;
        }
        return !!el.isContentEditable;
    }

    /**
     * Checks whether the given element is currently visible in the viewport.
     *
     * @param {Element} el
     * @returns {boolean}
     */
    function isElementVisible(el) {
        if (!el || !el.getBoundingClientRect) {
            return false;
        }
        var rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }
        var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
        if (style && (style.visibility === 'hidden' || style.display === 'none')) {
            return false;
        }
        return true;
    }

    /**
     * Replaces Guacamole.InputSink with a non-editable placeholder so that
     * Guacamole no longer focuses a hidden <textarea> on every keypress.
     * Guacamole.Keyboard still receives raw keydown/keyup events via document.
     *
     * @constructor
     */
    Guacamole.InputSink = function DisabledInputSink() {
        var dummy = document.createElement('div');
        dummy.style.position = 'fixed';
        dummy.style.width = '0';
        dummy.style.height = '0';
        dummy.style.left = '0';
        dummy.style.bottom = '0';
        dummy.style.overflow = 'hidden';
        dummy.style.pointerEvents = 'none';
        dummy.setAttribute('aria-hidden', 'true');

        this.focus = function focus() {
            // No-op: keep focus out of editable elements during remote control
            // so the host OS IME stays inactive.
        };

        this.getElement = function getElement() {
            return dummy;
        };
    };

    // If the user closes the Guacamole sidebar/menu while a sidebar input
    // (such as the clipboard textarea) still holds focus, blur it on the next
    // keypress so the host IME immediately disengages.
    document.addEventListener('keydown', function blurHiddenEditable() {
        var active = document.activeElement;
        if (isEditableElement(active) && !isElementVisible(active)) {
            active.blur();
        }
    }, true);

    // When clicking back onto non-editable areas (such as the remote desktop
    // display), ensure any previously focused input loses focus.
    document.addEventListener('mousedown', function blurOnCanvasClick(e) {
        var active = document.activeElement;
        if (!isEditableElement(active)) {
            return;
        }
        var target = e.target;
        if (target && target.closest && target.closest('input, textarea, select, label, [contenteditable]')) {
            return;
        }
        active.blur();
    }, true);

})();
