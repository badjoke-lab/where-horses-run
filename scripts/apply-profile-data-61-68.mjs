import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/lib/data.ts');
let value = fs.readFileSync(file, 'utf8');
const replace = (before, after) => {
  if (value.includes(after) && !value.includes(before)) return;
  if ((value.split(before).length - 1) !== 1) throw new Error(`data.ts patch target missing: ${before.slice(0, 60)}`);
  value = value.replace(before, after);
};

replace(
  "import countryPageCountries5360 from '../../data/static/country-page-countries-53-60.json';",
  "import countryPageCountries5360 from '../../data/static/country-page-countries-53-60.json';\nimport countryPageCountries6168 from '../../data/static/country-page-countries-61-68.json';"
);
replace(
  "import countryProfilesV260Belgium from '../../data/static/country-profiles-v2-60-belgium.json';",
  "import countryProfilesV260Belgium from '../../data/static/country-profiles-v2-60-belgium.json';\nimport countryProfilesV261Slovenia from '../../data/static/country-profiles-v2-61-slovenia.json';\nimport countryProfilesV262Croatia from '../../data/static/country-profiles-v2-62-croatia.json';\nimport countryProfilesV263DominicanRepublic from '../../data/static/country-profiles-v2-63-dominican-republic.json';\nimport countryProfilesV264Tunisia from '../../data/static/country-profiles-v2-64-tunisia.json';\nimport countryProfilesV265Lebanon from '../../data/static/country-profiles-v2-65-lebanon.json';\nimport countryProfilesV266Libya from '../../data/static/country-profiles-v2-66-libya.json';\nimport countryProfilesV267MainlandChina from '../../data/static/country-profiles-v2-67-mainland-china.json';\nimport countryProfilesV268Indonesia from '../../data/static/country-profiles-v2-68-indonesia.json';"
);
replace(
  "import countryPageSources5360 from '../../data/static/country-page-sources-53-60.json';",
  "import countryPageSources5360 from '../../data/static/country-page-sources-53-60.json';\nimport countryPageSources6168 from '../../data/static/country-page-sources-61-68.json';"
);
replace(
  '  ...countryPageCountries4552,\n  ...countryPageCountries5360\n] as const;',
  '  ...countryPageCountries4552,\n  ...countryPageCountries5360,\n  ...countryPageCountries6168\n] as const;'
);
replace(
  '  ...countryProfilesV258Ecuador,\n  ...countryProfilesV259Venezuela,\n  ...countryProfilesV260Belgium\n] as const;',
  '  ...countryProfilesV258Ecuador,\n  ...countryProfilesV259Venezuela,\n  ...countryProfilesV260Belgium,\n  ...countryProfilesV261Slovenia,\n  ...countryProfilesV262Croatia,\n  ...countryProfilesV263DominicanRepublic,\n  ...countryProfilesV264Tunisia,\n  ...countryProfilesV265Lebanon,\n  ...countryProfilesV266Libya,\n  ...countryProfilesV267MainlandChina,\n  ...countryProfilesV268Indonesia\n] as const;'
);
replace(
  '  ...countryPageSources4552,\n  ...countryPageSources5360\n] as const;',
  '  ...countryPageSources4552,\n  ...countryPageSources5360,\n  ...countryPageSources6168\n] as const;'
);
fs.writeFileSync(file, value);
console.log('APPLIED_PROFILE_DATA_61_68');
