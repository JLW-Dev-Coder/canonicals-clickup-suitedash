# MODULES.md — Module Configuration Inventory (Inventory A)

**Question this answers:** Does RC have a configuration for this module type?

**Source of truth:** This file. Repo-only.

**CU read-only reference (Owner's human view):** [https://app.clickup.com/8402511/v/li/901707278858](https://app.clickup.com/8402511/v/li/901707278858) — RC NEVER pushes to this URL. RC reads module-configs from the repo only.

**Governing canonical:** [`vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md`](../vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md) §11.1

---

## Status legend

- ✅ **module-config authored** — `module-config/{type}.md` exists; RC can `Create` instances of this type without asking
- ⬜ **no module-config yet** — first `Create` triggers ask-on-first-use flow (canonical §12)
- 🚫 **won't have module-config** — type intentionally excluded

---

## Stack-type module configs (Deal branch)

| Type ID | SD modal path | Status | Module config |
|---|---|---|---|
| `stack-css` | Stack editor (no modal) | ✅ | [`module-config/stack-css.md`](module-config/stack-css.md) |
| `stack-js` | Stack editor (no modal) | ✅ | [`module-config/stack-js.md`](module-config/stack-js.md) |

## LMS module configs (Order branch — under M021)

| Type ID | SD modal path | Status | Module config |
|---|---|---|---|
| `course` | Courses → Add Course → Course Details | ✅ | [`module-config/course.md`](module-config/course.md) |

## M-series module configs (Order branch — direct children of `Item {ID} – Tax Prep Setup – Order`)

| # | Type ID | SD module | Status | Module config |
|---|---|---|---|---|
| M001 | `m001-appointments` | Appointments | ⬜ | (not yet) |
| M002 | `m002-auto-templates` | Auto-Templates | ⬜ | (not yet) |
| M003 | `m003-business-sectors` | Business Sectors | ⬜ | (not yet) |
| M004 | `m004-circles` | Circles | ⬜ | (not yet) |
| M005 | `m005-content-categories` | Content Categories | ⬜ | (not yet) |
| M006 | `m006-custom-fields` | Custom Fields | ⬜ | (not yet) |
| M007 | `m007-dashes` | Dashes | ⬜ | (not yet) |
| M008 | `m008-document-generators` | Document Generators | ⬜ | (not yet) |
| M009 | `m009-drip-sequences` | Drip Sequences | ⬜ | (not yet) |
| M010 | `m010-marketing-audience` | Marketing Audience | ⬜ | (not yet) |
| M011 | `m011-flows` | Flows | ⬜ | (not yet) |
| M012 | `m012-forms` | Forms | ⬜ | (not yet) |
| M013 | `m013-invoice-items` | Invoice Items | ⬜ | (not yet) |
| M014 | `m014-landing-pages` | Landing Pages | ✅ | [`module-config/m014-landing-pages.md`](module-config/m014-landing-pages.md) |
| M015 | `m015-menus` | Menus | ⬜ | (not yet) |
| M016 | `m016-platform-branding` | Platform Branding | ⬜ | (not yet) |
| M017 | `m017-portal-pages` | Portal Pages | ⬜ | (not yet) |
| M018 | `m018-projects` | Projects | ⬜ | (not yet) |
| M019 | `m019-proposals` | Proposals | ⬜ | (not yet) |
| M020 | `m020-tasks` | Tasks | ⬜ | (not yet) |
| M021 | `m021-lms` | LMS (parent shell) | ⬜ | (not yet) |
| M022 | `m022-stacks` | Stacks | ⬜ | (not yet) |

## Standalone module types

| Type ID | SD modal | Status | Module config |
|---|---|---|---|
| `form` | Various form modals | ⬜ | (not yet) |

---

## How to add a new module type

1. Add a row to the appropriate table above with status ⬜
2. Register the type in `canonical-cu-sd-sync.md` §4
3. Register the type in `scripts/_lib/module-types.ts`

When the module-config gets authored, run `npm run module-config:mark-authored -- <type>` to flip the row to ✅.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial inventory. 3 module-configs authored (stack-css, stack-js, course); 22 module types pending (M001–M021, Form). Bonus removed per Owner — client-facing doc, not RC-managed. | JLW |
| 2026-05-08 | Authored `module-config/m014-landing-pages.md` for first instance (Landing Page 1 — Tax Prep Setup Explore_HTML, CU 80djf-701737). M014 flipped ⬜ → ✅. | JLW |
| 2026-05-08 | Added M022 Stacks row (m022-stacks) for the SuiteDash Stacks module branch. Status ⬜ — module-config not yet authored. Triggered by 29355_Stacks_LMS_Lesson_1.1 triad authoring. | JLW |
