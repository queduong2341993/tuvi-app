const { convertDate } = require("./lunar");

// =========================
// DỮ LIỆU CẦN CHO CHÍNH TINH
// (rút gọn từ frontend, không thao tác DOM)
// =========================
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

const CAP_TU_VI_PHU = {
  "Dần": "Dần", "Mão": "Sửu", "Thìn": "Tý", "Tỵ": "Hợi",
  "Ngọ": "Tuất", "Mùi": "Dậu", "Thân": "Thân", "Dậu": "Mùi",
  "Tuất": "Ngọ", "Hợi": "Tỵ", "Tý": "Thìn", "Sửu": "Mão"
};

const PATTERN_TU_VI = [
  "Tử Vi","Thiên Cơ",null,"Thái Dương","Vũ Khúc","Thiên Đồng",
  null,null,"Liêm Trinh",null,null,null
];

const PATTERN_THIEN_PHU = [
  "Thiên Phủ","Thái Âm","Tham Lang","Cự Môn","Thiên Tướng",
  "Thiên Lương","Thất Sát",null,null,null,"Phá Quân",null
];

const CUNG_THUAN = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];

function initCungStars() {
  const cungStars = {};
  CUNG_THUAN.forEach(c => {
    cungStars[c] = { chinh: [], trung: [], tieu: [], luu: [] };
  });
  return cungStars;
}

function normalizeKey(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0110/g, "d")
    .replace(/\u0111/g, "d")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function addStar(cungStars, map, cung, ten, group = "trung", loai = "cat") {
  if (!cungStars[cung]) cungStars[cung] = { chinh: [], trung: [], tieu: [], luu: [] };
  const entry = { name: ten, loai, group };
  if (!Array.isArray(cungStars[cung][group])) cungStars[cung][group] = [];
  cungStars[cung][group].push(entry);
  const key = normalizeKey(ten);
  map[key] = cung;
}

function addLuuStar(cungStars, cung, ten, group, loai, prefix, map) {
  if (!cung) return;
  if (!cungStars[cung]) cungStars[cung] = { chinh: [], trung: [], tieu: [], luu: [] };
  const entry = { name: ten, loai, group, prefix };
  if (!Array.isArray(cungStars[cung].luu)) cungStars[cung].luu = [];
  cungStars[cung].luu.push(entry);
  const key = normalizeKey(`${prefix}.${ten}`);
  map[key] = cung;
}

const CHI_ORDER = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const CHI_INDEX = Object.fromEntries(CHI_ORDER.map((c, i) => [c, i]));

// =========================
// HÀM XÁC ĐỊNH CỤC SỐ
// (copy từ frontend, bỏ thao tác DOM)
// =========================
function xacDinhCucSo(canChiNam = "", cungMenh = "") {
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
  return bangCuc[can]?.[nhom] || "";
}

// =========================
// AN CHÍNH TINH → JSON
// =========================
function anChinhTinh({ cucSo, lunarDay }) {
  if (!cucSo || !BANG_TU_VI[cucSo]) {
    throw new Error("Cuc so khong hop le");
  }
  const ngay = Number(lunarDay);
  if (!ngay || ngay < 1 || ngay > 30) throw new Error("Ngay am khong hop le");

  const cungTuVi = BANG_TU_VI[cucSo][ngay - 1];
  const cungThienPhu = CAP_TU_VI_PHU[cungTuVi];
  const idxTuVi = CUNG_THUAN.indexOf(cungTuVi);
  const idxThienPhu = CUNG_THUAN.indexOf(cungThienPhu);

  if (idxTuVi === -1 || idxThienPhu === -1) {
    throw new Error("Khong tim thay cung tu vi / thien phu");
  }

  const getIndexNgich = (start, step) => (start - step + 12) % 12;
  const getIndexThuan = (start, step) => (start + step) % 12;

  const saoToCung = {};
  const cungStars = initCungStars(); // { "Dần": { chinh: [], trung: [], tieu: [], luu: [] } }

  function pushStar(cung, star) {
    if (!cungStars[cung]) cungStars[cung] = { chinh: [] };
    cungStars[cung].chinh.push(star);
    saoToCung[star] = cung;
  }

  PATTERN_TU_VI.forEach((sao, i) => {
    if (!sao) return;
    const idx = getIndexNgich(idxTuVi, i);
    pushStar(CUNG_THUAN[idx], sao);
  });

  PATTERN_THIEN_PHU.forEach((sao, i) => {
    if (!sao) return;
    const idx = getIndexThuan(idxThienPhu, i);
    pushStar(CUNG_THUAN[idx], sao);
  });

  return {
    cungTuVi,
    cungThienPhu,
    saoToCung,
    cungStars
  };
}

