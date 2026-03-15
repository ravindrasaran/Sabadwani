import * as lucide from "lucide-react";
const icons = [
  "Book", "Calendar", "Home", "Heart", "Info", "Lock", "ChevronLeft", "ChevronRight",
  "CalendarDays", "BookOpenText", "Music", "Play", "Pause", "Search", "Settings",
  "PlusCircle", "Sun", "ShieldCheck", "HeartHandshake", "Share2", "UploadCloud",
  "Bookmark", "Bell", "Quote", "Users", "CheckCircle", "XCircle", "Edit3", "Image",
  "KeyRound", "X", "MapPin", "Loader2", "Target", "ListOrdered", "RotateCcw"
];
icons.forEach(icon => {
  if (!lucide[icon]) {
    console.log("Missing:", icon);
  }
});
