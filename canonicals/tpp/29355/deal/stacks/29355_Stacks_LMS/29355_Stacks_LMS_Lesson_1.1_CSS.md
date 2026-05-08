---
slug: 29355_Stacks_LMS_Lesson_1.1_CSS
module_type: stack-css
sd_item_id: 29355
platform: tpp
cu_page_id: 80djf-708417
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-708417'
cu_parent_page_id: 80djf-708257
cu_path: >-
  Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_LMS >
  29355_Stacks_LMS_Lesson_1.1_CSS
last_synced: '2026-05-08'
last_editor: JLW
status: live
parent_stack_slug: 29355_Stacks_LMS
---
<style>
/* ============================================================
   Lesson 1.1 — Meet Zuri
   Scope: .lms-lesson-1-1 only (does not leak to other lessons)
   Surface: SuiteDash LMS lesson body (sd-lms style spec)
   ============================================================ */

.lms-lesson-1-1 {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 0;
  font-family: 'Roboto', sans-serif;
}

/* ---------- Video block ---------- */

.lms-lesson-1-1 .lms-block-video {
  margin-bottom: 28px;
}

.lms-lesson-1-1 .lms-video-wrap {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(180, 30, 60, 0.08);
}

.lms-lesson-1-1 .lms-video-wrap figure {
  margin: 0;
}

.lms-lesson-1-1 .lms-video-wrap .embed-content {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  background: #1a1a1a;
}

.lms-lesson-1-1 .lms-video-wrap .embed-content iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* ---------- Text block ---------- */

.lms-lesson-1-1 .lms-block-text {
  max-width: 620px;
  margin: 0 auto 32px;
}

.lms-lesson-1-1 .lms-block-text p {
  font-size: 18px;
  line-height: 1.75;
  color: #2a2a2a;
  text-align: center;
  letter-spacing: 0.1px;
  margin: 0;
}

.lms-lesson-1-1 .lms-lead {
  display: block;
  font-size: 22px;
  font-weight: 500;
  color: #c2185b;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.lms-lesson-1-1 .lms-highlight {
  font-style: normal;
  font-weight: 500;
  color: #1a1a1a;
  border-bottom: 2px solid #f4c0d1;
  padding-bottom: 1px;
}

.lms-lesson-1-1 .lms-emphasis {
  font-style: italic;
  color: #555555;
}

/* ---------- Button blocks ---------- */

.lms-lesson-1-1 .lms-block-button {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.lms-lesson-1-1 .lms-btn {
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

.lms-lesson-1-1 .lms-btn::after {
  content: "→";
  font-size: 18px;
  line-height: 1;
}

.lms-lesson-1-1 .lms-btn-support {
  padding: 14px 28px;
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(194, 24, 91, 0.25);
}

.lms-lesson-1-1 .lms-btn-support:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(194, 24, 91, 0.32);
  color: #ffffff;
  text-decoration: none;
}

.lms-lesson-1-1 .lms-btn-next {
  padding: 13px 26px;
  background: transparent;
  color: #c2185b;
  border: 1.5px solid #e91e63;
}

.lms-lesson-1-1 .lms-btn-next:hover {
  transform: translateY(-1px);
  background: rgba(233, 30, 99, 0.04);
  color: #c2185b;
  text-decoration: none;
}

/* ---------- Separator ---------- */

.lms-lesson-1-1 .lms-separator {
  border: 0;
  border-top: 1px solid #f0d4da;
  margin: 32px 0;
}
</style>

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Initial authoring. Lesson 1.1 — Meet Zuri. Empty scaffold; styling rules deferred. | JLW |
| 2026-05-08 | Initial CSS authoring. Rose-gradient pill buttons, centered layout, .lms-lead / .lms-highlight / .lms-emphasis text accents. Scoped to .lms-lesson-1-1. Visual direction matches TPP landing page. | JLW |
