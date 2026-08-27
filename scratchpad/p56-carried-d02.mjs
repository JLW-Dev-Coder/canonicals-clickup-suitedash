// Supersede [D-02] in the cross-form register with evidence, and raise [D-26] — prompt 56 commit 2.
//
// [R-21]: a superseded finding is kept VERBATIM with what it got right and wrong. Every field
// [D-02] landed with is carried into the resolved entry unchanged, including its original
// `status` string, which says something the new one cannot ("scope change recorded rather than
// absorbed") and would be erased by overwriting it.
//
// [D-02] asked ONE question and this cycle answered it: can 433-H be filled, and by what route.
// It does NOT decide which route to take, because that decision is not an engineering one — it
// turns on what a filed document is allowed to be, and that belongs to Principal and JLW. So the
// answered half resolves and the unanswered half is raised as [D-26] rather than folded into the
// resolution, where it would read as settled.
//
// JSON is written with ONE-SPACE indent, this tree's convention for these sidecars.
import { readFileSync, writeFileSync } from 'node:fs';

const REG = 'adapters/pdf/maps/_carried.cross-form.json';
const FSET = 'adapters/pdf/maps/433h.xfa-fieldset.json';

const reg = JSON.parse(readFileSync(REG, 'utf8'));
const fset = JSON.parse(readFileSync(FSET, 'utf8'));

// EVERY FIGURE BELOW IS READ OUT OF THE DERIVED ARTEFACT. None is typed, so a re-derivation that
// changed one of them changes this entry too rather than leaving it standing over a stale number.
const F = fset.counts.fields;
const BINDABLE = fset.counts.fields_a_datasets_packet_could_reach;
const REFUSED = fset.counts.fields_the_template_refuses_to_bind;
const PACKETS = fset.packets.map((p) => p.name).join(', ');
const SHA = fset._source_sha256;

const d02 = reg.open.find((e) => e.id === 'D-02');
if (!d02) { console.error('[D-02] is not open in ' + REG); process.exit(2); }
if (reg.open.some((e) => e.id === 'D-26') || reg.resolved.some((e) => e.id === 'D-26')) {
  console.error('[D-26] already exists'); process.exit(2);
}

