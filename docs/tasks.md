# Atomic Task Decomposition

**Task Type:** Feature Request — Planning  
**Summary:** Decompose the requirements from README into atomic, independently shippable and testable tasks. Each task is the smallest change that delivers working, verifiable behavior. Manual testing uses the VS Code Copilot `open_browser_page` toolchain.

---

## Design Soundness Notes (Pre-Task Fixes)

The following issues were found in the README and corrected before task decomposition:

| #   | Issue                                                                 | Fix Applied                                |
| --- | --------------------------------------------------------------------- | ------------------------------------------ |
| 1   | `copilot.instructions.md` at repo root is not auto-loaded by VS Code  | Moved to `.github/copilot-instructions.md` |
| 2   | Project structure missing `tests/`, `config/`, `uploads/` directories | Updated §14                                |
| 3   | `/src/data` labeled "DB models" but storage is JSON in-memory         | Relabeled §14                              |
| 4   | No build pipeline noted for Lit/TS client bundles                     | Added `bun build` to §16 milestone 1       |
| 5   | No image serve route for uploaded files                               | Added dynamic route note to §14            |
| 6   | `code-fast-1` is a text model, not vision-capable                     | Replaced with `grok-2-vision-1212` in §7   |
| 7   | `SearchQueryLog` was "optional but recommended" — not actionable      | Confirmed in-scope in §8                   |
| 8   | No `config/` directory for code-free prompt profile edits             | Added `/config/profiles.json` to §14       |

---

## Task List

Tasks are grouped by milestone. Each is atomic: it can be branched, implemented, reviewed, and tested independently. Dependencies are noted where they exist.

---

### Milestone 1 — Foundation

#### TASK-01: Initialize Bun project skeleton

**Depends on:** nothing  
**Deliverables:** `package.json`, `tsconfig.json`, `bunfig.toml`, `.env.example`, `.gitignore`  
**Acceptance Criteria:**

- `bun install` completes cleanly with no Node assumptions
- `bun run dev` starts the server (even if it only returns 200 on `/`)
- `.env.example` documents all required env vars
- `.gitignore` excludes `node_modules/`, `uploads/`, `public/`, `.env`

**Unit Tests:** None (infrastructure only)  
**Manual Test:**

1. `open_browser_page` → `http://localhost:3000`
2. `read_page` to confirm a response (even empty)

---

#### TASK-02: Bun server with static file serving and basic routes

**Depends on:** TASK-01  
**Deliverables:** `src/server/index.ts`, routes: `GET /`, `GET /upload`, `GET /search`, `GET /images/:id`  
**Acceptance Criteria:**

- Static HTML pages served from `src/pages/`
- Uploaded images served from `/images/:id` route (from `uploads/`)
- Unknown routes return 404

**Unit Tests:** Route resolution logic  
**Manual Test:**

1. `open_browser_page` → each route
2. `read_page` to confirm correct page title/content

---

#### TASK-03: Design token CSS (colors, spacing, typography, radius, shadow)

**Depends on:** TASK-01  
**Deliverables:** `src/styles/tokens.css`  
**Acceptance Criteria:**

- All CSS custom properties defined under `:root`
- Light and dark palettes defined with `prefers-color-scheme` media query
- Tokens cover: `--color-surface`, `--color-text`, `--color-accent`, `--color-border`, `--color-success`, `--color-warning`, `--spacing-*`, `--radius-*`, `--text-*`, `--shadow-*`

**Unit Tests:** None (visual only)  
**Manual Test:**

1. `open_browser_page` → a test page that renders all token swatches
2. `screenshot_page` to capture light mode
3. Toggle OS dark mode (or use devtools); `screenshot_page` again for dark mode

---

#### TASK-04: Grid layout system CSS (mobile-first, responsive breakpoints)

**Depends on:** TASK-03  
**Deliverables:** `src/styles/grid.css`  
**Acceptance Criteria:**

- `.grid` base class: single column mobile
- `.grid--2col` at `sm` (480px), `.grid--3col` at `md` (768px), `.grid--4col` at `lg` (1024px)
- Gutter uses spacing token
- Test page renders visible grid at each breakpoint

