---
spec_for: sd-admin-dashboards
covers_surface: SuiteDash admin/portal dashboard surface (Angular widget canvas at `/dashboard`)
last_updated: 2026-05-08
authored_by: JLW
repo_only: true
---

# SuiteDash Admin Dashboards — Styling Spec

**Audience:** RC (or any future Claude instance) picking up SuiteDash **admin / portal dashboard** styling work — i.e. the page rendered at `/dashboard` for a logged-in role (Super Admin, Staff, Client, etc.). This covers the live admin dashboard surface, which is an Angular app injecting widgets at runtime — structurally different from any CMS-composed page.

**Purpose:** Avoid the trial-and-error cycle of guessing widget selectors from view-source. The dashboard renders nothing useful in static HTML — every meaningful class is added by Angular controllers after page load. Read this before writing one line of dashboard CSS.

---

## 1. Where the Custom CSS Goes

SuiteDash exposes Custom CSS for the dashboard surface at the **theme level**, not the page level. Path:

```
Settings → Theme → Custom CSS  (sometimes labelled "Brand → Custom CSS")
```

This CSS loads on every page in the SD shell, including the dashboard. It is injected into a `<style id="platform-branding-custom-css-anchor">` element late in the page load — so its rules can outweigh most of SD's bundled stylesheet (`lentax.css` and friends) by source order alone, but **not** SD's per-widget injected `<style>` tags (see §4). That's why almost everything below uses `!important` plus tight scoping.

**Rule:** scope every dashboard rule under `#dashboard-view`. That is the stable container ID for the dashboard surface (`<div id="dashboard-view">…</div>` wraps the entire widget canvas). Outside `#dashboard-view`, leave the SD chrome alone — sidebar, top bar, modals, and the entire CMS editing experience all live outside that scope and styling them from theme CSS is asking for cross-product breakage.

```css
/* RIGHT */
#dashboard-view .reporting__block { … !important; }

/* WRONG — leaks to every page in the shell */
.reporting__block { … !important; }
```

---

## 2. The Static-HTML Trap

If you `view-source:` the dashboard and grep for the widget classes you want to style, **you will find the wrong ones.** The static HTML contains skeleton templates and unused fallback selectors (e.g. `#sdReporting`, `.reporting-tabs`, `.report-card`, `.property-data`, `.property-title`, `.pane-report-cards`). These render to **zero matched elements** at runtime because the actual widgets are injected by Angular controllers (`Reporting2BlockController`, `ProjectsBlockController`, `LiveStream2BlockController`) using a completely different class convention.

**The only reliable way to discover real selectors is to inspect the rendered DOM in DevTools** while the dashboard is loaded with the role you're styling for. Past attempts to write CSS from view-source alone have produced 900+ line files with zero visual effect.

Re-run a rendered-DOM recon at the start of any new dashboard styling task.

---

## 3. Real Widget Class Conventions (verified)

These are the classes Angular actually injects at runtime. All are scoped under `#dashboard-view`. Exhaustive for the four widget families seen so far on Super Admin dashboards.

### 3.1 KPI / Reporting widget (`Reporting2BlockController`)

Rendered structure:

```
.reporting__container                ← grid shell, holds 1-N tiles
  .reporting__block                  ← single tile
    .reporting__block__title
      .reporting__block__title__text          ← uppercase label, e.g. "TOTAL CLIENTS"
      .reporting__block__title__icon          ← square icon container (often dark inline bg)
        .reporting__block__title__icon-svg    ← SVG <use> reference
    .reporting__block__value
      .reporting__block__value__current       ← the big number / dollar amount
      .reporting__block__value__trend         ← "0.0% (30d)" pill — see modifiers below
    .reporting__block__graphics
      .reporting__block__graphics__content
        .reporting__block__progress__bar      ← ApexCharts canvas wrapper (progress variant)
        .reporting__block__progress__value    ← "0%" / "8%" text
        .reporting__block__chart              ← ApexCharts sparkline (chart variant)
        .eye-icon                             ← "open chart modal" affordance
      .reporting__block__graphics__button
        .reporting__block__view-button        ← "VIEW" link (single-link variant)
```

