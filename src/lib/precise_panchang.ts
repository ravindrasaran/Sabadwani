import { getJD, getLahiriAyanamsa, getMoonLongitude, getSunLongitude, getTithiDiff, getTithiName, getSamvat } from "./astro";
import { julian } from "astronomia";
import SunCalc from "suncalc";
import { format } from "date-fns";
import { hi } from "date-fns/locale";

// --- Const lists ---

const nakshatras = [
  "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "अश्लेषा",
  "मघा", "पूर्वाफाल्गुनी", "उत्तराफाल्गुनी", "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा",
  "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती"
];

const yogs = [
  "विष्कम्भ", "प्रीति", "आयुष्मान्", "सौभाग्य", "शोभन", "अतिगण्ड", "सुकर्मा", "धृति", "शूल",
  "गण्ड", "वृद्धि", "ध्रुव", "व्याघात", "हर्षण", "वज्र", "सिद्धि", "व्यतीपात", "वरीयान्",
  "परिघ", "शिव", "सिद्ध", "साध्य", "शुभ", "शुक्ल", "ब्रह्म", "ऐन्द्र", "वैधृति"
];

const karans = [
  "बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज", "विष्टि (भद्रा)",
  "शकुनि", "चतुष्पाद", "नाग", "किंस्तुघ्न"
];

const rashis = [
  "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
];

// --- Precise coordinate providers ---

export const getSiderealMoon = (jd: number) => {
  const m = getMoonLongitude(jd);
  const a = getLahiriAyanamsa(jd);
  return (m - a + 360) % 360;
};

export const getSiderealSun = (jd: number) => {
  const s = getSunLongitude(jd);
  const a = getLahiriAyanamsa(jd);
  return (s - a + 360) % 360;
};

export const getSiderealYog = (jd: number) => {
  return (getSiderealSun(jd) + getSiderealMoon(jd)) % 360;
};

// --- Custom solver for circular and continuously increasing angles ---

const findAngleTransition = (
  startJD: number,
  endJD: number,
  targetAngle: number,
  func: (jd: number) => number
) => {
  let low = startJD;
  let high = endJD;
  const target = targetAngle;
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const val = func(mid);
    
    // Compute normalized difference
    const diffMid = (val - target + 360) % 360;
    
    if (diffMid < 180) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return (low + high) / 2;
};

// --- Helper to convert Date to 24+ hour Traditional format ---

export const formatTraditionalTime = (time: Date, targetDate: Date) => {
  const hrs = time.getHours();
  const mins = String(time.getMinutes()).padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  const displayHrs = String(hrs % 12 || 12).padStart(2, '0');
  const ampmTime = `${displayHrs}:${mins} ${ampm}`;

  const isDifferentDay = time.getDate() !== targetDate.getDate() || 
                         time.getMonth() !== targetDate.getMonth() || 
                         time.getFullYear() !== targetDate.getFullYear();

  if (isDifferentDay) {
    const dateStr = format(time, "d MMMM", { locale: hi });
    return `${dateStr}, ${ampmTime} तक`;
  } else {
    return `${ampmTime} तक`;
  }
};

// --- Main Precise Panchang Calculation ---

export interface DetailedPanchang {
  date: Date;
  tithi: string;
  nextTithi: string;
  tithiEnd: string;
  samvat: number;
  shakaSamvat: number;
  nakshatra: string;
  nextNakshatra: string;
  nakshatraEnd: string;
  yog: string;
  nextYog: string;
  yogEnd: string;
  karan: string;
  chandraRashi: string;
  suryaRashi: string;
  ritu: string;
  ayana: string;
  sunrise: Date;
  sunset: Date;
  moonrise: Date | null;
  moonset: Date | null;
  abhijit: { start: Date; end: Date };
  brahma: { start: Date; end: Date };
  rahuKaal: { start: Date; end: Date };
  dishaShool: string;
}

