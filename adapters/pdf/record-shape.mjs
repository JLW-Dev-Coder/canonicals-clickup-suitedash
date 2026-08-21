// THE DECLARED RECORD SHAPE — a form that prints TWO routes to the same total, and a record
// that says which one it took.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE DEFECT THIS CLOSES, ON TWO FORMS AT ONCE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-B(OIC) Section 3 prints, at page 4 y 511.2:
//
//   "Note: If you provide a current profit and loss statement for the information below,
//    enter the total gross monthly income in Box B below. Do not complete lines (6) - (10)."
//
// Section 4 prints the same sentence for Box C and lines (11) - (20) at y 312.5. 433-A(OIC)
// Section 6 prints one sentence for both halves at page 5 y 421.3.
//
// A record filed that way prints the total and leaves every operand of that total EMPTY. Gate
// step 11 sums the printed operands, gets zero, reads a non-zero box, and FAILS A CORRECTLY
// FILED FORM. That was [B17] on 433-B(OIC) and [C-06] on 433-A(OIC): one defect, two forms.
//
// Two fixes were available before this file and both were refused:
//   - a PREDICATE over a cell the form does not print. Neither form draws a P&L indicator
//     anywhere; the route is visible only in whether the lines are filled, which is the thing
//     being checked. A predicate read off the record would make the tripwire check the engine
//     against its own input, with the page witnessing neither side.
//   - a TOLERANCE, or a conditional that skips the line when the operands happen to be empty.
//     That is a rule saying "check this unless the answer would be inconvenient", and it would
//     pass a record that simply forgot to fill the lines — which is the error the check is for.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE THIRD WAY: THE RECORD DECLARES WHICH PRINTED ROUTE IT TOOK
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// It is not an inference and it is not slack. It is an OPERATOR INPUT of the same kind as
// `allowable_household_size` on 433-A: a fact about the filing that the printed page cannot
// supply, stated once by the person filing, and then held to.
//
// AND BOTH STATES BECOME CHECKABLE, which is the whole of the argument. The old shape had one
// verifiable state and one unverifiable one. This has two verifiable ones:
//
//   grid                          the operands are printed and they sum to the total
//   profit_and_loss_statement     every operand is EMPTY on the filed page and the total is
//                                 PRESENT — exactly what the printed note instructs
//
// Neither is a skip. A P&L record with an operand filled STOPS. A grid record with every
// operand empty STOPS. The construct refuses two whole classes of misfiled return that
// nothing in this engine could refuse before it.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// ONE INPUT, THREE PRINTED SENTENCES — READ OFF THE PAGES, NOT CHOSEN FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// 433-B(OIC) prints TWO notes and 433-A(OIC) prints ONE. The question the ruling asked was
// whether that is two facts or one, and the pages answer it.
//
// Both 433-B(OIC) notes open with the IDENTICAL antecedent — "If you provide a current profit
// and loss statement". The consequents differ (Box B and lines (6)-(10); Box C and lines
// (11)-(20)) but the CONDITION is the same condition, about the same document. A profit and
// loss statement is a statement of income AND expenses; the one document satisfies both
// antecedents or neither. There is no state of the world in which a filer has provided a
// current P&L for Section 3 and not for Section 4.
//
// So: ONE input, serving both sections of 433-B(OIC) and the single section of 433-A(OIC).
// Two inputs could express "a current P&L exists for income but not for expenses" — a state no
// reading of the printed sentences permits — and an input that can hold an impossible value is
// an input a record can be wrong in silently. 433-A(OIC) settles the same question the other
// way round: one sentence there governs line (17) and line (29) together, so a per-section
// input would have to invent a split that form does not draw.
//
// EACH FORM STILL QUOTES ITS OWN PRINTED EVIDENCE. One input; three `printed` quotations with
// three sets of coordinates. The input is shared because the FACT is shared, never because the
// sentences were assumed to be the same — they are not, and the declarations show all three.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY THIS LANDS BEFORE PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// It is an input, and inputs become HubSpot property names, and HubSpot property names are
// immutable once created. `business_income_expense_route` is named for the FACT and not for
// either form, the same rule `allowable_household_size` follows, because 433-A(OIC) and
// 433-B(OIC) both hold it and 433-B will hold it too.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// ABSENCE IS A STOP, NOT A DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A record that names no state on a form whose map declares one is a STOP. Defaulting it to
// `grid` would silently declare a route on the operator's behalf, and a silent direction is
// the defect class this repo has spent six cycles removing. The STOP names the input, the
// declared states, and the printed sentence that makes the choice a real one.

