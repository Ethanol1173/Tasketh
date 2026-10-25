'use client';
import { createContext, useContext, useState } from 'react';
import { themes, type Theme } from '@/lib/themes';
import { Check } from 'lucide-react';
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: 'obsidian',
  setTheme: () => {},
});
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, updateTheme] = useState(initialTheme);
  function setTheme(value: Theme) {
    updateTheme(value);
    document.documentElement.dataset.theme = value;
    document.cookie = `tasketh-theme=${value};path=/;max-age=31536000;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
  }
  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}
export function useTheme() {
  return useContext(ThemeContext);
}
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-grid" role="group" aria-label="Choose a theme">
      {themes.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`theme-card ${theme === item.id ? 'selected' : ''}`}
          onClick={() => setTheme(item.id)}
          aria-pressed={theme === item.id}
        >
          <div className="theme-preview" style={{ background: item.bg, color: item.text }}>
            <div className="mini-sidebar">
              <span style={{ background: item.accent }} />
              <i />
              <i />
              <i />
            </div>
            <div className="mini-content">
              <div className="mini-heading" />
              <div className="mini-panel" style={{ background: item.surface }}>
                <span style={{ background: item.accent }} />
                <i />
                <i />
              </div>
              <div className="mini-lines">
                <i />
                <i />
              </div>
            </div>
            {theme === item.id && (
              <span className="theme-check" style={{ background: item.accent, color: item.bg }}>
                <Check size={14} />
              </span>
            )}
          </div>
          <div className="theme-description">
            <strong>{item.name}</strong>
            <span>{item.note}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
