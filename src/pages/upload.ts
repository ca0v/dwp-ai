import "../components/photo-uploader.ts";
import { initTheme, bindThemeToggle } from "./theme-toggle.ts";

initTheme();
bindThemeToggle("#theme-toggle");

document.addEventListener("photos-uploaded", async (e: Event) => {
  const { photoIds } = (e as CustomEvent).detail as { photoIds: string[] };
  // Trigger AI tagging for each uploaded photo
  await Promise.allSettled(
    photoIds.map((id) => fetch(`/api/photos/${id}/tag`, { method: "POST" }).catch(() => null))
  );
});
