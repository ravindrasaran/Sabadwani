import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Compass, 
  Clock, 
  Info, 
  MapPin, 
  MapPinOff, 
  Loader2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import PremiumHeader from "../PremiumHeader";
import { getPanchangForDate } from "../../lib/precise_panchang";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from "date-fns";
import { hi } from "date-fns/locale";
import { vibrate } from "../../lib/utils";
import { getJD, getTithiName, getCurrentHinduDate } from "../../lib/astro";
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

// Compact representation of Hindu Tithi inside day boxes
const getCompactTithi = (date: Date) => {
  const jd = getJD(date);
  const tithi = getTithiName(jd);
  
  if (tithi.includes("अमावस्या")) return "अमावस्या";
  if (tithi.includes("पूर्णिमा")) return "पूर्णिमा";
  
  const paksha = tithi.includes("शुक्ल") ? "शु." : "कृ.";
  
  const originalNames = [
    "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"
  ];
  
  const shortNames = [
    "१", "२", "३", "४", "५", "६", "७", "८", "९", "१०", "११", "१२", "१३", "१४"
  ];
  
  for (let i = 0; i < originalNames.length; i++) {
    if (tithi.includes(originalNames[i])) {
      return `${paksha} ${shortNames[i]}`;
    }
  }
  return tithi;
};

