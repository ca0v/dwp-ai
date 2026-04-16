# Task: Deploy AI Photo Search POC to Render

## Task Type

Feature Request

## Summary

Create and execute a deployment path for this Bun-based AI Photo Search POC on Render so stakeholders can access a temporary public demo URL. The deployment must keep AI credentials server-side, preserve uploaded images, and validate the full user flow (upload, review, search) on mobile and desktop.

## Background and Context

- This app runs as a Bun server process that serves HTML pages, API routes, and uploaded images from one service.
- For a temporary demo, we need a low-friction host with secure environment variables and persistent storage.
- Current behavior is local-only at `localhost:3000`; desired behavior is a public Render URL with the same core flow.

## Requirements and Constraints

- Product and UX requirements:
  - Keep the existing mobile-first upload -> tag -> review -> search experience intact.
  - Demo URL should be shareable and stable for review sessions.
- Technical constraints:
  - Bun-first runtime and commands.
  - TypeScript app, standard HTML pages, Lit components, vanilla CSS.
  - No unnecessary architecture changes for this deployment task.
- Data and AI constraints:
  - API key must remain server-side only.
  - Use environment-driven AI provider config (`AI_PROVIDER_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_PROFILE`, `AI_TIMEOUT_MS`).
  - Respect configured prompt profile/domain behavior.

## Acceptance Criteria

1. A Render Web Service is configured and deployed from this repository.
2. Service starts successfully with Bun and binds to Render-provided `PORT`.
3. Required AI environment variables are set in Render and AI calls succeed without exposing secrets in client code.
4. Upload, tag review, and search flows work from the public URL.
5. Uploaded images persist across service restart using Render persistent disk (or an approved external image host fallback).
6. Deployment and rollback/teardown steps are documented for temporary-demo usage.

## Implementation Notes (Optional)

- Files/components likely impacted:
  - `README.md` (deployment instructions)
  - optional Render service blueprint file if team chooses infra-as-code
- API/data considerations:
  - Server already supports `PORT` env var.
  - Upload files are written to local uploads storage and should be mapped to persistent disk.
- Risks and edge cases:
  - Free-tier idle spin-down may cause first-request delay.
  - Missing env vars will break AI tagging/query expansion.
  - Disk misconfiguration can cause uploads to disappear after restart.

## Testing Plan

- Unit tests to add/update (Vitest):
  - No code behavior change required for host selection alone.
  - If any deployment-related code changes are made, add focused tests and run full suite.
- Verification commands:
  - `bun run lint`
  - `bun test`
- Manual testing flow using Copilot browser tools:
  - Open deployed pages with `open_browser_page`.
  - Use `click_element`, `type_in_page`, `navigate_page` to run:
    1. upload multiple JPEG/PNG images
    2. tag generation/review
    3. tag search and text search
  - Use `read_page` to confirm UI and result state.
  - Use `screenshot_page` to capture evidence for key steps.
- Persistence validation:
  - Upload at least one image.
  - Restart the Render service.
  - Confirm image still loads and appears in results.

## Documentation Updates Required

- Update `README.md` with a Render deployment section including:
  - required environment variables
  - build/start commands
  - persistent disk setup note
  - temporary demo teardown checklist
- Update relevant skill docs in `docs/skills/` with deployment learnings after successful rollout.

## Definition of Done

1. Acceptance criteria are met in deployed environment.
2. Vitest coverage is updated if any behavior changes were introduced.
3. Manual testing is executed and evidence captured.
4. Deployment learnings are documented in `README.md` and relevant skill files.

## Proposed Execution Checklist

1. Create Render Web Service from the repo.
2. Configure commands:
   - Build: `bun install && bun run build`
   - Start: `bun run src/server/index.ts`
3. Add required environment variables in Render.
4. Attach persistent disk for uploads.
5. Deploy and run manual smoke tests.
6. Restart service and verify upload persistence.
7. Record URL, test evidence, and teardown notes.
