#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/src"
DIST_DIR="${SCRIPT_DIR}/dist"
OUTPUT_JAR="${DIST_DIR}/guacamole-disable-host-ime.jar"

mkdir -p "${DIST_DIR}"
rm -f "${OUTPUT_JAR}"

(
    cd "${SRC_DIR}"
    if command -v zip >/dev/null 2>&1; then
        zip -r "${OUTPUT_JAR}" .
    elif command -v jar >/dev/null 2>&1; then
        jar cf "${OUTPUT_JAR}" .
    else
        echo "Error: neither 'zip' nor 'jar' was found in PATH." >&2
        exit 1
    fi
)

echo "Built: ${OUTPUT_JAR}"