reg.open = reg.open.filter((e) => e.id !== 'D-02');
reg.resolved.push({
  ...d02,
  status: 'RESOLVED',
  _the_status_this_item_landed_with: d02.status,
  resolved_in: 'prompt 56',
  what_this_item_got_RIGHT: 'BOTH HALVES, AND THE SHARPER HALF WAS SHARPER THAN IT KNEW. (a) "Nothing this engine does has an input" is exactly true and the reason is now measured: pdf-lib deletes /XFA from the AcroForm on getForm(), and on 433-H that leaves ZERO fields where on 433-D it leaves 168. (b) "A pin read from an XFA packet is not evidence of the same kind" was right, and the drawn page is worse than the item supposed — it carries no revision, no catalogue number and no form number at all, only 332 characters of Adobe Reader placeholder. (c) The ruling that this becomes a SEPARATE FEASIBILITY TRACK whose first question is "do we fill an XFA form at all or author a static replica" set exactly the right question, and it is the question answered below.',
  what_this_item_got_WRONG: 'ONE THING, AND IT WIDENS THE OPTIONS RATHER THAN NARROWING THEM. "This form cannot be mapped by the current engine at all" is true of the FILL engine and false of the tree as a whole. pdfjs-dist, ALREADY A DEPENDENCY IN THIS REPO AT ^6.2.108, renders this form: with enableXfa it reports isPureXfa true, lays the template out to EIGHT pages rather than the one static page pdf-lib and a default pdfjs both see, and returns a complete XFA HTML tree. The item was written from a reading taken with XFA disabled, and the one-page answer that reading gives is what made the form look inert. It is not inert; it is unreachable by the AcroForm path only.',
  what_433H_asks: `${F} fields in the template packet, by ui kind ${JSON.stringify(fset.counts.by_ui)}. Structurally it is 433-F PLUS AN INSTALMENT AGREEMENT REQUEST: sections A (Accounts/Lines of Credit), B (Real Estate), C (Other Assets), D (Credit Cards), Investments, Digital Assets, E (Employment Information), income, and G (Monthly Necessary Living Expenses) reproduce 433-F's section lettering and its group set — 433-F's map already declares bank_accounts, investments, real_estate, other_assets, credit_cards and digital_assets — while Part 1 lines 1 to 9 are the instalment agreement request, whose routing and account cells are 433-D's comb decomposition exactly: NINE routing digits and SEVENTEEN account digits on both forms.`,
  what_it_asks_that_the_six_mapped_forms_DO_NOT: 'THE "I R S ALLOWED" COLUMN. 433-H prints every monthly living expense TWICE — "Actual Monthly Expenses" beside "I R S Allowed" — 32 cells in each column. No mapped form draws that pair: 433-F\'s expense table is single-column and carries no key matching /allow/, and 433-A(OIC)\'s three allowance keys are specific deductions rather than a per-row allowed column. IT IS NOT A TAXPAYER FACT. The allowed figure is the IRS Collection Financial Standard, which this repo already holds at adapters/pdf/maps/irs-standards-2026.json, so the column is DERIVABLE from data in the tree rather than a fact the backbone lacks. Beyond it the field-level comparison surfaces CANDIDATES and not findings, for the reason adapters/hubspot/reclassify-against-backbone.mjs states in its own header — deciding that two differently-named facts are one fact cannot be done mechanically — and the comparison was run against all six maps and all 584 live irs433* properties rather than against one predecessor.',
  the_route_that_pdf_lib_forecloses: `MEASURED ON THIS PACKET RATHER THAN INFERRED FROM THE PROJECT'S GENERAL KNOWLEDGE THAT pdf-lib STRIPS XFA. getForm() deletes /XFA from the AcroForm dict of every form in this tree, 433-H included. On the six mapped forms that is HARMLESS AND IS WHY THE ENGINE WORKS — each is a HYBRID XFA form carrying an /XFA array of 18 beside a populated AcroForm, so removing the XFA leaves 168 to 515 fillable widgets untouched. On 433-H it leaves ZERO, and the 3,218,407-byte input saves to 3,208,930 bytes of one placeholder page with an empty AcroForm and no XFA at all — STRICTLY WORSE THAN THE INPUT, because the only thing that could have rendered it is gone. THE ENGINE HAS NEVER FILLED AN XFA FORM. It has always filled the AcroForm shadow the IRS's static-XFA forms ship with, and 433-H ships without one.`,
  route_A_fill_the_datasets: `RULED OUT AS A FILL ROUTE, ON A CEILING DERIVED FROM THE TEMPLATE'S OWN DIRECTIVES. The blank ships with SEVEN packets (${PACKETS}) against nine on every mapped form: no datasets packet and no form packet, so it ships unmerged and a processor must lay it out at open time. A datasets packet CAN be injected — the /XFA array is editable at the object level provided getForm() is never called — and pdfjs BINDS IT: a sentinel written into a flat <form1> data hierarchy came back in the rendered XFA tree. BUT ${REFUSED} OF THE ${F} FIELDS CARRY <bind match="none"/>, which is the template declining to connect the field to the data DOM, and no conforming processor overrides it. The negative control proved it on this form: the same injection that reached a no-bind field did not reach a match="none" one. The ceiling is ${BINDABLE} of ${F}. A route that can populate at most that share of a form is not a fill route.`,
  route_A_prime_write_the_template: 'WORKS, AND IS RULED OUT ON WHAT IT MAKES RATHER THAN ON WHETHER IT WORKS. Writing <value><text>…</text></value> into a field definition inside the TEMPLATE packet renders that value — proved on the very field that refuses data binding. It has no ceiling: it reaches all 331. What it produces is the IRS\'s form DEFINITION with our values written into it, which is a different object from a filled form, and it collides head-on with the revision problem below: a revision read back out of a packet WE EDITED is not a pin, it is a copy of what we wrote. Recorded as available and not adopted.',
  route_the_prompt_did_not_name_RENDER_RATHER_THAN_FILL: 'INJECT, RENDER, PRINT. pdfjs-dist ^6.2.108 is already a dependency here and already renders this form to eight laid-out pages. Data goes in by route A for the 145 bindable fields or by route A-prime for all 331; the render is then printed to a flat PDF. WHAT MAKES IT DIFFERENT FROM A REPLICA IS WHERE THE GEOMETRY COMES FROM: every rectangle, caption, column header and page break is the IRS template\'s own, laid out by an XFA engine, rather than measured and re-drawn by us. What it produces is still a RENDERING of the form and not the form — but for a document that is mailed or faxed, a printed rendering is what is filed. It is the cheapest route that keeps the IRS\'s own layout, and it is put forward as a candidate rather than a recommendation.',
  route_static_replica_and_why_it_is_NOT_an_engineering_question: 'A FILED DOCUMENT THAT IS NOT THE IRS FORM IS A DIFFERENT OBJECT FROM A FILLED IRS FORM. That sentence is the whole of it. The engineering cost is knowable and unremarkable — 331 cells, three pages, a layout this tree can already read out of the template. The question that is not ours is whether a document the Service receives may be one we drew, carrying the IRS\'s form number and revision, produced by a party that is not the IRS. It is a question for Principal and JLW and it is recorded here so that nobody answers it by building.',
  route_do_not_fill_it: 'HOLD THE DATA AND PRODUCE IT FOR A PREPARER OR ANOTHER CHANNEL. WHAT IT LEAVES UNDONE, STATED: somebody types 331 fields by hand into Adobe Reader, which is the only widely deployed renderer that opens this form at all; the engine can neither verify what they typed nor read it back, so the round-trip proof that stands on all six mapped forms does not exist here; and the "I R S Allowed" column, which the tree can compute from the standards file it already holds, is computed by a person instead. It costs nothing to adopt and it is the status quo.',
  how_a_433H_REVISION_WOULD_BE_PINNED_UNDER_EACH_ROUTE: `IT CANNOT BE PINNED THE WAY EVERY OTHER FORM IS, AND THAT IS DECLARED RATHER THAN WORKED AROUND. The standing rule is that a revision is never asserted from anything but DRAWN PAGE BYTES. 433-H's one drawn page is 332 characters of "The document you are trying to load requires Adobe Reader 8 or higher" and carries no revision, no catalogue number and no form number. Every available source is packet-derived or metadata-derived: the template's product_id draw says "Form 433-H" and "(March 2025)"; its assist/speak says "Revised March 2025. Catalog Number 71232U"; the PDF /Info Title says "Form 433-H (Rev. 3-2025)"; the config packet's build path names f433-h--2025-03-00--web.pdf. FOUR SOURCES AGREEING IS NOT THE SAME KIND OF EVIDENCE AS ONE DRAWN LINE, because all four were written by the same authoring tool in the same file and none of them is what a filer reads off the page. Under routes A, A-prime and render: pin the DOCUMENT, not the revision — the blank's SHA-256 is ${SHA}, it is recomputed on every run by [SB-26], and it answers the question the revision pin actually exists to answer, which is whether this is the same blank the work was done against. The revision string is recorded as PACKET-DERIVED and is never upgraded by being written down. Under a static replica: it cannot be pinned at all, because there is no IRS document in the artefact to pin.`,
  which_question_we_are_actually_in: 'NOT "CAN WE FILL IT" — that is answered. The collection-information half of 433-H is 433-F, and 433-F is mapped, provisioned and round-tripping; the instalment-agreement half is 433-D, and 433-D is mapped and gated. The facts this form asks for are, with the one exception of a column we can compute ourselves, facts the backbone already holds or has a proved route to. SO THE QUESTION IS "DO WE NEED TO RENDER IT", AND THAT IS A QUESTION ABOUT CHANNEL AND ABOUT WHAT A FILED DOCUMENT MAY BE, NOT ABOUT THE ENGINE.',
  what_holds_it: 'adapters/pdf/xfa-fieldset.mjs, run on every `npm run sweeps` as `--check`, re-derives the field set from the pinned blank and refuses any difference. adapters/pdf/forms/forms.sha256 pins the blank and [SB-26] recomputes it. No map, no fixture, no crosswalk and no property exist for this form and none was created here.',
});

