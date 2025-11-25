const { convertDate } = require("./lunar");

/**
 * Hàm tính lá số cơ bản.
 * Hiện tại bước 1 chỉ bao gồm phần chuyển đổi âm/dương (đang dùng ở frontend),
 * trả về dữ liệu convertDate để frontend/render có thể dùng.
 * Các bước tiếp theo có thể mở rộng thêm an sao, cục... và trả về JSON đầy đủ.
 */
function tinhLaSo(body = {}) {
  // Tái sử dụng hàm convertDate sẵn có (đã xử lý giờ Tý, can/chi, mệnh).
  const conv = convertDate(body);

  return {
    convert: conv,
    note: "Bước 1: backend tính chuyển đổi âm/dương. Có thể mở rộng thêm an sao/cung ở các bước sau."
  };
}

module.exports = {
  tinhLaSo
};
