import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('canteen_theme') as Theme;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  // Day mode by default as requested!
  return 'light';
};

const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Apply default theme immediately on module load
const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('canteen_theme', nextTheme);
      applyThemeToDOM(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme: Theme) => {
    localStorage.setItem('canteen_theme', theme);
    applyThemeToDOM(theme);
    set({ theme });
  },
}));
