import { join, resolve, extname, basename } from "path";
import { existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import {
  loadStore,
  persistStore,
  addPhoto,
  getPhotoById,
  getPhotosAll,
  getTagsForPhoto,
  getAllTagValues,
  approveTagsForPhoto,
  getPhotosByTags,
  logSearchQuery,
  findCachedQuery,
  addPhotoTag,
  resolveUploadsDir,
} from "../data/store.ts";
import { triggerTagging } from "../ai/tagging.ts";
import { expandQuery } from "../ai/queryExpand.ts";

// ── directory setup ──────────────────────────────────────────────
const ROOT = resolve(import.meta.dir, "../../");
const UPLOADS_DIR = resolveUploadsDir(process.env.UPLOADS_DIR, ROOT);
const STYLES_DIR = join(ROOT, "src", "styles");
const PUBLIC_DIR = join(ROOT, "public");
const PAGES_DIR = join(ROOT, "src", "pages");

for (const dir of [UPLOADS_DIR, PUBLIC_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

await loadStore();

// ── MIME helpers ─────────────────────────────────────────────────
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function mimeFor(path: string): string {
  return MIME[extname(path).toLowerCase()] ?? "application/octet-stream";
}

// ── path sanitiser ───────────────────────────────────────────────
function safeResolve(base: string, fragment: string): string | null {
  const full = resolve(join(base, fragment));
  if (!full.startsWith(resolve(base))) return null;
  return full;
}

// ── magic-byte validation ─────────────────────────────────────────
function validateMagicBytes(buf: Uint8Array): "image/jpeg" | "image/png" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "image/png";
  return null;
}

// ── JPEG EXIF strip ───────────────────────────────────────────────
function stripJpegExif(data: Uint8Array): Uint8Array {
  if (data[0] !== 0xff || data[1] !== 0xd8) return data;
  const result: number[] = [0xff, 0xd8];
  let pos = 2;
  while (pos < data.length - 1) {
    if (data[pos] !== 0xff) break;
    const marker = data[pos + 1];
    pos += 2;
    // Markers without payload
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      result.push(0xff, marker);
      continue;
    }
    if (pos + 1 >= data.length) break;
    const len = (data[pos] << 8) | data[pos + 1]; // includes the 2 length bytes
    if (marker === 0xe1) {
      // APP1 (EXIF / XMP) — skip
      pos += len;
      continue;
    }
    // Copy segment
    result.push(0xff, marker);
    for (let i = 0; i < len; i++) result.push(data[pos + i]);
    pos += len;
    if (marker === 0xda) {
      // SOS — copy rest of file (entropy-coded data)
      while (pos < data.length) result.push(data[pos++]);
      break;
    }
  }
  return new Uint8Array(result);
}

// ── PNG metadata strip ─────────────────────────────────────────────
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_SKIP_CHUNKS = new Set(["tEXt", "iTXt", "zTXt", "eXIf"]);

function stripPngMeta(data: Uint8Array): Uint8Array {
  for (let i = 0; i < 8; i++) if (data[i] !== PNG_SIG[i]) return data;
  const result: number[] = [...PNG_SIG];
  let pos = 8;
  while (pos + 8 <= data.length) {
    const length = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
    const type = String.fromCharCode(data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]);
    const chunkSize = 4 + 4 + length + 4; // length + type + data + CRC
    if (PNG_SKIP_CHUNKS.has(type)) {
      pos += chunkSize;
    } else {
      for (let i = 0; i < chunkSize; i++) result.push(data[pos + i]);
      pos += chunkSize;
    }
  }
  return new Uint8Array(result);
}

// ── static file helper ────────────────────────────────────────────
async function serveFile(filePath: string, fallbackMime?: string): Promise<Response> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(file, {
    headers: { "Content-Type": fallbackMime ?? mimeFor(filePath) },
  });
}

// ── JSON helpers ──────────────────────────────────────────────────
function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── route handlers ────────────────────────────────────────────────
async function handleUpload(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonErr("Invalid multipart form data");
  }

  const files = form.getAll("files[]") as File[];
  if (!files.length) return jsonErr("No files provided");
  if (files.length > 50) return jsonErr("Maximum 50 files per upload");

  const photoIds: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      errors.push(`${file.name}: exceeds 20 MB limit`);
      continue;
    }

    const rawBuf = new Uint8Array(await file.arrayBuffer());
    const detectedMime = validateMagicBytes(rawBuf);
    if (!detectedMime) {
      errors.push(`${file.name}: not a supported image format (JPEG/PNG only)`);
      continue;
    }

    // Strip metadata
    const cleanBuf = detectedMime === "image/jpeg" ? stripJpegExif(rawBuf) : stripPngMeta(rawBuf);

    const ext = detectedMime === "image/jpeg" ? ".jpg" : ".png";
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const dest = join(UPLOADS_DIR, filename);

    await Bun.write(dest, cleanBuf);

    const photo = addPhoto({
      filename,
      mimeType: detectedMime,
      size: cleanBuf.byteLength,
    });
    photoIds.push(photo.id);
  }

  await persistStore();
  return jsonOk({ photoIds, errors });
}