**Trend pill modifiers:**
- `.reporting__block__value__trend--positive` — direction: up (green)
- `.reporting__block__value__trend--negative` — direction: down (red)
- `.reporting__block__value__trend--none` — direction: none / no movement (muted)

**Two visual variants per tile** depending on data shape:
- *Progress variant* — bar (ApexCharts) + percentage label. Used for count-style KPIs (Total Clients, Total Prospects, Circles, Teams).
- *Sparkline variant* — area sparkline + eye icon (opens chart modal). Used for currency KPIs (Total Revenue, Unpaid Invoices, Open Estimates, Open Proposals).

Some tiles have a **multi-link dropdown variant** of the View button instead of a single anchor — rendered as `.dropdown` with `.dropdown-menu .dropdown-item` children. Total Clients / Total Prospects / Total Leads use this on Super Admin to split into Contacts vs Companies destinations.

### 3.2 Panel widget (`ProjectsBlockController`, `LiveStream2BlockController`, and others using `dashboard-organize-box`)

Both Projects and Activity Stream — and likely My Tasks, Files, etc. — share this shell:

```
.dashboard-organize-box.card.p-0[.dashboard-organize-box--fixed-height-N]
  .dashboard-organize-box__header
    h4.dashboard-organize-box__header-title.widget-title   ← panel title
    .widget-filters.dashboard-organize-box__header-filters ← icon row (filter, sort, refresh)
      .filter-button                                       ← each header icon button
      .dropdown-menu .dropdown-item                        ← filter/sort dropdown contents
  .dashboard-organize-box__content                         ← scrollable body holding rows
    [row markup — see §3.3 / §3.4]
  .dashboard-organize-box__footer
    .tasks-number                                          ← "Showing N Results"
    a.btn.btn-secondary.dashboard-organize-box__footer-btn ← "View All …" CTA
```

**Gotcha — inline margin override:** the `.dashboard-organize-box` element has `style="margin: 10px 15px"` written inline by Angular. Override with `margin: 0 0 12px 0 !important;`.

**Gotcha — Bootstrap `.card` chrome:** the `.card` class applies its own background and border. Set `background-color` and `border-color` explicitly on `.dashboard-organize-box.card` to take control.

**Gotcha — `--fixed-height-N` modifier:** SD applies `min-height` based on the number suffix (e.g. `--fixed-height-5` = 530px). Leave it alone; it's the correct height for a 5-item panel.

### 3.3 Project row (`projects-item` directive)

```
.dashboard-item.dashboard-item--project
  .completionData                                  ← left-edge progress sliver
  .dashboard-item__content
    .dashboard-item__info
      .first-row
        .projectClient                             ← uppercase client name
        .dot-divider
        .assignee                                  ← project leader name
      h5.dashboard-item__title                     ← project name
      .dashboard-item__statuses
        .category-pill.customColored               ← status / sector / due-date pills
          .category-pill__text                     ← pill label (inline color from data)
          .category-pill__background               ← pill bg layer (inline color from data)
  .contact2-filter__actions                        ← right-side action icon row
    a.icon.contact2-filter__contact-link           ← each icon: folder, kanban, notes,
                                                     calendar, timer, tasks, view (×7)
```

**Pill colors come from project data**, set as inline `style="background-color: rgb(…)"` on `.category-pill__background` and matching color on `.category-pill__text`. Do **not** override these — they encode meaningful state. Adjust `.category-pill__background { opacity }` if you want them to read softer against your palette.

### 3.4 Activity Stream row (`live-stream-item` directive)

```
.dashboard-item.dashboard-item--live-stream
  .targets-avatar
    sd-user-avatar
      figure.avatar.sd-user-avatar
        ng-bind-html
          .default-user-avatar-container           ← initials fallback wrapper
            .default-user-avatar                   ← e.g. "JD" inline
          [or <img> if user has avatar uploaded]
  .dashboard-item__content
    .dashboard-item__info
      .first-row
        span                                       ← "Section" tag (uppercase action name)
        .dot-divider
        span                                       ← user name
      h5.dashboard-item__title                     ← activity description (allow wrapping!)
      .text-muted.small                            ← timestamp
```

**Important difference from project rows:** activity titles need `white-space: normal` and `overflow: visible` — they're descriptive sentences that should wrap, not nowrap-truncate like project names.

---

## 4. The Per-Block Injected `<style>` Trap

