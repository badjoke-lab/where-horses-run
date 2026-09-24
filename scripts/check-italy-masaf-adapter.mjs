import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  ITALY_GALLOP_SYSTEM_ID,
  ITALY_TROT_SYSTEM_ID,
  buildItalyMasafMeetingRecord,
  parseItalyMasafCalendarAttachmentUrl,
  parseItalyMasafCalendarPages,
  parseItalyMasafLatestCalendarPageUrl,
  resolveItalyRacecourse,
} from './timetable/italy-masaf-core.mjs';

const indexHtml = `<a href="/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/24881">D.D. n. 340652 del 13/07/2026 - di modifica del calendario delle corse ippiche per l'anno 2026</a>
<a href="/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/25118">D.D.G. n. 456638 del 10/09/2026 - di modifica del calendario delle corse ippiche per l'anno 2026</a>`;
const latest = parseItalyMasafLatestCalendarPageUrl(indexHtml);
assert.equal(latest.iso, '2026-09-10');
assert.match(latest.url, /IDPagina\/25118/);

const pageHtml = `<a href="/flex/cm/pages/ServeAttachment.php/L/IT/D/test/P/BLOB:ID=25118/E/pdf?mode=download">ALLEGATO n. 1 Calendario corse ippiche per l'anno 2026 aggiornato al 10 settembre 2026</a>`;
assert.match(parseItalyMasafCalendarAttachmentUrl(pageHtml, { baseUrl: latest.url }), /ServeAttachment/);

assert.equal(resolveItalyRacecourse('CES').racecourse_id, 'italy--ippodromo-del-savio');
assert.equal(resolveItalyRacecourse('MCT').racecourse_id, 'italy--ippodromo-sesana');
assert.equal(resolveItalyRacecourse('PTC').racecourse_id, 'italy--ippodromo-valentinia');
assert.equal(resolveItalyRacecourse('CDS').racecourse_id, 'italy--ippodromo-dei-sauri');

const headerY = 700;
const page = {
  page_number: 9,
  items: [
    { str: 'CALENDARIO IPPICO DI SERVIZIO ANNO 2026 - GIORNATE DI CORSE DI SETTEMBRE', x: 50, y: 760 },
    { str: 'GG', x: 100, y: headerY },
    { str: 'TO', x: 150, y: headerY },
    { str: 'MI', x: 180, y: headerY },
    { str: 'VA', x: 210, y: headerY },
    { str: 'ALB', x: 240, y: headerY },
    { str: 'ME', x: 270, y: headerY },
    { str: 'TV', x: 300, y: headerY },
    { str: 'PD', x: 330, y: headerY },
    { str: 'BO', x: 360, y: headerY },
    { str: 'MO', x: 390, y: headerY },
    { str: 'CES', x: 420, y: headerY },
    { str: 'FI', x: 450, y: headerY },
    { str: 'MCT', x: 480, y: headerY },
    { str: 'PI', x: 510, y: headerY },
    { str: 'LI', x: 540, y: headerY },
    { str: 'MTG', x: 570, y: headerY },
    { str: 'COR', x: 600, y: headerY },
    { str: 'RM', x: 630, y: headerY },
    { str: 'TC', x: 660, y: headerY },
    { str: 'NA', x: 690, y: headerY },
    { str: 'SCD', x: 720, y: headerY },
    { str: 'AV', x: 750, y: headerY },
    { str: 'PTC', x: 780, y: headerY },
    { str: 'CDS', x: 810, y: headerY },
    { str: 'TA', x: 840, y: headerY },
    { str: 'CAS', x: 870, y: headerY },
    { str: 'PA', x: 900, y: headerY },
    { str: 'SR', x: 930, y: headerY },
    { str: 'CHI', x: 960, y: headerY },
    { str: 'SS', x: 990, y: headerY },
    { str: '25', x: 100, y: 600 },
    { str: 'T', x: 150, y: 600 },
    { str: 'OG', x: 270, y: 600 },
    { str: 'G', x: 900, y: 600 },
    { str: '26', x: 100, y: 580 },
    { str: 'M', x: 870, y: 580 },
  ],
};
const parsed = parseItalyMasafCalendarPages([page], { year: 2026, sourceUrl: 'https://example.test/masaf.pdf' });
assert.equal(parsed.parse_failures.length, 0);
assert.equal(parsed.unknown_venues.length, 0);
assert.equal(parsed.records.filter((row) => row.date === '2026-09-25').length, 3);
assert.equal(parsed.records.filter((row) => row.date === '2026-09-25' && row.system_id === ITALY_TROT_SYSTEM_ID).length, 1);
assert.equal(parsed.records.filter((row) => row.date === '2026-09-25' && row.system_id === ITALY_GALLOP_SYSTEM_ID).length, 2);
assert.equal(parsed.records.filter((row) => row.date === '2026-09-26').length, 2);

const gallopRow = parsed.records.find((row) => row.system_id === ITALY_GALLOP_SYSTEM_ID);
const record = buildItalyMasafMeetingRecord(gallopRow, { checkedAt: '2026-09-25T00:00:00Z' });
assert.equal(record.country_id, 'italy');
assert.equal(record.authority_id, 'masaf');
assert.equal(record.capability_rank, 'C');
assert.equal(record.first_race_time_local, null);
assert.equal(record.acquisition_completion.observed_rank, 'C');
assert.equal(record.acquisition_completion.technical_capability_rank, 'C');
assert.equal(record.acquisition_completion.disposition, 'not_applicable');
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: record.acquisition_attempt,
  acquisition_completion: record.acquisition_completion,
  evidence_support: record.evidence_support,
}), []);

console.log('ITALY_MASAF_ADAPTER: pass');
