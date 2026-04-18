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
  icon?: string;
  audioUrl?: string;
  text?: string;
  author?: string;
  sequence?: number;
  type?: string;
  userId?: string;
  createdAt?: string;
  timestamp?: string;
};

export type Thought = {
  id: string;
  text: string;
  author?: string;
};

export type Mele = {
  id: string;
  name: string;
  desc?: string;
  location?: string;
  date?: string;
};

export type Notice = {
  id: string;
  title: string;
  text: string;
  active?: boolean;
};

export type Badhai = {
  id: string;
  title: string;
  imageUrl?: string;
  active?: boolean;
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