**Unit Tests:** None (visual only)  
**Manual Test:**

1. `open_browser_page` → grid test page
2. `screenshot_page` at mobile viewport, `screenshot_page` at desktop viewport

---

#### TASK-05: Light/dark mode toggle with localStorage persistence

**Depends on:** TASK-03  
**Deliverables:** `src/pages/theme-toggle.ts`, theme attribute on `<html>` element  
**Acceptance Criteria:**

- Toggle button switches between light and dark
- Choice persists across page reload via `localStorage`
- OS preference is respected as default if no stored preference

**Unit Tests:** Toggle state, localStorage read/write logic  
**Manual Test:**

1. `open_browser_page` → any page
2. `click_element` on toggle → `screenshot_page`
3. `navigate_page` (reload) → `read_page` to confirm preference persisted

---

#### TASK-06: `bun build` pipeline for client-side Lit/TS bundles

**Depends on:** TASK-01  
**Deliverables:** build script in `package.json`, output to `public/`  
**Acceptance Criteria:**

- `bun run build` compiles all `src/pages/*.ts` entry points with decorators support
- Output JS is importable in `<script type="module">` in HTML pages
- TypeScript errors fail the build

**Unit Tests:** None (build tooling)  
**Manual Test:**

1. Run `bun run build`
2. `open_browser_page` → any page; `read_page` to confirm no console errors

---

### Milestone 2 — Ingestion

#### TASK-07: In-memory JSON store (Photo + Tag + PhotoTag + SearchQueryLog)

**Depends on:** TASK-01  
**Deliverables:** `src/data/store.ts`  
**Acceptance Criteria:**

- Singleton in-memory store with typed arrays for all four entities
- Persist to `uploads/data.json` on write; load on server startup if file exists
- CRUD operations exposed as plain functions (not a class if not needed)

**Unit Tests:** add photo, add tag, link PhotoTag, query by photoId, query by tag  
**Manual Test:** N/A (no UI yet — unit tests sufficient)

---

#### TASK-08: File upload API endpoint

**Depends on:** TASK-07  
**Deliverables:** `POST /api/photos` multipart handler  
**Acceptance Criteria:**

- Accepts `multipart/form-data` with `files[]` field
- Validates MIME type (JPEG and PNG only), rejects others with 400
- Enforces max file size (configurable via env, default 10 MB)
- Saves file to `uploads/` with a UUID filename
- Creates `Photo` record in store; returns array of created photo IDs
- Does not expose filesystem paths in response

**Unit Tests:** MIME validation, size limit, photo record creation  
**Manual Test:**

1. `open_browser_page` → upload page
2. Use file picker; `click_element` submit
3. `read_page` to confirm photo IDs in response

---

#### TASK-09: `photo-uploader` Lit component

**Depends on:** TASK-06, TASK-08  
**Deliverables:** `src/components/photo-uploader.ts`  
**Acceptance Criteria:**

- Renders file picker with `multiple` and `accept="image/jpeg,image/png"`
- Renders camera capture button (`capture="environment"`) on supported devices
- Shows selected file count before submit
- Dispatches `photos-uploaded` custom event with photo IDs on success
- Shows per-upload progress indicator

**Unit Tests:** file count display, custom event dispatch  
**Manual Test:**

1. `open_browser_page` → upload page
2. `click_element` on file picker, select 3 images
3. `read_page` to confirm file count shown
4. Submit; `read_page` to confirm success state

---

#### TASK-10: `photo-grid` Lit component

**Depends on:** TASK-06, TASK-02  
**Deliverables:** `src/components/photo-grid.ts`  
**Acceptance Criteria:**

- Accepts `photos` property (array of `{ id, src, status }`)
- Renders thumbnails in the CSS grid
- Shows per-photo status badge (`queued`, `analyzing`, `needs-review`, `ready`, `error`)
- Lazy-loads images with `loading="lazy"`
- Clicking a photo emits `photo-selected` event with photo ID

**Unit Tests:** renders correct count, status badge rendering  
**Manual Test:**

1. `open_browser_page` → gallery/index page after uploading photos
2. `read_page` to confirm thumbnails rendered
3. `click_element` a photo; `read_page` to confirm event triggered

