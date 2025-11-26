const API_BASE = "https://tuvi-backend-d5gx.onrender.com";

function apiFetch(path, options = {}) {
  return fetch(API_BASE + path, { credentials: "include", ...options });
}

function collectInput() {
  const getVal = (id) => document.getElementById(id)?.value;
  const name = getVal("name") || "Người dùng";
  const gender = getVal("gender") || "Nam";
  const type = getVal("calendarType") || "solar";
  const day = Number(getVal("day"));
  const monthVal = getVal("month");
  const year = Number(getVal("year"));
  const hour = Number(getVal("gio"));
  let month = Number(monthVal);
  let isLeap = false;
  if (String(monthVal).includes("_nhuan")) {
    month = parseInt(monthVal, 10);
    isLeap = true;
  }
  const luuNam = Number(document.getElementById("luuNam")?.value);
  const luuThang = Number(document.getElementById("luuThang")?.value);
  const luuNgay = Number(document.getElementById("luuNgay")?.value);
  return {
    payload: { type, day, month, year, hour, gender, name, isLeap },
    luuHan: {
      nam: luuNam || undefined,
      thang: luuThang || undefined,
      ngay: luuNgay || undefined
    }
  };
}

function renderResult(data) {
  const box = document.getElementById("backendResult") || (() => {
    const div = document.createElement("div");
    div.id = "backendResult";
    div.style.margin = "12px";
    div.style.padding = "12px";
    div.style.border = "1px solid #ccc";
    div.style.fontFamily = "monospace";
    document.body.prepend(div);
    return div;
  })();
  box.innerHTML = "<h3>Kết quả backend (JSON)</h3>";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(data, null, 2);
  box.appendChild(pre);

  renderChart(data);
}

async function handleConvert() {
  const { payload, luuHan } = collectInput();
  try {
    const res = await apiFetch("/api/laso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, luuHan }),
      cache: "no-cache"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderResult(json);
  } catch (err) {
    alert("Không gọi được backend: " + err.message);
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("convert");
  if (btn) btn.addEventListener("click", (e) => {
    e.preventDefault();
    handleConvert();
  });

  // Banner thông báo
  const banner = document.createElement("div");
  banner.textContent = "UI đang tạm tối giản, mọi tính toán thực hiện ở backend. Nhấn \"Chuyển đổi\" để lấy JSON.";
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    padding: "10px",
    background: "#2b4c7e",
    color: "white",
    textAlign: "center",
    fontSize: "14px",
    zIndex: "100000"
  });
  document.body.prepend(banner);
});

// --------- Render lá số đơn giản từ JSON backend ----------
function renderChart(data) {
  const container = document.getElementById("lasoContainer");
  if (!container) return;

  // Map cung -> vị trí grid theo bố cục cũ (cell1..12)
  const pos = [
    "Tỵ", "Ngọ", "Mùi", "Thân",
    "Thìn", "Dậu", "Mão", "Tuất",
    "Dần", "Sửu", "Tý", "Hợi"
  ];

  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(4, 1fr)";
  container.style.gap = "6px";

  // Thông tin trung tâm
  const metaBox = document.createElement("div");
  metaBox.style.gridColumn = "span 4";
  metaBox.style.border = "1px solid #ccc";
  metaBox.style.padding = "8px";
  metaBox.style.background = "#f6f7fb";
  metaBox.innerHTML = `
    <div style="font-weight:bold;">LÁ SỐ TỬ VI</div>
    <div><b>Họ tên:</b> ${data?.meta?.input?.name || "Người dùng"}</div>
    <div><b>Giới tính:</b> ${data?.meta?.input?.gender || ""}</div>
    <div><b>Cục số:</b> ${data?.meta?.cucSo || ""}</div>
    <div><b>Can Chi:</b> ${data?.meta?.canChi?.year || ""} • ${data?.meta?.canChi?.month || ""} • ${data?.meta?.canChi?.day || ""} • ${data?.meta?.canChi?.hour || ""}</div>
  `;
  container.appendChild(metaBox);

  const cungStars = data?.cungStars || {};

  pos.forEach((cung) => {
    const box = document.createElement("div");
    box.style.border = "1px solid #999";
    box.style.padding = "6px";
    box.style.minHeight = "180px";
    box.style.background = "#fff";

    const title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    title.textContent = cung;
    box.appendChild(title);

    const groups = [
      { key: "chinh", label: "Chính" },
      { key: "trung", label: "Trung" },
      { key: "tieu", label: "Tiểu" },
      { key: "luu", label: "Lưu" }
    ];
    groups.forEach(g => {
      const list = cungStars[cung]?.[g.key] || [];
      if (!list.length) return;
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "4px";
      wrap.innerHTML = `<div style="font-weight:600;font-size:12px;">${g.label}</div>`;
      list.forEach(item => {
        const name = typeof item === "string" ? item : (item?.name || "");
        const prefix = item?.prefix ? item.prefix + ". " : "";
        const loai = item?.loai === "hung" ? "🔴" : "🟢";
        const div = document.createElement("div");
        div.style.fontSize = "12px";
        div.textContent = `${loai} ${prefix}${name}`;
        wrap.appendChild(div);
      });
      box.appendChild(wrap);
    });

    container.appendChild(box);
  });
}
