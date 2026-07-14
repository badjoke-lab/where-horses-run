import fs from 'node:fs';

const block = (...lines) => lines.join('\n');
const replaceOnce = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`${label}: expected source text not found`);
  return text.replace(search, replacement);
};
const update = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${file}: no change produced`);
  fs.writeFileSync(file, after);
};

update('src/lib/data.ts', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "import racecourseExtensions from '../../data/static/racecourses-extensions.json';\n",
    block(
      "import racecourseExtensions from '../../data/static/racecourses-extensions.json';",
      "import publicTimetableRacecourseIdentitiesV1 from '../../data/static/racecourses-public-timetable-identities-v1.json';",
      '',
    ),
    'data.ts identity import',
  );
  text = replaceOnce(
    text,
    block(
      '  ...racecourses,',
      '  ...racecourseExtensions,',
      '  ...countryPageRacecourses0104,',
    ),
    block(
      '  ...racecourses,',
      '  ...racecourseExtensions,',
      '  ...publicTimetableRacecourseIdentitiesV1,',
      '  ...countryPageRacecourses0104,',
    ),
    'data.ts identity spread',
  );
  return text;
});

update('src/pages/tracks/[slug].astro', (input) => {
  let text = input;
  text = replaceOnce(text, "const calendarHref = country ? `/countries/${country.slug}/` : '/calendar/';", "const calendarHref = '/calendar/';", 'English Calendar route');
  text = replaceOnce(text, '{country ? country.name_en : track.country_id} / {track.city}', '{country ? country.name_en : track.country_id} / {formatValue(track.city)}', 'English hero city');
  text = replaceOnce(text, '<p><strong>City / region:</strong> {track.city} / {formatValue(track.region)}</p>', '<p><strong>City / region:</strong> {formatValue(track.city)} / {formatValue(track.region)}</p>', 'English city/region');
  text = replaceOnce(
    text,
    block(
      '      <h2>Racing types</h2>',
      '      <ul>',
      '        {track.racing_types.map((typeId) => {',
      '          const type = getRacingTypeById(typeId);',
      '          return <li>{type ? <a href={`/types/${type.slug}/`}>{type.name_en}</a> : typeId}</li>;',
      '        })}',
      '      </ul>',
    ),
    block(
      '      <h2>Racing types</h2>',
      '      {track.racing_types.length ? (',
      '        <ul>',
      '          {track.racing_types.map((typeId) => {',
      '            const type = getRacingTypeById(typeId);',
      '            return <li>{type ? <a href={`/types/${type.slug}/`}>{type.name_en}</a> : typeId}</li>;',
      '          })}',
      '        </ul>',
      '      ) : <p>Not listed yet.</p>}',
    ),
    'English racing type unknown state',
  );
  return text;
});

update('src/pages/ja/tracks/[slug].astro', (input) => {
  let text = input;
  text = replaceOnce(text, "const calendarHref = country ? `/ja/countries/${country.slug}/` : '/ja/calendar/';", "const calendarHref = '/ja/calendar/';", 'Japanese Calendar route');
  text = replaceOnce(text, '{country ? country.name_ja : track.country_id} / {track.city}', '{country ? country.name_ja : track.country_id} / {formatValue(track.city)}', 'Japanese hero city');
  text = replaceOnce(text, '<p><strong>都市 / 地域:</strong> {track.city} / {formatValue(track.region)}</p>', '<p><strong>都市 / 地域:</strong> {formatValue(track.city)} / {formatValue(track.region)}</p>', 'Japanese city/region');
  text = replaceOnce(
    text,
    block(
      '      <h2>競馬種別</h2>',
      '      <ul>',
      '        {track.racing_types.map((typeId) => {',
      '          const type = getRacingTypeById(typeId);',
      '          return <li>{type ? <a href={`/ja/types/${type.slug}/`}>{type.name_ja}</a> : typeId}</li>;',
      '        })}',
      '      </ul>',
    ),
    block(
      '      <h2>競馬種別</h2>',
      '      {track.racing_types.length ? (',
      '        <ul>',
      '          {track.racing_types.map((typeId) => {',
      '            const type = getRacingTypeById(typeId);',
      '            return <li>{type ? <a href={`/ja/types/${type.slug}/`}>{type.name_ja}</a> : typeId}</li>;',
      '          })}',
      '        </ul>',
      '      ) : <p>未掲載</p>}',
    ),
    'Japanese racing type unknown state',
  );
  return text;
});

update('START-HERE.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    'Current Work ID: `WHR-RACECOURSE-PAGES-V1`\n',
    block(
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
      '',
    ),
    'START-HERE racecourse unit status',
  );
  text = replaceOnce(
    text,
    block(
      '```text',
      '1. reconcile timetable-only venue IDs with canonical racecourse identities and fail safely when no detail page exists',
      '2. define one structured racecourse-page record per reviewed racecourse identity',
      '3. connect reviewed today and upcoming meeting state without inventing absent detail',
      '4. add official source, freshness, course, and distance profiles with explicit unknown states',
      '5. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture',
      '6. validate bilingual responsive racecourse pages and internal-link integrity',
      '```',
    ),
    block(
      '```text',
      '1. connect reviewed today and upcoming meeting state without inventing absent detail',
      '2. add official source, freshness, course, and distance profiles with explicit unknown states',
      '3. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture',
      '4. validate bilingual responsive racecourse pages and internal-link integrity',
      '```',
    ),
    'START-HERE active sequence',
  );
  return text;
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    block(
      'Status: active current programme work',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      '',
      'Initial sequence:',
    ),
    block(
      'Status: active current programme work',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
      '',
      'Identity reconciliation result: 26 of 26 public timetable racecourse IDs now resolve to canonical bilingual pages; thirteen identity-only records retain unknown profile fields until separate review.',
      '',
      'Initial sequence:',
    ),
    'implementation roadmap racecourse unit status',
  );
  text = replaceOnce(
    text,
    block(
      '1. reconcile timetable-only venue IDs with canonical racecourse identities;',
      '2. define the structured racecourse-page data contract;',
      '3. expose reviewed today and upcoming meeting state;',
      '4. add official source, freshness, course, and distance profiles without unsupported inference;',
      '5. connect country, type, glossary, Calendar, meeting, and racecourse navigation;',
      '6. validate bilingual responsive pages and internal-link integrity.',
    ),
    block(
      '1. connect reviewed today and upcoming meeting state;',
      '2. add official source, freshness, course, and distance profiles without unsupported inference;',
      '3. connect country, type, glossary, Calendar, meeting, and racecourse navigation;',
      '4. validate bilingual responsive pages and internal-link integrity.',
    ),
    'implementation roadmap active sequence',
  );
  text = text.replace('2. reconcile timetable-only venue IDs with canonical racecourse identities\n3. define and validate structured bilingual racecourse pages\n4. connect reviewed current and upcoming meeting state to racecourse pages', '2. connect reviewed current and upcoming meeting state to canonical racecourse pages\n3. add reviewed source and profile fields without unsupported inference\n4. complete racecourse page-link architecture');
  text = text.replace('Current programme Work ID: `WHR-CAL-PUBLIC-V1`.', 'Current programme Work ID: `WHR-RACECOURSE-PAGES-V1`.');
  return text;
});

