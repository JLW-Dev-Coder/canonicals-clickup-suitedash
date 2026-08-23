// A GUARD REPORTS HOW MANY ITEMS IT EXAMINED ON THIS FORM. ZERO IS REPORTED AS ZERO.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS — [R-04]
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// adapters/hubspot/assert-intake-keys.mjs reported PASS on a run that included 433-B, and its
// 433-B contribution was ZERO: the crosswalk was empty, so there were no option values and no
// row shapes to resolve, and the guard's verdict for that form was produced by an empty set.
//
// "PASSED" and "HAD NOTHING TO LOOK AT" are different facts wearing one word. The difference is
// the whole of the vacuous-guard class — a predicate an empty input can satisfy — which
// guard-sweep.mjs enumerates at the SITE level. This module is the same question at the FORM
// level: not "can this predicate be satisfied by nothing" but "was it, on this form, today".
//
// It is the `atLeast` contract of count-sweep.mjs applied per form. There, an extraction that
// returns fewer values than it declares it must is a STOP with its own message, because a claim
// the engine cannot READ is exactly as unchecked as a claim nobody wrote a check for. Here, a
// guard that examined nothing on a form has not been tested on that form, and saying so is not
// a failure — it is the figure without which the pass means nothing.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// A ZERO IS NOT A FAILURE, AND THAT IS DELIBERATE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A GUARD TUNED TO FIRE CONSTANTLY GETS TURNED OFF ([R-10]). Several zeros in this engine are
// correct and permanent: 433-A declares no record shape, so assert-record-shape.mjs examines
// zero routes on it and says so in as many words — "a checked absence rather than a pass".
// Making that a failure would make the suite unrunnable and the honest answer unspeakable.
//
// So the mechanism is REPORTING, not failing. adapters/pdf/assert-examined.mjs collects every
// (guard, form) pair, prints the whole matrix, and names every pair whose count is zero. What
// the reader then does with a zero is a judgement about that guard and that form, and it is a
// judgement that can now be made, which is the entire point.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE LINE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   EXAMINED <guard> <form> <n> <universe>
//
// One line, on stdout, anchored at the line start. `<universe>` is A FIGURE'S UNIVERSE — the
// name of the set the number counts — because a figure without its universe is not a figure
// ([R-07]). "12" is not a report; "12 map targets on 433-B" is.
//
// EVERY LINE IS READ, NOT THE FIRST. adapters/pdf/assert-examined.mjs collects all of them, and
// that is not a stylistic choice: reading only the first is the defect [R-25] records, where
// assert-overflow.mjs took the first line opening "OVERFLOW" and reported two of three drops as
// unlogged. A guard here may legitimately emit several — one per form it iterates, or one per
// universe it examines — and all of them count.

/** The one spelling. Returns `n` so a call site can wrap the figure it was already computing. */
export const examined = (guard, form, n, universe) => {
  if (!guard || !form || !universe) throw new Error(`examined() needs guard, form, n and universe; got ${JSON.stringify([guard, form, n, universe])}`);
  if (!Number.isInteger(n) || n < 0) throw new Error(`examined(${guard}, ${form}) needs a non-negative integer count; got ${JSON.stringify(n)}`);
  // The universe may not contain a space, because the reader splits on the fourth field and a
  // space in it would silently truncate the name of the set — which is the figure-without-its-
  // universe defect arriving through the reporting channel built to prevent it.
  const u = String(universe).trim().replace(/\s+/g, '-');
  console.log(`EXAMINED ${guard} ${form} ${n} ${u}`);
  return n;
};

const LINE = /^EXAMINED (\S+) (\S+) (\d+) (\S+)$/;

/** Every EXAMINED line in a tool's output, in order. Never the first only. */
export const readExamined = (out) => String(out).split('\n')
  .map((l) => LINE.exec(l.trim()))
  .filter(Boolean)
  .map((m) => ({ guard: m[1], form: m[2], n: Number(m[3]), universe: m[4] }));

/** Eight questions whose answers are known, asked of the reader on every run. */
export const examinedCanary = () => {
  const N = '\n';
  const cases = [
    ['a  one line', 'EXAMINED g 433a 12 map-targets', [{ guard: 'g', form: '433a', n: 12, universe: 'map-targets' }]],
    ['b  several lines are ALL read, not the first',
      ['EXAMINED g 433a 12 t', 'EXAMINED g 433f 0 t', 'EXAMINED g 433b 3 t'].join(N),
      [{ guard: 'g', form: '433a', n: 12, universe: 't' }, { guard: 'g', form: '433f', n: 0, universe: 't' }, { guard: 'g', form: '433b', n: 3, universe: 't' }]],
    ['c  a ZERO is a reading, not an absence', 'EXAMINED g 433b 0 option-values', [{ guard: 'g', form: '433b', n: 0, universe: 'option-values' }]],
    ['d  surrounding prose is ignored', ['some report', 'EXAMINED g 433a 1 t', 'PASSED'].join(N), [{ guard: 'g', form: '433a', n: 1, universe: 't' }]],
    ['e  a mid-line occurrence is NOT a report', '  ... wrote EXAMINED g 433a 9 t into the cell', []],
    ['f  a malformed line is not silently read as zero', 'EXAMINED g 433a t', []],
    ['g  no lines at all', 'nothing here', []],
    ['h  an indented line still counts (the line is trimmed)', '   EXAMINED g 433a 4 t', [{ guard: 'g', form: '433a', n: 4, universe: 't' }]],
  ];
  const dead = [];
  for (const [name, input, want] of cases) {
    const got = readExamined(input);
    if (JSON.stringify(got) !== JSON.stringify(want))
      dead.push(`CANARY DEAD  ${name}: reader returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
  return { cases: cases.length, dead };
};
