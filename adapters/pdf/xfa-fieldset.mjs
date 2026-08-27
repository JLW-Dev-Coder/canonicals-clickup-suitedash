// WHAT A FORM WITH NO ACROFORM ASKS, DERIVED FROM ITS XFA TEMPLATE PACKET.
//
//   node adapters/pdf/xfa-fieldset.mjs <form>           # write adapters/pdf/maps/<form>.xfa-fieldset.json
//   node adapters/pdf/xfa-fieldset.mjs <form> --check   # re-derive and compare, writing nothing
//
//   exit 0 = written, or (with --check) the file on disk is what this tool produces
//   exit 2 = the packet cannot be read, the form does not have the shape this tool describes,
//            or --check differs
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THIS IS NOT A MAP AND MUST NOT BECOME ONE
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A map in this engine binds an input key to a widget on a pinned page, and every binding is
// proved against the DRAWN PAGE BYTES. Nothing here is a binding and nothing here is drawn.
// 433-H has ONE static page and that page carries the Adobe Reader placeholder; its field
// definitions, its captions, its revision and its catalogue number all live inside the XFA
// template packet, which is a DESCRIPTION OF A FORM rather than a form. [D-02] recorded that
// distinction as a scope change; this file is the evidence under it, and the artefact is
// deliberately named `.xfa-fieldset.json` rather than `.map.json` so that MAPPED_FORMS() —
// which selects on `.map.json` — cannot pick this form up and demand a fixture, a gate and a
// fill engine for a form that has no widget to fill.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE BIND DIRECTIVE IS THE FACT THIS FILE EXISTS TO RECORD
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// XFA's `<bind>` element decides whether a field can be populated FROM A DATA FILE at all:
//
//   <bind match="none"/>   the field is not connected to the data DOM. No datasets packet can
//                          reach it, in any conforming processor. It is filled by a person
//                          typing into a viewer, and by nothing else.
//   <bind match="global"/> the field binds from the global data scope.
//   (no <bind> element)    XFA's default — match once, by name.
//
// A route that fills this form by writing a datasets packet has a CEILING, and the ceiling is
// the count of fields whose bind directive admits data at all. That count is DERIVED here on
// every run rather than estimated once, which is the difference [R-31] is about.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// NO NUMBER IN THE OUTPUT IS TYPED
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// Every count in the artefact is computed from the extraction on the run that writes it, and
// `--check` re-derives the whole file from the pinned blank and compares BYTE FOR BYTE. That is
// the ground [SB-23] claims this file on, and the crosscheck there reads this tool's name out of
// the artefact's own `_generator` and then looks for it in package.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { PDFDocument, PDFName } from 'pdf-lib';
import { assertGenerator, selfPath } from '../hubspot/generator-guard.mjs';

export const formPath = (form) => `adapters/pdf/forms/f${form}.pdf`;
export const fieldsetPath = (form) => `adapters/pdf/maps/${form}.xfa-fieldset.json`;

// ---------------------------------------------------------------------------------------
// THE PACKETS.
//
// /XFA is an array of alternating (name, stream) pairs. The names are PDF STRINGS rather than
// PDF names, and the streams may be Flate-compressed. Both are read here rather than assumed,
// and AN UNREADABLE PACKET IS A STOP — never a packet quietly treated as empty, which is the
// shape [R-04] refuses and the shape that made a guard print PASS over an input it could not
// read.
// ---------------------------------------------------------------------------------------
export const readPackets = async (pdfPath) => {
  const problems = [];
  if (!existsSync(pdfPath)) return { packets: null, problems: [`${pdfPath} is not in this tree.`] };
  const bytes = readFileSync(pdfPath);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const acro = doc.catalog.lookup(PDFName.of('AcroForm'));
  if (!acro) return { packets: null, problems: [`${pdfPath} has no /AcroForm, so it carries no /XFA either.`] };
  const fieldsArr = acro.lookup(PDFName.of('Fields'));
  const xfa = acro.lookup(PDFName.of('XFA'));
  if (!xfa || typeof xfa.asArray !== 'function') {
    return { packets: null, problems: [`${pdfPath} carries no /XFA array. This tool reads XFA packets and has no input on this document.`] };
  }
  const arr = xfa.asArray();
  const packets = [];
  for (let i = 0; i + 1 < arr.length; i += 2) {
    const nameObj = doc.context.lookup(arr[i]);
    const stream = doc.context.lookup(arr[i + 1]);
    const name = nameObj && typeof nameObj.decodeText === 'function' ? nameObj.decodeText() : String(nameObj);
    if (!stream || typeof stream.getContents !== 'function') {
      problems.push(`packet "${name}" in ${pdfPath} is not a stream, so its bytes cannot be read.`);
      continue;
    }
    let raw = Buffer.from(stream.getContents());
    const filter = stream.dict && stream.dict.lookup(PDFName.of('Filter'));
    if (filter && String(filter).includes('FlateDecode')) {
      try {
        raw = inflateSync(raw);
      } catch (e) {
        problems.push(`packet "${name}" in ${pdfPath} is declared FlateDecode and will not inflate: ${e.message}. An unreadable packet is a STOP, not an empty one.`);
        continue;
      }
    }
    packets.push({ name, bytes: raw.length, text: raw.toString('utf8') });
  }
  return {
    packets,
    acroform_field_entries: fieldsArr && typeof fieldsArr.size === 'function' ? fieldsArr.size() : 0,
    drawn_pages: doc.getPageCount(),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    problems,
  };
};

