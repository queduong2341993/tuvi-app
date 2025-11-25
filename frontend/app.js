const API_BASE = 'https://tuvi-backend-d5gx.onrender.com';
const apiFetch = (path, options = {}) => fetch(API_BASE + path, { credentials: 'include', ...options });



// =====================================================
// đŸ•µï¸â€â™‚ï¸ DEBUG: Theo dĂµi má»i thay Ä‘á»•i giĂ¡ trá»‹ Cá»¥c Sá»‘
// -----------------------------------------------------
Object.defineProperty(window, "debugCucSo", {
  set(value) {
    console.groupCollapsed("â ï¸ CUC_SO bá»‹ gĂ¡n má»›i:", value);
    console.trace("Nguá»“n gá»‘c thay Ä‘á»•i:");
    console.groupEnd();

    // Ghi ngÆ°á»£c láº¡i vĂ o data chĂ­nh (náº¿u tá»“n táº¡i)
    if (window.DEBUG_DATA_CUC) {
      window.DEBUG_DATA_CUC.cucSo = value;
    }
  },
  get() {
    return window.DEBUG_DATA_CUC?.cucSo;
  }
});


// ======================================================
// đŸ—ºï¸ Báº¢N Äá»’ CUNG CHUáº¨N TOĂ€N Cá»¤C (layout NGHá»CH)
// ======================================================
window.mapCung = {
  "Dáº§n": 9, "MĂ£o": 7, "ThĂ¬n": 5, "Tá»µ": 1, "Ngá»": 2, "MĂ¹i": 3,
  "ThĂ¢n": 4, "Dáº­u": 6, "Tuáº¥t": 8, "Há»£i": 12, "TĂ½": 11, "Sá»­u": 10
};
const mapCung = window.mapCung; // Ä‘á»ƒ dĂ¹ng ngáº¯n gá»n

// ======================================================
// đŸ—ºï¸ TAM Há»¢P + Äá»I CUNG (chuáº©n layout NGHá»CH cá»§a báº¡n)
// ======================================================
const TAM_HOP_THEO_TEN = {
  "Tá»µ": ["Sá»­u", "Dáº­u"],
  "Ngá»": ["Dáº§n", "Tuáº¥t"],
  "MĂ¹i": ["MĂ£o", "Há»£i"],
  "ThĂ¢n": ["TĂ½", "ThĂ¬n"],
  "Dáº­u": ["Tá»µ", "Sá»­u"],
  "Tuáº¥t": ["Ngá»", "Dáº§n"],
  "Há»£i": ["MĂ¹i", "MĂ£o"],
  "TĂ½": ["ThĂ¢n", "ThĂ¬n"],
  "Sá»­u": ["Tá»µ", "Dáº­u"],
  "Dáº§n": ["Ngá»", "Tuáº¥t"],
  "MĂ£o": ["Há»£i", "MĂ¹i"],
  "ThĂ¬n": ["TĂ½", "ThĂ¢n"]
};

const DOI_CUNG_THEO_TEN = {
  "Tá»µ": "Há»£i", "Ngá»": "TĂ½", "MĂ¹i": "Sá»­u", "ThĂ¢n": "Dáº§n",
  "Dáº­u": "MĂ£o", "Tuáº¥t": "ThĂ¬n", "Há»£i": "Tá»µ", "TĂ½": "Ngá»",
  "Sá»­u": "MĂ¹i", "Dáº§n": "ThĂ¢n", "MĂ£o": "Dáº­u", "ThĂ¬n": "Tuáº¥t"
};

// đŸ” Sinh TAM_HOP vĂ  DOI_CUNG toĂ n cá»¥c
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
// đŸ§© Táº¡o database náº¿u chÆ°a cĂ³ (Ă©p onupgradeneeded cháº¡y 1 láº§n)
// =====================================================
(function initDB() {
  const req = indexedDB.open("TuViDB", 1);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("đŸ†• ÄĂ£ táº¡o store 'jsonStore' (initDB cháº¡y láº§n Ä‘áº§u)");
    }
  };
  req.onsuccess = () => console.log("âœ… IndexedDB sáºµn sĂ ng");
  req.onerror = e => console.warn("â ï¸ Lá»—i khá»Ÿi táº¡o DB:", e);
})();

// =====================================================
// đŸ§± PHáº¦N 1: KHá»I Táº O LĂ Sá» TRáº®NG (Tá»I Æ¯U AN TOĂ€N, KHĂ”NG Äá»”I Cáº¤U TRĂC)
// =====================================================
window.saoToCung = {}; // đŸª LÆ°u vá»‹ trĂ­ sao chĂ­nh tinh toĂ n cá»¥c cho cĂ¡c lá»›p sau

function taoLaSoTrang(data) {
  window.dataGlobal = data;
  if (!data.thangAm && Array.isArray(data.lunar)) {
    data.thangAm = data.lunar[1];
    window.dataGlobal.thangAm = data.lunar[1];
  }
// đŸŒ™ Bá»• sung: Ä‘áº£m báº£o luĂ´n cĂ³ thĂ¡ng Ă¢m sinh (chá»‰ láº¥y tá»« lá»‹ch Ă¢m)
if (!window.dataGlobal.thangAm) {
  if (Array.isArray(data.lunar)) {
    // Náº¿u lunar lĂ  máº£ng [ngĂ y, thĂ¡ng, nÄƒm]
    window.dataGlobal.thangAm = data.lunar[1];
  } else if (data.lunar && typeof data.lunar === "object" && data.lunar.thang) {
    // Náº¿u lunar lĂ  object {ngay, thang, nam}
    window.dataGlobal.thangAm = data.lunar.thang;
  } else if (data.thangSinh) {
    // Náº¿u cĂ³ biáº¿n thangSinh (Ä‘Ă£ lĂ  Ă¢m)
    window.dataGlobal.thangAm = data.thangSinh;
  } else {
    console.warn("â ï¸ KhĂ´ng cĂ³ dá»¯ liá»‡u thĂ¡ng Ă¢m sinh, chÆ°a thá»ƒ an sao TheoThangSinh!");
  }
  console.log("đŸŒ™ ThĂ¡ng Ă¢m sinh:", window.dataGlobal.thangAm);
}


  const container = document.getElementById("lasoContainer");
  if (!container) return;

  // â¡ áº¨n container trong lĂºc render Ä‘á»ƒ giáº£m reflow
  const oldDisplay = container.style.display;
  container.style.display = "none";
  container.innerHTML = "";

  // ==============================
  // đŸ”¹ Táº¡o 12 Ă´ cung cÆ¡ báº£n
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
  // đŸ”¹ Ă” trung tĂ¢m
  // ==============================
  const { name, gender, menh, canChiNam, canChiThang, canChiNgay, canChiGio, lunar } = data;
  const center = document.createElement("div");
  center.id = "centerCell";
  center.innerHTML = `
    <div class="title">LĂ Sá» Tá»¬ VI<br><span style="font-size:16px;font-style:italic;color:#c44;">An lĂ¡ sá»‘ táº¡i tuvitoanthu.com</span></div>
<div id="showCatHungToggle">
  <label>
    <input type="checkbox" id="toggleCatHung" />
    Äá»‹nh CĂ¡t Hung - CĂ¡ch cá»¥c
  </label>
</div>

    <div class="info-line"><b>Há» vĂ  tĂªn:</b> ${name}</div>
    <div class="info-line"><b>Giá»›i tĂ­nh:</b> ${gender}</div>
    <div class="info-line"><b>Má»‡nh:</b> ${menh}</div>
   <div class="info-line">
  <b>Cá»¥c sá»‘:</b>
  <span id="cucSoText">(Ä‘ang xĂ¡c Ä‘á»‹nh...)</span>
</div>

    <div class="info-line">
      <b>NÄƒm:</b> ${lunar[2]} &nbsp;|&nbsp;
      <b>ThĂ¡ng:</b> ${lunar[1]} &nbsp;|&nbsp;
      <b>NgĂ y:</b> ${lunar[0]} &nbsp;|&nbsp;
      <b>Giá»:</b> ${canChiGio.split(" ")[1]}
    </div>
    <div class="sub-info">${canChiNam} â€¢ ${canChiThang} â€¢ ${canChiNgay} â€¢ ${canChiGio}</div>
  `;
  container.appendChild(center);
// Tick máº·c Ä‘á»‹nh khi load lĂ¡ sá»‘
const chk = document.getElementById("toggleCatHung");
if (chk) chk.checked = true;

  // ==============================
  // đŸ”¹ Cache nhanh danh sĂ¡ch cung
  // ==============================
  window.cungNodes = Array.from(container.querySelectorAll(".cung"));

  // ==============================
  // đŸ”¹ Báº­t hiá»ƒn thá»‹ láº¡i sau khi render xong
  // ==============================
  container.style.display = oldDisplay || "grid";

  // ==============================
  // đŸ”¹ Gáº¯n sá»± kiá»‡n tĂ­nh tuá»•i & toggle lÆ°u váº­n
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
// đŸª„ PHáº¦N 2: KHAI BĂO GIá»œ Äá»A CHI (KHĂ”NG Gáº®N VĂ€O DROPDOWN Ná»®A)
// =====================================================

// Giá»¯ láº¡i máº£ng ZHOURS Ä‘á»ƒ cĂ¡c hĂ m khĂ¡c cĂ³ thá»ƒ dĂ¹ng
const ZHOURS = [
  { label: "TĂ½ (00:00â€“00:59)", value: "0" },
  { label: "Sá»­u (01:00â€“02:59)", value: "1" },
  { label: "Dáº§n (03:00â€“04:59)", value: "3" },
  { label: "MĂ£o (05:00â€“06:59)", value: "5" },
  { label: "ThĂ¬n (07:00â€“08:59)", value: "7" },
  { label: "Tá»µ (09:00â€“10:59)", value: "9" },
  { label: "Ngá» (11:00â€“12:59)", value: "11" },
  { label: "MĂ¹i (13:00â€“14:59)", value: "13" },
  { label: "ThĂ¢n (15:00â€“16:59)", value: "15" },
  { label: "Dáº­u (17:00â€“18:59)", value: "17" },
  { label: "Tuáº¥t (19:00â€“20:59)", value: "19" },
  { label: "Há»£i (21:00â€“22:59)", value: "21" },
  { label: "TĂ½ (23:00â€“23:59)", value: "23" }
];


// =====================================================
// đŸ—“ï¸ HĂ m láº¥y ngĂ y Ă¢m theo giá» - Dá»±a vĂ o báº£ng Ä‘Ă£ tĂ­nh sáºµn
// =====================================================

function layNgayAmTheoGio(solarDay, solarMonth, solarYear, hour, bangAm) {
  const ngayObj = (
    bangAm?.[solarYear]?.[solarMonth]?.[solarDay] ||
    { dAm: 1, mAm: 1, yAm: solarYear }
  );

  let dAm = ngayObj.dAm;
  let mAm = ngayObj.mAm;
  let yAm = ngayObj.yAm;

  // â™ï¸ Äiá»u chá»‰nh theo Giá» TĂ½
  if (hour === 23) {
    // âœ… Náº¿u Ä‘Ă£ tá»«ng xá»­ lĂ½ Giá» TĂ½ (khi lÆ°u), khĂ´ng cá»™ng thĂªm
    if (window.dataGlobal?.daXuLyGioTy) {
      console.log("đŸ•› Giá» TĂ½ Ä‘Ă£ Ä‘Æ°á»£c xá»­ lĂ½ khi lÆ°u â€” bá» qua cá»™ng ngĂ y Ă¢m.");
      return [dAm, mAm, yAm];
    }

    console.log("đŸ•› Giá» TĂ½ sau â€“ tÄƒng 1 ngĂ y Ă‚m lá»‹ch");
    return congNgayAm(dAm, mAm, yAm, bangAm); // TĂ½ sau â†’ qua ngĂ y
  }

  if (hour === 0) {
    console.log("đŸ• Giá» TĂ½ Ä‘áº§u â€“ giá»¯ nguyĂªn ngĂ y Ă‚m lá»‹ch");
    return [dAm, mAm, yAm];
  }

  return [dAm, mAm, yAm]; // Giá» khĂ¡c â†’ giá»¯ nguyĂªn
}

// đŸ”§ Cá»™ng thĂªm 1 ngĂ y Ă‚m lá»‹ch
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
// đŸ—“ï¸ KHá»I Táº O NGĂ€Y / THĂNG / NÄ‚M
// =====================================================
function populateSelectors() {
  const dSel = document.getElementById("day");
  const mSel = document.getElementById("month");
  const ySel = document.getElementById("year");

  // NgĂ y
  for (let d = 1; d <= 31; d++) {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    if (d === 20) o.selected = true;
    dSel.appendChild(o);
  }

  // ThĂ¡ng
  for (let m = 1; m <= 12; m++) {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = "ThĂ¡ng " + m;
    if (m === 12) o.selected = true;
    mSel.appendChild(o);
  }

  // NÄƒm
  for (let y = 1900; y <= 2100; y++) {
    const o = document.createElement("option");
    o.value = y;
    o.textContent = y;
    if (y === 2025) o.selected = true;
    ySel.appendChild(o);
  }
 }

/* =====================================================
   đŸ§® PHáº¦N 3: THUáº¬T TOĂN Há»’ NGá»ŒC Äá»¨C
   -----------------------------------------------------
   Gá»“m cĂ¡c hĂ m lĂµi:
   - TĂ­nh ngĂ y Julius
   - TĂ­nh ngĂ y SĂ³c (New Moon)
   - TĂ­nh thĂ¡ng nhuáº­n
   - Chuyá»ƒn Ä‘á»•i Ă‚m â‡† DÆ°Æ¡ng
   ===================================================== */

// -------------------------------
// đŸ”¹ Báº¢NG THIĂN CAN â€“ Äá»A CHI
// -------------------------------
const CAN = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
const CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
const TZ = 7; // MĂºi giá» Viá»‡t Nam (UTC+7)

// -------------------------------
// đŸ”¹ TĂNH NGĂ€Y JULIUS
// -------------------------------
function jdFromDate(dd, mm, yy) {
  // Äá»•i ngĂ y dÆ°Æ¡ng sang sá»‘ Julius
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
  // Äá»•i sá»‘ Julius vá» ngĂ y dÆ°Æ¡ng
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
// đŸŒ‘ TĂNH NGĂ€Y SĂ“C (NEW MOON)
// -------------------------------
function NewMoon(k) {
  // Tráº£ vá» sá»‘ Julius cá»§a ká»³ SĂ³c thá»© k ká»ƒ tá»« 1/1/1900
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
// â˜€ï¸ Vá» TRĂ Máº¶T TRá»œI
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
// đŸŒ™ XĂC Äá»NH THĂNG Ă‚M VĂ€ THĂNG NHUáº¬N
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
// đŸ” CHUYá»‚N Äá»”I Ă‚M â‡† DÆ¯Æ NG
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
  if (lunarMonth >= 11 && diff < 4) lunarYear += 1; // giá»¯ nguyĂªn táº¡m thá»i

  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}
// =====================================================
// đŸ§­ FIX: Giá»¯ nÄƒm Ă¢m theo báº£ng khá»Ÿi thĂ¡ng (chá»‰ qua 1/1 Ă¢m má»›i Ä‘á»•i nÄƒm)
// =====================================================
if (window.dataGlobal && window.dataGlobal.thangAm) {
  const thangAm = Number(window.dataGlobal.thangAm);
  
  // Náº¿u Ä‘ang á»Ÿ thĂ¡ng 11 hoáº·c 12 Ă¢m thĂ¬ khĂ´ng cho Ä‘á»•i nÄƒm Ă¢m
  if (thangAm === 11 || thangAm === 12) {
    // Náº¿u Ä‘ang bá»‹ lá»‡ch do cĂ´ng thá»©c Há»“ Ngá»c Äá»©c thĂ¬ khĂ´i phá»¥c
    if (lunar[2] > year) {
      lunar[2] = year;       // Giá»¯ nguyĂªn nÄƒm hiá»‡n táº¡i
    }
    if (lunar[2] < year - 1) {
      lunar[2] = year - 1;   // Giá»¯ Ä‘Ăºng nÄƒm Ă¢m trÆ°á»›c náº¿u trÆ°á»›c Táº¿t
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
   đŸ§­ PHáº¦N 4: CAN CHI â€“ Má»†NH â€“ CHUYá»‚N Äá»”I
   -----------------------------------------------------
   - TĂ­nh Can Chi theo nÄƒm, thĂ¡ng, ngĂ y, giá»
   - TĂ­nh Má»‡nh Ă‚m/DÆ°Æ¡ng
   - Xá»­ lĂ½ nĂºt "Chuyá»ƒn Ä‘á»•i"
   ===================================================== */

// -------------------------
// đŸ”¹ Báº¢NG CAN THĂNG THEO CAN NÄ‚M
// -------------------------
const CAN_THANG = {
 "GiĂ¡p":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
 "áº¤t":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
 "BĂ­nh":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
 "Äinh":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
 "Máº­u":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"],
 "Ká»·":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
 "Canh":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
 "TĂ¢n":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
 "NhĂ¢m":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
 "QuĂ½":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"]
};

// -------------------------
// đŸ”¹ HĂ€M TĂNH CAN CHI
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
// đŸ’« TĂNH Má»†NH Ă‚M DÆ¯Æ NG NAM/Ná»®
// -------------------------
function tinhMenhAD(canChiNam, gender){
  const can = canChiNam.split(" ")[0];
  const duong = ["GiĂ¡p","BĂ­nh","Máº­u","Canh","NhĂ¢m"];
  const m = duong.includes(can) ? "DÆ°Æ¡ng" : "Ă‚m";
  if (m==="DÆ°Æ¡ng" && gender==="Nam") return "DÆ°Æ¡ng Nam";
  if (m==="DÆ°Æ¡ng" && gender==="Ná»¯") return "DÆ°Æ¡ng Ná»¯";
  if (m==="Ă‚m" && gender==="Nam") return "Ă‚m Nam";
  return "Ă‚m Ná»¯";
}

// -------------------------
// đŸ” Cáº¬P NHáº¬T THĂNG Ă‚M NHUáº¬N
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
      o.value=m; o.textContent="ThĂ¡ng "+m;
      mSel.appendChild(o);
    }
  } else {
    const leap=getLeapMonthOfYear(year,TZ);
    for(let m=1;m<=12;m++){
      const o=document.createElement("option");
      o.value=m; o.textContent="ThĂ¡ng "+m;
      mSel.appendChild(o);
      if(m===leap){
        const n=document.createElement("option");
        n.value=m+"_nhuan";
        n.textContent="ThĂ¡ng "+m+" (nhuáº­n)";
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
    // XĂ³a Táº¤T Cáº¢ cĂ¡c layer Ä‘á»™ng trong cung
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

  // reset map gĂ¡n sao
  window.saoToCung = {};

  // reset dataGlobal
  if (window.dataGlobal) {
    delete window.dataGlobal.cungChucMap;
    delete window.dataGlobal.tenCungMenh;
    delete window.dataGlobal.cucSo;
  }

  console.log("â™»ï¸ ÄĂƒ RESET LĂ Sá» â€“ Sáº´NG SĂ€NG AN Láº I");
}


// -------------------------
// đŸ”˜ NĂT "CHUYá»‚N Äá»”I"
// -------------------------

document.getElementById("convert").addEventListener("click", async ()=>{
resetChart();

  const name=document.getElementById("name").value.trim()||"NgÆ°á»i dĂ¹ng";
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
  // đŸ“¡ Gá»i backend chuyá»ƒn Ä‘á»•i Ă¢m/dÆ°Æ¡ng (giá»¯ nguyĂªn cĂ´ng thá»©c)
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
    console.error("âŒ Lá»—i gá»i /api/convert:", err);
    alert("KhĂ´ng gá»i Ä‘Æ°á»£c backend Ä‘á»ƒ chuyá»ƒn Ä‘á»•i lá»‹ch. Vui lĂ²ng kiá»ƒm tra server.");
    return;
  }

  const { solar = {}, lunar: lunarObj = {}, canChi = {}, menh: menhApi } = apiData || {};

  // đŸ—“ï¸ Ăp dá»¥ng káº¿t quáº£ tá»« backend
  day = Number(solar.day);
  month = Number(solar.month);
  year = Number(solar.year);
  lunar = [
    Number(lunarObj.day),
    Number(lunarObj.month),
    Number(lunarObj.year),
    lunarObj.leap ? 1 : 0
  ];


// âœ… Äáº£m báº£o cĂ³ thĂ¡ng Ă¢m cho Tiá»ƒu Tinh
if (!window.dataGlobal) window.dataGlobal = {};
window.dataGlobal.thangAm = (Array.isArray(lunar) && Number(lunar[1]))
  ? Number(lunar[1])
  : (type === "lunar" ? Number(document.getElementById("month").value) : 1);



  // đŸŒ“ TĂNH CAN CHI + Má»†NH (Æ°u tiĂªn cĂ´ng thá»©c local Ä‘á»ƒ cĂ³ dáº¥u chuáº©n)
  const canY = canChiYear(lunar[2]);
  const canM = canChiMonth(lunar[2], lunar[1]);
  const canD = canChiDay(year, month, day);
  let jd = jdFromDate(day, month, year);

// âœ… Giá» TĂ½ (23h) thuá»™c vá» ngĂ y hĂ´m sau theo quy táº¯c Tá»­ Vi
if (hour === 23) {
  jd += 1;
  console.log("đŸ•› Giá» TĂ½ sau â†’ tĂ­nh Can Chi giá» theo ngĂ y hĂ´m sau");
}

const canH = canChiHour(hour, (jd + 9) % 10);

  const menh = menhApi || tinhMenhAD(canY, gender);


// =====================================================
// đŸŒŸ Táº O DATA CHO TOĂ€N Bá»˜ LĂ Sá»
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


  // đŸª HIá»‚N THá» Káº¾T QUáº¢
  html = `
  <table>
    <tr><th></th><th>DÆ°Æ¡ng lá»‹ch</th><th>Ă‚m lá»‹ch</th><th>Can Chi</th></tr>
    <tr><td>NÄƒm</td><td>${year}</td><td>${lunar[2]}</td><td>${canY}</td></tr>
    <tr><td>ThĂ¡ng</td><td>${month}</td><td>${lunar[1]}${lunar[3]?" (nhuáº­n)":""}</td><td>${canM}</td></tr>
    <tr><td>NgĂ y</td><td>${day}</td><td>${lunar[0]}</td><td>${canD}</td></tr>
    <tr><td>Giá»</td>
        <td>${ZHOURS.find(z=>z.value==hour).label}</td>
        <td>${ZHOURS.find(z=>z.value==hour).label}</td>
        <td>${canH}</td></tr>
    <tr><td colspan="4" style="font-style:italic;background:#fafafa;font-size:13px;">
      ${name} â€“ ${menh} â€“ ${day}/${month}/${year}
      â‡” ${lunar[0]}/${lunar[1]}${lunar[3]?"(nhuáº­n)":""}/${lunar[2]} (Ă‚m)
    </td></tr>
  </table>`;

  document.getElementById("output").innerHTML = html;

  // đŸŒŸ Táº O LĂ Sá» TRáº®NG (chuáº©n bá»‹ an sao sau nĂ y)
    // đŸŒŸ An lá»›p 2 (Má»‡nh) trÆ°á»›c Ä‘á»ƒ láº¥y vá»‹ trĂ­ cung Má»‡nh
 function xacDinhThanCung(gioSinhChi) {
  switch (gioSinhChi) {
    case "TĂ½": case "Ngá»":
      return "Má»‡nh";
    case "Dáº§n": case "ThĂ¢n":
      return "Quan Lá»™c";
    case "Tuáº¥t": case "ThĂ¬n":
      return "TĂ i Báº¡ch";
    case "Sá»­u": case "MĂ¹i":
      return "PhĂºc Äá»©c";
    case "Tá»µ": case "Há»£i":
      return "Phu ThĂª";
    case "MĂ£o": case "Dáº­u":
      return "ThiĂªn Di";
    default:
      return "Má»‡nh"; // fallback an Má»‡nh náº¿u khĂ´ng xĂ¡c Ä‘á»‹nh
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

// đŸŒŸ Táº¡o lĂ¡ sá»‘ (cĂ³ thĂªm thĂ´ng tin cung Má»‡nh)
taoLaSoTrang({
  name, gender, menh,
  canChiNam: canY,
  canChiThang: canM,
  canChiNgay: canD,
  canChiGio: canH,
  lunar,
  amduongMenh: menh,
  cungMenh,
  cucSo: "" // Ä‘á»ƒ trá»‘ng, sáº½ cáº­p nháº­t sau
});


// âœ… Cáº­p nháº­t dá»¯ liá»‡u toĂ n cá»¥c
window.dataGlobal = window.dataGlobal || {};
window.dataGlobal.thangAm = (Array.isArray(lunar) && Number(lunar[1]))
  ? Number(lunar[1])
  : (document.getElementById("calendarType").value === "lunar"
      ? Number(document.getElementById("month").value)
      : 1);
// âœ… Sau khi táº¡o xong DOM lĂ¡ sá»‘, an láº§n lÆ°á»£t cĂ¡c lá»›p chuáº©n thá»© tá»±
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
// đŸ”§ Äáº£m báº£o dataGlobal cĂ³ dá»¯ liá»‡u Má»‡nh vĂ  Cá»¥c sá»‘
if (!window.dataGlobal || Object.keys(window.dataGlobal).length === 0) {
  window.dataGlobal = data; // giá»¯ nguyĂªn tham chiáº¿u
}

  // đŸ§© Äáº£m báº£o dá»¯ liá»‡u nÄƒm sinh cĂ³ sáºµn trong dataGlobal
  if (!window.dataGlobal.canChiNam || !window.dataGlobal.canChiNam.includes(" ")) {
    const canY = canChiYear(window.dataGlobal.lunar?.[2] || new Date().getFullYear());
    window.dataGlobal.canChiNam = canY;
    console.log("â™ï¸ Bá»• sung canChiNam vĂ o dataGlobal:", canY);
  }

// đŸŒŸ 1ï¸âƒ£ Lá»›p cÆ¡ báº£n
anLop1_ViTriCung(data);
const cungMenh = anLop2_Menh(data);
// Äá»“ng bá»™ cung/ten Má»‡nh vá»«a an
if (cungMenh) {
  data.cungMenh = cungMenh;
  data.tenCungMenh = window.dataGlobal.tenCungMenh || cungMenh;
}

// âœ… GĂ¡n Cung Má»‡nh tháº­t (cĂ³ thá»ƒ chÆ°a cĂ³ cungChucMap ngay)
const cungChucMapSafe = window.dataGlobal.cungChucMap || {};
let tenCungMenh = Object.keys(cungChucMapSafe)
  .find(k => cungChucMapSafe[k] === "Má»†NH");

// đŸ”„ Fallback náº¿u chÆ°a tĂ¬m Ä‘Æ°á»£c tĂªn cung Má»‡nh
if (!tenCungMenh && typeof window.mapCung === "object") {
  const revMap = Object.fromEntries(Object.entries(window.mapCung).map(([k, v]) => [v, k]));
  if (window.dataGlobal.cungMenh && revMap[window.dataGlobal.cungMenh]) {
    tenCungMenh = revMap[window.dataGlobal.cungMenh];
  }
}

window.dataGlobal.tenCungMenh = tenCungMenh || window.dataGlobal.tenCungMenh || "";
if (tenCungMenh) window.dataGlobal.tenCungMenh = tenCungMenh;
if (tenCungMenh) data.tenCungMenh = tenCungMenh;

console.log("đŸ§­ tenCungMenh:", window.dataGlobal.tenCungMenh);


// đŸŒŸ Cáº­p nháº­t láº¡i pháº§n hiá»ƒn thá»‹ trung tĂ¢m
const elCucSo = document.querySelector("#cucSoText, .info-line b + span");
if (elCucSo) {
  const cucSoValue = data?.cucSo || window.dataGlobal?.cucSo || "(Ä‘ang xĂ¡c Ä‘á»‹nh)";
  elCucSo.textContent = cucSoValue;
  console.log("đŸŸ¢ ÄĂ£ cáº­p nháº­t hiá»ƒn thá»‹ Cá»¥c Sá»‘:", cucSoValue);
}




// đŸŒŸ 2ï¸âƒ£ ChĂ­nh tinh & Cá»¥c sá»‘ (sau khi Má»‡nh Ä‘Ă£ sáºµn sĂ ng)
setTimeout(() => {
  // â³ Äá»£i tá»›i khi cĂ³ tenCungMenh tháº­t
  const checkAndRunCucSo = () => {
    const data = window.dataGlobal;
    if (!data?.tenCungMenh || typeof data.tenCungMenh !== "string") {
      console.log("â¸ï¸ Äang Ä‘á»£i xĂ¡c Ä‘á»‹nh tĂªn Cung Má»‡nh...");
      return setTimeout(checkAndRunCucSo, 800); // kiá»ƒm tra láº¡i sau 0.2s
    }
    console.log("âœ… ÄĂ£ cĂ³ tĂªn cung Má»‡nh:", data.tenCungMenh);
// đŸ§© Bá»• sung Cá»¥c Sá»‘ náº¿u chÆ°a cĂ³
if (!data.cucSo || data.cucSo === "") {
  data.cucSo = xacDinhCucSo(data.canChiNam, data.tenCungMenh);
  window.dataGlobal.cucSo = data.cucSo;
  console.log(`đŸŒ€ Cá»¥c Sá»‘ Ä‘Æ°á»£c gĂ¡n trÆ°á»›c khi gá»i anLop4: ${data.cucSo}`);
}

    anLop4_CucSo(data);
    anLop5_NguHanhCung();
    if (typeof anLop3_ChinhTinh === "function") {
      anLop3_ChinhTinh(data);
    }

    // đŸŒŸ Cáº­p nháº­t hiá»ƒn thá»‹ trung tĂ¢m (náº¿u cĂ³)
    const elCucSo = document.querySelector("#cucSoText, .info-line b + span");
    if (elCucSo) {
      elCucSo.textContent = data.cucSo || "(chÆ°a xĂ¡c Ä‘á»‹nh)";
      console.log("đŸŸ¢ ÄĂ£ cáº­p nháº­t hiá»ƒn thá»‹ Cá»¥c Sá»‘:", elCucSo.textContent);
    }
    console.log("âœ… Cá»¥c sá»‘ vĂ  NgÅ© hĂ nh Ä‘Ă£ Ä‘Æ°á»£c an xong");
  };
  checkAndRunCucSo();
}, 300);



// đŸŒŸ 3ï¸âƒ£ Trung tinh (CĂ¡t + Hung) â€“ ná»n táº£ng cho Tiá»ƒu tinh
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;

  // đŸ§© Äáº£m báº£o cungChucMap tá»“n táº¡i trÆ°á»›c khi an Trung tinh
  if (!data.cungChucMap) {
    const mapMoi = anLop2_Menh(data);
    if (mapMoi) data.cungChucMap = mapMoi;
  }

  // đŸ§© Äá»“ng bá»™ tĂªn cung Má»‡nh sau khi anLop2_Menh
  if (!data.tenCungMenh && window.dataGlobal?.tenCungMenh) {
    data.tenCungMenh = window.dataGlobal.tenCungMenh;
  }

  // đŸ§© Äáº£m báº£o cĂ³ Cá»¥c Sá»‘ + ChĂ­nh Tinh trÆ°á»›c khi an Trung tinh
  if (!data.cucSo || data.cucSo === "") {
    const tenMenh = data.tenCungMenh || window.dataGlobal.tenCungMenh;
    const cuc = xacDinhCucSo(data.canChiNam, tenMenh);
    data.cucSo = cuc;
    window.dataGlobal.cucSo = cuc;
  }
  if (typeof anLop3_ChinhTinh === "function") {
    anLop3_ChinhTinh(data);
  }

  console.log("đŸŒ€ Báº¯t Ä‘áº§u an Trung tinh...");
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
  console.log("âœ… Trung tinh Ä‘Ă£ Ä‘Æ°á»£c an xong");
}, 1500);

// đŸŒŸ 4ï¸âƒ£ Tiá»ƒu tinh (phá»¥ thuá»™c Trung tinh)
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) {
    console.warn("â ï¸ ChÆ°a cĂ³ dataGlobal, bá» qua an sao.");
    return;
  }
  console.log("đŸŒ¸ Báº¯t Ä‘áº§u an Tiá»ƒu tinh...");
  if (typeof anTieuTinh === "function") anTieuTinh(data);
  if (typeof taoNutTieuTinh === "function") taoNutTieuTinh();
  console.log("âœ… Tiá»ƒu tinh Ä‘Ă£ Ä‘Æ°á»£c an xong");
}, 2000);


// đŸŒŸ 5ï¸âƒ£ Tuáº§n & Triá»‡t
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
  const canNam = data.canChiNam?.split(" ")[0];
  const chiNam = data.canChiNam?.split(" ")[1];
  if (!canNam || !chiNam) return;
  const [t1, t2] = anTuan(canNam, chiNam);
  const [r1, r2] = anTriet(canNam);
  if (t1 && t2) veThanhTuanTriet("TUáº¦N", t1, t2);
  if (r1 && r2) veThanhTuanTriet("TRIá»†T", r1, r2);
}, 1700);

// đŸŒŸ 6ï¸âƒ£ ThĂªm chá»¯ [THĂ‚N] (cháº¡y cuá»‘i cĂ¹ng)
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;
  const gioChi = (data.canChiGio || "").split(" ")[1];
  if (!gioChi) return;

  const cungThan = xacDinhCungThan(gioChi, data.cungChucMap);
  if (!cungThan) return;

  const CUNG_TO_CELL = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
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
    span.textContent = "[THĂ‚N]";
    span.style.fontWeight = "bold";
    span.style.marginLeft = "3px";
    span.style.letterSpacing = "-0.3px";
    span.style.display = "inline";
    span.style.color = titleEl.style.color || "#000";
    span.style.textTransform = "uppercase";
    titleEl.appendChild(span);
  }
ensureXemHanSection();

  console.log("âœ… ThĂªm [THĂ‚N] táº¡i", cungThan);

// đŸŒŸ Tá»° Äá»˜NG AN SAO LÆ¯U SAU KHI AN LĂ Sá» XONG
setTimeout(() => {
  const data = window.dataGlobal;
  if (!data) return;

  try {
    // đŸ§¹ XĂ³a sao LÆ°u cÅ© (náº¿u cĂ³)
    if (typeof xoaSaoLuu === "function") xoaSaoLuu();

    // đŸŒ An sao theo 4 cáº¥p váº­n (Äáº¡i / Tiá»ƒu / Nguyá»‡t / Nháº­t)
    if (typeof anSaoLuu_DaiVan === "function") anSaoLuu_DaiVan(data);
    if (typeof anSaoLuu_TieuVan === "function") anSaoLuu_TieuVan(data);
    if (typeof anSaoLuu_NguyetVan === "function") anSaoLuu_NguyetVan(data);
    if (typeof anSaoLuu_NhatVan === "function") anSaoLuu_NhatVan(data);

    // đŸ” Cáº­p nháº­t hiá»ƒn thá»‹ tick nhĂ³m áº©n/hiá»‡n (náº¿u báº£ng Ä‘Ă£ cĂ³)
    if (typeof window.__capNhatHienThiSaoLuu === "function")
      window.__capNhatHienThiSaoLuu();

    console.log("âœ¨ ÄĂ£ tá»± Ä‘á»™ng an sao LÆ°u sau khi an lĂ¡ sá»‘");
  } catch (err) {
    console.error("â ï¸ Lá»—i khi tá»± Ä‘á»™ng an sao LÆ°u:", err);
  }
}, 1500);





  // đŸŒ™ Sau khi an xong toĂ n bá»™ lĂ¡ sá»‘ â€“ kiá»ƒm tra & gáº¯n láº¡i khung Xem Háº¡n (Ă‚m Lá»‹ch)

  if (!document.getElementById("xemHanSection")) {
    const hanDiv = document.createElement("div");
    hanDiv.innerHTML = `
      <div id="xemHanSection" style="text-align:center; margin-top:6px; font-family:'Segoe UI',sans-serif;">
        <h3 style="font-size:14px; margin-bottom:6px; display:flex; align-items:center; justify-content:center; gap:4px;">
          <span style="font-size:16px;">đŸ”®</span>
          <span style="font-weight:600;">Xem Háº¡n (Ă‚m Lá»‹ch)</span>
        </h3>
        <div style="display:inline-flex; align-items:center; gap:3px; flex-wrap:wrap; justify-content:center; font-size:12px;">
          <label for='luuNam'>NÄƒm:</label>
          <input type='number' id='luuNam' min='1900' max='2100'
                 style='width:60px;height:20px;text-align:center;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <label for='luuThang'>Th:</label>
          <input type='number' id='luuThang' min='1' max='12'
                 style='width:45px;height:20px;text-align:center;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <label for='luuNgay'>Ng:</label>
          <input type='number' id='luuNgay' min='1' max='30'
                 style='width:45px;height:20px;text-align:centdocument.getElementByIder;border:1px solid #aaa;border-radius:3px;font-size:11px;'>
          <span id='tuoiAmLabel' style='margin-left:6px;font-weight:bold;color:#c00;font-size:12px;'>Tuá»•i: â€”</span>
        </div>
        <div style='margin-top:6px;'>
          <button id='btnToggleLuuVan'
                  style='background:#337ab7;color:white;border:none;border-radius:5px;
                         padding:3px 8px;font-size:11px;cursor:pointer;'>
            áº¨n/Hiá»‡n Äáº¡i Váº­n & Tiá»ƒu Váº­n
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(hanDiv);

    // đŸ”— KĂ­ch hoáº¡t láº¡i cĂ¡c sá»± kiá»‡n
    document.getElementById("btnToggleLuuVan").addEventListener("click", () => {
      document.querySelectorAll(".layer-9,.layer-10").forEach(e => {
        e.style.display = (e.style.display === "none" ? "" : "none");
      });
    });

  ["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // đŸ§¹ xĂ³a sá»± kiá»‡n cÅ© (náº¿u cĂ³)
    el.addEventListener("change", capNhatHan);    // đŸ” gáº¯n láº¡i má»›i
  }
});

// âœ… Gáº¯n láº¡i sá»± kiá»‡n sau khi khung Ä‘Ă£ táº¡o xong
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

    console.log("đŸ” ÄĂ£ gáº¯n láº¡i khung Xem Háº¡n (Ă‚m Lá»‹ch) sau khi an lĂ¡ sá»‘");
  }


}, 2100);	
}); // âœ… Ä‘Ă³ng setTimeout bao ngoĂ i
}); // âœ… Ä‘Ă³ng event listener click


  

["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // đŸ§¹ xĂ³a sá»± kiá»‡n cÅ© (náº¿u cĂ³)
    el.addEventListener("change", capNhatHan);    // đŸ” gáº¯n láº¡i má»›i
  }
});

  console.log("âœ… Khung Xem Háº¡n (Ă‚m Lá»‹ch) Ä‘Æ°á»£c gáº¯n láº¡i sau khi táº¡o lĂ¡ sá»‘");


});

// =====================================================
// đŸ” Cáº¬P NHáº¬T CAN CHI NÄ‚M Ă‚M (tá»± Ä‘á»™ng khi nháº­p nÄƒm)
// =====================================================
function showCanChiYear() {
  const yearInput = document.getElementById("monthYear");
  const label = document.getElementById("canChiLabel");
  const val = parseInt(yearInput.value);
  if (!isNaN(val)) {
    label.textContent = canChiYear(val); // âœ… dĂ¹ng hĂ m cĂ³ sáºµn cá»§a báº¡n
  } else {
    label.textContent = "";
  }
}

/* =======================================================
   đŸ”¹ HĂ€M TOĂ€N Cá»¤C: XĂC Äá»NH CUNG Má»†NH (cháº¡y NGÆ¯á»¢C chiá»u)
   ======================================================= */
function tinhCungMenh() {
  const cungChuc = document.getElementById("cungChucSelect").value;
  const viTriAn = document.getElementById("cungChucViTri").value;
  const ketQua = document.getElementById("ketQuaMenh");

  // Thá»© tá»± Ä‘á»‹a chi trong layout tháº­t cá»§a lĂ¡ sá»‘ (THUáº¬N chiá»u kim Ä‘á»“ng há»“)
  const CUNG_LIST = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];

  // Thá»© tá»± 12 cung chá»©c (CHáº Y NGÆ¯á»¢C chiá»u kim Ä‘á»“ng há»“)
  const CUNG_CHUC = ["Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch",
                     "ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"];

  const idxChuc = CUNG_CHUC.indexOf(cungChuc);
  const idxViTri = CUNG_LIST.indexOf(viTriAn);
  if (idxChuc === -1 || idxViTri === -1) {
    ketQua.textContent = "?";
    return;
  }

  // âœ… Má»‡nh = vá»‹ trĂ­ an + idxChuc (vĂ¬ cung chá»©c cháº¡y NGÆ¯á»¢C chiá»u)
  const idxMenh = (idxViTri + idxChuc) % 12;
  const menhTai = CUNG_LIST[idxMenh];

  ketQua.textContent = menhTai;
  ketQua.dataset.menh = menhTai;
}




// =====================================================
// đŸ”¹ XĂC Äá»NH CHI NÄ‚M SINH + Má»†NH Ă‚M/DÆ¯Æ NG Tá»ª VĂ’NG THĂI TUáº¾
// =====================================================
function tinhChiNamThaiTue() {
  const sao = document.getElementById("thaiTueSelect").value;
  const viTriAn = document.getElementById("thaiTueViTri").value;
  const ketQua = document.getElementById("ketQuaChiNam");

  // 12 cung theo chiá»u thuáº­n
  const CUNG_LIST = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];

  // Báº£ng vá»‹ trĂ­ sao trong vĂ²ng ThĂ¡i Tuáº¿
  const TIEUTINH_DATA = [
    { ten: "ThĂ¡i Tuáº¿", buoc: 0 },
    { ten: "Thiáº¿u DÆ°Æ¡ng", buoc: 1 },
    { ten: "Tang MĂ´n", buoc: 2 },
    { ten: "Thiáº¿u Ă‚m", buoc: 3 },
    { ten: "Quan PhĂ¹", buoc: 4 },
    { ten: "Tá»­ PhĂ¹", buoc: 5 },
    { ten: "Tuáº¿ PhĂ¡", buoc: 6 },
    { ten: "Long Äá»©c", buoc: 7 },
    { ten: "Báº¡ch Há»•", buoc: 8 },
    { ten: "PhĂºc Äá»©c", buoc: 9 },
    { ten: "Äiáº¿u KhĂ¡ch", buoc: 10 },
    { ten: "Trá»±c PhĂ¹", buoc: 11 }
  ];

  // TĂ¬m dá»¯ liá»‡u sao
  const data = TIEUTINH_DATA.find(s => s.ten === sao);
  if (!data) return ketQua.textContent = "?";

  const idx = CUNG_LIST.indexOf(viTriAn);
  if (idx === -1) return ketQua.textContent = "?";

  // Náº¿u sao nĂ y cĂ¡ch ThĂ¡i Tuáº¿ "buoc" cung â†’ ThĂ¡i Tuáº¿ = idx - buoc (Ä‘áº¿m nghá»‹ch)
  const idxThaiTue = (idx - data.buoc + 12) % 12;
  const cungThaiTue = CUNG_LIST[idxThaiTue];

  // XĂ¡c Ä‘á»‹nh Ă‚m / DÆ°Æ¡ng theo Äá»‹a Chi
  const DUONG_CHI = ["TĂ½","Dáº§n","ThĂ¬n","Ngá»","ThĂ¢n","Tuáº¥t"];
  const amDuong = DUONG_CHI.includes(cungThaiTue) ? "DÆ°Æ¡ng" : "Ă‚m";

  // Hiá»ƒn thá»‹ káº¿t quáº£
ketQua.innerHTML = `${cungThaiTue}&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#444;">má»‡nh:</span> <b>${amDuong}</b>`;
document.getElementById("ketQuaChiNam").dataset.amduong = amDuong;
window.menhAmDuong = amDuong; // "Ă‚m" hoáº·c "DÆ°Æ¡ng"

}

// =========================
  // 1ï¸âƒ£ TĂ­nh cá»¥c sá»‘
  // =========================
function tinhCucSo() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const viTriCuc = document.getElementById("cucViTriSelect").value;
  const cucSo = parseInt(document.getElementById("cucSoSelect").value);
  const canCuc = document.getElementById("cucCanSelect").value;
  const ketQua = document.getElementById("ketQuaCuc");

  // Láº¥y tá»« pháº§n 1 & 2
  const menhTai = document.getElementById("ketQuaMenh").dataset.menh || "?";
  const menhAmDuong = window.menhAmDuong || "?";

  if (!menhTai || menhTai === "?" || !viTriCuc || !cucSo) {
    ketQua.textContent = `${loaiCuc} â€“ ChÆ°a xĂ¡c Ä‘á»‹nh â€“ ChÆ°a xĂ¡c Ä‘á»‹nh`;
    return;
  }

function goiTrangSinhDuPhong() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const menhAmDuong = window.menhAmDuong || "?";
  const gioiTinh = document.getElementById("ketQuaChiNam")?.textContent || "?";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong);
}

// =========================
// 1ï¸âƒ£ XĂ¡c Ä‘á»‹nh chiá»u thuáº­n / nghá»‹ch (chuáº©n theo tá»«ng loáº¡i Cá»¥c)
// =========================
const idxMenh = CUNG_THUAN.indexOf(menhTai);
const idxCuc  = CUNG_THUAN.indexOf(viTriCuc);
if (idxMenh === -1 || idxCuc === -1) {
  ketQua.textContent = `${loaiCuc} â€“ ChÆ°a xĂ¡c Ä‘á»‹nh â€“ ChÆ°a xĂ¡c Ä‘á»‹nh`;
  return;
}

// đŸ”¸ Khá»Ÿi sá»‘ cá»§a tá»«ng loáº¡i cá»¥c
const BANG_KHOI_CUC = {
  "Thá»§y nhá»‹ cá»¥c": 2,
  "Má»™c tam cá»¥c": 3,
  "Kim tá»© cá»¥c": 4,
  "Thá»• ngÅ© cá»¥c": 5,
  "Há»a lá»¥c cá»¥c": 6
};

let chieu = "KhĂ´ng xĂ¡c Ä‘á»‹nh";
if (!isNaN(cucSo)) {
  // đŸ§® Sá»‘ bÆ°á»›c dá»‹ch tĂ¹y loáº¡i cá»¥c
  const khoi = BANG_KHOI_CUC[loaiCuc] ?? 4;
  const buoc = Math.floor((cucSo - khoi) / 10) % 12;

  // đŸ¯ XĂ¡c Ä‘á»‹nh vá»‹ trĂ­ há»£p lá»‡ náº¿u cháº¡y thuáº­n vĂ  nghá»‹ch
  const viTriThuan = CUNG_THUAN[(idxMenh + buoc) % 12];
  const viTriNghich = CUNG_THUAN[(idxMenh - buoc + 12) % 12];

  // đŸ« Giá»›i háº¡n 10 trÆ°á»ng há»£p Ä‘áº·c biá»‡t: 2â€“6 vĂ  62â€“66 â†’ khĂ´ng tĂ­nh chiá»u
  const CAM_TINH_CHIEU = [2, 3, 4, 5, 6, 62, 63, 64, 65, 66];

  if (CAM_TINH_CHIEU.includes(cucSo)) {
    chieu = "KhĂ´ng xĂ¡c Ä‘á»‹nh";
  } else {
    if (viTriCuc === viTriThuan) chieu = "Thuáº­n";
    else if (viTriCuc === viTriNghich) chieu = "Nghá»‹ch";
    else chieu = "KhĂ´ng xĂ¡c Ä‘á»‹nh";
  }
}





  // =========================
  // 2ï¸âƒ£ XĂ¡c Ä‘á»‹nh giá»›i tĂ­nh
  // =========================
  let gioiTinh = "ChÆ°a xĂ¡c Ä‘á»‹nh";
  if (chieu === "Thuáº­n" && menhAmDuong === "DÆ°Æ¡ng") gioiTinh = "DÆ°Æ¡ng Nam";
  else if (chieu === "Thuáº­n" && menhAmDuong === "Ă‚m") gioiTinh = "Ă‚m Ná»¯";
  else if (chieu === "Nghá»‹ch" && menhAmDuong === "DÆ°Æ¡ng") gioiTinh = "DÆ°Æ¡ng Ná»¯";
  else if (chieu === "Nghá»‹ch" && menhAmDuong === "Ă‚m") gioiTinh = "Ă‚m Nam";

// =========================
// 3ï¸âƒ£ Äáº¿m ngÆ°á»£c Can + Chi Ä‘á»ƒ xĂ¡c Ä‘á»‹nh Can Dáº§n (chuáº©n Tá»­ Vi)
// =========================
const CAN_LIST = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
const CHI_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

const idxCan = CAN_LIST.indexOf(canCuc);
const idxChi = CHI_LIST.indexOf(viTriCuc);
let canDan = null;

if (idxCan !== -1 && idxChi !== -1) {
  let canIdx = idxCan;
  let chiIdx = idxChi;

  // Náº¿u chi Ä‘ang nháº­p Ä‘Ă£ lĂ  Dáº§n â†’ dĂ¹ng luĂ´n can hiá»‡n táº¡i
  if (viTriCuc === "Dáº§n") {
    canDan = canCuc;
  } else {
    // NgÆ°á»£c láº¡i, lĂ¹i cáº£ Can vĂ  Chi cho tá»›i khi gáº·p Dáº§n
    do {
      canIdx = (canIdx - 1 + 10) % 10;
      chiIdx = (chiIdx - 1 + 12) % 12;
    } while (CHI_LIST[chiIdx] !== "Dáº§n");

    canDan = CAN_LIST[canIdx];
  }
}




  // =========================
  // 4ï¸âƒ£ Tra báº£ng Can Dáº§n -> Can nÄƒm sinh
  // =========================
  const CAN_DAN_MAP = {
    "GiĂ¡p": "Máº­u / QuĂ½",
    "NhĂ¢m": "Äinh / NhĂ¢m",
    "Canh": "BĂ­nh / TĂ¢n",
    "Máº­u": "áº¤t / Canh",
    "BĂ­nh": "GiĂ¡p / Ká»·"
  };

  let canNamText = "ChÆ°a xĂ¡c Ä‘á»‹nh";
  if (canDan && CAN_DAN_MAP[canDan]) {
    canNamText = CAN_DAN_MAP[canDan];
  }



// =========================
// 5ï¸âƒ£ Hiá»ƒn thá»‹ káº¿t quáº£ cuá»‘i
// =========================
ketQua.innerHTML = `<b>${loaiCuc}</b> â€“ ${chieu} â€“ <b>${gioiTinh}</b> â€“ Can nÄƒm: <b>${canNamText}</b>`;

// =========================
// 6ï¸âƒ£ Gá»i VĂ²ng TrĂ ng Sinh dá»± phĂ²ng náº¿u cáº§n
// =========================
const groupTrangSinh = document.getElementById("vongTrangSinhGroup");
if (typeof chieu !== "undefined" && chieu === "KhĂ´ng xĂ¡c Ä‘á»‹nh") {
  const gioiTinhText = gioiTinh || "ChÆ°a xĂ¡c Ä‘á»‹nh";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinhText, menhAmDuong);
} else {
  groupTrangSinh.style.display = "none";
}
}



// Gá»i láº¡i khi thay Ä‘á»•i cĂ¡c giĂ¡ trá»‹ liĂªn quan
["cucLoaiSelect","cucSoSelect","cucViTriSelect","cucCanSelect"].forEach(id=>{
  document.getElementById(id).addEventListener("change", tinhCucSo);
});

// =====================================================
// đŸ”¹ HĂ€M TRUNG GIAN: Gá»ŒI Tá»° Äá»˜NG VĂ’NG TRĂ€NG SINH Dá»° PHĂ’NG
// =====================================================
function goiTrangSinhDuPhong() {
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const menhAmDuong = window.menhAmDuong || "?";
  const gioiTinh = document.getElementById("ketQuaChiNam")?.textContent || "?";
  xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong);
}

// =====================================================
// 3ï¸âƒ£.1 VĂ’NG TRĂ€NG SINH (Tá»° XĂC Äá»NH CHIá»€U & SUY GIá»I TĂNH)
// =====================================================
function xacDinhTrangSinhDuPhong(loaiCuc, gioiTinh, menhAmDuong) {
  const ketQua = document.getElementById("ketQuaTrangSinh");
  const group = document.getElementById("vongTrangSinhGroup");
  const saoChon = document.getElementById("trangSinhSelect").value;
  const cungCucSo = document.getElementById("cucViTriSelect").value;
  group.style.display = "block";

  // đŸŸ¢ 1ï¸âƒ£ Kiá»ƒm tra Ä‘áº§u vĂ o
  if (!loaiCuc || !cungCucSo || !saoChon) {
    ketQua.innerHTML = `â ï¸ Vui lĂ²ng chá»n Ä‘á»§: Cá»¥c, Sao vĂ  Vá»‹ trĂ­ Cá»¥c Sá»‘.`;
    return;
  }

  // đŸŸ¢ 2ï¸âƒ£ Báº£ng khá»Ÿi TrĂ ng Sinh theo loáº¡i Cá»¥c
  const TRANG_SINH_KHOI = {
    "Kim tá»© cá»¥c": "Tá»µ",
    "Má»™c tam cá»¥c": "Há»£i",
    "Há»a lá»¥c cá»¥c": "Dáº§n",
    "Thá»§y nhá»‹ cá»¥c": "ThĂ¢n",
    "Thá»• ngÅ© cá»¥c": "ThĂ¢n"
  };
  const cungKhoi = TRANG_SINH_KHOI[loaiCuc];
  if (!cungKhoi) {
    ketQua.innerHTML = `â ï¸ KhĂ´ng xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c cung khá»Ÿi TrĂ ng Sinh.`;
    return;
  }

  // đŸŸ¢ 3ï¸âƒ£ Chuá»—i sao trong vĂ²ng TrĂ ng Sinh (thá»© tá»± cá»‘ Ä‘á»‹nh)
  const SAO_VONG = [
    "TrĂ ng Sinh","Má»™c Dá»¥c","Quan Äá»›i","LĂ¢m Quan",
    "Äáº¿ VÆ°á»£ng","Suy","Bá»‡nh","Tá»­","Má»™","Tuyá»‡t","Thai","DÆ°á»¡ng"
  ];

  // đŸŸ¢ 4ï¸âƒ£ Thá»© tá»± 12 cung thuáº­n theo Tá»­ Vi
const CUNG_THUAN_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];

  const idxKhoi = CUNG_THUAN.indexOf(cungKhoi);
  const idxCuc = CUNG_THUAN.indexOf(cungCucSo);
  if (idxKhoi === -1 || idxCuc === -1) {
    ketQua.innerHTML = `â ï¸ Cung khĂ´ng há»£p lá»‡.`;
    return;
  }

  // đŸŸ¢ 5ï¸âƒ£ TĂ­nh sao táº¡i cung Cá»¥c Sá»‘ náº¿u vĂ²ng Ä‘i thuáº­n hoáº·c nghá»‹ch
  const diffThuan = (idxCuc - idxKhoi + 12) % 12;
  const diffNghich = (idxKhoi - idxCuc + 12) % 12;
  const saoThuThuan = SAO_VONG[diffThuan];
  const saoThuNghich = SAO_VONG[diffNghich];

  // đŸŸ¢ 6ï¸âƒ£ So sĂ¡nh sao chá»n vá»›i hai hÆ°á»›ng Ä‘á»ƒ xĂ¡c Ä‘á»‹nh chiá»u
  let chieu = "?";
  if (saoChon === saoThuThuan) chieu = "Thuáº­n";
  else if (saoChon === saoThuNghich) chieu = "Nghá»‹ch";
  else chieu = "KhĂ´ng xĂ¡c Ä‘á»‹nh";

  // đŸŸ¢ 7ï¸âƒ£ Náº¿u sao náº±m á»Ÿ TrĂ ng Sinh hoáº·c Bá»‡nh â†’ vĂ´ Ä‘á»‹nh
  if (["TrĂ ng Sinh","Bá»‡nh"].includes(saoChon)) {
    ketQua.innerHTML = `
      TrĂ ng Sinh khá»Ÿi táº¡i <b>${cungKhoi}</b> â†’ Cá»¥c Sá»‘ táº¡i <b>${cungCucSo}</b><br>
      Sao <b>${saoChon}</b> thuá»™c vá»‹ trĂ­ vĂ´ Ä‘á»‹nh â†’ 
      <span style="color:#a00;">KhĂ´ng xĂ¡c Ä‘á»‹nh giá»›i tĂ­nh</span>.
    `;
    return { chieu: "KhĂ´ng xĂ¡c Ä‘á»‹nh", gioiTinh: "KhĂ´ng xĂ¡c Ä‘á»‹nh", cungKhoi, cungCucSo, sao: saoChon };
  }

  // đŸŸ¢ 8ï¸âƒ£ Suy giá»›i tĂ­nh theo chiá»u + Ă‚m DÆ°Æ¡ng Má»‡nh
  let gioiTinhSuy = "KhĂ´ng xĂ¡c Ä‘á»‹nh";
  if (chieu === "Thuáº­n" && menhAmDuong === "DÆ°Æ¡ng") gioiTinhSuy = "Nam";
  else if (chieu === "Nghá»‹ch" && menhAmDuong === "DÆ°Æ¡ng") gioiTinhSuy = "Ná»¯";
  else if (chieu === "Thuáº­n" && menhAmDuong === "Ă‚m") gioiTinhSuy = "Ná»¯";
  else if (chieu === "Nghá»‹ch" && menhAmDuong === "Ă‚m") gioiTinhSuy = "Nam";

  // đŸŸ¢ 9ï¸âƒ£ Hiá»ƒn thá»‹ káº¿t quáº£
  let detail = "";
  if (chieu === "Thuáº­n" || chieu === "Nghá»‹ch") {
    detail = `Cung nĂ y á»©ng vá»›i sao <b>${saoChon}</b> trong vĂ²ng TrĂ ng Sinh â†’ 
              <b>${chieu} hĂ nh</b> â†’ 
              <span style="color:#006400;">Giá»›i tĂ­nh: <b>${gioiTinhSuy}</b></span>`;
  } else {
    detail = `Sao <b>${saoChon}</b> khĂ´ng trĂ¹ng vá»‹ trĂ­ nĂ o trong vĂ²ng TrĂ ng Sinh cá»§a ${loaiCuc}. 
              <span style="color:#a00;">KhĂ´ng xĂ¡c Ä‘á»‹nh chiá»u & giá»›i tĂ­nh.</span>`;
  }

  ketQua.innerHTML = `
    TrĂ ng Sinh khá»Ÿi táº¡i <b>${cungKhoi}</b> â†’ Cá»¥c Sá»‘ táº¡i <b>${cungCucSo}</b><br>${detail}
  `;

  // đŸŸ¢ 10ï¸âƒ£ Tráº£ ra káº¿t quáº£ Ä‘á»ƒ dĂ¹ng tiáº¿p
  return { chieu, gioiTinh: gioiTinhSuy, cungKhoi, cungCucSo, sao: saoChon };
}





// =====================================================
// đŸ”¹ KHá»I Táº O DANH SĂCH SAO TRĂ€NG SINH (12 SAO)
// =====================================================
function khoiTaoVongTrangSinh() {
  const trangSinhSelect = document.getElementById("trangSinhSelect");
  if (!trangSinhSelect) return;

  const SAO_TRANG_SINH = [
    "TrĂ ng Sinh",
    "Má»™c Dá»¥c",
    "Quan Äá»›i",
    "LĂ¢m Quan",
    "Äáº¿ VÆ°á»£ng",
    "Suy",
    "Bá»‡nh",
    "Tá»­",
    "Má»™",
    "Tuyá»‡t",
    "Thai",
    "DÆ°á»¡ng"
  ];

  // XĂ³a háº¿t tĂ¹y chá»n cÅ© (náº¿u cĂ³)
  trangSinhSelect.innerHTML = "";

  // ThĂªm tĂ¹y chá»n trá»‘ng Ä‘áº§u tiĂªn
  const optEmpty = document.createElement("option");
  optEmpty.value = "";
  optEmpty.textContent = "â€” Chá»n sao â€”";
  trangSinhSelect.appendChild(optEmpty);

  // ThĂªm 12 sao vĂ o dropdown
  SAO_TRANG_SINH.forEach(sao => {
    const opt = document.createElement("option");
    opt.value = sao;
    opt.textContent = sao;
    trangSinhSelect.appendChild(opt);
  });
}

// Gá»i hĂ m khá»Ÿi táº¡o khi trang load
window.addEventListener("DOMContentLoaded", khoiTaoVongTrangSinh);




// =====================================================
// 4ï¸âƒ£ VĂ’NG BĂC SÄ¨ â€“ TRA NGÆ¯á»¢C CAN NÄ‚M SINH
// =====================================================
function xacDinhBacSi() {
  const ketQua = document.getElementById("ketQuaCanNam");
  if (!ketQua) return;

  // đŸŸ¢ 1ï¸âƒ£ Láº¥y dá»¯ liá»‡u nháº­p
  const saoChon = document.getElementById("bacSiSelect").value;
  const cungSao = document.getElementById("bacSiViTri").value;
  if (!saoChon || !cungSao) {
    ketQua.innerHTML = `â ï¸ Vui lĂ²ng chá»n Ä‘á»§ Sao vĂ  Vá»‹ trĂ­ an.`;
    return;
  }

  // đŸŸ¢ 2ï¸âƒ£ Láº¥y chiá»u thuáº­n/nghá»‹ch tá»« pháº§n 3 hoáº·c 3.1 (Æ°u tiĂªn cĂ³ giĂ¡ trá»‹ trÆ°á»›c)
  let chieu = "?";
  const ketQuaCuc = document.getElementById("ketQuaCuc")?.textContent || "";
  const ketQuaTrangSinh = document.getElementById("ketQuaTrangSinh")?.textContent || "";

  if (ketQuaCuc.includes("Thuáº­n") || ketQuaTrangSinh.includes("Thuáº­n")) chieu = "Thuáº­n";
  else if (ketQuaCuc.includes("Nghá»‹ch") || ketQuaTrangSinh.includes("Nghá»‹ch")) chieu = "Nghá»‹ch";

  if (chieu === "?") {
    ketQua.innerHTML = `â ï¸ ChÆ°a cĂ³ dá»¯ liá»‡u chiá»u thuáº­n/nghá»‹ch tá»« pháº§n Cá»¥c.`;
    return;
  }

  // đŸŸ¢ 3ï¸âƒ£ Máº£ng sao & máº£ng cung
  const SAO_VONG_BACSI = [
    "BĂ¡c SÄ©","Lá»±c SÄ©","Thanh Long","Tiá»ƒu Hao","TÆ°á»›ng QuĂ¢n",
    "Táº¥u ThÆ°","Phi LiĂªm","Há»· Tháº§n","Bá»‡nh PhĂ¹","Äáº¡i Hao","Phá»¥c Binh","Quan Phá»§"
  ];

  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];

  const idxSao = SAO_VONG_BACSI.indexOf(saoChon);
  const idxCung = CUNG_THUAN.indexOf(cungSao);
  if (idxSao === -1 || idxCung === -1) {
    ketQua.innerHTML = `â ï¸ Dá»¯ liá»‡u sao hoáº·c cung khĂ´ng há»£p lá»‡.`;
    return;
  }

  // đŸŸ¢ 4ï¸âƒ£ XĂ¡c Ä‘á»‹nh hÆ°á»›ng Ä‘áº¿m Ä‘á»ƒ tĂ¬m BĂ¡c SÄ©
  // Náº¿u vĂ²ng gá»‘c Ä‘i thuáº­n â†’ Ä‘áº¿m ngÆ°á»£c Ä‘á»ƒ tra ngÆ°á»£c
  // Náº¿u vĂ²ng gá»‘c Ä‘i nghá»‹ch â†’ Ä‘áº¿m thuáº­n Ä‘á»ƒ tra ngÆ°á»£c
  const buoc = idxSao; // sá»‘ bÆ°á»›c tá»« BĂ¡c SÄ© Ä‘áº¿n sao Ä‘ang chá»n
  let idxBacSi;
if (chieu === "Thuáº­n") idxBacSi = (idxCung - buoc + 12) % 12;
else idxBacSi = (idxCung + buoc) % 12;


  const cungBacSi = CUNG_THUAN[idxBacSi];

  // đŸŸ¢ 5ï¸âƒ£ Tra báº£ng Lá»™c Tá»“n (vá»‹ trĂ­ an BĂ¡c SÄ©)
  const LOC_TON_MAP = {
    "GiĂ¡p":"Dáº§n","áº¤t":"MĂ£o","BĂ­nh":"Tá»µ","Äinh":"Ngá»","Máº­u":"Tá»µ",
    "Ká»·":"Ngá»","Canh":"ThĂ¢n","TĂ¢n":"Dáº­u","NhĂ¢m":"Há»£i","QuĂ½":"TĂ½"
  };

  // TĂ¬m táº¥t cáº£ Can cĂ³ Lá»™c Tá»“n trĂ¹ng cung BĂ¡c SÄ©
  const canNamList = [];
  for (const [can, cung] of Object.entries(LOC_TON_MAP)) {
    if (cung === cungBacSi) canNamList.push(can);
  }

  // đŸŸ¢ 6ï¸âƒ£ Láº¥y káº¿t quáº£ Can nÄƒm tá»« pháº§n 3 (Cá»¥c sá»‘)
const ketQuaCucText = document.getElementById("ketQuaCuc")?.textContent || "";
let canPhan3 = [];
const matchCanNam = ketQuaCucText.match(/Can n.m:\s*([\p{L}\/\s]+)/u);
if (matchCanNam && matchCanNam[1]) {
  canPhan3 = matchCanNam[1].split("/").map(s => s.trim());
}



// đŸŸ¢ 7ï¸âƒ£ TĂ­nh giao giá»¯a hai káº¿t quáº£ (pháº§n 3 & pháº§n 4)
const giaoCan = canNamList.filter(c => canPhan3.includes(c));

// đŸŸ¢ 8ï¸âƒ£ Hiá»ƒn thá»‹ káº¿t quáº£ tá»•ng há»£p
let html = `
  BĂ¡c SÄ© an táº¡i <b>${cungBacSi}</b> â†’
  Chiá»u <b>${chieu}</b> â†’
  Sao <b>${saoChon}</b> táº¡i <b>${cungSao}</b><br>
  â®• <span style="color:#006400;">Can nÄƒm sinh (vĂ²ng BĂ¡c SÄ©): <b>${canNamList.join(" / ")}</b></span><br>
`;

if (canPhan3.length > 0) {
  html += `<span style="color:#444;">Can nÄƒm (vĂ²ng Cá»¥c): <b>${canPhan3.join(" / ")}</b></span><br>`;
}

if (giaoCan.length > 0) {
  html += `<span style="color:#b22222;">âœ… Káº¿t quáº£ giao: <b>${giaoCan.join(" / ")}</b></span>`;
} else {
  html += `<span style="color:#a00;">â ï¸ KhĂ´ng trĂ¹ng giá»¯a hai vĂ²ng â€“ cáº§n xem láº¡i dá»¯ kiá»‡n.</span>`;
}

ketQua.innerHTML = html;
window.ketQuaBacSi = { giaoCan, cungBacSi, chieu }; // Ä‘á»ƒ pháº§n tra ngÆ°á»£c láº¥y Ä‘Æ°á»£c


// đŸŸ¢ 9ï¸âƒ£ Tráº£ káº¿t quáº£ ra ngoĂ i (Ä‘á»ƒ cĂ³ thá»ƒ dĂ¹ng cho bÆ°á»›c sau)
return { 
  chieu, 
  sao: saoChon, 
  cungSao, 
  cungBacSi, 
  canNamList, 
  canPhan3, 
  giaoCan // â† thĂªm dĂ²ng nĂ y Ä‘á»ƒ lÆ°u luĂ´n káº¿t quáº£ giao
};
}

// đŸŸ¢ 10ï¸âƒ£ GĂ¡n sá»± kiá»‡n onchange cho dropdown Ä‘á»ƒ hiá»ƒn thá»‹ káº¿t quáº£ ngay
["bacSiSelect","bacSiViTri"].forEach(id=>{
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", xacDinhBacSi);
});

/* ==========================================================
   đŸ”¹ TRA NGÆ¯á»¢C Tá»¬ VI â€“ THIĂN PHá»¦ (chuáº©n trá»¥c Dáº§nâ€“ThĂ¢n)
   ========================================================== */

const CUNG_THUAN_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
const CUNG_CHUC_RUT_GON = ["Má»‡nh","Huynh","Phu","Tá»­","TĂ i","Táº­t","Di","NĂ´","Quan","Äiá»n","PhĂºc","Phá»¥"];

// đŸŒŸ VĂ²ng sao cá»‘ Ä‘á»‹nh
const PATTERN_TU_VI = [
  "Tá»­ Vi","ThiĂªn CÆ¡",null,"ThĂ¡i DÆ°Æ¡ng","VÅ© KhĂºc","ThiĂªn Äá»“ng",
  null,null,"LiĂªm Trinh",null,null,null
];
const PATTERN_THIEN_PHU = [
  "ThiĂªn Phá»§","ThĂ¡i Ă‚m","Tham Lang","Cá»± MĂ´n","ThiĂªn TÆ°á»›ng",
  "ThiĂªn LÆ°Æ¡ng","Tháº¥t SĂ¡t",null,null,null,"PhĂ¡ QuĂ¢n",null
];

// đŸŒŸ Báº£ng ngĂ y sinh Ă¢m theo cá»¥c
const BANG_TU_VI_TRA_NGUOC = {
  "Thá»§y nhá»‹ cá»¥c": [
    "Sá»­u","Dáº§n","Dáº§n","MĂ£o","MĂ£o","ThĂ¬n","ThĂ¬n","Tá»µ","Tá»µ","Ngá»",
    "Ngá»","MĂ¹i","MĂ¹i","ThĂ¢n","ThĂ¢n","Dáº­u","Dáº­u","Tuáº¥t","Tuáº¥t","Há»£i",
    "Há»£i","TĂ½","TĂ½","Sá»­u","Sá»­u","Dáº§n","Dáº§n","MĂ£o","MĂ£o","ThĂ¬n"
  ],
  "Má»™c tam cá»¥c": [
    "ThĂ¬n","Sá»­u","Dáº§n","Tá»µ","Dáº§n","MĂ£o","Ngá»","MĂ£o","ThĂ¬n","MĂ¹i",
    "ThĂ¬n","Tá»µ","ThĂ¢n","Tá»µ","Ngá»","Dáº­u","Ngá»","MĂ¹i","Tuáº¥t","MĂ¹i",
    "ThĂ¢n","Há»£i","ThĂ¢n","Dáº­u","TĂ½","Dáº­u","Tuáº¥t","Sá»­u","Tuáº¥t","Há»£i"
  ],
  "Kim tá»© cá»¥c": [
    "Há»£i","ThĂ¬n","Sá»­u","Dáº§n","TĂ½","Tá»µ","Dáº§n","MĂ£o","Sá»­u","Ngá»",
    "MĂ£o","ThĂ¬n","Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ","MĂ£o","ThĂ¢n","Tá»µ","Ngá»",
    "ThĂ¬n","Dáº­u","Ngá»","MĂ¹i","Tá»µ","Tuáº¥t","MĂ¹i","ThĂ¢n","Ngá»","Há»£i"
  ],
  "Thá»• ngÅ© cá»¥c": [
    "Ngá»","Há»£i","ThĂ¬n","Sá»­u","Dáº§n","MĂ¹i","TĂ½","Tá»µ","Dáº§n","MĂ£o",
    "ThĂ¢n","Sá»­u","Ngá»","MĂ£o","ThĂ¬n","Dáº­u","Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ",
    "Tuáº¥t","MĂ£o","ThĂ¢n","Tá»µ","Ngá»","Há»£i","ThĂ¬n","Dáº­u","Ngá»","MĂ¹i"
  ],
  "Há»a lá»¥c cá»¥c": [
    "Dáº­u","Ngá»","Há»£i","ThĂ¬n","Sá»­u","Dáº§n","Tuáº¥t","MĂ¹i","TĂ½","Tá»µ",
    "Dáº§n","MĂ£o","Há»£i","ThĂ¢n","Sá»­u","Ngá»","MĂ£o","ThĂ¬n","TĂ½","Dáº­u",
    "Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ","Sá»­u","Tuáº¥t","MĂ£o","ThĂ¢n","Tá»µ","Ngá»"
  ]
};

/* ==========================================================
   đŸ”¸ HĂ€M TĂŒM CUNG Äá»I Xá»¨NG QUA TRá»¤C Dáº¦Nâ€“THĂ‚N
   ========================================================== */
function getPhuTheoTuVi(cungTuVi) {
  const idx = CUNG_THUAN_TUVI.indexOf(cungTuVi) + 1; // 1â€“12
  if (idx === 1 || idx === 7) return cungTuVi; // Dáº§n hoáº·c ThĂ¢n => trĂ¹ng
  const doiXung = 14 - idx;
  return CUNG_THUAN_TUVI[(doiXung - 1 + 12) % 12];
}

/* ==========================================================
   đŸ”¸ HĂ€M XĂC Äá»NH TOĂ€N Bá»˜ VĂ’NG Tá»¬ VI â€“ THIĂN PHá»¦
   ========================================================== */
function xacDinhTuViTuSao() {
  const saoChon = document.getElementById("tuviSelect").value.trim();
  const cungSao = document.getElementById("chinhViTri").value;
  const loaiCuc = document.getElementById("cucLoaiSelect").value;
  const ketQua = document.getElementById("ketQuaChinhTinh");
  if (!saoChon || !cungSao || !loaiCuc) {
    ketQua.innerHTML = "<i>â ï¸ Vui lĂ²ng chá»n Ä‘á»§ dá»¯ kiá»‡n á»Ÿ pháº§n 1,3,5.</i>";
    return;
  }

  const idxCung = CUNG_THUAN_TUVI.indexOf(cungSao);
  if (idxCung === -1) return;

  let idxTuVi, idxPhu, cungTuVi, cungPhu;

  // đŸŒŸ 1ï¸âƒ£ Náº¿u sao thuá»™c vĂ²ng Tá»¬ VI â†’ cháº¡y NGHá»CH
  if (PATTERN_TU_VI.includes(saoChon)) {
    const offset = PATTERN_TU_VI.indexOf(saoChon);
    idxTuVi = (idxCung - offset + 12) % 12;
    cungTuVi = CUNG_THUAN_TUVI[idxTuVi];
    cungPhu = getPhuTheoTuVi(cungTuVi); // dĂ¹ng trá»¥c Dáº§nâ€“ThĂ¢n
    idxPhu = CUNG_THUAN_TUVI.indexOf(cungPhu);
  }

  // đŸŒŸ 2ï¸âƒ£ Náº¿u sao thuá»™c vĂ²ng THIĂN PHá»¦ â†’ cháº¡y THUáº¬N
// đŸŒŸ 2ï¸âƒ£ Náº¿u sao thuá»™c vĂ²ng THIĂN PHá»¦ â†’ cháº¡y NGHá»CH (vĂ¬ tra ngÆ°á»£c)
else if (PATTERN_THIEN_PHU.includes(saoChon)) {
  const offset = PATTERN_THIEN_PHU.indexOf(saoChon);
  idxPhu = (idxCung - offset + 12) % 12; // đŸ” lĂ¹i thay vĂ¬ cá»™ng
  cungPhu = CUNG_THUAN_TUVI[idxPhu];
  cungTuVi = getPhuTheoTuVi(cungPhu); // Ä‘á»‘i xá»©ng trá»¥c Dáº§nâ€“ThĂ¢n
  idxTuVi = CUNG_THUAN_TUVI.indexOf(cungTuVi);
}


  else {
    ketQua.innerHTML = "â ï¸ Sao khĂ´ng thuá»™c chĂ²m Tá»­ Vi â€“ ThiĂªn Phá»§.";
    return;
  }



  // đŸŒŸ 3ï¸âƒ£ Tra báº£ng ngĂ y sinh Ă¢m cĂ³ thá»ƒ
const arrNgay = BANG_TU_VI_TRA_NGUOC[loaiCuc] || [];
const ngaySinhCoThe = [];
arrNgay.forEach((c, i) => { if (c === cungTuVi) ngaySinhCoThe.push(i + 1); });

window.ngayChinhTinh = ngaySinhCoThe;


// đŸŒŸ 4ï¸âƒ£ An sao cho 12 cung
const chinhTinhTheoCung = Array(12).fill().map(() => []);
PATTERN_TU_VI.forEach((s, i) => {
  if (s) chinhTinhTheoCung[(idxTuVi - i + 12) % 12].push(s);
});
PATTERN_THIEN_PHU.forEach((s, i) => {
  if (s) chinhTinhTheoCung[(idxPhu + i) % 12].push(s);
});

// đŸŒŸ 5ï¸âƒ£ Hiá»ƒn thá»‹ káº¿t quáº£
let html = `
<p><b>Tá»¬ VI</b> táº¡i <b>${cungTuVi}</b> â€“ <b>THIĂN PHá»¦</b> táº¡i <b>${cungPhu}</b><br>
âœ NgĂ y sinh Ă¢m cĂ³ thá»ƒ: <b>${ngaySinhCoThe.join(", ") || "?"}</b></p>
<hr style="margin:6px 0;">`;

// đŸ”¹ 1ï¸âƒ£ Láº¥y vá»‹ trĂ­ Má»‡nh tháº­t tá»« pháº§n 1
const menhThucTe = document.getElementById("ketQuaMenh")?.dataset?.menh || "Dáº§n";
const idxMenhThucTe = CUNG_THUAN.indexOf(menhThucTe);

// đŸ”¹ 2ï¸âƒ£ Táº¡o thá»© tá»± 12 cung báº¯t Ä‘áº§u tá»« Má»‡nh tháº­t â†’ cháº¡y NGHá»CH chiá»u kim Ä‘á»“ng há»“
const CUNG_HIEN_THI = [];
const CUNG_CHUC_HIEN_THI = [];

for (let i = 0; i < 12; i++) {
  const idx = (idxMenhThucTe + i) % 12;
  CUNG_HIEN_THI.push(CUNG_THUAN[idx]);
}

// đŸ”¹ Cung chá»©c cháº¡y thuáº­n (Má»‡nh â†’ Phá»¥ â†’ PhĂºc â†’ Äiá»n â†’ Quan â†’ NĂ´ â†’ Di â†’ Táº­t â†’ TĂ i â†’ Tá»­ â†’ Phu â†’ Huynh)
const CUNG_CHUC_THUAN = ["Má»‡nh","Phá»¥","PhĂºc","Äiá»n","Quan","NĂ´","Di","Táº­t","TĂ i","Tá»­","Phu","Huynh"];
CUNG_CHUC_HIEN_THI.push(...CUNG_CHUC_THUAN);

// đŸ”¹ 3ï¸âƒ£ RĂ¡p sao Ä‘Ăºng vá»‹ trĂ­ hiá»ƒn thá»‹ theo Má»‡nh tháº­t
const chinhTinhTheoCung_HienThi = CUNG_HIEN_THI.map(cung => {
  const idxGoc = CUNG_THUAN.indexOf(cung);
  return chinhTinhTheoCung[idxGoc];
});

// đŸ”¹ 4ï¸âƒ£ In báº£ng (Má»‡nh luĂ´n á»Ÿ cá»™t Ä‘áº§u)
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

// Gáº¯n sá»± kiá»‡n onchange
["tuviSelect","phuSelect","chinhViTri"].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener("change", xacDinhTuViTuSao);
});

// ===========================================================
// đŸ”¹ Báº¢NG TRA NGÆ¯á»¢C THĂNG SINH (tá»« vá»‹ trĂ­ sao â†’ thĂ¡ng sinh Ă¢m)
// ===========================================================
const BANG_THANG_SINH_SAO = {
  "Táº£ Phá»¥":  { "ThĂ¬n":1,"Tá»µ":2,"Ngá»":3,"MĂ¹i":4,"ThĂ¢n":5,"Dáº­u":6,"Tuáº¥t":7,"Há»£i":8,"TĂ½":9,"Sá»­u":10,"Dáº§n":11,"MĂ£o":12 },
  "Há»¯u Báº­t": { "Tuáº¥t":1,"Dáº­u":2,"ThĂ¢n":3,"MĂ¹i":4,"Ngá»":5,"Tá»µ":6,"ThĂ¬n":7,"MĂ£o":8,"Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12 },
  "ThiĂªn HĂ¬nh": { "Dáº­u":1,"Tuáº¥t":2,"Há»£i":3,"TĂ½":4,"Sá»­u":5,"Dáº§n":6,"MĂ£o":7,"ThĂ¬n":8,"Tá»µ":9,"Ngá»":10,"MĂ¹i":11,"ThĂ¢n":12 },
  "ThiĂªn RiĂªu": { "Sá»­u":1,"Dáº§n":2,"MĂ£o":3,"ThĂ¬n":4,"Tá»µ":5,"Ngá»":6,"MĂ¹i":7,"ThĂ¢n":8,"Dáº­u":9,"Tuáº¥t":10,"Há»£i":11,"TĂ½":12 },
  "ThiĂªn Y":    { "Sá»­u":1,"Dáº§n":2,"MĂ£o":3,"ThĂ¬n":4,"Tá»µ":5,"Ngá»":6,"MĂ¹i":7,"ThĂ¢n":8,"Dáº­u":9,"Tuáº¥t":10,"Há»£i":11,"TĂ½":12 },
  "ThiĂªn Giáº£i": { "ThĂ¢n":1,"Dáº­u":2,"Tuáº¥t":3,"Há»£i":4,"TĂ½":5,"Sá»­u":6,"Dáº§n":7,"MĂ£o":8,"ThĂ¬n":9,"Tá»µ":10,"Ngá»":11,"MĂ¹i":12 },
  "Äá»‹a Giáº£i":   { "MĂ¹i":1,"ThĂ¢n":2,"Dáº­u":3,"Tuáº¥t":4,"Há»£i":5,"TĂ½":6,"Sá»­u":7,"Dáº§n":8,"MĂ£o":9,"ThĂ¬n":10,"Tá»µ":11,"Ngá»":12 }
};

// ===========================================================
// đŸ”¹ Báº¢NG TRA GIá»œ SINH (tá»« thĂ¡ng + cung Má»‡nh â†’ Giá» sinh)
// ===========================================================
const BANG_GIO_MENH = {
  1: ["Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o"],
  2: ["MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n"],
  3: ["ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ"],
  4: ["Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»"],
  5: ["Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i"],
  6: ["MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n"],
  7: ["ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u"],
  8: ["Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t"],
  9: ["Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i"],
  10:["Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½"],
  11:["TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u"],
  12:["Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n"]
};
const GIO_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

// ===========================================================
// đŸ”¹ HĂ€M TRA GIá»œ SINH Tá»ª THĂNG + CUNG Má»†NH
// ===========================================================
function timGioSinhTheoMenh(thang, menhCung) {
  const hang = BANG_GIO_MENH[thang];
  if (!hang) return null;
  const idx = hang.indexOf(menhCung);
  return idx >= 0 ? GIO_LIST[idx] : null;
}

// ===========================================================
// đŸ”¹ KHá»I Táº O DROPDOWN & TRA NGÆ¯á»¢C THĂNG + GIá»œ
// ===========================================================
function khoiTaoSaoThang() {
  const selectSao = document.getElementById("saoThangSelect");
  const selectViTri = document.getElementById("saoThangViTri");
  if (!selectSao || !selectViTri) return;

  // Danh sĂ¡ch sao
  const saoList = Object.keys(BANG_THANG_SINH_SAO);
  selectSao.innerHTML = '<option value="">â€” Chá»n Sao â€”</option>';
  saoList.forEach(s=>{
    const opt=document.createElement("option");
    opt.value=s; opt.textContent=s;
    selectSao.appendChild(opt);
  });

  // Danh sĂ¡ch 12 cung
  const cungList=["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  selectViTri.innerHTML='<option value="">â€” Chá»n Cung â€”</option>';
  cungList.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c; opt.textContent=c;
    selectViTri.appendChild(opt);
  });

  selectSao.addEventListener("change", xacDinhThangSinhTuSao);
  selectViTri.addEventListener("change", xacDinhThangSinhTuSao);
  console.log("âœ… Sá»± kiá»‡n onchange Ä‘Ă£ Ä‘Æ°á»£c gáº¯n thĂ nh cĂ´ng.");
}

// ===========================================================
// đŸ”¹ HĂ€M XĂC Äá»NH THĂNG & GIá»œ SINH
// ===========================================================
function xacDinhThangSinhTuSao() {
  const sao = document.getElementById("saoThangSelect").value;
  const cung = document.getElementById("saoThangViTri").value;
  const box = document.getElementById("ketQuaThangSinh");
  const menhCung = document.getElementById("ketQuaMenh")?.dataset?.menh || null;

  if (!box) return;
  if (!sao || !cung) {
    box.innerHTML = '<i>â ï¸ Vui lĂ²ng chá»n Ä‘á»§ TĂªn sao vĂ  Vá»‹ trĂ­ an.</i>';
    return;
  }

  const thang = BANG_THANG_SINH_SAO[sao]?.[cung];
  if (!thang) {
    box.innerHTML = `âŒ Sao <b>${sao}</b> an táº¡i <b>${cung}</b> chÆ°a cĂ³ dá»¯ liá»‡u thĂ¡ng sinh.`;
    return;
  }

  // TĂ­nh giá» sinh (náº¿u biáº¿t cung Má»‡nh tháº­t)
  let gioSinh = null;
  if (menhCung) {
    gioSinh = timGioSinhTheoMenh(thang, menhCung);
  }

  let html = `âœ… Sao <b>${sao}</b> an táº¡i <b>${cung}</b> â†’ 
  <span style="color:#006400;">ThĂ¡ng sinh Ă¢m lá»‹ch lĂ  <b>thĂ¡ng ${thang}</b></span>`;

  if (gioSinh)
    html += `<br>đŸ•’ Giá» sinh phĂ¹ há»£p theo Má»‡nh (${menhCung}) lĂ : <b style="color:#b22222;">Giá» ${gioSinh}</b>`;
  else
    html += `<br><i>â ï¸ ChÆ°a xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c cung Má»‡nh nĂªn chÆ°a tra Ä‘Æ°á»£c Giá» sinh.</i>`;


// âœ… LÆ°u biáº¿n toĂ n cá»¥c Ä‘á»ƒ pháº§n 7 truy cáº­p
window.thangSinhGlobal = thang;
window.gioSinhGlobal = gioSinh;

  box.innerHTML = html;
}

// Gá»i khi trang táº£i xong
window.addEventListener("load", khoiTaoSaoThang);

const CUNG_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
const GIO_CHI   = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

// =======================================================
// đŸ”¹ Táº O DROPDOWN 1 SAO (Ă‚n Quang / ThiĂªn QuĂ½ / Tam Thai / BĂ¡t Tá»a)
// =======================================================
function khoiTaoSaoNgay() {
  const saoSelect = document.getElementById("saoNgaySelect");
  const viTriSelect = document.getElementById("saoNgayViTri");
  if (!saoSelect || !viTriSelect) return;

  saoSelect.innerHTML = `<option value="">â€” Chá»n Sao â€”</option>
    <option value="An Quang">Ă‚n Quang</option>
    <option value="Thien Quy">ThiĂªn QuĂ½</option>
    <option value="Tam Thai">Tam Thai</option>
    <option value="Bat Toa">BĂ¡t Tá»a</option>`;

  viTriSelect.innerHTML = `<option value="">â€” Chá»n Cung â€”</option>`;
  ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"].forEach(c=>{
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
    box.innerHTML = "<i>â ï¸ Vui lĂ²ng chá»n Sao vĂ  Vá»‹ trĂ­ an.</i>";
    return;
  }

  // âœ… Láº¥y thĂ¡ng & giá» tá»« pháº§n 6
  const gioSinh = window.gioSinhGlobal || null;
  const thangSinh = window.thangSinhGlobal || null;
  const menhCung = document.getElementById("ketQuaMenh")?.dataset?.menh || "?";

  if (!gioSinh || !thangSinh) {
    box.innerHTML = "<i>â ï¸ ChÆ°a cĂ³ dá»¯ liá»‡u thĂ¡ng vĂ  giá» sinh (hĂ£y tra Sao theo thĂ¡ng trÆ°á»›c).</i>";
    return;
  }

  // âœ… Chuáº©n bá»‹ biáº¿n toĂ n cá»¥c
  let ketQuaText = "";
  let ngayList = [];   // đŸ‘ˆ khai bĂ¡o ngay Ä‘Ă¢y Ä‘á»ƒ toĂ n hĂ m dĂ¹ng Ä‘Æ°á»£c

  // === Ă‚N QUANG ===
  if (sao === "An Quang") {
    const CUNG_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const GIO_CHI   = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

    const posTuat = CUNG_TUVI.indexOf("Tuáº¥t");
    const gioIndex = GIO_CHI.indexOf(gioSinh);
    const posAnQuang = CUNG_TUVI.indexOf(cung);

    const posVanXuong = (posTuat - gioIndex + 12) % 12;
    const kc = (posAnQuang - posVanXuong + 12) % 12;
    let ngay = kc + 2;
    if (ngay > 12) ngay -= 12;

    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      đŸ“… Sao <b>Ă‚n Quang</b> an táº¡i <b>${cung}</b><br>
      âœ <span style="color:#006400;">NgĂ y sinh Ă¢m lá»‹ch cĂ³ thá»ƒ lĂ  <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giá» ${gioSinh}, thĂ¡ng ${thangSinh})</small>
    `;
  }

  // === THIĂN QUĂ ===
  else if (sao === "Thien Quy") {
    const CUNG_THUAN = ["ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o"];
    const GIO_CHI   = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

    const gioIndex = GIO_CHI.indexOf(gioSinh);
    const posThienQuy = CUNG_THUAN.indexOf(cung);
    const posVanKhuc = (CUNG_THUAN.indexOf("ThĂ¬n") + gioIndex) % 12;
    const kc = (posVanKhuc - posThienQuy + 12) % 12;
    let ngay = kc + 2;
    if (ngay > 12) ngay -= 12;

    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      đŸ“… Sao <b>ThiĂªn QuĂ½</b> an táº¡i <b>${cung}</b><br>
      âœ <span style="color:#006400;">NgĂ y sinh Ă¢m lá»‹ch cĂ³ thá»ƒ lĂ  <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giá» ${gioSinh}, thĂ¡ng ${thangSinh})</small>
    `;
  }

  // === TAM THAI ===
  else if (sao === "Tam Thai") {
    const VONG_TT = ["ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o"];
    const posTaPhu = (VONG_TT.indexOf("ThĂ¬n") + (thangSinh - 1)) % 12;
    const posTT = VONG_TT.indexOf(cung);
    const kc = (posTT - posTaPhu + 12) % 12;
    const ngay = kc + 1;
    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      đŸ“… Sao <b>Tam Thai</b> an táº¡i <b>${cung}</b><br>
      âœ <span style="color:#006400;">NgĂ y sinh Ă¢m lá»‹ch cĂ³ thá»ƒ lĂ  <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giá» ${gioSinh}, thĂ¡ng ${thangSinh})</small>
    `;
  }

  // === BĂT Tá»ŒA ===
  else if (sao === "Bat Toa") {
    const VONG_BT = ["Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u"];
    const posHuuBat = (VONG_BT.indexOf("Tuáº¥t") - (thangSinh - 1) + 12*10) % 12;
    const posBT = VONG_BT.indexOf(cung);
    const kc = (posHuuBat - posBT + 12) % 12;
    const ngay = kc + 1;
    for (let i = ngay; i <= 30; i += 12) ngayList.push(i);

    ketQuaText = `
      đŸ“… Sao <b>BĂ¡t Tá»a</b> an táº¡i <b>${cung}</b><br>
      âœ <span style="color:#006400;">NgĂ y sinh Ă¢m lá»‹ch cĂ³ thá»ƒ lĂ  <b>${ngayList.join(", ")}</b></span>
      <br><small>(Giá» ${gioSinh}, thĂ¡ng ${thangSinh})</small>
    `;
  }

  // === Náº¿u chÆ°a cĂ³ cĂ´ng thá»©c
  else {
    ketQuaText = `<i>â ï¸ Sao ${sao} chÆ°a cĂ³ cĂ´ng thá»©c tra ngÆ°á»£c.</i>`;
  }

  // âœ… In káº¿t quáº£ pháº§n 7
  box.innerHTML = ketQuaText;

  // âœ… LÆ°u láº¡i danh sĂ¡ch ngĂ y cá»§a pháº§n 7
  window.ngayAnQuang = ngayList;

  // âœ… So khá»›p giao vá»›i pháº§n 5 (ChĂ­nh tinh)
  if (window.ngayChinhTinh && window.ngayChinhTinh.length && window.ngayAnQuang.length) {
    const ngayTrung = window.ngayAnQuang.filter(n => window.ngayChinhTinh.includes(n));
    if (ngayTrung.length > 0) {
      box.innerHTML += `
        <p style="margin-top:6px;">
          đŸ”¹ <b>Giao vá»›i ngĂ y pháº§n ChĂ­nh Tinh:</b>
          <b style="color:#007700;">${ngayTrung.join(", ")}</b>
        </p>`;
    } else {
      box.innerHTML += `
        <p style="margin-top:6px;color:#888;">
          â ï¸ KhĂ´ng cĂ³ ngĂ y trĂ¹ng giá»¯a pháº§n ChĂ­nh Tinh vĂ  Ă‚n Quang / ThiĂªn QuĂ½.
        </p>`;
    }
	// âœ… LÆ°u toĂ n cá»¥c Ä‘á»ƒ pháº§n tra ngÆ°á»£c tá»•ng há»£p
window.ngayGiaoChinhTinh = ngayTrung;

  }
}



window.addEventListener("load", khoiTaoSaoNgay);

/* =======================================================
   đŸ”¹ KHá»I Táº O Dá»® LIá»†U & HĂ€M PHĂ‚N TĂCH
   ======================================================= */
document.addEventListener("DOMContentLoaded", ()=>{
  const CUNG_LIST = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_CHUC = ["Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch","ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"];
  const CUC_LOAI = ["Thá»§y nhá»‹ cá»¥c","Má»™c tam cá»¥c","Kim tá»© cá»¥c","Thá»• ngÅ© cá»¥c","Há»a lá»¥c cá»¥c"];
  const CAN_LIST = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
  const THAI_TUE = ["ThĂ¡i Tuáº¿","Thiáº¿u DÆ°Æ¡ng","Tang MĂ´n","Thiáº¿u Ă‚m","Quan PhĂ¹","Tá»­ PhĂ¹","Tuáº¿ PhĂ¡","Long Äá»©c","Báº¡ch Há»•","PhĂºc Äá»©c","Äiáº¿u KhĂ¡ch","Trá»±c PhĂ¹"];
  const BAC_SI = ["BĂ¡c SÄ©","Lá»±c SÄ©","Thanh Long","Tiá»ƒu Hao","TÆ°á»›ng QuĂ¢n","Táº¥u ThÆ°","Phi LiĂªm","Há»· Tháº§n","Bá»‡nh PhĂ¹","Äáº¡i Hao","Phá»¥c Binh","Quan Phá»§"];
  const TU_VI_HE = ["Tá»­ Vi","ThiĂªn Phá»§","ThiĂªn CÆ¡","ThĂ¡i DÆ°Æ¡ng","LiĂªm Trinh","Cá»± MĂ´n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","Tháº¥t SĂ¡t","VÅ© KhĂºc","Tham Lang","ThiĂªn Äá»“ng","PhĂ¡ QuĂ¢n","ThĂ¡i Ă‚m"];
  const PHU_HE = ["KhĂ´ng",...TU_VI_HE];
  const SAO_THANG = ["Táº£ PhĂ¹","Há»¯u Báº­t","ThiĂªn HĂ¬nh","ThiĂªn RiĂªu","ThiĂªn Y","ThiĂªn Giáº£i","Äá»‹a Giáº£i"];
  const SAO_GIO = ["VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p","Thai Phá»¥","Phong CĂ¡o","Linh Tinh","Há»a Tinh"];
  const SAO_NGAY = ["Ă‚n Quang","ThiĂªn QuĂ½","Tam Thai","BĂ¡t Tá»a"];

 const CUC_SO_MAP = {
  "Thá»§y nhá»‹ cá»¥c": [2,12,22,32,42,52,62,72,82,92,102,112],
  "Má»™c tam cá»¥c": [3,13,23,33,43,53,63,73,83,93,103,113],
  "Kim tá»© cá»¥c": [4,14,24,34,44,54,64,74,84,94,104,114],
  "Thá»• ngÅ© cá»¥c": [5,15,25,35,45,55,65,75,85,95,105,115],
  "Há»a lá»¥c cá»¥c": [6,16,26,36,46,56,66,76,86,96,106,116]
};


  function fillSelect(selId, arr){
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = arr.map(x=>`<option>${x}</option>`).join("");
  }

  // --- Khá»Ÿi táº¡o dropdown ---
  fillSelect("cungChucSelect", CUNG_CHUC);
  fillSelect("cungChucViTri", CUNG_LIST);
  fillSelect("thaiTueSelect", THAI_TUE);
  fillSelect("thaiTueViTri", CUNG_LIST);
  fillSelect("cucLoaiSelect", CUC_LOAI);
  fillSelect("cucSoSelect", CUC_SO_MAP["Thá»§y nhá»‹ cá»¥c"]);
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

  // --- Tá»± khá»Ÿi táº¡o hiá»ƒn thá»‹ má»‡nh láº§n Ä‘áº§u ---
  tinhCungMenh();

  // --- Khi Ä‘á»•i loáº¡i cá»¥c ---
  document.getElementById("cucLoaiSelect").addEventListener("change",(e)=>{
    const loai = e.target.value;
    fillSelect("cucSoSelect", CUC_SO_MAP[loai] || []);
  });

  // --- ChĂ­nh tinh phá»¥ thuá»™c chĂ­nh tinh 1 ---
  window.updateChinhTinhPhu = function(){
    const s1 = document.getElementById("tuviSelect").value;
    const DOI_TINH_MAP = {
      "Tá»­ Vi": ["ThiĂªn Phá»§","ThiĂªn TÆ°á»›ng","Tháº¥t SĂ¡t","PhĂ¡ QuĂ¢n","Tham Lang"],
      "ThiĂªn Phá»§": ["Tá»­ Vi","VÅ© KhĂºc","LiĂªm Trinh"],
      "ThĂ¡i DÆ°Æ¡ng": ["ThĂ¡i Ă‚m","Cá»± MĂ´n","ThiĂªn LÆ°Æ¡ng"],
      "ThĂ¡i Ă‚m": ["ThĂ¡i DÆ°Æ¡ng","ThiĂªn CÆ¡","ThiĂªn Äá»“ng"],
      "LiĂªm Trinh": ["Tháº¥t SĂ¡t","ThiĂªn Phá»§","Tham Lang","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng"],
      "VÅ© KhĂºc": ["ThiĂªn TÆ°á»›ng","ThiĂªn Phá»§","Tham Lang","Tháº¥t SĂ¡t","PhĂ¡ QuĂ¢n"]
    };
    const allowed = ["KhĂ´ng", ...(DOI_TINH_MAP[s1] || [])];
    fillSelect("phuSelect", allowed);
  };

  // =====================================================
  // đŸ§® PHĂ‚N TĂCH TRA NGÆ¯á»¢C LĂ Sá»
  // =====================================================
  document.getElementById("btnPhanTich").addEventListener("click",()=>{
  // đŸ‘‰ Láº¤Y Dá»® LIá»†U NÄ‚M SINH Tá»ª PHáº¦N 2 VĂ€ 4
const chiNam = document.getElementById("ketQuaChiNam")?.textContent.split("má»‡nh:")[0].trim() || "?";
const canNam = (window.ketQuaBacSi?.giaoCan?.[0]) || "?";
const namSinhText = `${canNam} ${chiNam}`;
// =====================================================
// đŸ”¹ QUY Äá»”I CAN CHI â†’ CĂC NÄ‚M DÆ¯Æ NG Lá»CH (1900â€“2100)
// =====================================================
const CAN = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
const CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

// Táº¡o báº£ng 60 nÄƒm Can Chi
function taoBangCanChi() {
  const danhSach = [];
  let canIndex = 0, chiIndex = 0;
  for (let nam = 1864; nam <= 2100; nam++) { // 1864 = GiĂ¡p TĂ½
    const canChi = CAN[canIndex] + " " + CHI[chiIndex];
    danhSach.push({ nam, canChi });
    canIndex = (canIndex + 1) % 10;
    chiIndex = (chiIndex + 1) % 12;
  }
  return danhSach;
}

const BANG_CAN_CHI = taoBangCanChi();

// HĂ m tĂ¬m cĂ¡c nÄƒm DÆ°Æ¡ng lá»‹ch tÆ°Æ¡ng á»©ng
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


    const THAI_TUE_CUNG = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const DIA_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
    // đŸ”¹ Æ¯u tiĂªn láº¥y giá»›i tĂ­nh Ä‘Ă£ tĂ­nh tá»« pháº§n 3 (Cá»¥c sá»‘)
// đŸ”¹ Æ¯u tiĂªn láº¥y giá»›i tĂ­nh Ä‘Ă£ tĂ­nh tá»« pháº§n 3 (Cá»¥c sá»‘)
let amDuongText = "";
const ketQuaCucText = document.getElementById("ketQuaCuc")?.textContent || "";

// TĂ¡ch riĂªng pháº§n giá»›i tĂ­nh (chá»‰ láº¥y cá»¥m DÆ°Æ¡ng/Ă‚m Nam/Ná»¯)
const matchGioiTinh = ketQuaCucText.match(/(DÆ°Æ¡ng|Ă‚m)\s+(Nam|Ná»¯)/);
if (matchGioiTinh) {
  amDuongText = `${matchGioiTinh[1]} ${matchGioiTinh[2]}`;
}

// Náº¿u pháº§n 3 chÆ°a cĂ³, láº¥y dá»± phĂ²ng tá»« pháº§n 3.1 (TrĂ ng Sinh)
if (!amDuongText) {
  const trangSinhText = document.getElementById("ketQuaTrangSinh")?.textContent || "";

  // Náº¿u cĂ³ sáºµn DÆ°Æ¡ng/Ă‚m Nam/Ná»¯ thĂ¬ láº¥y luĂ´n
  const matchTrangSinh = trangSinhText.match(/(DÆ°Æ¡ng|Ă‚m)\s+(Nam|Ná»¯)/);
  if (matchTrangSinh) {
    amDuongText = `${matchTrangSinh[1]} ${matchTrangSinh[2]}`;
  } else {
    // Náº¿u chá»‰ cĂ³ "Giá»›i tĂ­nh: Nam/Ná»¯" thĂ¬ suy ra Ă‚m DÆ°Æ¡ng dá»±a theo chá»¯ "Thuáº­n"/"Nghá»‹ch"
    const matchGioiTinh = trangSinhText.match(/Giá»›i\s*tĂ­nh\s*[:ï¼]?\s*(Nam|Ná»¯)/i);
    const matchChieu = trangSinhText.match(/(Thuáº­n|Nghá»‹ch)/i);
    if (matchGioiTinh) {
      const gioi = matchGioiTinh[1];
      const chieu = matchChieu ? matchChieu[1] : "";
      // â™ï¸ Quy táº¯c chuáº©n Tá»­ Vi: Thuáº­n â†’ DÆ°Æ¡ng Nam / Ă‚m Ná»¯ ; Nghá»‹ch â†’ Ă‚m Nam / DÆ°Æ¡ng Ná»¯
      let amDuong = "";
      if (chieu === "Thuáº­n" && gioi === "Nam") amDuong = "DÆ°Æ¡ng";
      else if (chieu === "Thuáº­n" && gioi === "Ná»¯") amDuong = "Ă‚m";
      else if (chieu === "Nghá»‹ch" && gioi === "Nam") amDuong = "Ă‚m";
      else if (chieu === "Nghá»‹ch" && gioi === "Ná»¯") amDuong = "DÆ°Æ¡ng";

      amDuongText = `${amDuong} ${gioi}`.trim();
    }
  }
}




// Náº¿u váº«n khĂ´ng cĂ³, láº¥y cĂ¡ch cÅ© theo Ă‚m DÆ°Æ¡ng má»‡nh
if (!amDuongText) {
  const isDuong = ["Dáº§n","Ngá»","Tuáº¥t","ThĂ¢n","TĂ½","ThĂ¬n"].includes(viTriThaiTue);
  amDuongText = isDuong ? "DÆ°Æ¡ng Nam / Ă‚m Ná»¯" : "DÆ°Æ¡ng Ná»¯ / Ă‚m Nam";
}



    const CUC_MAP = {
      "Thá»§y nhá»‹ cá»¥c":"Thá»§y Nhá»‹ Cá»¥c",
      "Má»™c tam cá»¥c":"Má»™c Tam Cá»¥c",
      "Kim tá»© cá»¥c":"Kim Tá»© Cá»¥c",
      "Thá»• ngÅ© cá»¥c":"Thá»• NgÅ© Cá»¥c",
      "Há»a lá»¥c cá»¥c":"Há»a Lá»¥c Cá»¥c"
    };
    const cucSo = CUC_MAP[loaiCuc] || loaiCuc;

    const LOC_TON_MAP = {
      "Tá»µ": ["BĂ­nh","Máº­u"], "Ngá»": ["Äinh","Ká»·"], "MĂ¹i": ["Canh","áº¤t"],
      "ThĂ¢n": ["TĂ¢n","BĂ­nh"], "Dáº­u": ["NhĂ¢m","Äinh"], "Tuáº¥t": ["QuĂ½","Máº­u"],
      "Há»£i": ["GiĂ¡p","Ká»·"], "TĂ½": ["áº¤t","Canh"], "Sá»­u": ["BĂ­nh","TĂ¢n"],
      "Dáº§n": ["Äinh","NhĂ¢m"], "MĂ£o": ["Máº­u","QuĂ½"], "ThĂ¬n": ["Ká»·","GiĂ¡p"]
    };

    // TODO: TĂ­nh cĂ´ng thá»©c chi tiáº¿t ThĂ¡ng / NgĂ y / Giá»
  // đŸ—“ï¸ Láº¥y thĂ¡ng sinh & giá» sinh tá»« pháº§n 6 (náº¿u Ä‘Ă£ cĂ³)
const thangTuSao = window.thangSinhGlobal || null;
const gioTuSao = window.gioSinhGlobal || null;

let thangSinh = "";
if (thangTuSao) {
  thangSinh = `ThĂ¡ng sinh Ă¢m lá»‹ch lĂ  <b>thĂ¡ng ${thangTuSao}</b>`;
} else {
  thangSinh = `Äang tĂ­nh theo sao thĂ¡ng (${saoThang || "?"} táº¡i ${viTriSaoThang || "?"})`;
}

// đŸ“… Láº¥y ngĂ y sinh tá»« pháº§n 7 (náº¿u Ä‘Ă£ cĂ³)
// đŸ“… Láº¥y ngĂ y sinh tá»« pháº§n 7 (náº¿u Ä‘Ă£ cĂ³)
let ngaySinh = "";
const ngayList = window.ngayAnQuang || [];
const ngayGiao = window.ngayGiaoChinhTinh || [];

if (ngayGiao.length > 0) {
  // Æ¯u tiĂªn láº¥y ngĂ y giao vĂ¬ Ä‘Ă¢y lĂ  káº¿t quáº£ chĂ­nh xĂ¡c nháº¥t
  ngaySinh = `NgĂ y Ă¢m lá»‹ch lĂ  <b>${ngayGiao[0]}</b>`;
} else if (ngayList.length > 0) {
  // Náº¿u chÆ°a cĂ³ giao thĂ¬ hiá»ƒn thá»‹ danh sĂ¡ch dá»± Ä‘oĂ¡n
  ngaySinh = `NgĂ y Ă¢m lá»‹ch cĂ³ thá»ƒ lĂ  ${ngayList.join(", ")}`;
} else {
  ngaySinh = `Äang tĂ­nh theo sao ngĂ y (${saoNgay || "?"} táº¡i ${viTriSaoNgay || "?"})`;
}

const gioSinh = gioTuSao ? `Giá» ${gioTuSao}` : "?";


  const ketQua = `
đŸ“œ Káº¾T QUáº¢ TRA NGÆ¯á»¢C
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â€¢ NÄƒm sinh: ${namSinhText}
  â†³ NÄƒm DÆ°Æ¡ng lá»‹ch tÆ°Æ¡ng á»©ng: ${namDuongTuongUng.join(", ")}
â€¢ Giá»›i tĂ­nh: ${amDuongText}
â€¢ ThĂ¡ng sinh: ${thangSinh}
â€¢ NgĂ y sinh: ${ngaySinh}
â€¢ Giá» sinh: ${gioSinh}
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`;
document.getElementById("traNguocKetQua").innerHTML = ketQua;

  });
});

/* =====================================================
   đŸ“… PHáº¦N 5: Báº¢NG KHá»I THĂNG & CHI TIáº¾T THĂNG Ă‚M
   -----------------------------------------------------
   - Dropdown nÄƒm cĂ³ thá»ƒ cuá»™n, gĂµ
   - Máº·c Ä‘á»‹nh hiá»ƒn thá»‹ nÄƒm 2025 khi má»Ÿ trang
   ===================================================== */

// đŸ§­ Khá»Ÿi táº¡o dropdown nÄƒm (1900â€“2100)
function initYearDropdown() {
  const sel = document.getElementById("monthYear");
  sel.innerHTML = "";
  for (let y = 1900; y <= 2100; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === 2025) opt.selected = true; // đŸŸ¢ NÄƒm máº·c Ä‘á»‹nh
    sel.appendChild(opt);
  }
}

// đŸŸ¢ Khi Ä‘á»•i nÄƒm â†’ cáº­p nháº­t báº£ng
function updateMonthTable() {
  const nam = parseInt(document.getElementById("monthYear").value);
  if (!isNaN(nam)) createMonthTable(nam);
}

// ===== Báº¢NG KHá»I THĂNG =====
function createMonthTable(nam) {
  const canChiNam = canChiYear(nam);
  const [can] = canChiNam.split(" ");
  const leap = getLeapMonthOfYear(nam, TZ);

  document.getElementById("canChiLabel").textContent = "NÄƒm: " + canChiNam;

  const header = ["<tr><th>ThĂ¡ng</th>"];
  const start  = ["<tr><td>Khá»Ÿi</td>"];
  const cc     = ["<tr><td>Can Chi</td>"];

  function add(thang, isLeap) {
    const s = convertLunarToSolar(1, thang, nam, isLeap, TZ);
    if (!s || s[0] === 0) return;
    const cT = CAN_THANG[can][thang - 1];
    const ch = CHI[(thang + 1) % 12];
    const lb = isLeap ? `${thang} (nhuáº­n)` : thang;
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

// ===== Xá»¬ LĂ CLICK TRĂN Báº¢NG =====
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
      const match = text.match(/^(\d+)(?:\s*\(nhuáº­n\))?$/);
      if (!match) return;
      const thang = parseInt(match[1]);
      const isLeap = text.includes("nhuáº­n") ? 1 : 0;
      showMonthDetail(thang, nam, isLeap);
    });
  });
}

// ===== HIá»‚N THá» CHI TIáº¾T Tá»ªNG THĂNG =====
function showMonthDetail(thang, nam, isLeap = 0) {
  const canChiNam = canChiYear(nam);

  // đŸª¶ TĂ­nh Can Chi thĂ¡ng
  const [canNam] = canChiNam.split(" ");
  const cT = CAN_THANG[canNam][thang - 1];
  const chiThang = CHI[(thang + 1) % 12];
  const canChiThang = `${cT} ${chiThang}`;

  // đŸª¶ TiĂªu Ä‘á» cĂ³ thĂªm Can Chi thĂ¡ng
  let html = `
    <h3 style="text-align:center;margin:10px 0;">
      Chi tiáº¿t thĂ¡ng ${thang}${isLeap ? " (nhuáº­n)" : ""} â€“ ThĂ¡ng ${canChiThang} â€“ ${canChiNam} (${nam})
    </h3>
    <table style="width:100%;border-collapse:collapse;text-align:center;">
  `;

  let dRow = "<tr><th>NgĂ y</th>";
  let sRow = "<tr><th>DÆ°Æ¡ng</th>";
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

  // đŸ§® Duyá»‡t tá»«ng ngĂ y trong thĂ¡ng
  for (let d = 1; d <= days; d++) {
    const s = convertLunarToSolar(d, thang, nam, isLeap, TZ);
    const ccD = canChiDay(s[2], s[1], s[0]);

    dRow += `<td style="border:1px solid #000;color:#c00;font-weight:bold;">${d}</td>`;
    sRow += `<td style="border:1px solid #000;">${s[0]}/${s[1]}</td>`;
    cRow += `<td style="border:1px solid #000;">${ccD}</td>`;

    if (d % 10 === 0 || d === days) {
      dRow += "</tr>"; sRow += "</tr>"; cRow += "</tr>";
      html += dRow + sRow + cRow;
      dRow = "<tr><th>NgĂ y</th>"; 
      sRow = "<tr><th>DÆ°Æ¡ng</th>"; 
      cRow = "<tr><th>Can Chi</th>";
    }
  }

  html += "</table>";
  document.getElementById("monthDetail").innerHTML = html;

  // đŸ¯ Cho phĂ©p click chá»n ngĂ y â†’ tĂ´ Ä‘á» 3 Ă´ cĂ¹ng cá»™t
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


// ===== Táº O DROPDOWN NÄ‚M VĂ€ Tá»° HIá»‚N THá» Máº¶C Äá»NH =====
function initYearDropdown() {
  const container = document.getElementById("monthYear");
  if (!container) return;

  // Táº¡o dropdown náº¿u chÆ°a cĂ³
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

  // Khi Ä‘á»•i nÄƒm â†’ cáº­p nháº­t Can Chi vĂ  táº¡o láº¡i báº£ng
  select.addEventListener("input", () => {
    const year = parseInt(select.value);
    const canChi = canChiYear(year);
    document.getElementById("canChiLabel").textContent = `NÄƒm: ${canChi}`;
    createMonthTable(year);
  });

  // Gá»i máº·c Ä‘á»‹nh nÄƒm 2025
  const canChi = canChiYear(2025);
  document.getElementById("canChiLabel").textContent = `NÄƒm: ${canChi}`;
  createMonthTable(2025);
}

// đŸ€ Khi táº£i trang
document.addEventListener("DOMContentLoaded", () => {
  initYearDropdown();
});











// =====================================================
// đŸŒŸ Lá»P 1 â€“ Vá» TRĂ CUNG (phiĂªn báº£n chuáº©n theo layout má»›i)
// -----------------------------------------------------
function anLop1_ViTriCung(data) {
  const CAN_THANG = {
    "GiĂ¡p":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
    "áº¤t":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
    "BĂ­nh":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
    "Äinh":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
    "Máº­u":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"],
    "Ká»·":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
    "Canh":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
    "TĂ¢n":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
    "NhĂ¢m":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
    "QuĂ½":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"]
  };

  // Láº¥y ThiĂªn Can nÄƒm sinh
  const canNam = data.canChiNam.split(" ")[0];
  const canThangList = CAN_THANG[canNam] || CAN_THANG["GiĂ¡p"];

  // đŸ”¹ Báº£n Ä‘á»“ vĂ²ng 12 cung (chuáº©n báº¡n xĂ¡c nháº­n)
  const cungMap = [
    { cell: 9,  chi: "Dáº§n",  idx: 0 },
    { cell: 7,  chi: "MĂ£o",  idx: 1 },
    { cell: 5,  chi: "ThĂ¬n", idx: 2 },
    { cell: 1,  chi: "Tá»µ",   idx: 3 },
    { cell: 2,  chi: "Ngá»",  idx: 4 },
    { cell: 3,  chi: "MĂ¹i",  idx: 5 },
    { cell: 4,  chi: "ThĂ¢n", idx: 6 },
    { cell: 6,  chi: "Dáº­u",  idx: 7 },
    { cell: 8,  chi: "Tuáº¥t", idx: 8 },
    { cell: 12, chi: "Há»£i",  idx: 9 },
    { cell: 11, chi: "TĂ½",   idx: 10 },
    { cell: 10, chi: "Sá»­u",  idx: 11 }
  ];

  // đŸ”¹ GĂ¡n dá»¯ liá»‡u (thĂ¡ng 1 = Dáº§n)
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
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };
// =====================================================
// đŸŒŸ Lá»P 2 â€“ Má»†NH (Tá»± Ä‘á»™ng an theo thĂ¡ng Ă¢m & giá» sinh, cĂ³ há»— trá»£ <THĂ‚N>)
// -----------------------------------------------------
function anLop2_Menh(data) {
  const CUNG_CHUC = [
    "Má»†NH","HUYNH Äá»†","PHU THĂ","Tá»¬ Tá»¨C","TĂ€I Báº CH","Táº¬T ĂCH",
    "THIĂN DI","NĂ” Bá»˜C","QUAN Lá»˜C","ÄIá»€N TRáº CH","PHĂC Äá»¨C","PHá»¤ MáºªU"
  ];
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

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

  

  // âœ… KhĂ´ng dĂ¹ng innerHTML â€” chá»‰ cáº­p nháº­t hoáº·c thĂªm pháº§n tá»­ con
  Object.entries(cungChucMap).forEach(([tenCung, tenChuc]) => {
    const cell = document.getElementById("cell" + CUNG_TO_CELL[tenCung]);
    if (!cell) return;

    let layer2 = cell.querySelector(".layer-2");
    if (!layer2) {
      layer2 = document.createElement("div");
      layer2.className = "layer-2";
      cell.appendChild(layer2);
    }

    // Giá»¯ nguyĂªn DOM, chá»‰ cáº­p nháº­t text náº¿u cáº§n
    let tenEl = layer2.querySelector(".ten-cung");
    if (!tenEl) {
      tenEl = document.createElement("div");
      tenEl.className = "ten-cung";
      layer2.appendChild(tenEl);
    }
    tenEl.textContent = tenChuc;
// thĂªm Ä‘á»‹nh danh Ä‘á»ƒ tra cá»©u
tenEl.setAttribute("data-sao", tenChuc);
tenEl.style.pointerEvents = "auto";
tenEl.style.cursor = "pointer";





// đŸŸ¢ tĂ´ mĂ u tĂªn cung theo hĂ nh cá»§a cung
const hanh = nguHanhCuaCung(tenCung);
const colorByHanh = {
  "Há»a": "#ff4d4d",
  "Thá»•": "#e69500",
  "Má»™c": "#007a29",
  "Kim": "#000000",
  "Thá»§y": "#004cff"
}[hanh] || "#000";



tenEl.style.color = colorByHanh;

    // Cáº­p nháº­t style
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

  // âœ… Ghi láº¡i map Ä‘á»ƒ an ThĂ¢n sau nĂ y
  window.dataGlobal.cungChucMap = cungChucMap;
window.dataGlobal.tenCungMenh = cungMenh;

   return cungChucMap;

}







// =====================================================
// đŸŒŸ AN CUNG THĂ‚N â€“ Theo 6 quy táº¯c giá» sinh
// -----------------------------------------------------
function xacDinhCungThan(gioChi, cungChucMap) {
  const quyTac = {
    "TĂ½": "Má»†NH", "Ngá»": "Má»†NH",
    "Dáº§n": "QUAN Lá»˜C", "ThĂ¢n": "QUAN Lá»˜C",
    "Tuáº¥t": "TĂ€I Báº CH", "ThĂ¬n": "TĂ€I Báº CH",
    "Sá»­u": "PHĂC Äá»¨C", "MĂ¹i": "PHĂC Äá»¨C",
    "Tá»µ": "PHU THĂ", "Há»£i": "PHU THĂ",
    "MĂ£o": "THIĂN DI", "Dáº­u": "THIĂN DI"
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
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };

  const cell = document.getElementById("cell" + CUNG_TO_CELL[cungThan]);
  if (!cell) return;

  const layer2 = cell.querySelector(".layer-2");
  if (!layer2) return;

  // KhĂ´ng ghi Ä‘Ă¨ ná»™i dung, chá»‰ thĂªm 1 span
  if (!layer2.querySelector(".than-label")) {
    const span = document.createElement("span");
   span.className = "than-label";
span.textContent = " <THĂ‚N>";
span.setAttribute("data-sao", "An ThĂ¢n");
span.style.pointerEvents = "auto";
span.style.cursor = "pointer";

    span.style.fontWeight = "700";
    span.style.color = layer2.style.color || "#000";
    span.style.marginLeft = "3px";
    span.style.letterSpacing = "0.3px";
    layer2.appendChild(span);
  }
}






// đŸŒŸ HĂ m xĂ¡c Ä‘á»‹nh Cá»¥c Sá»‘ chuáº©n theo Can NÄƒm & Cung Má»‡nh
function xacDinhCucSo(canChiNam, cungMenh) {
 window.CUC_SO_TINH_ROI = null;


  const can = (canChiNam || "")
    .normalize("NFC")
    .replace(/[ \s]+/g, " ")
    .trim()
    .split(" ")[0]
    .replace(/[^\p{L}]/gu, "");

    "Ngá»": "Ngá»-MĂ¹i", "MĂ¹i": "Ngá»-MĂ¹i",
    "ThĂ¢n": "ThĂ¢n-Dáº­u", "Dáº­u": "ThĂ¢n-Dáº­u",
    "Tuáº¥t": "Tuáº¥t-Há»£i", "Há»£i": "Tuáº¥t-Há»£i"
  };

  const nhom = nhomCung[chi];
  const cuc = bangCuc[can]?.[nhom] || "";

  console.log(`đŸŒ€ Cá»¥c sá»‘ xĂ¡c Ä‘á»‹nh: ${canChiNam} â€“ ${cungMenh} â†’ ${cuc}`);
  window.CUC_SO_TINH_ROI = cuc; // âœ… lÆ°u káº¿t quáº£ Ä‘á»ƒ láº§n sau bá» qua
  return cuc;
}


// =====================================================
// đŸŒŸ Dá»® LIá»†U Há»– TRá»¢ CHO Lá»P 3 â€“ CHĂNH TINH
// -----------------------------------------------------

// 1ï¸âƒ£ Báº£ng tra Cung Tá»­ Vi theo Cá»¥c vĂ  NgĂ y sinh (chuáº©n theo quy táº¯c báº¡n Ä‘Æ°a)
const BANG_TU_VI = {
  "Thá»§y nhá»‹ cá»¥c": [
    "Sá»­u","Dáº§n","Dáº§n","MĂ£o","MĂ£o","ThĂ¬n","ThĂ¬n","Tá»µ","Tá»µ","Ngá»",
    "Ngá»","MĂ¹i","MĂ¹i","ThĂ¢n","ThĂ¢n","Dáº­u","Dáº­u","Tuáº¥t","Tuáº¥t","Há»£i",
    "Há»£i","TĂ½","TĂ½","Sá»­u","Sá»­u","Dáº§n","Dáº§n","MĂ£o","MĂ£o","ThĂ¬n"
  ],

  "Má»™c tam cá»¥c": [
    "ThĂ¬n","Sá»­u","Dáº§n","Tá»µ","Dáº§n","MĂ£o","Ngá»","MĂ£o","ThĂ¬n","MĂ¹i",
    "ThĂ¬n","Tá»µ","ThĂ¢n","Tá»µ","Ngá»","Dáº­u","Ngá»","MĂ¹i","Tuáº¥t","MĂ¹i",
    "ThĂ¢n","Há»£i","ThĂ¢n","Dáº­u","TĂ½","Dáº­u","Tuáº¥t","Sá»­u","Tuáº¥t","Há»£i"
  ],

  "Kim tá»© cá»¥c": [
    "Há»£i","ThĂ¬n","Sá»­u","Dáº§n","TĂ½","Tá»µ","Dáº§n","MĂ£o","Sá»­u","Ngá»",
    "MĂ£o","ThĂ¬n","Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ","MĂ£o","ThĂ¢n","Tá»µ","Ngá»",
    "ThĂ¬n","Dáº­u","Ngá»","MĂ¹i","Tá»µ","Tuáº¥t","MĂ¹i","ThĂ¢n","Ngá»","Há»£i"
  ],

  "Thá»• ngÅ© cá»¥c": [
    "Ngá»","Há»£i","ThĂ¬n","Sá»­u","Dáº§n","MĂ¹i","TĂ½","Tá»µ","Dáº§n","MĂ£o",
    "ThĂ¢n","Sá»­u","Ngá»","MĂ£o","ThĂ¬n","Dáº­u","Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ",
    "Tuáº¥t","MĂ£o","ThĂ¢n","Tá»µ","Ngá»","Há»£i","ThĂ¬n","Dáº­u","Ngá»","MĂ¹i"
  ],

  "Há»a lá»¥c cá»¥c": [
    "Dáº­u","Ngá»","Há»£i","ThĂ¬n","Sá»­u","Dáº§n","Tuáº¥t","MĂ¹i","TĂ½","Tá»µ",
    "Dáº§n","MĂ£o","Há»£i","ThĂ¢n","Sá»­u","Ngá»","MĂ£o","ThĂ¬n","TĂ½","Dáº­u",
    "Dáº§n","MĂ¹i","ThĂ¬n","Tá»µ","Sá»­u","Tuáº¥t","MĂ£o","ThĂ¢n","Tá»µ","Ngá»"
  ]
};

// 2ï¸âƒ£ Cáº·p Tá»­ Vi â€“ ThiĂªn Phá»§ (theo trá»¥c Dáº§nâ€“ThĂ¢n, khĂ´ng pháº£i Ä‘á»‘i cung)
const CAP_TU_VI_PHU = {
  "Dáº§n": "Dáº§n", "MĂ£o": "Sá»­u", "ThĂ¬n": "TĂ½", "Tá»µ": "Há»£i",
  "Ngá»": "Tuáº¥t", "MĂ¹i": "Dáº­u", "ThĂ¢n": "ThĂ¢n", "Dáº­u": "MĂ¹i",
  "Tuáº¥t": "Ngá»", "Há»£i": "Tá»µ", "TĂ½": "ThĂ¬n", "Sá»­u": "MĂ£o"
};

// 3ï¸âƒ£ MĂ u sáº¯c theo hĂ nh ChĂ­nh Tinh
const HANH_CHINH_TINH = {
  // đŸŸ  Thá»•
  "Tá»¬ VI": "#e69500", "THIĂN PHá»¦": "#e69500",
  // đŸŒ¿ Má»™c
  "THIĂN CÆ ": "#007a29", "THIĂN LÆ¯Æ NG": "#007a29",
  // đŸ”¥ Há»a
  "LIĂM TRINH": "#ff4d4d", "THĂI DÆ¯Æ NG": "#ff4d4d",
  // đŸ’§ Thá»§y
  "Cá»° MĂ”N": "#004cff", "THIĂN TÆ¯á»NG": "#004cff",
  "PHĂ QUĂ‚N": "#004cff", "THIĂN Äá»’NG": "#004cff",
  "THĂI Ă‚M": "#004cff", "THAM LANG": "#004cff",
  // â« Kim
  "THáº¤T SĂT": "#000000", "VÅ¨ KHĂC": "#000000"
};



// Cho phĂ©p dĂ¹ng chung á»Ÿ cĂ¡c pháº§n khĂ¡c (VD: tra ngÆ°á»£c)
window.BANG_TU_VI = BANG_TU_VI;
window.CAP_TU_VI_PHU = CAP_TU_VI_PHU;


// =====================================================
// đŸŒŸ Lá»P 3 â€“ CHĂNH TINH (DEBUG FULL, Há»– TRá»¢ lunar dáº¡ng máº£ng + object)
// -----------------------------------------------------
function anLop3_ChinhTinh(data) {
    console.log("đŸ”µ [CT] Báº¯t Ä‘áº§u AN CHĂNH TINH...");
    console.log("đŸ”µ [CT] data.lunar:", data.lunar);
    console.log("đŸ”µ [CT] data.cucSo:", data.cucSo);

    // Náº¿u Ä‘ang gá»i láº¡i do cĂ¡c lá»›p khĂ¡c â†’ KHĂ”NG RESET
if (window.__DANG_AN_LOP3__) {
        console.warn("â›” anLop3 Ä‘ang cháº¡y â†’ bá» qua yĂªu cáº§u láº·p");
        return;
    }

    window.__DANG_AN_LOP3__ = true;
    console.log("đŸ”µ [CT] Báº¯t Ä‘áº§u AN CHĂNH TINH...");

    // Reset map Ä‘Ăºng chá»— (chá»‰ láº§n Ä‘áº§u)
    window.saoToCung = {};
    // đŸ” Há»— trá»£ cáº£ 2 dáº¡ng:
    //  - data.lunar = [ngay, thang]
    //  - data.lunar = { ngay: x, thang: y }
    let ngayAmRaw = 0;
    if (Array.isArray(data.lunar)) {
        ngayAmRaw = data.lunar[0];
    } else if (data.lunar && typeof data.lunar === "object") {
        ngayAmRaw = data.lunar.ngay;
    }
    const ngayAm = parseInt(ngayAmRaw, 10);
    console.log("đŸŸ£ [CT] ngayAm =", ngayAm);

    let cucSo = data.cucSo?.trim();
    console.log("đŸŸ£ [CT] cucSo =", cucSo);

    // đŸ”„ Fallback náº¿u chÆ°a cĂ³ Cá»¥c sá»‘
    if ((!cucSo || cucSo === "") && typeof xacDinhCucSo === "function") {
        const tenMenh = data.tenCungMenh || window.dataGlobal?.tenCungMenh || "";
        cucSo = xacDinhCucSo(data.canChiNam, tenMenh);
        data.cucSo = cucSo;
        window.dataGlobal.cucSo = cucSo;
        console.log("đŸŒ€ [CT] Bá»• sung Cá»¥c Sá»‘:", cucSo);
    }

    if (!cucSo || !BANG_TU_VI[cucSo]) {
        console.warn("âŒ [CT] KhĂ´ng tĂ¬m tháº¥y báº£ng Tá»¬ VI cho cá»¥c sá»‘:", cucSo);
        window.__DANG_AN_LOP3__ = false;
        return;
    }

    // đŸ§¹ Dá»n toĂ n bá»™ layer-3 trÆ°á»›c khi an láº¡i Ä‘á»ƒ trĂ¡nh trĂ¹ng sao
    document.querySelectorAll(".layer-3").forEach(el => el.innerHTML = "");

    const cungTuVi = BANG_TU_VI[cucSo][ngayAm - 1];
    console.log("đŸŸ£ [CT] cung Tá»­ Vi =", cungTuVi);

    if (!cungTuVi) {
        console.warn("âŒ [CT] cung Tá»­ Vi khĂ´ng há»£p lá»‡!");
        return;
    }

    const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const CUNG_TO_CELL = {
        "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,
        "ThĂ¬n":5,"Dáº­u":6,"MĂ£o":7,"Tuáº¥t":8,
        "Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
    };

    const idxTuVi = CUNG_THUAN.indexOf(cungTuVi);
    console.log("đŸŸ£ [CT] idxTuVi =", idxTuVi);

    if (idxTuVi === -1) {
        console.warn("âŒ [CT] KhĂ´ng tĂ¬m tháº¥y index cungTuVi trong CUNG_THUAN");
        return;
    }

    const cungThienPhu = CAP_TU_VI_PHU[cungTuVi];
    console.log("đŸŸ£ [CT] cung ThiĂªn Phá»§ =", cungThienPhu);

    const idxThienPhu = CUNG_THUAN.indexOf(cungThienPhu);
    console.log("đŸŸ£ [CT] idxThienPhu =", idxThienPhu);

    if (idxThienPhu === -1) {
        console.warn("âŒ [CT] KhĂ´ng tĂ¬m tháº¥y index cung ThiĂªn Phá»§");
        return;
    }

    const PATTERN_TU_VI = [
        "Tá»­ Vi","ThiĂªn CÆ¡",null,"ThĂ¡i DÆ°Æ¡ng","VÅ© KhĂºc","ThiĂªn Äá»“ng",
        null,null,"LiĂªm Trinh",null,null,null
    ];

    const PATTERN_THIEN_PHU = [
        "ThiĂªn Phá»§","ThĂ¡i Ă‚m","Tham Lang","Cá»± MĂ´n","ThiĂªn TÆ°á»›ng",
        "ThiĂªn LÆ°Æ¡ng","Tháº¥t SĂ¡t",null,null,null,"PhĂ¡ QuĂ¢n",null
    ];

    function getIndexNgich(start, step) { return (start - step + 12) % 12; }
    function getIndexThuan(start, step) { return (start + step) % 12; }

function addStarToCung(tenCung, tenSao) {
    console.log("đŸ“Œ ADD:", tenSao, "â†’", tenCung);

    const cellID = "cell" + CUNG_TO_CELL[tenCung];
    const cell = document.getElementById(cellID);
    if (!cell) return console.warn("   âŒ KhĂ´ng tĂ¬m tháº¥y cell:", cellID);

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

    // đŸ¨ MĂ€U NGÅ¨ HĂ€NH
    const mau = HANH_CHINH_TINH[tenSao.toUpperCase()];
    if (mau) divSao.style.color = mau;

    // đŸ”‘ KEY â€“ dĂ¹ng nguyĂªn tĂªn sao lĂ m key
    const keySao = tenSao; // "ThiĂªn Äá»“ng", "Tá»­ Vi", ...
    window.saoToCung[keySao] = tenCung;
    console.log("âœ… MAP SAO:", keySao, "â†’", tenCung);

    // â­â­ CLICK SAO Má» POPUP
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
    console.log("đŸŸ¢ [CT] â­ HOĂ€N Táº¤T AN Lá»P 3 â€“ CHĂNH TINH");
}




    // đŸŒŸ An chĂ²m Tá»¬ VI (ngÆ°á»£c)
    console.log("đŸ”¶ [CT] Báº¯t Ä‘áº§u an chĂ²m Tá»¬ VIâ€¦");
    for (let i = 0; i < PATTERN_TU_VI.length; i++) {
        const sao = PATTERN_TU_VI[i];
        if (!sao) continue;
        const idxTarget = getIndexNgich(idxTuVi, i);
        console.log(`   Tá»­ Vi step=${i}, idxTarget=${idxTarget}, cung=${CUNG_THUAN[idxTarget]}`);
console.log(`â­ï¸ AT STEP ${i}:`, sao, "â†’", CUNG_THUAN[idxTarget]);

        addStarToCung(CUNG_THUAN[idxTarget], sao);
    }

    // đŸŒŸ An chĂ²m THIĂN PHá»¦ (thuáº­n)
    console.log("đŸ”¶ [CT] Báº¯t Ä‘áº§u an chĂ²m THIĂN PHá»¦â€¦");
    for (let i = 0; i < PATTERN_THIEN_PHU.length; i++) {
        const sao = PATTERN_THIEN_PHU[i];
        if (!sao) continue;
        const idxTarget = getIndexThuan(idxThienPhu, i);
        console.log(`   ThiĂªn Phá»§ step=${i}, idxTarget=${idxTarget}, cung=${CUNG_THUAN[idxTarget]}`);
        addStarToCung(CUNG_THUAN[idxTarget], sao);
    }

    console.log("đŸŸ¢ [CT] â­ HOĂ€N Táº¤T AN Lá»P 3 â€“ CHĂNH TINH");
    console.log("đŸŸ¢ [CT] saoToCung =", JSON.stringify(window.saoToCung, null, 2));
console.log("đŸ¨ SAO Bá» Máº¤T:", [
 "Tá»­ Vi","ThiĂªn CÆ¡","ThĂ¡i DÆ°Æ¡ng","VÅ© KhĂºc","ThiĂªn Äá»“ng",
 "LiĂªm Trinh","Tham Lang","Cá»± MĂ´n","ThiĂªn TÆ°á»›ng",
 "ThiĂªn LÆ°Æ¡ng","Tháº¥t SĂ¡t","PhĂ¡ QuĂ¢n","ThiĂªn Phá»§","ThĂ¡i Ă‚m"
].filter(s => !window.saoToCung[s]));

}





















// =====================================================
// đŸŒŸ Lá»P 4 â€“ Cá»¤C Sá» (theo cĂ´ng thá»©c truyá»n thá»‘ng, hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ 12 cung)
// -----------------------------------------------------
function anLop4_CucSo(data) {
if (!data.tenCungMenh || typeof data.tenCungMenh !== "string") {
  console.warn("â ï¸ anLop4_CucSo bá»‹ gá»i khi chÆ°a cĂ³ tenCungMenh, dá»«ng láº¡i.");
  return;
}

  // đŸ§¹ Dá»n lá»›p Cá»¥c Sá»‘ cÅ©
  document.querySelectorAll('.layer-4').forEach(el => el.remove());

  // â™ï¸ Kiá»ƒm tra dá»¯ liá»‡u Ä‘áº§u vĂ o
  if (!data || !data.cucSo) {
    console.warn("â ï¸ Thiáº¿u dá»¯ liá»‡u Cá»¥c Sá»‘, bá» qua.");
    return;
  }

  // đŸŒŸ XĂ¡c Ä‘á»‹nh tĂªn cung Má»‡nh (Ä‘áº£m báº£o lĂ  chuá»—i, khĂ´ng pháº£i object)
let cungMenh = data.tenCungMenh;

// đŸ”¹ Náº¿u chÆ°a cĂ³ hoáº·c lĂ  object, láº¥y tá»« map {TĂ½:'Má»†NH',...}
if (!cungMenh && typeof data.cungMenh === "object") {
  const keys = Object.keys(data.cungMenh);
  // Æ¯u tiĂªn key cĂ³ giĂ¡ trá»‹ "Má»†NH", náº¿u khĂ´ng cĂ³ thĂ¬ láº¥y key Ä‘áº§u tiĂªn
  const found = keys.find(k => data.cungMenh[k] === "Má»†NH");
  cungMenh = found || keys[0];
}

// đŸ”¹ Ă‰p kiá»ƒu thĂ nh chuá»—i phĂ²ng trÆ°á»ng há»£p lĂ  object / null
if (typeof cungMenh !== "string") {
  try {
    cungMenh = String(cungMenh);
  } catch {
    cungMenh = "";
  }
}

// đŸ¨ Náº¿u váº«n khĂ´ng xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c thĂ¬ dá»«ng
if (!cungMenh) {
  console.warn("â ï¸ KhĂ´ng xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c Cung Má»‡nh Ä‘á»ƒ an Cá»¥c Sá»‘");
  return;
}

// =====================================================
// âœ… TĂ­nh vĂ  lÆ°u Cá»¥c Sá»‘ Ä‘Ăºng chuáº©n (Æ°u tiĂªn data.tenCungMenh tháº­t)
// -----------------------------------------------------
const tenMenh = (data.tenCungMenh && typeof data.tenCungMenh === "string")
  ? data.tenCungMenh.trim()
  : (typeof cungMenh === "string" ? cungMenh.trim() : "");

// đŸ”¹ LuĂ´n Ä‘á»“ng bá»™ láº¡i giĂ¡ trá»‹ Cá»¥c Sá»‘ chuáº©n
const ketQuaCuc = xacDinhCucSo(data.canChiNam, tenMenh);
data.cucSo = ketQuaCuc;
window.dataGlobal.cucSo = ketQuaCuc;
console.log(`âœ… anLop4_CucSo() sá»­ dá»¥ng Cá»¥c Sá»‘ CHUáº¨N: ${data.canChiNam} â€“ ${tenMenh} â†’ ${ketQuaCuc}`);




  // đŸŒŸ Báº£ng quy chiáº¿u cung & vá»‹ trĂ­
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,
    "ThĂ¬n":5,"Dáº­u":6,"MĂ£o":7,"Tuáº¥t":8,
    "Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };

  // đŸŒŸ GiĂ¡ trá»‹ khá»Ÿi Ä‘áº§u cá»§a tá»«ng loáº¡i cá»¥c
  const CUC_SO_START = {
    "Thá»§y nhá»‹ cá»¥c": 2,
    "Má»™c tam cá»¥c": 3,
    "Kim tá»© cá»¥c": 4,
    "Thá»• ngÅ© cá»¥c": 5,
    "Há»a lá»¥c cá»¥c": 6
  };

    const baseCuc = CUC_SO_START[data.cucSo];
  if (!baseCuc) {
    console.warn("â ï¸ KhĂ´ng xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c giĂ¡ trá»‹ khá»Ÿi Ä‘áº§u cá»§a Cá»¥c:", data.cucSo);
    return;
  }

  // đŸŒŸ XĂ¡c Ä‘á»‹nh chiá»u cháº¡y
  const gioiTinh = (data.gender || "").trim();
  const menhText = (data.menh || "").trim();
  const isThuan =
    (gioiTinh === "Nam" && menhText.includes("DÆ°Æ¡ng")) ||
    (gioiTinh === "Ná»¯" && menhText.includes("Ă‚m"));

  // đŸŒŸ Äá»“ng bá»™ Unicode Ä‘á»ƒ khĂ´ng bá»‹ lá»‡ch chá»¯ "TĂ½", "MĂ¹i"...
 const cungMenhStr = String(cungMenh || "").trim().normalize("NFC");
const CUNG_THUAN_NORM = CUNG_THUAN.map(c => String(c).normalize("NFC"));
const idxMenh = CUNG_THUAN_NORM.indexOf(cungMenhStr);

  if (idxMenh === -1) {
    console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y chá»‰ sá»‘ cung Má»‡nh:", cungMenh);
    return;
  }
console.log("âœ… Cung Má»‡nh há»£p lá»‡:", cungMenh);


  // đŸŒŸ HĂ m tiá»‡n Ă­ch
  const getIndexThuan = (start, step) => (start + step) % 12;
  const getIndexNgich = (start, step) => (start - step + 12) % 12;

  // đŸ§¹ XĂ³a cĂ¡c layer-4 cÅ© trÆ°á»›c khi an láº¡i
  document.querySelectorAll(".layer-4").forEach(el => el.remove());

  // đŸŒŸ An cá»¥c sá»‘ vĂ o tá»«ng cung
  for (let i = 0; i < 12; i++) {
    const idx = isThuan ? getIndexThuan(idxMenh, i) : getIndexNgich(idxMenh, i);
    const cung = CUNG_THUAN[idx];
    const cell = document.getElementById("cell" + CUNG_TO_CELL[cung]);
    if (!cell) continue;

    // Táº¡o layer 4 náº¿u chÆ°a cĂ³
    let layer4 = cell.querySelector(".layer-4");
    if (!layer4) {
      layer4 = document.createElement("div");
      layer4.className = "layer-4";
      cell.appendChild(layer4);
    }

    // Hiá»ƒn thá»‹ giĂ¡ trá»‹ Cá»¥c sá»‘ (2,12,22,â€¦)
    const value = baseCuc + i * 10;
    const div = document.createElement("div");
    div.textContent = value;
    layer4.appendChild(div);
  }

  console.log(`âœ… Lá»›p 4 â€“ Cá»¥c Sá»‘ an xong (${data.cucSo}, ${isThuan ? "thuáº­n" : "nghá»‹ch"}) táº¡i cung ${cungMenh}`);
}

// =====================================================
// đŸŒŸ Lá»P 5 â€“ NGÅ¨ HĂ€NH CUNG (Cá» Äá»NH)
// -----------------------------------------------------
function nguHanhCuaCung(tenCung) {
  const NGU_HANH_CUNG = {
    "Dáº§n": "+Má»™c", "MĂ£o": "-Má»™c", "ThĂ¬n": "+Thá»•", "Tá»µ": "-Há»a",
    "Ngá»": "+Há»a", "MĂ¹i": "-Thá»•", "ThĂ¢n": "+Kim", "Dáº­u": "-Kim",
    "Tuáº¥t": "+Thá»•", "Há»£i": "-Thá»§y", "TĂ½": "+Thá»§y", "Sá»­u": "-Thá»•"
  };
  const val = NGU_HANH_CUNG[tenCung] || "";
  // chá»‰ láº¥y pháº§n chá»¯ HĂ nh (Má»™c, Há»a...) bá» dáº¥u +/-
  return val.replace(/[+-]/g, "");
}
function anLop5_NguHanhCung() {
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,
    "ThĂ¬n":5,"Dáº­u":6,"MĂ£o":7,"Tuáº¥t":8,
    "Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };

  const NGU_HANH_CUNG = {
    "Dáº§n": "+Má»™c", "MĂ£o": "-Má»™c", "ThĂ¬n": "+Thá»•", "Tá»µ": "-Há»a",
    "Ngá»": "+Há»a", "MĂ¹i": "-Thá»•", "ThĂ¢n": "+Kim", "Dáº­u": "-Kim",
    "Tuáº¥t": "+Thá»•", "Há»£i": "-Thá»§y", "TĂ½": "+Thá»§y", "Sá»­u": "-Thá»•"
  };

  for (const [cung, cellId] of Object.entries(CUNG_TO_CELL)) {
    const cell = document.getElementById("cell" + cellId);
    if (!cell) continue;

    // Táº¡o khá»‘i bao riĂªng cho lá»›p 5
    let layer5 = cell.querySelector(".layer-5");
    if (!layer5) {
      layer5 = document.createElement("div");
      layer5.className = "layer-5";
      cell.appendChild(layer5);
    }

    // Táº¡o div con cá»‘ Ä‘á»‹nh vá»‹ trĂ­ (giá»‘ng layer4-div)
    const div = document.createElement("div");
    div.className = "layer5-div";
    div.textContent = NGU_HANH_CUNG[cung];
    layer5.innerHTML = ""; // reset náº¿u cĂ³ cÅ©
    layer5.appendChild(div);
  }

  console.log("âœ… Lá»›p 5 â€“ NgÅ© hĂ nh cung Ä‘Ă£ an xong.");
}

// =====================================================
// đŸŒŸ Lá»P 6 â€“ Há»† THá»NG 2 Cá»˜T CĂT & HUNG (Tá»”NG Há»¢P)
// =====================================================

// âœ… HĂ m gá»‘c thĂªm sao (dĂ¹ng cho táº¥t cáº£ nhĂ³m)
function themSao(cung, tenSao, nhom, loai) {

  const cellMap = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };
  const cell = document.getElementById("cell" + cellMap[cung]);
  if (!cell) return;

  // đŸ”¹ Táº¡o hoáº·c tĂ¬m layer 6
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

  // đŸ”¹ XĂ¡c Ä‘á»‹nh thá»© tá»± hiá»ƒn thá»‹ Æ°u tiĂªn
  const orderMap = {
    "TrungTinh": 1,
    "TuHoa": 2,
    "LocTon": 3,
    "ThienMa": 4,
    "TieuTinh": 5
  };

  const div = document.createElement("div");
console.log("ThĂªm sao:", tenSao);
  div.textContent = tenSao;
console.log("TĂªn sao nháº­n vĂ o:", tenSao);
  div.dataset.order = orderMap[nhom] || 9;


// đŸŒŸ Náº¿u lĂ  Tá»© HĂ³a â†’ gáº¯n liĂªn káº¿t tá»›i sao gá»‘c
if (nhom === "TuHoa") {
  // đŸ”¸ Æ¯u tiĂªn láº¥y CAN cá»§a nÄƒm háº¡n (náº¿u Ä‘ang xem háº¡n)
  let canNam = "";
  if (window.dataGlobal?.luuHan?.canChiNam) {
    canNam = window.dataGlobal.luuHan.canChiNam.split(" ")[0]; // nÄƒm háº¡n
  } else if (window.dataGlobal?.canChiNam) {
    canNam = window.dataGlobal.canChiNam.split(" ")[0]; // nÄƒm sinh gá»‘c
  }

  // đŸ”¹ Báº£ng Tá»© HĂ³a chuáº©n (dĂ¹ng chung)
  const TU_HOA = {
    "GiĂ¡p": { loc:"LiĂªm Trinh", quyen:"PhĂ¡ QuĂ¢n", khoa:"VÅ© KhĂºc", ky:"ThĂ¡i DÆ°Æ¡ng" },
    "áº¤t": { loc:"ThiĂªn CÆ¡", quyen:"ThiĂªn LÆ°Æ¡ng", khoa:"Tá»­ Vi", ky:"ThĂ¡i Ă‚m" },
    "BĂ­nh": { loc:"ThiĂªn Äá»“ng", quyen:"ThiĂªn CÆ¡", khoa:"VÄƒn XÆ°Æ¡ng", ky:"LiĂªm Trinh" },
    "Äinh": { loc:"ThĂ¡i Ă‚m", quyen:"ThiĂªn Äá»“ng", khoa:"ThiĂªn CÆ¡", ky:"Cá»± MĂ´n" },
    "Máº­u": { loc:"Tham Lang", quyen:"ThĂ¡i Ă‚m", khoa:"Há»¯u Báº­t", ky:"ThiĂªn CÆ¡" },
    "Ká»·": { loc:"VÅ© KhĂºc", quyen:"Tham Lang", khoa:"ThiĂªn LÆ°Æ¡ng", ky:"VÄƒn KhĂºc" },
    "Canh": { loc:"ThĂ¡i DÆ°Æ¡ng", quyen:"VÅ© KhĂºc", khoa:"ThiĂªn Äá»“ng", ky:"ThĂ¡i Ă‚m" },
    "TĂ¢n": { loc:"Cá»± MĂ´n", quyen:"ThĂ¡i DÆ°Æ¡ng", khoa:"VÄƒn KhĂºc", ky:"VÄƒn XÆ°Æ¡ng" },
    "NhĂ¢m": { loc:"ThiĂªn LÆ°Æ¡ng", quyen:"Tá»­ Vi", khoa:"Táº£ PhĂ¹", ky:"VÅ© KhĂºc" },
    "QuĂ½": { loc:"PhĂ¡ QuĂ¢n", quyen:"Cá»± MĂ´n", khoa:"ThĂ¡i Ă‚m", ky:"Tham Lang" }
  };

  const hoa = TU_HOA[canNam];
  let goc = "";
  if (tenSao === "HĂ³a Lá»™c") goc = hoa?.loc;
  if (tenSao === "HĂ³a Quyá»n") goc = hoa?.quyen;
  if (tenSao === "HĂ³a Khoa") goc = hoa?.khoa;
  if (tenSao === "HĂ³a Ká»µ") goc = hoa?.ky;
  if (goc) div.dataset.hoaGoc = goc;
}

// đŸŒŸ Báº¯t sá»± kiá»‡n click: khi click vĂ o HĂ³a â†’ sĂ¡ng sao gá»‘c
div.addEventListener("click", () => {
  const goc = div.dataset.hoaGoc;
  if (!goc) return;

  // XĂ³a sĂ¡ng hiá»‡n cĂ³
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // âœ¨ TĂ¬m vĂ  sĂ¡ng sao gá»‘c
  const cleanGoc = goc.normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/\s+/g,"").toLowerCase();
  let timThay = false;

  document.querySelectorAll("[class*='layer'] div, .cung div").forEach(el => {
    const name = el.textContent.trim()
        .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")           // Ä
    .replace(/\u0111/g, "d")           // Ä‘
    .replace(/\s+/g, "")
    .toLowerCase();
    if (name === cleanGoc) {
      el.classList.add("sao-highlight");
      timThay = true;
    }
  });

  // đŸ©µ Náº¿u lĂ  sao Nguyá»‡t váº­n (N.) â†’ má»Ÿ popup tra cá»©u
  if (tenHoa.startsWith("N.")) {
    const tenSaoGoc = goc || tenHoa.replace(/^N\.\s*/,"").trim();
    const key = timKeySao(tenSaoGoc);
    if (key) moPopupSao(key);
    else moPopupSao_Ten(tenSaoGoc);
  }

  if (!timThay) console.warn("Warning: KhĂ´ng tĂ¬m tháº¥y sao gá»‘c:", goc);
});


// đŸŸ© Debug map trung tinh
if (nhom === "TrungTinh") {
  const keyTT = tenSao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")           // Ä â†’ d
    .replace(/\u0111/g, "d")           // Ä‘ â†’ d
    .replace(/\s+/g, "")               // bá» khoáº£ng tráº¯ng
    .trim()
    .toLowerCase();


  if (!window.trungTinhToCung) window.trungTinhToCung = {};
  window.trungTinhToCung[keyTT] = cung;

  console.log("đŸ“Œ Trung tinh map:", keyTT, "â†’", cung);
}

  target.appendChild(div);

  // đŸ”¹ Sáº¯p xáº¿p láº¡i theo thá»© tá»±
  const items = Array.from(target.children);
  items.sort((a, b) => a.dataset.order - b.dataset.order);
  target.innerHTML = "";
  items.forEach(el => target.appendChild(el));
}

// =====================================================
// đŸŒŸ Lá»P 6 â€“ Há»† THá»NG 2 Cá»˜T CĂT & HUNG (Tá»”NG Há»¢P)
// =====================================================

// âœ… HĂ m thĂªm sao â€“ báº£n fix hiá»ƒn thá»‹ mĂ u ngÅ© hĂ nh cho cáº£ sao gá»‘c, ÄV, LÆ°u
function themSao(cung, tenSao, nhom, loai) {

  const CUNG_TO_CELL = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
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

  // KhĂ´ng thĂªm trĂ¹ng
  if ([...column.children].some(el => el.textContent.trim() === tenSao.trim())) return;

  // đŸ¯ Chuáº©n hĂ³a tĂªn gá»‘c (bá» tiá»n tá»‘ ÄV. / L.)
const tenGoc = tenSao.replace(/^(ÄV\.|L\.|N\.|Nh\.)\s*/i, "").trim();

  // đŸŒ¿ Báº£ng hĂ nh sao
  const hanhSao = {
    "Tá»­ Vi":"Thá»•","ThiĂªn CÆ¡":"Má»™c","ThĂ¡i DÆ°Æ¡ng":"Há»a","VÅ© KhĂºc":"Kim","ThiĂªn Äá»“ng":"Thá»§y",
    "LiĂªm Trinh":"Há»a","ThiĂªn Phá»§":"Thá»•","ThĂ¡i Ă‚m":"Thá»§y","Tham Lang":"Má»™c","Cá»± MĂ´n":"Thá»§y",
    "ThiĂªn TÆ°á»›ng":"Thá»§y","ThiĂªn LÆ°Æ¡ng":"Má»™c","Tháº¥t SĂ¡t":"Kim","PhĂ¡ QuĂ¢n":"Thá»§y","ThiĂªn KhĂ´i":"Há»a",
    "ThiĂªn Viá»‡t":"Há»a","Lá»™c Tá»“n":"Thá»•","ThiĂªn MĂ£":"Há»a","HĂ³a Lá»™c":"Má»™c","HĂ³a Quyá»n":"Má»™c",
    "HĂ³a Khoa":"Má»™c","HĂ³a Ká»µ":"Kim","KĂ¬nh DÆ°Æ¡ng":"Kim","ÄĂ  La":"Kim","VÄƒn XÆ°Æ¡ng":"Kim","VÄƒn KhĂºc":"Thá»§y",
    "Linh Tinh":"Há»a","Há»a Tinh":"Há»a","Äá»‹a KhĂ´ng":"Há»a","Äá»‹a Kiáº¿p":"Há»a","Táº£ PhĂ¹":"Thá»•"
  };

const hanh = hanhSao[tenGoc] || "";
const colorMap = {
  "Há»a": "#ff4d4d",  // đŸ”¥ Ä‘á» tÆ°Æ¡i sĂ¡ng
  "Thá»•": "#e69500",  // đŸŸ  cam Ä‘áº¥t Ä‘áº­m hÆ¡n
  "Má»™c": "#007a29",  // đŸŒ¿ xanh lĂ¡ Ä‘áº­m hÆ¡n má»™t chĂºt
  "Kim": "#000000",  // â« Ä‘en thuáº§n
  "Thá»§y": "#004cff"  // đŸ’§ xanh dÆ°Æ¡ng Ä‘áº­m sĂ¡ng
};
const color = colorMap[hanh] || "#222";


  // đŸ¨ Táº¡o div sao
  const div = document.createElement("div");
  div.textContent = tenSao;
  div.dataset.order = 9;
  div.style.fontWeight = /^ÄV\.|^L\./.test(tenSao) ? "700" : "600";
// đŸŒŸ Cho phĂ©p click xem sao (chá»‰ khi popup Ä‘ang má»Ÿ)
div.style.cursor = "pointer";
div.addEventListener("click", () => {
  if (typeof showStarInfo === "function") {
    showStarInfo(tenSao, cung);
  }
});



  // âœ… ThĂªm class ngÅ© hĂ nh + sao lÆ°u
  if (hanh) {
    const hanhClass = {Há»a:"sao-hoa",Thá»•:"sao-tho",Má»™c:"sao-moc",Kim:"sao-kim",Thá»§y:"sao-thuy"}[hanh];
    div.classList.add(hanhClass);
  }
  if (/^L\./.test(tenSao)) div.classList.add("sao-luu");
  if (/^ÄV\./.test(tenSao)) div.classList.add("sao-dv");

  // âœ… Ă‰p mĂ u inline cĂ³ !important Ä‘á»ƒ khĂ´ng bá»‹ máº¥t
  div.style.setProperty("color", color, "important");
  if (/^(ÄV\.|L\.)/i.test(tenSao)) div.style.filter = "brightness(1.15)";

  column.appendChild(div);

  // âœ… Sáº¯p xáº¿p láº¡i
  const items = Array.from(column.children);
  items.sort((a,b)=>(a.dataset.order||0)-(b.dataset.order||0));
  column.innerHTML = "";
  items.forEach(i=>column.appendChild(i));
}






// đŸŒŸ Lá»P 6.2 â€“ Lá»˜C Tá»’N & THIĂN MĂƒ (CĂT TINH Bá»” SUNG)
function anLop6_2_LocTon_ThienMa(data) {
window.dataGlobal = data;
  console.log("đŸ€ Báº¯t Ä‘áº§u an Lá»™c Tá»“n â€“ ThiĂªn MĂ£", data.canChiNam);

  const CAN = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
  const CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  let canNam = "", chiNam = "";
  for (const can of CAN) if (data.canChiNam?.includes(can)) canNam = can;
  for (const chi of CHI) if (data.canChiNam?.includes(chi)) chiNam = chi;

  const LOC_TON_MAP = {
    "GiĂ¡p":"Dáº§n","áº¤t":"MĂ£o","BĂ­nh":"Tá»µ","Äinh":"Ngá»","Máº­u":"Tá»µ",
    "Ká»·":"Ngá»","Canh":"ThĂ¢n","TĂ¢n":"Dáº­u","NhĂ¢m":"Há»£i","QuĂ½":"TĂ½"
  };

  const THIEN_MA_MAP = {
    "Há»£i":"Tá»µ","MĂ£o":"Tá»µ","MĂ¹i":"Tá»µ",
    "Tá»µ":"Há»£i","Dáº­u":"Há»£i","Sá»­u":"Há»£i",
    "Dáº§n":"ThĂ¢n","Ngá»":"ThĂ¢n","Tuáº¥t":"ThĂ¢n",
    "ThĂ¢n":"Dáº§n","TĂ½":"Dáº§n","ThĂ¬n":"Dáº§n"
  };

  const locTonCung = LOC_TON_MAP[canNam];
  const thienMaCung = THIEN_MA_MAP[chiNam];

  if (locTonCung) themSao(locTonCung, "Lá»™c Tá»“n", "LocTon", "cat");
  if (thienMaCung) themSao(thienMaCung, "ThiĂªn MĂ£", "LocTon", "cat");

  data.cungLocTon = locTonCung;

  console.log(`đŸ’° NÄƒm ${data.canChiNam}: Can ${canNam} â†’ Lá»™c Tá»“n táº¡i ${locTonCung}, Chi ${chiNam} â†’ ThiĂªn MĂ£ táº¡i ${thienMaCung}`);
}



function rebuildSaoToCungFromDOM() {

  // Náº¿u Ä‘ang an sao â†’ KHĂ”NG ÄÆ¯á»¢C REBUILD
  if (window.__LOCK_REBUILD__) {
    console.warn("â›” REBUILD bá»‹ cháº·n: há»‡ thá»‘ng Ä‘ang an sao!");
    return window.saoToCung;
  }

  const revMap = {
    1:"Tá»µ", 2:"Ngá»", 3:"MĂ¹i", 4:"ThĂ¢n",
    5:"ThĂ¬n",6:"Dáº­u",7:"MĂ£o",8:"Tuáº¥t",
    9:"Dáº§n",10:"Sá»­u",11:"TĂ½",12:"Há»£i"
  };

  // dĂ¹ng normalizeKey Ä‘á»ƒ Ä‘á»“ng nháº¥t vá»›i Tá»© HĂ³a
function normalizeKey(str){
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")  // bá» dáº¥u
    .replace(/Ä‘/gi, "d")              // â­ QUAN TRá»ŒNG: Ä‘á»•i Ä‘ â†’ d
    .replace(/\s+/g,"")               // xoĂ¡ space
    .replace(/[\u00A0]/g,"")          // xoĂ¡ NBSP
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

      // láº¥y tĂªn sao Sáº CH â€” ráº¥t quan trá»ng
      const raw = el.textContent.normalize("NFC").trim();
console.log("RAW:", raw, "UNICODE:", [...raw].map(c => c.charCodeAt(0).toString(16)));

      // chuáº©n hĂ³a thĂ nh key Ä‘á»“ng bá»™
      const key = normalizeKey(raw);

      if (CHINH_TINH_KEYS.includes(key)) {
        newMap[key] = tenCung;
      }
    });
  });

  if (Object.keys(newMap).length < 12) {
    console.warn("â ï¸ REBUILD: DOM chÆ°a Ä‘á»§ chĂ­nh tinh â†’ GIá»® Láº I MAP CÅ¨");
    return window.saoToCung;
  }

  window.saoToCung = newMap;
  console.log("đŸ§­ [REBUILD] saoToCung tá»« DOM:", window.saoToCung);
}
// =====================================================
// đŸŒŸ Lá»P 6 â€“ TRUNG TINH (Gá»˜P CĂT + HUNG)
// =====================================================
function anLop6_TrungTinh(data) {
 console.log("đŸŒ€ Báº¯t Ä‘áº§u an Trung tinh...", data.canChiNam);

  // đŸ”¥ Fallback: náº¿u ChĂ­nh Tinh chÆ°a cháº¡y â†’ gá»i bĂ¹
  if (!window.saoToCung || Object.keys(window.saoToCung).length === 0) {
    console.warn("â ï¸ [TT] saoToCung Ä‘ang rá»—ng â†’ gá»i anLop3_ChinhTinh bá»• sung");
    if (typeof anLop3_ChinhTinh === "function") {
      anLop3_ChinhTinh(data);
    } else {
      console.error("âŒ [TT] anLop3_ChinhTinh chÆ°a Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a!");
    }
  }
  const canNam = data.canChiNam?.split(" ")[0] || "";
  const thangAm = parseInt(data.lunar[1]);
  const gioChi = data.canChiGio?.split(" ")[1] || "TĂ½";
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
// đŸŒŸ Äáº£m báº£o má»—i cung chá»‰ cĂ³ 1 lá»›p trung tinh
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

  // đŸ§­ HĂ m Ä‘áº¿m cung (dĂ¹ng chung)
  function demCung(start, step, chieu="thuáº­n") {
    const iStart = CUNG_THUAN.indexOf(start);
    if (iStart === -1) return null;
    const idx = (chieu === "thuáº­n")
      ? (iStart + (step - 1)) % 12
      : (iStart - (step - 1) + 12) % 12;
    return CUNG_THUAN[idx];
  }

  // ===============================
  // đŸŒ¿ NHĂ“M CĂT TINH
  // ===============================
  const BANG_KHOI_VIET = {
    "GiĂ¡p": ["Sá»­u", "MĂ¹i"], "Máº­u": ["Sá»­u", "MĂ¹i"],
    "áº¤t": ["TĂ½", "ThĂ¢n"], "Ká»·": ["TĂ½", "ThĂ¢n"],
    "Canh": ["Dáº§n", "Ngá»"], "TĂ¢n": ["Dáº§n", "Ngá»"],
    "BĂ­nh": ["Há»£i", "Dáº­u"], "Äinh": ["Há»£i", "Dáº­u"],
    "NhĂ¢m": ["MĂ£o", "Tá»µ"], "QuĂ½": ["MĂ£o", "Tá»µ"]
  };

  const cap = BANG_KHOI_VIET[canNam];
  if (cap) {
    themSao(cap[0], "ThiĂªn KhĂ´i", "TrungTinh", "cat");
    themSao(cap[1], "ThiĂªn Viá»‡t", "TrungTinh", "cat");
  }

  const cungTaPhu = demCung("ThĂ¬n", thangAm, "thuáº­n");
  const cungHuuBat = demCung("Tuáº¥t", thangAm, "nghá»‹ch");
  if (cungTaPhu) themSao(cungTaPhu, "Táº£ PhĂ¹", "TrungTinh", "cat");
  if (cungHuuBat) themSao(cungHuuBat, "Há»¯u Báº­t", "TrungTinh", "cat");

  // đŸŒŸ VÄƒn XÆ°Æ¡ng â€“ VÄƒn KhĂºc (chuáº©n cá»•: Tuáº¥t nghá»‹ch, ThĂ¬n thuáº­n)
  const gioChiArray = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const gioIndex = gioChiArray.indexOf(gioChi);

  if (gioIndex !== -1) {
    // đŸª¶ VÄƒn XÆ°Æ¡ng: Tuáº¥t coi lĂ  TĂ½, Ä‘áº¿m NGHá»CH theo giá» sinh
    const startXuong = CUNG_THUAN.indexOf("Tuáº¥t"); // 8
    const idxXuong = (startXuong - gioIndex + 12) % 12;
    const cungVanXuong = CUNG_THUAN[idxXuong];

    // đŸª¶ VÄƒn KhĂºc: ThĂ¬n coi lĂ  TĂ½, Ä‘áº¿m THUáº¬N theo giá» sinh
    const startKhuc = CUNG_THUAN.indexOf("ThĂ¬n"); // 2
    const idxKhuc = (startKhuc + gioIndex) % 12;
    const cungVanKhuc = CUNG_THUAN[idxKhuc];

    if (cungVanXuong) themSao(cungVanXuong, "VÄƒn XÆ°Æ¡ng", "TrungTinh", "cat");
    if (cungVanKhuc) themSao(cungVanKhuc, "VÄƒn KhĂºc", "TrungTinh", "cat");
  }

  // ===============================
  // â¡ NHĂ“M HUNG TINH
  // ===============================
// đŸŒŸ KĂ¬nh DÆ°Æ¡ng â€“ ÄĂ  La (tĂ­nh trá»±c tiáº¿p tá»« cĂ´ng thá»©c Lá»™c Tá»“n gá»‘c)
if (data.canChiNam) {
  const canChiNam = data.canChiNam.trim();
  let canNam = "";

  // âœ… TrĂ­ch xuáº¥t Ä‘Ăºng Can nÄƒm tá»« chuá»—i data.canChiNam
  if (canChiNam.startsWith("GiĂ¡p")) canNam = "GiĂ¡p";
  else if (canChiNam.startsWith("áº¤t")) canNam = "áº¤t";
  else if (canChiNam.startsWith("BĂ­nh")) canNam = "BĂ­nh";
  else if (canChiNam.startsWith("Äinh")) canNam = "Äinh";
  else if (canChiNam.startsWith("Máº­u")) canNam = "Máº­u";
  else if (canChiNam.startsWith("Ká»·")) canNam = "Ká»·";
  else if (canChiNam.startsWith("Canh")) canNam = "Canh";
  else if (canChiNam.startsWith("TĂ¢n")) canNam = "TĂ¢n";
  else if (canChiNam.startsWith("NhĂ¢m")) canNam = "NhĂ¢m";
  else if (canChiNam.startsWith("QuĂ½")) canNam = "QuĂ½";

  // âœ… TĂ­nh vá»‹ trĂ­ Lá»™c Tá»“n gá»‘c theo Can nÄƒm
  let viTriA = "Dáº§n";
  switch (canNam) {
    case "GiĂ¡p": viTriA = "Dáº§n"; break;
    case "áº¤t":   viTriA = "MĂ£o"; break;
    case "BĂ­nh":
    case "Máº­u":  viTriA = "Tá»µ";  break;
    case "Äinh":
    case "Ká»·":   viTriA = "Ngá»"; break;
    case "Canh": viTriA = "ThĂ¢n"; break;
    case "TĂ¢n":  viTriA = "Dáº­u"; break;
    case "NhĂ¢m": viTriA = "Há»£i"; break;
    case "QuĂ½":  viTriA = "TĂ½";  break;
  }

  // âœ… Tá»« Ä‘Ă³ an KĂ¬nh DÆ°Æ¡ng â€“ ÄĂ  La (thuáº­n +1, nghá»‹ch -1)
  const iA = CUNG_THUAN.indexOf(viTriA);
  if (iA >= 0) {
    const cungKinh = CUNG_THUAN[(iA + 1) % 12];
    const cungDa   = CUNG_THUAN[(iA - 1 + 12) % 12];
    themSao(cungKinh, "KĂ¬nh DÆ°Æ¡ng", "TrungTinh", "hung");
    themSao(cungDa, "ÄĂ  La", "TrungTinh", "hung");
    console.log(`âœ… ${canChiNam} â†’ Lá»™c Tá»“n gá»‘c táº¡i ${viTriA}, KĂ¬nh DÆ°Æ¡ng: ${cungKinh}, ÄĂ  La: ${cungDa}`);
  }
}







  // đŸ”¹ Äá»‹a KhĂ´ng & Äá»‹a Kiáº¿p (chuáº©n: tá»« Há»£i, TĂ½ Ä‘áº¿m thuáº­n/ nghá»‹ch)
  const GIO_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const iGio = GIO_CHI.indexOf(gioChi);
  if (iGio >= 0) {
    const iHoi = CUNG_THUAN.indexOf("Há»£i");
    const cungKiep = CUNG_THUAN[(iHoi + iGio) % 12];
    const cungKhong = CUNG_THUAN[(iHoi - iGio + 12) % 12];
    themSao(cungKiep, "Äá»‹a Kiáº¿p", "TrungTinh", "hung");
    themSao(cungKhong, "Äá»‹a KhĂ´ng", "TrungTinh", "hung");
    console.log(`đŸ• Giá» ${gioChi}: Kiáº¿p táº¡i ${cungKiep}, KhĂ´ng táº¡i ${cungKhong}`);
  }

  // đŸ”¹ LINH TINH
  const menhAD = data.amduongMenh || "DÆ°Æ¡ng Nam"; 
  const chiNam = data.canChiNam?.split(" ")[1] || "TĂ½";

  const BANG_LINH_TINH = {
    "DuongNam_AmNu": {
      "TĂ½":{"Dáº§nNgá»Tuáº¥t":"MĂ£o","Khac":"Tuáº¥t"},"Sá»­u":{"Dáº§nNgá»Tuáº¥t":"Dáº§n","Khac":"Dáº­u"},
      "Dáº§n":{"Dáº§nNgá»Tuáº¥t":"Sá»­u","Khac":"ThĂ¢n"},"MĂ£o":{"Dáº§nNgá»Tuáº¥t":"TĂ½","Khac":"MĂ¹i"},
      "ThĂ¬n":{"Dáº§nNgá»Tuáº¥t":"Há»£i","Khac":"Ngá»"},"Tá»µ":{"Dáº§nNgá»Tuáº¥t":"Tuáº¥t","Khac":"Tá»µ"},
      "Ngá»":{"Dáº§nNgá»Tuáº¥t":"Dáº­u","Khac":"ThĂ¬n"},"MĂ¹i":{"Dáº§nNgá»Tuáº¥t":"ThĂ¢n","Khac":"MĂ£o"},
      "ThĂ¢n":{"Dáº§nNgá»Tuáº¥t":"MĂ¹i","Khac":"Dáº§n"},"Dáº­u":{"Dáº§nNgá»Tuáº¥t":"Ngá»","Khac":"Sá»­u"},
      "Tuáº¥t":{"Dáº§nNgá»Tuáº¥t":"Tá»µ","Khac":"TĂ½"},"Há»£i":{"Dáº§nNgá»Tuáº¥t":"ThĂ¬n","Khac":"Há»£i"}
    },
    "AmNam_DuongNu": {
      "TĂ½":{"Dáº§nNgá»Tuáº¥t":"MĂ£o","Khac":"Tuáº¥t"},"Sá»­u":{"Dáº§nNgá»Tuáº¥t":"ThĂ¬n","Khac":"Há»£i"},
      "Dáº§n":{"Dáº§nNgá»Tuáº¥t":"Tá»µ","Khac":"TĂ½"},"MĂ£o":{"Dáº§nNgá»Tuáº¥t":"Ngá»","Khac":"Sá»­u"},
      "ThĂ¬n":{"Dáº§nNgá»Tuáº¥t":"MĂ¹i","Khac":"Dáº§n"},"Tá»µ":{"Dáº§nNgá»Tuáº¥t":"ThĂ¢n","Khac":"MĂ£o"},
      "Ngá»":{"Dáº§nNgá»Tuáº¥t":"Dáº­u","Khac":"ThĂ¬n"},"MĂ¹i":{"Dáº§nNgá»Tuáº¥t":"Tuáº¥t","Khac":"Tá»µ"},
      "ThĂ¢n":{"Dáº§nNgá»Tuáº¥t":"Há»£i","Khac":"Ngá»"},"Dáº­u":{"Dáº§nNgá»Tuáº¥t":"TĂ½","Khac":"MĂ¹i"},
      "Tuáº¥t":{"Dáº§nNgá»Tuáº¥t":"Sá»­u","Khac":"ThĂ¢n"},"Há»£i":{"Dáº§nNgá»Tuáº¥t":"Dáº§n","Khac":"Dáº­u"}
    }
  };

  const keyLinh = (menhAD === "DÆ°Æ¡ng Nam" || menhAD === "Ă‚m Ná»¯") ? "DuongNam_AmNu" : "AmNam_DuongNu";
  const chiNamThuong = chiNam.normalize("NFD").replace(/\p{Diacritic}/gu,"");
  const nhomChi = ["Dan","Ngo","Tuat"].includes(chiNamThuong) ? "Dáº§nNgá»Tuáº¥t" : "Khac";
  const cungLinh = BANG_LINH_TINH[keyLinh][gioChi]?.[nhomChi];
  if (cungLinh) themSao(cungLinh, "Linh Tinh", "TrungTinh", "hung");

  // đŸ”¹ Há»A TINH
  const BANG_HOA_TINH = {
    "DuongNam_AmNu": {
      "TyThinThan": { "TĂ½":"Dáº§n","Sá»­u":"MĂ£o","Dáº§n":"ThĂ¬n","MĂ£o":"Tá»µ","ThĂ¬n":"Ngá»","Tá»µ":"MĂ¹i","Ngá»":"ThĂ¢n","MĂ¹i":"Dáº­u","ThĂ¢n":"Tuáº¥t","Dáº­u":"Há»£i","Tuáº¥t":"TĂ½","Há»£i":"Sá»­u" },
      "SuuTyDau": { "TĂ½":"MĂ£o","Sá»­u":"ThĂ¬n","Dáº§n":"Tá»µ","MĂ£o":"Ngá»","ThĂ¬n":"MĂ¹i","Tá»µ":"ThĂ¢n","Ngá»":"Dáº­u","MĂ¹i":"Tuáº¥t","ThĂ¢n":"Há»£i","Dáº­u":"TĂ½","Tuáº¥t":"Sá»­u","Há»£i":"Dáº§n" },
      "DanNgoTuat": { "TĂ½":"Sá»­u","Sá»­u":"Dáº§n","Dáº§n":"MĂ£o","MĂ£o":"ThĂ¬n","ThĂ¬n":"Tá»µ","Tá»µ":"Ngá»","Ngá»":"MĂ¹i","MĂ¹i":"ThĂ¢n","ThĂ¢n":"Dáº­u","Dáº­u":"Tuáº¥t","Tuáº¥t":"Há»£i","Há»£i":"TĂ½" },
      "MaoMuiHoi": { "TĂ½":"Dáº­u","Sá»­u":"Tuáº¥t","Dáº§n":"Há»£i","MĂ£o":"TĂ½","ThĂ¬n":"Sá»­u","Tá»µ":"Dáº§n","Ngá»":"MĂ£o","MĂ¹i":"ThĂ¬n","ThĂ¢n":"Tá»µ","Dáº­u":"Ngá»","Tuáº¥t":"MĂ¹i","Há»£i":"ThĂ¢n" }
    },
    "AmNam_DuongNu": {
      "TyThinThan": { "TĂ½":"Dáº§n","Sá»­u":"Sá»­u","Dáº§n":"TĂ½","MĂ£o":"Há»£i","ThĂ¬n":"Tuáº¥t","Tá»µ":"Dáº­u","Ngá»":"ThĂ¢n","MĂ¹i":"MĂ¹i","ThĂ¢n":"Ngá»","Dáº­u":"Tá»µ","Tuáº¥t":"ThĂ¬n","Há»£i":"MĂ£o" },
      "SuuTyDau": { "TĂ½":"MĂ£o","Sá»­u":"Dáº§n","Dáº§n":"Sá»­u","MĂ£o":"TĂ½","ThĂ¬n":"Há»£i","Tá»µ":"Tuáº¥t","Ngá»":"Dáº­u","MĂ¹i":"ThĂ¢n","ThĂ¢n":"MĂ¹i","Dáº­u":"Ngá»","Tuáº¥t":"Tá»µ","Há»£i":"ThĂ¬n" },
      "DanNgoTuat": { "TĂ½":"Sá»­u","Sá»­u":"TĂ½","Dáº§n":"Há»£i","MĂ£o":"Tuáº¥t","ThĂ¬n":"Dáº­u","Tá»µ":"ThĂ¢n","Ngá»":"MĂ¹i","MĂ¹i":"Ngá»","ThĂ¢n":"Tá»µ","Dáº­u":"ThĂ¬n","Tuáº¥t":"MĂ£o","Há»£i":"Dáº§n" },
      "MaoMuiHoi": { "TĂ½":"Dáº­u","Sá»­u":"ThĂ¢n","Dáº§n":"MĂ¹i","MĂ£o":"Ngá»","ThĂ¬n":"Tá»µ","Tá»µ":"ThĂ¬n","Ngá»":"MĂ£o","MĂ¹i":"Dáº§n","ThĂ¢n":"Sá»­u","Dáº­u":"TĂ½","Tuáº¥t":"Há»£i","Há»£i":"Tuáº¥t" }
    }
  };

  const keyHoa = keyLinh;
  let nhomNam;
  if (["TĂ½","ThĂ¬n","ThĂ¢n"].includes(chiNam)) nhomNam = "TyThinThan";
  else if (["Sá»­u","Tá»µ","Dáº­u"].includes(chiNam)) nhomNam = "SuuTyDau";
  else if (["Dáº§n","Ngá»","Tuáº¥t"].includes(chiNam)) nhomNam = "DanNgoTuat";
  else nhomNam = "MaoMuiHoi";

  const cungHoa = BANG_HOA_TINH[keyHoa][nhomNam]?.[gioChi];
  if (cungHoa) themSao(cungHoa, "Há»a Tinh", "TrungTinh", "hung");
// đŸ”¹ LÆ°u vá»‹ trĂ­ toĂ n bá»™ Trung Tinh (CĂ¡t + Hung) Ä‘á»ƒ Tá»© HĂ³a cĂ³ thá»ƒ tĂ¬m tháº¥y
if (!window.trungTinhToCung) window.trungTinhToCung = {};
document.querySelectorAll('.layer-6 .cat-tinh div, .layer-6 .hung-tinh div').forEach(el => {
  const name = el.textContent.trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")   // xoĂ¡ dáº¥u tá»• há»£p
  .replace(/\u0110/g, "d")           // Ä â†’ d
  .replace(/\u0111/g, "d")           // Ä‘ â†’ d
  .replace(/\s+/g, "")               // xoĂ¡ space
  .toLowerCase();

  const cell = el.closest(".cung");
  if (cell) {
    const cungId = cell.id.replace("cell", "");
    const revMap = {9:"Dáº§n",7:"MĂ£o",5:"ThĂ¬n",1:"Tá»µ",2:"Ngá»",3:"MĂ¹i",4:"ThĂ¢n",6:"Dáº­u",8:"Tuáº¥t",12:"Há»£i",11:"TĂ½",10:"Sá»­u"};
    const cungName = revMap[cungId];
    if (cungName) window.trungTinhToCung[name] = cungName;
  }
});

  console.log("âœ… HoĂ n táº¥t an Trung Tinh (CĂ¡t + Hung)");
}
// =====================================================
// đŸŒŸ Lá»P 6.4 â€“ Tá»¨ HĂ“A
// =====================================================
function anLop6_4_TuHoa(data){
  const canNam=data.canChiNam?.split(" ")[0]||"";
  const TU_HOA={
    "GiĂ¡p":{loc:"LiĂªm Trinh",quyen:"PhĂ¡ QuĂ¢n",khoa:"VÅ© KhĂºc",ky:"ThĂ¡i DÆ°Æ¡ng"},
    "áº¤t":{loc:"ThiĂªn CÆ¡",quyen:"ThiĂªn LÆ°Æ¡ng",khoa:"Tá»­ Vi",ky:"ThĂ¡i Ă‚m"},
    "BĂ­nh":{loc:"ThiĂªn Äá»“ng",quyen:"ThiĂªn CÆ¡",khoa:"VÄƒn XÆ°Æ¡ng",ky:"LiĂªm Trinh"},
    "Äinh":{loc:"ThĂ¡i Ă‚m",quyen:"ThiĂªn Äá»“ng",khoa:"ThiĂªn CÆ¡",ky:"Cá»± MĂ´n"},
    "Máº­u":{loc:"Tham Lang",quyen:"ThĂ¡i Ă‚m",khoa:"Há»¯u Báº­t",ky:"ThiĂªn CÆ¡"},
    "Ká»·":{loc:"VÅ© KhĂºc",quyen:"Tham Lang",khoa:"ThiĂªn LÆ°Æ¡ng",ky:"VÄƒn KhĂºc"},
    "Canh":{loc:"ThĂ¡i DÆ°Æ¡ng",quyen:"VÅ© KhĂºc",khoa:"ThiĂªn Äá»“ng",ky:"ThĂ¡i Ă‚m"},
    "TĂ¢n":{loc:"Cá»± MĂ´n",quyen:"ThĂ¡i DÆ°Æ¡ng",khoa:"VÄƒn KhĂºc",ky:"VÄƒn XÆ°Æ¡ng"},
    "NhĂ¢m":{loc:"ThiĂªn LÆ°Æ¡ng",quyen:"Tá»­ Vi",khoa:"Táº£ PhĂ¹",ky:"VÅ© KhĂºc"},
    "QuĂ½":{loc:"PhĂ¡ QuĂ¢n",quyen:"Cá»± MĂ´n",khoa:"ThĂ¡i Ă‚m",ky:"Tham Lang"}
  };
  const hoa=TU_HOA[canNam];
  if(!hoa)return;
// âœ… Há»£p nháº¥t cáº£ ChĂ­nh Tinh & Trung Tinh
// âœ… Äáº£m báº£o cĂ³ map ChĂ­nh tinh trÆ°á»›c khi ghĂ©p Tá»© HĂ³a
rebuildSaoToCungFromDOM();
const map = {
  ...(window.saoToCung || {}),
  ...(window.trungTinhToCung || {})
};

console.log("đŸ§­ MAP CHO Tá»¨ HĂ“A:", map);   // <--- console kiá»ƒm tra map

  const ds=[
    {ten:"HĂ³a Lá»™c",sao:hoa.loc,loai:"cat"},
    {ten:"HĂ³a Quyá»n",sao:hoa.quyen,loai:"cat"},
    {ten:"HĂ³a Khoa",sao:hoa.khoa,loai:"cat"},
    {ten:"HĂ³a Ká»µ",sao:hoa.ky,loai:"hung"}
  ];

// đŸ”§ Chuáº©n hĂ³a tĂªn sao (trá»‹ dá»©t Ä‘iá»ƒm lá»—i ThiĂªn Äá»“ng)
function normalizeKey(str){
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")  // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")         // Ä â†’ d
    .replace(/\u0111/g, "d")         // Ä‘ â†’ d
    .replace(/\s+/g,"")              // bá» khoáº£ng tráº¯ng
    .replace(/[\u00A0]/g,"")         // bá» NBSP
    .trim()
    .toLowerCase();
}


 ds.forEach(x=>{
const key = normalizeKey(x.sao);


  const cung = map[key];

  console.log(`đŸ” Tá»© HĂ³a: ${x.ten} â€“ Sao gá»‘c: ${x.sao} â€“ KEY: ${key} â€“ Cung tĂ¬m Ä‘Æ°á»£c:`, cung);

  if (cung) {
    themSao(cung, x.ten, "TuHoa", x.loai);
  } else {
    console.warn("â ï¸ KHĂ”NG THáº¤Y SAO Gá»C â†’", x.sao, "â†’ KEY:", key);
  }
});

  console.log("âœ… HoĂ n táº¥t an Tá»© HĂ³a (Layer 6.4)");
}

// đŸŒŸ Báº£ng tam há»£p cá»‘ Ä‘á»‹nh
const TAM_HOP = {
  "Há»£i": ["Há»£i","MĂ£o","MĂ¹i"], "MĂ£o": ["Há»£i","MĂ£o","MĂ¹i"], "MĂ¹i": ["Há»£i","MĂ£o","MĂ¹i"],
  "TĂ½": ["TĂ½","ThĂ¬n","ThĂ¢n"], "ThĂ¬n": ["TĂ½","ThĂ¬n","ThĂ¢n"], "ThĂ¢n": ["TĂ½","ThĂ¬n","ThĂ¢n"],
  "Sá»­u": ["Sá»­u","Tá»µ","Dáº­u"], "Tá»µ": ["Sá»­u","Tá»µ","Dáº­u"], "Dáº­u": ["Sá»­u","Tá»µ","Dáº­u"],
  "Dáº§n": ["Dáº§n","Ngá»","Tuáº¥t"], "Ngá»": ["Dáº§n","Ngá»","Tuáº¥t"], "Tuáº¥t": ["Dáº§n","Ngá»","Tuáº¥t"]
};

// đŸŒŸ Báº£ng cung thuáº­n Ä‘á»ƒ xĂ¡c Ä‘á»‹nh cung Ä‘á»‘i
const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
const cellMap = {"Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10};








// =====================================================
// đŸŒŸ Báº¬T SĂNG CUNG TAM Há»¢P + Äá»I CUNG + SONG TINH Káº¸P CUNG
// =====================================================
function enableCungHighlight() {
  const cellMap = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };

  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const TAM_HOP = {
    "Há»£i":["Há»£i","MĂ£o","MĂ¹i"], "MĂ£o":["Há»£i","MĂ£o","MĂ¹i"], "MĂ¹i":["Há»£i","MĂ£o","MĂ¹i"],
    "TĂ½":["TĂ½","ThĂ¬n","ThĂ¢n"], "ThĂ¬n":["TĂ½","ThĂ¬n","ThĂ¢n"], "ThĂ¢n":["TĂ½","ThĂ¬n","ThĂ¢n"],
    "Sá»­u":["Sá»­u","Tá»µ","Dáº­u"], "Tá»µ":["Sá»­u","Tá»µ","Dáº­u"], "Dáº­u":["Sá»­u","Tá»µ","Dáº­u"],
    "Dáº§n":["Dáº§n","Ngá»","Tuáº¥t"], "Ngá»":["Dáº§n","Ngá»","Tuáº¥t"], "Tuáº¥t":["Dáº§n","Ngá»","Tuáº¥t"]
  };
  const DOI_CUNG = {
    "Dáº§n":"ThĂ¢n","MĂ£o":"Dáº­u","ThĂ¬n":"Tuáº¥t","Tá»µ":"Há»£i",
    "Ngá»":"TĂ½","MĂ¹i":"Sá»­u","ThĂ¢n":"Dáº§n","Dáº­u":"MĂ£o",
    "Tuáº¥t":"ThĂ¬n","Há»£i":"Tá»µ","TĂ½":"Ngá»","Sá»­u":"MĂ¹i"
  };

  // =====================================================
  // đŸ§© HĂ€M TIá»†N ĂCH â€” CHUáº¨N HĂ“A TĂN SAO
  // =====================================================
 function normalizeSao(txt) {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")           // Ä â†’ d
    .replace(/\u0111/g, "d")           // Ä‘ â†’ d
    .replace(/\s+/g, "")               // bá» khoáº£ng tráº¯ng
    .trim()
    .toLowerCase();
}


function splitPrefix(txt) {
  const t = normalizeSao(txt);

  if (t.startsWith("l."))    return { prefix: "L",  name: t.slice(2) };
  if (t.startsWith("dv."))   return { prefix: "ÄV", name: t.slice(3) }; // âœ… ÄV: Ä‘Ă£ normalize nĂªn dĂ¹ng dv.
  if (t.startsWith("tl."))   return { prefix: "TL", name: t.slice(3) };
  if (t.startsWith("n."))    return { prefix: "N",  name: t.slice(2) };
  if (t.startsWith("nh."))   return { prefix: "NH", name: t.slice(3) }; // âœ… Ä‘á»•i thĂ nh NH in hoa

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
  // â¡ HĂ€M Xá»¬ LĂ SONG TINH Káº¸P CUNG
  // =====================================================
  function xuLySongTinhKep(cellTruoc, cellSau) {
    const DOI_SAO = [
      ["VÄƒn XÆ°Æ¡ng", "VÄƒn KhĂºc"],
      ["ThiĂªn KhĂ´i", "ThiĂªn Viá»‡t"],
      ["Táº£ PhĂ¹", "Há»¯u Báº­t"],
      ["KĂ¬nh DÆ°Æ¡ng", "ÄĂ  La"],
      ["Há»a Tinh", "Linh Tinh"],
      ["Äá»‹a KhĂ´ng", "Äá»‹a Kiáº¿p"]
    ];
const prefixGroup = ["", "L", "ÄV", "TL", "N", "Nh"];

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
  // đŸ¯ Xá»¬ LĂ CLICK CUNG
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
  // đŸ§¹ CLICK RA NGOĂ€I Táº®T HIá»†U á»¨NG
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







/* đŸŒ¿ LAYER 8 â€“ VĂ²ng TrĂ ng Sinh */
function anLop8_VongTrangSinh(data) {
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i",
                      "ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const cellMap = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };

  const START = {
    "má»™c tam cá»¥c": "Há»£i",
    "há»a lá»¥c cá»¥c": "Dáº§n",
    "kim tá»© cá»¥c": "Tá»µ",
    "thá»§y nhá»‹ cá»¥c": "ThĂ¢n",
    "thá»• ngÅ© cá»¥c": "ThĂ¢n"
  };

  const VONG_TS = [
    "trÆ°á»ng sinh","má»™c dá»¥c","quan Ä‘á»›i","lĂ¢m quan",
    "Ä‘áº¿ vÆ°á»£ng","suy","bá»‡nh","tá»­","má»™","tuyá»‡t","thai","dÆ°á»¡ng"
  ];

  const cuc = (data.cucSo || "").toLowerCase();
  const menhAD = (data.menh || "").toLowerCase();

  const startCung = START[cuc];
  if (!startCung) return;

  const chieu = (menhAD.includes("dÆ°Æ¡ng nam") || menhAD.includes("Ă¢m ná»¯"))
    ? "thuáº­n" : "nghá»‹ch";

  let idxStart = CUNG_THUAN.indexOf(startCung);
  if (idxStart < 0) return;

  for (let i = 0; i < 12; i++) {
    const idx = (chieu === "thuáº­n")
      ? (idxStart + i) % 12
      : (idxStart - i + 12) % 12;
    const cung = CUNG_THUAN[idx];
    const sao = VONG_TS[i];
    const cell = document.getElementById("cell" + cellMap[cung]);
    if (!cell) continue;
    let layer8 = cell.querySelector(".layer-8");
    if (!layer8) {
      layer8 = document.createElement("div");
layer8.className = "layer-8";  // âœ… 
      const inner = document.createElement("div");
      inner.className = "layer8-div";
      layer8.appendChild(inner);
      cell.appendChild(layer8);
    }
    const inner = layer8.querySelector(".layer8-div");
    if (inner) inner.textContent = sao;
  }

  console.log("đŸŒ¿ HoĂ n táº¥t an Layer 8 â€“ VĂ²ng TrĂ ng Sinh");
}















// =====================================================
// đŸŒŸ CLICK SAO HĂ“A â†’ SĂNG SAO Gá»C (tá»± Ä‘á»™ng nháº­n nÄƒm háº¡n náº¿u Ä‘ang xem háº¡n)
// =====================================================
document.addEventListener("click", (ev) => {
  const target = ev.target;
  const container = document.getElementById("lasoContainer");
  if (!container) return;

  const insideBang = container.contains(target);
  

  // đŸŸ¢ Náº¿u click ra ngoĂ i vĂ¹ng lĂ¡ sá»‘ â†’ reset toĂ n bá»™ sĂ¡ng
  if (!insideBang) {
    document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
    window.tuHoaClicked = false;
    return;
  }

  // đŸŸ¢ Náº¿u Ä‘ang á»Ÿ cháº¿ Ä‘á»™ sao HĂ³a mĂ  click vĂ o vĂ¹ng khĂ¡c KHĂ”NG cĂ³ chá»¯ "HĂ³a" â†’ táº¯t sĂ¡ng sao HĂ³a
  if (window.tuHoaClicked && !target.textContent.includes("HĂ³a")) {
    document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
    window.tuHoaClicked = false;
  }

  // âœ… Náº¿u click khĂ´ng pháº£i sao HĂ³a â†’ thoĂ¡t khá»i logic HĂ³a
  if (!target.textContent.includes("HĂ³a")) return;

  // âœ… Kiá»ƒm tra cĂ³ tháº­t sá»± click Ä‘Ăºng chá»¯ sao HĂ³a khĂ´ng
  const isExactHoa =
    target &&
    target.nodeType === 1 &&
    target.children.length === 0 &&
    target.textContent.trim().includes("HĂ³a");

  if (!isExactHoa) {
    if (window.tuHoaClicked) {
      document.querySelectorAll(".sao-highlight").forEach(el => el.classList.remove("sao-highlight"));
      window.tuHoaClicked = false;
    }
    return;
  }

  // đŸ€ Báº¯t Ä‘áº§u xá»­ lĂ½ tháº­t khi click Ä‘Ăºng chá»¯ HĂ³a
  window.tuHoaClicked = true;
  console.log("âœ… ÄĂ£ click vĂ o:", target.textContent);

  const tenHoa = target.textContent.trim();

 
// đŸ” XĂ¡c Ä‘á»‹nh CAN nÄƒm phĂ¹ há»£p vá»›i loáº¡i sao HĂ³a Ä‘Æ°á»£c click
let canNam = "";

// Náº¿u lĂ  sao Tiá»ƒu Váº­n (báº¯t Ä‘áº§u báº±ng "L.")
if (tenHoa.startsWith("L.")) {
  canNam = window.dataGlobal?.canChiHan?.split(" ")[0] || "";
}
// Náº¿u lĂ  sao Äáº¡i Váº­n (báº¯t Ä‘áº§u báº±ng "ÄV.")
else if (tenHoa.startsWith("ÄV.")) {
  canNam = window.dataGlobal?.canChiDaiVan?.split(" ")[0] || "";
}
// Náº¿u lĂ  sao Nguyá»‡t Váº­n (báº¯t Ä‘áº§u báº±ng "N.")
else if (tenHoa.startsWith("N.")) {
  canNam = window.dataGlobal?.luuHan?.canChiThang?.split(" ")[0] || "";
}
// âœ… Náº¿u lĂ  sao Nháº­t Váº­n (báº¯t Ä‘áº§u báº±ng "Nh.")
else if (tenHoa.startsWith("Nh.")) {
  canNam = window.dataGlobal?.luuHan?.canChiNgay?.split(" ")[0] || "";
}
// CĂ²n láº¡i: sao gá»‘c nÄƒm sinh
else {
  canNam = window.dataGlobal?.canChiNam?.split(" ")[0] || "";
}




  const TU_HOA = {
    "GiĂ¡p": { loc:"LiĂªm Trinh", quyen:"PhĂ¡ QuĂ¢n", khoa:"VÅ© KhĂºc", ky:"ThĂ¡i DÆ°Æ¡ng" },
    "áº¤t": { loc:"ThiĂªn CÆ¡", quyen:"ThiĂªn LÆ°Æ¡ng", khoa:"Tá»­ Vi", ky:"ThĂ¡i Ă‚m" },
    "BĂ­nh": { loc:"ThiĂªn Äá»“ng", quyen:"ThiĂªn CÆ¡", khoa:"VÄƒn XÆ°Æ¡ng", ky:"LiĂªm Trinh" },
    "Äinh": { loc:"ThĂ¡i Ă‚m", quyen:"ThiĂªn Äá»“ng", khoa:"ThiĂªn CÆ¡", ky:"Cá»± MĂ´n" },
    "Máº­u": { loc:"Tham Lang", quyen:"ThĂ¡i Ă‚m", khoa:"Há»¯u Báº­t", ky:"ThiĂªn CÆ¡" },
    "Ká»·": { loc:"VÅ© KhĂºc", quyen:"Tham Lang", khoa:"ThiĂªn LÆ°Æ¡ng", ky:"VÄƒn KhĂºc" },
    "Canh": { loc:"ThĂ¡i DÆ°Æ¡ng", quyen:"VÅ© KhĂºc", khoa:"ThiĂªn Äá»“ng", ky:"ThĂ¡i Ă‚m" },
    "TĂ¢n": { loc:"Cá»± MĂ´n", quyen:"ThĂ¡i DÆ°Æ¡ng", khoa:"VÄƒn KhĂºc", ky:"VÄƒn XÆ°Æ¡ng" },
    "NhĂ¢m": { loc:"ThiĂªn LÆ°Æ¡ng", quyen:"Tá»­ Vi", khoa:"Táº£ PhĂ¹", ky:"VÅ© KhĂºc" },
    "QuĂ½": { loc:"PhĂ¡ QuĂ¢n", quyen:"Cá»± MĂ´n", khoa:"ThĂ¡i Ă‚m", ky:"Tham Lang" }
  };

  const hoa = TU_HOA[canNam];
  if (!hoa) return;

  // âœ… XĂ¡c Ä‘á»‹nh sao gá»‘c Ä‘Ăºng theo nÄƒm Ä‘ang xem
  let goc = "";
  if (tenHoa.includes("Lá»™c")) goc = hoa.loc;
  if (tenHoa.includes("Quyá»n")) goc = hoa.quyen;
  if (tenHoa.includes("Khoa")) goc = hoa.khoa;
  if (tenHoa.includes("Ká»µ")) goc = hoa.ky;
  if (!goc) return;

  console.log(`đŸŒ¸ ${tenHoa} (${canNam}) â†’ Sao gá»‘c: ${goc}`);


  // đŸ§¹ XĂ³a sĂ¡ng cÅ©
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // đŸŒŸ LĂ m sĂ¡ng chĂ­nh sao HĂ³a báº¡n vá»«a click
  target.classList.add("sao-highlight");
  target.offsetHeight;
target.style.transform = "translateZ(0)";


  // âœ¨ TĂ¬m vĂ  sĂ¡ng sao gá»‘c
const cleanGoc = goc
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")  // bá» dáº¥u tá»• há»£p
  .replace(/\u0110/g, "d")          // Ä â†’ d
  .replace(/\u0111/g, "d")          // Ä‘ â†’ d
  .replace(/\s+/g, "")              // bá» khoáº£ng tráº¯ng
  .trim()
  .toLowerCase();

  let timThay = false;

  document.querySelectorAll("[class*='layer'] div, .cung div").forEach(el => {
   const name = el.textContent.trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")   // bá» dáº¥u tá»• há»£p
  .replace(/\u0110/g, "d")           // Ä â†’ d
  .replace(/\u0111/g, "d")           // Ä‘ â†’ d
  .replace(/\s+/g, "")               // bá» khoáº£ng tráº¯ng
  .trim()
  .toLowerCase();

    if (name === cleanGoc) {
      el.classList.add("sao-highlight");
      timThay = true;
    }
  });

if (!timThay) console.warn("Warning: KhĂ´ng tĂ¬m tháº¥y sao gá»‘c:", goc);
});






















<!-- ===================================================== -->
<!-- đŸŒ— Lá»P 7 â€“ TUáº¦N / TRIá»†T -->
<!-- ===================================================== -->
// đŸ“œ Quy táº¯c an Triá»‡t
function anTriet(canNam) {
  const bangTriet = {
    "GiĂ¡p": ["ThĂ¢n", "Dáº­u"],
    "áº¤t": ["Ngá»", "MĂ¹i"],
    "BĂ­nh": ["ThĂ¬n", "Tá»µ"],
    "Äinh": ["Dáº§n", "MĂ£o"],
    "Máº­u": ["TĂ½", "Sá»­u"],
    "Ká»·": ["ThĂ¢n", "Dáº­u"],
    "Canh": ["Ngá»", "MĂ¹i"],
    "TĂ¢n": ["ThĂ¬n", "Tá»µ"],
    "NhĂ¢m": ["Dáº§n", "MĂ£o"],
    "QuĂ½": ["TĂ½", "Sá»­u"]
  };
  return bangTriet[canNam] || [];
}

// đŸ“œ Quy táº¯c an Tuáº§n (theo báº£ng báº¡n gá»­i)
function anTuan(canNam, chiNam) {
  const canArr = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
  const bangTuan = {
    "TĂ½â€“Sá»­u": ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"],
    "Dáº§nâ€“MĂ£o": ["ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"],
    "ThĂ¬nâ€“Tá»µ": ["Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o"],
    "Ngá»â€“MĂ¹i": ["ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ"],
    "ThĂ¢nâ€“Dáº­u": ["Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i"],
    "Tuáº¥tâ€“Há»£i": ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u"]
  };

  const canIndex = canArr.indexOf(canNam);
  if (canIndex === -1) return [];

  // Duyá»‡t tá»«ng hĂ ng (cáº·p Tuáº§n)
  for (const [capTuan, danhSachChi] of Object.entries(bangTuan)) {
    const chiO = danhSachChi[canIndex];
    if (chiO === chiNam) {
      const [c1, c2] = capTuan.split("â€“");
      return [c1, c2];
    }
  }
  return [];
}












// =====================================================
// đŸŒ‘ Váº½ thanh Tuáº§n / Triá»‡t (chuáº©n quy táº¯c cá»‘ Ä‘á»‹nh + gá»™p Tuáº§nâ€“Triá»‡t)
// =====================================================
function veThanhTuanTriet(ten, cung1, cung2) {
  // đŸ”  Viáº¿t hoa chá»¯ Ä‘áº§u, cĂ¡c chá»¯ sau viáº¿t thÆ°á»ng
  ten = ten.charAt(0).toUpperCase() + ten.slice(1).toLowerCase();

  const map = {
    "TĂ½":11, "Sá»­u":10, "Dáº§n":9, "MĂ£o":7,
    "ThĂ¬n":5, "Tá»µ":1, "Ngá»":2, "MĂ¹i":3,
    "ThĂ¢n":4, "Dáº­u":6, "Tuáº¥t":8, "Há»£i":12
  };

  const key = [cung1, cung2].sort().join("-");
  const existing = document.querySelector(`[data-cap="${key}"]`);

  // âœ… Náº¿u Ä‘Ă£ cĂ³ thanh Tuáº§n/Triá»‡t â†’ chá»‰ thĂªm chá»¯, rá»“i cÄƒn láº¡i giá»¯a
  if (existing) {
    if (!existing.innerText.includes(ten)) {
      existing.innerHTML = `<span>${existing.innerText.trim()} â€“ ${ten}</span>`;

      // đŸ•’ Chá» DOM cáº­p nháº­t xong, rá»“i Ä‘o láº¡i kĂ­ch thÆ°á»›c tháº­t Ä‘á»ƒ cÄƒn giá»¯a
      requestAnimationFrame(() => {
        const newWidth = existing.offsetWidth;
        const oldWidth = existing.dataset.oldWidth ? parseFloat(existing.dataset.oldWidth) : newWidth;
        const currentLeft = parseFloat(existing.style.left) || 0;
        existing.style.left = (currentLeft - (newWidth - oldWidth) / 2) + "px";
        existing.dataset.oldWidth = newWidth; // lÆ°u láº¡i cho láº§n sau
      });
    }
    return;
  }

  // đŸ“¦ Láº¥y DOM cĂ¡c cung
  const c1 = document.getElementById("cell" + map[cung1]);
  const c2 = document.getElementById("cell" + map[cung2]);
  const container = document.getElementById("lasoContainer");
  if (!c1 || !c2 || !container) return;

  // đŸ¨ Táº¡o thanh hiá»ƒn thá»‹
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

  // đŸ¯ TĂ­nh vá»‹ trĂ­ tháº­t (theo layout)
  const rect1 = c1.getBoundingClientRect();
  const rect2 = c2.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const midX = ((rect1.left + rect1.right) / 2 + (rect2.left + rect2.right) / 2) / 2 - containerRect.left;
  const midY = ((rect1.top + rect1.bottom) / 2 + (rect2.top + rect2.bottom) / 2) / 2 - containerRect.top;

  let x = midX - bar.offsetWidth / 2;
  let y = midY - bar.offsetHeight / 2;

  // đŸ”¹ Quy táº¯c cá»‘ Ä‘á»‹nh 6 cáº·p
 if (["TĂ½-Sá»­u", "Sá»­u-TĂ½"].includes(key)) {
  // đŸ”¹ ÄĂ¨ lĂªn Ä‘Ăºng thanh ngang biĂªn trĂªn
  y = rect1.top - containerRect.top - bar.offsetHeight / 2;
}
else if (["Ngá»-MĂ¹i", "MĂ¹i-Ngá»"].includes(key)) {
  // đŸ”¹ ÄĂ¨ lĂªn Ä‘Ăºng thanh ngang biĂªn dÆ°á»›i
  y = rect1.bottom - containerRect.top - bar.offsetHeight / 2;
}
 
  else {
    // đŸ‘‰ 4 cáº·p cĂ²n láº¡i giá»¯a biĂªn
    y = midY - bar.offsetHeight / 2;
  }

  bar.style.left = `${x}px`;
  bar.style.top = `${y}px`;
  bar.dataset.oldWidth = bar.offsetWidth;
}

const CUNG_MAP = {
  "TĂ½": 11, "Sá»­u": 10, "Dáº§n": 9, "MĂ£o": 7, "ThĂ¬n": 5, "Tá»µ": 1,
  "Ngá»": 2, "MĂ¹i": 3, "ThĂ¢n": 4, "Dáº­u": 6, "Tuáº¥t": 8, "Há»£i": 12
};

const TIEUTINH_DATA = [
  { ten: "ThĂ¡i Tuáº¿", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "ThaiTue", huong: "thuáº­n", ghiChu: "An táº¡i cung cĂ³ Ä‘á»‹a chi nÄƒm sinh (ThĂ¡i Tuáº¿)." },
  { ten: "Thiáº¿u DÆ°Æ¡ng", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 1, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 1 cung." },
  { ten: "Tang MĂ´n", hanh: "Má»™c", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 2, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 2 cung." },
  { ten: "Thiáº¿u Ă‚m", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn","Tiá»n báº¡c"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 3, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 3 cung." },
  { ten: "Quan PhĂ¹", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 4, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 4 cung." },
  { ten: "Tá»­ PhĂ¹", hanh: "Kim", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 5, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 5 cung." },
  { ten: "Tuáº¿ PhĂ¡", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 6, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 6 cung." },
  { ten: "Long Äá»©c", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 7, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 7 cung." },
  { ten: "Báº¡ch Há»•", hanh: "Kim", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 8, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 8 cung." },
  { ten: "PhĂºc Äá»©c", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 9, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 9 cung." },
  { ten: "Äiáº¿u KhĂ¡ch", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 10, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 10 cung." },
  { ten: "Trá»±c PhĂ¹", hanh: "Kim", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoThaiTue", huong: "thuáº­n", buoc: 11, ghiChu: "Äáº¿m thuáº­n tá»« ThĂ¡i Tuáº¿ 11 cung." }
];
// đŸŒŸ NhĂ³m tiá»ƒu tinh an theo Äá»‹a Chi NÄƒm Sinh
TIEUTINH_DATA.push(
  { ten: "PhÆ°á»£ng CĂ¡c", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Giáº£i Tháº§n", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Long TrĂ¬", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Nguyá»‡t Äá»©c", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "ThiĂªn Äá»©c", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "ThiĂªn Há»·", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "ThiĂªn Khá»‘c", hanh: "Thá»§y", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoDiaChiNam", dsCung: ["Ngá»","Tá»µ","ThĂ¬n","MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "ThiĂªn HÆ°", hanh: "Thá»§y", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoDiaChiNam", dsCung: ["Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "ÄĂ o Hoa", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["Dáº­u","Ngá»","MĂ£o","TĂ½","Dáº­u","Ngá»","MĂ£o","TĂ½","Dáº­u","Ngá»","MĂ£o","TĂ½"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Há»“ng Loan", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["MĂ£o","Dáº§n","Sá»­u","TĂ½","Há»£i","Tuáº¥t","Dáº­u","ThĂ¢n","MĂ¹i","Ngá»","Tá»µ","ThĂ¬n"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Hoa CĂ¡i", hanh: "Kim", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["ThĂ¬n","Sá»­u","Tuáº¥t","MĂ¹i","ThĂ¬n","Sá»­u","Tuáº¥t","MĂ¹i","ThĂ¬n","Sá»­u","Tuáº¥t","MĂ¹i"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Kiáº¿p SĂ¡t", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tá»µ","Dáº§n","Há»£i","ThĂ¢n","Tá»µ","Dáº§n","Há»£i","ThĂ¢n","Tá»µ","Dáº§n","Há»£i","ThĂ¢n"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "PhĂ¡ ToĂ¡i", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoDiaChiNam", dsCung: ["Tá»µ","Sá»­u","Dáº­u","Tá»µ","Sá»­u","Dáº­u","Tá»µ","Sá»­u","Dáº­u","Tá»µ","Sá»­u","Dáº­u"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "CĂ´ Tháº§n", hanh: "Thá»•", loai: "Hung", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["Dáº§n","Dáº§n","Tá»µ","Tá»µ","Tá»µ","ThĂ¢n","ThĂ¢n","ThĂ¢n","Há»£i","Há»£i","Há»£i","Dáº§n"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." },
  { ten: "Quáº£ TĂº", hanh: "Thá»•", loai: "Hung", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoDiaChiNam", dsCung: ["Tuáº¥t","Tuáº¥t","Sá»­u","Sá»­u","Sá»­u","ThĂ¬n","ThĂ¬n","ThĂ¬n","MĂ¹i","MĂ¹i","MĂ¹i","Tuáº¥t"], ghiChu: "An theo Ä‘á»‹a chi nÄƒm sinh." }
);
// đŸŒ™ NhĂ³m Tiá»ƒu Tinh an theo ThĂ¡ng Sinh
TIEUTINH_DATA.push(
  { ten: "ThiĂªn HĂ¬nh", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "TheoThangSinh", dsCung: ["Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n"], ghiChu: "An theo thĂ¡ng Ă¢m lá»‹ch (1â€“12) cá»‘ Ä‘á»‹nh theo báº£ng tra." },
  { ten: "ThiĂªn RiĂªu", hanh: "Thá»§y", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "TheoThangSinh", dsCung: ["Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½"], ghiChu: "An theo thĂ¡ng Ă¢m lá»‹ch (1â€“12) cá»‘ Ä‘á»‹nh theo báº£ng tra." },
  { ten: "ThiĂªn Y", hanh: "Thá»§y", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "TheoThangSinh", dsCung: ["Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½"], ghiChu: "An theo thĂ¡ng Ă¢m lá»‹ch (1â€“12) cá»‘ Ä‘á»‹nh theo báº£ng tra." },
  { ten: "ThiĂªn Giáº£i", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoThangSinh", dsCung: ["ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i"], ghiChu: "An theo thĂ¡ng Ă¢m lá»‹ch (1â€“12) cá»‘ Ä‘á»‹nh theo báº£ng tra." },
  { ten: "Äá»‹a Giáº£i", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoThangSinh", dsCung: ["MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»"], ghiChu: "An theo thĂ¡ng Ă¢m lá»‹ch (1â€“12) cá»‘ Ä‘á»‹nh theo báº£ng tra." }
);


// đŸ•’ NhĂ³m Tiá»ƒu Tinh an theo Giá» Sinh
TIEUTINH_DATA.push(
  { ten: "Thai Phá»¥", hanh: "Kim", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh","TĂ¬nh DuyĂªn"], congThuc: "TheoGioSinh", dsCung: ["Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ"], ghiChu: "An theo giá» sinh (TĂ½â€“Sá»­uâ€“...â€“Há»£i)." },
  { ten: "Phong CĂ¡o", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoGioSinh", dsCung: ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"], ghiChu: "An theo giá» sinh (TĂ½â€“Sá»­uâ€“...â€“Há»£i)." }
);
// đŸ’« NhĂ³m Tiá»ƒu Tinh an theo Lá»™c Tá»“n
TIEUTINH_DATA.push(
  { ten: "BĂ¡c SÄ©", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoLocTon", buoc: 0, ghiChu: "An cĂ¹ng cung vá»›i Lá»™c Tá»“n." },
  { ten: "Lá»±c SÄ©", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoLocTon", buoc: 1, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 1 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Thanh Long", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoLocTon", buoc: 2, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 2 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Tiá»ƒu Hao", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","Tiá»n Báº¡c"], congThuc: "TheoLocTon", buoc: 3, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 3 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "TÆ°á»›ng QuĂ¢n", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoLocTon", buoc: 4, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 4 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Táº¥u ThÆ°", hanh: "Kim", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TheoLocTon", buoc: 5, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 5 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Phi LiĂªm", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "TheoLocTon", buoc: 6, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 6 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Há»· Tháº§n", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","TĂ¬nh DuyĂªn"], congThuc: "TheoLocTon", buoc: 7, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 7 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Bá»‡nh PhĂ¹", hanh: "Thá»•", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoLocTon", buoc: 8, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 8 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Äáº¡i Hao", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","Tiá»n Báº¡c"], congThuc: "TheoLocTon", buoc: 9, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 9 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Phá»¥c Binh", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoLocTon", buoc: 10, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 10 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." },
  { ten: "Quan Phá»§", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoLocTon", buoc: 11, ghiChu: "Sau hoáº·c TrÆ°á»›c Lá»™c Tá»“n 11 cung tĂ¹y Ă‚m DÆ°Æ¡ng Nam Ná»¯." }
);
// đŸ“… NhĂ³m Tiá»ƒu tinh theo NGĂ€Y SINH
TIEUTINH_DATA.push(
  // ThiĂªn QuĂ½: tá»« VÄƒn KhĂºc Ä‘áº¿m NGHá»CH Ä‘áº¿n ngĂ y sinh, rá»“i lĂ¹i 1 cung
  { ten: "ThiĂªn QuĂ½", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoNgay_ThienQuy", ghiChu: "Tá»« VÄƒn KhĂºc Ä‘áº¿m nghá»‹ch Ä‘áº¿n ngĂ y sinh, lĂ¹i 1 cung." },

  // Ă‚n Quang: tá»« VÄƒn XÆ°Æ¡ng Ä‘áº¿m THUáº¬N Ä‘áº¿n ngĂ y sinh, rá»“i lĂ¹i 1 cung
  { ten: "Ă‚n Quang", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoNgay_AnQuang", ghiChu: "Tá»« VÄƒn XÆ°Æ¡ng Ä‘áº¿m thuáº­n Ä‘áº¿n ngĂ y sinh, lĂ¹i 1 cung." },

  // Tam Thai: tá»« Táº£ Phá»¥ Ä‘áº¿m THUáº¬N Ä‘áº¿n ngĂ y sinh
  { ten: "Tam Thai", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoNgay_TamThai", ghiChu: "Tá»« Táº£ Phá»¥ Ä‘áº¿m thuáº­n Ä‘áº¿n ngĂ y sinh." },

  // BĂ¡t Tá»a: tá»« Há»¯u Báº­t Ä‘áº¿m NGHá»CH Ä‘áº¿n ngĂ y sinh
  { ten: "BĂ¡t Tá»a", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TheoNgay_BatToa", ghiChu: "Tá»« Há»¯u Báº­t Ä‘áº¿m nghá»‹ch Ä‘áº¿n ngĂ y sinh." }
);

// đŸŒŸ NhĂ³m Tiá»ƒu Tinh an theo Can NÄƒm Sinh
TIEUTINH_DATA.push(
  { ten: "LÆ°u HĂ ", hanh: "Thá»§y", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["Dáº­u","Tuáº¥t","MĂ¹i","ThĂ¬n","Tá»µ","Ngá»","ThĂ¢n","MĂ£o","Há»£i","Dáº§n"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’BĂ­nhâ†’Äinhâ†’Máº­uâ†’Ká»·â†’Canhâ†’TĂ¢nâ†’NhĂ¢mâ†’QuĂ½)." },
  { ten: "Quá»‘c áº¤n", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["Tuáº¥t","Há»£i","Sá»­u","Dáº§n","Sá»­u","Dáº§n","ThĂ¬n","Tá»µ","MĂ¹i","ThĂ¢n"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." },
  { ten: "ÄÆ°á»ng PhĂ¹", hanh: "Má»™c", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["MĂ¹i","ThĂ¢n","Tuáº¥t","Há»£i","Tuáº¥t","Há»£i","Sá»­u","Dáº§n","ThĂ¬n","Tá»µ"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." },
  { ten: "VÄƒn Tinh", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["Tá»µ","Ngá»","ThĂ¢n","Dáº­u","ThĂ¢n","Dáº­u","Há»£i","TĂ½","Dáº­u","MĂ£o"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." },
  { ten: "ThiĂªn Quan", hanh: "Há»a", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["MĂ¹i","ThĂ¬n","Tá»µ","Dáº§n","MĂ£o","Dáº­u","Há»£i","Dáº­u","Tuáº¥t","Ngá»"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." },
  { ten: "ThiĂªn PhĂºc", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["Dáº­u","ThĂ¢n","TĂ½","Há»£i","MĂ£o","Dáº§n","Ngá»","Tá»µ","Ngá»","Tá»µ"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." },
  { ten: "ThiĂªn TrĂ¹", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£"], congThuc: "TheoCanNamSinh", dsCung: ["Tá»µ","Ngá»","TĂ½","Tá»µ","Ngá»","ThĂ¢n","Dáº§n","Ngá»","Dáº­u","Tuáº¥t"], ghiChu: "An theo Can nÄƒm sinh (GiĂ¡pâ†’áº¤tâ†’...â†’QuĂ½)." }
);

// đŸŒŸ NhĂ³m TIá»‚U TINH â€“ Táº P TINH (Ä‘áº·c biá»‡t, má»—i sao 1 quy táº¯c riĂªng)
TIEUTINH_DATA.push(
  { ten: "Äáº©u QuĂ¢n", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TapTinh_DauQuan", ghiChu: "TĂ­nh nghá»‹ch tá»« ThĂ¡i Tuáº¿ (Dáº§n) Ä‘áº¿n thĂ¡ng sinh, rá»“i thuáº­n theo giá» sinh." },
  { ten: "ThiĂªn KhĂ´ng", hanh: "Há»a", loai: "Hung", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TapTinh_ThienKhong", ghiChu: "An sau ThĂ¡i Tuáº¿, cĂ¹ng cung Thiáº¿u DÆ°Æ¡ng." },
  { ten: "ThiĂªn TĂ i", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TapTinh_ThienTai", ghiChu: "Äáº·t TĂ½ á»Ÿ Má»‡nh, Ä‘áº¿m thuáº­n Ä‘áº¿n nÄƒm sinh." },
  { ten: "ThiĂªn Thá»", hanh: "Thá»•", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","CĂ´ng Danh"], congThuc: "TapTinh_ThienTho", ghiChu: "Äáº·t TĂ½ á»Ÿ ThĂ¢n, Ä‘áº¿m thuáº­n Ä‘áº¿n nÄƒm sinh." },
{ ten: "ThiĂªn ThÆ°Æ¡ng", hanh: "Thá»•", loai: "Hung", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TapTinh_CuDinh", cuDinh: "NĂ´ Bá»™c", ghiChu: "An táº¡i NĂ´ Bá»™c." },
{ ten: "ThiĂªn Sá»©", hanh: "Thá»§y", loai: "CĂ¡t", nhom: ["Táº¥t Cáº£","Sá»©c Khá»e"], congThuc: "TapTinh_CuDinh", cuDinh: "Táº­t Ăch", ghiChu: "An táº¡i Táº­t Ăch." },
{ ten: "ThiĂªn La", hanh: "Kim", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "codinh", dsCung: ["ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n","ThĂ¬n"], ghiChu: "An cá»‘ Ä‘á»‹nh táº¡i ThĂ¬n." },
{ ten: "Äá»‹a VĂµng", hanh: "Kim", loai: "Hung", nhom: ["Táº¥t Cáº£"], congThuc: "codinh", dsCung: ["Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t","Tuáº¥t"], ghiChu: "An cá»‘ Ä‘á»‹nh táº¡i Tuáº¥t." }
);



// ===== Helpers cho nhĂ³m theo NGĂ€Y SINH (Ä‘áº·t TRÆ¯á»C tinhCungTieuTinh) =====
const __CHI_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

// Map ngÆ°á»£c id Ă´ -> tĂªn chi (vd: cell11 -> "TĂ½")
const REVERSE_CUNG = Object.fromEntries(
  Object.entries(CUNG_MAP).map(([chi, idx]) => [idx, chi])
);

// Chuáº©n hĂ³a sao: bá» dáº¥u, xá»­ lĂ½ Ä/Ä‘, xoĂ¡ tráº¯ng, viáº¿t thÆ°á»ng
function __norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")         // Ä â†’ d
    .replace(/\u0111/g, "d")         // Ä‘ â†’ d
    .replace(/\s+/g, "")             // bá» khoáº£ng tráº¯ng
    .trim()
    .toLowerCase();
}


// TĂ¬m Ä‘á»‹a chi Ă´ Ä‘ang chá»©a 1 sao má»‘c (XÆ°Æ¡ng/KhĂºc/Táº£/Há»¯u) trong LAYER 6 trung tinh
function __timCungChuaSao(tenSao) {
  const target = __norm(tenSao); // "van xuong", "van khuc", "ta phu", "huu bat"
  // chá»‰ quĂ©t sao trung tinh (loáº¡i .tieutinh ra)
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
  return null; // khĂ´ng tháº¥y
}

// Äáº¿m tá»« startChi tá»›i NGĂ€Y sinh (1..30) theo chiá»u 'thuan'|'nghich', cá»™ng offset
function __demToiNgay(startChi, ngay, chieu, offset = 0) {
  if (!startChi) return "TĂ½";
  const step12 = ((parseInt(ngay,10) || 1) - 1) % 12; // ngĂ y 1 = bÆ°á»›c 0
  const startIdx = __CHI_LIST.indexOf(startChi);
  if (startIdx < 0) return "TĂ½";
  const dir = (chieu === "nghich") ? -1 : 1;
  const idx = (startIdx + dir * step12 + offset + 1200) % 12;
  return __CHI_LIST[idx];
}
// đŸ§­ Tráº£ vá» chá»‰ sá»‘ 0â€“9 tÆ°Æ¡ng á»©ng vá»›i Can nÄƒm sinh (GiĂ¡pâ†’QuĂ½)
function getCanIndex(canNam) {
  const CAN_LIST = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
  const idx = CAN_LIST.indexOf((canNam || "").trim());
  return idx >= 0 ? idx : 0; // náº¿u sai hoáº·c null â†’ máº·c Ä‘á»‹nh 0 (GiĂ¡p)
}
function tinhCungTieuTinh(sao, data) {
  // đŸ”¹ Náº¿u thiáº¿u canChiNam, bá»• sung tá»« window.dataGlobal
  if (!data.canChiNam && window.dataGlobal?.canChiNam) {
    data.canChiNam = window.dataGlobal.canChiNam;
  }

  // đŸ’¡ TĂ¡ch chi nÄƒm tá»« thuá»™c tĂ­nh canChiNam (VD: "áº¤t TĂ½" â†’ "TĂ½")
  const chiNam = (data.canChiNam || "").split(" ")[1] || null;
  const canNam = (data.canChiNam || "").split(" ")[0] || null;

  if (!chiNam) {
    console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y chi nÄƒm sinh trong dataGlobal!"); 
    return "TĂ½"; // fallback trĂ¡nh crash
  }


  const chiList = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const next = (chi, n = 1) => chiList[(chiList.indexOf(chi) + n + 12) % 12];

  switch (sao.congThuc) {
    case "ThaiTue":
      return chiNam; // ThĂ¡i Tuáº¿ an táº¡i chi nÄƒm sinh
    case "TheoThaiTue":
      return next(chiNam, sao.buoc); // cĂ¡c sao khĂ¡c Ä‘áº¿m thuáº­n
   case "TheoDiaChiNam": {
  const chiNam = (data.canChiNam || "").split(" ")[1] || null;
  const chiList = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  if (!chiNam) return "TĂ½";
  const idx = chiList.indexOf(chiNam);
  if (idx === -1) return "TĂ½";
  return sao.dsCung ? sao.dsCung[idx] : "TĂ½";
}
case "TheoThangSinh": {
  let thang = Number(String(data.thangAm || data.thangSinh || "").replace(/\D/g, ""));
  if (!thang || thang < 1 || thang > 12) {
    console.warn("â ï¸ Thiáº¿u thĂ¡ng Ă¢m há»£p lá»‡, táº¡m láº¥y thĂ¡ng 1");
    thang = 1;
  }
  const idx = thang - 1;
  return sao.dsCung[idx] || "TĂ½";
}




case "TheoGioSinh": {
  const chiGio = (data.gioAm || data.gioSinhChi || "TĂ½").trim(); // Æ°u tiĂªn giá» Ă¢m
  const chiList = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const idx = chiList.indexOf(chiGio);
  return sao.dsCung ? sao.dsCung[idx >= 0 ? idx : 0] : "TĂ½";
}
case "TheoLocTon": {
  const chiList = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  // 1) Láº¥y CAN & CHI nÄƒm
  const canNam = (data.canChiNam || "").split(" ")[0] || "";   // "áº¤t"
  // Náº¿u Ä‘Ă£ cĂ³ sáºµn locTonChi trong dataGlobal thĂ¬ dĂ¹ng luĂ´n, cĂ²n khĂ´ng thĂ¬ suy ra theo Can:
  let locTon = data.locTonChi;
  if (!locTon) {
    const locTonMap = {
      "GiĂ¡p":"Dáº§n","áº¤t":"MĂ£o","BĂ­nh":"Tá»µ","Äinh":"Ngá»",
      "Máº­u":"Tá»µ","Ká»·":"Ngá»","Canh":"ThĂ¢n","TĂ¢n":"Dáº­u",
      "NhĂ¢m":"Há»£i","QuĂ½":"TĂ½"
    };
    locTon = locTonMap[canNam] || "TĂ½";
  }

  // 2) XĂ¡c Ä‘á»‹nh Ă‚m/DÆ°Æ¡ng & Nam/Ná»¯ Ä‘á»ƒ quyáº¿t Ä‘á»‹nh chiá»u
  //   Quy Æ°á»›c: DÆ°Æ¡ng Nam / Ă‚m Ná»¯ -> Ä‘i THUáº¬N;  DÆ°Æ¡ng Ná»¯ / Ă‚m Nam -> Ä‘i NGHá»CH
  const rawMenh = (data.menh || "").toLowerCase();   // "Ă¢m nam" / "dÆ°Æ¡ng ná»¯" ...
  const rawGender = (data.gender || data.gioiTinh || "").toLowerCase(); // "nam"/"ná»¯"

  const isDuong = rawMenh.includes("dÆ°Æ¡ng");
  const isNam   = rawGender.includes("nam") || rawMenh.includes("nam");
  const thuan   = (isDuong && isNam) || (!isDuong && !isNam);

  // 3) TĂ­nh vá»‹ trĂ­ theo bÆ°á»›c
  const idx0   = chiList.indexOf(locTon);
  if (idx0 === -1) return "TĂ½";

  const step   = sao.buoc || 0;           // BĂ¡c SÄ© = 0 -> Ä‘á»“ng cung Lá»™c Tá»“n
  const newIdx = thuan
      ? (idx0 + step) % 12               // Ä‘i thuáº­n
      : (idx0 - step + 12) % 12;         // Ä‘i nghá»‹ch

  return chiList[newIdx];
}
case "TheoNgay_ThienQuy": {
  const chiGio = (data.gioAm || data.gioSinhChi || "TĂ½").trim();
  const ngay = parseInt(data.ngayAm || data.ngaySinh || 1);

  // âœ… VĂ²ng thuáº­n theo chiá»u Tá»­ Vi (ngÆ°á»£c kim Ä‘á»“ng há»“)
  const CUNG_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI   = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  const gioIndex = GIO_CHI.indexOf(chiGio);
  if (gioIndex === -1) return "ThĂ¬n";

  // đŸŸ£ DEBUG: ThiĂªn QuĂ½
  console.group("đŸŸ¢ DEBUG THIĂN QUĂ");
  console.log("Giá» sinh:", chiGio, "| NgĂ y Ă¢m:", ngay);
  console.log("â†’ Khá»Ÿi cung ThĂ¬n coi lĂ  giá» TĂ½");

  // đŸ”¹ B1: ThĂ¬n (giá» TĂ½) â†’ THUáº¬N Ä‘áº¿n giá» sinh (VÄƒn KhĂºc)
  const posThĂ¬n = CUNG_TUVI.indexOf("ThĂ¬n");
  const posVanKhuc = (posThĂ¬n + gioIndex) % 12;
  const cungVanKhuc = CUNG_TUVI[posVanKhuc];
  console.log(`â¡ï¸ Äi thuáº­n ${gioIndex} bÆ°á»›c â†’ ${cungVanKhuc} (VÄƒn KhĂºc)`);

  // đŸ”¹ B2: Tá»« VÄƒn KhĂºc â†’ NGHá»CH (ngĂ y sinh - 1)
  const posVan = CUNG_TUVI.indexOf(cungVanKhuc);
  const buocNghich = (ngay - 2 + 12) % 12; // ngĂ y 1 lĂ¹i 1
  const posThienQuy = (posVan - buocNghich + 12) % 12;
  const cungThienQuy = CUNG_TUVI[posThienQuy];

  console.log(`â¬…ï¸ Tá»« ${cungVanKhuc} Ä‘i nghá»‹ch ${buocNghich} bÆ°á»›c â†’ ${cungThienQuy} (ThiĂªn QuĂ½)`);
  console.groupEnd();

  return cungThienQuy;
}





case "TheoNgay_AnQuang": {
  const chiGio = (data.gioAm || data.gioSinhChi || "TĂ½").trim();
  const ngay = parseInt(data.ngayAm || data.ngaySinh || 1);

  // VĂ²ng Tá»­ Vi (ngÆ°á»£c kim Ä‘á»“ng há»“)
  const CUNG_TUVI = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI   = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  const gioIndex = GIO_CHI.indexOf(chiGio);
  if (gioIndex === -1) return "Tuáº¥t";

  // đŸª¶ DEBUG STEP 1
  console.group("đŸŸ£ DEBUG Ă‚N QUANG");
  console.log("Giá» sinh:", chiGio, "| NgĂ y Ă¢m:", ngay);
  console.log("â†’ Khá»Ÿi cung Tuáº¥t coi lĂ  giá» TĂ½");

  // B1: Tuáº¥t â†’ NGHá»CH Ä‘áº¿n giá» sinh (TRá»ª)
  const posTuáº¥t = CUNG_TUVI.indexOf("Tuáº¥t");
  const posVanXuong = (posTuáº¥t - gioIndex + 12) % 12;
  const cungVanXuong = CUNG_TUVI[posVanXuong];
  console.log(`â¡ï¸ Äi nghá»‹ch ${gioIndex} bÆ°á»›c â†’ ${cungVanXuong} (VÄƒn XÆ°Æ¡ng)`);

  // B2: Tá»« VÄƒn XÆ°Æ¡ng â†’ THUáº¬N (ngĂ y sinh - 1)
  const posVan = CUNG_TUVI.indexOf(cungVanXuong);
  const buocThuan = (ngay - 2 + 12) % 12; // vĂ¬ ngĂ y 1 pháº£i lĂ¹i 1 â†’ tá»©c lĂ  -1 thá»±c táº¿
  const posAnQuang = (posVan + buocThuan) % 12;
  const cungAnQuang = CUNG_TUVI[posAnQuang];

  console.log(`â¡ï¸ Tá»« ${cungVanXuong} Ä‘i thuáº­n ${buocThuan} bÆ°á»›c â†’ ${cungAnQuang} (Ă‚n Quang)`);
  console.groupEnd();

  return cungAnQuang;
}








case "TheoNgay_TamThai": {
  // đŸŒ• Tam Thai: Khá»Ÿi tá»« ThĂ¬n, thuáº­n thĂ¡ng sinh an Táº£ PhĂ¹ â†’ thuáº­n ngĂ y sinh an Tam Thai
  const VONG_12 = ["ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o"];

  // đŸ”¹ Láº¥y thĂ¡ng vĂ  ngĂ y Ă¢m (Æ°u tiĂªn dá»¯ liá»‡u Ă¢m lá»‹ch)
  const thang = parseInt(data?.lunar?.[1] || data?.thangAm || 1);
  const ngay  = parseInt(data?.lunar?.[0] || data?.ngayAm || 1);

  // đŸ”¹ PhĂ²ng lá»—i (náº¿u thiáº¿u dá»¯ liá»‡u)
  if (isNaN(thang) || isNaN(ngay)) return "ThĂ¬n";

  // đŸ”¹ B1: Khá»Ÿi tá»« ThĂ¬n â†’ thuáº­n thĂ¡ng sinh Ä‘á»ƒ an Táº£ PhĂ¹
  const posTaPhu = (thang - 1) % 12;

  // đŸ”¹ B2: Tá»« cung Táº£ PhĂ¹ â†’ thuáº­n ngĂ y sinh Ä‘á»ƒ an Tam Thai
  const idx = (posTaPhu + ((ngay - 1) % 12)) % 12;

  // đŸ”¹ Tráº£ vá» tĂªn cung
  return VONG_12[idx];
}







case "TheoNgay_BatToa": {
  // đŸŒ• BĂ¡t Tá»a: Khá»Ÿi tá»« Tuáº¥t, nghá»‹ch thĂ¡ng sinh an Há»¯u Báº­t â†’ nghá»‹ch ngĂ y sinh an BĂ¡t Tá»a
  const VONG_12 = ["Tuáº¥t","Há»£i","TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u"];

  // đŸ”¹ Láº¥y thĂ¡ng & ngĂ y Ă¢m
  const thang = parseInt(data?.lunar?.[1] || data?.thangAm || 1);
  const ngay  = parseInt(data?.lunar?.[0] || data?.ngayAm || 1);

  if (isNaN(thang) || isNaN(ngay)) return "Tuáº¥t"; // fallback an toĂ n

  // đŸ”¹ B1: Khá»Ÿi Tuáº¥t â†’ nghá»‹ch theo thĂ¡ng sinh â†’ an Há»¯u Báº­t
  const posHuuBat = (0 - (thang - 1) + 12) % 12;

  // đŸ”¹ B2: Tá»« Há»¯u Báº­t â†’ nghá»‹ch theo ngĂ y sinh â†’ an BĂ¡t Tá»a
  const idx = (posHuuBat - ((ngay - 1) % 12) + 12) % 12;

  // đŸ”¹ Tráº£ vá» káº¿t quáº£
  return VONG_12[idx];
}







case "TheoCanNamSinh": {
  let canIndex = getCanIndex(canNam); // GiĂ¡p=0 â†’ QuĂ½=9
  return sao.dsCung[canIndex];
}

case "TapTinh_DauQuan": {
  // đŸŒŸ VĂ²ng 12 cung cá»‘ Ä‘á»‹nh
  const VONG_12 = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const idx = cung => VONG_12.indexOf(cung);

  // đŸ§­ Láº¥y Ä‘á»‹a chi nÄƒm sinh (vĂ­ dá»¥ "áº¤t Tá»µ" â†’ "Tá»µ")
  const chiNam = (data.canChiNam || "").split(" ")[1] || "TĂ½";
  if (!VONG_12.includes(chiNam)) return "TĂ½";

  // đŸª¶ Cung ThĂ¡i Tuáº¿ Ä‘áº·t táº¡i Ä‘á»‹a chi nÄƒm sinh
  const posThaiTue = idx(chiNam);

  // đŸˆ·ï¸ XĂ¡c Ä‘á»‹nh thĂ¡ng Ă¢m (1â€“12)
  const thangAm = parseInt(data.lunar?.[1] || data.thangAm || 1);

  // đŸ”¹ ThĂ¡ng 1 báº¯t Ä‘áº§u táº¡i ThĂ¡i Tuáº¿ â†’ Ä‘áº¿m NGHá»CH Ä‘áº¿n thĂ¡ng sinh
  const cungThang = VONG_12[(posThaiTue - (thangAm - 1) + 12 * 10) % 12];
  const posThang = idx(cungThang);

  // đŸ•’ Láº¥y Ä‘á»‹a chi giá» sinh
  const gioChi = (data.canChiGio || "").split(" ")[1] || "TĂ½";
  const posGio = GIO_CHI.indexOf(gioChi);
  if (posGio === -1) return cungThang;

  // đŸ€ Tá»« cung thĂ¡ng, Ä‘áº¿m THUáº¬N theo giá» sinh Ä‘á»ƒ Ä‘Æ°á»£c cung Äáº©u QuĂ¢n
  const cungDauQuan = VONG_12[(posThang + posGio) % 12];

  return cungDauQuan;
}


case "TapTinh_ThienKhong": {
  // Sau ThĂ¡i Tuáº¿ 1 cung, cĂ¹ng Thiáº¿u DÆ°Æ¡ng
  const chiNam = (data.canChiNam || "").split(" ")[1] || "Dáº§n";
  const chiList = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const idx = chiList.indexOf(chiNam);
  return chiList[(idx + 1) % 12]; // sau 1 cung
}

case "TapTinh_ThienTai": {
  // đŸŒŸ XĂ¡c Ä‘á»‹nh cung Má»‡nh theo thĂ¡ng & giá» sinh
  const thang = parseInt(data.thangAm || data.thangSinh || 1);
  const gioChi = (data.gioAm || data.gioSinhChi || "TĂ½").trim();
  const chiNam = (data.canChiNam || "").split(" ")[1] || "TĂ½";

  const VONG_CUNG = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI  = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const CHI_NAM  = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  // --- B1: Cung khá»Ÿi thĂ¡ng
  const posDan = VONG_CUNG.indexOf("Dáº§n");
  const posThang = (posDan + (thang - 1)) % 12; // Dáº§n lĂ  thĂ¡ng 1 â†’ thuáº­n
  const cungGioTy = VONG_CUNG[posThang]; // Cung giá» TĂ½

  // --- B2: Äáº¿m NGHá»CH tá»« cung giá» TĂ½ Ä‘áº¿n giá» sinh
  const gioIndex = GIO_CHI.indexOf(gioChi);
  const posGioTy = VONG_CUNG.indexOf(cungGioTy);
  const posMenh = (posGioTy - gioIndex + 12) % 12;
  const cungMenh = VONG_CUNG[posMenh]; // âœ… Cung Má»‡nh thá»±c táº¿

  // --- B3: Tá»« Má»‡nh (nÄƒm TĂ½) Ä‘áº¿m THUáº¬N Ä‘áº¿n chi nÄƒm sinh
  const posTyNam = CHI_NAM.indexOf("TĂ½");
  const posChiNam = CHI_NAM.indexOf(chiNam);
  const steps = (posChiNam - posTyNam + 12) % 12;
  const posThienTai = (posMenh + steps) % 12;
  return VONG_CUNG[posThienTai];
}





case "TapTinh_ThienTho": {
  // đŸŒŸ ThiĂªn Thá»: Tá»± tĂ­nh khĂ©p kĂ­n, khĂ´ng gá»i biáº¿n ngoĂ i
  // Quy táº¯c: Dáº§n khá»Ÿi thĂ¡ng 1 â†’ thuáº­n Ä‘áº¿n thĂ¡ng sinh (cung Giá» TĂ½)
  // â†’ thuáº­n Ä‘áº¿n giá» sinh (Cung An ThĂ¢n) â†’ thuáº­n Ä‘áº¿n chi nÄƒm sinh (Cung ThiĂªn Thá»)
  
  const chiNam = (data.canChiNam || "").split(" ")[1] || "TĂ½";
  const thang = parseInt(data.thangAm || data.thangSinh || 1);
  const gioChi = (data.gioAm || data.gioSinhChi || "TĂ½").trim();

  // VĂ²ng 12 cung tá»­ vi
  const VONG_12 = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const GIO_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const CHI_NAM = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  // 1ï¸âƒ£ Tá»« Dáº§n â†’ Ä‘áº¿m thuáº­n theo thĂ¡ng sinh (cung Giá» TĂ½)
  const posThang = (VONG_12.indexOf("Dáº§n") + (thang - 1)) % 12;
  const cungGioTy = VONG_12[posThang];

  // 2ï¸âƒ£ Tá»« cung Giá» TĂ½ â†’ Ä‘áº¿m thuáº­n theo giá» sinh â†’ Cung An ThĂ¢n
  const gioIndex = GIO_CHI.indexOf(gioChi);
  const posGioTy = VONG_12.indexOf(cungGioTy);
  const posAnThan = (posGioTy + gioIndex) % 12;
  const cungAnThan = VONG_12[posAnThan];

  // 3ï¸âƒ£ Äáº·t TĂ½ táº¡i Cung An ThĂ¢n â†’ Ä‘áº¿m thuáº­n Ä‘áº¿n chi nÄƒm sinh
  const step = (CHI_NAM.indexOf(chiNam) - CHI_NAM.indexOf("TĂ½") + 12) % 12;
  const posThienTho = (posAnThan + step) % 12;

  return VONG_12[posThienTho];
}







case "TapTinh_CuDinh": {
  // â­ CĂ´ng thá»©c Ä‘áº·c biá»‡t cho ThiĂªn ThÆ°Æ¡ng & ThiĂªn Sá»© (Ä‘áº£o chiá»u ngÆ°á»£c)
  if (sao.ten === "ThiĂªn ThÆ°Æ¡ng" || sao.ten === "ThiĂªn Sá»©") {
    const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const GIO_CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

    const thangAm = parseInt(data.lunar[1]);
    const gioChi = data.canChiGio?.split(" ")[1];
    if (!gioChi) return "TĂ½";

    const idxThang = (thangAm - 1) % 12;
    const idxGio = GIO_CHI.indexOf(gioChi);
    if (idxGio === -1) return "TĂ½";

    // đŸ”¹ XĂ¡c Ä‘á»‹nh vá»‹ trĂ­ cung Má»‡nh (vĂ²ng NGÆ¯á»¢C)
    const idxMenh = (idxThang - idxGio + 12) % 12;

    // đŸ”¹ NGÆ¯á»¢C CHIá»€U: trá»« thay vĂ¬ cá»™ng
    const idxTatAch = (idxMenh - 5 + 12) % 12; // Táº­t Ăch
    const idxNoBoc  = (idxMenh - 7 + 12) % 12; // NĂ´ Bá»™c

    const cungTatAch = CUNG_THUAN[idxTatAch];
    const cungNoBoc  = CUNG_THUAN[idxNoBoc];

    if (sao.ten === "ThiĂªn ThÆ°Æ¡ng") {
      console.log(`âœ… ${sao.ten} an táº¡i ${cungNoBoc} (NĂ´ Bá»™c)`);
      return cungNoBoc;
    }
    if (sao.ten === "ThiĂªn Sá»©") {
      console.log(`âœ… ${sao.ten} an táº¡i ${cungTatAch} (Táº­t Ăch)`);
      return cungTatAch;
    }
  }

  // â­ CĂ¡c sao Táº¡p tinh khĂ¡c â€“ dĂ¹ng cĂ¡ch dĂ² chá»©c cÅ©
  const chuc = sao.cuDinh;
  let map = data.cungChucMap;

  if (!map || Object.keys(map).length === 0) {
    map = window.dataGlobal?.cungChucMap || {};
  }

  if (!map || Object.keys(map).length === 0) {
    console.warn("â ï¸ cungChucMap chÆ°a sáºµn sĂ ng khi an Táº¡p tinh:", sao.ten);
    return "TĂ½";
  }

  const found = Object.entries(map).find(([chi, tenChuc]) => tenChuc === chuc);
  if (found) return found[0];

  console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y cung chá»©c cho sao Táº¡p tinh cá»‘ Ä‘á»‹nh:", sao.ten, chuc);
  return "TĂ½";
}

case "codinh": {
  // â­ ThiĂªn La / Äá»‹a VĂµng â€“ an cá»‘ Ä‘á»‹nh theo Ä‘á»‹a chi
  const chi = sao.dsCung ? sao.dsCung[0] : (sao.cuDinh || "TĂ½");
  console.log(`âœ… ${sao.ten} an cá»‘ Ä‘á»‹nh táº¡i ${chi}`);
  return chi;
}




 default:
      return "Má»‡nh";
  }
}

const MAU_NGU_HANH = {
  "Há»a": "#ff4d4d",   // đŸ”¥ Ä‘á» tÆ°Æ¡i sĂ¡ng â€“ rĂµ hÆ¡n, khĂ´ng chĂ³i
  "Thá»•": "#e69500",   // đŸŸ  cam Ä‘áº¥t Ä‘áº­m â€“ rĂµ chá»¯ hÆ¡n
  "Má»™c": "#007a29",   // đŸŒ¿ xanh lĂ¡ Ä‘áº­m hÆ¡n chĂºt â€“ dá»… Ä‘á»c
  "Kim": "#000000",   // â« Ä‘en thuáº§n â€“ giá»¯ nguyĂªn
  "Thá»§y": "#004cff"   // đŸ’§ xanh dÆ°Æ¡ng Ä‘áº­m sĂ¡ng â€“ giá»¯ nguyĂªn
};


function anTieuTinh(retryCount = 0) {
  const data = window.dataGlobal;

  // đŸ›‘ Giá»›i háº¡n tá»‘i Ä‘a 5 láº§n chá»
  if (retryCount > 5) {
    console.warn("âŒ Dá»«ng an Tiá»ƒu Tinh sau 5 láº§n, dá»¯ liá»‡u chÆ°a sáºµn sĂ ng.");
    return;
  }

  // đŸ•“ 1ï¸âƒ£ Kiá»ƒm tra window.dataGlobal
  if (!data || typeof data !== "object") {
    console.warn("â ï¸ ChÆ°a cĂ³ window.dataGlobal, chá» láº§n", retryCount + 1);
    return setTimeout(() => anTieuTinh(retryCount + 1), 300);
  }

  // đŸ•“ 2ï¸âƒ£ KhĂ´i phá»¥c ngĂ y, thĂ¡ng, giá» Ă¢m náº¿u thiáº¿u
  if ((!data.ngayAm || !data.thangAm) && Array.isArray(data.lunar) && data.lunar.length >= 2) {
    const [ngay, thang] = data.lunar;
    if (!data.ngayAm) data.ngayAm = ngay;
    if (!data.thangAm) data.thangAm = thang;
    console.log("đŸŒ™ KhĂ´i phá»¥c ngĂ y/thĂ¡ng Ă¢m tá»« data.lunar:", { ngay, thang });
  }

  // đŸ”¹ Tá»± tĂ¡ch â€œChi giá»â€ náº¿u cĂ³ canChiGio mĂ  chÆ°a cĂ³ gioAm
  if (!data.gioAm && data.canChiGio) {
    data.gioAm = data.canChiGio.split(" ")[1]; // vĂ­ dá»¥: "GiĂ¡p TĂ½" â†’ "TĂ½"
    console.log("đŸ• KhĂ´i phá»¥c giá» Ă¢m tá»« canChiGio:", data.gioAm);
  }

  // đŸ”¹ Náº¿u sau khĂ´i phá»¥c mĂ  váº«n thiáº¿u thĂ¬ chá» thĂªm
  if (!data.gioAm || !data.ngayAm) {
    console.warn("â ï¸ Thiáº¿u giá» hoáº·c ngĂ y Ă¢m, chá» láº§n", retryCount + 1);
    console.log("đŸ§¾ Data hiá»‡n cĂ³:", data);
    return setTimeout(() => anTieuTinh(retryCount + 1), 300);
  }

  // đŸŒ¿ 4ï¸âƒ£ Khi Ä‘Ă£ Ä‘á»§ Ä‘iá»u kiá»‡n, tiáº¿n hĂ nh an sao tháº­t
  console.log("đŸŒ¿ Báº¯t Ä‘áº§u an Tiá»ƒu Tinh (Ä‘á»§ dá»¯ liá»‡u):", {
    gioAm: data.gioAm,
    ngayAm: data.ngayAm,
    thangAm: data.thangAm
  });

  // đŸ§¹ XĂ³a sao cÅ©
  document.querySelectorAll(".tieutinh").forEach(el => el.remove());

  // đŸª¶ Thá»±c hiá»‡n an sao
  TIEUTINH_DATA.forEach(sao => {
    const cung = tinhCungTieuTinh(sao, data);
    const cell = document.getElementById("cell" + (CUNG_MAP[cung] || ""));
    if (!cell) return;

    const layer6 = cell.querySelector(".layer-6.trungtinh") || cell.querySelector(".layer-6");
    if (!layer6) return;

    // Táº¡o cá»™t CĂ¡t / Hung náº¿u chÆ°a cĂ³
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

    // Táº¡o sao tiá»ƒu tinh
    const target = sao.loai === "CĂ¡t" ? catCol : hungCol;
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

  console.log("âœ… Tiá»ƒu Tinh Ä‘Ă£ Ä‘Æ°á»£c an xong!");
}

function toggleTieuTinh(group) {
  const key = group.trim().toLowerCase();
  const allSao = document.querySelectorAll(".tieutinh");
  const allButtons = document.querySelectorAll(".nut-tieutinh");

  // đŸ§­ 1ï¸âƒ£ Náº¿u lĂ  nĂºt "Táº¥t Cáº£"
  if (key === "táº¥t cáº£") {
    const btnAll = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === "táº¥t cáº£");
    const turningOn = !btnAll.classList.contains("active");

    // Báº­t/táº¯t táº¥t cáº£ nĂºt phá»¥ theo tráº¡ng thĂ¡i nĂºt All
    allButtons.forEach(btn => {
      if (turningOn) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  } else {
    // đŸ§­ 2ï¸âƒ£ Toggle riĂªng nĂºt Ä‘ang báº¥m
    const currentButton = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === key);
    if (currentButton) currentButton.classList.toggle("active");

    // đŸ§­ 3ï¸âƒ£ Cáº­p nháº­t láº¡i nĂºt "Táº¥t Cáº£" cho Ä‘Ăºng
    const btnAll = [...allButtons].find(b => (b.dataset.group || "").trim().toLowerCase() === "táº¥t cáº£");
    const otherButtons = [...allButtons].filter(b => b !== btnAll);
    const allOn = otherButtons.every(b => b.classList.contains("active"));
    const noneOn = otherButtons.every(b => !b.classList.contains("active"));
    if (allOn) btnAll.classList.add("active");
    else if (noneOn) btnAll.classList.remove("active");
    else btnAll.classList.remove("active"); // Khi cĂ³ pha trá»™n
  }

  // đŸ§­ 4ï¸âƒ£ Láº¥y danh sĂ¡ch nhĂ³m Ä‘ang báº­t
  const activeGroups = [...allButtons]
    .filter(btn => btn.classList.contains("active"))
    .map(btn => (btn.dataset.group || "").trim().toLowerCase());

  // đŸ§­ 5ï¸âƒ£ Duyá»‡t tá»«ng sao Ä‘á»ƒ quyáº¿t Ä‘á»‹nh hiá»ƒn thá»‹
  allSao.forEach(sao => {
    const raw = sao.dataset.groups || "";
    const groups = raw.split(",").map(g => g.trim().toLowerCase()).filter(Boolean);

    // â­ Náº¿u sao cĂ³ ĂT NHáº¤T 1 nhĂ³m cĂ²n báº­t â†’ hiá»‡n
    const shouldShow = groups.some(g => activeGroups.includes(g));

    if (shouldShow) {
      sao.classList.remove("hidden");
      sao.style.display = ""; // đŸ”¥ Ä‘áº£m báº£o hiá»‡n láº¡i
    } else {
      sao.classList.add("hidden");
      sao.style.display = "none"; // đŸ”¥ Ä‘áº£m báº£o áº©n háº³n
    }
  });
}



// đŸŒŸ Táº O NĂT áº¨N / HIá»†N TIá»‚U TINH
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
  title.textContent = "áº¨n / Hiá»‡n Tiá»ƒu Tinh";
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
    { label: "Táº¥t cáº£", group: "Táº¥t Cáº£" },
    { label: "TĂ¬nh duyĂªn", group: "TĂ¬nh DuyĂªn" },
    { label: "Tiá»n báº¡c", group: "Tiá»n Báº¡c" },
    { label: "CĂ´ng danh", group: "CĂ´ng Danh" },
    { label: "Sá»©c khá»e", group: "Sá»©c Khá»e" },
  ];

  buttons.forEach(btn => {
    const b = document.createElement("button");
    b.textContent = btn.label;
    b.dataset.group = btn.group;
b.className = "nut-tieutinh"; // âŒ bá» active máº·c Ä‘á»‹nh
    b.addEventListener("click", (e) => toggleTieuTinh(e.target.dataset.group));
    btnRow.appendChild(b);
  });

  box.appendChild(title);
  box.appendChild(btnRow);
  center.appendChild(box);
}

// =====================================================
// đŸŒ™ Cáº¬P NHáº¬T Háº N & TĂNH TUá»”I (THEO Ă‚M Lá»CH CHUáº¨N Tá»¬ VI)
// -----------------------------------------------------
function capNhatHan() {
  if (!window.dataGlobal || !window.dataGlobal.lunar) return;

  const namXem = parseInt(document.getElementById("luuNam")?.value || 0);
  const thangXem = parseInt(document.getElementById("luuThang")?.value || 0);
  const ngayXem = parseInt(document.getElementById("luuNgay")?.value || 0);
  const [ngaySinh, thangSinh, namSinh] = window.dataGlobal.lunar;

  // đŸ§® TĂ­nh tuá»•i Ă¢m (Ă¢m lá»‹ch)
let tuoiAm = 1;

if (namXem > namSinh) {
  // BÆ°á»›c 1: cá»™ng theo nÄƒm
  tuoiAm = (namXem - namSinh) + 1;

  // BÆ°á»›c 2: náº¿u cĂ³ chá»n thĂ¡ng
  if (thangXem) {
    if (thangXem > thangSinh) {
      tuoiAm++; // thĂ¡ng xem > thĂ¡ng sinh â†’ thĂªm 1 tuá»•i
    } else if (thangXem === thangSinh) {
      // thĂ¡ng xem = thĂ¡ng sinh â†’ cá»™ng thĂªm 1 náº¿u ngĂ y xem >= ngĂ y sinh hoáº·c chÆ°a chá»n ngĂ y
      if (!ngayXem || ngayXem >= ngaySinh) {
        tuoiAm++;
      }
    }
  }
}

// Ä‘áº£m báº£o khĂ´ng nhá» hÆ¡n 1
if (tuoiAm < 1) tuoiAm = 1;


  // đŸŒ™ Thiáº¿t láº­p mĂºi giá» Viá»‡t Nam
  const tz = 7.0;

  // ===== TĂNH CAN CHI NÄ‚M =====
  const canChiNam = canChiYear(namXem || namSinh);
  const [canNam] = canChiNam.split(" ");

  // ===== TĂNH CAN CHI THĂNG (náº¿u cĂ³) =====
  let canChiThang = "";
  if (thangXem) {
    const canThang = CAN_THANG[canNam][(thangXem - 1 + 12) % 12];
    const chiThang = CHI[(thangXem + 1) % 12];
    canChiThang = `${canThang} ${chiThang}`;
  }

  // ===== TĂNH CAN CHI NGĂ€Y (náº¿u cĂ³) =====
  let canChiNgay = "";
  if (ngayXem && thangXem) {
// âœ… Kiá»ƒm tra náº¿u thĂ¡ng Ä‘Æ°á»£c chá»n lĂ  nhuáº­n (vĂ­ dá»¥ 6N)
const thangVal = document.getElementById("luuThang")?.value || "";
const isLeap = thangVal.endsWith("N") || window.dataGlobal?.isLeapMonth === true;

// đŸ‘‰ Chuyá»ƒn Ä‘á»•i Ă¢m â†’ dÆ°Æ¡ng cĂ³ xĂ©t thĂ¡ng nhuáº­n
const [dSolar, mSolar, ySolar] = convertLunarToSolar(ngayXem, parseInt(thangXem), namXem, isLeap ? 1 : 0, tz);
    canChiNgay = canChiDay(ySolar, mSolar, dSolar);
  }

  // ===== HIá»‚N THá» Káº¾T QUáº¢ =====
  const lbl = document.getElementById("tuoiAmLabel");
  if (lbl) {
    const parts = [];
    parts.push(`NÄƒm ${canChiNam}`);
    if (canChiThang) parts.push(`ThĂ¡ng ${canChiThang}`);
    if (canChiNgay) parts.push(`NgĂ y ${canChiNgay}`);

    lbl.innerHTML = `
      <span style="font-weight:600;">${parts.join(" â€“ ")}</span>
      <span style="color:#c00;font-weight:bold;"> â€“ Tuá»•i: ${tuoiAm}</span>
    `;
  }

  // đŸ” LÆ°u dá»¯ liá»‡u
  window.dataGlobal.luuHan = {
    namAm: namXem,
    thangAm: thangXem,
    ngayAm: ngayXem,
    canChiNam,
    canChiThang,
    canChiNgay,
    tuoiAm,
    chieuDaiVan:
      (window.dataGlobal.gender === "Nam" && window.dataGlobal.menh.includes("DÆ°Æ¡ng")) ||
      (window.dataGlobal.gender === "Ná»¯" && window.dataGlobal.menh.includes("Ă‚m"))
        ? "thuáº­n"
        : "nghá»‹ch",
    chieuTieuVan: "ngÆ°á»£c"
  };


// đŸŒ€ Gá»i láº¡i cĂ¡c lá»›p váº­n
setTimeout(() => {

  // 1ï¸âƒ£ An láº¡i táº¥t cáº£ sao LÆ°u
  if (typeof anLop9_LuuDaiVan === "function") anLop9_LuuDaiVan(window.dataGlobal);
  if (typeof anLop10_LuuTieuVan === "function") anLop10_LuuTieuVan(window.dataGlobal);
  if (typeof anLop10_5_LuuNguyetVan === "function") anLop10_5_LuuNguyetVan(window.dataGlobal);
  if (typeof anSaoLuu_NguyetVan === "function") anSaoLuu_NguyetVan(window.dataGlobal);
  if (typeof anLop11_LuuNhatVan === "function") anLop11_LuuNhatVan(window.dataGlobal);

  // đŸŸ¢ 2ï¸âƒ£ KHá»I Táº O Láº I Báº¢NG TICK & EVENT â€” Báº®T BUá»˜C!
  // â— Pháº£i gá»i initSaoLuuFull(), KHĂ”NG Ä‘Æ°á»£c gá»i dongBoAnHienSaoLuu()
  if (typeof initSaoLuuFull === "function") {
    console.log("đŸ” Re-init Tick Sao LÆ°u sau khi reset");
    initSaoLuuFull();
  }

}, 400);


// đŸŒ™ Gá»i sau khi Tiá»ƒu Váº­n Ä‘Ă£ an xong
setTimeout(() => {
  if (typeof anThangHan === "function") anThangHan(window.dataGlobal);
}, 600);

} // đŸ‘ˆ Káº¿t thĂºc hĂ m capNhatHan()





// =====================================================
// đŸŒ™đŸŒ™đŸŒ™  Lá»P 10.2 â€“ AN THĂNG Háº N (th.1 â†’ th.12)
// -----------------------------------------------------
// đŸ¯ Quy táº¯c chuáº©n Tá»­ Vi:
// NÄƒm háº¡n lĂ  cung khá»Ÿi Ä‘áº§u (thĂ¡ng 1)
// â†’ Äáº¿m NGÆ¯á»¢C theo sá»‘ thĂ¡ng sinh â†’ tá»›i cung Giá» TĂ½
// â†’ Tá»« Ä‘Ă³ Ä‘áº¿m THUáº¬N theo giá» sinh â†’ cung Th.1
// =====================================================
function anThangHan(data) {
  if (!data || !data.luuHan) return;
  const han = data.luuHan;
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  if (!chiNamHan) return;

  // đŸ§­ 12 cung thuáº­n Tá»­ Vi
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,"ThĂ¬n":5,"Dáº­u":6,
    "MĂ£o":7,"Tuáº¥t":8,"Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };

  // đŸ¨ Style hiá»ƒn thá»‹
  const THANGHAN_STYLE = {
    position: "absolute",   // âœ… THĂM DĂ’NG NĂ€Y â€” giĂºp top/right cĂ³ tĂ¡c dá»¥ng
    top: "25px",
    right: "10px",
    fontSize: "11px",
    color: "#3366cc",
    fontStyle: "italic",
    fontWeight: "500"
  };

  // đŸ§¹ XĂ³a cÅ©
  document.querySelectorAll(".layer-10-thang").forEach(e => e.remove());

  // đŸŒŸ B1: NÄƒm háº¡n â†’ cung khá»Ÿi Ä‘áº§u (coi lĂ  ThĂ¡ng 1 táº¡m thá»i)
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // đŸŒŸ B2: Láº¥y thĂ¡ng sinh (1â€“12) vĂ  giá» sinh (Chi)
  const thangSinh = data.thangAm || 1;
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "TĂ½";
  const CHI_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;

  // đŸŒ™ B3: Tá»« cung nÄƒm háº¡n (ThĂ¡ng 1) â†’ Ä‘áº¿m NGÆ¯á»¢C theo thĂ¡ng sinh â†’ dá»«ng táº¡i cung Giá» TĂ½
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) { // lĂ¹i Ä‘Ăºng sá»‘ thĂ¡ng sinh - 1
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // đŸŒ™ B4: Tá»« cung Giá» TĂ½ â†’ Ä‘áº¿m THUáº¬N theo Chi giá» sinh â†’ cung ThĂ¡ng 1 tháº­t
  let idxTh1 = (idxGioTy + idxChiGio) % 12;

  // đŸŒ™ B5: An 12 thĂ¡ng thuáº­n kim Ä‘á»“ng há»“
  for (let i = 0; i < 12; i++) {
    const idx = (idxTh1 + i) % 12;
    const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
    if (!cell) continue;

    const div = document.createElement("div");
    div.className = "layer-10-thang";
    div.textContent = `th.${i + 1}`;
    Object.assign(div.style, THANGHAN_STYLE);  // âœ… vá»‹ trĂ­ bĂ¢y giá» hoáº¡t Ä‘á»™ng chĂ­nh xĂ¡c
    cell.appendChild(div);
  }

  console.log(
    `đŸ—“ï¸ ThĂ¡ng háº¡n: NÄƒm háº¡n ${chiNamHan}, ThĂ¡ng sinh ${thangSinh}, Giá» sinh ${chiGioSinh} 
â†’ Giá» TĂ½ táº¡i ${CUNG_THUAN[idxGioTy]}, Th.1 táº¡i ${CUNG_THUAN[idxTh1]}`
  );
}

// =====================================================
// đŸŒ™ Táº O DROPDOWN & GIá»I Háº N NÄ‚M/THĂNG/NGĂ€Y Há»¢P LĂ (HIá»‚N THá» THĂNG NHUáº¬N)
// -----------------------------------------------------
function gioiHanNamHan() {
  const hanSection = document.getElementById("xemHanSection");
  if (!hanSection || !window.dataGlobal?.lunar) return;

  const [ngaySinh, thangSinh, namSinh] = window.dataGlobal.lunar;
  const namMax = new Date().getFullYear() + 120;
  const tz = 7.0;

  // đŸ§¹ XĂ³a input cÅ©
  ["luuNam","luuThang","luuNgay"].forEach(id => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });

  // đŸ§­ Dropdown NÄƒm
  const selNam = document.createElement("select");
  selNam.id = "luuNam";
  for (let y = namSinh; y <= namMax; y++) selNam.appendChild(new Option(y, y));
  selNam.value = (namSinh > 2025 ? namSinh : 2025);
  hanSection.querySelector("label[for='luuNam']").after(selNam);

  // đŸ§­ Dropdown ThĂ¡ng (cĂ³ thĂ¡ng nhuáº­n)
  const selThang = document.createElement("select");
  selThang.id = "luuThang";
  hanSection.querySelector("label[for='luuThang']").after(selThang);

  // đŸ§­ Dropdown NgĂ y
  const selNgay = document.createElement("select");
  selNgay.id = "luuNgay";
  hanSection.querySelector("label[for='luuNgay']").after(selNgay);

  // đŸ”¹ HĂ m dá»±ng láº¡i danh sĂ¡ch thĂ¡ng cá»§a nÄƒm chá»n (tá»± dĂ¹ng cĂ´ng thá»©c báº¡n Ä‘Ă£ cĂ³)
function rebuildThangDropdown(year) {
  selThang.innerHTML = "";
  selThang.appendChild(new Option("â€”", ""));

  // đŸŒ™ XĂ¡c Ä‘á»‹nh thĂ¡ng nhuáº­n cá»§a nÄƒm Ă¢m dá»±a theo cĂ´ng thá»©c báº¡n gá»­i
  const leap = getLeapMonthOfYear(year, tz); // náº¿u 0 => khĂ´ng cĂ³ nhuáº­n

  for (let m = 1; m <= 12; m++) {
    // ThĂ¡ng thÆ°á»ng
    selThang.appendChild(new Option(m, m));

    // Náº¿u trĂºng thĂ¡ng nhuáº­n thĂ¬ chĂ¨n thĂªm thĂ¡ng (nhuáº­n)
    if (m === leap) {
      const opt = new Option(`${m} (nhuáº­n)`, `${m}N`);
      opt.dataset.leap = "1";
      selThang.appendChild(opt);
    }
  }

  console.log(`đŸ“… NÄƒm ${year} cĂ³ thĂ¡ng nhuáº­n: ${leap > 0 ? leap : "KhĂ´ng cĂ³"}`);
}





  // đŸ”¹ HĂ m dá»±ng láº¡i ngĂ y (1â€“30)
  function rebuildNgayDropdown() {
    selNgay.innerHTML = "";
    selNgay.appendChild(new Option("â€”", ""));
    for (let d = 1; d <= 30; d++) selNgay.appendChild(new Option(d, d));
  }

  rebuildThangDropdown(parseInt(selNam.value));
  rebuildNgayDropdown();

  // đŸ” Giá»›i háº¡n há»£p lĂ½
  function updateLimits() {
    const year = parseInt(selNam.value);
    const monthVal = selThang.value;
    const month = parseInt(monthVal);
    const isLeap = monthVal.endsWith("N");

    // NÄƒm = nÄƒm sinh â†’ chá»‰ cho thĂ¡ng >= thĂ¡ng sinh
    for (const opt of selThang.options) {
      if (!opt.value || opt.value === "â€”") continue;
      const mVal = parseInt(opt.value);
      opt.disabled = (year === namSinh && mVal < thangSinh);
    }

    // NÄƒm & thĂ¡ng = sinh â†’ ngĂ y >= ngĂ y sinh
    for (const opt of selNgay.options) {
      if (!opt.value || opt.value === "â€”") continue;
      const dVal = parseInt(opt.value);
      opt.disabled = (year === namSinh && month === thangSinh && dVal < ngaySinh);
    }

    // đŸ” LÆ°u tráº¡ng thĂ¡i thĂ¡ng nhuáº­n Ä‘á»ƒ capNhatHan() tá»± xá»­ lĂ½ trong convertLunarToSolar
    window.dataGlobal.isLeapMonth = isLeap;

    // âœ… Gá»i láº¡i tĂ­nh toĂ¡n
    capNhatHan();
  }

  // đŸ”— Sá»± kiá»‡n thay Ä‘á»•i
  selNam.addEventListener("change", () => { rebuildThangDropdown(parseInt(selNam.value)); updateLimits(); });
  selThang.addEventListener("change", updateLimits);
  selNgay.addEventListener("change", updateLimits);

  // Khá»Ÿi táº¡o ban Ä‘áº§u
  updateLimits();
  capNhatHan();

  console.log(`âœ… Dropdown (cĂ³ thĂ¡ng nhuáº­n) hoáº¡t Ä‘á»™ng: ${namSinh}â€“${namMax}`);
}

// đŸŒŸ Theo dĂµi DOM
const observerHan = new MutationObserver(() => {
  const hanSection = document.getElementById("xemHanSection");
  if (hanSection && !hanSection.classList.contains("ready")) {
    hanSection.classList.add("ready");
    setTimeout(gioiHanNamHan, 300);
  }
});
observerHan.observe(document.body, { childList: true, subtree: true });














// =====================================================
// đŸŒŸ Lá»P 9 â€“ LÆ¯U Äáº I Váº¬N (phiĂªn báº£n chuáº©n â€“ láº¥y Má»†NH tháº­t)
// -----------------------------------------------------
function anLop9_LuuDaiVan(data) {
  const han = data.luuHan;
  if (!han || !data.cucSo) return;

  // đŸ§¹ XĂ³a toĂ n bá»™ Äáº¡i Váº­n cÅ© (dĂ¹ náº±m trong cell nĂ o)
  document.querySelectorAll("[id^='cell'] .layer-9, .layer-9").forEach(e => e.remove());

  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,
    "ThĂ¬n":5,"Dáº­u":6,"MĂ£o":7,"Tuáº¥t":8,
    "Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };

  // đŸ”¹ Láº¥y Ä‘Ăºng cung Má»†NH Ä‘Ă£ an tháº­t (khĂ´ng tĂ­nh láº¡i theo thĂ¡ng & giá»)
  const cungMenh = data.tenCungMenh || window.dataGlobal?.tenCungMenh;
  if (!cungMenh) {
    console.warn("â ï¸ ChÆ°a cĂ³ tĂªn Cung Má»‡nh Ä‘á»ƒ an Äáº¡i Váº­n.");
    return;
  }
  const idxMenh = CUNG_THUAN.indexOf(cungMenh);
  if (idxMenh === -1) {
    console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y chá»‰ sá»‘ cung Má»‡nh:", cungMenh);
    return;
  }

  // đŸ”¹ XĂ¡c Ä‘á»‹nh chiá»u Äáº¡i Váº­n theo Ă‚m DÆ°Æ¡ng Nam Ná»¯
  const chieuDaiVan =
    (data.gender === "Nam" && data.menh?.includes("DÆ°Æ¡ng")) ||
    (data.gender === "Ná»¯" && data.menh?.includes("Ă‚m"))
      ? "thuáº­n"
      : "nghá»‹ch";
  console.log(`đŸ“ Äáº¡i váº­n tĂ­nh theo cung Má»‡nh ${cungMenh} (${chieuDaiVan})`);

  // đŸ”¹ GiĂ¡ trá»‹ khá»Ÿi váº­n theo tá»«ng loáº¡i Cá»¥c
  const baseCuc = {
    "Thá»§y nhá»‹ cá»¥c": 2,
    "Má»™c tam cá»¥c": 3,
    "Kim tá»© cá»¥c": 4,
    "Thá»• ngÅ© cá»¥c": 5,
    "Há»a lá»¥c cá»¥c": 6
  }[data.cucSo];
  if (!baseCuc) return;

  // đŸ”¹ XĂ¡c Ä‘á»‹nh block váº­n theo tuá»•i Ă‚m
  const tuoi = han.tuoiAm;
  if (tuoi < baseCuc) return;
  const block = Math.floor((tuoi - baseCuc) / 10);

  // đŸ”¹ TĂ­nh vá»‹ trĂ­ Äáº¡i Váº­n theo chiá»u
  const idxDaiVan = (chieuDaiVan === "thuáº­n")
    ? (idxMenh + block) % 12
    : (idxMenh - block + 12) % 12;
  const cungDaiVan = CUNG_THUAN[idxDaiVan];
  han.viTriDaiVan = cungDaiVan;

  // đŸ”¹ TĂªn táº¯t 12 cung
  const CUNG_CHUC_VIETTAT = [
    "Má»†NH","HUYNH","PHU","Tá»¬",
    "TĂ€I","Táº¬T","DI","NĂ”",
    "QUAN","ÄIá»€N","PHĂC","PHá»¤"
  ];

  // đŸ”¹ Váº½ nhĂ£n Äáº I Váº¬N trĂªn tá»«ng cung
  for (let i = 0; i < 12; i++) {
    const idx = (idxDaiVan - i + 12) % 12; // NGHá»CH chiá»u kim Ä‘á»“ng há»“ (ÄV chuáº©n)
    const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idx]]);
    if (!cell) continue;

    const div = document.createElement("div");
    div.className = "layer-9";
    div.textContent = "ÄV. " + CUNG_CHUC_VIETTAT[i];
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

  console.log(`đŸ”¶ LÆ°u Äáº¡i Váº­n táº¡i ${cungDaiVan} (${tuoi} tuá»•i, ${data.cucSo})`);
}


// =====================================================
// đŸŒŸ Lá»P 10 â€“ LÆ¯U TIá»‚U Váº¬N
// -----------------------------------------------------
function anLop10_LuuTieuVan(data) {
  const han = data.luuHan;
  if (!han) return;

  // XĂ³a lá»›p cÅ©
  document.querySelectorAll(".layer-10").forEach(e => e.remove());

  const chiNam = (han.canChiNam || "").split(" ")[1];
  if (!chiNam) return;

  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,"ThĂ¬n":5,"Dáº­u":6,"MĂ£o":7,"Tuáº¥t":8,"Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12};
  const idxStart = CUNG_THUAN.indexOf(chiNam);
  if (idxStart === -1) return;

  const CUNG_CHUC_VIETTAT = ["Má»†NH","HUYNH","PHU","Tá»¬","TĂ€I","Táº¬T","DI","NĂ”","QUAN","ÄIá»€N","PHĂC","PHá»¤"];
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
  console.log(`đŸ”· LÆ°u Tiá»ƒu Váº­n báº¯t Ä‘áº§u táº¡i ${chiNam}`);
}
// =====================================================
// đŸŒ™ Lá»P 10.5 â€“ LÆ¯U NGUYá»†T Váº¬N (vĂ²ng Má»†NH NGÆ¯á»¢C CHIá»€U)
// -----------------------------------------------------
function anLop10_5_LuuNguyetVan(data) {
  if (!data?.luuHan) return;
  const han = data.luuHan;
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  if (!chiNamHan) return;

  // đŸ§¹ XĂ³a lá»›p cÅ© má»—i láº§n Ä‘á»•i háº¡n
  document.querySelectorAll(".layer-10-5").forEach(e => e.remove());

  // đŸ§­ 12 cung thuáº­n Tá»­ Vi
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,"ThĂ¬n":5,"Dáº­u":6,
    "MĂ£o":7,"Tuáº¥t":8,"Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };

  // đŸª¶ Láº¥y thĂ¡ng & giá» sinh tá»« dá»¯ liá»‡u gá»‘c
  const thangSinh = data.thangAm || 1;
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "TĂ½";

  // =====================================================
  // 1ï¸âƒ£  NÄ‚M Háº N lĂ  cung khá»Ÿi Ä‘áº§u (coi lĂ  thĂ¡ng 1 táº¡m)
  // =====================================================
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // =====================================================
  // 2ï¸âƒ£  Äáº¿m NGÆ¯á»¢C theo thĂ¡ng sinh Ä‘á»ƒ tĂ¬m cung Giá» TĂ½
  // =====================================================
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) {
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // =====================================================
  // 3ï¸âƒ£  Tá»« cung Giá» TĂ½ â†’ Ä‘áº¿m THUáº¬N theo Chi giá» sinh
  //      Ä‘á»ƒ ra cung Má»‡nh cá»§a ThĂ¡ng 1
  // =====================================================
  const CHI_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;

  const idxTh1 = (idxGioTy + idxChiGio) % 12;
  const cungMenhThang1 = CUNG_THUAN[idxTh1];

  console.log(
    `đŸ©µ LÆ°u Nguyá»‡t Váº­n: NÄƒm háº¡n ${chiNamHan}, ThĂ¡ng sinh ${thangSinh}, Giá» sinh ${chiGioSinh}
â†’ Giá» TĂ½ táº¡i ${CUNG_THUAN[idxGioTy]}, Th.1 táº¡i ${cungMenhThang1}`
  );

// =====================================================
// 4ï¸âƒ£  HIá»‚N THá» 12 THĂNG â€“ THUáº¬N KIM Äá»’NG Há»’
//      nhÆ°ng cung chá»©c cháº¡y NGÆ¯á»¢C (chuáº©n Tá»­ Vi)
// =====================================================
const CUNG_CHUC_VIETTAT = ["Má»†NH","HUYNH","PHU","Tá»¬","TĂ€I","Táº¬T","DI","NĂ”","QUAN","ÄIá»€N","PHĂC","PHá»¤"];

// đŸ—“ï¸ Láº¥y thĂ¡ng háº¡n hiá»‡n Ä‘ang chá»n (1â€“12)
const thangHienTai = parseInt(data?.luuHan?.thangAm || 1);
const dichThang = (thangHienTai - 1 + 12) % 12;  // sá»‘ bÆ°á»›c dá»‹ch tá»« thĂ¡ng 1

for (let i = 0; i < 12; i++) {
  // đŸŒ€ ThĂ¡ng cháº¡y THUáº¬N, báº¯t Ä‘áº§u tá»« cung Má»‡nh thĂ¡ng hiá»‡n táº¡i
  const idxThang = (idxTh1 + dichThang + i) % 12;

  const cell = document.getElementById("cell" + CUNG_TO_CELL[CUNG_THUAN[idxThang]]);
  if (!cell) continue;

  const div = document.createElement("div");
  div.className = "layer-10-5 luuNguyetVan";

  // đŸ” Cung chá»©c cháº¡y NGÆ¯á»¢C
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


  console.log(`đŸŒ™ Cung Má»‡nh ThĂ¡ng 1: ${cungMenhThang1}`);
}


// =====================================================
// â˜€ï¸ Lá»P 11 â€“ LÆ¯U NHáº¬T Váº¬N (chuáº©n: Nh. Má»‡nh = N. Má»‡nh lĂºc ngĂ y 1)
// -----------------------------------------------------
function anLop11_LuuNhatVan(data) {
  const han = data?.luuHan;
  if (!han) return;

  // Dá»¯ liá»‡u cáº§n: nÄƒm háº¡n (can chi), thĂ¡ng háº¡n (Ă¢m), ngĂ y háº¡n (Ă¢m), thĂ¡ng sinh (Ă¢m), chi giá» sinh
  const chiNamHan = (han.canChiNam || "").split(" ")[1];
  const thangHan = parseInt(han.thangAm || 1);
  const ngayHan  = parseInt(han.ngayAm  || 1);
  const thangSinh = parseInt(data.thangAm || 1);
  const chiGioSinh = (data.canChiGio || "").split(" ")[1] || "TĂ½";

  if (!chiNamHan || !chiGioSinh || !thangSinh) return;

  // đŸ§¹ XĂ³a lá»›p cÅ©
  document.querySelectorAll(".layer-11").forEach(e => e.remove());

  // Báº£ng chuáº©n
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const CUNG_TO_CELL = {
    "Tá»µ":1,"Ngá»":2,"MĂ¹i":3,"ThĂ¢n":4,"ThĂ¬n":5,"Dáº­u":6,
    "MĂ£o":7,"Tuáº¥t":8,"Dáº§n":9,"Sá»­u":10,"TĂ½":11,"Há»£i":12
  };
  const CHI_LIST = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  // 1) NÄƒm háº¡n â†’ coi lĂ  "thĂ¡ng 1 táº¡m" táº¡i chiNamHan
  const idxNamHan = CUNG_THUAN.indexOf(chiNamHan);
  if (idxNamHan < 0) return;

  // 2) Äáº¿m NGÆ¯á»¢C theo thĂ¡ng sinh Ä‘á»ƒ tá»›i cung Giá» TĂ½
  let idxGioTy = idxNamHan;
  for (let i = 1; i < thangSinh; i++) {
    idxGioTy = (idxGioTy - 1 + 12) % 12;
  }

  // 3) Tá»« cung Giá» TĂ½ â†’ Ä‘áº¿m THUáº¬N theo chi giá» sinh Ä‘á»ƒ ra Má»†NH thĂ¡ng 1
  const idxChiGio = CHI_LIST.indexOf(chiGioSinh);
  if (idxChiGio < 0) return;
  const idxTh1 = (idxGioTy + idxChiGio) % 12; // vá»‹ trĂ­ N. Má»‡nh cá»§a thĂ¡ng 1

  // 4) Má»†NH thĂ¡ng hiá»‡n táº¡i (Nguyá»‡t Má»‡nh) = Th1 dá»‹ch thuáº­n (thangHan-1)
  const idxNguyetMenh = (idxTh1 + ((thangHan - 1) % 12)) % 12;

  // âœ… 5) NHáº¬T Má»†NH: trĂ¹ng N. Má»‡nh á»Ÿ NGĂ€Y 1, sau Ä‘Ă³ cháº¡y THUáº¬N theo ngĂ y Ă¢m
  const idxNhatMenh = (idxNguyetMenh + ((ngayHan - 1) % 12)) % 12;

  // Váº½ 12 nhĂ£n Nh. Má»†NH â†’ Nh. PHá»¤ cháº¡y THUáº¬N tá»« Nh. Má»‡nh
  const CUNG_CHUC_VIETTAT = ["Má»†NH","HUYNH","PHU","Tá»¬","TĂ€I","Táº¬T","DI","NĂ”","QUAN","ÄIá»€N","PHĂC","PHá»¤"];
  for (let i = 0; i < 12; i++) {
  // đŸ” Äáº¿m NGÆ¯á»¢C tá»« Nh. Má»‡nh
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


  // (tuá»³ chá»n) lÆ°u láº¡i Ä‘á»ƒ dĂ¹ng nÆ¡i khĂ¡c
  han.viTriNguyetMenh = CUNG_THUAN[idxNguyetMenh];
  han.viTriNhatMenh   = CUNG_THUAN[idxNhatMenh];
  console.log(`â˜€ï¸ Nh. Má»‡nh ngĂ y ${ngayHan}: ${han.viTriNhatMenh} (N. Má»‡nh thĂ¡ng ${thangHan}: ${han.viTriNguyetMenh})`);
}












// =====================================================
// đŸŒ™ AN SAO LÆ¯U â€“ NGUYá»†T Váº¬N (theo Can Chi THĂNG Háº N)
// -----------------------------------------------------
function anSaoLuu_NguyetVan(data) {
  if (!data?.luuHan?.canChiThang) return;

  // đŸ§¹ XĂ³a sao LÆ°u Nguyá»‡t Váº­n cÅ© (prefix "N.")
  document.querySelectorAll(".sao-nguyet-van, .sao-luu-nguyet").forEach(e => e.remove());

  // đŸŒ™ DĂ¹ng Can Chi thĂ¡ng háº¡n Ä‘á»ƒ an sao
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiThang; // tĂ¡i sá»­ dá»¥ng hĂ m anToanBoSaoLuu()

  console.log(`đŸ©µ LÆ°u Nguyá»‡t Váº­n theo ${clone.canChiNam}`);
window.__dangAnNguyetVan = true;
anToanBoSaoLuu(clone, "N");
window.__dangAnNguyetVan = false;
}

// =====================================================
// â˜€ï¸ AN SAO LÆ¯U â€“ NHáº¬T Váº¬N (theo Can Chi NGĂ€Y Háº N)
// -----------------------------------------------------
function anSaoLuu_NhatVan(data) {
  if (!data?.luuHan?.canChiNgay) return;

  // đŸ§¹ XĂ³a sao LÆ°u Nháº­t Váº­n cÅ© (prefix "Nh.")
  document.querySelectorAll(".sao-luu.luu-nhat").forEach(e => e.remove());

  // â˜€ï¸ DĂ¹ng Can Chi NGĂ€Y Háº N Ä‘á»ƒ an sao
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiNgay; // tĂ¡i sá»­ dá»¥ng anToanBoSaoLuu()

  console.log(`â˜€ï¸ LÆ°u Nháº­t Váº­n theo ${clone.canChiNam}`);
  window.__dangAnNhatVan = true;
  anToanBoSaoLuu(clone, "Nh");
  window.__dangAnNhatVan = false;
}













// =====================================================
// đŸŒŸ Lá»P 10.3 â€“ SAO LÆ¯U (Äáº I Váº¬N & TIá»‚U Váº¬N) â€“ Báº¢N CHUáº¨N
// -----------------------------------------------------
// âœ… MĂ u sao theo NgÅ© hĂ nh gá»‘c
// âœ… TĂ¡ch riĂªng nhĂ³m KhĂ´i â€“ Viá»‡t
// âœ… Hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ ÄV. vĂ  L.
// =====================================================

// đŸ¨ MĂ u ngÅ© hĂ nh cá»‘ Ä‘á»‹nh
const MAU_NGUHANH = {
  "Há»a": "#ff4d4d",   // đŸ”¥ Ä‘á» tÆ°Æ¡i sĂ¡ng â€“ rĂµ, dá»… Ä‘á»c
  "Thá»•": "#e69500",   // đŸŸ  cam Ä‘áº¥t Ä‘áº­m â€“ rĂµ chá»¯
  "Má»™c": "#007a29",   // đŸŒ¿ xanh lĂ¡ Ä‘áº­m hÆ¡n má»™t chĂºt
  "Kim": "#000000",   // â« Ä‘en thuáº§n â€“ giá»¯ nguyĂªn
  "Thá»§y": "#004cff"   // đŸ’§ xanh dÆ°Æ¡ng Ä‘áº­m sĂ¡ng
};


// đŸ”¹ HĂ m dĂ² mĂ u ngÅ© hĂ nh tháº­t cá»§a sao (Æ°u tiĂªn sao gá»‘c)
function layMauNguHanhTheoSao(tenSao) {
  // 1. Tá»« saoNguHanhMap (náº¿u cĂ³)
  const map = window.dataGlobal?.saoNguHanhMap || {};
  if (map[tenSao]) return MAU_NGUHANH[map[tenSao]] || "#333";

  // 2. Náº¿u khĂ´ng cĂ³, dĂ² ngÆ°á»£c tá»« saoToCung (Ä‘Ă£ an sao gá»‘c)
  const saoNguHanh = window.dataGlobal?.saoNguHanh || {};
  if (saoNguHanh[tenSao]) return MAU_NGUHANH[saoNguHanh[tenSao]] || "#333";

  return "#333"; // fallback
}

// =====================================================
// đŸ§± Báº¢NG áº¨N/HIá»†N SAO LÆ¯U â€“ Báº¢N NHá» Gá»ŒN, Ná»€N BĂN TRONG SUá»T
// -----------------------------------------------------
// đŸ’  NhĂ³m má»›i: 
//  1ï¸âƒ£ Lá»™c / Ká»µ
//  2ï¸âƒ£ Khoa / Quyá»n
//  3ï¸âƒ£ KĂ¬nh / ÄĂ 
//  4ï¸âƒ£ Lá»™c / MĂ£
//  5ï¸âƒ£ KhĂ´i / Viá»‡t
//  6ï¸âƒ£ XÆ°Æ¡ng / KhĂºc
// =====================================================
function taoBangTickSaoLuu() {
  // xoĂ¡ báº£ng cÅ©
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
<b>áº¨n / Hiá»‡n Háº¡n</b><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="loc-ky" checked> Lá»™c / Ká»µ</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="khoa-quyen"> Khoa / Quyá»n</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="kinh-da" checked> KĂ¬nh / ÄĂ </label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="loc-ma"> Lá»™c / MĂ£</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="khoi-viet"> KhĂ´i / Viá»‡t</label><br>
<label><input type="checkbox" class="chk-nhom" data-nhom="xuong-khuc"> XÆ°Æ¡ng / KhĂºc</label>
`;

  // gáº¯n vĂ o lĂ¡ sá»‘
  const container = document.getElementById("lasoContainer");
  container.style.position = "relative";
container.appendChild(div);
}





// =====================================================
// đŸ” áº¨N / HIá»†N SAO LÆ¯U â€“ Äá»’NG Bá»˜ 4 Cáº¤P (ÄV, TV, NV, NhV)
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

  // XĂ“A LISTENER CÅ¨ CHUáº¨N â€” clone 1 láº§n
  Object.keys(btns).forEach(key => {
    const old = btns[key];
    const newBtn = old.cloneNode(true);
    old.parentNode.replaceChild(newBtn, old);
    btns[key] = newBtn; // Cáº¬P NHáº¬T biáº¿n tháº­t sá»±
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

  // gáº¯n láº¡i listener má»›i
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

  // đŸ” LÆ°u láº¡i hĂ m toĂ n cá»¥c Ä‘á»ƒ dĂ¹ng láº¡i khi cáº§n
  window.__capNhatHienThiSaoLuu = capNhatHienThi;
  console.log("âœ… Gáº¯n event sao LÆ°u (ÄV + TV + NV + NhV)");
}






// =====================================================
// đŸ§¹ XĂ“A SAO LÆ¯U CÅ¨
// =====================================================
function xoaSaoLuu() {
  document.querySelectorAll(".sao-luu").forEach(e => e.remove());
}



// =====================================================
// đŸª¶ THĂM SAO LÆ¯U â€“ Gáº®N CHUáº¨N CLASS Äá»‚ áº¨N/HIá»†N
// =====================================================
function themSaoLuu(cung, ten, nhom, loai, prefix) {
  if (!cung) return;
  const cell = document.querySelector(`#cell${CUNG_TO_CELL[cung]} .layer-6 .${loai}-tinh`);
  if (!cell) return;

  // đŸ”¹ Chuáº©n hĂ³a hĂ nh cá»§a sao
const tenGoc = ten.replace(/^(ÄV\.|L\.|N\.|Nh\.)\s*/i, "").trim();
  const hanhSao = {
    "Tá»­ Vi": "Thá»•", "ThiĂªn CÆ¡": "Má»™c", "ThĂ¡i DÆ°Æ¡ng": "Há»a", "VÅ© KhĂºc": "Kim",
    "ThiĂªn Äá»“ng": "Thá»§y", "LiĂªm Trinh": "Há»a", "ThiĂªn Phá»§": "Thá»•", "ThĂ¡i Ă‚m": "Thá»§y",
    "Tham Lang": "Má»™c", "Cá»± MĂ´n": "Thá»§y", "ThiĂªn TÆ°á»›ng": "Thá»§y", "ThiĂªn LÆ°Æ¡ng": "Má»™c",
    "Tháº¥t SĂ¡t": "Kim", "PhĂ¡ QuĂ¢n": "Thá»§y", "ThiĂªn KhĂ´i": "Há»a", "ThiĂªn Viá»‡t": "Há»a",
    "Lá»™c Tá»“n": "Thá»•", "ThiĂªn MĂ£": "Há»a", "HĂ³a Lá»™c": "Má»™c", "HĂ³a Quyá»n": "Má»™c",
    "HĂ³a Khoa": "Má»™c", "HĂ³a Ká»µ": "Kim", "KĂ¬nh DÆ°Æ¡ng": "Kim", "ÄĂ  La": "Kim",
    "VÄƒn XÆ°Æ¡ng": "Kim", "VÄƒn KhĂºc": "Thá»§y", "Linh Tinh": "Há»a", "Há»a Tinh": "Há»a",
    "Äá»‹a KhĂ´ng": "Há»a", "Äá»‹a Kiáº¿p": "Há»a", "Táº£ PhĂ¹": "Thá»•"
  };
  const hanh = hanhSao[tenGoc] || "";
  const colorMap = {
    "Há»a": "#c72d2d", "Thá»•": "#d99000", "Má»™c": "#006400",
    "Kim": "#000000", "Thá»§y": "#003399"
  };
  const color = colorMap[hanh] || "#333";

  // đŸŒŸ Táº¡o pháº§n tá»­ sao
  const div = document.createElement("div");
  div.textContent = `${prefix}. ${ten}`;
let loaiVan = "luu-tieu";
if (prefix === "ÄV") loaiVan = "luu-dai";
else if (prefix === "N") loaiVan = "luu-nguyet";
else if (prefix === "Nh") loaiVan = "luu-nhat"; // âœ… thĂªm dĂ²ng nĂ y


div.className = `sao-luu ${loaiVan} nhom-${nhom} ${loai}-tinh`;
div.dataset.nhom = nhom; // đŸ”¹ GĂ¡n nhĂ³m Ä‘á»ƒ tick báº£ng nháº­n diá»‡n

  // đŸª¶ Style sao
  div.style.fontSize = "11px";
  div.style.margin = "1px 0";
  div.style.fontStyle = "italic";
  div.style.fontWeight = "700";
  div.style.color = color;
  div.style.filter = "brightness(1.1)";

  cell.appendChild(div);
}


// =====================================================
// đŸŒ AN SAO LÆ¯U â€“ Äáº I Váº¬N (theo Can Chi nÄƒm sinh chuáº©n tá»«ng cung)
// -----------------------------------------------------
function anSaoLuu_DaiVan(data) {
  if (!data || !data.luuHan?.viTriDaiVan) return;

  // đŸ§© Náº¿u Ä‘ang váº½ lá»›p Äáº¡i Váº­n (Lá»›p 9) thĂ¬ bá» qua Ä‘á»ƒ trĂ¡nh x2
  if (window.__dangVeLop9_DaiVan) return;

  // đŸ§­ Láº¥y cung hiá»‡n táº¡i cá»§a Äáº¡i Váº­n
  const cungDai = data.luuHan.viTriDaiVan;

  // đŸª¶ TĂ­nh láº¡i Can Chi cá»§a cung Äáº¡i Váº­n theo nÄƒm sinh gá»‘c
  const canChiDaiVan = (function layCanChiCuaCung(canChiNamSinh, tenCung) {
    const CAN_THANG = {
      "GiĂ¡p":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
      "áº¤t":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
      "BĂ­nh":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
      "Äinh":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
      "Máº­u":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"],
      "Ká»·":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
      "Canh":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
      "TĂ¢n":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
      "NhĂ¢m":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
      "QuĂ½":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"]
    };

    const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const canNam = canChiNamSinh.split(" ")[0];
    const chiIndex = CUNG_THUAN.indexOf(tenCung);
    if (chiIndex === -1) return "";
    const list = CAN_THANG[canNam] || CAN_THANG["GiĂ¡p"];
    const can = list[chiIndex];
    const chi = CUNG_THUAN[chiIndex];
    return `${can} ${chi}`;
  })(data.canChiNam, cungDai);

  if (!canChiDaiVan) {
    console.warn("â ï¸ KhĂ´ng xĂ¡c Ä‘á»‹nh Ä‘Æ°á»£c Can Chi cá»§a Äáº¡i Váº­n:", cungDai);
    return;
  }

  // đŸ§­ Ghi nhá»› Can Chi nÄƒm Äáº¡i Váº­n
  window.dataGlobal.canChiDaiVan = canChiDaiVan;
// đŸ¯ Hiá»ƒn thá»‹ lĂªn khung Xem Háº¡n (Ă‚m Lá»‹ch)
if (data.luuHan?.tuoiDaiVanBatDau && data.luuHan?.tuoiDaiVanKetThuc) {
  hienThiThongTinDaiVan(
    canChiDaiVan,
    data.luuHan.tuoiDaiVanBatDau,
    data.luuHan.tuoiDaiVanKetThuc
  );
} else {
  // đŸ” náº¿u chÆ°a cĂ³, táº¡m tĂ­nh theo thá»© tá»± Äáº¡i Váº­n (má»—i cung = 10 nÄƒm)
  const indexDV = data.luuHan?.soThuTuDaiVan || 0;
  const tuoiBatDau = 5 + indexDV * 10;
  const tuoiKetThuc = tuoiBatDau + 9;
  hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc);
}


  // đŸ” Gá»i an sao lÆ°u theo Can Chi Äáº¡i Váº­n nĂ y (náº¿u chÆ°a bá»‹ khoĂ¡ bá»Ÿi lá»›p 9)
  const clone = structuredClone(data);
  clone.canChiNam = canChiDaiVan;

  console.log(`đŸŒ LÆ°u Äáº¡i Váº­n theo ${canChiDaiVan} (${cungDai})`);

  // đŸª Tiáº¿n hĂ nh an sao lÆ°u (vá»›i prefix â€œÄV.â€)
  window.__dangVeLop9_DaiVan = true;
  anToanBoSaoLuu(clone, "ÄV");
  setTimeout(() => (window.__dangVeLop9_DaiVan = false), 300);

// đŸ–¼ï¸ Hiá»ƒn thá»‹ lĂªn khung Xem Háº¡n (Ă‚m Lá»‹ch)
if (data.luuHan?.tuoiAm && data.cucSo && data.luuHan?.viTriDaiVan) {
  const baseCuc = {
    "Thá»§y nhá»‹ cá»¥c": 2,
    "Má»™c tam cá»¥c": 3,
    "Kim tá»© cá»¥c": 4,
    "Thá»• ngÅ© cá»¥c": 5,
    "Há»a lá»¥c cá»¥c": 6
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
// đŸŒ™ AN SAO LÆ¯U â€“ TIá»‚U Váº¬N
// =====================================================
function anSaoLuu_TieuVan(data) {
  if (!data?.luuHan?.canChiNam) return;
  const clone = structuredClone(data);
  clone.canChiNam = data.luuHan.canChiNam;
window.dataGlobal.canChiHan = data.luuHan.canChiNam; // đŸ§­ Ghi nhá»› Can Chi nÄƒm Háº¡n

  console.log(`đŸŒ™ LÆ°u Tiá»ƒu Váº­n theo ${clone.canChiNam}`);
  anToanBoSaoLuu(clone, "L");
}

// =====================================================
// â¡ AN TOĂ€N Bá»˜ SAO LÆ¯U â€“ PHIĂN Báº¢N 6 NHĂ“M Gá»ŒN
// -----------------------------------------------------
// NhĂ³m dĂ¹ng cho báº£ng tick:
//  loc-ky, khoa-quyen, kinh-da, loc-ma, khoi-viet, xuong-khuc
// =====================================================
function anToanBoSaoLuu(data, prefix) {


  const CAN = ["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"];
  const CHI = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];

  let canNam="", chiNam="";
  for (const c of CAN) if (data.canChiNam?.includes(c)) canNam=c;
  for (const ch of CHI) if (data.canChiNam?.includes(ch)) chiNam=ch;
  if (!canNam || !chiNam) return;

  const LOC_TON_MAP = {
    "GiĂ¡p":"Dáº§n","áº¤t":"MĂ£o","BĂ­nh":"Tá»µ","Äinh":"Ngá»","Máº­u":"Tá»µ","Ká»·":"Ngá»",
    "Canh":"ThĂ¢n","TĂ¢n":"Dáº­u","NhĂ¢m":"Há»£i","QuĂ½":"TĂ½"
  };
  const THIEN_MA_MAP = {
    "Há»£i":"Tá»µ","MĂ£o":"Tá»µ","MĂ¹i":"Tá»µ","Tá»µ":"Há»£i","Dáº­u":"Há»£i","Sá»­u":"Há»£i",
    "Dáº§n":"ThĂ¢n","Ngá»":"ThĂ¢n","Tuáº¥t":"ThĂ¢n","ThĂ¢n":"Dáº§n","TĂ½":"Dáº§n","ThĂ¬n":"Dáº§n"
  };

  // đŸ’  Lá»™c / MĂ£
  themSaoLuu(LOC_TON_MAP[canNam], "Lá»™c Tá»“n", "loc-ma", "cat", prefix);
  themSaoLuu(THIEN_MA_MAP[chiNam], "ThiĂªn MĂ£", "loc-ma", "cat", prefix);

  // â¡ KĂ¬nh / ÄĂ 
  const viTriA = LOC_TON_MAP[canNam];
  const iA = CUNG_THUAN.indexOf(viTriA);
  if (iA >= 0) {
    themSaoLuu(CUNG_THUAN[(iA + 1) % 12], "KĂ¬nh DÆ°Æ¡ng", "kinh-da", "hung", prefix);
    themSaoLuu(CUNG_THUAN[(iA - 1 + 12) % 12], "ÄĂ  La", "kinh-da", "hung", prefix);
  }

  // đŸŒ¿ KhĂ´i / Viá»‡t
  const KV = {
    "GiĂ¡p":["Sá»­u","MĂ¹i"],"Máº­u":["Sá»­u","MĂ¹i"],"áº¤t":["TĂ½","ThĂ¢n"],"Ká»·":["TĂ½","ThĂ¢n"],
    "Canh":["Dáº§n","Ngá»"],"TĂ¢n":["Dáº§n","Ngá»"],"BĂ­nh":["Há»£i","Dáº­u"],"Äinh":["Há»£i","Dáº­u"],
    "NhĂ¢m":["MĂ£o","Tá»µ"],"QuĂ½":["MĂ£o","Tá»µ"]
  };
  const cap = KV[canNam];
  if (cap) {
    themSaoLuu(cap[0], "ThiĂªn KhĂ´i", "khoi-viet", "cat", prefix);
    themSaoLuu(cap[1], "ThiĂªn Viá»‡t", "khoi-viet", "cat", prefix);
  }

  // ===========================================================
// đŸª¶ VÄ‚N XÆ¯Æ NG / VÄ‚N KHĂC â€“ theo CAN nÄƒm (theo báº£ng lÆ°u niĂªn báº¡n gá»­i)
// ===========================================================
const LUU_XUONG = {
  "GiĂ¡p": "Tá»µ", "áº¤t": "Ngá»", "BĂ­nh": "ThĂ¢n", "Äinh": "Dáº­u",
  "Máº­u": "ThĂ¢n", "Ká»·": "Dáº­u", "Canh": "Há»£i", "TĂ¢n": "TĂ½",
  "NhĂ¢m": "Dáº§n", "QuĂ½": "MĂ£o"
};
const LUU_KHUC = {
  "GiĂ¡p": "Dáº­u", "áº¤t": "ThĂ¢n", "BĂ­nh": "Ngá»", "Äinh": "Tá»µ",
  "Máº­u": "Ngá»", "Ká»·": "Tá»µ", "Canh": "MĂ£o", "TĂ¢n": "Dáº§n",
  "NhĂ¢m": "TĂ½", "QuĂ½": "Há»£i"
};

if (canNam && LUU_XUONG[canNam]) {
  themSaoLuu(
    LUU_XUONG[canNam],
    "VÄƒn XÆ°Æ¡ng",
    "xuong-khuc",
    "cat",
    prefix
  );
}
if (canNam && LUU_KHUC[canNam]) {
  themSaoLuu(
    LUU_KHUC[canNam],
    "VÄƒn KhĂºc",
    "xuong-khuc",
    "cat",
    prefix
  );
}


  // đŸŒˆ Tá»© HĂ³a â†’ chia láº¡i nhĂ³m: Lá»™c/Ká»µ, Khoa/Quyá»n
  const TU_HOA = {
    "GiĂ¡p":{loc:"LiĂªm Trinh",quyen:"PhĂ¡ QuĂ¢n",khoa:"VÅ© KhĂºc",ky:"ThĂ¡i DÆ°Æ¡ng"},
    "áº¤t":{loc:"ThiĂªn CÆ¡",quyen:"ThiĂªn LÆ°Æ¡ng",khoa:"Tá»­ Vi",ky:"ThĂ¡i Ă‚m"},
    "BĂ­nh":{loc:"ThiĂªn Äá»“ng",quyen:"ThiĂªn CÆ¡",khoa:"VÄƒn XÆ°Æ¡ng",ky:"LiĂªm Trinh"},
    "Äinh":{loc:"ThĂ¡i Ă‚m",quyen:"ThiĂªn Äá»“ng",khoa:"ThiĂªn CÆ¡",ky:"Cá»± MĂ´n"},
    "Máº­u":{loc:"Tham Lang",quyen:"ThĂ¡i Ă‚m",khoa:"Há»¯u Báº­t",ky:"ThiĂªn CÆ¡"},
    "Ká»·":{loc:"VÅ© KhĂºc",quyen:"Tham Lang",khoa:"ThiĂªn LÆ°Æ¡ng",ky:"VÄƒn KhĂºc"},
    "Canh":{loc:"ThĂ¡i DÆ°Æ¡ng",quyen:"VÅ© KhĂºc",khoa:"ThiĂªn Äá»“ng",ky:"ThĂ¡i Ă‚m"},
    "TĂ¢n":{loc:"Cá»± MĂ´n",quyen:"ThĂ¡i DÆ°Æ¡ng",khoa:"VÄƒn KhĂºc",ky:"VÄƒn XÆ°Æ¡ng"},
    "NhĂ¢m":{loc:"ThiĂªn LÆ°Æ¡ng",quyen:"Tá»­ Vi",khoa:"Táº£ PhĂ¹",ky:"VÅ© KhĂºc"},
    "QuĂ½":{loc:"PhĂ¡ QuĂ¢n",quyen:"Cá»± MĂ´n",khoa:"ThĂ¡i Ă‚m",ky:"Tham Lang"}
  };

  const hoa = TU_HOA[canNam];
  if (hoa) {
    const mapSao = {...(window.saoToCung || {}), ...(window.trungTinhToCung || {})};
    const tim = s => {
  const k = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bá» dáº¥u tá»• há»£p
    .replace(/\u0110/g, "d")           // Ä â†’ d
    .replace(/\u0111/g, "d")           // Ä‘ â†’ d
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
  
  return mapSao[k];
};

    if (tim(hoa.loc))   themSaoLuu(tim(hoa.loc), "HĂ³a Lá»™c", "loc-ky", "cat", prefix);
    if (tim(hoa.ky))    themSaoLuu(tim(hoa.ky), "HĂ³a Ká»µ", "loc-ky", "hung", prefix);
    if (tim(hoa.khoa))  themSaoLuu(tim(hoa.khoa), "HĂ³a Khoa", "khoa-quyen", "cat", prefix);
    if (tim(hoa.quyen)) themSaoLuu(tim(hoa.quyen), "HĂ³a Quyá»n", "khoa-quyen", "cat", prefix);
  }
}




// =====================================================
// đŸ” TĂCH Há»¢P Cáº¬P NHáº¬T Háº N â€“ KHĂ”NG RESET TUá»”I
// =====================================================
const oldCapNhatHan = capNhatHan;
capNhatHan = function() {
  // â¡ Gá»i báº£n gá»‘c Ä‘á»ƒ tĂ­nh tuá»•i vĂ  hiá»ƒn thá»‹, KHĂ”NG reset form
  oldCapNhatHan();

  // đŸ§­ LÆ°u láº¡i tuá»•i sau khi tĂ­nh xong
  const tuoiLabel = document.getElementById("tuoiAmLabel");
  const tuoiText = tuoiLabel ? tuoiLabel.textContent : "";

  // đŸ•“ Sau khi sao lÆ°u Ä‘Æ°á»£c váº½, khĂ´i phá»¥c láº¡i tuá»•i
  setTimeout(() => {
    xoaSaoLuu();

    // đŸŒ An sao theo 4 cáº¥p váº­n
    anSaoLuu_DaiVan(window.dataGlobal);
    anSaoLuu_TieuVan(window.dataGlobal);
    anSaoLuu_NguyetVan(window.dataGlobal);
    anSaoLuu_NhatVan(window.dataGlobal); // â˜€ï¸ thĂªm dĂ²ng nĂ y cho Nháº­t Váº­n

    // âœ… Giá»¯ nguyĂªn tuá»•i Ä‘Ă£ tĂ­nh
    if (tuoiLabel && tuoiText) tuoiLabel.textContent = tuoiText;

    // đŸ” Cáº­p nháº­t hiá»ƒn thá»‹ theo tick nhĂ³m
    const hienThi = window.__capNhatHienThiSaoLuu;
    if (typeof hienThi === "function") hienThi();
  }, 800);
  console.log("â™»ï¸ Cáº­p nháº­t láº¡i sao LÆ°u (ÄV + TV)");
};

// đŸŒ™ Táº¡o láº¡i khung Xem Háº¡n (Ă‚m Lá»‹ch) bĂªn trong Ă´ trung tĂ¢m
function ensureXemHanSection() {
  const center = document.getElementById("centerCell");
  if (!center) {
    // Náº¿u Ă´ trung tĂ¢m chÆ°a sáºµn sĂ ng, thá»­ láº¡i sau 1s
    setTimeout(ensureXemHanSection, 1000);
    return;
  }

  // Náº¿u Ä‘Ă£ cĂ³ khung thĂ¬ thĂ´i
  if (document.getElementById("xemHanSection")) return;

  const xemHanDiv = document.createElement("div");
  xemHanDiv.id = "xemHanSection";
  xemHanDiv.style.marginTop = "60px";
  xemHanDiv.style.fontSize = "13px";
  xemHanDiv.style.textAlign = "center";
  xemHanDiv.style.lineHeight = "1.5";
 xemHanDiv.innerHTML = `
  <div style="font-weight:bold; margin-bottom:4px; display:flex; align-items:center; justify-content:center; gap:5px;">
    <span style="font-size:16px;">đŸ”®</span>
    <span style="font-size:14px; font-weight:600;">XEM Háº N (Ă‚M Lá»CH)</span>
  </div>

  <div style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; font-size:12px; margin-bottom:3px;">
    <div>
      <label for="luuNam">NÄƒm:</label>
      <select id="luuNam" style="width:78px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;"></select>
    </div>

    <div>
      <label for="luuThang">ThĂ¡ng:</label>
      <select id="luuThang" style="width:55px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;">
        ${Array.from({ length: 12 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
      </select>
    </div>

    <div>
      <label for="luuNgay">NgĂ y:</label>
      <select id="luuNgay" style="width:55px; height:22px; border:1px solid #aaa; border-radius:3px; text-align:center; font-size:12px;">
        ${Array.from({ length: 30 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
      </select>
    </div>
  </div>

  <div style="margin-top:2px; font-size:12px;">
    <span id="tuoiAmLabel" style="font-weight:bold; color:#c00;">Tuá»•i: â€”</span>
  </div>


  <!-- âœ… Placeholder cho Äáº¡i Váº­n (chÆ°a gáº¯n dá»¯ liá»‡u) -->
  <div id="daiVanInfo"
     style="margin-top:4px; margin-bottom:4px; font-size:13px; color:#b24b00; font-weight:700; text-align:center; letter-spacing:0.3px;">

    đŸŒ Äáº¡i Váº­n â€”
  </div>


  <div style="margin-top:8px;">




<div id="vanControls"
     style="margin-top:8px; text-align:center; font-family:'Segoe UI',sans-serif;">

  <!-- DĂ²ng chá»¯ trĂªn cĂ¹ng -->
  <div style="font-size:12px; color:#222; margin-bottom:4px;">
    áº¨n / Hiá»‡n Váº­n:
  </div>

  <!-- HĂ ng nĂºt phĂ­a dÆ°á»›i -->
  <div style="display:flex; justify-content:center; gap:6px; flex-wrap:nowrap;">
    <button id="btnDaiVan" data-van="dai" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Äáº¡i Váº­n
    </button>

    <button id="btnTieuVan" data-van="tieu" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Tiá»ƒu Váº­n
    </button>

    <button id="btnNguyetVan" data-van="nguyet" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Nguyá»‡t Váº­n
    </button>

    <!-- đŸ†• ThĂªm nĂºt Nháº­t Váº­n -->
    <button id="btnNhatVan" data-van="nhat" class="nut-van off"
            style="background:#ccc; color:#333; border:none; border-radius:5px;
                   padding:3px 8px; font-size:11px; cursor:pointer; transition:all 0.25s;">
      Nháº­t Váº­n
    </button>
  </div>
</div>




  </div>
`;

  center.appendChild(xemHanDiv);









// đŸ§­ Äiá»n danh sĂ¡ch nÄƒm vĂ o dropdown
const yearSelect = document.getElementById("luuNam");
for (let y = 1900; y <= 2100; y++) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === 2025) opt.selected = true;
  yearSelect.appendChild(opt);
}

  // đŸ§® Gáº¯n láº¡i sá»± kiá»‡n tĂ­nh tuá»•i vĂ  nĂºt áº©n/hiá»‡n
  ["luuNam","luuThang","luuNgay"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.removeEventListener("change", capNhatHan); // đŸ§¹ xĂ³a sá»± kiá»‡n cÅ© (náº¿u cĂ³)
    el.addEventListener("change", capNhatHan);    // đŸ” gáº¯n láº¡i má»›i
  }
});



}  // đŸ‘ˆ thĂªm dáº¥u ngoáº·c nĂ y Ä‘á»ƒ káº¿t thĂºc function ensureXemHanSection



// đŸŒŸ Cáº­p nháº­t dĂ²ng hiá»ƒn thá»‹ Äáº¡i Váº­n trong khung Xem Háº¡n
function hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc) {
  const daiVanInfo = document.getElementById("daiVanInfo");
  if (!daiVanInfo) return; // náº¿u khung chÆ°a sáºµn

  // Äá»‹nh dáº¡ng chuá»—i: đŸŒ Äáº¡i Váº­n áº¤t MĂ¹i (25â€“34 tuá»•i)
  daiVanInfo.innerHTML = `đŸŒ Äáº¡i Váº­n <b>${canChiDaiVan}</b> (${tuoiBatDau}â€“${tuoiKetThuc} tuá»•i)`;
}

function capNhatDaiVanTheoNamHan(namHan) {
  const data = window.dataGlobal;
  if (!data || !data.luuHan) return;

  // đŸ§® Cáº­p nháº­t láº¡i vá»‹ trĂ­ Äáº¡i Váº­n theo cĂ´ng thá»©c chuáº©n
  anLop9_LuuDaiVan(data);

  // đŸ”¹ Láº¥y cung hiá»‡n táº¡i cá»§a Äáº¡i Váº­n
  const cungDai = data.luuHan.viTriDaiVan;
  if (!cungDai) return;

  // đŸ”¹ DĂ¹ng láº¡i hĂ m báº¡n Ä‘Ă£ cĂ³: tĂ­nh Can Chi Äáº¡i Váº­n (tá»©c Can Chi cá»§a cung Má»‡nh Äáº¡i Váº­n)
  const canChiDaiVan = (function layCanChiCuaCung(canChiNamSinh, tenCung) {
    const CAN_THANG = {
      "GiĂ¡p":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
      "áº¤t":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
      "BĂ­nh":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
      "Äinh":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
      "Máº­u":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"],
      "Ká»·":["BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh"],
      "Canh":["Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·"],
      "TĂ¢n":["Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n"],
      "NhĂ¢m":["NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½"],
      "QuĂ½":["GiĂ¡p","áº¤t","BĂ­nh","Äinh","Máº­u","Ká»·","Canh","TĂ¢n","NhĂ¢m","QuĂ½","GiĂ¡p","áº¤t"]
    };
    const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
    const canNam = canChiNamSinh.split(" ")[0];
    const chiIndex = CUNG_THUAN.indexOf(tenCung);
    if (chiIndex === -1) return "";
    const list = CAN_THANG[canNam] || CAN_THANG["GiĂ¡p"];
    const can = list[chiIndex];
    const chi = CUNG_THUAN[chiIndex];
    return `${can} ${chi}`;
  })(data.canChiNam, cungDai);

  // đŸ”¹ TĂ­nh tuá»•i báº¯t Ä‘áº§u â€“ káº¿t thĂºc theo block
    // đŸ”¹ TĂ­nh tuá»•i báº¯t Ä‘áº§u â€“ káº¿t thĂºc Ä‘Ăºng theo Cá»¥c
  const baseCuc = {
    "Thá»§y nhá»‹ cá»¥c": 2,
    "Má»™c tam cá»¥c": 3,
    "Kim tá»© cá»¥c": 4,
    "Thá»• ngÅ© cá»¥c": 5,
    "Há»a lá»¥c cá»¥c": 6
  }[data.cucSo];
  const tuoi = data.luuHan.tuoiAm;
  const block = Math.floor((tuoi - baseCuc) / 10);
  const tuoiBatDau = baseCuc + block * 10;
  const tuoiKetThuc = tuoiBatDau + 9;

  // đŸ–¼ï¸ Hiá»ƒn thá»‹ ra khung Xem Háº¡n
  hienThiThongTinDaiVan(canChiDaiVan, tuoiBatDau, tuoiKetThuc);

}

// =====================================================
// đŸ€ KHá»I Táº O Láº I Báº¢NG TICK + Äá»’NG Bá»˜ HIá»‚N THá» SAO LÆ¯U
// =====================================================
function initSaoLuuFull() {
  console.log("đŸ” Khá»Ÿi táº¡o tick + sá»± kiá»‡n sao LÆ°u...");

  // XĂ³a tick cÅ©
  const old = document.getElementById("bangNhomSaoLuu");
  if (old) old.remove();

  // Táº¡o báº£ng tick má»›i
  taoBangTickSaoLuu();

  // Gáº¯n EVENT láº¡i cho tick vĂ  4 nĂºt váº­n
  dongBoAnHienSaoLuu();

  console.log("âœ… Tick & sá»± kiá»‡n sao LÆ°u Ä‘Ă£ Ä‘Æ°á»£c gáº¯n láº¡i!");
}


// =====================================================
// âŒ XOĂ â€” KHĂ”NG KHá»I Táº O Tá»° Äá»˜NG KHI LOAD TRANG
// âŒ KHĂ”NG DĂ™NG setTimeout(initSaoLuuFull, 3000)
// âŒ KHĂ”NG DĂ™NG Ä‘á»£i DOMContentLoaded
// =====================================================



// đŸ¯ Cáº­p nháº­t Äáº¡i Váº­n khi chá»n NÄƒm háº¡n (giá»¯ nguyĂªn pháº§n nĂ y)
document.addEventListener("DOMContentLoaded", () => {
  const selectNam = document.getElementById("luuNam");
  if (!selectNam) return;

  selectNam.addEventListener("change", (e) => {
    const nam = parseInt(e.target.value);
    capNhatDaiVanTheoNamHan(nam);
  });
});

/* =====================================================
   đŸ’¾ LÆ¯U / Táº¢I / XĂ“A LĂ Sá» â€” PHIĂN Báº¢N NHáº¸ & á»”N Äá»NH
   ===================================================== */

// đŸ“‚ Láº¥y danh sĂ¡ch key lÆ°u lĂ¡ sá»‘ (Æ°u tiĂªn IndexedDB, fallback localStorage)
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

// đŸ”¹ Cáº­p nháº­t danh sĂ¡ch dropdown
function refreshSavedChartList() {
  const select = document.getElementById("savedCharts");
  if (!select) return;

  const current = select.value;
  select.innerHTML = `<option value="">-- Chá»n lĂ¡ sá»‘ Ä‘Ă£ lÆ°u --</option>`;

  listTuviKeys(keys => {
    const list = (keys && keys.length
      ? keys
      : Object.keys(localStorage).filter(k => k.startsWith("tuvi_"))
    ).sort();

    list.forEach(k => {
      const encodedName = k.replace("tuvi_", "");
      const decodedName = decodeURIComponent(encodedName);
      const opt = document.createElement("option");
      opt.value = encodedName;      // lÆ°u giĂ¡ trá»‹ Ä‘Ă£ encode Ä‘á»ƒ load Ä‘Ăºng key
      opt.textContent = decodedName;
      select.appendChild(opt);
    });

    // Giá»¯ lá»±a chá»n hiá»‡n táº¡i (há»— trá»£ cáº£ giĂ¡ trá»‹ Ä‘Ă£ decode trÆ°á»›c Ä‘Ă¢y)
    if (current) {
      select.value = current;
      if (!select.value) select.value = encodeURIComponent(current);
    }
  });
}



// =====================================================
// đŸ’¾ LÆ¯U / Táº¢I / XĂ“A LĂ Sá» â€” CHUáº¨N CHá»ˆ Láº¤Y Dá»® LIá»†U DÆ¯Æ NG Lá»CH
// =====================================================

function saveChartToLocal() {
  // đŸ§± Popup nháº­p tĂªn file lÆ°u
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
    <h3 style="margin-top:0;margin-bottom:10px;">đŸ’¾ LÆ°u lĂ¡ sá»‘</h3>
    <p style="margin:5px 0 10px 0;font-size:13px;">
      Nháº­p tĂªn <b>file lÆ°u</b> (vĂ­ dá»¥: "LĂ¡ sá»‘ Vy") hoáº·c chá»n Ä‘á»ƒ ghi Ä‘Ă¨:
    </p>
    <select id="saveChartSelect"
            style="width:100%;padding:5px;margin-bottom:10px;border:1px solid #aaa;border-radius:5px;">
      <option value="">-- Chá»n lĂ¡ sá»‘ Ä‘Ă£ lÆ°u --</option>
    </select>
    <input id="saveChartName" type="text" placeholder="TĂªn file lÆ°u (vĂ­ dá»¥: LĂ¡ sá»‘ Vy)"
           style="width:100%;padding:6px;border:1px solid #aaa;border-radius:5px;margin-bottom:10px;">
    <div style="display:flex;justify-content:center;gap:8px;margin-top:5px;">
      <button id="btnSaveConfirm" style="background:#337ab7;color:#fff;border:none;border-radius:5px;padding:5px 15px;cursor:pointer;">LÆ°u</button>
      <button id="btnSaveCancel" style="background:#ccc;color:#333;border:none;border-radius:5px;padding:5px 15px;cursor:pointer;">Há»§y</button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // đŸ“œ Danh sĂ¡ch file lÆ°u sáºµn (Æ°u tiĂªn IndexedDB, fallback localStorage)
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

  // âœ… Khi báº¥m â€œLÆ°uâ€
  box.querySelector("#btnSaveConfirm").addEventListener("click", () => {
    const fileName = box.querySelector("#saveChartName").value.trim(); // tĂªn file lÆ°u
    if (!fileName) return alert("â ï¸ Vui lĂ²ng nháº­p hoáº·c chá»n tĂªn file lÆ°u!");

    const safeKey = "tuvi_" + encodeURIComponent(fileName);
    if (localStorage.getItem(safeKey) && !confirm(`TĂªn file "${fileName}" Ä‘Ă£ tá»“n táº¡i. Ghi Ä‘Ă¨?`)) return;

    // === 1ï¸âƒ£ Äá»c trá»±c tiáº¿p dá»¯ liá»‡u tá»« báº£ng káº¿t quáº£ DÆ¯Æ NG Lá»CH ===
    const table = document.querySelector("#output table");
    if (!table) return alert("â ï¸ KhĂ´ng tĂ¬m tháº¥y báº£ng káº¿t quáº£ Ä‘á»ƒ lÆ°u!");
    const rows = table.querySelectorAll("tr");
    const namDL   = rows[1]?.cells[1]?.textContent?.trim() || "";
    const thangDL = rows[2]?.cells[1]?.textContent?.trim() || "";
    const ngayDL  = rows[3]?.cells[1]?.textContent?.trim() || "";
    const gioText = rows[4]?.cells[1]?.textContent?.trim() || "";

    console.log("đŸ“† [DEBUG] Dá»® LIá»†U Tá»ª Cá»˜T DÆ¯Æ NG Lá»CH:", { namDL, thangDL, ngayDL, gioText });

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

    // đŸ”¹ Giá»¯ tĂªn tháº­t ngÆ°á»i dĂ¹ng trong lĂ¡ sá»‘
    const nameVal = document.getElementById("name")?.value || "(KhĂ´ng tĂªn)";
    const genderVal = document.getElementById("gender")?.value || "Nam";

    // === 2ï¸âƒ£ Dá»¯ liá»‡u lÆ°u ===
    const dataToSave = {
      name: nameVal, // tĂªn tháº­t trong lĂ¡ sá»‘
      gender: genderVal,
      calendarType: "solar",
      day,
      month,
      year,
      hour: hourVal,
      gioText,
      daXuLyGioTy: (hourVal === 23)
    };

    console.log("đŸ’¾ [DEBUG] Dá»® LIá»†U ÄĂƒ LÆ¯U:", dataToSave);
    localStorage.setItem(safeKey, JSON.stringify(dataToSave));
    if (typeof saveToIndexedDB === "function")
      saveToIndexedDB(safeKey, JSON.stringify(dataToSave));

    refreshSavedChartList();
    document.body.removeChild(overlay);
    alert(`âœ… ÄĂ£ lÆ°u lĂ¡ sá»‘: "${nameVal}" â†’ file "${fileName}"`);
  });

  // âŒ Há»§y
  box.querySelector("#btnSaveCancel").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  overlay.addEventListener("click", e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

// =====================================================
// đŸ”¹ XĂ³a lĂ¡ sá»‘
// =====================================================
function deleteSelectedChart() {
  const select = document.getElementById("savedCharts");
  const encodedName = select?.value;
  if (!encodedName) return alert("â ï¸ Vui lĂ²ng chá»n lĂ¡ sá»‘ cáº§n xĂ³a!");
  const displayName = decodeURIComponent(encodedName);
  if (!confirm(`Báº¡n cĂ³ cháº¯c muá»‘n xĂ³a lĂ¡ sá»‘ "${displayName}" khĂ´ng?`)) return;
  localStorage.removeItem("tuvi_" + encodedName);
  refreshSavedChartList();
  alert("đŸ—‘ï¸ ÄĂ£ xĂ³a lĂ¡ sá»‘: " + displayName);
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
      if (!parsed) return alert(`â ï¸ KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u cho "${displayName || encodedName}"!`);
      window.dataGlobal = parsed;

      console.log("đŸ”µ [LOAD] Báº®T Äáº¦U LOAD LĂ Sá»â€¦");

      // 1) LUĂ”N LUĂ”N Táº O Láº I LAYOUT
      taoLaSoTrang(parsed);

      // 2) SAU ÄĂ“ XOĂ Táº¤T Cáº¢ CĂC Lá»P SAO CÅ¨
      clearAllLayers();

      // 3) KHĂ”I PHá»¤C LUNAR
      window.__DISABLE_ONCHANGE = true;
      khoiPhucLunar(parsed);
      window.__DISABLE_ONCHANGE = false;
      // 4) AN Láº I Tá»ª Äáº¦U
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

      alert(`â™»ï¸ ÄĂ£ táº£i lĂ¡ sá»‘: ${displayName || encodedName}`);
    });
}



// =====================================================
// đŸ“¸ Xuáº¥t áº£nh lĂ¡ sá»‘ Tá»­ Vi
// =====================================================
function downloadChartAsImage() {
  const chart = document.getElementById("lasoContainer");
  if (!chart) return alert("KhĂ´ng tĂ¬m tháº¥y khung lĂ¡ sá»‘!");
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
// đŸ€ Sá»± kiá»‡n khá»Ÿi táº¡o
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
   đŸ“‚ DANH SĂCH LĂ Sá» â€” XEM / XOĂ / Äá»”I TĂN (POPUP)
   ===================================================== */
// =====================================================
// đŸ”„ RESET TOĂ€N Bá»˜ GIAO DIá»†N SAO LÆ¯U + TIá»‚U TINH + Háº N
// =====================================================

function resetFullUI() {
  console.log("đŸ” Reset toĂ n bá»™ giao diá»‡n vá» tráº¡ng thĂ¡i ban Ä‘áº§u...");

  // 1ï¸âƒ£ Reset táº¥t cáº£ checkbox hiá»ƒn thá»‹ lá»›p (náº¿u cĂ³)
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = cb.defaultChecked;
  });

  // 2ï¸âƒ£ áº¨n toĂ n bá»™ báº£ng vĂ  khung phá»¥
  const hideList = [
    "bangNhomSaoLuu",   // báº£ng tick nhĂ³m sao lÆ°u
    "xemHanSection"     // khung xem háº¡n Ă¢m lá»‹ch
  ];
  hideList.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // 3ï¸âƒ£ áº¨n toĂ n bá»™ sao lÆ°u (Äáº¡i váº­n, Tiá»ƒu váº­n)
  document.querySelectorAll(".sao-luu").forEach(e => e.style.display = "none");

  // 4ï¸âƒ£ Äáº·t láº¡i tráº¡ng thĂ¡i nĂºt Äáº¡i Váº­n / Tiá»ƒu Váº­n
  const nutDai = document.getElementById("btnDaiVan");
  const nutTieu = document.getElementById("btnTieuVan");
  [nutDai, nutTieu].forEach(btn => {
    if (!btn) return;
    btn.classList.remove("active");
    btn.classList.add("off");
    btn.style.background = "#ccc";
    btn.style.color = "#333";
  });

  // 5ï¸âƒ£ Reset báº£ng tick nhĂ³m sao lÆ°u (áº¨n / Hiá»‡n Háº¡n)
  document.querySelectorAll(".chk-nhom").forEach(chk => {
    chk.checked = true; // báº­t láº¡i háº¿t
  });

  // 6ï¸âƒ£ XĂ³a ná»™i dung dropdown háº¡n (NÄƒm / ThĂ¡ng / NgĂ y)
  ["luuNam", "luuThang", "luuNgay"].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.value = "";
  });

  // 7ï¸âƒ£ Reset nhĂ£n â€œTuá»•i: â€”â€
  const tuoiLabel = document.getElementById("tuoiAmLabel");
  if (tuoiLabel) tuoiLabel.textContent = "Tuá»•i: â€”";

  // 8ï¸âƒ£ XoĂ¡ sao lÆ°u cÅ© (Äáº¡i / Tiá»ƒu váº­n)
  document.querySelectorAll(".sao-luu").forEach(e => e.remove());

  // 9ï¸âƒ£ Reset toĂ n bá»™ nĂºt Tiá»ƒu tinh (báº­t láº¡i nhÆ° ban Ä‘áº§u)
  const btnTieuTinhBox = document.querySelector("#tieuTinhControls");
  if (btnTieuTinhBox) {
    const buttons = btnTieuTinhBox.querySelectorAll(".nut-tieutinh");
    buttons.forEach(b => {
      b.classList.add("active");
      b.style.background = "#337ab7";
      b.style.color = "#fff";
    });
  }

  // đŸ”Ÿ Reset logic Tiá»ƒu tinh hiá»ƒn thá»‹
  if (typeof toggleTieuTinh === "function") {
    // Báº­t láº¡i toĂ n bá»™ nhĂ³m Tiá»ƒu tinh
    ["Táº¥t Cáº£","TĂ¬nh DuyĂªn","Tiá»n Báº¡c","CĂ´ng Danh","Sá»©c Khá»e"].forEach(group => {
      toggleTieuTinh(group, true);
    });
  }

  // 11ï¸âƒ£ Hiá»‡n láº¡i khung Tiá»ƒu tinh náº¿u bá»‹ áº©n
  const tieuTinhControls = document.getElementById("tieuTinhControls");
  if (tieuTinhControls) tieuTinhControls.style.display = "flex";

  // 12ï¸âƒ£ Cuá»™n vá» Ä‘áº§u trang Ä‘á»ƒ trĂ¡nh lá»‡ch
  window.scrollTo(0, 0);
}








// â ï¸ XĂ¡c nháº­n trÆ°á»›c khi má»Ÿ lĂ¡ sá»‘
function confirmAndLoadChart(name) {
  const displayName = decodeURIComponent(name || "");
  if (!confirm(`Báº¡n cĂ³ cháº¯c muá»‘n má»Ÿ lĂ¡ sá»‘ "${displayName}" khĂ´ng?`)) return;

  console.log("đŸ“‚ Äang má»Ÿ lĂ¡ sá»‘:", displayName);
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
    if (!data) return alert(`â ï¸ KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u lĂ¡ sá»‘ "${displayName}"!`);

    try {
      // đŸ§  GĂ¡n láº¡i thĂ´ng tin cÆ¡ báº£n
      document.getElementById("name").value = data.name || "";
      document.getElementById("gender").value = data.gender || "Nam";

      // âœ… LuĂ´n dĂ¹ng ngĂ y DÆ°Æ¡ng gá»‘c Ä‘Ă£ lÆ°u (á»•n Ä‘á»‹nh, khĂ´ng bá»‹ lá»‡ch 23h hay nhuáº­n)
      const day = String(data.day || data.ngayDuong || 1);
      const month = String(data.month || data.thangDuong || 1);
      const year = String(data.year || data.namDuong || 2000);
      const hour = String(data.hour || data.gioSinh || 0);

      // đŸ—“ï¸ GĂ¡n láº¡i form theo ngĂ y DÆ°Æ¡ng
      document.getElementById("calendarType").value = "solar";
      const dayEl = document.getElementById("day");
      const monthEl = document.getElementById("month");
      const yearEl = document.getElementById("year");
      const gioEl = document.getElementById("gio");

      if ([...dayEl.options].some(o => o.value === day)) dayEl.value = day;
      if ([...monthEl.options].some(o => o.value === month)) monthEl.value = month;
      if ([...yearEl.options].some(o => o.value === year)) yearEl.value = year;
      if ([...gioEl.options].some(o => o.value === hour)) gioEl.value = hour;

      // đŸ•› Ghi cá» Giá» TĂ½ (náº¿u cĂ³)
      if (data.daXuLyGioTy && hour === "23") {
        console.log("đŸ•› Giá» TĂ½ Ä‘Ă£ Ä‘Æ°á»£c xá»­ lĂ½ sáºµn khi lÆ°u â†’ khĂ´ng cáº§n cá»™ng láº¡i ngĂ y Ă¢m.");
        window.dataGlobal = { ...data, daXuLyGioTy: true };
      }

      console.log(`đŸ§­ ÄĂ£ náº¡p form: ${day}/${month}/${year} (DÆ°Æ¡ng) - Giá» ${hour}`);
    } catch (err) {
      console.warn("â ï¸ Lá»—i khi gĂ¡n form:", err);
    }

    // áº¨n popup danh sĂ¡ch
    const popup = document.getElementById("chartListPopup");
    if (popup) popup.style.display = "none";

    // đŸ”„ Gá»i láº¡i nĂºt â€œChuyá»ƒn Ä‘á»•iâ€ Ä‘á»ƒ há»‡ thá»‘ng tá»± tĂ­nh láº¡i Ă‚m lá»‹ch
    const btnConvert = document.getElementById("convert");
    if (btnConvert) {
      console.log("đŸ”„ Äang an láº¡i toĂ n bá»™ lĂ¡ sá»‘ báº±ng nĂºt 'Chuyá»ƒn Ä‘á»•i' (tá»« DÆ°Æ¡ng)...");
      btnConvert.click();
    } else {
      alert("â ï¸ KhĂ´ng tĂ¬m tháº¥y nĂºt 'Chuyá»ƒn Ä‘á»•i'!");
    }
  });
}




















// đŸ”¹ Hiá»ƒn thá»‹ danh sĂ¡ch popup
  function showChartListPopup() {
    const popup = document.getElementById("chartListPopup");
    const container = document.getElementById("chartListItems");
    if (!popup || !container) return;
      // đŸŸ¦ Cáº­p nháº­t giao diá»‡n popup to hÆ¡n, cÄƒn giá»¯a, cĂ³ Ä‘á»• bĂ³ng
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
  
    // đŸ§  Láº¥y danh sĂ¡ch keys tá»« IndexedDB trÆ°á»›c, fallback localStorage
    listTuviKeysFromIDB(keysFromIDB => {
      const charts = (keysFromIDB.length
        ? keysFromIDB
        : Object.keys(localStorage).filter(k => k.startsWith("tuvi_"))
      ).map(k => k.replace("tuvi_", ""));
  
      if (!charts.length) {
        container.innerHTML = "<p><i>ChÆ°a cĂ³ lĂ¡ sá»‘ nĂ o Ä‘Æ°á»£c lÆ°u.</i></p>";
      } else {
        container.innerHTML = charts.map(encodedName => {
          const name = decodeURIComponent(encodedName);
          const noteKey = "note_" + encodedName;
          const hasNote = !!localStorage.getItem(noteKey); // âœ… kiá»ƒm tra ghi chĂº (chá»‰ localStorage)
          const noteIcon = hasNote ? "đŸ“Œ" : "đŸ“„"; // âœ… cĂ³ note dĂ¹ng đŸ“Œ, chÆ°a cĂ³ dĂ¹ng đŸ“„
  
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
                    title="Äá»•i tĂªn" onclick="renameChartByName('${encodedName}')">âœï¸</span>
              <span style="cursor:pointer;margin-left:8px;"
                    title="Ghi chĂº riĂªng" onclick="editNoteByName('${encodedName}')">${noteIcon}</span>
              <span style="cursor:pointer;margin-left:8px;color:#c00;"
                    title="XoĂ¡" onclick="deleteChartByName('${encodedName}')">đŸ—‘ï¸</span>
            </div>
          `;
        }).join("");
      }
  
      popup.style.display = "block";
    });
  }

// đŸ”¹ Ghi chĂº riĂªng cho tá»«ng lĂ¡ sá»‘ â€” thĂªm overlay, xĂ¡c nháº­n khi Ä‘Ă³ng, cĂ³ nĂºt âœ– gĂ³c pháº£i
function editNoteByName(encodedName) {
  const name = decodeURIComponent(encodedName);
  const noteKey = "note_" + encodedName;
  const oldNote = localStorage.getItem(noteKey) || "";

  // đŸ©µ Táº¡o overlay náº¿u chÆ°a cĂ³
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

  // đŸ©¶ Táº¡o popup náº¿u chÆ°a cĂ³
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
      <!-- NĂºt âœ– gĂ³c pháº£i -->
      <div style="position:absolute;top:8px;right:10px;cursor:pointer;font-size:18px;color:#666;"
           title="ÄĂ³ng" onclick="closeNotePopup()">âœ–</div>

      <h3 style="margin-top:0;text-align:center;color:#007bff;">đŸ“ Ghi chĂº lĂ¡ sá»‘</h3>
      <div id="noteTitle" style="font-weight:bold;text-align:center;margin-bottom:8px;color:#444;"></div>

      <div id="toolbarNote" style="display:none;text-align:center;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;">
        <button onclick="execCmd('bold')"><b>B</b></button>
        <button onclick="execCmd('italic')"><i>I</i></button>
        <button onclick="execCmd('underline')"><u>U</u></button>
        <button onclick="execCmd('justifyLeft')">â¯‡</button>
        <button onclick="execCmd('justifyCenter')">â˜°</button>
        <button onclick="execCmd('justifyRight')">â¯ˆ</button>
        <select onchange="execCmd('fontSize', this.value)">
          <option value="3">Cá»¡</option>
          <option value="2">Nhá»</option>
          <option value="3">Vá»«a</option>
          <option value="5">To</option>
          <option value="7">Ráº¥t to</option>
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
        <button id="noteEditBtn" style="background:#f0ad4e;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;">âœï¸ Chá»‰nh sá»­a</button>
<button id="noteSaveBtn" style="background:#37474f;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;display:none;">đŸª¶ LÆ°u</button>
        <button id="noteCloseBtn" style="background:#ccc;border:none;border-radius:4px;padding:5px 12px;margin-left:6px;cursor:pointer;">âœ– ÄĂ³ng</button>
      </div>
    `;
    overlay.appendChild(noteBox);
  }

  // đŸ“‹ GĂ¡n ná»™i dung ban Ä‘áº§u
  document.getElementById("noteTitle").textContent = name;
  const noteView = document.getElementById("noteView");
  noteView.innerHTML = oldNote || "<i>ChÆ°a cĂ³ ghi chĂº.</i>";
  noteView.contentEditable = "false";

  // đŸ§­ Reset tráº¡ng thĂ¡i
  document.getElementById("toolbarNote").style.display = "none";
  document.getElementById("noteSaveBtn").style.display = "none";
  document.getElementById("noteEditBtn").style.display = "inline-block";
  noteView.style.background = "#fafafa";
  overlay.style.display = "flex";

  let edited = false; // cá» kiá»ƒm tra cĂ³ chá»‰nh sá»­a hay khĂ´ng

  // đŸ¨ CĂ¡c nĂºt
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


// đŸª¶ LÆ°u ghi chĂº lĂ¡ sá»‘

  saveBtn.onclick = () => {
    const html = noteView.innerHTML.trim();
    if (!html) {
      localStorage.removeItem(noteKey);
      noteView.innerHTML = "<i>ChÆ°a cĂ³ ghi chĂº.</i>";
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
      if (!confirm("â ï¸ Ghi chĂº chÆ°a Ä‘Æ°á»£c lÆ°u. Báº¡n cĂ³ cháº¯c muá»‘n Ä‘Ă³ng?")) return;
    }
    overlay.style.display = "none";
  };

  // âŒ KhĂ´ng cho click ra ngoĂ i Ä‘Ă³ng popup
  overlay.addEventListener("click", e => {
    if (e.target.id === "noteOverlay") {
      if (edited && noteView.isContentEditable) {
        alert("Vui lĂ²ng báº¥m đŸ’¾ LÆ°u hoáº·c âœ– ÄĂ³ng Ä‘á»ƒ thoĂ¡t.");
      }
    }
  });
}

// đŸ¨ Lá»‡nh Ä‘á»‹nh dáº¡ng
function execCmd(cmd, val = null) {
  document.execCommand(cmd, false, val);
}

// đŸ§© HĂ m Ä‘Ă³ng popup khi click âœ– gĂ³c pháº£i â€” cĂ³ xĂ¡c nháº­n náº¿u chÆ°a lÆ°u
function closeNotePopup() {
  const overlay = document.getElementById("noteOverlay");
  const noteView = document.getElementById("noteView");
  if (!overlay || !noteView) return;

  const isEditing = noteView.isContentEditable;
  if (isEditing) {
    const edited = noteView.innerHTML.trim() !== "" && noteView.style.background === "rgb(255, 255, 255)";
    if (edited && !confirm("â ï¸ Ghi chĂº chÆ°a Ä‘Æ°á»£c lÆ°u. Báº¡n cĂ³ cháº¯c muá»‘n Ä‘Ă³ng?")) return;
  }

  overlay.style.display = "none";
}



// đŸ”¹ Äá»•i tĂªn lĂ¡ sá»‘
  function renameChartByName(encodedName) {
    const oldName = decodeURIComponent(encodedName);
    const newName = prompt(`âœï¸ Nháº­p tĂªn má»›i cho lĂ¡ sá»‘ "${oldName}":`, oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
  
    const newEncoded = encodeURIComponent(newName.trim());
    const oldKey = "tuvi_" + encodedName;
    const newKey = "tuvi_" + newEncoded;
  
    // đŸ”¸ Kiá»ƒm tra trĂ¹ng tĂªn (IndexedDB trÆ°á»›c, rá»“i localStorage)
    loadFromIndexedDB(newKey, exists => {
      if (exists || localStorage.getItem(newKey)) {
        alert("â ï¸ TĂªn nĂ y Ä‘Ă£ tá»“n táº¡i. Vui lĂ²ng chá»n tĂªn khĂ¡c!");
        return;
      }
  
      // đŸ”¹ Láº¥y dá»¯ liá»‡u cÅ©
      loadFromIndexedDB(oldKey, chartData => {
        let dataToMove = chartData;
        if (!dataToMove) {
          const ls = localStorage.getItem(oldKey);
          if (ls) dataToMove = ls;
        }
        if (!dataToMove) {
          alert("âŒ KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u lĂ¡ sá»‘ cÅ©!");
          return;
        }
  
        const noteKeyOld = "note_" + encodedName;
        const noteKeyNew = "note_" + newEncoded;
        const noteData = localStorage.getItem(noteKeyOld);
  
        // đŸ”¹ LÆ°u láº¡i vá»›i tĂªn má»›i
        saveToIndexedDB(newKey, dataToMove);
        if (noteData) localStorage.setItem(noteKeyNew, noteData);
        try { localStorage.setItem(newKey, dataToMove); } catch (_) {}
  
        // đŸ”¹ XoĂ¡ báº£n cÅ©
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
  
        alert(`âœ… ÄĂ£ Ä‘á»•i tĂªn "${oldName}" thĂ nh "${newName}".`);
        refreshSavedChartList();
        showChartListPopup(); // cáº­p nháº­t danh sĂ¡ch
      });
    });
  }
  
  // đŸ”¹ XoĂ¡ lĂ¡ sá»‘ theo tĂªn
  function deleteChartByName(encodedName) {
    const name = decodeURIComponent(encodedName); // âœ… hiá»ƒn thá»‹ Ä‘Ăºng tĂªn
    if (!confirm(`đŸ—‘ï¸ XoĂ¡ lĂ¡ sá»‘ "${name}"?`)) return;
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

// đŸ”¹ ÄĂ³ng popup khi click ra ngoĂ i
document.addEventListener("click", e => {
  const popup = document.getElementById("chartListPopup");
  if (!popup) return;
  if (!popup.contains(e.target) && e.target.id !== "btnListCharts") {
    popup.style.display = "none";
  }
});


// =====================================================
// đŸŒŸ CĂ‚Y TRA Cá»¨U SAO â€“ CĂ“ POPUP, Sá»¬A TĂN, KĂ‰O THáº¢
// =====================================================

// Dá»¯ liá»‡u Ä‘áº§y Ä‘á»§ (náº¿u cĂ³ localStorage thĂ¬ dĂ¹ng báº£n ngÆ°á»i dĂ¹ng)
window.DANH_MUC_SAO = JSON.parse(localStorage.getItem("DANH_MUC_SAO")) || {
  "ChĂ­nh Tinh": [
    "Tá»­ Vi","ThiĂªn CÆ¡","ThĂ¡i DÆ°Æ¡ng","VÅ© KhĂºc","ThiĂªn Äá»“ng",
    "LiĂªm Trinh","ThiĂªn Phá»§","ThĂ¡i Ă‚m","Tham Lang",
    "Cá»± MĂ´n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","Tháº¥t SĂ¡t","PhĂ¡ QuĂ¢n"
  ],

  "Trung Tinh â€“ CĂ¡t Tinh": [
    "ThiĂªn KhĂ´i","ThiĂªn Viá»‡t","Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc"
  ],

  "Trung Tinh â€“ Hung Tinh": [
    "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p"
  ],

  "Tá»© HĂ³a": ["HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ"],
  "Lá»™c â€“ MĂ£": ["Lá»™c Tá»“n","ThiĂªn MĂ£"],

  // đŸŒŸ TIá»‚U TINH Gá»˜P CHUNG, NHÆ¯NG CHIA NHĂ“M CON
  "Tiá»ƒu Tinh": {
    "Theo ThĂ¡i Tuáº¿": [
      "ThĂ¡i Tuáº¿","Thiáº¿u DÆ°Æ¡ng","Tang MĂ´n","Thiáº¿u Ă‚m","Quan PhĂ¹","Tá»­ PhĂ¹",
      "Tuáº¿ PhĂ¡","Long Äá»©c","Báº¡ch Há»•","PhĂºc Äá»©c","Äiáº¿u KhĂ¡ch","Trá»±c PhĂ¹"
    ],
    "Theo Äá»‹a Chi NÄƒm Sinh": [
      "PhÆ°á»£ng CĂ¡c","Giáº£i Tháº§n","Long TrĂ¬","Nguyá»‡t Äá»©c","ThiĂªn Äá»©c","ThiĂªn Há»·",
      "ThiĂªn Khá»‘c","ThiĂªn HÆ°","ÄĂ o Hoa","Há»“ng Loan","Hoa CĂ¡i","Kiáº¿p SĂ¡t",
      "PhĂ¡ ToĂ¡i","CĂ´ Tháº§n","Quáº£ TĂº"
    ],
    "Theo ThĂ¡ng Sinh": [
      "ThiĂªn HĂ¬nh","ThiĂªn RiĂªu","ThiĂªn Y","ThiĂªn Giáº£i","Äá»‹a Giáº£i"
    ],
    "Theo Giá» Sinh": ["Thai Phá»¥","Phong CĂ¡o"],
    "Theo Lá»™c Tá»“n": [
      "BĂ¡c SÄ©","Lá»±c SÄ©","Thanh Long","Tiá»ƒu Hao","TÆ°á»›ng QuĂ¢n","Táº¥u ThÆ°",
      "Phi LiĂªm","Há»· Tháº§n","Bá»‡nh PhĂ¹","Äáº¡i Hao","Phá»¥c Binh","Quan Phá»§"
    ],
    "Theo Can / NgĂ y / Táº¡p Tinh": [
      "ThiĂªn QuĂ½","Ă‚n Quang","Tam Thai","BĂ¡t Tá»a","LÆ°u HĂ ","Quá»‘c áº¤n",
      "ÄÆ°á»ng PhĂ¹","VÄƒn Tinh","ThiĂªn Quan","ThiĂªn PhĂºc","ThiĂªn TrĂ¹",
      "Äáº©u QuĂ¢n","ThiĂªn KhĂ´ng","ThiĂªn TĂ i","ThiĂªn Thá»","ThiĂªn ThÆ°Æ¡ng",
      "ThiĂªn Sá»©","ThiĂªn La","Äá»‹a VĂµng"
     ],

  // đŸŸ¢ NHĂ“M Má»I â€” VĂ’NG TRĂ€NG SINH
  "VĂ²ng TrĂ ng Sinh": [
    "TrÆ°á»ng Sinh","Má»™c Dá»¥c","Quan Äá»›i","LĂ¢m Quan","Äáº¿ VÆ°á»£ng",
    "Suy","Bá»‡nh","Tá»­","Má»™","Tuyá»‡t","Thai","DÆ°á»¡ng"
  ]
  },

  "Cung": [
    "Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch",
    "ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u","An ThĂ¢n"
  ],

  "Tuáº§n â€“ Triá»‡t": ["Tuáº§n KhĂ´ng","Triá»‡t KhĂ´ng"]
};

// =====================================================
// đŸŒ³ Táº O CĂ‚Y Tá»° Äá»˜NG â€” Gom Trung Tinh, hiá»ƒn thá»‹ Tiá»ƒu Tinh Ä‘Ăºng nhĂ³m
// =====================================================
window.renderSidebar = function () {
  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

  sidebar.innerHTML = `<h3>đŸ”® <b>Tá»ª ÄIá»‚N SAO</b></h3>`;

  const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
  let groupIndex = 0;

  // âœ… Gom nhĂ³m Trung Tinh thĂ nh 2 nhĂ³m con
  const DANH_MUC_GOP = {
    "ChĂ­nh Tinh": DANH_MUC_SAO["ChĂ­nh Tinh"],
    "Trung Tinh": {
      "Lá»¥c CĂ¡t Tinh": DANH_MUC_SAO["Trung Tinh â€“ CĂ¡t Tinh"],
      "Lá»¥c SĂ¡t Tinh": DANH_MUC_SAO["Trung Tinh â€“ Hung Tinh"]
    },
    "Tá»© HĂ³a": DANH_MUC_SAO["Tá»© HĂ³a"],
    "Lá»™c â€“ MĂ£": DANH_MUC_SAO["Lá»™c â€“ MĂ£"],
    "Tiá»ƒu Tinh": DANH_MUC_SAO["Tiá»ƒu Tinh"],  // đŸ‘ˆ Object gá»“m nhiá»u nhĂ³m
    "Cung": DANH_MUC_SAO["Cung"],
    "Tuáº§n â€“ Triá»‡t": DANH_MUC_SAO["Tuáº§n â€“ Triá»‡t"]
  };

  Object.entries(DANH_MUC_GOP).forEach(([nhom, ds]) => {
    groupIndex++;
    const romanNum = roman[groupIndex - 1];
    const div = document.createElement("div");
    div.className = "group";

    // đŸ”¹ NhĂ³m cĂ³ máº£ng trá»±c tiáº¿p (ChĂ­nh Tinh, Tá»© HĂ³a, Lá»™c â€“ MĂ£, Cung, Tuáº§n â€“ Triá»‡t)
    if (Array.isArray(ds)) {
      let html = `<div class="group-title">${romanNum}. ${nhom}</div><ul style="display:none;">`;
      ds.forEach((sao, idx) => {
        html += `<li draggable="true" data-sao="${sao}">${groupIndex}.${idx + 1} ${sao}</li>`;
      });
      html += `</ul>`;
      div.innerHTML = html;
    }

    // đŸ”¸ Trung Tinh â€” cĂ³ 2 nhĂ³m con
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

    // đŸ”¹ Tiá»ƒu Tinh â€” cĂ³ nhiá»u nhĂ³m nhá», khĂ´ng Ä‘Ă¡nh sá»‘ sao
    else if (nhom === "Tiá»ƒu Tinh" && typeof ds === "object") {
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

  // === Toggle nhĂ³m chĂ­nh ===
  document.querySelectorAll("#sidebarTraCuu .group-title").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") return;
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });

  // === Toggle nhĂ³m con ===
  document.querySelectorAll("#sidebarTraCuu .sub-title").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") return;
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });

  attachSidebarEvents();

  // đŸ”¹ Khi click vĂ o tiĂªu Ä‘á» "Tá»ª ÄIá»‚N SAO" â†’ chá»‰ thu nhĂ³m SAO, KHĂ”NG áº©n CHUYĂN Äá»€
  const title = sidebar.querySelector("h3");
  if (title) {
    title.style.cursor = "pointer";
    title.addEventListener("click", () => {
      document.querySelectorAll("#sidebarTraCuu .group ul, #sidebarTraCuu .subgroup-list, #sidebarTraCuu .sao-list").forEach(ul => {
        ul.style.display = "none";
      });
    });
  }




// âœ… ThĂªm pháº§n đŸ“˜ CHUYĂN Äá»€ (Ä‘á»™c láº­p)
const chuyenDeBox = document.createElement("div");
chuyenDeBox.id = "chuyenDeBox";
chuyenDeBox.innerHTML = `
  <hr style="border:none; border-top:1px solid #ccc; margin:12px 0;">
  <h3 id="titleChuyenDe" style="text-align:center; color:#3a0ca3; cursor:pointer;">đŸ“˜ CHUYĂN Äá»€</h3>

  <!-- âœ… Danh sĂ¡ch chuyĂªn Ä‘á» -->
  <ul id="listChuyenDe" style="
    list-style:none;
    padding-left:10px;
    margin:0;
    position:relative;
  "></ul>

  <!-- âœ… Hai nĂºt ThĂªm vĂ  Sá»­a náº±m cáº¡nh nhau -->
  <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
    <button id="btnAddChuyenDe" style="
      flex:1;
      background:#7b2cbf;
      color:white;
      border:none;
      border-radius:6px;
      padding:5px 10px;
      cursor:pointer;
    ">â• ThĂªm chuyĂªn Ä‘á»</button>

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
    ">âœï¸ Sá»­a</button>
  </div>

  <!-- đŸ¨ CSS nhá» gá»n hiá»ƒn thá»‹ dáº¥u đŸ”¹ cho má»¥c cĂ³ con -->
  <style>
    /* Má»—i dĂ²ng chuyĂªn Ä‘á» */
    #listChuyenDe li {
      margin-bottom: 5px;
      line-height: 1.5;
      padding-bottom: 2px;
      border-bottom: 1px dotted #ddd;
      color: #3a0ca3;
    }

    /* Má»¥c cĂ³ danh sĂ¡ch con */
    #listChuyenDe li:has(> ul) {
      position: relative;
      padding-left: 16px;
    }

    /* Dáº¥u đŸ”¹ cho má»¥c cĂ³ con */
    #listChuyenDe li:has(> ul)::before {
      content: "đŸ”¹";
      position: absolute;
      left: 0;
      top: 2px;
      font-size: 12px;
      color: #6a0dad;
    }

    /* CĂ¡c cáº¥p con lĂ¹i nháº¹ */
    #listChuyenDe li ul {
      margin-left: 12px;
      border-left: 1px dotted #ccc;
      padding-left: 10px;
    }
  </style>
`;

sidebar.appendChild(chuyenDeBox);

// âœ… ThĂªm pháº§n đŸ“˜ CĂCH Cá»¤C (ngay dÆ°á»›i CHUYĂN Äá»€)
const cachCucBox = document.createElement("div");
cachCucBox.id = "cachCucBox";
cachCucBox.innerHTML = `
  <hr style="border:none; border-top:1px solid #ccc; margin:12px 0;">
  <h3 id="titleCachCuc" style="text-align:center; color:#5a189a; cursor:pointer;">đŸ“˜ CĂCH Cá»¤C</h3>

  <div id="cachCucPanel" style="padding:6px; position:relative;">
    <div id="listCachCuc" style="max-height:250px;overflow-y:auto;padding-left:5px;font-size:14px; position:relative;"></div>
    <button id="btnAddCachCuc" style="margin-top:6px;background:#7b2cbf;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">â• ThĂªm CĂ¡ch Cá»¥c</button>
  </div>

  <!-- Popup thĂªm má»›i -->
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
       width:800px !important;      /* â­ cá»‘ Ä‘á»‹nh thá»±c sá»± */
       height:500px !important;     /* â­ cá»‘ Ä‘á»‹nh thá»±c sá»± */
       overflow-y:auto;
       box-shadow:0 6px 22px rgba(0,0,0,0.3);
     ">


      <h3 style="margin-top:0;">đŸª¶ ThĂªm CĂ¡ch Cá»¥c má»›i</h3>

      <label>TĂªn CĂ¡ch Cá»¥c:</label><br>
      <input class="cc-ten-input"
             style="width:100%;padding:5px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;">

      <div id="dieuKienContainer"></div>

      <button id="btnAddDieuKien"
              style="margin-top:8px;background:#eee;padding:4px 8px;border-radius:4px;cursor:pointer;">
              â• ThĂªm Äiá»u Kiá»‡n
      </button>

      <div style="margin-top:12px;text-align:right;">
        <button id="btnSaveCachCuc"
                style="background:#5a189a;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">
                LÆ°u
        </button>
        <button id="btnCloseCachCuc"
                style="background:#888;color:#fff;border:none;border-radius:6px;padding:6px 12px;margin-left:5px;cursor:pointer;">
                ÄĂ³ng
        </button>
      </div>
    </div>

  </div>
`;
sidebar.appendChild(cachCucBox);
// đŸ‘‰ DI CHUYá»‚N POPUP RA NGOĂ€I SIDEBAR Äá»‚ KHĂ”NG Bá» CHE
const popup = document.getElementById("popupCachCuc");
document.body.appendChild(popup);


// âœ… CĂ¡ch Cá»¥c: sáº½ Ä‘Æ°á»£c náº¡p tá»« IndexedDB (fallback localStorage)
window.CACH_CUC_DATA = [];













// đŸ€ KĂ­ch hoáº¡t render & nĂºt thĂªm
setTimeout(() => {
  const btnAdd = document.getElementById("btnAddChuyenDe");
  if (btnAdd) btnAdd.onclick = window.themChuyenDe;

  const btnEditToggle = document.getElementById("btnToggleEdit");
  if (btnEditToggle) btnEditToggle.onclick = toggleEditMode;

  renderChuyenDe(false);

  // đŸ”¹ Khi báº¥m vĂ o tiĂªu Ä‘á» "đŸ“˜ CHUYĂN Äá»€" â†’ thu gá»n toĂ n bá»™ cĂ¢y
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

// đŸ§© Äá»«ng quĂªn Ä‘Ă³ng ngoáº·c káº¿t thĂºc hĂ m renderSidebar
};









// =====================================================
// đŸ¯ Káº¾T Ná»I Sá»° KIá»†N (CLICK, Äá»”I TĂN, DRAG DROP)
// =====================================================
function attachSidebarEvents() {
  // â™ï¸ XĂ³a sá»± kiá»‡n cÅ©
  document.querySelectorAll("#sidebarTraCuu li").forEach(li => {
    li.replaceWith(li.cloneNode(true));
  });

  // đŸ¯ Gáº¯n láº¡i sá»± kiá»‡n CHá»ˆ CHO cĂ¡c sao tháº­t (li cĂ³ data-sao)
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


    // đŸ§² drag drop
    li.addEventListener("dragstart", e => {
      e.stopPropagation();
      e.dataTransfer.setData("text/plain", li.dataset.sao);
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
  });

  // đŸ§­ Xá»­ lĂ½ drop danh sĂ¡ch
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

  // đŸ”¹ Toggle nhĂ³m con (Ä‘áº£m báº£o má»Ÿ ra Tiá»ƒu Tinh hoáº·c Lá»¥c CĂ¡t / Lá»¥c SĂ¡t)
  document.querySelectorAll("#sidebarTraCuu .sub-title").forEach(el => {
    el.addEventListener("click", e => {
      e.stopPropagation();
      const ul = el.nextElementSibling;
      if (ul) ul.style.display = ul.style.display === "none" ? "block" : "none";
    });
  });
}

// =====================================================
// đŸ” HĂ€M Há»– TRá»¢: tĂ¬m key trong SAO_DATA theo tĂªn hiá»ƒn thá»‹
// =====================================================
function timKeySao(ten) {
  if (!window.SAO_DATA) return null;
  ten = __norm(ten);

  const match = Object.keys(SAO_DATA).find(k => {
    const sao = SAO_DATA[k];
    const tenSao = sao?.short?.ten ? __norm(sao.short.ten) : "";


    // âœ… chá»‰ khá»›p chĂ­nh xĂ¡c
    return tenSao === ten || k.toLowerCase() === ten;
  });

  return match || null;
}

window.moPopupSao_Ten = moPopupSao_Ten;

// TrÆ°á»ng há»£p chÆ°a cĂ³ dá»¯ liá»‡u trong SAO_DATA
function moPopupSao_Ten(ten) {
  // â ï¸ Láº¥y vá»‹ trĂ­ cung hiá»‡n táº¡i tá»« DOM náº¿u chÆ°a cĂ³
  if (!window.currentCung) {
    const activeStar = document.querySelector(`[data-sao*="${ten}"]`);
    if (activeStar) {
      const cungEl = activeStar.closest("[id^='cell']"); // cell11, cell12,...
      if (cungEl) {
        const idx = parseInt(cungEl.id.replace("cell", ""), 10);
        const VI_TRI_CUNG = ["", "TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];
        window.currentCung = VI_TRI_CUNG[idx] || null;
      }
    }
  }

  // LuĂ´n set currentSao
  window.currentSao = ten;

  // render Tab2 náº¿u popup Ä‘Ă£ má»Ÿ
  renderTab2(ten);

  // Pháº§n code cÅ©
  renderBangCungChuc(window.currentCung); // KHĂ”NG truyá»n "ten" vĂ o Ä‘Ă¢y ná»¯a


  const box = document.getElementById("popupThongTin");

  // Náº¿u popupTenSao chÆ°a tá»“n táº¡i thĂ¬ táº¡o má»›i
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

  box.innerHTML = `<p style="text-align:center;"><i>ChÆ°a cĂ³ mĂ´ táº£ chi tiáº¿t cho sao / cung nĂ y.</i></p>`;
  document.getElementById("saoPopup").style.display = "flex";
  if (typeof setPopupMode === "function") setPopupMode("view");
}

function cleanSaoKey(name) {
  return __norm(
    (name || "").replace(/^(L\.|ÄV\.|N\.|Nh\.|TL\.)\s*/i, "")
  );
}

function renderTab2(sao) {
  const table = document.getElementById("bangCungChuc");
  if (!table) return;

  // =========================
  // 1ï¸âƒ£ Láº¤Y Ná»˜I DUNG THEO SAO
  // =========================
  let data = {};

  if (window.SAO_DATA && sao && SAO_DATA[sao]) {
    if (!SAO_DATA[sao].cungChuc) SAO_DATA[sao].cungChuc = {};
    data = SAO_DATA[sao].cungChuc;
  }

  const CUNG = [
    "Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch",
    "Táº­t Ăch","ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c",
    "Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"
  ];

  // =========================
  // 2ï¸âƒ£ RENDER Báº¢NG Ná»˜I DUNG
  // =========================
  let html = `
    <tr>
      <th rowspan="2" style="width:140px; text-align:center;">Cung</th>
      <th colspan="2" style="text-align:center;">Ă nghÄ©a táº¡i cĂ¡c cung chá»©c</th>
    </tr>
    <tr>
      <th style="text-align:center; color:green;">CĂ¡t</th>
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
// 3ï¸âƒ£ HIGHLIGHT TAB 2 (Sao thÆ°á»ng hoáº·c Tuáº§n/Triá»‡t)
// =========================
try {
  const map = window.dataGlobal?.cungChucMap; // VĂ­ dá»¥: { "TĂ½":"PhĂºc Äá»©c", "Sá»­u":"Phá»¥ Máº«u", ... }
  if (!map) return;

  // XĂ³a highlight cÅ©
  document.querySelectorAll("#bangCungChuc tr")
    .forEach(tr => tr.classList.remove("cung-highlight"));

  const CHUC_CANON = {
    "Má»†NH": "Má»‡nh",
    "HUYNH Äá»†": "Huynh Äá»‡",
    "PHU THĂ": "Phu ThĂª",
    "Tá»¬ Tá»¨C": "Tá»­ Tá»©c",
    "TĂ€I Báº CH": "TĂ i Báº¡ch",
    "Táº¬T ĂCH": "Táº­t Ăch",
    "THIĂN DI": "ThiĂªn Di",
    "NĂ” Bá»˜C": "NĂ´ Bá»™c",
    "QUAN Lá»˜C": "Quan Lá»™c",
    "ÄIá»€N TRáº CH": "Äiá»n Tráº¡ch",
    "PHĂC Äá»¨C": "PhĂºc Äá»©c",
    "PHá»¤ MáºªU": "Phá»¥ Máº«u"
  };

  // Danh sĂ¡ch sáº½ highlight (cĂ³ thá»ƒ 1 hoáº·c 2 cung)
  const list = [];

  // đŸŸ¢ TrÆ°á»ng há»£p sao bĂ¬nh thÆ°á»ng
  if (window.currentCung) {
    const raw = map[window.currentCung]; // vĂ­ dá»¥: TĂ½ â†’ PhĂºc Äá»©c
    if (raw) list.push(raw);
  }

  // đŸŸ£ TrÆ°á»ng há»£p Tuáº§n / Triá»‡t â†’ cháº·n 2 cung
  if (window.blockedCung?.length === 2) {
    const [c1, c2] = window.blockedCung;
    if (map[c1]) list.push(map[c1]);
    if (map[c2]) list.push(map[c2]);
  }

  // KhĂ´ng cĂ³ gĂ¬ Ä‘á»ƒ tĂ´ sĂ¡ng
  if (!list.length) return;

  // đŸ”¥ Highlight cĂ¡c dĂ²ng tÆ°Æ¡ng á»©ng
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
    "HĂ³a Lá»™c",
    "HĂ³a Quyá»n",
    "HĂ³a Khoa",
    "HĂ³a Ká»µ"
  ];

  let html = `
  <tr>
    <th rowspan="2" style="width:140px; text-align:center;">Tá»© HĂ³a</th>
    <th colspan="2" style="text-align:center;">Ă nghÄ©a</th>
  </tr>
  <tr>
    <th style="text-align:center; color:green;">CĂ¡t</th>
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
// đŸ’¾ LÆ°u vĂ  phá»¥c há»“i cĂ¢y (phiĂªn báº£n chuáº©n, khĂ´ng phĂ¡ cáº¥u trĂºc Tiá»ƒu Tinh)
// =====================================================
function updateDanhMucFromDOM() {
  const newMap = {};

  document.querySelectorAll("#sidebarTraCuu .group").forEach(div => {
    const groupTitle = div.querySelector(".group-title")?.innerText || "";
    const subgroupEls = div.querySelectorAll(":scope > ul.subgroup-list > li.subgroup");

    // Náº¿u cĂ³ nhĂ³m con (nhÆ° Trung Tinh, Tiá»ƒu Tinh)
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
    // Náº¿u chá»‰ cĂ³ 1 danh sĂ¡ch pháº³ng (nhÆ° ChĂ­nh Tinh, Tá»© HĂ³a, Cung...)
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
// đŸ’¾ LÆ°u tráº¡ng thĂ¡i sidebar (táº¡m: chá»‰ cáº­p nháº­t danh má»¥c)
// =====================================================
function saveSidebarState() {
  try {
    updateDanhMucFromDOM();
    console.log("đŸ’¾ Sidebar state saved.");
  } catch (err) {
    console.warn("â ï¸ KhĂ´ng thá»ƒ lÆ°u sidebar state:", err);
  }
}

// đŸ§© HĂ m táº¡o ID duy nháº¥t cho má»—i chuyĂªn Ä‘á» hoáº·c má»¥c con
function generateId() {
  return 'cd_' + Math.random().toString(36).substr(2, 9);
}


// =====================================================
// â• ThĂªm chuyĂªn Ä‘á» cáº¥p 1 (tá»± Ä‘Ă¡nh sá»‘ La MĂ£)
// =====================================================
function themChuyenDe() {
  const name = prompt("Nháº­p tĂªn chuyĂªn Ä‘á» má»›i:");
  if (!name) return;

  // TrĂ¡nh trĂ¹ng tĂªn cáº¥p 1 (so sĂ¡nh pháº§n tĂªn sau tiá»n tá»‘ La MĂ£)
  const lowerName = name.trim().toLowerCase();

  const trungTen = Object.keys(CHUYEN_DE_DATA).some(key => {
    // Chá»‰ loáº¡i bá» pháº§n tiá»n tá»‘ La MĂ£ (I., II., III...) hoáº·c sá»‘ thá»© tá»± cĂ³ dáº¥u cháº¥m
    const tenGoc = key.replace(/^[IVXLCDM]+\.\s*|^\d+\.\s*/i, "").trim().toLowerCase();
    return tenGoc === lowerName;
  });

  if (trungTen) {
    alert("TĂªn chuyĂªn Ä‘á» nĂ y Ä‘Ă£ tá»“n táº¡i!");
    return;
  }



  // đŸ§® ÄĂ¡nh sá»‘ La MĂ£ theo thá»© tá»± hiá»‡n cĂ³
  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const index = Object.keys(CHUYEN_DE_DATA).length; // báº¯t Ä‘áº§u tá»« 0
  const prefix = romanNumerals[index] || (index + 1);
  const fullName = `${prefix}. ${name}`;

// â• ThĂªm vĂ o dá»¯ liá»‡u (kĂ¨m ID)
CHUYEN_DE_DATA[fullName] = { id: generateId(), noiDung: "", children: {} };
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));


  // đŸ” Render láº¡i cĂ¢y mĂ  giá»¯ tráº¡ng thĂ¡i
  renderChuyenDe(false);
}



// =====================================================
// đŸ“˜ CĂ‚Y CHUYĂN Äá»€ ÄA Cáº¤P (tá»‘i Ä‘a 5 cáº¥p, cĂ³ â–¸/â–¾, lÆ°u localStorage)
// =====================================================

// â™ï¸ Dá»¯ liá»‡u khá»Ÿi táº¡o (phiĂªn báº£n an toĂ n)
let chuyenDeRaw = localStorage.getItem("CHUYEN_DE_DATA");
try {
  if (typeof chuyenDeRaw === "string" && chuyenDeRaw.trim().startsWith("{")) {
    window.CHUYEN_DE_DATA = JSON.parse(chuyenDeRaw);
  } else if (typeof chuyenDeRaw === "object") {
    // ÄĂ£ lĂ  object tháº­t â†’ gĂ¡n tháº³ng
    window.CHUYEN_DE_DATA = chuyenDeRaw;
  } else {
    // Náº¿u chÆ°a cĂ³ trong localStorage â†’ táº¡o máº·c Ä‘á»‹nh
    window.CHUYEN_DE_DATA = {
      "I. An Sao": { noiDung: "", children: {} },
      "II. VĂ´ ChĂ­nh Diá»‡u": { noiDung: "", children: {} },
      "III. Luáº­n Váº­n": { noiDung: "", children: {} },
      "IV. TĂ¬nh DuyĂªn": { noiDung: "", children: {} }
    };
  }
} catch (err) {
  console.warn("â ï¸ Lá»—i parse CHUYEN_DE_DATA:", err);
  window.CHUYEN_DE_DATA = {
    "I. An Sao": { noiDung: "", children: {} },
    "II. VĂ´ ChĂ­nh Diá»‡u": { noiDung: "", children: {} },
    "III. Luáº­n Váº­n": { noiDung: "", children: {} },
    "IV. TĂ¬nh DuyĂªn": { noiDung: "", children: {} }
  };
}

// đŸ§© Phá»¥c há»“i dá»¯ liá»‡u náº¿u báº£n cÅ© bá»‹ pháº³ng
for (const key in CHUYEN_DE_DATA) {
  const item = CHUYEN_DE_DATA[key];
  if (!item || typeof item !== "object" || !("children" in item)) {
    CHUYEN_DE_DATA[key] = { noiDung: "", children: {} };
  }
}

// đŸ”¹ LÆ°u toĂ n bá»™ cĂ¢y
function luuChuyenDe() {
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

}

// =====================================================
// âœï¸ Äá»”I TĂN Má»¤C CHUYĂN Äá»€ (giá»¯ nguyĂªn id & dá»¯ liá»‡u)
// =====================================================
function doiTenMucChuyenDe(ten, data) {
  if (!ten || !data) return;

  // đŸ” TĂ¬m node hiá»‡n táº¡i theo tĂªn
  const node = findNodeByName(data, ten);
  if (!node) return alert("KhĂ´ng tĂ¬m tháº¥y chuyĂªn Ä‘á»: " + ten);

  // âœï¸ Há»i tĂªn má»›i
  const tenGoc = ten.replace(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|â€¢\s*)/i, "").trim();
  const newNameOnly = prompt("Äá»•i tĂªn má»¥c:", tenGoc);
  if (!newNameOnly || newNameOnly === tenGoc) return;

  // đŸ·ï¸ Giá»¯ nguyĂªn prefix (I., 1., a., â€¢ â€¦)
  const prefix = ten.match(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|â€¢\s*)/i)?.[0] || "";
  const newNameFull = (prefix + newNameOnly).trim();

  // đŸ”„ Cáº­p nháº­t tĂªn trong dá»¯ liá»‡u
  renameKeyInTree(data, ten, newNameFull);

  // đŸ’¾ LÆ°u láº¡i
  luuChuyenDe();
  renderChuyenDe(false);
  setTimeout(() => saveNewOrder(), 100);
}

// đŸ” TĂ¬m node theo tĂªn (duyá»‡t toĂ n cĂ¢y)
function findNodeByName(data, name) {
  for (const key in data) {
    if (key === name) return data[key];
    const found = findNodeByName(data[key].children || {}, name);
    if (found) return found;
  }
  return null;
}

// đŸ”„ Äá»•i key nhÆ°ng giá»¯ nguyĂªn id & children
function renameKeyInTree(data, oldKey, newKey) {
  if (data[oldKey]) {
    data[newKey] = data[oldKey]; // giá»¯ nguyĂªn id, noiDung, children
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
  if (!nodeInfo) return alert("KhĂ´ng tĂ¬m tháº¥y má»¥c cĂ³ id: " + id);

  const { key, parentData, node } = nodeInfo;
  const ten = key;

  const tenGoc = ten.replace(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|â€¢\s*)/i, "").trim();
  const newNameOnly = prompt("Äá»•i tĂªn má»¥c:", tenGoc);
  if (!newNameOnly || newNameOnly === tenGoc) return;

  const prefix = ten.match(/^(?:[IVXLCDM]+\.\s*|\d+(?:\.\d+)*\.\s*|[a-z]\.\s+|â€¢\s*)/i)?.[0] || "";
  const newNameFull = (prefix + newNameOnly).trim();

  // Cáº­p nháº­t key trong parentData (khĂ´ng máº¥t id)
  delete parentData[key];
  parentData[newNameFull] = node;

  luuChuyenDe();
  renderChuyenDe(false);
  setTimeout(() => saveNewOrder(), 100);
}








// â• ThĂªm má»¥c con tá»± Ä‘Ă¡nh sá»‘ theo cáº¥p
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
  if (!parent) return alert("KhĂ´ng tĂ¬m tháº¥y chuyĂªn Ä‘á» cha: " + tenCha);

  const name = prompt("Nháº­p tĂªn má»¥c con má»›i:");
  if (!name) return;

  // đŸ”¹ Äáº£m báº£o children lĂ  máº£ng
  if (!Array.isArray(parent.children)) parent.children = [];

  // đŸ”¹ Äáº¿m thá»© tá»± con hiá»‡n cĂ³
  const count = parent.children.length + 1;

  // đŸ”¹ XĂ¡c Ä‘á»‹nh prefix theo cáº¥p
  let prefix = "";
  if (/^[IVXLCDM]+\./i.test(tenCha)) {
    prefix = `${count}. `;
  } else if (/^\d+(\.\d+)*\./.test(tenCha)) {
    const base = tenCha.match(/^\d+(?:\.\d+)*/)[0];
    prefix = `${base}.${count}. `;
  } else if (/^[a-z]\./i.test(tenCha)) {
    prefix = String.fromCharCode(96 + count) + ". ";
  } else if (/^â€¢/.test(tenCha)) {
    prefix = "â€¢ ";
  }

  const fullName = `${prefix}${name.trim()}`;

  // â ï¸ TrĂ¡nh trĂ¹ng tĂªn
  if (parent.children.some(c => c.key === fullName)) {
    alert("TĂªn má»¥c con nĂ y Ä‘Ă£ tá»“n táº¡i!");
    return;
  }

  // â• ThĂªm node má»›i
  const newId = generateId();
  const newNode = { id: newId, key: fullName, noiDung: "", children: [] };
  parent.children.push(newNode);

  console.log("đŸ§© Má»¥c con má»›i:", newNode);

  // đŸ’¾ LÆ°u
  localStorage.setItem("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
  saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

  // âœ… Render láº¡i toĂ n bá»™ cĂ¢y
  const container = document.getElementById("listChuyenDe");
  if (container) container.innerHTML = "";
  renderChuyenDe(false);

  setTimeout(() => {
    if (typeof saveNewOrder === "function") {
      console.log("đŸ” Äang Ä‘Ă¡nh láº¡i sá»‘ thá»© tá»±...");
      saveNewOrder();
      const container2 = document.getElementById("listChuyenDe");
      if (container2) {
        container2.innerHTML = "";
        renderChuyenDe(false);
      }
      saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));
      console.log(`âœ… ÄĂ£ thĂªm "${fullName}" vĂ o "${tenCha}" vĂ  cáº­p nháº­t sá»‘.`);
    }
  }, 100);
}








// =====================================================
// đŸ“˜ Render cĂ¢y chuyĂªn Ä‘á» Ä‘a cáº¥p (5 cáº¥p) â€“ Ä‘Ă¡nh sá»‘ theo há»‡ Aâ€“Iâ€“1â€“a
// =====================================================
function renderChuyenDeRecursive(data, cap = 1) {
  const ul = document.createElement("ul");
  ul.className = "cd-level";
  ul.setAttribute("data-level", cap);

  // đŸ”¢ Báº£ng kĂ½ hiá»‡u cho tá»«ng cáº¥p
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const smallLetters = "abcdefghijklmnopqrstuvwxyz".split("");

  Object.entries(data).forEach(([ten, obj], index) => {
    const li = document.createElement("li");
    li.className = "cd-item";

    // âœ… LuĂ´n Ä‘áº£m báº£o node cĂ³ id (náº¿u chÆ°a cĂ³ thĂ¬ cáº¥p má»›i)
    if (!obj.id) obj.id = generateId();
    li.dataset.id = obj.id;

    const hasChildren = obj.children && Object.keys(obj.children).length > 0;

    // đŸ§® Táº¡o prefix theo cáº¥p
    let prefix = "";
    if (cap === 1) prefix = letters[index] ? `${letters[index]}. ` : `${index + 1}. `;
else if (cap === 2) prefix = `${toRoman(index + 1)}. `;
    else if (cap === 3) prefix = `${index + 1}. `;
    else if (cap === 4) prefix = smallLetters[index] ? `${smallLetters[index]}. ` : `${index + 1}. `;
    else prefix = "";

    // đŸ”¹ TĂªn hiá»ƒn thá»‹
    const displayName = prefix + ten.replace(/^[A-Z]+\.\s*|^[IVXLCDM]+\.\s*|^\d+\.\s*|^[a-z]+\.\s*/i, "").trim();

    // đŸ”¹ Táº¡o pháº§n tá»­ tĂªn
    const nameSpan = document.createElement("span");
    nameSpan.textContent = displayName;
    nameSpan.className = "cd-name";

    // đŸ‘‰ Cáº¥p 2â€“5: click má»Ÿ popup
    if (cap >= 2) {
      nameSpan.onclick = (e) => {
        e.stopPropagation();
        const id = obj.id || li.dataset.id;
        moPopupChuyenDeTheoId(id, ten);
      };
    }

    // đŸ”¹ NhĂ³m nĂºt hĂ nh Ä‘á»™ng
    const actions = document.createElement("div");
    actions.className = "cd-actions";

    // â• ThĂªm má»¥c con
    const addBtn = document.createElement("button");
    addBtn.innerHTML = "â•";
    addBtn.title = "ThĂªm má»¥c con";
    addBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      themMucConTheoId(id);
    };
    if (cap >= 5) addBtn.style.display = "none"; // khĂ´ng thĂªm con á»Ÿ cáº¥p 5
    actions.appendChild(addBtn);

    // âœï¸ Äá»•i tĂªn
    const editBtn = document.createElement("button");
    editBtn.innerHTML = "âœï¸";
    editBtn.title = "Äá»•i tĂªn";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      doiTenMucChuyenDeTheoId(id);
    };
    actions.appendChild(editBtn);

    // đŸ—‘ï¸ XĂ³a
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "đŸ—‘ï¸";
    delBtn.title = "XĂ³a";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const id = obj.id || li.dataset.id;
      if (confirm("XĂ³a má»¥c nĂ y?")) {
        xoaMucTheoId(id);
      }
    };
    actions.appendChild(delBtn);

    // đŸ”¹ HĂ ng chĂ­nh
    const row = document.createElement("div");
    row.className = "cd-row";
    const left = document.createElement("div");
    left.className = "cd-left";
    left.appendChild(nameSpan);
    row.appendChild(left);
    row.appendChild(actions);
    li.appendChild(row);

    // đŸ”¹ Cáº¥p con (gá»i Ä‘á»‡ quy)
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
// âœï¸ NĂºt báº­t/táº¯t cháº¿ Ä‘á»™ "Sá»­a"
// =====================================================
let editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode", editMode);

  const btn = document.getElementById("btnToggleEdit");
  if (!btn) return;

  if (editMode) {
    btn.classList.add("active");
    btn.textContent = "âœ… HoĂ n táº¥t";
  } else {
    btn.classList.remove("active");
    btn.textContent = "âœï¸ Sá»­a";
  }
}


// =====================================================
// đŸ–±ï¸ DRAG & DROP má»i cáº¥p (1 â†’ 5) â€” á»•n Ä‘á»‹nh, khĂ´ng láº«n cáº¥p
// =====================================================
function enableDragDrop() {
  const root = document.getElementById("listChuyenDe");
  if (!root) return;

  // láº¥y toĂ n bá»™ li trong má»i cáº¥p
  const allLis = root.querySelectorAll("li");

  allLis.forEach(li => {
    li.draggable = true;

    // khi báº¯t Ä‘áº§u kĂ©o
    li.addEventListener("dragstart", e => {
      e.stopPropagation(); // âœ… ngÄƒn cháº·n cha báº¯t sá»± kiá»‡n
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", getItemPath(li));
      li.classList.add("dragging");
    });

    // khi tháº£ ra
    li.addEventListener("dragend", e => {
      e.stopPropagation();
      li.classList.remove("dragging");
    });

    // khi kĂ©o qua má»™t pháº§n tá»­ khĂ¡c
    li.addEventListener("dragover", e => {
      e.preventDefault();
      e.stopPropagation();

      const dragging = document.querySelector(".dragging");
      if (!dragging) return;

      // đŸ« khĂ´ng cho kĂ©o cha vĂ o trong con cá»§a chĂ­nh nĂ³
      if (dragging.contains(li)) return;

      // chá»‰ cho phĂ©p hoĂ¡n Ä‘á»•i trong cĂ¹ng cáº¥p (cĂ¹ng parent)
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

    // khi tháº£ chuá»™t ra
    li.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();
      saveNewOrder && saveNewOrder();
    });
  });
}

// đŸ“Láº¥y Ä‘Æ°á»ng dáº«n Ä‘áº§y Ä‘á»§ (VD: "I. TĂ¬nh duyĂªn / 1. C1 / 1.2. Bala")
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



// đŸ” TĂ¬m dá»¯ liá»‡u cÅ© theo ID duy nháº¥t
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
// đŸ’¾ LÆ°u láº¡i thá»© tá»± má»›i sau khi kĂ©oâ€“tháº£ (cáº­p nháº­t láº¡i sá»‘ thá»© tá»± La MĂ£)
// =====================================================
// đŸ” Trá»£ lĂ½ tĂ¬m dá»¯ liá»‡u cÅ© theo tĂªn (vĂ¬ key Ä‘á»•i)
function getDataByName(data, name) {
  for (const key in data) {
    if (key === name) return data[key];
    const found = getDataByName(data[key].children || {}, name);
    if (found) return found;
  }
  return null;
}

// âœ… HĂ m chuyá»ƒn sá»‘ sang chá»¯ sá»‘ La MĂ£ (khĂ´ng giá»›i háº¡n 10)
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
// đŸ’¾ LÆ°u thá»© tá»± má»›i (I, 1, 1.1, a, â€¢) â€“ fix sáº¡ch dáº¥u ".."
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

    // đŸ§® Táº¡o prefix má»›i
    let prefixDisplay = "";
    if (level === 1) prefixDisplay = String.fromCharCode(64 + idx + 1);
else if (level === 2) prefixDisplay = toRoman(idx + 1);
    else if (level === 3) prefixDisplay = `${idx + 1}`;
    else if (level === 4) prefixDisplay = String.fromCharCode(97 + idx);
    else prefixDisplay = "";

    const nameWithoutPrefix = nameEl.textContent
      .replace(/^(?:[A-Z]\.\s*|[IVXLCDM]+\.\s*|\d+\.\s*|[a-z]\.\s+|â€¢\s*)/i, "")
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
// đŸ¨ CSS
// =====================================================
const styleCD = document.createElement("style");
styleCD.innerHTML = `
#listChuyenDe { padding-left: 0; }

/* ============================= */
/* â™ï¸ Bá» Cá»¤C CHUNG CHUYĂN Äá»€ CĂ‚Y */
/* ============================= */

/* Má»—i má»¥c trong cĂ¢y */
.cd-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px dashed #ccc;
  padding: 1px 0;
  margin: 0;
  line-height: 1.2;
}

/* HĂ ng chĂ­nh: tĂªn + cĂ¡c nĂºt */
.cd-item > .cd-row {
  display: flex;
  justify-content: space-between;   /* đŸ‘ˆ tĂ¡ch trĂ¡i â€“ pháº£i */
  align-items: center;
  margin: 0;
  padding-left: 0;
}


/* Pháº§n trĂ¡i (tĂªn + mÅ©i tĂªn) */
.cd-left {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: nowrap;
}

/* TĂªn chuyĂªn Ä‘á» */
.cd-name {
  cursor: pointer;
  font-weight: 600;
  color: #7a2ac2;
  font-size: 15px;
  line-height: 1.2;
}

/* MÅ©i tĂªn â–¸/â–¾ */
.cd-arrow {
  font-weight: bold;
  color: #7b2cbf;
  user-select: none;
  font-size: 12px;
  cursor: pointer;
  margin-left: 2px;
}
.cd-arrow:hover { color: #3a0ca3; }

/* NhĂ³m nĂºt hĂ nh Ä‘á»™ng (gá»n láº¡i) */
.cd-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}
/* đŸ”¹ KĂ­ch thÆ°á»›c icon nhá» gá»n */
.cd-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 6px; /* đŸ‘ˆ nhá» hÆ¡n 1/2 */
  opacity: 0.6;
  transition: transform 0.2s, opacity 0.2s;
  padding: 0 1px;
}
.cd-actions button:hover {
  opacity: 1;
  transform: scale(1.2);
}


/* đŸ”¹ MĂ u chá»¯ phĂ¢n biá»‡t rĂµ vĂ  Ä‘áº­m theo cáº¥p */
.cd-level[data-level="1"] > .cd-item > .cd-row .cd-name {
  color: #b22222; /* Äá» Ä‘áº­m */
  font-weight: 700;
}

.cd-level[data-level="2"] > .cd-item > .cd-row .cd-name {
  color: #d2691e; /* Cam Ä‘áº­m / nĂ¢u cam */
  font-weight: 700;
}

.cd-level[data-level="3"] > .cd-item > .cd-row .cd-name {
  color: #003366; /* Xanh dÆ°Æ¡ng Ä‘áº­m â€“ navy blue */
  font-weight: 700;
}

.cd-level[data-level="4"] > .cd-item > .cd-row .cd-name {
  color: #006400; /* Xanh lĂ¡ Ä‘áº­m */
  font-weight: 600;
  font-style: italic;
}

.cd-level[data-level="5"] > .cd-item > .cd-row .cd-name {
  color: #000000; /* Äen */
  font-style: italic;
}




/* ============================= */
/* â™ï¸ Cáº¤P CĂ‚Y & THá»¤T DĂ’NG Há»¢P LĂ */
/* ============================= */

/* Cáº¥p gá»‘c (I, II, III...) */
.cd-level {
  list-style: none;
  margin: 0;
  padding-left: 0; /* đŸ‘ˆ khĂ´ng thá»¥t toĂ n bá»™ cĂ¢y */
  border-left: none;
}

/* Cáº¥p con má»›i cĂ³ Ä‘Æ°á»ng thá»¥t vĂ  Ä‘Æ°á»ng káº» */
.cd-item > ul.cd-level {
  padding-left: 2px;   /* đŸ‘ˆ giáº£m thá»¥t Ä‘á»ƒ cĂ¢n */

  border-left: 2px dotted #ddd; /* đŸ‘ˆ chá»‰ váº½ line khi cĂ³ cáº¥p con */
}

/* Khung â€œchÆ°a cĂ³ má»¥c conâ€ */
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

// â™ï¸ Ghi Ä‘Ă¨ má»©c thá»¥t dĂ²ng khi cĂ¢y Ä‘Ă£ load
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
// đŸ’¾ Ghi nhá»› tráº¡ng thĂ¡i má»Ÿ/Ä‘Ă³ng trÆ°á»›c khi render
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

// âœ… KhĂ´i phá»¥c tráº¡ng thĂ¡i sau khi render
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
// đŸ€ Gáº¥p toĂ n bá»™ cĂ¢y (reset táº¥t cáº£ cáº¥p con)
// =====================================================
function collapseAll() {
  // áº¨n toĂ n bá»™ danh sĂ¡ch con á»Ÿ má»i cáº¥p
  document.querySelectorAll("#listChuyenDe ul.cd-level").forEach(ul => {
    ul.style.display = "none";
  });

  // Hiá»ƒn thá»‹ láº¡i Ä‘Ăºng cáº¥p 1 (La MĂ£)
  const rootUl = document.querySelector("#listChuyenDe > ul.cd-level");
  if (rootUl) rootUl.style.display = "block";

  // Chá»‰ hiá»ƒn thá»‹ cĂ¡c má»¥c cáº¥p 1 (I., II., III.)
  rootUl.querySelectorAll(":scope > li > ul.cd-level").forEach(subUl => {
    subUl.style.display = "none";
  });
}


// =====================================================
// đŸ€ Render cĂ¢y chuyĂªn Ä‘á» (giá»¯ tráº¡ng thĂ¡i + gáº¥p cáº¥p con khi load)
// =====================================================
function renderChuyenDe(autoCollapse = false) {
  const list = document.getElementById("listChuyenDe");
  if (!list) return;

  // đŸ’¾ LÆ°u tráº¡ng thĂ¡i hiá»‡n táº¡i
  const expanded = getExpandedPaths();

  list.innerHTML = "";
  list.appendChild(renderChuyenDeRecursive(CHUYEN_DE_DATA, 1));

  // Ăp khĂ³a ngay sau render
  if (typeof toggleChuyenDeEditLock === "function") {
    toggleChuyenDeEditLock(window.isPaidUser && window.isPaidUser());
  }

  // đŸ” Phá»¥c há»“i tráº¡ng thĂ¡i (chá»‰ náº¿u khĂ´ng gáº¥p toĂ n bá»™)
  if (!autoCollapse) restoreExpandedPaths(expanded);

  // âœ… Náº¿u autoCollapse: chá»‰ giá»¯ cáº¥p 1, gáº¥p toĂ n bá»™ cáº¥p 2 trá»Ÿ xuá»‘ng
  if (autoCollapse) {
    collapseAll();
  }

  // đŸŸ£ KĂ­ch hoáº¡t kĂ©o tháº£ sau khi render xong
  enableDragDrop();
}


// =====================================================
// đŸ”„ Khá»Ÿi Ä‘á»™ng (náº¡p dá»¯ liá»‡u tá»« IndexedDB trÆ°á»›c khi render)
// =====================================================
window.addEventListener("DOMContentLoaded", () => {

  // đŸ§  Náº¡p SAO_DATA trÆ°á»›c
  loadFromIndexedDB("SAO_DATA", data => {
    window.SAO_DATA = data ? JSON.parse(data) : JSON.parse(localStorage.getItem("SAO_DATA") || "{}");
    console.log("âœ… Náº¡p SAO_DATA tá»« IndexedDB (hoáº·c localStorage náº¿u trá»‘ng)");

    // đŸ§  Náº¡p ChuyĂªn Äá» Data
    loadFromIndexedDB("CHUYEN_DE_DATA", d => {
      window.CHUYEN_DE_DATA = d ? JSON.parse(d) : JSON.parse(localStorage.getItem("CHUYEN_DE_DATA") || "{}");
    });

    // đŸ§  Náº¡p Cáº¥u trĂºc cĂ¢y chuyĂªn Ä‘á»
    loadFromIndexedDB("CHUYEN_DE_CAY", d => {
      window.CHUYEN_DE_CAY = d ? JSON.parse(d) : JSON.parse(localStorage.getItem("CHUYEN_DE_CAY") || "{}");
    });

    // âœ… Sau khi Ä‘Ă£ cĂ³ dá»¯ liá»‡u â†’ render giao diá»‡n
    renderSidebar?.();
    renderChuyenDe?.(true);

    // đŸ”¹ NĂºt â€œThĂªm chuyĂªn Ä‘á»â€
    const addBtn = document.getElementById("btnAddChuyenDe");
    if (addBtn) addBtn.onclick = () => themChuyenDe();

    // đŸ”¹ Báº¥m tiĂªu Ä‘á» â€œCHUYĂN Äá»€â€ â†’ gáº¥p toĂ n bá»™
    const titleEl = Array.from(document.querySelectorAll("h2, h3, .titleChuyenDe, .cd-title"))
      .find(el => el.textContent.includes("CHUYĂN Äá»€"));
    if (titleEl) {
      titleEl.style.cursor = "pointer";
      titleEl.addEventListener("click", () => collapseAll());
    }

  }); // <- háº¿t callback IndexedDB
});

// =====================================================
// đŸ§­ KIá»‚M TRA NGUá»’N Dá»® LIá»†U & DUNG LÆ¯á»¢NG SAO_DATA (phiĂªn báº£n IndexedDB)
// =====================================================
function kiemTraNguonDuLieu() {
  try {
    loadFromIndexedDB("SAO_DATA", data => {
      let source = "âª KhĂ´ng xĂ¡c Ä‘á»‹nh";
      let sizeMB = 0;

      if (data) {
        // âœ… CĂ³ dá»¯ liá»‡u trong IndexedDB
        window.SAO_DATA = JSON.parse(data);
        source = "đŸ’¾ IndexedDB";
        sizeMB = (new Blob([data]).size / (1024 * 1024)).toFixed(2);
      } else {
        // â Náº¿u khĂ´ng cĂ³, thá»­ láº¥y tá»« localStorage (cho tÆ°Æ¡ng thĂ­ch cÅ©)
        const saved = localStorage.getItem("SAO_DATA");
        if (saved) {
          window.SAO_DATA = JSON.parse(saved);
          source = "đŸ“¦ localStorage (táº¡m)";
          sizeMB = (new Blob([saved]).size / (1024 * 1024)).toFixed(2);
        }
      }

      console.log(`đŸ§© Nguá»“n dá»¯ liá»‡u hiá»‡n táº¡i: ${source} (${sizeMB} MB)`);

      // â ï¸ Cáº£nh bĂ¡o náº¿u váº«n cĂ²n á»Ÿ localStorage vĂ  quĂ¡ 4.5MB
      if (source.includes("localStorage") && sizeMB > 4.5) {
        console.warn(`â ï¸ Dung lÆ°á»£ng ${sizeMB} MB cĂ³ thá»ƒ vÆ°á»£t giá»›i háº¡n localStorage â€” nĂªn xuáº¥t ra file backup!`);
      }

      // đŸ§­ Náº¿u cĂ³ cá» vá»«a nháº­p tá»« file
      const savedFileFlag = localStorage.getItem("SAO_DATA_IMPORTED_FROM_FILE");
      if (savedFileFlag) {
        console.log("đŸ“¥ Dá»¯ liá»‡u vá»«a Ä‘Æ°á»£c nháº­p tá»« file JSON, Ä‘Ă£ ghi vĂ o IndexedDB.");
        localStorage.removeItem("SAO_DATA_IMPORTED_FROM_FILE");
      }
    });
  } catch (err) {
    console.error("âŒ Lá»—i khi kiá»ƒm tra nguá»“n dá»¯ liá»‡u:", err);
  }
}

// Gá»i tá»± Ä‘á»™ng khi load xong trang
window.addEventListener("DOMContentLoaded", kiemTraNguonDuLieu);


// =====================================================
// đŸ” Tá»° KHĂ”I PHá»¤C Dá»® LIá»†U Tá»ª FILE JSON ÄĂƒ Náº P Láº¦N TRÆ¯á»C
// =====================================================
(function autoReloadLastJSON() {
  const lastFile = localStorage.getItem("LAST_JSON_FILE_CONTENT");
  if (!lastFile) {
    console.log("â„¹ï¸ KhĂ´ng cĂ³ file JSON nĂ o Ä‘Æ°á»£c lÆ°u tá»« láº§n trÆ°á»›c.");
    return;
  }

  try {
    const obj = JSON.parse(lastFile);
    console.log("đŸ“‚ Tá»± Ä‘á»™ng khĂ´i phá»¥c dá»¯ liá»‡u tá»« file JSON láº§n trÆ°á»›c:", obj);

    // âœ… Láº¥y pháº§n SAO_DATA (hoáº·c toĂ n bá»™ náº¿u lĂ  object gá»‘c)
    const data = obj.SAO_DATA || obj;
    window.SAO_DATA = data;

    // đŸ’¾ LÆ°u vĂ o IndexedDB thay vĂ¬ localStorage (an toĂ n, khĂ´ng giá»›i háº¡n)
    saveToIndexedDB("SAO_DATA", JSON.stringify(data));

    console.log("âœ… Auto reload SAO_DATA thĂ nh cĂ´ng (Ä‘Ă£ ghi vĂ o IndexedDB).");
  } catch (e) {
    console.warn("â ï¸ Lá»—i khi Ä‘á»c láº¡i JSON Ä‘Ă£ lÆ°u:", e);
  }
})();



// =======================================================
// đŸ’¾ HĂ€M LÆ¯U / Náº P Dá»® LIá»†U Báº°NG INDEXEDDB (DUNG LÆ¯á»¢NG Lá»N)
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
  req.onerror = e => console.warn("â ï¸ Lá»—i IndexedDB (save):", e);
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
  req.onerror = e => console.warn("â ï¸ Lá»—i IndexedDB (load):", e);
}



// =====================================================
// đŸŒŸ Náº P Dá»® LIá»†U SAO (Æ°u tiĂªn IndexedDB, fallback localStorage)
// =====================================================
window.addEventListener("DOMContentLoaded", function () {
  // đŸ§  Thá»­ náº¡p SAO_DATA tá»« IndexedDB trÆ°á»›c
  loadFromIndexedDB("SAO_DATA", data => {
    try {
      if (data) {
        window.SAO_DATA = JSON.parse(data);
        console.log("âœ… ÄĂ£ náº¡p SAO_DATA tá»« IndexedDB.");
      } else {
        // Náº¿u chÆ°a cĂ³ thĂ¬ fallback sang localStorage
        const savedLocal = localStorage.getItem("SAO_DATA");
        if (typeof savedLocal === "string" && savedLocal.trim().startsWith("{")) {
          window.SAO_DATA = JSON.parse(savedLocal);
          console.log("đŸ“¦ Náº¡p SAO_DATA tá»« localStorage (táº¡m).");
        } else {
          window.SAO_DATA = {};
          console.log("âª ChÆ°a cĂ³ SAO_DATA há»£p lá»‡, khá»Ÿi táº¡o rá»—ng.");
        }
      }
    } catch (err) {
      console.warn("â ï¸ Lá»—i parse SAO_DATA:", err);
      window.SAO_DATA = {};
    }

    // đŸ”¹ Náº¿u chÆ°a cĂ³ dá»¯ liá»‡u thĂ¬ hiá»ƒn thá»‹ gá»£i Ă½
    if (!window.SAO_DATA || Object.keys(window.SAO_DATA).length === 0) {
      alert("đŸ“‚ HĂ£y chá»n file JSON hoáº·c backup Ä‘á»ƒ náº¡p dá»¯ liá»‡u sao!");
    }

    // âœ… Khi Ä‘Ă£ náº¡p xong â†’ render giao diá»‡n
    renderSidebar?.();
    renderChuyenDe?.(true);
  });
});

// =====================================================
// đŸŒŸ Táº O KHUNG Dá»® LIá»†U CHO TOĂ€N Bá»˜ SAO (náº¿u thiáº¿u)
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
      console.log(`đŸ†• ÄĂ£ khá»Ÿi táº¡o dá»¯ liá»‡u trá»‘ng cho sao: ${name}`);
    }
  });

  // đŸ’¾ Chá»‰ lÆ°u vĂ o IndexedDB (bá» localStorage Ä‘á»ƒ trĂ¡nh lá»—i QuotaExceededError)
  const json = JSON.stringify(SAO_DATA);
  saveToIndexedDB("SAO_DATA", json);

  console.log("âœ… ensureAllStars() â€“ ÄĂ£ Ä‘á»“ng bá»™ SAO_DATA vĂ o IndexedDB.");
}


// =====================================================
// đŸŒŸ QUáº¢N LĂ CHáº¾ Äá»˜ POPUP (xem / chá»‰nh sá»­a)
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
// đŸŒŸ HĂ€M Má» POPUP SAO (cháº¿ Ä‘á»™ xem)
// =====================================================
window.moPopupSao = function (maSao) {
  // đŸ§ Cháº·n ngÆ°á»i chÆ°a premium má»Ÿ popup sao
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block moPopupSao vĂ¬ user chÆ°a premium");
    return;
  }

  ensureAllStars();

  const saoObj = SAO_DATA[maSao];
  if (!saoObj.short) saoObj.short = {};
  const data = saoObj.short;
  window.currentSao = maSao;

  renderBangCungChuc(maSao);

  const shortName = (data.ten || maSao).split("â€“")[0].trim();
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

  // đŸŸ£ HIá»†N POPUP
  document.getElementById("saoPopup").style.display = "flex";

  // â­â­â­ RESET SCROLL Má»–I Láº¦N Má»
  const popupBox = document.querySelector("#saoPopup .popup-content");
  if (popupBox) popupBox.scrollTop = 0;

  setPopupMode("view");

  // ----- Giá»¯ láº¡i kĂ­ch thÆ°á»›c popup náº¿u cĂ³ -----
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
// âœï¸ CHá»ˆNH Sá»¬A Ná»˜I DUNG SAO
// =====================================================
const btnEdit = document.getElementById("btnEdit");
if (btnEdit) {
  btnEdit.onclick = () => {
    const sao = window.currentSao;
    if (!sao) return alert("â ï¸ ChÆ°a chá»n sao há»£p lá»‡!");
    if (!window.SAO_DATA[sao]) SAO_DATA[sao] = { short: {} };

    const data = SAO_DATA[sao].short;
    const box = document.getElementById("popupThongTin");
    if (!box) return alert("â ï¸ KhĂ´ng tĂ¬m tháº¥y khung popup!");

    document.getElementById("luuPopup").style.display = "inline-block";
    btnEdit.style.display = "none";

    box.innerHTML = `
      <div id="toolbarPopup" style="margin-bottom:10px; text-align:center;">
        <button onclick="document.execCommand('justifyLeft')">â¬…ï¸ TrĂ¡i</button>
        <button onclick="document.execCommand('justifyCenter')">â†”ï¸ Giá»¯a</button>
        <button onclick="document.execCommand('justifyRight')">â¡ï¸ Pháº£i</button>
        <button onclick="document.execCommand('bold')">đŸ…±ï¸ Äáº­m</button>
        <button onclick="document.execCommand('italic')">đ‘° NghiĂªng</button>
        <button onclick="insertSampleTable()">đŸ“‹ Báº£ng</button>
        <input type="color" id="colorPicker" title="Äá»•i mĂ u chá»¯">
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

    // đŸ‘‡ CHĂˆN THĂM KHá»I NĂ€Y (PHáº¦N Má»I)
    // ================================
    // TAB 2 â€“ cho phĂ©p gĂµ á»Ÿ cá»™t 'Ă nghÄ©a'
    document.querySelectorAll("#bangCungChuc td[data-cung]").forEach(td => {
  td.contentEditable = true;
  td.classList.add("edit-input");
});
document.querySelectorAll("#bangTuHoa td[data-hoa]").forEach(td => {
  td.contentEditable = true;
  td.classList.add("edit-input");
});


   // TAB 3 â€” LÆ°u Tá»© HĂ³a (CĂ¡t / Hung)
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
// đŸ’¾ LÆ¯U Ná»˜I DUNG SAO (chá»‰ dĂ¹ng IndexedDB Ä‘á»ƒ trĂ¡nh giá»›i háº¡n 5MB)
// =====================================================
const btnLuu = document.getElementById("luuPopup");
if (btnLuu) {
  btnLuu.onclick = () => {
    const sao = window.currentSao;
    if (!sao || !SAO_DATA[sao]) return;

    // =========================
    // TAB 1 â€” LÆ°u ThĂ´ng Tin Sao
    // =========================
    const data = SAO_DATA[sao].short;
    document.querySelectorAll("#popupThongTin .editable").forEach(div => {
      const content = div.innerHTML
        .replace(/<h2[^>]*>.*?<\/h2>/gi, "")
        .trim();
      data[div.dataset.field] = content || "";
    });

    // =========================
    // TAB 2 â€” LÆ°u Cung Chá»©c (CĂ¡t / Hung)
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
    // TAB 3 â€” LÆ°u Tá»© HĂ³a
    // =========================
    const tuHoaBox = document.getElementById("noiDungTuHoa");
    if (tuHoaBox) {
      SAO_DATA[sao].tuHoa = tuHoaBox.innerHTML.trim();
    }

    // =========================
    // LÆ¯U VĂ€O INDEXEDDB
    // =========================
    try {
      const json = JSON.stringify(SAO_DATA);
      saveToIndexedDB("SAO_DATA", json);
      console.log("đŸ’¾ ÄĂ£ lÆ°u SAO_DATA vĂ o IndexedDB thĂ nh cĂ´ng!");
    } catch (err) {
      console.warn("â ï¸ Lá»—i khi lÆ°u IndexedDB:", err);
    }

    // =========================
    // LÆ¯U KĂCH THÆ¯á»C POPUP
    // =========================
    const popupBox = document.querySelector("#saoPopup .popup-content");
    if (popupBox) {
      localStorage.setItem("popupSize_" + sao, JSON.stringify({
        width: popupBox.offsetWidth,
        height: popupBox.offsetHeight
      }));
    }

    // =========================
    // THOĂT CHáº¾ Äá»˜ EDIT
    // =========================
    document.getElementById("luuPopup").style.display = "none";
    document.getElementById("btnEdit").style.display = "inline-block";

    // Reload láº¡i popup Ä‘á»ƒ xem dá»¯ liá»‡u má»›i
    moPopupSao(sao);
  };
}



// =====================================================
// âŒ Há»¦Y / ÄĂ“NG / CHI TIáº¾T
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
// đŸ“˜ LOGIC POPUP CHUYĂN Äá»€ â€“ DĂ™NG INDEXEDDB (phiĂªn báº£n Ä‘áº§y Ä‘á»§)
// =====================================================

// đŸ§­ Khá»Ÿi táº¡o rá»—ng, sáº½ náº¡p tá»« IndexedDB sau
window.CHUYEN_DE_DATA = {};

// đŸ”¹ Náº¡p dá»¯ liá»‡u CHUYĂN Äá»€ tá»« IndexedDB (náº¿u cĂ³)
loadFromIndexedDB("CHUYEN_DE_DATA", data => {
  if (data) {
    try {
      window.CHUYEN_DE_DATA = JSON.parse(data);
      console.log("âœ… Náº¡p CHUYĂN_DE_DATA tá»« IndexedDB thĂ nh cĂ´ng.");
    } catch (e) {
      console.warn("â ï¸ Lá»—i parse CHUYĂN_DE_DATA:", e);
      window.CHUYEN_DE_DATA = {};
    }
  } else {
    console.log("â„¹ï¸ ChÆ°a cĂ³ CHUYĂN_DE_DATA trong IndexedDB, táº¡o má»›i rá»—ng.");
    window.CHUYEN_DE_DATA = {};
  }
});


// =====================================================
// đŸ“˜ HĂ€M Má» POPUP CHUYĂN Äá»€ THEO ID
// =====================================================
window.moPopupChuyenDeTheoId = function (id, tenHienThi = "") {
  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) {
    alert("KhĂ´ng tĂ¬m tháº¥y chuyĂªn Ä‘á» cĂ³ ID nĂ y!");
    return;
  }

  const { node } = found;
  window.currentChuyenDeId = id;
  window.currentChuyenDeName = tenHienThi;

  document.getElementById("tenChuyenDe").innerText = tenHienThi || "(KhĂ´ng cĂ³ tĂªn)";
  document.getElementById("noiDungChuyenDe").innerHTML =
    node.noiDung || "<i style='color:#777;'>ChÆ°a cĂ³ ná»™i dung.</i>";

  // Giao diá»‡n xem
  document.getElementById("toolbarChuyenDe").style.display = "none";
  document.getElementById("btnEditCD").style.display = "";
  document.getElementById("btnChiTietCD").style.display = "";
  document.getElementById("btnSaveCD").style.display = "none";
  document.getElementById("btnCancelCD").style.display = "none";

  document.getElementById("noiDungChuyenDe").setAttribute("contenteditable", "false");
document.getElementById("popupChuyenDe").style.display = "block";
};



// =====================================================
// âœï¸ CHá»ˆNH Sá»¬A CHUYĂN Äá»€
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
// đŸ’¾ LÆ¯U CHUYĂN Äá»€
// =====================================================
document.getElementById("btnSaveCD").onclick = () => {
  const id = window.currentChuyenDeId;
  if (!id) return;

  const html = document.getElementById("noiDungChuyenDe").innerHTML.trim();

  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) return alert("KhĂ´ng tĂ¬m tháº¥y node Ä‘á»ƒ lÆ°u!");
  const { node } = found;

  // âœ… Cáº­p nháº­t ná»™i dung cho Ä‘Ăºng node
  node.noiDung = html;

  // đŸ’¾ LÆ°u toĂ n bá»™ cĂ¢y
  saveToIndexedDB("CHUYEN_DE_DATA", JSON.stringify(CHUYEN_DE_DATA));

  // đŸ” Reload popup hiá»ƒn thá»‹ láº¡i
  moPopupChuyenDeTheoId(id, window.currentChuyenDeName);
  document.getElementById("popupChuyenDe").classList.remove("edit-mode");

  console.log(`đŸ’¾ ÄĂ£ lÆ°u chuyĂªn Ä‘á» ID '${id}' (${window.currentChuyenDeName})`);
};



// =====================================================
// âŒ Há»¦Y CHá»ˆNH Sá»¬A
// =====================================================
document.getElementById("btnCancelCD").onclick = () => {
  moPopupChuyenDeTheoId(window.currentChuyenDeId, window.currentChuyenDeName);
  document.getElementById("popupChuyenDe").classList.remove("edit-mode");
};


// =====================================================
// đŸ“„ XEM CHI TIáº¾T (chÆ°a xá»­ lĂ½ sĂ¢u, chá»‰ demo)
// =====================================================
document.getElementById("btnChiTietCD").onclick = () => {
  const ten = window.currentChuyenDe;
  alert("Xem chi tiáº¿t chuyĂªn Ä‘á»: " + ten);
};


// =====================================================
// đŸ« ÄĂ“NG POPUP CHUYĂN Äá»€ (cĂ³ cáº£nh bĂ¡o náº¿u chÆ°a lÆ°u)
// =====================================================
let chuyenDeEdited = false;

// đŸ”¹ ÄĂ¡nh dáº¥u Ä‘Ă£ chá»‰nh sá»­a
document.getElementById("noiDungChuyenDe").addEventListener("input", () => {
  if (document.getElementById("noiDungChuyenDe").isContentEditable) {
    chuyenDeEdited = true;
  }
});

// đŸ”¹ Khi lÆ°u â†’ reset cá»
document.getElementById("btnSaveCD").addEventListener("click", () => {
  chuyenDeEdited = false;
});

// đŸ”¹ Khi báº¥m nĂºt X
document.getElementById("closeChuyenDe").onclick = (e) => {
  e.stopPropagation();
  if (chuyenDeEdited) {
    const ok = confirm("Báº¡n cĂ³ thay Ä‘á»•i chÆ°a lÆ°u. ThoĂ¡t mĂ  khĂ´ng lÆ°u?");
    if (!ok) return;
  }
  chuyenDeEdited = false;
  document.getElementById("popupChuyenDe").style.display = "none";
};


// đŸ¯ ÄĂ³ng popup ChuyĂªn Äá» báº±ng phĂ­m ESC
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {

    const popup = document.getElementById("popupChuyenDe");
    if (!popup) return;

    // Náº¿u popup Ä‘ang má»Ÿ â†’ Ä‘Ă³ng
    if (popup.style.display === "flex" || popup.style.display === "") {

      // Náº¿u Ä‘ang chá»‰nh sá»­a vĂ  cĂ³ thay Ä‘á»•i â†’ cáº£nh bĂ¡o
      if (chuyenDeEdited) {
        const ok = confirm("Báº¡n cĂ³ thay Ä‘á»•i chÆ°a lÆ°u. ThoĂ¡t mĂ  khĂ´ng lÆ°u?");
        if (!ok) return;
      }

      chuyenDeEdited = false;
      popup.style.display = "none";
    }
  }
});


// =====================================================
// đŸ« KHĂ”NG CHO CLICK RA NGOĂ€I POPUP Äá»‚ ÄĂ“NG
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

// đŸ¨ Hiá»‡u á»©ng rung cáº£nh bĂ¡o
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
// đŸ¯ ÄĂ“NG Táº¤T Cáº¢ POPUP KHI Báº¤M ESC
// =====================================================
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;

  // 1ï¸âƒ£ Popup CHUYĂN Äá»€
  const popupCD = document.getElementById("popupChuyenDe");
  if (popupCD && popupCD.style.display === "flex") {

    // Náº¿u cĂ³ chá»‰nh sá»­a chÆ°a lÆ°u â†’ há»i
    if (window.chuyenDeEdited) {
      const ok = confirm("Báº¡n cĂ³ thay Ä‘á»•i chÆ°a lÆ°u. ThoĂ¡t mĂ  khĂ´ng lÆ°u?");
      if (!ok) return;
    }

    window.chuyenDeEdited = false;
    popupCD.style.display = "none";
    return; // ESC chá»‰ Ä‘Ă³ng 1 popup 1 láº§n
  }

  // 2ï¸âƒ£ Popup SAO (#saoPopup)
  const popupSao = document.getElementById("saoPopup");
  if (popupSao && popupSao.style.display === "flex") {
    popupSao.style.display = "none";
    return;
  }

  // 3ï¸âƒ£ Popup CĂCH Cá»¤C (#popupCachCuc)
  const popupCC = document.getElementById("popupCachCuc");
  if (popupCC && popupCC.style.display === "flex") {
    popupCC.style.display = "none";
    return;
  }
});

// =====================================================
// đŸ” CLICK SAO / TUáº¦N / TRIá»†T â†’ TRA Cá»¨U & HIGHLIGHT 5s (má»Ÿ Ä‘Ăºng cáº¥p cha)
// =====================================================
function cleanText(t) {
  return __norm(t).replace(/\s+/g, ""); // â— giá»¯ Ä‘Ăºng logic: cleanText bá» Háº¾T khoáº£ng tráº¯ng
}



let highlightTimer = null;

document.addEventListener("click", (e) => {
if (e.target.closest("#bangNhomSaoLuu")) return;

  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

const target = e.target.closest(
  ".layer-1 div, .layer-3 div, .cat-tinh div, .hung-tinh div, .tuan-triet span, .layer-6 .cat-tinh div, .layer-6 .hung-tinh div"
);

console.log("đŸ¯ Click event target:", e.target);
console.log("đŸ¯ Matched closest:", target);


  if (!target) return;




  if (target.closest(".layer-2")) return; // â›” KhĂ´ng tra cung

  let rawName = target.textContent.trim();

/* ============================
   đŸ“Œ XĂC Äá»NH CUNG CHO SAO
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
  1: "Tá»µ",
  2: "Ngá»",
  3: "MĂ¹i",
  4: "ThĂ¢n",

  5: "ThĂ¬n",
  6: "Dáº­u",
  7: "MĂ£o",
  8: "Tuáº¥t",

  9: "Dáº§n",
  10: "Sá»­u",
  11: "TĂ½",
  12: "Há»£i"
};


    window.currentCung = ID_TO_CUNG[id] || null;

    console.log("đŸ“Œ Sao Ä‘ang Ä‘á»©ng táº¡i:", window.currentCung);

  } catch(e) {
    console.warn("Lá»—i xĂ¡c Ä‘á»‹nh cung:", e);
  }
})();






console.log("đŸŸ¡ rawName =", rawName);

// Tuáº§n / Triá»‡t cĂ³ dáº¡ng "Tuáº§n" hoáº·c "Triá»‡t â€“ Tuáº§n"
if (rawName.includes("Tuáº§n")) rawName = "Tuáº§n";
if (rawName.includes("Triá»‡t")) rawName = "Triá»‡t";

  if (rawName.includes("â€“")) rawName = rawName.split("â€“")[1].trim();
// âœ… Bá» cáº£ tiá»n tá»‘ N., Nh., L., ÄV., TL.
const saoTen = rawName.replace(/^(Nh\.|N\.|L\.|ÄV\.|TL\.)\s*/i, "").trim();
let cleanSao = cleanText(saoTen);

// Tuáº§n / Triá»‡t â†’ Tuáº§n KhĂ´ng / Triá»‡t KhĂ´ng
if (cleanSao.includes("tuan"))  cleanSao = "tuankhong";
if (cleanSao.includes("triet")) cleanSao = "trietkhong";
// đŸŸª Náº¿u lĂ  Tuáº§n/Triá»‡t â†’ láº¥y 2 cung bá»‹ Ä‘Ă³ng
if (cleanSao === "tuankhong" || cleanSao === "trietkhong") {
  const cap = target.closest(".tuan-triet")?.dataset.cap || ""; // VD: "TĂ½-Sá»­u"
  const [c1, c2] = cap.split("-");
  window.currentCung = null; // khĂ´ng 1 cung cá»‘ Ä‘á»‹nh
  window.blockedCung = [c1, c2]; // lÆ°u máº£ng 2 cung
} else {
  window.blockedCung = null; // reset khi click sao khĂ¡c
}

console.log("âœ… after mapping =", cleanSao);


  clearTimeout(highlightTimer);

  // đŸ§¹ XĂ³a sĂ¡ng cÅ©
  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

  // đŸ” TĂ¬m pháº§n tá»­ sao trong tá»« Ä‘iá»ƒn
 let found = null;
sidebar.querySelectorAll("[data-sao]").forEach(li => {

  // â— Bá» qua nhĂ³m "Cung"
  const groupTitleEl = li.closest(".group")?.querySelector(".group-title");
  if (groupTitleEl && groupTitleEl.textContent.includes("Cung")) return;

  const ten = cleanText(li.dataset.sao || "");
  if (ten === cleanSao) found = li;
});

if (!found) {
  console.warn("â›” NOT FOUND in sidebar:", cleanSao);
  return;
}

  // đŸ”¹ Thu gá»n toĂ n bá»™ danh sĂ¡ch khĂ¡c, trá»« pháº§n đŸ“˜ CHUYĂN Äá»€
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // đŸŸ¢ Má»Ÿ táº¥t cáº£ cáº¥p cha chá»©a sao Ä‘Ă³
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

 // đŸŒŸ Highlight & cuá»™n tá»›i sao
found.classList.add("highlight-sao");
found.scrollIntoView({ behavior: "smooth", block: "center" });

highlightTimer = setTimeout(() => found.classList.remove("highlight-sao"), 5000);

// ===============================
// đŸ”„ CHá»ˆ UPDATE POPUP Náº¾U ÄANG Má»
// ===============================

const popup = document.getElementById("saoPopup");

if (popup && popup.style.display !== "none") {
  // Popup Ä‘ang má»Ÿ â†’ cáº­p nháº­t
  showStarInfo(saoTen, window.currentCung || null);

  // Tá»± chuyá»ƒn sang Tab 2 láº¡i sau click
  setTimeout(() => {
    document.querySelector(`.tab-link[data-tab="tab2"]`)?.click();
  }, 50);
}


});

// =====================================================
// đŸŸ£ CLICK CUNG CHá»¨C (Má»†NH, HUYNH Äá»†, PHĂC Äá»¨C, <THĂ‚N>) â†’ TRA Cá»¨U & Má» ÄĂNG Cáº¤P CHA
// =====================================================
document.querySelector(".container")?.addEventListener("click", (ev) => {
  const target = ev.target;
  if (!target || !target.textContent) return;
  if (!target.closest(".ten-cung") && !target.closest(".cung-name")) return;

  const text = target.textContent.trim();

  // đŸ”’ Chá»‰ báº¯t khi lĂ  chá»¯ IN HOA hoĂ n toĂ n hoáº·c chá»©a <THĂ‚N>
  const isUpper = /^[A-ZĂ€-á»´\s<>\.]+$/.test(text);
  const isThan = text.includes("THĂ‚N");
  if (!isUpper && !isThan) return; // â›” KhĂ´ng pháº£i cung chá»©c

  // Danh sĂ¡ch 13 cung chá»©c (IN HOA)
  const CUNG_CHUC = [
    "Má»†NH","HUYNH Äá»†","PHU THĂ","Tá»¬ Tá»¨C","TĂ€I Báº CH","Táº¬T ĂCH",
    "THIĂN DI","NĂ” Bá»˜C","QUAN Lá»˜C","ÄIá»€N TRáº CH","PHĂC Äá»¨C","PHá»¤ MáºªU","THĂ‚N"
  ];

  // đŸ§© Xá»­ lĂ½ riĂªng trÆ°á»ng há»£p â€œTHĂ‚Nâ€ (Ä‘á»ƒ khĂ´ng dĂ­nh Má»†NH<THĂ‚N>)
  let foundCung = null;
  if (text === "<THĂ‚N>" || text.includes("(THĂ‚N)")) {
    foundCung = "THĂ‚N";
  } else {
    foundCung = CUNG_CHUC.find(c => text.includes(c));
  }
  if (!foundCung) return;

  // đŸŸ¢ Táº¯t sĂ¡ng trong lĂ¡ sá»‘
  document.querySelectorAll(".sao-highlight").forEach(e => e.classList.remove("sao-highlight"));

  // đŸŸ¢ TĂ¬m vĂ  highlight dĂ²ng tÆ°Æ¡ng á»©ng trong tá»« Ä‘iá»ƒn
  const sidebar = document.getElementById("sidebarTraCuu");
  if (!sidebar) return;

  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

 let found = null;
sidebar.querySelectorAll("li").forEach(li => {
  // đŸ« Bá» qua náº¿u má»¥c náº±m trong Tá»ª ÄIá»‚N SAO hoáº·c CHUYĂN Äá»€
  if (li.closest("#tuDienSaoBox") || li.closest("#chuyenDeBox")) return;

  const txt = li.textContent.trim().toUpperCase();
  if (txt.includes(foundCung) || (foundCung === "THĂ‚N" && txt.includes("AN THĂ‚N"))) {
    found = li;
  }
});


  if (!found) return;

  // đŸ”¹ Thu gá»n toĂ n bá»™ danh sĂ¡ch khĂ¡c, trá»« pháº§n đŸ“˜ CHUYĂN Äá»€
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // đŸŸ¢ Má»Ÿ táº¥t cáº£ cáº¥p cha chá»©a cung Ä‘Ă³
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

  // đŸŒŸ Highlight & scroll
  found.classList.add("highlight-sao");
  found.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => found.classList.remove("highlight-sao"), 5000);

  console.log("đŸ“˜ Click cung chá»©c:", foundCung);
});


// =====================================================
// đŸŒ¿ CLICK VĂ’NG TRĂ€NG SINH â†’ TRA Cá»¨U & HIGHLIGHT 5s (má»Ÿ Ä‘Ăºng cáº¥p cha + tá»± thu gá»n)
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

  // đŸŒ¿ LĂ m sáº¡ch & bá» dáº¥u
  const cleanSao = removeDiacritics(cleanText(rawName.toLowerCase()));
  clearTimeout(highlightTimer);

  // đŸ§¹ XĂ³a highlight cÅ©
  sidebar.querySelectorAll("li.highlight-sao").forEach(li => li.classList.remove("highlight-sao"));

 // đŸ” TĂ¬m trong nhĂ³m cĂ³ chá»¯ "TrĂ ng Sinh" hoáº·c "Tiá»ƒu Tinh"
let found = null;
sidebar.querySelectorAll(".group").forEach(group => {
  // đŸ« Bá» qua náº¿u nhĂ³m náº±m trong pháº§n Tá»« Äiá»ƒn Sao hoáº·c ChuyĂªn Äá»
  if (group.closest("#tuDienSaoBox") || group.closest("#chuyenDeBox")) return;

  const title = (group.querySelector(".group-title")?.textContent || "").toLowerCase();
  if (!title.includes("trĂ ng sinh") && !title.includes("tiá»ƒu tinh")) return;


    group.querySelectorAll("[data-sao]").forEach(li => {
      const ten = removeDiacritics(cleanText((li.dataset.sao || li.textContent || "").toLowerCase().trim()));
      if (ten === cleanSao) found = li;
    });
  });

  if (!found) {
    console.log("â›” KhĂ´ng tĂ¬m tháº¥y sao:", rawName);
    return;
  }

  // đŸ”¹ Thu gá»n toĂ n bá»™ danh sĂ¡ch khĂ¡c, trá»« pháº§n đŸ“˜ CHUYĂN Äá»€
sidebar.querySelectorAll("ul").forEach(ul => {
  if (!ul.closest("#chuyenDeBox")) {
    ul.style.display = "none";
  }
});


  // đŸŸ¢ Má»Ÿ táº¥t cáº£ cáº¥p cha chá»©a sao Ä‘Ă³
  let parent = found.parentElement;
  while (parent && parent.id !== "sidebarTraCuu") {
    if (parent.tagName === "UL") parent.style.display = "block";
    parent = parent.parentElement;
  }

  // đŸŒŸ Highlight & scroll
  found.classList.add("highlight-sao");
  found.scrollIntoView({ behavior: "smooth", block: "center" });

  highlightTimer = setTimeout(() => found.classList.remove("highlight-sao"), 5000);

  console.log("đŸŒ¿ Click vĂ²ng TrĂ ng Sinh:", rawName);
});


// =====================================================
// đŸ”§ HĂ€M Há»– TRá»¢: Bá» dáº¥u tiáº¿ng Viá»‡t Ä‘á»ƒ so sĂ¡nh
// =====================================================
function removeDiacritics(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bá» dáº¥u
    .replace(/Ä‘/g, "d")             // Ä‘ â†’ d
    .replace(/Ä/g, "D");            // Ä â†’ D
}





// đŸŒŸ Cho phĂ©p dĂ¡n báº£ng HTML vĂ o popup mĂ  khĂ´ng máº¥t Ä‘á»‹nh dáº¡ng
document.addEventListener("paste", function (e) {
  const editable = e.target.closest(".editable, .editable-view");
  if (editable && e.clipboardData) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    editable.insertAdjacentHTML("beforeend", html || text);
  }
});
// đŸŒ™ ÄĂ³ng popup khi báº¥m X
const popupCloseBtn = document.getElementById("popupClose");
if (popupCloseBtn) {
  popupCloseBtn.onclick = () => {
    const popup = document.getElementById("saoPopup");
    const isEditing = popup.classList.contains("edit-mode");

    if (isEditing) {
      // Náº¿u Ä‘ang chá»‰nh sá»­a â†’ há»i xĂ¡c nháº­n lÆ°u
      const confirmClose = confirm("Báº¡n cĂ³ muá»‘n lÆ°u thay Ä‘á»•i trÆ°á»›c khi Ä‘Ă³ng khĂ´ng?");
      if (confirmClose) {

        const btnSave = document.getElementById("btnSave");
        if (btnSave) {
          btnSave.click();
        } else {
          console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y nĂºt LÆ°u (btnSave)");
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

// đŸŒ™ Chá»‰ Ă¡p dá»¥ng click ra ngoĂ i cho popup SAO
const saoPopupOverlaySafe = document.getElementById("saoPopup");
if (saoPopupOverlaySafe) {
  saoPopupOverlaySafe.addEventListener("click", e => {
    // Chá»‰ xá»­ lĂ½ khi click Ä‘Ăºng vĂ o ná»n má» (khĂ´ng pháº£i bĂªn trong ná»™i dung)
    if (e.target === saoPopupOverlaySafe) {
      const saoPopup = document.getElementById("saoPopup");
      const isEditing = saoPopup.classList.contains("edit-mode");
      const saoBox = document.querySelector("#saoPopup .popup-content");

      if (isEditing) {
        // đŸŒŸ Náº¿u Ä‘ang chá»‰nh sá»­a â†’ rung nháº¹, khĂ´ng táº¯t
        saoBox.classList.add("shake");
        setTimeout(() => saoBox.classList.remove("shake"), 300);
      } else {
        // âœ… Náº¿u chá»‰ Ä‘ang xem â†’ Ä‘Ă³ng bĂ¬nh thÆ°á»ng
        saoPopup.style.display = "none";
      }
    }
  });
}

// đŸŒŸ Ăp dá»¥ng cho táº¥t cáº£ popup (sao, chuyĂªn Ä‘á», tá»« Ä‘iá»ƒn, v.v.)
document.querySelectorAll(".popup-overlay").forEach(popupOverlay => {
  popupOverlay.addEventListener("click", e => {
    // Chá»‰ khi click Ä‘Ăºng vĂ o ná»n má», khĂ´ng pháº£i bĂªn trong popup
    if (e.target === popupOverlay) {
      const popupBox = popupOverlay.querySelector(".popup-content");
      const isEditing = popupOverlay.classList.contains("edit-mode");

      if (isEditing) {
        // đŸŒ¸ Rung nháº¹ cáº£nh bĂ¡o khĂ´ng thá»ƒ Ä‘Ă³ng khi Ä‘ang chá»‰nh sá»­a
        popupBox.classList.add("shake");
        setTimeout(() => popupBox.classList.remove("shake"), 300);
      } else {
        // âœ… Náº¿u Ä‘ang xem bĂ¬nh thÆ°á»ng thĂ¬ Ä‘Ă³ng popup
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
  if (cc) cc.style.display = "none"; // âœ… áº©n luĂ´n báº£ng cĂ¡ch cá»¥c
  return;
} else {
  const cc = document.getElementById("cachCucWrapper");
  if (cc) cc.style.display = "block"; // âœ… hiá»‡n láº¡i khi tick
}


  const cellMap = {
    "Dáº§n":9,"MĂ£o":7,"ThĂ¬n":5,"Tá»µ":1,"Ngá»":2,"MĂ¹i":3,
    "ThĂ¢n":4,"Dáº­u":6,"Tuáº¥t":8,"Há»£i":12,"TĂ½":11,"Sá»­u":10
  };

  const cells = {
    "ChĂ­nh": document.getElementById("cell" + cellMap[cung]),
    "Äá»‘i": document.getElementById("cell" + cellMap[doiCung]),
    "Há»£p1": document.getElementById("cell" + cellMap[hop1]),
    "Há»£p2": document.getElementById("cell" + cellMap[hop2]),
    "GiĂ¡pTrÆ°á»›c": document.getElementById("cell" + cellMap[cungTruoc]),
    "GiĂ¡pSau": document.getElementById("cell" + cellMap[cungSau])
  };

  const diemViTri = { "ChĂ­nh":100, "Äá»‘i":70, "Há»£p":50, "GiĂ¡p":10 };
  const layerChinh = cells.ChĂ­nh?.querySelector(".layer-3");
  const laVoChinhDieu = !layerChinh || layerChinh.querySelectorAll("div").length === 0;
  if (laVoChinhDieu) {
    diemViTri["ChĂ­nh"] = 143;
    diemViTri["Äá»‘i"] = 100;
  }

  const CAT_TINH = ["ThiĂªn KhĂ´i","ThiĂªn Viá»‡t","Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc"];
  const HUNG_TINH = ["KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p"];
  const TU_HOA_CAT = ["HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa"];
  const TU_HOA_HUNG = ["HĂ³a Ká»µ"];
  const DOI_SAO = [
    ["KĂ¬nh DÆ°Æ¡ng","ÄĂ  La"],["Há»a Tinh","Linh Tinh"],["Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p"],
    ["VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc"],["ThiĂªn KhĂ´i","ThiĂªn Viá»‡t"],["Táº£ PhĂ¹","Há»¯u Báº­t"]
  ];

  function laySao(cell) {
    if (!cell) return [];
    const layer = cell.querySelector(".layer-6");
    if (!layer) return [];
    return Array.from(layer.querySelectorAll(".cat-tinh div, .hung-tinh div"))
      .map(el => el.textContent.trim())
      // đŸ« Báº£ng Ä‘á»‹nh cĂ¡t hung chá»‰ xĂ©t sao gá»‘c, bá» toĂ n bá»™ sao háº¡n (ÄV/L/N/Nh/TL)
      .filter(txt => !/^(ÄV\.|L\.|N\.|Nh\.|TL\.)\s*/i.test(txt))
      .filter(Boolean);
  }

  const ds = {};
  for (const [k, c] of Object.entries(cells)) ds[k] = laySao(c);

  const catList = [], hungList = [];
  let tongCat = 0, tongHung = 0;
  const used = new Set();

  function timViTriSao(ds, sao) {
    for (const [v, list] of Object.entries(ds)) {
      if (list.includes(sao)) return v.startsWith("GiĂ¡p") ? "GiĂ¡p" : v.replace(/[0-9]/g,"");
    }
    return null;
  }

  const viTriTinh = ["ChĂ­nh","Äá»‘i","Há»£p1","Há»£p2"];

  DOI_SAO.forEach(([s1,s2])=>{
    const v1 = timViTriSao(ds,s1);
    const v2 = timViTriSao(ds,s2);
    if (!v1 || !v2) return;
    if (v1 === "GiĂ¡p" || v2 === "GiĂ¡p") return;
    if (used.has(s1) || used.has(s2)) return;
    const tong = (diemViTri[v1] + diemViTri[v2]) * 2;
    const tag = (v1===v2) ? `(${v1})` : `(${v1} â€“ ${v2})`;
    const text = `${s1} â€“ ${s2} ${tag} â€“ ${tong}Ä‘`;

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
        catList.push(`${sao} (${nhan}) â€“ ${diem}Ä‘`);
        tongCat+=diem;
      } else if (HUNG_TINH.includes(sao)||TU_HOA_HUNG.includes(sao)){
        hungList.push(`${sao} (${nhan}) â€“ ${diem}Ä‘`);
        tongHung+=diem;
      }
    });
  });

  // đŸŒŸ XĂ‰T GIĂP CUNG SAU CĂ™NG
  const DOI_SAO_GIAP = [
    ["KĂ¬nh DÆ°Æ¡ng","ÄĂ  La"],
    ["Há»a Tinh","Linh Tinh"],
    ["Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p"],
    ["ThiĂªn KhĂ´i","ThiĂªn Viá»‡t"],
    ["VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc"],
    ["Táº£ PhĂ¹","Há»¯u Báº­t"]
  ];

  DOI_SAO_GIAP.forEach(([s1, s2]) => {
    const truoc = ds.GiĂ¡pTrÆ°á»›c.includes(s1) || ds.GiĂ¡pTrÆ°á»›c.includes(s2);
    const sau   = ds.GiĂ¡pSau.includes(s1)  || ds.GiĂ¡pSau.includes(s2);
    if (!(truoc && sau)) return; // âŒ khĂ´ng Ä‘á»§ Ä‘Ă´i giĂ¡p

    const giua = ds.ChĂ­nh || [];
    const coHung = giua.some(x => ["HĂ³a Ká»µ","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p","Há»a Tinh","Linh Tinh","KĂ¬nh DÆ°Æ¡ng","ÄĂ  La"].includes(x));
    const coCat  = giua.some(x => ["ThiĂªn KhĂ´i","ThiĂªn Viá»‡t","Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa"].includes(x));

    if (HUNG_TINH.includes(s1) || HUNG_TINH.includes(s2)) {
      const diem = coHung ? 200 : 20;
      hungList.push(`${s1} â€“ ${s2} (GiĂ¡p Cung) â€“ ${diem}Ä‘`);
      tongHung += diem;
    } else if (CAT_TINH.includes(s1) || CAT_TINH.includes(s2)) {
      const diem = coCat ? 200 : 20;
      catList.push(`${s1} â€“ ${s2} (GiĂ¡p Cung) â€“ ${diem}Ä‘`);
      tongCat += diem;
    }
  });



  // ============================================================
  // đŸ¯ Bá»• sung pháº§n hiá»ƒn thá»‹ tiĂªu Ä‘á» + sao phá»¥ + káº¿t luáº­n theo %
  // ============================================================

  // đŸª¶ ChĂ­nh tinh táº¡i cung
  const saoChinh = cells.ChĂ­nh?.querySelector(".layer-3");
  const names = saoChinh
    ? Array.from(saoChinh.querySelectorAll("div")).map(e => e.textContent.trim()).filter(Boolean).join(" / ")
    : "";
  const tenChinhTinh = names || "VĂ´ ChĂ­nh Diá»‡u";

// đŸª¶ Kiá»ƒm tra ThiĂªn MĂ£ vĂ  Lá»™c Tá»“n â€” hiá»ƒn thá»‹ vá»‹ trĂ­ cá»¥ thá»ƒ, gá»™p hai Há»£p cung
const viTriTenMap = {
  "ChĂ­nh": "ChĂ­nh cung",
  "Äá»‘i": "Äá»‘i cung",
  "Há»£p1": "Há»£p cung",
  "Há»£p2": "Há»£p cung"
};

const saoPhu = [];

for (const [viTri, dsSao] of Object.entries(ds)) {
  if (!Array.isArray(dsSao)) continue;
  if (!viTriTenMap[viTri]) continue; // âœ… chá»‰ xá»­ lĂ½ 4 cung há»£p lá»‡
  if (dsSao.includes("ThiĂªn MĂ£")) saoPhu.push(`ThiĂªn MĂ£ (${viTriTenMap[viTri]})`);
  if (dsSao.includes("Lá»™c Tá»“n")) saoPhu.push(`Lá»™c Tá»“n (${viTriTenMap[viTri]})`);
}


// Loáº¡i trĂ¹ng â€œHá»£p cungâ€ náº¿u xuáº¥t hiá»‡n cáº£ Há»£p1 vĂ  Há»£p2
const hopLocs = [];
const saoPhuGop = saoPhu.filter(item => {
  if (item.includes("(Há»£p cung)")) {
    const key = item.split(" ")[0];
    if (hopLocs.includes(key)) return false;
    hopLocs.push(key);
  }
  return true;
});

let dongSaoPhu = "";
if (saoPhuGop.length > 0) {
  dongSaoPhu = `<div style="font-size:12px; margin:3px 0 2px; color:#444; font-style:italic;">
    Äi kĂ¨m cĂ¡c sao: ${saoPhuGop.join(", ")}
  </div>`;
}


  // đŸ§® TĂ­nh % cĂ¡t
  const tong = tongCat + tongHung;
  const tyLeCat = tong > 0 ? (tongCat / tong) * 100 : 0;
  const tyLeHung = tong > 0 ? (tongHung / tong) * 100 : 0;

  let ketluan = "";
  if (tyLeCat < 20) ketluan = "Hung";
  else if (tyLeCat < 40) ketluan = "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn Hung";
  else if (tyLeCat < 60) ketluan = "CĂ¡t Hung Láº«n Lá»™n";
  else if (tyLeCat < 80) ketluan = "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn CĂ¡t";
  else ketluan = "CĂ¡t";

  // ============================================================
  // đŸŒŸ Xuáº¥t báº£ng
  // ============================================================
  wrap.querySelector("#catHungNoiDung").innerHTML = `
    <div style="text-align:center;font-weight:bold;">
      ${tenChinhTinh.toUpperCase()} Táº I ${cung.toUpperCase()}
    </div>
    <table style="margin-top:4px;">
      <tr><th>CĂT TINH</th><th>HUNG TINH</th></tr>
      <tr>
        <td>${catList.join("<br>") || "&nbsp;"}</td>
        <td>${hungList.join("<br>") || "&nbsp;"}</td>
      </tr>
      <tr>
        <td><b>Tá»•ng Ä‘iá»ƒm: ${tongCat} (${tyLeCat.toFixed(0)}%)</b></td>
        <td><b>Tá»•ng Ä‘iá»ƒm: ${tongHung} (${tyLeHung.toFixed(0)}%)</b></td>
      </tr>
    </table>
    ${dongSaoPhu}
    <div style="text-align:center;font-weight:bold;margin-top:4px;background-color:#f3e6b1;">
      đŸ”¹ Káº¾T LUáº¬N: ${ketluan.toUpperCase()} đŸ”¹
    </div>
  `;



// ======================================================
// đŸ—ºï¸ Báº¢N Äá»’ CUNG CHUáº¨N TOĂ€N Cá»¤C (layout NGHá»CH)
// ======================================================
window.mapCung = {
  "Dáº§n": 9, "MĂ£o": 7, "ThĂ¬n": 5, "Tá»µ": 1, "Ngá»": 2, "MĂ¹i": 3,
  "ThĂ¢n": 4, "Dáº­u": 6, "Tuáº¥t": 8, "Há»£i": 12, "TĂ½": 11, "Sá»­u": 10
};

// Cho phĂ©p gá»i ngáº¯n gá»n "mapCung" mĂ  khĂ´ng cáº§n window.
const mapCung = window.mapCung;

// ============================================================
// đŸ§© Cáº¬P NHáº¬T Dá»® LIá»†U THáº¬T CHO MODULE CĂCH Cá»¤C
// ============================================================
try {
  // 1ï¸âƒ£ Cáº­p nháº­t láº¡i dá»¯ liá»‡u toĂ n bá»™ lĂ¡ sá»‘ tháº­t (gá»“m trung tinh)
  window.DU_LIEU_LA_SO_THAT = layDuLieuTuLayers();

  // 2ï¸âƒ£ XĂ¡c Ä‘á»‹nh id cá»§a cung hiá»‡n táº¡i
  const idChinh = cellMap[cung];

  // 3ï¸âƒ£ GĂ¡n loáº¡i cĂ¡ch (CĂT/HUNG) vĂ o dá»¯ liá»‡u tháº­t
  if (window.DU_LIEU_LA_SO_THAT[idChinh]) {
    window.DU_LIEU_LA_SO_THAT[idChinh].cachLoai = ketluan.toUpperCase();
  }

  // 4ï¸âƒ£ Gá»i kiá»ƒm tra CĂ¡ch Cá»¥c náº¿u cĂ³ dá»¯ liá»‡u
  if (typeof window.kiemTraCachCuc === "function" && typeof window.capNhatBangCachCuc === "function") {
    const { kq } = kiemTraCachCuc(idChinh, window.DU_LIEU_LA_SO_THAT);

    // Cáº­p nháº­t hiá»ƒn thá»‹ panel pháº£i (báº£ng CĂ¡ch Cá»¥c)
    const ccWrap = document.getElementById("cachCucWrapper");
    const ccNoiDung = document.getElementById("cachCucNoiDung");

    if (ccWrap && ccNoiDung) {
      ccWrap.style.display = "block";
      ccNoiDung.innerHTML = kq.length
        ? `<b>${cung}</b>:<br>${kq
            .map(x => `<div class="dong-phan-tich" data-ten="${x}" onclick="window.highlightCachCucTuPhanTich && window.highlightCachCucTuPhanTich(this)">âœ… ${x}</div>`)
            .join("")}`
        : `<b>${cung}</b>: <i>KhĂ´ng cĂ³ cĂ¡ch cá»¥c phĂ¹ há»£p.</i>`;

      // Gáº¯n listener trá»±c tiáº¿p Ä‘á»ƒ cháº¯c cháº¯n báº¯t click
      attachDirectClickForCachCuc(ccNoiDung);
    }
  }
} catch (err) {
  console.warn("â ï¸ Lá»—i cáº­p nháº­t CĂ¡ch Cá»¥c:", err);
}

// ============================================================
// âœ… Hiá»ƒn thá»‹ báº£ng CĂ¡t Hung sau khi xá»­ lĂ½ xong
// ============================================================
wrap.style.display = "block";
};

// ===============================
// đŸ¯ Click dĂ²ng PHĂ‚N TĂCH CĂCH Cá»¤C -> focus & highlight á»Ÿ danh sĂ¡ch bĂªn trĂ¡i
// ===============================
function highlightCachCucTuPhanTich(el) {
  // Cháº·n xem chi tiáº¿t khi chÆ°a premium
  if (!(window.isPaidUser && window.isPaidUser())) {
    console.warn("[CC] ChÆ°a premium, bá» qua highlight");
    return;
  }

  const ten = el.dataset.ten?.trim().toLowerCase();
  if (!ten) return;

  // Äáº£m báº£o danh sĂ¡ch bĂªn trĂ¡i Ä‘Ă£ render
  if (typeof renderCachCucList === "function") renderCachCucList(false);

  // TĂ¬m danh sĂ¡ch cĂ¡c CĂ¡ch Cá»¥c bĂªn trĂ¡i
  const list = document.querySelectorAll("#listCachCuc .cc-left b");
  let foundItem = null;

  list.forEach(item => {
    const t = item.textContent.trim().toLowerCase();
    if (t === ten) foundItem = item.closest(".cc-left");
  });

  if (!foundItem) {
    console.warn("â—KhĂ´ng tĂ¬m tháº¥y CĂ¡ch Cá»¥c tÆ°Æ¡ng á»©ng:", ten);
    return;
  }

  // Cuá»™n Ä‘áº¿n dĂ²ng Ä‘Ă³ trong danh sĂ¡ch bĂªn trĂ¡i
  foundItem.scrollIntoView({ behavior: "smooth", block: "center" });

  // Highlight dĂ²ng Ä‘Ă³ 5 giĂ¢y
  foundItem.classList.add("highlight-cachcuc");
  setTimeout(() => foundItem.classList.remove("highlight-cachcuc"), 5000);
}
// Cho phĂ©p gá»i inline
window.highlightCachCucTuPhanTich = highlightCachCucTuPhanTich;

function bindHighlightDelegates() {
  const targets = [
    document.getElementById("catHungWrapper"),
    document.getElementById("cachCucWrapper"),
    document.getElementById("cachCucNoiDung")
  ].filter(Boolean);

  targets.forEach(t => {
    // TrĂ¡nh gáº¯n trĂ¹ng: xoĂ¡ trÆ°á»›c náº¿u Ä‘Ă£ cĂ³
    t.removeEventListener("click", handleDongPhanTichClick, true);
    t.removeEventListener("click", handleDongPhanTichClick, false);
    t.addEventListener("click", handleDongPhanTichClick, true);
    t.addEventListener("click", handleDongPhanTichClick, false);
  });

  if (targets.length) {
    console.log("[CC] ÄĂ£ gáº¯n delegate highlight trĂªn", targets.map(el => "#" + (el.id || el.className)).join(", "));
  }
}

// Gáº¯n click trá»±c tiáº¿p cho cĂ¡c dĂ²ng vá»«a render
function attachDirectClickForCachCuc(container) {
  if (!container) return;
  container.querySelectorAll(".dong-phan-tich").forEach(el => {
    el.onclick = (ev) => {
      console.log("[CC] Click trá»±c tiáº¿p dĂ²ng phĂ¢n tĂ­ch:", el.dataset.ten);
      highlightCachCucTuPhanTich(ev.currentTarget);
    };
  });
}

// Báº¯t click trĂªn dĂ²ng phĂ¢n tĂ­ch (nhiá»u lá»›p Ä‘á»ƒ cháº¯c cháº¯n khĂ´ng bá»‹ cháº·n)
const handleDongPhanTichClick = (e) => {
  const dong = e.target.closest(".dong-phan-tich");
  if (!dong) {
    // Debug thĂªm: log click trong vĂ¹ng catHung
    if (e.currentTarget && (e.currentTarget.id === "catHungWrapper" || e.currentTarget.id === "cachCucNoiDung")) {
      console.log("[CC] Click nhÆ°ng khĂ´ng tháº¥y .dong-phan-tich, target=", e.target.className || e.target.tagName, "text=", (e.target.textContent || "").trim());
    }
    return false;
  }
  console.log("[CC] Highlight tá»« báº£ng phĂ¢n tĂ­ch:", dong.dataset.ten);
  highlightCachCucTuPhanTich(dong);
  return true;
};
// Capture & bubble
document.addEventListener("click", handleDongPhanTichClick, true);
document.addEventListener("click", handleDongPhanTichClick, false);
// Fallback cho má»™t sá»‘ trĂ¬nh duyá»‡t / khi click bá»‹ stopPropagation sá»›m
document.addEventListener("pointerdown", (e) => {
  if (handleDongPhanTichClick(e)) {
    e.preventDefault();
  }
}, true);

// Gáº¯n trá»±c tiáº¿p vĂ o khung phĂ¢n tĂ­ch náº¿u cĂ³
document.addEventListener("DOMContentLoaded", () => {
  bindHighlightDelegates();
  // Gáº¯n click trá»±c tiáº¿p cho cĂ¡c dĂ²ng (phĂ²ng khi render trÆ°á»›c Ä‘Ă³)
  attachDirectClickForCachCuc(document.getElementById("cachCucNoiDung"));

  // CSS nhá» cho dĂ²ng bá»‹ khĂ³a
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

  // KhĂ³a tra ngÆ°á»£c theo tráº¡ng thĂ¡i hiá»‡n táº¡i
  toggleTraNguocLock(window.isPaidUser && window.isPaidUser());
  // KhĂ³a sá»­a/xĂ³a cĂ¡ch cá»¥c theo tráº¡ng thĂ¡i hiá»‡n táº¡i
  toggleCachCucEditLock(window.isPaidUser && window.isPaidUser());
  // KhĂ³a thao tĂ¡c chuyĂªn Ä‘á» theo tráº¡ng thĂ¡i hiá»‡n táº¡i
  toggleChuyenDeEditLock(window.isPaidUser && window.isPaidUser());

  // Cá»‘ Ä‘á»‹nh panel auth theo cáº¡nh pháº£i cá»§a vĂ¹ng lĂ¡ sá»‘ (khĂ´ng di chuyá»ƒn khi cuá»™n)
  const positionAuthPanel = () => {
    const panel = document.getElementById("authPanel");
    const container = document.querySelector(".container");
    if (!panel || !container) return;

    // container tÆ°Æ¡ng Ä‘á»‘i, panel tuyá»‡t Ä‘á»‘i bĂ¡m vĂ o pháº£i
    container.style.position = "relative";
    panel.style.position = "absolute";
    panel.style.right = "0";
    panel.style.top = "67px";
  };
  positionAuthPanel();
  window.addEventListener("resize", positionAuthPanel);
});

// đŸŒŸ GiĂºp #catHungWrapper bĂ¡m theo khung LĂ¡ Sá»‘, náº±m bĂªn pháº£i
document.addEventListener("DOMContentLoaded", () => {
  const laso = document.getElementById("lasoContainer");
  const catHung = document.getElementById("catHungWrapper");
  if (!laso || !catHung) return;

  function capNhatViTriBang() {
    const rect = laso.getBoundingClientRect();
    catHung.style.position = "fixed";

    // âœ… Canh bĂªn pháº£i khung LĂ¡ Sá»‘
    catHung.style.top = rect.top - 0 + "px";   // đŸ”¼ nĂ¢ng báº£ng lĂªn ngang tiĂªu Ä‘á»
catHung.style.left = rect.right + 10 + "px";

  }

  // Cáº­p nháº­t khi cuá»™n, resize hoáº·c khi báº­t báº£ng
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

  // đŸŒŸ Cáº­p nháº­t vá»‹ trĂ­ báº£ng bĂ¡m theo lĂ¡ sá»‘
  function capNhatViTriBang() {
    const rect = laso.getBoundingClientRect();
    wrap.style.position = "fixed";
    wrap.style.top = rect.top + "px";
    wrap.style.left = rect.right + 20 + "px";
  }
  window.addEventListener("scroll", capNhatViTriBang);
  window.addEventListener("resize", capNhatViTriBang);
  capNhatViTriBang();

  // đŸŒŸ áº¨n báº£ng khi bá» tick
  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) {
      wrap.style.display = "none";
      wrap.querySelector("#catHungNoiDung").innerHTML = "";
    }
  });

  // đŸŒŸ Ghi Ä‘Ă¨ trá»±c tiáº¿p vĂ o hĂ m chĂ­nh Ä‘á»ƒ kiá»ƒm tra tick
  const goc = window.capNhatBangCatHung;
  window.capNhatBangCatHung = function (...args) {
    if (!checkbox.checked) {
      wrap.style.display = "none"; // áº©n náº¿u chÆ°a tick
      return;
    }
    if (typeof goc === "function") {
      goc.apply(this, args);
      wrap.style.display = "block"; // hiá»‡n náº¿u tick + click cung
    }
  };
  if (typeof renderCachCucList === "function") renderCachCucList();
console.log("âœ… renderCachCucList() Ä‘Ă£ cháº¡y");

});

// đŸŒŸ áº¨n toĂ n bá»™ sao Tiá»ƒu Tinh ngay khi táº£i trang
document.addEventListener("DOMContentLoaded", () => {
  const allTieuTinh = document.querySelectorAll(".tieutinh");
  allTieuTinh.forEach(el => {
    el.classList.add("hidden");
    el.style.display = "none";
  });

  // Äá»“ng thá»i bá» tráº¡ng thĂ¡i "active" cá»§a táº¥t cáº£ nĂºt náº¿u cĂ³
  const allButtons = document.querySelectorAll(".nut-tieutinh");
  allButtons.forEach(btn => btn.classList.remove("active"));
});

// đŸŒŸ Tá»± Ä‘á»™ng áº©n Tiá»ƒu Tinh sau khi an lĂ¡ sá»‘ xong (náº¿u nĂºt chÆ°a báº­t)
document.addEventListener("DOMContentLoaded", () => {
  // Theo dĂµi DOM Ä‘á»ƒ phĂ¡t hiá»‡n khi lĂ¡ sá»‘ má»›i Ä‘Æ°á»£c an ra
  const observer = new MutationObserver(() => {
    // Kiá»ƒm tra náº¿u cĂ¡c nĂºt tiá»ƒu tinh tá»“n táº¡i
    const btns = document.querySelectorAll(".nut-tieutinh");
    if (btns.length > 0) {
      const hasActive = [...btns].some(b => b.classList.contains("active"));
      if (!hasActive) {
        // Náº¿u chÆ°a báº­t nhĂ³m nĂ o â†’ áº©n toĂ n bá»™ sao Tiá»ƒu Tinh
        document.querySelectorAll(".tieutinh").forEach(el => {
          el.classList.add("hidden");
          el.style.display = "none";
        });
      }
    }
  });

  // Theo dĂµi thay Ä‘á»•i trong toĂ n bá»™ body (vĂ¬ lĂ¡ sá»‘ Ä‘Æ°á»£c render láº¡i Ä‘á»™ng)
  observer.observe(document.body, { childList: true, subtree: true });
});
function debugSaoTrongCung(cungID) {
  const cell = document.getElementById("cell" + cungID);
  if (!cell) return console.log("âŒ KhĂ´ng tĂ¬m tháº¥y cell", cungID);
  const layer = cell.querySelector(".layer-6");
  if (!layer) return console.log("âŒ KhĂ´ng cĂ³ layer-6 trong cell", cungID);

  console.log("đŸ” Ná»™i dung tháº­t cá»§a cell" + cungID + ":");
  layer.querySelectorAll(".hung-tinh div, .cat-tinh div").forEach((el,i)=>{
    console.log(i+1, JSON.stringify(el.textContent));
  });
}

// =====================================================
// đŸ« NGÄ‚N CLICK VĂ€O PHáº¦N TRá»NG TRONG LAYER-6
// =====================================================
document.querySelectorAll(".layer-6").forEach(layer => {
  layer.addEventListener("click", e => {
    // Náº¿u click vĂ o chĂ­nh layer (vĂ¹ng trá»‘ng) chá»© khĂ´ng pháº£i pháº§n tá»­ con (sao)
    if (e.target === layer) {
      e.stopPropagation();   // cháº·n lan sá»± kiá»‡n lĂªn cung
      e.preventDefault();    // khĂ´ng kĂ­ch hoáº¡t tra cá»©u
      return false;
    }
  });
});
// đŸ“˜ Khi tra cá»©u sao â†’ tá»± má»Ÿ Ä‘Ăºng pháº§n chá»©a sao Ä‘Ă³, chá»‰ thu gá»n pháº§n Tá»ª ÄIá»‚N SAO
window.moPhanTuDienTheoSao = function(tenSao) {
  const clean = __norm(tenSao).replace(/\s+/g, "");

  // đŸ”¹ XĂ¡c Ä‘á»‹nh vĂ¹ng tá»« Ä‘iá»ƒn sao (chá»‰ pháº§n Iâ€“VII)
  const tuDienBox = document.getElementById("tuDienSao");
  if (tuDienBox) {
    // âœ… áº¨n cĂ¡c <ul> chá»‰ bĂªn trong vĂ¹ng #tuDienSao (khĂ´ng lan xuá»‘ng #chuyenDeBox)
    const PHAN_TU_DIEN_CAN_THU = [
      "I. ChĂ­nh Tinh",
      "II. Trung Tinh",
      "III. Tá»© HĂ³a",
      "IV. Lá»™c â€“ MĂ£",
      "V. Tiá»ƒu Tinh",
      "VI. Cung",
      "VII. Tuáº§n â€“ Triá»‡t"
    ];

    // Duyá»‡t cĂ¡c tiĂªu Ä‘á» <h3>, <h4> bĂªn trong #tuDienSao
    const headers = tuDienBox.querySelectorAll("h3, h4");
    headers.forEach(h => {
      const title = h.textContent.trim();
      if (PHAN_TU_DIEN_CAN_THU.some(p => title.startsWith(p))) {
        const next = h.nextElementSibling;
        if (next && next.tagName === "UL") {
          next.style.display = "none"; // áº©n pháº§n Ä‘Ă³
        }
      }
    });
  }

  // đŸ” TĂ¬m danh sĂ¡ch chá»©a sao
 let foundUl = null;
document.querySelectorAll("#tuDienSao ul").forEach(ul => {
  const txt = __norm(ul.textContent).replace(/\s+/g, ""); // bá» háº¿t khoáº£ng tráº¯ng
  if (txt.includes(clean)) foundUl = ul;
});


  if (foundUl) {
    foundUl.style.display = "block";

    // đŸ“ Cuá»™n tá»›i Ä‘Ăºng sao cáº§n tra
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
// đŸ“¥ Náº P Dá»® LIá»†U BACKUP VĂ€O INDEXEDDB
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
          throw new Error("File khĂ´ng há»£p lá»‡!");

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
            alert("âœ… ÄĂ£ náº¡p dá»¯ liá»‡u vĂ o IndexedDB thĂ nh cĂ´ng!");
            location.reload();
          };
        };
      } catch (err) {
        console.error("â ï¸ Lá»—i Ä‘á»c backup:", err);
        alert("â ï¸ File JSON khĂ´ng há»£p lá»‡ hoáº·c bá»‹ há»ng!");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// =====================================================
// đŸ’¾ LÆ¯U BACKUP INDEXEDDB RA FILE
// =====================================================
function exportBackupIndexedDB() {
  const req = indexedDB.open("TuViDB", 1);
  req.onsuccess = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      alert("â ï¸ ChÆ°a cĂ³ dá»¯ liá»‡u Ä‘á»ƒ xuáº¥t!");
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
        alert("âœ… ÄĂ£ xuáº¥t backup IndexedDB thĂ nh cĂ´ng!");
      };
    };
  };
  req.onerror = e => alert("â ï¸ KhĂ´ng thá»ƒ Ä‘á»c IndexedDB!");
}

// =====================================================
// đŸ§© Táº O 2 NĂT GĂ“C PHáº¢I TRĂN (đŸ“‚ & đŸ’¾)
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

  // đŸ“‚ NĂºt Náº¡p
  const btnLoad = document.createElement("button");
  btnLoad.textContent = "đŸ“‚";
  btnLoad.title = "Náº¡p backup JSON vĂ o IndexedDB";
  btnLoad.onclick = importBackupFile;

  // đŸ’¾ NĂºt LÆ°u
  const btnSave = document.createElement("button");
  btnSave.textContent = "đŸ’¾";
  btnSave.title = "LÆ°u toĂ n bá»™ IndexedDB ra file backup";
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
// đŸ’¾ HĂ€M LÆ¯U / Náº P Dá»® LIá»†U Báº°NG IndexedDB (dung lÆ°á»£ng lá»›n, an toĂ n)
// =======================================================
function saveToIndexedDB(key, value) {
  const req = indexedDB.open("TuViDB", 1);

  // đŸ”¹ Náº¿u CSDL chÆ°a cĂ³ â†’ táº¡o object store
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("đŸ†• ÄĂ£ táº¡o object store 'jsonStore' trong TuViDB");
    }
  };

  req.onsuccess = e => {
    const db = e.target.result;
    // âœ… Äáº£m báº£o cĂ³ store trÆ°á»›c khi ghi
    if (!db.objectStoreNames.contains("jsonStore")) {
      console.warn("â ï¸ ChÆ°a cĂ³ store 'jsonStore', Ä‘ang táº¡o láº¡i...");
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
        console.log(`đŸ’¾ LÆ°u láº¡i '${key}' sau khi táº¡o store.`);
      };
      return;
    }
    // đŸ§  Ghi dá»¯ liá»‡u náº¿u store Ä‘Ă£ cĂ³
    const tx = db.transaction("jsonStore", "readwrite");
    tx.objectStore("jsonStore").put(value, key);
    console.log(`đŸ’¾ ÄĂ£ lÆ°u dá»¯ liá»‡u '${key}' vĂ o IndexedDB.`);
  };

  req.onerror = e => console.warn("â ï¸ Lá»—i IndexedDB:", e);
}

// =======================================================
// đŸ—„ï¸ SHIM localStorage â†’ chá»‰ lÆ°u IndexedDB (di chuyá»ƒn dá»¯ liá»‡u cÅ© sang)
// =======================================================
(function initLocalStorageShim() {
  const LS = window.localStorage;
  const REAL_KEY_FN = LS.key ? LS.key.bind(LS) : null;
  const CACHE_KEY = "__LOCAL_STORAGE_CACHE__";
  let CACHE = {};

  const persist = () => saveToIndexedDB(CACHE_KEY, JSON.stringify(CACHE));

  // Náº¡p cache tá»« IndexedDB, náº¿u trá»‘ng thĂ¬ import má»™t láº§n tá»« localStorage cÅ© rá»“i xĂ³a
  loadFromIndexedDB(CACHE_KEY, data => {
    try { CACHE = data ? JSON.parse(data) : {}; } catch { CACHE = {}; }

    // Import dá»¯ liá»‡u cÅ© tá»« localStorage (náº¿u cĂ³), rá»“i dá»n sáº¡ch Ä‘á»ƒ ngÄƒn ghi má»›i
    try {
      Object.keys(LS).forEach(k => {
        if (!CACHE.hasOwnProperty(k)) CACHE[k] = LS.getItem(k);
      });
      if (LS.clear) LS.clear();
    } catch (e) {
      console.warn("â ï¸ KhĂ´ng dá»n Ä‘Æ°á»£c localStorage gá»‘c:", e);
    }

    // Ghi láº¡i cache vĂ o IndexedDB sau import
    persist();

    // Ghi Ä‘Ă¨ cĂ¡c method Ä‘á»ƒ chá»‰ thao tĂ¡c trĂªn CACHE + IndexedDB
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

  // đŸ”¹ Äáº£m báº£o táº¡o store náº¿u chÆ°a cĂ³
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      db.createObjectStore("jsonStore");
      console.log("đŸ†• Táº¡o store 'jsonStore' (láº§n Ä‘áº§u load)");
    }
  };

  req.onsuccess = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("jsonStore")) {
      console.warn("â ï¸ KhĂ´ng tĂ¬m tháº¥y store 'jsonStore', tráº£ vá» rá»—ng.");
      callback(null);
      return;
    }
    const tx = db.transaction("jsonStore", "readonly");
    const store = tx.objectStore("jsonStore");
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      console.log(`đŸ“¦ Load '${key}' tá»« IndexedDB`, getReq.result ? "(âœ”ï¸ cĂ³ dá»¯ liá»‡u)" : "(âŒ trá»‘ng)");
      callback(getReq.result);
    };
    getReq.onerror = () => {
      console.warn(`â ï¸ KhĂ´ng Ä‘á»c Ä‘Æ°á»£c '${key}' tá»« IndexedDB.`);
      callback(null);
    };
  };

  req.onerror = e => console.warn("â ï¸ Lá»—i IndexedDB:", e);
}

// =====================================================
// đŸ“¤ HĂ€M XUáº¤T Dá»® LIá»†U JSON (CHO NĂT đŸ’¾) â€“ Äá»ŒC Tá»ª INDEXEDDB
// =====================================================
function exportData() {
  try {
const exportKeys = ["SAO_DATA", "CHUYEN_DE_DATA", "CHUYEN_DE_CAY", "CACH_CUC_DATA"];
    const result = {};

    // HĂ m phá»¥: Ä‘á»c tuáº§n tá»± tá»«ng key trong IndexedDB
    const readNext = (index = 0) => {
      if (index >= exportKeys.length) {
        // âœ… Khi Ä‘á»c xong háº¿t â†’ táº¡o file JSON
        const blob = new Blob([JSON.stringify(result, null, 2)], {
          type: "application/json"
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "TuVi_FullBackup.json";
        a.click();
        URL.revokeObjectURL(a.href);
        console.log("âœ… ÄĂ£ xuáº¥t toĂ n bá»™ dá»¯ liá»‡u tá»« IndexedDB ra file JSON.");
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

    // Báº¯t Ä‘áº§u Ä‘á»c tuáº§n tá»± tá»«ng má»¥c
    readNext();
  } catch (err) {
    console.error("â ï¸ Lá»—i exportData:", err);
  }
}
/* ==========================================================
   đŸ¨ Ă‰P MĂ€U SĂNG CHO TOĂ€N Bá»˜ SAO SAU KHI AN SAO (báº£n tá»‘i Æ°u)
   ========================================================== */
function epMauSaoSang() {
  const mauHanh = {
    "sao-há»a":  "#ff4d4d",   // đŸ”¥ Há»a â€“ Ä‘á» tÆ°Æ¡i sĂ¡ng, rĂµ nĂ©t
    "sao-thá»•":  "#e69500",   // đŸŸ  Thá»• â€“ cam Ä‘áº¥t Ä‘áº­m, khĂ´ng gáº¯t
    "sao-má»™c":  "#007a29",   // đŸŒ¿ Má»™c â€“ xanh lĂ¡ Ä‘áº­m rĂµ chá»¯
    "sao-kim":  "#000000",   // â« Kim â€“ Ä‘en thuáº§n, khĂ´ng báº¡c mĂ u
    "sao-thá»§y": "#004cff"    // đŸ’§ Thá»§y â€“ xanh dÆ°Æ¡ng Ä‘áº­m sĂ¡ng
  };

  Object.entries(mauHanh).forEach(([cls, color]) => {
    document.querySelectorAll(`.${cls}`).forEach(el => {
      el.style.setProperty("color", color, "important");
    });
  });
}

/* đŸª¶ Tá»± kĂ­ch hoáº¡t sau khi cĂ¡c sao Ä‘Æ°á»£c an xong */
document.addEventListener("DOMContentLoaded", () => {
  const target = document.getElementById("lasoContainer");
  if (!target) return;

  const observer = new MutationObserver(() => {
    epMauSaoSang();
  });
  observer.observe(target, { childList: true, subtree: true });
});


// =====================================================
// đŸ” TĂŒM NODE THEO ID (tráº£ cáº£ parentData vĂ  key)
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
  console.log("đŸ“ TĂ¬m node cha theo id =", id, "â†’", found);

  if (!found) return alert("KhĂ´ng tĂ¬m tháº¥y chuyĂªn Ä‘á» cha!");
  const { node } = found;
  const name = prompt("Nháº­p tĂªn má»¥c con má»›i:");
  if (!name) return;

  if (!node.children) node.children = {};
  node.children[name] = { id: generateId(), noiDung: "", children: {} };
  luuChuyenDe();
  renderChuyenDe(false);
  console.log("âœ… ÄĂ£ thĂªm má»¥c con", name, "vĂ o node", node);
}


// âŒ XĂ³a theo id
function xoaMucTheoId(id) {
  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) return alert("KhĂ´ng tĂ¬m tháº¥y má»¥c cáº§n xĂ³a");
  const { key, parentData } = found;
  delete parentData[key];
  luuChuyenDe();
  renderChuyenDe(false);
  if (typeof saveNewOrder === "function") saveNewOrder();
}
// =====================================================
// đŸ“˜ HĂ€M Má» POPUP CHUYĂN Äá»€ THEO ID (phiĂªn báº£n theo cáº¥u trĂºc má»›i cĂ³ id)
// =====================================================
window.moPopupChuyenDeTheoId = function (id, tenHienThi = "") {
  // đŸ§ Cháº·n ngÆ°á»i chÆ°a premium má»Ÿ popup chuyĂªn Ä‘á»
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block moPopupChuyenDeTheoId vĂ¬ user chÆ°a premium");
    return;
  }

  const found = findNodeByIdWithParent(CHUYEN_DE_DATA, id);
  if (!found) {
    alert("KhĂ´ng tĂ¬m tháº¥y chuyĂªn Ä‘á» cĂ³ ID nĂ y!");
    return;
  }

  const { node } = found;
  window.currentChuyenDeId = id;
  window.currentChuyenDeName = tenHienThi;

  document.getElementById("tenChuyenDe").innerText = tenHienThi || "(KhĂ´ng cĂ³ tĂªn)";
  document.getElementById("noiDungChuyenDe").innerHTML =
    node.noiDung || "<i style='color:#777;'>ChÆ°a cĂ³ ná»™i dung.</i>";

  // Cháº¿ Ä‘á»™ xem
  document.getElementById("toolbarChuyenDe").style.display = "none";
  document.getElementById("btnEditCD").style.display = "";
  document.getElementById("btnChiTietCD").style.display = "";
  document.getElementById("btnSaveCD").style.display = "none";
  document.getElementById("btnCancelCD").style.display = "none";

  document.getElementById("noiDungChuyenDe").setAttribute("contenteditable", "false");
  document.getElementById("popupChuyenDe").style.display = "flex";
};

/* ======================================================
   đŸ“˜ LOGIC CĂCH Cá»¤C
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

// đŸ”„ Náº¡p tá»« file DATA.json náº¿u DB trá»‘ng (CACH_CUC_DATA Ä‘Æ°á»£c lÆ°u dáº¡ng string JSON)
async function loadCachCucFromFile() {
  try {
    console.log("â„¹ï¸ Thá»­ náº¡p CACH_CUC_DATA tá»« DATA.json ...");
    const resp = await fetch("./DATA.json", { cache: "no-cache" });
    if (!resp.ok) {
      console.warn("â ï¸ KhĂ´ng Ä‘á»c Ä‘Æ°á»£c DATA.json, status:", resp.status);
      return;
    }
    const text = await resp.text();
    console.log("â„¹ï¸ DATA.json bytes:", text.length);
    let root;
    try {
      root = JSON.parse(text);
    } catch (e) {
      console.warn("â ï¸ Parse DATA.json lá»—i:", e);
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
        console.warn("â ï¸ KhĂ´ng parse Ä‘Æ°á»£c CACH_CUC_DATA trong file:", e);
      }
    }
    if (Array.isArray(arr) && arr.length) {
      CACH_CUC_DATA = arr;
      window.CACH_CUC_DATA = arr;
      syncCachCucStore();
      if (typeof renderCachCucList === "function") renderCachCucList();
      console.log("âœ… ÄĂ£ náº¡p CACH_CUC_DATA tá»« DATA.json:", arr.length);
      markCachCucReady();
      return;
    }
    console.warn("â ï¸ DATA.json khĂ´ng chá»©a CACH_CUC_DATA há»£p lá»‡ hoáº·c rá»—ng");
  } catch (e) {
    console.warn("â ï¸ Lá»—i náº¡p CACH_CUC_DATA tá»« file:", e);
  }
}

// đŸ”„ Náº¡p CACH_CUC_DATA tá»« IndexedDB (fallback localStorage)
loadFromIndexedDB("CACH_CUC_DATA", data => {
  try {
    const fromDB = data ? JSON.parse(data) : null;
    CACH_CUC_DATA = Array.isArray(fromDB) ? fromDB : [];
  } catch (e) {
    console.warn("â ï¸ KhĂ´ng parse Ä‘Æ°á»£c CACH_CUC_DATA, dĂ¹ng localStorage:", e);
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
    // DB trá»‘ng -> thá»­ náº¡p tá»« file DATA.json
    console.warn("â ï¸ CACH_CUC_DATA trá»‘ng, thá»­ náº¡p tá»« DATA.json");
    loadCachCucFromFile().then(() => {
      if (!CACH_CUC_DATA.length) {
        console.warn("â ï¸ KhĂ´ng náº¡p Ä‘Æ°á»£c CACH_CUC_DATA tá»« file.");
        markCachCucReady();
      }
    });
  }
});

// Theo dĂµi khi CACH_CUC_READY resolve Ä‘á»ƒ debug
CACH_CUC_READY.then(() => {
  console.log("â„¹ï¸ CACH_CUC_READY resolved, length:", (window.CACH_CUC_DATA || []).length);
});

// Cho phĂ©p gá»i thá»§ cĂ´ng trong console
window.debugLoadCachCuc = loadCachCucFromFile;

// âœ… Tiá»‡n Ă­ch: náº¡p CĂ¡ch Cá»¥c tá»« JSON thá»§ cĂ´ng (dĂ¹ng trong Console)
window.restoreCachCucData = function (json) {
  try {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!Array.isArray(data)) throw new Error("Cáº§n máº£ng CĂ¡ch Cá»¥c");
    CACH_CUC_DATA = data;
    window.CACH_CUC_DATA = data;
    syncCachCucStore();
    if (typeof renderCachCucList === "function") renderCachCucList();
    console.log("âœ… ÄĂ£ náº¡p CACH_CUC_DATA thá»§ cĂ´ng:", data.length, "báº£n ghi");
    markCachCucReady();
  } catch (e) {
    console.error("âŒ KhĂ´ng náº¡p Ä‘Æ°á»£c CACH_CUC_DATA:", e.message || e);
  }
};

// đŸ” Äáº£m báº£o láº§n load Ä‘áº§u luĂ´n cĂ³ dá»¯ liá»‡u (fallback náº¿u IndexedDB/localStorage Ä‘á»u trá»‘ng)
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
    div.innerHTML = '<i style="color:#777;">ChÆ°a cĂ³ cĂ¡ch cá»¥c nĂ o.</i>';
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
    <small style="color:#555;">(${cc.dieuKien.length} Ä‘iá»u kiá»‡n)</small>
  </div>
<div class="cc-actions" style="display:flex;align-items:center;gap:3px;margin-left:4px;">
    <button class="edit-cc" data-index="${i}" title="Sá»­a" 
  style="background:none;border:none;color:#7a1ea1;cursor:pointer;font-size:14px;padding:0 2px;">âœï¸</button>

<button class="delete-cc" data-index="${i}" title="XĂ³a" 
  style="background:none;border:none;color:#b50000;cursor:pointer;font-size:14px;padding:0 2px;">đŸ—‘ï¸</button>

`;

    // overlay khĂ³a cho tá»«ng item náº¿u chÆ°a premium
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

  // Ăp láº¡i khĂ³a/overlay sau khi render
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
    <label style="font-weight:600;">Biáº¿n:</label>
    <select class="bien" style="padding:4px 6px;border:1px solid #ccc;border-radius:4px;">
      <option value="">-- Chá»n Biáº¿n --</option>
      <option value="cungVi">Cung Vá»‹</option>
      <option value="cungChuc">Cung Chá»©c</option>
      <option value="chinhTinh_ChinhCung">ChĂ­nh Tinh (ChĂ­nh Cung)</option>
      <option value="trungTinh_ChinhCung">Trung Tinh (ChĂ­nh Cung)</option>
      <option value="chinhTinh_TamHop">ChĂ­nh Tinh (Tam Há»£p)</option>
      <option value="trungTinh_TamHop">Trung Tinh (Tam Há»£p)</option>
      <option value="giapCung_ChinhTinh">GiĂ¡p Cung (ChĂ­nh Tinh)</option>
      <option value="giapCung_TrungTinh">GiĂ¡p Cung (Trung Tinh)</option>
      <option value="giapCung_KetHop">GiĂ¡p Cung (Káº¿t Há»£p)</option>
      <option value="thuocCach">Thuá»™c CĂ¡ch</option>
    </select>

    <div class="giaTriBox"></div>
  `;

  const selectBien = dk.querySelector(".bien");
  const box = dk.querySelector(".giaTriBox");

  selectBien.value = bien;

// Táº O UI dá»±a trĂªn biáº¿n
renderGiaTriTheoBien(selectBien, box, giaTri);


  // ==========================
  // đŸ”¥ CUNG CHá»¨C OR
  // ==========================
  if (bien === "cungChuc") {
    box.innerHTML = "";
    const ds = [
      "Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch",
      "ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"
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
  // đŸ”¥ CHĂNH TINH nhĂ³m AND/OR
  // ==========================
  if (bien === "chinhTinh_ChinhCung" || bien === "chinhTinh_TamHop") {

    const ds = [
      "VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
      "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
      "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng"
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
      title.textContent = "NhĂ³m ChĂ­nh Tinh (AND trong nhĂ³m):";
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
  // đŸ”¥ BIáº¾N KHĂC â€“ GIá»® NGUYĂN
  // ==========================
  const selects = dk.querySelectorAll(".giaTri");
  giaTri.forEach((v, index) => { if (selects[index]) selects[index].value = v; });

  return container.appendChild(dk);
}


// âœï¸ Sá»­a & đŸ—‘ï¸ XĂ³a CĂ¡ch Cá»¥c
document.addEventListener("click",(e)=>{

  // âœï¸ Sá»­a CĂ¡ch Cá»¥c
  if (e.target.closest(".edit-cc")) {
    e.stopPropagation();   // â­ KHĂ”NG CHO LAN XUá»NG LISTENER 2

    const i = e.target.closest(".edit-cc").dataset.index;
    const cc = CACH_CUC_DATA[i];

    const popup = document.getElementById("popupCachCuc");
    popup.style.display = "flex";
    popup.dataset.editIndex = i;

    // tĂªn
    const tenInput = popup.querySelector(".cc-ten-input");
    if (tenInput) tenInput.value = cc.ten;

    // xĂ³a UI Ä‘iá»u kiá»‡n cÅ©
    const dkContainer = document.getElementById("dieuKienContainer");
    dkContainer.innerHTML = "";

    // tĂ¡i táº¡o Ä‘iá»u kiá»‡n theo phiĂªn báº£n UI má»›i
    cc.dieuKien.forEach(dk => {
      taoUIChoDieuKien(dk.bien, dk.giaTri, dkContainer);
    });

    return;
  }

  // đŸ—‘ï¸ XĂ³a
  if(e.target.closest(".delete-cc")){
    e.stopPropagation();  // â­ trĂ¡nh lan xuá»‘ng dÆ°á»›i

    const i = e.target.closest(".delete-cc").dataset.index;
    if(confirm("XĂ³a CĂ¡ch Cá»¥c nĂ y?")){
      CACH_CUC_DATA.splice(i, 1);
      syncCachCucStore();
      renderCachCucList();
    }
    return;
  }
});




// Popup xá»­ lĂ½
document.addEventListener("click",(e)=>{
 // â­ FIX KHĂ”NG CHá»ˆNH Sá»¬A ÄÆ¯á»¢C â­
  const popup = document.getElementById("popupCachCuc");
// âŒ Chá»‰ cháº·n click RA NGOĂ€I popup, KHĂ”NG cháº·n nĂºt bĂªn trong
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
    popup.removeAttribute("data-editIndex"); // XĂ“A INDEX CÅ¨ !!!
    document.getElementById("dieuKienContainer").innerHTML = "";
    const tenInput = document.querySelector("#popupCachCuc .cc-ten-input");
    if (tenInput) tenInput.value = ""; // xoĂ¡ tĂªn cÅ© náº¿u cĂ³
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
    <label style="font-weight:600;">Biáº¿n:</label>
    <select class="bien" style="padding:4px 6px;border:1px solid #ccc;border-radius:4px;">
      <option value="">-- Chá»n Biáº¿n --</option>
      <option value="cungVi">Cung Vá»‹</option>
      <option value="cungChuc">Cung Chá»©c</option>
      <option value="chinhTinh_ChinhCung">ChĂ­nh Tinh (ChĂ­nh Cung)</option>
      <option value="trungTinh_ChinhCung">Trung Tinh (ChĂ­nh Cung)</option>
      <option value="chinhTinh_TamHop">ChĂ­nh Tinh (Tam Há»£p)</option>
      <option value="trungTinh_TamHop">Trung Tinh (Tam Há»£p)</option>
      <option value="giapCung_ChinhTinh">GiĂ¡p Cung (ChĂ­nh Tinh)</option>
      <option value="giapCung_TrungTinh">GiĂ¡p Cung (Trung Tinh)</option>
<option value="giapCung_KetHop">GiĂ¡p Cung (Káº¿t Há»£p)</option>

      <option value="thuocCach">Thuá»™c CĂ¡ch</option>
    </select>

    <div class="giaTriBox">
      <label>GiĂ¡ trá»‹ (phĂ¢n tĂ¡ch bá»Ÿi dáº¥u pháº©y):</label>
      <input class="giaTri" placeholder="VD: Tá»­ Vi, ThiĂªn TÆ°á»›ng"
             style="width:100%;padding:5px 6px;border:1px solid #ccc;border-radius:4px;">
    </div>
  `;

  const selectBien = dk.querySelector(".bien");
  const giaTriBox = dk.querySelector(".giaTriBox");

selectBien.addEventListener("change", () => {
  const val = selectBien.value;
  const box = giaTriBox;
  box.innerHTML = ""; // reset ná»™i dung

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
// 1ï¸âƒ£ CUNG Vá» (Há»— trá»£ nhiá»u lá»±a chá»n OR)
// ===============================
if (val === "cungVi") {
  const ds = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

  const wrap = document.createElement("div");
  wrap.className = "cungViList";
  wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;";

  // HĂ m thĂªm 1 dropdown chá»n cung vá»‹
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

  // ThĂªm dropdown Ä‘áº§u tiĂªn
  addSelect();

  // NĂºt thĂªm cung (OR)
  const btn = document.createElement("button");
  btn.textContent = "â• ThĂªm Cung (OR)";
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
  note.textContent = "đŸ’¡ CĂ³ thá»ƒ chá»n nhiá»u cung â€” nghÄ©a lĂ  thá»a báº¥t ká»³ cung nĂ o (Ä‘iá»u kiá»‡n OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}



 // ===============================
// 2ï¸âƒ£ CUNG CHá»¨C (nhiá»u lá»±a chá»n OR)
// ===============================
if (val === "cungChuc") {
  const ds = [
    "Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch",
    "ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"
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

  // máº·c Ä‘á»‹nh 1 dĂ²ng
  addSelect();

  const btn = document.createElement("button");
  btn.textContent = "â• ThĂªm Cung Chá»©c (OR)";
  btn.style.cssText = `
    background:#7b2cbf;color:#fff;border:none;border-radius:4px;
    padding:4px 10px;cursor:pointer;width:max-content;
  `;
  btn.onclick = () => addSelect();

  box.appendChild(wrap);
  box.appendChild(btn);

  const note = document.createElement("small");
  note.textContent = "đŸ’¡ Báº¡n cĂ³ thá»ƒ thĂªm nhiá»u Cung Chá»©c â€” nghÄ©a lĂ  thá»a báº¥t ká»³ cung nĂ o (Ä‘iá»u kiá»‡n OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}


// ===============================
// 3ï¸âƒ£ CHĂNH TINH (ChĂ­nh Cung / Tam Há»£p)
// ===============================
if (val === "chinhTinh_ChinhCung" || val === "chinhTinh_TamHop") {

  const ds = [
    "VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
    "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
    "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng"
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

    group.innerHTML = `<b>NhĂ³m ChĂ­nh Tinh (AND trong nhĂ³m):</b>`;

    const box = document.createElement("div");
    box.className = "saoBox";
    box.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    // Táº¡o cĂ¡c select tá»« values (load khi sá»­a)
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

    // Náº¿u thĂªm má»›i mĂ  chÆ°a cĂ³ gĂ¬, táº¡o 1 select
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
    btn.textContent = "â• ThĂªm Sao (tá»‘i Ä‘a 2)";
    btn.style.cssText = `
      background:#7b2cbf;color:#fff;border:none;border-radius:4px;
      padding:4px 10px;cursor:pointer;width:max-content;
    `;
    btn.onclick = () => addSelect();

    group.appendChild(btn);
    wrap.appendChild(group);
  }

  // NhĂ³m Ä‘áº§u tiĂªn
  addGroup();

  const addGroupBtn = document.createElement("button");
  addGroupBtn.textContent = "â• ThĂªm NhĂ³m ChĂ­nh Tinh (OR)";
  addGroupBtn.style.cssText = `
    background:#4c1d95;color:#fff;border:none;border-radius:4px;
    padding:5px 12px;cursor:pointer;width:max-content;
  `;
  addGroupBtn.onclick = () => addGroup();

  box.appendChild(wrap);
  box.appendChild(addGroupBtn);

  const note = document.createElement("small");
  note.textContent = "đŸ’¡ Má»™t nhĂ³m = AND. Nhiá»u nhĂ³m = OR giá»¯a cĂ¡c nhĂ³m.";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}


  // ===============================
  // 4ï¸âƒ£ TRUNG TINH (CHĂNH CUNG)
  // ===============================
  if (val === "trungTinh_ChinhCung") {
    const ds = [
      "Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
      "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
      "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = () => {
      wrap.appendChild(taoSelect(ds));
    };

    const btn = document.createElement("button");
    btn.textContent = "â• ThĂªm Trung Tinh";
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
  // 5ï¸âƒ£ TRUNG TINH (TAM Há»¢P)
  // ===============================
  if (val === "trungTinh_TamHop") {
    const ds = [
      "Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
      "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
      "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"
    ];

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const addSelect = () => {
      wrap.appendChild(taoSelect(ds));
    };

    const btn = document.createElement("button");
    btn.textContent = "â• ThĂªm Trung Tinh";
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
    note.textContent = "đŸ’¡ Ăp dá»¥ng cho cáº£ Trung Tinh ChĂ­nh Cung vĂ  Tam Há»£p";
    note.style.color = "#666";
    box.appendChild(note);
    return;
  }

  // ===============================
  // 6ï¸âƒ£ GIĂP CUNG (CHĂNH TINH / TRUNG TINH)
  // ===============================
  if (val === "giapCung_ChinhTinh" || val === "giapCung_TrungTinh") {
    const isChinh = val.includes("Chinh");
    const ds = isChinh
      ? ["VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
         "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
         "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng"]
      : ["Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
         "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
         "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"];

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
    lbl1.textContent = "Sao TrÆ°á»›c:";
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
// 6ï¸âƒ£ GIĂP CUNG (Káº¾T Há»¢P CHĂNH + TRUNG TINH)
// ===============================
if (val === "giapCung_KetHop") {
  const ds = [
    "VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
    "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
    "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng",
    "Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
    "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
    "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"
  ];

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:12px;
  `;

  // ==== SAO TRÆ¯á»C ====
  const truocWrap = document.createElement("div");
  truocWrap.innerHTML = `<label><b>Sao TrÆ°á»›c:</b></label>`;
  const truocBox = document.createElement("div");
  truocBox.className = "giap-truoc-box";
  truocWrap.appendChild(truocBox);

  const btnTruoc = document.createElement("button");
  btnTruoc.textContent = "+ ThĂªm Sao TrÆ°á»›c";
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
  btnSau.textContent = "+ ThĂªm Sao Sau";
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
  // 7ï¸âƒ£ THUá»˜C CĂCH
  // ===============================
 if (val === "thuocCach") {
  const ds = [
    "Hung",
    "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn Hung",
    "CĂ¡t Hung Láº«n Lá»™n",
    "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn CĂ¡t",
    "CĂ¡t"
  ];

  // VĂ¹ng chá»©a cĂ¡c dropdown
  const listWrap = document.createElement("div");
  listWrap.className = "thuocCachList";

  // HĂ m thĂªm 1 dropdown má»›i
  function addSelect(value = "") {
    const sel = taoSelect(ds);
    if (value) sel.value = value;
    sel.style.marginRight = "4px";
    listWrap.appendChild(sel);
  }

  // ThĂªm dropdown Ä‘áº§u tiĂªn
  addSelect();

  // NĂºt thĂªm lá»±a chá»n
  const btnAdd = document.createElement("button");
  btnAdd.textContent = "â•";
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
  // 8ï¸âƒ£ Máº¶C Äá»NH â€” náº¿u chÆ°a cĂ³ nhĂ³m
  // ===============================
  const empty = document.createElement("i");
  empty.textContent = "ChÆ°a cĂ³ dá»¯ liá»‡u cho biáº¿n nĂ y.";
  empty.style.color = "#777";
  box.appendChild(empty);
});



  document.getElementById("dieuKienContainer").appendChild(dk);
}






if (e.target.id === "btnSaveCachCuc") {
  const tenInput = document.querySelector("#popupCachCuc .cc-ten-input");
  const ten = tenInput ? tenInput.value.trim() : "";
  if (!ten) return alert("Nháº­p tĂªn!");

  const dieuKien = [];

  document.querySelectorAll("#dieuKienContainer .dk-item").forEach((dk) => {
    const bien = dk.querySelector(".bien")?.value || "";
    if (!bien) return;

    let giaTri = [];

    // â–ï¸ TrÆ°á»ng há»£p GIĂP CUNG
    if (bien.startsWith("giapCung_")) {
      // đŸ¯ GiĂ¡p ChĂ­nh / Trung tinh: chá»‰ cĂ³ 2 select (1 trÆ°á»›c, 1 sau)
      if (bien === "giapCung_ChinhTinh" || bien === "giapCung_TrungTinh") {
        const selects = dk.querySelectorAll("select.giaTri");
        const truocVal = selects[0]?.value?.trim();
        const sauVal   = selects[1]?.value?.trim();
        giaTri = {
          truoc: truocVal ? [truocVal] : [],
          sau:   sauVal   ? [sauVal]   : []
        };
      }

      // đŸ¯ GiĂ¡p Káº¿t Há»£p: cĂ³ thá»ƒ thĂªm nhiá»u sao má»—i bĂªn
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

   // â–ï¸ TrÆ°á»ng há»£p CHĂNH TINH nhiá»u nhĂ³m (AND trong nhĂ³m, OR giá»¯a nhĂ³m)
else if (bien === "chinhTinh_ChinhCung" || bien === "chinhTinh_TamHop") {

  const groups = dk.querySelectorAll(".chinhTinhGroup");
  giaTri = [];

  groups.forEach(group => {
    const selects = group.querySelectorAll("select.giaTri");
    const groupVals = Array.from(selects)
      .map(s => s.value.trim())
      .filter(Boolean);

    if (groupVals.length > 0) {
      giaTri.push(groupVals);  // giá»¯ nguyĂªn cáº¥u trĂºc nhĂ³m
    }
  });
}

// đŸ§© CĂ¡c loáº¡i Ä‘iá»u kiá»‡n khĂ¡c (giá»‘ng cÅ©)
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
console.log("đŸ‘‰ Dá»® LIá»†U LÆ¯U:", JSON.stringify(dieuKien, null, 2));

  // đŸª¶ LÆ°u vĂ o bá»™ dá»¯ liá»‡u
// đŸª¶ LÆ°u vĂ o bá»™ dá»¯ liá»‡u
const popup = document.getElementById("popupCachCuc");
const editIndexRaw = popup.dataset.editIndex;

// Ă©p sá»‘ náº¿u cĂ³
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
// đŸ”§ HĂ€M DĂ™NG CHUNG â€” RENDER DROPDOWN GIĂ TRá» THEO BIáº¾N
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
  // 1ï¸âƒ£ CUNG Vá»
  // ===============================
if (val === "cungVi") {
  const ds = ["TĂ½","Sá»­u","Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i"];

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

  // thĂªm 1 dĂ²ng máº·c Ä‘á»‹nh
  addSelect();

  const btn = document.createElement("button");
  btn.textContent = "â• ThĂªm Cung (OR)";
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
  note.textContent = "đŸ’¡ CĂ³ thá»ƒ chá»n nhiá»u cung â€” nghÄ©a lĂ  thá»a báº¥t ká»³ cung nĂ o (Ä‘iá»u kiá»‡n OR).";
  note.style.color = "#666";
  box.appendChild(note);

  return;
}



  // ===============================
  // 2ï¸âƒ£ CUNG CHá»¨C
  // ===============================
  if (val === "cungChuc") {
    const ds = [
      "Má»‡nh","Huynh Äá»‡","Phu ThĂª","Tá»­ Tá»©c","TĂ i Báº¡ch","Táº­t Ăch",
      "ThiĂªn Di","NĂ´ Bá»™c","Quan Lá»™c","Äiá»n Tráº¡ch","PhĂºc Äá»©c","Phá»¥ Máº«u"
    ];
    box.appendChild(taoSelect(ds));
    return;
  }

  // ===============================
  // 3ï¸âƒ£ CHĂNH TINH (CHĂNH CUNG / TAM Há»¢P)
  // ===============================
  if (val === "chinhTinh_ChinhCung" || val === "chinhTinh_TamHop") {
    const ds = [
      "VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
      "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
      "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng"
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

    // Náº¿u cĂ³ sáºµn dá»¯ liá»‡u cÅ© (1â€“2 sao)
    if (giaTriCu.length > 0) {
      giaTriCu.forEach(v => addSelect(v));
    } else {
      addSelect(); // máº·c Ä‘á»‹nh 1 dropdown trá»‘ng
    }

    // NĂºt thĂªm sao thá»© hai
    const btn = document.createElement("button");
    btn.textContent = "â• ThĂªm ChĂ­nh Tinh";
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
    note.textContent = "đŸ’¡ CĂ³ thá»ƒ chá»n tá»‘i Ä‘a 2 sao hoáº·c 'VĂ´ ChĂ­nh Diá»‡u'";
    note.style.color = "#666";
    box.appendChild(note);
    return;
  }

  // ===============================
  // 4ï¸âƒ£ TRUNG TINH (CHĂNH CUNG)
  // ===============================
  if (val === "trungTinh_ChinhCung") {
    const ds = [
      "Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
      "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
      "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"
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
    btn.textContent = "â• ThĂªm Trung Tinh";
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
  // 5ï¸âƒ£ TRUNG TINH (TAM Há»¢P)
  // ===============================
  if (val === "trungTinh_TamHop") {
    const ds = [
      "Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
      "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
      "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"
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
    btn.textContent = "â• ThĂªm Trung Tinh";
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
    note.textContent = "đŸ’¡ Ăp dá»¥ng cho cáº£ ChĂ­nh Cung vĂ  Tam Há»£p";
    note.style.color = "#666";

    box.appendChild(wrap);
    box.appendChild(btn);
    box.appendChild(note);
    return;
  }

// ===============================
// 6ï¸âƒ£ GIĂP CUNG (CHĂNH TINH / TRUNG TINH)
// ===============================
if (val === "giapCung_ChinhTinh" || val === "giapCung_TrungTinh") {
  const isChinh = val.includes("Chinh");
  const ds = isChinh
    ? ["VĂ´ ChĂ­nh Diá»‡u","Tá»­ Vi","ThiĂªn Phá»§","VÅ© KhĂºc","LiĂªm Trinh","Tham Lang",
       "Cá»± MĂ´n","PhĂ¡ QuĂ¢n","ThiĂªn TÆ°á»›ng","ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡",
       "ThĂ¡i DÆ°Æ¡ng","ThĂ¡i Ă‚m","Tháº¥t SĂ¡t","ThiĂªn Äá»“ng"]
    : ["Táº£ PhĂ¹","Há»¯u Báº­t","VÄƒn XÆ°Æ¡ng","VÄƒn KhĂºc","ThiĂªn KhĂ´i","ThiĂªn Viá»‡t",
       "KĂ¬nh DÆ°Æ¡ng","ÄĂ  La","Há»a Tinh","Linh Tinh","Äá»‹a KhĂ´ng","Äá»‹a Kiáº¿p",
       "HĂ³a Lá»™c","HĂ³a Quyá»n","HĂ³a Khoa","HĂ³a Ká»µ","Lá»™c Tá»“n","ThiĂªn MĂ£"];

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    display:flex;
    gap:16px;
    justify-content:space-between;
    align-items:flex-start;
  `;

  // ==== Cá»˜T TRÆ¯á»C ====
  const col1 = document.createElement("div");
  col1.style.cssText = "flex:1;display:flex;flex-direction:column;gap:4px;";
  const lbl1 = document.createElement("label");
  lbl1.textContent = "Sao TrÆ°á»›c:";
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
    optEmpty.textContent = "-- Chá»n Sao --";
    s.appendChild(optEmpty);
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      if (v === selected) opt.selected = true;
      s.appendChild(opt);
    });
    const del = document.createElement("button");
    del.textContent = "âŒ";
    del.style.cssText = "background:none;border:none;color:#a00;cursor:pointer;";
    del.onclick = (ev) => { ev.preventDefault(); sWrap.remove(); };
    sWrap.appendChild(s);
    sWrap.appendChild(del);
    col1.insertBefore(sWrap, btnAddLeft);
  };

  const btnAddLeft = document.createElement("button");
  btnAddLeft.textContent = "â• ThĂªm Sao TrÆ°á»›c";
  btnAddLeft.style.cssText = "margin-top:4px;background:#9b5de5;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;";
  btnAddLeft.onclick = (ev) => { ev.preventDefault(); addSelectLeft(); };

  col1.appendChild(btnAddLeft);

  // ==== Cá»˜T SAU ====
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
    optEmpty.textContent = "-- Chá»n Sao --";
    s.appendChild(optEmpty);
    ds.forEach(v => {
      const opt = document.createElement("option");
      opt.textContent = v;
      if (v === selected) opt.selected = true;
      s.appendChild(opt);
    });
    const del = document.createElement("button");
    del.textContent = "âŒ";
    del.style.cssText = "background:none;border:none;color:#a00;cursor:pointer;";
    del.onclick = (ev) => { ev.preventDefault(); sWrap.remove(); };
    sWrap.appendChild(s);
    sWrap.appendChild(del);
    col2.insertBefore(sWrap, btnAddRight);
  };

  const btnAddRight = document.createElement("button");
  btnAddRight.textContent = "â• ThĂªm Sao Sau";
  btnAddRight.style.cssText = "margin-top:4px;background:#9b5de5;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;";
  btnAddRight.onclick = (ev) => { ev.preventDefault(); addSelectRight(); };

  col2.appendChild(btnAddRight);

  wrap.appendChild(col1);
  wrap.appendChild(col2);
  box.appendChild(wrap);
  return;
}




 // ===============================
// 7ï¸âƒ£ THUá»˜C CĂCH
// ===============================
if (val === "thuocCach") {
  const ds = [
    "Hung",
    "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn Hung",
    "CĂ¡t Hung Láº«n Lá»™n",
    "BĂ¡n CĂ¡t BĂ¡n Hung â€“ ThiĂªn CĂ¡t",
    "CĂ¡t"
  ];

  // VĂ¹ng chá»©a cĂ¡c dropdown
  const listWrap = document.createElement("div");
  listWrap.className = "thuocCachList";

  // HĂ m thĂªm 1 dropdown má»›i
  function addSelect(value = "") {
    const sel = taoSelect(ds);
    if (value) sel.value = value;
    sel.style.marginRight = "4px";
    listWrap.appendChild(sel);
  }

  // ThĂªm dropdown Ä‘áº§u tiĂªn
  if (giaTriCu.length) {
    giaTriCu.forEach(v => addSelect(v));
  } else {
    addSelect();
  }

  // NĂºt thĂªm lá»±a chá»n
  const btnAdd = document.createElement("button");
  btnAdd.textContent = "â•";
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

  // Gáº¯n vĂ o box
  box.appendChild(listWrap);
  box.appendChild(btnAdd);
  return;
}


  // ===============================
  // 8ï¸âƒ£ Máº¶C Äá»NH â€” náº¿u chÆ°a cĂ³ nhĂ³m
  // ===============================
  const empty = document.createElement("i");
  empty.textContent = "ChÆ°a cĂ³ dá»¯ liá»‡u cho biáº¿n nĂ y.";
  empty.style.color = "#777";
  box.appendChild(empty);
}






// đŸ“ Má»Ÿ popup mĂ´ táº£ khi click vĂ o tĂªn CĂ¡ch Cá»¥c
document.addEventListener("click",(e)=>{
  const left = e.target.closest(".cc-left");
  if(!left) return;

  // đŸ§ Cháº·n náº¿u chÆ°a premium
  if (!(window.isPaidUser && window.isPaidUser())) {
    if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
    console.warn("[PREMIUM] Block mĂ´ táº£ cĂ¡ch cá»¥c vĂ¬ user chÆ°a premium");
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

  title.innerHTML = `đŸ“ MĂ´ táº£: <b>${cc.ten}</b>`;
  textarea.value = cc.moTa || "";
  popup.dataset.index = index;
  popup.style.display = "flex";
});

// đŸ’¾ LÆ°u mĂ´ táº£
document.getElementById("btnSaveMoTa").addEventListener("click",()=>{
  const popup = document.getElementById("popupMoTaCachCuc");
  const index = popup.dataset.index;
  const val = document.getElementById("moTaText").value.trim();
  
  if (index !== undefined) {
    CACH_CUC_DATA[index].moTa = val;

    // đŸ‘‰ LÆ¯U VĂ€O INDEXEDDB (KHĂ”NG DĂ™NG localStorage)
    syncCachCucStore();
  }

  popup.style.display = "none";
});


// âŒ ÄĂ³ng popup
document.getElementById("btnCloseMoTa").addEventListener("click",()=>{
  document.getElementById("popupMoTaCachCuc").style.display="none";
});

// đŸ” ÄĂ³ng popup CĂ¡ch Cá»¥c khi nháº¥n ESC
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
// đŸ§© KIá»‚M TRA ÄIá»€U KIá»†N CĂCH Cá»¤C (chuáº©n hĂ³a AND logic)
// ======================================================

// đŸ§  Kiá»ƒm tra 1 Ä‘iá»u kiá»‡n Ä‘Æ¡n
function kiemTraDieuKien(dk, cungId, data) {
  const cung = data[cungId];
  console.log("đŸ§© Kiá»ƒm tra Ä‘iá»u kiá»‡n:", dk.bien, dk.giaTri, "=>", cung);

  if (!cung) return false;

// đŸ§© Chuáº©n hĂ³a giĂ¡ trá»‹ Ä‘iá»u kiá»‡n (dáº¡ng máº£ng hoáº·c object)
let g = [];
const normalize = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const normalizeKey = s => normalize(s).replace(/[^a-z0-9]/g, "");

// TrÆ°á»ng há»£p CÅ¨: máº£ng STRING Ä‘Æ¡n
// VĂ­ dá»¥: ["Dáº§n","TĂ½"] hoáº·c ["Tá»­ Vi"]
if (Array.isArray(dk.giaTri) && typeof dk.giaTri[0] === "string") {
  g = dk.giaTri.map(x => x.trim()).filter(Boolean);
}

// TrÆ°á»ng há»£p Má»I: máº£ng NHĂ“M OR cho chĂ­nh tinh / trung tinh
// VĂ­ dá»¥:  [ ["ThĂ¡i Ă‚m","ThiĂªn Äá»“ng"], ["ThiĂªn LÆ°Æ¡ng","ThiĂªn CÆ¡"] ]
else if (Array.isArray(dk.giaTri) && Array.isArray(dk.giaTri[0])) {
  g = dk.giaTri; // GIá»® NGUYĂN, khĂ´ng trim
}

// TrÆ°á»ng há»£p GiĂ¡p Cung: object { truoc:[], sau:[] }
else if (dk.giaTri && typeof dk.giaTri === "object") {
  g = dk.giaTri;
}

const soSanh = (s, val) => {
  if (Array.isArray(val)) return false;  // trĂ¡nh crash cho nhĂ³m OR
  if (typeof val !== "string") return false;
  return normalize(s) === normalize(val);
};


if (dk.bien.startsWith("giapCung")) {
  console.log("đŸ” DK GiĂ¡p:", dk);
}


  switch (dk.bien) {
    /* ======================== */
    /* đŸ“ Vá»‹ trĂ­ & chá»©c nÄƒng cung */
    /* ======================== */
    case "cungVi":
      return g.includes(cung.viTri);

    case "cungChuc":
  return g.some(val =>
    normalize(val) === normalize(cung.chuc || "")
  );


/* ======================== */
/* đŸŒ ChĂ­nh Tinh */
/* ======================== */
case "chinhTinh_ChinhCung": {

  // g cĂ³ thá»ƒ dáº¡ng:
  // 1) ["Tá»­ Vi"]  â†’ AND (táº¥t cáº£ pháº£i cĂ³)
  // 2) [ ["A","B"], ["C","D"] ] â†’ OR cá»§a cĂ¡c nhĂ³m AND
  // 3) ["VĂ´ ChĂ­nh Diá»‡u"]

  // đŸ‘‰ TrÆ°á»ng há»£p Ä‘áº·c biá»‡t: VĂ´ ChĂ­nh Diá»‡u
  const hasVoChinhDieu = Array.isArray(g) && g.some(v => normalizeKey(v) === "vochinhdieu");
  if (hasVoChinhDieu) {
    return !cung.chinhTinh || cung.chinhTinh.length === 0;
  }

  // đŸ‘‰ Náº¿u g[0] lĂ  STRING â†’ Dáº¡ng AND (táº¥t cáº£ pháº£i cĂ³)
  if (Array.isArray(g) && typeof g[0] === "string") {
    return g.every(val =>
      (cung.chinhTinh || []).some(s => soSanh(s, val))
    );
  }

  // đŸ‘‰ Náº¿u g[0] lĂ  máº£ng â†’ Dáº¡ng OR cá»§a nhiá»u nhĂ³m AND
  //    VĂ­ dá»¥: [ ["A","B"], ["C","D"] ]
  return g.some(nhom =>
    nhom.every(val =>
      (cung.chinhTinh || []).some(s => soSanh(s, val))
    )
  );
}

/* ======================== */
/* đŸŒ ChĂ­nh Tinh (Tam Há»£p) â€“ 2025 logic */
/* ======================== */
case "chinhTinh_TamHop": {

  // g = ["a","b"] hoáº·c g = [ ["a","b"], ["c","d"] ]

  const list = cung.tamHopChinhTinh || [];

  // Náº¿u nhĂ³m OR
  if (Array.isArray(g) && Array.isArray(g[0])) {
    return g.some(nhom =>
      nhom.every(sao =>
        list.some(s => soSanh(s, sao))
      )
    );
  }

  // Náº¿u dáº¡ng cÅ©: ["a","b"]
  return g.every(val =>
    list.some(s => soSanh(s, val))
  );
}


    /* ======================== */
    /* đŸŒ™ Trung Tinh */
    /* ======================== */
    case "trungTinh_ChinhCung":
  return g.every(val =>
    (cung.trungTinh || []).some(s => soSanh(s, val))
  );

   case "trungTinh_TamHop": {
  // Gá»™p chĂ­nh cung + 2 cung tam há»£p
  const arrTrungTinh = [
    ...(cung.trungTinh || []),
    ...(cung.tamHopTrungTinh || [])
  ];

  // Loáº¡i trĂ¹ng báº±ng Set
  const fullList = [...new Set(arrTrungTinh)];

  // Kiá»ƒm tra táº¥t cáº£ sao trong Ä‘iá»u kiá»‡n Ä‘á»u cĂ³ trong danh sĂ¡ch nĂ y
  return g.every(val =>
    fullList.some(s => soSanh(s, val))
  );
}


/* ======================== */
/* â–ï¸ GiĂ¡p Cung */
/* ======================== */
case "giapCung_ChinhTinh":
case "giapCung_TrungTinh":
case "giapCung_KetHop": {
  // đŸ” Dá»¯ liá»‡u dk.giaTri hiá»‡n lĂ  object { truoc:[], sau:[] }
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

  // đŸ”¸ Náº¿u lĂ  Káº¿t há»£p thĂ¬ check cáº£ hai loáº¡i
  if (dk.bien === "giapCung_KetHop") {
    return (
      kiemTraGiapCung_2Ben(truoc, sau, cungId, data, "giapCung_ChinhTinh") ||
      kiemTraGiapCung_2Ben(truoc, sau, cungId, data, "giapCung_TrungTinh")
    );
  }

  return kiemTraGiapCung_2Ben(truoc, sau, cungId, data, dk.bien);
}



    /* ======================== */
    /* đŸ’  CĂ¡ch loáº¡i (HUNG / CAT / ...) */
    /* ======================== */
    case "thuocCach":
  if (!cung.cachLoai) return false;
  return g.some(val => normalize(val) === normalize(cung.cachLoai));
case "thuocCach":
  return g.some(val =>
    val.trim().toLowerCase() === (cung.cachLoai || "").trim().toLowerCase()
  );


    /* ======================== */
    /* âŒ Máº·c Ä‘á»‹nh */
    /* ======================== */
    default:
      return false;
  }
}


// â–ï¸ Kiá»ƒm tra GiĂ¡p Cung (chuáº©n theo vá»‹ trĂ­ tĂªn cung, khĂ´ng dá»±a vĂ o ID)
function kiemTraGiapCung_2Ben(listTruoc, listSau, cid, data, bien) {
  const loai =
    bien.includes("ChinhTinh") ? "chinhTinh" :
    bien.includes("TrungTinh") ? "trungTinh" : null;
  if (!loai) return false;

  // đŸ”¹ Láº¥y tĂªn cung hiá»‡n táº¡i
  const cungHienTai = data[cid]?.viTri;
  if (!cungHienTai) return false;

  // đŸ”¹ VĂ²ng 12 cung cá»‘ Ä‘á»‹nh
  const CUNG_LIST = [
    "Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i",
    "ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"
  ];

  const idx = CUNG_LIST.indexOf(cungHienTai);
  if (idx === -1) return false;

  const tenTruoc = CUNG_LIST[(idx - 1 + 12) % 12];
  const tenSau   = CUNG_LIST[(idx + 1) % 12];

  // đŸ”¹ TĂ¬m dá»¯ liá»‡u hai cung Ä‘Ă³
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

 // âœ… Cho phĂ©p 2 chiá»u: KhĂ´i-Viá»‡t hoáº·c Viá»‡t-KhĂ´i Ä‘á»u Ä‘Æ°á»£c
const hasTruocNguoc = (listSau || []).some(val =>
  (truoc[loai] || []).some(s => normalize(s) === normalize(val))
);
const hasSauNguoc = (listTruoc || []).some(val =>
  (sau[loai] || []).some(s => normalize(s) === normalize(val))
);

return (hasTruoc && hasSau) || (hasTruocNguoc && hasSauNguoc);
}






// đŸ’¡ Alias tÆ°Æ¡ng thĂ­ch cho code cÅ©
window.kiemTraGiapCung = function (...args) {
  const [g, cid, d, loai] = args;
  if (!Array.isArray(g) || g.length === 0) return false;

  const truoc = g.slice(0, 1);
  const sau   = g.slice(1);
  const bien  = loai === "chinhTinh" ? "giapCung_ChinhTinh" : "giapCung_TrungTinh";
  return window.kiemTraGiapCung_2Ben(truoc, sau, cid, d, bien);
};




// ======================================================
// đŸ§® KIá»‚M TRA TOĂ€N Bá»˜ CĂCH Cá»¤C (logic AND)
// ======================================================
function kiemTraCachCuc(cid, data) {
  const cung = data[cid];
  console.log("[CC] Kiá»ƒm tra cĂ¡ch cá»¥c táº¡i cung:", cid, cung);

  const kq = [];
  const fails = [];
  if (!window.CACH_CUC_DATA) window.CACH_CUC_DATA = CACH_CUC_DATA || [];

  window.CACH_CUC_DATA.forEach(cc => {
    let hopLe = true;
    let failReason = null;
    console.groupCollapsed(`đŸ§© CĂ¡ch cá»¥c: ${cc.ten}`);

    for (const dk of cc.dieuKien) {
      const ketQua = kiemTraDieuKien(dk, cid, data);
      console.log(`â¡ï¸ Äiá»u kiá»‡n:`, dk.bien, dk.giaTri, "=>", ketQua);
      if (!ketQua) {
        hopLe = false;
        failReason = { ten: cc.ten, bien: dk.bien, giaTri: dk.giaTri };
        console.warn(`âŒ KhĂ´ng Ä‘áº¡t: ${dk.bien}`);
        break;
      }
    }

    if (hopLe) {
      console.log(`âœ… Thá»a cĂ¡ch cá»¥c: ${cc.ten}`);
      kq.push(cc.ten);
    } else {
      if (failReason) fails.push(failReason);
      console.log(`đŸ« Bá»‹ loáº¡i: ${cc.ten}`);
    }

    console.groupEnd();
  });

  console.log("đŸ“‹ Tá»•ng há»£p cĂ¡ch cá»¥c:", kq);
  window.__LAST_FAILS_CACH_CUC = fails;
  return { kq, fails };
}


// đŸ”¹ Cáº­p nháº­t panel pháº£i
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
    return parts.slice(0,2).join(" ") + " â€¦";
  };
  noiDung.innerHTML = ds.length
    ? `<b>${cungLabel}</b>:<br>${ds.map(x=>{
        const label = paid ? x : maskTen(x);
        const locked = paid ? "" : " locked-premium";
        const style = paid ? "margin-left:10px;" : "margin-left:10px;pointer-events:none;";
        return `<div class="dong-phan-tich${locked}" data-ten="${x}" style="${style}">âœ… ${label}</div>`;
      }).join("")}`
    : `<b>${cungLabel}</b>: <i>KhĂ´ng cĂ³ cĂ¡ch cá»¥c phĂ¹ há»£p.</i>`;
}

// =====================================================
// đŸ”¹ Gáº®N Sá»° KIá»†N CLICK CUNG (DELEGATE) â€“ Ă¡p dá»¥ng cho cung táº¡o Ä‘á»™ng
// =====================================================
document.addEventListener("click", async (e) => {
  const c = e.target.closest(".cung");
  if (!c) return;

  const id = Number(c.id.replace("cell", ""));
  const cungName = c.dataset.ten || "Cung " + id;

  // Äá»£i dá»¯ liá»‡u CĂ¡ch Cá»¥c náº¡p xong tá»« IndexedDB
  if (typeof CACH_CUC_READY !== "undefined") {
    await CACH_CUC_READY;
  }

  // Láº¥y dá»¯ liá»‡u lĂ¡ sá»‘ tháº­t tá»« DOM má»—i láº§n click Ä‘á»ƒ cháº¯c cháº¯n má»›i nháº¥t
  const dataReal = layDuLieuTuLayers();
  // Giá»¯ láº¡i cachLoai Ä‘Ă£ tĂ­nh (káº¿t luáº­n cĂ¡t/hung) náº¿u cĂ³ trong cache
  if (window.DU_LIEU_LA_SO_THAT) {
    Object.keys(window.DU_LIEU_LA_SO_THAT).forEach(k => {
      const cached = window.DU_LIEU_LA_SO_THAT[k];
      if (cached?.cachLoai && dataReal[k]) {
        dataReal[k].cachLoai = cached.cachLoai;
      }
    });
  }
  window.DU_LIEU_LA_SO_THAT = dataReal; // cache dĂ¹ng láº¡i nÆ¡i khĂ¡c

  const { kq, fails } = kiemTraCachCuc(id, dataReal);
  console.log("[CC] Click cung", id, cungName, "â€” data:", dataReal[id], "CACH_CUC_DATA:", (window.CACH_CUC_DATA||[]).length, "KQ:", kq, "Fails:", fails);
  capNhatBangCachCuc_Phai({ kq, fails }, cungName);
});


// =====================================================
// đŸª¶ HIá»‚N THá» PHĂ‚N TĂCH CĂCH Cá»¤C (Äá»˜C Láº¬P Vá»I CĂT HUNG)
// =====================================================
window.capNhatBangCachCuc = function (cungId, tenCung) {
  const wrap = document.getElementById("cachCucWrapper");
  const noiDung = document.getElementById("cachCucNoiDung");
  if (!wrap || !noiDung) return;

  // LuĂ´n hiá»‡n báº£ng khi click cung
  wrap.style.display = "block";

  // đŸ”¹ Dá»¯ liá»‡u lĂ¡ sá»‘ tháº­t (láº¥y tá»« cache hoáº·c Ä‘á»c tá»« DOM)
  const DU_LIEU_LA_SO = window.DU_LIEU_LA_SO_THAT || layDuLieuTuLayers();
  const paid = window.isPaidUser && window.isPaidUser();
  const maskTen = (ten) => {
    const parts = (ten || "").split(/\s+/);
    if (parts.length <= 2) return ten;
    return parts.slice(0,2).join(" ") + " â€¦";
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
  // âœ… Sá»­ dá»¥ng hĂ m 2 bĂªn chuáº©n
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
        return `<div class="dong-phan-tich${locked}" data-ten="${x}" style="${style}">âœ… ${label}</div>`;
      }).join("")}`
    : `<b>${tenCung}</b>: <i>KhĂ´ng cĂ³ cĂ¡ch cá»¥c phĂ¹ há»£p.</i>`;
};

document.getElementById("cachCucWrapper").style.display = "block";




// đŸ§­ Láº¥y tĂªn Cung Chá»©c theo vá»‹ trĂ­ thá»±c táº¿ (theo anLop2_Menh)
function layTenCungChucTheoViTri(viTri) {
  if (window.dataGlobal?.cungChucMap && window.dataGlobal.cungChucMap[viTri]) {
    return window.dataGlobal.cungChucMap[viTri];
  }

  // Dá»± phĂ²ng náº¿u chÆ°a an Má»‡nh xong
  const CUNG_CHUC = [
    "Má»†NH","HUYNH Äá»†","PHU THĂ","Tá»¬ Tá»¨C","TĂ€I Báº CH","Táº¬T ĂCH",
    "THIĂN DI","NĂ” Bá»˜C","QUAN Lá»˜C","ÄIá»€N TRáº CH","PHĂC Äá»¨C","PHá»¤ MáºªU"
  ];
  const CUNG_THUAN = ["Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i","ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"];
  const idx = CUNG_THUAN.indexOf(viTri);
  return idx !== -1 ? CUNG_CHUC[idx] : "";
}


// ======================================================
// đŸ” HĂ€M Láº¤Y Dá»® LIá»†U THáº¬T Tá»ª LĂ Sá» (Layer-3, Layer-6â€¦)
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
// đŸ§­ Bá»• sung Tam Há»£p + GiĂ¡p Cung
// ======================================================
for (const [ten, id] of Object.entries(mapCung)) {
  const cung = duLieu[id];
  if (!cung) continue;

  // đŸ”¹ Tam há»£p
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

  // đŸ”¹ GiĂ¡p cung
  const CUNG_LIST = [
    "Dáº§n","MĂ£o","ThĂ¬n","Tá»µ","Ngá»","MĂ¹i",
    "ThĂ¢n","Dáº­u","Tuáº¥t","Há»£i","TĂ½","Sá»­u"
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

  // âœ… Máº£ng tá»•ng há»£p cho truy cáº­p nhanh
  cung.giapChinhTinh = [
    ...cung.giap.truoc.chinhTinh,
    ...cung.giap.sau.chinhTinh
  ];
  cung.giapTrungTinh = [
    ...cung.giap.truoc.trungTinh,
    ...cung.giap.sau.trungTinh
  ];
}

// âœ… Tráº£ dá»¯ liá»‡u hoĂ n chá»‰nh
return duLieu;
}  // â¬…ï¸ Dáº¥u ngoáº·c nĂ y ráº¥t quan trá»ng â€“ Ä‘Ă³ng láº¡i hĂ m cha (vĂ­ dá»¥: xayDungDuLieuLaSo)

// đŸ”’ KhĂ³a / má»Ÿ khĂ³a khu TRA NGÆ¯á»¢C theo premium
function toggleTraNguocLock(isPaid) {
  const wrap = document.getElementById("traNguocWrapper");
  if (!wrap) return;

  // táº¡o overlay náº¿u chÆ°a cĂ³
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

// đŸ”’ KhĂ³a sá»­a/xĂ³a CĂCH Cá»¤C khi chÆ°a premium
function toggleCachCucEditLock(isPaid) {
  const list = document.getElementById("listCachCuc");
  const panel = list?.parentElement || document.getElementById("cachCucPanel");
  if (!list || !panel) return;
  panel.style.position = "relative";
  list.style.position = "relative";

  // Táº¯t/báº­t actions
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

// đŸ”’ KhĂ³a thao tĂ¡c CHUYĂN Äá»€ (thĂªm/sá»­a) khi chÆ°a premium
function toggleChuyenDeEditLock(isPaid) {
  const list = document.getElementById("listChuyenDe");
  const container = list?.parentElement; // pháº§n bao cáº£ list + nĂºt
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

  // Disable cĂ¡c nĂºt thao tĂ¡c
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
  // 1ï¸âƒ£ Chá» toĂ n bá»™ cĂ¢y chuyĂªn Ä‘á» load xong
  setTimeout(() => {

    // đŸŸ¢ LuĂ´n render danh sĂ¡ch CĂ¡ch Cá»¥c
    if (typeof renderCachCucList === "function") {
      renderCachCucList();
      console.log("đŸ“˜ CĂ¡ch Cá»¥c Ä‘Ă£ render láº¡i sau khi load cĂ¢y chuyĂªn Ä‘á»");
    }

    // 2ï¸âƒ£ Má»Ÿ toĂ n bá»™ node hoáº·c cha bá»‹ áº©n cĂ³ chá»©a chá»¯ 'CĂCH Cá»¤C'
    const nutCachCuc = [...document.querySelectorAll(".cd-name")].find(el =>
      /CĂCH Cá»¤C/i.test(el.textContent)
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

    // 3ï¸âƒ£ Bá» display:none trĂªn chĂ­nh danh sĂ¡ch
    const listCC = document.getElementById("listCachCuc");
    if (listCC) {
      listCC.style.removeProperty("display");
      listCC.style.display = "block";
    }

    // 4ï¸âƒ£ Bá» display:none trĂªn cha trá»±c tiáº¿p
    const cha = listCC?.parentElement;
    if (cha && window.getComputedStyle(cha).display === "none") {
      cha.style.display = "block";
    }

    console.log("âœ… ÄĂ£ buá»™c hiá»ƒn thá»‹ pháº§n CĂCH Cá»¤C");

  }, 600); // Ä‘á»£i 0.6s Ä‘á»ƒ cĂ¢y chuyĂªn Ä‘á» render xong
});

// đŸŒŸ áº¨n / hiá»‡n danh sĂ¡ch CĂCH Cá»¤C â€” chá» cháº¯c cháº¯n DOM cĂ³ pháº§n tá»­
function initCachCucToggle() {
  const title = document.getElementById("titleCachCuc");
  const panel = document.getElementById("cachCucPanel");
  if (!title || !panel) {
    // â³ DOM chÆ°a load xong â†’ chá» thĂªm rá»“i thá»­ láº¡i
    return setTimeout(initCachCucToggle, 500);
  }

  console.log("âœ… ÄĂ£ gáº¯n toggle cho pháº§n CĂCH Cá»¤C");

  // Hiá»ƒn thá»‹ máº·c Ä‘á»‹nh
  panel.style.display = "block";

  // Khi click tiĂªu Ä‘á» thĂ¬ thu gá»n/má»Ÿ rá»™ng
  title.addEventListener("click", () => {
    const isHidden = panel.style.display === "none";
    panel.style.display = isHidden ? "block" : "none";
    title.style.opacity = "0.7";
    setTimeout(() => (title.style.opacity = "1"), 150);
  });
}

// đŸ§© KĂ­ch hoáº¡t khi trang load xong hoĂ n toĂ n
window.addEventListener("load", initCachCucToggle);

// =====================================================
// đŸ” ÄÄ‚NG NHáº¬P / PREMIUM â€“ KHĂ”I PHá»¤C NHANH SAU F5
// (báº£n gá»n, Ä‘á»™c láº­p Ä‘á»ƒ panel luĂ´n cáº­p nháº­t)
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
    if (els.status) els.status.textContent = `${featureLabel || "TĂ­nh nÄƒng"} lĂ  premium. Vui lĂ²ng Ä‘Äƒng nháº­p/kĂ­ch hoáº¡t.`;
    return false;
  };
  window.hasPremiumAccess = hasPremiumAccess;

  const renderAuth = () => {
    els = elsFinder();
    const u = state.sessionOk ? state.user : null;
    if (els.status) {
      els.status.textContent = u
        ? `ÄĂ£ Ä‘Äƒng nháº­p: ${u.username} (${u.paid ? "premium" : "miá»…n phĂ­"})`
        : "ChÆ°a Ä‘Äƒng nháº­p";
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

  // Gáº¯n sá»± kiá»‡n
  document.getElementById("btnLogin")?.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  document.getElementById("btnRegister")?.addEventListener("click", (e) => { e.preventDefault(); doRegister(); });
  document.getElementById("btnLogout")?.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
  document.getElementById("btnActivatePaid")?.addEventListener("click", (e) => { e.preventDefault(); activatePaid(); });

  // KhĂ´i phá»¥c cache â†’ render â†’ hydrate
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
// đŸ”’ CHáº¶N TOĂ€N Bá»˜ TÆ¯Æ NG TĂC PREMIUM KHI CHÆ¯A TRáº¢ PHĂ
// =====================================================
document.addEventListener("click", (e) => {
  // Cho phĂ©p cĂ¡c click ná»™i bá»™ phá»¥c vá»¥ highlight phĂ¢n tĂ­ch cĂ¡ch cá»¥c
  if (e.target.closest(".dong-phan-tich")) return;

  const premiumZone = e.target.closest("[data-premium]");
  if (!premiumZone) return;
  if (window.isPaidUser && window.isPaidUser()) return;
  // ChÆ°a premium -> cháº·n hoĂ n toĂ n
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

  // đŸ“˜ Má»Ÿ popup khi click tĂªn CĂ¡ch Cá»¥c
  document.addEventListener("click", e => {
    // đŸ§ Cháº·n náº¿u chÆ°a premium
    if (!(window.isPaidUser && window.isPaidUser())) {
      if (typeof window.updatePremiumLock === "function") window.updatePremiumLock(false);
      return;
    }

    // â›” Bá» qua click trong báº£ng tick háº¡n
    if (e.target.closest("#bangNhomSaoLuu")) return;

    const left = e.target.closest(".cc-left");
    if (!left) return;

    const index = left.dataset.index;
    const cc = CACH_CUC_DATA[index];
    if (!cc) return;

    popup.dataset.index = index;
title.innerHTML = `đŸª¶ <b>${cc.ten}</b>`;
    content.innerHTML = cc.moTa?.trim() || "<i>ChÆ°a cĂ³ mĂ´ táº£...</i>";
    textarea.value = cc.moTa || "";

    // reset tráº¡ng thĂ¡i
    content.style.display = "block";
    textarea.style.display = "none";
    btnEdit.style.display = "inline-block";
    btnSave.style.display = "none";

    popup.style.display = "flex";
  });

  // âœï¸ Chá»‰nh sá»­a
  btnEdit.addEventListener("click", () => {
    content.style.display = "none";
    textarea.style.display = "block";
    textarea.focus();
    btnEdit.style.display = "none";
    btnSave.style.display = "inline-block";
  });

  // đŸ’¾ LÆ°u
  btnSave.addEventListener("click", () => {
    const index = popup.dataset.index;
    const cc = CACH_CUC_DATA[index];
    const newText = textarea.value.trim();
    cc.moTa = newText;
    content.innerText = newText || "ChÆ°a cĂ³ mĂ´ táº£...";
    content.style.display = "block";
    textarea.style.display = "none";
    btnEdit.style.display = "inline-block";
    btnSave.style.display = "none";
  });

  // âŒ ÄĂ³ng popup
  [btnClose, btnCloseX].forEach(btn =>
    btn.addEventListener("click", () => (popup.style.display = "none"))
  );

  // đŸ‘† Click ngoĂ i khung Ä‘á»ƒ Ä‘Ă³ng
  popup.addEventListener("click", e => {
    if (e.target === popup) popup.style.display = "none";
  });
});

function openTab(evt, tabId) {
  // áº¨n táº¥t cáº£ ná»™i dung tab
  document.querySelectorAll("#saoPopup .tab-content").forEach(el =>
    el.classList.remove("active")
  );

  // Bá» active nĂºt tab
  document.querySelectorAll("#saoPopup .tab-link").forEach(el =>
    el.classList.remove("active")
  );

  // Hiá»‡n tab Ä‘Æ°á»£c chá»n
  document.getElementById(tabId).classList.add("active");

  // Active nĂºt tab vá»«a báº¥m
  evt.currentTarget.classList.add("active");
}




function renderBangCungChuc(tenCung) {
  const tbl = document.getElementById("bangCungChuc");
  if (!tbl || !tenCung) return;

  const CUNG_CHUC = [
    "Má»‡nh", "Huynh Äá»‡", "Phu ThĂª", "Tá»­ Tá»©c", "TĂ i Báº¡ch", "Táº­t Ăch",
    "ThiĂªn Di", "NĂ´ Bá»™c", "Quan Lá»™c", "Äiá»n Tráº¡ch", "PhĂºc Äá»©c", "Phá»¥ Máº«u"
  ];

  // Map cung gá»i (TĂ½, Sá»­u, Dáº§n...) â†’ cung chá»©c
  const rawChuc = window.dataGlobal?.cungChucMap?.[tenCung];
  const viTriChuc = rawChuc || null;

  tbl.innerHTML = `
    <tr>
      <th style="width:130px;">Cung</th>
      <th>Ă nghÄ©a</th>
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
  console.log("đŸ“Œ CLICK SAO:", tenSao, "táº¡i cung", tenCung);

  // LuĂ´n lÆ°u láº¡i tĂªn sao vĂ  cung hiá»‡n táº¡i
  window.currentSao = tenSao;
  window.currentCung = tenCung; // Cung TĂ½, Sá»­u, Dáº§n,...

  const popup = document.getElementById("saoPopup");

  // Náº¿u popup chÆ°a má»Ÿ â†’ dá»«ng táº¡i Ä‘Ă¢y (Ä‘á»ƒ láº§n sau click láº¡i má»›i má»Ÿ)
  if (!popup || popup.style.display === "none") return;

  // Náº¿u popup Ä‘ang má»Ÿ â†’ cáº­p nháº­t láº¡i ná»™i dung
  renderBangCungChuc(tenCung);  // truyá»n cung Ä‘á»ƒ highlight bĂªn Tab1 (náº¿u dĂ¹ng)
  renderTab2(tenSao);           // render Tab 2 nhÆ° cÅ©
  renderTab3(tenSao);           // render Tab 3 nhÆ° cÅ©
}


// ===============================
// NĂT Má» / ÄĂ“NG SIDEBAR Tá»ª ÄIá»‚N SAO
// ===============================
document.getElementById("btnToggleSidebar")
  .addEventListener("click", () => {
    document.getElementById("sidebarTraCuu")
      .classList.toggle("show");
  });

// đŸ“Œ Máº·c Ä‘á»‹nh má»Ÿ sidebar khi F5 Ä‘á»ƒ trĂ¡nh lá»—i cáº§n click má»›i hiá»‡n
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebarTraCuu");
  if (sidebar) {
    sidebar.classList.add("show");
    console.log("đŸ”” Sidebar tra cá»©u Ä‘Ă£ má»Ÿ máº·c Ä‘á»‹nh");
  }
});

document.getElementById("btnOpenFullLaso").onclick = () => {
    const laso = document.getElementById("lasoContainer");
    const overlay = document.getElementById("fullLasoOverlay");

    if (!laso || !overlay) {
        console.error("KhĂ´ng tĂ¬m tháº¥y overlay hoáº·c lasoContainer");
        return;
    }

    overlay.innerHTML = `
        <button id="btnExitFullLaso" style="
            position:fixed; top:10px; right:10px;
            padding:8px 14px; background:#ff4444;
            color:white; border:none; border-radius:8px;
            z-index:10000000;">âœ–</button>
    `;
    overlay.appendChild(laso);
    overlay.style.display = "block";

    document.getElementById("btnExitFullLaso").onclick = () => {
        document.getElementById("lasoSection").appendChild(laso);
        overlay.style.display = "none";
    };
};
(function () {
  const ENABLE_DEBUG_LOG = true; // luĂ´n báº­t log Ä‘á»ƒ debug tÆ°Æ¡ng tĂ¡c
  if (!ENABLE_DEBUG_LOG && typeof console !== "undefined") {
    ["log", "debug", "info"].forEach(k => {
      if (console[k]) console[k] = () => {};
    });
  }
})();









