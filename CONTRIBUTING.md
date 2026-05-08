# Contributing to canonicals-clickup-suitedash

## Hard rules

1. **No placeholders in committed files.** Files containing `REPLACE_*`, `TODO`, or empty stub bodies do not land in git. If a file needs Owner-supplied IDs (CU page IDs, API tokens, etc.), it gets created locally during setup with real values BEFORE its first commit. The scaffold RC prompt's PART 10 lists every such file.
2. **CU page titles use single dash (`-`), never em-dash (`–`).** The CU API title field rejects em-dashes. Body content can use em-dashes where they read better.
3. **Append-only change logs.** Every canonical file has a `## Change log` section at the bottom. Modifying a file requires appending a new row. Never rewrite or delete prior rows.
4. **No drive-by edits.** Each commit addresses one logical change. If you notice a problem outside the scope of your current task, open it as a separate issue or commit.
5. **Owner approves all module-config additions.** When `Create [TYPE]` triggers ask-on-first-use, the resulting `module-config/{type}.md` is reviewed by Owner before committing.

## File creation rules

- Frontmatter `slug` MUST match filename (without `.md`).
- Frontmatter `cu_page_id` MUST be set to a real value before commit (not `REPLACE_*`).
- Frontmatter `last_synced` is updated automatically by sync scripts. Don't edit by hand.
- New module types require simultaneous updates to: `canonical-cu-sd-sync.md` §4, `MODULES.md`, `scripts/_lib/module-types.ts`.

## Sync discipline

- Repo is source of truth. CU is a mirror.
- After editing a repo file, run `npm run sync:cu -- push <slug>` to mirror the change.
- If CU was edited directly (out-of-band), run `npm run sync:cu -- pull <slug>` and review the diff in git before committing.
- The CU URL [https://app.clickup.com/8402511/v/li/901707278858](https://app.clickup.com/8402511/v/li/901707278858) is read-only to RC. RC NEVER pushes to it; that's Owner's human reference for Inventory A.
