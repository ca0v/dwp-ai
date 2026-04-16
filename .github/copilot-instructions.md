# Copilot Instructions for AI Photo Search POC

## Project Goal

Build a mobile-first AI photo search proof-of-concept that supports bulk upload, AI-generated tags, user tag approval, and search by tags or plain language.

## Delivery Constraints

- Runtime and tooling are Bun-first.
- Use TypeScript, standard HTML pages, Lit web components, and vanilla CSS.
- Keep the design system grid-based, responsive, and mobile-first.
- Support light and dark mode.
- Avoid project scaffolding unless explicitly requested.

## Product Tone and Tagging Scope

- Prompt profiles are globally configured.
- Respect the active product tone and domain boundaries when generating or refining tags.
- Prefer precision over broad labeling outside the configured subject area.

## Agent Workflow Requirements

1. Read the relevant requirements in README before implementation.
2. Implement the smallest safe change that satisfies the task.
3. Add or update unit tests with Vitest when behavior changes.
4. Run relevant checks/tests and report outcomes.
5. Update skill documents in `docs/skills/` after each successful task implementation.

## Manual Testing Requirements

- Use VS Code Copilot browser tools for manual UI checks.
- Use `open_browser_page` for initial load and additional tabs/pages when needed.
- Use interaction tools (`click_element`, `type_in_page`, `navigate_page`) to execute realistic user flows.
- Use `read_page` and `screenshot_page` to confirm behavior and capture evidence.

## Documentation Requirements

For each completed feature or bug fix:

- Update requirement notes if behavior changed.
- Update one or more skill files with practical learnings.
- Include a brief note on test coverage and manual validation path.

## Definition of Done

A task is done when:

1. Functional requirements are met.
2. Tests are added or updated and passing for changed behavior.
3. Manual validation path is executed or documented.
4. Skills documentation is updated with reusable learnings.
