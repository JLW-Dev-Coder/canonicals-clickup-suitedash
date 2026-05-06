# canonicals-clickup-suitedash

This repo is the single source of truth for how content gets canonicalized in ClickUp at Virtual Launch Pro. It defines the naming rules, ID conventions, page hierarchies, the placeholder system, the relationship between SuiteDash modules and ClickUp docs, and the patterns agents and humans use to produce consistent work across every product, offer, and downstream repo.

## Who this repo is for

Anyone -- agent or human -- producing ClickUp content for any VLP product, offer, or repo. That includes Claude and Claude Code sessions, VAs, junior PMs, and the future-Owner who inherits this body of work. If you're touching a ClickUp doc, list, task, or sub-task on behalf of VLP, you should be reading from this repo.

## The four-layer mental model

The repo is organized in four layers, each more specific than the one above it. **Core** defines what canonical means at VLP -- the M-module taxonomy, naming grammar, ID system, phase model, placeholder system, escalation pattern, and glossary. **Canonicals** are reusable templates (task descriptions, doc pages, communications) that follow the core rules. **Platforms** describe how the canon manifests in specific tools -- today, SuiteDash and ClickUp; tomorrow, whatever VLP adopts next. **Examples** are real worked builds with provenance notes; they teach the canon, but they don't replace it.

## How to use this repo

Start with `core/glossary.md`. Every other doc in the repo assumes the vocabulary defined there.

If you're an agent (Claude, Claude Code, or any other tool with autonomy), also read `core/working-with-claude.md` before doing anything. It defines the standing rules: stop-and-report, no ID fabrication, `--` instead of em-dashes, and how escalation works.

If you're scaffolding a new build, find the closest match under `examples/` and read its `notes.md` before borrowing anything. Examples may deviate from the canon for documented build-specific reasons; copying without reading the notes propagates those deviations.

If you're proposing a change, read `CONTRIBUTING.md`.

## Status

This repo is **actively under construction**. The folder structure is in place, but most files in `core/`, `canonicals/`, `platforms/`, and `examples/` are placeholders waiting on dedicated authoring sessions. The seeded files are: `core/glossary.md`, `core/working-with-claude.md`, this README, `CONTRIBUTING.md`, `CHANGELOG.md`, and `examples/README.md`. Anything else is reserved structure -- expect empty files or `.gitkeep` markers until further notice.

Check `CHANGELOG.md` for the most recent additions.
