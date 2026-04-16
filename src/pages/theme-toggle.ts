const STORAGE_KEY = "dwp-theme";

export type Theme = "light" | "dark";

export function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored) {
    applyTheme(stored);
  }
  // If no stored preference, prefers-color-scheme CSS media query handles it
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function bindThemeToggle(selector: string): void {
  const btn = document.querySelector(selector) as HTMLButtonElement | null;
  if (!btn) return;
  const update = () => {
    const t = getTheme();
    btn.textContent = t === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  };
  btn.addEventListener("click", () => {
    toggleTheme();
    update();
  });
  update();
}
