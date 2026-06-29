import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'scripts/check-country-detail-profile-runtime.mjs');
let value = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    'if (profiles.length !== 52) fail(`runtime must contain 52 profile-v2 records; found ${profiles.length}`);',
    'if (profiles.length !== 60) fail(`runtime must contain 60 profile-v2 records; found ${profiles.length}`);'
  ],
  [
    "for (const countryId of ['japan', 'hong-kong', 'malaysia', 'thailand', 'philippines', 'mauritius', 'argentina', 'germany', 'italy', 'spain', 'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia']) {",
    "for (const countryId of ['japan', 'hong-kong', 'malaysia', 'thailand', 'philippines', 'mauritius', 'argentina', 'germany', 'italy', 'spain', 'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia', 'cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium']) {"
  ],
  [
    'for (let deliveryNo = 13; deliveryNo <= 52; deliveryNo += 1) {',
    'for (let deliveryNo = 13; deliveryNo <= 60; deliveryNo += 1) {'
  ],
  [
    "for (const token of ['countryPageCountries3744', 'countryPageSources3744', 'countryPageCountries4552', 'countryPageSources4552']) {",
    "for (const token of ['countryPageCountries3744', 'countryPageSources3744', 'countryPageCountries4552', 'countryPageSources4552', 'countryPageCountries5360', 'countryPageSources5360']) {"
  ]
];

for (const [before, after] of replacements) {
  if (value.includes(after) && !value.includes(before)) continue;
  const count = value.split(before).length - 1;
  if (count !== 1) throw new Error(`expected one runtime validator replacement, found ${count}`);
  value = value.replace(before, after);
}

fs.writeFileSync(file, value);
console.log('PATCHED_PROFILE_RUNTIME_53_60');
