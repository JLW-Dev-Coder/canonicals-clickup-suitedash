---
config_for: m014-landing-pages
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: SuiteDash Pages → Page Editor → Text Block (raw HTML body)
---

# Module Config — M014 Landing Pages

HTML payload for a SuiteDash Page rendered at `secure.virtuallaunch.pro/i/{token}`. The repo file body is raw HTML; SD's Page Editor pastes it verbatim into a Text Block.

Styling is NOT inline. Landing-page HTML is styled by the brand's `Stacks_Pages_CSS` body (the Stack-triad CSS for Pages — see `style-spec/sd-pages.md`). Authoring an instance assumes that CSS is already deployed for the item.

## Frontmatter additions

```yaml
body_type: m014-landing-pages
landing_index: {N — the "Landing Page N" sequence number for this item}
sd_page_token: {public token segment of the secure.virtuallaunch.pro/i/{token} URL, if known}
sd_page_path: {SD Pages path that hosts this content}
```

## Body shape

Raw HTML. No markdown fences, no `<style>` or `<script>` wrappers. Root element is the brand-prefixed landing-page wrapper per `style-spec/sd-pages.md` §4 — for TPP that's `<div class="tpp-lp">…</div>`.

```
<div class="tpp-lp">
  <h1 class="tpp-head">…</h1>
  <p class="tpp-sub">…</p>
  …
</div>
```

The CTA sentence in `.tpp-sub` should render on its own line — break the preceding sentence from the CTA with `<br>` rather than a new paragraph, so the spacing matches the spec.

## Where it renders

- SD Pages, served at `secure.virtuallaunch.pro/i/{token}` for the item's deal flow.
- Visual styling comes from `29355_Stacks_Pages_CSS` (or the per-item equivalent). See `style-spec/sd-pages.md`.

## Style coupling

- Style spec: [`style-spec/sd-pages.md`](../style-spec/sd-pages.md)
- Companion stack-css: `canonicals/tpp/{sd_item_id}/deal/stacks/{sd_item_id}_Stacks_Pages/{sd_item_id}_Stacks_Pages_CSS.md`
- Companion stack-js: `canonicals/tpp/{sd_item_id}/deal/stacks/{sd_item_id}_Stacks_Pages/{sd_item_id}_Stacks_Pages_JS.md`

Any selector used in the landing-page HTML MUST exist in the companion stack-css, or the page renders unstyled.

## Authoring / editing

1. CU page is the human-readable mirror. Repo file is source of truth.
2. Edit the body in the repo, run `npm run sync:cu -- push <slug>` to publish to CU.
3. SD's Page Editor is updated by Owner pasting the rendered body from CU into the Text Block.
4. If Owner edits in CU directly, run `npm run sync:cu -- pull <slug>` first to bring those edits back, then resume edits in the repo.

## Canonical path convention

Landing pages sit under the Deal branch alongside Stacks (since they are styled by the Pages stack):

```
canonicals/{platform}/{sd_item_id}/deal/landings/landing-page-{N}.md
```

`computeModulePath` does not have a branch for this type today — first instances are placed by hand. If/when a `cu:create` flow is added for landing pages, extend `scripts/_lib/paths.ts` to mirror the convention above.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| 2026-05-08 | Initial config. First instance: Landing Page 1 — Tax Prep Setup Explore_HTML (CU 80djf-701737). | JLW |
