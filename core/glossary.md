# Glossary

This file defines the vocabulary used across this repo. Every other canonical assumes these definitions. Terms are ordered so each one builds only on terms above it.

If a term you need isn't defined here, propose it in a PR. Don't coin new terms in canonical files without adding them to this glossary first.

---

## Module

The M001–M020 system that organizes all VLP work into twenty top-level domains. An M-number is the backbone of the SuiteDash → ClickUp mapping: every SuiteDash module corresponds to a ClickUp doc and a ClickUp list under the matching M-number, and every Item belongs to exactly one Module.

Example: M005 covers tax services; an item delivered under M005 is filed, named, and tracked under M005's doc and list.

## Item

A 5-digit-numbered offering: a product, service, or package the business sells or delivers. Items live inside Modules and inherit their Module's doc/list home. The 5-digit ID is the stable handle for the Item across SuiteDash, ClickUp, and this repo.

Example: Item 29355 -- Tax Prep Setup is an Item under M005.

## Phase

A stage in a workflow lifecycle. Phases are numbered and have explicit start and exit conditions; an entity advances through phases in order. The client lifecycle uses Phase 1–8; the Deal pipeline uses Phase 1–7. A phase number is meaningful only within its lifecycle (Phase 3 of the client lifecycle is unrelated to Phase 3 of the Deal pipeline).

Example: A new lead enters Phase 1 of the Deal pipeline; once qualified, they exit Phase 1 and enter Phase 2.

## Circle

A SuiteDash CRM segment used to track which phase an entity is currently in. Phase membership is implemented by Circle membership: an entity's presence in Circle "Client-Phase-3" means they're in Phase 3 of the client lifecycle. An entity can be in multiple Circles simultaneously (e.g., one for the Deal pipeline phase, another for the client lifecycle phase).

Example: A signed client whose tax return is in review might be in the "Client-Phase-5" Circle and also a product-specific Circle for Item 29355.

## Form

A SuiteDash form. Forms are numbered Form 0 through Form N within a single Flow and collect data from the user. Form numbering restarts inside each Flow.

Example: Inside the onboarding Flow, Form 0 captures contact info and Form 1 captures filing status.

## Flow

A SuiteDash flow chain: an ordered sequence of Forms, appointment blocks, or other steps that the user moves through to complete an interaction. A Flow is the unit of "what happens to a user when they engage with this offering."

Example: The Tax Prep Setup intake Flow consists of Form 0 (contact), Form 1 (filing status), and a scheduling block.

## Doc

A top-level ClickUp doc. Docs are containers for Pages and are identified by a `80djf-XXXXX` UUID. Each Module gets its own Doc; build-specific Docs hang off the Module Doc as needed.

Example: The M005 module Doc holds Pages for every Item under M005, including Item 29355.

## Page

A page within a ClickUp Doc. Pages can be nested as sub-pages and are identified by their own `80djf-XXXXX`. The Page is where canonical content lives in ClickUp.

Example: The Tax Prep Setup Page (`80djf-83317`) sits inside the M005 Doc and contains the build's spec, sub-pages, and references.

## Task

A top-level task in a ClickUp list. Tasks represent units of work that a person or team performs. A Task lives in a List that corresponds to its Module.

Example: `Task 2 -- Prepare Return` is a top-level Task in list `901713417136`.

## Sub-task

A child task under a parent Task. Sub-tasks are named with the `{phase}-{task}-{sub}{letter}` grammar (defined in `core/naming-grammar.md`) and always carry an audience suffix `(Team)` or `(Client)` indicating who the sub-task is written for.

Example: `5-02-1-1A -- Send filing-status confirmation (Team)` is a sub-task under Task 2 in Phase 5.

## Canonical

A reusable template that defines the standard structure for a kind of artifact -- a Team-Facing task description, a Client-Facing doc page, a status-update communication, etc. Canonicals live in `canonicals/` and are platform-agnostic in core; platform-specific manifestations live in `platforms/`.

Example: The "Team-Facing task description" canonical defines what every team-facing sub-task description must contain, in what order.

## Placeholder

A templated variable substituted at runtime. Placeholders let canonicals stay generic while producing build-specific output. Syntax varies by platform (e.g., `{Contact.FullName}` in SuiteDash merge fields, `CF_2025_Filing_Status` for ClickUp custom-field references).

Example: A canonical task description containing `{Contact.FullName}` resolves to "Jane Doe" when the task is generated for that contact.

## Reference Title

The canonical name of an artifact, written in the body of its Doc Page or Task description (not in the title field). Reference Titles use `--` instead of em-dashes because the ClickUp API rejects em-dashes in titles. The Reference Title is the authoritative human-readable identifier and should match across the body, any cross-references, and the Page/Task title where possible.

Example: Reference Title `Item 29355 -- Tax Prep Setup -- Phase 5 -- Task 2 -- Prepare Return` appears in the body of `80djf-83317` and is mirrored in the ClickUp Task title.
