import fs from 'node:fs';

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

const glossaryPath = 'data/static/glossary.json';
const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
const additions = [
  { id: 'turf', slug: 'turf', term_en: 'Turf', term_ja: '芝', category: 'surface', summary_en: 'A grass racing surface. Racecourse pages link here for terminology only and do not infer race conditions.', summary_ja: '芝の競走コース。競馬場ページでは用語説明への導線として扱い、個別レース条件を推測しない。' },
  { id: 'dirt', slug: 'dirt', term_en: 'Dirt', term_ja: 'ダート', category: 'surface', summary_en: 'A dirt or soil-based racing surface. Local composition and official naming can differ by jurisdiction.', summary_ja: '土系の競走コース。材質や公式名称は国・地域によって異なる。' },
  { id: 'all-weather', slug: 'all-weather', term_en: 'All-weather course', term_ja: 'オールウェザーコース', category: 'surface', summary_en: 'A synthetic racing surface intended for use across varied weather conditions.', summary_ja: 'さまざまな天候での使用を想定した人工素材の競走コース。' },
  { id: 'jump-course', slug: 'jump-course', term_en: 'Jump course', term_ja: '障害コース', category: 'surface', summary_en: 'A course or layout used for races over obstacles. Detailed obstacle specifications remain with official sources.', summary_ja: '障害を越える競走に使われるコース。障害物の詳細仕様は公式ソースで確認する。' },
  { id: 'left-handed-course', slug: 'left-handed-course', term_en: 'Left-handed course', term_ja: '左回りコース', category: 'track_term', summary_en: 'A course where races proceed counter-clockwise around the main turns.', summary_ja: '主なコーナーを反時計回りに進むコース。' },
  { id: 'right-handed-course', slug: 'right-handed-course', term_en: 'Right-handed course', term_ja: '右回りコース', category: 'track_term', summary_en: 'A course where races proceed clockwise around the main turns.', summary_ja: '主なコーナーを時計回りに進むコース。' },
  { id: 'both-directions-course', slug: 'both-directions-course', term_en: 'Course using both directions', term_ja: '左右両回りコース', category: 'track_term', summary_en: 'A venue or layout officially used in both clockwise and counter-clockwise directions.', summary_ja: '公式に右回りと左回りの両方で使用される競馬場またはコース。' },
  { id: 'straight-course', slug: 'straight-course', term_en: 'Straight course', term_ja: '直線コース', category: 'track_term', summary_en: 'A racing course or segment run without the main oval turns.', summary_ja: '主要な周回コーナーを使わず直線で行う競走コース。' },
];
const existingIds = new Set(glossary.map((entry) => entry.id));
for (const entry of additions) {
  if (existingIds.has(entry.id)) throw new Error(`glossary entry already exists: ${entry.id}`);
  glossary.push(entry);
}
fs.writeFileSync(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);

const amendments = {
  schema_version: 'racecourse-link-amendments-v1',
  reviewed_at: '2026-07-14',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-LINK-ARCHITECTURE-01',
  source_records: [
    {
      id: 'chile-hipodromo-chile-home',
      country_id: 'chile',
      source_type: 'official',
      url: 'https://www.hipodromo.cl/',
      data_type: 'link_only',
      auto_level: 'C',
      terms_risk: 'unknown',
      notes: 'Official Hipódromo Chile home route. Link-first only; programme, participant, betting, result, and stream content remain outside this amendment.',
      m3_status: 'alpha_link_first',
      m3_notes: 'Venue-level official route for racecourse navigation.'
    },
    {
      id: 'south-korea-kra-seoul-home',
      country_id: 'south-korea',
      source_type: 'official',
      url: 'https://park.kra.co.kr/',
      data_type: 'link_only',
      auto_level: 'C',
      terms_risk: 'unknown',
      notes: 'Official Korea Racing Authority LetsRun Park route for Seoul. Link-first only; programme, participant, betting, result, and stream content remain outside this amendment.',
      m3_status: 'alpha_link_first',
      m3_notes: 'Venue-level official route for racecourse navigation.'
    }
  ],
  records: [
    {
      id: 'hipodromo-chile',
      official_links: [{ label_en: 'Hipódromo Chile official site', label_ja: 'イポドロモ・チレ公式サイト', source_id: 'chile-hipodromo-chile-home', url: 'https://www.hipodromo.cl/', link_type: 'official' }],
      related_sources: ['chile-hipodromo-chile-home']
    },
    {
      id: 'seoul-racecourse',
      official_links: [{ label_en: 'KRA LetsRun Park Seoul official site', label_ja: 'KRAソウル競馬場公式サイト', source_id: 'south-korea-kra-seoul-home', url: 'https://park.kra.co.kr/', link_type: 'official' }],
      related_sources: ['south-korea-kra-seoul-home']
    }
  ]
};
fs.writeFileSync('data/static/racecourse-link-amendments-v1.json', `${JSON.stringify(amendments, null, 2)}\n`);

