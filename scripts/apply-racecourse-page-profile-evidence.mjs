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

const narRows = [
  ['monbetsu-racecourse', 'Hidaka', 'Hokkaido', '02', 'right-handed', 1600, null, 330, true, 'The outer course is used as the representative circumference; the official table also lists a 1,376m inner course and a 218m inner-course finish straight.', '代表値には外回りを用いる。公式表には内回り1376m、内回りのゴールまで218mも掲載されている。'],
  ['morioka-racecourse', 'Morioka', 'Iwate', '03', 'left-handed', 1600, 1400, 300, false, 'Morioka is the only NAR venue in the table with a separate turf course.', '盛岡はNAR公式表でダートと芝の別コースが示されている。'],
  ['urawa-racecourse', 'Saitama', 'Saitama', '05', 'left-handed', 1200, null, 220, false, '', ''],
  ['funabashi-racecourse', 'Funabashi', 'Chiba', '06', 'left-handed', 1400, null, 308, true, 'The outer course is used as the representative circumference; the official table also lists a 1,250m inner course.', '代表値には外回りを用いる。公式表には内回り1250mも掲載されている。'],
  ['oi-racecourse', 'Shinagawa', 'Tokyo', '07', 'both-directions', 1600, null, 386, true, 'The official table lists the outer course in both directions and the inner course right-handed. The 386m value is the right-handed outer-course distance to the finish; the left-handed outer finish is 300m.', '公式表では外回りが左右両回り、内回りが右回り。386mは右回り外回りのゴールまでの値で、左回り外回りは300m。'],
  ['kawasaki-racecourse', 'Kawasaki', 'Kanagawa', '08', 'left-handed', 1200, null, 300, false, '', ''],
  ['kanazawa-racecourse', 'Kanazawa', 'Ishikawa', '09', 'right-handed', 1200, null, 236, false, '', ''],
  ['kasamatsu-racecourse', 'Kasamatsu', 'Gifu', '10', 'right-handed', 1100, null, 201, false, '', ''],
  ['nagoya-racecourse', 'Yatomi', 'Aichi', '11', 'right-handed', 1180, null, 240, false, '', ''],
  ['sonoda-racecourse', 'Amagasaki', 'Hyogo', '12', 'right-handed', 1051, null, 213, false, '', ''],
  ['kochi-racecourse', 'Kochi', 'Kochi', '14', 'right-handed', 1100, null, 200, false, '', ''],
  ['saga-racecourse', 'Tosu', 'Saga', '15', 'right-handed', 1100, null, 200, false, '', ''],
];
const directionJa = {
  'right-handed': '右回り',
  'left-handed': '左回り',
  'both-directions': '左右両回り',
};
const makeNarRecord = ([id, city, region, guideNo, direction, dirt, turf, straight, innerOuter, extraEn, extraJa]) => {
  let courseNotesEn = `The official NAR venue guide confirms the location. The official NAR course table records a ${direction} course, a representative dirt-course circumference of ${dirt}m`;
  if (turf !== null) courseNotesEn += `, a turf-course circumference of ${turf}m`;
  courseNotesEn += `, and a home-straight distance to the finish of ${straight}m.`;
  if (extraEn) courseNotesEn += ` ${extraEn}`;
  let courseNotesJa = `NAR公式競馬場ガイドで所在地を確認した。NAR公式コース一覧では${directionJa[direction]}、代表的なダート1周距離${dirt}m`;
  if (turf !== null) courseNotesJa += `、芝1周距離${turf}m`;
  courseNotesJa += `、ゴールまでの直線距離${straight}mが示されている。`;
  if (extraJa) courseNotesJa += ` ${extraJa}`;
  return {
    id,
    city,
    region,
    racing_types: ['thoroughbred-flat'],
    surfaces: turf === null ? ['dirt'] : ['dirt', 'turf'],
    direction,
    course_profile: {
      turf_circumference_m: turf,
      dirt_circumference_m: dirt,
      home_straight_m: straight,
      has_inner_outer_courses: innerOuter,
      has_lighting: null,
      elevation_notes_en: null,
      elevation_notes_ja: null,
      course_notes_en: courseNotesEn,
      course_notes_ja: courseNotesJa,
    },
    seasonality: {
      summary_en: 'Meeting dates and current-window coverage are shown through the reviewed public Calendar; full-season completeness is not claimed.',
      summary_ja: '開催日と現在の公開窓は確認済み公開カレンダーで表示する。通年の完全性は主張しない。',
      status: 'partial',
    },
    official_links: [
      { label_en: 'NAR official site', label_ja: 'NAR公式サイト', source_id: 'japan-nar-home', url: 'https://www.keiba.go.jp/', link_type: 'official' },
      { label_en: 'NAR racecourse guide', label_ja: 'NAR競馬場ガイド', source_id: 'japan-nar-racecourse-guide', url: 'https://www.keiba.go.jp/guide/', link_type: 'official' },
      { label_en: 'NAR venue guide', label_ja: 'NAR競馬場個別ガイド', source_id: 'japan-nar-racecourse-guide', url: `https://www.keiba.go.jp/guide/${guideNo}/`, link_type: 'official' },
      { label_en: 'NAR course table', label_ja: 'NARコース一覧', source_id: 'japan-nar-racecourse-guide', url: 'https://www.keiba.go.jp/guide/course/', link_type: 'official' },
    ],
    related_sources: ['japan-nar-home', 'japan-nar-racecourse-guide'],
    data_status: { course_profile: 'verified', schedule: 'public-calendar-connected', source_status: 'verified', last_checked: '2026-07-14' },
    profile_status: 'official_profile_partial',
  };
};
const kokura = {
  id: 'kokura-racecourse',
  city: 'Kitakyushu',
  region: 'Fukuoka',
  racing_types: ['thoroughbred-flat', 'jump-racing'],
  surfaces: ['turf', 'dirt', 'jump-course'],
  direction: 'right-handed',
  course_profile: {
    turf_circumference_m: 1615,
    dirt_circumference_m: 1445,
    home_straight_m: null,
    has_inner_outer_courses: true,
    has_lighting: null,
    elevation_notes_en: null,
    elevation_notes_ja: null,
    course_notes_en: 'The official JAIRS/JRA Kokura guide confirms the Kitakyushu location. Official course details list turf A/B/C courses of 1,615m, 1,633m, and 1,652m, a 1,445m dirt course, and 1,724m O-line and 415m S-line steeplechase courses. The current schema stores the A-course and dirt lengths as representative circumferences; it does not treat those course lengths as race-distance menus.',
    course_notes_ja: 'JAIRS/JRA公式小倉競馬場ガイドで北九州市の所在地を確認した。公式コース詳細には芝A/B/Cコース1615m・1633m・1652m、ダート1445m、障害O線1724m・S線415mが掲載されている。現在のスキーマでは芝Aコースとダートを代表的な1周距離として記録し、これらをレース距離一覧とは扱わない。',
  },
  seasonality: {
    summary_en: 'The official JAIRS/JRA guide says Kokura usually holds three race meetings a year. Current dates and reviewed coverage are shown through the public Calendar.',
    summary_ja: 'JAIRS/JRA公式ガイドでは小倉競馬場は通常年3回の開催とされる。現在の開催日と確認済み範囲は公開カレンダーで表示する。',
    status: 'partial',
  },
  official_links: [
    { label_en: 'JRA official site', label_ja: 'JRA公式サイト', source_id: 'japan-jra-home', url: 'https://jra.jp/', link_type: 'official' },
    { label_en: 'JRA Kokura venue page', label_ja: 'JRA小倉競馬場ページ', source_id: 'japan-jra-home', url: 'https://www.jra.go.jp/facilities/race/kokura/', link_type: 'official' },
    { label_en: 'JAIRS/JRA Kokura guide', label_ja: 'JAIRS/JRA小倉競馬場ガイド', source_id: 'japan-jairs-racecourses', url: 'https://japanracing.jp/en/racing/go_racing/jra_racecourses/j08.html', link_type: 'official' },
    { label_en: 'JAIRS/JRA Kokura course details', label_ja: 'JAIRS/JRA小倉コース詳細', source_id: 'japan-jairs-racecourses', url: 'https://japanracing.jp/en/racing/go_racing/jra_racecourses/course_details/kokura.html', link_type: 'official' },
  ],
  related_sources: ['japan-jra-home', 'japan-jairs-racecourses'],
  data_status: { course_profile: 'verified', schedule: 'public-calendar-connected', source_status: 'verified', last_checked: '2026-07-14' },
  profile_status: 'official_profile_partial',
};
const evidence = {
  schema_version: 'racecourse-profile-evidence-japan-v1',
  reviewed_at: '2026-07-14',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-PROFILE-EVIDENCE-01',
  records: [...narRows.map(makeNarRecord), kokura].sort((a, b) => a.id.localeCompare(b.id)),
};
fs.writeFileSync('data/static/racecourse-profile-evidence-japan-v1.json', `${JSON.stringify(evidence, null, 2)}\n`);

