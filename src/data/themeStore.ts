import type { ThemeId, Theme } from "../types";
import { THEMES, THEME_KEY, DEFAULT_THEME_ID } from "./constants";
import { safeGetItem, safeSetItem } from "./storage";

export function loadTheme(): ThemeId {
  const saved = safeGetItem<ThemeId | null>(THEME_KEY, null);
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  return DEFAULT_THEME_ID;
}

export function applyTheme(themeId: ThemeId): void {
  document.documentElement.setAttribute("data-theme", themeId);
}

export function saveTheme(themeId: ThemeId): boolean {
  return safeSetItem(THEME_KEY, themeId);
}

export function getAllThemes(): Theme[] {
  return THEMES;
}

export function isValidTheme(themeId: string): themeId is ThemeId {
  return THEMES.some((t) => t.id === themeId);
}
