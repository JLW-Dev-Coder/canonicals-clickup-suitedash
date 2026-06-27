# canonicals-clickup-suitedash

Authoring system for SuiteDash content (CSS, JS, LMS courses, M-series module configurations) with ClickUp Docs as the human reading layer and this repo as the source of truth.

**Governing canonical:** [`vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md`](../vlp-platform/.claude/canonicals/canonical-cu-sd-sync.md)

## How this works

The Owner issues short commands like:

- `Create Stack > CSS for item 29355: "Pages"`
- `Create Course for item 29355: "Treat Your Members To SuiteDash..."`
- `Create M001 Appointments for item 29355`

RC (Execution Engineer / Claude Code) runs `npm run cu:create -- <type> <item-id> <name>`. The script:
1. Checks `MODULES.md` for a configuration entry for that type
2. If a `module-config/{type}.md` exists, looks up the parent CU page in `_meta/cu-page-registry.json`
3. Creates the new CU page via the ClickUp v3 API (page title uses single dash `-`, never em-dash `–`)
4. Writes a 1:1 repo file mirror with the new page ID in frontmatter
5. Pushes the body to the CU page
6. Updates the registry and `ITEMS.md`

If no module-config exists, the script halts with `MODULE-CONFIG MISSING` and asks Owner for the SD modal field list. RC authors `module-config/{type}.md`, runs `npm run module-config:mark-authored -- <type>`, and re-runs the original create command.

CU is the reading surface. The repo is the source of truth.

## Conventions

- **CU page titles:** single dash (`-`) only. Em-dash (`–`) is rejected by the CU API title field.
- **Body content:** em-dash is fine. Use whichever reads better in markdown.
- **No placeholders in committed files.** See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Inventories

- [`MODULES.md`](MODULES.md) — Inventory A: which module types have configurations authored
- [`ITEMS.md`](ITEMS.md) — Inventory B: which modules each item has instantiated (created during Owner setup)

## Style specifications

[`style-spec/`](style-spec/) holds reference docs for styling SuiteDash surfaces — repo-only, never pushed to CU. RC reads these before generating CSS for any SD surface a doc covers. See [`style-spec/README.md`](style-spec/README.md) for the index and current coverage.

Per `.claude/CLAUDE.md` rule 12, CSS-generating tasks check `style-spec/` first. If no spec exists for the target surface, RC asks Owner whether to author one before proceeding.

## Folder structure

```
canonicals-clickup-suitedash/
├── README.md
├── CONTRIBUTING.md
├── MODULES.md
├── ITEMS.md                       ← created during Owner setup (PART 10)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── .claude/
│   └── CLAUDE.md
├── module-config/                 ← Per-module-type SD modal configurations
│   ├── course.md
│   ├── stack-css.md
│   └── stack-js.md
├── style-spec/                    ← SD-surface styling reference docs (repo-only)
│   ├── README.md
│   └── sd-admin-dashboards.md
├── scripts/
│   ├── cu-create.ts
│   ├── cu-pull.ts
│   ├── cu-push.ts
│   ├── cu-status.ts
│   ├── cu-router.ts
│   └── _lib/
│       ├── clickup-client.ts
│       ├── frontmatter.ts
│       ├── inventories.ts
│       ├── mark-authored.ts
│       ├── module-types.ts
│       └── paths.ts
├── canonicals/                    ← seed instances created during Owner setup
│   └── .gitkeep
└── _meta/                         ← registry created during Owner setup
    └── .gitkeep
```

## Workflow

### Creating new content

Owner says: `Create [TYPE] for item [ID]: "[NAME]"`. RC runs `npm run cu:create` and reports back.

### When the type doesn't have a module-config yet

If RC reports `MODULE-CONFIG MISSING`:

1. Owner describes (or screenshots) the SD modal for that module type
2. RC authors `module-config/{type}.md`
3. Run `npm run module-config:mark-authored -- {type}` to flip MODULES.md to ✅
4. Re-run the original `Create [TYPE]` command

### Editing existing content

1. Edit the repo file under `canonicals/{platform}/{ID}/...`
2. Append a Change log row in the file's body
3. `npm run sync:cu -- push <slug>` to update the CU mirror
4. For Stack > CSS / Stack > JS, paste the new payload into SD (manual until SD-concat builder ships)

### Creating a CU page via `sync:cu -- push` (create path)

`sync:cu -- push` has two modes, selected by the canonical's frontmatter:

- **Update** — `cu_page_id` is a real ID → the existing CU page body (and, for raw-markdown
  body types, its title) is updated in place. Unchanged legacy behavior.
