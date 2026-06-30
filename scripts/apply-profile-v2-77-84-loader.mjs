import fs from 'node:fs';

const file = 'src/lib/data.ts';
let text = fs.readFileSync(file, 'utf8');

if (!text.includes('countryPageCountries7784')) {
  text = text.replace(
    "import countryPageCountries6976 from '../../data/static/country-page-countries-69-76.json';",
    "import countryPageCountries6976 from '../../data/static/country-page-countries-69-76.json';\nimport countryPageCountries7784 from '../../data/static/country-page-countries-77-84.json';"
  );
  text = text.replace(
    "import countryProfilesV276Guyana from '../../data/static/country-profiles-v2-76-guyana.json';",
    "import countryProfilesV276Guyana from '../../data/static/country-profiles-v2-76-guyana.json';\nimport countryProfilesV277Kazakhstan from '../../data/static/country-profiles-v2-77-kazakhstan.json';\nimport countryProfilesV278Egypt from '../../data/static/country-profiles-v2-78-egypt.json';\nimport countryProfilesV279Algeria from '../../data/static/country-profiles-v2-79-algeria.json';\nimport countryProfilesV280Iran from '../../data/static/country-profiles-v2-80-iran.json';\nimport countryProfilesV281Vietnam from '../../data/static/country-profiles-v2-81-vietnam.json';\nimport countryProfilesV282Bolivia from '../../data/static/country-profiles-v2-82-bolivia.json';\nimport countryProfilesV283Guatemala from '../../data/static/country-profiles-v2-83-guatemala.json';\nimport countryProfilesV284Honduras from '../../data/static/country-profiles-v2-84-honduras.json';"
  );
  text = text.replace(
    "import countryPageSources6976 from '../../data/static/country-page-sources-69-76.json';",
    "import countryPageSources6976 from '../../data/static/country-page-sources-69-76.json';\nimport countryPageSources7784 from '../../data/static/country-page-sources-77-84.json';"
  );
  text = text.replace(
    "  ...countryPageCountries6976\n] as const;",
    "  ...countryPageCountries6976,\n  ...countryPageCountries7784\n] as const;"
  );
  text = text.replace(
    "  ...countryProfilesV276Guyana\n] as const;",
    "  ...countryProfilesV276Guyana,\n  ...countryProfilesV277Kazakhstan,\n  ...countryProfilesV278Egypt,\n  ...countryProfilesV279Algeria,\n  ...countryProfilesV280Iran,\n  ...countryProfilesV281Vietnam,\n  ...countryProfilesV282Bolivia,\n  ...countryProfilesV283Guatemala,\n  ...countryProfilesV284Honduras\n] as const;"
  );
  text = text.replace(
    "  ...countryPageSources6976\n] as const;",
    "  ...countryPageSources6976,\n  ...countryPageSources7784\n] as const;"
  );
  fs.writeFileSync(file, text);
}

const required = [
  'countryPageCountries7784', 'countryPageSources7784',
  'countryProfilesV277Kazakhstan', 'countryProfilesV278Egypt',
  'countryProfilesV279Algeria', 'countryProfilesV280Iran',
  'countryProfilesV281Vietnam', 'countryProfilesV282Bolivia',
  'countryProfilesV283Guatemala', 'countryProfilesV284Honduras'
];
const result = fs.readFileSync(file, 'utf8');
for (const token of required) {
  if (!result.includes(token)) throw new Error(`Profile loader failed to add ${token}`);
}
console.log('PROFILE_V2_77_84_LOADER_READY');
