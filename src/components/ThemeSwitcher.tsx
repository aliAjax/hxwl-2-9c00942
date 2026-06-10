import { getAllThemes } from "../data/themeStore";
import type { ThemeId } from "../types";

type ThemeSwitcherProps = {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
};

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const themes = getAllThemes();

  return (
    <section className="theme-section">
      <div className="theme-switcher" role="tablist" aria-label="主题切换">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-button ${currentTheme === theme.id ? "active" : ""}`}
            onClick={() => onThemeChange(theme.id)}
            role="tab"
            aria-selected={currentTheme === theme.id}
            title={theme.name}
          >
            <span className="theme-icon">{theme.icon}</span>
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
