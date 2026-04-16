# Browser Testing Skill Baseline

## Test Assets
Real photos for upload testing are kept in `tests/pics/`. Use them with curl for reliable upload testing (shadow DOM file input injection is unreliable in Playwright):

```bash
curl -F "files[]=@tests/pics/20260317_144007.jpg;type=image/jpeg" http://localhost:3000/api/photos
```

- `20260317_144007.jpg` — outdoor playground, two children on exercise equipment, daytime, trees in background.
- AI-generated images (see `scripts/generate-test-pics.ts`) include: a golden retriever in a park, a mountain landscape at sunset, a city skyline at night, and a tabby cat indoors.

## Baseline

- Use VS Code Copilot browser tools (`open_browser_page`, `navigate_page`, `read_page`, `screenshot_page`, `click_element`, `type_in_page`) for agentic manual testing.
- Validate all pages: load, interact, screenshot to confirm expected state.
- Test dark/light mode, search flow, upload, review, and mobile viewport.

## Patterns

- Use `open_browser_page` once per host; reuse the `pageId` for subsequent interactions.
- Use `read_page` (snapshot) to get element refs and current state — faster than screenshot and includes aria roles and refs.
- Use `screenshot_page` to capture visual evidence after key state changes.
- Use `navigate_page` with `type: "reload"` to pick up server-side data changes without re-opening.
- For mobile viewport testing, use `run_playwright_code` with `page.setViewportSize({ width: 375, height: 812 })`.
- When a Playwright code block fails with `[object Object]`, it means an error was thrown — inspect the operation more carefully (shadow DOM issues, missing element, etc.).

## Learning Log

- Use `curl -F "files[]=@tests/pics/<filename>;type=image/jpeg"` for reliable upload testing instead of Playwright shadow DOM injection.
- Seed the store with multiple photos to test gallery grid layout and search across multiple results.
- **Shadow DOM reads:** `page.evaluate()` with `el.shadowRoot.querySelectorAll()` works for reading shadow DOM content, but `run_playwright_code` doesn't return `console.log` output — use return values instead.
- **Lit dev mode warning** (`Lit is in dev mode`) appears in browser events — this is benign; expected in development builds.
- **After server restart:** Use `navigate_page` with `type: "reload"` to refresh the page and pick up new server state.
- **ERR_ABORTED on POST + navigate:** When `window.location.href = "/"` fires immediately after a fetch resolves, the browser may abort reading the response. This logs ERR_ABORTED but the server still processed the request.
- **Triggering AI tagging hangs:** The `/api/photos/:id/tag` POST endpoint calls an async AI provider. In environments without AI credentials, this will hang indefinitely. Use the `/approve` endpoint directly to set photo state for testing.
- **approveTagsForPhoto is additive:** Calling approve with subset of tags does not remove previously approved tags — only adds/marks new ones.
- **Hosted smoke test sequence:** For deployment verification, run upload -> review -> search on the hosted URL first, then restart the service and reload to confirm image persistence before sign-off.

## Manual Test Checklist

- [ ] Gallery empty state renders
- [ ] Gallery with photos (Queued, Ready badges)
- [ ] Dark/light theme toggle persists
- [ ] Upload page renders (choose files, camera, upload buttons)
- [ ] Search: type query → tag suggestion chip → search → see matched tags + results
- [ ] Review: page loads with photo + tag chips + accept button
- [ ] Review: remove a tag chip client-side → accept → navigates to gallery
- [ ] Mobile viewport (375px): single-column grid, full-width cards
