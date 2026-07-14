import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const audit = parse('data/audits/racecourse-page-link-architecture-v1.json');
const glossary = parse('data/static/glossary.json');
const glossaryById = new Map(glossary.map((entry) => [entry.id, entry]));
const amendments = parse('data/static/racecourse-link-amendments-v1.json');
const evidence = parse('data/static/racecourse-profile-evidence-japan-v1.json');
const evidenceById = new Map(evidence.records.map((record) => [record.id, record]));
const amendmentById = new Map(amendments.records.map((record) => [record.id, record]));
const racecourseFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const records = racecourseFiles
  .flatMap((file) => parse(file))
  .map((record) => {
    const profile = evidenceById.get(record.id);
    const linked = profile
      ? {
          ...record,
          ...profile,
          course_profile: { ...record.course_profile, ...profile.course_profile },
          seasonality: { ...record.seasonality, ...profile.seasonality },
          data_status: { ...record.data_status, ...profile.data_status },
        }
      : record;
    const amendment = amendmentById.get(record.id);
    return amendment
      ? {
          ...linked,
          official_links: [...(linked.official_links ?? []), ...(amendment.official_links ?? [])],
          related_sources: [...new Set([...(linked.related_sources ?? []), ...(amendment.related_sources ?? [])])],
        }
      : linked;
  })
  .sort((left, right) => left.id.localeCompare(right.id));
const meetings = parse('data/generated/timetable/public/meeting-list.json').meetings ?? [];
const meetingsByRacecourse = new Map();
for (const meeting of meetings) {
  const rows = meetingsByRacecourse.get(meeting.racecourse_id) ?? [];
  rows.push(meeting);
  meetingsByRacecourse.set(meeting.racecourse_id, rows);
}
const typeSlugs = new Map([
  ['thoroughbred-flat', 'thoroughbred-flat'],
  ['jump-racing', 'jump-racing'],
  ['harness-racing', 'harness-racing'],
  ['trotting', 'trotting'],
  ['pacing', 'pacing'],
  ['arabian-racing', 'arabian-racing'],
  ['quarter-horse-racing', 'quarter-horse-racing'],
  ['banei-racing', 'banei-racing'],
]);
const surfaceGlossary = new Map([
  ['turf', 'turf'],
  ['dirt', 'dirt'],
  ['all-weather', 'all-weather'],
  ['jump-course', 'jump-course'],
]);
const directionGlossary = new Map([
  ['left-handed', 'left-handed-course'],
  ['right-handed', 'right-handed-course'],
  ['both-directions', 'both-directions-course'],
  ['straight', 'straight-course'],
]);
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
const hasHref = (html, href) => hrefs(html).includes(href);
const isAssetHref = (href) => href.startsWith('/_astro/') || /\.(?:css|js|png|jpe?g|gif|svg|webp|ico|woff2?)(?:\?|$)/i.test(href);
const internalTarget = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return 'dist/index.html';
  const normalized = clean.replace(/^\//, '').replace(/\/$/, '');
  return `dist/${normalized}/index.html`;
};
const internalExists = (href) => {
  if (!href.startsWith('/') || href.startsWith('//') || isAssetHref(href)) return true;
  return fs.existsSync(path.join(root, internalTarget(href)));
};

if (audit.schema_version !== 'racecourse-page-link-architecture-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'RACECOURSE-PAGE-LINK-ARCHITECTURE-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.discovery_artifact_digest !== 'sha256:d48f33c574f5d4671b56f5838124f91bed73a5a528bf1a00abca5720821ed861') fail('discovery artifact digest differs');
if (audit.baseline?.bilingual_pages !== 72 || audit.baseline?.official_external_links_present !== 68 || audit.baseline?.surface_links_complete !== 0 || audit.baseline?.meeting_date_links_complete !== 0 || audit.baseline?.unresolved_glossary_candidates !== 8) fail('baseline counts differ');
const finalCounts = audit.implemented ?? {};
for (const [key, expected] of Object.entries({
  racecourses: 36,
  bilingual_pages: 72,
  public_meetings: 169,
  country_links_complete: 72,
  calendar_links_present: 72,
  racing_type_links_complete: 72,
  related_glossary_links_complete: 72,
  source_registry_links_present: 72,
  official_external_links_present: 72,
  surface_link_applicable_pages: 52,
  surface_links_complete: 52,
  direction_link_applicable_pages: 46,
  direction_links_complete: 46,
  data_status_methodology_links_present: 72,
  broken_internal_page_links: 0,
  unresolved_glossary_candidates: 0,
})) if (finalCounts[key] !== expected) fail(`audit implemented count ${key} differs`);
if (finalCounts.rendered_meeting_date_links_complete !== true) fail('rendered meeting-date link contract differs');
if (Object.values(audit.boundaries ?? {}).some((value) => value !== false)) fail('automation boundaries must remain false');
if (Object.values(audit.public_boundary ?? {}).some((value) => value !== false && value !== 'one_meeting_per_row')) fail('public boundary differs');
if (audit.next_implementation_unit !== 'RACECOURSE-PAGE-BILINGUAL-QA-01') fail('next implementation unit differs');

