---
config_for: stack-css
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: Stack editor (no modal — direct text body)
---

# Module Config — Stack > CSS

CSS payload for a SuiteDash Stack. The repo file body wraps the CSS in `<style>...</style>` tags inline. SD pastes the body verbatim into the stack editor.

## Frontmatter additions

```yaml
body_type: stack-css
parent_stack_slug: {e.g. 29355_Stacks_Pages}
sd_stack_uuid: {SD stack UUID — uuid query param from the stack editor URL}
sd_stack_name: {SD's name for the stack}
sd_pages_consuming:
  - {SD page path that uses this stack}
```

## Body shape

The body is the FULL paste-ready CSS payload, including the `<style>` wrapper. SD's stack editor expects literal `<style>` and `<script>` tags in the body (it's an HTML-context paste field, not a scoped CSS field).

```
<style>
/* tokens */
:root {
  --tpp-rose: #E91E63;
  /* ... */
}

/* rules */
.tpp-form-head { /* ... */ }

/* media queries */
@media (max-width: 768px) {
  /* ... */
}
</style>
```

The `<style>` opening tag is the FIRST line of the body. The `</style>` closing tag is the LAST line before the change log section.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| {today} | Initial scaffold from `module-config/stack-css.md` | {editor} |