This is the single biggest source of "why is my CSS not working" on dashboards.

**SD writes a per-widget `<style>` tag inline next to every reporting/panel widget**, populated from the widget's edit-modal options (border color, padding, font color, etc.). Example:

```html
<style class="ng-binding ng-scope">
  .cbe-block-1778177927305 .reporting__block { padding-top: 16px; }
  .cbe-block-1778177927305 .reporting__block { border-color: rgb(239, 239, 239); }
  .cbe-block-1778177927305 .reporting__block .reporting__block__title__text { color: undefined !important; }
  .cbe-block-1778177927305 .reporting__block .reporting__block__value__current { color: undefined !important; }
  .cbe-block-1778177927305 .reporting__block .reporting__block__progress__value { color: undefined !important; }
  .cbe-block-1778177927305 .reporting__block .reporting__block__chart__button a { color: undefined !important; }
</style>
```

**Two problems:**

### 4.1 The `color: undefined !important` ghost

When the user hasn't set a custom color in the widget's edit modal, SD interpolates the *literal string* `undefined` into the CSS. `undefined` is invalid as a `<color>` value, but in some browser/theme combinations it falls back to `inherit`, which on a gradient-clipped element inherits the *transparent* fill — making the text render invisibly. (You see it only on selection, when the OS draws its own fill on top.)

**Fix — never rely on `background-clip: text` for value text on a dashboard.** Use solid `color`. And add `-webkit-text-fill-color: <same color>` as a sibling declaration that the bogus `color: undefined` cannot reach:

```css
#dashboard-view .reporting__block__value__current {
  color: var(--vlpd-noir) !important;
  -webkit-text-fill-color: var(--vlpd-noir) !important;
  background: none !important;          /* clears any gradient attempt */
  /* … */
}
```

Apply this dual-declaration pattern to **every text element listed in SD's per-block style**: `.reporting__block__title__text`, `.reporting__block__value__current`, `.reporting__block__value__trend` (and modifier variants), `.reporting__block__progress__value`, `.reporting__block__view-button` and any `<span>` inside it, `.reporting__block__chart__button a`.

### 4.2 The specificity loss

The injected selector is `.cbe-block-1778177927305 .reporting__block …`. The block ID class `.cbe-block-XXXXXXX` is dynamic (a different number per widget instance). Your selector `#dashboard-view .reporting__block …` has higher specificity from the ID, so when both rules use `!important`, yours wins.

**Verify in DevTools** that your rule is in fact "winning" — not just present. If SD's per-block rule is winning, increase specificity (e.g. add a parent class to your selector) or add the dual `color` + `-webkit-text-fill-color` declarations.

---

## 5. Coexistence with `lentax.css` (or any platform stylesheet)

VLP's deployment loads an external `lentax.css` (~189 KB, 8,897 lines, 207 `!important` declarations) as a *net-new component stylesheet* — its classes (`.vl-*`, `.feature-*`, `.flow-*`, `.lm-*`, `.agency-*`) do not overlap SD's widget classes at all. **Coexistence is safe** — the dashboard CSS doesn't have to fight `lentax.css` because it's targeting a disjoint set of selectors.

**Before writing dashboard CSS, audit the platform stylesheet for selector overlap.** If you find overlap, the dashboard rules need higher specificity (more parents in the selector) or load-order trickery — but the typical case is zero overlap.

**Do not edit `lentax.css` from a dashboard styling task.** It's a net-new product asset shipped to a known good state. Dashboard work happens in the theme Custom CSS slot.

---

## 6. SuiteDash Stacks — DO NOT BREAK

SD's **Stack** feature is the platform's intentional cross-page CSS/JS reuse mechanism. A Stack is a saved bundle of editor blocks (often Embed Blocks holding `<style>` and `<script>` content) that the operator inserts into multiple pages so updates propagate. Owners use Stacks deliberately. **Treat the Stack mechanism as load-bearing infrastructure — never remove, hide, or refactor it without explicit approval.**

The dashboard surface contains a known artifact: SD renders the *raw text source* of `<style>` and `<script>` content from Embed Blocks as visible text (because `ng-bind-html` HTML-encodes the angle brackets). The element is `.cbe-block-embed`. If you need to suppress the visible source dump on the dashboard specifically:

