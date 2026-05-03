export type ObnofiTheme = "light" | "dark" | "jungle";

export const THEME_STORAGE_KEY = "obnofi-theme";

function getRoot() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.documentElement;
}

export function applyTheme(theme: ObnofiTheme) {
  const root = getRoot();
  if (!root) {
    return;
  }

  root.classList.remove("dark", "jungle");

  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else if (theme === "jungle") {
    root.classList.add("jungle");
    root.style.colorScheme = "light";
  } else {
    root.style.colorScheme = "light";
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getStoredTheme(): ObnofiTheme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (theme === "light" || theme === "dark" || theme === "jungle") {
    return theme;
  }

  return null;
}

export function getResolvedTheme(): ObnofiTheme {
  const root = getRoot();
  if (!root) {
    return "light";
  }

  if (root.classList.contains("dark")) {
    return "dark";
  }

  if (root.classList.contains("jungle")) {
    return "jungle";
  }

  return "light";
}