// =========================
// AN TRUNG TINH (CÁT + HUNG) → JSON
// =========================
function anTrungTinh(params = {}) {
  const {
    canChiNam = "",
    lunarMonth = 1,
    canChiGio = "",
    amduongMenh = "",
    baseCungStars = null,
    baseMap = null
  } = params;

  const cungStars = baseCungStars || initCungStars();
  const map = baseMap ? { ...baseMap } : {};

  const CUNG_THUAN_LOCAL = CUNG_THUAN;

  const demCung = (start, step, chieu = "thuận") => {
    const iStart = CUNG_THUAN_LOCAL.indexOf(start);
    if (iStart === -1) return null;
    const idx = (chieu === "thuận")
      ? (iStart + (step - 1)) % 12
      : (iStart - (step - 1) + 12) % 12;
    return CUNG_THUAN_LOCAL[idx];
  };

  const canNam = canChiNam.split(" ")[0] || "";
  const thangAm = Number(lunarMonth) || 1;
  const gioChi = canChiGio.split(" ")[1] || "Tý";

  // Nhóm Cát tinh: Khôi Việt
  const BANG_KHOI_VIET = {
    "Giáp": ["Sửu", "Mùi"], "Mậu": ["Sửu", "Mùi"],
    "Ất": ["Tý", "Thân"], "Kỷ": ["Tý", "Thân"],
    "Canh": ["Dần", "Ngọ"], "Tân": ["Dần", "Ngọ"],
    "Bính": ["Hợi", "Dậu"], "Đinh": ["Hợi", "Dậu"],
    "Nhâm": ["Mão", "Tỵ"], "Quý": ["Mão", "Tỵ"]
  };
  const cap = BANG_KHOI_VIET[canNam];
  if (cap) {
    addStar(cungStars, map, cap[0], "Thiên Khôi", "trung", "cat");
    addStar(cungStars, map, cap[1], "Thiên Việt", "trung", "cat");
  }

  // Tả Phù / Hữu Bật
  const cungTaPhu = demCung("Thìn", thangAm, "thuận");
  const cungHuuBat = demCung("Tuất", thangAm, "nghịch");
  if (cungTaPhu) addStar(cungStars, map, cungTaPhu, "Tả Phù", "trung", "cat");
  if (cungHuuBat) addStar(cungStars, map, cungHuuBat, "Hữu Bật", "trung", "cat");

  // Văn Xương – Văn Khúc (Tuất nghịch, Thìn thuận theo giờ)
  const gioChiArray = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const gioIndex = gioChiArray.indexOf(gioChi);
  if (gioIndex !== -1) {
    const startXuong = CUNG_THUAN_LOCAL.indexOf("Tuất");
    const idxXuong = (startXuong - gioIndex + 12) % 12;
    const cungVanXuong = CUNG_THUAN_LOCAL[idxXuong];

    const startKhuc = CUNG_THUAN_LOCAL.indexOf("Thìn");
    const idxKhuc = (startKhuc + gioIndex) % 12;
    const cungVanKhuc = CUNG_THUAN_LOCAL[idxKhuc];

    if (cungVanXuong) addStar(cungStars, map, cungVanXuong, "Văn Xương", "trung", "cat");
    if (cungVanKhuc) addStar(cungStars, map, cungVanKhuc, "Văn Khúc", "trung", "cat");
  }

  // Kình Dương – Đà La
  if (canChiNam) {
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
    const iA = CUNG_THUAN_LOCAL.indexOf(viTriA);
    if (iA >= 0) {
      const cungKinh = CUNG_THUAN_LOCAL[(iA + 1) % 12];
      const cungDa   = CUNG_THUAN_LOCAL[(iA - 1 + 12) % 12];
      addStar(cungStars, map, cungKinh, "Kình Dương", "trung", "hung");
      addStar(cungStars, map, cungDa, "Đà La", "trung", "hung");
    }
  }

  // Địa Không & Địa Kiếp (từ Hợi đếm theo giờ)
  const GIO_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const iGio = GIO_CHI.indexOf(gioChi);
  if (iGio >= 0) {
    const iHoi = CUNG_THUAN_LOCAL.indexOf("Hợi");
    const cungKiep = CUNG_THUAN_LOCAL[(iHoi + iGio) % 12];
    const cungKhong = CUNG_THUAN_LOCAL[(iHoi - iGio + 12) % 12];
    addStar(cungStars, map, cungKiep, "Địa Kiếp", "trung", "hung");
    addStar(cungStars, map, cungKhong, "Địa Không", "trung", "hung");
  }

  // Linh Tinh
  const chiNam = canChiNam.split(" ")[1] || "Tý";
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
  const menhAD = amduongMenh || "";
  const keyLinh = (menhAD.includes("Dương Nam") || menhAD.includes("Âm Nữ")) ? "DuongNam_AmNu" : "AmNam_DuongNu";
  const chiNamThuong = chiNam.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nhomChi = ["Dan","Ngo","Tuat"].includes(chiNamThuong) ? "DầnNgọTuất" : "Khac";
  const cungLinh = BANG_LINH_TINH[keyLinh]?.[chiNam]?.[nhomChi];
  if (cungLinh) addStar(cungStars, map, cungLinh, "Linh Tinh", "trung", "hung");

  // Hỏa Tinh
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
  let nhomNam = "MaoMuiHoi";
  if (["Tý","Thìn","Thân"].includes(chiNam)) nhomNam = "TyThinThan";
  else if (["Sửu","Tỵ","Dậu"].includes(chiNam)) nhomNam = "SuuTyDau";
  else if (["Dần","Ngọ","Tuất"].includes(chiNam)) nhomNam = "DanNgoTuat";
  const keyHoa = keyLinh;
  const cungHoa = BANG_HOA_TINH[keyHoa]?.[nhomNam]?.[gioChi];
  if (cungHoa) addStar(cungStars, map, cungHoa, "Hỏa Tinh", "trung", "hung");

  return { cungStars, saoToCungTrung: map };
}

