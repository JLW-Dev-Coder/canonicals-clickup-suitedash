---
config_for: stack-js
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: Stack editor (no modal — direct text body)
---

# Module Config — Stack > JS

JavaScript payload for a SuiteDash Stack. The repo file body wraps the JS in `<script>...</script>` tags inline. SD pastes the body verbatim into the stack editor.

## Frontmatter additions

```yaml
body_type: stack-js
parent_stack_slug: {e.g. 29355_Stacks_Pages}
sd_stack_uuid: {SD stack UUID}
sd_stack_name: {SD's name for the stack}
sd_pages_consuming:
  - {SD page path}
```

## Body shape

The body is the FULL paste-ready JS payload, including the `<script>` wrapper.

```
<script>
(function () {
  'use strict';
  // ... code ...
})();
</script>
```

The `<script>` opening tag is the FIRST line of the body. The `</script>` closing tag is the LAST line before the change log section.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| {today} | Initial scaffold from `module-config/stack-js.md` | {editor} |
