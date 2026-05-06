# Contributing

This repo grows by deliberate, reviewed additions. Every change should make the canon clearer, not bigger.

## How to add or change a canonical

1. **Propose** the change. Open a PR (or, for early sessions, draft the change locally and surface it to the Owner). State what's being added or changed and why.
2. **Review.** A change to anything under `core/` requires Owner approval -- the Owner is the sole approver for core. Anyone may propose changes to `canonicals/`, `platforms/`, or `examples/` via PR.
3. **Commit** with the rationale in the commit message. The "why" matters more than the "what" -- the diff already shows the what.

## Changelog discipline

Any change to an existing canonical (anywhere in the repo, not just `core/`) requires an entry in `CHANGELOG.md` describing what changed and why. Net-new files don't need a per-file changelog entry, but the session that adds them should be summarized in `CHANGELOG.md` so the history is reconstructable.

## What does not get committed

No file gets committed with placeholder body text in production. Empty `.md` files used as folder placeholders are fine; `.gitkeep` files are fine; "TODO: write this" prose in a file that's referenced as canonical is not. If a canonical isn't ready, leave the file empty and let its presence in the directory tree signal that it's reserved.

## Scope discipline

If a session's prompt scopes the work to a specific list of files, don't expand beyond that list to "clean up while you're in there." Drive-by edits to canonicals create review burden and dilute the rationale on each commit. Open a follow-up instead.