reg.open.push({
  id: 'D-26',
  form: '433-H',
  raised_in: 'prompt 56',
  subject: 'WHICH 433-H ROUTE TO TAKE IS NOT AN ENGINEERING DECISION AND IS NOT MADE HERE. [D-02] asked whether the form can be filled and by what route; that is answered with evidence and resolved. What is left is a choice between producing a rendering of the IRS form, producing a document that is not the IRS form, and producing neither — and the thing that separates them is what a filed document is permitted to be.',
  what_is_settled: 'The AcroForm path is closed and measured: 0 fields survive pdf-lib on this blank against 168 to 515 on the six mapped forms. The datasets path has a derived ceiling of ' + BINDABLE + ' of ' + F + ' fields, because ' + REFUSED + ' carry <bind match="none"/>. The template-write path and the render path both work and are proved on this packet. The facts the form asks for are, but for a column the tree can compute from the standards file, already held.',
  what_is_NOT_settled_and_is_not_ours_to_settle: 'Whether a document produced by this engine may be filed in place of the IRS form; and, if a rendering is acceptable, whether a rendering produced by pdfjs from the IRS template counts as the form or as a copy of it. THE ENGINEERING COST DOES NOT DECIDE THIS AND SHOULD NOT BE ALLOWED TO LOOK AS IF IT DOES — the cheapest route is not the safest one, and the ranking by cost and the ranking by risk are not the same ranking.',
  who_decides: 'Principal and JLW.',
  what_would_settle_it: 'A ruling on the filing question. Everything downstream of it is ordinary work this tree already knows how to do; nothing downstream of it should begin before it.',
  status: 'OPEN',
});

reg._count = { open: reg.open.length, resolved: reg.resolved.length };
writeFileSync(REG, JSON.stringify(reg, null, 1) + '\n');
console.log(`[D-02] superseded and [D-26] raised in ${REG} — ${reg.open.length} open, ${reg.resolved.length} resolved.`);
