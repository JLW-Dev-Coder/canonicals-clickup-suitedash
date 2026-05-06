# Working With Claude

This file is the operating manual for any AI agent (Claude, Claude Code, or successor) working in this repo. It also applies to humans who want to understand what the agents are doing and why.

> Note: this file replaces the project-level `canonical-rc-prompt.md` from `vlp-platform/.claude/canonicals/`. If the two diverge, this repo-local copy wins for work done against this repo.

---

## How RC prompts work in this repo

RC prompts (Role-Context prompts) live in `prompts/`. An RC prompt is the entry point for any new chat: the human pastes it in, the agent reads it, and the agent uses it to bootstrap context.

Rules for RC prompts in this repo:

- Reference repo files by **relative path** (e.g., `core/glossary.md`), never by absolute paths. Absolute paths break the moment the repo moves machines.
- Name the role explicitly at the top (Principal Engineer, Implementer, Reviewer, Owner). The role determines what the agent is allowed to decide vs. escalate.
- State the deliverables narrowly. A prompt that asks for "everything" produces nothing usable.
- The format spec for RC prompts lives in `prompts/_format.md` (currently a placeholder).

## Read order at the start of any session

1. The RC prompt itself.
2. `core/glossary.md` -- so terminology is grounded.
3. Any `core/*.md` file the prompt names by reference.
4. Any example under `examples/` the prompt names, **including that example's `notes.md`** before borrowing patterns from it.

When in doubt about terminology, consult `core/glossary.md`.

## Standing rules

These rules apply to every session in this repo. They override any conflicting instruction from a prompt unless the prompt explicitly names the rule it's overriding and gives a reason.

### Stop and report

If a session encounters a question that the available canonicals and the prompt do not answer, **stop and report**. Do not pick an answer to keep moving. Surface the question, propose options if you have them, and wait for the Owner or Principal to decide.

Examples of stop-and-report triggers:
- A canonical referenced by the prompt isn't in the repo yet.
- Two canonicals appear to conflict.
- A naming or ID convention applies to a case the canon doesn't cover.
- A required input (an Item ID, a `80djf-XXXXX`, a Module number) wasn't provided and can't be derived.

### No fabrication of IDs

Never invent an Item ID, Module number, ClickUp `80djf-XXXXX`, list ID, custom-field key, or SuiteDash form number. If the value isn't supplied or discoverable in a referenced source, stop and ask. A made-up ID that lands in a canonical or example pollutes the repo permanently.

### Em-dashes become `--`

The ClickUp API rejects em-dashes (`—`) in titles. To keep titles, Reference Titles, and the bodies that mirror them consistent, use the literal two-hyphen sequence `--` everywhere a canonical would otherwise use an em-dash. This applies inside files in this repo too -- the repo is the source of truth and must match what gets shipped.

### Judgment is Principal's job

Implementers execute the canonical. Reviewers verify the canonical was followed. Only the Principal Engineer is allowed to override or extend the canon, and only with the Owner's approval recorded in `CHANGELOG.md`. If you are acting as Implementer or Reviewer and the canon is unclear, that's a stop-and-report -- not an opportunity to interpret.

### Escalation protocol

When stopping and reporting, structure the escalation as:

1. **What I was asked to do** (one sentence).
2. **What I hit** (the specific blocker, with file paths or IDs).
3. **What I considered** (the options, if any).
4. **What I need** (the decision or input required to continue).

Keep it short. The point is to hand the Owner or Principal a decision they can make in under a minute.

## Out of scope for this file

- The Module taxonomy itself -- see `core/taxonomy.md` (placeholder).
- Naming grammar rules for sub-tasks and pages -- see `core/naming-grammar.md` (placeholder).
- ID and prefix conventions -- see `core/ids-and-prefixes.md` (placeholder).
- The phase model -- see `core/phase-model.md` (placeholder).
- The placeholder substitution system -- see `core/placeholder-system.md` (placeholder).

When those placeholders are filled in, they become authoritative for their topic and this file should not be updated to duplicate them.
