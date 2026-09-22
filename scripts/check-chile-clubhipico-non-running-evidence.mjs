import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
  CHILE_CLUB_HIPICO_RACECOURSE_ID,
  bindChileClubHipicoNonRunningEvidence,
  discoverChileClubHipicoNonRunningArticles,
  parseChileClubHipicoNonRunningArticle,
} from './timetable/chile-clubhipico-non-running-evidence.mjs';

function article(body) {
  return '<!doctype html><html><body><main><h1>Club Hípico de Santiago</h1><p>'
    + body
    + '</p></main></body></html>';
}

const wholeSuspensionUrl =
  'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-informa-suspension-14-junio/';
const recalendarUrl =
  'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-recalendarizacion/';
const partialEleventhUrl =
  'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-suspende-su-reunion-del-viernes-21-de-junio-a-partir-de-la-11ma-carrera/';
const partialLastThreeUrl =
  'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-anulacion-viernes-2-de-agosto-2024/';
const postponedUrl =
  'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-postergacion-de-la-jornada-excepcional-de-carreras-agendada-para-el-17-de-agosto-2025/';

const archive = [
  '<!doctype html><html><body>',
  '<h1>Noticias de Corporativo - Club Hípico de Santiago</h1>',
  '<article>Club Hípico de Santiago anuncia la postergación de la jornada excepcional de carreras agendada para el 17 de agosto 2025 <a href="' + postponedUrl + '">VER NOTICIA</a></article>',
  '<article>Club Hípico de Santiago anuncia la anulación de las últimas tres competencias <a href="' + partialLastThreeUrl + '">VER NOTICIA</a></article>',
  '<article>Club Hípico de Santiago anuncia la recalendarización de la jornada suspendida el pasado 14 de junio 2024 <a href="' + recalendarUrl + '">VER NOTICIA</a></article>',
  '<article>Club Hípico suspende sus jornadas de carreras <a href="/sala-prensa/noticias/suspension-de-actividades-2020/">VER NOTICIA</a></article>',
  '<article>Club Hípico presenta calendario anual <a href="/sala-prensa/noticias/calendario-anual/">VER NOTICIA</a></article>',
  '</body></html>',
].join('\n');

const discovered = discoverChileClubHipicoNonRunningArticles(archive, {
  sourceUrl: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
});
assert.ok(discovered.article_urls.includes(postponedUrl));
assert.ok(discovered.article_urls.includes(partialLastThreeUrl));
assert.ok(discovered.article_urls.includes(recalendarUrl));
assert.ok(discovered.article_urls.includes('https://www.clubhipico.cl/sala-prensa/noticias/suspension-de-actividades-2020/'));
assert.equal(discovered.article_urls.some((url) => url.endsWith('/calendario-anual/')), false,
  'neutral archive articles must not be fetched as negative-evidence candidates');

const whole = parseChileClubHipicoNonRunningArticle(article(
  'Santiago, 13 de junio 2024 – Club Hípico de Santiago lamenta informar la suspensión de la jornada N°37 programada para este viernes 14 de junio de 2024, debido a las intensas precipitaciones.',
), {
  sourceUrl: wholeSuspensionUrl,
  startDate: '2024-06-01',
  endDateExclusive: '2024-07-01',
});
assert.equal(whole.evidence.length, 1);
assert.equal(whole.evidence[0].date, '2024-06-14');
assert.equal(whole.evidence[0].replacement_date, null);
assert.equal(whole.diagnostics.disposition, 'accepted_whole_meeting_non_running');

const postponed = parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago anuncia la postergación de la jornada de carreras excepcional que había sido programada para el próximo domingo 17 de agosto de 2025. La nueva fecha será informada oportunamente.',
), {
  sourceUrl: postponedUrl,
  startDate: '2025-08-01',
  endDateExclusive: '2025-09-01',
});
assert.equal(postponed.evidence.length, 1);
assert.equal(postponed.evidence[0].date, '2025-08-17');
assert.equal(postponed.evidence[0].replacement_date, null);

const recalendar = parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago anuncia la recalendarización de la jornada suspendida. El directorio ha fijado una nueva fecha para la disputa de la jornada que estaba programada para el pasado viernes 14 de junio de 2024. La jornada se realizará el domingo 15 de septiembre de 2024.',
), {
  sourceUrl: recalendarUrl,
  startDate: '2024-06-01',
  endDateExclusive: '2024-07-01',
});
assert.equal(recalendar.evidence.length, 1);
assert.equal(recalendar.evidence[0].date, '2024-06-14');
assert.equal(recalendar.evidence[0].replacement_date, '2024-09-15',
  'replacement date may be retained as evidence but must not become a generated meeting');

