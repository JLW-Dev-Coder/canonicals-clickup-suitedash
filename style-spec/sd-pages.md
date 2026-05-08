---
spec_for: sd-pages
covers_surface: SuiteDash Pages surface (publicly-accessible pages served at `secure.virtuallaunch.pro/i/{token}`, built in the SD Page Editor)
last_updated: 2026-05-08
authored_by: JLW
repo_only: true
---

# SuiteDash Pages — Styling Spec

**Audience:** RC (or any future Claude instance) picking up SuiteDash **Pages** styling work — the publicly-accessible pages served at `secure.virtuallaunch.pro/i/{token}` and composed in the SD Page Editor. This is a different surface from the in-shell admin dashboard at `/dashboard` (covered by `sd-admin-dashboards.md`).

**Purpose:** Establish the architecture, the Stack-triad convention, the Page Editor block model, and the workflow for finding and editing the CSS that styles these pages.

---

## 1. Surface architecture

A SuiteDash Page is composed in the **Page Editor** as a tree of **blocks**. Each block has a type and its own configuration. Block types observed so far:

- **Text Block** — accepts arbitrary HTML, typically wrapped in a `<div>`
- **Project Block** — structured block tied to project data
- **Button Block** — purpose-built CTA block
- (others exist; append as discovered)

Pages can include **Stacks** — reusable bundles distributed across multiple pages. Editing a Stack updates everywhere it's included.

---

## 2. The Stack-triad convention

Owner splits Stacks into purpose-specific sibling files. The convention seen for site-wide page styling is a **triad**:

| Stack name | Role | What's inside |
|---|---|---|
| `29355_Stacks_All Pages_CSS_JS` | **Container Stack** dropped onto pages | Styling Options reference the two siblings below |
| `29355_Stacks_Pages_CSS` | CSS body | The actual `:root` variables, font imports, and selectors |
| `29355_Stacks_Pages_JS` | JS body | The actual JS — `tppBoot()` and similar |

**Edit rule:** CSS changes go to `29355_Stacks_Pages_CSS`. JS changes go to `29355_Stacks_Pages_JS`. **Never edit the container `29355_Stacks_All Pages_CSS_JS`** — its Styling Options just reference the siblings.

In the canonicals repo, each Stack is a `module_type: stack-css` (or `stack-js`) markdown file under `canonicals/`. The body of that file is what gets pasted into the SD Custom CSS / Custom JS slot.

---

## 3. Page Editor configuration panels

When editing a Stack in SD, two panels are available:

### 3.1 Settings panel

- **Title** — the Stack's name (e.g. `29355_Stacks_All Pages_CSS_JS`)
- **Icon** — a glyph for the Stack list

### 3.2 Styling Options panel

- **Custom CSS** — slot for site-wide CSS injected on every page that includes this Stack
- **Custom JS** — slot for site-wide JS injected on every page that includes this Stack

For the container Stack, both slots reference the sibling Stacks (Custom CSS → `29355_Stacks_Pages_CSS`, Custom JS → `29355_Stacks_Pages_JS`).

---

## 4. Page-level class conventions (verified)

The recon page uses a `tpp-` prefix (Tax Prep Pro). Every other page brand will use its own prefix — confirm the prefix from rendered DOM before editing CSS.

### 4.1 Form-card pattern

```
section.tpp-section.tpp-book#tpp-book
  div.tpp-wrap.tpp-narrow
    div.tpp-form-card.tpp-reveal.tpp-in
      div.tpp-form-glow                  ← decorative blur/glow layer
      div.tpp-form-badge                 ← "now Booking" ribbon
      div.tpp-form-head                  ← headline area
        span.tpp-section-kicker          ← uppercase eyebrow text
        h3.tpp-h3-large                  ← main headline
        p.tpp-sub                        ← descriptive paragraph
      div.tpp-form-embed.tpp-form-sd     ← embedded SD form
```

### 4.2 Section pattern

`section.tpp-section.tpp-{name}#tpp-{name}` — each major page section follows this pattern. Examples observed: `tpp-hero`, `tpp-stats`, `tpp-services`, `tpp-types`, `tpp-how`, `tpp-book`.

Inside a section, layout wrappers use `tpp-wrap.tpp-{modifier}` — `tpp-narrow`, etc.

### 4.3 Reveal-on-scroll pattern

Elements with `.tpp-reveal` are hidden until JS adds `.tpp-in` (animate-in trigger). The JS that drives this lives in `29355_Stacks_Pages_JS`.

---