update('src/lib/data.ts', (input) => {
  let text = replaceOnce(
    input,
    "import publicTimetableRacecourseIdentitiesV1 from '../../data/static/racecourses-public-timetable-identities-v1.json';\n",
    "import publicTimetableRacecourseIdentitiesV1 from '../../data/static/racecourses-public-timetable-identities-v1.json';\nimport racecourseProfileEvidenceJapanV1 from '../../data/static/racecourse-profile-evidence-japan-v1.json';\n",
    'data.ts evidence import',
  );
  text = replaceOnce(
    text,
    'const racecourseOverrideById = new Map(racecourseProfileOverrides.map((override) => [override.id, override]));',
    `const racecourseProfileEvidenceById = new Map(racecourseProfileEvidenceJapanV1.records.map((record) => [record.id, record]));\nfunction applyRacecourseProfileEvidence<T extends Record<string, any>>(racecourse: T) {\n  const evidence = racecourseProfileEvidenceById.get(racecourse.id);\n  if (!evidence) return racecourse;\n  return {\n    ...racecourse,\n    ...evidence,\n    course_profile: { ...racecourse.course_profile, ...evidence.course_profile },\n    seasonality: { ...racecourse.seasonality, ...evidence.seasonality },\n    data_status: { ...racecourse.data_status, ...evidence.data_status },\n  };\n}\n\nconst racecourseOverrideById = new Map(racecourseProfileOverrides.map((override) => [override.id, override]));`,
    'data.ts evidence runtime',
  );
  return replaceOnce(
    text,
    '  ...countryPageRacecourses12Zimbabwe\n].map((racecourse) => ({',
    '  ...countryPageRacecourses12Zimbabwe\n].map(applyRacecourseProfileEvidence).map((racecourse) => ({',
    'data.ts evidence application',
  );
});

