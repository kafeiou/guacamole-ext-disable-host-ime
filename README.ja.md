# Guacamole 拡張機能：ホスト側 IME 無効化（Disable Host IME）

[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | **日本語** | [Tiếng Việt](README.vi.md)

[Apache Guacamole](https://guacamole.apache.org/) 向けの軽量なフロントエンド専用拡張機能です。リモートデスクトップ操作中にホスト OS の IME（Windows で `Shift` キーを押した際の入力モード切替や変換候補ウィンドウの表示など）が起動しないようにし、**リモートマシン側**の IME のみを使用できるようにします。

Docker イメージの再ビルドや Maven / JDK のインストールは不要です。パッケージ化した `.jar` を公式の `guacamole/guacamole` Docker イメージにマウントするだけで動作します。

## 仕組み

デフォルトでは、Guacamole は非表示の `<textarea>`（`Guacamole.InputSink`）を作成し、キー入力のたびに自動でフォーカスを戻します。フォーカスが編集可能な `<textarea>` にあるため、Windows のホスト側 IME が有効になり、`Shift` キーなどでホスト側の入力モードが切り替わってしまいます。

この拡張機能では以下の処理を行います：
1. Guacamole の初期化前に `Guacamole.InputSink` を上書きし、非表示 `<textarea>` を編集不可の `<div>` に置き換えます。
2. `Guacamole.Keyboard` による `document` のキー監視は維持し、生の `keydown` / `keyup` イベントをそのままリモート Windows / Linux へ送信します。
3. 表示されている入力欄（**ログイン画面**、**サイドバーのクリップボード**、**設定フォーム**）ではホスト側 IME を通常どおり使用でき、リモート画面をクリックするかサイドバーを閉じると自動的にフォーカスを外してホスト側 IME を無効化します。
4. タッチ操作のみのモバイル／タブレット端末（`(pointer: coarse) and (hover: none)`）では自動的に上書きをスキップし、標準のソフトウェアキーボードがそのまま使えるようにします。

## ビルド方法

フロントエンドのみの Guacamole 拡張機能 `.jar` は実質 ZIP アーカイブのため、Java や Maven は不要です。

### Windows（PowerShell）
```powershell
.\build.ps1
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

実行後、`dist/guacamole-disable-host-ime.jar` が生成されます。

## デプロイ方法（公式 Docker イメージ）

環境変数 `GUACAMOLE_HOME=/etc/guacamole` を設定し、`.jar` ファイルを `guacamole/guacamole` コンテナの `/etc/guacamole/extensions/` にマウントしてコンテナを再作成してください。

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

> **重要：** `.jar` ファイルを `/home/guacamole/.guacamole/extensions/` へ直接マウントまたはコピーしないでください。公式 `guacamole/guacamole` イメージは起動時に `/home/guacamole/.guacamole` を一度削除・再作成し、`GUACAMOLE_HOME`（`/etc/guacamole`）から拡張機能をコピーします。

再起動後、`docker logs guacamole` で拡張機能が読み込まれたことを確認できます：
```text
Extension "Disable Host IME" loaded.
```

> **注意：** 導入後はブラウザのキャッシュをクリアするか、スーパーリロード（`Ctrl+F5`）を行ってください。

## 制限事項

- **リモート操作時はリモート側 IME のみ使用可能**：リモート画面ではホスト側 IME の変換入力が無効になるため、接続先 Windows / Linux 内の IME を使用してください。
- **OS レベルのグローバルショートカット**：Windows の `Win + Space`（キーボードレイアウト切替）など、ブラウザに届く前に OS が処理するキーはブロックできません。
- **タッチ専用のモバイル／タブレット端末**：標準のソフトウェアキーボードを維持するため、タッチ専用端末（`(pointer: coarse) and (hover: none)`）では拡張機能が自動的にバイパスされます。ホスト側 IME 無効化はマウス／トラックパッドを備えた PC ブラウザでのみ有効になります。