export default function PanchangCalendarScreen({ handleBack, meles = [] }: any) {
  // Navigation & Location states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [latitude, setLatitude] = useState<number>(() => {
    const saved = localStorage.getItem("panchang_lat");
    return saved ? parseFloat(saved) : 28.0229; // Default Bikaner Lat
  });
  const [longitude, setLongitude] = useState<number>(() => {
    const saved = localStorage.getItem("panchang_lon");
    return saved ? parseFloat(saved) : 73.3119; // Default Bikaner Lon
  });
  const [locationName, setLocationName] = useState<string>(() => {
    return localStorage.getItem("panchang_location_name") || "Bikaner, Rajasthan";
  });

  const currentHinduMonthName = useMemo(() => {
    try {
      const { fullMonth } = getCurrentHinduDate(selectedDate);
      return fullMonth || "ज्येष्ठ";
    } catch (e) {
      return "ज्येष्ठ";
    }
  }, [selectedDate]);

  // Save location attributes to localStorage for next launches
  useEffect(() => {
    localStorage.setItem("panchang_lat", latitude.toString());
    localStorage.setItem("panchang_lon", longitude.toString());
    localStorage.setItem("panchang_location_name", locationName);
  }, [latitude, longitude, locationName]);

  // Geolocation lookup state
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  
  // Autocomplete state
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-search OSM location
  useEffect(() => {
    if (!locationQuery || locationQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=5&accept-language=en&addressdetails=1`,
          { headers: { "User-Agent": "SabadwaniPanchang/1.0" } }
        );
        if (res.ok) {
          const data = await res.json();
          const list = data.map((item: any) => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || item.name || item.display_name.split(",")[0];
            const state = addr.state || "";
            const country = addr.country || "";
            
            let disp = city;
            if (state) disp += `, ${state}`;
            if (country && country !== "India") disp += `, ${country}`;
            
            return {
              displayName: disp,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            };
          });
          setSuggestions(list);
        }
      } catch (e) {
        console.error("OSM lookup failed", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Request GPS permission & get coordinates
  const handleGPSLocation = async () => {
    vibrate(15);
    setIsGeoLoading(true);
    setGeoError(null);

    try {
      let position;
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            setGeoError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर परमिशन दें।");
            setIsGeoLoading(false);
            try {
              await NativeSettings.open({
                optionAndroid: AndroidSettings.ApplicationDetails,
                optionIOS: IOSSettings.App
              });
            } catch (e) {
              console.warn("Could not open settings", e);
            }
            return;
          }
        }
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 15000,
        });
      } else {
        if (!navigator.geolocation) {
          setGeoError("आपके डिवाइस में लोकेशन की सुविधा उपलब्ध नहीं है।");
          setIsGeoLoading(false);
          return;
        }
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 15000,
            maximumAge: 300000,
          });
        });
      }

      const { latitude: lat, longitude: lon } = position.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en&addressdetails=1`,
        { headers: { "User-Agent": "SabadwaniPanchang/1.0" } }
      );
      
      let resolvedName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || data.name || data.display_name.split(",")[0];
        const state = addr.state || "";
        const country = addr.country || "";
        
        let disp = city;
        if (state) disp += `, ${state}`;
        if (country && country !== "India") disp += `, ${country}`;
        resolvedName = disp;
      }
      
      setLatitude(lat);
      setLongitude(lon);
      setLocationName(resolvedName);
      setLocationQuery("");
    } catch (error: any) {
      console.error("GPS retrieval failed", error);
      const errorMsg = error.message?.toLowerCase() || "";
      if (error.code === 2 || errorMsg.includes("disabled") || errorMsg.includes("unavailable")) {
        setGeoError("कृपया अपने मोबाइल की लोकेशन (GPS) चालू करें।");
        try {
          await NativeSettings.open({
            optionAndroid: AndroidSettings.Location,
            optionIOS: IOSSettings.LocationServices
          });
        } catch (e) {
          console.warn("Could not open settings", e);
        }
      } else if (error.code === 1) {
        setGeoError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें या सीधे अपने शहर का नाम लिखकर खोजें।");
      } else {
        setGeoError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें या सीधे अपने शहर का नाम लिखकर खोजें।");
      }
    } finally {
      setIsGeoLoading(false);
    }
  };

  // Search OSM for current typed key when user clicks manual calculated button
  const handleSetManualLocation = async () => {
    vibrate(15);
    setShowSuggestions(false);
    if (!locationName || locationName.trim().length < 3) return;
    setIsSettingLocation(true);
    setGeoError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1&accept-language=en&addressdetails=1`,
        { headers: { "User-Agent": "SabadwaniPanchang/1.0" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || item.name || item.display_name.split(",")[0];
          const state = addr.state || "";
          const country = addr.country || "";
          
          let resolvedName = city;
          if (state) resolvedName += `, ${state}`;
          if (country && country !== "India") resolvedName += `, ${country}`;
          
          setLatitude(parseFloat(item.lat));
          setLongitude(parseFloat(item.lon));
          setLocationName(resolvedName);
          setLocationQuery("");
          setSuggestions([]);
        } else {
          setGeoError("लिखा हुआ स्थान नहीं मिला। कृपया दूसरा नाम लिखें।");
        }
      } else {
        setGeoError("स्थान खोजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } catch (e) {
      console.error("Manual search failed", e);
      setGeoError("नेटवर्क में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsSettingLocation(false);
    }
  };

  // Compute Panchang data for selected date and location
  const panchang = useMemo(() => {
    return getPanchangForDate(selectedDate, latitude, longitude);
  }, [selectedDate, latitude, longitude]);

  // Generate days in month grid
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add offset days for leading empty spots (Sunday to Saturday)
    const firstDayIndex = start.getDay(); // 0 indicates Sunday
    const offset = [];
    for (let i = 0; i < firstDayIndex; i++) {
      offset.push(null);
    }
    
    return [...offset, ...days];
  }, [currentMonth]);

  // Pre-calculate Hindu Tithis for current screen's month for high performance scrolling
  const monthTithis = useMemo(() => {
    const tithiMap: Record<string, string> = {};
    daysInMonth.forEach((day) => {
      if (day) {
        const key = format(day, "yyyy-MM-dd");
        tithiMap[key] = getCompactTithi(day);
      }
    });
    return tithiMap;
  }, [daysInMonth]);

  // Handle month switches
  const prevMonth = () => {
    vibrate(10);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    vibrate(10);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const setToday = () => {
    vibrate(15);
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  // Find if a festival or mela falls on selectedDate
  const todaysMelas = useMemo(() => {
    if (!meles || meles.length === 0) return [];
    return meles.filter((m: any) => {
      if (!m.date) return false;
      const mDate = new Date(m.date);
      return isSameDay(mDate, selectedDate);
    });
  }, [selectedDate, meles]);

  const weekdayHeaders = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen text-ink text-left"
    >
      <PremiumHeader title="वैदिक पंचांग" onBack={handleBack} icon={CalendarDays} />

      <div className="px-4 pt-4 max-w-xl mx-auto space-y-6">
        
        {/* Geographic location and calculation tuning */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-5.5 border border-ink/5 shadow-md space-y-4.5 relative overflow-visible z-30">
          {/* Subtle top decoration beam */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-accent/20 via-accent/60 to-accent/20" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-accent/5 border border-accent/15 text-accent-dark">
                <Compass className="w-4 h-4 text-accent-dark animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-black text-accent-dark/80 tracking-widest uppercase block leading-none mb-1">गणना स्थान</span>
                <h3 className="text-[11px] font-black text-ink-light tracking-wide leading-none uppercase">Location Settings</h3>
              </div>
            </div>
          </div>

          {/* Unified Premium Location Info and Interactive Search Changer (Choghadiya-style) */}
          <div className="relative space-y-3 z-30">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-2.5 bg-paper/60 p-1.5 rounded-2xl border border-ink/10 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all duration-300 shadow-sm items-center">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocationName(val);
                    setLocationQuery(val);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 250);
                  }}
                  placeholder="शहर का नाम लिखें..."
                  autoComplete="off"
                  className="w-full text-xs bg-transparent border-none outline-none font-bold text-ink h-7 pl-2 placeholder-ink-light/40"
                />
              </div>

              {/* GPS button on Right side outside input box */}
              <button
                type="button"
                onClick={handleGPSLocation}
                disabled={isGeoLoading}
                className="h-10 w-10 bg-accent/10 hover:bg-accent/25 text-accent-dark rounded-2xl border border-accent/20 hover:border-accent/45 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
                title="GPS से मेरी लोकेशन"
              >
                {isGeoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-accent-dark" />
                ) : (
                  <MapPin className="w-4.5 h-4.5 text-accent-dark" />
                )}
              </button>
            </div>

            {/* Premium Autocomplete Results Popup */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg border border-ink/10 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-ink/5 overflow-hidden transition-all duration-300">
                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      vibrate(10);
                      setLatitude(item.lat);
                      setLongitude(item.lon);
                      setLocationName(item.displayName);
                      setLocationQuery("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3.5 text-xs font-bold text-ink hover:bg-accent/10 active:bg-accent/20 flex items-center gap-2.5 transition-all"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="truncate">{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Calculate / Set Location Button like Choghadiya */}
            <button
              onClick={handleSetManualLocation}
              disabled={isSettingLocation}
              className="w-full py-3 bg-gradient-to-r from-accent to-accent-dark text-white font-black rounded-xl hover:opacity-95 active:scale-[0.99] transition-all border border-accent/10 shadow-sm text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2"
            >
              {isSettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>खोज जारी है...</span>
                </>
              ) : (
                "लोकेशन सेट करें"
              )}
            </button>
          </div>

          {geoError && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 text-red-800 rounded-[1.25rem] text-xs flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center text-center sm:text-left border border-red-200/60 shadow-[0_4px_15px_-5px_rgba(239,68,68,0.15)]"
            >
              <div className="bg-red-100/80 p-2 rounded-full shrink-0 shadow-sm flex items-center justify-center">
                <MapPinOff className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="text-red-800 font-bold leading-snug">{geoError}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic & Interactive Monthly Calendar Grid Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-ink/5 shadow-md p-5 space-y-4">
          
          {/* Calendar header with Controls */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-lg font-black text-ink tracking-tight font-heading">
                {format(currentMonth, "MMMM yyyy", { locale: hi })}
              </h2>
              <p className="text-[11px] uppercase font-black text-accent-dark tracking-widest mt-0.5">
                ऋतु: {panchang.ritu} • {panchang.ayana}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={setToday}
                className="text-[11px] font-black uppercase text-accent-dark bg-accent/5 hover:bg-accent/15 px-3 py-1.5 rounded-full border border-accent/10 hover:border-accent/20 transition-all active:scale-[0.98]"
              >
                आज (Today)
              </button>
              <button
                onClick={prevMonth}
                className="p-2 bg-paper text-ink hover:bg-accent/10 active:scale-95 text-ink-light rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-paper text-ink hover:bg-accent/10 active:scale-95 text-ink-light rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-ink-light uppercase tracking-wider py-1 border-b border-ink/5">
            {weekdayHeaders.map((h, i) => (
              <div key={i} className={i === 0 ? "text-red-500 font-extrabold" : ""}>
                {h}
              </div>
            ))}
          </div>

          {/* Day Tiles Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-2xl" />;
              }

              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isSameDay(day, new Date());
              const dateStringKey = format(day, "yyyy-MM-dd");
              const compactTithi = monthTithis[dateStringKey] || "";
              const melaFallsOnThisDay = meles.some((m: any) => m.date && isSameDay(new Date(m.date), day));
              
              const isAmavasya = compactTithi === "अमावस्या";
              const isPurnima = compactTithi === "पूर्णिमा";
              const isSunday = day.getDay() === 0;

              return (
                <button
                  key={`day-${dateStringKey}`}
                  onClick={() => {
                    vibrate(10);
                    setSelectedDate(day);
                  }}
                  className={`aspect-square rounded-2xl p-1 py-1.5 flex flex-col items-center justify-between transition-all duration-200 relative group touch-manipulation border ${
                    isSelected 
                      ? "bg-gradient-to-br from-accent to-accent-dark text-white border-accent shadow-md scale-102 font-black" 
                      : isTodayDate
                        ? "bg-accent/10 text-accent-dark border-accent-dark/30 font-bold"
                        : "bg-paper/40 hover:bg-accent/5 border-transparent text-ink"
                  }`}
                >
                  {/* Festival / Special Day tiny orange dot indicator */}
                  {melaFallsOnThisDay && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-yellow-500 ring-2 ring-white rounded-full animate-bounce" />
                  )}

                  {/* Day scalar */}
                  <span className={`text-[13px] leading-none font-extrabold text-center ${
                    isSelected 
                      ? "text-white" 
                      : isSunday 
                        ? "text-red-500" 
                        : "text-ink"
                  }`}>
                    {day.getDate()}
                  </span>

                  {/* Compact Traditional Tithi Indicator */}
                  {compactTithi && (
                    <div className="w-full grid place-items-center">
                      <span className={`max-w-max font-black tracking-tighter leading-normal text-center whitespace-nowrap py-0.5 rounded-sm ${
                        isAmavasya ? "text-[7.5px] px-0.5" : "text-[8.5px] px-1"
                      } ${
                        isSelected
                          ? "text-white/90"
                          : isAmavasya
                            ? "bg-red-500/15 text-red-600 font-bold"
                            : isPurnima
                              ? "bg-green-500/15 text-green-700 font-bold"
                              : "text-accent-dark/80"
                      }`}>
                        {compactTithi}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detailed Panchang Cards & Calculations Block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.getTime()}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* 1. Panchang Banner & Highlight details */}
            <div className="bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 rounded-3xl p-5 border border-accent/20 shadow-md flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full" />
              <div className="space-y-2 relative z-10">
                <span className="bg-accent/15 text-accent-dark text-[11px] font-black uppercase px-2.5 py-1 rounded-full border border-accent/20">
                  {format(selectedDate, "EEEE", { locale: hi })}
                </span>
                <h3 className="text-xl font-heading text-accent-dark font-black tracking-tight mt-1">
                  {format(selectedDate, "dd MMMM yyyy", { locale: hi })}
                </h3>
                <p className="text-xs text-ink/80 font-bold font-serif leading-relaxed">
                  विक्रम संवत {panchang.samvat} • शक संवत {panchang.shakaSamvat}
                  <br />
                  मास: {currentHinduMonthName} • {panchang.tithi}
                </p>
              </div>

              {/* Sunrise graphic overlay */}
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-accent/10">
                <Sun className="w-7 h-7 text-yellow-500 animate-spin-slow" />
              </div>
            </div>

            {/* Todays Meles / Festivals if any */}
            {todaysMelas.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-3xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-black text-yellow-800">आज का विशेष दर्शन एवं उत्सव</h4>
                  {todaysMelas.map((m: any, i: number) => (
                    <p key={i} className="text-xs text-yellow-900 mt-1 font-bold">
                      🌸 {m.name} {m.location ? `(${m.location})` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Standard Bento Grid of Astronomical parameters */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Tithi Detail */}
              <div className="bg-white/95 rounded-2.5xl p-4 border border-ink/5 shadow-inner flex flex-col justify-between text-left">
                <div>
                  <span className="text-[11px] font-black text-ink-light uppercase tracking-wider">तिथि (Tithi)</span>
                  <p className="text-base font-extrabold text-accent-dark tracking-tight mt-0.5 leading-snug">
                    {panchang.tithi}
                  </p>
                </div>
                <div className="border-t border-ink/5 pt-2 mt-2">
                  <p className="text-[10px] text-ink-light leading-relaxed">
                    समाप्ति: <span className="font-bold text-ink">{panchang.tithiEnd}</span>
                  </p>
                  <p className="text-[10px] text-ink-light leading-relaxed mt-0.5">
                    अगला: <span className="font-semibold">{panchang.nextTithi}</span>
                  </p>
                </div>
              </div>

              {/* Nakshatra Detail */}
              <div className="bg-white/95 rounded-2.5xl p-4 border border-ink/5 shadow-inner flex flex-col justify-between text-left">
                <div>
                  <span className="text-[11px] font-black text-ink-light uppercase tracking-wider">नक्षत्र (Nakshatra)</span>
                  <p className="text-base font-extrabold text-accent-dark tracking-tight mt-0.5 leading-snug">
                    {panchang.nakshatra}
                  </p>
                </div>
                <div className="border-t border-ink/5 pt-2 mt-2">
                  <p className="text-[10px] text-ink-light leading-relaxed">
                    समाप्ति: <span className="font-bold text-ink">{panchang.nakshatraEnd}</span>
                  </p>
                  <p className="text-[10px] text-ink-light leading-relaxed mt-0.5">
                    अगला: <span className="font-semibold">{panchang.nextNakshatra}</span>
                  </p>
                </div>
              </div>

              {/* Yog Detail */}
              <div className="bg-white/95 rounded-2.5xl p-4 border border-ink/5 shadow-inner flex flex-col justify-between text-left">
                <div>
                  <span className="text-[11px] font-black text-ink-light uppercase tracking-wider">योग (Yog)</span>
                  <p className="text-base font-extrabold text-ink tracking-tight mt-0.5">
                    {panchang.yog}
                  </p>
                </div>
                <div className="border-t border-ink/5 pt-2 mt-2">
                  <p className="text-[10px] text-ink-light leading-relaxed">
                    समाप्ति: <span className="font-bold text-ink">{panchang.yogEnd}</span>
                  </p>
                  <p className="text-[10px] text-ink-light leading-relaxed mt-0.5">
                    अगला: <span className="font-semibold">{panchang.nextYog}</span>
                  </p>
                </div>
              </div>

              {/* Karan Detail */}
              <div className="bg-white/95 rounded-2.5xl p-4 border border-ink/5 shadow-inner flex flex-col justify-between text-left">
                <div>
                  <span className="text-[11px] font-black text-ink-light uppercase tracking-wider">करण (Karan)</span>
                  <p className="text-base font-extrabold text-ink tracking-tight mt-0.5">
                    {panchang.karan}
                  </p>
                </div>
                <div className="border-t border-ink/5 pt-2 mt-2 text-[10px] text-ink-light leading-relaxed">
                  किंस्तुघ्न, बव, बालव की श्रृंखला में वर्तमान में <span className="font-bold text-ink">{panchang.karan}</span> करण चल रहा है।
                </div>
              </div>

            </div>

            {/* 3. Astronomical Timings (Sunrise, Sunset, Moonrise) */}
            <div className="bg-white/95 rounded-3xl p-5 border border-ink/5 shadow-sm space-y-4 text-left">
              <h4 className="text-xs font-black text-accent-dark tracking-widest uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> सूर्योदय एवं चन्द्रोदय समय
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-2xl border border-orange-100">
                    <Sun className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink-light uppercase">सूर्योदय (Sunrise)</p>
                    <p className="text-sm font-extrabold mt-0.5 text-ink">
                      {format(panchang.sunrise, "hh:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-2xl border border-indigo-100">
                    <Moon className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink-light uppercase">सूर्यास्त (Sunset)</p>
                    <p className="text-sm font-extrabold mt-0.5 text-ink">
                      {format(panchang.sunset, "hh:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-yellow-50 p-2 rounded-2xl border border-yellow-100">
                    <Moon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink-light uppercase">चन्द्रोदय (Moonrise)</p>
                    <p className="text-sm font-extrabold mt-0.5 text-ink">
                      {panchang.moonrise ? format(panchang.moonrise, "hh:mm a") : "नहीं है"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <Moon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink-light uppercase">चन्द्रास्त (Moonset)</p>
                    <p className="text-sm font-extrabold mt-0.5 text-ink">
                      {panchang.moonset ? format(panchang.moonset, "hh:mm a") : "नहीं है"}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Signs & Ritu Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/95 rounded-2.5xl p-3 border border-ink/5 shadow-sm text-center">
                <span className="text-[10px] font-black text-ink-light uppercase">चन्द्रराशि</span>
                <p className="text-sm font-black text-accent-dark tracking-tight mt-0.5">{panchang.chandraRashi} राशि</p>
              </div>
              <div className="bg-white/95 rounded-2.5xl p-3 border border-ink/5 shadow-sm text-center">
                <span className="text-[10px] font-black text-ink-light uppercase">सूर्यराशि</span>
                <p className="text-sm font-black text-accent-dark tracking-tight mt-0.5">{panchang.suryaRashi} राशि</p>
              </div>
              <div className="bg-white/95 rounded-2.5xl p-3 border border-ink/5 shadow-sm text-center">
                <span className="text-[10px] font-black text-ink-light uppercase">दिशाशूल</span>
                <p className="text-sm font-black text-red-600 tracking-tight mt-0.5">{panchang.dishaShool}</p>
              </div>
            </div>

            {/* 5. Muhurtha Details (Abhijit, Rahu kaal, etc) */}
            <div className="bg-white/95 rounded-3xl p-5 border border-ink/5 shadow-sm space-y-4 text-left">
              <h4 className="text-xs font-black text-accent-dark tracking-widest uppercase flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent" /> शुभ एवं अशुभ मुहूर्त समय
              </h4>
              <div className="space-y-3">
                
                {/* Abhijit Muhurtha */}
                <div className="flex justify-between items-center bg-green-50/50 p-2.5 rounded-2xl border border-green-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-xs font-black text-green-800">अभिजित मुहूर्त (अति शुभ)</p>
                      <p className="text-[10px] text-green-700/80">नया कार्य शुरू करने के लिए सर्वोत्तम समय।</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-green-800/90 whitespace-nowrap bg-green-100/50 px-2.5 py-1 rounded-xl">
                    {format(panchang.abhijit.start, "hh:mm a")} से {format(panchang.abhijit.end, "hh:mm a")}
                  </span>
                </div>

                {/* Brahma Muhurtha */}
                <div className="flex justify-between items-center bg-teal-50/50 p-2.5 rounded-2xl border border-teal-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <p className="text-xs font-black text-teal-800">ब्रह्म मुहूर्त (ध्यान-पूजा)</p>
                      <p className="text-[10px] text-teal-700/80">स्मरण, पूजा एवं ध्यान के लिए अति उत्तम समय।</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-800/90 whitespace-nowrap bg-teal-100/50 px-2.5 py-1 rounded-xl">
                    {format(panchang.brahma.start, "hh:mm a")} से {format(panchang.brahma.end, "hh:mm a")}
                  </span>
                </div>

                {/* Rahu Kaal */}
                <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-2xl border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-red-800">राहुकाल (अशुभ समय)</p>
                      <p className="text-[10px] text-red-700/80">इस समय नवीन व मांगलिक कार्य वर्जित होते हैं।</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-red-800/90 whitespace-nowrap bg-red-100/50 px-2.5 py-1 rounded-xl">
                    {format(panchang.rahuKaal.start, "hh:mm a")} - {format(panchang.rahuKaal.end, "hh:mm a")}
                  </span>
                </div>

              </div>
            </div>

            {/* Astrological note */}
            <div className="bg-paper p-4 rounded-2.5xl border border-ink/10 flex items-start gap-2 text-left">
              <Info className="w-4 h-4 text-ink-light shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-light font-medium leading-relaxed italic">
                गुरु जम्भेश्वर भगवान ने 365 दिन के हर क्षण को ही अच्छा माना है, उन्होंने इस प्रकार के आडंबरों से बिश्नोई समाज को मुक्त रखा है फिर भी आज के समय की मांग के लिए वैज्ञानिक सूत्र अनुसार यहां दिए गए हैं।
              </p>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
