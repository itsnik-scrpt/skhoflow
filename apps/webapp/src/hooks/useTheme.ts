import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

function getTheme(): Theme {
  const stored = localStorage.getItem('skhoflow-theme') as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem('skhoflow-theme', t);
}

export function useTheme() {
  // Always derive from DOM so all instances stay in sync
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  // Keep local state synced when another instance changes the DOM class
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeState(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggleTheme };
}
