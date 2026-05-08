---
config_for: stack-js
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: Stack editor (no modal — direct text body)
---

# Module Config — Stack > JS

JavaScript payload for a SuiteDash Stack. Body IS the JS code (no `<script>` wrapper).

## Frontmatter additions

```yaml
module_type: stack-js
parent_stack_slug: {e.g. 29355_Stacks_Pages}
sd_stack_uuid: {SD stack UUID}
sd_stack_name: {SD's name for the stack}
sd_pages_consuming:
  - {SD page path}
```

## Body shape

Raw JavaScript. No HTML wrapper.

```javascript
(function () {
  'use strict';
  // ... code ...
})();
```

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| {today} | Initial scaffold from `module-config/stack-js.md` | {editor} |
