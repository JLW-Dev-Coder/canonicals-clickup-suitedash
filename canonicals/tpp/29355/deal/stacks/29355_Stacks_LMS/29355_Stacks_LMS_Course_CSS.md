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
   29355_Stacks_LMS_Course_CSS — course-level chrome for TPP LMS
   Pasted into SuiteDash at: LMS → Course Meta → Custom CSS
   Scope: SD-owned chrome (sidebar nav, navbar header).
   Per-lesson body styling lives in 29355_Stacks_LMS_Lesson_{N.M}_CSS.
   ============================================================ */

.panel-preview__sidebar {
  background: #1a1a1a;
  border-right: 1px solid #2a2a2a;
}

.panel-preview__sidebar .navbar-header {
  padding: 20px 0;
  border-bottom: 1px solid #2a2a2a;
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
  margin: 0;
  list-style: none;
}

.panel-preview__sidebar .module-item {
  border: 0 !important;
  margin: 4px 20px;
}

.panel-preview__sidebar .module-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  color: #aaaaaa;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
}

.panel-preview__sidebar .module-title:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
}

.panel-preview__sidebar .module-item:has(.lessons.show) > .module-title,
.panel-preview__sidebar .module-title:not(.collapsed) {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.12), rgba(194, 24, 91, 0.08));
  border-left: 3px solid #e91e63;
  color: #ffffff;
  padding-left: 11px;
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
  padding: 4px 0 4px 14px;
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
  padding: 9px 12px;
  color: #888888;
  font-size: 12.5px;
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
</style>

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Initial authoring. Sidebar restyle: dark surface, rose-accented active states, collapsed/expanded chevron, lesson-item hover and active states. Scoped to `.panel-preview__sidebar`. | JLW |