// ---------------------------------------------------------------------------------------
// THE SCANNER — a tag walker, not a general XML parser, and the difference is declared.
//
// WHAT IT SWEEPS [R-15]: every element in the packet text handed to it. It tracks open, close
// and self-closing tags; processing instructions and comments are skipped as whole tokens. It
// ASSUMES the well-formed, machine-emitted output of Adobe Designer, which is what every packet
// in this tree is, and that assumption is CHECKED rather than trusted — build() compares the
// field count this walk produces against a raw count of `<field` openings taken without the
// walk. A walk that lost a subtree disagrees, and a field set that is quietly short is exactly
// the failure this tool would otherwise report as a clean answer.
// ---------------------------------------------------------------------------------------
export const scan = (xml) => {
  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const re = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*"[^"]*")*)\s*(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->/g;
  let m;
  let last = 0;
  while ((m = re.exec(xml))) {
    const chunk = xml.slice(last, m.index);
    if (chunk) stack[stack.length - 1].text += chunk;
    last = re.lastIndex;
    if (m[2] === undefined) continue;
    const [, close, tag, attrStr, selfClose] = m;
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = {};
    const ar = /([\w.:-]+)\s*=\s*"([^"]*)"/g;
    let a;
    while ((a = ar.exec(attrStr))) attrs[a[1]] = a[2];
    const node = { tag, attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
};

const decode = (s) => String(s)
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  .replace(/&amp;/g, '&');

export const allText = (node) => {
  let out = decode(node.text || '');
  for (const c of node.children) out += ` ${allText(c)}`;
  return out.replace(/\s+/g, ' ').trim();
};

// ---------------------------------------------------------------------------------------
// THE FIELD SET.
//
// The SOM path is built from the NAMED ancestor subforms. An unnamed subform is TRANSPARENT to
// the path, which is XFA's own rule and not a convenience: giving it a placeholder level would
// invent a level the form does not have, and every path below would then be a path no processor
// would resolve.
//
// `<draw>` is skipped and it is skipped BY NAME rather than by falling through: a draw is static
// printed text, it is never a cell anybody fills, and its caption belongs to the field beside it.
// ---------------------------------------------------------------------------------------
export const extractFields = (templateXml) => {
  const root = scan(templateXml);
  const fields = [];
  const walk = (node, som) => {
    for (const c of node.children) {
      if (c.tag === 'subform' || c.tag === 'exclGroup') {
        walk(c, c.attrs.name ? som.concat(c.attrs.name) : som);
      } else if (c.tag === 'field') {
        const kid = (t) => c.children.find((x) => x.tag === t);
        const ui = kid('ui');
        const caption = kid('caption');
        const assist = kid('assist');
        const bind = kid('bind');
        const name = c.attrs.name || '(unnamed)';
        fields.push({
          som: som.concat(name).join('.'),
          name,
          ui: ui && ui.children.length ? ui.children[0].tag : '(no ui element)',
          bind: bind ? (bind.attrs.match || '(bind element with no match attribute)') : '(no bind element)',
          caption: caption ? allText(caption) : '',
          assist: assist ? allText(assist) : '',
        });
        walk(c, som.concat(name));
      } else if (c.tag === 'pageSet') {
        walk(c, som);
      } else if (c.tag !== 'draw' && c.tag !== 'proto') {
        walk(c, som);
      }
    }
  };
  walk(root, []);
  return fields;
};

