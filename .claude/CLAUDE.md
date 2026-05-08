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
10. **Stack body wrapper rule.** `body_type: stack-css` files have bodies wrapped in `<style>...</style>` tags as the first and last lines. `body_type: stack-js` files have bodies wrapped in `<script>...</script>` tags. The wrapper is part of the body, not added at paste-time.
11. **Autonomy: RC commits, pushes, and deploys without asking.** After completing any task that produces a commit-worthy change, RC:
    - Stages the changes
    - Writes a clear conventional-commit message (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
    - Commits
    - Pushes to `origin main`
    - For this repo, "deploy" is the CU push (already handled by `npm run sync:cu -- push <slug>` during the task — RC does not need a separate deploy step)
    - Reports the commit hash and push result to Owner
    Owner does NOT need to approve commits or pushes. RC ships work end-to-end.
    Exceptions where RC stops before committing:
    - Any file would contain `REPLACE_*` literals (rule 9)
    - A `cu_page_id` would be set to a placeholder
    - A canonical body still contains unfilled `{TODO}` markers from a module-config template
    - A user-visible CU/SD payload would be deployed before Owner has confirmed copy/visual choices

    After `git push origin main` succeeds, if any committed file is a CU-mapped
    canonical (i.e. has a `cu_page_id` in its frontmatter), RC pushes those
    files to CU using:

    - Single CU-mapped file: `npm run sync:cu -- push <slug>`
    - Multiple CU-mapped files: invoke `npm run sync:cu -- push <slug>` once
      per slug (the router has no batch/glob/`--all` form; see
      `scripts/cu-router.ts` and `scripts/cu-push.ts`)
    - To check which files are CU-mapped before pushing: `npm run sync:cu -- status`
      (walks `canonicals/` + `ITEMS.md`, prints slug/type/status/last_synced)

    If `sync:cu` fails for any file, RC reports the failure but does NOT roll
    back the git commit — the repo is the source of truth and CU drift can
    be re-synced later. RC notes in the report which CU pages were updated
    and which (if any) were skipped or failed.
12. **Style-spec consultation for CSS work.** Before generating CSS for any SD surface, RC checks `style-spec/` for a doc covering that surface (per `style-spec/README.md`). If a spec exists, RC reads it and follows it. If no spec exists, RC stops and asks Owner whether to:
    - Author a style-spec for the surface first (treat like ask-on-first-use for module-configs)
    - Proceed without a spec (Owner explicitly authorizes; RC flags the work as a deviation in the file's change log)
    - Consult an existing spec under a different name
    The CSS-generating commands this rule applies to: `Create Stack > CSS for item ...`, any direct edit to a `body_type: stack-css` file's body, any task whose deliverable is CSS targeting an SD surface.

## Pre-task self-check (every time)

1. Confirm working directory is `canonicals-clickup-suitedash`.
2. Read the relevant section of `canonical-cu-sd-sync.md`.
3. Verify `.env` has `CLICKUP_API_TOKEN`, `CLICKUP_WORKSPACE_ID`, `CLICKUP_TAX_PREP_DOC_ID`.
4. For create: verify the parent CU page exists in `_meta/cu-page-registry.json` with a real (non-placeholder) value.
5. For CSS-generating tasks: confirm the relevant style-spec exists at `style-spec/{spec-id}.md` and read it before authoring CSS (rule 12).

## Reporting

After any command:
- Files created/modified (full paths)
- CU pages created/modified (URLs)
- Registry entries added
- ITEMS.md updates
- Any deviation from the canonical and why
