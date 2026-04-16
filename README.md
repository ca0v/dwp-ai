# AI Photo Search POC Requirements

## 1. Purpose

Build a mobile-first proof-of-concept that feels like "iPhone Photos search" for a focused domain of photo content. Users should be able to take/upload photos in bulk, auto-generate tags with AI, approve/edit tags quickly, and search photos by tags or natural language.

This document defines product requirements, technical constraints, and delivery criteria.

## 2. Core Goals

1. Bulk photo upload from mobile and desktop.
2. AI-assisted tag extraction from each photo.
3. Fast search by explicit tags.
4. Fuzzy search by plain text, mapped to existing tags using AI.
5. OpenAI-compatible provider support, with initial integration to Grok (xAI) using a vision-capable model.
6. UX optimized for: take picture -> submit -> review suggested tags -> approve.

## 3. Tech Stack and Constraints

- Runtime/server: Bun only (`bun`), no Node.js runtime assumptions, no npm tooling.
- Language: TypeScript.
- UI: Standard HTML pages + Lit-based Web Components.
- Styling: Vanilla CSS only.
- Layout system: Grid-based design system.
- Responsive strategy: Mobile-first.
- Theming: Light mode + dark mode.
- Version control workflow: Optimized for Git worktrees.

## 4. Product Scope

### In Scope

- Photo ingestion (multi-file upload, camera capture where available).
- AI tag generation and confidence scoring.
- Manual tag approval/edit flow.
- Photo search by:
  - Tag exact/contains matches.
  - Plain text fuzzy intent mapped to available tags.
- Prompt conditioning by subject-area profiles (for example: people-only, vehicles-only, animals-only).

### Out of Scope (POC)

- Face recognition identity matching.
- Video support.
- Native mobile apps.
- Full user auth/roles (single-user or lightweight auth acceptable).
- Production-scale distributed storage.

## 5. User Experience Requirements

### 5.1 Primary Mobile Journey

1. User opens app on phone.
2. User takes photos or selects multiple existing photos.
3. User submits photos.
4. System asynchronously analyzes images and suggests tags.
5. User reviews tags in a fast approval UI:
   - Accept all
   - Remove incorrect tags
   - Add custom free-form tags
   - Choose from existing common tags
6. Photos become searchable immediately after approval.

### 5.2 Search Journeys

- Tag Search:
  - User selects existing tags and filters results.
- Text Search:
  - User enters plain English query (for example: "dogs by the beach" or "red cars at night").
  - AI maps intent to existing tags and returns fuzzy matches with relevance ordering.

### 5.3 UX Characteristics

- Mobile-first controls with thumb-friendly touch targets.
- Minimal friction for tag approval (1-2 taps for common paths).
- Search interactions should feel near-instant for small/medium POC dataset.
- "iPhone Photos-like" expectations interpreted as:
  - Clean, content-first gallery.
  - Prominent search entry point.
  - Simple chips/tokens for tags.
  - Subtle, not overloaded controls.

## 6. Functional Requirements

### 6.1 Upload and Ingestion

- Support bulk upload via file picker (`multiple`).
- Support camera capture on mobile when browser/device allows.
- Validate supported formats (initially JPEG and PNG only).
- Persist original file metadata (filename, timestamp, size, mime type).

### 6.2 AI Tagging

- For each uploaded image, call an AI vision-capable endpoint.
- Store returned tags with:
  - normalized tag text
  - confidence score
  - model/provider metadata
  - timestamp
- Provide configurable confidence threshold defaults.
- Allow per-photo re-run tagging.

### 6.3 Tag Approval and Editing

- Pre-approval state required before final indexing.
- UI must allow:
  - accept suggested tags
  - reject suggested tags
  - add free-form tags
  - pick from suggested existing tags
- Track approval audit fields (`approvedAt`, `editedBy` optional for single-user POC).

### 6.4 Search by Tags

- Query photos by one or more tags.
- Support AND/OR filter mode.
- Return results sorted by recency by default (configurable).

### 6.5 Search by Plain Text (Fuzzy)

- Accept natural language query.
- System uses an efficient hybrid approach:
  - first pass: local fuzzy match over in-memory tag vocabulary
  - second pass: AI-assisted expansion only when local confidence is low or no strong match is found
  - cache AI-expanded terms for repeated queries
- Execute fuzzy matching over stored tags and return ranked results.
- Return lightweight explanation metadata (for example: "Matched tags: dog, beach, sunset").

### 6.6 Prompt Conditioning / Subject Profiles

- System must support starter prompt profiles to constrain tagging domain.
- Initial examples:
  - `people`
  - `vehicles`
  - `animals`
  - `general`
- Profile behavior:
  - Prioritize tags inside profile domain.
  - Avoid labeling outside configured area of interest.
  - Allow explicit fallback tag like `other` when uncertain.
- Admin/dev can edit profile prompts without code changes (config file or datastore entry).

## 7. AI Provider Requirements