## 5. Where the CSS goes

CSS edits for SD Pages go to **`29355_Stacks_Pages_CSS`** (the canonical file in the repo, body pasted into the matching Stack's Custom CSS slot in SD). Workflow:

1. Identify the canonical file: `Select-String -Path canonicals\**\*.md -Pattern "29355_Stacks_Pages_CSS" -List`
2. Edit the body of that file
3. Commit
4. Owner pastes the updated body into SD's Custom CSS slot for the Stack

**Do not** edit the container Stack `29355_Stacks_All Pages_CSS_JS`. Its Custom CSS slot just references this one.

**Do not** edit the theme-level Custom CSS (`Settings → Theme → Custom CSS`) for page-specific work. That slot is for SD chrome and admin surfaces (covered by `sd-admin-dashboards.md`).

---

## 6. Coexistence with `lentax.css`

VLP's deployment loads `lentax.css` (~189 KB) as a net-new component stylesheet. Its classes (`.vl-*`, `.feature-*`, `.flow-*`, `.lm-*`, `.agency-*`) do not overlap the page-specific `.tpp-*` (or other brand-prefix) classes.

Coexistence is safe — page CSS doesn't fight `lentax.css` because it's a disjoint selector space.

**Do not edit `lentax.css` from a Pages styling task.**

---

## 7. Selectors cheat sheet (form-card pattern)

| Element | Selector |
|---|---|
| Page section | `section.tpp-section.tpp-{name}` |
| Section content wrap | `.tpp-wrap.tpp-narrow` |
| Form card shell | `.tpp-form-card` |
| Form card decorative glow | `.tpp-form-glow` |
| Form card ribbon/badge | `.tpp-form-badge` |
| Form card headline area | `.tpp-form-head` |
| Eyebrow / kicker text | `.tpp-section-kicker` |
| Main headline | `.tpp-h3-large` |
| Sub-headline paragraph | `.tpp-sub` |
| Embedded SD form wrapper | `.tpp-form-embed.tpp-form-sd` |

(Brand prefix `tpp-` is Tax Prep Pro. Other brands will use their own — capture in rendered DOM recon.)

---

## 8. Pre-flight checklist for a Pages restyle

Before writing any CSS:

- [ ] Confirm with Owner: which page(s) are in scope? Which brand prefix?
- [ ] Confirm with Owner: is the change site-wide (Stack-CSS) or page-specific (per-page Custom CSS)?
- [ ] Capture rendered DOM for the affected element. Static HTML/Page-Editor view alone won't show runtime classes.
- [ ] Identify the canonical file: `Select-String` for the Stack name in `canonicals\`.
- [ ] Confirm the file's frontmatter is `module_type: stack-css`.
- [ ] Read the full current body before editing.

While writing CSS:

- [ ] Edits go to the **content Stack** (e.g. `29355_Stacks_Pages_CSS`), not the container.
- [ ] Brace balance is even.
- [ ] No edits to `lentax.css`.
- [ ] No edits to theme-level Custom CSS for page-specific work.
- [ ] `prefers-reduced-motion` media query honored if the change involves animation.

After deploy:

- [ ] Owner pastes the updated body into the matching SD Stack's Custom CSS slot.
- [ ] Visual spot-check on the live page at `secure.virtuallaunch.pro/i/{token}`.
- [ ] Spot-check at least one other page that includes the same Stack to confirm no regression.

---

## 9. The headline-wrap pattern (recurring)

`.tpp-h3-large` (and equivalents under other brand prefixes) tends to wrap awkwardly when the parent container is narrow. Common fix patterns:

1. **`text-wrap: balance`** on the `<h3>` — lets the browser distribute words evenly across lines. Works in modern browsers (Chrome 114+, Safari 17.4+, Firefox 121+).
2. **Explicit `<br>` in the source** — fragile if copy changes; avoid unless `text-wrap: balance` is unavailable.
3. **Reduce font-size at the offending breakpoint** — last resort; usually the headline is sized intentionally.
4. **Widen the container** — preferred when the constraint is from a parent's `max-width`, not the headline itself.

Pick the lightest-touch fix that preserves the visual weight of the headline.

---

## 10. Update this doc

When you discover a new block type, a new Stack-triad sibling, a new section pattern, or a new gotcha — append it. Especially: every new brand will use its own prefix; capture the rendered DOM convention here so the next Claude doesn't redo the recon from scratch.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial spec. Authored from Owner recon during the headline-wrap fix on Tax Prep Pro landing page. | JLW |
