---
config_for: stack-css
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: Stack editor (no modal — direct text body)
---

# Module Config — Stack > CSS

CSS payload for a SuiteDash Stack. The repo file body IS the CSS code (no `<style>` wrapper — added at SD-paste time).

## Frontmatter additions

```yaml
module_type: stack-css
parent_stack_slug: {e.g. 29355_Stacks_Pages}
sd_stack_uuid: {SD stack UUID — uuid query param from the stack editor URL}
sd_stack_name: {SD's name for the stack}
sd_pages_consuming:
  - {SD page path that uses this stack}
```

## Body shape

Raw CSS. No HTML wrapper. Change log at bottom.

```css
/* Author or paste CSS here. */

:root {
  /* Tokens */
}

/* ... rules ... */
```

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| {today} | Initial scaffold from `module-config/stack-css.md` | {editor} |