- Implement provider abstraction against OpenAI-compatible API schema.
- Initial provider: Grok (xAI) endpoint using user-supplied API key.
- Model for vision tagging: `grok-2-vision-1212` or equivalent multimodal model (must support image input).
- `code-fast-1` is a text/code model and must NOT be used for the vision tagging pipeline.
- Confirm current xAI model availability at integration time.
- Provider layer must encapsulate:
  - base URL
  - auth headers
  - model selection
  - timeout/retry policy
  - response normalization
- Future providers should be pluggable with minimal app-layer changes.

## 8. Information Architecture and Data Model (POC)

Minimum entities:

- `Photo`
  - `id`, `path|blobRef`, `createdAt`, `uploadedAt`, `metadata`
- `Tag`
  - `id`, `valueNormalized`, `displayValue`, `createdAt`
- `PhotoTag`
  - `photoId`, `tagId`, `source(ai|user)`, `confidence`, `approved`
- `SearchQueryLog`
  - `queryText`, `resolvedTags`, `resultCount`, `createdAt`

Storage choice for this POC is JSON metadata loaded entirely in memory at runtime, with clear interfaces for replacement later.
All four entities above are included in the POC; `SearchQueryLog` provides the basis for fuzzy query caching.

## 9. Front-End Architecture Requirements

- Use standard multi-page HTML entry points (no SPA framework requirement).
- Encapsulate reusable UI in Lit components, for example:
  - `photo-uploader`
  - `tag-review-sheet`
  - `tag-chip-list`
  - `photo-grid`
  - `search-bar`
- Keep pages progressively enhanced and functional with minimal JS failure states.

## 10. Design System Requirements

### 10.1 Layout and Spacing

- Grid-based system with consistent columns/gutters.
- Mobile baseline first, then tablet/desktop expansions.
- Suggested breakpoints (can be tuned):
  - `sm`: >= 480px
  - `md`: >= 768px
  - `lg`: >= 1024px

### 10.2 Visual Tokens (CSS Variables)

Define design tokens in vanilla CSS for:

- colors (surface, text, accent, border, success, warning)
- spacing scale
- radius scale
- typography scale
- elevation/shadow

### 10.3 Light/Dark Mode

- Support `prefers-color-scheme` by default.
- Provide manual theme toggle override persisted in local storage.
- Ensure accessible contrast in both themes.

### 10.4 Accessibility and Mobile Ergonomics

- Minimum 44x44px touch targets.
- Semantic HTML with labels and keyboard support.
- Visible focus styles.
- Non-color-only status signaling.

## 11. Performance and Reliability Requirements

- Optimize image preview generation and lazy loading.
- Avoid blocking UI while AI analysis is running.
- Show per-photo status (`queued`, `analyzing`, `needs-review`, `ready`, `error`).
- Retries for transient provider/API failures.
- Basic offline-tolerant UX messaging (even if full offline mode is not implemented).

## 12. Security and Secrets

- Do not hardcode API keys.
- Use environment variables and `.env` strategy compatible with Bun.
- Do not expose provider secrets to client-side code.
- Validate uploaded files and enforce size/type limits.

## 13. Git Worktree Optimization Requirements

- Repository structure must be branch/worktree friendly.
- Keep generated/runtime artifacts out of source control.
- Maintain deterministic scripts and minimal machine-specific config.
- Suggested conventions:
  - `scripts/` for reproducible tasks.
  - `.env.example` committed, local `.env` ignored.
  - `docs/adr/` for architecture decisions when branching experiments.
  - Feature branches for isolated POC experiments (ingestion, tagging, search, UI).

## 14. Proposed Project Structure

```txt
/
  README.md
  bunfig.toml
  package.json            # Bun-compatible metadata and scripts
  tsconfig.json
  .env.example
  .gitignore
  /src
    /components           # Lit web components
    /pages                # HTML page entry-specific TS/CSS
    /styles               # Design tokens, grid, theme files
    /server               # Bun server routes/services and static image route
    /ai                   # Provider abstraction + prompt profiles
    /data                 # In-memory JSON store, models, and repositories
  /config
    profiles.json         # Editable prompt profiles (people, vehicles, animals, general)
  /tests                  # Vitest unit tests
  /uploads                # Runtime image storage (gitignored)
  /public                 # Static compiled assets (gitignored)
  /docs
    /adr
  .github/
    copilot-instructions.md
    /skills
    /prompts
      task.prompt.md
```

## 15. Non-Functional Acceptance Criteria (POC)

1. User can upload at least 20 photos in one action.
2. Tagging pipeline completes for uploaded photos with clear status visibility.
3. User can approve/edit generated tags on mobile in under 3 taps for common path.
4. Tag search returns correct matches from approved tags.
5. Plain-text search returns relevant ranked results using AI-assisted fuzzy mapping.
6. Theme switch works and persists; responsive layout works on phone and desktop.
7. AI provider can be switched via config without rewriting core feature logic.

## 16. Suggested Milestones