update('src/lib/data.ts', (input) => {
  let text = replaceOnce(
    input,
    "import racecourseProfileEvidenceJapanV1 from '../../data/static/racecourse-profile-evidence-japan-v1.json';\n",
    "import racecourseProfileEvidenceJapanV1 from '../../data/static/racecourse-profile-evidence-japan-v1.json';\nimport racecourseLinkAmendmentsV1 from '../../data/static/racecourse-link-amendments-v1.json';\n",
    'data.ts link amendment import',
  );
  text = replaceOnce(
    text,
    'const racecourseOverrideById = new Map(racecourseProfileOverrides.map((override) => [override.id, override]));',
    `const racecourseLinkAmendmentById = new Map(racecourseLinkAmendmentsV1.records.map((record) => [record.id, record]));\nfunction applyRacecourseLinkAmendment<T extends Record<string, any>>(racecourse: T) {\n  const amendment = racecourseLinkAmendmentById.get(racecourse.id);\n  if (!amendment) return racecourse;\n  return {\n    ...racecourse,\n    official_links: [...(racecourse.official_links ?? []), ...(amendment.official_links ?? [])],\n    related_sources: [...new Set([...(racecourse.related_sources ?? []), ...(amendment.related_sources ?? [])])],\n  };\n}\n\nconst racecourseOverrideById = new Map(racecourseProfileOverrides.map((override) => [override.id, override]));`,
    'data.ts link amendment runtime',
  );
  text = replaceOnce(
    text,
    '].map(applyRacecourseProfileEvidence).map((racecourse) => ({',
    '].map(applyRacecourseProfileEvidence).map(applyRacecourseLinkAmendment).map((racecourse) => ({',
    'data.ts link amendment application',
  );
  return replaceOnce(
    text,
    '  ...countryPageSources9398\n] as const;',
    '  ...countryPageSources9398,\n  ...racecourseLinkAmendmentsV1.source_records\n] as const;',
    'data.ts source amendment registration',
  );
});

update('src/components/RacecoursePublicMeetingPanel.astro', (input) => {
  let text = replaceOnce(
    input,
    "const isJapanese = lang === 'ja';\n",
    "const isJapanese = lang === 'ja';\nconst calendarHref = isJapanese ? '/ja/calendar/' : '/calendar/';\nconst calendarDateHref = (date) => `${calendarHref}?date=${date}`;\n",
    'meeting panel Calendar helpers',
  );
  text = text.replaceAll('<strong>{meeting.date}</strong>', '<strong><a href={calendarDateHref(meeting.date)}>{meeting.date}</a></strong>');
  text = replaceOnce(text, '<span>{meeting.date}</span>', '<a href={calendarDateHref(meeting.date)}>{meeting.date}</a>', 'upcoming meeting date link');
  return replaceOnce(text, "<a href={isJapanese ? '/ja/calendar/' : '/calendar/'}>", '<a href={calendarHref}>', 'meeting panel Calendar link');
});

const patchTrackPage = (file, japanese) => update(file, (input) => {
  const prefix = japanese ? '/ja' : '';
  let text = replaceOnce(
    input,
    'const sourcesById = new Map(siteData.sources.map((source) => [source.id, source]));\n',
    `const sourcesById = new Map(siteData.sources.map((source) => [source.id, source]));\nconst surfaceGlossaryIds = { turf: 'turf', dirt: 'dirt', 'all-weather': 'all-weather', 'jump-course': 'jump-course' };\nconst directionGlossaryIds = { 'left-handed': 'left-handed-course', 'right-handed': 'right-handed-course', 'both-directions': 'both-directions-course', straight: 'straight-course' };\nconst surfaceTermRows = track.surfaces.map((surface) => glossaryById.get(surfaceGlossaryIds[surface])).filter(Boolean);\nconst directionTerm = glossaryById.get(directionGlossaryIds[track.direction]);\n`,
    `${file} glossary link maps`,
  );
  const oldSurface = japanese
    ? '<p><strong>馬場:</strong> {formatValue(track.surfaces)}</p>'
    : '<p><strong>Surfaces:</strong> {formatValue(track.surfaces)}</p>';
  const surfaceLabel = japanese ? '馬場:' : 'Surfaces:';
  const termField = japanese ? 'term_ja' : 'term_en';
  const glossaryPrefix = japanese ? '/ja/glossary/' : '/glossary/';
  const newSurface = `<p><strong>${surfaceLabel}</strong>{' '}{surfaceTermRows.length ? surfaceTermRows.map((term, index) => <><a href={\`${glossaryPrefix}\${term.slug}/\`}>{term.${termField}}</a>{index < surfaceTermRows.length - 1 ? ', ' : ''}</>) : formatValue(track.surfaces)}</p>`;
  text = replaceOnce(text, oldSurface, newSurface, `${file} surface links`);
  const oldDirection = japanese
    ? '<p><strong>回り:</strong> {directionLabel(track.direction)}</p>'
    : '<p><strong>Direction:</strong> {directionLabel(track.direction)}</p>';
  const directionLabelText = japanese ? '回り:' : 'Direction:';
  const newDirection = `<p><strong>${directionLabelText}</strong>{' '}{directionTerm ? <a href={\`${glossaryPrefix}\${directionTerm.slug}/\`}>{directionLabel(track.direction)}</a> : directionLabel(track.direction)}</p>`;
  text = replaceOnce(text, oldDirection, newDirection, `${file} direction link`);
  const oldLastChecked = japanese
    ? '<p><strong>最終確認:</strong> {formatValue(track.data_status?.last_checked)}</p>'
    : '<p><strong>Last checked:</strong> {formatValue(track.data_status?.last_checked)}</p>';
  const newLastChecked = japanese
    ? `<p><strong>最終確認:</strong> {formatValue(track.data_status?.last_checked)}</p>\n      <p><a data-methodology-link href="/ja/about/">データ範囲について</a>{' · '}<a href={countrySourceHref}>国別ソース一覧</a></p>`
    : `<p><strong>Last checked:</strong> {formatValue(track.data_status?.last_checked)}</p>\n      <p><a data-methodology-link href="/about/">About coverage and sources</a>{' · '}<a href={countrySourceHref}>Country source registry</a></p>`;
  return replaceOnce(text, oldLastChecked, newLastChecked, `${file} methodology link`);
});
patchTrackPage('src/pages/tracks/[slug].astro', false);
patchTrackPage('src/pages/ja/tracks/[slug].astro', true);

