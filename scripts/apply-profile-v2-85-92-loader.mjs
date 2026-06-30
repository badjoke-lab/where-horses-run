import fs from 'node:fs';

await import('./apply-profile-v2-77-84-loader.mjs');

const file = 'src/lib/data.ts';
let text = fs.readFileSync(file, 'utf8');

if (!text.includes('countryPageCountries8592')) {
  text = text.replace(
    "import countryPageCountries7784 from '../../data/static/country-page-countries-77-84.json';",
    "import countryPageCountries7784 from '../../data/static/country-page-countries-77-84.json';\nimport countryPageCountries8592 from '../../data/static/country-page-countries-85-92.json';"
  );
  text = text.replace(
    "import countryProfilesV284Honduras from '../../data/static/country-profiles-v2-84-honduras.json';",
    "import countryProfilesV284Honduras from '../../data/static/country-profiles-v2-84-honduras.json';\nimport countryProfilesV285Ghana from '../../data/static/country-profiles-v2-85-ghana.json';\nimport countryProfilesV286SaintKittsAndNevis from '../../data/static/country-profiles-v2-86-saint-kitts-and-nevis.json';\nimport countryProfilesV287Jordan from '../../data/static/country-profiles-v2-87-jordan.json';\nimport countryProfilesV288Iraq from '../../data/static/country-profiles-v2-88-iraq.json';\nimport countryProfilesV289Azerbaijan from '../../data/static/country-profiles-v2-89-azerbaijan.json';\nimport countryProfilesV290Mongolia from '../../data/static/country-profiles-v2-90-mongolia.json';\nimport countryProfilesV291Botswana from '../../data/static/country-profiles-v2-91-botswana.json';\nimport countryProfilesV292CostaRica from '../../data/static/country-profiles-v2-92-costa-rica.json';"
  );
  text = text.replace(
    "import countryPageSources7784 from '../../data/static/country-page-sources-77-84.json';",
    "import countryPageSources7784 from '../../data/static/country-page-sources-77-84.json';\nimport countryPageSources8592 from '../../data/static/country-page-sources-85-92.json';"
  );
  text = text.replace(
    "  ...countryPageCountries7784\n] as const;",
    "  ...countryPageCountries7784,\n  ...countryPageCountries8592\n] as const;"
  );
  text = text.replace(
    "  ...countryProfilesV284Honduras\n] as const;",
    "  ...countryProfilesV284Honduras,\n  ...countryProfilesV285Ghana,\n  ...countryProfilesV286SaintKittsAndNevis,\n  ...countryProfilesV287Jordan,\n  ...countryProfilesV288Iraq,\n  ...countryProfilesV289Azerbaijan,\n  ...countryProfilesV290Mongolia,\n  ...countryProfilesV291Botswana,\n  ...countryProfilesV292CostaRica\n] as const;"
  );
  text = text.replace(
    "  ...countryPageSources7784\n] as const;",
    "  ...countryPageSources7784,\n  ...countryPageSources8592\n] as const;"
  );
  fs.writeFileSync(file, text);
}

const required = [
  'countryPageCountries8592', 'countryPageSources8592',
  'countryProfilesV285Ghana', 'countryProfilesV286SaintKittsAndNevis',
  'countryProfilesV287Jordan', 'countryProfilesV288Iraq',
  'countryProfilesV289Azerbaijan', 'countryProfilesV290Mongolia',
  'countryProfilesV291Botswana', 'countryProfilesV292CostaRica'
];
const result = fs.readFileSync(file, 'utf8');
for (const token of required) if (!result.includes(token)) throw new Error(`Profile loader failed to add ${token}`);
console.log('PROFILE_V2_85_92_LOADER_READY');