// The bind directives that admit data from a datasets packet. `none` is the template DECLINING,
// and it is the only value that is exact in the other direction: no conforming processor
// overrides it.
export const BINDABLE = ['(no bind element)', 'global', 'once', 'dataRef'];

export const build = async (form) => {
  const problems = [];
  const pdfPath = formPath(form);
  const read = await readPackets(pdfPath);
  if (!read.packets) return { doc: null, problems: read.problems };
  problems.push(...read.problems);

  const template = read.packets.find((p) => p.name === 'template');
  if (!template) {
    problems.push(`${pdfPath} carries no "template" packet, so there is no field set to derive. Packets present: ${read.packets.map((p) => p.name).join(', ')}.`);
    return { doc: null, problems };
  }

  const fields = extractFields(template.text);

  const rawFieldOpenings = (template.text.match(/<field\b/g) || []).length;
  if (rawFieldOpenings !== fields.length) {
    problems.push(`the tag walk found ${fields.length} field(s) and a raw count of "<field" openings in the same packet found ${rawFieldOpenings}. The walk lost or invented a subtree, and the field set it produced cannot be trusted.`);
  }

  // ZERO IS A STOP, AND THE GUARD SWEEP IS WHAT FOUND THAT IT WAS NOT.
  //
  // The agreement check above compares two readings of the same packet, and BOTH GO TO ZERO
  // TOGETHER on an input neither can read — an empty template packet, a packet whose bytes
  // inflated to something that is not XFA, or a `<field` spelling this walk does not know. The
  // two then AGREE, the artefact writes `fields: 0`, and `--check` reports "regenerates
  // byte-identical" over a form whose field set nothing actually read. That is [R-04] exactly:
  // zero examined is not a pass, and a guard whose input is empty reports the same thing as a
  // guard with nothing to check. A template packet with no fields in it is not a form.
  // WRITTEN WITHOUT A `problems.length &&` PREFIX, AND THAT IS THE POINT. The first draft of
  // this very fix read `if (!problems.length && fields.length === 0)`, which is `nums.length &&
  // mismatch` — the exact shape [R-17] is named for and the shape this check exists to remove —
  // and the guard sweep reported it UNDISPOSED on the run that landed it. [R-12]: expect the fix
  // to reproduce the defect class it fixes. The condition is now the single fact it is about.
  if (fields.length === 0) {
    problems.push(`the template packet in ${pdfPath} is ${template.bytes} byte(s) and yielded ZERO fields, and the raw "<field" count agrees at zero. Two readings that go to zero together are not agreement — they are the same blindness twice. A template packet describing no fields is not a form this tool can report on.`);
  }

  const tally = (key) => {
    const out = {};
    for (const f of fields) out[f[key]] = (out[f[key]] || 0) + 1;
    return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  };

  const dynamicRender = (() => {
    const cfg = read.packets.find((p) => p.name === 'config');
    if (!cfg) return '(no config packet)';
    const m = /<dynamicRender[^>]*>([^<]*)</.exec(cfg.text);
    return m ? m[1].trim() : '(the config packet declares no dynamicRender)';
  })();

  const bindableSet = new Set(BINDABLE);
  const bindable = fields.filter((f) => bindableSet.has(f.bind));

  const doc = {
    _what_this_is: 'THE FIELD SET A FORM WITH NO ACROFORM ASKS FOR, read out of its XFA template packet. IT IS NOT A MAP: nothing here is bound to a widget, because there is no widget to bind to. The generator named below carries the whole argument.',
    _generator: 'adapters/pdf/xfa-fieldset.mjs',
    _source_pdf: pdfPath,
    _source_sha256: read.sha256,
    _why_it_is_not_a_map: 'A map in this engine binds an input key to a widget on a pinned page, and every binding is proved against the drawn page bytes. This form draws ONE static page and that page is the Adobe Reader placeholder. Every caption, every field name and the revision itself come out of the template packet, which is a description of a form rather than a form, and [D-02] recorded that as a scope change rather than as a mapping problem.',
    _the_revision_cannot_be_pinned_the_way_every_other_form_pins_it: 'The standing rule is that a form revision is never asserted from anything but its DRAWN PAGE BYTES. On this form the drawn bytes are the placeholder sentence and carry no revision, no catalogue number and no form number at all. Anything this file or any other records about this form revision is read from a packet, and that is evidence of a different kind. It is recorded as what it is and is not upgraded by being written down.',
    packets: read.packets.map((p) => ({ name: p.name, bytes: p.bytes })),
    _what_the_packet_list_settles: 'A form whose packet list carries `datasets` and `form` ships MERGED: a viewer has a pre-computed form DOM and, beside it, an AcroForm shadow it can fill without an XFA engine at all. A form whose list carries neither ships UNMERGED and must be laid out by an XFA processor at open time. That difference is the whole of why five forms in this tree fill and this one does not.',
    acroform: {
      field_entries: read.acroform_field_entries,
      drawn_pages: read.drawn_pages,
      _what_those_two_numbers_mean: 'The number of top-level entries in /AcroForm /Fields on the pinned blank, and the number of pages a reader that ignores XFA reports. A form this engine can fill has a populated AcroForm beside its XFA; a form it cannot has an empty one and a single placeholder page.',
    },
    dynamic_render: dynamicRender,
    _dynamic_render_is_the_form_declaring_its_own_kind: 'The config packet <dynamicRender> is the form saying whether a viewer may render it statically. `forbidden` is a form with a pre-generated AcroForm shadow, which is what every form this engine fills declares. `required` is a form with no shadow, which must be laid out by an XFA processor at open time.',
    counts: {
      fields: fields.length,
      by_ui: tally('ui'),
      by_bind_directive: tally('bind'),
      fields_a_datasets_packet_could_reach: bindable.length,
      fields_the_template_refuses_to_bind: fields.length - bindable.length,
    },
    _what_the_bind_counts_bound: 'fields_a_datasets_packet_could_reach is a CEILING on any route that fills this form by writing data into it, and it is a ceiling rather than an achieved figure: a field whose directive admits data still has to be reached by a data hierarchy that matches it, and that is a separate question this file does not answer. fields_the_template_refuses_to_bind is EXACT in the other direction — <bind match="none"/> is the template declining, and no conforming processor overrides it.',
    fields,
  };
  return { doc, problems };
};

