document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.textContent = "Ứng dụng đang chuyển toàn bộ công thức sang backend. Chức năng có thể tạm dừng để tránh lộ mã nguồn.";
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    padding: "12px",
    background: "#2b4c7e",
    color: "white",
    textAlign: "center",
    fontSize: "14px",
    zIndex: "100000"
  });
  document.body.prepend(banner);
  console.log("Frontend đang ở chế độ render-only; toàn bộ tính toán được chuyển sang backend.");
});
