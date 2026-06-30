import fs from 'node:fs';

await import('./apply-profile-v2-85-92-loader.mjs');

const file = 'src/lib/data.ts';
let text = fs.readFileSync(file, 'utf8');

if (!text.includes('countryPageCountries9398')) {
  text = text.replace(
    "import countryPageCountries8592 from '../../data/static/country-page-countries-85-92.json';",
    "import countryPageCountries8592 from '../../data/static/country-page-countries-85-92.json';\nimport countryPageCountries9398 from '../../data/static/country-page-countries-93-98.json';"
  );
  text = text.replace(
    "import countryProfilesV292CostaRica from '../../data/static/country-profiles-v2-92-costa-rica.json';",
    "import countryProfilesV292CostaRica from '../../data/static/country-profiles-v2-92-costa-rica.json';\nimport countryProfilesV293Nicaragua from '../../data/static/country-profiles-v2-93-nicaragua.json';\nimport countryProfilesV294ElSalvador from '../../data/static/country-profiles-v2-94-el-salvador.json';\nimport countryProfilesV295Tanzania from '../../data/static/country-profiles-v2-95-tanzania.json';\nimport countryProfilesV296Singapore from '../../data/static/country-profiles-v2-96-singapore.json';\nimport countryProfilesV297Macau from '../../data/static/country-profiles-v2-97-macau.json';\nimport countryProfilesV298Greece from '../../data/static/country-profiles-v2-98-greece.json';"
  );
  text = text.replace(
    "import countryPageSources8592 from '../../data/static/country-page-sources-85-92.json';",
    "import countryPageSources8592 from '../../data/static/country-page-sources-85-92.json';\nimport countryPageSources9398 from '../../data/static/country-page-sources-93-98.json';"
  );
  text = text.replace("  ...countryPageCountries8592\n] as const;", "  ...countryPageCountries8592,\n  ...countryPageCountries9398\n] as const;");
  text = text.replace(
    "  ...countryProfilesV292CostaRica\n] as const;",
    "  ...countryProfilesV292CostaRica,\n  ...countryProfilesV293Nicaragua,\n  ...countryProfilesV294ElSalvador,\n  ...countryProfilesV295Tanzania,\n  ...countryProfilesV296Singapore,\n  ...countryProfilesV297Macau,\n  ...countryProfilesV298Greece\n] as const;"
  );
  text = text.replace("  ...countryPageSources8592\n] as const;", "  ...countryPageSources8592,\n  ...countryPageSources9398\n] as const;");
  fs.writeFileSync(file, text);
}

const required = [
  'countryPageCountries9398', 'countryPageSources9398',
  'countryProfilesV293Nicaragua', 'countryProfilesV294ElSalvador',
  'countryProfilesV295Tanzania', 'countryProfilesV296Singapore',
  'countryProfilesV297Macau', 'countryProfilesV298Greece'
];
const result = fs.readFileSync(file, 'utf8');
for (const token of required) if (!result.includes(token)) throw new Error(`Profile loader failed to add ${token}`);
console.log('PROFILE_V2_93_98_LOADER_READY');