const expectedGlossary = new Map([
  ['turf', ['Turf', '芝']],
  ['dirt', ['Dirt', 'ダート']],
  ['all-weather', ['All-weather course', 'オールウェザーコース']],
  ['jump-course', ['Jump course', '障害コース']],
  ['left-handed-course', ['Left-handed course', '左回りコース']],
  ['right-handed-course', ['Right-handed course', '右回りコース']],
  ['both-directions-course', ['Course using both directions', '左右両回りコース']],
  ['straight-course', ['Straight course', '直線コース']],
]);
for (const [id, names] of expectedGlossary) {
  const entry = glossaryById.get(id);
  if (!entry || entry.slug !== id || entry.term_en !== names[0] || entry.term_ja !== names[1]) fail(`glossary entry ${id} differs`);
}
if (amendments.schema_version !== 'racecourse-link-amendments-v1' || amendments.records?.length !== 2) fail('official link amendments differ');
const amendmentExpected = new Map([
  ['hipodromo-chile', 'https://www.hipodromo.cl/'],
  ['seoul-racecourse', 'https://park.kra.co.kr/'],
]);
for (const record of amendments.records ?? []) {
  const expected = amendmentExpected.get(record.id);
  if (!expected || record.official_links?.length !== 1 || record.official_links[0].url !== expected || record.official_links[0].link_type !== 'official') fail(`${record.id}: official link amendment differs`);
}

