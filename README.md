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
3. Creates the new CU page via the ClickUp v3 API
4. Writes a 1:1 repo file mirror with the new page ID in frontmatter
5. Pushes the body to the CU page
6. Updates the registry and `ITEMS.md`

If no module-config exists for the requested type, the script halts with `MODULE-CONFIG MISSING` and asks Owner for the SD modal field list. RC authors `module-config/{type}.md`, runs `npm run module-config:mark-authored -- <type>`, and re-runs the original create command.

CU is the reading surface. The repo is the source of truth.

## Inventories

- [`MODULES.md`](MODULES.md) — Inventory A: which module types have configurations authored
- [`ITEMS.md`](ITEMS.md) — Inventory B: which modules each item has instantiated

## Folder structure

```
canonicals-clickup-suitedash/
├── README.md
├── MODULES.md                     ← Inventory A (repo-only)
├── ITEMS.md                       ← Inventory B (repo + CU mirror)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── .claude/
│   └── CLAUDE.md                  ← RC's working context
├── module-config/                 ← Per-module-type SD modal configurations
│   ├── course.md
│   ├── stack-css.md
│   └── stack-js.md
├── scripts/                       ← Sync + create scripts
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
├── canonicals/                    ← Per-item authored module instances
│   └── tpp/
│       └── 29355/
│           ├── deal/stacks/29355_Stacks_Pages/
│           │   ├── 29355_Stacks_Pages_CSS.md
│           │   └── 29355_Stacks_Pages_JS.md
│           └── order/m021-lms/
│               └── lms-1-course.md
└── _meta/
    └── cu-page-registry.json
```

## Workflow

### Creating new content

Owner says: `Create [TYPE] for item [ID]: "[NAME]"`. RC runs `npm run cu:create` and reports back.

### When the type doesn't have a module-config yet

If RC reports `MODULE-CONFIG MISSING`:

1. Owner describes (or screenshots) the SD modal for that module type
2. RC authors `module-config/{type}.md` based on the description
3. Run `npm run module-config:mark-authored -- {type}` to flip MODULES.md to ✅
4. Re-run the original `Create [TYPE]` command

### Editing existing content

1. Edit the repo file under `canonicals/{platform}/{ID}/...`
2. Append a Change log row in the file's body
3. `npm run sync:cu -- push <slug>` to update the CU mirror
4. For Stack > CSS / Stack > JS, paste the new payload into SD (manual until SD-concat builder ships)

### Recovering from direct CU edits

`npm run sync:cu -- pull <slug>` overwrites local with CU's current content. Review the diff in git.

### Auditing drift

`npm run sync:cu -- status` shows every file's sync state.

## Setup (first time)

1. `npm install`
2. `cp .env.example .env`, fill in `CLICKUP_API_TOKEN`, `CLICKUP_WORKSPACE_ID`, `CLICKUP_TAX_PREP_DOC_ID`
3. Owner: populate `_meta/cu-page-registry.json` REPLACE entries
4. Owner: fill `cu_page_id` in `ITEMS.md` frontmatter
5. Verify: `npm run sync:cu -- status`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run cu:create -- <type> <item-id> <name>` | Create new module instance |
| `npm run sync:cu -- pull <slug>` | Pull CU → repo |
| `npm run sync:cu -- push <slug>` | Push repo → CU |
| `npm run sync:cu -- status` | Report drift |
| `npm run module-config:mark-authored -- <type>` | Flip MODULES.md row to ✅ |