update('START-HERE.md', (input) => {
  let text = replaceOnce(
    input,
    'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCurrent implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',
    'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',
    'START-HERE unit transition',
  );
  return replaceOnce(
    text,
    '1. add official source, freshness, location, course, and distance profiles with explicit unknown states\n2. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture\n3. validate bilingual responsive racecourse pages and internal-link integrity',
    '1. complete country, racing-type, glossary, Calendar, racecourse, meeting, and official-source page-link architecture\n2. validate bilingual responsive racecourse pages and internal-link integrity',
    'START-HERE active sequence',
  );
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = replaceOnce(
    input,
    'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCurrent implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',
    'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',
    'implementation roadmap unit transition',
  );
  text = replaceOnce(
    text,
    'Identity reconciliation result: 26 of 26 public timetable racecourse IDs now resolve to canonical bilingual pages. Public timetable connection result: all 36 bilingual racecourse pages now expose reviewed Today, Next, and upcoming meeting state from the public meeting list; thirteen identity-only records retain unknown profile fields until separate review.',
    'Identity reconciliation result: 26 of 26 public timetable racecourse IDs resolve to canonical bilingual pages. Public timetable connection result: all 36 bilingual racecourse pages expose reviewed Today, Next, and upcoming meeting state. Profile evidence result: thirteen former identity-only Japanese records now have official location and high-level course evidence while unsupported race-distance, lighting, elevation, season-completeness, and notable-race fields remain explicit unknowns.',
    'implementation roadmap result summary',
  );
  text = replaceOnce(
    text,
    '1. add official source, freshness, location, course, and distance profiles without unsupported inference;\n2. connect country, type, glossary, Calendar, meeting, and racecourse navigation;\n3. validate bilingual responsive pages and internal-link integrity.',
    '1. connect country, type, glossary, Calendar, meeting, racecourse, and official-source navigation;\n2. validate bilingual responsive pages and internal-link integrity.',
    'implementation roadmap active sequence',
  );
  return text.replace(
    '2. add reviewed source and profile fields without unsupported inference\n3. complete racecourse page-link architecture\n4. validate bilingual racecourse pages and internal-link integrity\n5. add course, distance, source, and freshness profiles without unsupported inference\n6. complete page-link architecture and internal-link QA',
    '2. complete racecourse page-link architecture\n3. validate bilingual racecourse pages and internal-link integrity',
  );
});