async function handleListPhotos(): Promise<Response> {
  const photos = getPhotosAll();
  return jsonOk({ photos });
}

async function handleGetPhoto(id: string): Promise<Response> {
  const photo = getPhotoById(id);
  if (!photo) return jsonErr("Photo not found", 404);
  return jsonOk({ photo });
}

async function handleGetPhotoTags(id: string): Promise<Response> {
  const photo = getPhotoById(id);
  if (!photo) return jsonErr("Photo not found", 404);
  const tags = getTagsForPhoto(id);
  return jsonOk({ tags });
}

async function handleGetAllTags(): Promise<Response> {
  const tags = getAllTagValues();
  return jsonOk({ tags });
}

async function handleTriggerTag(id: string): Promise<Response> {
  const photo = getPhotoById(id);
  if (!photo) return jsonErr("Photo not found", 404);
  // Run tagging asynchronously
  triggerTagging(id)
    .then(() => persistStore())
    .catch(console.error);
  return jsonOk({ queued: true });
}

async function handleApprove(id: string, req: Request): Promise<Response> {
  const photo = getPhotoById(id);
  if (!photo) return jsonErr("Photo not found", 404);

  let body: { tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonErr("Invalid JSON body");
  }

  const tags = body.tags;
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
    return jsonErr("tags must be an array of strings");
  }

  approveTagsForPhoto(id, tags as string[]);
  await persistStore();
  return jsonOk({ approved: true });
}

async function handleSearch(url: URL): Promise<Response> {
  const tagsParam = url.searchParams.get("tags") ?? "";
  const mode = (url.searchParams.get("mode") ?? "OR") as "AND" | "OR";

  if (!tagsParam.trim()) return jsonErr("tags parameter required");

  const tags = tagsParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const photos = getPhotosByTags(tags, mode);
  return jsonOk({ photos, tags });
}

async function handleSearchExpand(url: URL): Promise<Response> {
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) return jsonErr("q parameter required");
  const result = await expandQuery(q.trim());
  return jsonOk({ tags: result.tags, source: result.source, cached: result.cached });
}

// ── request router ────────────────────────────────────────────────
const PAGE_ROUTES: Record<string, string> = {
  "/": "index.html",
  "/upload": "upload.html",
  "/search": "search.html",
  "/review": "review.html",
};

async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  // HTML pages
  if (method === "GET" && path in PAGE_ROUTES) {
    return serveFile(join(PAGES_DIR, PAGE_ROUTES[path]!));
  }

  // Static: /styles/*
  if (method === "GET" && path.startsWith("/styles/")) {
    const fragment = path.slice("/styles/".length);
    const resolved = safeResolve(STYLES_DIR, fragment);
    if (!resolved) return jsonErr("Forbidden", 403);
    return serveFile(resolved);
  }

  // Static: /public/* (compiled JS bundles)
  if (method === "GET" && path.startsWith("/public/")) {
    const fragment = path.slice("/public/".length);
    const resolved = safeResolve(PUBLIC_DIR, fragment);
    if (!resolved) return jsonErr("Forbidden", 403);
    return serveFile(resolved);
  }

  // Images: /images/:filename
  if (method === "GET" && path.startsWith("/images/")) {
    const filename = basename(path.slice("/images/".length));
    if (!filename) return jsonErr("Not found", 404);
    const resolved = safeResolve(UPLOADS_DIR, filename);
    if (!resolved) return jsonErr("Forbidden", 403);
    return serveFile(resolved);
  }

  // API routes
  if (path === "/api/photos" && method === "POST") return handleUpload(req);
  if (path === "/api/photos" && method === "GET") return handleListPhotos();
  if (path === "/api/photos/tags" && method === "GET") return handleGetAllTags();
  if (path === "/api/search" && method === "GET") return handleSearch(url);
  if (path === "/api/search/expand" && method === "GET") return handleSearchExpand(url);

  // /api/photos/:id
  const photoMatch = path.match(/^\/api\/photos\/([^/]+)$/);
  if (photoMatch) {
    const id = photoMatch[1]!;
    if (method === "GET") return handleGetPhoto(id);
  }

  const photoTagsMatch = path.match(/^\/api\/photos\/([^/]+)\/tags$/);
  if (photoTagsMatch) {
    const id = photoTagsMatch[1]!;
    if (method === "GET") return handleGetPhotoTags(id);
  }

  const tagMatch = path.match(/^\/api\/photos\/([^/]+)\/tag$/);
  if (tagMatch) {
    const id = tagMatch[1]!;
    if (method === "POST") return handleTriggerTag(id);
  }

  const approveMatch = path.match(/^\/api\/photos\/([^/]+)\/approve$/);
  if (approveMatch) {
    const id = approveMatch[1]!;
    if (method === "POST") return handleApprove(id, req);
  }

  return new Response("Not found", { status: 404 });
}

// ── server startup ─────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    try {
      return await router(req);
    } catch (err) {
      console.error("Unhandled error:", err);
      return new Response("Internal server error", { status: 500 });
    }
  },
});

console.log(`🚀  Server running at http://localhost:${server.port}`);