import { parseMoney } from './rounding.mjs';

/** The two checks a declared line can run. There is no third, and there is no skip. */
export const CHECKS = new Set(['operands_sum_to_total', 'operands_empty_and_total_present']);

/**
 * The map's declaration, as { declared, declarations[], byId }.
 * A map that declares no `record_shape` yields `declared:false` and every lookup empty, which
 * is how 433-A and 433-F stay untouched by this module.
 */
export const loadRecordShape = (mapDoc) => {
  const decl = mapDoc?.record_shape;
  const byId = new Map();
  if (!decl || !Array.isArray(decl.declarations)) return { declared: false, declarations: [], byId };
  for (const d of decl.declarations) if (d && d.id) byId.set(d.id, d);
  return { declared: true, declarations: decl.declarations, byId };
};

/** The states one declaration names, as a sorted array of strings. */
export const statesOf = (d) => Object.keys(d?.states || {}).filter((k) => !k.startsWith('_')).sort();

/**
 * Which state THIS record declares for THIS declaration.
 * Returns { state } or { stop } — never a default and never a guess.
 */
export const stateFromRecord = (d, record) => {
  const input = d.input;
  const states = statesOf(d);
  const raw = record?.[input];
  if (raw === undefined || raw === null || String(raw).trim() === '')
    return { stop: `the record declares no "${input}". This form prints ${states.length} routes to the total(s) ${(d.governs || []).join(', ')} and the filed page cannot tell them apart — "${String(d.printed_evidence?.[0]?.printed || '').slice(0, 96)}". Declare "${input}" as one of: ${states.join(', ')}. There is no default: a default would choose a route on the filer's behalf.` };
  const v = String(raw).trim();
  if (!states.includes(v))
    return { stop: `the record declares "${input}": ${JSON.stringify(v)}, which is not one of the states ${d.id} names (${states.join(', ')}). A state the map does not declare cannot be checked against anything printed.` };
  return { state: v };
};

/**
 * Every STOP the map's own declaration can commit, plus the cross-check against the totals
 * file. `totalsDoc` may be null — the cross-check is then reported as not run, never as passed.
 */
