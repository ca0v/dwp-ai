# Lit Web Components Skill Baseline

## Baseline

- Build reusable components for uploader, review sheet, tag chips, search, and grid gallery.
- Keep component APIs small and event-driven.
- Ensure components are mobile-first and keyboard-accessible.

## Patterns

- Use one-way data flow from page state to components.
- Emit semantic custom events for user actions.
- Keep rendering logic simple and testable.

## Learning Log

- Use `static properties = { propName: { type: Array } }` (not `@property()` decorator) — avoids Bun bundler decorator compatibility issues.
- Use `state: true` in `static properties` for internal state (equivalent to `@state()`).
- Dispatch `CustomEvent` with `bubbles: true, composed: true` so events cross shadow DOM boundaries.
- Lazy-load images with `loading="lazy"` on `<img>` in photo-grid tiles.
- 44px min-height/min-width on interactive elements meets mobile touch target requirements.
- Use `.value=${expr}` (property binding) not `value=${expr}` (attribute binding) for input values in Lit templates.
- Import sibling components with `.ts` extension in Bun/Vite builds.
- photo-grid dispatches `photo-selected` with `{ photoId }` detail; page entry points listen at `document` level for navigation.
- **Critical: Bun bundler ignores `useDefineForClassFields: false` from tsconfig.** Always declare reactive Lit properties using `declare propName: Type` (no initializer in class body) + initialize in `constructor()`. Using `propName: Type = default` creates a native class field that overwrites Lit's reactive accessor, silently breaking reactivity.
- Shadow DOM targeting in Playwright `run_playwright_code` is unreliable for `setInputFiles`. Use the server API directly via `fetch()` for upload testing instead.
- `net::ERR_ABORTED` in browser console after `window.location.href = "/"` is expected — the page navigated before the HTTP response body was fully read. If the navigation happened, the server received the request.
- `approveTagsForPhoto` is additive — it does not remove previously approved tags. If you need to replace tag set, the store function must be updated separately.
