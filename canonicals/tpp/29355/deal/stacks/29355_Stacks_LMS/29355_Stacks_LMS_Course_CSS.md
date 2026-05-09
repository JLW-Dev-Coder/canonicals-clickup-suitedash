---
slug: 29355_Stacks_LMS_Course_CSS
body_type: stack-css
sd_item_id: 29355
platform: tpp
cu_page_id: 80djf-708457
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-708457'
cu_parent_page_id: 80djf-708257
cu_path: >-
  Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_LMS >
  29355_Stacks_LMS_Course_CSS
last_synced: '2026-05-09'
last_editor: JLW
status: live
parent_stack_slug: 29355_Stacks_LMS
---
<style>
/* ============================================================
   29355_Stacks_LMS_Course_CSS — course-level CSS for TPP LMS
   Pasted into SuiteDash at: LMS → Course Meta → Custom CSS
   Scope:
     1. SD-owned chrome (sidebar nav, navbar header)
     2. Per-lesson wrapper rules (scoped to .lms-lesson-{N-N})
     3. Lesson body content styling (hoisted globals shared by every lesson)
   ============================================================ */

/* ============================================================
   Section 1 — SD chrome (sidebar, navbar)
   ============================================================ */

.panel-preview__sidebar {
  background: #0f0f0f;
  border-right: 1px solid #2a2a2a;
}

.panel-preview__sidebar .navbar-header {
  padding: 24px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-preview__sidebar .navbar-header .navbar-brand {
  background: #fbeaf0 !important;
  border-radius: 8px;
  margin: 0 20px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-preview__sidebar .modules.side-menu {
  padding: 16px 0;
  margin: 12px 0 0;
  list-style: none;
}

.panel-preview__sidebar .module-item {
  border: 0 !important;
  margin: 4px 12px;
}

.panel-preview__sidebar .module-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  color: #aaaaaa;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.panel-preview__sidebar .module-title:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
}

.panel-preview__sidebar .module-item:has(.lessons.show) > .module-title,
.panel-preview__sidebar .module-title:not(.collapsed) {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.12), rgba(194, 24, 91, 0.08));
  box-shadow: inset 2px 0 0 #e91e63;
  border-radius: 8px;
  color: #ffffff;
}

.panel-preview__sidebar .module-title .fa-chevron-up {
  color: #e91e63;
  font-size: 11px;
  transition: transform 0.2s ease;
}

.panel-preview__sidebar .module-title.collapsed .fa-chevron-up {
  transform: rotate(180deg);
  color: #555555;
}

.panel-preview__sidebar .lessons {
  list-style: none;
  padding: 4px 0 4px 10px;
  margin-top: 4px;
  border-left: 1px solid rgba(233, 30, 99, 0.2);
  border-top: 0 !important;
}

.panel-preview__sidebar .lesson-item {
  margin: 0;
}

.panel-preview__sidebar .lesson-item a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  color: #888888;
  font-size: 12.5px;
  line-height: 1.5;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease;
}

.panel-preview__sidebar .lesson-item a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
  text-decoration: none;
}

.panel-preview__sidebar .lesson-item.active a {
  color: #ffffff;
  background: rgba(233, 30, 99, 0.18);
}

.panel-preview__sidebar .lesson-item a .fa-circle {
  font-size: 7px;
  color: #555555;
  flex-shrink: 0;
}

.panel-preview__sidebar .lesson-item.active a .fa-solid.fa-circle {
  color: #e91e63;
}

/* Footer actions bar + Prev/Next buttons */
.panel-preview__footer-actions {
  background: #0f0f0f;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 24px;
}

.panel-preview__btn.panel-preview__btn--prev,
.panel-preview__btn.panel-preview__btn--next {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: #ffffff !important;
  border: none;
  border-radius: 999px;
  padding: 10px 24px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.panel-preview__btn.panel-preview__btn--prev:hover,
.panel-preview__btn.panel-preview__btn--next:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.35);
  color: #ffffff !important;
}

/* ============================================================
   Section 2 — Per-lesson wrapper (scoped per-lesson)
   Each lesson may have different wrapper constraints (max-width,
   padding). Keep these scoped so a future lesson can override.
   Top spacing lives on .panel-preview__content so every lesson
   in the course gets ≥56px clearance from the content-area top
   regardless of which wrapper class the lesson body uses.
   ============================================================ */

.panel-preview__content {
  padding-top: 56px;
}

.lms-lesson-1-1 {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 0 32px;
  font-family: 'Roboto', sans-serif;
}

