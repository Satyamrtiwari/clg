import { create } from 'zustand';

export type ThemeMode = 'blue' | 'pink' | 'dark';

interface ThemeState {
  colorTheme: ThemeMode;
  theme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('canteen_theme_mode') as ThemeMode;
  if (saved === 'blue' || saved === 'pink' || saved === 'dark') {
    return saved;
  }
  // Default to SJCEM Royal Blue Theme!
  return 'blue';
};

const applyThemeToDOM = (mode: ThemeMode) => {
  const root = document.documentElement;
  
  // Set data-color-theme attribute for CSS variables
  root.setAttribute('data-color-theme', mode);

  // Toggle dark class for Tailwind dark mode
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorTheme: initialTheme,
  theme: initialTheme === 'dark' ? 'dark' : 'light',
  setTheme: (mode: ThemeMode) => {
    localStorage.setItem('canteen_theme_mode', mode);
    applyThemeToDOM(mode);
    set({ colorTheme: mode, theme: mode === 'dark' ? 'dark' : 'light' });
  },
  cycleTheme: () => {
    const current = get().colorTheme;
    let nextMode: ThemeMode = 'blue';
    if (current === 'blue') nextMode = 'pink';
    else if (current === 'pink') nextMode = 'dark';
    else if (current === 'dark') nextMode = 'blue';

    localStorage.setItem('canteen_theme_mode', nextMode);
    applyThemeToDOM(nextMode);
    set({ colorTheme: nextMode, theme: nextMode === 'dark' ? 'dark' : 'light' });
  },
  toggleTheme: () => {
    get().cycleTheme();
  },
}));