update('docs/project-roadmap.md', (input) => replaceOnce(
  input,
  block(
    'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
    '',
    'Current product stage: strengthen racecourse pages and page-link architecture.',
  ),
  block(
    'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
    'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
    'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
    '',
    'Current product stage: connect reviewed timetable state to the now-complete canonical racecourse identity set, then strengthen profile evidence and page-link architecture.',
  ),
  'project roadmap racecourse unit status',
));

update('docs/governance/document-authority.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    '- `docs/calendar/public-v1-release-decision.md`\n',
    block(
      '- `docs/calendar/public-v1-release-decision.md`',
      '- `docs/racecourses/identity-reconciliation.md`',
      '',
    ),
    'document authority racecourse doc',
  );
  text = replaceOnce(
    text,
    '- `data/audits/calendar-public-v1-release-decision-v1.json`\n',
    block(
      '- `data/audits/calendar-public-v1-release-decision-v1.json`',
      '- `data/audits/racecourse-page-identity-reconciliation-v1.json`',
      '- `data/static/racecourses-public-timetable-identities-v1.json`',
      '',
    ),
    'document authority racecourse records',
  );
  text = replaceOnce(
    text,
    '- `scripts/check-calendar-public-v1-release-decision.mjs`\n',
    block(
      '- `scripts/check-calendar-public-v1-release-decision.mjs`',
      '- `scripts/check-racecourse-page-identity-reconciliation.mjs`',
      '',
    ),
    'document authority racecourse checker',
  );
  return text;
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "  'scripts/check-calendar-public-v1-release-decision.mjs',\n",
    block(
      "  'scripts/check-calendar-public-v1-release-decision.mjs',",
      "  'docs/racecourses/identity-reconciliation.md',",
      "  'data/audits/racecourse-page-identity-reconciliation-v1.json',",
      "  'data/static/racecourses-public-timetable-identities-v1.json',",
      "  'scripts/check-racecourse-page-identity-reconciliation.mjs',",
      '',
    ),
    'governance racecourse required files',
  );
  text = replaceOnce(
    text,
    "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`'\n]);",
    block(
      "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',",
      "  'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',",
      "  'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`'",
      ']);',
    ),
    'governance START-HERE racecourse markers',
  );
  return text;
});

console.log('RACECOURSE_PAGE_IDENTITY_RECONCILIATION_APPLIED');
