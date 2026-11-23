# Guacamole Extension: Disable Host IME

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Tiếng Việt](README.vi.md)

A lightweight, frontend-only [Apache Guacamole](https://guacamole.apache.org/) extension that prevents the host OS IME (such as pressing `Shift` on Windows to toggle Chinese/English) from activating during remote desktop sessions, so you can rely entirely on the **remote machine's** input method.

No custom Docker image build or Maven/JDK setup is required—just mount the packaged `.jar` file into the official `guacamole/guacamole` Docker image.

## How It Works

By default, Guacamole creates a hidden `<textarea>` (`Guacamole.InputSink`) and automatically focuses it on every keystroke so local IMEs and mobile virtual keyboards can compose text. Because focus stays inside an editable `<textarea>`, Windows keeps the host IME active, causing `Shift` and typing keys to toggle or pop up the host IME.

This extension:
1. Overrides `Guacamole.InputSink` before Guacamole initializes, replacing the hidden `<textarea>` with a non-editable placeholder `<div>`.
2. Lets `Guacamole.Keyboard` continue sending raw `keydown` / `keyup` events directly to the remote Windows/Linux machine.
3. Keeps all visible inputs (**login screen**, **sidebar clipboard**, **settings forms**) working normally with your host IME, and automatically blurs them when you click back onto the remote desktop or close the sidebar.
4. Automatically skips overriding `Guacamole.InputSink` on touch-only mobile/tablet devices (`(pointer: coarse) and (hover: none)`), so on-screen virtual keyboards continue to work normally.

## Build

No Java, Maven, or Docker build tools are needed—a frontend-only Guacamole extension `.jar` is simply a ZIP archive.

### Windows (PowerShell)
```powershell
.\build.ps1
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

The output file will be generated at `dist/guacamole-disable-host-ime.jar`.

## Deployment (Official Docker Image)

Set `GUACAMOLE_HOME=/etc/guacamole`, mount the `.jar` file into `/etc/guacamole/extensions/` in your `guacamole/guacamole` container, and recreate the container.

### Docker Compose
```yaml
services:
  guacamole:
    image: guacamole/guacamole:latest
    environment:
      - GUACAMOLE_HOME=/etc/guacamole
    volumes:
      - ./dist/guacamole-disable-host-ime.jar:/etc/guacamole/extensions/guacamole-disable-host-ime.jar:ro
```

### Docker Run
```bash
docker run --name guacamole \
  -e GUACAMOLE_HOME=/etc/guacamole \
  -v "$(pwd)/dist/guacamole-disable-host-ime.jar:/etc/guacamole/extensions/guacamole-disable-host-ime.jar:ro" \
  -p 8080:8080 \
  guacamole/guacamole:latest
```

> **Important:** Do **not** mount or copy the `.jar` directly into `/home/guacamole/.guacamole/extensions/`. On every startup, the official `guacamole/guacamole` image clears `/home/guacamole/.guacamole` and copies extensions from `GUACAMOLE_HOME` (`/etc/guacamole`).

After restarting, verify in container logs (`docker logs guacamole`) that the extension loaded:
```text
Extension "Disable Host IME" loaded.
```

> **Note:** Clear your browser cache or hard-refresh (`Ctrl+F5`) after installing the extension.

## Limitations

- **Remote IME only during desktop control:** Because host IME composition is disabled on the remote display, you must use the input method installed on the remote Windows/Linux machine.
- **OS-level global hotkeys:** System-wide shortcuts such as `Win + Space` (Windows keyboard layout switch) are intercepted by the host OS before reaching the browser and cannot be blocked by a web extension.
- **Touch-only mobile/tablet devices:** The extension automatically bypasses itself on touch-only devices (`(pointer: coarse) and (hover: none)`) to preserve the native on-screen virtual keyboard, meaning host IME blocking only applies to desktop/laptop browsers with a fine pointer.
