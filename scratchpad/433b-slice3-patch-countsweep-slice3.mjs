// Five manifest entries for slice 3's prose keys, spliced in after [S-41].
//
// Patched BY LINE with an anchor, never by matching a quoted blob — escaped quotes in a heredoc
// patch script fail to match silently, which is the class control-char-scan.mjs exists for and
// which [R-12] records reaching disk on the overflow reader's own repair.
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'adapters/pdf/count-sweep.mjs';
const lines = readFileSync(P, 'utf8').split('\n');

const anchor = lines.findIndex((l, i) => i > 495 && l.trim() === '// ═══ the carried-questions ledger ════════════════════════════════════════════════════');
if (anchor < 0) { console.error('STOP — the carried-questions ledger anchor is not where this patch expects it.'); process.exit(2); }
if (!/^\s*\}\s*\}\),\s*$/.test(lines[anchor - 1])) { console.error(`STOP — line ${anchor} is ${JSON.stringify(lines[anchor - 1])}, not the close of [S-41].`); process.exit(2); }
if (lines.some((l) => /id: 'S-4[2-6]'/.test(l))) { console.error('STOP — an S-42..S-46 entry already exists. Refusing to land slice 3 twice.'); process.exit(2); }

const BLOCK = `
  // ═══ slice 3, page 4 ═════════════════════════════════════════════════════════════════
  D({ id: 'S-42', file: /433b\\.map\\.json$/, at: /^_the_condition_that_governs_page_4$/,
    kind: 'derived',
    derive: async (ctx) => {
      const map = ctx.mapDoc;
      const { readWidgetGeometry } = await import('../adapters/pdf/page-geometry.mjs');
      const { widgets } = await readWidgetGeometry(readFileSync(map.pdf));
      const w4 = widgets.filter((w) => w.page === 4);
      const rows = [
        { what: 'widgets drawn on page 4', claimed: 94, derived: w4.length, from: 'the drawn page, via readWidgetGeometry' },
        // EVERY ONE OF THEM A TEXT FIELD, WHICH IS WHAT MAKES THE NO-CHECKBOX CLAIM CHECKABLE.
        // The claim "the page draws no checkbox" is an ABSENCE about the form, so it is read off
        // the widget list rather than off the map — [R-05].
        { what: 'page-4 widgets that are NOT a text field', claimed: 0,
          derived: w4.filter((w) => w.type !== 'PDFTextField').length, from: 'the drawn page; every page-4 widget is a PDFTextField' },
      ];
      // TWO PRINTED TABLES, derived from the groups whose slots bind a page-4 target rather than
      // from a list of table names.
      const tables = Object.keys(map.groups || {}).filter((g) => !g.startsWith('_'))
        .filter((g) => (map.groups[g].slots || []).some((sl) => Object.values(sl.text || {}).some((t) => /Page4\\[0\\]/.test(t))));
      rows.push({ what: 'printed tables on page 4', claimed: 2, derived: tables.length,
        from: "the map's own groups, filtered to those whose slots bind a Page4 target" });
      // THE SHARED GRID: six columns, and the two tables' extra cells.
      const rp = (map.groups.real_property.slots || [])[0], vh = (map.groups.vehicles.slots || [])[0];
      rows.push({ what: 'columns per real-property row', claimed: 10, derived: Object.keys(rp.text || {}).length, from: "the map's own real_property slot 0" });
      rows.push({ what: 'columns per vehicle row', claimed: 13, derived: Object.keys(vh.text || {}).length, from: "the map's own vehicles slot 0" });
      const shared = Object.keys(rp.text || {}).filter((k) => k in (vh.text || {}));
      rows.push({ what: 'columns the two tables share', claimed: 8, derived: shared.length,
        from: "the map's own two slot-0 column sets, intersected" });
      return rows;
    } }),

  D({ id: 'S-43', file: /433b\\.map\\.json$/, at: /^_the_leaf_names_on_page_4_are_one_printed_marker_behind$/,
    kind: 'derived',
    derive: async (ctx) => {
      // THE OFFSET, RE-DERIVED FROM THE DRAWN PAGE ON EVERY RUN rather than read back out of the
      // map that claims it. The generator asserted it once at authoring time; this asserts it
      // again from the PDF, so a revision that renumbers the form is caught here too.
      const { readWidgetGeometry, readPrintedText, baselineOfRun } = await import('../adapters/pdf/page-geometry.mjs');
      const bytes = readFileSync(ctx.mapDoc.pdf);
      const { widgets } = await readWidgetGeometry(bytes);
      const R4 = (await readPrintedText(bytes))[3].items.map((t) => ({ str: t.str, y: baselineOfRun(t), x1: t.x1 }));
      const WANT = ['22a', '22b', '22c', '22d', '22e', '23a', '23b', '23c', '23d', '23e'];
      const M = R4.filter((t) => WANT.includes(t.str) && t.x1 < 60).sort((a, b) => b.y - a.y);
      const my = Object.fromEntries(M.map((m) => [m.str, m.y]));
      const band = (mk) => { const i = WANT.indexOf(mk); return { top: my[mk] + 12, bot: i + 1 < WANT.length ? my[WANT[i + 1]] + 12 : 30 }; };
      const OFF = { '22a': '21a', '22b': '21b', '22c': '21c', '22d': '21d', '22e': '21e', '23a': '22a', '23b': '22b', '23c': '22c', '23d': '22d', '23e': '22e' };
      const tok = (n) => { const m = /_(\\d{1,2}[a-e])(?:[A-Za-z0-9]*)?\\[0\\]$/.exec(n); return m ? m[1] : null; };
      let behind = 0, agree = 0, other = 0, none = 0;
      for (const w of widgets.filter((x) => x.page === 4)) {
        const mid = (w.rect[1] + w.rect[3]) / 2;
        const mk = WANT.find((m) => { const b = band(m); return mid < b.top && mid >= b.bot; });
        const t = tok(w.name);
        if (t === null) none++;
        else if (t === mk) agree++;
        else if (t === OFF[mk]) behind++;
        else other++;
      }
      return [
        { what: 'page-4 widgets whose leaf token is the printed marker MINUS ONE', claimed: 82, derived: behind, from: 'the drawn page: each widget placed in a printed marker band by its rect midpoint, its leaf token read from its name' },
        { what: 'page-4 widgets whose leaf token AGREES with their printed marker', claimed: 2, derived: agree, from: 'the same derivation; both are on the 22b row' },
        { what: 'page-4 widgets carrying a token from a block on another page', claimed: 8, derived: other, from: 'the same derivation; 18a, 18b, 18c, 18e, 59b, 69b twice and 79b' },
        { what: 'page-4 widgets carrying no row token at all', claimed: 2, derived: none, from: 'the same derivation; Line2d and f2_037_0_' },
        // THE POSITIVE CONTROL. Four counts that must sum to the page, so a dead name-reader
        // cannot satisfy all four by returning zero.
        { what: 'the four counts above, summed', claimed: 94, derived: behind + agree + other + none, from: 'the same derivation, summed — this row is what stops a dead token reader satisfying the other four with zeros' },
      ];
    } }),

  D({ id: 'S-44', file: /433b\\.map\\.json$/, at: /^_the_five_flag_classes_on_page_4$/,
    kind: 'derived',
    derive: async (ctx) => {
      // THE SAME REGISTER [S-38] AND [S-41] READ, PLUS PAGE 4'S OWN ABSENCE HALF.
      const spec = JSON.parse(readFileSync('adapters/hubspot/asset-row-shapes.json', 'utf8'));
      let flagged = 0;
      const walk = (o) => {
        if (Array.isArray(o)) { o.forEach(walk); return; }
        if (o && typeof o === 'object') {
          if (o.key && (o.row_flag || o.printed_as_checkbox)) flagged++;
          for (const k of Object.keys(o)) walk(o[k]);
        }
      };
      walk(spec);
      const rows = [{ what: 'flagged columns in asset-row-shapes.json', claimed: 5, derived: flagged,
        from: 'every column object carrying a row_flag or printed_as_checkbox declaration' }];
      const { readPrintedText } = await import('../adapters/pdf/page-geometry.mjs');
      const pages = await readPrintedText(readFileSync(ctx.mapDoc.pdf));
      const joined4 = pages[3].items.map((t) => t.str).join(' ');
      rows.push({ what: 'printed runs on page 4', claimed: 161, derived: pages[3].items.length, from: 'the drawn page' });
      // READ OFF THE DRAWN PAGE AND NOT OFF THE MAP — [R-05]. This is the page where the kind column
      // would live if it lived anywhere on this form: page 4 IS 433-B's real-property page, and
      // on 433-A that column is drawn as a Primary Residence / Other pair inside each row.
      for (const re of [/Check if/i, /Business Account/i, /Primary Residence/i, /1040/, /household/i])
        rows.push({ what: \`page 4 draws no run matching /\${re.source}/\`, claimed: 0,
          derived: (joined4.match(new RegExp(re.source, 'gi')) || []).length, from: 'every drawn run of page 4, joined' });
      // THE POSITIVE CONTROL. Five required zeros are only readable if the reading works at all.
      rows.push({ what: 'occurrences of the phrase "Real Property" on page 4', claimed: 1,
        derived: (joined4.match(/Real Property/gi) || []).length,
        from: 'the same joined page text; the one occurrence is the block heading at y 715.1' });
      return rows;
    } }),

  D({ id: 'S-45', file: /433b\\.map\\.json$/, at: /^_the_arithmetic_on_page_4$/,
    kind: 'derived',
    derive: async (ctx) => {
      const rows = [];
      // SIX PRINTED TOTALS NOW, DERIVED TWICE: from the totals file, and from the DRAWN PAGES.
      rows.push({ what: 'printed totals declared for 433-B', claimed: 6, derived: (ctx.totalsDoc?.totals || []).length,
        from: 'adapters/pdf/maps/433b.totals.json' });
      rows.push({ what: 'totals declared for page 4', claimed: 2,
        derived: (ctx.totalsDoc?.totals || []).filter((t) => /^page 4,/.test(t.caption_at || '')).length,
        from: "the totals file's own caption_at, which names the page each total is drawn on" });
      const { readPrintedText } = await import('../adapters/pdf/page-geometry.mjs');
      const pages = await readPrintedText(readFileSync(ctx.mapDoc.pdf));
      const joined4 = pages[3].items.map((t) => t.str).join(' ');
      rows.push({ what: 'runs matching /Add lines?/ on page 4', claimed: 2,
        derived: (joined4.match(/Add lines?/gi) || []).length, from: 'every drawn run of page 4, joined' });
      rows.push({ what: 'occurrences of "Total Equity" on page 4', claimed: 2,
        derived: (joined4.match(/Total Equity/gi) || []).length, from: 'the same joined page text' });
      // THE ATTACHMENT TERM, WHICH IS WHAT [B-05] IS ABOUT, counted on this page too.
      rows.push({ what: 'page-4 total captions naming "amounts from any attachments"', claimed: 2,
        derived: (joined4.match(/amounts from any attachments/gi) || []).length, from: 'the same joined page text' });
      // NO ROUNDING OR NEGATIVE INSTRUCTION ON THIS PAGE, which is why no floor is declared.
      for (const re of [/do not enter a negative/i, /negative/i, /round/i])
        rows.push({ what: \`page 4 draws no run matching /\${re.source}/\`, claimed: 0,
          derived: (joined4.match(new RegExp(re.source, 'gi')) || []).length, from: 'every drawn run of page 4, joined' });
      return rows;
    } }),

  D({ id: 'S-46', file: /433b\\.map\\.json$/, at: /^(_no_arguable_item_on_page_4|_the_two_totals_are_not_the_B06_shape)$/,
    kind: 'derived',
    derive: async (ctx) => {
      const map = ctx.mapDoc;
      const ev = map._map_evidence_page4 || [];
      const rows = [
        { what: 'bindings on page 4', claimed: 94, derived: ev.length, from: 'the evidence table this map carries' },
        { what: 'page-4 arguable items', claimed: 0, derived: (map._arguable_page4 || []).length,
          from: "the map's own _arguable_page4, which this slice does not create" },
        { what: 'page-4 cells bound on a CONTAINED column header', claimed: 84,
          derived: ev.filter((e) => e.rule === 'C').length, from: "the evidence table's own pairing verdicts" },
        { what: 'page-4 cells captioned immediately beside their own cell', claimed: 8,
          derived: ev.filter((e) => e.rule === 'L').length, from: "the evidence table's own pairing verdicts" },
        { what: 'page-4 cells bound by the total-line rule', claimed: 2,
          derived: ev.filter((e) => e.rule === 'T').length, from: "the evidence table's own pairing verdicts" },
      ];
      // THE THIRD WITNESS ON THE GRID COLUMNS, re-derived from the drawn page: four money
      // markers on each of the eight grid rows, and none on the two total rows.
      const { readPrintedText } = await import('../adapters/pdf/page-geometry.mjs');
      const pages = await readPrintedText(readFileSync(map.pdf));
      const cash = pages[3].items.filter((t) => t.str === '$');
      rows.push({ what: 'printed "$" marks on page 4', claimed: 34, derived: cash.length,
        from: 'the drawn page: four on each of the eight grid rows, plus one on each of the two total lines' });
      rows.push({ what: 'printed "$" marks on page 4 at a COLUMN marker position', claimed: 32,
        derived: cash.filter((t) => [262.0, 326.8, 391.6, 514.0].some((x) => Math.abs(t.x1 - x) <= 1.0)).length,
        from: 'the same marks, filtered to the four column marker x positions — the remaining two are the total lines, at x 485.2, which is no column\\'s position and is why the two totals are not the [B-06] shape' });
      return rows;
    } }),
`;

lines.splice(anchor, 0, ...BLOCK.split('\n'));
writeFileSync(P, lines.join('\n'));
console.log(`spliced 5 manifest entr(ies) into ${P} at line ${anchor + 1}`);
