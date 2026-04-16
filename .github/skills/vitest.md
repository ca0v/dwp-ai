# Vitest Skill

## Baseline

- Use Vitest for all unit testing.
- Add or update tests for every behavior change.
- Focus tests on domain logic, adapters, and critical UI behavior.

## Patterns

- Keep test data small and representative.
- Use table-driven tests for tag matching and ranking logic.
- Mock AI provider boundaries, not internal business logic.

## Learning Log

- `bun` not required to run tests \u2014 `npx vitest run` works with node v25+ when bun is unavailable.
- Use `vi.mock("../src/ai/config.ts", () => ({ getProvider: () => ({...}) }))` to mock AI provider without real API calls.
- Dynamic `await import(...)` inside tests is needed when mocking modules with `vi.mock` at module scope.
- `beforeEach(() => resetStore())` is essential; store is a singleton so state leaks between tests otherwise.
- Fuzzy match tests: verify exact=1.0, prefix\u22650.8, substring\u22650.6, and sort order descending.
- `approveTagsForPhoto` sets photo.status to "ready" as a side effect \u2014 test this explicitly in store tests.
