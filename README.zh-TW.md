# Guacamole 擴充套件：停用宿主機輸入法（Disable Host IME）

[English](README.md) | **繁體中文** | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Tiếng Việt](README.vi.md)

這是一個輕量、純前端的 [Apache Guacamole](https://guacamole.apache.org/) 擴充套件，用來防止在遠端桌面操作時觸發宿主機作業系統的輸入法（例如在 Windows 按 `Shift` 切換中/英文或跳出本地組字視窗），讓你完全改用**遠端主機**的輸入法。

不需要自行重新編譯 Docker Image，也不需要安裝 Maven 或 JDK，只要把打包好的 `.jar` 掛載到官方原版 `guacamole/guacamole` 容器即可使用。

## 運作原理

Guacamole 預設會建立一個隱藏的 `<textarea>`（`Guacamole.InputSink`），並在每次按鍵時自動將焦點拉回該輸入框，以便支援本地輸入法與行動裝置虛擬鍵盤。由於焦點停留在可編輯的 `<textarea>` 上，Windows 會讓宿主機 IME 保持啟用，導致按 `Shift` 時切換宿主機中/英輸入法。

本擴充套件會：
1. 在 Guacamole 啟動前覆寫 `Guacamole.InputSink`，將隱藏 `<textarea>` 替換為不可編輯的 `<div>`。
2. 保留 `Guacamole.Keyboard` 對 `document` 的監聽，直接將原始 `keydown` / `keyup` 按鍵傳送至遠端 Windows/Linux 主機。
3. 完整保留可見輸入框（**登入畫面**、**側邊欄剪貼簿**、**設定表單**）的正常輸入功能；當你點回遠端桌面畫面或關閉側邊欄時，自動解除輸入框焦點，讓宿主機 IME 立即停用。

## 打包方式

純前端 Guacamole 擴充套件的 `.jar` 本質上是 ZIP 壓縮檔，不需要安裝 Java、Maven 或 Docker 編譯環境。

### Windows（PowerShell）
```powershell
.\build.ps1
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

打包完成後會產生 `dist/guacamole-disable-host-ime.jar`。

## 部署方式（搭配官方 Docker Image）

將 `.jar` 掛載到 `guacamole/guacamole` 容器內的 `/etc/guacamole/extensions/` 目錄並重啟容器即可。

### Docker Compose
```yaml
services:
  guacamole:
    image: guacamole/guacamole:latest
    volumes:
      - ./dist/guacamole-disable-host-ime.jar:/etc/guacamole/extensions/guacamole-disable-host-ime.jar:ro
```

### Docker Run
```bash
docker run --name guacamole \
  -v "$(pwd)/dist/guacamole-disable-host-ime.jar:/etc/guacamole/extensions/guacamole-disable-host-ime.jar:ro" \
  -p 8080:8080 \
  guacamole/guacamole:latest
```

重啟後可用 `docker logs guacamole` 確認已成功載入：
```text
Extension "Disable Host IME" loaded.
```

> **提示：** 安裝完成後，請清除瀏覽器快取或強制重新整理（`Ctrl+F5`）。

## 已知限制

- **遠端操作時僅能使用遠端輸入法**：遠端畫面不再接受宿主機 IME 組字，請切換使用遠端 Windows/Linux 內的輸入法。
- **作業系統全域熱鍵**：例如 Windows 的 `Win + Space`（切換系統語系鍵盤配置）屬於作業系統最底層攔截，網頁擴充套件無法阻擋。
- **行動裝置虛擬鍵盤**：停用 `InputSink` 後，手機或平板瀏覽器將無法自動彈出虛擬鍵盤。
