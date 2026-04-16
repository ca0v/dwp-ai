import { readFileSync } from "fs";
import { getPhoto, updatePhotoStatus, addPhotoTag, removeAiTagsForPhoto } from "../data/store.ts";
import { canTransition } from "../data/photoStatus.ts";
import { getProvider } from "./config.ts";
import { getActiveSystemPrompt } from "./profiles.ts";

export async function triggerTagging(photoId: string): Promise<void> {
  const photo = getPhoto(photoId);
  if (!photo) throw new Error(`Photo ${photoId} not found`);

  // Validate transition
  if (!canTransition(photo.status, "analyzing")) {
    // Already analyzing or in invalid state - allow re-tagging from needs-review/error
    if (photo.status !== "needs-review" && photo.status !== "error") {
      throw new Error(`Cannot tag photo in status: ${photo.status}`);
    }
  }

  updatePhotoStatus(photoId, "analyzing");

  try {
    const filePath = `uploads/${photo.filename}`;
    const fileBuffer = readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    const mimeType = photo.mimeType;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const systemPrompt = getActiveSystemPrompt();
    const provider = getProvider();
    const results = await provider.tagImage(dataUrl, systemPrompt);

    // Replace existing AI tags
    removeAiTagsForPhoto(photoId);

    for (const result of results) {
      addPhotoTag({
        photoId,
        tagValue: result.tag,
        source: "ai",
        confidence: result.confidence,
        approved: false,
      });
    }

    updatePhotoStatus(photoId, "needs-review");
  } catch (err) {
    updatePhotoStatus(photoId, "error");
    throw err;
  }
}