export const getPanchangForDate = (date: Date, lat = 28.6139, lon = 77.2090): DetailedPanchang => {
  // Set day reference to 6:00 AM (approx sunrise) for consistency with home screen today's panchang
  const targetDate6AM = new Date(date);
  targetDate6AM.setHours(6, 0, 0, 0);
  
  const jd = getJD(targetDate6AM);
  const samvat = getSamvat(jd);
  const shakaSamvat = samvat - 135;

  // 1. Tithi Info
  const diff = getTithiDiff(jd);
  const tIndex = Math.floor(diff / 12) % 30;
  const targetTithiAngle = ((tIndex + 1) * 12) % 360;
  const tithiTransitionJD = findAngleTransition(jd - 0.5, jd + 1.2, targetTithiAngle, getTithiDiff);
  const tithiEndDate = new julian.CalendarGregorian().fromJD(tithiTransitionJD).toDate();
  const tithi = getTithiName(jd);
  const nextTithi = getTithiName(tithiTransitionJD + 0.05);

  // 2. Nakshatra Info
  const sMoon = getSiderealMoon(jd);
  const nIndex = Math.floor(sMoon / 13.333333) % 27;
  const nakshatra = nakshatras[nIndex];
  const nextNakshatra = nakshatras[(nIndex + 1) % 27];
  const targetNakAngle = ((nIndex + 1) * 13.333333) % 360;
  const nakTransitionJD = findAngleTransition(jd - 0.5, jd + 1.2, targetNakAngle, getSiderealMoon);
  const nakEndDate = new julian.CalendarGregorian().fromJD(nakTransitionJD).toDate();

  // 3. Yog Info
  const sYog = getSiderealYog(jd);
  const yIndex = Math.floor(sYog / 13.333333) % 27;
  const yog = yogs[yIndex];
  const nextYog = yogs[(yIndex + 1) % 27];
  const targetYogAngle = ((yIndex + 1) * 13.333333) % 360;
  const yogTransitionJD = findAngleTransition(jd - 0.5, jd + 1.2, targetYogAngle, getSiderealYog);
  const yogEndDate = new julian.CalendarGregorian().fromJD(yogTransitionJD).toDate();

  // 4. Karan Info
  const kIndexPercent = diff / 6;
  const kNum = Math.floor(kIndexPercent);
  let karan = "";
  if (kNum === 0) {
    karan = "किंस्तुघ्न";
  } else if (kNum >= 57) {
    if (kNum === 57) karan = "शकुनि";
    if (kNum === 58) karan = "चतुष्पाद";
    if (kNum === 59) karan = "नाग";
  } else {
    karan = karans[(kNum - 1) % 7];
  }

  // 5. Zodiac Sign
  const chandraRashi = rashis[Math.floor(sMoon / 30) % 12];
  const sSun = getSiderealSun(jd);
  const suryaRashi = rashis[Math.floor(sSun / 30) % 12];

  // 6. Sat / Sun transitions
  const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
  const sunTimes = SunCalc.getTimes(date, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
  
  const sunrise = isValidDate(sunTimes.sunrise) ? sunTimes.sunrise : new Date(date.setHours(5, 30, 0, 0));
  const sunset = isValidDate(sunTimes.sunset) ? sunTimes.sunset : new Date(date.setHours(18, 45, 0, 0));
  const moonrise = isValidDate(moonTimes.rise) ? moonTimes.rise : null;
  const moonset = isValidDate(moonTimes.set) ? moonTimes.set : null;

  // 7. Rashi, Ritu and Ayana
  const ayana = (sSun >= 270 || sSun < 90) ? "उत्तरायण" : "दक्षिणायन";
  
  // Hindu Ritu lookup based on traditional months
  // Grishma: Jyeshtha, Ashadha (May-July)
  // Varsha: Shravana, Bhadrapada (July-Sept)
  // Sharad: Ashvina, Kartika (Sept-Nov)
  // Hemant: Margashirsha, Pausha (Nov-Jan)
  // Shishir: Magha, Phalguna (Jan-March)
  // Vasant: Chaitra, Vaishakha (March-May)
  const monthIdx = date.getMonth();
  let ritu = "वसन्त";
  if (monthIdx === 4 || monthIdx === 5) ritu = "ग्रीष्म";
  else if (monthIdx === 6 || monthIdx === 7) ritu = "वर्षा";
  else if (monthIdx === 8 || monthIdx === 9) ritu = "शरद";
  else if (monthIdx === 10 || monthIdx === 11) ritu = "हेमन्त";
  else if (monthIdx === 0 || monthIdx === 1) ritu = "शिशिर";

  // 8. Timings
  const dayDuration = sunset.getTime() - sunrise.getTime();
  const midday = sunrise.getTime() + dayDuration / 2;
  const muhurthaLength = dayDuration / 15;
  const abhijit = {
    start: new Date(midday - muhurthaLength / 2),
    end: new Date(midday + muhurthaLength / 2)
  };

  const brahma = {
    start: new Date(sunrise.getTime() - 96 * 60 * 1000),
    end: new Date(sunrise.getTime() - 48 * 60 * 1000)
  };

  // Rahu Kaal
  const partDuration = dayDuration / 8;
  const rahuKaalParts = [8, 2, 7, 5, 6, 4, 3]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const dayOfWeek = date.getDay();
  const partNum = rahuKaalParts[dayOfWeek];
  const rahuKaal = {
    start: new Date(sunrise.getTime() + (partNum - 1) * partDuration),
    end: new Date(sunrise.getTime() + partNum * partDuration)
  };

  // Disha Shool
  const dishaShools = ["पश्चिम", "पूर्व", "उत्तर", "उत्तर", "दक्षिण", "पश्चिम", "पूर्व"]; // Sun to Sat
  const dishaShool = dishaShools[dayOfWeek];

  return {
    date,
    tithi,
    nextTithi,
    tithiEnd: formatTraditionalTime(tithiEndDate, date),
    samvat,
    shakaSamvat,
    nakshatra,
    nextNakshatra,
    nakshatraEnd: formatTraditionalTime(nakEndDate, date),
    yog,
    nextYog,
    yogEnd: formatTraditionalTime(yogEndDate, date),
    karan,
    chandraRashi,
    suryaRashi,
    ritu,
    ayana,
    sunrise,
    sunset,
    moonrise,
    moonset,
    abhijit,
    brahma,
    rahuKaal,
    dishaShool
  };
};
