// A GENERATED ARTEFACT DECLARES ITS GENERATOR, AND THE GENERATOR ASSERTS IT IS THE DECLARED ONE.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT EXISTS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// There are THREE field-file generators in this directory and one output shape between them:
//
//   fields.433a.json    <- gen-fields-from-map.mjs         (transforms 433-A's map keys)
//   fields.433f.json    <- gen-fields-from-crosswalk.mjs   (transcribes the 433-F crosswalk)
//   fields.433aoi.json  <- derive-names-433aoi.mjs         (derives from the classification)
//
// They are not interchangeable and they do not share a vocabulary. `gen-fields-from-map.mjs`
// takes a form argument and will happily write `fields.433f.json` from `433f.map.json` — which
// is what happened: 433-F's definition file was rewritten by the wrong tool, silently, in the
// map's vocabulary instead of the crosswalk's, WITH A GROUP DROPPED. Nothing failed. It was
// caught by a person reading a 1,260-line diff, which is not a check.
//
// The mechanism is one line in the artefact and one assertion in each generator:
//
//   the artefact  meta.generator names the tool entitled to write this file
//   the generator refuses to overwrite a file whose meta.generator names a DIFFERENT tool
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// WHY IT IS A STOP AND NOT A WARNING
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// The output of these files is 91 to 238 PERMANENT HubSpot property definitions. HubSpot does
// not free a property name — a wrong one is not withdrawn, it is deprecated in place and
// occupies its name against a ceiling for the life of the portal. A generator writing the
// wrong file is not a build artefact to be regenerated; it is a plan to create the wrong
// permanent objects, and the only safe moment to stop it is before the write.
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// THE FIRST RUN, AND WHY ABSENCE IS NOT CONSENT
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// A file that does not exist yet has no declaration to contradict, so the first write is
// allowed and stamps the declaration. A file that EXISTS AND DECLARES NOTHING is a different
// case and is a STOP: it means either a generator wrote it before this guard existed, or
// something wrote it that is not a generator at all. Neither licenses an overwrite, and
// `--adopt` makes the adoption an explicit act with a name on it rather than a silent default.

import { readFileSync, existsSync } from 'node:fs';

/** The repo-relative path of the running script, normalised for comparison. */
export const selfPath = (argv1) => {
  const p = String(argv1 || '').replace(/\\/g, '/');
  const i = p.indexOf('adapters/');
  return i >= 0 ? p.slice(i) : p;
};

/**
 * Assert that `target` is a file THIS generator is entitled to write.
 *
 * @param {string} target    repo-relative path of the file about to be written
 * @param {string} self      repo-relative path of the running generator (use selfPath(process.argv[1]))
 * @param {object} opts      { adopt: boolean } — permit stamping a file that declares no generator
 * @returns {{ verdict: string, declared: string|null }}
 *
 * Throws on a mismatch. The caller does not get to continue with a warning.
 */
export const assertGenerator = (target, self, { adopt = false } = {}) => {
  if (!existsSync(target)) return { verdict: 'first-write', declared: null };

  let doc;
  try { doc = JSON.parse(readFileSync(target, 'utf8')); }
  catch (e) {
    // AN UNREADABLE TARGET IS NOT AN ABSENT ONE. A file that will not parse may still hold a
    // declaration; overwriting it would destroy the only evidence of who wrote it.
    throw new Error(
      `GENERATOR GUARD — ${target} exists and will not parse (${e.message}).\n` +
      `  It may carry a declaration naming a different generator, and overwriting it would destroy that evidence.\n` +
      `  Read the file before regenerating it.`);
  }

  const declared = doc?.meta?.generator ?? null;
  if (declared === null) {
    if (adopt) return { verdict: 'adopted', declared: null };
    throw new Error(
      `GENERATOR GUARD — ${target} exists and declares no meta.generator.\n` +
      `  ${self} is about to overwrite it and cannot tell whether it is the tool that wrote it.\n` +
      `  Either something wrote this file before the guard existed, or something wrote it that is not a generator.\n` +
      `  Neither is consent. Re-run with --adopt to stamp ${self} as its generator, which is a decision with a name on it.`);
  }
  if (declared !== self) {
    throw new Error(
      `GENERATOR GUARD — ${target} declares its generator as:\n` +
      `      ${declared}\n` +
      `  and the tool trying to write it is:\n` +
      `      ${self}\n` +
      `  These are not interchangeable. There are three field-file generators in this repo and one output shape\n` +
      `  between them; the wrong one produces the right SHAPE in the wrong VOCABULARY, which is how fields.433f.json\n` +
      `  was once rewritten from a map instead of a crosswalk with a group dropped and nothing failed.\n` +
      `  These definitions become permanent HubSpot property names, and HubSpot does not free a name.\n` +
      `  If the ownership is genuinely meant to move, change meta.generator in ${target} in its own commit, and say why.`);
  }
  return { verdict: 'confirmed', declared };
};

/**
 * The block every generated field file carries. Callers spread this into their `meta`.
 * `generator` is the KEY THE ASSERTION READS — one spelling across all three files, because
 * `fields.433aoi.json` used to say `deriver` and an assertion cannot find a key by meaning.
 */
export const generatorMeta = (self, { generated_from }) => ({
  generator: self,
  generated_from,
  _generator_rule: 'adapters/hubspot/generator-guard.mjs asserts, before every write, that this file already declares THIS tool. A different generator writing here is a STOP, not a warning: these definitions become permanent HubSpot property names and HubSpot does not free a name.',
});