---

### Milestone 3 — Tagging

#### TASK-11: AI provider abstraction

**Depends on:** TASK-01  
**Deliverables:** `src/ai/provider.ts` (interface), `src/ai/config.ts` (env-driven factory)  
**Acceptance Criteria:**

- `AIProvider` interface defines `tagImage(base64: string, profile: string): Promise<TagResult[]>`
- `TagResult` type: `{ tag: string, confidence: number }`
- Provider loaded from env: `AI_PROVIDER_URL`, `AI_API_KEY`, `AI_MODEL`
- No provider secrets passed to client-side code

**Unit Tests:** factory creates correct provider type from env, TagResult normalization  
**Manual Test:** N/A (no UI — unit tests sufficient)

---

#### TASK-12: Grok vision provider adapter

**Depends on:** TASK-11  
**Deliverables:** `src/ai/providers/grok.ts`  
**Acceptance Criteria:**

- Implements `AIProvider` using xAI API with `grok-2-vision-1212`
- Sends image as base64 data URL in the message content
- Parses response into `TagResult[]`
- Handles 429/5xx with retry (up to 3 attempts, exponential backoff)
- Timeouts after configurable period (default 30s)

**Unit Tests:** request format, response parsing, retry logic (mock fetch)  
**Manual Test:** N/A (unit + integration via TASK-14)

---

#### TASK-13: Prompt profiles config and loader

**Depends on:** TASK-01  
**Deliverables:** `config/profiles.json`, `src/ai/profiles.ts`  
**Acceptance Criteria:**

- `profiles.json` contains at least `people`, `vehicles`, `animals`, `general` entries
- Each entry has a `systemPrompt` string
- Active profile read from `AI_PROFILE` env var; fallback to `general`
- File editable without code changes; no hot-reload required for POC

**Unit Tests:** profile loader reads correct entry, fallback to `general`  
**Manual Test:** N/A

---

#### TASK-14: Tagging pipeline and queue

**Depends on:** TASK-07, TASK-12, TASK-13  
**Deliverables:** `src/ai/tagging.ts`, `POST /api/photos/:id/tag`  
**Acceptance Criteria:**

- Sets photo status to `analyzing` immediately
- Calls provider with photo base64 + active profile system prompt
- Stores returned tags as `PhotoTag` records with `source: "ai"`, `approved: false`
- Sets photo status to `needs-review` on success, `error` on failure
- Re-tagging an already-tagged photo replaces existing AI tags

**Unit Tests:** status transitions, tag storage, error state  
**Manual Test:**

1. Upload a photo (TASK-09)
2. `open_browser_page` → photo detail or gallery
3. `read_page` to confirm status shows `analyzing` then `needs-review`

---

#### TASK-15: `tag-chip-list` Lit component

**Depends on:** TASK-06  
**Deliverables:** `src/components/tag-chip-list.ts`  
**Acceptance Criteria:**

- Renders an array of tag strings as dismissible chips
- Emits `tag-removed` event with tag value when chip dismissed
- Supports read-only mode (no dismiss button)
- Minimum 44×44px touch target per chip

**Unit Tests:** chip count, tag-removed event, read-only mode  
**Manual Test:**

1. `open_browser_page` → component test page
2. `click_element` dismiss on a chip; `read_page` to confirm chip removed

---

#### TASK-16: `tag-review-sheet` Lit component

**Depends on:** TASK-15  
**Deliverables:** `src/components/tag-review-sheet.ts`  
**Acceptance Criteria:**

- Displays AI-suggested tags via `tag-chip-list` (dismissible)
- "Accept All" button approves all remaining tags
- Free-form text input adds a new tag on Enter or button press
- Tag autocomplete suggests from existing tag vocabulary (passed as property)
- Emits `tags-approved` event with final tag array

**Unit Tests:** accept all, add free-form tag, remove a tag  
**Manual Test:**

1. `open_browser_page` → review page for a tagged photo
2. `click_element` to remove one tag
3. `type_in_page` to add a free-form tag
4. `click_element` "Accept All"; `read_page` to confirm `tags-approved` fired

---

#### TASK-17: Tag approval API endpoint