update('START-HERE.md', (input) => {
  let text = replaceOnce(
    input,
    'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',
    'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',
    'START-HERE link architecture transition',
  );
  return replaceOnce(
    text,
    '1. complete country, racing-type, glossary, Calendar, racecourse, meeting, and official-source page-link architecture\n2. validate bilingual responsive racecourse pages and internal-link integrity',
    '1. validate bilingual responsive racecourse pages, metadata, accessibility markers, and final release readiness',
    'START-HERE remaining sequence',
  );
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = replaceOnce(
    input,
    'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',
    'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',
    'implementation roadmap link transition',
  );
  text = replaceOnce(
    text,
    '1. connect country, type, glossary, Calendar, meeting, racecourse, and official-source navigation;\n2. validate bilingual responsive pages and internal-link integrity.',
    '1. validate bilingual responsive pages, metadata, accessibility markers, and final release readiness.',
    'implementation roadmap remaining sequence',
  );
  return text.replace('2. complete racecourse page-link architecture\n3. validate bilingual racecourse pages and internal-link integrity', '2. validate bilingual racecourse pages, metadata, accessibility markers, and release readiness');
});

update('docs/project-roadmap.md', (input) => replaceOnce(
  input,
  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\n\nCurrent product stage: all canonical racecourse pages show reviewed public meetings, and the thirteen former identity-only Japanese records now carry official location and high-level course evidence. Next complete bilingual page-link architecture without broadening the public data boundary.',
  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\n\nCurrent product stage: all canonical racecourse pages now connect reviewed meetings, countries, racing types, glossary concepts, official routes, source registries, and coverage explanation. Next complete bilingual responsive, metadata, accessibility, and release-readiness QA.',
  'project roadmap link architecture transition',
));

update('docs/governance/document-authority.md', (input) => {
  let text = replaceOnce(input, '- `docs/racecourses/profile-evidence.md`\n', '- `docs/racecourses/profile-evidence.md`\n- `docs/racecourses/page-link-architecture.md`\n', 'authority link document');
  text = replaceOnce(text, '- `data/audits/racecourse-page-profile-evidence-v1.json`\n', '- `data/audits/racecourse-page-profile-evidence-v1.json`\n- `data/audits/racecourse-page-link-architecture-v1.json`\n- `data/static/racecourse-link-amendments-v1.json`\n', 'authority link records');
  return replaceOnce(text, '- `scripts/check-racecourse-page-profile-evidence.mjs`\n', '- `scripts/check-racecourse-page-profile-evidence.mjs`\n- `scripts/check-racecourse-page-link-architecture.mjs`\n', 'authority link checker');
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = replaceOnce(input, "  'scripts/check-racecourse-page-profile-evidence.mjs',\n", "  'scripts/check-racecourse-page-profile-evidence.mjs',\n  'docs/racecourses/page-link-architecture.md',\n  'data/audits/racecourse-page-link-architecture-v1.json',\n  'data/static/racecourse-link-amendments-v1.json',\n  'scripts/check-racecourse-page-link-architecture.mjs',\n", 'governance link files');
  text = replaceOnce(text, "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`'", "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`'", 'governance START-HERE markers');
  text = replaceOnce(text, "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Calendar Public v1 release decision accepted',", "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',\n  'Calendar Public v1 release decision accepted',", 'governance project roadmap markers');
  return replaceOnce(text, "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',", "  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',", 'governance implementation roadmap markers');
});

console.log('RACECOURSE_PAGE_LINK_ARCHITECTURE_APPLIED');
