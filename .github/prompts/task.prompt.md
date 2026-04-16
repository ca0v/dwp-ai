# Task Prompt: Feature Request or Bug Report

## Primary Goal

Generate a complete task document for the requested feature or reported defect.
The output should be a ready-to-use task artifact (for example, in `docs/`) that can be tracked and implemented, not just an informal response.

Use this template to introduce work items for this repository.

## Task Type

Choose one:

- Feature Request
- Bug Report

## Summary

Provide a short one-paragraph statement of the goal or issue.

## Background and Context

- Why this change is needed
- Current behavior (if bug)
- Desired behavior

## Requirements and Constraints

- Product or UX requirements
- Technical constraints (Bun, TypeScript, Lit, vanilla CSS, mobile-first)
- Data and AI constraints (global prompt profile, tagging domain)

## Acceptance Criteria

List concrete, testable criteria.

## Implementation Notes (Optional)

- Files/components likely impacted
- API or data model considerations
- Risks and edge cases

## Testing Plan

- Unit tests to add/update (Vitest)
- Manual testing flow using Copilot browser tools:
  - open pages with `open_browser_page`
  - interact with `click_element`, `type_in_page`, `navigate_page`
  - verify state with `read_page`
  - capture evidence with `screenshot_page`

## Documentation Updates Required

- README updates if requirements changed
- Skill updates in `docs/skills/` with lessons learned from successful implementation

## Definition of Done

1. Acceptance criteria met.
2. Vitest coverage updated for changed behavior.
3. Manual testing executed and noted.
4. Relevant skill files updated.