// =========================
// LỘC TỒN – THIÊN MÃ
// =========================
function anLocTonThienMa(params = {}) {
  const { canChiNam = "", baseCungStars = null, baseMap = null } = params;
  const cungStars = baseCungStars || initCungStars();
  const map = baseMap ? { ...baseMap } : {};

  const locTonMap = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ","Mậu":"Tỵ",
    "Kỷ":"Ngọ","Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
  };
  const thienMaMap = {
    "Hợi":"Tỵ","Mão":"Tỵ","Mùi":"Tỵ",
    "Tỵ":"Hợi","Dậu":"Hợi","Sửu":"Hợi",
    "Dần":"Thân","Ngọ":"Thân","Tuất":"Thân",
    "Thân":"Dần","Tý":"Dần","Thìn":"Dần"
  };

  const [canRaw, chiRaw] = (canChiNam || "").split(" ");
  const can = canRaw || "";
  const chi = chiRaw || "";

  const locTon = locTonMap[can];
  const thienMa = thienMaMap[chi];

  if (locTon) addStar(cungStars, map, locTon, "Lộc Tồn", "tieu", "cat");
  if (thienMa) addStar(cungStars, map, thienMa, "Thiên Mã", "tieu", "cat");

  return { cungStars, saoToCungLocTon: map, locTon, thienMa };
}

