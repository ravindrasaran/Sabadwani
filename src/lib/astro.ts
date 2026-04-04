import { julian, moonposition, solar, base, deltat } from "astronomia";
import { format } from "date-fns";
import { hi } from "date-fns/locale";

// --- Precise Astronomical Calculations (Top Level) ---

const getJD = (date: Date) => new julian.CalendarGregorian().fromDate(date).toJD();

const getJDE = (jd: number) => {
  const year = new julian.CalendarGregorian().fromJD(jd).toYear();
  return jd + deltat.deltaT(year) / 86400;
};

const getLahiriAyanamsa = (jd: number) => {
  const T = (jd - 2415020.5) / 36525;
  return 22.460848 + 1.396042 * T + 0.000308 * T * T;
};

const getMoonLongitude = (jd: number) => {
  const jde = getJDE(jd);
  const pos = moonposition.position(jde);
  return (pos.lon * 180) / Math.PI;
};

const getSunLongitude = (jd: number) => {
  const jde = getJDE(jd);
  const T = base.J2000Century(jde);
  const lon = solar.apparentLongitude(T);
  return (lon * 180) / Math.PI;
};

const getTithiDiff = (jd: number) => {
  const m = getMoonLongitude(jd);
  const s = getSunLongitude(jd);
  // Ensure positive modulo result
  let diff = (m - s) % 360;
  if (diff < 0) diff += 360;
  return diff;
};

