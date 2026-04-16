import "../components/search-bar.ts";
import { initTheme, bindThemeToggle } from "./theme-toggle.ts";

initTheme();
bindThemeToggle("#theme-toggle");

async function init() {
  const res = await fetch("/api/photos/tags").catch(() => null);
  if (!res?.ok) return;
  const { tags } = await res.json();
  const bar = document.getElementById("search") as any;
  if (bar) bar.vocabulary = tags ?? [];
}

init();

document.addEventListener("photo-selected", (e: Event) => {
  const { photoId } = (e as CustomEvent).detail;
  window.location.href = `/review?photoId=${photoId}`;
});
