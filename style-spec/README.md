# style-spec/

Reference docs for styling SuiteDash surfaces. **Repo-only — never pushed to CU.** RC reads these before generating CSS for any SD surface a doc covers.

These docs capture:
- The architecture of each SD surface
- Real selectors discovered from rendered DOM (NOT static HTML)
- Known traps (per-widget injected `<style>`, the `color: undefined` ghost, ApexCharts limits, etc.)
- Pre-flight checklists and anti-patterns

## Status legend

- ✅ **authored** — doc exists, ready to be consulted before CSS work
- ⬜ **pending** — surface identified but no doc yet; first CSS task targeting this surface triggers ask-on-first-use
- 🚫 **out of scope** — surface intentionally excluded

## Available specs

| Spec ID | SD surface | Status | Doc |
|---|---|---|---|
| `sd-admin-dashboards` | Admin/portal dashboard at `/dashboard` (Angular widget canvas) | ✅ | [`sd-admin-dashboards.md`](sd-admin-dashboards.md) |
| `sd-pages` | SD Pages at `secure.virtuallaunch.pro/i/{token}` (Page Editor + Stack-triad convention) | ✅ | [`sd-pages.md`](sd-pages.md) |
| `sd-lms` | SD LMS Lesson body at `/lms/p/lesson/view/{id}` (per-lesson `.lms-lesson-{N-N}` scope) | ✅ | [`sd-lms.md`](sd-lms.md) |

## How RC uses these

Per `.claude/CLAUDE.md` rule 12, before generating CSS for any SD surface:

1. Identify which spec covers the target surface
2. If a spec exists (✅) — read it, follow it, cite it in the change log row
3. If no spec exists (⬜) — STOP and ask Owner:
   - "Should I author a style-spec for this surface first?"
   - Or: "Is there an existing spec under a different name I should consult?"
   - Or: "Proceed without a spec (one-off; flag as deviation)?"

RC never generates CSS for a covered surface without consulting the spec.

## How to add a new spec

1. Pick a spec ID (kebab-case, prefixed with the platform: `sd-` for SuiteDash, future platforms get their own prefix)
2. Add a row to the table above with status ⬜
3. Author `style-spec/{spec-id}.md` with the frontmatter and body shape used by `sd-admin-dashboards.md`
4. Flip the row to ✅
5. Reference the new spec in any module-config that targets the same surface, if applicable

## Hard rules

1. **Repo-only.** Never push to CU. These are RC's reference, not paste targets.
2. **Append-only change logs.** Same rule as everywhere else in this repo.
3. **Discovery before authoring.** A spec must be grounded in actual rendered DOM / actual SD behavior, not in assumptions from static HTML.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial index. Imported `sd-admin-dashboards.md`. | JLW |
| 2026-05-08 | Added `sd-pages` spec. | JLW |
| 2026-05-08 | Added `sd-lms` spec. | JLW |
