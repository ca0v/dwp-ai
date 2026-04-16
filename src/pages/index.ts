import "../components/photo-grid.ts";
import { initTheme, bindThemeToggle } from "./theme-toggle.ts";

initTheme();
bindThemeToggle("#theme-toggle");

async function loadGallery() {
  try {
    const res = await fetch("/api/photos");
    const data = await res.json();
    const grid = document.getElementById("gallery") as any;
    if (grid) grid.photos = data.photos ?? [];
  } catch {
    // no-op: gallery shows empty state
  }
}

loadGallery();

// Re-fetch after photo-selected to navigate to review
document.addEventListener("photo-selected", (e: Event) => {
  const { photoId } = (e as CustomEvent).detail;
  window.location.href = `/review?photoId=${photoId}`;
});