**Depends on:** TASK-07, TASK-16  
**Deliverables:** `POST /api/photos/:id/approve`  
**Acceptance Criteria:**

- Accepts `{ tags: string[] }` body
- Sets `PhotoTag.approved = true` for matched tags
- Creates new `PhotoTag` records for any user-added tags (with `source: "user"`)
- Sets photo status to `ready`
- Returns updated photo record

**Unit Tests:** approved flag, user tag creation, status transition  
**Manual Test:**

1. Submit approval from `tag-review-sheet`
2. `navigate_page` → gallery; `read_page` to confirm photo status is `ready`

---

### Milestone 4 — Search

#### TASK-18: Tag search API

**Depends on:** TASK-07  
**Deliverables:** `GET /api/search?tags=dog,beach&mode=AND`  
**Acceptance Criteria:**

- `tags` param: comma-separated list
- `mode`: `AND` (default) or `OR`
- Only returns photos where all/any tags are approved
- Sorted by `uploadedAt` descending
- Returns `{ photos: Photo[], matchedTags: string[] }`

**Unit Tests:** AND mode, OR mode, no-match returns empty array  
**Manual Test:** N/A (unit tests sufficient; UI exercised in TASK-21)

---

#### TASK-19: Local fuzzy tag matching

**Depends on:** TASK-07  
**Deliverables:** `src/ai/fuzzy.ts`  
**Acceptance Criteria:**

- Pure function: `fuzzyMatch(query: string, vocabulary: string[]): { tag: string, score: number }[]`
- Uses substring/edit-distance scoring (no external library required for POC)
- Returns candidate tags sorted by descending score
- Returns empty array when vocabulary is empty

**Unit Tests:** exact match, partial match, no match, case-insensitivity  
**Manual Test:** N/A

---

#### TASK-20: AI-assisted query expansion with caching

**Depends on:** TASK-11, TASK-19  
**Deliverables:** `src/ai/queryExpand.ts`, `GET /api/search/expand?q=...`  
**Acceptance Criteria:**

- Calls AI only when local fuzzy score falls below threshold (configurable, default 0.6)
- AI prompt asks for related tags from the provided vocabulary
- Result cached in `SearchQueryLog` by normalized query string
- Cache hit skips AI call
- Returns `{ tags: string[], source: "local"|"ai", cached: boolean }`

**Unit Tests:** cache hit skips AI, low-score triggers AI, result normalization  
**Manual Test:** N/A (exercised in TASK-21)

---

#### TASK-21: `search-bar` Lit component and search results page

**Depends on:** TASK-06, TASK-18, TASK-19, TASK-20  
**Deliverables:** `src/components/search-bar.ts`, `src/pages/search.ts`  
**Acceptance Criteria:**

- Renders text input with submit
- Shows tag chip suggestions from vocabulary as user types
- Submits query and displays results in `photo-grid`
- Shows "Matched tags: ..." explanation line
- Shows "No results" state when applicable

**Unit Tests:** suggestion filtering, empty state  
**Manual Test:**

1. `open_browser_page` → `/search`
2. `type_in_page` a natural language query (e.g. "dogs at the beach")
3. `read_page` to confirm matched tags explanation shown
4. `read_page` to confirm photo grid populated
5. `screenshot_page` for evidence

---

### Milestone 5 — Hardening

#### TASK-22: Per-photo status state machine and UI feedback

**Depends on:** TASK-10, TASK-14  
**Deliverables:** `src/data/photoStatus.ts`, status badge in `photo-grid`  
**Acceptance Criteria:**

- Valid transitions: `queued → analyzing → needs-review → ready` and any state `→ error`
- Invalid transitions throw or are silently ignored (no corrupt state)
- Badge color uses design tokens (not color-only: adds icon or label)

**Unit Tests:** all valid transitions, invalid transition guard  
**Manual Test:**

1. Upload photos; `open_browser_page` → gallery
2. `read_page` to confirm status badges cycle correctly through states

---

#### TASK-23: File upload security hardening

**Depends on:** TASK-08  
**Deliverables:** Updated `POST /api/photos` handler  
**Acceptance Criteria:**