const partialEleventh = parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago suspende su reunión del viernes 21 de junio a partir de la 11ma carrera. Las primeras 10 competencias se realizaron.',
), {
  sourceUrl: partialEleventhUrl,
});
assert.deepEqual(partialEleventh.evidence, []);
assert.equal(partialEleventh.diagnostics.disposition, 'rejected_partial_race_scope');

const partialLastThree = parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago anuncia la anulación de las últimas tres competencias de este viernes 2 de agosto 2024.',
), {
  sourceUrl: partialLastThreeUrl,
});
assert.deepEqual(partialLastThree.evidence, []);
assert.equal(partialLastThree.diagnostics.disposition, 'rejected_partial_race_scope');

const surfaceChange = parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago informa cambios de pista y distancias para la jornada programada para este viernes 17 de julio de 2026. La reunión continúa.',
), {
  sourceUrl: 'https://www.clubhipico.cl/sala-prensa/noticias/operacion-parcial-pista-pasto/',
});
assert.deepEqual(surfaceChange.evidence, []);
assert.equal(surfaceChange.diagnostics.disposition, 'not_explicit_whole_meeting_non_running');

assert.throws(() => parseChileClubHipicoNonRunningArticle(article(
  'Club Hípico de Santiago informa la suspensión de la jornada programada para el viernes 14 de junio de 2024.',
), {
  sourceUrl: 'https://example.com/sala-prensa/noticias/fake/',
}), /official clubhipico\.cl/);

const canonical = [{
  meeting_id: 'chile-' + CHILE_CLUB_HIPICO_RACECOURSE_ID + '-2024-06-14',
  country_id: 'chile',
  authority_id: 'teletrak-chile',
  racing_system_id: 'chile-teletrak-racing-system',
  racecourse_id: CHILE_CLUB_HIPICO_RACECOURSE_ID,
  date: '2024-06-14',
}];

const bound = bindChileClubHipicoNonRunningEvidence({
  evidence: [...whole.evidence, ...recalendar.evidence],
  canonicalMeetings: canonical,
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.equal(bound.meeting_presence_records.length, 1,
  'multiple official articles for one original date must dedupe to one presence disposition');
assert.equal(bound.meeting_presence_records[0].meeting_id,
  'chile-club-hipico-de-santiago-racecourse-2024-06-14');
assert.equal(bound.meeting_presence_records[0].state, 'confirmed_non_running');
assert.equal(bound.meeting_presence_records[0].scope, 'whole_meeting');
assert.equal(bound.meeting_presence_records[0].evidence_type, 'official_explicit_non_running');
assert.equal(bound.meeting_presence_records[0].date, '2024-06-14');
assert.notEqual(bound.meeting_presence_records[0].date, '2024-09-15',
  'replacement date must never replace original meeting identity');

const missing = bindChileClubHipicoNonRunningEvidence({
  evidence: whole.evidence,
  canonicalMeetings: [],
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(missing.meeting_presence_records, []);
assert.equal(missing.diagnostics.skipped[0].reason, 'canonical_binding_missing');

const ambiguous = bindChileClubHipicoNonRunningEvidence({
  evidence: whole.evidence,
  canonicalMeetings: [
    ...canonical,
    {
      ...canonical[0],
      meeting_id: 'chile-club-hipico-de-santiago-racecourse-2024-06-14-duplicate',
    },
  ],
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(ambiguous.meeting_presence_records, []);
assert.equal(ambiguous.diagnostics.skipped[0].reason, 'canonical_binding_ambiguous');

const runner = fs.readFileSync('scripts/timetable/run-chile-teletrak-official-window.mjs', 'utf8');
assert.match(runner, /discoverChileClubHipicoNonRunningArticles/);
assert.match(runner, /parseChileClubHipicoNonRunningArticle/);
assert.match(runner, /bindChileClubHipicoNonRunningEvidence/);
assert.match(runner, /meeting_presence_records:\s*meetingPresenceRecords/);
assert.match(runner, /non_running_source_status/);
assert.match(runner, /catch \(error\)/, 'negative-evidence source failure must fail closed');

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
assert.ok((workflow.match(/--artifact=\.calendar-unified\/chile\.json/g) ?? []).length >= 2,
  'Chile rolling artifact must remain wired into meeting-presence disposition in normal and latest-main rebuild paths');
assert.match(workflow, /node scripts\/check-chile-clubhipico-non-running-evidence\.mjs/);

console.log('CHILE_CLUB_HIPICO_NON_RUNNING_EVIDENCE: pass');
console.log('WHOLE_MEETING_FIXTURES: pass');
console.log('PARTIAL_RACE_REJECTION: pass');
console.log('CANONICAL_BINDING: pass');
