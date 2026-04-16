import "../components/tag-review-sheet.ts";
import { initTheme, bindThemeToggle } from "./theme-toggle.ts";

initTheme();
bindThemeToggle("#theme-toggle");

const params = new URLSearchParams(location.search);
const photoId = params.get("photoId");

async function init() {
  const errorEl = document.getElementById("error-msg")!;

  if (!photoId) {
    errorEl.textContent = "No photo ID provided. Go back to the gallery.";
    errorEl.style.display = "block";
    return;
  }

  try {
    // Load photo info + tags
    const [photoRes, tagsRes, vocabRes] = await Promise.all([
      fetch(`/api/photos/${photoId}`),
      fetch(`/api/photos/${photoId}/tags`),
      fetch("/api/photos/tags"),
    ]);

    if (!photoRes.ok) throw new Error("Photo not found");

    const { photo } = await photoRes.json();
    const { tags: photoTags } = await tagsRes.json();
    const { tags: allTags } = await vocabRes.json();

    // Populate image
    const img = document.getElementById("preview-img") as HTMLImageElement;
    img.src = `/images/${photo.filename}`;

    // Show status badge
    const badge = document.getElementById("status-badge")!;
    badge.innerHTML = `<span class="badge badge--${photo.status}">${photo.status}</span>`;

    // Wire review sheet
    const sheet = document.getElementById("review-sheet") as any;
    sheet.tags = photoTags.map((t: { displayValue: string }) => t.displayValue);
    sheet.vocabulary = allTags;

    // Handle approval
    sheet.addEventListener("tags-approved", async (e: CustomEvent) => {
      const { tags } = e.detail as { tags: string[] };
      const res = await fetch(`/api/photos/${photoId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        errorEl.textContent = "Failed to approve tags. Please try again.";
        errorEl.style.display = "block";
      }
    });
  } catch (err) {
    const errorEl = document.getElementById("error-msg")!;
    errorEl.textContent = `Error: ${(err as Error).message}`;
    errorEl.style.display = "block";
  }
}

init();