1. Foundation: Bun server, TS config, `bun build` pipeline for client-side Lit/TS, basic pages, design tokens/grid.
2. Ingestion: bulk upload + in-memory JSON store + dynamic image serve route + gallery rendering.
3. Tagging: AI provider abstraction + Grok vision model integration + prompt profiles + review workflow.
4. Search: tag filtering + natural language fuzzy mapping + `SearchQueryLog` caching.
5. Hardening: theme polish, responsiveness, retries, UX tuning, skill docs.

## 17. Decisions Confirmed

1. Storage model: JSON metadata for tags associated to image files, loaded fully in memory for this POC.
2. Input formats: no HEIC support initially; prioritize common web sample inputs.
3. Plain-text fuzzy search strategy: efficient hybrid flow, local fuzzy matching first and AI expansion only when needed, with caching.
4. Prompt profile scope: globally configured product tone for a defined class of photos.

## 18. Environment and Agentic Development Experience

### 18.1 Manual Testing with VS Code Copilot Browser Tools

- Manual UI testing must use VS Code Copilot browser capabilities, with emphasis on `open_browser_page` for launching and validating flows.
- Use `open_browser_page` for initial page load and additional tabs/pages when testing alternate paths in parallel.
- Use `read_page` to verify page state and actionable elements.
- Use `click_element`, `type_in_page`, and `navigate_page` for interaction-driven test flows.
- Use `screenshot_page` to capture evidence for regressions and release notes.
- Track manual test scenarios and outcomes in test notes per feature.

### 18.2 Skills Baseline and Continuous Learning

- Maintain technology skill files under `.github/skills/` for:
  - Bun runtime and server patterns
  - TypeScript standards
  - Lit web components
  - Vanilla CSS grid design system
  - Vitest unit testing
  - OpenAI-compatible provider integration
- After every successful task implementation, update the relevant skill file(s) with:
  - what worked
  - pitfalls encountered
  - repeatable pattern to reuse

### 18.3 Unit Testing Standard

- Unit tests must use Vitest.
- Keep unit tests close to source modules or in a clear parallel test structure.
- Every feature/bug task should include or update unit tests where behavior changes.

### 18.4 Public Photo Libraries for Manual Testing

Use publicly available photo datasets/libraries to validate ingestion, tagging quality, and search relevance:

- Unsplash: broad high-quality photography corpus.
- Pexels: free stock photos across common categories.
- Pixabay: mixed content (photos, vectors, illustrations).
- Wikimedia Commons: broad, real-world and historical image coverage.
- Google Open Images Dataset: large-scale labeled image set for diverse categories.
- COCO Dataset (Common Objects in Context): strong for object/category validation.

Always verify current license and attribution terms before bundling any sample set.

### 18.5 Prompting Workflow for Tasks

- Add a reusable `task` prompt template for introducing feature requests and bug reports.
- The prompt must capture context, constraints, acceptance criteria, testing plan, and documentation updates.

### 18.6 Copilot Agent Orientation

- Add `.github/copilot-instructions.md` to orient the coding agent around product goals, architecture constraints, and delivery standards.
- This path is the standard VS Code Copilot auto-load location.
- Agent instructions must reinforce:
  - no scaffolding unless explicitly requested
  - mobile-first UX priorities
  - requirement to update skills after successful implementations
  - requirement to run/update tests for behavior changes

## 19. Deployment: Render (Temporary Demo)

Use Render Web Service for a fast temporary demo with server-side secrets and persistent uploads.

### 19.1 Why Render Fits This App

- This project is a Bun server process (not static-only).
- API keys stay server-side in environment variables.
- Uploaded image files can be persisted with a mounted disk.

### 19.2 Required Environment Variables

- `AI_PROVIDER_URL`
- `AI_API_KEY`
- `AI_MODEL` (default example: `grok-2-vision-1212`)
- `AI_PROFILE` (default example: `general`)
- `AI_TIMEOUT_MS` (default example: `30000`)
- `UPLOADS_DIR` (Render disk-backed path: `/var/data/uploads`)

`PORT` is provided by Render automatically. The server already reads `process.env.PORT`.

### 19.3 Render Setup (Dashboard)

1. Create a new **Web Service** from this repository.
2. Configure build command:

  ```bash
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun install
  bun run build
  ```

3. Configure start command:

  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun run src/server/index.ts
  ```

4. Add the required environment variables listed above.
5. Attach a persistent disk mounted at `/var/data`.
6. Set `UPLOADS_DIR=/var/data/uploads`.

### 19.4 Render Blueprint (Infrastructure as Code)

A ready-to-use blueprint is included in `render.yaml`.

### 19.5 Post-Deploy Smoke Test

1. Open `/upload` and upload multiple JPEG/PNG images.
2. Confirm photos appear in gallery/search flows.
3. Run tag and plain-text search.
4. Restart the service.
5. Verify uploaded images still load (persistence check).

### 19.6 Teardown Checklist (Temporary Demo)

1. Delete the Render service when demo ends.
2. Rotate or revoke the demo `AI_API_KEY`.
3. Remove unused persistent disk resources.