// =========================
// TIỂU TINH (rút gọn, tính backend, không DOM)
// =========================
const TIEUTINH_DATA = [
  { ten: "Thái Tuế", loai: "Hung", congThuc: "ThaiTue", huong: "thuận" },
  { ten: "Thiếu Dương", loai: "Cát", congThuc: "TheoThaiTue", huong: "thuận", buoc: 1 },
  { ten: "Tang Môn", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 2 },
  { ten: "Thiếu Âm", loai: "Cát", congThuc: "TheoThaiTue", huong: "thuận", buoc: 3 },
  { ten: "Quan Phù", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 4 },
  { ten: "Tử Phù", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 5 },
  { ten: "Tuế Phá", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 6 },
  { ten: "Long Đức", loai: "Cát", congThuc: "TheoThaiTue", huong: "thuận", buoc: 7 },
  { ten: "Bạch Hổ", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 8 },
  { ten: "Phúc Đức", loai: "Cát", congThuc: "TheoThaiTue", huong: "thuận", buoc: 9 },
  { ten: "Điếu Khách", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 10 },
  { ten: "Trực Phù", loai: "Hung", congThuc: "TheoThaiTue", huong: "thuận", buoc: 11 },
  { ten: "Phượng Các", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi"] },
  { ten: "Giải Thần", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi"] },
  { ten: "Long Trì", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão"] },
  { ten: "Nguyệt Đức", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn"] },
  { ten: "Thiên Đức", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân"] },
  { ten: "Thiên Hỷ", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất"] },
  { ten: "Thiên Khốc", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Ngọ","Tỵ","Thìn","Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi"] },
  { ten: "Thiên Hư", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ"] },
  { ten: "Đào Hoa", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Dậu","Ngọ","Mão","Tý","Dậu","Ngọ","Mão","Tý","Dậu","Ngọ","Mão","Tý"] },
  { ten: "Hồng Loan", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Mão","Dần","Sửu","Tý","Hợi","Tuất","Dậu","Thân","Mùi","Ngọ","Tỵ","Thìn"] },
  { ten: "Hoa Cái", loai: "Cát", congThuc: "TheoDiaChiNam", dsCung: ["Thìn","Sửu","Tuất","Mùi","Thìn","Sửu","Tuất","Mùi","Thìn","Sửu","Tuất","Mùi"] },
  { ten: "Kiếp Sát", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Dần","Hợi","Thân","Tỵ","Dần","Hợi","Thân","Tỵ","Dần","Hợi","Thân"] },
  { ten: "Phá Toái", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu","Tỵ","Sửu","Dậu"] },
  { ten: "Cô Thần", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Dần","Dần","Tỵ","Tỵ","Tỵ","Thân","Thân","Thân","Hợi","Hợi","Hợi","Dần"] },
  { ten: "Quả Tú", loai: "Hung", congThuc: "TheoDiaChiNam", dsCung: ["Tuất","Tuất","Sửu","Sửu","Sửu","Thìn","Thìn","Thìn","Mùi","Mùi","Mùi","Tuất"] },
  { ten: "Thiên Hình", loai: "Hung", congThuc: "TheoThangSinh", dsCung: ["Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân"] },
  { ten: "Thiên Riêu", loai: "Hung", congThuc: "TheoThangSinh", dsCung: ["Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý"] },
  { ten: "Thiên Y", loai: "Hung", congThuc: "TheoThangSinh", dsCung: ["Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý"] },
  { ten: "Thiên Giải", loai: "Cát", congThuc: "TheoThangSinh", dsCung: ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi"] },
  { ten: "Địa Giải", loai: "Cát", congThuc: "TheoThangSinh", dsCung: ["Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ"] },
  { ten: "Thai Phụ", loai: "Cát", congThuc: "TheoGioSinh", dsCung: ["Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ"] },
  { ten: "Phong Cáo", loai: "Cát", congThuc: "TheoGioSinh", dsCung: ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"] },
  { ten: "Bác Sĩ", loai: "Cát", congThuc: "TheoLocTon", buoc: 0 },
  { ten: "Lực Sĩ", loai: "Cát", congThuc: "TheoLocTon", buoc: 1 },
  { ten: "Thanh Long", loai: "Cát", congThuc: "TheoLocTon", buoc: 2 },
  { ten: "Tiểu Hao", loai: "Hung", congThuc: "TheoLocTon", buoc: 3 },
  { ten: "Tướng Quân", loai: "Cát", congThuc: "TheoLocTon", buoc: 4 },
  { ten: "Tấu Thư", loai: "Cát", congThuc: "TheoLocTon", buoc: 5 },
  { ten: "Phi Liêm", loai: "Hung", congThuc: "TheoLocTon", buoc: 6 },
  { ten: "Hỷ Thần", loai: "Cát", congThuc: "TheoLocTon", buoc: 7 },
  { ten: "Bệnh Phù", loai: "Hung", congThuc: "TheoLocTon", buoc: 8 },
  { ten: "Đại Hao", loai: "Hung", congThuc: "TheoLocTon", buoc: 9 },
  { ten: "Phục Binh", loai: "Hung", congThuc: "TheoLocTon", buoc: 10 },
  { ten: "Quan Phủ", loai: "Hung", congThuc: "TheoLocTon", buoc: 11 },
  { ten: "Thiên Quý", loai: "Cát", congThuc: "TheoNgay_ThienQuy" },
  { ten: "Ân Quang", loai: "Cát", congThuc: "TheoNgay_AnQuang" },
  { ten: "Tam Thai", loai: "Cát", congThuc: "TheoNgay_TamThai" },
  { ten: "Bát Tọa", loai: "Cát", congThuc: "TheoNgay_BatToa" },
  { ten: "Lưu Hà", loai: "Hung", congThuc: "TheoCanNamSinh", dsCung: ["Dậu","Tuất","Mùi","Thìn","Tỵ","Ngọ","Thân","Mão","Hợi","Dần"] },
  { ten: "Quốc Ấn", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Tuất","Hợi","Sửu","Dần","Sửu","Dần","Thìn","Tỵ","Mùi","Thân"] },
  { ten: "Đường Phù", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Mùi","Thân","Tuất","Hợi","Tuất","Hợi","Sửu","Dần","Thìn","Tỵ"] },
  { ten: "Văn Tinh", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Tỵ","Ngọ","Thân","Dậu","Thân","Dậu","Hợi","Tý","Dậu","Mão"] },
  { ten: "Thiên Quan", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Mùi","Thìn","Tỵ","Dần","Mão","Dậu","Hợi","Dậu","Tuất","Ngọ"] },
  { ten: "Thiên Phúc", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Dậu","Thân","Tý","Hợi","Mão","Dần","Ngọ","Tỵ","Ngọ","Tỵ"] },
  { ten: "Thiên Trù", loai: "Cát", congThuc: "TheoCanNamSinh", dsCung: ["Tỵ","Ngọ","Tý","Tỵ","Ngọ","Thân","Dần","Ngọ","Dậu","Tuất"] },
  { ten: "Đẩu Quân", loai: "Hung", congThuc: "TapTinh_DauQuan" },
  { ten: "Thiên Không", loai: "Hung", congThuc: "TapTinh_ThienKhong" },
  { ten: "Thiên Tài", loai: "Cát", congThuc: "TapTinh_ThienTai" },
  { ten: "Thiên Thọ", loai: "Cát", congThuc: "TapTinh_ThienTho" },
  { ten: "Thiên Thương", loai: "Hung", congThuc: "TapTinh_CuDinh", cuDinh: "Nô Bộc" },
  { ten: "Thiên Sứ", loai: "Cát", congThuc: "TapTinh_CuDinh", cuDinh: "Tật Ách" },
  { ten: "Thiên La", loai: "Hung", congThuc: "codinh", dsCung: ["Thìn"] },
  { ten: "Địa Võng", loai: "Hung", congThuc: "codinh", dsCung: ["Tuất"] }
];

function findCungByStar(cungStars, name) {
  const key = normalizeKey(name);
  for (const [cung, obj] of Object.entries(cungStars || {})) {
    const arr = [...(obj.chinh || []), ...(obj.trung || [])];
    if (arr.some(s => normalizeKey(s.name || s) === key)) return cung;
  }
  return null;
}

function stepCung(start, steps, direction = "thuận") {
  const idx = CUNG_THUAN.indexOf(start);
  if (idx === -1) return start;
  const delta = direction === "nghịch" ? -steps : steps;
  const pos = (idx + delta) % 12;
  return CUNG_THUAN[(pos + 12) % 12];
}

function anTieuTinh(params = {}) {
  const {
    canChiNam = "",
    lunarDay = 1,
    lunarMonth = 1,
    gioChi = "Tý",
    cungLocTon = "",
    cungChucMap = {},
    amduongMenh = "",
    baseCungStars = null,
    baseMap = null
  } = params;

  const cungStars = baseCungStars || initCungStars();
  const map = baseMap ? { ...baseMap } : {};
  const thaiTueChi = canChiNam.split(" ")[1] || canChiNam.split(" ")[0] || "Tý";
  const chiIndex = CHI_INDEX[thaiTueChi] ?? 0;
  const gioIndex = CHI_INDEX[gioChi] ?? 0;

  const getCungThaiTue = () => thaiTueChi;
  const theoThaiTue = (buoc = 0, huong = "thuận") => {
    const base = getCungThaiTue();
    return stepCung(base, buoc, huong);
  };

  const theoDiaChi = (ds = []) => {
    if (!Array.isArray(ds) || ds.length < 12) return "Tý";
    return ds[chiIndex % ds.length];
  };

  const theoThang = (ds = []) => {
    if (!Array.isArray(ds) || ds.length < 12) return "Tý";
    const idx = Math.max(1, Math.min(12, Number(lunarMonth))) - 1;
    return ds[idx];
  };

  const theoGio = (ds = []) => {
    if (!Array.isArray(ds) || ds.length < 12) return "Tý";
    return ds[gioIndex % 12];
  };

  const theoLocTon = (buoc = 0) => {
    const base = cungLocTon || "Tý";
    const dir = (amduongMenh.includes("Dương Nam") || amduongMenh.includes("Âm Nữ")) ? "thuận" : "nghịch";
    return stepCung(base, buoc, dir);
  };

  const theoCanNam = (ds = []) => {
    if (!Array.isArray(ds) || ds.length < 10) return "Tý";
    const can = canChiNam.split(" ")[0] || "Giáp";
    const listCan = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
    const idx = listCan.indexOf(can);
    return ds[idx >= 0 ? idx : 0] || "Tý";
  };

  const theoNgaySpec = (type) => {
    let start = null;
    if (type === "ThienQuy") start = findCungByStar(cungStars, "Văn Khúc");
    if (type === "AnQuang") start = findCungByStar(cungStars, "Văn Xương");
    if (type === "TamThai") start = findCungByStar(cungStars, "Tả Phù");
    if (type === "BatToa") start = findCungByStar(cungStars, "Hữu Bật");
    if (!start) return "Tý";
    const ngay = Math.max(1, Math.min(30, Number(lunarDay)));
    if (type === "ThienQuy") return stepCung(start, ngay + 1, "nghịch");
    if (type === "AnQuang") return stepCung(start, ngay + 1, "thuận");
    if (type === "TamThai") return stepCung(start, ngay, "thuận");
    if (type === "BatToa") return stepCung(start, ngay, "nghịch");
    return start;
  };

  const tapTinh = (congThuc) => {
    if (congThuc === "TapTinh_DauQuan") {
      const start = "Dần";
      const afterMonth = stepCung(start, Math.max(0, lunarMonth - 1), "nghịch");
      return stepCung(afterMonth, gioIndex, "thuận");
    }
    if (congThuc === "TapTinh_ThienKhong") {
      const base = getCungThaiTue();
      return stepCung(base, 1, "thuận");
    }
    if (congThuc === "TapTinh_ThienTai") {
      const chi = canChiNam.split(" ")[1] || canChiNam.split(" ")[0] || "Tý";
      const idx = CHI_INDEX[chi] || 0;
      return CHI_ORDER[(idx + CHI_INDEX["Tý"]) % 12];
    }
    if (congThuc === "TapTinh_ThienTho") {
      const chi = canChiNam.split(" ")[1] || canChiNam.split(" ")[0] || "Tý";
      const idx = CHI_INDEX[chi] || 0;
      const baseIdx = CHI_INDEX["Thân"];
      return CHI_ORDER[(baseIdx + idx) % 12];
    }
    return "Tý";
  };

  TIEUTINH_DATA.forEach(sao => {
    let cung = "Tý";
    switch (sao.congThuc) {
      case "ThaiTue":
        cung = getCungThaiTue();
        break;
      case "TheoThaiTue":
        cung = theoThaiTue(sao.buoc || 0, sao.huong || "thuận");
        break;
      case "TheoDiaChiNam":
        cung = theoDiaChi(sao.dsCung);
        break;
      case "TheoThangSinh":
        cung = theoThang(sao.dsCung);
        break;
      case "TheoGioSinh":
        cung = theoGio(sao.dsCung);
        break;
      case "TheoLocTon":
        cung = theoLocTon(sao.buoc || 0);
        break;
      case "TheoNgay_ThienQuy":
        cung = theoNgaySpec("ThienQuy");
        break;
      case "TheoNgay_AnQuang":
        cung = theoNgaySpec("AnQuang");
        break;
      case "TheoNgay_TamThai":
        cung = theoNgaySpec("TamThai");
        break;
      case "TheoNgay_BatToa":
        cung = theoNgaySpec("BatToa");
        break;
      case "TheoCanNamSinh":
        cung = theoCanNam(sao.dsCung);
        break;
      case "TapTinh_DauQuan":
      case "TapTinh_ThienKhong":
      case "TapTinh_ThienTai":
      case "TapTinh_ThienTho":
        cung = tapTinh(sao.congThuc);
        break;
      case "TapTinh_CuDinh":
        if (sao.cuDinh && typeof cungChucMap === "object") {
          const found = Object.entries(cungChucMap).find(([, v]) => v === sao.cuDinh);
          if (found) cung = found[0];
        }
        break;
      case "codinh":
        cung = (sao.dsCung && sao.dsCung[0]) || "Tý";
        break;
      default:
        cung = "Tý";
    }
    addStar(cungStars, map, cung, sao.ten, "tieu", sao.loai?.toLowerCase() === "hung" ? "hung" : "cat");
  });

  return { cungStars, saoToCungTieu: map };
}

// =========================
// TỨ HÓA
// =========================
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

function anTuHoa(params = {}) {
  const { canChiNam = "", mapSao = {}, baseCungStars = null, baseMap = null } = params;
  const cungStars = baseCungStars || initCungStars();
  const map = baseMap ? { ...baseMap } : {};

  const can = (canChiNam || "").split(" ")[0] || "";
  const hoa = TU_HOA[can];
  if (!hoa) return { cungStars, saoToCungTuHoa: map };

  const combinedMap = { ...mapSao, ...map };

  const ds = [
    { ten:"Hóa Lộc", sao: hoa.loc, loai:"cat" },
    { ten:"Hóa Quyền", sao: hoa.quyen, loai:"cat" },
    { ten:"Hóa Khoa", sao: hoa.khoa, loai:"cat" },
    { ten:"Hóa Kỵ", sao: hoa.ky, loai:"hung" }
  ];

  ds.forEach(x => {
    const key = normalizeKey(x.sao);
    const cung = combinedMap[key];
    if (cung) {
      addStar(cungStars, map, cung, x.ten, "tieu", x.loai);
    }
  });

  return { cungStars, saoToCungTuHoa: map };
}

// =========================
// LƯU VẬN (stub – TODO: port full anSaoLuu_*)
// =========================
function anLuuVan(params = {}) {
  const {
    luuHan = {},
    baseCungStars = null,
    baseMap = null,
    mapSaoGoc = {}
  } = params;

  const cungStars = baseCungStars || initCungStars();
  const map = baseMap ? { ...baseMap } : {};

  const LOC_TON_MAP = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ","Mậu":"Tỵ","Kỷ":"Ngọ",
    "Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
  };
  const THIEN_MA_MAP = {
    "Hợi":"Tỵ","Mão":"Tỵ","Mùi":"Tỵ","Tỵ":"Hợi","Dậu":"Hợi","Sửu":"Hợi",
    "Dần":"Thân","Ngọ":"Thân","Tuất":"Thân","Thân":"Dần","Tý":"Dần","Thìn":"Dần"
  };
  const KV = {
    "Giáp":["Sửu","Mùi"],"Mậu":["Sửu","Mùi"],"Ất":["Tý","Thân"],"Kỷ":["Tý","Thân"],
    "Canh":["Dần","Ngọ"],"Tân":["Dần","Ngọ"],"Bính":["Hợi","Dậu"],"Đinh":["Hợi","Dậu"],
    "Nhâm":["Mão","Tỵ"],"Quý":["Mão","Tỵ"]
  };
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

  const mapGoc = mapSaoGoc || {};

  function addGroupFromCanChi(canChi = "", prefix = "") {
    const [canRaw, chiRaw] = (canChi || "").split(" ");
    const can = canRaw || "";
    const chi = chiRaw || "";
    if (!can || !chi) return;

    // Lộc / Mã
    addLuuStar(cungStars, LOC_TON_MAP[can], "Lộc Tồn", "loc-ma", "cat", prefix, map);
    addLuuStar(cungStars, THIEN_MA_MAP[chi], "Thiên Mã", "loc-ma", "cat", prefix, map);

    // Kình / Đà
    const iA = CUNG_THUAN.indexOf(LOC_TON_MAP[can]);
    if (iA >= 0) {
      addLuuStar(cungStars, CUNG_THUAN[(iA + 1) % 12], "Kình Dương", "kinh-da", "hung", prefix, map);
      addLuuStar(cungStars, CUNG_THUAN[(iA - 1 + 12) % 12], "Đà La", "kinh-da", "hung", prefix, map);
    }

    // Khôi / Việt
    const cap = KV[can];
    if (cap) {
      addLuuStar(cungStars, cap[0], "Thiên Khôi", "khoi-viet", "cat", prefix, map);
      addLuuStar(cungStars, cap[1], "Thiên Việt", "khoi-viet", "cat", prefix, map);
    }

    // Văn Xương / Văn Khúc (theo Can)
    if (LUU_XUONG[can]) addLuuStar(cungStars, LUU_XUONG[can], "Văn Xương", "xuong-khuc", "cat", prefix, map);
    if (LUU_KHUC[can]) addLuuStar(cungStars, LUU_KHUC[can], "Văn Khúc", "xuong-khuc", "cat", prefix, map);

    // Tứ Hóa (dựa vào sao gốc đã an)
    const hoa = TU_HOA[can];
    if (hoa) {
      const tim = s => {
        const k = normalizeKey(s);
        return mapGoc[k];
      };
      const cLoc = tim(hoa.loc);
      const cKy = tim(hoa.ky);
      const cKhoa = tim(hoa.khoa);
      const cQuyen = tim(hoa.quyen);
      if (cLoc) addLuuStar(cungStars, cLoc, "Hóa Lộc", "loc-ky", "cat", prefix, map);
      if (cKy) addLuuStar(cungStars, cKy, "Hóa Kỵ", "loc-ky", "hung", prefix, map);
      if (cKhoa) addLuuStar(cungStars, cKhoa, "Hóa Khoa", "khoa-quyen", "cat", prefix, map);
      if (cQuyen) addLuuStar(cungStars, cQuyen, "Hóa Quyền", "khoa-quyen", "cat", prefix, map);
    }
  }

  // Đại / Tiểu / Nguyệt / Nhật – dùng canChi nếu có
  if (luuHan.canChiNam) addGroupFromCanChi(luuHan.canChiNam, "L");
  if (luuHan.canChiHan) addGroupFromCanChi(luuHan.canChiHan, "ĐV");
  if (luuHan.canChiThang) addGroupFromCanChi(luuHan.canChiThang, "N");
  if (luuHan.canChiNgay) addGroupFromCanChi(luuHan.canChiNgay, "Nh");

  return { cungStars, saoToCungLuu: map, luuHan };
}

// =========================
// HÀM CHÍNH: TÍNH LÁ SỐ DẠNG JSON
// =========================
function tinhLaSoDayDu(body = {}) {
  const base = convertDate(body);
  const tenCungMenh = body.tenCungMenh || body.cungMenh || "";
  let cucSo = body.cucSo || "";
  if (!cucSo && tenCungMenh) {
    cucSo = xacDinhCucSo(base.canChi.year, tenCungMenh);
  }

  let chinhTinh = null;
  const warnings = [];
  if (cucSo) {
    try {
      chinhTinh = anChinhTinh({
        cucSo,
        lunarDay: base.lunar.day
      });
    } catch (err) {
      warnings.push(err.message || "Khong an duoc chinh tinh");
    }
  } else {
    warnings.push("Chua co ten cung menh / cuc so de an chinh tinh");
  }

  const trungTinh = anTrungTinh({
    canChiNam: base.canChi.year,
    lunarMonth: base.lunar.month,
    canChiGio: base.canChi.hour,
    amduongMenh: base.menh,
    baseCungStars: chinhTinh?.cungStars,
    baseMap: chinhTinh?.saoToCung
  });

  const tieuTinh = anTieuTinh({
    canChiNam: base.canChi.year,
    lunarDay: base.lunar.day,
    lunarMonth: base.lunar.month,
    gioChi: base.canChi.hour,
    cungLocTon: body.cungLocTon || "",
    cungChucMap: body.cungChucMap || {},
    amduongMenh: base.menh,
    baseCungStars: trungTinh?.cungStars || chinhTinh?.cungStars,
    baseMap: { ...(chinhTinh?.saoToCung || {}), ...(trungTinh?.saoToCungTrung || {}) }
  });

  const locTon = anLocTonThienMa({
    canChiNam: base.canChi.year,
    baseCungStars: tieuTinh?.cungStars || trungTinh?.cungStars || chinhTinh?.cungStars,
    baseMap: { ...(chinhTinh?.saoToCung || {}), ...(trungTinh?.saoToCungTrung || {}), ...(tieuTinh?.saoToCungTieu || {}) }
  });

  const tuHoa = anTuHoa({
    canChiNam: base.canChi.year,
    mapSao: { ...(chinhTinh?.saoToCung || {}), ...(trungTinh?.saoToCungTrung || {}), ...(tieuTinh?.saoToCungTieu || {}), ...(locTon?.saoToCungLocTon || {}) },
    baseCungStars: locTon?.cungStars,
    baseMap: locTon?.saoToCungLocTon
  });

  const combinedMapSao = {
    ...(chinhTinh?.saoToCung || {}),
    ...(trungTinh?.saoToCungTrung || {}),
    ...(tieuTinh?.saoToCungTieu || {}),
    ...(locTon?.saoToCungLocTon || {}),
    ...(tuHoa?.saoToCungTuHoa || {})
  };

  const luuHanInput = body.luuHan || {};
  if (!luuHanInput.canChiNam && base.canChi?.year) {
    luuHanInput.canChiNam = base.canChi.year;
  }
  const luuVan = anLuuVan({
    baseCungStars: tuHoa?.cungStars || locTon?.cungStars || tieuTinh?.cungStars || trungTinh?.cungStars || chinhTinh?.cungStars,
    baseMap: combinedMapSao,
    mapSaoGoc: combinedMapSao,
    luuHan: luuHanInput
  });

  const finalCungStars = luuVan?.cungStars || tuHoa?.cungStars || locTon?.cungStars || tieuTinh?.cungStars || trungTinh?.cungStars || chinhTinh?.cungStars || initCungStars();
  const maps = {
    chinh: chinhTinh?.saoToCung || {},
    trung: trungTinh?.saoToCungTrung || {},
    tieu: tieuTinh?.saoToCungTieu || {},
    locTon: locTon?.saoToCungLocTon || {},
    tuHoa: tuHoa?.saoToCungTuHoa || {},
    luu: luuVan?.saoToCungLuu || {}
  };

  return {
    meta: {
      input: base.input,
      solar: base.solar,
      lunar: base.lunar,
      canChi: base.canChi,
      menh: base.menh,
      tenCungMenh,
      cucSo,
      cungLocTon: locTon?.locTon || body.cungLocTon || "",
      thienMa: locTon?.thienMa || "",
      luuHan: luuHanInput
    },
    chinhTinh,
    trungTinh,
    locTon,
    tuHoa,
    luuVan,
    cungStars: finalCungStars,
    tieuTinh,
    maps,
    warnings
  };
}

module.exports = {
  tinhLaSoDayDu,
  xacDinhCucSo,
  anTrungTinh,
  anTieuTinh,
  anLocTonThienMa,
  anTuHoa,
  anLuuVan
};