/* ============================================================
   Section 3 — Lesson body content (hoisted globals)
   Shared across every lesson in the course. Rules are bare —
   no .lms-lesson-{N-N} prefix — because the visual treatment
   (brand pill buttons, text accents, video framing, separator)
   is identical on every lesson.
   ============================================================ */

/* ---------- Video block ---------- */

.lms-block-video {
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
}

.lms-video-wrap {
  width: min(320px, 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(180, 30, 60, 0.08);
}

.lms-video-wrap figure {
  margin: 0;
}

.lms-video-wrap .embed-content {
  position: relative;
  padding-bottom: 177.78%;
  height: 0;
  background: #1a1a1a;
}

.lms-video-wrap .embed-content iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* ---------- Text block ---------- */

.lms-block-text {
  max-width: 620px;
  margin: 0 auto 32px;
}

.lms-block-text p,
.wysiwyg-content .lms-block-text p {
  font-size: 18px;
  line-height: 1.75;
  color: #2a2a2a;
  text-align: center;
  letter-spacing: 0.1px;
  margin: 0;
}

.lms-lead {
  display: block;
  font-size: 22px;
  font-weight: 500;
  color: #c2185b;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.lms-highlight {
  font-style: normal;
  font-weight: 500;
  color: #1a1a1a;
  border-bottom: 2px solid #f4c0d1;
  padding-bottom: 1px;
}

.lms-emphasis {
  font-style: italic;
  color: #555555;
}

/* ---------- Button blocks ---------- */

.lms-block-button {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.lms-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  border-radius: 999px;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.lms-btn::after {
  content: "→";
  font-size: 18px;
  line-height: 1;
}

.lms-btn-support {
  padding: 14px 28px;
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(194, 24, 91, 0.25);
}

.lms-btn-support:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(194, 24, 91, 0.32);
  color: #ffffff;
  text-decoration: none;
}

.lms-btn-next {
  padding: 13px 26px;
  background: transparent;
  color: #c2185b;
  border: 1.5px solid #e91e63;
}

.lms-btn-next:hover {
  transform: translateY(-1px);
  background: rgba(233, 30, 99, 0.04);
  color: #c2185b;
  text-decoration: none;
}

/* ---------- Separator ---------- */

.lms-separator {
  border: 0;
  border-top: 1px solid #f0d4da;
  margin: 32px 0;
}

/* ---------- Checklist block ---------- */

.lms-block-checklist {
  max-width: 620px;
  margin: 0 auto 32px;
}

.lms-block-checklist ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lms-block-checklist li,
.wysiwyg-content .lms-block-checklist li {
  position: relative;
  padding: 10px 0 10px 32px;
  font-size: 17px;
  line-height: 1.6;
  color: #2a2a2a;
  border-bottom: 1px solid #f5e1e6;
}

.lms-block-checklist li:last-child {
  border-bottom: 0;
}

.lms-block-checklist li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Initial authoring. Sidebar restyle: dark surface, rose-accented active states, collapsed/expanded chevron, lesson-item hover and active states. Scoped to `.panel-preview__sidebar`. | JLW |
| 2026-05-08 | Migrated all lesson body styling from `29355_Stacks_LMS_Lesson_1.1_CSS` into this course-level body. Hoisted button/text/video rules to bare globals; kept `.lms-lesson-1-1` wrapper scoped per-lesson. | JLW |
| 2026-05-08 | Added `.lms-block-checklist` rules. Pink gradient ✓ bullets, hairline separators, 620px max-width centered. Used on `*.4` "How to Customize" lessons. | JLW |
| 2026-05-08 | Sidebar polish: module-title `line-height: 1.4` for wrapped long titles; replaced active 3px `border-left` + padding-compensation with `inset 2px 0 0` box-shadow (no padding math); module-item margin 20px → 12px; lessons padding-left 14px → 10px; lesson-item `line-height: 1.5` and padding 9px/12px → 8px/10px; `.modules.side-menu` margin-top: 12px so first module isn't flush with banner; navbar-header padding 20px → 24px and border-bottom strengthened to `rgba(255,255,255,0.06)`. Top-spacing fix: hoisted `padding-top: 56px` from `.lms-lesson-1-1` to `.panel-preview__content` so it applies course-wide regardless of wrapper class. Wysiwyg cascade: escalated `.lms-block-text p` and `.lms-block-checklist li` with a `.wysiwyg-content` ancestor selector to outrank SD's `.wysiwyg-content p` color rule (equal specificity otherwise — source order would have decided). | JLW |