// ---------------------------------------------------------------------------------------
// THE CANARY. Every detector carries one, and this file is a detector: it searches by pattern
// over text it did not enumerate and it can stop a run.
//
// NOT ONE PLANTED BYTE IS DRAWN FROM THE ARTEFACTS. The template below is written here, and it
// is written to be the shapes this walker can get wrong rather than the shapes it obviously
// gets right. Both directions are planted throughout: a walker that found EVERYTHING would pass
// a false-negative-only canary, and a walker that found NOTHING would pass a false-positive-only
// one, so every case asserts an exact yield rather than a non-empty one.
//
// The case that matters most is `unnamed-subform-is-transparent`. XFA's rule is that a subform
// with no name contributes no level to the SOM path; a walker that invented a placeholder level
// would produce paths that look entirely reasonable and that no processor would ever resolve,
// and NOTHING DOWNSTREAM WOULD SAY SO — the artefact would regenerate byte-identical from the
// same wrong walk forever. It is the [D-12] shape: a canary that covers the comparator and not
// the thing that builds the population is a canary for the half that already worked.
// ---------------------------------------------------------------------------------------
export const CANARY_TEMPLATE = [
  '<template xmlns="http://www.xfa.org/schema/xfa-template/3.6/">',
  '<subform name="zz_root">',
  // (a) a plain named field under a named subform, with a caption and no bind element
  '<subform name="zz_named"><field name="zz_plain"><ui><textEdit/></ui>',
  '<caption><value><text>Plain &amp; captioned</text></value></caption></field></subform>',
  // (b) an UNNAMED subform: transparent to the SOM path
  '<subform><field name="zz_transparent"><ui><numericEdit/></ui><bind match="none"/></field></subform>',
  // (c) a global bind, self-closed ui
  '<subform name="zz_g"><field name="zz_global"><ui><checkButton/></ui><bind match="global"/></field></subform>',
  // (d) a draw, which is NOT a field and must not be counted
  '<subform name="zz_d"><draw name="zz_drawing"><value><text>not a field</text></value></draw></subform>',
  // (e) a field with no ui element at all
  '<subform name="zz_n"><field name="zz_noui"><bind match="once"/></field></subform>',
  '</subform>',
  '</template>',
].join('');

