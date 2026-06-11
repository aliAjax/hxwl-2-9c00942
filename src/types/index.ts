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
  isCustom?: boolean;
  createdAt?: string;
};

export type SpreadSnapshot = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  positions: string[];
  icon: string;
  isDeleted?: boolean;
};

export type Space = {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
  createdAt: string;
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
  spaceId?: string;
};

export type Reading = {
  date: string;
  cardIds: string[];
  revealed: number;
  question?: string;
  spreadId: string;
  spreadSnapshot?: SpreadSnapshot;
  spaceId?: string;
};

export type HistoryCard = {
  position: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
  illustration?: string;
  isDeleted?: boolean;
};

export type HistoryRecord = {
  date: string;
  cards: HistoryCard[];
  question?: string;
  spreadId?: string;
  spreadSnapshot?: SpreadSnapshot;
  spaceId?: string;
  spaceName?: string;
  archived?: boolean;
  archiveReason?: "completed" | "partial" | "expired";
};

export type ArchiveResult = {
  archived: HistoryRecord[];
  discarded: number;
  message: string;
};