const findTransition = (
  startJD: number,
  endJD: number,
  target: number,
  func: (jd: number) => number,
) => {
  let low = startJD;
  let high = endJD;
  const v1 = func(low);
  
  for (let i = 0; i < 40; i++) {
    let mid = (low + high) / 2;
    let vMid = func(mid);
    
    let diffMid = (vMid - v1 + 360) % 360;
    let diffTarget = (target - v1 + 360) % 360;
    
    if (diffMid < diffTarget) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};

const getSiderealSun = (jd: number) => {
  const s = getSunLongitude(jd);
  const a = getLahiriAyanamsa(jd);
  return (s - a + 360) % 360;
};

const getTithiName = (jd: number) => {
  const diff = getTithiDiff(jd);
  const tithiNum = Math.floor(diff / 12) + 1;
  const names = [
    "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा"
  ];
  
  // Clamp tithiNum to 1-30 range and handle NaN
  const safeTithiNum = isNaN(tithiNum) ? 1 : Math.max(1, Math.min(30, tithiNum));
  
  let paksha = safeTithiNum <= 15 ? "शुक्ल" : "कृष्ण";
  let nameIndex = (safeTithiNum - 1) % 15;
  let name = names[nameIndex];
  
  if (safeTithiNum === 15) name = "पूर्णिमा";
  if (safeTithiNum === 30) {
    paksha = "कृष्ण";
    name = "अमावस्या";
  }
  
  return `${paksha} ${name}`;
};

const getSamvat = (jd: number) => {
  const date = new julian.CalendarGregorian().fromJD(jd).toDate();
  const year = date.getFullYear();
  
  // Find Phalguna Amavasya of this Gregorian year to determine Samvat transition
  // Phalguna Amavasya is when Sun is in Kumbha (Rashi 10)
  let searchJD = getJD(new Date(year, 1, 15)); // Start searching around Feb 15
  let phalgunaAmavasyaJD = 0;
  
  for (let i = -30; i <= 60; i++) {
    const tJD = searchJD + i;
    const diff = getTithiDiff(tJD);
    if (diff > 350 || diff < 10) {
      const fJD = findTransition(tJD - 2, tJD + 2, 0, getTithiDiff);
      const sSun = getSiderealSun(fJD);
      if (Math.floor(sSun / 30) === 10) {
        phalgunaAmavasyaJD = fJD;
        break;
      }
    }
  }
  
  // Samvat changes after Phalguna Amavasya (at the start of Chaitra Shukla 1)
  if (jd > phalgunaAmavasyaJD) return year + 57;
  return year + 56;
};


// Precise Amavasya Logic
const generateAmavasyaForYear = (year: number) => {
  const amavasyas = [];
  const hindiMonthNames = [
    "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", 
    "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन", "चैत्र"
  ];

  let jd = getJD(new Date(year, 0, 1));
  const endJD = getJD(new Date(year + 1, 0, 15));

  while (jd < endJD) {
    const diff = getTithiDiff(jd);
    if (diff > 340 || diff < 20) {
      const startJD = findTransition(jd - 2, jd + 2, 348, getTithiDiff);
      const finishJD = findTransition(startJD, startJD + 2, 0, getTithiDiff);
      
      const sSun = getSiderealSun(finishJD);
      const rashi = Math.floor(sSun / 30);
      
      amavasyas.push({ startJD, finishJD, rashi });
      jd = finishJD + 25;
    } else {
      jd += 1;
    }
  }

  return amavasyas
    .filter(a => {
      const d = new julian.CalendarGregorian().fromJD(a.startJD).toDate();
      return d.getFullYear() === year;
    })
    .map((a, idx, arr) => {
      const startDate = new julian.CalendarGregorian().fromJD(a.startJD).toDate();
      const endDate = new julian.CalendarGregorian().fromJD(a.finishJD).toDate();
      
      let monthName = hindiMonthNames[a.rashi];
      
      // Adhik Maas: Two Amavasyas in the same Rashi
      const isAdhik = arr[idx + 1] && arr[idx + 1].rashi === a.rashi;
      const wasAdhik = arr[idx - 1] && arr[idx - 1].rashi === a.rashi;
      
      if (isAdhik) monthName = "अधिक " + monthName;
      else if (wasAdhik) monthName = "शुद्ध " + monthName;
      
      const samvat = getSamvat(a.finishJD);

      return {
        hindiMonth: monthName,
        gregorianMonth: format(startDate, "MMMM", { locale: hi }),
        sub: `विक्रम संवत ${samvat}`,
        start: format(startDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
        end: format(endDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
        startDate,
        endDate,
      };
    });
};

// Precise Bichhuda Logic
const getBichhudaList = (year: number) => {
  const list = [];
  let jd = getJD(new Date(year, 0, 1));
  const endJD = getJD(new Date(year + 1, 0, 5));

  const getSiderealMoon = (jd: number) => {
    const m = getMoonLongitude(jd);
    const a = getLahiriAyanamsa(jd);
    return (m - a + 360) % 360;
  };

  while (jd < endJD) {
    const sMoon = getSiderealMoon(jd);
    // Scorpio is 210 to 240
    if (sMoon > 200 && sMoon < 215) {
      const startJD = findTransition(jd - 1, jd + 1, 210, getSiderealMoon);
      const finishJD = findTransition(startJD, startJD + 3, 240, getSiderealMoon);

      const startDate = new julian.CalendarGregorian().fromJD(startJD).toDate();
      const endDate = new julian.CalendarGregorian().fromJD(finishJD).toDate();

      if (startDate.getFullYear() === year) {
        list.push({
          monthName: format(startDate, "MMMM", { locale: hi }),
          start: format(startDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
          end: format(endDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
          isUpcoming: endDate > new Date(),
          rawStart: startDate,
        });
      }
      jd = finishJD + 20; // Skip to next month
    } else {
      jd += 0.5;
    }
  }
  return list;
};

const getCurrentHinduDate = (date: Date) => {
  const jd = getJD(date);
  const tithiName = getTithiName(jd);
  
  const year = date.getFullYear();
  const amavasyas = [
    ...generateAmavasyaForYear(year - 1), 
    ...generateAmavasyaForYear(year), 
    ...generateAmavasyaForYear(year + 1)
  ];
  
  let currentMonth = "";
  const isShukla = tithiName.includes("शुक्ल") || tithiName.includes("पूर्णिमा");
  
  if (isShukla) {
    const pastAmavasyas = amavasyas.filter(a => a.endDate.getTime() <= date.getTime());
    if (pastAmavasyas.length > 0) {
      currentMonth = pastAmavasyas[pastAmavasyas.length - 1].hindiMonth.replace("अधिक ", "").replace("शुद्ध ", "");
    }
  } else {
    const futureAmavasyas = amavasyas.filter(a => a.endDate.getTime() > date.getTime());
    if (futureAmavasyas.length > 0) {
      currentMonth = futureAmavasyas[0].hindiMonth.replace("अधिक ", "").replace("शुद्ध ", "");
    }
  }
  
  return { month: currentMonth, tithi: tithiName };
};



export { 
  getJD, getJDE, getLahiriAyanamsa, getMoonLongitude, getSunLongitude, 
  getTithiDiff, findTransition, getSiderealSun, getTithiName, getSamvat,
  generateAmavasyaForYear, getBichhudaList, getCurrentHinduDate
};
