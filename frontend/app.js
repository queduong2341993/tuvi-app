const API_BASE = 'https://tuvi-backend-d5gx.onrender.com';
const apiFetch = (path, options = {}) => fetch(API_BASE + path, { credentials: 'include', ...options });

// =====================================================
// 🕵️‍♂️ DEBUG: Theo dõi mọi thay đổi giá trị Cục Số
// -----------------------------------------------------
Object.defineProperty(window, "debugCucSo", {
  set(value) {
    console.groupCollapsed("⚠️ CUC_SO bị gán mới:", value);
    console.trace("Nguồn gốc thay đổi:");
    console.groupEnd();

    // Ghi ngược lại vào data chính (nếu tồn tại)
    if (window.DEBUG_DATA_CUC) {
      window.DEBUG_DATA_CUC.cucSo = value;
    }
  },
  get() {
    return window.DEBUG_DATA_CUC?.cucSo;
  }
});


// ======================================================
// 🗺️ BẢN ĐỒ CUNG CHUẨN TOÀN CỤC (layout NGHỊCH)
// ======================================================
window.mapCung = {
  "Dần": 9, "Mão": 7, "Thìn": 5, "Tỵ": 1, "Ngọ": 2, "Mùi": 3,
  "Thân": 4, "Dậu": 6, "Tuất": 8, "Hợi": 12, "Tý": 11, "Sửu": 10
};
const mapCung = window.mapCung; // để dùng ngắn gọn

// ======================================================
// 🗺️ TAM HỢP + ĐỐI CUNG (chuẩn layout NGHỊCH của bạn)
// ======================================================
const TAM_HOP_THEO_TEN = {
  "Tỵ": ["Sửu", "Dậu"],
  "Ngọ": ["Dần", "Tuất"],
  "Mùi": ["Mão", "Hợi"],
  "Thân": ["Tý", "Thìn"],
  "Dậu": ["Tỵ", "Sửu"],
  "Tuất": ["Ngọ", "Dần"],
  "Hợi": ["Mùi", "Mão"],
  "Tý": ["Thân", "Thìn"],
  "Sửu": ["Tỵ", "Dậu"],
  "Dần": ["Ngọ", "Tuất"],
  "Mão": ["Hợi", "Mùi"],
  "Thìn": ["Tý", "Thân"]
};

const DOI_CUNG_THEO_TEN = {
  "Tỵ": "Hợi", "Ngọ": "Tý", "Mùi": "Sửu", "Thân": "Dần",
  "Dậu": "Mão", "Tuất": "Thìn", "Hợi": "Tỵ", "Tý": "Ngọ",
  "Sửu": "Mùi", "Dần": "Thân", "Mão": "Dậu", "Thìn": "Tuất"
};

// 🔁 Sinh TAM_HOP và DOI_CUNG toàn cục
window.TAM_HOP = {};
window.DOI_CUNG = {};

Object.entries(TAM_HOP_THEO_TEN).forEach(([ten, ds]) => {
  const id = mapCung[ten];
  const hop = ds.map(t => mapCung[t]);
  const doi = mapCung[DOI_CUNG_THEO_TEN[ten]];
  window.TAM_HOP[id] = [...hop, doi];
});

Object.entries(DOI_CUNG_THEO_TEN).forEach(([ten, doiTen]) => {
  const id1 = mapCung[ten];
  const id2 = mapCung[doiTen];
  window.DOI_CUNG[id1] = id2;
});













// =====================================================
// 🧩 Tạo database nếu chưa có (ép onupgradeneeded chạy 1 lần)
// =====================================================
(function initDB() {
  const req = indexedDB.open("TuViDB", 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("🆕 Đã tạo store 'jsonStore' (initDB chạy lần đầu)");
    }
  };
  req.onsuccess = () => console.log("✅ IndexedDB sẵn sàng");
  req.onerror = e => console.warn("⚠️ Lỗi khởi tạo DB:", e);
})();

// =====================================================
// 🧱 PHẦN 1: KHỞI TẠO LÁ SỐ TRẮNG (TỐI ƯU AN TOÀN, KHÔNG ĐỔI CẤU TRÚC)
// =====================================================
window.saoToCung = {}; // 🪐 Lưu vị trí sao chính tinh toàn cục cho các lớp sau

function taoLaSoTrang(data) {
  window.dataGlobal = data;
  if (!data.thangAm && Array.isArray(data.lunar)) {
    data.thangAm = data.lunar[1];
    window.dataGlobal.thangAm = data.lunar[1];
  }
// 🌙 Bổ sung: đảm bảo luôn có tháng âm sinh (chỉ lấy từ lịch âm)
if (!window.dataGlobal.thangAm) {
  if (Array.isArray(data.lunar)) {
    // Nếu lunar là mảng [ngày, tháng, năm]
    window.dataGlobal.thangAm = data.lunar[1];
  } else if (data.lunar && typeof data.lunar === "object" && data.lunar.thang) {
    // Nếu lunar là object {ngay, thang, nam}
    window.dataGlobal.thangAm = data.lunar.thang;
  } else if (data.thangSinh) {
    // Nếu có biến thangSinh (đã là âm)
    window.dataGlobal.thangAm = data.thangSinh;
  } else {
    console.warn("⚠️ Không có dữ liệu tháng âm sinh, chưa thể an sao TheoThangSinh!");
  }
  console.log("🌙 Tháng âm sinh:", window.dataGlobal.thangAm);
}


  const container = document.getElementById("lasoContainer");
  if (!container) return;

  // ⚡ Ẩn container trong lúc render để giảm reflow
  const oldDisplay = container.style.display;
  container.style.display = "none";
  container.innerHTML = "";

  // ==============================
  // 🔹 Tạo 12 ô cung cơ bản
  // ==============================
  const frag = document.createDocumentFragment();
  const layerNames = [
    "vitri","menh","chinhtinh","cucso","nguhanh",
    "trungtinh","tieutinh","trangSinh","luuDaiVan","luuTieuVan"
  ];

  for (let i = 1; i <= 12; i++) {
    const cell = document.createElement("div");
    cell.id = "cell" + i;
    cell.className = "cung";
    cell.style.position = "relative";

    for (let j = 0; j < layerNames.length; j++) {
      const name = layerNames[j];
      const div = document.createElement("div");
      div.className = `layer layer-${j + 1} ${name}`;
      if (name === "trangSinh") {
        div.classList.add("layer-8");
        div.style.zIndex = "60";
        const inner = document.createElement("div");
        inner.className = "layer8-div";
        div.appendChild(inner);
      }
      if (name === "trungtinh") {
        const hung = document.createElement("div");
        hung.className = "hung-tinh";
        const cat = document.createElement("div");
        cat.className = "cat-tinh";
        div.appendChild(hung);
        div.appendChild(cat);
      }
      cell.appendChild(div);
    }

    frag.appendChild(cell);
  }

  container.appendChild(frag);

  // ==============================
  // 🔹 Ô trung tâm
  // ==============================
  const { name, gender, menh, canChiNam, canChiThang, canChiNgay, canChiGio, lunar } = data;
  const center = document.createElement("div");
  center.id = "centerCell";
  center.innerHTML = `
    <div class="title">LÁ SỐ TỬ VI<br><span style="font-size:16px;font-style:italic;color:#c44;">An lá số tại tuvitoanthu.com</span></div>
<div id="showCatHungToggle">
  <label>
    <input type="checkbox" id="toggleCatHung" />
    Định Cát Hung - Cách cục
  </label>
</div>

    <div class="info-line"><b>Họ và tên:</b> ${name}</div>
    <div class="info-line"><b>Giới tính:</b> ${gender}</div>
    <div class="info-line"><b>Mệnh:</b> ${menh}</div>
   <div class="info-line">
  <b>Cục số:</b>
  <span id="cucSoText">(đang xác định...)</span>
</div>

    <div class="info-line">
      <b>Năm:</b> ${lunar[2]} &nbsp;|&nbsp;
      <b>Tháng:</b> ${lunar[1]} &nbsp;|&nbsp;
      <b>Ngày:</b> ${lunar[0]} &nbsp;|&nbsp;
      <b>Giờ:</b> ${canChiGio.split(" ")[1]}
    </div>
    <div class="sub-info">${canChiNam} • ${canChiThang} • ${canChiNgay} • ${canChiGio}</div>
  `;
  container.appendChild(center);
// Tick mặc định khi load lá số
const chk = document.getElementById("toggleCatHung");
if (chk) chk.checked = true;

  // ==============================
  // 🔹 Cache nhanh danh sách cung
  // ==============================
  window.cungNodes = Array.from(container.querySelectorAll(".cung"));

  // ==============================
  // 🔹 Bật hiển thị lại sau khi render xong
  // ==============================
  container.style.display = oldDisplay || "grid";

  // ==============================
  // 🔹 Gắn sự kiện tính tuổi & toggle lưu vận
  // ==============================
  ["luuNam","luuThang","luuNgay"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener("input",capNhatHan);
  });

  const btn=document.getElementById("btnToggleLuuVan");
  if(btn) btn.addEventListener("click",()=>{
    document.querySelectorAll(".layer-9,.layer-10").forEach(e=>{
      e.style.display = (e.style.display==="none" ? "" : "none");
    });
  });
}






// =====================================================
// 🪄 PHẦN 2: KHAI BÁO GIỜ ĐỊA CHI (KHÔNG GẮN VÀO DROPDOWN NỮA)
// =====================================================

// Giữ lại mảng ZHOURS để các hàm khác có thể dùng
const ZHOURS = [
  { label: "Tý (00:00–00:59)", value: "0" },
  { label: "Sửu (01:00–02:59)", value: "1" },
  { label: "Dần (03:00–04:59)", value: "3" },
  { label: "Mão (05:00–06:59)", value: "5" },
  { label: "Thìn (07:00–08:59)", value: "7" },
  { label: "Tỵ (09:00–10:59)", value: "9" },
  { label: "Ngọ (11:00–12:59)", value: "11" },
  { label: "Mùi (13:00–14:59)", value: "13" },
  { label: "Thân (15:00–16:59)", value: "15" },
  { label: "Dậu (17:00–18:59)", value: "17" },
  { label: "Tuất (19:00–20:59)", value: "19" },
  { label: "Hợi (21:00–22:59)", value: "21" },
  { label: "Tý (23:00–23:59)", value: "23" }
];


// =====================================================
// 🗓️ Hàm lấy ngày âm theo giờ - Dựa vào bảng đã tính sẵn
// =====================================================

function layNgayAmTheoGio(solarDay, solarMonth, solarYear, hour, bangAm) {
  const ngayObj = (
    bangAm?.[solarYear]?.[solarMonth]?.[solarDay] ||
    { dAm: 1, mAm: 1, yAm: solarYear }
  );

  let dAm = ngayObj.dAm;
  let mAm = ngayObj.mAm;
  let yAm = ngayObj.yAm;

  // ⚙️ Điều chỉnh theo Giờ Tý
  if (hour === 23) {
    // ✅ Nếu đã từng xử lý Giờ Tý (khi lưu), không cộng thêm
    if (window.dataGlobal?.daXuLyGioTy) {
      console.log("🕛 Giờ Tý đã được xử lý khi lưu — bỏ qua cộng ngày âm.");
      return [dAm, mAm, yAm];
    }

    console.log("🕛 Giờ Tý sau – tăng 1 ngày Âm lịch");
    return congNgayAm(dAm, mAm, yAm, bangAm); // Tý sau → qua ngày
  }

  if (hour === 0) {
    console.log("🕐 Giờ Tý đầu – giữ nguyên ngày Âm lịch");
    return [dAm, mAm, yAm];
  }

  return [dAm, mAm, yAm]; // Giờ khác → giữ nguyên
}

// 🔧 Cộng thêm 1 ngày Âm lịch
function congNgayAm(dAm, mAm, yAm, bangAm) {
  for (let y in bangAm) {
    for (let m in bangAm[y]) {
      for (let d in bangAm[y][m]) {
        const cell = bangAm[y][m][d];
        if (cell.dAm === dAm && cell.mAm === mAm && cell.yAm === yAm) {
          const nextD = Number(d) + 1;
          const nextM = Number(m);
          const nextY = Number(y);

          if (bangAm[nextY]?.[nextM]?.[nextD]) {
            const next = bangAm[nextY][nextM][nextD];
            return [next.dAm, next.mAm, next.yAm];
          } else {
            const m2 = nextM + 1 > 12 ? 1 : nextM + 1;
            const y2 = nextM + 1 > 12 ? nextY + 1 : nextY;
            const next = bangAm[y2]?.[m2]?.[1];
            if (next) return [next.dAm, next.mAm, next.yAm];
          }
        }
      }
    }
  }
  return [dAm, mAm, yAm];
}








// =====================================================
// 🗓️ KHỞI TẠO NGÀY / THÁNG / NĂM
// =====================================================
function populateSelectors() {
  const dSel = document.getElementById("day");
  const mSel = document.getElementById("month");
  const ySel = document.getElementById("year");

  // Ngày
  for (let d = 1; d <= 31; d++) {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    if (d === 20) o.selected = true;
    dSel.appendChild(o);
  }

  // Tháng
  for (let m = 1; m <= 12; m++) {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = "Tháng " + m;
    if (m === 12) o.selected = true;
    mSel.appendChild(o);
  }

  // Năm
  for (let y = 1900; y <= 2100; y++) {
    const o = document.createElement("option");
    o.value = y;
    o.textContent = y;
    if (y === 2025) o.selected = true;
    ySel.appendChild(o);
  }
 }

/* =====================================================
   🧮 PHẦN 3: THUẬT TOÁN HỒ NGỌC ĐỨC
   -----------------------------------------------------
   Gồm các hàm lõi:
   - Tính ngày Julius
   - Tính ngày Sóc (New Moon)
   - Tính tháng nhuận
   - Chuyển đổi Âm ⇆ Dương
   ===================================================== */

// -------------------------------
// 🔹 BẢNG THIÊN CAN – ĐỊA CHI
// -------------------------------
const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const TZ = 7; // Múi giờ Việt Nam (UTC+7)

// -------------------------------
// 🔹 TÍNH NGÀY JULIUS
// -------------------------------
function jdFromDate(dd, mm, yy) {
  // Đổi ngày dương sang số Julius
  let a = Math.floor((14 - mm) / 12);
  let y = yy + 4800 - a;
  let m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y +
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161)
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function jdToDate(jd) {
  // Đổi số Julius về ngày dương
  let Z = Math.floor(jd + 0.5), A = Z;
  if (Z >= 2299161) {
    let alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  let B = A + 1524;
  let C = Math.floor((B - 122.1) / 365.25);
  let D = Math.floor(365.25 * C);
  let E = Math.floor((B - D) / 30.6001);
  let dd = Math.floor(B - D - Math.floor(30.6001 * E));
  let mm = (E < 14) ? E - 1 : E - 13;
  let yy = (mm > 2) ? C - 4716 : C - 4715;
  return [dd, mm, yy];
}

// -------------------------------
// 🌑 TÍNH NGÀY SÓC (NEW MOON)
// -------------------------------
function NewMoon(k) {
  // Trả về số Julius của kỳ Sóc thứ k kể từ 1/1/1900
  let T = k / 1236.85, T2 = T*T, T3 = T2*T, dr = Math.PI/180;
  let Jd1 = 2415020.75933 + 29.53058868*k + 0.0001178*T2 - 0.000000155*T3;
  Jd1 += 0.00033*Math.sin((166.56 + 132.87*T - 0.009173*T2)*dr);
  let M = 359.2242 + 29.10535608*k - 0.0000333*T2 - 0.00000347*T3;
  let Mpr = 306.0253 + 385.81691806*k + 0.0107306*T2 + 0.00001236*T3;
  let F = 21.2964 + 390.67050646*k - 0.0016528*T2 - 0.00000239*T3;
  let C1 = (0.1734 - 0.000393*T)*Math.sin(M*dr)
          + 0.0021*Math.sin(2*M*dr)
          - 0.4068*Math.sin(Mpr*dr)
          + 0.0161*Math.sin(2*Mpr*dr)
          + 0.0104*Math.sin(2*F*dr)
          - 0.0051*Math.sin((M+Mpr)*dr)
          - 0.0074*Math.sin((M-Mpr)*dr)
          + 0.0004*Math.sin((2*F+M)*dr)
          - 0.0004*Math.sin((2*F-M)*dr)
          - 0.0006*Math.sin((2*F+Mpr)*dr)
          + 0.0010*Math.sin((2*F-Mpr)*dr)
          + 0.0005*Math.sin((2*Mpr+M)*dr);
  let deltat = (T < -11)
    ? 0.001 + 0.000839*T + 0.0002261*T*T - 0.00000845*T*T*T - 0.000000081*T*T*T*T
    : -0.000278 + 0.000265*T + 0.000262*T*T;
  return Jd1 + C1 - deltat;
}

// -------------------------------
// ☀️ VỊ TRÍ MẶT TRỜI
// -------------------------------
function getNewMoonDay(k, tz) { return Math.floor(NewMoon(k) + 0.5 + tz/24); }
function SunLongitude(jdn) {
  let T = (jdn - 2451545.5)/36525, dr = Math.PI/180;
  let M = 357.52910 + 35999.05030*T - 0.0001559*T*T - 0.00000048*T*T*T;
  let L0 = 280.46645 + 36000.76983*T + 0.0003032*T*T;
  let DL = (1.914600 - 0.004817*T - 0.000014*T*T)*Math.sin(dr*M)
          + (0.019993 - 0.000101*T)*Math.sin(2*dr*M)
          + 0.000290*Math.sin(3*dr*M);
  let L = (L0 + DL)*dr;
  L = L - 2*Math.PI*Math.floor(L/(2*Math.PI));
  return L;
}
function getSunLongitude(jdn, tz) {
  return Math.floor(SunLongitude(jdn - tz/24) / (Math.PI / 6));
}

// -------------------------------
// 🌙 XÁC ĐỊNH THÁNG ÂM VÀ THÁNG NHUẬN
// -------------------------------
function getLunarMonth11(yy, tz) {
  let off = jdFromDate(31, 12, yy) - 2415021;
  let k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11, tz) {
  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0, i = 1, arc = getSunLongitude(getNewMoonDay(k+i, tz), tz);
  do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k+i, tz), tz); }
  while (arc != last && i < 14);
  return i - 1;
}

// -------------------------------
// 🔁 CHUYỂN ĐỔI ÂM ⇆ DƯƠNG
// -------------------------------
function convertSolarToLunar(dd, mm, yy, tz) {
  let dayNumber = jdFromDate(dd, mm, yy);
  let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy - 1, tz);
  let b11 = getLunarMonth11(yy, tz);
  if (dayNumber >= b11) {
    a11 = b11;
    b11 = getLunarMonth11(yy + 1, tz);
  }
  let lunarYear = yy;
  let lunarDay = dayNumber - monthStart + 1;
  let diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarLeap = 0;

  if (b11 - a11 > 365) {
    let leapMonthDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff == leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear += 1; // giữ nguyên tạm thời

  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}
// =====================================================
// 🧭 FIX: Giữ năm âm theo bảng khởi tháng (chỉ qua 1/1 âm mới đổi năm)
// =====================================================
if (window.dataGlobal && window.dataGlobal.thangAm) {
  const thangAm = Number(window.dataGlobal.thangAm);
  
  // Nếu đang ở tháng 11 hoặc 12 âm thì không cho đổi năm âm
  if (thangAm === 11 || thangAm === 12) {
    // Nếu đang bị lệch do công thức Hồ Ngọc Đức thì khôi phục
    if (lunar[2] > year) {
      lunar[2] = year;       // Giữ nguyên năm hiện tại
    }
    if (lunar[2] < year - 1) {
      lunar[2] = year - 1;   // Giữ đúng năm âm trước nếu trước Tết
    }
  }
}


function convertLunarToSolar(ld, lm, ly, leap, tz) {
  let a11, b11;
  if (lm < 11) { a11 = getLunarMonth11(ly - 1, tz); b11 = getLunarMonth11(ly, tz); }
  else { a11 = getLunarMonth11(ly, tz); b11 = getLunarMonth11(ly + 1, tz); }
  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lm - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    let leapOff = getLeapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap != 0 && lm != leapMonth) return [0, 0, 0];
    else if (leap != 0 || off >= leapOff) off += 1;
  }
  let monthStart = getNewMoonDay(k + off, tz);
  return jdToDate(monthStart + ld - 1);
}

/* =====================================================
   🧭 PHẦN 4: CAN CHI – MỆNH – CHUYỂN ĐỔI
   -----------------------------------------------------
   - Tính Can Chi theo năm, tháng, ngày, giờ
   - Tính Mệnh Âm/Dương
   - Xử lý nút "Chuyển đổi"
   ===================================================== */

// -------------------------
// 🔹 BẢNG CAN THÁNG THEO CAN NĂM
// -------------------------
const CAN_THANG = {
 "Giáp":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
 "Ất":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
 "Bính":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
 "Đinh":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
 "Mậu":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"],
 "Kỷ":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
 "Canh":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
 "Tân":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
 "Nhâm":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
 "Quý":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"]
};

// -------------------------
// 🔹 HÀM TÍNH CAN CHI
// -------------------------
function canChiYear(y){ return CAN[(y+6)%10] + " " + CHI[(y+8)%12]; }
function canChiMonth(y,m){
  const canY = canChiYear(y).split(" ")[0];
  const canM = CAN_THANG[canY][m-1];
  const chiM = CHI[(m+1)%12];
  return canM + " " + chiM;
}
function canChiDay(y,m,d){
  const jd = jdFromDate(d,m,y);
  return CAN[(jd+9)%10] + " " + CHI[(jd+1)%12];
}
function canChiHour(h,canDayIndex){
  const chi = Math.floor(((h+1)%24)/2)%12;
  const canDay = canDayIndex%10;
  const map={0:0,5:0,1:2,6:2,2:4,7:4,3:6,8:6,4:8,9:8};
  const start = map[canDay];
  const can = (start + chi) % 10;
  return CAN[can] + " " + CHI[chi];
}

// -------------------------
// 💫 TÍNH MỆNH ÂM DƯƠNG NAM/NỮ
// -------------------------
function tinhMenhAD(canChiNam, gender){
  const can = canChiNam.split(" ")[0];
  const duong = ["Giáp","Bính","Mậu","Canh","Nhâm"];
  const m = duong.includes(can) ? "Dương" : "Âm";
  if (m==="Dương" && gender==="Nam") return "Dương Nam";
  if (m==="Dương" && gender==="Nữ") return "Dương Nữ";
  if (m==="Âm" && gender==="Nam") return "Âm Nam";
  return "Âm Nữ";
}

// -------------------------
// 🔁 CẬP NHẬT THÁNG ÂM NHUẬN
// -------------------------
function getLeapMonthOfYear(y, tz){
  const a11=getLunarMonth11(y-1,tz);
  const b11=getLunarMonth11(y,tz);
  if(b11-a11>365){
    const off=getLeapMonthOffset(a11,tz);
    let leap=off-2;
    if(leap<=0)leap+=12;
    return leap;
  }
  return 0;
}

function updateMonths(){
  const type=document.getElementById("calendarType").value;
  const year=parseInt(document.getElementById("year").value);
  const mSel=document.getElementById("month");
  mSel.innerHTML="";
  if(type==="solar"){
    for(let m=1;m<=12;m++){
      const o=document.createElement("option");
      o.value=m; o.textContent="Tháng "+m;
      mSel.appendChild(o);
    }
  } else {
    const leap=getLeapMonthOfYear(year,TZ);
    for(let m=1;m<=12;m++){
      const o=document.createElement("option");
      o.value=m; o.textContent="Tháng "+m;
      mSel.appendChild(o);
      if(m===leap){
        const n=document.createElement("option");
        n.value=m+"_nhuan";
        n.textContent="Tháng "+m+" (nhuận)";
        mSel.appendChild(n);
      }
    }
  }
}
document.getElementById("calendarType").addEventListener("change",updateMonths);
document.getElementById("year").addEventListener("change",updateMonths);

document.addEventListener("DOMContentLoaded", () => {




function resetChart() {
  console.clear();

  const cells = document.querySelectorAll("[id^='cell']");

  cells.forEach(cell => {
    // Xóa TẤT CẢ các layer động trong cung
    cell.querySelectorAll(`
      .layer-2,
      .layer-3,
      .layer-4,
      .layer-5,
      .layer-6,
      .layer-7,
      .layer-8,
      .layer-9,
      .layer-10,
      .layer-10-thang,
      .layer-10-5,
      .layer-11,
      .layer-luu,
      .sao-luu,
      .luu-dai,
      .luu-tieu,
      .luu-nguyet,
      .luu-nhat
    `).forEach(e => e.remove());
  });

  // reset map gán sao
  window.saoToCung = {};

  // reset dataGlobal
  if (window.dataGlobal) {
    delete window.dataGlobal.cungChucMap;
    delete window.dataGlobal.tenCungMenh;
    delete window.dataGlobal.cucSo;
  }

  console.log("♻️ ĐÃ RESET LÁ SỐ – SẴNG SÀNG AN LẠI");
}


// -------------------------
// 🔘 NÚT "CHUYỂN ĐỔI"
// -------------------------

document.getElementById("convert").addEventListener("click", async ()=>{
resetChart();

  const name=document.getElementById("name").value.trim()||"Người dùng";
  const gender=document.getElementById("gender").value;
  const type=document.getElementById("calendarType").value;
 let day = parseInt(document.getElementById("day").value);
let monthVal = document.getElementById("month").value;
let year = parseInt(document.getElementById("year").value);
  const hour=parseInt(document.getElementById("gio").value);

  let month=parseInt(monthVal);
  let isLeap=0;
  if(String(monthVal).includes("_nhuan")){ month=parseInt(monthVal); isLeap=1; }

  let lunar,html="";
  // =====================================================
  // 📡 Gọi backend chuyển đổi âm/dương (giữ nguyên công thức)
  // =====================================================
  const payload = {
    type,
    day,
    month,
    year,
    hour,
    gender,
    name,
    isLeap: !!isLeap
  };

  let apiData;
  try {
    const resp = await apiFetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-cache"
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    apiData = await resp.json();
  } catch (err) {
    console.error("❌ Lỗi gọi /api/convert:", err);
    alert("Không gọi được backend để chuyển đổi lịch. Vui lòng kiểm tra server.");
    return;
  }

  // (Bước 1 tách logic) Gọi thử API tính lá số backend để sẵn dữ liệu
  // Chưa dùng để render, chỉ lưu lại để lần sau tiếp tục tách frontend.
  try {
    const resCalc = await apiFetch("/api/tinh-laso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-cache"
    });
    if (resCalc.ok) {
      window.BACKEND_LASO = await resCalc.json();
      console.log("[BACKEND_LASO]", window.BACKEND_LASO);
    }
  } catch (err) {
    console.warn("⚠️ Không gọi được /api/tinh-laso (đang tách dần logic):", err);
  }

  const { solar = {}, lunar: lunarObj = {}, canChi = {}, menh: menhApi } = apiData || {};

  // 🗓️ Áp dụng kết quả từ backend
  day = Number(solar.day);
  month = Number(solar.month);
  year = Number(solar.year);
  lunar = [
    Number(lunarObj.day),
    Number(lunarObj.month),
    Number(lunarObj.year),
    lunarObj.leap ? 1 : 0
  ];


// ✅ Đảm bảo có tháng âm cho Tiểu Tinh
if (!window.dataGlobal) window.dataGlobal = {};
window.dataGlobal.thangAm = (Array.isArray(lunar) && Number(lunar[1]))
  ? Number(lunar[1])
  : (type === "lunar" ? Number(document.getElementById("month").value) : 1);



  // 🌓 TÍNH CAN CHI + MỆNH (ưu tiên công thức local để có dấu chuẩn)
  const canY = canChiYear(lunar[2]);
  const canM = canChiMonth(lunar[2], lunar[1]);
  const canD = canChiDay(year, month, day);
  let jd = jdFromDate(day, month, year);

// ✅ Giờ Tý (23h) thuộc về ngày hôm sau theo quy tắc Tử Vi
if (hour === 23) {
  jd += 1;
  console.log("🕛 Giờ Tý sau → tính Can Chi giờ theo ngày hôm sau");
}

const canH = canChiHour(hour, (jd + 9) % 10);

  const menh = menhApi || tinhMenhAD(canY, gender);


// =====================================================
// 🌟 TẠO DATA CHO TOÀN BỘ LÁ SỐ
// -----------------------------------------------------
const data = {

  name,
  gender,
  lunar,
  canChiNam: canY,
  canChiThang: canM,
  canChiNgay: canD,
  canChiGio: canH,
  menh,
  cungMenh: window.dataGlobal?.cungMenh || "",
  tenCungMenh: window.dataGlobal?.tenCungMenh || ""
};


  // 🪞 HIỂN THỊ KẾT QUẢ
  html = `
  <table>
    <tr><th></th><th>Dương lịch</th><th>Âm lịch</th><th>Can Chi</th></tr>
    <tr><td>Năm</td><td>${year}</td><td>${lunar[2]}</td><td>${canY}</td></tr>
    <tr><td>Tháng</td><td>${month}</td><td>${lunar[1]}${lunar[3]?" (nhuận)":""}</td><td>${canM}</td></tr>
    <tr><td>Ngày</td><td>${day}</td><td>${lunar[0]}</td><td>${canD}</td></tr>
    <tr><td>Giờ</td>
        <td>${ZHOURS.find(z=>z.value==hour).label}</td>
        <td>${ZHOURS.find(z=>z.value==hour).label}</td>
        <td>${canH}</td></tr>
    <tr><td colspan="4" style="font-style:italic;background:#fafafa;font-size:13px;">
      ${name} – ${menh} – ${day}/${month}/${year}
      ⇔ ${lunar[0]}/${lunar[1]}${lunar[3]?"(nhuận)":""}/${lunar[2]} (Âm)
    </td></tr>
  </table>`;

  document.getElementById("output").innerHTML = html;

  // 🌟 TẠO LÁ SỐ TRẮNG (chuẩn bị an sao sau này)
    // 🌟 An lớp 2 (Mệnh) trước để lấy vị trí cung Mệnh
 function xacDinhThanCung(gioSinhChi) {
  switch (gioSinhChi) {
    case "Tý": case "Ngọ":
      return "Mệnh";
    case "Dần": case "Thân":
      return "Quan Lộc";
    case "Tuất": case "Thìn":
      return "Tài Bạch";
    case "Sửu": case "Mùi":
      return "Phúc Đức";
    case "Tỵ": case "Hợi":
      return "Phu Thê";
    case "Mão": case "Dậu":
      return "Thiên Di";
    default:
      return "Mệnh"; // fallback an Mệnh nếu không xác định
  }
}
 const cungMenh = anLop2_Menh({

    name, gender, menh,
    canChiNam: canY,
    canChiThang: canM,
    canChiNgay: canD,
    canChiGio: canH,
    lunar
  });

// 🌟 Tạo lá số (có thêm thông tin cung Mệnh)
taoLaSoTrang({
  name, gender, menh,
  canChiNam: canY,
  canChiThang: canM,
  canChiNgay: canD,
  canChiGio: canH,
  lunar,
  amduongMenh: menh,
  cungMenh,
  cucSo: "" // để trống, sẽ cập nhật sau
});


// ✅ Cập nhật dữ liệu toàn cục
window.dataGlobal = window.dataGlobal || {};
window.dataGlobal.thangAm = (Array.isArray(lunar) && Number(lunar[1]))
  ? Number(lunar[1])
  : (document.getElementById("calendarType").value === "lunar"
      ? Number(document.getElementById("month").value)
      : 1);
// ✅ Sau khi tạo xong DOM lá số, an lần lượt các lớp chuẩn thứ tự
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
// 🔧 Đảm bảo dataGlobal có dữ liệu Mệnh và Cục số
if (!window.dataGlobal || Object.keys(window.dataGlobal).length === 0) {
  window.dataGlobal = data; // giữ nguyên tham chiếu
}

  // 🧩 Đảm bảo dữ liệu năm sinh có sẵn trong dataGlobal
  if (!window.dataGlobal.canChiNam || !window.dataGlobal.canChiNam.includes(" ")) {
    const canY = canChiYear(window.dataGlobal.lunar?.[2] || new Date().getFullYear());
    window.dataGlobal.canChiNam = canY;
    console.log("⚙️ Bổ sung canChiNam vào dataGlobal:", canY);
  }

// 🌟 1️⃣ Lớp cơ bản
anLop1_ViTriCung(data);
const cungMenh = anLop2_Menh(data);
// Đồng bộ cung/ten Mệnh vừa an
if (cungMenh) {
  data.cungMenh = cungMenh;
  data.tenCungMenh = window.dataGlobal.tenCungMenh || cungMenh;
}

// ✅ Gán Cung Mệnh thật (có thể chưa có cungChucMap ngay)
const cungChucMapSafe = window.dataGlobal.cungChucMap || {};
let tenCungMenh = Object.keys(cungChucMapSafe)
  .find(k => cungChucMapSafe[k] === "MỆNH");

// 🔄 Fallback nếu chưa tìm được tên cung Mệnh
if (!tenCungMenh && typeof window.mapCung === "object") {
  const revMap = Object.fromEntries(Object.entries(window.mapCung).map(([k, v]) => [v, k]));
  if (window.dataGlobal.cungMenh && revMap[window.dataGlobal.cungMenh]) {
    tenCungMenh = revMap[window.dataGlobal.cungMenh];
  }
}

window.dataGlobal.tenCungMenh = tenCungMenh || window.dataGlobal.tenCungMenh || "";
if (tenCungMenh) window.dataGlobal.tenCungMenh = tenCungMenh;
if (tenCungMenh) data.tenCungMenh = tenCungMenh;

console.log("🧭 tenCungMenh:", window.dataGlobal.tenCungMenh);


// 🌟 Cập nhật lại phần hiển thị trung tâm
const elCucSo = document.querySelector("#cucSoText, .info-line b + span");
if (elCucSo) {
  const cucSoValue = data?.cucSo || window.dataGlobal?.cucSo || "(đang xác định)";
  elCucSo.textContent = cucSoValue;
  console.log("🟢 Đã cập nhật hiển thị Cục Số:", cucSoValue);
}




// 🌟 2️⃣ Chính tinh & Cục số (sau khi Mệnh đã sẵn sàng)
setTimeout(() => {
  // ⏳ Đợi tới khi có tenCungMenh thật
  const checkAndRunCucSo = () => {
    const data = window.dataGlobal;
    if (!data?.tenCungMenh || typeof data.tenCungMenh !== "string") {
      console.log("⏸️ Đang đợi xác định tên Cung Mệnh...");
      return setTimeout(checkAndRunCucSo, 800); // kiểm tra lại sau 0.2s
    }
    console.log("✅ Đã có tên cung Mệnh:", data.tenCungMenh);
// 🧩 Bổ sung Cục Số nếu chưa có
if (!data.cucSo || data.cucSo === "") {
  data.cucSo = xacDinhCucSo(data.canChiNam, data.tenCungMenh);
  window.dataGlobal.cucSo = data.cucSo;
  console.log(`🌀 Cục Số được gán trước khi gọi anLop4: ${data.cucSo}`);
}

    anLop4_CucSo(data);
    anLop5_NguHanhCung();
    if (typeof anLop3_ChinhTinh === "function") {
      anLop3_ChinhTinh(data);
    }

    // 🌟 Cập nhật hiển thị trung tâm (nếu có)
    const elCucSo = document.querySelector("#cucSoText, .info-line b + span");
    if (elCucSo) {
      elCucSo.textContent = data.cucSo || "(chưa xác định)";
      console.log("🟢 Đã cập nhật hiển thị Cục Số:", elCucSo.textContent);
    }
    console.log("✅ Cục số và Ngũ hành đã được an xong");
  };
  checkAndRunCucSo();
}, 300);



// 🌟 3️⃣ Trung tinh (Cát + Hung) – nền tảng cho Tiểu tinh
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;

  // 🧩 Đảm bảo cungChucMap tồn tại trước khi an Trung tinh
  if (!data.cungChucMap) {
    const mapMoi = anLop2_Menh(data);
    if (mapMoi) data.cungChucMap = mapMoi;
  }

  // 🧩 Đồng bộ tên cung Mệnh sau khi anLop2_Menh
  if (!data.tenCungMenh && window.dataGlobal?.tenCungMenh) {
    data.tenCungMenh = window.dataGlobal.tenCungMenh;
  }

  // 🧩 Đảm bảo có Cục Số + Chính Tinh trước khi an Trung tinh
  if (!data.cucSo || data.cucSo === "") {
    const tenMenh = data.tenCungMenh || window.dataGlobal.tenCungMenh;
    const cuc = xacDinhCucSo(data.canChiNam, tenMenh);
    data.cucSo = cuc;
    window.dataGlobal.cucSo = cuc;
  }
  if (typeof anLop3_ChinhTinh === "function") {
    anLop3_ChinhTinh(data);
  }

  console.log("🌀 Bắt đầu an Trung tinh...");
  anLop6_TrungTinh(data);

setTimeout(() => {
    anTieuTinh(data);
    setTimeout(() => {
        anLop6_2_LocTon_ThienMa(data);
        anLop6_4_TuHoa(data);
    }, 120);
}, 120);

  anLop8_VongTrangSinh(data);
  enableCungHighlight();
  console.log("✅ Trung tinh đã được an xong");
}, 1500);

// 🌟 4️⃣ Tiểu tinh (phụ thuộc Trung tinh)
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) {
    console.warn("⚠️ Chưa có dataGlobal, bỏ qua an sao.");
    return;
  }
  console.log("🌸 Bắt đầu an Tiểu tinh...");
  if (typeof anTieuTinh === "function") anTieuTinh(data);
  if (typeof taoNutTieuTinh === "function") taoNutTieuTinh();
  console.log("✅ Tiểu tinh đã được an xong");
}, 2000);


// 🌟 5️⃣ Tuần & Triệt
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
  const canNam = data.canChiNam?.split(" ")[0];
  const chiNam = data.canChiNam?.split(" ")[1];
  if (!canNam || !chiNam) return;
  const [t1, t2] = anTuan(canNam, chiNam);
  const [r1, r2] = anTriet(canNam);
  if (t1 && t2) veThanhTuanTriet("TUẦN", t1, t2);
  if (r1 && r2) veThanhTuanTriet("TRIỆT", r1, r2);
}, 1700);

// 🌟 6️⃣ Thêm chữ [THÂN] (chạy cuối cùng)
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
  const gioChi = (data.canChiGio || "").split(" ")[1];
  if (!gioChi) return;

  const cungThan = xacDinhCungThan(gioChi, data.cungChucMap);
  if (!cungThan) return;

  const CUNG_TO_CELL = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };
  const cell = document.getElementById("cell" + CUNG_TO_CELL[cungThan]);
  if (!cell) return;
  const layer2 = cell.querySelector(".layer-2");
  if (!layer2) return;

  let titleEl = layer2.querySelector(".ten-cung");
  if (!titleEl) {
    titleEl = document.createElement("div");
    titleEl.className = "ten-cung";
    layer2.appendChild(titleEl);
  }

  if (!titleEl.querySelector(".than-label")) {
    const span = document.createElement("span");
    span.className = "than-label";
    span.textContent = "[THÂN]";
    span.style.fontWeight = "bold";
    span.style.marginLeft = "3px";
    span.style.letterSpacing = "-0.3px";
    span.style.display = "inline";
    span.style.color = titleEl.style.color || "#000";
    span.style.textTransform = "uppercase";
    titleEl.appendChild(span);
  }
ensureXemHanSection();

  console.log("✅ Thêm [THÂN] tại", cungThan);

// 🌟 TỰ ĐỘNG AN SAO LƯU SAU KHI AN LÁ SỐ XONG
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;

  try {
    // 🧹 Xóa sao Lưu cũ (nếu có)
    if (typeof xoaSaoLuu === "function") xoaSaoLuu();

    // 🌞 An sao theo 4 cấp vận (Đại / Tiểu / Nguyệt / Nhật)
    if (typeof anSaoLuu_DaiVan === "function") anSaoLuu_DaiVan(data);
    if (typeof anSaoLuu_TieuVan === "function") anSaoLuu_TieuVan(data);
    if (typeof anSaoLuu_NguyetVan === "function") anSaoLuu_NguyetVan(data);
    if (typeof anSaoLuu_NhatVan === "function") anSaoLuu_NhatVan(data);

    // 🔁 Cập nhật hiển thị tick nhóm ẩn/hiện (nếu bảng đã có)
    if (typeof window.__capNhatHienThiSaoLuu === "function")
      window.__capNhatHienThiSaoLuu();

    console.log("✨ Đã tự động an sao Lưu sau khi an lá số");
  } catch (err) {
    console.error("⚠️ Lỗi khi tự động an sao Lưu:", err);
  }
}, 1500);





  // 🌙 Sau khi an xong toàn bộ lá số – kiểm tra & gắn lại khung Xem Hạn (Âm Lịch)

  if (!document.getElementById("xemHanSection")) {
    const hanDiv = document.createElement("div");
    hanDiv.innerHTML = `
      <div id="xemHanSection" style="text-align:center; margin-top:6px; font-family:'Segoe UI',sans-serif;">
        <h3 style="font-size:14px; margin-bottom:6px; display:flex; align-items:center; justify-content:center; gap:4px;">
          <span style="font-size:16px;">🔮</span>
          <span style="font-weight:600;">Xem Hạn (Âm Lịch)</span>
        </h3>
        <div style="display:inline-flex; align-items:center; gap:3px; flex-wrap:wrap; justify-content:center; font-size:12px;">
          <label for='luuNam'>Năm:</label>
          <input type='number' id='luuNam' min='1900' max='2100'
                 style='width:60px;height:20px;text-align:center;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <label for='luuThang'>Th:</label>
          <input type='number' id='luuThang' min='1' max='12'
                 style='width:45px;height:20px;text-align:center;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <label for='luuNgay'>Ng:</label>
          <input type='number' id='luuNgay' min='1' max='30'
                 style='width:45px;height:20px;text-align:centdocument.getElementByIder;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <span id='tuoiAmLabel' style='margin-left:6px;font-weight:bold;color:#c00;font-size:12px;'>Tuổi: —</span>
        </div>
        <div style='margin-top:6px;'>
          <button id='btnToggleLuuVan'
                  style='background:#337ab7;color:white;border:none;border-radius:5px;
                         padding:3px 8px;font-size:11px;cursor:pointer;'>
            Ẩn/Hiện Đại Vận & Tiểu Vận
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(hanDiv);

    // 🔗 Kích hoạt lại các sự kiện
    document.getElementById("btnToggleLuuVan").addEventListener("click", () => {
      document.querySelectorAll(".layer-9,.layer-10").forEach(e => {
        e.style.display = (e.style.display === "none" ? "" : "none");
      });
    });

  ["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // 🧹 xóa sự kiện cũ (nếu có)
    el.addEventListener("change", capNhatHan);    // 🔁 gắn lại mới
  }
});

// ✅ Gắn lại sự kiện sau khi khung đã tạo xong
["luuNam","luuThang","luuNgay"].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener("input",capNhatHan);
});
const btn=document.getElementById("btnToggleLuuVan");
if(btn) btn.addEventListener("click",()=>{
  document.querySelectorAll(".layer-9,.layer-10").forEach(e=>{
    e.style.display = (e.style.display==="none"?"":"none");
  });
});

    console.log("🔁 Đã gắn lại khung Xem Hạn (Âm Lịch) sau khi an lá số");
  }


}, 2100);	
}); // ✅ đóng setTimeout bao ngoài
}); // ✅ đóng event listener click


  

["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // 🧹 xóa sự kiện cũ (nếu có)
    el.addEventListener("change", capNhatHan);    // 🔁 gắn lại mới
  }
});

  console.log("✅ Khung Xem Hạn (Âm Lịch) được gắn lại sau khi tạo lá số");


});

// =====================================================
// 🔁 CẬP NHẬT CAN CHI NĂM ÂM (tự động khi nhập năm)
// =====================================================
function showCanChiYear() {
  const yearInput = document.getElementById("monthYear");
  const label = document.getElementById("canChiLabel");
  const val = parseInt(yearInput.value);
  if (!isNaN(val)) {
    label.textContent = canChiYear(val); // ✅ dùng hàm có sẵn của bạn
  } else {
    label.textContent = "";
  }
}

/* =======================================================
   🔹 HÀM TOÀN CỤC: XÁC ĐỊNH CUNG MỆNH (chạy NGƯỢC chiều)
   ======================================================= */
function tinhCungMenh() {
  const cungChuc = document.getElementById("cungChucSelect").value;
  const viTriAn = document.getElementById("cungChucViTri").value;
  const ketQua = document.getElementById("ketQuaMenh");

  // Thứ tự địa chi trong layout thật của lá số (THUẬN chiều kim đồng hồ)
  const CUNG_LIST = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

  // Thứ tự 12 cung chức (CHẠY NGƯỢC chiều kim đồng hồ)
  const CUNG_CHUC = ["Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách",
                     "Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu"];

  const idxChuc = CUNG_CHUC.indexOf(cungChuc);
  const idxViTri = CUNG_LIST.indexOf(viTriAn);
  if (idxChuc === -1 || idxViTri === -1) {
    ketQua.textContent = "?";
    return;
  }

  // ✅ Mệnh = vị trí an + idxChuc (vì cung chức chạy NGƯỢC chiều)
  const idxMenh = (idxViTri + idxChuc) % 12;
  const menhTai = CUNG_LIST[idxMenh];

  ketQua.textContent = menhTai;
  ketQua.dataset.menh = menhTai;
}




// =====================================================
// 🔹 XÁC ĐỊNH CHI NĂM SINH + MỆNH ÂM/DƯƠNG TỪ VÒNG THÁI TUẾ
// =====================================================
function tinhChiNamThaiTue() {
  const sao = document.getElementById("thaiTueSelect").value;
  const viTriAn = document.getElementById("thaiTueViTri").value;
  const ketQua = document.getElementById("ketQuaChiNam");

  // 12 cung theo chiều thuận
  const CUNG_LIST = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

  // Bảng vị trí sao trong vòng Thái Tuế
  const TIEUTINH_DATA = [
    { ten: "Thái Tuế", buoc: 0 },
    { ten: "Thiếu Dương", buoc: 1 },
    { ten: "Tang Môn", buoc: 2 },
    { ten: "Thiếu Âm", buoc: 3 },
    { ten: "Quan Phù", buoc: 4 },
    { ten: "Tử Phù", buoc: 5 },
    { ten: "Tuế Phá", buoc: 6 },
    { ten: "Long Đức", buoc: 7 },
    { ten: "Bạch Hổ", buoc: 8 },
    { ten: "Phúc Đức", buoc: 9 },
    { ten: "Điếu Khách", buoc: 10 },
    { ten: "Trực Phù", buoc: 11 }
  ];

  // Tìm dữ liệu sao
  const data = TIEUTINH_DATA.find(s => s.ten === sao);
  if (!data) return ketQua.textContent = "?";

  const idx = CUNG_LIST.indexOf(viTriAn);
  if (idx === -1) return ketQua.textContent = "?";

  // Nếu sao này cách Thái Tuế "buoc" cung → Thái Tuế = idx - buoc (đếm nghịch)
  const idxThaiTue = (idx - data.buoc + 12) % 12;
  const cungThaiTue = CUNG_LIST[idxThaiTue];

  // Xác định Âm / Dương theo Địa Chi
  const DUONG_CHI = ["Tý","Dần","Thìn","Ngọ","Thân","Tuất"];
  const amDuong = DUONG_CHI.includes(cungThaiTue) ? "Dương" : "Âm";

  // Hiển thị kết quả
ketQua.innerHTML = `${cungThaiTue}&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#444;">mệnh:</span> <b>${amDuong}</b>`;
document.getElementById("ketQuaChiNam").dataset.amduong = amDuong;
window.menhAmDuong = amDuong; // "Âm" hoặc "Dương"

}

// =========================
  // 1️⃣ Tính cục số
  // =========================
function tinhCucSo() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const viTriCuc = document.getElementById("cucViTriSelect").value;
  const cucSo = parseInt(document.getElementById("cucSoSelect").value);
  const canCuc = document.getElementById("cucCanSelect").value;
  const ketQua = document.getElementById("ketQuaCuc");

  // Lấy từ phần 1 & 2
  const menhTai = document.getElementById("ketQuaMenh").dataset.menh || "?";
  const menhAmDuong = window.menhAmDuong || "?";

  if (!menhTai || menhTai === "?" || !viTriCuc || !cucSo) {
    ketQua.textContent = `${loaiCuc} – Chưa xác định – Chưa xác định`;
    return;
  }

function goiTrangSinhDuPhong() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const menhAmDuong = window.menhAmDuong || "?";
  const gioiTinh = document.getElementById("ketQuaChiNam")?.textContent || "?";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong);
}

// =========================
// 1️⃣ Xác định chiều thuận / nghịch (chuẩn theo từng loại Cục)
// =========================
const idxMenh = CUNG_THUAN.indexOf(menhTai);
const idxCuc  = CUNG_THUAN.indexOf(viTriCuc);
if (idxMenh === -1 || idxCuc === -1) {
  ketQua.textContent = `${loaiCuc} – Chưa xác định – Chưa xác định`;
  return;
}

// 🔸 Khởi số của từng loại cục
const BANG_KHOI_CUC = {
  "Thủy nhị cục": 2,
  "Mộc tam cục": 3,
  "Kim tứ cục": 4,
  "Thổ ngũ cục": 5,
  "Hỏa lục cục": 6
};

let chieu = "Không xác định";
if (!isNaN(cucSo)) {
  // 🧮 Số bước dịch tùy loại cục
  const khoi = BANG_KHOI_CUC[loaiCuc] ?? 4;
  const buoc = Math.floor((cucSo - khoi) / 10) % 12;

  // 🎯 Xác định vị trí hợp lệ nếu chạy thuận và nghịch
  const viTriThuan = CUNG_THUAN[(idxMenh + buoc) % 12];
  const viTriNghich = CUNG_THUAN[(idxMenh - buoc + 12) % 12];

  // 🚫 Giới hạn 10 trường hợp đặc biệt: 2–6 và 62–66 → không tính chiều
  const CAM_TINH_CHIEU = [2, 3, 4, 5, 6, 62, 63, 64, 65, 66];

  if (CAM_TINH_CHIEU.includes(cucSo)) {
    chieu = "Không xác định";
  } else {
    if (viTriCuc === viTriThuan) chieu = "Thuận";
    else if (viTriCuc === viTriNghich) chieu = "Nghịch";
    else chieu = "Không xác định";
  }
}





  // =========================
  // 2️⃣ Xác định giới tính
  // =========================
  let gioiTinh = "Chưa xác định";
  if (chieu === "Thuận" && menhAmDuong === "Dương") gioiTinh = "Dương Nam";
  else if (chieu === "Thuận" && menhAmDuong === "Âm") gioiTinh = "Âm Nữ";
  else if (chieu === "Nghịch" && menhAmDuong === "Dương") gioiTinh = "Dương Nữ";
  else if (chieu === "Nghịch" && menhAmDuong === "Âm") gioiTinh = "Âm Nam";

// =========================
// 3️⃣ Đếm ngược Can + Chi để xác định Can Dần (chuẩn Tử Vi)
// =========================
const CAN_LIST = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

const idxCan = CAN_LIST.indexOf(canCuc);
const idxChi = CHI_LIST.indexOf(viTriCuc);
let canDan = null;

if (idxCan !== -1 && idxChi !== -1) {
  let canIdx = idxCan;
  let chiIdx = idxChi;

  // Nếu chi đang nhập đã là Dần → dùng luôn can hiện tại
  if (viTriCuc === "Dần") {
    canDan = canCuc;
  } else {
    // Ngược lại, lùi cả Can và Chi cho tới khi gặp Dần
    do {
      canIdx = (canIdx - 1 + 10) % 10;
      chiIdx = (chiIdx - 1 + 12) % 12;
    } while (CHI_LIST[chiIdx] !== "Dần");

    canDan = CAN_LIST[canIdx];
  }
}




  // =========================
  // 4️⃣ Tra bảng Can Dần -> Can năm sinh
  // =========================
  const CAN_DAN_MAP = {
    "Giáp": "Mậu / Quý",
    "Nhâm": "Đinh / Nhâm",
    "Canh": "Bính / Tân",
    "Mậu": "Ất / Canh",
    "Bính": "Giáp / Kỷ"
  };

  let canNamText = "Chưa xác định";
  if (canDan && CAN_DAN_MAP[canDan]) {
    canNamText = CAN_DAN_MAP[canDan];
  }



// =========================
// 5️⃣ Hiển thị kết quả cuối
// =========================
ketQua.innerHTML = `<b>${loaiCuc}</b> – ${chieu} – <b>${gioiTinh}</b> – Can năm: <b>${canNamText}</b>`;

// =========================
// 6️⃣ Gọi Vòng Tràng Sinh dự phòng nếu cần
// =========================
const groupTrangSinh = document.getElementById("vongTrangSinhGroup");
if (typeof chieu !== "undefined" && chieu === "Không xác định") {
  const gioiTinhText = gioiTinh || "Chưa xác định";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinhText, menhAmDuong);
} else {
  groupTrangSinh.style.display = "none";
}
}



// Gọi lại khi thay đổi các giá trị liên quan
["cucLoaiSelect","cucSoSelect","cucViTriSelect","cucCanSelect"].forEach(id=>{
  document.getElementById(id).addEventListener("change", tinhCucSo);
});

// =====================================================
// 🔹 HÀM TRUNG GIAN: GỌI TỰ ĐỘNG VÒNG TRÀNG SINH DỰ PHÒNG
// =====================================================
function goiTrangSinhDuPhong() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const menhAmDuong = window.menhAmDuong || "?";
  const gioiTinh = document.getElementById("ketQuaChiNam")?.textContent || "?";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong);
}

// =====================================================
// 3️⃣.1 VÒNG TRÀNG SINH (TỰ XÁC ĐỊNH CHIỀU & SUY GIỚI TÍNH)
// =====================================================
function xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong) {
  const ketQua = document.getElementById("ketQuaTrangSinh");
  const group = document.getElementById("vongTrangSinhGroup");
  const saoChon = document.getElementById("trangSinhSelect").value;
  const cungCucSo = document.getElementById("cucViTriSelect").value;
  group.style.display = "block";

  // 🟢 1️⃣ Kiểm tra đầu vào
  if (!loaiCuc || !cungCucSo || !saoChon) {
    ketQua.innerHTML = `⚠️ Vui lòng chọn đủ: Cục, Sao và Vị trí Cục Số.`;
    return;
  }

  // 🟢 2️⃣ Bảng khởi Tràng Sinh theo loại Cục
  const TRANG_SINH_KHOI = {
    "Kim tứ cục": "Tỵ",
    "Mộc tam cục": "Hợi",
    "Hỏa lục cục": "Dần",
    "Thủy nhị cục": "Thân",
    "Thổ ngũ cục": "Thân"
  };
  const cungKhoi = TRANG_SINH_KHOI[loaiCuc];
  if (!cungKhoi) {
    ketQua.innerHTML = `⚠️ Không xác định được cung khởi Tràng Sinh.`;
    return;
  }

  // 🟢 3️⃣ Chuỗi sao trong vòng Tràng Sinh (thứ tự cố định)
  const SAO_VONG = [
    "Tràng Sinh","Mộc Dục","Quan Đới","Lâm Quan",
    "Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"
  ];

  // 🟢 4️⃣ Thứ tự 12 cung thuận theo Tử Vi
const CUNG_THUAN_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

  const idxKhoi = CUNG_THUAN.indexOf(cungKhoi);
  const idxCuc = CUNG_THUAN.indexOf(cungCucSo);
  if (idxKhoi === -1 || idxCuc === -1) {
    ketQua.innerHTML = `⚠️ Cung không hợp lệ.`;
    return;
  }

  // 🟢 5️⃣ Tính sao tại cung Cục Số nếu vòng đi thuận hoặc nghịch
  const diffThuan = (idxCuc - idxKhoi + 12) % 12;
  const diffNghich = (idxKhoi - idxCuc + 12) % 12;
  const saoThuThuan = SAO_VONG[diffThuan];
  const saoThuNghich = SAO_VONG[diffNghich];

  // 🟢 6️⃣ So sánh sao chọn với hai hướng để xác định chiều
  let chieu = "?";
  if (saoChon === saoThuThuan) chieu = "Thuận";
  else if (saoChon === saoThuNghich) chieu = "Nghịch";
  else chieu = "Không xác định";

  // 🟢 7️⃣ Nếu sao nằm ở Tràng Sinh hoặc Bệnh → vô định
  if (["Tràng Sinh","Bệnh"].includes(saoChon)) {
    ketQua.innerHTML = `
      Tràng Sinh khởi tại <b>${cungKhoi}</b> → Cục Số tại <b>${cungCucSo}</b><br>
      Sao <b>${saoChon}</b> thuộc vị trí vô định → 
      <span style="color:#a00;">Không xác định giới tính</span>.
    `;
    return { chieu: "Không xác định", gioiTinh: "Không xác định", cungKhoi, cungCucSo, sao: saoChon };
  }

  // 🟢 8️⃣ Suy giới tính theo chiều + Âm Dương Mệnh
  let gioiTinhSuy = "Không xác định";
  if (chieu === "Thuận" && menhAmDuong === "Dương") gioiTinhSuy = "Nam";
  else if (chieu === "Nghịch" && menhAmDuong === "Dương") gioiTinhSuy = "Nữ";
  else if (chieu === "Thuận" && menhAmDuong === "Âm") gioiTinhSuy = "Nữ";
  else if (chieu === "Nghịch" && menhAmDuong === "Âm") gioiTinhSuy = "Nam";

  // 🟢 9️⃣ Hiển thị kết quả
  let detail = "";
  if (chieu === "Thuận" || chieu === "Nghịch") {
    detail = `Cung này ứng với sao <b>${saoChon}</b> trong vòng Tràng Sinh → 
              <b>${chieu} hành</b> → 
              <span style="color:#006400;">Giới tính: <b>${gioiTinhSuy}</b></span>`;
  } else {
    detail = `Sao <b>${saoChon}</b> không trùng vị trí nào trong vòng Tràng Sinh của ${loaiCuc}. 
              <span style="color:#a00;">Không xác định chiều & giới tính.</span>`;
  }

  ketQua.innerHTML = `
    Tràng Sinh khởi tại <b>${cungKhoi}</b> → Cục Số tại <b>${cungCucSo}</b><br>${detail}
  `;

  // 🟢 10️⃣ Trả ra kết quả để dùng tiếp
  return { chieu, gioiTinh: gioiTinhSuy, cungKhoi, cungCucSo, sao: saoChon };
}





// =====================================================
// 🔹 KHỞI TẠO DANH SÁCH SAO TRÀNG SINH (12 SAO)
// =====================================================
function khoiTaoVongTrangSinh() {
  const trangSinhSelect = document.getElementById("trangSinhSelect");
  if (!trangSinhSelect) return;

  const SAO_TRANG_SINH = [
    "Tràng Sinh",
    "Mộc Dục",
    "Quan Đới",
    "Lâm Quan",
    "Đế Vượng",
    "Suy",
    "Bệnh",
    "Tử",
    "Mộ",
    "Tuyệt",
    "Thai",
    "Dưỡng"
  ];

  // Xóa hết tùy chọn cũ (nếu có)
  trangSinhSelect.innerHTML = "";

  // Thêm tùy chọn trống đầu tiên
  const optEmpty = document.createElement("option");
  optEmpty.value = "";
  optEmpty.textContent = "— Chọn sao —";
  trangSinhSelect.appendChild(optEmpty);

  // Thêm 12 sao vào dropdown
  SAO_TRANG_SINH.forEach(sao => {
    const opt = document.createElement("option");
    opt.value = sao;
    opt.textContent = sao;
    trangSinhSelect.appendChild(opt);
  });
}

// Gọi hàm khởi tạo khi trang load
window.addEventListener("DOMContentLoaded", khoiTaoVongTrangSinh);




// =====================================================
// 4️⃣ VÒNG BÁC SĨ – TRA NGƯỢC CAN NĂM SINH
// =====================================================
function xacDinhBacSi() {
  const ketQua = document.getElementById("ketQuaCanNam");
  if (!ketQua) return;

  // 🟢 1️⃣ Lấy dữ liệu nhập
  const saoChon = document.getElementById("bacSiSelect").value;
  const cungSao = document.getElementById("bacSiViTri").value;
  if (!saoChon || !cungSao) {
    ketQua.innerHTML = `⚠️ Vui lòng chọn đủ Sao và Vị trí an.`;
    return;
  }

  // 🟢 2️⃣ Lấy chiều thuận/nghịch từ phần 3 hoặc 3.1 (ưu tiên có giá trị trước)
  let chieu = "?";
  const ketQuaCuc = document.getElementById("ketQuaCuc")?.textContent || "";
  const ketQuaTrangSinh = document.getElementById("ketQuaTrangSinh")?.textContent || "";

  if (ketQuaCuc.includes("Thuận") || ketQuaTrangSinh.includes("Thuận")) chieu = "Thuận";
  else if (ketQuaCuc.includes("Nghịch") || ketQuaTrangSinh.includes("Nghịch")) chieu = "Nghịch";

  if (chieu === "?") {
    ketQua.innerHTML = `⚠️ Chưa có dữ liệu chiều thuận/nghịch từ phần Cục.`;
    return;
  }

  // 🟢 3️⃣ Mảng sao & mảng cung
  const SAO_VONG_BACSI = [
    "Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân",
    "Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"
  ];

  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

  const idxSao = SAO_VONG_BACSI.indexOf(saoChon);
  const idxCung = CUNG_THUAN.indexOf(cungSao);
  if (idxSao === -1 || idxCung === -1) {
    ketQua.innerHTML = `⚠️ Dữ liệu sao hoặc cung không hợp lệ.`;
    return;
  }

  // 🟢 4️⃣ Xác định hướng đếm để tìm Bác Sĩ
  // Nếu vòng gốc đi thuận → đếm ngược để tra ngược
  // Nếu vòng gốc đi nghịch → đếm thuận để tra ngược
  const buoc = idxSao; // số bước từ Bác Sĩ đến sao đang chọn
  let idxBacSi;
if (chieu === "Thuận") idxBacSi = (idxCung - buoc + 12) % 12;
else idxBacSi = (idxCung + buoc) % 12;


  const cungBacSi = CUNG_THUAN[idxBacSi];

  // 🟢 5️⃣ Tra bảng Lộc Tồn (vị trí an Bác Sĩ)
  const LOC_TON_MAP = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ","Mậu":"Tỵ",
    "Kỷ":"Ngọ","Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
  };

  // Tìm tất cả Can có Lộc Tồn trùng cung Bác Sĩ
  const canNamList = [];
  for (const [can, cung] of Object.entries(LOC_TON_MAP)) {
    if (cung === cungBacSi) canNamList.push(can);
  }

  // 🟢 6️⃣ Lấy kết quả Can năm từ phần 3 (Cục số)
const ketQuaCucText = document.getElementById("ketQuaCuc")?.textContent || "";
let canPhan3 = [];
if (ketQuaCucText.includes("Can năm")) {
  const match = ketQuaCucText.match(/Can năm:\s*([A-Za-zÀ-ỹ\/\s]+)/);
  if (match && match[1]) {
    canPhan3 = match[1].split("/").map(s => s.trim());
  }
}

// 🟢 7️⃣ Tính giao giữa hai kết quả (phần 3 & phần 4)
const giaoCan = canNamList.filter(c => canPhan3.includes(c));

// 🟢 8️⃣ Hiển thị kết quả tổng hợp
let html = `
  Bác Sĩ an tại <b>${cungBacSi}</b> →
  Chiều <b>${chieu}</b> →
  Sao <b>${saoChon}</b> tại <b>${cungSao}</b><br>
  ⮕ <span style="color:#006400;">Can năm sinh (vòng Bác Sĩ): <b>${canNamList.join(" / ")}</b></span><br>
`;

if (canPhan3.length > 0) {
  html += `<span style="color:#444;">Can năm (vòng Cục): <b>${canPhan3.join(" / ")}</b></span><br>`;
}

if (giaoCan.length > 0) {
  html += `<span style="color:#b22222;">✅ Kết quả giao: <b>${giaoCan.join(" / ")}</b></span>`;
} else {
  html += `<span style="color:#a00;">⚠️ Không trùng giữa hai vòng – cần xem lại dữ kiện.</span>`;
}

ketQua.innerHTML = html;
window.ketQuaBacSi = { giaoCan, cungBacSi, chieu }; // để phần tra ngược lấy được


// 🟢 9️⃣ Trả kết quả ra ngoài (để có thể dùng cho bước sau)
return { 
  chieu, 
  sao: saoChon, 
  cungSao, 
  cungBacSi, 
  canNamList, 
  canPhan3, 
  giaoCan // ← thêm dòng này để lưu luôn kết quả giao
};
}

// 🟢 10️⃣ Gán sự kiện onchange cho dropdown để hiển thị kết quả ngay
["bacSiSelect","bacSiViTri"].forEach(id=>{
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", xacDinhBacSi);
});

/* ==========================================================
   🔹 TRA NGƯỢC TỬ VI – THIÊN PHỦ (chuẩn trục Dần–Thân)
   ========================================================== */

const CUNG_THUAN_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
const CUNG_CHUC_RUT_GON = ["Mệnh","Huynh","Phu","Tử","Tài","Tật","Di","Nô","Quan","Điền","Phúc","Phụ"];

// 🌟 Vòng sao cố định
const PATTERN_TU_VI = [
  "Tử Vi","Thiên Cơ",null,"Thái Dương","Vũ Khúc","Thiên Đồng",
  null,null,"Liêm Trinh",null,null,null
];
const PATTERN_THIEN_PHU = [
  "Thiên Phủ","Thái Âm","Tham Lang","Cự Môn","Thiên Tướng",
  "Thiên Lương","Thất Sát",null,null,null,"Phá Quân",null
];

// 🌟 Bảng ngày sinh âm theo cục
const BANG_TU_VI_TRA_NGUOC = {
  "Thủy nhị cục": [
    "Sửu","Dần","Dần","Mão","Mão","Thìn","Thìn","Tỵ","Tỵ","Ngọ",
    "Ngọ","Mùi","Mùi","Thân","Thân","Dậu","Dậu","Tuất","Tuất","Hợi",
    "Hợi","Tý","Tý","Sửu","Sửu","Dần","Dần","Mão","Mão","Thìn"
  ],
  "Mộc tam cục": [
    "Thìn","Sửu","Dần","Tỵ","Dần","Mão","Ngọ","Mão","Thìn","Mùi",
    "Thìn","Tỵ","Thân","Tỵ","Ngọ","Dậu","Ngọ","Mùi","Tuất","Mùi",
    "Thân","Hợi","Thân","Dậu","Tý","Dậu","Tuất","Sửu","Tuất","Hợi"
  ],
  "Kim tứ cục": [
    "Hợi","Thìn","Sửu","Dần","Tý","Tỵ","Dần","Mão","Sửu","Ngọ",
    "Mão","Thìn","Dần","Mùi","Thìn","Tỵ","Mão","Thân","Tỵ","Ngọ",
    "Thìn","Dậu","Ngọ","Mùi","Tỵ","Tuất","Mùi","Thân","Ngọ","Hợi"
  ],
  "Thổ ngũ cục": [
    "Ngọ","Hợi","Thìn","Sửu","Dần","Mùi","Tý","Tỵ","Dần","Mão",
    "Thân","Sửu","Ngọ","Mão","Thìn","Dậu","Dần","Mùi","Thìn","Tỵ",
    "Tuất","Mão","Thân","Tỵ","Ngọ","Hợi","Thìn","Dậu","Ngọ","Mùi"
  ],
  "Hỏa lục cục": [
    "Dậu","Ngọ","Hợi","Thìn","Sửu","Dần","Tuất","Mùi","Tý","Tỵ",
    "Dần","Mão","Hợi","Thân","Sửu","Ngọ","Mão","Thìn","Tý","Dậu",
    "Dần","Mùi","Thìn","Tỵ","Sửu","Tuất","Mão","Thân","Tỵ","Ngọ"
  ]
};

/* ==========================================================
   🔸 HÀM TÌM CUNG ĐỐI XỨNG QUA TRỤC DẦN–THÂN
   ========================================================== */
function getPhuTheoTuVi(cungTuVi) {
  const idx = CUNG_THUAN_TUVI.indexOf(cungTuVi) + 1; // 1–12
  if (idx === 1 || idx === 7) return cungTuVi; // Dần hoặc Thân => trùng
  const doiXung = 14 - idx;
  return CUNG_THUAN_TUVI[(doiXung - 1 + 12) % 12];
}

/* ==========================================================
   🔸 HÀM XÁC ĐỊNH TOÀN BỘ VÒNG TỬ VI – THIÊN PHỦ
   ========================================================== */
function xacDinhTuViTuSao() {
  const saoChon = document.getElementById("tuviSelect").value.trim();
  const cungSao = document.getElementById("chinhViTri").value;
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const ketQua = document.getElementById("ketQuaChinhTinh");
  if (!saoChon || !cungSao || !loaiCuc) {
    ketQua.innerHTML = "<i>⚠️ Vui lòng chọn đủ dữ kiện ở phần 1,3,5.</i>";
    return;
  }

  const idxCung = CUNG_THUAN_TUVI.indexOf(cungSao);
  if (idxCung === -1) return;

  let idxTuVi, idxPhu, cungTuVi, cungPhu;

  // 🌟 1️⃣ Nếu sao thuộc vòng TỬ VI → chạy NGHỊCH
  if (PATTERN_TU_VI.includes(saoChon)) {
    const offset = PATTERN_TU_VI.indexOf(saoChon);
    idxTuVi = (idxCung - offset + 12) % 12;
    cungTuVi = CUNG_THUAN_TUVI[idxTuVi];
    cungPhu = getPhuTheoTuVi(cungTuVi); // dùng trục Dần–Thân
    idxPhu = CUNG_THUAN_TUVI.indexOf(cungPhu);
  }

  // 🌟 2️⃣ Nếu sao thuộc vòng THIÊN PHỦ → chạy THUẬN
// 🌟 2️⃣ Nếu sao thuộc vòng THIÊN PHỦ → chạy NGHỊCH (vì tra ngược)
else if (PATTERN_THIEN_PHU.includes(saoChon)) {
  const offset = PATTERN_THIEN_PHU.indexOf(saoChon);
  idxPhu = (idxCung - offset + 12) % 12; // 🔁 lùi thay vì cộng
  cungPhu = CUNG_THUAN_TUVI[idxPhu];
  cungTuVi = getPhuTheoTuVi(cungPhu); // đối xứng trục Dần–Thân
  idxTuVi = CUNG_THUAN_TUVI.indexOf(cungTuVi);
}


  else {
    ketQua.innerHTML = "⚠️ Sao không thuộc chòm Tử Vi – Thiên Phủ.";
    return;
  }



  // 🌟 3️⃣ Tra bảng ngày sinh âm có thể
const arrNgay = BANG_TU_VI_TRA_NGUOC[loaiCuc] || [];
const ngaySinhCoThe = [];
arrNgay.forEach((c, i) => { if (c === cungTuVi) ngaySinhCoThe.push(i + 1); });

window.ngayChinhTinh = ngaySinhCoThe;


// 🌟 4️⃣ An sao cho 12 cung
const chinhTinhTheoCung = Array(12).fill().map(() => []);
PATTERN_TU_VI.forEach((s, i) => {
  if (s) chinhTinhTheoCung[(idxTuVi - i + 12) % 12].push(s);
});
PATTERN_THIEN_PHU.forEach((s, i) => {
  if (s) chinhTinhTheoCung[(idxPhu + i) % 12].push(s);
});

// 🌟 5️⃣ Hiển thị kết quả
let html = `
<p><b>TỬ VI</b> tại <b>${cungTuVi}</b> – <b>THIÊN PHỦ</b> tại <b>${cungPhu}</b><br>
➜ Ngày sinh âm có thể: <b>${ngaySinhCoThe.join(", ") || "?"}</b></p>
<hr style="margin:6px 0;">`;

// 🔹 1️⃣ Lấy vị trí Mệnh thật từ phần 1
const menhThucTe = document.getElementById("ketQuaMenh")?.dataset?.menh || "Dần";
const idxMenhThucTe = CUNG_THUAN.indexOf(menhThucTe);

// 🔹 2️⃣ Tạo thứ tự 12 cung bắt đầu từ Mệnh thật → chạy NGHỊCH chiều kim đồng hồ
const CUNG_HIEN_THI = [];
const CUNG_CHUC_HIEN_THI = [];

for (let i = 0; i < 12; i++) {
  const idx = (idxMenhThucTe + i) % 12;
  CUNG_HIEN_THI.push(CUNG_THUAN[idx]);
}

// 🔹 Cung chức chạy thuận (Mệnh → Phụ → Phúc → Điền → Quan → Nô → Di → Tật → Tài → Tử → Phu → Huynh)
const CUNG_CHUC_THUAN = ["Mệnh","Phụ","Phúc","Điền","Quan","Nô","Di","Tật","Tài","Tử","Phu","Huynh"];
CUNG_CHUC_HIEN_THI.push(...CUNG_CHUC_THUAN);

// 🔹 3️⃣ Ráp sao đúng vị trí hiển thị theo Mệnh thật
const chinhTinhTheoCung_HienThi = CUNG_HIEN_THI.map(cung => {
  const idxGoc = CUNG_THUAN.indexOf(cung);
  return chinhTinhTheoCung[idxGoc];
});

// 🔹 4️⃣ In bảng (Mệnh luôn ở cột đầu)
html += `
<div style="
  font-family:'Times New Roman';
  font-size:15px;
  line-height:1.5;
  text-align:center;
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  border:1px solid #ccc;
  margin-top:6px;
">
  ${CUNG_CHUC_HIEN_THI.map(c=>`<div style='border-bottom:1px solid #ccc;background:#f9f9f9;'>${c}</div>`).join("")}
  ${CUNG_HIEN_THI.map(c=>`<div>${c}</div>`).join("")}
  ${chinhTinhTheoCung_HienThi.map(s=>`<div style='color:#006400'>${s[0]||""}</div>`).join("")}
  ${chinhTinhTheoCung_HienThi.map(s=>`<div style='color:#0033cc'>${s[1]||""}</div>`).join("")}
</div>`;

ketQua.innerHTML = html;


}

// Gắn sự kiện onchange
["tuviSelect","phuSelect","chinhViTri"].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener("change", xacDinhTuViTuSao);
});

// ===========================================================
// 🔹 BẢNG TRA NGƯỢC THÁNG SINH (từ vị trí sao → tháng sinh âm)
// ===========================================================
const BANG_THANG_SINH_SAO = {
  "Tả Phụ":  { "Thìn":1,"Tỵ":2,"Ngọ":3,"Mùi":4,"Thân":5,"Dậu":6,"Tuất":7,"Hợi":8,"Tý":9,"Sửu":10,"Dần":11,"Mão":12 },
  "Hữu Bật": { "Tuất":1,"Dậu":2,"Thân":3,"Mùi":4,"Ngọ":5,"Tỵ":6,"Thìn":7,"Mão":8,"Dần":9,"Sửu":10,"Tý":11,"Hợi":12 },
  "Thiên Hình": { "Dậu":1,"Tuất":2,"Hợi":3,"Tý":4,"Sửu":5,"Dần":6,"Mão":7,"Thìn":8,"Tỵ":9,"Ngọ":10,"Mùi":11,"Thân":12 },
  "Thiên Riêu": { "Sửu":1,"Dần":2,"Mão":3,"Thìn":4,"Tỵ":5,"Ngọ":6,"Mùi":7,"Thân":8,"Dậu":9,"Tuất":10,"Hợi":11,"Tý":12 },
  "Thiên Y":    { "Sửu":1,"Dần":2,"Mão":3,"Thìn":4,"Tỵ":5,"Ngọ":6,"Mùi":7,"Thân":8,"Dậu":9,"Tuất":10,"Hợi":11,"Tý":12 },
  "Thiên Giải": { "Thân":1,"Dậu":2,"Tuất":3,"Hợi":4,"Tý":5,"Sửu":6,"Dần":7,"Mão":8,"Thìn":9,"Tỵ":10,"Ngọ":11,"Mùi":12 },
  "Địa Giải":   { "Mùi":1,"Thân":2,"Dậu":3,"Tuất":4,"Hợi":5,"Tý":6,"Sửu":7,"Dần":8,"Mão":9,"Thìn":10,"Tỵ":11,"Ngọ":12 }
};

// ===========================================================
// 🔹 BẢNG TRA GIỜ SINH (từ tháng + cung Mệnh → Giờ sinh)
// ===========================================================
const BANG_GIO_MENH = {
  1: ["Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão"],
  2: ["Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn"],
  3: ["Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ"],
  4: ["Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ"],
  5: ["Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi"],
  6: ["Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân"],
  7: ["Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu"],
  8: ["Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất"],
  9: ["Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi"],
  10:["Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý"],
  11:["Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu"],
  12:["Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần"]
};
const GIO_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

// ===========================================================
// 🔹 HÀM TRA GIỜ SINH TỪ THÁNG + CUNG MỆNH
// ===========================================================
function timGioSinhTheoMenh(thang, menhCung) {
  const hang = BANG_GIO_MENH[thang];
  if (!hang) return null;
  const idx = hang.indexOf(menhCung);
  return idx >= 0 ? GIO_LIST[idx] : null;
}

// ===========================================================
// 🔹 KHỞI TẠO DROPDOWN & TRA NGƯỢC THÁNG + GIỜ
// ===========================================================
function khoiTaoSaoThang() {
  const selectSao = document.getElementById("saoThangSelect");
  const selectViTri = document.getElementById("saoThangViTri");
  if (!selectSao || !selectViTri) return;

  // Danh sách sao
  const saoList = Object.keys(BANG_THANG_SINH_SAO);
  selectSao.innerHTML = '<option value="">— Chọn Sao —</option>';
  saoList.forEach(s=>{
    const opt=document.createElement("option");
    opt.value=s; opt.textContent=s;
    selectSao.appendChild(opt);
  });

  // Danh sách 12 cung
  const cungList=["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  selectViTri.innerHTML='<option value="">— Chọn Cung —</option>';
  cungList.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c; opt.textContent=c;
    selectViTri.appendChild(opt);
  });

  selectSao.addEventListener("change", xacDinhThangSinhTuSao);
  selectViTri.addEventListener("change", xacDinhThangSinhTuSao);
  console.log("✅ Sự kiện onchange đã được gắn thành công.");
}

// ===========================================================
// 🔹 HÀM XÁC ĐỊNH THÁNG & GIỜ SINH
// ===========================================================
function xacDinhThangSinhTuSao() {
  const sao = document.getElementById("saoThangSelect").value;
  const cung = document.getElementById("saoThangViTri").value;
  const box = document.getElementById("ketQuaThangSinh");
  const menhCung = document.getElementById("ketQuaMenh")?.dataset?.menh || null;

  if (!box) return;
  if (!sao || !cung) {
    box.innerHTML = '<i>⚠️ Vui lòng chọn đủ Tên sao và Vị trí an.</i>';
    return;
  }

  const thang = BANG_THANG_SINH_SAO[sao]?.[cung];
  if (!thang) {
    box.innerHTML = `❌ Sao <b>${sao}</b> an tại <b>${cung}</b> chưa có dữ liệu tháng sinh.`;
    return;
  }

  // Tính giờ sinh (nếu biết cung Mệnh thật)
  let gioSinh = null;
  if (menhCung) {
    gioSinh = timGioSinhTheoMenh(thang, menhCung);
  }

  let html = `✅ Sao <b>${sao}</b> an tại <b>${cung}</b> → 
  <span style="color:#006400;">Tháng sinh âm lịch là <b>tháng ${thang}</b></span>`;

  if (gioSinh)
    html += `<br>🕒 Giờ sinh phù hợp theo Mệnh (${menhCung}) là: <b style="color:#b22222;">Giờ ${gioSinh}</b>`;
  else
    html += `<br><i>⚠️ Chưa xác định được cung Mệnh nên chưa tra được Giờ sinh.</i>`;


// ✅ Lưu biến toàn cục để phần 7 truy cập
window.thangSinhGlobal = thang;
window.gioSinhGlobal = gioSinh;

  box.innerHTML = html;
}

// Gọi khi trang tải xong
window.addEventListener("load", khoiTaoSaoThang);

const CUNG_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
const GIO_CHI   = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

// =======================================================
// 🔹 TẠO DROPDOWN 1 SAO (Ân Quang / Thiên Quý / Tam Thai / Bát Tọa)
// =======================================================
function khoiTaoSaoNgay() {
  const saoSelect = document.getElementById("saoNgaySelect");
  const viTriSelect = document.getElementById("saoNgayViTri");
  if (!saoSelect || !viTriSelect) return;

  saoSelect.innerHTML = `<option value="">— Chọn Sao —</option>
    <option value="An Quang">Ân Quang</option>
    <option value="Thien Quy">Thiên Quý</option>
    <option value="Tam Thai">Tam Thai</option>
    <option value="Bat Toa">Bát Tọa</option>`;

  viTriSelect.innerHTML = `<option value="">— Chọn Cung —</option>`;
  ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"].forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c; opt.textContent=c;
    viTriSelect.appendChild(opt);
  });

  saoSelect.addEventListener("change", traNgayTuMotSao);
  viTriSelect.addEventListener("change", traNgayTuMotSao);
}

function traNgayTuMotSao() {
  const sao = document.getElementById("saoNgaySelect").value;
  const cung = document.getElementById("saoNgayViTri").value;
  const box  = document.getElementById("ketQuaNgaySinh");
  if (!sao || !cung) {
    box.innerHTML = "<i>⚠️ Vui lòng chọn Sao và Vị trí an.</i>";
    return;
  }

  // ✅ Lấy tháng & giờ từ phần 6
  const gioSinh = window.gioSinhGlobal || null;
  const thangSinh = window.thangSinhGlobal || null;
  const menhCung = document.getElementById("ketQuaMenh")?.dataset?.menh || "?";

  if (!gioSinh || !thangSinh) {
    box.innerHTML = "<i>⚠️ Chưa có dữ liệu tháng và giờ sinh (hãy tra Sao theo tháng trước).</i>";
    return;
  }

  // ✅ Chuẩn bị biến toàn cục
  let ketQuaText = "";
  let ngayList = [];   // 👈 khai báo ngay đây để toàn hàm dùng được

  // === ÂN QUANG ===
  if (sao === "An Quang") {
    const CUNG_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const GIO_CHI   = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

    const posTuat = CUNG_TUVI.indexOf("Tuất");
    const gioIndex = GIO_CHI.indexOf(gioSinh);
    const posAnQuang = CUNG_TUVI.indexOf(cung);

    const posVanXuong = (posTuat - gioIndex + 12) % 12;
    const kc = (posAnQuang - posVanXuong + 12) % 12;
    let ngay = kc + 2;
    if (ngay > 12) ngay -= 12;

    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      📅 Sao <b>Ân Quang</b> an tại <b>${cung}</b><br>
      ➜ <span style="color:#006400;">Ngày sinh âm lịch có thể là <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giờ ${gioSinh}, tháng ${thangSinh})</small>
    `;
  }

  // === THIÊN QUÝ ===
  else if (sao === "Thien Quy") {
    const CUNG_THUAN = ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"];
    const GIO_CHI   = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

    const gioIndex = GIO_CHI.indexOf(gioSinh);
    const posThienQuy = CUNG_THUAN.indexOf(cung);
    const posVanKhuc = (CUNG_THUAN.indexOf("Thìn") + gioIndex) % 12;
    const kc = (posVanKhuc - posThienQuy + 12) % 12;
    let ngay = kc + 2;
    if (ngay > 12) ngay -= 12;

    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      📅 Sao <b>Thiên Quý</b> an tại <b>${cung}</b><br>
      ➜ <span style="color:#006400;">Ngày sinh âm lịch có thể là <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giờ ${gioSinh}, tháng ${thangSinh})</small>
    `;
  }

  // === TAM THAI ===
  else if (sao === "Tam Thai") {
    const VONG_TT = ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"];
    const posTaPhu = (VONG_TT.indexOf("Thìn") + (thangSinh - 1)) % 12;
    const posTT = VONG_TT.indexOf(cung);
    const kc = (posTT - posTaPhu + 12) % 12;
    const ngay = kc + 1;
    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      📅 Sao <b>Tam Thai</b> an tại <b>${cung}</b><br>
      ➜ <span style="color:#006400;">Ngày sinh âm lịch có thể là <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giờ ${gioSinh}, tháng ${thangSinh})</small>
    `;
  }

  // === BÁT TỌA ===
  else if (sao === "Bat Toa") {
    const VONG_BT = ["Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu"];
    const posHuuBat = (VONG_BT.indexOf("Tuất") - (thangSinh - 1) + 12*10) % 12;
    const posBT = VONG_BT.indexOf(cung);
    const kc = (posHuuBat - posBT + 12) % 12;
    const ngay = kc + 1;
    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      📅 Sao <b>Bát Tọa</b> an tại <b>${cung}</b><br>
      ➜ <span style="color:#006400;">Ngày sinh âm lịch có thể là <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giờ ${gioSinh}, tháng ${thangSinh})</small>
    `;
  }

  // === Nếu chưa có công thức
  else {
    ketQuaText = `<i>⚠️ Sao ${sao} chưa có công thức tra ngược.</i>`;
  }

  // ✅ In kết quả phần 7
  box.innerHTML = ketQuaText;

  // ✅ Lưu lại danh sách ngày của phần 7
  window.ngayAnQuang = ngayList;

  // ✅ So khớp giao với phần 5 (Chính tinh)
  if (window.ngayChinhTinh && window.ngayChinhTinh.length && window.ngayAnQuang.length) {
    const ngayTrung = window.ngayAnQuang.filter(n => window.ngayChinhTinh.includes(n));
    if (ngayTrung.length > 0) {
      box.innerHTML += `
        <p style="margin-top:6px;">
          🔹 <b>Giao với ngày phần Chính Tinh:</b>
          <b style="color:#007700;">${ngayTrung.join(", ")}</b>
        </p>`;
    } else {
      box.innerHTML += `
        <p style="margin-top:6px;color:#888;">
          ⚠️ Không có ngày trùng giữa phần Chính Tinh và Ân Quang / Thiên Quý.
        </p>`;
    }
	// ✅ Lưu toàn cục để phần tra ngược tổng hợp
window.ngayGiaoChinhTinh = ngayTrung;

  }
}



window.addEventListener("load", khoiTaoSaoNgay);

/* =======================================================
   🔹 KHỞI TẠO DỮ LIỆU & HÀM PHÂN TÍCH
   ======================================================= */
document.addEventListener("DOMContentLoaded", ()=>{
  const CUNG_LIST = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_CHUC = ["Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách","Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu"];
  const CUC_LOAI = ["Thủy nhị cục","Mộc tam cục","Kim tứ cục","Thổ ngũ cục","Hỏa lục cục"];
  const CAN_LIST = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const THAI_TUE = ["Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù","Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"];
  const BAC_SI = ["Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"];
  const TU_VI_HE = ["Tử Vi","Thiên Phủ","Thiên Cơ","Thái Dương","Liêm Trinh","Cự Môn","Thiên Tướng","Thiên Lương","Thất Sát","Vũ Khúc","Tham Lang","Thiên Đồng","Phá Quân","Thái Âm"];
  const PHU_HE = ["Không",...TU_VI_HE];
  const SAO_THANG = ["Tả Phù","Hữu Bật","Thiên Hình","Thiên Riêu","Thiên Y","Thiên Giải","Địa Giải"];
  const SAO_GIO = ["Văn Xương","Văn Khúc","Địa Không","Địa Kiếp","Thai Phụ","Phong Cáo","Linh Tinh","Hỏa Tinh"];
  const SAO_NGAY = ["Ân Quang","Thiên Quý","Tam Thai","Bát Tọa"];

 const CUC_SO_MAP = {
  "Thủy nhị cục": [2,12,22,32,42,52,62,72,82,92,102,112],
  "Mộc tam cục": [3,13,23,33,43,53,63,73,83,93,103,113],
  "Kim tứ cục": [4,14,24,34,44,54,64,74,84,94,104,114],
  "Thổ ngũ cục": [5,15,25,35,45,55,65,75,85,95,105,115],
  "Hỏa lục cục": [6,16,26,36,46,56,66,76,86,96,106,116]
};


  function fillSelect(selId, arr){
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = arr.map(x=>`<option>${x}</option>`).join("");
  }

  // --- Khởi tạo dropdown ---
  fillSelect("cungChucSelect", CUNG_CHUC);
  fillSelect("cungChucViTri", CUNG_LIST);
  fillSelect("thaiTueSelect", THAI_TUE);
  fillSelect("thaiTueViTri", CUNG_LIST);
  fillSelect("cucLoaiSelect", CUC_LOAI);
  fillSelect("cucSoSelect", CUC_SO_MAP["Thủy nhị cục"]);
  fillSelect("cucViTriSelect", CUNG_LIST);
  fillSelect("cucCanSelect", CAN_LIST);
  fillSelect("bacSiSelect", BAC_SI);
  fillSelect("bacSiViTri", CUNG_LIST);
  fillSelect("tuviSelect", TU_VI_HE);
  fillSelect("phuSelect", PHU_HE);
  fillSelect("chinhViTri", CUNG_LIST);
  fillSelect("saoThangSelect", SAO_THANG);
  fillSelect("saoThangViTri", CUNG_LIST);
  fillSelect("saoNgaySelect", SAO_NGAY);
  fillSelect("saoNgayViTri", CUNG_LIST);

  // --- Tự khởi tạo hiển thị mệnh lần đầu ---
  tinhCungMenh();

  // --- Khi đổi loại cục ---
  document.getElementById("cucLoaiSelect").addEventListener("change",(e)=>{
    const loai = e.target.value;
    fillSelect("cucSoSelect", CUC_SO_MAP[loai] || []);
  });

  // --- Chính tinh phụ thuộc chính tinh 1 ---
  window.updateChinhTinhPhu = function(){
    const s1 = document.getElementById("tuviSelect").value;
    const DOI_TINH_MAP = {
      "Tử Vi": ["Thiên Phủ","Thiên Tướng","Thất Sát","Phá Quân","Tham Lang"],
      "Thiên Phủ": ["Tử Vi","Vũ Khúc","Liêm Trinh"],
      "Thái Dương": ["Thái Âm","Cự Môn","Thiên Lương"],
      "Thái Âm": ["Thái Dương","Thiên Cơ","Thiên Đồng"],
      "Liêm Trinh": ["Thất Sát","Thiên Phủ","Tham Lang","Phá Quân","Thiên Tướng"],
      "Vũ Khúc": ["Thiên Tướng","Thiên Phủ","Tham Lang","Thất Sát","Phá Quân"]
    };
    const allowed = ["Không", ...(DOI_TINH_MAP[s1] || [])];
    fillSelect("phuSelect", allowed);
  };

  // =====================================================
  // 🧮 PHÂN TÍCH TRA NGƯỢC LÁ SỐ
  // =====================================================
  document.getElementById("btnPhanTich").addEventListener("click",()=>{
  // 👉 LẤY DỮ LIỆU NĂM SINH TỪ PHẦN 2 VÀ 4
const chiNam = document.getElementById("ketQuaChiNam")?.textContent.split("mệnh:")[0].trim() || "?";
const canNam = (window.ketQuaBacSi?.giaoCan?.[0]) || "?";
const namSinhText = `${canNam} ${chiNam}`;
// =====================================================
// 🔹 QUY ĐỔI CAN CHI → CÁC NĂM DƯƠNG LỊCH (1900–2100)
// =====================================================
const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

// Tạo bảng 60 năm Can Chi
function taoBangCanChi() {
  const danhSach = [];
  let canIndex = 0, chiIndex = 0;
  for (let nam = 1864; nam <= 2100; nam++) { // 1864 = Giáp Tý
    const canChi = CAN[canIndex] + " " + CHI[chiIndex];
    danhSach.push({ nam, canChi });
    canIndex = (canIndex + 1) % 10;
    chiIndex = (chiIndex + 1) % 12;
  }
  return danhSach;
}

const BANG_CAN_CHI = taoBangCanChi();

// Hàm tìm các năm Dương lịch tương ứng
function timNamTheoCanChi(canChi) {
  return BANG_CAN_CHI
    .filter(x => x.canChi === canChi && x.nam >= 1900 && x.nam <= 2100)
    .map(x => x.nam);
}

const namDuongTuongUng = timNamTheoCanChi(namSinhText);

    const cungMenh = cungChucViTri.value;
    const viTriThaiTue = thaiTueViTri.value;
    const loaiCuc = cucLoaiSelect.value;
    const viTriBacSi = bacSiViTri.value;
    const chinh1 = tuviSelect.value;
    const chinh2 = phuSelect.value;
    const viTriChinh = chinhViTri.value;
    const saoThang = saoThangSelect.value, viTriSaoThang = saoThangViTri.value;
    const saoNgay = saoNgaySelect.value, viTriSaoNgay = saoNgayViTri.value;


    const THAI_TUE_CUNG = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const DIA_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
    // 🔹 Ưu tiên lấy giới tính đã tính từ phần 3 (Cục số)
// 🔹 Ưu tiên lấy giới tính đã tính từ phần 3 (Cục số)
let amDuongText = "";
const ketQuaCucText = document.getElementById("ketQuaCuc")?.textContent || "";

// Tách riêng phần giới tính (chỉ lấy cụm Dương/Âm Nam/Nữ)
const matchGioiTinh = ketQuaCucText.match(/(Dương|Âm)\s+(Nam|Nữ)/);
if (matchGioiTinh) {
  amDuongText = `${matchGioiTinh[1]} ${matchGioiTinh[2]}`;
}

// Nếu phần 3 chưa có, lấy dự phòng từ phần 3.1 (Tràng Sinh)
if (!amDuongText) {
  const trangSinhText = document.getElementById("ketQuaTrangSinh")?.textContent || "";

  // Nếu có sẵn Dương/Âm Nam/Nữ thì lấy luôn
  const matchTrangSinh = trangSinhText.match(/(Dương|Âm)\s+(Nam|Nữ)/);
  if (matchTrangSinh) {
    amDuongText = `${matchTrangSinh[1]} ${matchTrangSinh[2]}`;
  } else {
    // Nếu chỉ có "Giới tính: Nam/Nữ" thì suy ra Âm Dương dựa theo chữ "Thuận"/"Nghịch"
    const matchGioiTinh = trangSinhText.match(/Giới\s*tính\s*[:：]?\s*(Nam|Nữ)/i);
    const matchChieu = trangSinhText.match(/(Thuận|Nghịch)/i);
    if (matchGioiTinh) {
      const gioi = matchGioiTinh[1];
      const chieu = matchChieu ? matchChieu[1] : "";
      // ⚙️ Quy tắc chuẩn Tử Vi: Thuận → Dương Nam / Âm Nữ ; Nghịch → Âm Nam / Dương Nữ
      let amDuong = "";
      if (chieu === "Thuận" && gioi === "Nam") amDuong = "Dương";
      else if (chieu === "Thuận" && gioi === "Nữ") amDuong = "Âm";
      else if (chieu === "Nghịch" && gioi === "Nam") amDuong = "Âm";
      else if (chieu === "Nghịch" && gioi === "Nữ") amDuong = "Dương";

      amDuongText = `${amDuong} ${gioi}`.trim();
    }
  }
}




// Nếu vẫn không có, lấy cách cũ theo Âm Dương mệnh
if (!amDuongText) {
  const isDuong = ["Dần","Ngọ","Tuất","Thân","Tý","Thìn"].includes(viTriThaiTue);
  amDuongText = isDuong ? "Dương Nam / Âm Nữ" : "Dương Nữ / Âm Nam";
}



    const CUC_MAP = {
      "Thủy nhị cục":"Thủy Nhị Cục",
      "Mộc tam cục":"Mộc Tam Cục",
      "Kim tứ cục":"Kim Tứ Cục",
      "Thổ ngũ cục":"Thổ Ngũ Cục",
      "Hỏa lục cục":"Hỏa Lục Cục"
    };
    const cucSo = CUC_MAP[loaiCuc] || loaiCuc;

    const LOC_TON_MAP = {
      "Tỵ": ["Bính","Mậu"], "Ngọ": ["Đinh","Kỷ"], "Mùi": ["Canh","Ất"],
      "Thân": ["Tân","Bính"], "Dậu": ["Nhâm","Đinh"], "Tuất": ["Quý","Mậu"],
      "Hợi": ["Giáp","Kỷ"], "Tý": ["Ất","Canh"], "Sửu": ["Bính","Tân"],
      "Dần": ["Đinh","Nhâm"], "Mão": ["Mậu","Quý"], "Thìn": ["Kỷ","Giáp"]
    };

    // TODO: Tính công thức chi tiết Tháng / Ngày / Giờ
  // 🗓️ Lấy tháng sinh & giờ sinh từ phần 6 (nếu đã có)
const thangTuSao = window.thangSinhGlobal || null;
const gioTuSao = window.gioSinhGlobal || null;

let thangSinh = "";
if (thangTuSao) {
  thangSinh = `Tháng sinh âm lịch là <b>tháng ${thangTuSao}</b>`;
} else {
  thangSinh = `Đang tính theo sao tháng (${saoThang || "?"} tại ${viTriSaoThang || "?"})`;
}

// 📅 Lấy ngày sinh từ phần 7 (nếu đã có)
// 📅 Lấy ngày sinh từ phần 7 (nếu đã có)
let ngaySinh = "";
const ngayList = window.ngayAnQuang || [];
const ngayGiao = window.ngayGiaoChinhTinh || [];

if (ngayGiao.length > 0) {
  // Ưu tiên lấy ngày giao vì đây là kết quả chính xác nhất
  ngaySinh = `Ngày âm lịch là <b>${ngayGiao[0]}</b>`;
} else if (ngayList.length > 0) {
  // Nếu chưa có giao thì hiển thị danh sách dự đoán
  ngaySinh = `Ngày âm lịch có thể là ${ngayList.join(", ")}`;
} else {
  ngaySinh = `Đang tính theo sao ngày (${saoNgay || "?"} tại ${viTriSaoNgay || "?"})`;
}

const gioSinh = gioTuSao ? `Giờ ${gioTuSao}` : "?";


  const ketQua = `
📜 KẾT QUẢ TRA NGƯỢC
──────────────────────────────
• Năm sinh: ${namSinhText}
  ↳ Năm Dương lịch tương ứng: ${namDuongTuongUng.join(", ")}
• Giới tính: ${amDuongText}
• Tháng sinh: ${thangSinh}
• Ngày sinh: ${ngaySinh}
• Giờ sinh: ${gioSinh}
──────────────────────────────`;
document.getElementById("traNguocKetQua").innerHTML = ketQua;

  });
});

/* =====================================================
   📅 PHẦN 5: BẢNG KHỞI THÁNG & CHI TIẾT THÁNG ÂM
   -----------------------------------------------------
   - Dropdown năm có thể cuộn, gõ
   - Mặc định hiển thị năm 2025 khi mở trang
   ===================================================== */

// 🧭 Khởi tạo dropdown năm (1900–2100)
function initYearDropdown() {
  const sel = document.getElementById("monthYear");
  sel.innerHTML = "";
  for (let y = 1900; y <= 2100; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === 2025) opt.selected = true; // 🟢 Năm mặc định
    sel.appendChild(opt);
  }
}

// 🟢 Khi đổi năm → cập nhật bảng
function updateMonthTable() {
  const nam = parseInt(document.getElementById("monthYear").value);
  if (!isNaN(nam)) createMonthTable(nam);
}

// ===== BẢNG KHỞI THÁNG =====
function createMonthTable(nam) {
  const canChiNam = canChiYear(nam);
  const [can] = canChiNam.split(" ");
  const leap = getLeapMonthOfYear(nam, TZ);

  document.getElementById("canChiLabel").textContent = "Năm: " + canChiNam;

  const header = ["<tr><th>Tháng</th>"];
  const start  = ["<tr><td>Khởi</td>"];
  const cc     = ["<tr><td>Can Chi</td>"];

  function add(thang, isLeap) {
    const s = convertLunarToSolar(1, thang, nam, isLeap, TZ);
    if (!s || s[0] === 0) return;
    const cT = CAN_THANG[can][thang - 1];
    const ch = CHI[(thang + 1) % 12];
    const lb = isLeap ? `${thang} (nhuận)` : thang;
    header.push(`<th style="cursor:pointer;">${lb}</th>`);
    start.push(`<td>${s[0]}/${s[1]}</td>`);
    cc.push(`<td>${cT} ${ch}</td>`);
  }

  for (let i = 1; i <= 12; i++) {
    add(i, 0);
    if (i === leap) add(i, 1);
  }

  document.getElementById("monthTableContainer").innerHTML = `
    <table id="monthTable"
           style="width:100%;border-collapse:collapse;text-align:center;border:1px solid #000;">
      ${header.join("")}
      ${start.join("")}
      ${cc.join("")}
    </table>
  `;

  attachMonthClick(nam);
}

// ===== XỬ LÝ CLICK TRÊN BẢNG =====
function attachMonthClick(nam) {
  const table = document.getElementById("monthTable");
  if (!table) return;
  const headers = table.querySelectorAll("th:not(:first-child)");
  headers.forEach((h) => {
    h.addEventListener("click", () => {
      table.querySelectorAll("td,th").forEach(td => td.style.background = "#fff");
      const colIndex = h.cellIndex;
      const rows = table.rows;
      for (let r = 0; r < rows.length; r++) {
        const cell = rows[r].cells[colIndex];
        if (cell) cell.style.background = "#fdd";
      }
      const text = h.textContent.trim();
      const match = text.match(/^(\d+)(?:\s*\(nhuận\))?$/);
      if (!match) return;
      const thang = parseInt(match[1]);
      const isLeap = text.includes("nhuận") ? 1 : 0;
      showMonthDetail(thang, nam, isLeap);
    });
  });
}

// ===== HIỂN THỊ CHI TIẾT TỪNG THÁNG =====
function showMonthDetail(thang, nam, isLeap = 0) {
  const canChiNam = canChiYear(nam);

  // 🪶 Tính Can Chi tháng
  const [canNam] = canChiNam.split(" ");
  const cT = CAN_THANG[canNam][thang - 1];
  const chiThang = CHI[(thang + 1) % 12];
  const canChiThang = `${cT} ${chiThang}`;

  // 🪶 Tiêu đề có thêm Can Chi tháng
  let html = `
    <h3 style="text-align:center;margin:10px 0;">
      Chi tiết tháng ${thang}${isLeap ? " (nhuận)" : ""} – Tháng ${canChiThang} – ${canChiNam} (${nam})
    </h3>
    <table style="width:100%;border-collapse:collapse;text-align:center;">
  `;

  let dRow = "<tr><th>Ngày</th>";
  let sRow = "<tr><th>Dương</th>";
  let cRow = "<tr><th>Can Chi</th>";

  let a11 = getLunarMonth11(nam - 1, TZ);
  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = thang - 11;
  if (off < 0) off += 12;

  if (getLunarMonth11(nam + 1, TZ) - a11 > 365) {
    let leapOff = getLeapMonthOffset(a11, TZ);
    if (isLeap !== 0 || off >= leapOff) off += 1;
  }

  const mStart = getNewMoonDay(k + off, TZ);
  const mNext = getNewMoonDay(k + off + 1, TZ);
  const days = mNext - mStart;

  // 🧮 Duyệt từng ngày trong tháng
  for (let d = 1; d <= days; d++) {
    const s = convertLunarToSolar(d, thang, nam, isLeap, TZ);
    const ccD = canChiDay(s[2], s[1], s[0]);

    dRow += `<td style="border:1px solid #000;color:#c00;font-weight:bold;">${d}</td>`;
    sRow += `<td style="border:1px solid #000;">${s[0]}/${s[1]}</td>`;
    cRow += `<td style="border:1px solid #000;">${ccD}</td>`;

    if (d % 10 === 0 || d === days) {
      dRow += "</tr>"; sRow += "</tr>"; cRow += "</tr>";
      html += dRow + sRow + cRow;
      dRow = "<tr><th>Ngày</th>"; 
      sRow = "<tr><th>Dương</th>"; 
      cRow = "<tr><th>Can Chi</th>";
    }
  }

  html += "</table>";
  document.getElementById("monthDetail").innerHTML = html;

  // 🎯 Cho phép click chọn ngày → tô đỏ 3 ô cùng cột
  const table = document.querySelector("#monthDetail table");
  if (table) {
    const cells = table.querySelectorAll("td");
    cells.forEach(cell => {

      cell.addEventListener("click", () => {
        table.querySelectorAll("td").forEach(td => td.style.background = "#fff");
        const colIndex = cell.cellIndex;
        const rowIndex = cell.parentElement.rowIndex;
        const groupStart = Math.floor(rowIndex / 3) * 3;
        for (let r = groupStart; r < groupStart + 3 && r < table.rows.length; r++) {
          const target = table.rows[r].cells[colIndex];
          if (target) target.style.background = "#fdd";
        }
      });
    });
  }
}


// ===== TẠO DROPDOWN NĂM VÀ TỰ HIỂN THỊ MẶC ĐỊNH =====
function initYearDropdown() {
  const container = document.getElementById("monthYear");
  if (!container) return;

  // Tạo dropdown nếu chưa có
  const select = document.createElement("select");
  select.id = "yearSelect";
  select.style.width = "100px";
  select.style.fontSize = "14px";
  select.style.textAlign = "center";
  select.style.height = "22px";
  select.innerHTML = Array.from({ length: 300 }, (_, i) => {
    const y = 1900 + i;
    return `<option value="${y}" ${y === 2025 ? "selected" : ""}>${y}</option>`;
  }).join("");

  container.replaceWith(select);

  // Khi đổi năm → cập nhật Can Chi và tạo lại bảng
  select.addEventListener("input", () => {
    const year = parseInt(select.value);
    const canChi = canChiYear(year);
    document.getElementById("canChiLabel").textContent = `Năm: ${canChi}`;
    createMonthTable(year);
  });

  // Gọi mặc định năm 2025
  const canChi = canChiYear(2025);
  document.getElementById("canChiLabel").textContent = `Năm: ${canChi}`;
  createMonthTable(2025);
}

// 🚀 Khi tải trang
document.addEventListener("DOMContentLoaded", () => {
  initYearDropdown();
});











// =====================================================
// 🌟 LỚP 1 – VỊ TRÍ CUNG (phiên bản chuẩn theo layout mới)
// -----------------------------------------------------
function anLop1_ViTriCung(data) {
  const CAN_THANG = {
    "Giáp":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
    "Ất":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
    "Bính":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
    "Đinh":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
    "Mậu":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"],
    "Kỷ":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
    "Canh":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
    "Tân":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
    "Nhâm":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
    "Quý":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"]
  };

  // Lấy Thiên Can năm sinh
  const canNam = data.canChiNam.split(" ")[0];
  const canThangList = CAN_THANG[canNam] || CAN_THANG["Giáp"];

  // 🔹 Bản đồ vòng 12 cung (chuẩn bạn xác nhận)
  const cungMap = [
    { cell: 9,  chi: "Dần",  idx: 0 },
    { cell: 7,  chi: "Mão",  idx: 1 },
    { cell: 5,  chi: "Thìn", idx: 2 },
    { cell: 1,  chi: "Tỵ",   idx: 3 },
    { cell: 2,  chi: "Ngọ",  idx: 4 },
    { cell: 3,  chi: "Mùi",  idx: 5 },
    { cell: 4,  chi: "Thân", idx: 6 },
    { cell: 6,  chi: "Dậu",  idx: 7 },
    { cell: 8,  chi: "Tuất", idx: 8 },
    { cell: 12, chi: "Hợi",  idx: 9 },
    { cell: 11, chi: "Tý",   idx: 10 },
    { cell: 10, chi: "Sửu",  idx: 11 }
  ];

  // 🔹 Gán dữ liệu (tháng 1 = Dần)
  cungMap.forEach(c => {
    const can = canThangList[c.idx];
    const vietTat = (can ? can[0] : "?") + ". " + c.chi;

    const cell = document.getElementById("cell" + c.cell);
    if (cell) {
      const layer = cell.querySelector(".layer-1");
      if (layer) layer.innerHTML = vietTat;
    }
  });
}
const CUNG_TO_CELL = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };
// =====================================================
// 🌟 LỚP 2 – MỆNH (Tự động an theo tháng âm & giờ sinh, có hỗ trợ <THÂN>)
// -----------------------------------------------------
function anLop2_Menh(data) {
  const CUNG_CHUC = [
    "MỆNH","HUYNH ĐỆ","PHU THÊ","TỬ TỨC","TÀI BẠCH","TẬT ÁCH",
    "THIÊN DI","NÔ BỘC","QUAN LỘC","ĐIỀN TRẠCH","PHÚC ĐỨC","PHỤ MẪU"
  ];
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  const thangAm = parseInt(data.lunar[1]);
  const gioChi = data.canChiGio?.split(" ")[1];
  if (!gioChi) return;

  const idxThang = (thangAm - 1) % 12;
  const idxGio = GIO_CHI.indexOf(gioChi);
  if (idxGio === -1) return;

  const idxMenh = (idxThang - idxGio + 12) % 12;
  const cungMenh = CUNG_THUAN[idxMenh];

  const cungChucMap = {};
  for (let i = 0; i < 12; i++) {
    const idx = (idxMenh - i + 12) % 12;
    cungChucMap[CUNG_THUAN[idx]] = CUNG_CHUC[i];
  }

  

  // ✅ Không dùng innerHTML — chỉ cập nhật hoặc thêm phần tử con
  Object.entries(cungChucMap).forEach(([tenCung, tenChuc]) => {
    const cell = document.getElementById("cell" + CUNG_TO_CELL[tenCung]);
    if (!cell) return;

    let layer2 = cell.querySelector(".layer-2");
    if (!layer2) {
      layer2 = document.createElement("div");
      layer2.className = "layer-2";
      cell.appendChild(layer2);
    }

    // Giữ nguyên DOM, chỉ cập nhật text nếu cần
    let tenEl = layer2.querySelector(".ten-cung");
    if (!tenEl) {
      tenEl = document.createElement("div");
      tenEl.className = "ten-cung";
      layer2.appendChild(tenEl);
    }
    tenEl.textContent = tenChuc;
// thêm định danh để tra cứu
tenEl.setAttribute("data-sao", tenChuc);
tenEl.style.pointerEvents = "auto";
tenEl.style.cursor = "pointer";





// 🟢 tô màu tên cung theo hành của cung
const hanh = nguHanhCuaCung(tenCung);
const colorByHanh = {
  "Hỏa": "#ff4d4d",
  "Thổ": "#e69500",
  "Mộc": "#007a29",
  "Kim": "#000000",
  "Thủy": "#004cff"
}[hanh] || "#000";



tenEl.style.color = colorByHanh;

    // Cập nhật style
    Object.assign(layer2.style, {
      zIndex: "10",
      position: "absolute",
      top: "2px",
      left: "0",
      width: "100%",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "13px",
      color: "#000",
      pointerEvents: "none",
    });
  });

  // ✅ Ghi lại map để an Thân sau này
  window.dataGlobal.cungChucMap = cungChucMap;
window.dataGlobal.tenCungMenh = cungMenh;

   return cungChucMap;

}







// =====================================================
// 🌟 AN CUNG THÂN – Theo 6 quy tắc giờ sinh
// -----------------------------------------------------
function xacDinhCungThan(gioChi, cungChucMap) {
  const quyTac = {
    "Tý": "MỆNH", "Ngọ": "MỆNH",
    "Dần": "QUAN LỘC", "Thân": "QUAN LỘC",
    "Tuất": "TÀI BẠCH", "Thìn": "TÀI BẠCH",
    "Sửu": "PHÚC ĐỨC", "Mùi": "PHÚC ĐỨC",
    "Tỵ": "PHU THÊ", "Hợi": "PHU THÊ",
    "Mão": "THIÊN DI", "Dậu": "THIÊN DI"
  };
  const tenCung = quyTac[gioChi];
  if (!tenCung) return null;
  const chi = Object.keys(cungChucMap || {}).find(k => cungChucMap[k] === tenCung);
  return chi || null;
}

function anThan(data, cungMap) {
  const gioChi = (data.canChiGio || "").split(" ")[1];
  if (!gioChi) return;

  const cungThan = xacDinhCungThan(gioChi, cungMap);
  if (!cungThan) return;

  const CUNG_TO_CELL = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };

  const cell = document.getElementById("cell" + CUNG_TO_CELL[cungThan]);
  if (!cell) return;

  const layer2 = cell.querySelector(".layer-2");
  if (!layer2) return;

  // Không ghi đè nội dung, chỉ thêm 1 span
  if (!layer2.querySelector(".than-label")) {
    const span = document.createElement("span");
   span.className = "than-label";
span.textContent = " <THÂN>";
span.setAttribute("data-sao", "An Thân");
span.style.pointerEvents = "auto";
span.style.cursor = "pointer";

    span.style.fontWeight = "700";
    span.style.color = layer2.style.color || "#000";
    span.style.marginLeft = "3px";
    span.style.letterSpacing = "0.3px";
    layer2.appendChild(span);
  }
}






// 🌟 Hàm xác định Cục Số chuẩn theo Can Năm & Cung Mệnh
function xacDinhCucSo(canChiNam, cungMenh) {
 window.CUC_SO_TINH_ROI = null;


  const can = (canChiNam || "")
    .normalize("NFC")
    .replace(/[ \s]+/g, " ")
    .trim()
    .split(" ")[0]
    .replace(/[^A-Za-zÀ-ỹĐđ]/g, "");

  const chi = (typeof cungMenh === "string") ? cungMenh.trim() : "";

  const bangCuc = {
    "Giáp": { "Tý-Sửu": "Thủy nhị cục", "Dần-Mão": "Hỏa lục cục", "Thìn-Tỵ": "Mộc tam cục", "Ngọ-Mùi": "Thổ ngũ cục", "Thân-Dậu": "Kim tứ cục", "Tuất-Hợi": "Hỏa lục cục" },
    "Kỷ":   { "Tý-Sửu": "Thủy nhị cục", "Dần-Mão": "Hỏa lục cục", "Thìn-Tỵ": "Mộc tam cục", "Ngọ-Mùi": "Thổ ngũ cục", "Thân-Dậu": "Kim tứ cục", "Tuất-Hợi": "Hỏa lục cục" },
    "Ất":   { "Tý-Sửu": "Hỏa lục cục", "Dần-Mão": "Thổ ngũ cục", "Thìn-Tỵ": "Kim tứ cục", "Ngọ-Mùi": "Mộc tam cục", "Thân-Dậu": "Thủy nhị cục", "Tuất-Hợi": "Thổ ngũ cục" },
    "Canh": { "Tý-Sửu": "Hỏa lục cục", "Dần-Mão": "Thổ ngũ cục", "Thìn-Tỵ": "Kim tứ cục", "Ngọ-Mùi": "Mộc tam cục", "Thân-Dậu": "Thủy nhị cục", "Tuất-Hợi": "Thổ ngũ cục" },
    "Bính": { "Tý-Sửu": "Thổ ngũ cục", "Dần-Mão": "Mộc tam cục", "Thìn-Tỵ": "Thủy nhị cục", "Ngọ-Mùi": "Kim tứ cục", "Thân-Dậu": "Hỏa lục cục", "Tuất-Hợi": "Mộc tam cục" },
    "Tân":  { "Tý-Sửu": "Thổ ngũ cục", "Dần-Mão": "Mộc tam cục", "Thìn-Tỵ": "Thủy nhị cục", "Ngọ-Mùi": "Kim tứ cục", "Thân-Dậu": "Hỏa lục cục", "Tuất-Hợi": "Mộc tam cục" },
    "Đinh": { "Tý-Sửu": "Mộc tam cục", "Dần-Mão": "Kim tứ cục", "Thìn-Tỵ": "Hỏa lục cục", "Ngọ-Mùi": "Thủy nhị cục", "Thân-Dậu": "Thổ ngũ cục", "Tuất-Hợi": "Kim tứ cục" },
    "Nhâm": { "Tý-Sửu": "Mộc tam cục", "Dần-Mão": "Kim tứ cục", "Thìn-Tỵ": "Hỏa lục cục", "Ngọ-Mùi": "Thủy nhị cục", "Thân-Dậu": "Thổ ngũ cục", "Tuất-Hợi": "Kim tứ cục" },
    "Mậu":  { "Tý-Sửu": "Kim tứ cục", "Dần-Mão": "Thủy nhị cục", "Thìn-Tỵ": "Thổ ngũ cục", "Ngọ-Mùi": "Hỏa lục cục", "Thân-Dậu": "Mộc tam cục", "Tuất-Hợi": "Thủy nhị cục" },
    "Quý":  { "Tý-Sửu": "Kim tứ cục", "Dần-Mão": "Thủy nhị cục", "Thìn-Tỵ": "Thổ ngũ cục", "Ngọ-Mùi": "Hỏa lục cục", "Thân-Dậu": "Mộc tam cục", "Tuất-Hợi": "Thủy nhị cục" }
  };

  const nhomCung = {
    "Tý": "Tý-Sửu", "Sửu": "Tý-Sửu",
    "Dần": "Dần-Mão", "Mão": "Dần-Mão",
    "Thìn": "Thìn-Tỵ", "Tỵ": "Thìn-Tỵ",
    "Ngọ": "Ngọ-Mùi", "Mùi": "Ngọ-Mùi",
    "Thân": "Thân-Dậu", "Dậu": "Thân-Dậu",
    "Tuất": "Tuất-Hợi", "Hợi": "Tuất-Hợi"
  };

  const nhom = nhomCung[chi];
  const cuc = bangCuc[can]?.[nhom] || "";

  console.log(`🌀 Cục số xác định: ${canChiNam} – ${cungMenh} → ${cuc}`);
  window.CUC_SO_TINH_ROI = cuc; // ✅ lưu kết quả để lần sau bỏ qua
  return cuc;
}


// =====================================================
// 🌟 DỮ LIỆU HỖ TRỢ CHO LỚP 3 – CHÍNH TINH
// -----------------------------------------------------

// 1️⃣ Bảng tra Cung Tử Vi theo Cục và Ngày sinh (chuẩn theo quy tắc bạn đưa)
const BANG_TU_VI = {
  "Thủy nhị cục": [
    "Sửu","Dần","Dần","Mão","Mão","Thìn","Thìn","Tỵ","Tỵ","Ngọ",
    "Ngọ","Mùi","Mùi","Thân","Thân","Dậu","Dậu","Tuất","Tuất","Hợi",
    "Hợi","Tý","Tý","Sửu","Sửu","Dần","Dần","Mão","Mão","Thìn"
  ],

  "Mộc tam cục": [
    "Thìn","Sửu","Dần","Tỵ","Dần","Mão","Ngọ","Mão","Thìn","Mùi",
    "Thìn","Tỵ","Thân","Tỵ","Ngọ","Dậu","Ngọ","Mùi","Tuất","Mùi",
    "Thân","Hợi","Thân","Dậu","Tý","Dậu","Tuất","Sửu","Tuất","Hợi"
  ],

  "Kim tứ cục": [
    "Hợi","Thìn","Sửu","Dần","Tý","Tỵ","Dần","Mão","Sửu","Ngọ",
    "Mão","Thìn","Dần","Mùi","Thìn","Tỵ","Mão","Thân","Tỵ","Ngọ",
    "Thìn","Dậu","Ngọ","Mùi","Tỵ","Tuất","Mùi","Thân","Ngọ","Hợi"
  ],

  "Thổ ngũ cục": [
    "Ngọ","Hợi","Thìn","Sửu","Dần","Mùi","Tý","Tỵ","Dần","Mão",
    "Thân","Sửu","Ngọ","Mão","Thìn","Dậu","Dần","Mùi","Thìn","Tỵ",
    "Tuất","Mão","Thân","Tỵ","Ngọ","Hợi","Thìn","Dậu","Ngọ","Mùi"
  ],

  "Hỏa lục cục": [
    "Dậu","Ngọ","Hợi","Thìn","Sửu","Dần","Tuất","Mùi","Tý","Tỵ",
    "Dần","Mão","Hợi","Thân","Sửu","Ngọ","Mão","Thìn","Tý","Dậu",
    "Dần","Mùi","Thìn","Tỵ","Sửu","Tuất","Mão","Thân","Tỵ","Ngọ"
  ]
};

// 2️⃣ Cặp Tử Vi – Thiên Phủ (theo trục Dần–Thân, không phải đối cung)
const CAP_TU_VI_PHU = {
  "Dần": "Dần", "Mão": "Sửu", "Thìn": "Tý", "Tỵ": "Hợi",
  "Ngọ": "Tuất", "Mùi": "Dậu", "Thân": "Thân", "Dậu": "Mùi",
  "Tuất": "Ngọ", "Hợi": "Tỵ", "Tý": "Thìn", "Sửu": "Mão"
};

// 3️⃣ Màu sắc theo hành Chính Tinh
const HANH_CHINH_TINH = {
  // 🟠 Thổ
  "TỬ VI": "#e69500", "THIÊN PHỦ": "#e69500",
  // 🌿 Mộc
  "THIÊN CƠ": "#007a29", "THIÊN LƯƠNG": "#007a29",
  // 🔥 Hỏa
  "LIÊM TRINH": "#ff4d4d", "THÁI DƯƠNG": "#ff4d4d",
  // 💧 Thủy
  "CỰ MÔN": "#004cff", "THIÊN TƯỚNG": "#004cff",
  "PHÁ QUÂN": "#004cff", "THIÊN ĐỒNG": "#004cff",
  "THÁI ÂM": "#004cff", "THAM LANG": "#004cff",
  // ⚫ Kim
  "THẤT SÁT": "#000000", "VŨ KHÚC": "#000000"
};



// Cho phép dùng chung ở các phần khác (VD: tra ngược)
window.BANG_TU_VI = BANG_TU_VI;
window.CAP_TU_VI_PHU = CAP_TU_VI_PHU;


// =====================================================
// 🌟 LỚP 3 – CHÍNH TINH (DEBUG FULL, HỖ TRỢ lunar dạng mảng + object)
// -----------------------------------------------------
function anLop3_ChinhTinh(data) {
    console.log("🔵 [CT] Bắt đầu AN CHÍNH TINH...");
    console.log("🔵 [CT] data.lunar:", data.lunar);
    console.log("🔵 [CT] data.cucSo:", data.cucSo);

    // Nếu đang gọi lại do các lớp khác → KHÔNG RESET
if (window.__DANG_AN_LOP3__) {
        console.warn("⛔ anLop3 đang chạy → bỏ qua yêu cầu lặp");
        return;
    }

    window.__DANG_AN_LOP3__ = true;
    console.log("🔵 [CT] Bắt đầu AN CHÍNH TINH...");

    // Reset map đúng chỗ (chỉ lần đầu)
    window.saoToCung = {};
    // 🔍 Hỗ trợ cả 2 dạng:
    //  - data.lunar = [ngay, thang]
    //  - data.lunar = { ngay: x, thang: y }
    let ngayAmRaw = 0;
    if (Array.isArray(data.lunar)) {
        ngayAmRaw = data.lunar[0];
    } else if (data.lunar && typeof data.lunar === "object") {
        ngayAmRaw = data.lunar.ngay;
    }
    const ngayAm = parseInt(ngayAmRaw, 10);
    console.log("🟣 [CT] ngayAm =", ngayAm);

    let cucSo = data.cucSo?.trim();
    console.log("🟣 [CT] cucSo =", cucSo);

    // 🔄 Fallback nếu chưa có Cục số
    if ((!cucSo || cucSo === "") && typeof xacDinhCucSo === "function") {
        const tenMenh = data.tenCungMenh || window.dataGlobal?.tenCungMenh || "";
        cucSo = xacDinhCucSo(data.canChiNam, tenMenh);
        data.cucSo = cucSo;
        window.dataGlobal.cucSo = cucSo;
        console.log("🌀 [CT] Bổ sung Cục Số:", cucSo);
    }

    if (!cucSo || !BANG_TU_VI[cucSo]) {
        console.warn("❌ [CT] Không tìm thấy bảng TỬ VI cho cục số:", cucSo);
        window.__DANG_AN_LOP3__ = false;
        return;
    }

    // 🧹 Dọn toàn bộ layer-3 trước khi an lại để tránh trùng sao
    document.querySelectorAll(".layer-3").forEach(el => el.innerHTML = "");

    const cungTuVi = BANG_TU_VI[cucSo][ngayAm - 1];
    console.log("🟣 [CT] cung Tử Vi =", cungTuVi);

    if (!cungTuVi) {
        console.warn("❌ [CT] cung Tử Vi không hợp lệ!");
        return;
    }

    const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const CUNG_TO_CELL = {
        "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,
        "Thìn":5,"Dậu":6,"Mão":7,"Tuất":8,
        "Dần":9,"Sửu":10,"Tý":11,"Hợi":12
    };

    const idxTuVi = CUNG_THUAN.indexOf(cungTuVi);
    console.log("🟣 [CT] idxTuVi =", idxTuVi);

    if (idxTuVi === -1) {
        console.warn("❌ [CT] Không tìm thấy index cungTuVi trong CUNG_THUAN");
        return;
    }

    const cungThienPhu = CAP_TU_VI_PHU[cungTuVi];
    console.log("🟣 [CT] cung Thiên Phủ =", cungThienPhu);

    const idxThienPhu = CUNG_THUAN.indexOf(cungThienPhu);
    console.log("🟣 [CT] idxThienPhu =", idxThienPhu);

    if (idxThienPhu === -1) {
        console.warn("❌ [CT] Không tìm thấy index cung Thiên Phủ");
        return;
    }

    const PATTERN_TU_VI = [
        "Tử Vi","Thiên Cơ",null,"Thái Dương","Vũ Khúc","Thiên Đồng",
        null,null,"Liêm Trinh",null,null,null
    ];

    const PATTERN_THIEN_PHU = [
        "Thiên Phủ","Thái Âm","Tham Lang","Cự Môn","Thiên Tướng",
        "Thiên Lương","Thất Sát",null,null,null,"Phá Quân",null
    ];

    function getIndexNgich(start, step) { return (start - step + 12) % 12; }
    function getIndexThuan(start, step) { return (start + step) % 12; }

function addStarToCung(tenCung, tenSao) {
    console.log("📌 ADD:", tenSao, "→", tenCung);

    const cellID = "cell" + CUNG_TO_CELL[tenCung];
    const cell = document.getElementById(cellID);
    if (!cell) return console.warn("   ❌ Không tìm thấy cell:", cellID);

    let layer3 = cell.querySelector(".layer-3");
    if (!layer3) {
        layer3 = document.createElement("div");
        layer3.className = "layer-3";
        cell.appendChild(layer3);
    }

    const divSao = document.createElement("div");
    divSao.textContent = tenSao.toUpperCase();
    divSao.style.textAlign = "center";
    divSao.style.fontSize = "15px";
    divSao.style.fontWeight = "bold";

    // 🎨 MÀU NGŨ HÀNH
    const mau = HANH_CHINH_TINH[tenSao.toUpperCase()];
    if (mau) divSao.style.color = mau;

    // 🔑 KEY – dùng nguyên tên sao làm key
    const keySao = tenSao; // "Thiên Đồng", "Tử Vi", ...
    window.saoToCung[keySao] = tenCung;
    console.log("✅ MAP SAO:", keySao, "→", tenCung);

    // ⭐⭐ CLICK SAO MỞ POPUP
    divSao.setAttribute("data-sao", tenSao);
    divSao.style.cursor = "pointer";
    divSao.style.pointerEvents = "auto";

    divSao.addEventListener("click", () => {
        if (typeof showStarInfo === "function") {
            showStarInfo(tenSao, tenCung);
        }

    });

    layer3.appendChild(divSao);
    window.__DANG_AN_LOP3__ = false;
    console.log("🟢 [CT] ⭐ HOÀN TẤT AN LỚP 3 – CHÍNH TINH");
}




    // 🌟 An chòm TỬ VI (ngược)
    console.log("🔶 [CT] Bắt đầu an chòm TỬ VI…");
    for (let i = 0; i < PATTERN_TU_VI.length; i++) {
        const sao = PATTERN_TU_VI[i];
        if (!sao) continue;
        const idxTarget = getIndexNgich(idxTuVi, i);
        console.log(`   Tử Vi step=${i}, idxTarget=${idxTarget}, cung=${CUNG_THUAN[idxTarget]}`);
console.log(`⭐️ AT STEP ${i}:`, sao, "→", CUNG_THUAN[idxTarget]);

        addStarToCung(CUNG_THUAN[idxTarget], sao);
    }

    // 🌟 An chòm THIÊN PHỦ (thuận)
    console.log("🔶 [CT] Bắt đầu an chòm THIÊN PHỦ…");
    for (let i = 0; i < PATTERN_THIEN_PHU.length; i++) {
        const sao = PATTERN_THIEN_PHU[i];
        if (!sao) continue;
        const idxTarget = getIndexThuan(idxThienPhu, i);
        console.log(`   Thiên Phủ step=${i}, idxTarget=${idxTarget}, cung=${CUNG_THUAN[idxTarget]}`);
        addStarToCung(CUNG_THUAN[idxTarget], sao);
    }

    console.log("🟢 [CT] ⭐ HOÀN TẤT AN LỚP 3 – CHÍNH TINH");
    console.log("🟢 [CT] saoToCung =", JSON.stringify(window.saoToCung, null, 2));
console.log("🚨 SAO BỊ MẤT:", [
 "Tử Vi","Thiên Cơ","Thái Dương","Vũ Khúc","Thiên Đồng",
 "Liêm Trinh","Tham Lang","Cự Môn","Thiên Tướng",
 "Thiên Lương","Thất Sát","Phá Quân","Thiên Phủ","Thái Âm"
].filter(s => !window.saoToCung[s]));

}





















// =====================================================
// 🌟 LỚP 4 – CỤC SỐ (theo công thức truyền thống, hiển thị đầy đủ 12 cung)
// -----------------------------------------------------
function anLop4_CucSo(data) {
if (!data.tenCungMenh || typeof data.tenCungMenh !== "string") {
  console.warn("⚠️ anLop4_CucSo bị gọi khi chưa có tenCungMenh, dừng lại.");
  return;
}

  // 🧹 Dọn lớp Cục Số cũ
  document.querySelectorAll('.layer-4').forEach(el => el.remove());

  // ⚙️ Kiểm tra dữ liệu đầu vào
  if (!data || !data.cucSo) {
    console.warn("⚠️ Thiếu dữ liệu Cục Số, bỏ qua.");
    return;
  }

  // 🌟 Xác định tên cung Mệnh (đảm bảo là chuỗi, không phải object)
let cungMenh = data.tenCungMenh;

// 🔹 Nếu chưa có hoặc là object, lấy từ map {Tý:'MỆNH',...}
if (!cungMenh && typeof data.cungMenh === "object") {
  const keys = Object.keys(data.cungMenh);
  // Ưu tiên key có giá trị "MỆNH", nếu không có thì lấy key đầu tiên
  const found = keys.find(k => data.cungMenh[k] === "MỆNH");
  cungMenh = found || keys[0];
}

// 🔹 Ép kiểu thành chuỗi phòng trường hợp là object / null
if (typeof cungMenh !== "string") {
  try {
    cungMenh = String(cungMenh);
  } catch {
    cungMenh = "";
  }
}

// 🚨 Nếu vẫn không xác định được thì dừng
if (!cungMenh) {
  console.warn("⚠️ Không xác định được Cung Mệnh để an Cục Số");
  return;
}

// =====================================================
// ✅ Tính và lưu Cục Số đúng chuẩn (ưu tiên data.tenCungMenh thật)
// -----------------------------------------------------
const tenMenh = (data.tenCungMenh && typeof data.tenCungMenh === "string")
  ? data.tenCungMenh.trim()
  : (typeof cungMenh === "string" ? cungMenh.trim() : "");

// 🔹 Luôn đồng bộ lại giá trị Cục Số chuẩn
const ketQuaCuc = xacDinhCucSo(data.canChiNam, tenMenh);
data.cucSo = ketQuaCuc;
window.dataGlobal.cucSo = ketQuaCuc;
console.log(`✅ anLop4_CucSo() sử dụng Cục Số CHUẨN: ${data.canChiNam} – ${tenMenh} → ${ketQuaCuc}`);




  // 🌟 Bảng quy chiếu cung & vị trí
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,
    "Thìn":5,"Dậu":6,"Mão":7,"Tuất":8,
    "Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };

  // 🌟 Giá trị khởi đầu của từng loại cục
  const CUC_SO_START = {
    "Thủy nhị cục": 2,
    "Mộc tam cục": 3,
    "Kim tứ cục": 4,
    "Thổ ngũ cục": 5,
    "Hỏa lục cục": 6
  };

    const baseCuc = CUC_SO_START[data.cucSo];
  if (!baseCuc) {
    console.warn("⚠️ Không xác định được giá trị khởi đầu của Cục:", data.cucSo);
    return;
  }

  // 🌟 Xác định chiều chạy
  const gioiTinh = (data.gender || "").trim();
  const menhText = (data.menh || "").trim();
  const isThuan =
    (gioiTinh === "Nam" && menhText.includes("Dương")) ||
    (gioiTinh === "Nữ" && menhText.includes("Âm"));

  // 🌟 Đồng bộ Unicode để không bị lệch chữ "Tý", "Mùi"...
 const cungMenhStr = String(cungMenh || "").trim().normalize("NFC");
const CUNG_THUAN_NORM = CUNG_THUAN.map(c => String(c).normalize("NFC"));
const idxMenh = CUNG_THUAN_NORM.indexOf(cungMenhStr);

  if (idxMenh === -1) {
    console.warn("⚠️ Không tìm thấy chỉ số cung Mệnh:", cungMenh);
    return;
  }
console.log("✅ Cung Mệnh hợp lệ:", cungMenh);


  // 🌟 Hàm tiện ích
  const getIndexThuan = (start, step) => (start + step) % 12;
  const getIndexNgich = (start, step) => (start - step + 12) % 12;

  // 🧹 Xóa các layer-4 cũ trước khi an lại
  document.querySelectorAll(".layer-4").forEach(el => el.remove());

  // 🌟 An cục số vào từng cung
  for (let i = 0; i < 12; i++) {
    const idx = isThuan ? getIndexThuan(idxMenh, i) : getIndexNgich(idxMenh, i);
    const cung = CUNG_THUAN[idx];
    const cell = document.getElementById("cell" + CUNG_TO_CELL[cung]);
    if (!cell) continue;

    // Tạo layer 4 nếu chưa có
    let layer4 = cell.querySelector(".layer-4");
    if (!layer4) {
      layer4 = document.createElement("div");
      layer4.className = "layer-4";
      cell.appendChild(layer4);
    }

    // Hiển thị giá trị Cục số (2,12,22,…)
    const value = baseCuc + i * 10;
    const div = document.createElement("div");
    div.textContent = value;
    layer4.appendChild(div);
  }

  console.log(`✅ Lớp 4 – Cục Số an xong (${data.cucSo}, ${isThuan ? "thuận" : "nghịch"}) tại cung ${cungMenh}`);
}

// =====================================================
// 🌟 LỚP 5 – NGŨ HÀNH CUNG (CỐ ĐỊNH)
// -----------------------------------------------------
function nguHanhCuaCung(tenCung) {
  const NGU_HANH_CUNG = {
    "Dần": "+Mộc", "Mão": "-Mộc", "Thìn": "+Thổ", "Tỵ": "-Hỏa",
    "Ngọ": "+Hỏa", "Mùi": "-Thổ", "Thân": "+Kim", "Dậu": "-Kim",
    "Tuất": "+Thổ", "Hợi": "-Thủy", "Tý": "+Thủy", "Sửu": "-Thổ"
  };
  const val = NGU_HANH_CUNG[tenCung] || "";
  // chỉ lấy phần chữ Hành (Mộc, Hỏa...) bỏ dấu +/-
  return val.replace(/[+-]/g, "");
}
function anLop5_NguHanhCung() {
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,
    "Thìn":5,"Dậu":6,"Mão":7,"Tuất":8,
    "Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };

  const NGU_HANH_CUNG = {
    "Dần": "+Mộc", "Mão": "-Mộc", "Thìn": "+Thổ", "Tỵ": "-Hỏa",
    "Ngọ": "+Hỏa", "Mùi": "-Thổ", "Thân": "+Kim", "Dậu": "-Kim",
    "Tuất": "+Thổ", "Hợi": "-Thủy", "Tý": "+Thủy", "Sửu": "-Thổ"
  };

  for (const [cung, cellId] of Object.entries(CUNG_TO_CELL)) {
    const cell = document.getElementById("cell" + cellId);
    if (!cell) continue;

    // Tạo khối bao riêng cho lớp 5
    let layer5 = cell.querySelector(".layer-5");
    if (!layer5) {
      layer5 = document.createElement("div");
      layer5.className = "layer-5";
      cell.appendChild(layer5);
    }

    // Tạo div con cố định vị trí (giống layer4-div)
    const div = document.createElement("div");
    div.className = "layer5-div";
    div.textContent = NGU_HANH_CUNG[cung];
    layer5.innerHTML = ""; // reset nếu có cũ
    layer5.appendChild(div);
  }

  console.log("✅ Lớp 5 – Ngũ hành cung đã an xong.");
}

// =====================================================
// 🌟 LỚP 6 – HỆ THỐNG 2 CỘT CÁT & HUNG (TỔNG HỢP)
// =====================================================

// ✅ Hàm gốc thêm sao (dùng cho tất cả nhóm)
function themSao(cung, tenSao, nhom, loai) {

  const cellMap = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };
  const cell = document.getElementById("cell" + cellMap[cung]);
  if (!cell) return;

  // 🔹 Tạo hoặc tìm layer 6
  let layer6 = cell.querySelector(".layer-6");
  if (!layer6) {
    layer6 = document.createElement("div");
    layer6.className = "layer-6";
    const hung = document.createElement("div");
    hung.className = "hung-tinh";
    const cat = document.createElement("div");
    cat.className = "cat-tinh";
    layer6.appendChild(hung);
    layer6.appendChild(cat);
    cell.appendChild(layer6);
  }

  const target = (loai === "cat") ? layer6.querySelector(".cat-tinh") : layer6.querySelector(".hung-tinh");

  // 🔹 Xác định thứ tự hiển thị ưu tiên
  const orderMap = {
    "TrungTinh": 1,
    "TuHoa": 2,
    "LocTon": 3,
    "ThienMa": 4,
    "TieuTinh": 5
  };

  const div = document.createElement("div");
console.log("Thêm sao:", tenSao);
  div.textContent = tenSao;
console.log("Tên sao nhận vào:", tenSao);
  div.dataset.order = orderMap[nhom] || 9;


// 🌟 Nếu là Tứ Hóa → gắn liên kết tới sao gốc
if (nhom === "TuHoa") {
  // 🔸 Ưu tiên lấy CAN của năm hạn (nếu đang xem hạn)
  let canNam = "";
  if (window.dataGlobal?.luuHan?.canChiNam) {
    canNam = window.dataGlobal.luuHan.canChiNam.split(" ")[0]; // năm hạn
  } else if (window.dataGlobal?.canChiNam) {
    canNam = window.dataGlobal.canChiNam.split(" ")[0]; // năm sinh gốc
  }

  // 🔹 Bảng Tứ Hóa chuẩn (dùng chung)
  const TU_HOA = {
    "Giáp": { loc:"Liêm Trinh", quyen:"Phá Quân", khoa:"Vũ Khúc", ky:"Thái Dương" },
    "Ất": { loc:"Thiên Cơ", quyen:"Thiên Lương", khoa:"Tử Vi", ky:"Thái Âm" },
    "Bính": { loc:"Thiên Đồng", quyen:"Thiên Cơ", khoa:"Văn Xương", ky:"Liêm Trinh" },
    "Đinh": { loc:"Thái Âm", quyen:"Thiên Đồng", khoa:"Thiên Cơ", ky:"Cự Môn" },
    "Mậu": { loc:"Tham Lang", quyen:"Thái Âm", khoa:"Hữu Bật", ky:"Thiên Cơ" },
    "Kỷ": { loc:"Vũ Khúc", quyen:"Tham Lang", khoa:"Thiên Lương", ky:"Văn Khúc" },
    "Canh": { loc:"Thái Dương", quyen:"Vũ Khúc", khoa:"Thiên Đồng", ky:"Thái Âm" },
    "Tân": { loc:"Cự Môn", quyen:"Thái Dương", khoa:"Văn Khúc", ky:"Văn Xương" },
    "Nhâm": { loc:"Thiên Lương", quyen:"Tử Vi", khoa:"Tả Phù", ky:"Vũ Khúc" },
    "Quý": { loc:"Phá Quân", quyen:"Cự Môn", khoa:"Thái Âm", ky:"Tham Lang" }
  };

  const hoa = TU_HOA[canNam];
  let goc = "";
  if (tenSao === "Hóa Lộc") goc = hoa?.loc;
  if (tenSao === "Hóa Quyền") goc = hoa?.quyen;
  if (tenSao === "Hóa Khoa") goc = hoa?.khoa;
  if (tenSao === "Hóa Kỵ") goc = hoa?.ky;
  if (goc) div.dataset.hoaGoc = goc;
}

// 🌟 Bắt sự kiện click: khi click vào Hóa → sáng sao gốc
div.addEventListener("click", () => {
  const goc = div.dataset.hoaGoc;
  if (!goc) return;

  // Xóa sáng hiện có
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // ✨ Tìm và sáng sao gốc
  const cleanGoc = goc.normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/\s+/g,"").toLowerCase();
  let timThay = false;

  document.querySelectorAll("[class*='layer'] div, .cung div").forEach(el => {
    const name = el.textContent.trim()
        .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")           // Đ
    .replace(/\u0111/g, "d")           // đ
    .replace(/\s+/g, "")
    .toLowerCase();
    if (name === cleanGoc) {
      el.classList.add("sao-highlight");
      timThay = true;
    }
  });

  // 🩵 Nếu là sao Nguyệt vận (N.) → mở popup tra cứu
  if (tenHoa.startsWith("N.")) {
    const tenSaoGoc = goc || tenHoa.replace(/^N\.\s*/,"").trim();
    const key = timKeySao(tenSaoGoc);
    if (key) moPopupSao(key);
    else moPopupSao_Ten(tenSaoGoc);
  }

  if (!timThay) console.warn("Warning: Không tìm thấy sao gốc:", goc);
});


// 🟩 Debug map trung tinh
if (nhom === "TrungTinh") {
  const keyTT = tenSao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")           // Đ → d
    .replace(/\u0111/g, "d")           // đ → d
    .replace(/\s+/g, "")               // bỏ khoảng trắng
    .trim()
    .toLowerCase();


  if (!window.trungTinhToCung) window.trungTinhToCung = {};
  window.trungTinhToCung[keyTT] = cung;

  console.log("📌 Trung tinh map:", keyTT, "→", cung);
}

  target.appendChild(div);

  // 🔹 Sắp xếp lại theo thứ tự
  const items = Array.from(target.children);
  items.sort((a, b) => a.dataset.order - b.dataset.order);
  target.innerHTML = "";
  items.forEach(el => target.appendChild(el));
}

// =====================================================
// 🌟 LỚP 6 – HỆ THỐNG 2 CỘT CÁT & HUNG (TỔNG HỢP)
// =====================================================

// ✅ Hàm thêm sao – bản fix hiển thị màu ngũ hành cho cả sao gốc, ĐV, Lưu
function themSao(cung, tenSao, nhom, loai) {

  const CUNG_TO_CELL = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };
  const cell = document.getElementById("cell" + CUNG_TO_CELL[cung]);
  if (!cell) return;

  let layer6 = cell.querySelector(".layer-6");
  if (!layer6) {
    layer6 = document.createElement("div");
    layer6.className = "layer layer-6 trungtinh";
    const hung = document.createElement("div"); hung.className = "hung-tinh";
    const cat = document.createElement("div"); cat.className = "cat-tinh";
    layer6.appendChild(hung); layer6.appendChild(cat);
    cell.appendChild(layer6);
  }

  const column = (loai === "cat") ? layer6.querySelector(".cat-tinh") : layer6.querySelector(".hung-tinh");

  // Không thêm trùng
  if ([...column.children].some(el => el.textContent.trim() === tenSao.trim())) return;

  // 🎯 Chuẩn hóa tên gốc (bỏ tiền tố ĐV. / L.)
const tenGoc = tenSao.replace(/^(ĐV\.|L\.|N\.|Nh\.)\s*/i, "").trim();

  // 🌿 Bảng hành sao
  const hanhSao = {
    "Tử Vi":"Thổ","Thiên Cơ":"Mộc","Thái Dương":"Hỏa","Vũ Khúc":"Kim","Thiên Đồng":"Thủy",
    "Liêm Trinh":"Hỏa","Thiên Phủ":"Thổ","Thái Âm":"Thủy","Tham Lang":"Mộc","Cự Môn":"Thủy",
    "Thiên Tướng":"Thủy","Thiên Lương":"Mộc","Thất Sát":"Kim","Phá Quân":"Thủy","Thiên Khôi":"Hỏa",
    "Thiên Việt":"Hỏa","Lộc Tồn":"Thổ","Thiên Mã":"Hỏa","Hóa Lộc":"Mộc","Hóa Quyền":"Mộc",
    "Hóa Khoa":"Mộc","Hóa Kỵ":"Kim","Kình Dương":"Kim","Đà La":"Kim","Văn Xương":"Kim","Văn Khúc":"Thủy",
    "Linh Tinh":"Hỏa","Hỏa Tinh":"Hỏa","Địa Không":"Hỏa","Địa Kiếp":"Hỏa","Tả Phù":"Thổ"
  };

const hanh = hanhSao[tenGoc] || "";
const colorMap = {
  "Hỏa": "#ff4d4d",  // 🔥 đỏ tươi sáng
  "Thổ": "#e69500",  // 🟠 cam đất đậm hơn
  "Mộc": "#007a29",  // 🌿 xanh lá đậm hơn một chút
  "Kim": "#000000",  // ⚫ đen thuần
  "Thủy": "#004cff"  // 💧 xanh dương đậm sáng
};
const color = colorMap[hanh] || "#222";


  // 🎨 Tạo div sao
  const div = document.createElement("div");
  div.textContent = tenSao;
  div.dataset.order = 9;
  div.style.fontWeight = /^ĐV\.|^L\./.test(tenSao) ? "700" : "600";
// 🌟 Cho phép click xem sao (chỉ khi popup đang mở)
div.style.cursor = "pointer";
div.addEventListener("click", () => {
  if (typeof showStarInfo === "function") {
    showStarInfo(tenSao, cung);
  }
});



  // ✅ Thêm class ngũ hành + sao lưu
  if (hanh) {
    const hanhClass = {Hỏa:"sao-hoa",Thổ:"sao-tho",Mộc:"sao-moc",Kim:"sao-kim",Thủy:"sao-thuy"}[hanh];
    div.classList.add(hanhClass);
  }
  if (/^L\./.test(tenSao)) div.classList.add("sao-luu");
  if (/^ĐV\./.test(tenSao)) div.classList.add("sao-dv");

  // ✅ Ép màu inline có !important để không bị mất
  div.style.setProperty("color", color, "important");
  if (/^(ĐV\.|L\.)/i.test(tenSao)) div.style.filter = "brightness(1.15)";

  column.appendChild(div);

  // ✅ Sắp xếp lại
  const items = Array.from(column.children);
  items.sort((a,b)=>(a.dataset.order||0)-(b.dataset.order||0));
  column.innerHTML = "";
  items.forEach(i=>column.appendChild(i));
}






// 🌟 LỚP 6.2 – LỘC TỒN & THIÊN MÃ (CÁT TINH BỔ SUNG)
function anLop6_2_LocTon_ThienMa(data) {
window.dataGlobal = data;
  console.log("🚀 Bắt đầu an Lộc Tồn – Thiên Mã", data.canChiNam);

  const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  let canNam = "", chiNam = "";
  for (const can of CAN) if (data.canChiNam?.includes(can)) canNam = can;
  for (const chi of CHI) if (data.canChiNam?.includes(chi)) chiNam = chi;

  const LOC_TON_MAP = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ","Mậu":"Tỵ",
    "Kỷ":"Ngọ","Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
  };

  const THIEN_MA_MAP = {
    "Hợi":"Tỵ","Mão":"Tỵ","Mùi":"Tỵ",
    "Tỵ":"Hợi","Dậu":"Hợi","Sửu":"Hợi",
    "Dần":"Thân","Ngọ":"Thân","Tuất":"Thân",
    "Thân":"Dần","Tý":"Dần","Thìn":"Dần"
  };

  const locTonCung = LOC_TON_MAP[canNam];
  const thienMaCung = THIEN_MA_MAP[chiNam];

  if (locTonCung) themSao(locTonCung, "Lộc Tồn", "LocTon", "cat");
  if (thienMaCung) themSao(thienMaCung, "Thiên Mã", "LocTon", "cat");

  data.cungLocTon = locTonCung;

  console.log(`💰 Năm ${data.canChiNam}: Can ${canNam} → Lộc Tồn tại ${locTonCung}, Chi ${chiNam} → Thiên Mã tại ${thienMaCung}`);
}



function rebuildSaoToCungFromDOM() {

  // Nếu đang an sao → KHÔNG ĐƯỢC REBUILD
  if (window.__LOCK_REBUILD__) {
    console.warn("⛔ REBUILD bị chặn: hệ thống đang an sao!");
    return window.saoToCung;
  }

  const revMap = {
    1:"Tỵ", 2:"Ngọ", 3:"Mùi", 4:"Thân",
    5:"Thìn",6:"Dậu",7:"Mão",8:"Tuất",
    9:"Dần",10:"Sửu",11:"Tý",12:"Hợi"
  };

  // dùng normalizeKey để đồng nhất với Tứ Hóa
function normalizeKey(str){
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")  // bỏ dấu
    .replace(/đ/gi, "d")              // ⭐ QUAN TRỌNG: đổi đ → d
    .replace(/\s+/g,"")               // xoá space
    .replace(/[\u00A0]/g,"")          // xoá NBSP
    .trim()
    .toLowerCase();
}

  const CHINH_TINH_KEYS = [
    "tuvi","thienco","thaiduong","vukhuc","thiendong",
    "liemtrinh","thienphu","thaiam","thamlang","cumon",
    "thientuong","thienluong","thatsat","phaquan"
  ];

  const newMap = {};

  Object.entries(revMap).forEach(([id, tenCung]) => {
    const cell = document.getElementById("cell" + id);
    if (!cell) return;
    const layer3 = cell.querySelector(".layer-3");
    if (!layer3) return;

    layer3.querySelectorAll("div").forEach(el => {

      // lấy tên sao SẠCH — rất quan trọng
      const raw = el.textContent.normalize("NFC").trim();
console.log("RAW:", raw, "UNICODE:", [...raw].map(c => c.charCodeAt(0).toString(16)));

      // chuẩn hóa thành key đồng bộ
      const key = normalizeKey(raw);

      if (CHINH_TINH_KEYS.includes(key)) {
        newMap[key] = tenCung;
      }
    });
  });

  if (Object.keys(newMap).length < 12) {
    console.warn("⚠️ REBUILD: DOM chưa đủ chính tinh → GIỮ LẠI MAP CŨ");
    return window.saoToCung;
  }

  window.saoToCung = newMap;
  console.log("🧭 [REBUILD] saoToCung từ DOM:", window.saoToCung);
}
// =====================================================
// 🌟 LỚP 6 – TRUNG TINH (GỘP CÁT + HUNG)
// =====================================================
function anLop6_TrungTinh(data) {
 console.log("🌀 Bắt đầu an Trung tinh...", data.canChiNam);

  // 🔥 Fallback: nếu Chính Tinh chưa chạy → gọi bù
  if (!window.saoToCung || Object.keys(window.saoToCung).length === 0) {
    console.warn("⚠️ [TT] saoToCung đang rỗng → gọi anLop3_ChinhTinh bổ sung");
    if (typeof anLop3_ChinhTinh === "function") {
      anLop3_ChinhTinh(data);
    } else {
      console.error("❌ [TT] anLop3_ChinhTinh chưa được định nghĩa!");
    }
  }
  const canNam = data.canChiNam?.split(" ")[0] || "";
  const thangAm = parseInt(data.lunar[1]);
  const gioChi = data.canChiGio?.split(" ")[1] || "Tý";
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
// 🌟 Đảm bảo mỗi cung chỉ có 1 lớp trung tinh
Object.values(CUNG_TO_CELL).forEach(id => {
  const cell = document.getElementById("cell" + id);
  if (!cell) return;
  let layer6 = cell.querySelector(".layer-6");
  if (!layer6) {
    layer6 = document.createElement("div");
    layer6.className = "layer-6";
    cell.appendChild(layer6);
  }
});

  // 🧭 Hàm đếm cung (dùng chung)
  function demCung(start, step, chieu="thuận") {
    const iStart = CUNG_THUAN.indexOf(start);
    if (iStart === -1) return null;
    const idx = (chieu === "thuận")
      ? (iStart + (step - 1)) % 12
      : (iStart - (step - 1) + 12) % 12;
    return CUNG_THUAN[idx];
  }

  // ===============================
  // 🌿 NHÓM CÁT TINH
  // ===============================
  const BANG_KHOI_VIET = {
    "Giáp": ["Sửu", "Mùi"], "Mậu": ["Sửu", "Mùi"],
    "Ất": ["Tý", "Thân"], "Kỷ": ["Tý", "Thân"],
    "Canh": ["Dần", "Ngọ"], "Tân": ["Dần", "Ngọ"],
    "Bính": ["Hợi", "Dậu"], "Đinh": ["Hợi", "Dậu"],
    "Nhâm": ["Mão", "Tỵ"], "Quý": ["Mão", "Tỵ"]
  };

  const cap = BANG_KHOI_VIET[canNam];
  if (cap) {
    themSao(cap[0], "Thiên Khôi", "TrungTinh", "cat");
    themSao(cap[1], "Thiên Việt", "TrungTinh", "cat");
  }

  const cungTaPhu = demCung("Thìn", thangAm, "thuận");
  const cungHuuBat = demCung("Tuất", thangAm, "nghịch");
  if (cungTaPhu) themSao(cungTaPhu, "Tả Phù", "TrungTinh", "cat");
  if (cungHuuBat) themSao(cungHuuBat, "Hữu Bật", "TrungTinh", "cat");

  // 🌟 Văn Xương – Văn Khúc (chuẩn cổ: Tuất nghịch, Thìn thuận)
  const gioChiArray = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const gioIndex = gioChiArray.indexOf(gioChi);

  if (gioIndex !== -1) {
    // 🪶 Văn Xương: Tuất coi là Tý, đếm NGHỊCH theo giờ sinh
    const startXuong = CUNG_THUAN.indexOf("Tuất"); // 8
    const idxXuong = (startXuong - gioIndex + 12) % 12;
    const cungVanXuong = CUNG_THUAN[idxXuong];

    // 🪶 Văn Khúc: Thìn coi là Tý, đếm THUẬN theo giờ sinh
    const startKhuc = CUNG_THUAN.indexOf("Thìn"); // 2
    const idxKhuc = (startKhuc + gioIndex) % 12;
    const cungVanKhuc = CUNG_THUAN[idxKhuc];

    if (cungVanXuong) themSao(cungVanXuong, "Văn Xương", "TrungTinh", "cat");
    if (cungVanKhuc) themSao(cungVanKhuc, "Văn Khúc", "TrungTinh", "cat");
  }

  // ===============================
  // ⚡ NHÓM HUNG TINH
  // ===============================
// 🌟 Kình Dương – Đà La (tính trực tiếp từ công thức Lộc Tồn gốc)
if (data.canChiNam) {
  const canChiNam = data.canChiNam.trim();
  let canNam = "";

  // ✅ Trích xuất đúng Can năm từ chuỗi data.canChiNam
  if (canChiNam.startsWith("Giáp")) canNam = "Giáp";
  else if (canChiNam.startsWith("Ất")) canNam = "Ất";
  else if (canChiNam.startsWith("Bính")) canNam = "Bính";
  else if (canChiNam.startsWith("Đinh")) canNam = "Đinh";
  else if (canChiNam.startsWith("Mậu")) canNam = "Mậu";
  else if (canChiNam.startsWith("Kỷ")) canNam = "Kỷ";
  else if (canChiNam.startsWith("Canh")) canNam = "Canh";
  else if (canChiNam.startsWith("Tân")) canNam = "Tân";
  else if (canChiNam.startsWith("Nhâm")) canNam = "Nhâm";
  else if (canChiNam.startsWith("Quý")) canNam = "Quý";

  // ✅ Tính vị trí Lộc Tồn gốc theo Can năm
  let viTriA = "Dần";
  switch (canNam) {
    case "Giáp": viTriA = "Dần"; break;
    case "Ất":   viTriA = "Mão"; break;
    case "Bính":
    case "Mậu":  viTriA = "Tỵ";  break;
    case "Đinh":
    case "Kỷ":   viTriA = "Ngọ"; break;
    case "Canh": viTriA = "Thân"; break;
    case "Tân":  viTriA = "Dậu"; break;
    case "Nhâm": viTriA = "Hợi"; break;
    case "Quý":  viTriA = "Tý";  break;
  }

  // ✅ Từ đó an Kình Dương – Đà La (thuận +1, nghịch -1)
  const iA = CUNG_THUAN.indexOf(viTriA);
  if (iA >= 0) {
    const cungKinh = CUNG_THUAN[(iA + 1) % 12];
    const cungDa   = CUNG_THUAN[(iA - 1 + 12) % 12];
    themSao(cungKinh, "Kình Dương", "TrungTinh", "hung");
    themSao(cungDa, "Đà La", "TrungTinh", "hung");
    console.log(`✅ ${canChiNam} → Lộc Tồn gốc tại ${viTriA}, Kình Dương: ${cungKinh}, Đà La: ${cungDa}`);
  }
}







  // 🔹 Địa Không & Địa Kiếp (chuẩn: từ Hợi, Tý đếm thuận/ nghịch)
  const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const iGio = GIO_CHI.indexOf(gioChi);
  if (iGio >= 0) {
    const iHoi = CUNG_THUAN.indexOf("Hợi");
    const cungKiep = CUNG_THUAN[(iHoi + iGio) % 12];
    const cungKhong = CUNG_THUAN[(iHoi - iGio + 12) % 12];
    themSao(cungKiep, "Địa Kiếp", "TrungTinh", "hung");
    themSao(cungKhong, "Địa Không", "TrungTinh", "hung");
    console.log(`🕐 Giờ ${gioChi}: Kiếp tại ${cungKiep}, Không tại ${cungKhong}`);
  }

  // 🔹 LINH TINH
  const menhAD = data.amduongMenh || "Dương Nam"; 
  const chiNam = data.canChiNam?.split(" ")[1] || "Tý";

  const BANG_LINH_TINH = {
    "DuongNam_AmNu": {
      "Tý":{"DầnNgọTuất":"Mão","Khac":"Tuất"},"Sửu":{"DầnNgọTuất":"Dần","Khac":"Dậu"},
      "Dần":{"DầnNgọTuất":"Sửu","Khac":"Thân"},"Mão":{"DầnNgọTuất":"Tý","Khac":"Mùi"},
      "Thìn":{"DầnNgọTuất":"Hợi","Khac":"Ngọ"},"Tỵ":{"DầnNgọTuất":"Tuất","Khac":"Tỵ"},
      "Ngọ":{"DầnNgọTuất":"Dậu","Khac":"Thìn"},"Mùi":{"DầnNgọTuất":"Thân","Khac":"Mão"},
      "Thân":{"DầnNgọTuất":"Mùi","Khac":"Dần"},"Dậu":{"DầnNgọTuất":"Ngọ","Khac":"Sửu"},
      "Tuất":{"DầnNgọTuất":"Tỵ","Khac":"Tý"},"Hợi":{"DầnNgọTuất":"Thìn","Khac":"Hợi"}
    },
    "AmNam_DuongNu": {
      "Tý":{"DầnNgọTuất":"Mão","Khac":"Tuất"},"Sửu":{"DầnNgọTuất":"Thìn","Khac":"Hợi"},
      "Dần":{"DầnNgọTuất":"Tỵ","Khac":"Tý"},"Mão":{"DầnNgọTuất":"Ngọ","Khac":"Sửu"},
      "Thìn":{"DầnNgọTuất":"Mùi","Khac":"Dần"},"Tỵ":{"DầnNgọTuất":"Thân","Khac":"Mão"},
      "Ngọ":{"DầnNgọTuất":"Dậu","Khac":"Thìn"},"Mùi":{"DầnNgọTuất":"Tuất","Khac":"Tỵ"},
      "Thân":{"DầnNgọTuất":"Hợi","Khac":"Ngọ"},"Dậu":{"DầnNgọTuất":"Tý","Khac":"Mùi"},
      "Tuất":{"DầnNgọTuất":"Sửu","Khac":"Thân"},"Hợi":{"DầnNgọTuất":"Dần","Khac":"Dậu"}
    }
  };

  const keyLinh = (menhAD === "Dương Nam" || menhAD === "Âm Nữ") ? "DuongNam_AmNu" : "AmNam_DuongNu";
  const chiNamThuong = chiNam.normalize("NFD").replace(/\p{Diacritic}/gu,"");
  const nhomChi = ["Dan","Ngo","Tuat"].includes(chiNamThuong) ? "DầnNgọTuất" : "Khac";
  const cungLinh = BANG_LINH_TINH[keyLinh][gioChi]?.[nhomChi];
  if (cungLinh) themSao(cungLinh, "Linh Tinh", "TrungTinh", "hung");

  // 🔹 HỎA TINH
  const BANG_HOA_TINH = {
    "DuongNam_AmNu": {
      "TyThinThan": { "Tý":"Dần","Sửu":"Mão","Dần":"Thìn","Mão":"Tỵ","Thìn":"Ngọ","Tỵ":"Mùi","Ngọ":"Thân","Mùi":"Dậu","Thân":"Tuất","Dậu":"Hợi","Tuất":"Tý","Hợi":"Sửu" },
      "SuuTyDau": { "Tý":"Mão","Sửu":"Thìn","Dần":"Tỵ","Mão":"Ngọ","Thìn":"Mùi","Tỵ":"Thân","Ngọ":"Dậu","Mùi":"Tuất","Thân":"Hợi","Dậu":"Tý","Tuất":"Sửu","Hợi":"Dần" },
      "DanNgoTuat": { "Tý":"Sửu","Sửu":"Dần","Dần":"Mão","Mão":"Thìn","Thìn":"Tỵ","Tỵ":"Ngọ","Ngọ":"Mùi","Mùi":"Thân","Thân":"Dậu","Dậu":"Tuất","Tuất":"Hợi","Hợi":"Tý" },
      "MaoMuiHoi": { "Tý":"Dậu","Sửu":"Tuất","Dần":"Hợi","Mão":"Tý","Thìn":"Sửu","Tỵ":"Dần","Ngọ":"Mão","Mùi":"Thìn","Thân":"Tỵ","Dậu":"Ngọ","Tuất":"Mùi","Hợi":"Thân" }
    },
    "AmNam_DuongNu": {
      "TyThinThan": { "Tý":"Dần","Sửu":"Sửu","Dần":"Tý","Mão":"Hợi","Thìn":"Tuất","Tỵ":"Dậu","Ngọ":"Thân","Mùi":"Mùi","Thân":"Ngọ","Dậu":"Tỵ","Tuất":"Thìn","Hợi":"Mão" },
      "SuuTyDau": { "Tý":"Mão","Sửu":"Dần","Dần":"Sửu","Mão":"Tý","Thìn":"Hợi","Tỵ":"Tuất","Ngọ":"Dậu","Mùi":"Thân","Thân":"Mùi","Dậu":"Ngọ","Tuất":"Tỵ","Hợi":"Thìn" },
      "DanNgoTuat": { "Tý":"Sửu","Sửu":"Tý","Dần":"Hợi","Mão":"Tuất","Thìn":"Dậu","Tỵ":"Thân","Ngọ":"Mùi","Mùi":"Ngọ","Thân":"Tỵ","Dậu":"Thìn","Tuất":"Mão","Hợi":"Dần" },
      "MaoMuiHoi": { "Tý":"Dậu","Sửu":"Thân","Dần":"Mùi","Mão":"Ngọ","Thìn":"Tỵ","Tỵ":"Thìn","Ngọ":"Mão","Mùi":"Dần","Thân":"Sửu","Dậu":"Tý","Tuất":"Hợi","Hợi":"Tuất" }
    }
  };

  const keyHoa = keyLinh;
  let nhomNam;
  if (["Tý","Thìn","Thân"].includes(chiNam)) nhomNam = "TyThinThan";
  else if (["Sửu","Tỵ","Dậu"].includes(chiNam)) nhomNam = "SuuTyDau";
  else if (["Dần","Ngọ","Tuất"].includes(chiNam)) nhomNam = "DanNgoTuat";
  else nhomNam = "MaoMuiHoi";

  const cungHoa = BANG_HOA_TINH[keyHoa][nhomNam]?.[gioChi];
  if (cungHoa) themSao(cungHoa, "Hỏa Tinh", "TrungTinh", "hung");
// 🔹 Lưu vị trí toàn bộ Trung Tinh (Cát + Hung) để Tứ Hóa có thể tìm thấy
if (!window.trungTinhToCung) window.trungTinhToCung = {};
document.querySelectorAll('.layer-6 .cat-tinh div, .layer-6 .hung-tinh div').forEach(el => {
  const name = el.textContent.trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")   // xoá dấu tổ hợp
  .replace(/\u0110/g, "d")           // Đ → d
  .replace(/\u0111/g, "d")           // đ → d
  .replace(/\s+/g, "")               // xoá space
  .toLowerCase();

  const cell = el.closest(".cung");
  if (cell) {
    const cungId = cell.id.replace("cell", "");
    const revMap = {9:"Dần",7:"Mão",5:"Thìn",1:"Tỵ",2:"Ngọ",3:"Mùi",4:"Thân",6:"Dậu",8:"Tuất",12:"Hợi",11:"Tý",10:"Sửu"};
    const cungName = revMap[cungId];
    if (cungName) window.trungTinhToCung[name] = cungName;
  }
});

  console.log("✅ Hoàn tất an Trung Tinh (Cát + Hung)");
}
// =====================================================
// 🌟 LỚP 6.4 – TỨ HÓA
// =====================================================
function anLop6_4_TuHoa(data){
  const canNam=data.canChiNam?.split(" ")[0]||"";
  const TU_HOA={
    "Giáp":{loc:"Liêm Trinh",quyen:"Phá Quân",khoa:"Vũ Khúc",ky:"Thái Dương"},
    "Ất":{loc:"Thiên Cơ",quyen:"Thiên Lương",khoa:"Tử Vi",ky:"Thái Âm"},
    "Bính":{loc:"Thiên Đồng",quyen:"Thiên Cơ",khoa:"Văn Xương",ky:"Liêm Trinh"},
    "Đinh":{loc:"Thái Âm",quyen:"Thiên Đồng",khoa:"Thiên Cơ",ky:"Cự Môn"},
    "Mậu":{loc:"Tham Lang",quyen:"Thái Âm",khoa:"Hữu Bật",ky:"Thiên Cơ"},
    "Kỷ":{loc:"Vũ Khúc",quyen:"Tham Lang",khoa:"Thiên Lương",ky:"Văn Khúc"},
    "Canh":{loc:"Thái Dương",quyen:"Vũ Khúc",khoa:"Thiên Đồng",ky:"Thái Âm"},
    "Tân":{loc:"Cự Môn",quyen:"Thái Dương",khoa:"Văn Khúc",ky:"Văn Xương"},
    "Nhâm":{loc:"Thiên Lương",quyen:"Tử Vi",khoa:"Tả Phù",ky:"Vũ Khúc"},
    "Quý":{loc:"Phá Quân",quyen:"Cự Môn",khoa:"Thái Âm",ky:"Tham Lang"}
  };
  const hoa=TU_HOA[canNam];
  if(!hoa)return;
// ✅ Hợp nhất cả Chính Tinh & Trung Tinh
// ✅ Đảm bảo có map Chính tinh trước khi ghép Tứ Hóa
rebuildSaoToCungFromDOM();
const map = {
  ...(window.saoToCung || {}),
  ...(window.trungTinhToCung || {})
};

console.log("🧭 MAP CHO TỨ HÓA:", map);   // <--- console kiểm tra map

  const ds=[
    {ten:"Hóa Lộc",sao:hoa.loc,loai:"cat"},
    {ten:"Hóa Quyền",sao:hoa.quyen,loai:"cat"},
    {ten:"Hóa Khoa",sao:hoa.khoa,loai:"cat"},
    {ten:"Hóa Kỵ",sao:hoa.ky,loai:"hung"}
  ];

// 🔧 Chuẩn hóa tên sao (trị dứt điểm lỗi Thiên Đồng)
function normalizeKey(str){
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")  // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")         // Đ → d
    .replace(/\u0111/g, "d")         // đ → d
    .replace(/\s+/g,"")              // bỏ khoảng trắng
    .replace(/[\u00A0]/g,"")         // bỏ NBSP
    .trim()
    .toLowerCase();
}


 ds.forEach(x=>{
const key = normalizeKey(x.sao);


  const cung = map[key];

  console.log(`🔍 Tứ Hóa: ${x.ten} – Sao gốc: ${x.sao} – KEY: ${key} – Cung tìm được:`, cung);

  if (cung) {
    themSao(cung, x.ten, "TuHoa", x.loai);
  } else {
    console.warn("⚠️ KHÔNG THẤY SAO GỐC →", x.sao, "→ KEY:", key);
  }
});

  console.log("✅ Hoàn tất an Tứ Hóa (Layer 6.4)");
}

// 🌟 Bảng tam hợp cố định
const TAM_HOP = {
  "Hợi": ["Hợi","Mão","Mùi"], "Mão": ["Hợi","Mão","Mùi"], "Mùi": ["Hợi","Mão","Mùi"],
  "Tý": ["Tý","Thìn","Thân"], "Thìn": ["Tý","Thìn","Thân"], "Thân": ["Tý","Thìn","Thân"],
  "Sửu": ["Sửu","Tỵ","Dậu"], "Tỵ": ["Sửu","Tỵ","Dậu"], "Dậu": ["Sửu","Tỵ","Dậu"],
  "Dần": ["Dần","Ngọ","Tuất"], "Ngọ": ["Dần","Ngọ","Tuất"], "Tuất": ["Dần","Ngọ","Tuất"]
};

// 🌟 Bảng cung thuận để xác định cung đối
const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
const cellMap = {"Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10};








// =====================================================
// 🌟 BẬT SÁNG CUNG TAM HỢP + ĐỐI CUNG + SONG TINH KẸP CUNG
// =====================================================
function enableCungHighlight() {
  const cellMap = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };

  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const TAM_HOP = {
    "Hợi":["Hợi","Mão","Mùi"], "Mão":["Hợi","Mão","Mùi"], "Mùi":["Hợi","Mão","Mùi"],
    "Tý":["Tý","Thìn","Thân"], "Thìn":["Tý","Thìn","Thân"], "Thân":["Tý","Thìn","Thân"],
    "Sửu":["Sửu","Tỵ","Dậu"], "Tỵ":["Sửu","Tỵ","Dậu"], "Dậu":["Sửu","Tỵ","Dậu"],
    "Dần":["Dần","Ngọ","Tuất"], "Ngọ":["Dần","Ngọ","Tuất"], "Tuất":["Dần","Ngọ","Tuất"]
  };
  const DOI_CUNG = {
    "Dần":"Thân","Mão":"Dậu","Thìn":"Tuất","Tỵ":"Hợi",
    "Ngọ":"Tý","Mùi":"Sửu","Thân":"Dần","Dậu":"Mão",
    "Tuất":"Thìn","Hợi":"Tỵ","Tý":"Ngọ","Sửu":"Mùi"
  };

  // =====================================================
  // 🧩 HÀM TIỆN ÍCH — CHUẨN HÓA TÊN SAO
  // =====================================================
 function normalizeSao(txt) {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")           // Đ → d
    .replace(/\u0111/g, "d")           // đ → d
    .replace(/\s+/g, "")               // bỏ khoảng trắng
    .trim()
    .toLowerCase();
}


function splitPrefix(txt) {
  const t = normalizeSao(txt);

  if (t.startsWith("l."))    return { prefix: "L",  name: t.slice(2) };
  if (t.startsWith("dv."))   return { prefix: "ĐV", name: t.slice(3) }; // ✅ ĐV: đã normalize nên dùng dv.
  if (t.startsWith("tl."))   return { prefix: "TL", name: t.slice(3) };
  if (t.startsWith("n."))    return { prefix: "N",  name: t.slice(2) };
  if (t.startsWith("nh."))   return { prefix: "NH", name: t.slice(3) }; // ✅ đổi thành NH in hoa

  return { prefix: "", name: t };
}


  function coSaoTrongCung(cell, tenSao, prefix = "") {
    if (!cell) return false;
    const layer = cell.querySelector(".layer-6");
    if (!layer) return false;

    const cleanTen = normalizeSao(tenSao);
    const cleanPrefix = prefix.toUpperCase();

    const saoList = Array.from(layer.querySelectorAll(".hung-tinh div, .cat-tinh div"))
      .map(el => splitPrefix(el.textContent));

    return saoList.some(s => s.prefix === cleanPrefix && s.name === cleanTen);
  }

  // =====================================================
  // ⚡ HÀM XỬ LÝ SONG TINH KẸP CUNG
  // =====================================================
  function xuLySongTinhKep(cellTruoc, cellSau) {
    const DOI_SAO = [
      ["Văn Xương", "Văn Khúc"],
      ["Thiên Khôi", "Thiên Việt"],
      ["Tả Phù", "Hữu Bật"],
      ["Kình Dương", "Đà La"],
      ["Hỏa Tinh", "Linh Tinh"],
      ["Địa Không", "Địa Kiếp"]
    ];
const prefixGroup = ["", "L", "ĐV", "TL", "N", "Nh"];

    prefixGroup.forEach(prefix => {
      DOI_SAO.forEach(([sao1, sao2]) => {
        const truoc1 = coSaoTrongCung(cellTruoc, sao1, prefix);
        const truoc2 = coSaoTrongCung(cellTruoc, sao2, prefix);
        const sau1   = coSaoTrongCung(cellSau, sao1, prefix);
        const sau2   = coSaoTrongCung(cellSau, sao2, prefix);

        if (((truoc1 && sau2) || (truoc2 && sau1)) &&
            !(truoc1 && truoc2) && !(sau1 && sau2)) {
          [cellTruoc, cellSau].forEach(cell => {
            const layer = cell.querySelector(".layer-6");
            if (!layer) return;
            layer.querySelectorAll(".hung-tinh div, .cat-tinh div").forEach(el => {
              const s = splitPrefix(el.textContent);
              if (s.prefix === prefix.toUpperCase() &&
                  (s.name === normalizeSao(sao1) || s.name === normalizeSao(sao2))) {
                el.classList.add("song-tinh");
              }
            });
          });
        }
      });
    });
  }

  // =====================================================
  // 🎯 XỬ LÝ CLICK CUNG
  // =====================================================
  Object.entries(cellMap).forEach(([cung, id]) => {
    const cell = document.getElementById("cell" + id);
    if (!cell) return;

    cell.addEventListener("click", () => {
      document.querySelectorAll(".highlight, .highlight-cung, .dimmed, .song-tinh")
        .forEach(el => el.classList.remove("highlight","highlight-cung","dimmed","song-tinh"));

      const listSang = new Set();
      listSang.add(cung);
      (TAM_HOP[cung] || []).forEach(c => listSang.add(c));
      if (DOI_CUNG[cung]) listSang.add(DOI_CUNG[cung]);

      Object.keys(cellMap).forEach(cname => {
        const cEl = document.getElementById("cell" + cellMap[cname]);
        if (cEl && !listSang.has(cname)) cEl.classList.add("dimmed");
      });

      listSang.forEach(cname => {
        const cEl = document.getElementById("cell" + cellMap[cname]);
        if (cEl) cEl.classList.add("highlight-cung");
      });

      const [hop1, hop2] = TAM_HOP[cung].filter(c => c !== cung);
      const viTri = CUNG_THUAN.indexOf(cung);
      const cungTruoc = CUNG_THUAN[(viTri - 1 + 12) % 12];
      const cungSau   = CUNG_THUAN[(viTri + 1) % 12];

      capNhatBangCatHung(cung, DOI_CUNG[cung], hop1, hop2, cungTruoc, cungSau);

      const cellTruoc = document.getElementById("cell" + cellMap[cungTruoc]);
      const cellSau   = document.getElementById("cell" + cellMap[cungSau]);
      if (cellTruoc && cellSau) xuLySongTinhKep(cellTruoc, cellSau);
    });
  });

  // =====================================================
  // 🧹 CLICK RA NGOÀI TẮT HIỆU ỨNG
  // =====================================================
  document.addEventListener("click", e => {
    if (
      e.target.closest(".cung") ||
      e.target.closest(".sao") ||
      e.target.closest(".tuhoa") ||
      e.target.closest(".sao-highlight") ||
      e.target.closest(".sao-chinh") ||
      e.target.closest(".sao-phu")
    ) return;
    document.querySelectorAll(".cung")
      .forEach(el => el.classList.remove("highlight-cung", "dimmed"));
    document.querySelectorAll(".song-tinh")
      .forEach(el => el.classList.remove("song-tinh"));
  });
}







/* 🌿 LAYER 8 – Vòng Tràng Sinh */
function anLop8_VongTrangSinh(data) {
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi",
                      "Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const cellMap = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };

  const START = {
    "mộc tam cục": "Hợi",
    "hỏa lục cục": "Dần",
    "kim tứ cục": "Tỵ",
    "thủy nhị cục": "Thân",
    "thổ ngũ cục": "Thân"
  };

  const VONG_TS = [
    "trường sinh","mộc dục","quan đới","lâm quan",
    "đế vượng","suy","bệnh","tử","mộ","tuyệt","thai","dưỡng"
  ];

  const cuc = (data.cucSo || "").toLowerCase();
  const menhAD = (data.menh || "").toLowerCase();

  const startCung = START[cuc];
  if (!startCung) return;

  const chieu = (menhAD.includes("dương nam") || menhAD.includes("âm nữ"))
    ? "thuận" : "nghịch";

  let idxStart = CUNG_THUAN.indexOf(startCung);
  if (idxStart < 0) return;

  for (let i = 0; i < 12; i++) {
    const idx = (chieu === "thuận")
      ? (idxStart + i) % 12
      : (idxStart - i + 12) % 12;
    const cung = CUNG_THUAN[idx];
    const sao = VONG_TS[i];
    const cell = document.getElementById("cell" + cellMap[cung]);
    if (!cell) continue;
    let layer8 = cell.querySelector(".layer-8");
    if (!layer8) {
      layer8 = document.createElement("div");
layer8.className = "layer-8";  // ✅ 
      const inner = document.createElement("div");
      inner.className = "layer8-div";
      layer8.appendChild(inner);
      cell.appendChild(layer8);
    }
    const inner = layer8.querySelector(".layer8-div");
    if (inner) inner.textContent = sao;
  }

  console.log("🌿 Hoàn tất an Layer 8 – Vòng Tràng Sinh");
}















// =====================================================
// 🌟 CLICK SAO HÓA → SÁNG SAO GỐC (tự động nhận năm hạn nếu đang xem hạn)
// =====================================================
document.addEventListener("click", (ev) => {
  const target = ev.target;
  const container = document.getElementById("lasoContainer");
  if (!container) return;

  const insideBang = container.contains(target);
  

  // 🟢 Nếu click ra ngoài vùng lá số → reset toàn bộ sáng
  if (!insideBang) {
    document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
    window.tuHoaClicked = false;
    return;
  }

  // 🟢 Nếu đang ở chế độ sao Hóa mà click vào vùng khác KHÔNG có chữ "Hóa" → tắt sáng sao Hóa
  if (window.tuHoaClicked && !target.textContent.includes("Hóa")) {
    document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
    window.tuHoaClicked = false;
  }

  // ✅ Nếu click không phải sao Hóa → thoát khỏi logic Hóa
  if (!target.textContent.includes("Hóa")) return;

  // ✅ Kiểm tra có thật sự click đúng chữ sao Hóa không
  const isExactHoa =
    target &&
    target.nodeType === 1 &&
    target.children.length === 0 &&
    target.textContent.trim().includes("Hóa");

  if (!isExactHoa) {
    if (window.tuHoaClicked) {
      document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
      window.tuHoaClicked = false;
    }
    return;
  }

  // 🚀 Bắt đầu xử lý thật khi click đúng chữ Hóa
  window.tuHoaClicked = true;
  console.log("✅ Đã click vào:", target.textContent);

  const tenHoa = target.textContent.trim();

 
// 🔍 Xác định CAN năm phù hợp với loại sao Hóa được click
let canNam = "";

// Nếu là sao Tiểu Vận (bắt đầu bằng "L.")
if (tenHoa.startsWith("L.")) {
  canNam = window.dataGlobal?.canChiHan?.split(" ")[0] || "";
}
// Nếu là sao Đại Vận (bắt đầu bằng "ĐV.")
else if (tenHoa.startsWith("ĐV.")) {
  canNam = window.dataGlobal?.canChiDaiVan?.split(" ")[0] || "";
}
// Nếu là sao Nguyệt Vận (bắt đầu bằng "N.")
else if (tenHoa.startsWith("N.")) {
  canNam = window.dataGlobal?.luuHan?.canChiThang?.split(" ")[0] || "";
}
// ✅ Nếu là sao Nhật Vận (bắt đầu bằng "Nh.")
else if (tenHoa.startsWith("Nh.")) {
  canNam = window.dataGlobal?.luuHan?.canChiNgay?.split(" ")[0] || "";
}
// Còn lại: sao gốc năm sinh
else {
  canNam = window.dataGlobal?.canChiNam?.split(" ")[0] || "";
}




  const TU_HOA = {
    "Giáp": { loc:"Liêm Trinh", quyen:"Phá Quân", khoa:"Vũ Khúc", ky:"Thái Dương" },
    "Ất": { loc:"Thiên Cơ", quyen:"Thiên Lương", khoa:"Tử Vi", ky:"Thái Âm" },
    "Bính": { loc:"Thiên Đồng", quyen:"Thiên Cơ", khoa:"Văn Xương", ky:"Liêm Trinh" },
    "Đinh": { loc:"Thái Âm", quyen:"Thiên Đồng", khoa:"Thiên Cơ", ky:"Cự Môn" },
    "Mậu": { loc:"Tham Lang", quyen:"Thái Âm", khoa:"Hữu Bật", ky:"Thiên Cơ" },
    "Kỷ": { loc:"Vũ Khúc", quyen:"Tham Lang", khoa:"Thiên Lương", ky:"Văn Khúc" },
    "Canh": { loc:"Thái Dương", quyen:"Vũ Khúc", khoa:"Thiên Đồng", ky:"Thái Âm" },
    "Tân": { loc:"Cự Môn", quyen:"Thái Dương", khoa:"Văn Khúc", ky:"Văn Xương" },
    "Nhâm": { loc:"Thiên Lương", quyen:"Tử Vi", khoa:"Tả Phù", ky:"Vũ Khúc" },
    "Quý": { loc:"Phá Quân", quyen:"Cự Môn", khoa:"Thái Âm", ky:"Tham Lang" }
  };

  const hoa = TU_HOA[canNam];
  if (!hoa) return;

  // ✅ Xác định sao gốc đúng theo năm đang xem
  let goc = "";
  if (tenHoa.includes("Lộc")) goc = hoa.loc;
  if (tenHoa.includes("Quyền")) goc = hoa.quyen;
  if (tenHoa.includes("Khoa")) goc = hoa.khoa;
  if (tenHoa.includes("Kỵ")) goc = hoa.ky;
  if (!goc) return;

  console.log(`🌸 ${tenHoa} (${canNam}) → Sao gốc: ${goc}`);


  // 🧹 Xóa sáng cũ
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // 🌟 Làm sáng chính sao Hóa bạn vừa click
  target.classList.add("sao-highlight");
  target.offsetHeight;
target.style.transform = "translateZ(0)";


  // ✨ Tìm và sáng sao gốc
const cleanGoc = goc
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")  // bỏ dấu tổ hợp
  .replace(/\u0110/g, "d")          // Đ → d
  .replace(/\u0111/g, "d")          // đ → d
  .replace(/\s+/g, "")              // bỏ khoảng trắng
  .trim()
  .toLowerCase();

  let timThay = false;

  document.querySelectorAll("[class*='layer'] div, .cung div").forEach(el => {
   const name = el.textContent.trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tổ hợp
  .replace(/\u0110/g, "d")           // Đ → d
  .replace(/\u0111/g, "d")           // đ → d
  .replace(/\s+/g, "")               // bỏ khoảng trắng
  .trim()
  .toLowerCase();

    if (name === cleanGoc) {
      el.classList.add("sao-highlight");
      timThay = true;
    }
  });

if (!timThay) console.warn("Warning: Không tìm thấy sao gốc:", goc);
});






















<!-- ===================================================== -->
<!-- 🌗 LỚP 7 – TUẦN / TRIỆT -->
<!-- ===================================================== -->
// 📜 Quy tắc an Triệt
function anTriet(canNam) {
  const bangTriet = {
    "Giáp": ["Thân", "Dậu"],
    "Ất": ["Ngọ", "Mùi"],
    "Bính": ["Thìn", "Tỵ"],
    "Đinh": ["Dần", "Mão"],
    "Mậu": ["Tý", "Sửu"],
    "Kỷ": ["Thân", "Dậu"],
    "Canh": ["Ngọ", "Mùi"],
    "Tân": ["Thìn", "Tỵ"],
    "Nhâm": ["Dần", "Mão"],
    "Quý": ["Tý", "Sửu"]
  };
  return bangTriet[canNam] || [];
}

// 📜 Quy tắc an Tuần (theo bảng bạn gửi)
function anTuan(canNam, chiNam) {
  const canArr = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const bangTuan = {
    "Tý–Sửu": ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"],
    "Dần–Mão": ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"],
    "Thìn–Tỵ": ["Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"],
    "Ngọ–Mùi": ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ"],
    "Thân–Dậu": ["Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi"],
    "Tuất–Hợi": ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu"]
  };

  const canIndex = canArr.indexOf(canNam);
  if (canIndex === -1) return [];

  // Duyệt từng hàng (cặp Tuần)
  for (const [capTuan, danhSachChi] of Object.entries(bangTuan)) {
    const chiO = danhSachChi[canIndex];
    if (chiO === chiNam) {
      const [c1, c2] = capTuan.split("–");
      return [c1, c2];
    }
  }
  return [];
}












// =====================================================
// 🌑 Vẽ thanh Tuần / Triệt (chuẩn quy tắc cố định + gộp Tuần–Triệt)
// =====================================================
function veThanhTuanTriet(ten, cung1, cung2) {
  // 🔠 Viết hoa chữ đầu, các chữ sau viết thường
  ten = ten.charAt(0).toUpperCase() + ten.slice(1).toLowerCase();

  const map = {
    "Tý":11, "Sửu":10, "Dần":9, "Mão":7,
    "Thìn":5, "Tỵ":1, "Ngọ":2, "Mùi":3,
    "Thân":4, "Dậu":6, "Tuất":8, "Hợi":12
  };

  const key = [cung1, cung2].sort().join("-");
  const existing = document.querySelector(`[data-cap="${key}"]`);

  // ✅ Nếu đã có thanh Tuần/Triệt → chỉ thêm chữ, rồi căn lại giữa
  if (existing) {
    if (!existing.innerText.includes(ten)) {
      existing.innerHTML = `<span>${existing.innerText.trim()} – ${ten}</span>`;

      // 🕒 Chờ DOM cập nhật xong, rồi đo lại kích thước thật để căn giữa
      requestAnimationFrame(() => {
        const newWidth = existing.offsetWidth;
        const oldWidth = existing.dataset.oldWidth ? parseFloat(existing.dataset.oldWidth) : newWidth;
        const currentLeft = parseFloat(existing.style.left) || 0;
        existing.style.left = (currentLeft - (newWidth - oldWidth) / 2) + "px";
        existing.dataset.oldWidth = newWidth; // lưu lại cho lần sau
      });
    }
    return;
  }

  // 📦 Lấy DOM các cung
  const c1 = document.getElementById("cell" + map[cung1]);
  const c2 = document.getElementById("cell" + map[cung2]);
  const container = document.getElementById("lasoContainer");
  if (!c1 || !c2 || !container) return;

  // 🎨 Tạo thanh hiển thị
  const bar = document.createElement("div");
bar.className = "tuan-triet sao";
  bar.dataset.cap = key;
  bar.innerHTML = `<span>${ten}</span>`;
  Object.assign(bar.style, {
    position: "absolute",
    background: "black",
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    borderRadius: "6px",
    zIndex: "200",
    fontSize: "9px",
    height: "13px",
    lineHeight: "16px",
    padding: "0 20px",
    whiteSpace: "nowrap",
    letterSpacing: "0.3px"
  });
  container.appendChild(bar);

  // 🎯 Tính vị trí thật (theo layout)
  const rect1 = c1.getBoundingClientRect();
  const rect2 = c2.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const midX = ((rect1.left + rect1.right) / 2 + (rect2.left + rect2.right) / 2) / 2 - containerRect.left;
  const midY = ((rect1.top + rect1.bottom) / 2 + (rect2.top + rect2.bottom) / 2) / 2 - containerRect.top;

  let x = midX - bar.offsetWidth / 2;
  let y = midY - bar.offsetHeight / 2;

  // 🔹 Quy tắc cố định 6 cặp
 if (["Tý-Sửu", "Sửu-Tý"].includes(key)) {
  // 🔹 Đè lên đúng thanh ngang biên trên
  y = rect1.top - containerRect.top - bar.offsetHeight / 2;
}
else if (["Ngọ-Mùi", "Mùi-Ngọ"].includes(key)) {
  // 🔹 Đè lên đúng thanh ngang biên dưới
  y = rect1.bottom - containerRect.top - bar.offsetHeight / 2;
}
 
  else {
    // 👉 4 cặp còn lại giữa biên
    y = midY - bar.offsetHeight / 2;
  }

  bar.style.left = `${x}px`;
  bar.style.top = `${y}px`;
  bar.dataset.oldWidth = bar.offsetWidth;
}

const CUNG_MAP = {
  "Tý": 11, "Sửu": 10, "Dần": 9, "Mão": 7, "Thìn": 5, "Tỵ": 1,
  "Ngọ": 2, "Mùi": 3, "Thân": 4, "Dậu": 6, "Tuất": 8, "Hợi": 12
};

const TIEUTINH_DATA = [
  { ten: "Thái Tuế", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "ThaiTue", huong: "thuận", ghiChu: "An tại cung có địa chi năm sinh (Thái Tuế)." },
  { ten: "Thiếu Dương", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 1, ghiChu: "Đếm thuận từ Thái Tuế 1 cung." },
  { ten: "Tang Môn", hanh: "Mộc", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 2, ghiChu: "Đếm thuận từ Thái Tuế 2 cung." },
  { ten: "Thiếu Âm", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Tình Duyên","Tiền bạc"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 3, ghiChu: "Đếm thuận từ Thái Tuế 3 cung." },
  { ten: "Quan Phù", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 4, ghiChu: "Đếm thuận từ Thái Tuế 4 cung." },
  { ten: "Tử Phù", hanh: "Kim", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 5, ghiChu: "Đếm thuận từ Thái Tuế 5 cung." },
  { ten: "Tuế Phá", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 6, ghiChu: "Đếm thuận từ Thái Tuế 6 cung." },
  { ten: "Long Đức", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 7, ghiChu: "Đếm thuận từ Thái Tuế 7 cung." },
  { ten: "Bạch Hổ", hanh: "Kim", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 8, ghiChu: "Đếm thuận từ Thái Tuế 8 cung." },
  { ten: "Phúc Đức", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 9, ghiChu: "Đếm thuận từ Thái Tuế 9 cung." },
  { ten: "Điếu Khách", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 10, ghiChu: "Đếm thuận từ Thái Tuế 10 cung." },
  { ten: "Trực Phù", hanh: "Kim", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoThaiTue", huong: "thuận", buoc: 11, ghiChu: "Đếm thuận từ Thái Tuế 11 cung." }
];
// 🌟 Nhóm tiểu tinh an theo Địa Chi Năm Sinh
TIEUTINH_DATA.push(
  { ten: "Phượng Các", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Giải Thần", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Long Trì", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Nguyệt Đức", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Thiên Đức", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Thiên Hỷ", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Thiên Khốc", hanh: "Thủy", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoDiaChiNam", dsCung: ["Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Thiên Hư", hanh: "Thủy", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoDiaChiNam", dsCung: ["Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Đào Hoa", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Ngọ","Mão","Tý","Dậu","Ngọ","Mão","Tý","Dậu","Ngọ","Mão","Tý"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Hồng Loan", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Hoa Cái", hanh: "Kim", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Thìn","Sửu","Tuất","Mùi","Thìn","Sửu","Tuất","Mùi","Thìn","Sửu","Tuất","Mùi"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Kiếp Sát", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Dần","Hợi","Thân","Tỵ","Dần","Hợi","Thân","Tỵ","Dần","Hợi","Thân"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Phá Toái", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Cô Thần", hanh: "Thổ", loai: "Hung", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Dần","Dần","Tỵ","Tỵ","Tỵ","Thân","Thân","Thân","Hợi","Hợi","Hợi","Dần"], ghiChu: "An theo địa chi năm sinh." },
  { ten: "Quả Tú", hanh: "Thổ", loai: "Hung", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Tuất","Sửu","Sửu","Sửu","Thìn","Thìn","Thìn","Mùi","Mùi","Mùi","Tuất"], ghiChu: "An theo địa chi năm sinh." }
);
// 🌙 Nhóm Tiểu Tinh an theo Tháng Sinh
TIEUTINH_DATA.push(
  { ten: "Thiên Hình", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả"], congThuc: "TheoThangSinh", dsCung: ["Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân"], ghiChu: "An theo tháng âm lịch (1–12) cố định theo bảng tra." },
  { ten: "Thiên Riêu", hanh: "Thủy", loai: "Hung", nhom: ["Tất Cả"], congThuc: "TheoThangSinh", dsCung: ["Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý"], ghiChu: "An theo tháng âm lịch (1–12) cố định theo bảng tra." },
  { ten: "Thiên Y", hanh: "Thủy", loai: "Hung", nhom: ["Tất Cả"], congThuc: "TheoThangSinh", dsCung: ["Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý"], ghiChu: "An theo tháng âm lịch (1–12) cố định theo bảng tra." },
  { ten: "Thiên Giải", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoThangSinh", dsCung: ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi"], ghiChu: "An theo tháng âm lịch (1–12) cố định theo bảng tra." },
  { ten: "Địa Giải", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoThangSinh", dsCung: ["Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ"], ghiChu: "An theo tháng âm lịch (1–12) cố định theo bảng tra." }
);


// 🕒 Nhóm Tiểu Tinh an theo Giờ Sinh
TIEUTINH_DATA.push(
  { ten: "Thai Phụ", hanh: "Kim", loai: "Cát", nhom: ["Tất Cả","Công Danh","Tình Duyên"], congThuc: "TheoGioSinh", dsCung: ["Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ"], ghiChu: "An theo giờ sinh (Tý–Sửu–...–Hợi)." },
  { ten: "Phong Cáo", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoGioSinh", dsCung: ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"], ghiChu: "An theo giờ sinh (Tý–Sửu–...–Hợi)." }
);
// 💫 Nhóm Tiểu Tinh an theo Lộc Tồn
TIEUTINH_DATA.push(
  { ten: "Bác Sĩ", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoLocTon", buoc: 0, ghiChu: "An cùng cung với Lộc Tồn." },
  { ten: "Lực Sĩ", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoLocTon", buoc: 1, ghiChu: "Sau hoặc Trước Lộc Tồn 1 cung tùy Âm Dương Nam Nữ." },
  { ten: "Thanh Long", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoLocTon", buoc: 2, ghiChu: "Sau hoặc Trước Lộc Tồn 2 cung tùy Âm Dương Nam Nữ." },
  { ten: "Tiểu Hao", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Tiền Bạc"], congThuc: "TheoLocTon", buoc: 3, ghiChu: "Sau hoặc Trước Lộc Tồn 3 cung tùy Âm Dương Nam Nữ." },
  { ten: "Tướng Quân", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoLocTon", buoc: 4, ghiChu: "Sau hoặc Trước Lộc Tồn 4 cung tùy Âm Dương Nam Nữ." },
  { ten: "Tấu Thư", hanh: "Kim", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TheoLocTon", buoc: 5, ghiChu: "Sau hoặc Trước Lộc Tồn 5 cung tùy Âm Dương Nam Nữ." },
  { ten: "Phi Liêm", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả"], congThuc: "TheoLocTon", buoc: 6, ghiChu: "Sau hoặc Trước Lộc Tồn 6 cung tùy Âm Dương Nam Nữ." },
  { ten: "Hỷ Thần", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả","Tình Duyên"], congThuc: "TheoLocTon", buoc: 7, ghiChu: "Sau hoặc Trước Lộc Tồn 7 cung tùy Âm Dương Nam Nữ." },
  { ten: "Bệnh Phù", hanh: "Thổ", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoLocTon", buoc: 8, ghiChu: "Sau hoặc Trước Lộc Tồn 8 cung tùy Âm Dương Nam Nữ." },
  { ten: "Đại Hao", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Tiền Bạc"], congThuc: "TheoLocTon", buoc: 9, ghiChu: "Sau hoặc Trước Lộc Tồn 9 cung tùy Âm Dương Nam Nữ." },
  { ten: "Phục Binh", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoLocTon", buoc: 10, ghiChu: "Sau hoặc Trước Lộc Tồn 10 cung tùy Âm Dương Nam Nữ." },
  { ten: "Quan Phủ", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoLocTon", buoc: 11, ghiChu: "Sau hoặc Trước Lộc Tồn 11 cung tùy Âm Dương Nam Nữ." }
);
// 📅 Nhóm Tiểu tinh theo NGÀY SINH
TIEUTINH_DATA.push(
  // Thiên Quý: từ Văn Khúc đếm NGHỊCH đến ngày sinh, rồi lùi 1 cung
  { ten: "Thiên Quý", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoNgay_ThienQuy", ghiChu: "Từ Văn Khúc đếm nghịch đến ngày sinh, lùi 1 cung." },

  // Ân Quang: từ Văn Xương đếm THUẬN đến ngày sinh, rồi lùi 1 cung
  { ten: "Ân Quang", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoNgay_AnQuang", ghiChu: "Từ Văn Xương đếm thuận đến ngày sinh, lùi 1 cung." },

  // Tam Thai: từ Tả Phụ đếm THUẬN đến ngày sinh
  { ten: "Tam Thai", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoNgay_TamThai", ghiChu: "Từ Tả Phụ đếm thuận đến ngày sinh." },

  // Bát Tọa: từ Hữu Bật đếm NGHỊCH đến ngày sinh
  { ten: "Bát Tọa", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TheoNgay_BatToa", ghiChu: "Từ Hữu Bật đếm nghịch đến ngày sinh." }
);

// 🌟 Nhóm Tiểu Tinh an theo Can Năm Sinh
TIEUTINH_DATA.push(
  { ten: "Lưu Hà", hanh: "Thủy", loai: "Hung", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Dậu","Tuất","Mùi","Thìn","Tỵ","Ngọ","Thân","Mão","Hợi","Dần"], ghiChu: "An theo Can năm sinh (Giáp→Ất→Bính→Đinh→Mậu→Kỷ→Canh→Tân→Nhâm→Quý)." },
  { ten: "Quốc Ấn", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Tuất","Hợi","Sửu","Dần","Sửu","Dần","Thìn","Tỵ","Mùi","Thân"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." },
  { ten: "Đường Phù", hanh: "Mộc", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Mùi","Thân","Tuất","Hợi","Tuất","Hợi","Sửu","Dần","Thìn","Tỵ"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." },
  { ten: "Văn Tinh", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Tỵ","Ngọ","Thân","Dậu","Thân","Dậu","Hợi","Tý","Dậu","Mão"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." },
  { ten: "Thiên Quan", hanh: "Hỏa", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Mùi","Thìn","Tỵ","Dần","Mão","Dậu","Hợi","Dậu","Tuất","Ngọ"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." },
  { ten: "Thiên Phúc", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Dậu","Thân","Tý","Hợi","Mão","Dần","Ngọ","Tỵ","Ngọ","Tỵ"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." },
  { ten: "Thiên Trù", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả"], congThuc: "TheoCanNamSinh", dsCung: ["Tỵ","Ngọ","Tý","Tỵ","Ngọ","Thân","Dần","Ngọ","Dậu","Tuất"], ghiChu: "An theo Can năm sinh (Giáp→Ất→...→Quý)." }
);

// 🌟 Nhóm TIỂU TINH – TẠP TINH (đặc biệt, mỗi sao 1 quy tắc riêng)
TIEUTINH_DATA.push(
  { ten: "Đẩu Quân", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TapTinh_DauQuan", ghiChu: "Tính nghịch từ Thái Tuế (Dần) đến tháng sinh, rồi thuận theo giờ sinh." },
  { ten: "Thiên Không", hanh: "Hỏa", loai: "Hung", nhom: ["Tất Cả","Công Danh"], congThuc: "TapTinh_ThienKhong", ghiChu: "An sau Thái Tuế, cùng cung Thiếu Dương." },
  { ten: "Thiên Tài", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TapTinh_ThienTai", ghiChu: "Đặt Tý ở Mệnh, đếm thuận đến năm sinh." },
  { ten: "Thiên Thọ", hanh: "Thổ", loai: "Cát", nhom: ["Tất Cả","Công Danh"], congThuc: "TapTinh_ThienTho", ghiChu: "Đặt Tý ở Thân, đếm thuận đến năm sinh." },
{ ten: "Thiên Thương", hanh: "Thổ", loai: "Hung", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TapTinh_CuDinh", cuDinh: "Nô Bộc", ghiChu: "An tại Nô Bộc." },
{ ten: "Thiên Sứ", hanh: "Thủy", loai: "Cát", nhom: ["Tất Cả","Sức Khỏe"], congThuc: "TapTinh_CuDinh", cuDinh: "Tật Ách", ghiChu: "An tại Tật Ách." },
{ ten: "Thiên La", hanh: "Kim", loai: "Hung", nhom: ["Tất Cả"], congThuc: "codinh", dsCung: ["Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn","Thìn"], ghiChu: "An cố định tại Thìn." },
{ ten: "Địa Võng", hanh: "Kim", loai: "Hung", nhom: ["Tất Cả"], congThuc: "codinh", dsCung: ["Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất","Tuất"], ghiChu: "An cố định tại Tuất." }
);



// ===== Helpers cho nhóm theo NGÀY SINH (đặt TRƯỚC tinhCungTieuTinh) =====
const __CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

// Map ngược id ô -> tên chi (vd: cell11 -> "Tý")
const REVERSE_CUNG = Object.fromEntries(
  Object.entries(CUNG_MAP).map(([chi, idx]) => [idx, chi])
);

// Chuẩn hóa sao: bỏ dấu, xử lý Đ/đ, xoá trắng, viết thường
function __norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")         // Đ → d
    .replace(/\u0111/g, "d")         // đ → d
    .replace(/\s+/g, "")             // bỏ khoảng trắng
    .trim()
    .toLowerCase();
}


// Tìm địa chi ô đang chứa 1 sao mốc (Xương/Khúc/Tả/Hữu) trong LAYER 6 trung tinh
function __timCungChuaSao(tenSao) {
  const target = __norm(tenSao); // "van xuong", "van khuc", "ta phu", "huu bat"
  // chỉ quét sao trung tinh (loại .tieutinh ra)
  const els = document.querySelectorAll('.layer-6 .sao:not(.tieutinh)');

  for (const el of els) {
    const txt = __norm(el.textContent);
    if (txt === target || txt.includes(target)) {
      const cellEl = el.closest('[id^="cell"]');
      if (!cellEl) continue;
      const idNum = parseInt(cellEl.id.replace('cell',''), 10);
      return REVERSE_CUNG[idNum] || null;
    }
  }
  return null; // không thấy
}

// Đếm từ startChi tới NGÀY sinh (1..30) theo chiều 'thuan'|'nghich', cộng offset
function __demToiNgay(startChi, ngay, chieu, offset = 0) {
  if (!startChi) return "Tý";
  const step12 = ((parseInt(ngay,10) || 1) - 1) % 12; // ngày 1 = bước 0
  const startIdx = __CHI_LIST.indexOf(startChi);
  if (startIdx < 0) return "Tý";
  const dir = (chieu === "nghich") ? -1 : 1;
  const idx = (startIdx + dir * step12 + offset + 1200) % 12;
  return __CHI_LIST[idx];
}
// 🧭 Trả về chỉ số 0–9 tương ứng với Can năm sinh (Giáp→Quý)
function getCanIndex(canNam) {
  const CAN_LIST = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const idx = CAN_LIST.indexOf((canNam || "").trim());
  return idx >= 0 ? idx : 0; // nếu sai hoặc null → mặc định 0 (Giáp)
}
function tinhCungTieuTinh(sao, data) {
  // 🔹 Nếu thiếu canChiNam, bổ sung từ window.dataGlobal
  if (!data.canChiNam && window.dataGlobal?.canChiNam) {
    data.canChiNam = window.dataGlobal.canChiNam;
  }

  // 💡 Tách chi năm từ thuộc tính canChiNam (VD: "Ất Tý" → "Tý")
  const chiNam = (data.canChiNam || "").split(" ")[1] || null;
  const canNam = (data.canChiNam || "").split(" ")[0] || null;

  if (!chiNam) {
    console.warn("⚠️ Không tìm thấy chi năm sinh trong dataGlobal!"); 
    return "Tý"; // fallback tránh crash
  }


  const chiList = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const next = (chi, n = 1) => chiList[(chiList.indexOf(chi) + n + 12) % 12];

  switch (sao.congThuc) {
    case "ThaiTue":
      return chiNam; // Thái Tuế an tại chi năm sinh
    case "TheoThaiTue":
      return next(chiNam, sao.buoc); // các sao khác đếm thuận
   case "TheoDiaChiNam": {
  const chiNam = (data.canChiNam || "").split(" ")[1] || null;
  const chiList = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  if (!chiNam) return "Tý";
  const idx = chiList.indexOf(chiNam);
  if (idx === -1) return "Tý";
  return sao.dsCung ? sao.dsCung[idx] : "Tý";
}
case "TheoThangSinh": {
  let thang = Number(String(data.thangAm || data.thangSinh || "").replace(/\D/g, ""));
  if (!thang || thang < 1 || thang > 12) {
    console.warn("⚠️ Thiếu tháng âm hợp lệ, tạm lấy tháng 1");
    thang = 1;
  }
  const idx = thang - 1;
  return sao.dsCung[idx] || "Tý";
}




case "TheoGioSinh": {
  const chiGio = (data.gioAm || data.gioSinhChi || "Tý").trim(); // ưu tiên giờ âm
  const chiList = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const idx = chiList.indexOf(chiGio);
  return sao.dsCung ? sao.dsCung[idx >= 0 ? idx : 0] : "Tý";
}
case "TheoLocTon": {
  const chiList = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  // 1) Lấy CAN & CHI năm
  const canNam = (data.canChiNam || "").split(" ")[0] || "";   // "Ất"
  // Nếu đã có sẵn locTonChi trong dataGlobal thì dùng luôn, còn không thì suy ra theo Can:
  let locTon = data.locTonChi;
  if (!locTon) {
    const locTonMap = {
      "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ",
      "Mậu":"Tỵ","Kỷ":"Ngọ","Canh":"Thân","Tân":"Dậu",
      "Nhâm":"Hợi","Quý":"Tý"
    };
    locTon = locTonMap[canNam] || "Tý";
  }

  // 2) Xác định Âm/Dương & Nam/Nữ để quyết định chiều
  //   Quy ước: Dương Nam / Âm Nữ -> đi THUẬN;  Dương Nữ / Âm Nam -> đi NGHỊCH
  const rawMenh = (data.menh || "").toLowerCase();   // "âm nam" / "dương nữ" ...
  const rawGender = (data.gender || data.gioiTinh || "").toLowerCase(); // "nam"/"nữ"

  const isDuong = rawMenh.includes("dương");
  const isNam   = rawGender.includes("nam") || rawMenh.includes("nam");
  const thuan   = (isDuong && isNam) || (!isDuong && !isNam);

  // 3) Tính vị trí theo bước
  const idx0   = chiList.indexOf(locTon);
  if (idx0 === -1) return "Tý";

  const step   = sao.buoc || 0;           // Bác Sĩ = 0 -> đồng cung Lộc Tồn
  const newIdx = thuan
      ? (idx0 + step) % 12               // đi thuận
      : (idx0 - step + 12) % 12;         // đi nghịch

  return chiList[newIdx];
}
case "TheoNgay_ThienQuy": {
  const chiGio = (data.gioAm || data.gioSinhChi || "Tý").trim();
  const ngay = parseInt(data.ngayAm || data.ngaySinh || 1);

  // ✅ Vòng thuận theo chiều Tử Vi (ngược kim đồng hồ)
  const CUNG_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI   = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  const gioIndex = GIO_CHI.indexOf(chiGio);
  if (gioIndex === -1) return "Thìn";

  // 🟣 DEBUG: Thiên Quý
  console.group("🟢 DEBUG THIÊN QUÝ");
  console.log("Giờ sinh:", chiGio, "| Ngày âm:", ngay);
  console.log("→ Khởi cung Thìn coi là giờ Tý");

  // 🔹 B1: Thìn (giờ Tý) → THUẬN đến giờ sinh (Văn Khúc)
  const posThìn = CUNG_TUVI.indexOf("Thìn");
  const posVanKhuc = (posThìn + gioIndex) % 12;
  const cungVanKhuc = CUNG_TUVI[posVanKhuc];
  console.log(`➡️ Đi thuận ${gioIndex} bước → ${cungVanKhuc} (Văn Khúc)`);

  // 🔹 B2: Từ Văn Khúc → NGHỊCH (ngày sinh - 1)
  const posVan = CUNG_TUVI.indexOf(cungVanKhuc);
  const buocNghich = (ngay - 2 + 12) % 12; // ngày 1 lùi 1
  const posThienQuy = (posVan - buocNghich + 12) % 12;
  const cungThienQuy = CUNG_TUVI[posThienQuy];

  console.log(`⬅️ Từ ${cungVanKhuc} đi nghịch ${buocNghich} bước → ${cungThienQuy} (Thiên Quý)`);
  console.groupEnd();

  return cungThienQuy;
}





case "TheoNgay_AnQuang": {
  const chiGio = (data.gioAm || data.gioSinhChi || "Tý").trim();
  const ngay = parseInt(data.ngayAm || data.ngaySinh || 1);

  // Vòng Tử Vi (ngược kim đồng hồ)
  const CUNG_TUVI = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI   = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  const gioIndex = GIO_CHI.indexOf(chiGio);
  if (gioIndex === -1) return "Tuất";

  // 🪶 DEBUG STEP 1
  console.group("🟣 DEBUG ÂN QUANG");
  console.log("Giờ sinh:", chiGio, "| Ngày âm:", ngay);
  console.log("→ Khởi cung Tuất coi là giờ Tý");

  // B1: Tuất → NGHỊCH đến giờ sinh (TRỪ)
  const posTuất = CUNG_TUVI.indexOf("Tuất");
  const posVanXuong = (posTuất - gioIndex + 12) % 12;
  const cungVanXuong = CUNG_TUVI[posVanXuong];
  console.log(`➡️ Đi nghịch ${gioIndex} bước → ${cungVanXuong} (Văn Xương)`);

  // B2: Từ Văn Xương → THUẬN (ngày sinh - 1)
  const posVan = CUNG_TUVI.indexOf(cungVanXuong);
  const buocThuan = (ngay - 2 + 12) % 12; // vì ngày 1 phải lùi 1 → tức là -1 thực tế
  const posAnQuang = (posVan + buocThuan) % 12;
  const cungAnQuang = CUNG_TUVI[posAnQuang];

  console.log(`➡️ Từ ${cungVanXuong} đi thuận ${buocThuan} bước → ${cungAnQuang} (Ân Quang)`);
  console.groupEnd();

  return cungAnQuang;
}








case "TheoNgay_TamThai": {
  // 🌕 Tam Thai: Khởi từ Thìn, thuận tháng sinh an Tả Phù → thuận ngày sinh an Tam Thai
  const VONG_12 = ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"];

  // 🔹 Lấy tháng và ngày âm (ưu tiên dữ liệu âm lịch)
  const thang = parseInt(data?.lunar?.[1] || data?.thangAm || 1);
  const ngay  = parseInt(data?.lunar?.[0] || data?.ngayAm || 1);

  // 🔹 Phòng lỗi (nếu thiếu dữ liệu)
  if (isNaN(thang) || isNaN(ngay)) return "Thìn";

  // 🔹 B1: Khởi từ Thìn → thuận tháng sinh để an Tả Phù
  const posTaPhu = (thang - 1) % 12;

  // 🔹 B2: Từ cung Tả Phù → thuận ngày sinh để an Tam Thai
  const idx = (posTaPhu + ((ngay - 1) % 12)) % 12;

  // 🔹 Trả về tên cung
  return VONG_12[idx];
}







case "TheoNgay_BatToa": {
  // 🌕 Bát Tọa: Khởi từ Tuất, nghịch tháng sinh an Hữu Bật → nghịch ngày sinh an Bát Tọa
  const VONG_12 = ["Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu"];

  // 🔹 Lấy tháng & ngày âm
  const thang = parseInt(data?.lunar?.[1] || data?.thangAm || 1);
  const ngay  = parseInt(data?.lunar?.[0] || data?.ngayAm || 1);

  if (isNaN(thang) || isNaN(ngay)) return "Tuất"; // fallback an toàn

  // 🔹 B1: Khởi Tuất → nghịch theo tháng sinh → an Hữu Bật
  const posHuuBat = (0 - (thang - 1) + 12) % 12;

  // 🔹 B2: Từ Hữu Bật → nghịch theo ngày sinh → an Bát Tọa
  const idx = (posHuuBat - ((ngay - 1) % 12) + 12) % 12;

  // 🔹 Trả về kết quả
  return VONG_12[idx];
}







case "TheoCanNamSinh": {
  let canIndex = getCanIndex(canNam); // Giáp=0 → Quý=9
  return sao.dsCung[canIndex];
}

case "TapTinh_DauQuan": {
  // 🌟 Vòng 12 cung cố định
  const VONG_12 = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const idx = cung => VONG_12.indexOf(cung);

  // 🧭 Lấy địa chi năm sinh (ví dụ "Ất Tỵ" → "Tỵ")
  const chiNam = (data.canChiNam || "").split(" ")[1] || "Tý";
  if (!VONG_12.includes(chiNam)) return "Tý";

  // 🪶 Cung Thái Tuế đặt tại địa chi năm sinh
  const posThaiTue = idx(chiNam);

  // 🈷️ Xác định tháng âm (1–12)
  const thangAm = parseInt(data.lunar?.[1] || data.thangAm || 1);

  // 🔹 Tháng 1 bắt đầu tại Thái Tuế → đếm NGHỊCH đến tháng sinh
  const cungThang = VONG_12[(posThaiTue - (thangAm - 1) + 12 * 10) % 12];
  const posThang = idx(cungThang);

  // 🕒 Lấy địa chi giờ sinh
  const gioChi = (data.canChiGio || "").split(" ")[1] || "Tý";
  const posGio = GIO_CHI.indexOf(gioChi);
  if (posGio === -1) return cungThang;

  // 🚀 Từ cung tháng, đếm THUẬN theo giờ sinh để được cung Đẩu Quân
  const cungDauQuan = VONG_12[(posThang + posGio) % 12];

  return cungDauQuan;
}


case "TapTinh_ThienKhong": {
  // Sau Thái Tuế 1 cung, cùng Thiếu Dương
  const chiNam = (data.canChiNam || "").split(" ")[1] || "Dần";
  const chiList = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const idx = chiList.indexOf(chiNam);
  return chiList[(idx + 1) % 12]; // sau 1 cung
}

case "TapTinh_ThienTai": {
  // 🌟 Xác định cung Mệnh theo tháng & giờ sinh
  const thang = parseInt(data.thangAm || data.thangSinh || 1);
  const gioChi = (data.gioAm || data.gioSinhChi || "Tý").trim();
  const chiNam = (data.canChiNam || "").split(" ")[1] || "Tý";

  const VONG_CUNG = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI  = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const CHI_NAM  = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  // --- B1: Cung khởi tháng
  const posDan = VONG_CUNG.indexOf("Dần");
  const posThang = (posDan + (thang - 1)) % 12; // Dần là tháng 1 → thuận
  const cungGioTy = VONG_CUNG[posThang]; // Cung giờ Tý

  // --- B2: Đếm NGHỊCH từ cung giờ Tý đến giờ sinh
  const gioIndex = GIO_CHI.indexOf(gioChi);
  const posGioTy = VONG_CUNG.indexOf(cungGioTy);
  const posMenh = (posGioTy - gioIndex + 12) % 12;
  const cungMenh = VONG_CUNG[posMenh]; // ✅ Cung Mệnh thực tế

  // --- B3: Từ Mệnh (năm Tý) đếm THUẬN đến chi năm sinh
  const posTyNam = CHI_NAM.indexOf("Tý");
  const posChiNam = CHI_NAM.indexOf(chiNam);
  const steps = (posChiNam - posTyNam + 12) % 12;
  const posThienTai = (posMenh + steps) % 12;
  return VONG_CUNG[posThienTai];
}





case "TapTinh_ThienTho": {
  // 🌟 Thiên Thọ: Tự tính khép kín, không gọi biến ngoài
  // Quy tắc: Dần khởi tháng 1 → thuận đến tháng sinh (cung Giờ Tý)
  // → thuận đến giờ sinh (Cung An Thân) → thuận đến chi năm sinh (Cung Thiên Thọ)
  
  const chiNam = (data.canChiNam || "").split(" ")[1] || "Tý";
  const thang = parseInt(data.thangAm || data.thangSinh || 1);
  const gioChi = (data.gioAm || data.gioSinhChi || "Tý").trim();

  // Vòng 12 cung tử vi
  const VONG_12 = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const CHI_NAM = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  // 1️⃣ Từ Dần → đếm thuận theo tháng sinh (cung Giờ Tý)
  const posThang = (VONG_12.indexOf("Dần") + (thang - 1)) % 12;
  const cungGioTy = VONG_12[posThang];

  // 2️⃣ Từ cung Giờ Tý → đếm thuận theo giờ sinh → Cung An Thân
  const gioIndex = GIO_CHI.indexOf(gioChi);
  const posGioTy = VONG_12.indexOf(cungGioTy);
  const posAnThan = (posGioTy + gioIndex) % 12;
  const cungAnThan = VONG_12[posAnThan];

  // 3️⃣ Đặt Tý tại Cung An Thân → đếm thuận đến chi năm sinh
  const step = (CHI_NAM.indexOf(chiNam) - CHI_NAM.indexOf("Tý") + 12) % 12;
  const posThienTho = (posAnThan + step) % 12;

  return VONG_12[posThienTho];
}







case "TapTinh_CuDinh": {
  // ⭐ Công thức đặc biệt cho Thiên Thương & Thiên Sứ (đảo chiều ngược)
  if (sao.ten === "Thiên Thương" || sao.ten === "Thiên Sứ") {
    const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

    const thangAm = parseInt(data.lunar[1]);
    const gioChi = data.canChiGio?.split(" ")[1];
    if (!gioChi) return "Tý";

    const idxThang = (thangAm - 1) % 12;
    const idxGio = GIO_CHI.indexOf(gioChi);
    if (idxGio === -1) return "Tý";

    // 🔹 Xác định vị trí cung Mệnh (vòng NGƯỢC)
    const idxMenh = (idxThang - idxGio + 12) % 12;

    // 🔹 NGƯỢC CHIỀU: trừ thay vì cộng
    const idxTatAch = (idxMenh - 5 + 12) % 12; // Tật Ách
    const idxNoBoc  = (idxMenh - 7 + 12) % 12; // Nô Bộc

    const cungTatAch = CUNG_THUAN[idxTatAch];
    const cungNoBoc  = CUNG_THUAN[idxNoBoc];

    if (sao.ten === "Thiên Thương") {
      console.log(`✅ ${sao.ten} an tại ${cungNoBoc} (Nô Bộc)`);
      return cungNoBoc;
    }
    if (sao.ten === "Thiên Sứ") {
      console.log(`✅ ${sao.ten} an tại ${cungTatAch} (Tật Ách)`);
      return cungTatAch;
    }
  }

  // ⭐ Các sao Tạp tinh khác – dùng cách dò chức cũ
  const chuc = sao.cuDinh;
  let map = data.cungChucMap;

  if (!map || Object.keys(map).length === 0) {
    map = window.dataGlobal?.cungChucMap || {};
  }

  if (!map || Object.keys(map).length === 0) {
    console.warn("⚠️ cungChucMap chưa sẵn sàng khi an Tạp tinh:", sao.ten);
    return "Tý";
  }

  const found = Object.entries(map).find(([chi, tenChuc]) => tenChuc === chuc);
  if (found) return found[0];

  console.warn("⚠️ Không tìm thấy cung chức cho sao Tạp tinh cố định:", sao.ten, chuc);
  return "Tý";
}

case "codinh": {
  // ⭐ Thiên La / Địa Võng – an cố định theo địa chi
  const chi = sao.dsCung ? sao.dsCung[0] : (sao.cuDinh || "Tý");
  console.log(`✅ ${sao.ten} an cố định tại ${chi}`);
  return chi;
}




 default:
      return "Mệnh";
  }
}

const MAU_NGU_HANH = {
  "Hỏa": "#ff4d4d",   // 🔥 đỏ tươi sáng – rõ hơn, không chói
  "Thổ": "#e69500",   // 🟠 cam đất đậm – rõ chữ hơn
  "Mộc": "#007a29",   // 🌿 xanh lá đậm hơn chút – dễ đọc
  "Kim": "#000000",   // ⚫ đen thuần – giữ nguyên
  "Thủy": "#004cff"   // 💧 xanh dương đậm sáng – giữ nguyên
};


function anTieuTinh(retryCount = 0) {
  const data = window.dataGlobal;

  // 🛑 Giới hạn tối đa 5 lần chờ
  if (retryCount > 5) {
    console.warn("❌ Dừng an Tiểu Tinh sau 5 lần, dữ liệu chưa sẵn sàng.");
    return;
  }

  // 🕓 1️⃣ Kiểm tra window.dataGlobal
  if (!data || typeof data !== "object") {
    console.warn("⚠️ Chưa có window.dataGlobal, chờ lần", retryCount + 1);
    return setTimeout(() => anTieuTinh(retryCount + 1), 300);
  }

  // 🕓 2️⃣ Khôi phục ngày, tháng, giờ âm nếu thiếu
  if ((!data.ngayAm || !data.thangAm) && Array.isArray(data.lunar) && data.lunar.length >= 2) {
    const [ngay, thang] = data.lunar;
    if (!data.ngayAm) data.ngayAm = ngay;
    if (!data.thangAm) data.thangAm = thang;
    console.log("🌙 Khôi phục ngày/tháng âm từ data.lunar:", { ngay, thang });
  }

  // 🔹 Tự tách “Chi giờ” nếu có canChiGio mà chưa có gioAm
  if (!data.gioAm && data.canChiGio) {
    data.gioAm = data.canChiGio.split(" ")[1]; // ví dụ: "Giáp Tý" → "Tý"
    console.log("🕐 Khôi phục giờ âm từ canChiGio:", data.gioAm);
  }

  // 🔹 Nếu sau khôi phục mà vẫn thiếu thì chờ thêm
  if (!data.gioAm || !data.ngayAm) {
    console.warn("⚠️ Thiếu giờ hoặc ngày âm, chờ lần", retryCount + 1);
    console.log("🧾 Data hiện có:", data);
    return setTimeout(() => anTieuTinh(retryCount + 1), 300);
  }

  // 🌿 4️⃣ Khi đã đủ điều kiện, tiến hành an sao thật
  console.log("🌿 Bắt đầu an Tiểu Tinh (đủ dữ liệu):", {
    gioAm: data.gioAm,
    ngayAm: data.ngayAm,
    thangAm: data.thangAm
  });

  // 🧹 Xóa sao cũ
  document.querySelectorAll(".tieutinh").forEach(el => el.remove());

  // 🪶 Thực hiện an sao
  TIEUTINH_DATA.forEach(sao => {
    const cung = tinhCungTieuTinh(sao, data);
    const cell = document.getElementById("cell" + (CUNG_MAP[cung] || ""));
    if (!cell) return;

    const layer6 = cell.querySelector(".layer-6.trungtinh") || cell.querySelector(".layer-6");
    if (!layer6) return;

    // Tạo cột Cát / Hung nếu chưa có
    let catCol = layer6.querySelector(".cat-tinh");
    let hungCol = layer6.querySelector(".hung-tinh");
    if (!catCol) {
      catCol = document.createElement("div");
      catCol.classList.add("cat-tinh");
      layer6.appendChild(catCol);
    }
    if (!hungCol) {
      hungCol = document.createElement("div");
      hungCol.classList.add("hung-tinh");
      layer6.appendChild(hungCol);
    }

    // Tạo sao tiểu tinh
    const target = sao.loai === "Cát" ? catCol : hungCol;
    const div = document.createElement("div");
    div.classList.add("sao", "tieutinh", `sao-${sao.hanh.toLowerCase()}`);
    div.dataset.groups = sao.nhom.join(",");
    div.textContent = sao.ten;
    div.style.fontWeight = "normal";
    div.style.fontSize = "12px";
    div.style.textTransform = "capitalize";
    div.style.color = MAU_NGU_HANH[sao.hanh] || "#000";

    target.appendChild(div);
  });

  console.log("✅ Tiểu Tinh đã được an xong!");
}

function toggleTieuTinh(group) {
  const key = group.trim().toLowerCase();
  const allSao = document.querySelectorAll(".tieutinh");
  const allButtons = document.querySelectorAll(".nut-tieutinh");

  // 🧭 1️⃣ Nếu là nút "Tất Cả"
  if (key === "tất cả") {
    const btnAll = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === "tất cả");
    const turningOn = !btnAll.classList.contains("active");

    // Bật/tắt tất cả nút phụ theo trạng thái nút All
    allButtons.forEach(btn => {
      if (turningOn) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  } else {
    // 🧭 2️⃣ Toggle riêng nút đang bấm
    const currentButton = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === key);
    if (currentButton) currentButton.classList.toggle("active");

    // 🧭 3️⃣ Cập nhật lại nút "Tất Cả" cho đúng
    const btnAll = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === "tất cả");
    const otherButtons = [...allButtons].filter(b => b !== btnAll);
    const allOn = otherButtons.every(b => b.classList.contains("active"));
    const noneOn = otherButtons.every(b => !b.classList.contains("active"));
    if (allOn) btnAll.classList.add("active");
    else if (noneOn) btnAll.classList.remove("active");
    else btnAll.classList.remove("active"); // Khi có pha trộn
  }

  // 🧭 4️⃣ Lấy danh sách nhóm đang bật
  const activeGroups = [...allButtons]
    .filter(btn => btn.classList.contains("active"))
    .map(btn => (btn.dataset.group || "").trim().toLowerCase());

  // 🧭 5️⃣ Duyệt từng sao để quyết định hiển thị
  allSao.forEach(sao => {
    const raw = sao.dataset.groups || "";
    const groups = raw.split(",").map(g => g.trim().toLowerCase()).filter(Boolean);

    // ⭐ Nếu sao có ÍT NHẤT 1 nhóm còn bật → hiện
    const shouldShow = groups.some(g => activeGroups.includes(g));

    if (shouldShow) {
      sao.classList.remove("hidden");
      sao.style.display = ""; // 🔥 đảm bảo hiện lại
    } else {
      sao.classList.add("hidden");
      sao.style.display = "none"; // 🔥 đảm bảo ẩn hẳn
    }
  });
}



// 🌟 TẠO NÚT ẨN / HIỆN TIỂU TINH
function taoNutTieuTinh() {
  if (document.querySelector("#tieuTinhControls")) return;

  const center = document.getElementById("centerCell");
  if (!center) return;

  const box = document.createElement("div");
  box.id = "tieuTinhControls";
  Object.assign(box.style, {
    position: "absolute",
    left: "50%",
    top: "650px",
    transform: "translateX(-50%)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    zIndex: "999"
  });

  const title = document.createElement("div");
  title.textContent = "Ẩn / Hiện Tiểu Tinh";
  Object.assign(title.style, {
    fontSize: "11px",
    fontStyle: "italic",
    color: "#444",
    marginBottom: "2px"
  });

  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
    flexWrap: "nowrap"
  });

  const buttons = [
    { label: "Tất cả", group: "Tất Cả" },
    { label: "Tình duyên", group: "Tình Duyên" },
    { label: "Tiền bạc", group: "Tiền Bạc" },
    { label: "Công danh", group: "Công Danh" },
    { label: "Sức khỏe", group: "Sức Khỏe" },
  ];

  buttons.forEach(btn => {
    const b = document.createElement("button");
    b.textContent = btn.label;
    b.dataset.group = btn.group;
b.className = "nut-tieutinh"; // ❌ bỏ active mặc định
    b.addEventListener("click", (e) => toggleTieuTinh(e.target.dataset.group));
    btnRow.appendChild(b);
  });

  box.appendChild(title);
  box.appendChild(btnRow);
  center.appendChild(box);
}

// =====================================================
// 🌙 CẬP NHẬT HẠN & TÍNH TUỔI (THEO ÂM LỊCH CHUẨN TỬ VI)
// -----------------------------------------------------
function capNhatHan() {
  if (!window.dataGlobal || !window.dataGlobal.lunar) return;

  const namXem = parseInt(document.getElementById("luuNam")?.value || 0);
  const thangXem = parseInt(document.getElementById("luuThang")?.value || 0);
  const ngayXem = parseInt(document.getElementById("luuNgay")?.value || 0);
  const [ngaySinh, thangSinh, namSinh] = window.dataGlobal.lunar;

  // 🧮 Tính tuổi âm (âm lịch)
let tuoiAm = 1;

if (namXem > namSinh) {
  // Bước 1: cộng theo năm
  tuoiAm = (namXem - namSinh) + 1;

  // Bước 2: nếu có chọn tháng
  if (thangXem) {
    if (thangXem > thangSinh) {
      tuoiAm++; // tháng xem > tháng sinh → thêm 1 tuổi
    } else if (thangXem === thangSinh) {
      // tháng xem = tháng sinh → cộng thêm 1 nếu ngày xem >= ngày sinh hoặc chưa chọn ngày
      if (!ngayXem || ngayXem >= ngaySinh) {
        tuoiAm++;
      }
    }
  }
}

// đảm bảo không nhỏ hơn 1
if (tuoiAm < 1) tuoiAm = 1;


  // 🌙 Thiết lập múi giờ Việt Nam
  const tz = 7.0;

  // ===== TÍNH CAN CHI NĂM =====
  const canChiNam = canChiYear(namXem || namSinh);
  const [canNam] = canChiNam.split(" ");

  // ===== TÍNH CAN CHI THÁNG (nếu có) =====
  let canChiThang = "";
  if (thangXem) {
    const canThang = CAN_THANG[canNam][(thangXem - 1 + 12) % 12];
    const chiThang = CHI[(thangXem + 1) % 12];
    canChiThang = `${canThang} ${chiThang}`;
  }

  // ===== TÍNH CAN CHI NGÀY (nếu có) =====
  let canChiNgay = "";
  if (ngayXem && thangXem) {
// ✅ Kiểm tra nếu tháng được chọn là nhuận (ví dụ 6N)
const thangVal = document.getElementById("luuThang")?.value || "";
const isLeap = thangVal.endsWith("N") || window.dataGlobal?.isLeapMonth === true;

// 👉 Chuyển đổi âm → dương có xét tháng nhuận
const [dSolar, mSolar, ySolar] = convertLunarToSolar(ngayXem, parseInt(thangXem), namXem, isLeap ? 1 : 0, tz);
    canChiNgay = canChiDay(ySolar, mSolar, dSolar);
  }

  // ===== HIỂN THỊ KẾT QUẢ =====
  const lbl = document.getElementById("tuoiAmLabel");
  if (lbl) {
    const parts = [];
    parts.push(`Năm ${canChiNam}`);
    if (canChiThang) parts.push(`Tháng ${canChiThang}`);
    if (canChiNgay) parts.push(`Ngày ${canChiNgay}`);

    lbl.innerHTML = `
      <span style="font-weight:600;">${parts.join(" – ")}</span>
      <span style="color:#c00;font-weight:bold;"> – Tuổi: ${tuoiAm}</span>
    `;
  }

  // 🔁 Lưu dữ liệu
  window.dataGlobal.luuHan = {
    namAm: namXem,
    thangAm: thangXem,
    ngayAm: ngayXem,
    canChiNam,
    canChiThang,
    canChiNgay,
    tuoiAm,
    chieuDaiVan:
      (window.dataGlobal.gender === "Nam" && window.dataGlobal.menh.includes("Dương")) ||
      (window.dataGlobal.gender === "Nữ" && window.dataGlobal.menh.includes("Âm"))
        ? "thuận"
        : "nghịch",
    chieuTieuVan: "ngược"
  };


// 🌀 Gọi lại các lớp vận
setTimeout(() => {

  // 1️⃣ An lại tất cả sao Lưu
  if (typeof anLop9_LuuDaiVan === "function") anLop9_LuuDaiVan(window.dataGlobal);
  if (typeof anLop10_LuuTieuVan === "function") anLop10_LuuTieuVan(window.dataGlobal);
  if (typeof anLop10_5_LuuNguyetVan === "function") anLop10_5_LuuNguyetVan(window.dataGlobal);
  if (typeof anSaoLuu_NguyetVan === "function") anSaoLuu_NguyetVan(window.dataGlobal);
  if (typeof anLop11_LuuNhatVan === "function") anLop11_LuuNhatVan(window.dataGlobal);

  // 🟢 2️⃣ KHỞI TẠO LẠI BẢNG TICK & EVENT — BẮT BUỘC!
  // ❗ Phải gọi initSaoLuuFull(), KHÔNG được gọi dongBoAnHienSaoLuu()
  if (typeof initSaoLuuFull === "function") {
    console.log("🔁 Re-init Tick Sao Lưu sau khi reset");
    initSaoLuuFull();
  }

}, 400);


// 🌙 Gọi sau khi Tiểu Vận đã an xong
setTimeout(() => {
  if (typeof anThangHan === "function") anThangHan(window.dataGlobal);
}, 600);

} // 👈 Kết thúc hàm capNhatHan()





// =====================================================
// 🌙🌙🌙  LỚP 10.2 – AN THÁNG HẠN (th.1 → th.12)
// -----------------------------------------------------
// 🎯 Quy tắc chuẩn Tử Vi:
// Năm hạn là cung khởi đầu (tháng 1)
// → Đếm NGƯỢC theo số tháng sinh → tới cung Giờ Tý
// → Từ đó đếm THUẬN theo giờ sinh → cung Th.1
// =====================================================
function anThangHan(data) {
  if (!data || !data.luuHan) return;
  const han = data.luuHan;
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  if (!chiNamHan) return;

  // 🧭 12 cung thuận Tử Vi
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Thìn":5,"Dậu":6,
    "Mão":7,"Tuất":8,"Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };

  // 🎨 Style hiển thị
  const THANGHAN_STYLE = {
    position: "absolute",   // ✅ THÊM DÒNG NÀY — giúp top/right có tác dụng
    top: "25px",
    right: "10px",
    fontSize: "11px",
    color: "#3366cc",
    fontStyle: "italic",
    fontWeight: "500"
  };

  // 🧹 Xóa cũ
  document.querySelectorAll(".layer-10-thang").forEach(e => e.remove());

  // 🌟 B1: Năm hạn → cung khởi đầu (coi là Tháng 1 tạm thời)
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // 🌟 B2: Lấy tháng sinh (1–12) và giờ sinh (Chi)
  const thangSinh = data.thangAm || 1;
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "Tý";
  const CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;

  // 🌙 B3: Từ cung năm hạn (Tháng 1) → đếm NGƯỢC theo tháng sinh → dừng tại cung Giờ Tý
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) { // lùi đúng số tháng sinh - 1
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // 🌙 B4: Từ cung Giờ Tý → đếm THUẬN theo Chi giờ sinh → cung Tháng 1 thật
  let idxTh1 = (idxGioTy + idxChiGio) % 12;

  // 🌙 B5: An 12 tháng thuận kim đồng hồ
  for (let i = 0; i < 12; i++) {
    const idx = (idxTh1 + i) % 12;
    const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
    if (!cell) continue;

    const div = document.createElement("div");
    div.className = "layer-10-thang";
    div.textContent = `th.${i + 1}`;
    Object.assign(div.style, THANGHAN_STYLE);  // ✅ vị trí bây giờ hoạt động chính xác
    cell.appendChild(div);
  }

  console.log(
    `🗓️ Tháng hạn: Năm hạn ${chiNamHan}, Tháng sinh ${thangSinh}, Giờ sinh ${chiGioSinh} 
→ Giờ Tý tại ${CUNG_THUAN[idxGioTy]}, Th.1 tại ${CUNG_THUAN[idxTh1]}`
  );
}

// =====================================================
// 🌙 TẠO DROPDOWN & GIỚI HẠN NĂM/THÁNG/NGÀY HỢP LÝ (HIỂN THỊ THÁNG NHUẬN)
// -----------------------------------------------------
function gioiHanNamHan() {
  const hanSection = document.getElementById("xemHanSection");
  if (!hanSection || !window.dataGlobal?.lunar) return;

  const [ngaySinh, thangSinh, namSinh] = window.dataGlobal.lunar;
  const namMax = new Date().getFullYear() + 120;
  const tz = 7.0;

  // 🧹 Xóa input cũ
  ["luuNam","luuThang","luuNgay"].forEach(id => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });

  // 🧭 Dropdown Năm
  const selNam = document.createElement("select");
  selNam.id = "luuNam";
  for (let y = namSinh; y <= namMax; y++) selNam.appendChild(new Option(y, y));
  selNam.value = (namSinh > 2025 ? namSinh : 2025);
  hanSection.querySelector("label[for='luuNam']").after(selNam);

  // 🧭 Dropdown Tháng (có tháng nhuận)
  const selThang = document.createElement("select");
  selThang.id = "luuThang";
  hanSection.querySelector("label[for='luuThang']").after(selThang);

  // 🧭 Dropdown Ngày
  const selNgay = document.createElement("select");
  selNgay.id = "luuNgay";
  hanSection.querySelector("label[for='luuNgay']").after(selNgay);

  // 🔹 Hàm dựng lại danh sách tháng của năm chọn (tự dùng công thức bạn đã có)
function rebuildThangDropdown(year) {
  selThang.innerHTML = "";
  selThang.appendChild(new Option("—", ""));

  // 🌙 Xác định tháng nhuận của năm âm dựa theo công thức bạn gửi
  const leap = getLeapMonthOfYear(year, tz); // nếu 0 => không có nhuận

  for (let m = 1; m <= 12; m++) {
    // Tháng thường
    selThang.appendChild(new Option(m, m));

    // Nếu trúng tháng nhuận thì chèn thêm tháng (nhuận)
    if (m === leap) {
      const opt = new Option(`${m} (nhuận)`, `${m}N`);
      opt.dataset.leap = "1";
      selThang.appendChild(opt);
    }
  }

  console.log(`📅 Năm ${year} có tháng nhuận: ${leap > 0 ? leap : "Không có"}`);
}





  // 🔹 Hàm dựng lại ngày (1–30)
  function rebuildNgayDropdown() {
    selNgay.innerHTML = "";
    selNgay.appendChild(new Option("—", ""));
    for (let d = 1; d <= 30; d++) selNgay.appendChild(new Option(d, d));
  }

  rebuildThangDropdown(parseInt(selNam.value));
  rebuildNgayDropdown();

  // 🔁 Giới hạn hợp lý
  function updateLimits() {
    const year = parseInt(selNam.value);
    const monthVal = selThang.value;
    const month = parseInt(monthVal);
    const isLeap = monthVal.endsWith("N");

    // Năm = năm sinh → chỉ cho tháng >= tháng sinh
    for (const opt of selThang.options) {
      if (!opt.value || opt.value === "—") continue;
      const mVal = parseInt(opt.value);
      opt.disabled = (year === namSinh && mVal < thangSinh);
    }

    // Năm & tháng = sinh → ngày >= ngày sinh
    for (const opt of selNgay.options) {
      if (!opt.value || opt.value === "—") continue;
      const dVal = parseInt(opt.value);
      opt.disabled = (year === namSinh && month === thangSinh && dVal < ngaySinh);
    }

    // 🔁 Lưu trạng thái tháng nhuận để capNhatHan() tự xử lý trong convertLunarToSolar
    window.dataGlobal.isLeapMonth = isLeap;

    // ✅ Gọi lại tính toán
    capNhatHan();
  }

  // 🔗 Sự kiện thay đổi
  selNam.addEventListener("change", () => { rebuildThangDropdown(parseInt(selNam.value)); updateLimits(); });
  selThang.addEventListener("change", updateLimits);
  selNgay.addEventListener("change", updateLimits);

  // Khởi tạo ban đầu
  updateLimits();
  capNhatHan();

  console.log(`✅ Dropdown (có tháng nhuận) hoạt động: ${namSinh}–${namMax}`);
}

// 🌟 Theo dõi DOM
const observerHan = new MutationObserver(() => {
  const hanSection = document.getElementById("xemHanSection");
  if (hanSection && !hanSection.classList.contains("ready")) {
    hanSection.classList.add("ready");
    setTimeout(gioiHanNamHan, 300);
  }
});
observerHan.observe(document.body, { childList: true, subtree: true });














// =====================================================
// 🌟 LỚP 9 – LƯU ĐẠI VẬN (phiên bản chuẩn – lấy MỆNH thật)
// -----------------------------------------------------
function anLop9_LuuDaiVan(data) {
  const han = data.luuHan;
  if (!han || !data.cucSo) return;

  // 🧹 Xóa toàn bộ Đại Vận cũ (dù nằm trong cell nào)
  document.querySelectorAll("[id^='cell'] .layer-9, .layer-9").forEach(e => e.remove());

  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,
    "Thìn":5,"Dậu":6,"Mão":7,"Tuất":8,
    "Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };

  // 🔹 Lấy đúng cung MỆNH đã an thật (không tính lại theo tháng & giờ)
  const cungMenh = data.tenCungMenh || window.dataGlobal?.tenCungMenh;
  if (!cungMenh) {
    console.warn("⚠️ Chưa có tên Cung Mệnh để an Đại Vận.");
    return;
  }
  const idxMenh = CUNG_THUAN.indexOf(cungMenh);
  if (idxMenh === -1) {
    console.warn("⚠️ Không tìm thấy chỉ số cung Mệnh:", cungMenh);
    return;
  }

  // 🔹 Xác định chiều Đại Vận theo Âm Dương Nam Nữ
  const chieuDaiVan =
    (data.gender === "Nam" && data.menh?.includes("Dương")) ||
    (data.gender === "Nữ" && data.menh?.includes("Âm"))
      ? "thuận"
      : "nghịch";
  console.log(`📍 Đại vận tính theo cung Mệnh ${cungMenh} (${chieuDaiVan})`);

  // 🔹 Giá trị khởi vận theo từng loại Cục
  const baseCuc = {
    "Thủy nhị cục": 2,
    "Mộc tam cục": 3,
    "Kim tứ cục": 4,
    "Thổ ngũ cục": 5,
    "Hỏa lục cục": 6
  }[data.cucSo];
  if (!baseCuc) return;

  // 🔹 Xác định block vận theo tuổi Âm
  const tuoi = han.tuoiAm;
  if (tuoi < baseCuc) return;
  const block = Math.floor((tuoi - baseCuc) / 10);

  // 🔹 Tính vị trí Đại Vận theo chiều
  const idxDaiVan = (chieuDaiVan === "thuận")
    ? (idxMenh + block) % 12
    : (idxMenh - block + 12) % 12;
  const cungDaiVan = CUNG_THUAN[idxDaiVan];
  han.viTriDaiVan = cungDaiVan;

  // 🔹 Tên tắt 12 cung
  const CUNG_CHUC_VIETTAT = [
    "MỆNH","HUYNH","PHU","TỬ",
    "TÀI","TẬT","DI","NÔ",
    "QUAN","ĐIỀN","PHÚC","PHỤ"
  ];

  // 🔹 Vẽ nhãn ĐẠI VẬN trên từng cung
  for (let i = 0; i < 12; i++) {
    const idx = (idxDaiVan - i + 12) % 12; // NGHỊCH chiều kim đồng hồ (ĐV chuẩn)
    const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
    if (!cell) continue;

    const div = document.createElement("div");
    div.className = "layer-9";
    div.textContent = "ĐV. " + CUNG_CHUC_VIETTAT[i];
    Object.assign(div.style, {
      position: "absolute",
      bottom: "2px",
      left: "4px",
      fontSize: "11px",
      fontWeight: "bold",
      color: "#880"
    });
    cell.appendChild(div);
  }

  console.log(`🔶 Lưu Đại Vận tại ${cungDaiVan} (${tuoi} tuổi, ${data.cucSo})`);
}


// =====================================================
// 🌟 LỚP 10 – LƯU TIỂU VẬN
// -----------------------------------------------------
function anLop10_LuuTieuVan(data) {
  const han = data.luuHan;
  if (!han) return;

  // Xóa lớp cũ
  document.querySelectorAll(".layer-10").forEach(e => e.remove());

  const chiNam = (han.canChiNam || "").split(" ")[1];
  if (!chiNam) return;

  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {"Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Thìn":5,"Dậu":6,"Mão":7,"Tuất":8,"Dần":9,"Sửu":10,"Tý":11,"Hợi":12};
  const idxStart = CUNG_THUAN.indexOf(chiNam);
  if (idxStart === -1) return;

  const CUNG_CHUC_VIETTAT = ["MỆNH","HUYNH","PHU","TỬ","TÀI","TẬT","DI","NÔ","QUAN","ĐIỀN","PHÚC","PHỤ"];
  for (let i = 0; i < 12; i++) {
    const idx = (idxStart - i + 12) % 12;
    const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
    if (!cell) continue;

    const div = document.createElement("div");
    div.className = "layer-10";
    div.textContent = "L. " + CUNG_CHUC_VIETTAT[i];
    Object.assign(div.style, {
      position: "absolute",
      bottom: "2px",
      right: "4px",
      fontSize: "11px",
      fontWeight: "bold",
      color: "#07a"
    });
    cell.appendChild(div);
  }
  console.log(`🔷 Lưu Tiểu Vận bắt đầu tại ${chiNam}`);
}
// =====================================================
// 🌙 LỚP 10.5 – LƯU NGUYỆT VẬN (vòng MỆNH NGƯỢC CHIỀU)
// -----------------------------------------------------
function anLop10_5_LuuNguyetVan(data) {
  if (!data?.luuHan) return;
  const han = data.luuHan;
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  if (!chiNamHan) return;

  // 🧹 Xóa lớp cũ mỗi lần đổi hạn
  document.querySelectorAll(".layer-10-5").forEach(e => e.remove());

  // 🧭 12 cung thuận Tử Vi
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Thìn":5,"Dậu":6,
    "Mão":7,"Tuất":8,"Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };

  // 🪶 Lấy tháng & giờ sinh từ dữ liệu gốc
  const thangSinh = data.thangAm || 1;
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "Tý";

  // =====================================================
  // 1️⃣  NĂM HẠN là cung khởi đầu (coi là tháng 1 tạm)
  // =====================================================
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // =====================================================
  // 2️⃣  Đếm NGƯỢC theo tháng sinh để tìm cung Giờ Tý
  // =====================================================
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) {
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // =====================================================
  // 3️⃣  Từ cung Giờ Tý → đếm THUẬN theo Chi giờ sinh
  //      để ra cung Mệnh của Tháng 1
  // =====================================================
  const CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;

  const idxTh1 = (idxGioTy + idxChiGio) % 12;
  const cungMenhThang1 = CUNG_THUAN[idxTh1];

  console.log(
    `🩵 Lưu Nguyệt Vận: Năm hạn ${chiNamHan}, Tháng sinh ${thangSinh}, Giờ sinh ${chiGioSinh}
→ Giờ Tý tại ${CUNG_THUAN[idxGioTy]}, Th.1 tại ${cungMenhThang1}`
  );

// =====================================================
// 4️⃣  HIỂN THỊ 12 THÁNG – THUẬN KIM ĐỒNG HỒ
//      nhưng cung chức chạy NGƯỢC (chuẩn Tử Vi)
// =====================================================
const CUNG_CHUC_VIETTAT = ["MỆNH","HUYNH","PHU","TỬ","TÀI","TẬT","DI","NÔ","QUAN","ĐIỀN","PHÚC","PHỤ"];

// 🗓️ Lấy tháng hạn hiện đang chọn (1–12)
const thangHienTai = parseInt(data?.luuHan?.thangAm || 1);
const dichThang = (thangHienTai - 1 + 12) % 12;  // số bước dịch từ tháng 1

for (let i = 0; i < 12; i++) {
  // 🌀 Tháng chạy THUẬN, bắt đầu từ cung Mệnh tháng hiện tại
  const idxThang = (idxTh1 + dichThang + i) % 12;

  const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idxThang]]);
  if (!cell) continue;

  const div = document.createElement("div");
  div.className = "layer-10-5 luuNguyetVan";

  // 🔁 Cung chức chạy NGƯỢC
  div.textContent = "Ng. " + CUNG_CHUC_VIETTAT[(12 - i) % 12];
  Object.assign(div.style, {
    position: "absolute",
    bottom: "20px",
    right: "4px",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#8844cc"
  });
  cell.appendChild(div);
}


  console.log(`🌙 Cung Mệnh Tháng 1: ${cungMenhThang1}`);
}


// =====================================================
// ☀️ LỚP 11 – LƯU NHẬT VẬN (chuẩn: Nh. Mệnh = N. Mệnh lúc ngày 1)
// -----------------------------------------------------
function anLop11_LuuNhatVan(data) {
  const han = data?.luuHan;
  if (!han) return;

  // Dữ liệu cần: năm hạn (can chi), tháng hạn (âm), ngày hạn (âm), tháng sinh (âm), chi giờ sinh
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  const thangHan = parseInt(han.thangAm || 1);
  const ngayHan  = parseInt(han.ngayAm  || 1);
  const thangSinh = parseInt(data.thangAm || 1);
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "Tý";

  if (!chiNamHan || !chiGioSinh || !thangSinh) return;

  // 🧹 Xóa lớp cũ
  document.querySelectorAll(".layer-11").forEach(e => e.remove());

  // Bảng chuẩn
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const CUNG_TO_CELL = {
    "Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Thìn":5,"Dậu":6,
    "Mão":7,"Tuất":8,"Dần":9,"Sửu":10,"Tý":11,"Hợi":12
  };
  const CHI_LIST = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  // 1) Năm hạn → coi là "tháng 1 tạm" tại chiNamHan
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // 2) Đếm NGƯỢC theo tháng sinh để tới cung Giờ Tý
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) {
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // 3) Từ cung Giờ Tý → đếm THUẬN theo chi giờ sinh để ra MỆNH tháng 1
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;
  const idxTh1 = (idxGioTy + idxChiGio) % 12; // vị trí N. Mệnh của tháng 1

  // 4) MỆNH tháng hiện tại (Nguyệt Mệnh) = Th1 dịch thuận (thangHan-1)
  const idxNguyetMenh = (idxTh1 + ((thangHan - 1) % 12)) % 12;

  // ✅ 5) NHẬT MỆNH: trùng N. Mệnh ở NGÀY 1, sau đó chạy THUẬN theo ngày âm
  const idxNhatMenh = (idxNguyetMenh + ((ngayHan - 1) % 12)) % 12;

  // Vẽ 12 nhãn Nh. MỆNH → Nh. PHỤ chạy THUẬN từ Nh. Mệnh
  const CUNG_CHUC_VIETTAT = ["MỆNH","HUYNH","PHU","TỬ","TÀI","TẬT","DI","NÔ","QUAN","ĐIỀN","PHÚC","PHỤ"];
  for (let i = 0; i < 12; i++) {
  // 🔁 Đếm NGƯỢC từ Nh. Mệnh
  const idx = (idxNhatMenh - i + 12) % 12;
  const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
  if (!cell) continue;

  const div = document.createElement("div");
  div.className = "layer-11";
  div.textContent = "Nh. " + CUNG_CHUC_VIETTAT[i];
  Object.assign(div.style, {
    position: "absolute",
    bottom: "36px",
    right: "4px",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#c53"
  });
  cell.appendChild(div);
}


  // (tuỳ chọn) lưu lại để dùng nơi khác
  han.viTriNguyetMenh = CUNG_THUAN[idxNguyetMenh];
  han.viTriNhatMenh   = CUNG_THUAN[idxNhatMenh];
  console.log(`☀️ Nh. Mệnh ngày ${ngayHan}: ${han.viTriNhatMenh} (N. Mệnh tháng ${thangHan}: ${han.viTriNguyetMenh})`);
}












// =====================================================
// 🌙 AN SAO LƯU – NGUYỆT VẬN (theo Can Chi THÁNG HẠN)
// -----------------------------------------------------
function anSaoLuu_NguyetVan(data) {
  if (!data?.luuHan?.canChiThang) return;

  // 🧹 Xóa sao Lưu Nguyệt Vận cũ (prefix "N.")
  document.querySelectorAll(".sao-nguyet-van, .sao-luu-nguyet").forEach(e => e.remove());

  // 🌙 Dùng Can Chi tháng hạn để an sao
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiThang; // tái sử dụng hàm anToanBoSaoLuu()

  console.log(`🩵 Lưu Nguyệt Vận theo ${clone.canChiNam}`);
window.__dangAnNguyetVan = true;
anToanBoSaoLuu(clone, "N");
window.__dangAnNguyetVan = false;
}

// =====================================================
// ☀️ AN SAO LƯU – NHẬT VẬN (theo Can Chi NGÀY HẠN)
// -----------------------------------------------------
function anSaoLuu_NhatVan(data) {
  if (!data?.luuHan?.canChiNgay) return;

  // 🧹 Xóa sao Lưu Nhật Vận cũ (prefix "Nh.")
  document.querySelectorAll(".sao-luu.luu-nhat").forEach(e => e.remove());

  // ☀️ Dùng Can Chi NGÀY HẠN để an sao
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiNgay; // tái sử dụng anToanBoSaoLuu()

  console.log(`☀️ Lưu Nhật Vận theo ${clone.canChiNam}`);
  window.__dangAnNhatVan = true;
  anToanBoSaoLuu(clone, "Nh");
  window.__dangAnNhatVan = false;
}













// =====================================================
// 🌟 LỚP 10.3 – SAO LƯU (ĐẠI VẬN & TIỂU VẬN) – BẢN CHUẨN
// -----------------------------------------------------
// ✅ Màu sao theo Ngũ hành gốc
// ✅ Tách riêng nhóm Khôi – Việt
// ✅ Hiển thị đầy đủ ĐV. và L.
// =====================================================

// 🎨 Màu ngũ hành cố định
const MAU_NGUHANH = {
  "Hỏa": "#ff4d4d",   // 🔥 đỏ tươi sáng – rõ, dễ đọc
  "Thổ": "#e69500",   // 🟠 cam đất đậm – rõ chữ
  "Mộc": "#007a29",   // 🌿 xanh lá đậm hơn một chút
  "Kim": "#000000",   // ⚫ đen thuần – giữ nguyên
  "Thủy": "#004cff"   // 💧 xanh dương đậm sáng
};


// 🔹 Hàm dò màu ngũ hành thật của sao (ưu tiên sao gốc)
function layMauNguHanhTheoSao(tenSao) {
  // 1. Từ saoNguHanhMap (nếu có)
  const map = window.dataGlobal?.saoNguHanhMap || {};
  if (map[tenSao]) return MAU_NGUHANH[map[tenSao]] || "#333";

  // 2. Nếu không có, dò ngược từ saoToCung (đã an sao gốc)
  const saoNguHanh = window.dataGlobal?.saoNguHanh || {};
  if (saoNguHanh[tenSao]) return MAU_NGUHANH[saoNguHanh[tenSao]] || "#333";

  return "#333"; // fallback
}

// =====================================================
// 🧱 BẢNG ẨN/HIỆN SAO LƯU – BẢN NHỎ GỌN, NỀN BÁN TRONG SUỐT
// -----------------------------------------------------
// 💠 Nhóm mới: 
//  1️⃣ Lộc / Kỵ
//  2️⃣ Khoa / Quyền
//  3️⃣ Kình / Đà
//  4️⃣ Lộc / Mã
//  5️⃣ Khôi / Việt
//  6️⃣ Xương / Khúc
// =====================================================
function taoBangTickSaoLuu() {
  // xoá bảng cũ
  const old = document.getElementById("bangNhomSaoLuu");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "bangNhomSaoLuu";
  div.style.cssText = `
    position: absolute;
    top: -2px;
    right: 750px;
    width: 80px;
    background: rgba(255,240,245,0.75);
    border: 1px solid rgba(255,182,193,0.9);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 10px;
    line-height: 1.45;
    backdrop-filter: blur(4px);
    color: #222;
    z-index: 9999;
  `;

  div.innerHTML = `
<b>Ẩn / Hiện Hạn</b><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="loc-ky" checked> Lộc / Kỵ</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="khoa-quyen"> Khoa / Quyền</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="kinh-da" checked> Kình / Đà</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="loc-ma"> Lộc / Mã</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="khoi-viet"> Khôi / Việt</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="xuong-khuc"> Xương / Khúc</label>
`;

  // gắn vào lá số
  const container = document.getElementById("lasoContainer");
  container.style.position = "relative";
container.appendChild(div);
}





// =====================================================
// 🔁 ẨN / HIỆN SAO LƯU – ĐỒNG BỘ 4 CẤP (ĐV, TV, NV, NhV)
// =====================================================
function dongBoAnHienSaoLuu() {
  const btns = {
    dai: document.getElementById("btnDaiVan"),
    tieu: document.getElementById("btnTieuVan"),
    nguyet: document.getElementById("btnNguyetVan"),
    nhat: document.getElementById("btnNhatVan")
  };

  const bangTick = document.getElementById("bangNhomSaoLuu");
  if (!bangTick || Object.values(btns).some(btn => !btn)) return;

  // XÓA LISTENER CŨ CHUẨN — clone 1 lần
  Object.keys(btns).forEach(key => {
    const old = btns[key];
    const newBtn = old.cloneNode(true);
    old.parentNode.replaceChild(newBtn, old);
    btns[key] = newBtn; // CẬP NHẬT biến thật sự
  });

  const nutDV  = btns.dai;
  const nutTV  = btns.tieu;
  const nutNV  = btns.nguyet;
  const nutNhV = btns.nhat;

  const capNhatMauNut = () => {
    [nutDV, nutTV, nutNV, nutNhV].forEach(btn => {
      const hien = !btn.classList.contains("off");
      btn.style.background = hien ? "#337ab7" : "#ccc";
      btn.style.color = hien ? "#fff" : "#333";
    });
  };

  const capNhatHienThi = () => {
    const hienDV  = !nutDV.classList.contains("off");
    const hienTV  = !nutTV.classList.contains("off");
    const hienNV  = !nutNV.classList.contains("off");
    const hienNhV = !nutNhV.classList.contains("off");

    document.querySelectorAll(".layer-9").forEach(e => e.style.display = hienDV ? "" : "none");
    document.querySelectorAll(".layer-10, .layer-10-thang").forEach(e => e.style.display = hienTV ? "" : "none");
    document.querySelectorAll(".layer-10-5").forEach(e => e.style.display = hienNV ? "" : "none");
    document.querySelectorAll(".layer-11").forEach(e => e.style.display = hienNhV ? "" : "none");

    document.querySelectorAll(".sao-luu").forEach(el => {
      const laDai = el.classList.contains("luu-dai");
      const laTieu = el.classList.contains("luu-tieu");
      const laNguyet = el.classList.contains("luu-nguyet");
      const laNhat = el.classList.contains("luu-nhat");

      const nhom = el.dataset.nhom;
      const tick = bangTick.querySelector(`.chk-nhom[data-nhom="${nhom}"]`);
      const nhomOn = tick?.checked;

      const hien =
        (laDai && hienDV && nhomOn) ||
        (laTieu && hienTV && nhomOn) ||
        (laNguyet && hienNV && nhomOn) ||
        (laNhat && hienNhV && nhomOn);

      el.style.display = hien ? "" : "none";
    });
  };

  // gắn lại listener mới
  [nutDV, nutTV, nutNV, nutNhV].forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("off");
      capNhatMauNut();
      capNhatHienThi();
    });
  });

  // Bind tick
  bangTick.querySelectorAll(".chk-nhom").forEach(chk => {
    chk.onchange = capNhatHienThi;
  });

  capNhatMauNut();
  capNhatHienThi();

  // 🔁 Lưu lại hàm toàn cục để dùng lại khi cần
  window.__capNhatHienThiSaoLuu = capNhatHienThi;
  console.log("✅ Gắn event sao Lưu (ĐV + TV + NV + NhV)");
}






// =====================================================
// 🧹 XÓA SAO LƯU CŨ
// =====================================================
function xoaSaoLuu() {
  document.querySelectorAll(".sao-luu").forEach(e => e.remove());
}



// =====================================================
// 🪶 THÊM SAO LƯU – GẮN CHUẨN CLASS ĐỂ ẨN/HIỆN
// =====================================================
function themSaoLuu(cung, ten, nhom, loai, prefix) {
  if (!cung) return;
  const cell = document.querySelector(`#cell${CUNG_TO_CELL[cung]} .layer-6 .${loai}-tinh`);
  if (!cell) return;

  // 🔹 Chuẩn hóa hành của sao
const tenGoc = ten.replace(/^(ĐV\.|L\.|N\.|Nh\.)\s*/i, "").trim();
  const hanhSao = {
    "Tử Vi": "Thổ", "Thiên Cơ": "Mộc", "Thái Dương": "Hỏa", "Vũ Khúc": "Kim",
    "Thiên Đồng": "Thủy", "Liêm Trinh": "Hỏa", "Thiên Phủ": "Thổ", "Thái Âm": "Thủy",
    "Tham Lang": "Mộc", "Cự Môn": "Thủy", "Thiên Tướng": "Thủy", "Thiên Lương": "Mộc",
    "Thất Sát": "Kim", "Phá Quân": "Thủy", "Thiên Khôi": "Hỏa", "Thiên Việt": "Hỏa",
    "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa", "Hóa Lộc": "Mộc", "Hóa Quyền": "Mộc",
    "Hóa Khoa": "Mộc", "Hóa Kỵ": "Kim", "Kình Dương": "Kim", "Đà La": "Kim",
    "Văn Xương": "Kim", "Văn Khúc": "Thủy", "Linh Tinh": "Hỏa", "Hỏa Tinh": "Hỏa",
    "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa", "Tả Phù": "Thổ"
  };
  const hanh = hanhSao[tenGoc] || "";
  const colorMap = {
    "Hỏa": "#c72d2d", "Thổ": "#d99000", "Mộc": "#006400",
    "Kim": "#000000", "Thủy": "#003399"
  };
  const color = colorMap[hanh] || "#333";

  // 🌟 Tạo phần tử sao
  const div = document.createElement("div");
  div.textContent = `${prefix}. ${ten}`;
let loaiVan = "luu-tieu";
if (prefix === "ĐV") loaiVan = "luu-dai";
else if (prefix === "N") loaiVan = "luu-nguyet";
else if (prefix === "Nh") loaiVan = "luu-nhat"; // ✅ thêm dòng này


div.className = `sao-luu ${loaiVan} nhom-${nhom} ${loai}-tinh`;
div.dataset.nhom = nhom; // 🔹 Gán nhóm để tick bảng nhận diện

  // 🪶 Style sao
  div.style.fontSize = "11px";
  div.style.margin = "1px 0";
  div.style.fontStyle = "italic";
  div.style.fontWeight = "700";
  div.style.color = color;
  div.style.filter = "brightness(1.1)";

  cell.appendChild(div);
}


// =====================================================
// 🌞 AN SAO LƯU – ĐẠI VẬN (theo Can Chi năm sinh chuẩn từng cung)
// -----------------------------------------------------
function anSaoLuu_DaiVan(data) {
  if (!data || !data.luuHan?.viTriDaiVan) return;

  // 🧩 Nếu đang vẽ lớp Đại Vận (Lớp 9) thì bỏ qua để tránh x2
  if (window.__dangVeLop9_DaiVan) return;

  // 🧭 Lấy cung hiện tại của Đại Vận
  const cungDai = data.luuHan.viTriDaiVan;

  // 🪶 Tính lại Can Chi của cung Đại Vận theo năm sinh gốc
  const canChiDaiVan = (function layCanChiCuaCung(canChiNamSinh, tenCung) {
    const CAN_THANG = {
      "Giáp":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
      "Ất":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
      "Bính":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
      "Đinh":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
      "Mậu":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"],
      "Kỷ":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
      "Canh":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
      "Tân":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
      "Nhâm":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
      "Quý":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"]
    };

    const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const canNam = canChiNamSinh.split(" ")[0];
    const chiIndex = CUNG_THUAN.indexOf(tenCung);
    if (chiIndex === -1) return "";
    const list = CAN_THANG[canNam] || CAN_THANG["Giáp"];
    const can = list[chiIndex];
    const chi = CUNG_THUAN[chiIndex];
    return `${can} ${chi}`;
  })(data.canChiNam, cungDai);

  if (!canChiDaiVan) {
    console.warn("⚠️ Không xác định được Can Chi của Đại Vận:", cungDai);
    return;
  }

  // 🧭 Ghi nhớ Can Chi năm Đại Vận
  window.dataGlobal.canChiDaiVan = canChiDaiVan;
// 🎯 Hiển thị lên khung Xem Hạn (Âm Lịch)
if (data.luuHan?.tuoiDaiVanBatDau && data.luuHan?.tuoiDaiVanKetThuc) {
  hienThiThongTinDaiVan(
    canChiDaiVan,
    data.luuHan.tuoiDaiVanBatDau,
    data.luuHan.tuoiDaiVanKetThuc
  );
} else {
  // 🔁 nếu chưa có, tạm tính theo thứ tự Đại Vận (mỗi cung = 10 năm)
  const indexDV = data.luuHan?.soThuTuDaiVan || 0;
  const tuoiBatDau = 5 + indexDV * 10;
  const tuoiKetThuc = tuoiBatDau + 9;
  hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc);
}


  // 🔁 Gọi an sao lưu theo Can Chi Đại Vận này (nếu chưa bị khoá bởi lớp 9)
  const clone = structuredClone(data);
  clone.canChiNam = canChiDaiVan;

  console.log(`🌞 Lưu Đại Vận theo ${canChiDaiVan} (${cungDai})`);

  // 🪐 Tiến hành an sao lưu (với prefix “ĐV.”)
  window.__dangVeLop9_DaiVan = true;
  anToanBoSaoLuu(clone, "ĐV");
  setTimeout(() => (window.__dangVeLop9_DaiVan = false), 300);

// 🖼️ Hiển thị lên khung Xem Hạn (Âm Lịch)
if (data.luuHan?.tuoiAm && data.cucSo && data.luuHan?.viTriDaiVan) {
  const baseCuc = {
    "Thủy nhị cục": 2,
    "Mộc tam cục": 3,
    "Kim tứ cục": 4,
    "Thổ ngũ cục": 5,
    "Hỏa lục cục": 6
  }[data.cucSo];
  const tuoi = data.luuHan.tuoiAm;
  const block = Math.floor((tuoi - baseCuc) / 10);
  const tuoiBatDau = baseCuc + block * 10;
  const tuoiKetThuc = tuoiBatDau + 9;

  const canChiDaiVan = window.dataGlobal?.canChiDaiVan || "";
  hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc);
}

}



// =====================================================
// 🌙 AN SAO LƯU – TIỂU VẬN
// =====================================================
function anSaoLuu_TieuVan(data) {
  if (!data?.luuHan?.canChiNam) return;
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiNam;
window.dataGlobal.canChiHan = data.luuHan.canChiNam; // 🧭 Ghi nhớ Can Chi năm Hạn

  console.log(`🌙 Lưu Tiểu Vận theo ${clone.canChiNam}`);
  anToanBoSaoLuu(clone, "L");
}

// =====================================================
// ⚡ AN TOÀN BỘ SAO LƯU – PHIÊN BẢN 6 NHÓM GỌN
// -----------------------------------------------------
// Nhóm dùng cho bảng tick:
//  loc-ky, khoa-quyen, kinh-da, loc-ma, khoi-viet, xuong-khuc
// =====================================================
function anToanBoSaoLuu(data, prefix) {


  const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

  let canNam="", chiNam="";
  for (const c of CAN) if (data.canChiNam?.includes(c)) canNam=c;
  for (const ch of CHI) if (data.canChiNam?.includes(ch)) chiNam=ch;
  if (!canNam || !chiNam) return;

  const LOC_TON_MAP = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ","Mậu":"Tỵ","Kỷ":"Ngọ",
    "Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
  };
  const THIEN_MA_MAP = {
    "Hợi":"Tỵ","Mão":"Tỵ","Mùi":"Tỵ","Tỵ":"Hợi","Dậu":"Hợi","Sửu":"Hợi",
    "Dần":"Thân","Ngọ":"Thân","Tuất":"Thân","Thân":"Dần","Tý":"Dần","Thìn":"Dần"
  };

  // 💠 Lộc / Mã
  themSaoLuu(LOC_TON_MAP[canNam], "Lộc Tồn", "loc-ma", "cat", prefix);
  themSaoLuu(THIEN_MA_MAP[chiNam], "Thiên Mã", "loc-ma", "cat", prefix);

  // ⚡ Kình / Đà
  const viTriA = LOC_TON_MAP[canNam];
  const iA = CUNG_THUAN.indexOf(viTriA);
  if (iA >= 0) {
    themSaoLuu(CUNG_THUAN[(iA + 1) % 12], "Kình Dương", "kinh-da", "hung", prefix);
    themSaoLuu(CUNG_THUAN[(iA - 1 + 12) % 12], "Đà La", "kinh-da", "hung", prefix);
  }

  // 🌿 Khôi / Việt
  const KV = {
    "Giáp":["Sửu","Mùi"],"Mậu":["Sửu","Mùi"],"Ất":["Tý","Thân"],"Kỷ":["Tý","Thân"],
    "Canh":["Dần","Ngọ"],"Tân":["Dần","Ngọ"],"Bính":["Hợi","Dậu"],"Đinh":["Hợi","Dậu"],
    "Nhâm":["Mão","Tỵ"],"Quý":["Mão","Tỵ"]
  };
  const cap = KV[canNam];
  if (cap) {
    themSaoLuu(cap[0], "Thiên Khôi", "khoi-viet", "cat", prefix);
    themSaoLuu(cap[1], "Thiên Việt", "khoi-viet", "cat", prefix);
  }

  // ===========================================================
// 🪶 VĂN XƯƠNG / VĂN KHÚC – theo CAN năm (theo bảng lưu niên bạn gửi)
// ===========================================================
const LUU_XUONG = {
  "Giáp": "Tỵ", "Ất": "Ngọ", "Bính": "Thân", "Đinh": "Dậu",
  "Mậu": "Thân", "Kỷ": "Dậu", "Canh": "Hợi", "Tân": "Tý",
  "Nhâm": "Dần", "Quý": "Mão"
};
const LUU_KHUC = {
  "Giáp": "Dậu", "Ất": "Thân", "Bính": "Ngọ", "Đinh": "Tỵ",
  "Mậu": "Ngọ", "Kỷ": "Tỵ", "Canh": "Mão", "Tân": "Dần",
  "Nhâm": "Tý", "Quý": "Hợi"
};

if (canNam && LUU_XUONG[canNam]) {
  themSaoLuu(
    LUU_XUONG[canNam],
    "Văn Xương",
    "xuong-khuc",
    "cat",
    prefix
  );
}
if (canNam && LUU_KHUC[canNam]) {
  themSaoLuu(
    LUU_KHUC[canNam],
    "Văn Khúc",
    "xuong-khuc",
    "cat",
    prefix
  );
}


  // 🌈 Tứ Hóa → chia lại nhóm: Lộc/Kỵ, Khoa/Quyền
  const TU_HOA = {
    "Giáp":{loc:"Liêm Trinh",quyen:"Phá Quân",khoa:"Vũ Khúc",ky:"Thái Dương"},
    "Ất":{loc:"Thiên Cơ",quyen:"Thiên Lương",khoa:"Tử Vi",ky:"Thái Âm"},
    "Bính":{loc:"Thiên Đồng",quyen:"Thiên Cơ",khoa:"Văn Xương",ky:"Liêm Trinh"},
    "Đinh":{loc:"Thái Âm",quyen:"Thiên Đồng",khoa:"Thiên Cơ",ky:"Cự Môn"},
    "Mậu":{loc:"Tham Lang",quyen:"Thái Âm",khoa:"Hữu Bật",ky:"Thiên Cơ"},
    "Kỷ":{loc:"Vũ Khúc",quyen:"Tham Lang",khoa:"Thiên Lương",ky:"Văn Khúc"},
    "Canh":{loc:"Thái Dương",quyen:"Vũ Khúc",khoa:"Thiên Đồng",ky:"Thái Âm"},
    "Tân":{loc:"Cự Môn",quyen:"Thái Dương",khoa:"Văn Khúc",ky:"Văn Xương"},
    "Nhâm":{loc:"Thiên Lương",quyen:"Tử Vi",khoa:"Tả Phù",ky:"Vũ Khúc"},
    "Quý":{loc:"Phá Quân",quyen:"Cự Môn",khoa:"Thái Âm",ky:"Tham Lang"}
  };

  const hoa = TU_HOA[canNam];
  if (hoa) {
    const mapSao = {...(window.saoToCung || {}), ...(window.trungTinhToCung || {})};
    const tim = s => {
  const k = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tổ hợp
    .replace(/\u0110/g, "d")           // Đ → d
    .replace(/\u0111/g, "d")           // đ → d
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
  
  return mapSao[k];
};

    if (tim(hoa.loc))   themSaoLuu(tim(hoa.loc), "Hóa Lộc", "loc-ky", "cat", prefix);
    if (tim(hoa.ky))    themSaoLuu(tim(hoa.ky), "Hóa Kỵ", "loc-ky", "hung", prefix);
    if (tim(hoa.khoa))  themSaoLuu(tim(hoa.khoa), "Hóa Khoa", "khoa-quyen", "cat", prefix);
    if (tim(hoa.quyen)) themSaoLuu(tim(hoa.quyen), "Hóa Quyền", "khoa-quyen", "cat", prefix);
  }
}




// =====================================================
// 🔁 TÍCH HỢP CẬP NHẬT HẠN – KHÔNG RESET TUỔI
// =====================================================
const oldCapNhatHan = capNhatHan;
capNhatHan = function() {
  // ⚡ Gọi bản gốc để tính tuổi và hiển thị, KHÔNG reset form
  oldCapNhatHan();

  // 🧭 Lưu lại tuổi sau khi tính xong
  const tuoiLabel = document.getElementById("tuoiAmLabel");
  const tuoiText = tuoiLabel ? tuoiLabel.textContent : "";

  // 🕓 Sau khi sao lưu được vẽ, khôi phục lại tuổi
  setTimeout(() => {
    xoaSaoLuu();

    // 🌞 An sao theo 4 cấp vận
    anSaoLuu_DaiVan(window.dataGlobal);
    anSaoLuu_TieuVan(window.dataGlobal);
    anSaoLuu_NguyetVan(window.dataGlobal);
    anSaoLuu_NhatVan(window.dataGlobal); // ☀️ thêm dòng này cho Nhật Vận

    // ✅ Giữ nguyên tuổi đã tính
    if (tuoiLabel && tuoiText) tuoiLabel.textContent = tuoiText;

    // 🔁 Cập nhật hiển thị theo tick nhóm
    const hienThi = window.__capNhatHienThiSaoLuu;
    if (typeof hienThi === "function") hienThi();
  }, 800);
  console.log("♻️ Cập nhật lại sao Lưu (ĐV + TV)");
};

// 🌙 Tạo lại khung Xem Hạn (Âm Lịch) bên trong ô trung tâm
function ensureXemHanSection() {
  const center = document.getElementById("centerCell");
  if (!center) {
    // Nếu ô trung tâm chưa sẵn sàng, thử lại sau 1s
    setTimeout(ensureXemHanSection, 1000);
    return;
  }

  // Nếu đã có khung thì thôi
  if (document.getElementById("xemHanSection")) return;

  const xemHanDiv = document.createElement("div");
  xemHanDiv.id = "xemHanSection";
  xemHanDiv.style.marginTop = "60px";
  xemHanDiv.style.fontSize = "13px";
  xemHanDiv.style.textAlign = "center";
  xemHanDiv.style.lineHeight = "1.5";
 xemHanDiv.innerHTML = `
  <div style="font-weight:bold; margin-bottom:4px; display:flex; align-items:center; justify-content:center; gap:5px;">
    <span style="font-size:16px;">🔮</span>
    <span style="font-size:14px; font-weight:600;">XEM HẠN (ÂM LỊCH)</span>
  </div>

  <div style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; font-size:12px; margin-bottom:3px;">
    <div>
      <label for="luuNam">Năm:</label>
      <select id="luuNam" style="width:78px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;"></select>
    </div>

    <div>
      <label for="luuThang">Tháng:</label>
      <select id="luuThang" style="width:55px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;">
        ${Array.from({ length: 12 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
      </select>
    </div>

    <div>
      <label for="luuNgay">Ngày:</label>
      <select id="luuNgay" style="width:55px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;">
        ${Array.from({ length: 30 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
      </select>
    </div>
  </div>

  <div style="margin-top:2px; font-size:12px;">
    <span id="tuoiAmLabel" style="font-weight:bold; color:#c00;">Tuổi: —</span>
  </div>


  <!-- ✅ Placeholder cho Đại Vận (chưa gắn dữ liệu) -->
  <div id="daiVanInfo"
     style="margin-top:4px; margin-bottom:4px; font-size:13px; color:#b24b00; font-weight:700; text-align:center; letter-spacing:0.3px;">

    🌞 Đại Vận —
  </div>


  <div style="margin-top:8px;">




<div id="vanControls"
     style="margin-top:8px; text-align:center; font-family:'Segoe UI',sans-serif;">

  <!-- Dòng chữ trên cùng -->
  <div style="font-size:12px; color:#222; margin-bottom:4px;">
    Ẩn / Hiện Vận:
  </div>

  <!-- Hàng nút phía dưới -->
  <div style="display:flex; justify-content:center; gap:6px; flex-wrap:nowrap;">
    <button id="btnDaiVan" data-van="dai" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Đại Vận
    </button>

    <button id="btnTieuVan" data-van="tieu" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Tiểu Vận
    </button>

    <button id="btnNguyetVan" data-van="nguyet" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Nguyệt Vận
    </button>

    <!-- 🆕 Thêm nút Nhật Vận -->
    <button id="btnNhatVan" data-van="nhat" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Nhật Vận
    </button>
  </div>
</div>




  </div>
`;

  center.appendChild(xemHanDiv);









// 🧭 Điền danh sách năm vào dropdown
const yearSelect = document.getElementById("luuNam");
for (let y = 1900; y <= 2100; y++) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === 2025) opt.selected = true;
  yearSelect.appendChild(opt);
}

  // 🧮 Gắn lại sự kiện tính tuổi và nút ẩn/hiện
  ["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // 🧹 xóa sự kiện cũ (nếu có)
    el.addEventListener("change", capNhatHan);    // 🔁 gắn lại mới
  }
});



}  // 👈 thêm dấu ngoặc này để kết thúc function ensureXemHanSection



// 🌟 Cập nhật dòng hiển thị Đại Vận trong khung Xem Hạn
function hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc) {
  const daiVanInfo = document.getElementById("daiVanInfo");
  if (!daiVanInfo) return; // nếu khung chưa sẵn

  // Định dạng chuỗi: 🌞 Đại Vận Ất Mùi (25–34 tuổi)
  daiVanInfo.innerHTML = `🌞 Đại Vận <b>${canChiDaiVan}</b> (${tuoiBatDau}–${tuoiKetThuc} tuổi)`;
}

function capNhatDaiVanTheoNamHan(namHan) {
  const data = window.dataGlobal;
  if (!data || !data.luuHan) return;

  // 🧮 Cập nhật lại vị trí Đại Vận theo công thức chuẩn
  anLop9_LuuDaiVan(data);

  // 🔹 Lấy cung hiện tại của Đại Vận
  const cungDai = data.luuHan.viTriDaiVan;
  if (!cungDai) return;

  // 🔹 Dùng lại hàm bạn đã có: tính Can Chi Đại Vận (tức Can Chi của cung Mệnh Đại Vận)
  const canChiDaiVan = (function layCanChiCuaCung(canChiNamSinh, tenCung) {
    const CAN_THANG = {
      "Giáp":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
      "Ất":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
      "Bính":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
      "Đinh":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
      "Mậu":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"],
      "Kỷ":["Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh"],
      "Canh":["Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"],
      "Tân":["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân"],
      "Nhâm":["Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"],
      "Quý":["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý","Giáp","Ất"]
    };
    const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
    const canNam = canChiNamSinh.split(" ")[0];
    const chiIndex = CUNG_THUAN.indexOf(tenCung);
    if (chiIndex === -1) return "";
    const list = CAN_THANG[canNam] || CAN_THANG["Giáp"];
    const can = list[chiIndex];
    const chi = CUNG_THUAN[chiIndex];
    return `${can} ${chi}`;
  })(data.canChiNam, cungDai);

  // 🔹 Tính tuổi bắt đầu – kết thúc theo block
    // 🔹 Tính tuổi bắt đầu – kết thúc đúng theo Cục
  const baseCuc = {
    "Thủy nhị cục": 2,
    "Mộc tam cục": 3,
    "Kim tứ cục": 4,
    "Thổ ngũ cục": 5,
    "Hỏa lục cục": 6
  }[data.cucSo];
  const tuoi = data.luuHan.tuoiAm;
  const block = Math.floor((tuoi - baseCuc) / 10);
  const tuoiBatDau = baseCuc + block * 10;
  const tuoiKetThuc = tuoiBatDau + 9;

  // 🖼️ Hiển thị ra khung Xem Hạn
  hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc);

}

// =====================================================
// 🚀 KHỞI TẠO LẠI BẢNG TICK + ĐỒNG BỘ HIỂN THỊ SAO LƯU
// =====================================================
function initSaoLuuFull() {
  console.log("🔁 Khởi tạo tick + sự kiện sao Lưu...");

  // Xóa tick cũ
  const old = document.getElementById("bangNhomSaoLuu");
  if (old) old.remove();

  // Tạo bảng tick mới
  taoBangTickSaoLuu();

  // Gắn EVENT lại cho tick và 4 nút vận
  dongBoAnHienSaoLuu();

  console.log("✅ Tick & sự kiện sao Lưu đã được gắn lại!");
}


// =====================================================
// ❌ XOÁ — KHÔNG KHỞI TẠO TỰ ĐỘNG KHI LOAD TRANG
// ❌ KHÔNG DÙNG setTimeout(initSaoLuuFull, 3000)
// ❌ KHÔNG DÙNG đợi DOMContentLoaded
// =====================================================



// 🎯 Cập nhật Đại Vận khi chọn Năm hạn (giữ nguyên phần này)
document.addEventListener("DOMContentLoaded", () => {
  const selectNam = document.getElementById("luuNam");
  if (!selectNam) return;

  selectNam.addEventListener("change", (e) => {
    const nam = parseInt(e.target.value);
    capNhatDaiVanTheoNamHan(nam);
  });
});

/* =====================================================
   💾 LƯU / TẢI / XÓA LÁ SỐ — PHIÊN BẢN NHẸ & ỔN ĐỊNH
   ===================================================== */

// 📂 Lấy danh sách key lưu lá số (ưu tiên IndexedDB, fallback localStorage)
function listTuviKeysFromIDB(callback) {
  const keys = [];
  const req = indexedDB.open("TuViDB", 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) db.createObjectStore("jsonStore");
  };
  req.onsuccess = e => {
    const db = e.target.result;
    const tx = db.transaction("jsonStore", "readonly");
    const store = tx.objectStore("jsonStore");
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = ev => {
      const cursor = ev.target.result;
      if (cursor) {
        const k = cursor.key;
        if (k && typeof k === "string" && k.startsWith("tuvi_")) keys.push(k);
        cursor.continue();
      }
    };
    tx.oncomplete = () => callback(keys);
    tx.onerror = () => callback(keys);
  };
  req.onerror = () => callback([]);
}

function listTuviKeys(callback) {
  listTuviKeysFromIDB(keysFromIDB => {
    if (keysFromIDB && keysFromIDB.length) {
      callback(keysFromIDB);
    } else {
      callback(Object.keys(localStorage).filter(k => k.startsWith("tuvi_")));
    }
  });
}

// 🔹 Cập nhật danh sách dropdown
function refreshSavedChartList() {
  const select = document.getElementById("savedCharts");
  if (!select) return;

  const current = select.value;
  select.innerHTML = `<option value="">-- Chọn lá số đã lưu --</option>`;

  listTuviKeys(keys => {
    const list = (keys && keys.length
      ? keys
      : Object.keys(localStorage).filter(k => k.startsWith("tuvi_"))
    ).sort();

    list.forEach(k => {
      const encodedName = k.replace("tuvi_", "");
      const decodedName = decodeURIComponent(encodedName);
      const opt = document.createElement("option");
      opt.value = encodedName;      // lưu giá trị đã encode để load đúng key
      opt.textContent = decodedName;
      select.appendChild(opt);
    });

    // Giữ lựa chọn hiện tại (hỗ trợ cả giá trị đã decode trước đây)
    if (current) {
      select.value = current;
      if (!select.value) select.value = encodeURIComponent(current);
    }
  });
}



// =====================================================
// 💾 LƯU / TẢI / XÓA LÁ SỐ — CHUẨN CHỈ LẤY DỮ LIỆU DƯƠNG LỊCH
// =====================================================

function saveChartToLocal() {
  // 🧱 Popup nhập tên file lưu
  const overlay = document.createElement("div");
  overlay.style = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.4);display:flex;
    align-items:center;justify-content:center;z-index:9999;
  `;
  const box = document.createElement("div");
  box.style = `
    background:#fff;padding:20px 25px;border-radius:10px;
    box-shadow:0 4px 15px rgba(0,0,0,0.3);min-width:320px;
    font-family:'Segoe UI',sans-serif;text-align:center;
  `;
  box.innerHTML = `
    <h3 style="margin-top:0;margin-bottom:10px;">💾 Lưu lá số</h3>
    <p style="margin:5px 0 10px 0;font-size:13px;">
      Nhập tên <b>file lưu</b> (ví dụ: "Lá số Vy") hoặc chọn để ghi đè:
    </p>
    <select id="saveChartSelect"
            style="width:100%;padding:5px;margin-bottom:10px;border:1px solid #aaa;border-radius:5px;">
      <option value="">-- Chọn lá số đã lưu --</option>
    </select>
    <input id="saveChartName" type="text" placeholder="Tên file lưu (ví dụ: Lá số Vy)"
           style="width:100%;padding:6px;border:1px solid #aaa;border-radius:5px;margin-bottom:10px;">
    <div style="display:flex;justify-content:center;gap:8px;margin-top:5px;">
      <button id="btnSaveConfirm" style="background:#337ab7;color:#fff;border:none;border-radius:5px;padding:5px 15px;cursor:pointer;">Lưu</button>
      <button id="btnSaveCancel" style="background:#ccc;color:#333;border:none;border-radius:5px;padding:5px 15px;cursor:pointer;">Hủy</button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // 📜 Danh sách file lưu sẵn (ưu tiên IndexedDB, fallback localStorage)
  const select = box.querySelector("#saveChartSelect");
  listTuviKeys(keys => {
    const list = keys.length
      ? keys
      : Object.keys(localStorage).filter(k => k.startsWith("tuvi_"));

    list.forEach(k => {
      const name = decodeURIComponent(k.replace("tuvi_", ""));
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  });
  select.addEventListener("change", e => {
    box.querySelector("#saveChartName").value = e.target.value;
  });

  // ✅ Khi bấm “Lưu”
  box.querySelector("#btnSaveConfirm").addEventListener("click", () => {
    const fileName = box.querySelector("#saveChartName").value.trim(); // tên file lưu
    if (!fileName) return alert("⚠️ Vui lòng nhập hoặc chọn tên file lưu!");

    const safeKey = "tuvi_" + encodeURIComponent(fileName);
    if (localStorage.getItem(safeKey) && !confirm(`Tên file "${fileName}" đã tồn tại. Ghi đè?`)) return;

    // === 1️⃣ Đọc trực tiếp dữ liệu từ bảng kết quả DƯƠNG LỊCH ===
    const table = document.querySelector("#output table");
    if (!table) return alert("⚠️ Không tìm thấy bảng kết quả để lưu!");
    const rows = table.querySelectorAll("tr");
    const namDL   = rows[1]?.cells[1]?.textContent?.trim() || "";
    const thangDL = rows[2]?.cells[1]?.textContent?.trim() || "";
    const ngayDL  = rows[3]?.cells[1]?.textContent?.trim() || "";
    const gioText = rows[4]?.cells[1]?.textContent?.trim() || "";

    console.log("📆 [DEBUG] DỮ LIỆU TỪ CỘT DƯƠNG LỊCH:", { namDL, thangDL, ngayDL, gioText });

    const year  = parseInt(namDL)  || 2000;
    const month = parseInt(thangDL) || 1;
    const day   = parseInt(ngayDL)  || 1;
    const hourVal = (() => {
      if (gioText.includes("23:00")) return 23;
      if (gioText.includes("21:00")) return 21;
      if (gioText.includes("19:00")) return 19;
      if (gioText.includes("17:00")) return 17;
      if (gioText.includes("15:00")) return 15;
      if (gioText.includes("13:00")) return 13;
      if (gioText.includes("11:00")) return 11;
      if (gioText.includes("09:00")) return 9;
      if (gioText.includes("07:00")) return 7;
      if (gioText.includes("05:00")) return 5;
      if (gioText.includes("03:00")) return 3;
      if (gioText.includes("01:00")) return 1;
      return 0;
    })();

    // 🔹 Giữ tên thật người dùng trong lá số
    const nameVal = document.getElementById("name")?.value || "(Không tên)";
    const genderVal = document.getElementById("gender")?.value || "Nam";

    // === 2️⃣ Dữ liệu lưu ===
    const dataToSave = {
      name: nameVal, // tên thật trong lá số
      gender: genderVal,
      calendarType: "solar",
      day,
      month,
      year,
      hour: hourVal,
      gioText,
      daXuLyGioTy: (hourVal === 23)
    };

    console.log("💾 [DEBUG] DỮ LIỆU ĐÃ LƯU:", dataToSave);
    localStorage.setItem(safeKey, JSON.stringify(dataToSave));
    if (typeof saveToIndexedDB === "function")
      saveToIndexedDB(safeKey, JSON.stringify(dataToSave));

    refreshSavedChartList();
    document.body.removeChild(overlay);
    alert(`✅ Đã lưu lá số: "${nameVal}" → file "${fileName}"`);
  });

  // ❌ Hủy
  box.querySelector("#btnSaveCancel").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  overlay.addEventListener("click", e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

// =====================================================
// 🔹 Xóa lá số
// =====================================================
function deleteSelectedChart() {
  const select = document.getElementById("savedCharts");
  const encodedName = select?.value;
  if (!encodedName) return alert("⚠️ Vui lòng chọn lá số cần xóa!");
  const displayName = decodeURIComponent(encodedName);
  if (!confirm(`Bạn có chắc muốn xóa lá số "${displayName}" không?`)) return;
  localStorage.removeItem("tuvi_" + encodedName);
  refreshSavedChartList();
  alert("🗑️ Đã xóa lá số: " + displayName);
}



function loadChartFromLocal(encodedName) {
    const key = "tuvi_" + encodedName;
    const displayName = decodeURIComponent(encodedName || "");
    loadFromIndexedDB(key, data => {
      let parsed = null;
      if (data) {
        try { parsed = typeof data === "string" ? JSON.parse(data) : data; } catch (_) { parsed = null; }
      }
      if (!parsed) {
        const ls = localStorage.getItem(key);
        if (ls) { try { parsed = JSON.parse(ls); } catch (_) { parsed = null; } }
      }
      if (!parsed) return alert(`⚠️ Không tìm thấy dữ liệu cho "${displayName || encodedName}"!`);
      window.dataGlobal = parsed;

      console.log("🔵 [LOAD] BẮT ĐẦU LOAD LÁ SỐ…");

      // 1) LUÔN LUÔN TẠO LẠI LAYOUT
      taoLaSoTrang(parsed);

      // 2) SAU ĐÓ XOÁ TẤT CẢ CÁC LỚP SAO CŨ
      clearAllLayers();

      // 3) KHÔI PHỤC LUNAR
      window.__DISABLE_ONCHANGE = true;
      khoiPhucLunar(parsed);
      window.__DISABLE_ONCHANGE = false;
      // 4) AN LẠI TỪ ĐẦU
      anLop1_ViTriCung(parsed);
      anLop2_Menh(parsed);
      anLop4_CucSo(parsed);
      anLop5_NguHanhCung(parsed);
      anLop3_ChinhTinh(parsed);
      anLop6_TrungTinh(parsed);

      if (typeof anTieuTinh === "function")
          anTieuTinh(parsed);

      setTimeout(() => {
          if (typeof anLop6_2_LocTon_ThienMa === "function")
              anLop6_2_LocTon_ThienMa(parsed);
          if (typeof anLop6_4_TuHoa === "function")
              anLop6_4_TuHoa(parsed);
          if (typeof enableCungHighlight === "function")
              enableCungHighlight();
      }, 450);

      if (typeof anTuan === "function") anTuan(parsed);
      if (typeof anTriet === "function") anTriet(parsed);
      if (typeof veThanhTuanTriet === "function") veThanhTuanTriet(parsed);
      if (typeof xacDinhCungThan === "function") xacDinhCungThan(parsed);

      alert(`♻️ Đã tải lá số: ${displayName || encodedName}`);
    });
}



// =====================================================
// 📸 Xuất ảnh lá số Tử Vi
// =====================================================
function downloadChartAsImage() {
  const chart = document.getElementById("lasoContainer");
  if (!chart) return alert("Không tìm thấy khung lá số!");
  html2canvas(chart, {
    scale: 3,
    backgroundColor: "#fff",
    useCORS: true,
    logging: false,
    allowTaint: true,
    scrollX: 0,
    scrollY: -window.scrollY
  }).then(canvas => {
    const link = document.createElement("a");
    const fileName =
      (window.dataGlobal?.tenChuDe || "lasotuvi") +
      "_" +
      new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") +
      "_HD.png";
    link.download = fileName;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  });
}


// =====================================================
// 🚀 Sự kiện khởi tạo
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  refreshSavedChartList();

  const select = document.getElementById("savedCharts");
  if (select) select.addEventListener("change", () => {
    if (select.value) loadChartFromLocal(select.value);
  });

  const btnSave = document.getElementById("btnSaveChart");
  if (btnSave) btnSave.addEventListener("click", saveChartToLocal);

  const btnList = document.getElementById("btnListCharts");
  if (btnList) btnList.addEventListener("click", showChartListPopup);

  const btnDownload = document.getElementById("btnDownloadChart");
  if (btnDownload) btnDownload.addEventListener("click", downloadChartAsImage);
});










/* =====================================================
   📂 DANH SÁCH LÁ SỐ — XEM / XOÁ / ĐỔI TÊN (POPUP)
   ===================================================== */
// =====================================================
// 🔄 RESET TOÀN BỘ GIAO DIỆN SAO LƯU + TIỂU TINH + HẠN
// =====================================================

function resetFullUI() {
  console.log("🔁 Reset toàn bộ giao diện về trạng thái ban đầu...");

  // 1️⃣ Reset tất cả checkbox hiển thị lớp (nếu có)
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = cb.defaultChecked;
  });

  // 2️⃣ Ẩn toàn bộ bảng và khung phụ
  const hideList = [
    "bangNhomSaoLuu",   // bảng tick nhóm sao lưu
    "xemHanSection"     // khung xem hạn âm lịch
  ];
  hideList.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // 3️⃣ Ẩn toàn bộ sao lưu (Đại vận, Tiểu vận)
  document.querySelectorAll(".sao-luu").forEach(e => e.style.display = "none");

  // 4️⃣ Đặt lại trạng thái nút Đại Vận / Tiểu Vận
  const nutDai = document.getElementById("btnDaiVan");
  const nutTieu = document.getElementById("btnTieuVan");
  [nutDai, nutTieu].forEach(btn => {
    if (!btn) return;
    btn.classList.remove("active");
    btn.classList.add("off");
    btn.style.background = "#ccc";
    btn.style.color = "#333";
  });

  // 5️⃣ Reset bảng tick nhóm sao lưu (Ẩn / Hiện Hạn)
  document.querySelectorAll(".chk-nhom").forEach(chk => {
    chk.checked = true; // bật lại hết
  });

  // 6️⃣ Xóa nội dung dropdown hạn (Năm / Tháng / Ngày)
  ["luuNam", "luuThang", "luuNgay"].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.value = "";
  });

  // 7️⃣ Reset nhãn “Tuổi: —”
  const tuoiLabel = document.getElementById("tuoiAmLabel");
  if (tuoiLabel) tuoiLabel.textContent = "Tuổi: —";

  // 8️⃣ Xoá sao lưu cũ (Đại / Tiểu vận)
  document.querySelectorAll(".sao-luu").forEach(e => e.remove());

  // 9️⃣ Reset toàn bộ nút Tiểu tinh (bật lại như ban đầu)
  const btnTieuTinhBox = document.querySelector("#tieuTinhControls");
  if (btnTieuTinhBox) {
    const buttons = btnTieuTinhBox.querySelectorAll(".nut-tieutinh");
    buttons.forEach(b => {
      b.classList.add("active");
      b.style.background = "#337ab7";
      b.style.color = "#fff";
    });
  }

  // 🔟 Reset logic Tiểu tinh hiển thị
  if (typeof toggleTieuTinh === "function") {
    // Bật lại toàn bộ nhóm Tiểu tinh
    ["Tất Cả","Tình Duyên","Tiền Bạc","Công Danh","Sức Khỏe"].forEach(group => {
      toggleTieuTinh(group, true);
    });
  }

  // 11️⃣ Hiện lại khung Tiểu tinh nếu bị ẩn
  const tieuTinhControls = document.getElementById("tieuTinhControls");
  if (tieuTinhControls) tieuTinhControls.style.display = "flex";

  // 12️⃣ Cuộn về đầu trang để tránh lệch
  window.scrollTo(0, 0);
}








// ⚠️ Xác nhận trước khi mở lá số
function confirmAndLoadChart(name) {
  const displayName = decodeURIComponent(name || "");
  if (!confirm(`Bạn có chắc muốn mở lá số "${displayName}" không?`)) return;

  console.log("📂 Đang mở lá số:", displayName);
  const key = "tuvi_" + name;

  loadFromIndexedDB(key, dataFromIDB => {
    let data = null;
    if (dataFromIDB) {
      try { data = typeof dataFromIDB === "string" ? JSON.parse(dataFromIDB) : dataFromIDB; } catch (_) { data = null; }
    }
    if (!data) {
      const dataStr = localStorage.getItem(key);
      if (dataStr) { try { data = JSON.parse(dataStr); } catch (_) { data = null; } }
    }
    if (!data) return alert(`⚠️ Không tìm thấy dữ liệu lá số "${displayName}"!`);

    try {
      // 🧠 Gán lại thông tin cơ bản
      document.getElementById("name").value = data.name || "";
      document.getElementById("gender").value = data.gender || "Nam";

      // ✅ Luôn dùng ngày Dương gốc đã lưu (ổn định, không bị lệch 23h hay nhuận)
      const day = String(data.day || data.ngayDuong || 1);
      const month = String(data.month || data.thangDuong || 1);
      const year = String(data.year || data.namDuong || 2000);
      const hour = String(data.hour || data.gioSinh || 0);

      // 🗓️ Gán lại form theo ngày Dương
      document.getElementById("calendarType").value = "solar";
      const dayEl = document.getElementById("day");
      const monthEl = document.getElementById("month");
      const yearEl = document.getElementById("year");
      const gioEl = document.getElementById("gio");

      if ([...dayEl.options].some(o => o.value === day)) dayEl.value = day;
      if ([...monthEl.options].some(o => o.value === month)) monthEl.value = month;
      if ([...yearEl.options].some(o => o.value === year)) yearEl.value = year;
      if ([...gioEl.options].some(o => o.value === hour)) gioEl.value = hour;

      // 🕛 Ghi cờ Giờ Tý (nếu có)
      if (data.daXuLyGioTy && hour === "23") {
        console.log("🕛 Giờ Tý đã được xử lý sẵn khi lưu → không cần cộng lại ngày âm.");
        window.dataGlobal = { ...data, daXuLyGioTy: true };
      }

      console.log(`🧭 Đã nạp form: ${day}/${month}/${year} (Dương) - Giờ ${hour}`);
    } catch (err) {
      console.warn("⚠️ Lỗi khi gán form:", err);
    }

    // Ẩn popup danh sách
    const popup = document.getElementById("chartListPopup");
    if (popup) popup.style.display = "none";

    // 🔄 Gọi lại nút “Chuyển đổi” để hệ thống tự tính lại Âm lịch
    const btnConvert = document.getElementById("convert");
    if (btnConvert) {
      console.log("🔄 Đang an lại toàn bộ lá số bằng nút 'Chuyển đổi' (từ Dương)...");
      btnConvert.click();
    } else {
      alert("⚠️ Không tìm thấy nút 'Chuyển đổi'!");
    }
  });
}




















// 🔹 Hiển thị danh sách popup
  function showChartListPopup() {
    const popup = document.getElementById("chartListPopup");
    const container = document.getElementById("chartListItems");
    if (!popup || !container) return;
      // 🟦 Cập nhật giao diện popup to hơn, căn giữa, có đổ bóng
    Object.assign(popup.style, {
      position: "fixed",
      top: "62%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      border: "2px solid #888",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      width: "859px",
      maxHeight: "600px",
      overflowY: "auto",
      padding: "16px",
      zIndex: 99999,
      fontFamily: "'Times New Roman', serif"
    });
  
    container.style.maxHeight = "500px";
    container.style.overflowY = "auto";
    container.style.padding = "8px";
  
    // 🧠 Lấy danh sách keys từ IndexedDB trước, fallback localStorage
    listTuviKeysFromIDB(keysFromIDB => {
      const charts = (keysFromIDB.length
        ? keysFromIDB
        : Object.keys(localStorage).filter(k => k.startsWith("tuvi_"))
      ).map(k => k.replace("tuvi_", ""));
  
      if (!charts.length) {
        container.innerHTML = "<p><i>Chưa có lá số nào được lưu.</i></p>";
      } else {
        container.innerHTML = charts.map(encodedName => {
          const name = decodeURIComponent(encodedName);
          const noteKey = "note_" + encodedName;
          const hasNote = !!localStorage.getItem(noteKey); // ✅ kiểm tra ghi chú (chỉ localStorage)
          const noteIcon = hasNote ? "📌" : "📄"; // ✅ có note dùng 📌, chưa có dùng 📄
  
          return `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                border-bottom:1px solid #eee;
                padding:4px 0;">
              <span style="cursor:pointer;color:#007bff;flex:1;"
                    onclick="confirmAndLoadChart('${encodedName}')">${name}</span>
              <span style="cursor:pointer;margin-left:8px;"
                    title="Đổi tên" onclick="renameChartByName('${encodedName}')">✏️</span>
              <span style="cursor:pointer;margin-left:8px;"
                    title="Ghi chú riêng" onclick="editNoteByName('${encodedName}')">${noteIcon}</span>
              <span style="cursor:pointer;margin-left:8px;color:#c00;"
                    title="Xoá" onclick="deleteChartByName('${encodedName}')">🗑️</span>
            </div>
          `;
        }).join("");
      }
  
      popup.style.display = "block";
    });
  }

// 🔹 Ghi chú riêng cho từng lá số — thêm overlay, xác nhận khi đóng, có nút ✖ góc phải
function editNoteByName(encodedName) {
  const name = decodeURIComponent(encodedName);
  const noteKey = "note_" + encodedName;
  const oldNote = localStorage.getItem(noteKey) || "";

  // 🩵 Tạo overlay nếu chưa có
  let overlay = document.getElementById("noteOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "noteOverlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.4)",
      zIndex: 999998,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    });
    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";

  // 🩶 Tạo popup nếu chưa có
  let noteBox = document.getElementById("notePopup");
  if (!noteBox) {
    noteBox = document.createElement("div");
    noteBox.id = "notePopup";
    Object.assign(noteBox.style, {
      background: "#fff",
      border: "1px solid #aaa",
      borderRadius: "10px",
      padding: "15px",
      width: "520px",
      boxShadow: "0 5px 20px rgba(0,0,0,0.25)",
      fontFamily: "'Times New Roman', serif",
      position: "relative",
      zIndex: 999999
    });

    noteBox.innerHTML = `
      <!-- Nút ✖ góc phải -->
      <div style="position:absolute;top:8px;right:10px;cursor:pointer;font-size:18px;color:#666;"
           title="Đóng" onclick="closeNotePopup()">✖</div>

      <h3 style="margin-top:0;text-align:center;color:#007bff;">📝 Ghi chú lá số</h3>
      <div id="noteTitle" style="font-weight:bold;text-align:center;margin-bottom:8px;color:#444;"></div>

      <div id="toolbarNote" style="display:none;text-align:center;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;">
        <button onclick="execCmd('bold')"><b>B</b></button>
        <button onclick="execCmd('italic')"><i>I</i></button>
        <button onclick="execCmd('underline')"><u>U</u></button>
        <button onclick="execCmd('justifyLeft')">⯇</button>
        <button onclick="execCmd('justifyCenter')">☰</button>
        <button onclick="execCmd('justifyRight')">⯈</button>
        <select onchange="execCmd('fontSize', this.value)">
          <option value="3">Cỡ</option>
          <option value="2">Nhỏ</option>
          <option value="3">Vừa</option>
          <option value="5">To</option>
          <option value="7">Rất to</option>
        </select>
        <input type="color" onchange="execCmd('foreColor', this.value)">
      </div>

      <div id="noteView" style="
        border:1px solid #ccc;
        border-radius:6px;
        min-height:150px;
        padding:8px;
        background:#fafafa;
        overflow-y:auto;
      "></div>

      <div style="text-align:right;margin-top:10px;">
        <button id="noteEditBtn" style="background:#f0ad4e;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;">✏️ Chỉnh sửa</button>
<button id="noteSaveBtn" style="background:#37474f;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;display:none;">🪶 Lưu</button>
        <button id="noteCloseBtn" style="background:#ccc;border:none;border-radius:4px;padding:5px 12px;margin-left:6px;cursor:pointer;">✖ Đóng</button>
      </div>
    `;
    overlay.appendChild(noteBox);
  }

  // 📋 Gán nội dung ban đầu
  document.getElementById("noteTitle").textContent = name;
  const noteView = document.getElementById("noteView");
  noteView.innerHTML = oldNote || "<i>Chưa có ghi chú.</i>";
  noteView.contentEditable = "false";

  // 🧭 Reset trạng thái
  document.getElementById("toolbarNote").style.display = "none";
  document.getElementById("noteSaveBtn").style.display = "none";
  document.getElementById("noteEditBtn").style.display = "inline-block";
  noteView.style.background = "#fafafa";
  overlay.style.display = "flex";

  let edited = false; // cờ kiểm tra có chỉnh sửa hay không

  // 🎨 Các nút
  const editBtn = document.getElementById("noteEditBtn");
  const saveBtn = document.getElementById("noteSaveBtn");
  const closeBtn = document.getElementById("noteCloseBtn");

  editBtn.onclick = () => {
    noteView.contentEditable = "true";
    noteView.focus();
    document.getElementById("toolbarNote").style.display = "block";
    saveBtn.style.display = "inline-block";
    editBtn.style.display = "none";
    noteView.style.background = "#fff";
    edited = true;
  };


// 🪶 Lưu ghi chú lá số

  saveBtn.onclick = () => {
    const html = noteView.innerHTML.trim();
    if (!html) {
      localStorage.removeItem(noteKey);
      noteView.innerHTML = "<i>Chưa có ghi chú.</i>";
    } else {
      localStorage.setItem(noteKey, html);
    }
    noteView.contentEditable = "false";
    noteView.style.background = "#fafafa";
    document.getElementById("toolbarNote").style.display = "none";
    saveBtn.style.display = "none";
    editBtn.style.display = "inline-block";
    edited = false;
    showChartListPopup();
  };

  closeBtn.onclick = () => {
    if (edited && noteView.isContentEditable) {
      if (!confirm("⚠️ Ghi chú chưa được lưu. Bạn có chắc muốn đóng?")) return;
    }
    overlay.style.display = "none";
  };

  // ❌ Không cho click ra ngoài đóng popup
  overlay.addEventListener("click", e => {
    if (e.target.id === "noteOverlay") {
      if (edited && noteView.isContentEditable) {
        alert("Vui lòng bấm 💾 Lưu hoặc ✖ Đóng để thoát.");
      }
    }
  });
}

// 🎨 Lệnh định dạng
function execCmd(cmd, val = null) {
  document.execCommand(cmd, false, val);
}

// 🧩 Hàm đóng popup khi click ✖ góc phải — có xác nhận nếu chưa lưu
function closeNotePopup() {
  const overlay = document.getElementById("noteOverlay");
  const noteView = document.getElementById("noteView");
  if (!overlay || !noteView) return;

  const isEditing = noteView.isContentEditable;
  if (isEditing) {
    const edited = noteView.innerHTML.trim() !== "" && noteView.style.background === "rgb(255, 255, 255)";
    if (edited && !confirm("⚠️ Ghi chú chưa được lưu. Bạn có chắc muốn đóng?")) return;
  }

  overlay.style.display = "none";
}



// 🔹 Đổi tên lá số
  function renameChartByName(encodedName) {
    const oldName = decodeURIComponent(encodedName);
    const newName = prompt(`✏️ Nhập tên mới cho lá số "${oldName}":`, oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
  
    const newEncoded = encodeURIComponent(newName.trim());
    const oldKey = "tuvi_" + encodedName;
    const newKey = "tuvi_" + newEncoded;
  
    // 🔸 Kiểm tra trùng tên (IndexedDB trước, rồi localStorage)
    loadFromIndexedDB(newKey, exists => {
      if (exists || localStorage.getItem(newKey)) {
        alert("⚠️ Tên này đã tồn tại. Vui lòng chọn tên khác!");
        return;
      }
  
      // 🔹 Lấy dữ liệu cũ
      loadFromIndexedDB(oldKey, chartData => {
        let dataToMove = chartData;
        if (!dataToMove) {
          const ls = localStorage.getItem(oldKey);
          if (ls) dataToMove = ls;
        }
        if (!dataToMove) {
          alert("❌ Không tìm thấy dữ liệu lá số cũ!");
          return;
        }
  
        const noteKeyOld = "note_" + encodedName;
        const noteKeyNew = "note_" + newEncoded;
        const noteData = localStorage.getItem(noteKeyOld);
  
        // 🔹 Lưu lại với tên mới
        saveToIndexedDB(newKey, dataToMove);
        if (noteData) localStorage.setItem(noteKeyNew, noteData);
        try { localStorage.setItem(newKey, dataToMove); } catch (_) {}
  
        // 🔹 Xoá bản cũ
        const req = indexedDB.open("TuViDB", 1);
        req.onsuccess = e => {
          const db = e.target.result;
          if (db.objectStoreNames.contains("jsonStore")) {
            const tx = db.transaction("jsonStore", "readwrite");
            tx.objectStore("jsonStore").delete(oldKey);
          }
        };
        localStorage.removeItem(oldKey);
        localStorage.removeItem(noteKeyOld);
  
        alert(`✅ Đã đổi tên "${oldName}" thành "${newName}".`);
        refreshSavedChartList();
        showChartListPopup(); // cập nhật danh sách
      });
    });
  }
  
  // 🔹 Xoá lá số theo tên
  function deleteChartByName(encodedName) {
    const name = decodeURIComponent(encodedName); // ✅ hiển thị đúng tên
    if (!confirm(`🗑️ Xoá lá số "${name}"?`)) return;
    const key = "tuvi_" + encodedName;
  
    const req = indexedDB.open("TuViDB", 1);
    req.onsuccess = e => {
      const db = e.target.result;
      if (db.objectStoreNames.contains("jsonStore")) {
        const tx = db.transaction("jsonStore", "readwrite");
        tx.objectStore("jsonStore").delete(key);
      }
    };
    localStorage.removeItem(key);
    refreshSavedChartList();
    showChartListPopup();
  }

// 🔹 Đóng popup khi click ra ngoài
document.addEventListener("click", e => {
  const popup = document.getElementById("chartListPopup");
  if (!popup) return;
  if (!popup.contains(e.target) && e.target.id !== "btnListCharts") {
    popup.style.display = "none";
  }
});


// =====================================================
// 🌟 CÂY TRA CỨU SAO – CÓ POPUP, SỬA TÊN, KÉO THẢ
// =====================================================

// Dữ liệu đầy đủ (nếu có localStorage thì dùng bản người dùng)
window.DANH_MUC_SAO = JSON.parse(localStorage.getItem("DANH_MUC_SAO")) || {
  "Chính Tinh": [
    "Tử Vi","Thiên Cơ","Thái Dương","Vũ Khúc","Thiên Đồng",
    "Liêm Trinh","Thiên Phủ","Thái Âm","Tham Lang",
    "Cự Môn","Thiên Tướng","Thiên Lương","Thất Sát","Phá Quân"
  ],

  "Trung Tinh – Cát Tinh": [
    "Thiên Khôi","Thiên Việt","Tả Phù","Hữu Bật","Văn Xương","Văn Khúc"
  ],

  "Trung Tinh – Hung Tinh": [
    "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp"
  ],

  "Tứ Hóa": ["Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ"],
  "Lộc – Mã": ["Lộc Tồn","Thiên Mã"],

  // 🌟 TIỂU TINH GỘP CHUNG, NHƯNG CHIA NHÓM CON
  "Tiểu Tinh": {
    "Theo Thái Tuế": [
      "Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù",
      "Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"
    ],
    "Theo Địa Chi Năm Sinh": [
      "Phượng Các","Giải Thần","Long Trì","Nguyệt Đức","Thiên Đức","Thiên Hỷ",
      "Thiên Khốc","Thiên Hư","Đào Hoa","Hồng Loan","Hoa Cái","Kiếp Sát",
      "Phá Toái","Cô Thần","Quả Tú"
    ],
    "Theo Tháng Sinh": [
      "Thiên Hình","Thiên Riêu","Thiên Y","Thiên Giải","Địa Giải"
    ],
    "Theo Giờ Sinh": ["Thai Phụ","Phong Cáo"],
    "Theo Lộc Tồn": [
      "Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư",
      "Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"
    ],
    "Theo Can / Ngày / Tạp Tinh": [
      "Thiên Quý","Ân Quang","Tam Thai","Bát Tọa","Lưu Hà","Quốc Ấn",
      "Đường Phù","Văn Tinh","Thiên Quan","Thiên Phúc","Thiên Trù",
      "Đẩu Quân","Thiên Không","Thiên Tài","Thiên Thọ","Thiên Thương",
      "Thiên Sứ","Thiên La","Địa Võng"
     ],

  // 🟢 NHÓM MỚI — VÒNG TRÀNG SINH
  "Vòng Tràng Sinh": [
    "Trường Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng",
    "Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"
  ]
  },

  "Cung": [
    "Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách",
    "Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu","An Thân"
  ],

  "Tuần – Triệt": ["Tuần Không","Triệt Không"]
};

// =====================================================
// 🌳 TẠO CÂY TỰ ĐỘNG — Gom Trung Tinh, hiển thị Tiểu Tinh đúng nhóm
// =====================================================
window.renderSidebar = function () {
  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

  sidebar.innerHTML = `<h3>🔮 <b>TỪ ĐIỂN SAO</b></h3>`;

  const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
  let groupIndex = 0;

  // ✅ Gom nhóm Trung Tinh thành 2 nhóm con
  const DANH_MUC_GOP = {
    "Chính Tinh": DANH_MUC_SAO["Chính Tinh"],
    "Trung Tinh": {
      "Lục Cát Tinh": DANH_MUC_SAO["Trung Tinh – Cát Tinh"],
      "Lục Sát Tinh": DANH_MUC_SAO["Trung Tinh – Hung Tinh"]
    },
    "Tứ Hóa": DANH_MUC_SAO["Tứ Hóa"],
    "Lộc – Mã": DANH_MUC_SAO["Lộc – Mã"],
    "Tiểu Tinh": DANH_MUC_SAO["Tiểu Tinh"],  // 👈 Object gồm nhiều nhóm
    "Cung": DANH_MUC_SAO["Cung"],
    "Tuần – Triệt": DANH_MUC_SAO["Tuần – Triệt"]
  };

  Object.entries(DANH_MUC_GOP).forEach(([nhom, ds]) => {
    groupIndex++;
    const romanNum = roman[groupIndex - 1];
    const div = document.createElement("div");
    div.className = "group";

    // 🔹 Nhóm có mảng trực tiếp (Chính Tinh, Tứ Hóa, Lộc – Mã, Cung, Tuần – Triệt)
    if (Array.isArray(ds)) {
      let html = `<div class="group-title">${romanNum}. ${nhom}</div><ul style="display:none;">`;
      ds.forEach((sao, idx) => {
        html += `<li draggable="true" data-sao="${sao}">${groupIndex}.${idx + 1} ${sao}</li>`;
      });
      html += `</ul>`;
      div.innerHTML = html;
    }

    // 🔸 Trung Tinh — có 2 nhóm con
    else if (nhom === "Trung Tinh" && typeof ds === "object") {
      let html = `<div class="group-title">${romanNum}. ${nhom}</div><ul class="subgroup-list" style="display:none;">`;
      let subIdx = 0;

      Object.entries(ds).forEach(([sub, saoList]) => {
        subIdx++;
        html += `
          <li class="subgroup">
            <div class="sub-title">${romanNum}.${String.fromCharCode(96 + subIdx)} ${sub}</div>
            <ul class="sao-list" style="display:none;">
              ${
                Array.isArray(saoList)
                  ? saoList.map((s, i) => `<li draggable="true" data-sao="${s}">${groupIndex}.${i + 1} ${s}</li>`).join("")
                  : ""
              }
            </ul>
          </li>`;
      });
      html += `</ul>`;
      div.innerHTML = html;
    }

    // 🔹 Tiểu Tinh — có nhiều nhóm nhỏ, không đánh số sao
    else if (nhom === "Tiểu Tinh" && typeof ds === "object") {
      let html = `<div class="group-title">${romanNum}. ${nhom}</div><ul class="subgroup-list" style="display:none;">`;
      let subIndex = 0;

      Object.entries(ds).forEach(([tenNhom, saoList]) => {
        subIndex++;
        html += `
          <li class="subgroup">
            <div class="sub-title">${groupIndex}.${subIndex} ${tenNhom}</div>
            <ul class="sao-list" style="display:none;">
              ${
                Array.isArray(saoList)
                  ? saoList.map((s) => `<li draggable="true" data-sao="${s}">${s}</li>`).join("")
                  : ""
              }
            </ul>
          </li>`;
      });
      html += `</ul>`;
      div.innerHTML = html;
    }

    sidebar.appendChild(div);
  });

  // === Toggle nhóm chính ===
  document.querySelectorAll("#sidebarTraCuu .group-title").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") return;
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });

  // === Toggle nhóm con ===
  document.querySelectorAll("#sidebarTraCuu .sub-title").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") return;
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });

  attachSidebarEvents();

  // 🔹 Khi click vào tiêu đề "TỪ ĐIỂN SAO" → chỉ thu nhóm SAO, KHÔNG ẩn CHUYÊN ĐỀ
  const title = sidebar.querySelector("h3");
  if (title) {
    title.style.cursor = "pointer";
    title.addEventListener("click", () => {
      document.querySelectorAll("#sidebarTraCuu .group ul, #sidebarTraCuu .subgroup-list, #sidebarTraCuu .sao-list").forEach(ul => {
        ul.style.display = "none";
      });
    });
  }




// ✅ Thêm phần 📘 CHUYÊN ĐỀ (độc lập)
const chuyenDeBox = document.createElement("div");
chuyenDeBox.id = "chuyenDeBox";
chuyenDeBox.innerHTML = `
  <hr style="border:none; border-top:1px solid #ccc; margin:12px 0;">
  <h3 id="titleChuyenDe" style="text-align:center; color:#3a0ca3; cursor:pointer;">📘 CHUYÊN ĐỀ</h3>

  <!-- ✅ Danh sách chuyên đề -->
  <ul id="listChuyenDe" style="
    list-style:none;
    padding-left:10px;
    margin:0;
    position:relative;
  "></ul>

  <!-- ✅ Hai nút Thêm và Sửa nằm cạnh nhau -->
  <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
    <button id="btnAddChuyenDe" style="
      flex:1;
      background:#7b2cbf;
      color:white;
      border:none;
      border-radius:6px;
      padding:5px 10px;
      cursor:pointer;
    ">➕ Thêm chuyên đề</button>

    <button id="btnToggleEdit" style="
      background: linear-gradient(145deg, #ffb300, #ff8f00);
      color: #222;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    ">✏️ Sửa</button>
  </div>

  <!-- 🎨 CSS nhỏ gọn hiển thị dấu 🔹 cho mục có con -->
  <style>
    /* Mỗi dòng chuyên đề */
    #listChuyenDe li {
      margin-bottom: 5px;
      line-height: 1.5;
      padding-bottom: 2px;
      border-bottom: 1px dotted #ddd;
      color: #3a0ca3;
    }

    /* Mục có danh sách con */
    #listChuyenDe li:has(> ul) {
      position: relative;
      padding-left: 16px;
    }

    /* Dấu 🔹 cho mục có con */
    #listChuyenDe li:has(> ul)::before {
      content: "🔹";
      position: absolute;
      left: 0;
      top: 2px;
      font-size: 12px;
      color: #6a0dad;
    }

    /* Các cấp con lùi nhẹ */
    #listChuyenDe li ul {
      margin-left: 12px;
      border-left: 1px dotted #ccc;
      padding-left: 10px;
    }
  </style>
`;

sidebar.appendChild(chuyenDeBox);

// ✅ Thêm phần 📘 CÁCH CỤC (ngay dưới CHUYÊN ĐỀ)
const cachCucBox = document.createElement("div");
cachCucBox.id = "cachCucBox";
cachCucBox.innerHTML = `
  <hr style="border:none; border-top:1px solid #ccc; margin:12px 0;">
  <h3 id="titleCachCuc" style="text-align:center; color:#5a189a; cursor:pointer;">📘 CÁCH CỤC</h3>

  <div id="cachCucPanel" style="padding:6px; position:relative;">
    <div id="listCachCuc" style="max-height:250px;overflow-y:auto;padding-left:5px;font-size:14px; position:relative;"></div>
    <button id="btnAddCachCuc" style="margin-top:6px;background:#7b2cbf;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">➕ Thêm Cách Cục</button>
  </div>

  <!-- Popup thêm mới -->
<div id="popupCachCuc"
     style="
       display:none;
       position:fixed;
       inset:0;
       background:rgba(0,0,0,0.45);
       align-items:center;
       justify-content:center;
       z-index:999999;
     ">

  <div class="popup-inner"
     style="
       background:#fff;
       padding:24px 28px;
       border-radius:12px;
       width:800px !important;      /* ⭐ cố định thực sự */
       height:500px !important;     /* ⭐ cố định thực sự */
       overflow-y:auto;
       box-shadow:0 6px 22px rgba(0,0,0,0.3);
     ">


      <h3 style="margin-top:0;">🪶 Thêm Cách Cục mới</h3>

      <label>Tên Cách Cục:</label><br>
      <input class="cc-ten-input"
             style="width:100%;padding:5px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;">

      <div id="dieuKienContainer"></div>

      <button id="btnAddDieuKien"
              style="margin-top:8px;background:#eee;padding:4px 8px;border-radius:4px;cursor:pointer;">
              ➕ Thêm Điều Kiện
      </button>

      <div style="margin-top:12px;text-align:right;">
        <button id="btnSaveCachCuc"
                style="background:#5a189a;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">
                Lưu
        </button>
        <button id="btnCloseCachCuc"
                style="background:#888;color:#fff;border:none;border-radius:6px;padding:6px 12px;margin-left:5px;cursor:pointer;">
                Đóng
        </button>
      </div>
    </div>

  </div>
`;
sidebar.appendChild(cachCucBox);
// 👉 DI CHUYỂN POPUP RA NGOÀI SIDEBAR ĐỂ KHÔNG BỊ CHE
const popup = document.getElementById("popupCachCuc");
document.body.appendChild(popup);


// ✅ Cách Cục: sẽ được nạp từ IndexedDB (fallback localStorage)
window.CACH_CUC_DATA = [];













// 🚀 Kích hoạt render & nút thêm
setTimeout(() => {
  const btnAdd = document.getElementById("btnAddChuyenDe");
  if (btnAdd) btnAdd.onclick = window.themChuyenDe;

  const btnEditToggle = document.getElementById("btnToggleEdit");
  if (btnEditToggle) btnEditToggle.onclick = toggleEditMode;

  renderChuyenDe(false);

  // 🔹 Khi bấm vào tiêu đề "📘 CHUYÊN ĐỀ" → thu gọn toàn bộ cây
  setTimeout(() => {
    const titleCD = document.getElementById("titleChuyenDe");
    if (!titleCD) return;
    titleCD.addEventListener("click", () => {
      document.querySelectorAll("#listChuyenDe ul.cd-level").forEach(ul => {
        ul.style.display = "none";
      });
      const rootUl = document.querySelector("#listChuyenDe > ul.cd-level");
      if (rootUl) rootUl.style.display = "block";
    });
  }, 300);
}, 200);
;

// 🧩 Đừng quên đóng ngoặc kết thúc hàm renderSidebar
};









// =====================================================
// 🎯 KẾT NỐI SỰ KIỆN (CLICK, ĐỔI TÊN, DRAG DROP)
// =====================================================
function attachSidebarEvents() {
  // ⚙️ Xóa sự kiện cũ
  document.querySelectorAll("#sidebarTraCuu li").forEach(li => {
    li.replaceWith(li.cloneNode(true));
  });

  // 🎯 Gắn lại sự kiện CHỈ CHO các sao thật (li có data-sao)
  document.querySelectorAll("#sidebarTraCuu li[data-sao]").forEach(li => {
    li.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ten = li.dataset.sao;
      if (!ten) return;
      const key = timKeySao(ten);
      if (key) moPopupSao(key);
      else moPopupSao_Ten(ten);
    });


    // 🧲 drag drop
    li.addEventListener("dragstart", e => {
      e.stopPropagation();
      e.dataTransfer.setData("text/plain", li.dataset.sao);
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
  });

  // 🧭 Xử lý drop danh sách
  document.querySelectorAll("#sidebarTraCuu ul").forEach(ul => {
    ul.addEventListener("dragover", e => e.preventDefault());
    ul.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();
      const dragging = document.querySelector(".dragging");
      const after = Array.from(ul.children).find(
        ch => e.clientY < ch.getBoundingClientRect().top + ch.offsetHeight / 2
      );
      if (after) ul.insertBefore(dragging, after);
      else ul.appendChild(dragging);
      updateDanhMucFromDOM();
      saveSidebarState();
    });
  });

  // 🔹 Toggle nhóm con (đảm bảo mở ra Tiểu Tinh hoặc Lục Cát / Lục Sát)
  document.querySelectorAll("#sidebarTraCuu .sub-title").forEach(el => {
    el.addEventListener("click", e => {
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });
}

// =====================================================
// 🔎 HÀM HỖ TRỢ: tìm key trong SAO_DATA theo tên hiển thị
// =====================================================
function timKeySao(ten) {
  if (!window.SAO_DATA) return null;
  ten = __norm(ten);

  const match = Object.keys(SAO_DATA).find(k => {
    const sao = SAO_DATA[k];
    const tenSao = sao?.short?.ten ? __norm(sao.short.ten) : "";


    // ✅ chỉ khớp chính xác
    return tenSao === ten || k.toLowerCase() === ten;
  });

  return match || null;
}

window.moPopupSao_Ten = moPopupSao_Ten;

// Trường hợp chưa có dữ liệu trong SAO_DATA
function moPopupSao_Ten(ten) {
  // ⚠️ Lấy vị trí cung hiện tại từ DOM nếu chưa có
  if (!window.currentCung) {
    const activeStar = document.querySelector(`[data-sao*="${ten}"]`);
    if (activeStar) {
      const cungEl = activeStar.closest("[id^='cell']"); // cell11, cell12,...
      if (cungEl) {
        const idx = parseInt(cungEl.id.replace("cell", ""), 10);
        const VI_TRI_CUNG = ["", "Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
        window.currentCung = VI_TRI_CUNG[idx] || null;
      }
    }
  }

  // Luôn set currentSao
  window.currentSao = ten;

  // render Tab2 nếu popup đã mở
  renderTab2(ten);

  // Phần code cũ
  renderBangCungChuc(window.currentCung); // KHÔNG truyền "ten" vào đây nữa


  const box = document.getElementById("popupThongTin");

  // Nếu popupTenSao chưa tồn tại thì tạo mới
  let titleEl = document.getElementById("popupTenSao");
  if (!titleEl) {
    titleEl = document.createElement("h2");
    titleEl.id = "popupTenSao";
    titleEl.style.textAlign = "center";
    titleEl.style.fontWeight = "bold";
    titleEl.style.marginBottom = "10px";
    document.querySelector("#saoPopup .popup-content").prepend(titleEl);
  }

  titleEl.innerText = ten.toUpperCase();

  box.innerHTML = `<p style="text-align:center;"><i>Chưa có mô tả chi tiết cho sao / cung này.</i></p>`;
  document.getElementById("saoPopup").style.display = "flex";
  if (typeof setPopupMode === "function") setPopupMode("view");
}

function cleanSaoKey(name) {
  return __norm(
    (name || "").replace(/^(L\.|ĐV\.|N\.|Nh\.|TL\.)\s*/i, "")
  );
}

function renderTab2(sao) {
  const table = document.getElementById("bangCungChuc");
  if (!table) return;

  // =========================
  // 1️⃣ LẤY NỘI DUNG THEO SAO
  // =========================
  let data = {};

  if (window.SAO_DATA && sao && SAO_DATA[sao]) {
    if (!SAO_DATA[sao].cungChuc) SAO_DATA[sao].cungChuc = {};
    data = SAO_DATA[sao].cungChuc;
  }

  const CUNG = [
    "Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch",
    "Tật Ách","Thiên Di","Nô Bộc","Quan Lộc",
    "Điền Trạch","Phúc Đức","Phụ Mẫu"
  ];

  // =========================
  // 2️⃣ RENDER BẢNG NỘI DUNG
  // =========================
  let html = `
    <tr>
      <th rowspan="2" style="width:140px; text-align:center;">Cung</th>
      <th colspan="2" style="text-align:center;">Ý nghĩa tại các cung chức</th>
    </tr>
    <tr>
      <th style="text-align:center; color:green;">Cát</th>
      <th style="text-align:center; color:red;">Hung</th>
    </tr>
  `;

  CUNG.forEach(cung => {
    const row = data[cung] || { cat: "", hung: "" };
    html += `
      <tr>
        <td>${cung}</td>
        <td data-cung="${cung}" data-type="cat" class="cung-meaning">${row.cat}</td>
        <td data-cung="${cung}" data-type="hung" class="cung-meaning">${row.hung}</td>
      </tr>
    `;
  });

  table.innerHTML = html;




  // =========================
// 3️⃣ HIGHLIGHT TAB 2 (Sao thường hoặc Tuần/Triệt)
// =========================
try {
  const map = window.dataGlobal?.cungChucMap; // Ví dụ: { "Tý":"Phúc Đức", "Sửu":"Phụ Mẫu", ... }
  if (!map) return;

  // Xóa highlight cũ
  document.querySelectorAll("#bangCungChuc tr")
    .forEach(tr => tr.classList.remove("cung-highlight"));

  const CHUC_CANON = {
    "MỆNH": "Mệnh",
    "HUYNH ĐỆ": "Huynh Đệ",
    "PHU THÊ": "Phu Thê",
    "TỬ TỨC": "Tử Tức",
    "TÀI BẠCH": "Tài Bạch",
    "TẬT ÁCH": "Tật Ách",
    "THIÊN DI": "Thiên Di",
    "NÔ BỘC": "Nô Bộc",
    "QUAN LỘC": "Quan Lộc",
    "ĐIỀN TRẠCH": "Điền Trạch",
    "PHÚC ĐỨC": "Phúc Đức",
    "PHỤ MẪU": "Phụ Mẫu"
  };

  // Danh sách sẽ highlight (có thể 1 hoặc 2 cung)
  const list = [];

  // 🟢 Trường hợp sao bình thường
  if (window.currentCung) {
    const raw = map[window.currentCung]; // ví dụ: Tý → Phúc Đức
    if (raw) list.push(raw);
  }

  // 🟣 Trường hợp Tuần / Triệt → chặn 2 cung
  if (window.blockedCung?.length === 2) {
    const [c1, c2] = window.blockedCung;
    if (map[c1]) list.push(map[c1]);
    if (map[c2]) list.push(map[c2]);
  }

  // Không có gì để tô sáng
  if (!list.length) return;

  // 🔥 Highlight các dòng tương ứng
  document.querySelectorAll("#bangCungChuc tr").forEach(tr => {
    const td = tr.querySelector("td");
    if (!td) return;

    const val = td.textContent.trim();
    list.forEach(rawName => {
      const canon = CHUC_CANON[rawName.toUpperCase()] || rawName;
      if (val === canon) {
        tr.classList.add("cung-highlight");
      }
    });
  });

} catch (e) {
  console.warn("Highlight Tab2 error:", e);
}

}



function renderTab3(sao) {
  if (!SAO_DATA[sao]) return;
  if (!SAO_DATA[sao].tuHoa) SAO_DATA[sao].tuHoa = {};

  const data = SAO_DATA[sao].tuHoa;

  const HOA = [
    "Hóa Lộc",
    "Hóa Quyền",
    "Hóa Khoa",
    "Hóa Kỵ"
  ];

  let html = `
  <tr>
    <th rowspan="2" style="width:140px; text-align:center;">Tứ Hóa</th>
    <th colspan="2" style="text-align:center;">Ý nghĩa</th>
  </tr>
  <tr>
    <th style="text-align:center; color:green;">Cát</th>
    <th style="text-align:center; color:red;">Hung</th>
  </tr>
  `;

  HOA.forEach(name => {
    const row = data[name] || { cat: "", hung: "" };

    html += `
      <tr>
        <td>${name}</td>
        <td data-hoa="${name}" data-type="cat" class="hoa-split">${row.cat}</td>
        <td data-hoa="${name}" data-type="hung" class="hoa-split">${row.hung}</td>
      </tr>
    `;
  });

  document.getElementById("bangTuHoa").innerHTML = html;
}


// =====================================================
// 💾 Lưu và phục hồi cây (phiên bản chuẩn, không phá cấu trúc Tiểu Tinh)
// =====================================================
function updateDanhMucFromDOM() {
  const newMap = {};

  document.querySelectorAll("#sidebarTraCuu .group").forEach(div => {
    const groupTitle = div.querySelector(".group-title")?.innerText || "";
    const subgroupEls = div.querySelectorAll(":scope > ul.subgroup-list > li.subgroup");

    // Nếu có nhóm con (như Trung Tinh, Tiểu Tinh)
    if (subgroupEls.length > 0) {
      const subgroupMap = {};
      subgroupEls.forEach(sub => {
        const subTitle = sub.querySelector(".sub-title")?.innerText || "";
        const saoEls = sub.querySelectorAll("ul.sao-list li[data-sao]");
        const saoNames = Array.from(saoEls)
          .map(li => li.dataset.sao)
          .filter(Boolean);
        if (saoNames.length > 0) subgroupMap[subTitle] = saoNames;
      });
      newMap[groupTitle] = subgroupMap;
    }
    // Nếu chỉ có 1 danh sách phẳng (như Chính Tinh, Tứ Hóa, Cung...)
    else {
      const saoEls = div.querySelectorAll("ul li[data-sao]");
      const saoNames = Array.from(saoEls)
        .map(li => li.dataset.sao)
        .filter(Boolean);
      newMap[groupTitle] = saoNames;
    }
  });

  window.DANH_MUC_SAO = newMap;
}


// =====================================================
// 💾 Lưu trạng thái sidebar (tạm: chỉ cập nhật danh mục)
// =====================================================
function saveSidebarState() {
  try {
    updateDanhMucFromDOM();
    console.log("💾 Sidebar state saved.");
  } catch (err) {
    console.warn("⚠️ Không thể lưu sidebar state:", err);
  }
}

// 🧩 Hàm tạo ID duy nhất cho mỗi chuyên đề hoặc mục con
function generateId() {
  return 'cd_' + Math.random().toString(36).substr(2, 9);
}


// =====================================================
// ➕ Thêm chuyên đề cấp 1 (tự đánh số La Mã)
// =====================================================
function themChuyenDe() {
  const name = prompt("Nhập tên chuyên đề mới:");
  if (!name) return;

  // Tránh trùng tên cấp 1 (so sánh phần tên sau tiền tố La Mã)
  const lowerName = name.trim().toLowerCase();

  const trungTen = Object.keys(CHUYEN_DE_DATA).some(key => {
    // Chỉ loại bỏ phần tiền tố La Mã (I., II., III...) hoặc số thứ tự có dấu chấm
    const tenGoc = key.replace(/^[IVXLCDM]+\.\s*|^\d+\.\s*/i, "").trim().toLowerCase();
    return tenGoc === lowerName;
  });

  if (trungTen) {
    alert("Tên chuyên đề này đã tồn tại!");
    return;
  }



  // 🧮 Đánh số La Mã theo thứ tự hiện có
  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const index = Object.keys(CHUYEN_DE_DATA).length; // bắt đầu từ 0
  const prefix = romanNumerals[index] || (index + 1);
  const fullName = `${prefix}. ${name}`;

// ➕ Thêm vào dữ liệu (kèm ID)
CHUYEN_DE_DATA[fullName] = { id: generateId(), noiDung: "", children: {} };
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));


  // 🔁 Render lại cây mà giữ trạng thái
  renderChuyenDe(false);
}



// =====================================================
// 📘 CÂY CHUYÊN ĐỀ ĐA CẤP (tối đa 5 cấp, có ▸/▾, lưu localStorage)
// =====================================================

// ⚙️ Dữ liệu khởi tạo (phiên bản an toàn)
let chuyenDeRaw = localStorage.getItem("CHUYEN_DE_DATA");
try {
  if (typeof chuyenDeRaw === "string" && chuyenDeRaw.trim().startsWith("{")) {
    window.CHUYEN_DE_DATA = JSON.parse(chuyenDeRaw);
  } else if (typeof chuyenDeRaw === "object") {
    // Đã là object thật → gán thẳng
    window.CHUYEN_DE_DATA = chuyenDeRaw;
  } else {
    // Nếu chưa có trong localStorage → tạo mặc định
    window.CHUYEN_DE_DATA = {
      "I. An Sao": { noiDung: "", children: {} },
      "II. Vô Chính Diệu": { noiDung: "", children: {} },
      "III. Luận Vận": { noiDung: "", children: {} },
      "IV. Tình Duyên": { noiDung: "", children: {} }
    };
  }
} catch (err) {
  console.warn("⚠️ Lỗi parse CHUYEN_DE_DATA:", err);
  window.CHUYEN_DE_DATA = {
    "I. An Sao": { noiDung: "", children: {} },
    "II. Vô Chính Diệu": { noiDung: "", children: {} },
    "III. Luận Vận": { noiDung: "", children: {} },
    "IV. Tình Duyên": { noiDung: "", children: {} }
  };
}

// 🧩 Phục hồi dữ liệu nếu bản cũ bị phẳng
for (const key in CHUYEN_DE_DATA) {
  const item = CHUYEN_DE_DATA[key];
  if (!item || typeof item !== "object" || !("children" in item)) {
    CHUYEN_DE_DATA[key] = { noiDung: "", children: {} };
  }
}

// 🔹 Lưu toàn bộ cây
function luuChuyenDe() {
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

}

// =====================================================
// ✏️ ĐỔI TÊN MỤC CHUYÊN ĐỀ (giữ nguyên id & dữ liệu)
// =====================================================
function doiTenMucChuyenDe(ten, data) {
  if (!ten || !data) return;

  // 🔍 Tìm node hiện tại theo tên
  const node = findNodeByName(data, ten);
  if (!node) return alert("Không tìm thấy chuyên đề: " + ten);

  // ✏️ Hỏi tên mới
  const tenGoc = ten.replace(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|•\s*)/i, "").trim();
  const newNameOnly = prompt("Đổi tên mục:", tenGoc);
  if (!newNameOnly || newNameOnly === tenGoc) return;

  // 🏷️ Giữ nguyên prefix (I., 1., a., • …)
  const prefix = ten.match(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|•\s*)/i)?.[0] || "";
  const newNameFull = (prefix + newNameOnly).trim();

  // 🔄 Cập nhật tên trong dữ liệu
  renameKeyInTree(data, ten, newNameFull);

  // 💾 Lưu lại
  luuChuyenDe();
  renderChuyenDe(false);
  setTimeout(() => saveNewOrder(), 100);
}

// 🔍 Tìm node theo tên (duyệt toàn cây)
function findNodeByName(data, name) {
  for (const key in data) {
    if (key === name) return data[key];
    const found = findNodeByName(data[key].children || {}, name);
    if (found) return found;
  }
  return null;
}

// 🔄 Đổi key nhưng giữ nguyên id & children
function renameKeyInTree(data, oldKey, newKey) {
  if (data[oldKey]) {
    data[newKey] = data[oldKey]; // giữ nguyên id, noiDung, children
    delete data[oldKey];
    return true;
  }
  for (const key in data) {
    const child = data[key];
    if (child.children && renameKeyInTree(child.children, oldKey, newKey)) return true;
  }
  return false;
}

function doiTenMucChuyenDeTheoId(id) {
  const nodeInfo = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!nodeInfo) return alert("Không tìm thấy mục có id: " + id);

  const { key, parentData, node } = nodeInfo;
  const ten = key;

  const tenGoc = ten.replace(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|•\s*)/i, "").trim();
  const newNameOnly = prompt("Đổi tên mục:", tenGoc);
  if (!newNameOnly || newNameOnly === tenGoc) return;

  const prefix = ten.match(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|•\s*)/i)?.[0] || "";
  const newNameFull = (prefix + newNameOnly).trim();

  // Cập nhật key trong parentData (không mất id)
  delete parentData[key];
  parentData[newNameFull] = node;

  luuChuyenDe();
  renderChuyenDe(false);
  setTimeout(() => saveNewOrder(), 100);
}








// ➕ Thêm mục con tự đánh số theo cấp
function themMucCon(tenCha) {
  function findNodeByName(data, name) {
    for (const key in data) {
      if (key === name) return data[key];
      const found = findNodeByName(data[key].children || {}, name);
      if (found) return found;
    }
    return null;
  }

  const parent = findNodeByName(CHUYEN_DE_DATA, tenCha);
  if (!parent) return alert("Không tìm thấy chuyên đề cha: " + tenCha);

  const name = prompt("Nhập tên mục con mới:");
  if (!name) return;

  // 🔹 Đảm bảo children là mảng
  if (!Array.isArray(parent.children)) parent.children = [];

  // 🔹 Đếm thứ tự con hiện có
  const count = parent.children.length + 1;

  // 🔹 Xác định prefix theo cấp
  let prefix = "";
  if (/^[IVXLCDM]+\./i.test(tenCha)) {
    prefix = `${count}. `;
  } else if (/^\d+(\.\d+)*\./.test(tenCha)) {
    const base = tenCha.match(/^\d+(?:\.\d+)*/)[0];
    prefix = `${base}.${count}. `;
  } else if (/^[a-z]\./i.test(tenCha)) {
    prefix = String.fromCharCode(96 + count) + ". ";
  } else if (/^•/.test(tenCha)) {
    prefix = "• ";
  }

  const fullName = `${prefix}${name.trim()}`;

  // ⚠️ Tránh trùng tên
  if (parent.children.some(c => c.key === fullName)) {
    alert("Tên mục con này đã tồn tại!");
    return;
  }

  // ➕ Thêm node mới
  const newId = generateId();
  const newNode = { id: newId, key: fullName, noiDung: "", children: [] };
  parent.children.push(newNode);

  console.log("🧩 Mục con mới:", newNode);

  // 💾 Lưu
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
  saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

  // ✅ Render lại toàn bộ cây
  const container = document.getElementById("listChuyenDe");
  if (container) container.innerHTML = "";
  renderChuyenDe(false);

  setTimeout(() => {
    if (typeof saveNewOrder === "function") {
      console.log("🔁 Đang đánh lại số thứ tự...");
      saveNewOrder();
      const container2 = document.getElementById("listChuyenDe");
      if (container2) {
        container2.innerHTML = "";
        renderChuyenDe(false);
      }
      saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
      console.log(`✅ Đã thêm "${fullName}" vào "${tenCha}" và cập nhật số.`);
    }
  }, 100);
}








// =====================================================
// 📘 Render cây chuyên đề đa cấp (5 cấp) – đánh số theo hệ A–I–1–a
// =====================================================
function renderChuyenDeRecursive(data, cap = 1) {
  const ul = document.createElement("ul");
  ul.className = "cd-level";
  ul.setAttribute("data-level", cap);

  // 🔢 Bảng ký hiệu cho từng cấp
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const smallLetters = "abcdefghijklmnopqrstuvwxyz".split("");

  Object.entries(data).forEach(([ten, obj], index) => {
    const li = document.createElement("li");
    li.className = "cd-item";

    // ✅ Luôn đảm bảo node có id (nếu chưa có thì cấp mới)
    if (!obj.id) obj.id = generateId();
    li.dataset.id = obj.id;

    const hasChildren = obj.children && Object.keys(obj.children).length > 0;

    // 🧮 Tạo prefix theo cấp
    let prefix = "";
    if (cap === 1) prefix = letters[index] ? `${letters[index]}. ` : `${index + 1}. `;
else if (cap === 2) prefix = `${toRoman(index + 1)}. `;
    else if (cap === 3) prefix = `${index + 1}. `;
    else if (cap === 4) prefix = smallLetters[index] ? `${smallLetters[index]}. ` : `${index + 1}. `;
    else prefix = "";

    // 🔹 Tên hiển thị
    const displayName = prefix + ten.replace(/^[A-Z]+\.\s*|^[IVXLCDM]+\.\s*|^\d+\.\s*|^[a-z]+\.\s*/i, "").trim();

    // 🔹 Tạo phần tử tên
    const nameSpan = document.createElement("span");
    nameSpan.textContent = displayName;
    nameSpan.className = "cd-name";

    // 👉 Cấp 2–5: click mở popup
    if (cap >= 2) {
      nameSpan.onclick = (e) => {
        e.stopPropagation();
        const id = obj.id || li.dataset.id;
        moPopupChuyenDeTheoId(id, ten);
      };
    }

    // 🔹 Nhóm nút hành động
    const actions = document.createElement("div");
    actions.className = "cd-actions";

    // ➕ Thêm mục con
    const addBtn = document.createElement("button");
    addBtn.innerHTML = "➕";
    addBtn.title = "Thêm mục con";
    addBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      themMucConTheoId(id);
    };
    if (cap >= 5) addBtn.style.display = "none"; // không thêm con ở cấp 5
    actions.appendChild(addBtn);

    // ✏️ Đổi tên
    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.title = "Đổi tên";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      doiTenMucChuyenDeTheoId(id);
    };
    actions.appendChild(editBtn);

    // 🗑️ Xóa
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "🗑️";
    delBtn.title = "Xóa";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      if (confirm("Xóa mục này?")) {
        xoaMucTheoId(id);
      }
    };
    actions.appendChild(delBtn);

    // 🔹 Hàng chính
    const row = document.createElement("div");
    row.className = "cd-row";
    const left = document.createElement("div");
    left.className = "cd-left";
    left.appendChild(nameSpan);
    row.appendChild(left);
    row.appendChild(actions);
    li.appendChild(row);

    // 🔹 Cấp con (gọi đệ quy)
    if (hasChildren) {
      const childUl = renderChuyenDeRecursive(obj.children, cap + 1);
      childUl.style.display = "none";
      if (cap < 5) {
        nameSpan.onclick = (e) => {
          e.stopPropagation();
          const visible = childUl.style.display !== "none";
          childUl.style.display = visible ? "none" : "block";
        };
      }
      li.appendChild(childUl);
    }

    ul.appendChild(li);
  });

  return ul;
}









// =====================================================
// ✏️ Nút bật/tắt chế độ "Sửa"
// =====================================================
let editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode", editMode);

  const btn = document.getElementById("btnToggleEdit");
  if (!btn) return;

  if (editMode) {
    btn.classList.add("active");
    btn.textContent = "✅ Hoàn tất";
  } else {
    btn.classList.remove("active");
    btn.textContent = "✏️ Sửa";
  }
}


// =====================================================
// 🖱️ DRAG & DROP mọi cấp (1 → 5) — ổn định, không lẫn cấp
// =====================================================
function enableDragDrop() {
  const root = document.getElementById("listChuyenDe");
  if (!root) return;

  // lấy toàn bộ li trong mọi cấp
  const allLis = root.querySelectorAll("li");

  allLis.forEach(li => {
    li.draggable = true;

    // khi bắt đầu kéo
    li.addEventListener("dragstart", e => {
      e.stopPropagation(); // ✅ ngăn chặn cha bắt sự kiện
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", getItemPath(li));
      li.classList.add("dragging");
    });

    // khi thả ra
    li.addEventListener("dragend", e => {
      e.stopPropagation();
      li.classList.remove("dragging");
    });

    // khi kéo qua một phần tử khác
    li.addEventListener("dragover", e => {
      e.preventDefault();
      e.stopPropagation();

      const dragging = document.querySelector(".dragging");
      if (!dragging) return;

      // 🚫 không cho kéo cha vào trong con của chính nó
      if (dragging.contains(li)) return;

      // chỉ cho phép hoán đổi trong cùng cấp (cùng parent)
      if (dragging.parentElement === li.parentElement) {
        const rect = li.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          li.parentElement.insertBefore(dragging, li);
        } else {
          li.parentElement.insertBefore(dragging, li.nextSibling);
        }
      }
    });

    // khi thả chuột ra
    li.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();
      saveNewOrder && saveNewOrder();
    });
  });
}

// 📍Lấy đường dẫn đầy đủ (VD: "I. Tình duyên / 1. C1 / 1.2. Bala")
function getItemPath(li) {
  const names = [];
  let current = li;
  while (current) {
    const name =
      current.querySelector(".cd-name")?.textContent?.trim() ||
      current.firstChild?.textContent?.trim() ||
      "";
    if (name) names.unshift(name);
    current = current.parentElement.closest("li");
  }
  return names.join(" / ");
}



// 🔍 Tìm dữ liệu cũ theo ID duy nhất
function getDataById(data, id) {
  for (const key in data) {
    const node = data[key];
    if (node.id === id) return node;
    const found = getDataById(node.children || {}, id);
    if (found) return found;
  }
  return null;
}

// =====================================================
// 💾 Lưu lại thứ tự mới sau khi kéo–thả (cập nhật lại số thứ tự La Mã)
// =====================================================
// 🔍 Trợ lý tìm dữ liệu cũ theo tên (vì key đổi)
function getDataByName(data, name) {
  for (const key in data) {
    if (key === name) return data[key];
    const found = getDataByName(data[key].children || {}, name);
    if (found) return found;
  }
  return null;
}

// ✅ Hàm chuyển số sang chữ số La Mã (không giới hạn 10)
function toRoman(num) {
  const romans = [
    ["M",1000], ["CM",900], ["D",500], ["CD",400],
    ["C",100], ["XC",90], ["L",50], ["XL",40],
    ["X",10], ["IX",9], ["V",5], ["IV",4], ["I",1]
  ];
  let result = "";
  for (const [sym, val] of romans) {
    while (num >= val) {
      result += sym;
      num -= val;
    }
  }
  return result;
}

// =====================================================
// 💾 Lưu thứ tự mới (I, 1, 1.1, a, •) – fix sạch dấu ".."
// =====================================================
function saveNewOrder() {
  const list = document.getElementById("listChuyenDe");
  if (!list) return;
  const rootUl = list.querySelector("ul.cd-level");
  if (!rootUl) return;

  const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  function getDataByName(data, name) {
    for (const key in data) {
      if (key === name) return data[key];
      const found = getDataByName(data[key].children || {}, name);
      if (found) return found;
    }
    return null;
  }

function renumber(ul, parentPrefix = "", level = 1) {
  const result = {};
  const lis = Array.from(ul.children).filter(el => el.classList.contains("cd-item"));

  lis.forEach((li, idx) => {
    const nameEl = li.querySelector(":scope > .cd-row .cd-name");
    if (!nameEl) return;

    const id = li.dataset.id || generateId();
    li.dataset.id = id;

    const oldData = getDataById(CHUYEN_DE_DATA, id) || { id, noiDung: "", children: {} };

    // 🧮 Tạo prefix mới
    let prefixDisplay = "";
    if (level === 1) prefixDisplay = String.fromCharCode(64 + idx + 1);
else if (level === 2) prefixDisplay = toRoman(idx + 1);
    else if (level === 3) prefixDisplay = `${idx + 1}`;
    else if (level === 4) prefixDisplay = String.fromCharCode(97 + idx);
    else prefixDisplay = "";

    const nameWithoutPrefix = nameEl.textContent
      .replace(/^(?:[A-Z]\.\s*|[IVXLCDM]+\.\s*|\d+\.\s*|[a-z]\.\s+|•\s*)/i, "")
      .trim();
    const newName = prefixDisplay ? `${prefixDisplay}. ${nameWithoutPrefix}` : nameWithoutPrefix;

    nameEl.textContent = newName;

    const childUl = li.querySelector(":scope > ul.cd-level");
    const childData = childUl ? renumber(childUl, prefixDisplay, level + 1) : oldData.children || {};

    result[newName] = {
      id,
      noiDung: oldData.noiDung,
      children: childData
    };
  });

  return result;
}



  const newData = renumber(rootUl, "", 1);
  CHUYEN_DE_DATA = newData;
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));


  renderChuyenDe(false);
}










// =====================================================
// 🎨 CSS
// =====================================================
const styleCD = document.createElement("style");
styleCD.innerHTML = `
#listChuyenDe { padding-left: 0; }

/* ============================= */
/* ⚙️ BỐ CỤC CHUNG CHUYÊN ĐỀ CÂY */
/* ============================= */

/* Mỗi mục trong cây */
.cd-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px dashed #ccc;
  padding: 1px 0;
  margin: 0;
  line-height: 1.2;
}

/* Hàng chính: tên + các nút */
.cd-item > .cd-row {
  display: flex;
  justify-content: space-between;   /* 👈 tách trái – phải */
  align-items: center;
  margin: 0;
  padding-left: 0;
}


/* Phần trái (tên + mũi tên) */
.cd-left {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: nowrap;
}

/* Tên chuyên đề */
.cd-name {
  cursor: pointer;
  font-weight: 600;
  color: #7a2ac2;
  font-size: 15px;
  line-height: 1.2;
}

/* Mũi tên ▸/▾ */
.cd-arrow {
  font-weight: bold;
  color: #7b2cbf;
  user-select: none;
  font-size: 12px;
  cursor: pointer;
  margin-left: 2px;
}
.cd-arrow:hover { color: #3a0ca3; }

/* Nhóm nút hành động (gọn lại) */
.cd-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}
/* 🔹 Kích thước icon nhỏ gọn */
.cd-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 6px; /* 👈 nhỏ hơn 1/2 */
  opacity: 0.6;
  transition: transform 0.2s, opacity 0.2s;
  padding: 0 1px;
}
.cd-actions button:hover {
  opacity: 1;
  transform: scale(1.2);
}


/* 🔹 Màu chữ phân biệt rõ và đậm theo cấp */
.cd-level[data-level="1"] > .cd-item > .cd-row .cd-name {
  color: #b22222; /* Đỏ đậm */
  font-weight: 700;
}

.cd-level[data-level="2"] > .cd-item > .cd-row .cd-name {
  color: #d2691e; /* Cam đậm / nâu cam */
  font-weight: 700;
}

.cd-level[data-level="3"] > .cd-item > .cd-row .cd-name {
  color: #003366; /* Xanh dương đậm – navy blue */
  font-weight: 700;
}

.cd-level[data-level="4"] > .cd-item > .cd-row .cd-name {
  color: #006400; /* Xanh lá đậm */
  font-weight: 600;
  font-style: italic;
}

.cd-level[data-level="5"] > .cd-item > .cd-row .cd-name {
  color: #000000; /* Đen */
  font-style: italic;
}




/* ============================= */
/* ⚙️ CẤP CÂY & THỤT DÒNG HỢP LÝ */
/* ============================= */

/* Cấp gốc (I, II, III...) */
.cd-level {
  list-style: none;
  margin: 0;
  padding-left: 0; /* 👈 không thụt toàn bộ cây */
  border-left: none;
}

/* Cấp con mới có đường thụt và đường kẻ */
.cd-item > ul.cd-level {
  padding-left: 2px;   /* 👈 giảm thụt để cân */

  border-left: 2px dotted #ddd; /* 👈 chỉ vẽ line khi có cấp con */
}

/* Khung “chưa có mục con” */
.cd-empty-sub {
  margin: 2px 0 4px 15px;
  font-style: italic;
  font-size: 13px;
  color: #555;
}
.cd-empty-sub button {
  background: #7b2cbf;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 1px 5px;
  margin-left: 2px;
  cursor: pointer;
  font-size: 13px;
}
`;

// ⚙️ Ghi đè mức thụt dòng khi cây đã load
const fixIndent = document.createElement("style");
fixIndent.textContent = `
.cd-item > ul.cd-level {
  padding-left: 4px !important;
}
.cd-item > ul.cd-level > li > ul.cd-level {
  padding-left: 2px !important;
}
.cd-item > ul.cd-level > li > ul.cd-level > li > ul.cd-level {
  padding-left: 1px !important;
}
`;
document.head.appendChild(fixIndent);

document.head.appendChild(styleCD);






// ===========================================
// 💾 Ghi nhớ trạng thái mở/đóng trước khi render
// ===========================================
function getExpandedPaths() {
  const expanded = [];
  document.querySelectorAll("#listChuyenDe ul").forEach(ul => {
    if (ul.style.display !== "none") {
      const li = ul.closest("li");
      if (li) expanded.push(getItemPath(li));
    }
  });
  return expanded;
}

// ✅ Khôi phục trạng thái sau khi render
function restoreExpandedPaths(paths) {
  paths.forEach(path => {
    const li = Array.from(document.querySelectorAll("#listChuyenDe li"))
      .find(li => getItemPath(li) === path);
    if (li) {
      const ul = li.querySelector("ul");
      if (ul) ul.style.display = "block";
    }
  });
}

// =====================================================
// 🚀 Gấp toàn bộ cây (reset tất cả cấp con)
// =====================================================
function collapseAll() {
  // Ẩn toàn bộ danh sách con ở mọi cấp
  document.querySelectorAll("#listChuyenDe ul.cd-level").forEach(ul => {
    ul.style.display = "none";
  });

  // Hiển thị lại đúng cấp 1 (La Mã)
  const rootUl = document.querySelector("#listChuyenDe > ul.cd-level");
  if (rootUl) rootUl.style.display = "block";

  // Chỉ hiển thị các mục cấp 1 (I., II., III.)
  rootUl.querySelectorAll(":scope > li > ul.cd-level").forEach(subUl => {
    subUl.style.display = "none";
  });
}


// =====================================================
// 🚀 Render cây chuyên đề (giữ trạng thái + gấp cấp con khi load)
// =====================================================
function renderChuyenDe(autoCollapse = false) {
  const list = document.getElementById("listChuyenDe");
  if (!list) return;

  // 💾 Lưu trạng thái hiện tại
  const expanded = getExpandedPaths();

  list.innerHTML = "";
  list.appendChild(renderChuyenDeRecursive(CHUYEN_DE_DATA, 1));

  // Áp khóa ngay sau render
  if (typeof toggleChuyenDeEditLock === "function") {
    toggleChuyenDeEditLock(window.isPaidUser && window.isPaidUser());
  }

  // 🔁 Phục hồi trạng thái (chỉ nếu không gấp toàn bộ)
  if (!autoCollapse) restoreExpandedPaths(expanded);

  // ✅ Nếu autoCollapse: chỉ giữ cấp 1, gấp toàn bộ cấp 2 trở xuống
  if (autoCollapse) {
    collapseAll();
  }

  // 🟣 Kích hoạt kéo thả sau khi render xong
  enableDragDrop();
}


// =====================================================
// 🔄 Khởi động (nạp dữ liệu từ IndexedDB trước khi render)
// =====================================================
window.addEventListener("DOMContentLoaded", () => {

  // 🧠 Nạp SAO_DATA trước
  loadFromIndexedDB("SAO_DATA", data => {
    window.SAO_DATA = data ? JSON.parse(data) : JSON.parse(localStorage.getItem("SAO_DATA") || "{}");
    console.log("✅ Nạp SAO_DATA từ IndexedDB (hoặc localStorage nếu trống)");

    // 🧠 Nạp Chuyên Đề Data
    loadFromIndexedDB("CHUYEN_DE_DATA", d => {
      window.CHUYEN_DE_DATA = d ? JSON.parse(d) : JSON.parse(localStorage.getItem("CHUYEN_DE_DATA") || "{}");
    });

    // 🧠 Nạp Cấu trúc cây chuyên đề
    loadFromIndexedDB("CHUYEN_DE_CAY", d => {
      window.CHUYEN_DE_CAY = d ? JSON.parse(d) : JSON.parse(localStorage.getItem("CHUYEN_DE_CAY") || "{}");
    });

    // ✅ Sau khi đã có dữ liệu → render giao diện
    renderSidebar?.();
    renderChuyenDe?.(true);

    // 🔹 Nút “Thêm chuyên đề”
    const addBtn = document.getElementById("btnAddChuyenDe");
    if (addBtn) addBtn.onclick = () => themChuyenDe();

    // 🔹 Bấm tiêu đề “CHUYÊN ĐỀ” → gấp toàn bộ
    const titleEl = Array.from(document.querySelectorAll("h2, h3, .titleChuyenDe, .cd-title"))
      .find(el => el.textContent.includes("CHUYÊN ĐỀ"));
    if (titleEl) {
      titleEl.style.cursor = "pointer";
      titleEl.addEventListener("click", () => collapseAll());
    }

  }); // <- hết callback IndexedDB
});

// =====================================================
// 🧭 KIỂM TRA NGUỒN DỮ LIỆU & DUNG LƯỢNG SAO_DATA (phiên bản IndexedDB)
// =====================================================
function kiemTraNguonDuLieu() {
  try {
    loadFromIndexedDB("SAO_DATA", data => {
      let source = "⚪ Không xác định";
      let sizeMB = 0;

      if (data) {
        // ✅ Có dữ liệu trong IndexedDB
        window.SAO_DATA = JSON.parse(data);
        source = "💾 IndexedDB";
        sizeMB = (new Blob([data]).size / (1024 * 1024)).toFixed(2);
      } else {
        // ❎ Nếu không có, thử lấy từ localStorage (cho tương thích cũ)
        const saved = localStorage.getItem("SAO_DATA");
        if (saved) {
          window.SAO_DATA = JSON.parse(saved);
          source = "📦 localStorage (tạm)";
          sizeMB = (new Blob([saved]).size / (1024 * 1024)).toFixed(2);
        }
      }

      console.log(`🧩 Nguồn dữ liệu hiện tại: ${source} (${sizeMB} MB)`);

      // ⚠️ Cảnh báo nếu vẫn còn ở localStorage và quá 4.5MB
      if (source.includes("localStorage") && sizeMB > 4.5) {
        console.warn(`⚠️ Dung lượng ${sizeMB} MB có thể vượt giới hạn localStorage — nên xuất ra file backup!`);
      }

      // 🧭 Nếu có cờ vừa nhập từ file
      const savedFileFlag = localStorage.getItem("SAO_DATA_IMPORTED_FROM_FILE");
      if (savedFileFlag) {
        console.log("📥 Dữ liệu vừa được nhập từ file JSON, đã ghi vào IndexedDB.");
        localStorage.removeItem("SAO_DATA_IMPORTED_FROM_FILE");
      }
    });
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra nguồn dữ liệu:", err);
  }
}

// Gọi tự động khi load xong trang
window.addEventListener("DOMContentLoaded", kiemTraNguonDuLieu);


// =====================================================
// 🔁 TỰ KHÔI PHỤC DỮ LIỆU TỪ FILE JSON ĐÃ NẠP LẦN TRƯỚC
// =====================================================
(function autoReloadLastJSON() {
  const lastFile = localStorage.getItem("LAST_JSON_FILE_CONTENT");
  if (!lastFile) {
    console.log("ℹ️ Không có file JSON nào được lưu từ lần trước.");
    return;
  }

  try {
    const obj = JSON.parse(lastFile);
    console.log("📂 Tự động khôi phục dữ liệu từ file JSON lần trước:", obj);

    // ✅ Lấy phần SAO_DATA (hoặc toàn bộ nếu là object gốc)
    const data = obj.SAO_DATA || obj;
    window.SAO_DATA = data;

    // 💾 Lưu vào IndexedDB thay vì localStorage (an toàn, không giới hạn)
    saveToIndexedDB("SAO_DATA", JSON.stringify(data));

    console.log("✅ Auto reload SAO_DATA thành công (đã ghi vào IndexedDB).");
  } catch (e) {
    console.warn("⚠️ Lỗi khi đọc lại JSON đã lưu:", e);
  }
})();



// =======================================================
// 💾 HÀM LƯU / NẠP DỮ LIỆU BẰNG INDEXEDDB (DUNG LƯỢNG LỚN)
// =======================================================
function saveToIndexedDB(key, value) {
  const req = indexedDB.open("TuViDB", 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore"))
      db.createObjectStore("jsonStore");
  };
  req.onsuccess = e => {
    const db = e.target.result;
    const tx = db.transaction("jsonStore", "readwrite");
    tx.objectStore("jsonStore").put(value, key);
  };
  req.onerror = e => console.warn("⚠️ Lỗi IndexedDB (save):", e);
}

function loadFromIndexedDB(key, callback) {
  const req = indexedDB.open("TuViDB", 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore"))
      db.createObjectStore("jsonStore");
  };
  req.onsuccess = e => {
    const db = e.target.result;
    const tx = db.transaction("jsonStore", "readonly");
    const store = tx.objectStore("jsonStore");
    const getReq = store.get(key);
    getReq.onsuccess = () => callback(getReq.result);
    getReq.onerror = () => callback(null);
  };
  req.onerror = e => console.warn("⚠️ Lỗi IndexedDB (load):", e);
}



// =====================================================
// 🌟 NẠP DỮ LIỆU SAO (ưu tiên IndexedDB, fallback localStorage)
// =====================================================
window.addEventListener("DOMContentLoaded", function () {
  // 🧠 Thử nạp SAO_DATA từ IndexedDB trước
  loadFromIndexedDB("SAO_DATA", data => {
    try {
      if (data) {
        window.SAO_DATA = JSON.parse(data);
        console.log("✅ Đã nạp SAO_DATA từ IndexedDB.");
      } else {
        // Nếu chưa có thì fallback sang localStorage
        const savedLocal = localStorage.getItem("SAO_DATA");
        if (typeof savedLocal === "string" && savedLocal.trim().startsWith("{")) {
          window.SAO_DATA = JSON.parse(savedLocal);
          console.log("📦 Nạp SAO_DATA từ localStorage (tạm).");
        } else {
          window.SAO_DATA = {};
          console.log("⚪ Chưa có SAO_DATA hợp lệ, khởi tạo rỗng.");
        }
      }
    } catch (err) {
      console.warn("⚠️ Lỗi parse SAO_DATA:", err);
      window.SAO_DATA = {};
    }

    // 🔹 Nếu chưa có dữ liệu thì hiển thị gợi ý
    if (!window.SAO_DATA || Object.keys(window.SAO_DATA).length === 0) {
      alert("📂 Hãy chọn file JSON hoặc backup để nạp dữ liệu sao!");
    }

    // ✅ Khi đã nạp xong → render giao diện
    renderSidebar?.();
    renderChuyenDe?.(true);
  });
});

// =====================================================
// 🌟 TẠO KHUNG DỮ LIỆU CHO TOÀN BỘ SAO (nếu thiếu)
// =====================================================
function ensureAllStars() {
  if (!window.SAO_DATA) window.SAO_DATA = {};

  document.querySelectorAll("#sidebarTraCuu li[data-sao]").forEach(li => {
    const name = li.dataset.sao;
    if (!SAO_DATA[name]) {
      SAO_DATA[name] = {
        short: {
          ten: name.toUpperCase(),
          cung: "",
          hanh: "",
          tinhChat: "",
          dacTinh: ""
        }
      };
      console.log(`🆕 Đã khởi tạo dữ liệu trống cho sao: ${name}`);
    }
  });

  // 💾 Chỉ lưu vào IndexedDB (bỏ localStorage để tránh lỗi QuotaExceededError)
  const json = JSON.stringify(SAO_DATA);
  saveToIndexedDB("SAO_DATA", json);

  console.log("✅ ensureAllStars() – Đã đồng bộ SAO_DATA vào IndexedDB.");
}


// =====================================================
// 🌟 QUẢN LÝ CHẾ ĐỘ POPUP (xem / chỉnh sửa)
// =====================================================
window.setPopupMode = function (mode) {
  const activePopup = document.querySelector(".popup-overlay[style*='display: flex'], .popup-overlay[style*='display: block']");
  if (!activePopup) return;

  const btnEdit = activePopup.querySelector("#btnEdit");
  const btnSave = activePopup.querySelector("#luuPopup");
  const btnCancel = activePopup.querySelector("#btnCancel");

  if (mode === "edit") {
    activePopup.classList.add("edit-mode");
    if (btnEdit) btnEdit.style.display = "none";
    if (btnSave) btnSave.style.display = "";
    if (btnCancel) btnCancel.style.display = "";
  } else {
    activePopup.classList.remove("edit-mode");
    if (btnEdit) btnEdit.style.display = "";
    if (btnSave) btnSave.style.display = "none";
    if (btnCancel) btnCancel.style.display = "none";
  }
};


// =====================================================
// 🌟 HÀM MỞ POPUP SAO (chế độ xem)
// =====================================================
window.moPopupSao = function (maSao) {
  // 🚧 Chặn người chưa premium mở popup sao
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block moPopupSao vì user chưa premium");
    return;
  }

  ensureAllStars();

  const saoObj = SAO_DATA[maSao];
  if (!saoObj.short) saoObj.short = {};
  const data = saoObj.short;
  window.currentSao = maSao;

  renderBangCungChuc(maSao);

  const shortName = (data.ten || maSao).split("–")[0].trim();
  data.ten = data.ten || shortName.toUpperCase();

  const html = `
    <h2 style="text-align:center; font-size:24px; font-weight:bold; color:#3a0ca3; margin-bottom:10px;">
      ${shortName.toUpperCase()}
    </h2>
    <div class="editable-view" style="text-align:center; color:#555;">${data.dong1 || ""}</div>
    <div class="editable-view" style="text-align:left; color:#222;">${data.dong2 || ""}</div>
    <div class="editable-view" style="text-align:center; color:#6a00f4;">${data.dong3 || ""}</div>
    <div class="editable-view" style="text-align:left; color:#000;">${data.dong4 || ""}</div>
  `;

  document.getElementById("popupThongTin").innerHTML = html;

  // Tab 2 + Tab 3
  renderTab2(maSao);
  renderTab3(maSao);

  // 🟣 HIỆN POPUP
  document.getElementById("saoPopup").style.display = "flex";

  // ⭐⭐⭐ RESET SCROLL MỖI LẦN MỞ
  const popupBox = document.querySelector("#saoPopup .popup-content");
  if (popupBox) popupBox.scrollTop = 0;

  setPopupMode("view");

  // ----- Giữ lại kích thước popup nếu có -----
  if (popupBox) {
    popupBox.style.resize = "none";
    popupBox.style.cursor = "default";

    const savedSize = localStorage.getItem("popupSize_" + maSao);
    if (savedSize) {
      const { width, height } = JSON.parse(savedSize);
      popupBox.style.width = width + "px";
      popupBox.style.height = height + "px";
    } else {
      popupBox.style.width = "";
      popupBox.style.height = "";
    }
  }
};

// =====================================================
// ✏️ CHỈNH SỬA NỘI DUNG SAO
// =====================================================
const btnEdit = document.getElementById("btnEdit");
if (btnEdit) {
  btnEdit.onclick = () => {
    const sao = window.currentSao;
    if (!sao) return alert("⚠️ Chưa chọn sao hợp lệ!");
    if (!window.SAO_DATA[sao]) SAO_DATA[sao] = { short: {} };

    const data = SAO_DATA[sao].short;
    const box = document.getElementById("popupThongTin");
    if (!box) return alert("⚠️ Không tìm thấy khung popup!");

    document.getElementById("luuPopup").style.display = "inline-block";
    btnEdit.style.display = "none";

    box.innerHTML = `
      <div id="toolbarPopup" style="margin-bottom:10px; text-align:center;">
        <button onclick="document.execCommand('justifyLeft')">⬅️ Trái</button>
        <button onclick="document.execCommand('justifyCenter')">↔️ Giữa</button>
        <button onclick="document.execCommand('justifyRight')">➡️ Phải</button>
        <button onclick="document.execCommand('bold')">🅱️ Đậm</button>
        <button onclick="document.execCommand('italic')">𝑰 Nghiêng</button>
        <button onclick="insertSampleTable()">📋 Bảng</button>
        <input type="color" id="colorPicker" title="Đổi màu chữ">
      </div>

      <div class="editable" data-field="dong1" contenteditable="true" style="text-align:center; color:#555;">${data.dong1 || ""}</div>
      <div class="editable" data-field="dong2" contenteditable="true" style="text-align:left; color:#222;">${data.dong2 || ""}</div>
      <div class="editable" data-field="dong3" contenteditable="true" style="text-align:center; color:#6a00f4;">${data.dong3 || ""}</div>
      <div class="editable" data-field="dong4" contenteditable="true" style="text-align:left; color:#000;">${data.dong4 || ""}</div>
    `;

    const colorPicker = document.getElementById("colorPicker");
    if (colorPicker) colorPicker.addEventListener("input", () => {
      document.execCommand("foreColor", false, colorPicker.value);
    });

    const popupBox = document.querySelector("#saoPopup .popup-content");
    if (popupBox) {
      popupBox.style.resize = "both";
      popupBox.style.cursor = "nwse-resize";
    }

    // 👇 CHÈN THÊM KHỐI NÀY (PHẦN MỚI)
    // ================================
    // TAB 2 – cho phép gõ ở cột 'Ý nghĩa'
    document.querySelectorAll("#bangCungChuc td[data-cung]").forEach(td => {
  td.contentEditable = true;
  td.classList.add("edit-input");
});
document.querySelectorAll("#bangTuHoa td[data-hoa]").forEach(td => {
  td.contentEditable = true;
  td.classList.add("edit-input");
});


   // TAB 3 — Lưu Tứ Hóa (Cát / Hung)
const hoaData = {};
document.querySelectorAll("#bangTuHoa td[data-hoa]").forEach(td => {
  const hoa = td.dataset.hoa;
  const type = td.dataset.type;
  if (!hoaData[hoa]) hoaData[hoa] = {};
  hoaData[hoa][type] = td.innerHTML.trim();
});
SAO_DATA[sao].tuHoa = hoaData;

    // ================================

    setPopupMode("edit");
  };
}


// =====================================================
// 💾 LƯU NỘI DUNG SAO (chỉ dùng IndexedDB để tránh giới hạn 5MB)
// =====================================================
const btnLuu = document.getElementById("luuPopup");
if (btnLuu) {
  btnLuu.onclick = () => {
    const sao = window.currentSao;
    if (!sao || !SAO_DATA[sao]) return;

    // =========================
    // TAB 1 — Lưu Thông Tin Sao
    // =========================
    const data = SAO_DATA[sao].short;
    document.querySelectorAll("#popupThongTin .editable").forEach(div => {
      const content = div.innerHTML
        .replace(/<h2[^>]*>.*?<\/h2>/gi, "")
        .trim();
      data[div.dataset.field] = content || "";
    });

    // =========================
    // TAB 2 — Lưu Cung Chức (Cát / Hung)
    // =========================
    const cungData = {};
    document.querySelectorAll("#bangCungChuc td[data-cung]").forEach(td => {
      const cung = td.dataset.cung;
      const type = td.dataset.type; // cat or hung
      if (!cungData[cung]) cungData[cung] = {};
      cungData[cung][type] = td.innerHTML.trim();
    });
    SAO_DATA[sao].cungChuc = cungData;

    // =========================
    // TAB 3 — Lưu Tứ Hóa
    // =========================
    const tuHoaBox = document.getElementById("noiDungTuHoa");
    if (tuHoaBox) {
      SAO_DATA[sao].tuHoa = tuHoaBox.innerHTML.trim();
    }

    // =========================
    // LƯU VÀO INDEXEDDB
    // =========================
    try {
      const json = JSON.stringify(SAO_DATA);
      saveToIndexedDB("SAO_DATA", json);
      console.log("💾 Đã lưu SAO_DATA vào IndexedDB thành công!");
    } catch (err) {
      console.warn("⚠️ Lỗi khi lưu IndexedDB:", err);
    }

    // =========================
    // LƯU KÍCH THƯỚC POPUP
    // =========================
    const popupBox = document.querySelector("#saoPopup .popup-content");
    if (popupBox) {
      localStorage.setItem("popupSize_" + sao, JSON.stringify({
        width: popupBox.offsetWidth,
        height: popupBox.offsetHeight
      }));
    }

    // =========================
    // THOÁT CHẾ ĐỘ EDIT
    // =========================
    document.getElementById("luuPopup").style.display = "none";
    document.getElementById("btnEdit").style.display = "inline-block";

    // Reload lại popup để xem dữ liệu mới
    moPopupSao(sao);
  };
}



// =====================================================
// ❌ HỦY / ĐÓNG / CHI TIẾT
// =====================================================
const btnCancel = document.getElementById("btnCancel");
if (btnCancel) btnCancel.onclick = () => moPopupSao(window.currentSao);

const btnChiTiet = document.getElementById("btnChiTiet");
if (btnChiTiet) {
  btnChiTiet.onclick = () => {
    const ten = document.getElementById("popupTenSao")?.innerText;
    const key = Object.keys(SAO_DATA).find(k => SAO_DATA[k].short.ten === ten);
    if (key) window.open("tu-dien-sao.html?sao=" + key, "_blank");
  };
}

const saoPopup = document.getElementById("saoPopup");
if (saoPopup) {
  saoPopup.addEventListener("click", e => {
    if (e.target.id === "saoPopup") {
      const popupBox = saoPopup.querySelector(".popup-content");
      if (saoPopup.classList.contains("edit-mode")) {
        popupBox.classList.add("shake");
        setTimeout(() => popupBox.classList.remove("shake"), 300);
      } else {
        saoPopup.style.display = "none";
      }
    }
  });
}

// =====================================================
// 📘 LOGIC POPUP CHUYÊN ĐỀ – DÙNG INDEXEDDB (phiên bản đầy đủ)
// =====================================================

// 🧭 Khởi tạo rỗng, sẽ nạp từ IndexedDB sau
window.CHUYEN_DE_DATA = {};

// 🔹 Nạp dữ liệu CHUYÊN ĐỀ từ IndexedDB (nếu có)
loadFromIndexedDB("CHUYEN_DE_DATA", data => {
  if (data) {
    try {
      window.CHUYEN_DE_DATA = JSON.parse(data);
      console.log("✅ Nạp CHUYÊN_DE_DATA từ IndexedDB thành công.");
    } catch (e) {
      console.warn("⚠️ Lỗi parse CHUYÊN_DE_DATA:", e);
      window.CHUYEN_DE_DATA = {};
    }
  } else {
    console.log("ℹ️ Chưa có CHUYÊN_DE_DATA trong IndexedDB, tạo mới rỗng.");
    window.CHUYEN_DE_DATA = {};
  }
});


// =====================================================
// 📘 HÀM MỞ POPUP CHUYÊN ĐỀ THEO ID
// =====================================================
window.moPopupChuyenDeTheoId = function (id, tenHienThi = "") {
  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) {
    alert("Không tìm thấy chuyên đề có ID này!");
    return;
  }

  const { node } = found;
  window.currentChuyenDeId = id;
  window.currentChuyenDeName = tenHienThi;

  document.getElementById("tenChuyenDe").innerText = tenHienThi || "(Không có tên)";
  document.getElementById("noiDungChuyenDe").innerHTML =
    node.noiDung || "<i style='color:#777;'>Chưa có nội dung.</i>";

  // Giao diện xem
  document.getElementById("toolbarChuyenDe").style.display = "none";
  document.getElementById("btnEditCD").style.display = "";
  document.getElementById("btnChiTietCD").style.display = "";
  document.getElementById("btnSaveCD").style.display = "none";
  document.getElementById("btnCancelCD").style.display = "none";

  document.getElementById("noiDungChuyenDe").setAttribute("contenteditable", "false");
document.getElementById("popupChuyenDe").style.display = "block";
};



// =====================================================
// ✏️ CHỈNH SỬA CHUYÊN ĐỀ
// =====================================================
document.getElementById("btnEditCD").onclick = () => {
  const box = document.getElementById("noiDungChuyenDe");
  box.setAttribute("contenteditable", "true");
  document.getElementById("toolbarChuyenDe").style.display = "block";
  document.getElementById("btnEditCD").style.display = "none";
  document.getElementById("btnChiTietCD").style.display = "none";
  document.getElementById("btnSaveCD").style.display = "";
  document.getElementById("btnCancelCD").style.display = "";
  document.getElementById("popupChuyenDe").classList.add("edit-mode");

  document.getElementById("colorPickerCD").addEventListener("input", e => {
    document.execCommand("foreColor", false, e.target.value);
  });
};


// =====================================================
// 💾 LƯU CHUYÊN ĐỀ
// =====================================================
document.getElementById("btnSaveCD").onclick = () => {
  const id = window.currentChuyenDeId;
  if (!id) return;

  const html = document.getElementById("noiDungChuyenDe").innerHTML.trim();

  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) return alert("Không tìm thấy node để lưu!");
  const { node } = found;

  // ✅ Cập nhật nội dung cho đúng node
  node.noiDung = html;

  // 💾 Lưu toàn bộ cây
  saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

  // 🔁 Reload popup hiển thị lại
  moPopupChuyenDeTheoId(id, window.currentChuyenDeName);
  document.getElementById("popupChuyenDe").classList.remove("edit-mode");

  console.log(`💾 Đã lưu chuyên đề ID '${id}' (${window.currentChuyenDeName})`);
};



// =====================================================
// ❌ HỦY CHỈNH SỬA
// =====================================================
document.getElementById("btnCancelCD").onclick = () => {
  moPopupChuyenDeTheoId(window.currentChuyenDeId, window.currentChuyenDeName);
  document.getElementById("popupChuyenDe").classList.remove("edit-mode");
};


// =====================================================
// 📄 XEM CHI TIẾT (chưa xử lý sâu, chỉ demo)
// =====================================================
document.getElementById("btnChiTietCD").onclick = () => {
  const ten = window.currentChuyenDe;
  alert("Xem chi tiết chuyên đề: " + ten);
};


// =====================================================
// 🚫 ĐÓNG POPUP CHUYÊN ĐỀ (có cảnh báo nếu chưa lưu)
// =====================================================
let chuyenDeEdited = false;

// 🔹 Đánh dấu đã chỉnh sửa
document.getElementById("noiDungChuyenDe").addEventListener("input", () => {
  if (document.getElementById("noiDungChuyenDe").isContentEditable) {
    chuyenDeEdited = true;
  }
});

// 🔹 Khi lưu → reset cờ
document.getElementById("btnSaveCD").addEventListener("click", () => {
  chuyenDeEdited = false;
});

// 🔹 Khi bấm nút X
document.getElementById("closeChuyenDe").onclick = (e) => {
  e.stopPropagation();
  if (chuyenDeEdited) {
    const ok = confirm("Bạn có thay đổi chưa lưu. Thoát mà không lưu?");
    if (!ok) return;
  }
  chuyenDeEdited = false;
  document.getElementById("popupChuyenDe").style.display = "none";
};


// 🎯 Đóng popup Chuyên Đề bằng phím ESC
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {

    const popup = document.getElementById("popupChuyenDe");
    if (!popup) return;

    // Nếu popup đang mở → đóng
    if (popup.style.display === "flex" || popup.style.display === "") {

      // Nếu đang chỉnh sửa và có thay đổi → cảnh báo
      if (chuyenDeEdited) {
        const ok = confirm("Bạn có thay đổi chưa lưu. Thoát mà không lưu?");
        if (!ok) return;
      }

      chuyenDeEdited = false;
      popup.style.display = "none";
    }
  }
});


// =====================================================
// 🚫 KHÔNG CHO CLICK RA NGOÀI POPUP ĐỂ ĐÓNG
// =====================================================
const popupOverlay = document.getElementById("popupChuyenDe");
const popupContent = popupOverlay.querySelector(".popup-content");

popupOverlay.addEventListener("click", (e) => {
  if (e.target === popupOverlay) {
    e.stopPropagation();
    popupContent.classList.add("shake");
    setTimeout(() => popupContent.classList.remove("shake"), 300);
  }
});

// 🎨 Hiệu ứng rung cảnh báo
const styleShake = document.createElement("style");
styleShake.innerHTML = `
@keyframes shakePopup {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.popup-content.shake {
  animation: shakePopup 0.3s ease;
}`;
document.head.appendChild(styleShake);

// =====================================================
// 🎯 ĐÓNG TẤT CẢ POPUP KHI BẤM ESC
// =====================================================
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;

  // 1️⃣ Popup CHUYÊN ĐỀ
  const popupCD = document.getElementById("popupChuyenDe");
  if (popupCD && popupCD.style.display === "flex") {

    // Nếu có chỉnh sửa chưa lưu → hỏi
    if (window.chuyenDeEdited) {
      const ok = confirm("Bạn có thay đổi chưa lưu. Thoát mà không lưu?");
      if (!ok) return;
    }

    window.chuyenDeEdited = false;
    popupCD.style.display = "none";
    return; // ESC chỉ đóng 1 popup 1 lần
  }

  // 2️⃣ Popup SAO (#saoPopup)
  const popupSao = document.getElementById("saoPopup");
  if (popupSao && popupSao.style.display === "flex") {
    popupSao.style.display = "none";
    return;
  }

  // 3️⃣ Popup CÁCH CỤC (#popupCachCuc)
  const popupCC = document.getElementById("popupCachCuc");
  if (popupCC && popupCC.style.display === "flex") {
    popupCC.style.display = "none";
    return;
  }
});

// =====================================================
// 🔍 CLICK SAO / TUẦN / TRIỆT → TRA CỨU & HIGHLIGHT 5s (mở đúng cấp cha)
// =====================================================
function cleanText(t) {
  return __norm(t).replace(/\s+/g, ""); // ❗ giữ đúng logic: cleanText bỏ HẾT khoảng trắng
}



let highlightTimer = null;

document.addEventListener("click", (e) => {
if (e.target.closest("#bangNhomSaoLuu")) return;

  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

const target = e.target.closest(
  ".layer-1 div, .layer-3 div, .cat-tinh div, .hung-tinh div, .tuan-triet span, .layer-6 .cat-tinh div, .layer-6 .hung-tinh div"
);

console.log("🎯 Click event target:", e.target);
console.log("🎯 Matched closest:", target);


  if (!target) return;




  if (target.closest(".layer-2")) return; // ⛔ Không tra cung

  let rawName = target.textContent.trim();

/* ============================
   📌 XÁC ĐỊNH CUNG CHO SAO
   ============================ */
(() => {
  try {
    const div = target.closest("[id^='cell']");
    if (!div) {
      window.currentCung = null;
      return;
    }

    const id = div.id.replace("cell", "");

const ID_TO_CUNG = {
  1: "Tỵ",
  2: "Ngọ",
  3: "Mùi",
  4: "Thân",

  5: "Thìn",
  6: "Dậu",
  7: "Mão",
  8: "Tuất",

  9: "Dần",
  10: "Sửu",
  11: "Tý",
  12: "Hợi"
};


    window.currentCung = ID_TO_CUNG[id] || null;

    console.log("📌 Sao đang đứng tại:", window.currentCung);

  } catch(e) {
    console.warn("Lỗi xác định cung:", e);
  }
})();






console.log("🟡 rawName =", rawName);

// Tuần / Triệt có dạng "Tuần" hoặc "Triệt – Tuần"
if (rawName.includes("Tuần")) rawName = "Tuần";
if (rawName.includes("Triệt")) rawName = "Triệt";

  if (rawName.includes("–")) rawName = rawName.split("–")[1].trim();
// ✅ Bỏ cả tiền tố N., Nh., L., ĐV., TL.
const saoTen = rawName.replace(/^(Nh\.|N\.|L\.|ĐV\.|TL\.)\s*/i, "").trim();
let cleanSao = cleanText(saoTen);

// Tuần / Triệt → Tuần Không / Triệt Không
if (cleanSao.includes("tuan"))  cleanSao = "tuankhong";
if (cleanSao.includes("triet")) cleanSao = "trietkhong";
// 🟪 Nếu là Tuần/Triệt → lấy 2 cung bị đóng
if (cleanSao === "tuankhong" || cleanSao === "trietkhong") {
  const cap = target.closest(".tuan-triet")?.dataset.cap || ""; // VD: "Tý-Sửu"
  const [c1, c2] = cap.split("-");
  window.currentCung = null; // không 1 cung cố định
  window.blockedCung = [c1, c2]; // lưu mảng 2 cung
} else {
  window.blockedCung = null; // reset khi click sao khác
}

console.log("✅ after mapping =", cleanSao);


  clearTimeout(highlightTimer);

  // 🧹 Xóa sáng cũ
  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

  // 🔍 Tìm phần tử sao trong từ điển
 let found = null;
sidebar.querySelectorAll("[data-sao]").forEach(li => {

  // ❗ Bỏ qua nhóm "Cung"
  const groupTitleEl = li.closest(".group")?.querySelector(".group-title");
  if (groupTitleEl && groupTitleEl.textContent.includes("Cung")) return;

  const ten = cleanText(li.dataset.sao || "");
  if (ten === cleanSao) found = li;
});

if (!found) {
  console.warn("⛔ NOT FOUND in sidebar:", cleanSao);
  return;
}

  // 🔹 Thu gọn toàn bộ danh sách khác, trừ phần 📘 CHUYÊN ĐỀ
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // 🟢 Mở tất cả cấp cha chứa sao đó
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

 // 🌟 Highlight & cuộn tới sao
found.classList.add("highlight-sao");
found.scrollIntoView({ behavior: "smooth", block: "center" });

highlightTimer = setTimeout(() => found.classList.remove("highlight-sao"), 5000);

// ===============================
// 🔄 CHỈ UPDATE POPUP NẾU ĐANG MỞ
// ===============================

const popup = document.getElementById("saoPopup");

if (popup && popup.style.display !== "none") {
  // Popup đang mở → cập nhật
  showStarInfo(saoTen, window.currentCung || null);

  // Tự chuyển sang Tab 2 lại sau click
  setTimeout(() => {
    document.querySelector(`.tab-link[data-tab="tab2"]`)?.click();
  }, 50);
}


});

// =====================================================
// 🟣 CLICK CUNG CHỨC (MỆNH, HUYNH ĐỆ, PHÚC ĐỨC, <THÂN>) → TRA CỨU & MỞ ĐÚNG CẤP CHA
// =====================================================
document.querySelector(".container")?.addEventListener("click", (ev) => {
  const target = ev.target;
  if (!target || !target.textContent) return;
  if (!target.closest(".ten-cung") && !target.closest(".cung-name")) return;

  const text = target.textContent.trim();

  // 🔒 Chỉ bắt khi là chữ IN HOA hoàn toàn hoặc chứa <THÂN>
  const isUpper = /^[A-ZÀ-Ỵ\s<>\.]+$/.test(text);
  const isThan = text.includes("THÂN");
  if (!isUpper && !isThan) return; // ⛔ Không phải cung chức

  // Danh sách 13 cung chức (IN HOA)
  const CUNG_CHUC = [
    "MỆNH","HUYNH ĐỆ","PHU THÊ","TỬ TỨC","TÀI BẠCH","TẬT ÁCH",
    "THIÊN DI","NÔ BỘC","QUAN LỘC","ĐIỀN TRẠCH","PHÚC ĐỨC","PHỤ MẪU","THÂN"
  ];

  // 🧩 Xử lý riêng trường hợp “THÂN” (để không dính MỆNH<THÂN>)
  let foundCung = null;
  if (text === "<THÂN>" || text.includes("(THÂN)")) {
    foundCung = "THÂN";
  } else {
    foundCung = CUNG_CHUC.find(c => text.includes(c));
  }
  if (!foundCung) return;

  // 🟢 Tắt sáng trong lá số
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // 🟢 Tìm và highlight dòng tương ứng trong từ điển
  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

 let found = null;
sidebar.querySelectorAll("li").forEach(li => {
  // 🚫 Bỏ qua nếu mục nằm trong TỪ ĐIỂN SAO hoặc CHUYÊN ĐỀ
  if (li.closest("#tuDienSaoBox") || li.closest("#chuyenDeBox")) return;

  const txt = li.textContent.trim().toUpperCase();
  if (txt.includes(foundCung) || (foundCung === "THÂN" && txt.includes("AN THÂN"))) {
    found = li;
  }
});


  if (!found) return;

  // 🔹 Thu gọn toàn bộ danh sách khác, trừ phần 📘 CHUYÊN ĐỀ
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // 🟢 Mở tất cả cấp cha chứa cung đó
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

  // 🌟 Highlight & scroll
  found.classList.add("highlight-sao");
  found.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => found.classList.remove("highlight-sao"), 5000);

  console.log("📘 Click cung chức:", foundCung);
});


// =====================================================
// 🌿 CLICK VÒNG TRÀNG SINH → TRA CỨU & HIGHLIGHT 5s (mở đúng cấp cha + tự thu gọn)
// =====================================================
document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

  const target = e.target.closest(".layer-8");
  if (!target) return;

  const textEl = target.querySelector(".layer8-div");
  if (!textEl) return;

  const rawName = textEl.textContent.trim();
  if (!rawName) return;

  // 🌿 Làm sạch & bỏ dấu
  const cleanSao = removeDiacritics(cleanText(rawName.toLowerCase()));
  clearTimeout(highlightTimer);

  // 🧹 Xóa highlight cũ
  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

 // 🔍 Tìm trong nhóm có chữ "Tràng Sinh" hoặc "Tiểu Tinh"
let found = null;
sidebar.querySelectorAll(".group").forEach(group => {
  // 🚫 Bỏ qua nếu nhóm nằm trong phần Từ Điển Sao hoặc Chuyên Đề
  if (group.closest("#tuDienSaoBox") || group.closest("#chuyenDeBox")) return;

  const title = (group.querySelector(".group-title")?.textContent || "").toLowerCase();
  if (!title.includes("tràng sinh") && !title.includes("tiểu tinh")) return;


    group.querySelectorAll("[data-sao]").forEach(li => {
      const ten = removeDiacritics(cleanText((li.dataset.sao || li.textContent || "").toLowerCase().trim()));
      if (ten === cleanSao) found = li;
    });
  });

  if (!found) {
    console.log("⛔ Không tìm thấy sao:", rawName);
    return;
  }

  // 🔹 Thu gọn toàn bộ danh sách khác, trừ phần 📘 CHUYÊN ĐỀ
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // 🟢 Mở tất cả cấp cha chứa sao đó
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

  // 🌟 Highlight & scroll
  found.classList.add("highlight-sao");
  found.scrollIntoView({ behavior: "smooth", block: "center" });

  highlightTimer = setTimeout(() => found.classList.remove("highlight-sao"), 5000);

  console.log("🌿 Click vòng Tràng Sinh:", rawName);
});


// =====================================================
// 🔧 HÀM HỖ TRỢ: Bỏ dấu tiếng Việt để so sánh
// =====================================================
function removeDiacritics(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")             // đ → d
    .replace(/Đ/g, "D");            // Đ → D
}





// 🌟 Cho phép dán bảng HTML vào popup mà không mất định dạng
document.addEventListener("paste", function (e) {
  const editable = e.target.closest(".editable, .editable-view");
  if (editable && e.clipboardData) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    editable.insertAdjacentHTML("beforeend", html || text);
  }
});
// 🌙 Đóng popup khi bấm X
const popupCloseBtn = document.getElementById("popupClose");
if (popupCloseBtn) {
  popupCloseBtn.onclick = () => {
    const popup = document.getElementById("saoPopup");
    const isEditing = popup.classList.contains("edit-mode");

    if (isEditing) {
      // Nếu đang chỉnh sửa → hỏi xác nhận lưu
      const confirmClose = confirm("Bạn có muốn lưu thay đổi trước khi đóng không?");
      if (confirmClose) {

        const btnSave = document.getElementById("btnSave");
        if (btnSave) {
          btnSave.click();
        } else {
          console.warn("⚠️ Không tìm thấy nút Lưu (btnSave)");
          popup.classList.remove("edit-mode");
          popup.style.display = "none";
        }

      } else {
        popup.classList.remove("edit-mode");
        popup.style.display = "none";
      }
    } else {
      popup.style.display = "none";
    }
  };
}

// 🌙 Chỉ áp dụng click ra ngoài cho popup SAO
const saoPopupOverlaySafe = document.getElementById("saoPopup");
if (saoPopupOverlaySafe) {
  saoPopupOverlaySafe.addEventListener("click", e => {
    // Chỉ xử lý khi click đúng vào nền mờ (không phải bên trong nội dung)
    if (e.target === saoPopupOverlaySafe) {
      const saoPopup = document.getElementById("saoPopup");
      const isEditing = saoPopup.classList.contains("edit-mode");
      const saoBox = document.querySelector("#saoPopup .popup-content");

      if (isEditing) {
        // 🌟 Nếu đang chỉnh sửa → rung nhẹ, không tắt
        saoBox.classList.add("shake");
        setTimeout(() => saoBox.classList.remove("shake"), 300);
      } else {
        // ✅ Nếu chỉ đang xem → đóng bình thường
        saoPopup.style.display = "none";
      }
    }
  });
}

// 🌟 Áp dụng cho tất cả popup (sao, chuyên đề, từ điển, v.v.)
document.querySelectorAll(".popup-overlay").forEach(popupOverlay => {
  popupOverlay.addEventListener("click", e => {
    // Chỉ khi click đúng vào nền mờ, không phải bên trong popup
    if (e.target === popupOverlay) {
      const popupBox = popupOverlay.querySelector(".popup-content");
      const isEditing = popupOverlay.classList.contains("edit-mode");

      if (isEditing) {
        // 🌸 Rung nhẹ cảnh báo không thể đóng khi đang chỉnh sửa
        popupBox.classList.add("shake");
        setTimeout(() => popupBox.classList.remove("shake"), 300);
      } else {
        // ✅ Nếu đang xem bình thường thì đóng popup
        popupOverlay.style.display = "none";
      }
    }
  });
});

window.capNhatBangCatHung = function(cung, doiCung, hop1, hop2, cungTruoc, cungSau) {
  const wrap = document.getElementById("catHungWrapper");
  const toggleBox = document.getElementById("toggleCatHung");

  if (!toggleBox || !toggleBox.checked) {
  if (wrap) wrap.style.display = "none";
  const cc = document.getElementById("cachCucWrapper");
  if (cc) cc.style.display = "none"; // ✅ ẩn luôn bảng cách cục
  return;
} else {
  const cc = document.getElementById("cachCucWrapper");
  if (cc) cc.style.display = "block"; // ✅ hiện lại khi tick
}


  const cellMap = {
    "Dần":9,"Mão":7,"Thìn":5,"Tỵ":1,"Ngọ":2,"Mùi":3,
    "Thân":4,"Dậu":6,"Tuất":8,"Hợi":12,"Tý":11,"Sửu":10
  };

  const cells = {
    "Chính": document.getElementById("cell" + cellMap[cung]),
    "Đối": document.getElementById("cell" + cellMap[doiCung]),
    "Hợp1": document.getElementById("cell" + cellMap[hop1]),
    "Hợp2": document.getElementById("cell" + cellMap[hop2]),
    "GiápTrước": document.getElementById("cell" + cellMap[cungTruoc]),
    "GiápSau": document.getElementById("cell" + cellMap[cungSau])
  };

  const diemViTri = { "Chính":100, "Đối":70, "Hợp":50, "Giáp":10 };
  const layerChinh = cells.Chính?.querySelector(".layer-3");
  const laVoChinhDieu = !layerChinh || layerChinh.querySelectorAll("div").length === 0;
  if (laVoChinhDieu) {
    diemViTri["Chính"] = 143;
    diemViTri["Đối"] = 100;
  }

  const CAT_TINH = ["Thiên Khôi","Thiên Việt","Tả Phù","Hữu Bật","Văn Xương","Văn Khúc"];
  const HUNG_TINH = ["Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp"];
  const TU_HOA_CAT = ["Hóa Lộc","Hóa Quyền","Hóa Khoa"];
  const TU_HOA_HUNG = ["Hóa Kỵ"];
  const DOI_SAO = [
    ["Kình Dương","Đà La"],["Hỏa Tinh","Linh Tinh"],["Địa Không","Địa Kiếp"],
    ["Văn Xương","Văn Khúc"],["Thiên Khôi","Thiên Việt"],["Tả Phù","Hữu Bật"]
  ];

  function laySao(cell) {
    if (!cell) return [];
    const layer = cell.querySelector(".layer-6");
    if (!layer) return [];
    return Array.from(layer.querySelectorAll(".cat-tinh div, .hung-tinh div"))
      .map(el => el.textContent.trim())
      // 🚫 Bảng định cát hung chỉ xét sao gốc, bỏ toàn bộ sao hạn (ĐV/L/N/Nh/TL)
      .filter(txt => !/^(ĐV\.|L\.|N\.|Nh\.|TL\.)\s*/i.test(txt))
      .filter(Boolean);
  }

  const ds = {};
  for (const [k, c] of Object.entries(cells)) ds[k] = laySao(c);

  const catList = [], hungList = [];
  let tongCat = 0, tongHung = 0;
  const used = new Set();

  function timViTriSao(ds, sao) {
    for (const [v, list] of Object.entries(ds)) {
      if (list.includes(sao)) return v.startsWith("Giáp") ? "Giáp" : v.replace(/[0-9]/g,"");
    }
    return null;
  }

  const viTriTinh = ["Chính","Đối","Hợp1","Hợp2"];

  DOI_SAO.forEach(([s1,s2])=>{
    const v1 = timViTriSao(ds,s1);
    const v2 = timViTriSao(ds,s2);
    if (!v1 || !v2) return;
    if (v1 === "Giáp" || v2 === "Giáp") return;
    if (used.has(s1) || used.has(s2)) return;
    const tong = (diemViTri[v1] + diemViTri[v2]) * 2;
    const tag = (v1===v2) ? `(${v1})` : `(${v1} – ${v2})`;
    const text = `${s1} – ${s2} ${tag} – ${tong}đ`;

    if (CAT_TINH.includes(s1)||CAT_TINH.includes(s2)){ catList.push(text); tongCat+=tong; }
    else if (HUNG_TINH.includes(s1)||HUNG_TINH.includes(s2)){ hungList.push(text); tongHung+=tong; }
    used.add(s1); used.add(s2);
  });

  viTriTinh.forEach(v=>{
    const nhan = v.replace(/[0-9]/g,"");
    ds[v].forEach(sao=>{
      if (used.has(sao)) return;
      const diem = diemViTri[nhan];
      if (CAT_TINH.includes(sao)||TU_HOA_CAT.includes(sao)){
        catList.push(`${sao} (${nhan}) – ${diem}đ`);
        tongCat+=diem;
      } else if (HUNG_TINH.includes(sao)||TU_HOA_HUNG.includes(sao)){
        hungList.push(`${sao} (${nhan}) – ${diem}đ`);
        tongHung+=diem;
      }
    });
  });

  // 🌟 XÉT GIÁP CUNG SAU CÙNG
  const DOI_SAO_GIAP = [
    ["Kình Dương","Đà La"],
    ["Hỏa Tinh","Linh Tinh"],
    ["Địa Không","Địa Kiếp"],
    ["Thiên Khôi","Thiên Việt"],
    ["Văn Xương","Văn Khúc"],
    ["Tả Phù","Hữu Bật"]
  ];

  DOI_SAO_GIAP.forEach(([s1, s2]) => {
    const truoc = ds.GiápTrước.includes(s1) || ds.GiápTrước.includes(s2);
    const sau   = ds.GiápSau.includes(s1)  || ds.GiápSau.includes(s2);
    if (!(truoc && sau)) return; // ❌ không đủ đôi giáp

    const giua = ds.Chính || [];
    const coHung = giua.some(x => ["Hóa Kỵ","Địa Không","Địa Kiếp","Hỏa Tinh","Linh Tinh","Kình Dương","Đà La"].includes(x));
    const coCat  = giua.some(x => ["Thiên Khôi","Thiên Việt","Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Hóa Lộc","Hóa Quyền","Hóa Khoa"].includes(x));

    if (HUNG_TINH.includes(s1) || HUNG_TINH.includes(s2)) {
      const diem = coHung ? 200 : 20;
      hungList.push(`${s1} – ${s2} (Giáp Cung) – ${diem}đ`);
      tongHung += diem;
    } else if (CAT_TINH.includes(s1) || CAT_TINH.includes(s2)) {
      const diem = coCat ? 200 : 20;
      catList.push(`${s1} – ${s2} (Giáp Cung) – ${diem}đ`);
      tongCat += diem;
    }
  });



  // ============================================================
  // 🎯 Bổ sung phần hiển thị tiêu đề + sao phụ + kết luận theo %
  // ============================================================

  // 🪶 Chính tinh tại cung
  const saoChinh = cells.Chính?.querySelector(".layer-3");
  const names = saoChinh
    ? Array.from(saoChinh.querySelectorAll("div")).map(e => e.textContent.trim()).filter(Boolean).join(" / ")
    : "";
  const tenChinhTinh = names || "Vô Chính Diệu";

// 🪶 Kiểm tra Thiên Mã và Lộc Tồn — hiển thị vị trí cụ thể, gộp hai Hợp cung
const viTriTenMap = {
  "Chính": "Chính cung",
  "Đối": "Đối cung",
  "Hợp1": "Hợp cung",
  "Hợp2": "Hợp cung"
};

const saoPhu = [];

for (const [viTri, dsSao] of Object.entries(ds)) {
  if (!Array.isArray(dsSao)) continue;
  if (!viTriTenMap[viTri]) continue; // ✅ chỉ xử lý 4 cung hợp lệ
  if (dsSao.includes("Thiên Mã")) saoPhu.push(`Thiên Mã (${viTriTenMap[viTri]})`);
  if (dsSao.includes("Lộc Tồn")) saoPhu.push(`Lộc Tồn (${viTriTenMap[viTri]})`);
}


// Loại trùng “Hợp cung” nếu xuất hiện cả Hợp1 và Hợp2
const hopLocs = [];
const saoPhuGop = saoPhu.filter(item => {
  if (item.includes("(Hợp cung)")) {
    const key = item.split(" ")[0];
    if (hopLocs.includes(key)) return false;
    hopLocs.push(key);
  }
  return true;
});

let dongSaoPhu = "";
if (saoPhuGop.length > 0) {
  dongSaoPhu = `<div style="font-size:12px; margin:3px 0 2px; color:#444; font-style:italic;">
    Đi kèm các sao: ${saoPhuGop.join(", ")}
  </div>`;
}


  // 🧮 Tính % cát
  const tong = tongCat + tongHung;
  const tyLeCat = tong > 0 ? (tongCat / tong) * 100 : 0;
  const tyLeHung = tong > 0 ? (tongHung / tong) * 100 : 0;

  let ketluan = "";
  if (tyLeCat < 20) ketluan = "Hung";
  else if (tyLeCat < 40) ketluan = "Bán Cát Bán Hung – Thiên Hung";
  else if (tyLeCat < 60) ketluan = "Cát Hung Lẫn Lộn";
  else if (tyLeCat < 80) ketluan = "Bán Cát Bán Hung – Thiên Cát";
  else ketluan = "Cát";

  // ============================================================
  // 🌟 Xuất bảng
  // ============================================================
  wrap.querySelector("#catHungNoiDung").innerHTML = `
    <div style="text-align:center;font-weight:bold;">
      ${tenChinhTinh.toUpperCase()} TẠI ${cung.toUpperCase()}
    </div>
    <table style="margin-top:4px;">
      <tr><th>CÁT TINH</th><th>HUNG TINH</th></tr>
      <tr>
        <td>${catList.join("<br>") || "&nbsp;"}</td>
        <td>${hungList.join("<br>") || "&nbsp;"}</td>
      </tr>
      <tr>
        <td><b>Tổng điểm: ${tongCat} (${tyLeCat.toFixed(0)}%)</b></td>
        <td><b>Tổng điểm: ${tongHung} (${tyLeHung.toFixed(0)}%)</b></td>
      </tr>
    </table>
    ${dongSaoPhu}
    <div style="text-align:center;font-weight:bold;margin-top:4px;background-color:#f3e6b1;">
      🔹 KẾT LUẬN: ${ketluan.toUpperCase()} 🔹
    </div>
  `;



// ======================================================
// 🗺️ BẢN ĐỒ CUNG CHUẨN TOÀN CỤC (layout NGHỊCH)
// ======================================================
window.mapCung = {
  "Dần": 9, "Mão": 7, "Thìn": 5, "Tỵ": 1, "Ngọ": 2, "Mùi": 3,
  "Thân": 4, "Dậu": 6, "Tuất": 8, "Hợi": 12, "Tý": 11, "Sửu": 10
};

// Cho phép gọi ngắn gọn "mapCung" mà không cần window.
const mapCung = window.mapCung;

// ============================================================
// 🧩 CẬP NHẬT DỮ LIỆU THẬT CHO MODULE CÁCH CỤC
// ============================================================
try {
  // 1️⃣ Cập nhật lại dữ liệu toàn bộ lá số thật (gồm trung tinh)
  window.DU_LIEU_LA_SO_THAT = layDuLieuTuLayers();

  // 2️⃣ Xác định id của cung hiện tại
  const idChinh = cellMap[cung];

  // 3️⃣ Gán loại cách (CÁT/HUNG) vào dữ liệu thật
  if (window.DU_LIEU_LA_SO_THAT[idChinh]) {
    window.DU_LIEU_LA_SO_THAT[idChinh].cachLoai = ketluan.toUpperCase();
  }

  // 4️⃣ Gọi kiểm tra Cách Cục nếu có dữ liệu
  if (typeof window.kiemTraCachCuc === "function" && typeof window.capNhatBangCachCuc === "function") {
    const { kq } = kiemTraCachCuc(idChinh, window.DU_LIEU_LA_SO_THAT);

    // Cập nhật hiển thị panel phải (bảng Cách Cục)
    const ccWrap = document.getElementById("cachCucWrapper");
    const ccNoiDung = document.getElementById("cachCucNoiDung");

    if (ccWrap && ccNoiDung) {
      ccWrap.style.display = "block";
      ccNoiDung.innerHTML = kq.length
        ? `<b>${cung}</b>:<br>${kq
            .map(x => `<div class="dong-phan-tich" data-ten="${x}" onclick="window.highlightCachCucTuPhanTich && window.highlightCachCucTuPhanTich(this)">✅ ${x}</div>`)
            .join("")}`
        : `<b>${cung}</b>: <i>Không có cách cục phù hợp.</i>`;

      // Gắn listener trực tiếp để chắc chắn bắt click
      attachDirectClickForCachCuc(ccNoiDung);
    }
  }
} catch (err) {
  console.warn("⚠️ Lỗi cập nhật Cách Cục:", err);
}

// ============================================================
// ✅ Hiển thị bảng Cát Hung sau khi xử lý xong
// ============================================================
wrap.style.display = "block";
};

// ===============================
// 🎯 Click dòng PHÂN TÍCH CÁCH CỤC -> focus & highlight ở danh sách bên trái
// ===============================
function highlightCachCucTuPhanTich(el) {
  // Chặn xem chi tiết khi chưa premium
  if (!(window.isPaidUser && window.isPaidUser())) {
    console.warn("[CC] Chưa premium, bỏ qua highlight");
    return;
  }

  const ten = el.dataset.ten?.trim().toLowerCase();
  if (!ten) return;

  // Đảm bảo danh sách bên trái đã render
  if (typeof renderCachCucList === "function") renderCachCucList(false);

  // Tìm danh sách các Cách Cục bên trái
  const list = document.querySelectorAll("#listCachCuc .cc-left b");
  let foundItem = null;

  list.forEach(item => {
    const t = item.textContent.trim().toLowerCase();
    if (t === ten) foundItem = item.closest(".cc-left");
  });

  if (!foundItem) {
    console.warn("❗Không tìm thấy Cách Cục tương ứng:", ten);
    return;
  }

  // Cuộn đến dòng đó trong danh sách bên trái
  foundItem.scrollIntoView({ behavior: "smooth", block: "center" });

  // Highlight dòng đó 5 giây
  foundItem.classList.add("highlight-cachcuc");
  setTimeout(() => foundItem.classList.remove("highlight-cachcuc"), 5000);
}
// Cho phép gọi inline
window.highlightCachCucTuPhanTich = highlightCachCucTuPhanTich;

function bindHighlightDelegates() {
  const targets = [
    document.getElementById("catHungWrapper"),
    document.getElementById("cachCucWrapper"),
    document.getElementById("cachCucNoiDung")
  ].filter(Boolean);

  targets.forEach(t => {
    // Tránh gắn trùng: xoá trước nếu đã có
    t.removeEventListener("click", handleDongPhanTichClick, true);
    t.removeEventListener("click", handleDongPhanTichClick, false);
    t.addEventListener("click", handleDongPhanTichClick, true);
    t.addEventListener("click", handleDongPhanTichClick, false);
  });

  if (targets.length) {
    console.log("[CC] Đã gắn delegate highlight trên", targets.map(el => "#" + (el.id || el.className)).join(", "));
  }
}

// Gắn click trực tiếp cho các dòng vừa render
function attachDirectClickForCachCuc(container) {
  if (!container) return;
  container.querySelectorAll(".dong-phan-tich").forEach(el => {
    el.onclick = (ev) => {
      console.log("[CC] Click trực tiếp dòng phân tích:", el.dataset.ten);
      highlightCachCucTuPhanTich(ev.currentTarget);
    };
  });
}

// Bắt click trên dòng phân tích (nhiều lớp để chắc chắn không bị chặn)
const handleDongPhanTichClick = (e) => {
  const dong = e.target.closest(".dong-phan-tich");
  if (!dong) {
    // Debug thêm: log click trong vùng catHung
    if (e.currentTarget && (e.currentTarget.id === "catHungWrapper" || e.currentTarget.id === "cachCucNoiDung")) {
      console.log("[CC] Click nhưng không thấy .dong-phan-tich, target=", e.target.className || e.target.tagName, "text=", (e.target.textContent || "").trim());
    }
    return false;
  }
  console.log("[CC] Highlight từ bảng phân tích:", dong.dataset.ten);
  highlightCachCucTuPhanTich(dong);
  return true;
};
// Capture & bubble
document.addEventListener("click", handleDongPhanTichClick, true);
document.addEventListener("click", handleDongPhanTichClick, false);
// Fallback cho một số trình duyệt / khi click bị stopPropagation sớm
document.addEventListener("pointerdown", (e) => {
  if (handleDongPhanTichClick(e)) {
    e.preventDefault();
  }
}, true);

// Gắn trực tiếp vào khung phân tích nếu có
document.addEventListener("DOMContentLoaded", () => {
  bindHighlightDelegates();
  // Gắn click trực tiếp cho các dòng (phòng khi render trước đó)
  attachDirectClickForCachCuc(document.getElementById("cachCucNoiDung"));

  // CSS nhỏ cho dòng bị khóa
  const styleId = "cachcuc-lock-style";
  if (!document.getElementById(styleId)) {
    const st = document.createElement("style");
    st.id = styleId;
    st.textContent = `
      .dong-phan-tich.locked-premium {
        color: #5a189a;
        background: rgba(90,24,154,0.1);
        border-radius: 4px;
        padding: 2px 6px;
        opacity: 0.85;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(st);
  }

  // Khóa tra ngược theo trạng thái hiện tại
  toggleTraNguocLock(window.isPaidUser && window.isPaidUser());
  // Khóa sửa/xóa cách cục theo trạng thái hiện tại
  toggleCachCucEditLock(window.isPaidUser && window.isPaidUser());
  // Khóa thao tác chuyên đề theo trạng thái hiện tại
  toggleChuyenDeEditLock(window.isPaidUser && window.isPaidUser());

  // Cố định panel auth theo cạnh phải của vùng lá số (không di chuyển khi cuộn)
  const positionAuthPanel = () => {
    const panel = document.getElementById("authPanel");
    const container = document.querySelector(".container");
    if (!panel || !container) return;

    // container tương đối, panel tuyệt đối bám vào phải
    container.style.position = "relative";
    panel.style.position = "absolute";
    panel.style.right = "0";
    panel.style.top = "67px";
  };
  positionAuthPanel();
  window.addEventListener("resize", positionAuthPanel);
});

// 🌟 Giúp #catHungWrapper bám theo khung Lá Số, nằm bên phải
document.addEventListener("DOMContentLoaded", () => {
  const laso = document.getElementById("lasoContainer");
  const catHung = document.getElementById("catHungWrapper");
  if (!laso || !catHung) return;

  function capNhatViTriBang() {
    const rect = laso.getBoundingClientRect();
    catHung.style.position = "fixed";

    // ✅ Canh bên phải khung Lá Số
    catHung.style.top = rect.top - 0 + "px";   // 🔼 nâng bảng lên ngang tiêu đề
catHung.style.left = rect.right + 10 + "px";

  }

  // Cập nhật khi cuộn, resize hoặc khi bật bảng
  window.addEventListener("scroll", capNhatViTriBang);
  window.addEventListener("resize", capNhatViTriBang);
  const observer = new MutationObserver(capNhatViTriBang);
  observer.observe(document.body, { attributes: true, childList: true, subtree: true });

  capNhatViTriBang();
});

document.addEventListener("DOMContentLoaded", () => {
  const laso = document.getElementById("lasoContainer");
  const wrap = document.getElementById("catHungWrapper");
  const checkbox = document.getElementById("toggleCatHung");
  if (!laso || !wrap || !checkbox) return;

  // 🌟 Cập nhật vị trí bảng bám theo lá số
  function capNhatViTriBang() {
    const rect = laso.getBoundingClientRect();
    wrap.style.position = "fixed";
    wrap.style.top = rect.top + "px";
    wrap.style.left = rect.right + 20 + "px";
  }
  window.addEventListener("scroll", capNhatViTriBang);
  window.addEventListener("resize", capNhatViTriBang);
  capNhatViTriBang();

  // 🌟 Ẩn bảng khi bỏ tick
  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) {
      wrap.style.display = "none";
      wrap.querySelector("#catHungNoiDung").innerHTML = "";
    }
  });

  // 🌟 Ghi đè trực tiếp vào hàm chính để kiểm tra tick
  const goc = window.capNhatBangCatHung;
  window.capNhatBangCatHung = function (...args) {
    if (!checkbox.checked) {
      wrap.style.display = "none"; // ẩn nếu chưa tick
      return;
    }
    if (typeof goc === "function") {
      goc.apply(this, args);
      wrap.style.display = "block"; // hiện nếu tick + click cung
    }
  };
  if (typeof renderCachCucList === "function") renderCachCucList();
console.log("✅ renderCachCucList() đã chạy");

});

// 🌟 Ẩn toàn bộ sao Tiểu Tinh ngay khi tải trang
document.addEventListener("DOMContentLoaded", () => {
  const allTieuTinh = document.querySelectorAll(".tieutinh");
  allTieuTinh.forEach(el => {
    el.classList.add("hidden");
    el.style.display = "none";
  });

  // Đồng thời bỏ trạng thái "active" của tất cả nút nếu có
  const allButtons = document.querySelectorAll(".nut-tieutinh");
  allButtons.forEach(btn => btn.classList.remove("active"));
});

// 🌟 Tự động ẩn Tiểu Tinh sau khi an lá số xong (nếu nút chưa bật)
document.addEventListener("DOMContentLoaded", () => {
  // Theo dõi DOM để phát hiện khi lá số mới được an ra
  const observer = new MutationObserver(() => {
    // Kiểm tra nếu các nút tiểu tinh tồn tại
    const btns = document.querySelectorAll(".nut-tieutinh");
    if (btns.length > 0) {
      const hasActive = [...btns].some(b => b.classList.contains("active"));
      if (!hasActive) {
        // Nếu chưa bật nhóm nào → ẩn toàn bộ sao Tiểu Tinh
        document.querySelectorAll(".tieutinh").forEach(el => {
          el.classList.add("hidden");
          el.style.display = "none";
        });
      }
    }
  });

  // Theo dõi thay đổi trong toàn bộ body (vì lá số được render lại động)
  observer.observe(document.body, { childList: true, subtree: true });
});
function debugSaoTrongCung(cungID) {
  const cell = document.getElementById("cell" + cungID);
  if (!cell) return console.log("❌ Không tìm thấy cell", cungID);
  const layer = cell.querySelector(".layer-6");
  if (!layer) return console.log("❌ Không có layer-6 trong cell", cungID);

  console.log("🔍 Nội dung thật của cell" + cungID + ":");
  layer.querySelectorAll(".hung-tinh div, .cat-tinh div").forEach((el,i)=>{
    console.log(i+1, JSON.stringify(el.textContent));
  });
}

// =====================================================
// 🚫 NGĂN CLICK VÀO PHẦN TRỐNG TRONG LAYER-6
// =====================================================
document.querySelectorAll(".layer-6").forEach(layer => {
  layer.addEventListener("click", e => {
    // Nếu click vào chính layer (vùng trống) chứ không phải phần tử con (sao)
    if (e.target === layer) {
      e.stopPropagation();   // chặn lan sự kiện lên cung
      e.preventDefault();    // không kích hoạt tra cứu
      return false;
    }
  });
});
// 📘 Khi tra cứu sao → tự mở đúng phần chứa sao đó, chỉ thu gọn phần TỪ ĐIỂN SAO
window.moPhanTuDienTheoSao = function(tenSao) {
  const clean = __norm(tenSao).replace(/\s+/g, "");

  // 🔹 Xác định vùng từ điển sao (chỉ phần I–VII)
  const tuDienBox = document.getElementById("tuDienSao");
  if (tuDienBox) {
    // ✅ Ẩn các <ul> chỉ bên trong vùng #tuDienSao (không lan xuống #chuyenDeBox)
    const PHAN_TU_DIEN_CAN_THU = [
      "I. Chính Tinh",
      "II. Trung Tinh",
      "III. Tứ Hóa",
      "IV. Lộc – Mã",
      "V. Tiểu Tinh",
      "VI. Cung",
      "VII. Tuần – Triệt"
    ];

    // Duyệt các tiêu đề <h3>, <h4> bên trong #tuDienSao
    const headers = tuDienBox.querySelectorAll("h3, h4");
    headers.forEach(h => {
      const title = h.textContent.trim();
      if (PHAN_TU_DIEN_CAN_THU.some(p => title.startsWith(p))) {
        const next = h.nextElementSibling;
        if (next && next.tagName === "UL") {
          next.style.display = "none"; // ẩn phần đó
        }
      }
    });
  }

  // 🔍 Tìm danh sách chứa sao
 let foundUl = null;
document.querySelectorAll("#tuDienSao ul").forEach(ul => {
  const txt = __norm(ul.textContent).replace(/\s+/g, ""); // bỏ hết khoảng trắng
  if (txt.includes(clean)) foundUl = ul;
});


  if (foundUl) {
    foundUl.style.display = "block";

    // 📍 Cuộn tới đúng sao cần tra
   const item = Array.from(foundUl.querySelectorAll("li")).find(li =>
  __norm(li.textContent).replace(/\s+/g, "").includes(clean)
);

    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "center" });
      item.style.background = "#fffae6";
      setTimeout(() => (item.style.background = ""), 1500);
    }
  }
};

// =====================================================
// 📥 NẠP DỮ LIỆU BACKUP VÀO INDEXEDDB
// =====================================================
function importBackupFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data !== "object")
          throw new Error("File không hợp lệ!");

        const req = indexedDB.open("TuViDB", 1);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("jsonStore"))
            db.createObjectStore("jsonStore");
        };
        req.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction("jsonStore", "readwrite");
          const store = tx.objectStore("jsonStore");

          Object.entries(data).forEach(([k, v]) =>
            store.put(v, k)
          );

          tx.oncomplete = () => {
            alert("✅ Đã nạp dữ liệu vào IndexedDB thành công!");
            location.reload();
          };
        };
      } catch (err) {
        console.error("⚠️ Lỗi đọc backup:", err);
        alert("⚠️ File JSON không hợp lệ hoặc bị hỏng!");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// =====================================================
// 💾 LƯU BACKUP INDEXEDDB RA FILE
// =====================================================
function exportBackupIndexedDB() {
  const req = indexedDB.open("TuViDB", 1);
  req.onsuccess = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      alert("⚠️ Chưa có dữ liệu để xuất!");
      return;
    }

    const tx = db.transaction("jsonStore", "readonly");
    const store = tx.objectStore("jsonStore");
    const getAll = store.getAll();
    const getKeys = store.getAllKeys();

    getAll.onsuccess = () => {
      getKeys.onsuccess = () => {
        const keys = getKeys.result;
        const result = {};
        keys.forEach((k, i) => (result[k] = getAll.result[i]));

        const blob = new Blob(
          [JSON.stringify(result, null, 2)],
          { type: "application/json" }
        );
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "TuVi_Backup_IndexedDB.json";
        a.click();
        URL.revokeObjectURL(a.href);
        alert("✅ Đã xuất backup IndexedDB thành công!");
      };
    };
  };
  req.onerror = e => alert("⚠️ Không thể đọc IndexedDB!");
}

// =====================================================
// 🧩 TẠO 2 NÚT GÓC PHẢI TRÊN (📂 & 💾)
// =====================================================
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("jsonButtonGroup")) return;

  const group = document.createElement("div");
  group.id = "jsonButtonGroup";
  Object.assign(group.style, {
    position: "fixed",
    top: "10px",
    right: "10px",
    display: "flex",
    gap: "8px",
    opacity: "0.5",
    zIndex: "99999",
    transition: "opacity 0.3s",
  });
  group.onmouseenter = () => (group.style.opacity = "1");
  group.onmouseleave = () => (group.style.opacity = "0.5");

  // 📂 Nút Nạp
  const btnLoad = document.createElement("button");
  btnLoad.textContent = "📂";
  btnLoad.title = "Nạp backup JSON vào IndexedDB";
  btnLoad.onclick = importBackupFile;

  // 💾 Nút Lưu
  const btnSave = document.createElement("button");
  btnSave.textContent = "💾";
  btnSave.title = "Lưu toàn bộ IndexedDB ra file backup";
  btnSave.onclick = exportBackupIndexedDB;

  [btnLoad, btnSave].forEach(btn => {
    Object.assign(btn.style, {
      fontSize: "18px",
      padding: "2px 6px",
      borderRadius: "6px",
      border: "1px solid #999",
      background: "#fff",
      cursor: "pointer",
    });
  });

  group.appendChild(btnSave);
  group.appendChild(btnLoad);
  document.body.appendChild(group);
});

// =======================================================
// 💾 HÀM LƯU / NẠP DỮ LIỆU BẰNG IndexedDB (dung lượng lớn, an toàn)
// =======================================================
function saveToIndexedDB(key, value) {
  const req = indexedDB.open("TuViDB", 1);

  // 🔹 Nếu CSDL chưa có → tạo object store
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("🆕 Đã tạo object store 'jsonStore' trong TuViDB");
    }
  };

  req.onsuccess = e => {
    const db = e.target.result;
    // ✅ Đảm bảo có store trước khi ghi
    if (!db.objectStoreNames.contains("jsonStore")) {
      console.warn("⚠️ Chưa có store 'jsonStore', đang tạo lại...");
      const ver = db.version + 1;
      db.close();
      const reopen = indexedDB.open("TuViDB", ver);
      reopen.onupgradeneeded = ev => {
        ev.target.result.createObjectStore("jsonStore");
      };
      reopen.onsuccess = ev => {
        const db2 = ev.target.result;
        const tx2 = db2.transaction("jsonStore", "readwrite");
        tx2.objectStore("jsonStore").put(value, key);
        console.log(`💾 Lưu lại '${key}' sau khi tạo store.`);
      };
      return;
    }
    // 🧠 Ghi dữ liệu nếu store đã có
    const tx = db.transaction("jsonStore", "readwrite");
    tx.objectStore("jsonStore").put(value, key);
    console.log(`💾 Đã lưu dữ liệu '${key}' vào IndexedDB.`);
  };

  req.onerror = e => console.warn("⚠️ Lỗi IndexedDB:", e);
}

// =======================================================
// 🗄️ SHIM localStorage → chỉ lưu IndexedDB (di chuyển dữ liệu cũ sang)
// =======================================================
(function initLocalStorageShim() {
  const LS = window.localStorage;
  const REAL_KEY_FN = LS.key ? LS.key.bind(LS) : null;
  const CACHE_KEY = "__LOCAL_STORAGE_CACHE__";
  let CACHE = {};

  const persist = () => saveToIndexedDB(CACHE_KEY, JSON.stringify(CACHE));

  // Nạp cache từ IndexedDB, nếu trống thì import một lần từ localStorage cũ rồi xóa
  loadFromIndexedDB(CACHE_KEY, data => {
    try { CACHE = data ? JSON.parse(data) : {}; } catch { CACHE = {}; }

    // Import dữ liệu cũ từ localStorage (nếu có), rồi dọn sạch để ngăn ghi mới
    try {
      Object.keys(LS).forEach(k => {
        if (!CACHE.hasOwnProperty(k)) CACHE[k] = LS.getItem(k);
      });
      if (LS.clear) LS.clear();
    } catch (e) {
      console.warn("⚠️ Không dọn được localStorage gốc:", e);
    }

    // Ghi lại cache vào IndexedDB sau import
    persist();

    // Ghi đè các method để chỉ thao tác trên CACHE + IndexedDB
    LS.getItem = key => (CACHE.hasOwnProperty(key) ? CACHE[key] : null);
    LS.setItem = (key, val) => { CACHE[key] = String(val); persist(); };
    LS.removeItem = key => { delete CACHE[key]; persist(); };
    LS.clear = () => { CACHE = {}; persist(); };
    LS.key = n => Object.keys(CACHE)[n] || null;
    try {
      Object.defineProperty(LS, "length", {
        get() { return Object.keys(CACHE).length; },
        configurable: true
      });
    } catch {}

    window.__LOCAL_STORAGE_CACHE__ = CACHE;
  });
})();

function loadFromIndexedDB(key, callback) {
  const req = indexedDB.open("TuViDB", 1);

  // 🔹 Đảm bảo tạo store nếu chưa có
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("🆕 Tạo store 'jsonStore' (lần đầu load)");
    }
  };

  req.onsuccess = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      console.warn("⚠️ Không tìm thấy store 'jsonStore', trả về rỗng.");
      callback(null);
      return;
    }
    const tx = db.transaction("jsonStore", "readonly");
    const store = tx.objectStore("jsonStore");
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      console.log(`📦 Load '${key}' từ IndexedDB`, getReq.result ? "(✔️ có dữ liệu)" : "(❌ trống)");
      callback(getReq.result);
    };
    getReq.onerror = () => {
      console.warn(`⚠️ Không đọc được '${key}' từ IndexedDB.`);
      callback(null);
    };
  };

  req.onerror = e => console.warn("⚠️ Lỗi IndexedDB:", e);
}

// =====================================================
// 📤 HÀM XUẤT DỮ LIỆU JSON (CHO NÚT 💾) – ĐỌC TỪ INDEXEDDB
// =====================================================
function exportData() {
  try {
const exportKeys = ["SAO_DATA", "CHUYEN_DE_DATA", "CHUYEN_DE_CAY", "CACH_CUC_DATA"];
    const result = {};

    // Hàm phụ: đọc tuần tự từng key trong IndexedDB
    const readNext = (index = 0) => {
      if (index >= exportKeys.length) {
        // ✅ Khi đọc xong hết → tạo file JSON
        const blob = new Blob([JSON.stringify(result, null, 2)], {
          type: "application/json"
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "TuVi_FullBackup.json";
        a.click();
        URL.revokeObjectURL(a.href);
        console.log("✅ Đã xuất toàn bộ dữ liệu từ IndexedDB ra file JSON.");
        return;
      }

      const key = exportKeys[index];
      loadFromIndexedDB(key, data => {
        if (data) {
          try {
            result[key] = JSON.parse(data);
          } catch {
            result[key] = data;
          }
        } else {
        }
        readNext(index + 1);
      });
    };

    // Bắt đầu đọc tuần tự từng mục
    readNext();
  } catch (err) {
    console.error("⚠️ Lỗi exportData:", err);
  }
}
/* ==========================================================
   🎨 ÉP MÀU SÁNG CHO TOÀN BỘ SAO SAU KHI AN SAO (bản tối ưu)
   ========================================================== */
function epMauSaoSang() {
  const mauHanh = {
    "sao-hỏa":  "#ff4d4d",   // 🔥 Hỏa – đỏ tươi sáng, rõ nét
    "sao-thổ":  "#e69500",   // 🟠 Thổ – cam đất đậm, không gắt
    "sao-mộc":  "#007a29",   // 🌿 Mộc – xanh lá đậm rõ chữ
    "sao-kim":  "#000000",   // ⚫ Kim – đen thuần, không bạc màu
    "sao-thủy": "#004cff"    // 💧 Thủy – xanh dương đậm sáng
  };

  Object.entries(mauHanh).forEach(([cls, color]) => {
    document.querySelectorAll(`.${cls}`).forEach(el => {
      el.style.setProperty("color", color, "important");
    });
  });
}

/* 🪶 Tự kích hoạt sau khi các sao được an xong */
document.addEventListener("DOMContentLoaded", () => {
  const target = document.getElementById("lasoContainer");
  if (!target) return;

  const observer = new MutationObserver(() => {
    epMauSaoSang();
  });
  observer.observe(target, { childList: true, subtree: true });
});


// =====================================================
// 🔍 TÌM NODE THEO ID (trả cả parentData và key)
// =====================================================
function findNodeByIdWithParent(data, id, parent = null) {
  for (const key in data) {
    const node = data[key];
    if (node.id === id) {
      return { key, parentData: data, node };
    }
    const found = findNodeByIdWithParent(node.children || {}, id, data);
    if (found) return found;
  }
  return null;
}

function themMucConTheoId(id) {
  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  console.log("📍 Tìm node cha theo id =", id, "→", found);

  if (!found) return alert("Không tìm thấy chuyên đề cha!");
  const { node } = found;
  const name = prompt("Nhập tên mục con mới:");
  if (!name) return;

  if (!node.children) node.children = {};
  node.children[name] = { id: generateId(), noiDung: "", children: {} };
  luuChuyenDe();
  renderChuyenDe(false);
  console.log("✅ Đã thêm mục con", name, "vào node", node);
}


// ❌ Xóa theo id
function xoaMucTheoId(id) {
  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) return alert("Không tìm thấy mục cần xóa");
  const { key, parentData } = found;
  delete parentData[key];
  luuChuyenDe();
  renderChuyenDe(false);
  if (typeof saveNewOrder === "function") saveNewOrder();
}
// =====================================================
// 📘 HÀM MỞ POPUP CHUYÊN ĐỀ THEO ID (phiên bản theo cấu trúc mới có id)
// =====================================================
window.moPopupChuyenDeTheoId = function (id, tenHienThi = "") {
  // 🚧 Chặn người chưa premium mở popup chuyên đề
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block moPopupChuyenDeTheoId vì user chưa premium");
    return;
  }

  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) {
    alert("Không tìm thấy chuyên đề có ID này!");
    return;
  }

  const { node } = found;
  window.currentChuyenDeId = id;
  window.currentChuyenDeName = tenHienThi;

  document.getElementById("tenChuyenDe").innerText = tenHienThi || "(Không có tên)";
  document.getElementById("noiDungChuyenDe").innerHTML =
    node.noiDung || "<i style='color:#777;'>Chưa có nội dung.</i>";

  // Chế độ xem
  document.getElementById("toolbarChuyenDe").style.display = "none";
  document.getElementById("btnEditCD").style.display = "";
  document.getElementById("btnChiTietCD").style.display = "";
  document.getElementById("btnSaveCD").style.display = "none";
  document.getElementById("btnCancelCD").style.display = "none";

  document.getElementById("noiDungChuyenDe").setAttribute("contenteditable", "false");
  document.getElementById("popupChuyenDe").style.display = "flex";
};

/* ======================================================
   📘 LOGIC CÁCH CỤC
   ====================================================== */
let CACH_CUC_DATA = [];
let resolveCachCucReady;
const CACH_CUC_READY = new Promise(res => (resolveCachCucReady = res));

function syncCachCucStore() {
  const json = JSON.stringify(CACH_CUC_DATA);
  saveToIndexedDB("CACH_CUC_DATA", json);
  window.CACH_CUC_DATA = CACH_CUC_DATA;
}

function markCachCucReady() {
  if (resolveCachCucReady) {
    resolveCachCucReady();
    resolveCachCucReady = null;
  }
}

// 🔄 Nạp từ file DATA.json nếu DB trống (CACH_CUC_DATA được lưu dạng string JSON)
async function loadCachCucFromFile() {
  try {
    console.log("ℹ️ Thử nạp CACH_CUC_DATA từ DATA.json ...");
    const resp = await fetch("./DATA.json", { cache: "no-cache" });
    if (!resp.ok) {
      console.warn("⚠️ Không đọc được DATA.json, status:", resp.status);
      return;
    }
    const text = await resp.text();
    console.log("ℹ️ DATA.json bytes:", text.length);
    let root;
    try {
      root = JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ Parse DATA.json lỗi:", e);
      return;
    }
    let arr = [];
    if (Array.isArray(root)) {
      arr = root;
    } else if (root && root.CACH_CUC_DATA) {
      try {
        const raw = root.CACH_CUC_DATA;
        arr = Array.isArray(raw) ? raw : JSON.parse(raw);
      } catch (e) {
        console.warn("⚠️ Không parse được CACH_CUC_DATA trong file:", e);
      }
    }
    if (Array.isArray(arr) && arr.length) {
      CACH_CUC_DATA = arr;
      window.CACH_CUC_DATA = arr;
      syncCachCucStore();
      if (typeof renderCachCucList === "function") renderCachCucList();
      console.log("✅ Đã nạp CACH_CUC_DATA từ DATA.json:", arr.length);
      markCachCucReady();
      return;
    }
    console.warn("⚠️ DATA.json không chứa CACH_CUC_DATA hợp lệ hoặc rỗng");
  } catch (e) {
    console.warn("⚠️ Lỗi nạp CACH_CUC_DATA từ file:", e);
  }
}

// 🔄 Nạp CACH_CUC_DATA từ IndexedDB (fallback localStorage)
loadFromIndexedDB("CACH_CUC_DATA", data => {
  try {
    const fromDB = data ? JSON.parse(data) : null;
    CACH_CUC_DATA = Array.isArray(fromDB) ? fromDB : [];
  } catch (e) {
    console.warn("⚠️ Không parse được CACH_CUC_DATA, dùng localStorage:", e);
    CACH_CUC_DATA = [];
  }
  if (!CACH_CUC_DATA.length) {
    const ls = localStorage.getItem("CACH_CUC_DATA");
    if (ls) {
      try {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed)) CACH_CUC_DATA = parsed;
        else if (typeof parsed === "string") {
          const arr = JSON.parse(parsed);
          if (Array.isArray(arr)) CACH_CUC_DATA = arr;
        }
      } catch (_) {}
    }
  }
  window.CACH_CUC_DATA = CACH_CUC_DATA;
  if (CACH_CUC_DATA.length) {
    markCachCucReady();
    if (typeof renderCachCucList === "function") renderCachCucList();
  } else {
    // DB trống -> thử nạp từ file DATA.json
    console.warn("⚠️ CACH_CUC_DATA trống, thử nạp từ DATA.json");
    loadCachCucFromFile().then(() => {
      if (!CACH_CUC_DATA.length) {
        console.warn("⚠️ Không nạp được CACH_CUC_DATA từ file.");
        markCachCucReady();
      }
    });
  }
});

// Theo dõi khi CACH_CUC_READY resolve để debug
CACH_CUC_READY.then(() => {
  console.log("ℹ️ CACH_CUC_READY resolved, length:", (window.CACH_CUC_DATA || []).length);
});

// Cho phép gọi thủ công trong console
window.debugLoadCachCuc = loadCachCucFromFile;

// ✅ Tiện ích: nạp Cách Cục từ JSON thủ công (dùng trong Console)
window.restoreCachCucData = function (json) {
  try {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!Array.isArray(data)) throw new Error("Cần mảng Cách Cục");
    CACH_CUC_DATA = data;
    window.CACH_CUC_DATA = data;
    syncCachCucStore();
    if (typeof renderCachCucList === "function") renderCachCucList();
    console.log("✅ Đã nạp CACH_CUC_DATA thủ công:", data.length, "bản ghi");
    markCachCucReady();
  } catch (e) {
    console.error("❌ Không nạp được CACH_CUC_DATA:", e.message || e);
  }
};

// 🔁 Đảm bảo lần load đầu luôn có dữ liệu (fallback nếu IndexedDB/localStorage đều trống)
window.addEventListener("load", () => {
  if (!CACH_CUC_DATA.length) {
    loadCachCucFromFile();
  }
});

function renderCachCucList(){
  const div = document.getElementById('listCachCuc');
  if(!div) return;

  div.innerHTML = '';

  if(!CACH_CUC_DATA.length){
    div.innerHTML = '<i style="color:#777;">Chưa có cách cục nào.</i>';
    return;
  }

  CACH_CUC_DATA.forEach((cc, i) => {
    const item = document.createElement('div');
    item.className = 'itemCC';
    item.style.cssText = `
      display:flex;justify-content:space-between;align-items:center;
      background:#f5edff;border:1px solid #ddd;border-radius:6px;position:relative;
      padding:6px 10px;margin:4px 0;transition:0.2s;
    `;
    item.innerHTML = `
  <div class="cc-left" data-index="${i}" style="cursor:pointer;">
    <b>${cc.ten}</b>
    <small style="color:#555;">(${cc.dieuKien.length} điều kiện)</small>
  </div>
<div class="cc-actions" style="display:flex;align-items:center;gap:3px;margin-left:4px;">
    <button class="edit-cc" data-index="${i}" title="Sửa" 
  style="background:none;border:none;color:#7a1ea1;cursor:pointer;font-size:14px;padding:0 2px;">✏️</button>

<button class="delete-cc" data-index="${i}" title="Xóa" 
  style="background:none;border:none;color:#b50000;cursor:pointer;font-size:14px;padding:0 2px;">🗑️</button>

`;

    // overlay khóa cho từng item nếu chưa premium
    const locked = !(window.isPaidUser && window.isPaidUser());
    if (locked) {
      const ov = document.createElement("div");
      ov.className = "cc-item-overlay";
      Object.assign(ov.style, {
        position: "absolute",
        inset: "0",
        background: "rgba(90,24,154,0.08)",
        borderRadius: "6px",
        cursor: "not-allowed"
      });
      item.appendChild(ov);
    }

    div.appendChild(item);
  });

  // Áp lại khóa/overlay sau khi render
  if (typeof toggleCachCucEditLock === "function") {
    toggleCachCucEditLock(window.isPaidUser && window.isPaidUser());
  }
}

document.addEventListener("DOMContentLoaded", renderCachCucList);

function taoUIChoDieuKien(bien, giaTri, container) {
  const dk = document.createElement("div");
  dk.className = "dk-item";
  dk.style.cssText = `
    border:1px solid #ddd;border-radius:6px;padding:8px;margin:6px 0;
    background:#faf5ff;display:flex;flex-direction:column;gap:6px;
  `;

  dk.innerHTML = `
    <label style="font-weight:600;">Biến:</label>
    <select class="bien" style="padding:4px 6px;border:1px solid #ccc;border-radius:4px;">
      <option value="">-- Chọn Biến --</option>
      <option value="cungVi">Cung Vị</option>
      <option value="cungChuc">Cung Chức</option>
      <option value="chinhTinh_ChinhCung">Chính Tinh (Chính Cung)</option>
      <option value="trungTinh_ChinhCung">Trung Tinh (Chính Cung)</option>
      <option value="chinhTinh_TamHop">Chính Tinh (Tam Hợp)</option>
      <option value="trungTinh_TamHop">Trung Tinh (Tam Hợp)</option>
      <option value="giapCung_ChinhTinh">Giáp Cung (Chính Tinh)</option>
      <option value="giapCung_TrungTinh">Giáp Cung (Trung Tinh)</option>
      <option value="giapCung_KetHop">Giáp Cung (Kết Hợp)</option>
      <option value="thuocCach">Thuộc Cách</option>
    </select>

    <div class="giaTriBox"></div>
  `;

  const selectBien = dk.querySelector(".bien");
  const box = dk.querySelector(".giaTriBox");

  selectBien.value = bien;

// TẠO UI dựa trên biến
renderGiaTriTheoBien(selectBien, box, giaTri);


  // ==========================
  // 🔥 CUNG CHỨC OR
  // ==========================
  if (bien === "cungChuc") {
    box.innerHTML = "";
    const ds = [
      "Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách",
      "Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu"
    ];
    giaTri.forEach(v => {
      const s = document.createElement("select");
      s.className = "giaTri";
      s.style = "padding:5px;border:1px solid #ccc;border-radius:4px;margin:4px 0;";
      ds.forEach(x => { const o=document.createElement("option"); o.textContent=x; s.appendChild(o); });
      s.value = v;
      box.appendChild(s);
    });
    return container.appendChild(dk);
  }

  // ==========================
  // 🔥 CHÍNH TINH nhóm AND/OR
  // ==========================
  if (bien === "chinhTinh_ChinhCung" || bien === "chinhTinh_TamHop") {

    const ds = [
      "Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
      "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
      "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng"
    ];

    box.innerHTML = "";
    box.style.gap = "12px";

    giaTri.forEach(nhom => {
      const g = document.createElement("div");
      g.className = "chinhTinhGroup";
      g.style.cssText = `
        border:1px solid #ccc;border-radius:6px;padding:8px;background:#f4ecff;
        display:flex;flex-direction:column;gap:6px;
      `;

      const title = document.createElement("b");
      title.textContent = "Nhóm Chính Tinh (AND trong nhóm):";
      g.appendChild(title);

      const saoBox = document.createElement("div");
      saoBox.className = "saoBox";
      saoBox.style.cssText = "display:flex;flex-direction:column;gap:4px;";

      nhom.forEach(sao => {
        const s = document.createElement("select");
        s.className = "giaTri";
        s.style = "padding:5px;border:1px solid #ccc;border-radius:4px;";
        ds.forEach(x => { const o=document.createElement("option"); o.textContent=x; s.appendChild(o); });
        s.value = sao;
        saoBox.appendChild(s);
      });

      g.appendChild(saoBox);

      box.appendChild(g);
    });

    return container.appendChild(dk);
  }

  // ==========================
  // 🔥 BIẾN KHÁC – GIỮ NGUYÊN
  // ==========================
  const selects = dk.querySelectorAll(".giaTri");
  giaTri.forEach((v, index) => { if (selects[index]) selects[index].value = v; });

  return container.appendChild(dk);
}


// ✏️ Sửa & 🗑️ Xóa Cách Cục
document.addEventListener("click",(e)=>{

  // ✏️ Sửa Cách Cục
  if (e.target.closest(".edit-cc")) {
    e.stopPropagation();   // ⭐ KHÔNG CHO LAN XUỐNG LISTENER 2

    const i = e.target.closest(".edit-cc").dataset.index;
    const cc = CACH_CUC_DATA[i];

    const popup = document.getElementById("popupCachCuc");
    popup.style.display = "flex";
    popup.dataset.editIndex = i;

    // tên
    const tenInput = popup.querySelector(".cc-ten-input");
    if (tenInput) tenInput.value = cc.ten;

    // xóa UI điều kiện cũ
    const dkContainer = document.getElementById("dieuKienContainer");
    dkContainer.innerHTML = "";

    // tái tạo điều kiện theo phiên bản UI mới
    cc.dieuKien.forEach(dk => {
      taoUIChoDieuKien(dk.bien, dk.giaTri, dkContainer);
    });

    return;
  }

  // 🗑️ Xóa
  if(e.target.closest(".delete-cc")){
    e.stopPropagation();  // ⭐ tránh lan xuống dưới

    const i = e.target.closest(".delete-cc").dataset.index;
    if(confirm("Xóa Cách Cục này?")){
      CACH_CUC_DATA.splice(i, 1);
      syncCachCucStore();
      renderCachCucList();
    }
    return;
  }
});




// Popup xử lý
document.addEventListener("click",(e)=>{
 // ⭐ FIX KHÔNG CHỈNH SỬA ĐƯỢC ⭐
  const popup = document.getElementById("popupCachCuc");
// ❌ Chỉ chặn click RA NGOÀI popup, KHÔNG chặn nút bên trong
if (
  popup.style.display === "flex" &&
  popup.dataset.editIndex &&
  !e.target.closest("#popupCachCuc")
) {
  return;
}
  // ------------------------------------

 if(e.target.id==="btnAddCachCuc"){
    const popup = document.getElementById("popupCachCuc");
    popup.style.display = "flex";
    popup.removeAttribute("data-editIndex"); // XÓA INDEX CŨ !!!
    document.getElementById("dieuKienContainer").innerHTML = "";
    const tenInput = document.querySelector("#popupCachCuc .cc-ten-input");
    if (tenInput) tenInput.value = ""; // xoá tên cũ nếu có
}
  
  if(e.target.id==="btnCloseCachCuc"){
    document.getElementById("popupCachCuc").style.display="none";
  }


if (e.target.id === "btnAddDieuKien") {
  const dk = document.createElement("div");
  dk.className = "dk-item";
  dk.style.cssText = `
    border:1px solid #ddd;border-radius:6px;padding:8px;margin:6px 0;
    background:#faf5ff;display:flex;flex-direction:column;gap:6px;
  `;

  dk.innerHTML = `
    <label style="font-weight:600;">Biến:</label>
    <select class="bien" style="padding:4px 6px;border:1px solid #ccc;border-radius:4px;">
      <option value="">-- Chọn Biến --</option>
      <option value="cungVi">Cung Vị</option>
      <option value="cungChuc">Cung Chức</option>
      <option value="chinhTinh_ChinhCung">Chính Tinh (Chính Cung)</option>
      <option value="trungTinh_ChinhCung">Trung Tinh (Chính Cung)</option>
      <option value="chinhTinh_TamHop">Chính Tinh (Tam Hợp)</option>
      <option value="trungTinh_TamHop">Trung Tinh (Tam Hợp)</option>
      <option value="giapCung_ChinhTinh">Giáp Cung (Chính Tinh)</option>
      <option value="giapCung_TrungTinh">Giáp Cung (Trung Tinh)</option>
<option value="giapCung_KetHop">Giáp Cung (Kết Hợp)</option>

      <option value="thuocCach">Thuộc Cách</option>
    </select>

    <div class="giaTriBox">
      <label>Giá trị (phân tách bởi dấu phẩy):</label>
      <input class="giaTri" placeholder="VD: Tử Vi, Thiên Tướng"
             style="width:100%;padding:5px 6px;border:1px solid #ccc;border-radius:4px;">
    </div>
  `;

  const selectBien = dk.querySelector(".bien");
  const giaTriBox = dk.querySelector(".giaTriBox");

selectBien.addEventListener("change", () => {
  const val = selectBien.value;
  const box = giaTriBox;
  box.innerHTML = ""; // reset nội dung

  const taoSelect = (arr, multiple = false) => {
    const s = document.createElement("select");
    s.className = "giaTri";
    s.style.cssText = `
      width:100%;
      padding:5px 6px;
      border:1px solid #ccc;
      border-radius:4px;
      margin-top:4px;
    `;
    if (multiple) {
      s.multiple = true;
      s.size = 5;
    }
    arr.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      s.appendChild(opt);
    });
    return s;
  };

 
  // ===============================
// 1️⃣ CUNG VỊ (Hỗ trợ nhiều lựa chọn OR)
// ===============================
if (val === "cungVi") {
  const ds = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  const wrap = document.createElement("div");
  wrap.className = "cungViList";
  wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;";

  // Hàm thêm 1 dropdown chọn cung vị
  function addSelect(value = "") {
    const s = document.createElement("select");
    s.className = "giaTri cungVi-item";
    s.style.cssText = `
      width:100%;
      padding:5px 6px;
      border:1px solid #ccc;
      border-radius:4px;
    `;
    ds.forEach(v=>{
      const o = document.createElement("option");
      o.textContent = v;
      s.appendChild(o);
    });
    if (value) s.value = value;
    wrap.appendChild(s);
  }

  // Thêm dropdown đầu tiên
  addSelect();

  // Nút thêm cung (OR)
  const btn = document.createElement("button");
  btn.textContent = "➕ Thêm Cung (OR)";
  btn.style.cssText = `
    background:#7b2cbf;
    color:#fff;
    border:none;
    border-radius:4px;
    padding:4px 10px;
    cursor:pointer;
    width:max-content;
  `;
  btn.onclick = () => {
    if (wrap.querySelectorAll("select").length < 6) {
      addSelect();
    }
  };

  box.appendChild(wrap);
  box.appendChild(btn);

  const note = document.createElement("small");
  note.textContent = "💡 Có thể chọn nhiều cung — nghĩa là thỏa bất kỳ cung nào (điều kiện OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}



 // ===============================
// 2️⃣ CUNG CHỨC (nhiều lựa chọn OR)
// ===============================
if (val === "cungChuc") {
  const ds = [
    "Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách",
    "Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu"
  ];

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;";

  function addSelect(value="") {
    const s = document.createElement("select");
    s.className = "giaTri cungChucItem";
    s.style.cssText = `
      padding:5px;border:1px solid #ccc;border-radius:4px;
    `;
    ds.forEach(v=>{
      const o=document.createElement("option"); o.textContent=v; s.appendChild(o);
    });
    if (value) s.value = value;
    wrap.appendChild(s);
  }

  // mặc định 1 dòng
  addSelect();

  const btn = document.createElement("button");
  btn.textContent = "➕ Thêm Cung Chức (OR)";
  btn.style.cssText = `
    background:#7b2cbf;color:#fff;border:none;border-radius:4px;
    padding:4px 10px;cursor:pointer;width:max-content;
  `;
  btn.onclick = () => addSelect();

  box.appendChild(wrap);
  box.appendChild(btn);

  const note = document.createElement("small");
  note.textContent = "💡 Bạn có thể thêm nhiều Cung Chức — nghĩa là thỏa bất kỳ cung nào (điều kiện OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}


// ===============================
// 3️⃣ CHÍNH TINH (Chính Cung / Tam Hợp)
// ===============================
if (val === "chinhTinh_ChinhCung" || val === "chinhTinh_TamHop") {

  const ds = [
    "Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
    "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
    "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng"
  ];

  const wrap = document.createElement("div");
  wrap.className = "nhomChinhTinhWrap";
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;";

  function addGroup(values = []) {
    const group = document.createElement("div");
    group.className = "chinhTinhGroup";
    group.style.cssText = `
      border:1px solid #ccc;
      padding:8px;
      border-radius:6px;
      background:#f4ecff;
      display:flex;
      flex-direction:column;
      gap:6px;
    `;

    group.innerHTML = `<b>Nhóm Chính Tinh (AND trong nhóm):</b>`;

    const box = document.createElement("div");
    box.className = "saoBox";
    box.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    // Tạo các select từ values (load khi sửa)
    values.forEach(v=>{
      const s = document.createElement("select");
      s.className = "giaTri chinhTinhItem";
      s.style.cssText = `
        padding:5px;border:1px solid #ccc;border-radius:4px;
      `;
      ds.forEach(x=>{
        const o=document.createElement("option"); o.textContent=x; s.appendChild(o);
      });
      s.value = v;
      box.appendChild(s);
    });

    // Nếu thêm mới mà chưa có gì, tạo 1 select
    if (values.length === 0) addSelect();

    function addSelect() {
      if (box.children.length >= 2) return;
      const s = document.createElement("select");
      s.className = "giaTri chinhTinhItem";
      s.style.cssText = `
        padding:5px;border:1px solid #ccc;border-radius:4px;
      `;
      ds.forEach(x=>{
        const o=document.createElement("option"); o.textContent=x; s.appendChild(o);
      });
      box.appendChild(s);
    }

    group.appendChild(box);

    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Sao (tối đa 2)";
    btn.style.cssText = `
      background:#7b2cbf;color:#fff;border:none;border-radius:4px;
      padding:4px 10px;cursor:pointer;width:max-content;
    `;
    btn.onclick = () => addSelect();

    group.appendChild(btn);
    wrap.appendChild(group);
  }

  // Nhóm đầu tiên
  addGroup();

  const addGroupBtn = document.createElement("button");
  addGroupBtn.textContent = "➕ Thêm Nhóm Chính Tinh (OR)";
  addGroupBtn.style.cssText = `
    background:#4c1d95;color:#fff;border:none;border-radius:4px;
    padding:5px 12px;cursor:pointer;width:max-content;
  `;
  addGroupBtn.onclick = () => addGroup();

  box.appendChild(wrap);
  box.appendChild(addGroupBtn);

  const note = document.createElement("small");
  note.textContent = "💡 Một nhóm = AND. Nhiều nhóm = OR giữa các nhóm.";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}


  // ===============================
  // 4️⃣ TRUNG TINH (CHÍNH CUNG)
  // ===============================
  if (val === "trungTinh_ChinhCung") {
    const ds = [
      "Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
      "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
      "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = () => {
      wrap.appendChild(taoSelect(ds));
    };

    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Trung Tinh";
    btn.style.cssText = `
      margin-top:5px;
      background:#7b2cbf;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:4px 10px;
      cursor:pointer;
    `;
    btn.onclick = e => { e.preventDefault(); addSelect(); };

    addSelect();
    box.appendChild(wrap);
    box.appendChild(btn);
    return;
  }

  // ===============================
  // 5️⃣ TRUNG TINH (TAM HỢP)
  // ===============================
  if (val === "trungTinh_TamHop") {
    const ds = [
      "Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
      "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
      "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = () => {
      wrap.appendChild(taoSelect(ds));
    };

    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Trung Tinh";
    btn.style.cssText = `
      margin-top:5px;
      background:#7b2cbf;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:4px 10px;
      cursor:pointer;
    `;
    btn.onclick = e => { e.preventDefault(); addSelect(); };

    addSelect();
    box.appendChild(wrap);
    box.appendChild(btn);

    const note = document.createElement("small");
    note.textContent = "💡 Áp dụng cho cả Trung Tinh Chính Cung và Tam Hợp";
    note.style.color = "#666";
    box.appendChild(note);
    return;
  }

  // ===============================
  // 6️⃣ GIÁP CUNG (CHÍNH TINH / TRUNG TINH)
  // ===============================
  if (val === "giapCung_ChinhTinh" || val === "giapCung_TrungTinh") {
    const isChinh = val.includes("Chinh");
    const ds = isChinh
      ? ["Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
         "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
         "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng"]
      : ["Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
         "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
         "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"];

    const wrap = document.createElement("div");
    wrap.style.cssText = `
      display:flex;
      gap:6px;
      align-items:center;
      justify-content:space-between;
    `;
    const col1 = document.createElement("div");
    const col2 = document.createElement("div");
    const lbl1 = document.createElement("label");
    lbl1.textContent = "Sao Trước:";
    const lbl2 = document.createElement("label");
    lbl2.textContent = "Sao Sau:";
    col1.appendChild(lbl1);
    col1.appendChild(taoSelect(ds));
    col2.appendChild(lbl2);
    col2.appendChild(taoSelect(ds));
    wrap.appendChild(col1);
    wrap.appendChild(col2);
    box.appendChild(wrap);
    return;
  }
// ===============================
// 6️⃣ GIÁP CUNG (KẾT HỢP CHÍNH + TRUNG TINH)
// ===============================
if (val === "giapCung_KetHop") {
  const ds = [
    "Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
    "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
    "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng",
    "Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
    "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
    "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"
  ];

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:12px;
  `;

  // ==== SAO TRƯỚC ====
  const truocWrap = document.createElement("div");
  truocWrap.innerHTML = `<label><b>Sao Trước:</b></label>`;
  const truocBox = document.createElement("div");
  truocBox.className = "giap-truoc-box";
  truocWrap.appendChild(truocBox);

  const btnTruoc = document.createElement("button");
  btnTruoc.textContent = "+ Thêm Sao Trước";
  btnTruoc.type = "button";
  btnTruoc.style.cssText = `
    margin-top:4px;
    background:#7b2cbf;
    color:white;
    border:none;
    border-radius:4px;
    padding:4px 10px;
    cursor:pointer;
  `;
  btnTruoc.onclick = () => {
    const sel = document.createElement("select");
    sel.className = "giaTri giap-truoc";
    sel.style.cssText = "width:100%;margin-top:4px;padding:4px;border:1px solid #ccc;border-radius:4px;";
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      sel.appendChild(opt);
    });
    truocBox.appendChild(sel);
  };
  truocWrap.appendChild(btnTruoc);

  // ==== SAO SAU ====
  const sauWrap = document.createElement("div");
  sauWrap.innerHTML = `<label><b>Sao Sau:</b></label>`;
  const sauBox = document.createElement("div");
  sauBox.className = "giap-sau-box";
  sauWrap.appendChild(sauBox);

  const btnSau = document.createElement("button");
  btnSau.textContent = "+ Thêm Sao Sau";
  btnSau.type = "button";
  btnSau.style.cssText = `
    margin-top:4px;
    background:#7b2cbf;
    color:white;
    border:none;
    border-radius:4px;
    padding:4px 10px;
    cursor:pointer;
  `;
  btnSau.onclick = () => {
    const sel = document.createElement("select");
    sel.className = "giaTri giap-sau";
    sel.style.cssText = "width:100%;margin-top:4px;padding:4px;border:1px solid #ccc;border-radius:4px;";
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      sel.appendChild(opt);
    });
    sauBox.appendChild(sel);
  };
  sauWrap.appendChild(btnSau);

  wrap.appendChild(truocWrap);
  wrap.appendChild(sauWrap);
  box.appendChild(wrap);
  return;
}

  // ===============================
  // 7️⃣ THUỘC CÁCH
  // ===============================
 if (val === "thuocCach") {
  const ds = [
    "Hung",
    "Bán Cát Bán Hung – Thiên Hung",
    "Cát Hung Lẫn Lộn",
    "Bán Cát Bán Hung – Thiên Cát",
    "Cát"
  ];

  // Vùng chứa các dropdown
  const listWrap = document.createElement("div");
  listWrap.className = "thuocCachList";

  // Hàm thêm 1 dropdown mới
  function addSelect(value = "") {
    const sel = taoSelect(ds);
    if (value) sel.value = value;
    sel.style.marginRight = "4px";
    listWrap.appendChild(sel);
  }

  // Thêm dropdown đầu tiên
  addSelect();

  // Nút thêm lựa chọn
  const btnAdd = document.createElement("button");
  btnAdd.textContent = "➕";
  btnAdd.style.cssText = `
    background:#7b2cbf;
    color:#fff;
    border:none;
    border-radius:6px;
    padding:2px 8px;
    cursor:pointer;
  `;
  btnAdd.addEventListener("click", () => {
    if (listWrap.querySelectorAll("select").length < 5) {
      addSelect();
    }
  });

  box.appendChild(listWrap);
  box.appendChild(btnAdd);
  return;
}


  // ===============================
  // 8️⃣ MẶC ĐỊNH — nếu chưa có nhóm
  // ===============================
  const empty = document.createElement("i");
  empty.textContent = "Chưa có dữ liệu cho biến này.";
  empty.style.color = "#777";
  box.appendChild(empty);
});



  document.getElementById("dieuKienContainer").appendChild(dk);
}






if (e.target.id === "btnSaveCachCuc") {
  const tenInput = document.querySelector("#popupCachCuc .cc-ten-input");
  const ten = tenInput ? tenInput.value.trim() : "";
  if (!ten) return alert("Nhập tên!");

  const dieuKien = [];

  document.querySelectorAll("#dieuKienContainer .dk-item").forEach((dk) => {
    const bien = dk.querySelector(".bien")?.value || "";
    if (!bien) return;

    let giaTri = [];

    // ⚖️ Trường hợp GIÁP CUNG
    if (bien.startsWith("giapCung_")) {
      // 🎯 Giáp Chính / Trung tinh: chỉ có 2 select (1 trước, 1 sau)
      if (bien === "giapCung_ChinhTinh" || bien === "giapCung_TrungTinh") {
        const selects = dk.querySelectorAll("select.giaTri");
        const truocVal = selects[0]?.value?.trim();
        const sauVal   = selects[1]?.value?.trim();
        giaTri = {
          truoc: truocVal ? [truocVal] : [],
          sau:   sauVal   ? [sauVal]   : []
        };
      }

      // 🎯 Giáp Kết Hợp: có thể thêm nhiều sao mỗi bên
      else if (bien === "giapCung_KetHop") {
        const truoc = Array.from(dk.querySelectorAll(".giap-truoc-box select"))
                           .map(s => s.value.trim())
                           .filter(Boolean);
        const sau   = Array.from(dk.querySelectorAll(".giap-sau-box select"))
                           .map(s => s.value.trim())
                           .filter(Boolean);
        giaTri = { truoc, sau };
      }
    }

   // ⚖️ Trường hợp CHÍNH TINH nhiều nhóm (AND trong nhóm, OR giữa nhóm)
else if (bien === "chinhTinh_ChinhCung" || bien === "chinhTinh_TamHop") {

  const groups = dk.querySelectorAll(".chinhTinhGroup");
  giaTri = [];

  groups.forEach(group => {
    const selects = group.querySelectorAll("select.giaTri");
    const groupVals = Array.from(selects)
      .map(s => s.value.trim())
      .filter(Boolean);

    if (groupVals.length > 0) {
      giaTri.push(groupVals);  // giữ nguyên cấu trúc nhóm
    }
  });
}

// 🧩 Các loại điều kiện khác (giống cũ)
else {
  const allSelects = dk.querySelectorAll(".giaTri");
  giaTri = Array.from(allSelects).flatMap(s => {
    if (s.multiple)
      return Array.from(s.selectedOptions).map(o => o.value.trim());
    else
      return s.value ? [s.value.trim()] : [];
  }).filter(Boolean);
}


    dieuKien.push({ bien, giaTri });
  });
console.log("👉 DỮ LIỆU LƯU:", JSON.stringify(dieuKien, null, 2));

  // 🪶 Lưu vào bộ dữ liệu
// 🪶 Lưu vào bộ dữ liệu
const popup = document.getElementById("popupCachCuc");
const editIndexRaw = popup.dataset.editIndex;

// ép số nếu có
const editIndex = editIndexRaw !== undefined ? Number(editIndexRaw) : NaN;

// --- EDIT ---
if (!isNaN(editIndex)) {
    if (CACH_CUC_DATA[editIndex]) {
        CACH_CUC_DATA[editIndex].ten = ten;
        CACH_CUC_DATA[editIndex].dieuKien = dieuKien;
    }
    delete popup.dataset.editIndex;
}
// --- NEW ---
else {
    CACH_CUC_DATA.push({
        id: Date.now(),
        ten,
        dieuKien
    });
}

syncCachCucStore();
popup.style.display = "none";
renderCachCucList();

}



});
















// ======================================================
// 🔧 HÀM DÙNG CHUNG — RENDER DROPDOWN GIÁ TRỊ THEO BIẾN
// ======================================================
function renderGiaTriTheoBien(selectBien, box, giaTriCu = []) {
  const val = selectBien.value;
  box.innerHTML = "";

  const taoSelect = (arr, multiple = false) => {
    const s = document.createElement("select");
    s.className = "giaTri";
    s.style.cssText = `
      width:100%;
      padding:5px 6px;
      border:1px solid #ccc;
      border-radius:4px;
      margin-top:4px;
    `;
    if (multiple) {
      s.multiple = true;
      s.size = 5;
    }
    arr.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      if (giaTriCu.includes(v)) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  };

  // ===============================
  // 1️⃣ CUNG VỊ
  // ===============================
if (val === "cungVi") {
  const ds = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

  const wrap = document.createElement("div");
  wrap.className = "cungViList";
  wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;";

  function addSelect(value="") {
    const s = document.createElement("select");
    s.className = "giaTri cungVi-item";
    s.style.cssText = `
      width:100%;
      padding:5px 6px;
      border:1px solid #ccc;
      border-radius:4px;
    `;
    ds.forEach(v=>{
      const o = document.createElement("option");
      o.textContent = v;
      s.appendChild(o);
    });

    if(value) s.value = value;  
    wrap.appendChild(s);
  }

  // thêm 1 dòng mặc định
  addSelect();

  const btn = document.createElement("button");
  btn.textContent = "➕ Thêm Cung (OR)";
  btn.style.cssText = `
    background:#7b2cbf;color:#fff;border:none;border-radius:4px;
    padding:4px 10px;cursor:pointer;width:max-content;
  `;
  btn.onclick = () => {
    if (wrap.querySelectorAll("select").length < 5) addSelect();
  };

  box.appendChild(wrap);
  box.appendChild(btn);

  const note = document.createElement("small");
  note.textContent = "💡 Có thể chọn nhiều cung — nghĩa là thỏa bất kỳ cung nào (điều kiện OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}



  // ===============================
  // 2️⃣ CUNG CHỨC
  // ===============================
  if (val === "cungChuc") {
    const ds = [
      "Mệnh","Huynh Đệ","Phu Thê","Tử Tức","Tài Bạch","Tật Ách",
      "Thiên Di","Nô Bộc","Quan Lộc","Điền Trạch","Phúc Đức","Phụ Mẫu"
    ];
    box.appendChild(taoSelect(ds));
    return;
  }

  // ===============================
  // 3️⃣ CHÍNH TINH (CHÍNH CUNG / TAM HỢP)
  // ===============================
  if (val === "chinhTinh_ChinhCung" || val === "chinhTinh_TamHop") {
    const ds = [
      "Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
      "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
      "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = (selectedValue) => {
      const s = document.createElement("select");
      s.className = "giaTri";
      s.style.cssText = `
        width:100%;
        padding:5px 6px;
        border:1px solid #ccc;
        border-radius:4px;
      `;
      ds.forEach(v => {
        const opt = document.createElement("option");
        opt.textContent = v;
        if (v === selectedValue) opt.selected = true;
        s.appendChild(opt);
      });
      wrap.appendChild(s);
    };

    // Nếu có sẵn dữ liệu cũ (1–2 sao)
    if (giaTriCu.length > 0) {
      giaTriCu.forEach(v => addSelect(v));
    } else {
      addSelect(); // mặc định 1 dropdown trống
    }

    // Nút thêm sao thứ hai
    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Chính Tinh";
    btn.style.cssText = `
      margin-top:5px;
      background:#7b2cbf;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:4px 10px;
      cursor:pointer;
    `;
    btn.onclick = e => {
      e.preventDefault();
      const count = wrap.querySelectorAll("select.giaTri").length;
      if (count < 2) addSelect();
    };

    box.appendChild(wrap);
    box.appendChild(btn);

    const note = document.createElement("small");
    note.textContent = "💡 Có thể chọn tối đa 2 sao hoặc 'Vô Chính Diệu'";
    note.style.color = "#666";
    box.appendChild(note);
    return;
  }

  // ===============================
  // 4️⃣ TRUNG TINH (CHÍNH CUNG)
  // ===============================
  if (val === "trungTinh_ChinhCung") {
    const ds = [
      "Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
      "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
      "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = (selectedValue) => {
      const s = taoSelect(ds);
      if (selectedValue) s.value = selectedValue;
      wrap.appendChild(s);
    };

    if (giaTriCu.length > 0) {
      giaTriCu.forEach(v => addSelect(v));
    } else addSelect();

    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Trung Tinh";
    btn.style.cssText = `
      margin-top:5px;
      background:#7b2cbf;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:4px 10px;
      cursor:pointer;
    `;
    btn.onclick = e => { e.preventDefault(); addSelect(); };

    box.appendChild(wrap);
    box.appendChild(btn);
    return;
  }

  // ===============================
  // 5️⃣ TRUNG TINH (TAM HỢP)
  // ===============================
  if (val === "trungTinh_TamHop") {
    const ds = [
      "Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
      "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
      "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = (selectedValue) => {
      const s = taoSelect(ds);
      if (selectedValue) s.value = selectedValue;
      wrap.appendChild(s);
    };

    if (giaTriCu.length > 0) {
      giaTriCu.forEach(v => addSelect(v));
    } else addSelect();

    const btn = document.createElement("button");
    btn.textContent = "➕ Thêm Trung Tinh";
    btn.style.cssText = `
      margin-top:5px;
      background:#7b2cbf;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:4px 10px;
      cursor:pointer;
    `;
    btn.onclick = e => { e.preventDefault(); addSelect(); };

    const note = document.createElement("small");
    note.textContent = "💡 Áp dụng cho cả Chính Cung và Tam Hợp";
    note.style.color = "#666";

    box.appendChild(wrap);
    box.appendChild(btn);
    box.appendChild(note);
    return;
  }

// ===============================
// 6️⃣ GIÁP CUNG (CHÍNH TINH / TRUNG TINH)
// ===============================
if (val === "giapCung_ChinhTinh" || val === "giapCung_TrungTinh") {
  const isChinh = val.includes("Chinh");
  const ds = isChinh
    ? ["Vô Chính Diệu","Tử Vi","Thiên Phủ","Vũ Khúc","Liêm Trinh","Tham Lang",
       "Cự Môn","Phá Quân","Thiên Tướng","Thiên Lương","Thiên Cơ",
       "Thái Dương","Thái Âm","Thất Sát","Thiên Đồng"]
    : ["Tả Phù","Hữu Bật","Văn Xương","Văn Khúc","Thiên Khôi","Thiên Việt",
       "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
       "Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ","Lộc Tồn","Thiên Mã"];

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    display:flex;
    gap:16px;
    justify-content:space-between;
    align-items:flex-start;
  `;

  // ==== CỘT TRƯỚC ====
  const col1 = document.createElement("div");
  col1.style.cssText = "flex:1;display:flex;flex-direction:column;gap:4px;";
  const lbl1 = document.createElement("label");
  lbl1.textContent = "Sao Trước:";
  lbl1.style.fontWeight = "600";
  col1.appendChild(lbl1);

  const addSelectLeft = (selected) => {
    const sWrap = document.createElement("div");
    sWrap.style.cssText = "display:flex;gap:4px;align-items:center;margin-top:2px;";
    const s = document.createElement("select");
    s.className = "giaTri giap-truoc";
    s.style.cssText = "flex:1;padding:4px;border:1px solid #ccc;border-radius:4px;";
    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = "-- Chọn Sao --";
    s.appendChild(optEmpty);
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      if (v === selected) opt.selected = true;
      s.appendChild(opt);
    });
    const del = document.createElement("button");
    del.textContent = "❌";
    del.style.cssText = "background:none;border:none;color:#a00;cursor:pointer;";
    del.onclick = (ev) => { ev.preventDefault(); sWrap.remove(); };
    sWrap.appendChild(s);
    sWrap.appendChild(del);
    col1.insertBefore(sWrap, btnAddLeft);
  };

  const btnAddLeft = document.createElement("button");
  btnAddLeft.textContent = "➕ Thêm Sao Trước";
  btnAddLeft.style.cssText = "margin-top:4px;background:#9b5de5;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;";
  btnAddLeft.onclick = (ev) => { ev.preventDefault(); addSelectLeft(); };

  col1.appendChild(btnAddLeft);

  // ==== CỘT SAU ====
  const col2 = document.createElement("div");
  col2.style.cssText = "flex:1;display:flex;flex-direction:column;gap:4px;";
  const lbl2 = document.createElement("label");
  lbl2.textContent = "Sao Sau:";
  lbl2.style.fontWeight = "600";
  col2.appendChild(lbl2);

  const addSelectRight = (selected) => {
    const sWrap = document.createElement("div");
    sWrap.style.cssText = "display:flex;gap:4px;align-items:center;margin-top:2px;";
    const s = document.createElement("select");
    s.className = "giaTri giap-sau";
    s.style.cssText = "flex:1;padding:4px;border:1px solid #ccc;border-radius:4px;";
    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = "-- Chọn Sao --";
    s.appendChild(optEmpty);
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      if (v === selected) opt.selected = true;
      s.appendChild(opt);
    });
    const del = document.createElement("button");
    del.textContent = "❌";
    del.style.cssText = "background:none;border:none;color:#a00;cursor:pointer;";
    del.onclick = (ev) => { ev.preventDefault(); sWrap.remove(); };
    sWrap.appendChild(s);
    sWrap.appendChild(del);
    col2.insertBefore(sWrap, btnAddRight);
  };

  const btnAddRight = document.createElement("button");
  btnAddRight.textContent = "➕ Thêm Sao Sau";
  btnAddRight.style.cssText = "margin-top:4px;background:#9b5de5;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;";
  btnAddRight.onclick = (ev) => { ev.preventDefault(); addSelectRight(); };

  col2.appendChild(btnAddRight);

  wrap.appendChild(col1);
  wrap.appendChild(col2);
  box.appendChild(wrap);
  return;
}




 // ===============================
// 7️⃣ THUỘC CÁCH
// ===============================
if (val === "thuocCach") {
  const ds = [
    "Hung",
    "Bán Cát Bán Hung – Thiên Hung",
    "Cát Hung Lẫn Lộn",
    "Bán Cát Bán Hung – Thiên Cát",
    "Cát"
  ];

  // Vùng chứa các dropdown
  const listWrap = document.createElement("div");
  listWrap.className = "thuocCachList";

  // Hàm thêm 1 dropdown mới
  function addSelect(value = "") {
    const sel = taoSelect(ds);
    if (value) sel.value = value;
    sel.style.marginRight = "4px";
    listWrap.appendChild(sel);
  }

  // Thêm dropdown đầu tiên
  if (giaTriCu.length) {
    giaTriCu.forEach(v => addSelect(v));
  } else {
    addSelect();
  }

  // Nút thêm lựa chọn
  const btnAdd = document.createElement("button");
  btnAdd.textContent = "➕";
  btnAdd.style.cssText = `
    background:#7b2cbf;
    color:#fff;
    border:none;
    border-radius:6px;
    padding:2px 8px;
    cursor:pointer;
  `;
  btnAdd.addEventListener("click", () => {
    if (listWrap.querySelectorAll("select").length < 5) {
      addSelect();
    }
  });

  // Gắn vào box
  box.appendChild(listWrap);
  box.appendChild(btnAdd);
  return;
}


  // ===============================
  // 8️⃣ MẶC ĐỊNH — nếu chưa có nhóm
  // ===============================
  const empty = document.createElement("i");
  empty.textContent = "Chưa có dữ liệu cho biến này.";
  empty.style.color = "#777";
  box.appendChild(empty);
}






// 📝 Mở popup mô tả khi click vào tên Cách Cục
document.addEventListener("click",(e)=>{
  const left = e.target.closest(".cc-left");
  if(!left) return;

  // 🚧 Chặn nếu chưa premium
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block mô tả cách cục vì user chưa premium");
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }

  const index = left.dataset.index;
  const cc = CACH_CUC_DATA[index];
  if(!cc) return;

  const popup = document.getElementById("popupMoTaCachCuc");
  const textarea = document.getElementById("moTaText");
  const title = document.getElementById("moTaTitle");

  title.innerHTML = `📝 Mô tả: <b>${cc.ten}</b>`;
  textarea.value = cc.moTa || "";
  popup.dataset.index = index;
  popup.style.display = "flex";
});

// 💾 Lưu mô tả
document.getElementById("btnSaveMoTa").addEventListener("click",()=>{
  const popup = document.getElementById("popupMoTaCachCuc");
  const index = popup.dataset.index;
  const val = document.getElementById("moTaText").value.trim();
  
  if (index !== undefined) {
    CACH_CUC_DATA[index].moTa = val;

    // 👉 LƯU VÀO INDEXEDDB (KHÔNG DÙNG localStorage)
    syncCachCucStore();
  }

  popup.style.display = "none";
});


// ❌ Đóng popup
document.getElementById("btnCloseMoTa").addEventListener("click",()=>{
  document.getElementById("popupMoTaCachCuc").style.display="none";
});

// 🔐 Đóng popup Cách Cục khi nhấn ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const popup = document.getElementById("popupMoTaCachCuc");
    if (popup && popup.style.display !== "none") {
      popup.style.display = "none";
    }
    const saoPopup = document.getElementById("saoPopup");
    if (saoPopup && saoPopup.style.display !== "none") {
      saoPopup.style.display = "none";
    }
  }
});


// ======================================================
// 🧩 KIỂM TRA ĐIỀU KIỆN CÁCH CỤC (chuẩn hóa AND logic)
// ======================================================

// 🧠 Kiểm tra 1 điều kiện đơn
function kiemTraDieuKien(dk, cungId, data) {
  const cung = data[cungId];
  console.log("🧩 Kiểm tra điều kiện:", dk.bien, dk.giaTri, "=>", cung);

  if (!cung) return false;

// 🧩 Chuẩn hóa giá trị điều kiện (dạng mảng hoặc object)
let g = [];
const normalize = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const normalizeKey = s => normalize(s).replace(/[^a-z0-9]/g, "");

// Trường hợp CŨ: mảng STRING đơn
// Ví dụ: ["Dần","Tý"] hoặc ["Tử Vi"]
if (Array.isArray(dk.giaTri) && typeof dk.giaTri[0] === "string") {
  g = dk.giaTri.map(x => x.trim()).filter(Boolean);
}

// Trường hợp MỚI: mảng NHÓM OR cho chính tinh / trung tinh
// Ví dụ:  [ ["Thái Âm","Thiên Đồng"], ["Thiên Lương","Thiên Cơ"] ]
else if (Array.isArray(dk.giaTri) && Array.isArray(dk.giaTri[0])) {
  g = dk.giaTri; // GIỮ NGUYÊN, không trim
}

// Trường hợp Giáp Cung: object { truoc:[], sau:[] }
else if (dk.giaTri && typeof dk.giaTri === "object") {
  g = dk.giaTri;
}

const soSanh = (s, val) => {
  if (Array.isArray(val)) return false;  // tránh crash cho nhóm OR
  if (typeof val !== "string") return false;
  return normalize(s) === normalize(val);
};


if (dk.bien.startsWith("giapCung")) {
  console.log("🔎 DK Giáp:", dk);
}


  switch (dk.bien) {
    /* ======================== */
    /* 📍 Vị trí & chức năng cung */
    /* ======================== */
    case "cungVi":
      return g.includes(cung.viTri);

    case "cungChuc":
  return g.some(val =>
    normalize(val) === normalize(cung.chuc || "")
  );


/* ======================== */
/* 🌞 Chính Tinh */
/* ======================== */
case "chinhTinh_ChinhCung": {

  // g có thể dạng:
  // 1) ["Tử Vi"]  → AND (tất cả phải có)
  // 2) [ ["A","B"], ["C","D"] ] → OR của các nhóm AND
  // 3) ["Vô Chính Diệu"]

  // 👉 Trường hợp đặc biệt: Vô Chính Diệu
  const hasVoChinhDieu = Array.isArray(g) && g.some(v => normalizeKey(v) === "vochinhdieu");
  if (hasVoChinhDieu) {
    return !cung.chinhTinh || cung.chinhTinh.length === 0;
  }

  // 👉 Nếu g[0] là STRING → Dạng AND (tất cả phải có)
  if (Array.isArray(g) && typeof g[0] === "string") {
    return g.every(val =>
      (cung.chinhTinh || []).some(s => soSanh(s, val))
    );
  }

  // 👉 Nếu g[0] là mảng → Dạng OR của nhiều nhóm AND
  //    Ví dụ: [ ["A","B"], ["C","D"] ]
  return g.some(nhom =>
    nhom.every(val =>
      (cung.chinhTinh || []).some(s => soSanh(s, val))
    )
  );
}

/* ======================== */
/* 🌞 Chính Tinh (Tam Hợp) – 2025 logic */
/* ======================== */
case "chinhTinh_TamHop": {

  // g = ["a","b"] hoặc g = [ ["a","b"], ["c","d"] ]

  const list = cung.tamHopChinhTinh || [];

  // Nếu nhóm OR
  if (Array.isArray(g) && Array.isArray(g[0])) {
    return g.some(nhom =>
      nhom.every(sao =>
        list.some(s => soSanh(s, sao))
      )
    );
  }

  // Nếu dạng cũ: ["a","b"]
  return g.every(val =>
    list.some(s => soSanh(s, val))
  );
}


    /* ======================== */
    /* 🌙 Trung Tinh */
    /* ======================== */
    case "trungTinh_ChinhCung":
  return g.every(val =>
    (cung.trungTinh || []).some(s => soSanh(s, val))
  );

   case "trungTinh_TamHop": {
  // Gộp chính cung + 2 cung tam hợp
  const arrTrungTinh = [
    ...(cung.trungTinh || []),
    ...(cung.tamHopTrungTinh || [])
  ];

  // Loại trùng bằng Set
  const fullList = [...new Set(arrTrungTinh)];

  // Kiểm tra tất cả sao trong điều kiện đều có trong danh sách này
  return g.every(val =>
    fullList.some(s => soSanh(s, val))
  );
}


/* ======================== */
/* ⚖️ Giáp Cung */
/* ======================== */
case "giapCung_ChinhTinh":
case "giapCung_TrungTinh":
case "giapCung_KetHop": {
  // 🔍 Dữ liệu dk.giaTri hiện là object { truoc:[], sau:[] }
  const truoc = Array.isArray(dk.giaTri.truoc)
    ? dk.giaTri.truoc.map(x => x.trim()).filter(Boolean)
    : [];
  const sau = Array.isArray(dk.giaTri.sau)
    ? dk.giaTri.sau.map(x => x.trim()).filter(Boolean)
    : [];

  const loai =
    dk.bien === "giapCung_ChinhTinh"
      ? "chinhTinh"
      : dk.bien === "giapCung_TrungTinh"
      ? "trungTinh"
      : null;

  // 🔸 Nếu là Kết hợp thì check cả hai loại
  if (dk.bien === "giapCung_KetHop") {
    return (
      kiemTraGiapCung_2Ben(truoc, sau, cungId, data, "giapCung_ChinhTinh") ||
      kiemTraGiapCung_2Ben(truoc, sau, cungId, data, "giapCung_TrungTinh")
    );
  }

  return kiemTraGiapCung_2Ben(truoc, sau, cungId, data, dk.bien);
}



    /* ======================== */
    /* 💠 Cách loại (HUNG / CAT / ...) */
    /* ======================== */
    case "thuocCach":
  if (!cung.cachLoai) return false;
  return g.some(val => normalize(val) === normalize(cung.cachLoai));
case "thuocCach":
  return g.some(val =>
    val.trim().toLowerCase() === (cung.cachLoai || "").trim().toLowerCase()
  );


    /* ======================== */
    /* ❌ Mặc định */
    /* ======================== */
    default:
      return false;
  }
}


// ⚖️ Kiểm tra Giáp Cung (chuẩn theo vị trí tên cung, không dựa vào ID)
function kiemTraGiapCung_2Ben(listTruoc, listSau, cid, data, bien) {
  const loai =
    bien.includes("ChinhTinh") ? "chinhTinh" :
    bien.includes("TrungTinh") ? "trungTinh" : null;
  if (!loai) return false;

  // 🔹 Lấy tên cung hiện tại
  const cungHienTai = data[cid]?.viTri;
  if (!cungHienTai) return false;

  // 🔹 Vòng 12 cung cố định
  const CUNG_LIST = [
    "Dần","Mão","Thìn","Tỵ","Ngọ","Mùi",
    "Thân","Dậu","Tuất","Hợi","Tý","Sửu"
  ];

  const idx = CUNG_LIST.indexOf(cungHienTai);
  if (idx === -1) return false;

  const tenTruoc = CUNG_LIST[(idx - 1 + 12) % 12];
  const tenSau   = CUNG_LIST[(idx + 1) % 12];

  // 🔹 Tìm dữ liệu hai cung đó
  const truoc = Object.values(data).find(c => c.viTri === tenTruoc);
  const sau   = Object.values(data).find(c => c.viTri === tenSau);
  if (!truoc || !sau) return false;

  const normalize = s => s.trim().toLowerCase();

  const hasTruoc = (listTruoc || []).some(val =>
    (truoc[loai] || []).some(s => normalize(s) === normalize(val))
  );
  const hasSau = (listSau || []).some(val =>
    (sau[loai] || []).some(s => normalize(s) === normalize(val))
  );

 // ✅ Cho phép 2 chiều: Khôi-Việt hoặc Việt-Khôi đều được
const hasTruocNguoc = (listSau || []).some(val =>
  (truoc[loai] || []).some(s => normalize(s) === normalize(val))
);
const hasSauNguoc = (listTruoc || []).some(val =>
  (sau[loai] || []).some(s => normalize(s) === normalize(val))
);

return (hasTruoc && hasSau) || (hasTruocNguoc && hasSauNguoc);
}






// 💡 Alias tương thích cho code cũ
window.kiemTraGiapCung = function (...args) {
  const [g, cid, d, loai] = args;
  if (!Array.isArray(g) || g.length === 0) return false;

  const truoc = g.slice(0, 1);
  const sau   = g.slice(1);
  const bien  = loai === "chinhTinh" ? "giapCung_ChinhTinh" : "giapCung_TrungTinh";
  return window.kiemTraGiapCung_2Ben(truoc, sau, cid, d, bien);
};




// ======================================================
// 🧮 KIỂM TRA TOÀN BỘ CÁCH CỤC (logic AND)
// ======================================================
function kiemTraCachCuc(cid, data) {
  const cung = data[cid];
  console.log("[CC] Kiểm tra cách cục tại cung:", cid, cung);

  const kq = [];
  const fails = [];
  if (!window.CACH_CUC_DATA) window.CACH_CUC_DATA = CACH_CUC_DATA || [];

  window.CACH_CUC_DATA.forEach(cc => {
    let hopLe = true;
    let failReason = null;
    console.groupCollapsed(`🧩 Cách cục: ${cc.ten}`);

    for (const dk of cc.dieuKien) {
      const ketQua = kiemTraDieuKien(dk, cid, data);
      console.log(`➡️ Điều kiện:`, dk.bien, dk.giaTri, "=>", ketQua);
      if (!ketQua) {
        hopLe = false;
        failReason = { ten: cc.ten, bien: dk.bien, giaTri: dk.giaTri };
        console.warn(`❌ Không đạt: ${dk.bien}`);
        break;
      }
    }

    if (hopLe) {
      console.log(`✅ Thỏa cách cục: ${cc.ten}`);
      kq.push(cc.ten);
    } else {
      if (failReason) fails.push(failReason);
      console.log(`🚫 Bị loại: ${cc.ten}`);
    }

    console.groupEnd();
  });

  console.log("📋 Tổng hợp cách cục:", kq);
  window.__LAST_FAILS_CACH_CUC = fails;
  return { kq, fails };
}


// 🔹 Cập nhật panel phải
function capNhatBangCachCuc_Phai(result,cung){
  const ds = Array.isArray(result?.kq) ? result.kq : result || [];
  const wrap=document.getElementById("cachCucWrapper");
  const noiDung=document.getElementById("cachCucNoiDung");
  if(!wrap||!noiDung)return;
  wrap.style.display="block";
  const cungLabel = cung || `Cung ${cung}`;
  const paid = window.isPaidUser && window.isPaidUser();
  const maskTen = (ten) => {
    const parts = (ten || "").split(/\s+/);
    if (parts.length <= 2) return ten;
    return parts.slice(0,2).join(" ") + " …";
  };
  noiDung.innerHTML = ds.length
    ? `<b>${cungLabel}</b>:<br>${ds.map(x=>{
        const label = paid ? x : maskTen(x);
        const locked = paid ? "" : " locked-premium";
        const style = paid ? "margin-left:10px;" : "margin-left:10px;pointer-events:none;";
        return `<div class="dong-phan-tich${locked}" data-ten="${x}" style="${style}">✅ ${label}</div>`;
      }).join("")}`
    : `<b>${cungLabel}</b>: <i>Không có cách cục phù hợp.</i>`;
}

// =====================================================
// 🔹 GẮN SỰ KIỆN CLICK CUNG (DELEGATE) – áp dụng cho cung tạo động
// =====================================================
document.addEventListener("click", async (e) => {
  const c = e.target.closest(".cung");
  if (!c) return;

  const id = Number(c.id.replace("cell", ""));
  const cungName = c.dataset.ten || "Cung " + id;

  // Đợi dữ liệu Cách Cục nạp xong từ IndexedDB
  if (typeof CACH_CUC_READY !== "undefined") {
    await CACH_CUC_READY;
  }

  // Lấy dữ liệu lá số thật từ DOM mỗi lần click để chắc chắn mới nhất
  const dataReal = layDuLieuTuLayers();
  // Giữ lại cachLoai đã tính (kết luận cát/hung) nếu có trong cache
  if (window.DU_LIEU_LA_SO_THAT) {
    Object.keys(window.DU_LIEU_LA_SO_THAT).forEach(k => {
      const cached = window.DU_LIEU_LA_SO_THAT[k];
      if (cached?.cachLoai && dataReal[k]) {
        dataReal[k].cachLoai = cached.cachLoai;
      }
    });
  }
  window.DU_LIEU_LA_SO_THAT = dataReal; // cache dùng lại nơi khác

  const { kq, fails } = kiemTraCachCuc(id, dataReal);
  console.log("[CC] Click cung", id, cungName, "— data:", dataReal[id], "CACH_CUC_DATA:", (window.CACH_CUC_DATA||[]).length, "KQ:", kq, "Fails:", fails);
  capNhatBangCachCuc_Phai({ kq, fails }, cungName);
});


// =====================================================
// 🪶 HIỂN THỊ PHÂN TÍCH CÁCH CỤC (ĐỘC LẬP VỚI CÁT HUNG)
// =====================================================
window.capNhatBangCachCuc = function (cungId, tenCung) {
  const wrap = document.getElementById("cachCucWrapper");
  const noiDung = document.getElementById("cachCucNoiDung");
  if (!wrap || !noiDung) return;

  // Luôn hiện bảng khi click cung
  wrap.style.display = "block";

  // 🔹 Dữ liệu lá số thật (lấy từ cache hoặc đọc từ DOM)
  const DU_LIEU_LA_SO = window.DU_LIEU_LA_SO_THAT || layDuLieuTuLayers();
  const paid = window.isPaidUser && window.isPaidUser();
  const maskTen = (ten) => {
    const parts = (ten || "").split(/\s+/);
    if (parts.length <= 2) return ten;
    return parts.slice(0,2).join(" ") + " …";
  };

  function kiemTraDieuKien(dk,cid,data){
    const cung=data[cid];if(!cung)return false;
    const g=dk.giaTri;
    switch(dk.bien){
      case'cungVi':return g.includes(cung.viTri);
      case'cungChuc':return g.includes(cung.chuc);
      case'chinhTinh_ChinhCung':return cung.chinhTinh.some(s=>g.includes(s));
      case'trungTinh_ChinhCung':return cung.trungTinh.some(s=>g.includes(s));
      case'chinhTinh_TamHop':return cung.tamHopChinhTinh.some(s=>g.includes(s));
      case'trungTinh_TamHop':return cung.tamHopTrungTinh.some(s=>g.includes(s));
     case 'giapCung_ChinhTinh':
case 'giapCung_TrungTinh':
case 'giapCung_KetHop': {
  // ✅ Sử dụng hàm 2 bên chuẩn
  const truoc = dk.giaTri.truoc?.map(x=>x.trim()).filter(Boolean) || [];
  const sau   = dk.giaTri.sau?.map(x=>x.trim()).filter(Boolean) || [];
  return kiemTraGiapCung_2Ben(truoc, sau, cid, data, dk.bien);
}

      case'thuocCach':return g.includes(cung.cachLoai);
      default:return true;
    }
  }
 
  const kq = [];
  if (window.CACH_CUC_DATA) {
    window.CACH_CUC_DATA.forEach(cc=>{
      let hopLe=true;
      for(const dk of cc.dieuKien){
        if(!kiemTraDieuKien(dk,cungId,DU_LIEU_LA_SO)){hopLe=false;break;}
      }
      if(hopLe)kq.push(cc.ten);
    });
  }

  noiDung.innerHTML = kq.length
    ? `<b>${tenCung}</b>:<br>${kq.map(x=>{
        const label = paid ? x : maskTen(x);
        const locked = paid ? "" : " locked-premium";
        const style = paid ? "margin-left:10px;" : "margin-left:10px;pointer-events:none;";
        return `<div class="dong-phan-tich${locked}" data-ten="${x}" style="${style}">✅ ${label}</div>`;
      }).join("")}`
    : `<b>${tenCung}</b>: <i>Không có cách cục phù hợp.</i>`;
};

document.getElementById("cachCucWrapper").style.display = "block";




// 🧭 Lấy tên Cung Chức theo vị trí thực tế (theo anLop2_Menh)
function layTenCungChucTheoViTri(viTri) {
  if (window.dataGlobal?.cungChucMap && window.dataGlobal.cungChucMap[viTri]) {
    return window.dataGlobal.cungChucMap[viTri];
  }

  // Dự phòng nếu chưa an Mệnh xong
  const CUNG_CHUC = [
    "MỆNH","HUYNH ĐỆ","PHU THÊ","TỬ TỨC","TÀI BẠCH","TẬT ÁCH",
    "THIÊN DI","NÔ BỘC","QUAN LỘC","ĐIỀN TRẠCH","PHÚC ĐỨC","PHỤ MẪU"
  ];
  const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const idx = CUNG_THUAN.indexOf(viTri);
  return idx !== -1 ? CUNG_CHUC[idx] : "";
}


// ======================================================
// 🔍 HÀM LẤY DỮ LIỆU THẬT TỪ LÁ SỐ (Layer-3, Layer-6…)
// ======================================================
function layDuLieuTuLayers() {
  const duLieu = {};

  for (const [ten, id] of Object.entries(mapCung)) {
    const cell = document.getElementById("cell" + id);
    if (!cell) continue;

    const layer3 = cell.querySelector(".layer-3");
    const layer6 = cell.querySelector(".layer-6");
    const chuc = layTenCungChucTheoViTri(ten);

    const chinhTinh = layer3
      ? Array.from(layer3.querySelectorAll("div")).map(e => e.textContent.trim()).filter(Boolean)
      : [];
  const trungTinh = layer6
  ? Array.from(layer6.querySelectorAll("div div"))
      .map(e => e.textContent.trim())
      .filter(Boolean)
  : [];



    duLieu[id] = {
      viTri: ten,
      chuc,
      chinhTinh,
      trungTinh,
      tamHopChinhTinh: [],
      tamHopTrungTinh: [],
      giapChinhTinh: [],
      giapTrungTinh: [],
      cachLoai: ""
    };
  }

  // ======================================================
// 🧭 Bổ sung Tam Hợp + Giáp Cung
// ======================================================
for (const [ten, id] of Object.entries(mapCung)) {
  const cung = duLieu[id];
  if (!cung) continue;

  // 🔹 Tam hợp
  const allTamHop = (window.TAM_HOP[id] || []).filter(Boolean);
  const tamHopChinh = [];
  const tamHopTrung = [];

  allTamHop.forEach(idx => {
    const c = duLieu[idx];
    if (!c) return;
    tamHopChinh.push(...(c.chinhTinh || []));
    tamHopTrung.push(...(c.trungTinh || []));
  });

  cung.tamHopChinhTinh = tamHopChinh;
  cung.tamHopTrungTinh = tamHopTrung;

  // 🔹 Giáp cung
  const CUNG_LIST = [
    "Dần","Mão","Thìn","Tỵ","Ngọ","Mùi",
    "Thân","Dậu","Tuất","Hợi","Tý","Sửu"
  ];
  const idx = CUNG_LIST.indexOf(ten);
  const giapTruoc = CUNG_LIST[(idx - 1 + 12) % 12];
  const giapSau   = CUNG_LIST[(idx + 1) % 12];

  const truoc = duLieu[mapCung[giapTruoc]];
  const sau   = duLieu[mapCung[giapSau]];

  cung.giap = {
    truoc: {
      viTri: giapTruoc,
      chinhTinh: truoc?.chinhTinh || [],
      trungTinh: truoc?.trungTinh || []
    },
    sau: {
      viTri: giapSau,
      chinhTinh: sau?.chinhTinh || [],
      trungTinh: sau?.trungTinh || []
    }
  };

  // ✅ Mảng tổng hợp cho truy cập nhanh
  cung.giapChinhTinh = [
    ...cung.giap.truoc.chinhTinh,
    ...cung.giap.sau.chinhTinh
  ];
  cung.giapTrungTinh = [
    ...cung.giap.truoc.trungTinh,
    ...cung.giap.sau.trungTinh
  ];
}

// ✅ Trả dữ liệu hoàn chỉnh
return duLieu;
}  // ⬅️ Dấu ngoặc này rất quan trọng – đóng lại hàm cha (ví dụ: xayDungDuLieuLaSo)

// 🔒 Khóa / mở khóa khu TRA NGƯỢC theo premium
function toggleTraNguocLock(isPaid) {
  const wrap = document.getElementById("traNguocWrapper");
  if (!wrap) return;

  // tạo overlay nếu chưa có
  let ov = wrap.querySelector(".tra-nguoc-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "tra-nguoc-overlay";
    Object.assign(ov.style, {
      position: "absolute",
      inset: "0",
      background: "rgba(90,24,154,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#5a189a",
      fontWeight: "600",
      fontSize: "16px",
      textAlign: "center",
      borderRadius: "8px",
      pointerEvents: "none"
    });
    ov.textContent = "Premium";
    wrap.appendChild(ov);
  }

  const controls = wrap.querySelectorAll("select, input, button, textarea");
  controls.forEach(el => {
    el.disabled = !isPaid;
    el.style.opacity = isPaid ? "" : "0.55";
    el.style.cursor = isPaid ? "" : "not-allowed";
  });

  ov.style.display = isPaid ? "none" : "flex";
}
window.toggleTraNguocLock = toggleTraNguocLock;

// 🔒 Khóa sửa/xóa CÁCH CỤC khi chưa premium
function toggleCachCucEditLock(isPaid) {
  const list = document.getElementById("listCachCuc");
  const panel = list?.parentElement || document.getElementById("cachCucPanel");
  if (!list || !panel) return;
  panel.style.position = "relative";
  list.style.position = "relative";

  // Tắt/bật actions
  list.querySelectorAll(".cc-actions button").forEach(btn => {
    btn.disabled = !isPaid;
    btn.style.opacity = isPaid ? "" : "0.5";
    btn.style.pointerEvents = isPaid ? "" : "none";
  });
  const addBtn = document.getElementById("btnAddCachCuc");
  if (addBtn) {
    addBtn.disabled = !isPaid;
    addBtn.style.opacity = isPaid ? "" : "0.5";
    addBtn.style.pointerEvents = isPaid ? "" : "none";
    addBtn.title = isPaid ? "" : "Premium";
  }
  list.querySelectorAll(".cc-item-overlay").forEach(ov => {
    ov.style.display = isPaid ? "none" : "block";
  });
  let ov = panel.querySelector(".cc-lock-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "cc-lock-overlay";
    Object.assign(ov.style, {
      position: "absolute",
      inset: "0",
      background: "rgba(90,24,154,0.08)",
      backdropFilter: "blur(1px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#5a189a",
      fontWeight: "600",
      fontSize: "15px",
      borderRadius: "8px",
      pointerEvents: "auto",
      zIndex: "5"
    });
    ov.textContent = "Premium";
    panel.appendChild(ov);
  }
  ov.style.display = isPaid ? "none" : "flex";
}
window.toggleCachCucEditLock = toggleCachCucEditLock;

// 🔒 Khóa thao tác CHUYÊN ĐỀ (thêm/sửa) khi chưa premium
function toggleChuyenDeEditLock(isPaid) {
  const list = document.getElementById("listChuyenDe");
  const container = list?.parentElement; // phần bao cả list + nút
  if (container) {
    container.style.position = "relative";
    list.style.position = "relative";
    let ov = container.querySelector(".cd-lock-overlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "cd-lock-overlay";
      Object.assign(ov.style, {
        position: "absolute",
        inset: "0",
        background: "rgba(90,24,154,0.08)",
        backdropFilter: "blur(1px)",
        borderRadius: "6px",
        pointerEvents: "auto",
        zIndex: "5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#5a189a",
        fontWeight: "600",
        fontSize: "15px"
      });
      ov.textContent = "Premium";
      container.appendChild(ov);
    }
    ov.style.display = isPaid ? "none" : "flex";
  }

  // Disable các nút thao tác
  const btnAddCD = document.getElementById("btnAddChuyenDe");
  const btnToggleEdit = document.getElementById("btnToggleEdit");
  [btnAddCD, btnToggleEdit].forEach(btn => {
    if (!btn) return;
    btn.disabled = !isPaid;
    btn.style.opacity = isPaid ? "" : "0.5";
    btn.style.cursor = isPaid ? "" : "not-allowed";
    btn.style.pointerEvents = isPaid ? "" : "none";
    btn.title = isPaid ? "" : "Premium";
  });
}
window.toggleChuyenDeEditLock = toggleChuyenDeEditLock;

document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Chờ toàn bộ cây chuyên đề load xong
  setTimeout(() => {

    // 🟢 Luôn render danh sách Cách Cục
    if (typeof renderCachCucList === "function") {
      renderCachCucList();
      console.log("📘 Cách Cục đã render lại sau khi load cây chuyên đề");
    }

    // 2️⃣ Mở toàn bộ node hoặc cha bị ẩn có chứa chữ 'CÁCH CỤC'
    const nutCachCuc = [...document.querySelectorAll(".cd-name")].find(el =>
      /CÁCH CỤC/i.test(el.textContent)
    );
    if (nutCachCuc) {
      let node = nutCachCuc.closest("li.cd-item");
      while (node) {
        node.classList.remove("collapsed");
        const ul = node.querySelector(":scope > ul.cd-level");
        if (ul) ul.classList.remove("collapsed");
        node = node.parentElement?.closest("li.cd-item");
      }
    }

    // 3️⃣ Bỏ display:none trên chính danh sách
    const listCC = document.getElementById("listCachCuc");
    if (listCC) {
      listCC.style.removeProperty("display");
      listCC.style.display = "block";
    }

    // 4️⃣ Bỏ display:none trên cha trực tiếp
    const cha = listCC?.parentElement;
    if (cha && window.getComputedStyle(cha).display === "none") {
      cha.style.display = "block";
    }

    console.log("✅ Đã buộc hiển thị phần CÁCH CỤC");

  }, 600); // đợi 0.6s để cây chuyên đề render xong
});

// 🌟 Ẩn / hiện danh sách CÁCH CỤC — chờ chắc chắn DOM có phần tử
function initCachCucToggle() {
  const title = document.getElementById("titleCachCuc");
  const panel = document.getElementById("cachCucPanel");
  if (!title || !panel) {
    // ⏳ DOM chưa load xong → chờ thêm rồi thử lại
    return setTimeout(initCachCucToggle, 500);
  }

  console.log("✅ Đã gắn toggle cho phần CÁCH CỤC");

  // Hiển thị mặc định
  panel.style.display = "block";

  // Khi click tiêu đề thì thu gọn/mở rộng
  title.addEventListener("click", () => {
    const isHidden = panel.style.display === "none";
    panel.style.display = isHidden ? "block" : "none";
    title.style.opacity = "0.7";
    setTimeout(() => (title.style.opacity = "1"), 150);
  });
}

// 🧩 Kích hoạt khi trang load xong hoàn toàn
window.addEventListener("load", initCachCucToggle);

// =====================================================
// 🔐 ĐĂNG NHẬP / PREMIUM – KHÔI PHỤC NHANH SAU F5
// (bản gọn, độc lập để panel luôn cập nhật)
// =====================================================
(() => {
  const state = (window.AUTH_STATE = window.AUTH_STATE || { user: null, sessionOk: false });
  const elsFinder = () => ({
    user: document.getElementById("authUsername"),
    pass: document.getElementById("authPassword"),
    status: document.getElementById("authStatus"),
    btnLogin: document.getElementById("btnLogin"),
    btnRegister: document.getElementById("btnRegister"),
    btnLogout: document.getElementById("btnLogout"),
    btnActivate: document.getElementById("btnActivatePaid")
  });
  let els = elsFinder();

  const updatePremiumLockSafe = typeof window.updatePremiumLock === "function"
    ? window.updatePremiumLock
    : () => {};

  const isPaidUser = () => !!(state.sessionOk && state.user && state.user.paid);
  window.isPaidUser = window.isPaidUser || isPaidUser;
  const hasPremiumAccess = (featureLabel) => {
    if (isPaidUser()) return true;
    if (els.status) els.status.textContent = `${featureLabel || "Tính năng"} là premium. Vui lòng đăng nhập/kích hoạt.`;
    return false;
  };
  window.hasPremiumAccess = hasPremiumAccess;

  const renderAuth = () => {
    els = elsFinder();
    const u = state.sessionOk ? state.user : null;
    if (els.status) {
      els.status.textContent = u
        ? `Đã đăng nhập: ${u.username} (${u.paid ? "premium" : "miễn phí"})`
        : "Chưa đăng nhập";
    }
    try {
      if (u) localStorage.setItem("auth_user", JSON.stringify(u));
      else localStorage.removeItem("auth_user");
    } catch (_) {}
    const show = u ? "inline-block" : "none";
    const hide = u ? "none" : "inline-block";
    if (els.btnLogout) els.btnLogout.style.display = show;
    if (els.btnActivate) els.btnActivate.style.display = u && !u.paid ? "inline-block" : "none";
    if (els.btnLogin) els.btnLogin.style.display = hide;
    if (els.btnRegister) els.btnRegister.style.display = hide;
    updatePremiumLockSafe(!!(u && u.paid));
    if (typeof toggleTraNguocLock === "function") toggleTraNguocLock(!!(u && u.paid));
    if (typeof toggleCachCucEditLock === "function") toggleCachCucEditLock(!!(u && u.paid));
    if (typeof toggleChuyenDeEditLock === "function") toggleChuyenDeEditLock(!!(u && u.paid));
  };

  const callApi = async (path, options = {}) => {
    const res = await fetch(API_BASE + path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  const doLogin = async () => {
    const username = (els.user?.value || "").trim();
    const password = els.pass?.value || "";
    if (!username || !password) return;
    const { res, data } = await callApi("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (!res.ok) return;
    state.user = data.user || null;
    state.sessionOk = !!state.user;
    renderAuth();
  };
  const doRegister = async () => {
    const username = (els.user?.value || "").trim();
    const password = els.pass?.value || "";
    if (!username || !password) return;
    const { res, data } = await callApi("/api/register", { method: "POST", body: JSON.stringify({ username, password }) });
    if (!res.ok) return;
    state.user = data.user || null;
    state.sessionOk = !!state.user;
    renderAuth();
  };
  const doLogout = async () => { await callApi("/api/logout", { method: "POST" }); state.user = null; state.sessionOk = false; renderAuth(); };
  const activatePaid = async () => {
    const { res, data } = await callApi("/api/activate-paid", { method: "POST" });
    if (!res.ok) return;
    state.user = data.user || null;
    state.sessionOk = !!state.user;
    renderAuth();
  };
  const hydrateUser = async () => {
    try {
      const { data, res } = await callApi("/api/me");
      if (res?.ok && data?.user) {
        state.user = data.user;
        state.sessionOk = true;
      } else {
        state.user = null;
        state.sessionOk = false;
      }
    } catch (_) {
      state.user = null;
      state.sessionOk = false;
    }
    renderAuth();
  };

  // Gắn sự kiện
  document.getElementById("btnLogin")?.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  document.getElementById("btnRegister")?.addEventListener("click", (e) => { e.preventDefault(); doRegister(); });
  document.getElementById("btnLogout")?.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
  document.getElementById("btnActivatePaid")?.addEventListener("click", (e) => { e.preventDefault(); activatePaid(); });

  // Khôi phục cache → render → hydrate
  renderAuth();
  hydrateUser();

  // Expose debug
  window.debugAuthState = () => {
    console.log("[AUTH] state", state);
    console.log("[AUTH] isPaidUser()", isPaidUser());
    console.log("[AUTH] localStorage.auth_user", localStorage.getItem("auth_user"));
  };
})();

// =====================================================
// 🔒 CHẶN TOÀN BỘ TƯƠNG TÁC PREMIUM KHI CHƯA TRẢ PHÍ
// =====================================================
document.addEventListener("click", (e) => {
  // Cho phép các click nội bộ phục vụ highlight phân tích cách cục
  if (e.target.closest(".dong-phan-tich")) return;

  const premiumZone = e.target.closest("[data-premium]");
  if (!premiumZone) return;
  if (window.isPaidUser && window.isPaidUser()) return;
  // Chưa premium -> chặn hoàn toàn
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
}, true);

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupMoTaCachCuc");
  const content = document.getElementById("moTaContent");
  const textarea = document.getElementById("moTaText");
  const title = document.getElementById("moTaTitle");
  const btnEdit = document.getElementById("btnEditMoTa");
  const btnSave = document.getElementById("btnSaveMoTa");
  const btnClose = document.getElementById("btnCloseMoTa");
  const btnCloseX = document.getElementById("btnCloseMoTaX");

  // 📘 Mở popup khi click tên Cách Cục
  document.addEventListener("click", e => {
    // 🚧 Chặn nếu chưa premium
    if (!(window.isPaidUser && window.isPaidUser())) {
      if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
      return;
    }

    // ⛔ Bỏ qua click trong bảng tick hạn
    if (e.target.closest("#bangNhomSaoLuu")) return;

    const left = e.target.closest(".cc-left");
    if (!left) return;

    const index = left.dataset.index;
    const cc = CACH_CUC_DATA[index];
    if (!cc) return;

    popup.dataset.index = index;
title.innerHTML = `🪶 <b>${cc.ten}</b>`;
    content.innerHTML = cc.moTa?.trim() || "<i>Chưa có mô tả...</i>";
    textarea.value = cc.moTa || "";

    // reset trạng thái
    content.style.display = "block";
    textarea.style.display = "none";
    btnEdit.style.display = "inline-block";
    btnSave.style.display = "none";

    popup.style.display = "flex";
  });

  // ✏️ Chỉnh sửa
  btnEdit.addEventListener("click", () => {
    content.style.display = "none";
    textarea.style.display = "block";
    textarea.focus();
    btnEdit.style.display = "none";
    btnSave.style.display = "inline-block";
  });

  // 💾 Lưu
  btnSave.addEventListener("click", () => {
    const index = popup.dataset.index;
    const cc = CACH_CUC_DATA[index];
    const newText = textarea.value.trim();
    cc.moTa = newText;
    content.innerText = newText || "Chưa có mô tả...";
    content.style.display = "block";
    textarea.style.display = "none";
    btnEdit.style.display = "inline-block";
    btnSave.style.display = "none";
  });

  // ❌ Đóng popup
  [btnClose, btnCloseX].forEach(btn =>
    btn.addEventListener("click", () => (popup.style.display = "none"))
  );

  // 👆 Click ngoài khung để đóng
  popup.addEventListener("click", e => {
    if (e.target === popup) popup.style.display = "none";
  });
});

function openTab(evt, tabId) {
  // Ẩn tất cả nội dung tab
  document.querySelectorAll("#saoPopup .tab-content").forEach(el =>
    el.classList.remove("active")
  );

  // Bỏ active nút tab
  document.querySelectorAll("#saoPopup .tab-link").forEach(el =>
    el.classList.remove("active")
  );

  // Hiện tab được chọn
  document.getElementById(tabId).classList.add("active");

  // Active nút tab vừa bấm
  evt.currentTarget.classList.add("active");
}




function renderBangCungChuc(tenCung) {
  const tbl = document.getElementById("bangCungChuc");
  if (!tbl || !tenCung) return;

  const CUNG_CHUC = [
    "Mệnh", "Huynh Đệ", "Phu Thê", "Tử Tức", "Tài Bạch", "Tật Ách",
    "Thiên Di", "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"
  ];

  // Map cung gọi (Tý, Sửu, Dần...) → cung chức
  const rawChuc = window.dataGlobal?.cungChucMap?.[tenCung];
  const viTriChuc = rawChuc || null;

  tbl.innerHTML = `
    <tr>
      <th style="width:130px;">Cung</th>
      <th>Ý nghĩa</th>
    </tr>
  `;

  CUNG_CHUC.forEach(cung => {
    const isActive = (cung === viTriChuc) ? "active" : "";
    tbl.innerHTML += `
      <tr>
        <td class="${isActive}"><b>${cung}</b></td>
      </tr>
    `;
  });
}

window.showStarInfo = showStarInfo;

function showStarInfo(tenSao, tenCung) {
  console.log("📌 CLICK SAO:", tenSao, "tại cung", tenCung);

  // Luôn lưu lại tên sao và cung hiện tại
  window.currentSao = tenSao;
  window.currentCung = tenCung; // Cung Tý, Sửu, Dần,...

  const popup = document.getElementById("saoPopup");

  // Nếu popup chưa mở → dừng tại đây (để lần sau click lại mới mở)
  if (!popup || popup.style.display === "none") return;

  // Nếu popup đang mở → cập nhật lại nội dung
  renderBangCungChuc(tenCung);  // truyền cung để highlight bên Tab1 (nếu dùng)
  renderTab2(tenSao);           // render Tab 2 như cũ
  renderTab3(tenSao);           // render Tab 3 như cũ
}


// ===============================
// NÚT MỞ / ĐÓNG SIDEBAR TỪ ĐIỂN SAO
// ===============================
document.getElementById("btnToggleSidebar")
  .addEventListener("click", () => {
    document.getElementById("sidebarTraCuu")
      .classList.toggle("show");
  });

// 📌 Mặc định mở sidebar khi F5 để tránh lỗi cần click mới hiện
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebarTraCuu");
  if (sidebar) {
    sidebar.classList.add("show");
    console.log("🔔 Sidebar tra cứu đã mở mặc định");
  }
});

document.getElementById("btnOpenFullLaso").onclick = () => {
    const laso = document.getElementById("lasoContainer");
    const overlay = document.getElementById("fullLasoOverlay");
    const authPanel = document.getElementById("authPanel");

    if (!laso || !overlay) {
        console.error("Không tìm thấy overlay hoặc lasoContainer");
        return;
    }

    overlay.innerHTML = `
        <button id="btnExitFullLaso" style="
            position:fixed; top:10px; right:10px;
            padding:8px 14px; background:#ff4444;
            color:white; border:none; border-radius:8px;
            z-index:10000000;">✖</button>
    `;
    overlay.appendChild(laso);
    overlay.style.display = "block";
    if (authPanel) authPanel.style.display = "none";

    document.getElementById("btnExitFullLaso").onclick = () => {
        document.getElementById("lasoSection").appendChild(laso);
        overlay.style.display = "none";
        if (authPanel) authPanel.style.display = "";
    };
};
(function () {
  const ENABLE_DEBUG_LOG = true; // luôn bật log để debug tương tác
  if (!ENABLE_DEBUG_LOG && typeof console !== "undefined") {
    ["log", "debug", "info"].forEach(k => {
      if (console[k]) console[k] = () => {};
    });
  }
})();



