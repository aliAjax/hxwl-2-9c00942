export type ThemeId = "night-market" | "dawn-morning" | "rainy-night";

export type Theme = {
  id: ThemeId;
  name: string;
  icon: string;
};

export type Spread = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  positions: string[];
  icon: string;
};

export type Card = {
  id: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
  isCustom?: boolean;
  illustration?: string;
};

export type Reading = {
  date: string;
  cardIds: string[];
  revealed: number;
  question?: string;
  spreadId: string;
};

export type HistoryCard = {
  position: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
  illustration?: string;
};

export type HistoryRecord = {
  date: string;
  cards: HistoryCard[];
  question?: string;
  spreadId?: string;
  archived?: boolean;
  archiveReason?: "completed" | "partial" | "expired";
};

export type ArchiveResult = {
  archived: HistoryRecord[];
  discarded: number;
  message: string;
};
