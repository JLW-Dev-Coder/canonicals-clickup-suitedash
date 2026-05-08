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
├── module-config/
│   ├── course.md
│   ├── stack-css.md
│   └── stack-js.md
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