- **Create** — `cu_page_id` is empty and `parent_slug` is present → a new CU page is created
  under the resolved parent, then the new identity is back-filled into the canonical
  (`cu_page_id`, `cu_parent_page_id`, `cu_url`, `cu_doc_id` for non-default docs, `last_synced`)
  so the next push takes the update path.

Create-path resolution:
- **Parent** comes from `_meta/cu-page-registry.json` keyed by `parent_slug` (must have a `cu_page_id`).
- **Doc** is resolved parent `cu_doc_id` → canonical `cu_doc_id` → env default (`CLICKUP_TAX_PREP_DOC_ID`),
  routed through `getDocId(docId)` in `clickup-client.ts`.
- **Raw-markdown body types** (`appt`, `circle`, `course`) push unfenced; code-stack types stay fenced.

If page creation fails the script prints a manual fallback (parent / name / doc / error) and exits
non-zero without mutating the canonical.

**Create-path test coverage (smoke gap).** The create path's first live exercise is Circles Prompt 2
against 13 TMP Circle pages, not a dedicated smoke test. ClickUp's public API exposes no page-delete
(`DELETE` on the page route returns `405 Method Not Allowed`), so live smoke tests cannot be cleaned up
automatically — the "no live test artifacts" rule disqualifies a live create+delete smoke. Coverage for
the create path comes from: (1) a dry-run validating payload shape, parent resolution, doc routing, and
back-fill; (2) live proof of the shared `getDocId(docId)` path via TMP appt update; (3) the update-path
regression smoke. The 13 Circles pushes are the real first run.

### Recovering from direct CU edits

`npm run sync:cu -- pull <slug>` overwrites local with CU's current content. Review the diff in git.

### Auditing drift

`npm run sync:cu -- status` shows every file's sync state.

## Setup (first time)

See PART 10 of the scaffold RC prompt. Summary:
1. `npm install`
2. `cp .env.example .env`, fill in tokens
3. Gather CU parent page IDs from CU URLs
4. Create `_meta/cu-page-registry.json`, `ITEMS.md`, and seed canonicals using the bodies provided in the scaffold prompt with real IDs filled in
5. `npm run sync:cu -- pull` for each seed canonical to fetch live bodies from CU
6. Commit

## Commands

| Command | Purpose |
|---------|---------|
| `npm run cu:create -- <type> <item-id> <name>` | Create new module instance |
| `npm run sync:cu -- pull <slug>` | Pull CU → repo |
| `npm run sync:cu -- push <slug>` | Push repo → CU |
| `npm run sync:cu -- status` | Report drift |
| `npm run module-config:mark-authored -- <type>` | Flip MODULES.md row to ✅ |

## Weekly PostHog engagement check

Automated weekly cron that pulls 7-day engagement data from PostHog and
updates the recurring ClickUp task `86e2285zc` in Marketing Working File.

- **Script:** `scripts/weekly_posthog_engagement.py`
- **Workflow:** `.github/workflows/weekly-posthog-engagement.yml`
- **Schedule:** Saturdays 14:00 UTC (~7am PT)
- **Target task:** [`86e2285zc`](https://app.clickup.com/t/86e2285zc) — recurring; closes after each run and ClickUp re-opens with same ID

### Required GitHub Actions secrets

| Secret | Value |
|---|---|
| `POSTHOG_API_KEY` | Personal API key with `project:read` scope |
| `POSTHOG_PROJECT_ID` | Numeric project ID from PostHog Settings → Project |
| `POSTHOG_HOST` | e.g. `https://us.posthog.com` (no trailing slash) |
| `CLICKUP_API_TOKEN` | Personal API token from ClickUp Settings → My Apps |

### How it works

Each run:
1. Reads task description, extracts current "Latest report" body as the new "Prior week"
2. Pulls 7-day PostHog data via HogQL API
3. Composes report with deltas vs prior week
4. Updates description: spec section stays untouched, "Latest report" section overwritten with new data, "Prior week" section overwritten with old "Latest report" body
5. Posts a comment containing the full report (permanent archive — comments accumulate over time)
6. Closes the task → ClickUp's recurrence rule re-opens it for next Saturday

### Manual trigger

Run on demand from GitHub Actions → "Weekly PostHog engagement check" → "Run workflow".

### Recovery from a broken run

If the script fails partway, the task may end up open with a stale description, or closed without an archive comment. Inspect the task and the latest workflow run logs. Manual re-run via `workflow_dispatch` is safe — the script is idempotent on description anchors (it always replaces the same sections), and posting a duplicate comment is recoverable (delete the older one).