```css
/* Hide ONLY on the dashboard surface — Stack continues to distribute everywhere else */
#dashboard-view .cbe-block-embed {
  display: none !important;
}
```

**Do not** apply this rule unscoped (it would hide Stack content on all pages). **Do not** remove the Stack from the dashboard's block tree. The Owner uses it for site-wide CSS/JS distribution.

If the Owner later asks to migrate Stack contents *into* the platform stylesheet (`lentax.css`), that's a separate refactor task with its own scope.

---

## 7. ApexCharts — What You Can and Can't Restyle

KPI tiles render their progress bars and sparklines as **inline ApexCharts SVG**, not CSS. Available restyling surface:

**You can restyle from CSS:**
- The `.apexcharts-canvas` wrapper background, border-radius, overflow.
- The element containing the chart (`.reporting__block__progress__bar`, `.reporting__block__chart`).
- Anything outside the SVG itself.

**You cannot restyle from CSS (without a JS post-render hook):**
- The bar / sparkline fill color (hard-coded by SD's chart config — typically `rgba(255, 165, 0, 1)` orange).
- The `<linearGradient>` stops inside the SVG.
- The stroke color of the sparkline path.

If the orange fill bothers you, the only fix is a JS post-render hook that walks the rendered SVG and rewrites the gradient stops. That's a separate scope ticket — flag it, don't try to solve it from CSS. Your CSS can make the *track* (the area around the bar) palette-matched, which is usually enough for the dashboard to feel cohesive.

---

## 8. Layout Reorganization — Use the SD Editor, Not CSS

The dashboard layout (which row holds which widget, which widgets share a row, which rows are 4-up vs 2-up) is configured by the operator in SD's CMS-style edit mode. Each row is a `<sd-content-block-template template="Row-N-N-N" …>` element with row-type icons in the editor for swapping (1-1-1-1, 1-2-1, 1-1-1, etc.).

**Your CSS should never assume a specific row order.** Style the widgets themselves so they look correct in any row layout, then let the Owner reorganize via drag-handles.

When proposing layout changes, render a visual mockup in chat and let the Owner pick. Implementation is then 100% editor work — no CSS changes needed.

---

## 9. Dashboard-Specific Selectors Cheat Sheet

Quick-reference table for everything in §3, in the order you'd typically style them:

| Element | Selector |
|---|---|
| Surface root | `#dashboard-view` |
| KPI row shell | `.reporting__container` |
| KPI tile | `.reporting__block` |
| KPI label text | `.reporting__block__title__text` |
| KPI icon container | `.reporting__block__title__icon` |
| KPI icon SVG | `.reporting__block__title__icon-svg` |
| KPI big number | `.reporting__block__value__current` |
| KPI trend pill | `.reporting__block__value__trend` (+ `--positive` / `--none` / `--negative`) |
| KPI progress bar wrapper | `.reporting__block__progress__bar` |
| KPI progress text | `.reporting__block__progress__value` |
| KPI sparkline wrapper | `.reporting__block__chart` |
| KPI eye-icon | `.eye-icon` |
| KPI view-button | `.reporting__block__view-button` |
| Panel shell | `.dashboard-organize-box.card` |
| Panel header | `.dashboard-organize-box__header` |
| Panel title | `.dashboard-organize-box__header-title.widget-title` |
| Panel filter icon | `.dashboard-organize-box__header-filters .filter-button` |
| Panel content | `.dashboard-organize-box__content` |
| Panel footer | `.dashboard-organize-box__footer` |
| Panel footer CTA | `.dashboard-organize-box__footer-btn` |
| Project row | `.dashboard-item.dashboard-item--project` |
| Project title | `.dashboard-item__title` |
| Project status pill | `.category-pill.customColored` |
| Project action icons | `.contact2-filter__contact-link` |
| Activity row | `.dashboard-item.dashboard-item--live-stream` |
| Activity avatar | `.targets-avatar .sd-user-avatar` |
| Activity initials fallback | `.default-user-avatar` |
| Embed-block (Stack source artifact) | `.cbe-block-embed` |

---

## 10. Pre-Flight Checklist for a Dashboard Restyle

Before writing any CSS:

- [ ] Confirm with Owner: which dashboard role(s) are in scope? (Super Admin, Staff, Client.)
- [ ] Confirm with Owner: which CSS slot to use? (Theme-level Custom CSS is the answer 95% of the time.)
- [ ] Confirm with Owner: palette and typography source-of-truth for the brand being styled.
- [ ] Audit the platform stylesheet (e.g. `lentax.css`) for selector overlap. Expect zero — confirm.
- [ ] Capture the rendered DOM for the dashboard and the target role. Static HTML is a trap (§2).
- [ ] Identify per-widget injected `<style>` tags. Note every selector and property they override (§4).

While writing CSS:

- [ ] Every rule scoped under `#dashboard-view`.
- [ ] Every text-color rule has a paired `-webkit-text-fill-color` declaration (§4.1).
- [ ] No `background-clip: text` / gradient-clipped text on widget content.
- [ ] Override of inline `margin: 10px 15px` on `.dashboard-organize-box` (§3.2).
- [ ] Activity row titles allow wrapping (`white-space: normal`); project row titles do not.
- [ ] No rule attempts to restyle the inside of an ApexCharts SVG.
- [ ] No rule hides Stack content unscoped — `.cbe-block-embed` rules are `#dashboard-view`-scoped only.
- [ ] Brace balance is even.
- [ ] `prefers-reduced-motion` media query present.

After deploy:

- [ ] All KPI tiles render with visible numbers (not the `color: undefined` ghost).
- [ ] All trend pills render in the correct semantic color (positive=green, negative=red, none=muted).
- [ ] Panel headers, content, and footers all themed consistently.
- [ ] Project rows show pills with their data-driven colors intact.
- [ ] Activity rows wrap their descriptive text correctly.
- [ ] Action icons hover-state without layout shift.
- [ ] Stack content still distributes on every other page (spot-check at least one non-dashboard page).
- [ ] Sidebar, top bar, and modals are *visually unchanged* outside `#dashboard-view`.

---

## 11. The Dashboard-Specific Iteration Anti-Pattern

When a dashboard rule isn't taking effect, the temptation is to add specificity (more parent classes) or another `!important`. Resist. Instead:

1. **Inspect the element in DevTools** with the role you're styling for actually logged in. Look at the *Computed* pane to see which rule won, and the *Styles* pane to see who wrote the inline style if the property is being overridden by inline.
2. **Search for the property in SD's per-widget `<style>` tag** — does it match `.cbe-block-XXXXXXX .your-selector { property: undefined !important }` or similar? If so, the issue is §4.1 (the ghost), not specificity. Add `-webkit-text-fill-color`.
3. **Check whether the class you're targeting actually exists on the rendered element.** If it doesn't, you're styling the static-HTML skeleton, not the live widget — go back to §2 and re-recon.
4. **Check whether you're inside `#dashboard-view`.** Some elements (modals opened from the dashboard, dropdowns) render in a portal outside the dashboard scope — your rule won't reach them.

If you find yourself writing more than two `!important` on the same property of the same element, stop. The third `!important` doesn't beat the first two — you have a different problem (probably §4 ghost, possibly §2 wrong-class).

---

## 12. When to Ask the Owner Before Shipping

**Ask first if:**
- The dashboard is live on a customer-facing subdomain.
- The change affects multiple roles' dashboards, not just the one you tested.
- You want to migrate Stack contents into the platform stylesheet (out of scope for normal restyling — separate refactor).
- You need to add JS to the theme JS slot (a JS error there breaks the entire SD shell on every page, not just the dashboard).
- The change touches the SD chrome (sidebar, top bar) — these are outside `#dashboard-view` for a reason.

**Ship without asking if:**
- It's a CSS-only change scoped under `#dashboard-view`.
- You followed §10's checklist and validation passes.
- The role's dashboard is on a private staging subdomain.

---

## 13. Update This Doc

When you discover a new dashboard widget controller, a new gotcha in the per-widget `<style>` injection, or a new selector convention SD has rolled out — append it. Especially: every new role's dashboard may surface widgets not seen on Super Admin (e.g. Client dashboards have onboarding progress widgets, calendar widgets, file-share widgets). Capture their selectors here so the next Claude doesn't redo the recon from scratch.

This doc handles only the live admin dashboard surface.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Imported into `style-spec/` | JLW |
