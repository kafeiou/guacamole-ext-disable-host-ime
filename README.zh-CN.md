# Guacamole 扩展：禁用宿主机输入法（Disable Host IME）

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文** | [日本語](README.ja.md) | [Tiếng Việt](README.vi.md)

这是一个轻量、纯前端的 [Apache Guacamole](https://guacamole.apache.org/) 扩展插件，用于防止在远程桌面操作时触发宿主机操作系统的输入法（例如在 Windows 上按 `Shift` 切换中/英文或弹出本地候选框），让你完全使用**远程主机**的输入法。

无需重新编译 Docker 镜像，也无需安装 Maven 或 JDK，只需将打包好的 `.jar` 挂载到官方原版 `guacamole/guacamole` 容器即可。

## 兼容性

已在 Apache Guacamole **1.5.5**、**1.6.0** 测试通过。

## 工作原理

Guacamole 默认会创建一个隐藏的 `<textarea>`（`Guacamole.InputSink`），并在每次按键时自动将焦点拉回该输入框，以支持本地输入法和移动设备虚拟键盘。由于焦点停留在可编辑的 `<textarea>` 上，Windows 会使宿主机 IME 保持激活状态，导致按 `Shift` 时切换宿主机中/英文输入法。

本扩展会：
1. 在 Guacamole 初始化前覆盖 `Guacamole.InputSink`，将隐藏 `<textarea>` 替换为不可编辑的 `<div>`。
2. 保留 `Guacamole.Keyboard` 对 `document` 的监听，将原始 `keydown` / `keyup` 按键直接发送到远程 Windows/Linux 主机。
3. 完整保留可见输入框（**登录页面**、**侧边栏剪贴板**、**设置表单**）的正常输入功能；当你点回远程桌面或关闭侧边栏时，自动取消输入框焦点，使宿主机 IME 立即退出激活状态。
4. 在纯触控移动设备／平板（`(pointer: coarse) and (hover: none)`）上会自动跳过覆盖，保留手机与平板原生的虚拟键盘功能。

## 打包方法

纯前端 Guacamole 扩展的 `.jar` 本质上就是 ZIP 压缩包，不需要安装 Java、Maven 或 Docker 编译环境。

### Windows（PowerShell）
```powershell
.\build.ps1
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

打包完成后会生成 `dist/guacamole-disable-host-ime.jar`。

## 部署方法（搭配官方 Docker 镜像）

设置环境变量 `GUACAMOLE_HOME=/etc/guacamole`，并将 `.jar` 挂载到 `guacamole/guacamole` 容器内的 `/etc/guacamole/extensions/` 目录，然后重建容器即可。

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

> **注意：** 请勿直接将 `.jar` 挂载或复制到 `/home/guacamole/.guacamole/extensions/`。官方 `guacamole/guacamole` 镜像每次启动都会先清空 `/home/guacamole/.guacamole`，再从 `GUACAMOLE_HOME`（`/etc/guacamole`）复制扩展。

重启后可通过 `docker logs guacamole` 确认扩展已加载：
```text
Extension "Disable Host IME" loaded.
```

> **提示：** 安装完成后，请清除浏览器缓存或强制刷新页面（`Ctrl+F5`）。

## 已知限制

- **远程操作时仅使用远程输入法**：远程画面不再接收宿主机 IME 组合输入，请使用远程 Windows/Linux 内的输入法。
- **系统级全局快捷键**：例如 Windows 的 `Win + Space`（切换系统键盘布局）由操作系统底层直接拦截，网页扩展无法阻止。
- **纯触控手机／平板设备**：为保留原生屏幕虚拟键盘，扩展在检测到纯触控设备（`(pointer: coarse) and (hover: none)`）时会自动跳过禁用逻辑，宿主机 IME 禁用仅适用于配备鼠标／触控板的桌面和笔记本浏览器。