/** The number of planted cases this canary declares. Asserted against what actually ran. */
export const CANARY_CASES = 12;

export const canary = () => {
  const results = [];
  const got = extractFields(CANARY_TEMPLATE);
  const bySom = new Map(got.map((f) => [f.som, f]));
  const expect = (what, cond, saw) => results.push({ what, ok: !!cond, saw });

  // THE POPULATION ITSELF, in both directions at once: FOUR fields are planted, and the planted
  // <draw> must not be among them. An exact count is the only assertion that catches both a
  // walker that dropped a subform and one that counted the draw.
  //
  // THIS CLAIM WAS WRONG ON ITS FIRST RUN AND THE CLAIM WAS CORRECTED, NOT THE COMPARISON. It
  // was written as five — the number of `<subform>` blocks below — and derived four, because one
  // of those blocks holds the planted draw and a draw is not a field. The walker was right. That
  // is [G-184]'s shape and it is recorded here rather than tidied away, because a canary whose
  // first disagreement is resolved by relaxing it is a canary that will never disagree again.
  expect('four planted field(s) found, and the planted <draw> is not among them', got.length === 4, `${got.length} field(s): ${got.map((f) => f.som).join(', ')}`);
  expect('the planted <draw> is not read as a field', !got.some((f) => f.name === 'zz_drawing'), got.map((f) => f.name).join(','));

  expect('a named subform contributes its level to the SOM path', bySom.has('zz_root.zz_named.zz_plain'), [...bySom.keys()].join(', '));
  // THE ONE THAT WOULD BE SILENT FOREVER.
  expect('an UNNAMED subform is transparent to the SOM path', bySom.has('zz_root.zz_transparent') && !bySom.has('zz_root.(unnamed).zz_transparent'), [...bySom.keys()].join(', '));

  expect('<bind match="none"/> is read as none', bySom.get('zz_root.zz_transparent')?.bind === 'none', bySom.get('zz_root.zz_transparent')?.bind);
  expect('<bind match="global"/> is read as global', bySom.get('zz_root.zz_g.zz_global')?.bind === 'global', bySom.get('zz_root.zz_g.zz_global')?.bind);
  expect('a field with no <bind> element says so rather than defaulting', bySom.get('zz_root.zz_named.zz_plain')?.bind === '(no bind element)', bySom.get('zz_root.zz_named.zz_plain')?.bind);

  expect('the ui kind is read from the first child of <ui>', bySom.get('zz_root.zz_g.zz_global')?.ui === 'checkButton', bySom.get('zz_root.zz_g.zz_global')?.ui);
  expect('a field with no <ui> element says so rather than defaulting', bySom.get('zz_root.zz_n.zz_noui')?.ui === '(no ui element)', bySom.get('zz_root.zz_n.zz_noui')?.ui);

  expect('caption text is extracted and entity-decoded', bySom.get('zz_root.zz_named.zz_plain')?.caption === 'Plain & captioned', bySom.get('zz_root.zz_named.zz_plain')?.caption);

  // THE CROSS-CHECK'S OWN CONTROL. build() compares the walk against a raw `<field` count, and
  // that comparison is only evidence if the two agree on an input that is known good.
  const raw = (CANARY_TEMPLATE.match(/<field\b/g) || []).length;
  expect('the raw "<field" count agrees with the walk on a known-good input', raw === got.length, `raw ${raw} vs walk ${got.length}`);

  // AND THE VACUOUS DIRECTION, WHICH IS WHY [G-276] EXISTS. An empty packet must yield an empty
  // set here — the STOP that turns that into a failure lives in build(), and this asserts the
  // input to it rather than assuming it.
  expect('an empty template yields zero fields, which build() refuses', extractFields('').length === 0, String(extractFields('').length));

  // THE CASE COUNT IS DECLARED AND ASSERTED BEFORE `every` IS ASKED, and the guard sweep is what
  // required it. `results.every(...)` is TRUE OF AN EMPTY LIST, so a canary whose cases had been
  // removed, short-circuited or never reached would report "holds" over nothing at all — the
  // vacuous shape, inside the instrument written to stop the vacuous shape. success-sweep.mjs
  // carries the same construct for the same reason: a shortened list cannot make `every` true.
  if (results.length !== CANARY_CASES) {
    results.push({ what: `the canary declares ${CANARY_CASES} case(s) and ran ${results.length}`, ok: false, saw: `${results.length} case(s) ran; a canary that reports on fewer cases than it declares is reporting on a set nobody chose` });
  }
  return { ok: results.every((r) => r.ok), results };
};

