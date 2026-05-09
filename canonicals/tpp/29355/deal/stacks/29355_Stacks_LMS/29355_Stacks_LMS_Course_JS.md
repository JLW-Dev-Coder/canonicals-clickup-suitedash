---
slug: 29355_Stacks_LMS_Course_JS
body_type: stack-js
sd_item_id: 29355
platform: tpp
cu_page_id: 80djf-708477
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-708477'
cu_parent_page_id: 80djf-708257
cu_path: >-
  Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_LMS >
  29355_Stacks_LMS_Course_JS
last_synced: null
last_editor: JLW
status: live
parent_stack_slug: 29355_Stacks_LMS
---
# 29355_Stacks_LMS_Course_JS

Course-level JS for the Tax Prep Pro Setup Guide LMS course. Pasted into SuiteDash at **LMS → Course Meta → Custom JS** (course-scope), not into a per-lesson JS field. Runs on every lesson page in the course.

## What it does

**Next-lesson resolver.** Lesson HTML bodies place a button with `<a class="lms-btn-next" data-lesson-next="N.M" href="#placeholder">`. This script reads SD's sidebar at page load, finds the lesson matching `data-lesson-next` by title prefix (`"Lesson N.M"`), and rewrites the button's `href` to the real URL. Lesson authors don't hand-wire URLs.

Scope-agnostic: queries `[data-lesson-next]` anywhere on the page. Only one lesson body renders at a time, so no cross-lesson conflict. Idempotent via `data-lms-next-resolved` guard. Polls SD's Angular sidebar for up to 3 seconds.

<script>
(function () {
  'use strict';

  var BUTTON_SELECTOR = '[data-lesson-next]';
  var SIDEBAR_SELECTOR = '.modules.side-menu';
  var LESSON_LINK_SELECTOR = '.lesson-item a';
  var POLL_INTERVAL_MS = 100;
  var POLL_TIMEOUT_MS = 3000;

  function findSidebarLessonLinks() {
    var sidebar = document.querySelector(SIDEBAR_SELECTOR);
    if (!sidebar) return null;
    return sidebar.querySelectorAll(LESSON_LINK_SELECTOR);
  }

  function resolveNextLessonUrl(lessonNumber, sidebarLinks) {
    var prefix = 'Lesson ' + lessonNumber;
    for (var i = 0; i < sidebarLinks.length; i++) {
      var link = sidebarLinks[i];
      var text = (link.textContent || '').trim();
      if (text.indexOf(prefix) === 0) {
        var href = link.getAttribute('ng-href') || link.getAttribute('href');
        if (href && href !== '' && href !== '#') {
          return href;
        }
      }
    }
    return null;
  }

  function rewriteNextButtons() {
    var buttons = document.querySelectorAll(BUTTON_SELECTOR);
    if (!buttons.length) return true;

    var sidebarLinks = findSidebarLessonLinks();
    if (!sidebarLinks || !sidebarLinks.length) return false;

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.dataset.lmsNextResolved === 'true') continue;

      var lessonNumber = btn.getAttribute('data-lesson-next');
      if (!lessonNumber) continue;

      var resolvedUrl = resolveNextLessonUrl(lessonNumber, sidebarLinks);
      if (resolvedUrl) {
        btn.setAttribute('href', resolvedUrl);
        btn.dataset.lmsNextResolved = 'true';
      } else {
        if (window.console && window.console.warn) {
          window.console.warn('[lms-course-js] Could not resolve next-lesson URL for "Lesson ' + lessonNumber + '". Sidebar link not found or has empty href.');
        }
      }
    }

    return true;
  }

  function pollUntilResolved() {
    var elapsed = 0;
    var interval = setInterval(function () {
      var done = rewriteNextButtons();
      elapsed += POLL_INTERVAL_MS;
      if (done || elapsed >= POLL_TIMEOUT_MS) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pollUntilResolved);
  } else {
    pollUntilResolved();
  }
})();
</script>

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Initial authoring. Migrated from per-lesson `29355_Stacks_LMS_Lesson_1.1_JS` to course-level pattern. Resolver is now scope-agnostic — queries `[data-lesson-next]` globally. Idempotent via dataset guard. ES5-safe. | JLW |