export const auditRecordShape = (mapDoc, totalsDoc) => {
  const problems = [];
  const rs = loadRecordShape(mapDoc);
  if (!rs.declared) return { problems, declarations: [], declared: false, ran_totals_crosscheck: false, lines: [] };
  if (!rs.declarations.length) {
    problems.push('`record_shape` is present but declares no `declarations`. Remove it, or declare them — a record-shape key that governs nothing reads as a form that was considered.');
    return { problems, declarations: [], declared: true, ran_totals_crosscheck: false, lines: [] };
  }

  const seen = new Set();
  for (const d of rs.declarations) {
    const id = d.id || '(no id)';
    if (!d.id) problems.push('a declaration declares no `id`');
    else if (seen.has(d.id)) problems.push(`two declarations share the id "${d.id}"`);
    else seen.add(d.id);

    if (typeof d.input !== 'string' || !d.input.trim())
      problems.push(`${id}: declares no \`input\` — the record key the operator states the route in, and the name that becomes a permanent property.`);

    const states = statesOf(d);
    if (states.length < 2)
      problems.push(`${id}: declares ${states.length} state(s). A record shape with fewer than two states is not a choice, and a one-state declaration would gate nothing while reading as a gate.`);
    for (const s of states)
      if (typeof d.states[s] !== 'string' || !d.states[s].trim())
        problems.push(`${id}: state "${s}" carries no description of what the printed page looks like in it.`);

    // THE PRINTED SENTENCE IS THE AUTHORITY. A record shape declared on nobody's authority is
    // the assumption this construct replaces, so the quote and its coordinates are mandatory,
    // exactly as they are for a rounding block.
    //
    // AND IT IS A LIST, ONE ENTRY PER PRINTED SENTENCE, EACH NAMING THE LINES IT GOVERNS.
    // 433-B(OIC) prints the route TWICE — once over Section 3 and once over Section 4 — and
    // 433-A(OIC) prints it once over both of its lines. One input serves all three because the
    // CONDITION is one condition; the sentences are three and are not assumed to be the same.
    // A single `printed` field would have made two of them invisible, and "the sentences were
    // taken to be identical" is precisely the inherited-name shape this repo keeps finding.
    const ev = d.printed_evidence;
    if (!Array.isArray(ev) || !ev.length) {
      problems.push(`${id}: carries no \`printed_evidence\` — a list with one entry per printed route sentence, each quoting it verbatim with {page, y, x} and naming the declared lines it governs.`);
    } else {
      ev.forEach((p, i) => {
        const at = `${id}.printed_evidence[${i}]`;
        if (typeof p.printed !== 'string' || !p.printed.trim()) problems.push(`${at}: quotes no \`printed\` sentence verbatim.`);
        if (!p.printed_at || typeof p.printed_at.page !== 'number' || typeof p.printed_at.y !== 'number' || !Array.isArray(p.printed_at.x))
          problems.push(`${at}: \`printed_at\` does not give {page, y, x:[x1,x2]}. The y is a TEXT BASELINE — the one declared convention in this repo.`);
        if (!Array.isArray(p.governs) || !p.governs.length)
          problems.push(`${at}: names no \`governs\`. A quoted sentence that governs no line is evidence for nothing.`);
      });
    }
    if (!Array.isArray(d.governs) || !d.governs.length) {
      problems.push(`${id}: names no \`governs\` — the declared lines this route empties. A declaration governing nothing cannot be cross-checked against the totals file.`);
    } else if (Array.isArray(ev)) {
      // THE UNION IS ASSERTED, NOT ASSUMED. `governs` on the declaration is what the totals
      // cross-check below is run against; if a sentence were dropped from the evidence list the
      // declaration would go on claiming its lines with nothing printed behind them.
      const fromEv = [...new Set(ev.flatMap((p) => p.governs || []))].sort();
      const stated = [...new Set(d.governs)].sort();
      const missing = stated.filter((g) => !fromEv.includes(g));
      const extra   = fromEv.filter((g) => !stated.includes(g));
      if (missing.length) problems.push(`${id}: \`governs\` names ${missing.join(', ')}, which no quoted printed sentence claims. A governed line with no sentence behind it is the assumption this construct replaces.`);
      if (extra.length)   problems.push(`${id}: a quoted sentence governs ${extra.join(', ')}, which \`governs\` does not name.`);
    }
  }

  // THE CROSS-CHECK, in BOTH directions.
  //   forward  every line carrying a `record_shape` names a declaration the map declares, and
  //            gives exactly one check per declared state — no state without a check, no check
  //            without a state.
  //   back     every line a declaration says it `governs` actually carries that record_shape.
  //            Without this a declaration could name three lines, one line could quietly lose
  //            its clause, and the transcript would report a declared shape governing it.
  const lines = [];
  let ran = false;
  if (totalsDoc) {
    ran = true;
    for (const e of (totalsDoc.totals || [])) {
      const c = e.record_shape;
      if (!c) continue;
      lines.push({ line: e.line, declaration: c.declaration });
      const d = rs.byId.get(c.declaration);
      if (!d) { problems.push(`line ${e.line}: \`record_shape.declaration\` "${c.declaration}" is not declared in the map's \`record_shape\`.`); continue; }

      const want = statesOf(d);
      const got = Object.keys(c.checks || {}).filter((k) => !k.startsWith('_')).sort();
      const missingState = want.filter((s) => !got.includes(s));
      const extraState   = got.filter((s) => !want.includes(s));
      if (missingState.length)
        problems.push(`line ${e.line}: names no check for state(s) ${missingState.join(', ')} of "${c.declaration}". A state with no check is a state this line is not gated in, and it would read as gated.`);
      if (extraState.length)
        problems.push(`line ${e.line}: names a check for ${extraState.join(', ')}, which "${c.declaration}" does not declare as a state.`);
      for (const [s, k] of Object.entries(c.checks || {})) {
        if (s.startsWith('_')) continue;
        if (!CHECKS.has(k)) problems.push(`line ${e.line}: state "${s}" names check ${JSON.stringify(k)} — not one of ${[...CHECKS].join(', ')}.`);
      }
    }
    for (const d of rs.declarations) {
      for (const g of (d.governs || [])) {
        const hit = (totalsDoc.totals || []).find((e) => e.line === g);
        if (!hit) problems.push(`${d.id}: \`governs\` names line "${g}", which the totals declaration does not declare.`);
        else if (hit.record_shape?.declaration !== d.id)
          problems.push(`${d.id}: \`governs\` names line "${g}", but that line carries ${hit.record_shape ? `record_shape.declaration "${hit.record_shape.declaration}"` : 'NO record_shape clause'}. A declaration claiming a line the line does not carry is a scope stated and not held.`);
      }
    }
  }

  return { problems, declarations: rs.declarations, declared: true, ran_totals_crosscheck: ran, lines };
};