if (process.argv[1] && /xfa-fieldset\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  // THE CANARY RUNS FIRST AND UNCONDITIONALLY. A walker that has gone blind must not reach the
  // point of writing an artefact or reporting that one regenerates.
  const c = canary();
  if (!c.ok) {
    console.error(`XFA FIELD SET CANARY — ${c.results.filter((r) => !r.ok).length} of ${c.results.length} planted case(s) failed:`);
    for (const r of c.results.filter((x) => !x.ok)) console.error(`  ${r.what}\n      saw: ${r.saw}`);
    process.exit(2);
  }
  // `--canary` AS THE FIRST ARGUMENT means run the canary and nothing else. Written as an exact
  // comparison rather than as a search of argv with a shape test on the form id beside it: that
  // draft was two conditions where one fact was being asked about, and the guard sweep reported
  // it as a site nobody had disposed of. It was right to.
  if (process.argv[2] === '--canary') {
    console.log(`canary holds: ${c.results.length} of ${CANARY_CASES} planted case(s) as expected.`);
    process.exit(0);
  }
  const form = process.argv[2];
  if (!form) {
    console.error('usage: node adapters/pdf/xfa-fieldset.mjs <form> [--check]');
    process.exit(1);
  }
  const { doc, problems } = await build(form);
  if (!doc || problems.length) {
    const n = problems.length;
    console.error(`XFA FIELD SET — ${n} problem(s) deriving ${form}:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(2);
  }
  const out = fieldsetPath(form);
  const would = `${JSON.stringify(doc, null, 1)}\n`;
  if (process.argv.includes('--check')) {
    // THE DIFFERENCE COUNT IS COMPUTED FIRST AND THE SUCCESS LINE IS ENCLOSED BY IT, which is
    // the shape success-sweep.mjs requires: a sentence reporting a clean run is guarded by the
    // condition it reports on, not by a reader's tracing of the exits above it.
    const diffs = [];
    if (!existsSync(out)) diffs.push(`${out} does not exist. --check compares; it does not create.`);
    else if (readFileSync(out, 'utf8') !== would) diffs.push(`${out} is not what ${selfPath(process.argv[1])} produces from the pinned blank. Regenerate it and read the difference before committing it.`);
    if (diffs.length) {
      console.error(`XFA FIELD SET — ${diffs.length} problem(s):`);
      for (const d of diffs) console.error(`  ${d}`);
      process.exit(2);
    }
    if (!diffs.length) {
      console.log(`canary holds: ${c.results.length} of ${CANARY_CASES} planted case(s) as expected.`);
      console.log(`EXAMINED xfa-fieldset ${form} ${doc.counts.fields} xfa-template-fields`);
      console.log(`OK — 0 difference(s): ${out} regenerates byte-identical from the pinned blank (${doc.counts.fields} field(s); ${doc.counts.fields_a_datasets_packet_could_reach} a datasets packet could reach, ${doc.counts.fields_the_template_refuses_to_bind} the template refuses to bind; dynamicRender=${doc.dynamic_render}).`);
    }
    process.exit(diffs.length ? 2 : 0);
  }
  if (existsSync(out)) assertGenerator(out, selfPath(process.argv[1]));
  writeFileSync(out, would);
  console.log(`wrote ${out} — ${doc.counts.fields} field(s) from the template packet; ${doc.counts.fields_a_datasets_packet_could_reach} a datasets packet could reach, ${doc.counts.fields_the_template_refuses_to_bind} the template refuses to bind; dynamicRender=${doc.dynamic_render}.`);
}
