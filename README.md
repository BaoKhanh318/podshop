# MỰC. — Website bán hàng POD tùy chỉnh

Website tiếng Việt cho cửa hàng print-on-demand, xây dựng với React và Vite. Giao diện sử dụng xanh cốm, tím nhạt, font Be Vietnam Pro được đóng gói tại máy và hình sản phẩm SVG do dự án tự thiết kế.

## Chạy tại máy

Môi trường đã kiểm thử với Node.js 24.19.0. Vite yêu cầu Node.js 20.19+ hoặc 22.12+.

```bash
cd /workspace/podshop
npm ci
npm run dev -- --port 5173
```

Vite lắng nghe trên `0.0.0.0`. Dùng cổng do môi trường phát triển cung cấp để mở ứng dụng. Mỗi tác vụ đám mây đã có checkout riêng; sử dụng checkout hiện tại, không tạo Git worktree nếu chưa được yêu cầu.

## Tính năng

- Trang chủ, danh mục 8 sản phẩm mẫu: áo thun, tote, cốc, hoodie.
- Lọc danh mục, tìm kiếm không phân biệt dấu tiếng Việt và lưu sản phẩm yêu thích.
- Studio: chọn sản phẩm, màu, cỡ, mẫu in; thêm chữ hoặc tải ảnh PNG/JPG/WEBP tối đa 3 MB.
- Xem trước thiết kế trực tiếp, hỗ trợ chữ sáng trên sản phẩm màu tối.
- Giỏ hàng lưu trên trình duyệt; thiết kế khác nhau tạo biến thể riêng.
- Cập nhật số lượng, xóa sản phẩm, tính phí giao hàng 30.000đ và miễn phí từ 500.000đ.
- Form đặt đơn mẫu: kiểm tra thông tin, lưu đơn kèm thiết kế vào IndexedDB và tải bản JSON. Lưu tối đa 10 đơn gần nhất trên thiết bị.
- Form đăng ký email mẫu và các trang thông tin hiển thị trong hộp thoại.
- Giao diện đáp ứng màn hình di động; hỗ trợ bàn phím, Escape và giới hạn focus trong hộp thoại.

## Kiểm tra

```bash
npm test
npm run build
```

Kiểm thử trình duyệt cần một tiến trình `npm run dev` đang chạy và Chromium. Chromium đã có trong môi trường này.

```bash
npm run test:browser
# Có thể chỉ định trình duyệt, địa chỉ máy chủ và thư mục ảnh chụp:
BROWSER_PATH=/usr/bin/chromium TEST_URL=http://127.0.0.1:5173 SCREENSHOT_DIR=/tmp/podshop-shots npm run test:browser
```

Kiểm thử bao gồm tìm kiếm/lọc, yêu thích, thiết kế chữ và ảnh, lưu giỏ sau khi tải lại, phí vận chuyển, đặt đơn mẫu, tải JSON và bố cục 320–768px. Ảnh chụp được lưu ở `/tmp/podshop-shots` theo mặc định.

## Bản build

```bash
npm run build
npm run preview -- --port 4173
```

Thư mục `dist/` có thể đưa lên dịch vụ hosting tĩnh. Mã ứng dụng nằm trong `src/App.jsx`, phong cách trong `src/styles.css`, dữ liệu sản phẩm trong `src/data/products.js`; hình sản phẩm trong `src/components/ProductArt.jsx`.

## Phạm vi hiện tại

Đây là frontend chạy độc lập. Giá, mô tả sản phẩm và chính sách là dữ liệu mẫu. Đơn hàng và email chỉ lưu trên thiết bị; chưa gửi tới cửa hàng. Chưa có thanh toán, tài khoản, quản trị kho, dịch vụ in hoặc gửi email thực tế. Để bán hàng thật, cần kết nối backend và xác nhận chính sách bán hàng.

Dữ liệu thử nghiệm có thể xóa bằng chức năng xóa dữ liệu trang của trình duyệt.
