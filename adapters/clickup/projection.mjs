// projection.mjs — the measured contract for what a ClickUp round trip preserves, and the
// projection any comparison against a rendered ClickUp description must run in.
//
// [R-19] GENERATOR DECLARATION: this module writes NOTHING. It defines two pure functions and
// records what was measured to justify them.
//
// ── WHAT CLICKUP DOES TO A BODY, MEASURED ────────────────────────────────────────────────
// adapters/clickup/cu-write-probe.mjs sent a body containing a heading, bold, inline code, an
// ordered list and a fenced block, and printed exactly what came back. ClickUp ACCEPTS
// `markdown_description` and stores it as rich text; on read it returns `description` and
// `text_content` as the PLAIN-TEXT RENDERING — `#`, `**`, backticks, `- `, `1. ` and the fence
// markers are all gone, and everything between them survives byte for byte, em dashes, middots
// and quotes included. Nothing is truncated: a 49,693-char body came back as 46,048 chars of
// content with only the syntax removed.
//
// TWO CONSEQUENCES, AND THEY ARE WHY THIS FILE IS r2 RATHER THAN r1:
//
//   1. ORDINAL LIST MARKERS DO NOT SURVIVE. The first draft numbered the options with a
//      markdown ordered list, so the option INDEX — the thing this file goes out of its way to
//      say is significant — was the one part of the option line that a reader of the API would
//      not get back. The index is now written as literal `[n]` text, which is not syntax and
//      cannot be normalised away. Order is stated AND numbered in both renderings.
//
//   2. A COMPARISON AGAINST THE SENT BYTES IS MEANINGLESS. Verification compares MARK-STRIPPED
//      projections, via stripMarks() below, which both the probe and --verify import from here
//      so the two cannot drift apart into disagreeing about what survival means.
//
// No raw HTML is emitted anywhere in this file. What ClickUp does with an HTML tag inside a
// markdown body was not measured, and an unmeasured construct is not one to put 959 tasks on.

// The projection a token and a returned body are compared IN. Removes the inline syntax
// ClickUp strips and collapses whitespace; changes nothing else.
//
// UNDERSCORE IS DELIBERATELY NOT STRIPPED. It is markdown emphasis syntax, but it is also in
// the middle of every property name this list exists to record — `irs433_tp_ssn_itin` — and a
// projection that removes it would compare `irs433tpssnitin` on both sides and go on agreeing
// with itself if ClickUp ever did mangle one. The probe measured underscores surviving. If
// that ever stops being true, --verify reports it as a fault, which is the point: a masked
// difference is worse than a detected one. Same reasoning as [R-31] — prefer the assertion
// that would notice over the one tuned to the current reading.
export function stripMarks(s) {
  return String(s).replace(/[`*#]/g, '').replace(/\s+/g, ' ').trim();
}

// A whole LINE, as ClickUp renders it: the leading list marker is syntax and goes too. Applied
// only where the thing being compared is known to be a line — never to a bare token, where a
// leading "- " could be content.
export function stripLine(s) {
  return stripMarks(String(s).replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
}