- Validates magic bytes (not just MIME type header) to confirm JPEG/PNG
- Strips EXIF metadata from stored images
- Enforces per-request max file count (default 20)
- Returns descriptive 400 errors without leaking filesystem paths

**Unit Tests:** magic byte validation, EXIF stripping, count limit  
**Manual Test:**

1. Upload a file with `.png` extension but wrong content; `read_page` to confirm 400 error

---

#### TASK-24: Retry logic and error state recovery

**Depends on:** TASK-12, TASK-14  
**Deliverables:** Updated Grok provider and tagging pipeline  
**Acceptance Criteria:**

- Transient errors (429, 503) retried up to 3 times with exponential backoff
- Permanent errors (400, 401) not retried; status set to `error` immediately
- User can trigger manual re-tag from gallery (`photo-grid`)

**Unit Tests:** retry count, backoff timing (fake timers), non-retryable error fast-fail  
**Manual Test:**

1. Simulate error via env/config
2. `open_browser_page` → gallery; `read_page` to confirm `error` badge shown
3. `click_element` re-tag button; `read_page` to confirm retry initiated

---

#### TASK-25: Responsive layout and mobile ergonomics audit

**Depends on:** TASK-04, TASK-09, TASK-10, TASK-21  
**Deliverables:** CSS fixes in `src/styles/`  
**Acceptance Criteria:**

- All touch targets meet 44×44px minimum
- Grid layout is verified at 375px, 768px, and 1280px widths
- Focus styles visible in both themes
- No horizontal scroll on mobile

**Unit Tests:** None (visual)  
**Manual Test:**

1. `open_browser_page` → each page at mobile viewport
2. `screenshot_page` for each at 375px and 768px
3. Verify no overflow, all controls reachable

---

#### TASK-26: Theme toggle persistence end-to-end test

**Depends on:** TASK-05  
**Deliverables:** No new code — verification task  
**Acceptance Criteria:**

- Theme toggle works on all pages
- Preference survives full reload and navigation between pages

**Unit Tests:** covered by TASK-05  
**Manual Test:**

1. `open_browser_page` → index; toggle to dark; `screenshot_page`
2. `navigate_page` to search; `read_page` confirm dark mode persisted
3. Reload; `read_page` confirm still dark

---

## Summary Table

| Task    | Milestone  | Depends On     | Has Unit Tests | Has Browser Test |
| ------- | ---------- | -------------- | -------------- | ---------------- |
| TASK-01 | Foundation | —              | —              | yes              |
| TASK-02 | Foundation | 01             | yes            | yes              |
| TASK-03 | Foundation | 01             | —              | yes              |
| TASK-04 | Foundation | 03             | —              | yes              |
| TASK-05 | Foundation | 03             | yes            | yes              |
| TASK-06 | Foundation | 01             | —              | yes              |
| TASK-07 | Ingestion  | 01             | yes            | —                |
| TASK-08 | Ingestion  | 07             | yes            | yes              |
| TASK-09 | Ingestion  | 06, 08         | yes            | yes              |
| TASK-10 | Ingestion  | 06, 02         | yes            | yes              |
| TASK-11 | Tagging    | 01             | yes            | —                |
| TASK-12 | Tagging    | 11             | yes            | —                |
| TASK-13 | Tagging    | 01             | yes            | —                |
| TASK-14 | Tagging    | 07, 12, 13     | yes            | yes              |
| TASK-15 | Tagging    | 06             | yes            | yes              |
| TASK-16 | Tagging    | 15             | yes            | yes              |
| TASK-17 | Tagging    | 07, 16         | yes            | yes              |
| TASK-18 | Search     | 07             | yes            | —                |
| TASK-19 | Search     | 07             | yes            | —                |
| TASK-20 | Search     | 11, 19         | yes            | —                |
| TASK-21 | Search     | 06, 18, 19, 20 | yes            | yes              |
| TASK-22 | Hardening  | 10, 14         | yes            | yes              |
| TASK-23 | Hardening  | 08             | yes            | yes              |
| TASK-24 | Hardening  | 12, 14         | yes            | yes              |
| TASK-25 | Hardening  | 04, 09, 10, 21 | —              | yes              |
| TASK-26 | Hardening  | 05             | —              | yes              |
