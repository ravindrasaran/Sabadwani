export type Screen =
  | "home"
  | "shabad_list"
  | "reading"
  | "amavasya"
  | "category_list"
  | "audio_reading"
  | "donate"
  | "about"
  | "privacy"
  | "contribute"
  | "search"
  | "admin_login"
  | "admin"
  | "community_posts"
  | "choghadiya"
  | "bichhuda"
  | "mele"
  | "mala"
  | "niyam";

export type SabadItem = {
  id: string;
  title: string;
  icon?: any;
  audioUrl?: string;
  text?: string;
  author?: string;
  sequence?: number;
  type?: string;
  userId?: string;
  createdAt?: string;
  timestamp?: string;
};

export type AppSettings = {
  logoUrl: string;
  qrCodeUrl: string;
  upiId: string;
  jaapAudioUrl: string;
  adText: string;
  adLink: string;
  isAdEnabled: boolean;
};
