import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { randomUUID } from "crypto";
import type { Photo, Tag, PhotoTag, SearchQueryLog, StoreData, PhotoStatus } from "./types.ts";

export function resolveUploadsDir(configuredDir?: string, rootDir = resolve(import.meta.dir, "../../")): string {
  const configured = configuredDir?.trim();
  if (configured) return resolve(configured);
  return join(rootDir, "uploads");
}

const UPLOADS_DIR = resolveUploadsDir(process.env.UPLOADS_DIR);
const DATA_FILE = join(UPLOADS_DIR, "data.json");

const defaultStore = (): StoreData => ({
  photos: [],
  tags: [],
  photoTags: [],
  searchQueryLogs: [],
});

let store: StoreData = defaultStore();

export async function loadStore(): Promise<void> {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  if (existsSync(DATA_FILE)) {
    try {
      store = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
    } catch {
      store = defaultStore();
    }
  }
}

export async function persistStore(): Promise<void> {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function resetStore(): void {
  store = defaultStore();
}

// ── Photo ──────────────────────────────────────────────────────────

export function addPhoto(input: { filename: string; mimeType: string; size: number }): Photo {
  const now = new Date().toISOString();
  const photo: Photo = {
    id: randomUUID(),
    filename: input.filename,
    mimeType: input.mimeType,
    size: input.size,
    createdAt: now,
    uploadedAt: now,
    status: "queued",
  };
  store.photos.push(photo);
  return photo;
}

export function getPhoto(id: string): Photo | undefined {
  return store.photos.find((p) => p.id === id);
}

/** Alias — preferred name in server routes and tests */
export const getPhotoById = getPhoto;

export function listPhotos(): Photo[] {
  return [...store.photos];
}

/** Alias */
export const getPhotosAll = listPhotos;

export function updatePhotoStatus(id: string, status: PhotoStatus): void {
  const photo = store.photos.find((p) => p.id === id);
  if (photo) photo.status = status;
}

// ── Tag ────────────────────────────────────────────────────────────

function normalizeTag(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

export function getOrCreateTag(displayValue: string): Tag {
  const valueNormalized = normalizeTag(displayValue);
  let tag = store.tags.find((t) => t.valueNormalized === valueNormalized);
  if (!tag) {
    tag = {
      id: randomUUID(),
      valueNormalized,
      displayValue: displayValue.trim(),
      createdAt: new Date().toISOString(),
    };
    store.tags.push(tag);
  }
  return tag;
}

export function getAllTagValues(): string[] {
  return store.tags.map((t) => t.displayValue);
}

// ── PhotoTag ───────────────────────────────────────────────────────

export function addPhotoTag(input: {
  photoId: string;
  tagValue: string;
  source: "ai" | "user";
  confidence: number;
  approved?: boolean;
}): PhotoTag {
  const tag = getOrCreateTag(input.tagValue);
  const existing = store.photoTags.find(
    (pt) => pt.photoId === input.photoId && pt.tagId === tag.id
  );
  if (existing) return existing;

  const photoTag: PhotoTag = {
    photoId: input.photoId,
    tagId: tag.id,
    source: input.source,
    confidence: input.confidence,
    approved: input.approved ?? false,
    approvedAt: input.approved ? new Date().toISOString() : undefined,
  };
  store.photoTags.push(photoTag);
  return photoTag;
}

export function removeAiTagsForPhoto(photoId: string): void {
  store.photoTags = store.photoTags.filter((pt) => !(pt.photoId === photoId && pt.source === "ai"));
}

export function approveTagsForPhoto(photoId: string, tagValues: string[]): void {
  const normalizedValues = new Set(tagValues.map(normalizeTag));

  for (const pt of store.photoTags) {
    if (pt.photoId !== photoId) continue;
    const tag = store.tags.find((t) => t.id === pt.tagId);
    if (tag && normalizedValues.has(tag.valueNormalized)) {
      pt.approved = true;
      pt.approvedAt = new Date().toISOString();
    }
  }

  const existingTagIds = new Set(
    store.photoTags.filter((pt) => pt.photoId === photoId).map((pt) => pt.tagId)
  );
  for (const value of tagValues) {
    const tag = getOrCreateTag(value);
    if (!existingTagIds.has(tag.id)) {
      store.photoTags.push({
        photoId,
        tagId: tag.id,
        source: "user",
        confidence: 1,
        approved: true,
        approvedAt: new Date().toISOString(),
      });
    }
  }

  const photo = store.photos.find((p) => p.id === photoId);
  if (photo) {
    photo.status = "ready";
  }
}

export function getTagsForPhoto(
  photoId: string,
  onlyApproved = false
): Array<Tag & { source: "ai" | "user"; approved: boolean }> {
  const pts = store.photoTags.filter(
    (pt) => pt.photoId === photoId && (onlyApproved ? pt.approved : true)
  );
  return pts.flatMap((pt) => {
    const tag = store.tags.find((t) => t.id === pt.tagId);
    return tag ? [{ ...tag, source: pt.source, approved: pt.approved }] : [];
  });
}

export function getPhotosByTags(tagValues: string[], mode: "AND" | "OR" = "AND"): Photo[] {
  const normalized = tagValues.map(normalizeTag);

  const photoIdsWithTag = (tagId: string): Set<string> =>
    new Set(
      store.photoTags.filter((pt) => pt.tagId === tagId && pt.approved).map((pt) => pt.photoId)
    );

  const tagIdForValue = (n: string): string | null =>
    store.tags.find((t) => t.valueNormalized === n)?.id ?? null;

  const tagIds = normalized.map(tagIdForValue);

  let eligibleIds: Set<string>;
  if (mode === "AND") {
    const sets = tagIds.filter((id): id is string => id !== null).map(photoIdsWithTag);
    if (!sets.length) return [];
    eligibleIds = sets.reduce((acc, s) => new Set([...acc].filter((id) => s.has(id))));
  } else {
    eligibleIds = new Set<string>();
    for (const id of tagIds) {
      if (id) photoIdsWithTag(id).forEach((pid) => eligibleIds.add(pid));
    }
  }

  return store.photos
    .filter((p) => eligibleIds.has(p.id))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

// ── SearchQueryLog ──────────────────────────────────────────────────

export function logSearchQuery(input: {
  queryText: string;
  resolvedTags: string[];
  resultCount: number;
}): SearchQueryLog {
  const entry: SearchQueryLog = {
    id: randomUUID(),
    queryText: input.queryText,
    resolvedTags: input.resolvedTags,
    resultCount: input.resultCount,
    createdAt: new Date().toISOString(),
  };
  store.searchQueryLogs.push(entry);
  return entry;
}

export function findCachedQuery(queryText: string): SearchQueryLog | undefined {
  const normalized = queryText.toLowerCase().trim();
  return store.searchQueryLogs
    .slice()
    .reverse()
    .find((log) => log.queryText.toLowerCase().trim() === normalized);
}
