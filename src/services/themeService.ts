export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'amusemac_theme_preference';

export function getStoredThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {}
  return 'system'; // Default MUST be System!
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(preference: ThemePreference): 'light' | 'dark' {
  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference;
  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (e) {}

  return effectiveTheme;
}

export function initThemeListener(onChange?: (effective: 'light' | 'dark') => void): () => void {
  const currentPref = getStoredThemePreference();
  applyTheme(currentPref);

  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    if (getStoredThemePreference() === 'system') {
      const effective = applyTheme('system');
      if (onChange) onChange(effective);
    }
  };

  mediaQuery.addEventListener('change', handleSystemChange);
  return () => mediaQuery.removeEventListener('change', handleSystemChange);
}
