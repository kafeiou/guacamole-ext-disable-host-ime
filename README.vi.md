# Tiện ích mở rộng Guacamole: Tắt bộ gõ máy chủ (Disable Host IME)

[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | **Tiếng Việt**

Đây là tiện ích mở rộng nhẹ, chỉ chạy ở phía frontend dành cho [Apache Guacamole](https://guacamole.apache.org/), giúp ngăn bộ gõ (IME) của máy chủ cục bộ (ví dụ: nhấn `Shift` trên Windows để chuyển đổi chế độ gõ hoặc hiện cửa sổ gõ chữ) bị kích hoạt khi thao tác màn hình từ xa, cho phép bạn sử dụng hoàn toàn bộ gõ trên **máy từ xa**.

Không cần tự build lại Docker image hay cài đặt Maven / JDK—chỉ cần mount tệp `.jar` đã đóng gói vào Docker image chính thức `guacamole/guacamole`.

## Cách hoạt động

Mặc định, Guacamole tạo một thẻ `<textarea>` ẩn (`Guacamole.InputSink`) và tự động focus vào đó mỗi khi bạn nhấn phím để hỗ trợ bộ gõ cục bộ và bàn phím ảo trên di động. Vì focus nằm trong một `<textarea>` có thể chỉnh sửa, Windows giữ cho IME cục bộ ở trạng thái hoạt động, khiến việc nhấn `Shift` làm chuyển đổi bộ gõ trên máy chủ cục bộ.

Tiện ích mở rộng này sẽ:
1. Ghi đè `Guacamole.InputSink` trước khi Guacamole khởi tạo, thay thế `<textarea>` ẩn bằng một thẻ `<div>` không thể chỉnh sửa.
2. Giữ nguyên `Guacamole.Keyboard` lắng nghe sự kiện `keydown` / `keyup` gốc trên `document` và gửi thẳng tới máy Windows/Linux từ xa.
3. Giữ cho mọi ô nhập liệu hiển thị (**trang đăng nhập**, **clipboard ở thanh bên**, **biểu mẫu cài đặt**) hoạt động bình thường với bộ gõ cục bộ, đồng thời tự động bỏ focus khi bạn nhấp lại vào màn hình từ xa hoặc đóng thanh bên.

## Đóng gói (Build)

Tệp `.jar` của tiện ích mở rộng frontend Guacamole thực chất chỉ là tệp nén ZIP, không cần cài Java, Maven hay Docker để đóng gói.

### Windows (PowerShell)
```powershell
.\build.ps1
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

Tệp đầu ra sẽ được tạo tại `dist/guacamole-disable-host-ime.jar`.

## Triển khai (với Docker Image chính thức)

Đặt biến môi trường `GUACAMOLE_HOME=/etc/guacamole`, mount tệp `.jar` vào thư mục `/etc/guacamole/extensions/` trong container `guacamole/guacamole`, sau đó tạo lại container.

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

> **Quan trọng:** **Không** mount hoặc sao chép tệp `.jar` trực tiếp vào `/home/guacamole/.guacamole/extensions/`. Mỗi lần khởi động, image chính thức `guacamole/guacamole` sẽ xóa sạch `/home/guacamole/.guacamole` và sao chép tiện ích từ `GUACAMOLE_HOME` (`/etc/guacamole`).

Sau khi khởi động lại, kiểm tra log (`docker logs guacamole`) để xác nhận tiện ích đã được tải:
```text
Extension "Disable Host IME" loaded.
```

> **Lưu ý:** Hãy xóa bộ nhớ đệm trình duyệt hoặc tải lại trang (`Ctrl+F5`) sau khi cài đặt.

## Giới hạn

- **Chỉ dùng bộ gõ của máy từ xa khi điều khiển màn hình:** Vì bộ gõ cục bộ bị tắt trên màn hình từ xa, bạn cần sử dụng bộ gõ được cài trên máy Windows/Linux từ xa.
- **Phím tắt toàn cục của hệ điều hành:** Các phím tắt hệ thống như `Win + Space` (chuyển đổi bố cục bàn phím trên Windows) bị hệ điều hành xử lý trước khi tới trình duyệt nên tiện ích web không thể chặn.
- **Bàn phím ảo trên di động:** Việc tắt `InputSink` sẽ khiến trình duyệt trên điện thoại/máy tính bảng không tự động mở bàn phím ảo.
