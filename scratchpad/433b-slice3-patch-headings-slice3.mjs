// Slice 3's two printed blocks, and the heading each opens.
//
// A group bound under the wrong heading writes a row into the wrong printed table, and on page 4
// nothing about the leaf names would say so: the real-property rows are named 21a to 21d for
// lines the page marks 22a to 22d, and the vehicle rows 22a to 22d for lines it marks 23a to 23d.
// The offset means the VEHICLE rows carry exactly the tokens the REAL-PROPERTY rows are printed
// under — so a binder reading names alone would put the vehicles table into the property table's
// markers. The band is the only check there is.
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'adapters/pdf/maps/433b.headings.json';
const h = JSON.parse(readFileSync(P, 'utf8'));
const EXPECT = 'Slices 1 and 2. Pages 1 to 3. Pages 4 to 6 declare no heading here yet and are NOT claimed to have none — that absence is about this file, not about the form.';
if (h._slice !== EXPECT) {
  console.error(`STOP — the headings file declares ${JSON.stringify(h._slice)}; this patch expects the slice-2 declaration.`);
  process.exit(2);
}

h._slice = 'Slices 1 to 3. Pages 1 to 4. Pages 5 and 6 declare no heading here yet and are NOT claimed to have none — that absence is about this file, not about the form.';

h.headings.push(
  { id: 'REAL_PROPERTY', page: 4, text: 'REAL PROPERTY',
    _at: 'y 715.1, x 43.2..110.5, with "Include all real property and land contracts the business owns/leases/rents." at x 114.9..384.7 on the same baseline. It is the first heading on page 4 and its band runs down to VEHICLES_LEASED_AND_PURCHASED at y 370.5.' },
  { id: 'VEHICLES_LEASED_AND_PURCHASED', page: 4, text: 'VEHICLES, LEASED AND PURCHASED',
    _at: 'y 370.5, x 43.2..191.4, with "Include boats, RVs, motorcycles, all-terrain and off-road vehicles, trailers, mobile homes, etc." at x 195.8..528.3 on the same baseline. It sits 13.4pt below the 22e total row and opens the band 23a to 23e are drawn in. It is the last heading on page 4 and its band runs to the foot of the page.' },
);

h.groups.real_property = {
  heading: 'REAL_PROPERTY',
  _why: 'The four rows are drawn at y 608.4..676.8 (marker 22a), y 540.0..608.4 (22b), y 471.6..540.0 (22c) and y 403.2..471.6 (22d). All four lie strictly below REAL PROPERTY\'s baseline at y 715.1 and strictly above VEHICLES, LEASED AND PURCHASED at y 370.5, which is the next declared heading on the page. THE 22e TOTAL CELL (y 381.6..391.2) IS IN THE SAME BAND AND IS NOT A ROW OF THIS GROUP — it is a scalar, because the page draws it as the block\'s total rather than as a fifth property, which is the same reading 17d, 18f, 19c and 20e already carry.',
};
h.groups.vehicles = {
  heading: 'VEHICLES_LEASED_AND_PURCHASED',
  _why: 'The four rows are drawn at y 262.8..331.2 (marker 23a), y 194.4..262.8 (23b), y 126.0..194.4 (23c) and y 57.6..126.0 (23d). All four lie strictly below VEHICLES, LEASED AND PURCHASED\'s baseline at y 370.5, and there is no heading below it on page 4, so the band runs to the foot of the page. The 23e total cell (y 36.0..45.6) is in the same band and is a scalar for the same reason as 22e. THE BAND IS DOING REAL WORK HERE AND NOT ONLY FORMALLY: these four rows carry the leaf tokens 22a, 22b, 22c and 22d, which are exactly the printed markers of the REAL PROPERTY rows in the band above. Placed by name they would land in the other table.',
};

h._no_other_group_on_page_4 = 'Two groups are declared for this page and the map binds no third on it. Derived rather than asserted: adapters/pdf/verify-headings.mjs takes every group in the map whose slots bind a page-4 target and requires a heading declaration for each, so a group added to the map without one is a STOP rather than a silence.';

writeFileSync(P, JSON.stringify(h, null, 1) + '\n');
console.log(`${P}: ${h.headings.length} heading(s), ${Object.keys(h.groups).length} group(s) placed`);
