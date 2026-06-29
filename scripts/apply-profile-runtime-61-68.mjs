import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'scripts/check-country-detail-profile-runtime.mjs');
let value = fs.readFileSync(file, 'utf8');
const replace = (before, after) => {
  if (value.includes(after) && !value.includes(before)) return;
  const count = value.split(before).length - 1;
  if (count !== 1) throw new Error(`runtime patch target missing: ${before.slice(0, 80)}`);
  value = value.replace(before, after);
};

replace(
  'if (profiles.length !== 60) fail(`runtime must contain 60 profile-v2 records; found ${profiles.length}`);',
  'if (profiles.length !== 68) fail(`runtime must contain 68 profile-v2 records; found ${profiles.length}`);'
);
replace(
  "'cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium']) {",
  "'cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium', 'slovenia', 'croatia', 'dominican-republic', 'tunisia', 'lebanon', 'libya', 'mainland-china', 'indonesia']) {"
);
replace(
  'for (let deliveryNo = 13; deliveryNo <= 60; deliveryNo += 1) {',
  'for (let deliveryNo = 13; deliveryNo <= 68; deliveryNo += 1) {'
);
replace(
  "'countryPageCountries5360', 'countryPageSources5360']) {",
  "'countryPageCountries5360', 'countryPageSources5360', 'countryPageCountries6168', 'countryPageSources6168']) {"
);
fs.writeFileSync(file, value);
console.log('APPLIED_PROFILE_RUNTIME_61_68');
