---
spec_for: sd-lms
covers_surface: SuiteDash LMS Lesson surface (lesson body content rendered inside the LMS course player at /lms/p/lesson/view/{id} and /lms/p/lesson/preview/{id}). Scope is the lesson body only — SD owns the outer chrome (.panel-preview, .panel-preview__sidebar, .panel-preview__content, .panel-preview__footer, sidebar nav, lock button, footer "I have completed this Lesson" bar). We style only inside .lms-lesson-{N-N} wrappers within the .wysiwyg-content area.
last_updated: 2026-05-08
authored_by: JLW
repo_only: true
---

# sd-lms — SuiteDash LMS Lesson surface styling

**Audience:** RC (or any future Claude instance) picking up SuiteDash **LMS Lesson** styling work — the lesson body content rendered inside the LMS course player. This is a different surface from SD Pages (`sd-pages.md`) and the in-shell admin dashboard (`sd-admin-dashboards.md`).

**Purpose:** Establish the surface boundary, the per-lesson scoping convention, the class hooks lessons must wrap, and the workflow for authoring lesson HTML alongside one course-level CSS + one course-level JS.

## Pattern: course-level CSS/JS + per-lesson HTML

Each LMS course has:

- **One** `_Course_CSS` body — pasted into **LMS → Course Meta → Custom CSS**. Holds all styling for SD chrome (sidebar, navbar) and every lesson body. Per-lesson `.lms-lesson-{N-N}` scopes still exist; they live inside this single course-level stylesheet.
- **One** `_Course_JS` body — pasted into **LMS → Course Meta → Custom JS**. Holds all behavior shared across lessons (e.g. next-lesson resolver).
- **Per-lesson** `_Lesson_{N.N}_HTML` bodies — one per lesson, pasted into each lesson's body field.

Per-lesson Custom CSS and Custom JS fields are **not used**. This is deliberate: a single paste-target for shared chrome, less duplication, simpler authoring.

---

## 1. Surface boundary

SD wraps lesson body HTML in their content-block scaffolding:
`.cbe-content` → `sd-content-block-template` → `.wysiwyg-content` → our HTML.

Our scope: everything inside `.lms-lesson.lms-lesson-{N-N}` (e.g. `.lms-lesson-1-1`).
Out of scope: SD chrome (sidebar nav, footer, lock button, course title bar, fontsCss block).

---

## 2. Class inventory (authored by us)

Per-lesson wrapper:
- `.lms-lesson` — every lesson
- `.lms-lesson-{N-N}` — specific lesson scope (e.g. `.lms-lesson-1-1`)

Block-level children:
- `.lms-block` — every content block
- `.lms-block-video` — video block (contains `.lms-video-wrap` → `<figure>` → `.embed-content` → `<iframe>`)
- `.lms-block-text` — text block (contains `<p>`)
- `.lms-block-button` — button block (contains `<a>`)
- `.lms-block-button-support` — persistent support-call CTA variant
- `.lms-block-button-next` — continue-to-next-lesson variant
- `.lms-block-checklist` — checklist block (used on `How to Customize Phase X` lessons; contains a `<ul>` of action items)
- `.lms-block-checklist ul` — list root
- `.lms-block-checklist li` — checklist item

Inline elements:
- `.lms-btn` — every CTA anchor
- `.lms-btn-support` — primary CTA (filled gradient)
- `.lms-btn-next` — secondary CTA (outline)
- `.lms-separator` — `<hr>` between sections
- `.lms-lead` — opening word/phrase pulled out as lead-in (e.g. "Welcome.")
- `.lms-highlight` — proper noun or key term with soft underline accent
- `.lms-emphasis` — italicized term in muted color

---

## 2a. Course-level body slots

The LMS surface has two course-level bodies, both siblings to per-lesson HTML files under the same `parent_stack_slug: 29355_Stacks_LMS`:

- `29355_Stacks_LMS_Course_CSS` — pasted into **LMS → Course Meta → Custom CSS**. Applies to every lesson in the course. Holds SD chrome styling (sidebar, navbar) **and** all per-lesson body styling scoped by `.lms-lesson-{N-N}`.
- `29355_Stacks_LMS_Course_JS` — pasted into **LMS → Course Meta → Custom JS**. Applies to every lesson in the course. Holds behavior shared across lessons (e.g. next-lesson resolver).

Per-lesson Custom CSS / Custom JS fields are **not used**. All CSS and JS for the course lives in the two course-level slots.

## 2b. Sidebar class inventory (SD-owned, restyled by us)

These selectors are SD-owned chrome — we don't author the HTML, we restyle it:

