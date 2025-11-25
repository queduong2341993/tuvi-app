const TZ = 7; // Vietnam time zone

const CAN = ["Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy"];
const CHI = ["Ty","Suu","Dan","Mao","Thin","Ty","Ngo","Mui","Than","Dau","Tuat","Hoi"];

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function jdToDate(jd) {
  let Z = Math.floor(jd + 0.5), A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const dd = Math.floor(B - D - Math.floor(30.6001 * E));
  const mm = (E < 14) ? E - 1 : E - 13;
  const yy = (mm > 2) ? C - 4716 : C - 4715;
  return [dd, mm, yy];
}

function NewMoon(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  const C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr)
    + 0.0021 * Math.sin(2 * M * dr)
    - 0.4068 * Math.sin(Mpr * dr)
    + 0.0161 * Math.sin(2 * Mpr * dr)
    + 0.0104 * Math.sin(2 * F * dr)
    - 0.0051 * Math.sin((M + Mpr) * dr)
    - 0.0074 * Math.sin((M - Mpr) * dr)
    + 0.0004 * Math.sin((2 * F + M) * dr)
    - 0.0004 * Math.sin((2 * F - M) * dr)
    - 0.0006 * Math.sin((2 * F + Mpr) * dr)
    + 0.0010 * Math.sin((2 * F - Mpr) * dr)
    + 0.0005 * Math.sin((2 * Mpr + M) * dr);
  const deltat = (T < -11)
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T2 * T2
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}

function getNewMoonDay(k, tz) {
  return Math.floor(NewMoon(k) + 0.5 + tz / 24);
}

function SunLongitude(jdn) {
  const T = (jdn - 2451545.5) / 36525;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T * T - 0.00000048 * T * T * T;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T * T;
  const DL = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(dr * M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M)
    + 0.000290 * Math.sin(3 * dr * M);
  let L = (L0 + DL) * dr;
  L = L - 2 * Math.PI * Math.floor(L / (2 * Math.PI));
  return L;
}

function getSunLongitude(jdn, tz) {
  return Math.floor(SunLongitude(jdn - tz / 24) / (Math.PI / 6));
}

function getLunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11, tz) {
  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

function convertSolarToLunar(dd, mm, yy, tz) {
  const dayNumber = jdFromDate(dd, mm, yy);
  let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy - 1, tz);
  let b11 = getLunarMonth11(yy, tz);
  if (dayNumber >= b11) {
    a11 = b11;
    b11 = getLunarMonth11(yy + 1, tz);
  }
  const lunarDay = dayNumber - monthStart + 1;
  let diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarLeap = 0;
  let lunarYear = yy;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear += 1;
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

function convertLunarToSolar(ld, lm, ly, leap, tz) {
  let a11, b11;
  if (lm < 11) {
    a11 = getLunarMonth11(ly - 1, tz);
    b11 = getLunarMonth11(ly, tz);
  } else {
    a11 = getLunarMonth11(ly, tz);
    b11 = getLunarMonth11(ly + 1, tz);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lm - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz);
    const leapMonth = leapOff - 2 < 0 ? leapOff + 10 : leapOff - 2;
    if (leap !== 0 && lm !== leapMonth) return [0, 0, 0];
    if (leap !== 0 || off >= leapOff) off += 1;
  }
  const monthStart = getNewMoonDay(k + off, tz);
  return jdToDate(monthStart + ld - 1);
}

const CAN_THANG = {
  "Giap": ["Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh"],
  "At": ["Mau","Ky","Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky"],
  "Binh": ["Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan"],
  "Dinh": ["Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy"],
  "Mau": ["Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy","Giap","At"],
  "Ky": ["Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh"],
  "Canh": ["Mau","Ky","Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky"],
  "Tan": ["Canh","Tan","Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan"],
  "Nham": ["Nham","Quy","Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy"],
  "Quy": ["Giap","At","Binh","Dinh","Mau","Ky","Canh","Tan","Nham","Quy","Giap","At"]
};

function canChiYear(y) {
  return CAN[(y + 6) % 10] + " " + CHI[(y + 8) % 12];
}

function canChiMonth(y, m) {
  const canY = canChiYear(y).split(" ")[0];
  const canM = CAN_THANG[canY]?.[m - 1];
  const chiM = CHI[(m + 1) % 12];
  return (canM || "?") + " " + chiM;
}

function canChiDay(y, m, d) {
  const jd = jdFromDate(d, m, y);
  return CAN[(jd + 9) % 10] + " " + CHI[(jd + 1) % 12];
}