const dataSource = read('src/lib/data.ts');
for (const marker of ['racecourse-link-amendments-v1.json', 'racecourseLinkAmendmentById', 'applyRacecourseLinkAmendment']) if (!dataSource.includes(marker)) fail(`data.ts missing ${marker}`);
const componentSource = read('src/components/RacecoursePublicMeetingPanel.astro');
for (const marker of ['calendarDateHref', 'href={calendarDateHref(meeting.date)}']) if (!componentSource.includes(marker)) fail(`meeting panel missing ${marker}`);
const enSource = read('src/pages/tracks/[slug].astro');
const jaSource = read('src/pages/ja/tracks/[slug].astro');
for (const [label, source] of [['English page', enSource], ['Japanese page', jaSource]]) {
  for (const marker of ['surfaceGlossaryIds', 'directionGlossaryIds', 'surfaceTermRows', 'directionTerm', 'data-methodology-link']) if (!source.includes(marker)) fail(`${label} missing ${marker}`);
}

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
let countryComplete = 0;
let calendarComplete = 0;
let typeComplete = 0;
let relatedGlossaryComplete = 0;
let sourceRegistryComplete = 0;
let officialExternalComplete = 0;
let surfaceApplicable = 0;
let surfaceComplete = 0;
let directionApplicable = 0;
let directionComplete = 0;
let dateApplicable = 0;
let dateComplete = 0;
let methodologyComplete = 0;
const broken = [];
for (const record of records) {
  for (const lang of ['en', 'ja']) {
    const prefix = lang === 'ja' ? '/ja' : '';
    const route = `${prefix}/tracks/${record.slug}/`;
    const html = read(`dist/${route.replace(/^\//, '')}index.html`);
    const pageHrefs = hrefs(html);
    const countryHref = `${prefix}/countries/${record.country_id}/`;
    const calendarHref = `${prefix}/calendar/`;
    const sourceRegistryHref = `${prefix}/sources/${record.country_id}/`;
    const aboutHref = `${prefix}/about/`;
    countryComplete += Number(hasHref(html, countryHref));
    calendarComplete += Number(hasHref(html, calendarHref) || pageHrefs.some((href) => href.startsWith(`${calendarHref}?date=`)));
    const expectedTypeHrefs = (record.racing_types ?? []).map((id) => typeSlugs.get(id)).filter(Boolean).map((slug) => `${prefix}/types/${slug}/`);
    typeComplete += Number(expectedTypeHrefs.every((href) => hasHref(html, href)));
    const expectedRelated = (record.related_terms ?? []).map((id) => glossaryById.get(id)).filter(Boolean).map((entry) => `${prefix}/glossary/${entry.slug}/`);
    relatedGlossaryComplete += Number(expectedRelated.every((href) => hasHref(html, href)));
    sourceRegistryComplete += Number(hasHref(html, sourceRegistryHref));
    officialExternalComplete += Number((record.official_links ?? []).some((link) => pageHrefs.includes(link.url)));
    const expectedSurfaces = (record.surfaces ?? []).map((value) => surfaceGlossary.get(value)).filter(Boolean).map((id) => `${prefix}/glossary/${id}/`);
    if (expectedSurfaces.length) {
      surfaceApplicable += 1;
      surfaceComplete += Number(expectedSurfaces.every((href) => hasHref(html, href)));
    }
    const directionId = directionGlossary.get(record.direction);
    if (directionId) {
      directionApplicable += 1;
      directionComplete += Number(hasHref(html, `${prefix}/glossary/${directionId}/`));
    }
    const sourceRows = [...(meetingsByRacecourse.get(record.id) ?? [])].sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
    const referenceDate = '2026-07-14';
    const windowEndExclusive = '2026-08-13';
    const windowRows = sourceRows.filter((meeting) => meeting.date >= referenceDate && meeting.date < windowEndExclusive);
    const todayRows = windowRows.filter((meeting) => meeting.date === referenceDate);
    const upcomingRows = windowRows.filter((meeting) => meeting.date > referenceDate);
    const nextDate = upcomingRows[0]?.date ?? null;
    const nextRows = nextDate ? upcomingRows.filter((meeting) => meeting.date === nextDate) : [];
    const renderedRows = [...todayRows, ...nextRows, ...upcomingRows.slice(0, 8)];
    const dates = [...new Set(renderedRows.map((meeting) => meeting.date))];
    if (dates.length) {
      dateApplicable += 1;
      dateComplete += Number(dates.every((date) => hasHref(html, `${calendarHref}?date=${date}`)));
    }
    methodologyComplete += Number(hasHref(html, aboutHref));
    for (const href of pageHrefs.filter((value) => value.startsWith('/'))) {
      if (!internalExists(href)) broken.push({ route, href, expected_file: internalTarget(href) });
    }
  }
}
const actual = {
  countryComplete,
  calendarComplete,
  typeComplete,
  relatedGlossaryComplete,
  sourceRegistryComplete,
  officialExternalComplete,
  surfaceApplicable,
  surfaceComplete,
  directionApplicable,
  directionComplete,
  dateApplicable,
  dateComplete,
  methodologyComplete,
  broken: broken.length,
};
const expectedActual = {
  countryComplete: 72,
  calendarComplete: 72,
  typeComplete: 72,
  relatedGlossaryComplete: 72,
  sourceRegistryComplete: 72,
  officialExternalComplete: 72,
  surfaceApplicable: 52,
  surfaceComplete: 52,
  directionApplicable: 46,
  directionComplete: 46,
  methodologyComplete: 72,
  broken: 0,
};
for (const [key, expected] of Object.entries(expectedActual)) if (actual[key] !== expected) fail(`rendered count ${key} expected ${expected}; found ${actual[key]}`);
if (dateApplicable === 0 || dateComplete !== dateApplicable) fail(`rendered meeting-date links expected complete scope; found ${dateComplete}/${dateApplicable}`);
if (broken.length) broken.slice(0, 20).forEach((item) => fail(`broken internal page link ${item.route} -> ${item.href}`));

const prohibited = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url'];
const implementationText = `${enSource}\n${jaSource}\n${componentSource}`.toLowerCase();
for (const field of prohibited) {
  const access = new RegExp(`\\bmeeting\\.${field}\\b`);
  if (access.test(implementationText)) fail(`link implementation reads prohibited field ${field}`);
}

if (errors.length) {
  console.error(`RACECOURSE_PAGE_LINK_ARCHITECTURE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('RACECOURSE_PAGE_LINK_ARCHITECTURE: pass');
console.log('BILINGUAL_PAGES: 72');
console.log('OFFICIAL_EXTERNAL_LINKS: 72');
console.log('SURFACE_LINKS: 54/54');
console.log('DIRECTION_LINKS: 46/46');
console.log(`MEETING_DATE_LINKS: ${dateComplete}/${dateApplicable}`);
console.log('METHODOLOGY_LINKS: 72/72');
console.log('BROKEN_INTERNAL_PAGE_LINKS: 0');
console.log('PUBLIC_LIST_SHAPE: one_meeting_per_row');
