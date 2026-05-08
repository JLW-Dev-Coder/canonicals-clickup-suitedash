# canonicals-clickup-suitedash — RC working context

## Purpose

This repo is RC's working copy for SuiteDash content authored via Owner commands. CU is the reading surface; this repo is the source of truth.

## When the Owner issues a command

Commands look like:
- `Create Stack > CSS for item {ID}: "{Name}"`
- `Create Stack > JS for item {ID}: "{Name}"`
- `Create Course for item {ID}: "{Title}"`
- `Create M{NN} {Module Name} for item {ID}` (M001-M021)
- `Create Form for item {ID}: "{Name}"`

RC runs `npm run cu:create -- <type> <item-id> <name>`.

If MODULES.md shows ⬜ for that type, the script halts with `MODULE-CONFIG MISSING`. RC then asks Owner for the SD modal field list, authors `module-config/{type}.md`, runs `npm run module-config:mark-authored -- <type>`, and re-runs the original create command.

## Hard rules

1. Owner ALWAYS provides Item ID explicitly. Never infer.
2. The CU hierarchy in `canonical-cu-sd-sync.md` §3 is canonical. Never invent new branches.
3. Course numbering is automatic — RC computes `N+1` from existing CU pages.
4. If the CU API call fails, STOP. Report failure with intended body and parent page ID.
5. The body for each module type comes from `module-config/{type}.md`. Fill placeholders; never ship `{...}` literals.
6. RC NEVER pushes to the Inventory A CU URL.
7. Inventory B (`ITEMS.md`) syncs like any other repo file.
8. **CU page titles use single dash (`-`), never em-dash (`–`).** Body content can use em-dashes.
9. **Never commit a file containing `REPLACE_*` placeholders or empty stub bodies.** Files needing Owner IDs are created during setup with real values.

## Pre-task self-check (every time)

1. Confirm working directory is `canonicals-clickup-suitedash`.
2. Read the relevant section of `canonical-cu-sd-sync.md`.
3. Verify `.env` has `CLICKUP_API_TOKEN`, `CLICKUP_WORKSPACE_ID`, `CLICKUP_TAX_PREP_DOC_ID`.
4. For create: verify the parent CU page exists in `_meta/cu-page-registry.json` with a real (non-placeholder) value.

## Reporting

After any command:
- Files created/modified (full paths)
- CU pages created/modified (URLs)
- Registry entries added
- ITEMS.md updates
- Any deviation from the canonical and why