function canChiHour(h, jd) {
  const chiIndex = Math.floor(((h + 1) % 24) / 2) % 12;
  const canDayIndex = (jd + 9) % 10;
  const map = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };
  const start = map[canDayIndex];
  const canIndex = (start + chiIndex) % 10;
  return CAN[canIndex] + " " + CHI[chiIndex];
}

function tinhMenhAD(canChiNam, gender) {
  const can = canChiNam.split(" ")[0];
  const duong = ["Giap","Binh","Mau","Canh","Nham"];
  const isDuong = duong.includes(can);
  if (isDuong && gender === "Nam") return "Duong Nam";
  if (isDuong && gender === "Nu") return "Duong Nu";
  if (!isDuong && gender === "Nam") return "Am Nam";
  return "Am Nu";
}

function addSolarDay(d, m, y, delta) {
  return jdToDate(jdFromDate(d, m, y) + delta);
}

function shiftLunarByDays(lunar, delta) {
  const [dAm, mAm, yAm, leap] = lunar;
  const [dS, mS, yS] = convertLunarToSolar(dAm, mAm, yAm, leap || 0, TZ);
  return convertSolarToLunar(...addSolarDay(dS, mS, yS, delta), TZ);
}

function tetSolarDate(year) {
  return convertLunarToSolar(1, 1, year, 0, TZ);
}

function normalizeLunarYearByTet(solarDay, solarMonth, solarYear, lunar) {
  const [tetD, tetM, tetY] = tetSolarDate(solarYear);
  const jdInput = jdFromDate(solarDay, solarMonth, solarYear);
  const jdTet = jdFromDate(tetD, tetM, tetY);
  const adjustedYear = jdInput < jdTet ? solarYear - 1 : solarYear;
  return [lunar[0], lunar[1], adjustedYear, lunar[3]];
}

function parseInput(body) {
  const type = body.type === "lunar" ? "lunar" : "solar";
  const day = Number(body.day);
  const month = Number(body.month || body.monthRaw);
  const year = Number(body.year);
  const hour = body.hour === undefined ? 0 : Number(body.hour);
  const genderRaw = (body.gender || "Nam").trim();
  const gender = ["Nam", "Nu"].includes(genderRaw) ? genderRaw : "Nam";
  const name = (body.name || "Nguoi dung").trim();
  const isLeap = body.isLeap ? 1 : 0;
  if (!day || !month || !year) throw new Error("Invalid date input");
  if (hour < 0 || hour > 23) throw new Error("Invalid hour");
  return { type, day, month, year, hour, gender, name, isLeap };
}

function convertDate(body) {
  const { type, day, month, year, hour, gender, name, isLeap } = parseInput(body);

  let solar = { day, month, year };
  let lunar;

  if (type === "solar") {
    lunar = convertSolarToLunar(day, month, year, TZ);
    if (hour === 23) {
      lunar = shiftLunarByDays(lunar, 1); // Gio Ty sau: tang 1 ngay am
    }
    lunar = normalizeLunarYearByTet(solar.day, solar.month, solar.year, lunar);
  } else {
    const solarDate = convertLunarToSolar(day, month, year, isLeap, TZ);
    solar = { day: solarDate[0], month: solarDate[1], year: solarDate[2] };
    lunar = [day, month, year, isLeap];
    if (hour === 23) {
      lunar = shiftLunarByDays(lunar, 1);
      const shiftedSolar = addSolarDay(solar.day, solar.month, solar.year, 1);
      solar = { day: shiftedSolar[0], month: shiftedSolar[1], year: shiftedSolar[2] };
    }
    lunar = normalizeLunarYearByTet(solar.day, solar.month, solar.year, lunar);
  }

  const canY = canChiYear(lunar[2]);
  const canM = canChiMonth(lunar[2], lunar[1]);
  const canD = canChiDay(solar.year, solar.month, solar.day);
  let jd = jdFromDate(solar.day, solar.month, solar.year);
  if (hour === 23) jd += 1; // Gio Ty sau tinh sang ngay sau
  const canH = canChiHour(hour, jd);
  const menh = tinhMenhAD(canY, gender);

  return {
    input: { type, day, month, year, hour, gender, name, isLeap: !!isLeap },
    solar,
    lunar: { day: lunar[0], month: lunar[1], year: lunar[2], leap: !!lunar[3] },
    canChi: { year: canY, month: canM, day: canD, hour: canH },
    menh,
    note: "Da tinh theo cong thuc Ho Ngoc Duc + quy tac Gio Ty",
    tz: TZ
  };
}

module.exports = {
  convertDate,
  jdFromDate,
  jdToDate,
  convertSolarToLunar,
  convertLunarToSolar
};

