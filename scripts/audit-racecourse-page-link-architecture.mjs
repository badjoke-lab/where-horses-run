import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const files = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const evidence = readJson('data/static/racecourse-profile-evidence-japan-v1.json');
const evidenceById = new Map(evidence.records.map((record) => [record.id, record]));
const records = files
  .flatMap((file) => readJson(file))
  .map((record) => {
    const amendment = evidenceById.get(record.id);
    return amendment
      ? {
          ...record,
          ...amendment,
          course_profile: { ...record.course_profile, ...amendment.course_profile },
          seasonality: { ...record.seasonality, ...amendment.seasonality },
          data_status: { ...record.data_status, ...amendment.data_status },
        }
      : record;
  })
  .sort((left, right) => left.id.localeCompare(right.id));
const glossary = readJson('data/static/glossary.json');
const glossaryById = new Map(glossary.map((entry) => [entry.id, entry]));
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json').meetings ?? [];
const meetingIdsByRacecourse = new Map();
for (const meeting of publicMeetings) {
  const rows = meetingIdsByRacecourse.get(meeting.racecourse_id) ?? [];
  rows.push(meeting);
  meetingIdsByRacecourse.set(meeting.racecourse_id, rows);
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
const surfaceGlossaryCandidates = new Map([
  ['turf', 'turf'],
  ['dirt', 'dirt'],
  ['all-weather', 'all-weather'],
  ['sand', 'sand'],
  ['jump-course', 'jump-course'],
  ['harness-track', 'harness-track'],
  ['banei-straight', 'straight-course'],
]);
const directionGlossaryCandidates = new Map([
  ['left-handed', 'left-handed-course'],
  ['right-handed', 'right-handed-course'],
  ['both-directions', 'both-directions-course'],
  ['straight', 'straight-course'],
]);
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
const hasHref = (html, href) => hrefs(html).includes(href);
const internalTarget = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return 'dist/index.html';
  const normalized = clean.replace(/^\//, '').replace(/\/$/, '');
  return `dist/${normalized}/index.html`;
};
const internalExists = (href) => {
  if (!href.startsWith('/') || href.startsWith('//')) return true;
  return fs.existsSync(path.join(root, internalTarget(href)));
};

if (!fs.existsSync(path.join(root, 'dist'))) throw new Error('dist is missing; run npm run build first');

const pageResults = [];
const brokenInternalLinks = [];
const unresolvedGlossaryCandidates = new Map();
let pagesWithCountryLink = 0;
let pagesWithCalendarLink = 0;
let pagesWithTypeLinks = 0;
let pagesWithRelatedGlossaryLinks = 0;
let pagesWithSourceRegistryLink = 0;
let pagesWithOfficialExternalLink = 0;
let pagesWithSurfaceLinks = 0;
let pagesWithDirectionLink = 0;
let pagesWithMeetingDateLinks = 0;
let pagesWithDataStatusMethodologyLink = 0;

for (const record of records) {
  for (const lang of ['en', 'ja']) {
    const prefix = lang === 'ja' ? '/ja' : '';
    const route = `${prefix}/tracks/${record.slug}/`;
    const file = path.join(root, 'dist', route.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(file)) throw new Error(`missing rendered route ${route}`);
    const html = fs.readFileSync(file, 'utf8');
    const pageHrefs = hrefs(html);
    const countryHref = `${prefix}/countries/${record.country_id}/`;
    const calendarHref = `${prefix}/calendar/`;
    const sourceRegistryHref = `${prefix}/sources/${record.country_id}/`;
    const expectedTypeHrefs = (record.racing_types ?? [])
      .map((id) => typeSlugs.get(id))
      .filter(Boolean)
      .map((slug) => `${prefix}/types/${slug}/`);
    const expectedRelatedGlossaryHrefs = (record.related_terms ?? [])
      .map((id) => glossaryById.get(id))
      .filter(Boolean)
      .map((entry) => `${prefix}/glossary/${entry.slug}/`);
    const expectedSurfaceHrefs = (record.surfaces ?? [])
      .map((surface) => [surface, surfaceGlossaryCandidates.get(surface)])
      .filter(([, id]) => id)
      .map(([surface, id]) => {
        if (!glossaryById.has(id)) unresolvedGlossaryCandidates.set(id, { kind: 'surface', source_value: surface });
        return `${prefix}/glossary/${id}/`;
      });
    const directionId = directionGlossaryCandidates.get(record.direction);
    if (directionId && !glossaryById.has(directionId)) unresolvedGlossaryCandidates.set(directionId, { kind: 'direction', source_value: record.direction });
    const expectedDirectionHref = directionId ? `${prefix}/glossary/${directionId}/` : null;
    const meetings = meetingIdsByRacecourse.get(record.id) ?? [];
    const expectedDateHrefs = [...new Set(meetings.map((meeting) => `${calendarHref}?date=${meeting.date}`))];

    const countryLinked = hasHref(html, countryHref);
    const calendarLinked = hasHref(html, calendarHref) || pageHrefs.some((href) => href.startsWith(`${calendarHref}?`));
    const typeLinksComplete = expectedTypeHrefs.every((href) => hasHref(html, href));
    const relatedGlossaryComplete = expectedRelatedGlossaryHrefs.every((href) => hasHref(html, href));
    const sourceRegistryLinked = hasHref(html, sourceRegistryHref);
    const officialExternalLinked = (record.official_links ?? []).some((link) => pageHrefs.includes(link.url));
    const surfaceLinksComplete = expectedSurfaceHrefs.length > 0 && expectedSurfaceHrefs.every((href) => hasHref(html, href));
    const directionLinked = expectedDirectionHref ? hasHref(html, expectedDirectionHref) : record.direction === 'unknown';
    const meetingDateLinksComplete = expectedDateHrefs.length > 0 && expectedDateHrefs.every((href) => hasHref(html, href));
    const dataStatusMethodologyLinked = pageHrefs.some((href) => href === `${prefix}/about/` || href.startsWith(`${prefix}/about/`));

    pagesWithCountryLink += Number(countryLinked);
    pagesWithCalendarLink += Number(calendarLinked);
    pagesWithTypeLinks += Number(typeLinksComplete);
    pagesWithRelatedGlossaryLinks += Number(relatedGlossaryComplete);
    pagesWithSourceRegistryLink += Number(sourceRegistryLinked);
    pagesWithOfficialExternalLink += Number(officialExternalLinked);
    pagesWithSurfaceLinks += Number(surfaceLinksComplete);
    pagesWithDirectionLink += Number(directionLinked);
    pagesWithMeetingDateLinks += Number(meetingDateLinksComplete);
    pagesWithDataStatusMethodologyLink += Number(dataStatusMethodologyLinked);

    for (const href of pageHrefs.filter((value) => value.startsWith('/'))) {
      if (!internalExists(href)) brokenInternalLinks.push({ route, href, expected_file: internalTarget(href) });
    }

    pageResults.push({
      route,
      racecourse_id: record.id,
      country_link: countryLinked,
      calendar_link: calendarLinked,
      type_links: typeLinksComplete,
      related_glossary_links: relatedGlossaryComplete,
      source_registry_link: sourceRegistryLinked,
      official_external_link: officialExternalLinked,
      surface_links: surfaceLinksComplete,
      direction_link: directionLinked,
      meeting_date_links: meetingDateLinksComplete,
      data_status_methodology_link: dataStatusMethodologyLinked,
      public_meeting_count: meetings.length,
    });
  }
}

const totalPages = pageResults.length;
const audit = {
  schema_version: 'racecourse-page-link-architecture-discovery-v1',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-LINK-ARCHITECTURE-01',
  reviewed_page_spec: 'where-horses-run-racecourse-page-spec.md',
  reviewed_link_architecture: 'where-horses-run-page-link-architecture.md',
  counts: {
    racecourses: records.length,
    bilingual_pages: totalPages,
    public_meetings: publicMeetings.length,
    country_links_complete: pagesWithCountryLink,
    calendar_links_present: pagesWithCalendarLink,
    racing_type_links_complete: pagesWithTypeLinks,
    related_glossary_links_complete: pagesWithRelatedGlossaryLinks,
    source_registry_links_present: pagesWithSourceRegistryLink,
    official_external_links_present: pagesWithOfficialExternalLink,
    surface_links_complete: pagesWithSurfaceLinks,
    direction_links_complete: pagesWithDirectionLink,
    meeting_date_links_complete: pagesWithMeetingDateLinks,
    data_status_methodology_links_present: pagesWithDataStatusMethodologyLink,
    broken_internal_links: brokenInternalLinks.length,
    unresolved_glossary_candidates: unresolvedGlossaryCandidates.size,
  },
  unresolved_glossary_candidates: [...unresolvedGlossaryCandidates.entries()].map(([id, detail]) => ({ id, ...detail })),
  broken_internal_links: brokenInternalLinks,
  page_results: pageResults,
  boundaries: {
    repository_write: false,
    network_fetch: false,
    new_public_data: false,
    participant_data_display: false,
    betting_data_display: false,
    result_or_payout_display: false,
    prediction_display: false,
    publication: false,
    deployment: false,
  },
};
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}
console.log(JSON.stringify(audit, null, 2));