- `.panel-preview__sidebar` — sidebar root
- `.panel-preview__sidebar .navbar-header` — logo strip
- `.modules.side-menu` — module list root
- `.module-item` — module row
- `.module-title` — module label (collapsible)
- `.module-title.collapsed` — module collapsed state
- `.lessons` — lesson list (nested under module)
- `.lessons.show` — expanded lesson list
- `.lesson-item` — individual lesson row
- `.lesson-item.active` — current lesson
- `.fa-chevron-up` (inside `.module-title`) — expand/collapse caret
- `.fa-circle` (inside `.lesson-item a`) — lesson status dot

---

## 3. Visual direction

Match the Tax Prep Pro landing page aesthetic (see `apps/tcvlp` or the public taxprep page). Rose/pink gradient primary CTAs (`#e91e63 → #c2185b`), pill-shaped buttons, rounded corners (12px–16px on cards, 999px on buttons), generous whitespace, soft pink-tinted shadows.

---

## 4. Content rules

1. **External documentation links open in new tab.** When a lesson video references SuiteDash documentation (or any external doc), the lesson HTML MUST include a direct link to that documentation rendered as `<a href="..." target="_blank" rel="noopener">`. Do not bury doc references in the video alone — give the learner a clickable link in the lesson body.

2. **Class-hook wrapping is the author's job.** CSS targets `.lms-lead`, `.lms-highlight`, `.lms-emphasis` — but those classes only work if the HTML wraps the right words in `<span class="lms-lead">`, `<em class="lms-highlight">`, `<em class="lms-emphasis">`. Lesson author decides which words get which treatment.

3. **Per-lesson scope.** Every lesson body wraps in `.lms-lesson.lms-lesson-{N-N}`. CSS targets that scope so styles don't leak between lessons.

---

## 5. Where the CSS and JS go

Two SD paste-targets, both under **LMS → Course Meta**:

- **LMS → Course Meta → Custom CSS** ← body of `29355_Stacks_LMS_Course_CSS`
- **LMS → Course Meta → Custom JS** ← body of `29355_Stacks_LMS_Course_JS`

Per-lesson Custom CSS / Custom JS fields are not used.

Workflow for a CSS or JS edit:

1. Identify the course-level canonical (`_Course_CSS` or `_Course_JS`)
2. Edit the body (everything between `<style>...</style>` for CSS, `<script>...</script>` for JS)
3. Commit
4. Push via `npm run sync:cu -- push <slug>` so the body lands in the matching CU page; Owner then re-pastes it into the SD course meta field

**Do not** edit the theme-level Custom CSS or any SD chrome stylesheet from a course task — restyle SD chrome from inside the course-level CSS instead.

---

## 6. Pre-flight checklist for a lesson restyle

Before writing any CSS:

- [ ] Confirm with Owner: which lesson is in scope? Confirm the `.lms-lesson-{N-N}` scope class.
- [ ] Read the matching `_HTML` canonical to confirm the class hooks the body actually exposes.
- [ ] Confirm the CSS canonical's frontmatter is `body_type: stack-css`.
- [ ] Read the full current body before editing.

While writing CSS:

- [ ] All rules scoped to `.lms-lesson-{N-N}` — no bare-class rules that would leak to other lessons.
- [ ] No selectors targeting SD chrome (`.panel-preview`, `.cbe-*`, `.wysiwyg-content`, `#fontsCss`, etc.).
- [ ] Brace balance is even.
- [ ] `prefers-reduced-motion` honored if the change involves animation.

After deploy:

- [ ] Visual spot-check on the live lesson at `/lms/p/lesson/view/{id}`.
- [ ] Spot-check the preview surface at `/lms/p/lesson/preview/{id}` if the lesson is gated.

---

## 7. Out of scope

- SD chrome styling (sidebar, footer, lock button, course title) — SD owns it
- Course-level styling (course meta colors, side menu hover states) — handled by SD's course meta config
- Fontface declarations — SD's `#fontsCss` block handles base typography for `<p>`, `<h1>`–`<h6>`

---

## 8. Update this doc

When you discover a new block type, a new class hook, a new SD chrome selector that turned out to be in-scope (or out-of-scope), or a new gotcha — append it. Especially: capture any class additions so the next Claude doesn't redo the recon.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial authoring. Lesson 1.1 (Meet Zuri) drives first-pass spec. Visual direction lifted from TPP landing page. | JLW |
| 2026-05-08 | Added course-level body slot (29355_Stacks_LMS_Course_CSS) and sidebar class inventory. | JLW |
| 2026-05-08 | Pivoted to course-level pattern: per-lesson HTML only, single course-level CSS + JS. Removed per-lesson CSS/JS body slots from the documented pattern. | JLW |
| 2026-05-08 | Added `.lms-block-checklist` class hook for action-item lists on `*.4` "How to Customize" lessons. | JLW |