/**
 * THE COMPARATORS. Both take the printed total and the printed operand cells — already read
 * off the FILLED PDF, never off the record — and return a verdict with the reason stated.
 *
 * `cells` is [{ target, raw }] for every operand cell the line declares, INCLUDING the blank
 * ones: the blank ones are the entire subject of the second comparator, and a list that had
 * dropped them could not tell an empty operand from an operand the map never named.
 */
export const checkOperandsEmptyTotalPresent = (totalRaw, cells) => {
  const filled = cells.filter((c) => !parseMoney(c.raw).blank);
  const t = parseMoney(totalRaw);
  const why = [];
  if (filled.length)
    why.push(`${filled.length} of ${cells.length} operand cell(s) carry a value on the filed page: ${filled.map((c) => `${c.target}=${JSON.stringify(String(c.raw).trim())}`).join(', ')}. The printed note directs a record on this route NOT to complete them.`);
  if (t.blank)
    why.push('the total cell is EMPTY. The printed note directs a record on this route to enter the total directly, so an empty total means the route was declared and not taken.');
  return { holds: !why.length, why: why.join(' '), filled: filled.length, operands: cells.length };
};

export const checkOperandsPresent = (cells) => {
  const filled = cells.filter((c) => !parseMoney(c.raw).blank);
  return {
    holds: filled.length > 0,
    why: filled.length ? '' : `every one of the ${cells.length} declared operand cell(s) is EMPTY on the filed page. A record on the grid route completes the printed lines; empty operands under a declared grid route are either a record that took the other route without saying so, or a record that forgot the lines.`,
    filled: filled.length, operands: cells.length,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE CANARY. A NEW INSTRUMENT IS THE LEAST TRUSTWORTHY OBJECT IN THE REPO.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// This construct's whole claim is that BOTH states are checkable, which means both comparators
// must be able to say NO. A comparator that always holds would let every gate print "record
// shape: checked" over a form nothing was checked on — the vacuous-guard shape, on the newest
// object in the tree. So each comparator is fired here against an input it MUST refuse and an
// input it MUST accept, on every run, and a canary that does not bite is a STOP.
export const canary = () => {
  const cell = (target, raw) => ({ target, raw });
  const results = [
    ['P&L route accepts an empty grid with a total present',
      checkOperandsEmptyTotalPresent('4,200', [cell('a', ''), cell('b', '')]).holds === true],
    ['P&L route REFUSES an operand that carries a value',
      checkOperandsEmptyTotalPresent('4,200', [cell('a', ''), cell('b', '900')]).holds === false],
    ['P&L route REFUSES an empty total',
      checkOperandsEmptyTotalPresent('', [cell('a', ''), cell('b', '')]).holds === false],
    ['P&L route REFUSES a printed zero operand, which is a completed line and not a blank',
      checkOperandsEmptyTotalPresent('4,200', [cell('a', '0')]).holds === false],
    ['grid route accepts at least one completed operand',
      checkOperandsPresent([cell('a', '900'), cell('b', '')]).holds === true],
    ['grid route REFUSES every operand empty',
      checkOperandsPresent([cell('a', ''), cell('b', '')]).holds === false],
  ];
  const failed = results.filter(([, ok]) => !ok).map(([what]) => what);
  return { checks: results.length, failed };
};

/** Print the audit and return the number of problems (0 = holds). */
export const reportRecordShape = (audit, mapPath) => {
  const bird = canary();
  if (bird.failed.length) {
    console.error(`RECORD-SHAPE CANARY DID NOT BITE — ${bird.failed.length} of ${bird.checks} comparator behaviour(s) are wrong:`);
    bird.failed.forEach((f) => console.error(`  ${f}`));
    return bird.failed.length;
  }
  if (!audit.declared) {
    console.log(`record shape: ${mapPath} declares none — every declared total is checked as an equality over its printed operands. (Not a failure: only a form that PRINTS an alternative route carries a declaration.)`);
    console.log(`  canary: holds (${bird.checks} comparator behaviours, both directions of both comparators fired)`);
    return 0;
  }
  console.log(`record shape: ${audit.declarations.length} declared route(s) on ${mapPath}`);
  for (const d of audit.declarations) {
    console.log(`  ${String(d.id).padEnd(30)} input "${d.input}"  states: ${statesOf(d).join(' | ')}  governs: ${(d.governs || []).join(', ')}`);
    for (const p of (d.printed_evidence || []))
      console.log(`  ${' '.repeat(30)} p${p.printed_at?.page} y ${p.printed_at?.y} governs ${(p.governs || []).join(', ')} — ${JSON.stringify(String(p.printed || '').slice(0, 78))}`);
  }
  console.log(`  totals cross-check: ${audit.ran_totals_crosscheck ? `RAN — ${audit.lines.length} declared line(s) carry a record shape, and every governed line was found carrying the declaration that claims it` : 'NOT RUN (no totals declaration loaded)'}`);
  console.log(`  canary: holds (${bird.checks} comparator behaviours, both directions of both comparators fired)`);
  if (!audit.problems.length) return 0;
  console.error(`RECORD-SHAPE DECLARATION — ${audit.problems.length} problem(s):`);
  audit.problems.forEach((p) => console.error(`  ${p}`));
  return audit.problems.length;
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// THE QUOTED SENTENCE, RE-MEASURED AGAINST THE DRAWN PAGE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A route sentence quoted verbatim with a page, a baseline and an x span is a transcription,
// and a transcription nothing re-measures drifts — which is [B11] and [B18] on this very
// series, and which is why the coordinate in 433aoi.totals.json's own P&L note reads 429.3
// where the baseline is 421.3.
//
// So each quotation is proved: on the declared PAGE there must be a drawn run whose baseline
// is within 0.75pt of the declared y, whose x span is within 0.75pt of the declared x, and
// whose text is a PREFIX of the quoted sentence once whitespace is normalised. Prefix rather
// than equality because a sentence wraps: the run at the declared coordinates is its first
// printed line, and the declaration quotes the whole sentence on purpose.
//
// 0.75pt is align-block.mjs's tolerance and is stated here rather than invented — it is the
// rounding that tool prints at, not slack admitted into a comparison.
export const EVIDENCE_TOLERANCE = 0.75;

const normText = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * `pages` is the output of page-geometry.readPrintedText — passed in rather than read here, so
 * this proves something about the drawn page the rest of the engine measures and not about a
 * second reading of the PDF.
 * Returns { demanded, uncovered } — one atom per quoted sentence.
 */
export const verifyPrintedEvidence = (mapDoc, pages) => {
  const rs = loadRecordShape(mapDoc);
  const demanded = [], uncovered = [];
  for (const d of rs.declarations) {
    for (const [i, ev] of (d.printed_evidence || []).entries()) {
      const at = ev.printed_at || {};
      const atom = { what: `${d.id}.printed_evidence[${i}]`, page: at.page, y: at.y, x: at.x, quoted: String(ev.printed || '').slice(0, 60) };
      demanded.push(atom);
      const items = pages[Number(at.page) - 1]?.items || [];
      const want = normText(ev.printed);
      const hit = items.find((t) =>
        Math.abs(t.y1 - at.y) <= EVIDENCE_TOLERANCE &&
        Math.abs(t.x1 - at.x?.[0]) <= EVIDENCE_TOLERANCE &&
        Math.abs(t.x2 - at.x?.[1]) <= EVIDENCE_TOLERANCE &&
        want.startsWith(normText(t.str)));
      if (!hit) {
        const nearY = items.filter((t) => Math.abs(t.y1 - at.y) <= EVIDENCE_TOLERANCE);
        uncovered.push({ ...atom,
          why: nearY.length
            ? `${nearY.length} run(s) are drawn at that baseline on page ${at.page} and none of them both spans x ${at.x?.[0]}..${at.x?.[1]} and opens the quoted sentence. Nearest: ${nearY.map((t) => `x ${t.x1.toFixed(1)}..${t.x2.toFixed(1)} ${JSON.stringify(t.str.slice(0, 40))}`).slice(0, 3).join(' | ')}`
            : `NO run is drawn at baseline y ${at.y} on page ${at.page}. A y quoted as a RUN TOP rather than a text baseline lands here, which is exactly the drift [B11] and [B18] record.` });
      }
    }
  }
  return { demanded, uncovered };
};