update('docs/project-roadmap.md', (input) => replaceOnce(
  input,
  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCurrent implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\n\nCurrent product stage: all canonical racecourse pages now show reviewed Today, Next, and upcoming public meetings; next strengthen official source, freshness, location, course, and distance evidence before completing page-link architecture.',
  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\n\nCurrent product stage: all canonical racecourse pages show reviewed public meetings, and the thirteen former identity-only Japanese records now carry official location and high-level course evidence. Next complete bilingual page-link architecture without broadening the public data boundary.',
  'project roadmap unit transition',
));

update('docs/governance/document-authority.md', (input) => {
  let text = replaceOnce(
    input,
    '- `docs/racecourses/public-timetable-connection.md`\n',
    '- `docs/racecourses/public-timetable-connection.md`\n- `docs/racecourses/profile-evidence.md`\n',
    'document authority evidence document',
  );
  text = replaceOnce(
    text,
    '- `data/audits/racecourse-page-public-timetable-connection-v1.json`\n- `data/static/racecourses-public-timetable-identities-v1.json`',
    '- `data/audits/racecourse-page-public-timetable-connection-v1.json`\n- `data/audits/racecourse-page-profile-evidence-v1.json`\n- `data/static/racecourses-public-timetable-identities-v1.json`\n- `data/static/racecourse-profile-evidence-japan-v1.json`',
    'document authority evidence records',
  );
  return replaceOnce(
    text,
    '- `scripts/check-racecourse-page-public-timetable-connection.mjs`\n- `src/lib/racecourses/publicRacecourseMeetingState.ts`',
    '- `scripts/check-racecourse-page-public-timetable-connection.mjs`\n- `scripts/check-racecourse-page-profile-evidence.mjs`\n- `src/lib/racecourses/publicRacecourseMeetingState.ts`',
    'document authority evidence checker',
  );
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = replaceOnce(
    input,
    "  'scripts/check-racecourse-page-public-timetable-connection.mjs',\n",
    "  'scripts/check-racecourse-page-public-timetable-connection.mjs',\n  'docs/racecourses/profile-evidence.md',\n  'data/audits/racecourse-page-profile-evidence-v1.json',\n  'data/static/racecourse-profile-evidence-japan-v1.json',\n  'scripts/check-racecourse-page-profile-evidence.mjs',\n",
    'governance required evidence files',
  );
  text = replaceOnce(
    text,
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`'",
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`'",
    'governance START-HERE markers',
  );
  text = replaceOnce(
    text,
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Calendar Public v1 release decision accepted',",
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Calendar Public v1 release decision accepted',",
    'governance project roadmap markers',
  );
  return replaceOnce(
    text,
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',",
    "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',",
    'governance implementation roadmap markers',
  );
});

console.log('RACECOURSE_PAGE_PROFILE_EVIDENCE_APPLIED');
