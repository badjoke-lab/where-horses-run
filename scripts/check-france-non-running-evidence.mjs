import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  FRANCE_GALOP_NON_RUNNING_ARCHIVE_URL,
  bindFranceNonRunningEvidence,
  discoverFranceGalopNonRunningArticles,
  letrotBulletinUrlsForWindow,
  parseFranceGalopNonRunningArticle,
  parseLetrotNonRunningBulletin,
} from './timetable/france-non-running-evidence.mjs';

const cancelUrl = 'https://www.france-galop.com/fr/content/annulation-des-reunions-de-la-teste-deauville-jeudi-25-juin-2026';
const transferUrl = 'https://www.france-galop.com/fr/content/transfert-de-la-reunion-de-marseille-borely-salon-de-provence';
const partialUrl = 'https://www.france-galop.com/fr/content/report-des-quatre-epreuves-annulees-samedi-10-mai-2025-compiegne';

const archive = [
  '<html><body><h1>France Galop Hippodromes</h1>',
  '<article>Annulation des réunions de La Teste & Deauville <a href="' + cancelUrl + '">Lire</a></article>',
  '<article>Transfert de la réunion de Marseille-Borély à Salon-de-Provence <a href="' + transferUrl + '">Lire</a></article>',
  '<article>Report des quatre épreuves annulées <a href="' + partialUrl + '">Lire</a></article>',
  '<article>Actualité normale <a href="/fr/content/prix-normal">Lire</a></article>',
  '</body></html>',
].join('\n');

const discovered = discoverFranceGalopNonRunningArticles(archive, { sourceUrl: FRANCE_GALOP_NON_RUNNING_ARCHIVE_URL });
assert.deepEqual(discovered.article_urls, [cancelUrl, transferUrl, partialUrl]);

const cancelHtml = '<html><body>France Galop ANNULATION DES REUNIONS PREMIUM DE LA TESTE ET DE DEAUVILLE. Les réunions du jeudi 25 juin 2026 programmées à La Teste et à Deauville sont annulées.</body></html>';
const cancelled = parseFranceGalopNonRunningArticle(cancelHtml, {
  sourceUrl: cancelUrl,
  startDate: '2026-06-01',
  endDateExclusive: '2026-07-01',
});
assert.equal(cancelled.evidence.length, 2);
assert.deepEqual(cancelled.evidence.map((row) => row.date), ['2026-06-25', '2026-06-25']);
assert.deepEqual(cancelled.evidence.map((row) => row.racecourse_id).sort(), ['deauville-racecourse', 'la-teste-racecourse']);

const transferHtml = '<html><body>France Galop TRANSFERT DE LA REUNION DE MARSEILLE-BORELY A SALON-DE-PROVENCE. La réunion du lundi 14 septembre 2026, initialement prévue sur l’hippodrome de Marseille-Borély, est transférée sur l’hippodrome de Salon-de-Provence. Afin d’assurer les meilleures conditions.</body></html>';
const transferred = parseFranceGalopNonRunningArticle(transferHtml, {
  sourceUrl: transferUrl,
  startDate: '2026-09-01',
  endDateExclusive: '2026-10-01',
});
assert.equal(transferred.evidence.length, 1);
assert.equal(transferred.evidence[0].date, '2026-09-14');
assert.equal(transferred.evidence[0].racecourse_id, 'marseille-borely-racecourse');
assert.equal(transferred.evidence[0].replacement_racecourse_id, 'salon-de-provence-racecourse');
assert.equal(transferred.evidence[0].replacement_date, '2026-09-14');

const partialHtml = '<html><body>France Galop Report des quatre épreuves annulées samedi 10 mai 2025 à Compiègne. Samedi 10 mai 2025, quatre courses n’ont pu être organisées à la suite de l’arrêt de la réunion. Les épreuves seront reprogrammées.</body></html>';
const partial = parseFranceGalopNonRunningArticle(partialHtml, { sourceUrl: partialUrl });
assert.deepEqual(partial.evidence, []);
assert.equal(partial.diagnostics.disposition, 'rejected_partial_race_scope');

assert.throws(() => parseFranceGalopNonRunningArticle(cancelHtml, {
  sourceUrl: 'https://example.com/fr/content/fake',
}), /official france-galop\.com/);

const bulletinUrl = 'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication?annee=2021&semaine=40&type=BULLETIN';
const bulletin = [
  'BULLETIN DE LA SECF - N° 40 - Jeudi 7 octobre 2021',
  '13 SALON DE PROVENCE (BOUCHES DU RHONE) Pôle Régional B Commissaires : MM. X',
  'Conditions particulières limitation des partants.',
  'La réunion annulée du lundi 4 octobre 2021 est reportée au : Vendredi 5 novembre 2021 à 13 heures, voir programme ci-dessous :',
  'Réunion 1304 309 Vendredi 5 novembre 2021 (13 heures)',
].join('\n');
const letrot = parseLetrotNonRunningBulletin(bulletin, {
  sourceUrl: bulletinUrl,
  startDate: '2021-10-01',
  endDateExclusive: '2021-10-10',
});
assert.equal(letrot.evidence.length, 1);
assert.equal(letrot.evidence[0].date, '2021-10-04');
assert.equal(letrot.evidence[0].replacement_date, '2021-11-05');
assert.equal(letrot.evidence[0].racecourse_id, 'salon-de-provence-racecourse');

const raceOnlyBulletin = [
  'BULLETIN DE LA SETF - N° 3',
  'PARIS-VINCENNES (PARIS) Pôle Régional A',
  'Les courses annulées ont été reportées sur plusieurs réunions.',
].join('\n');
const raceOnly = parseLetrotNonRunningBulletin(raceOnlyBulletin, {
  sourceUrl: 'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication?annee=2026&semaine=3&type=BULLETIN',
});
assert.deepEqual(raceOnly.evidence, []);

const urls = letrotBulletinUrlsForWindow('2026-09-23', '2026-10-23');
assert(urls.length >= 2);
assert(urls.every((url) => url.startsWith('https://pro.letrot.com/')));
assert(urls.every((url) => url.includes('type=BULLETIN')));

const canonical = [
  {
    meeting_id: 'france-galop-la-teste-racecourse-2026-06-25',
    country_id: 'france',
    authority_id: 'france-galop',
    racing_system_id: 'france-france-galop-system',
    racecourse_id: 'la-teste-racecourse',
    date: '2026-06-25',
  },
  {
    meeting_id: 'france-galop-deauville-racecourse-2026-06-25',
    country_id: 'france',
    authority_id: 'france-galop',
    racing_system_id: 'france-france-galop-system',
    racecourse_id: 'deauville-racecourse',
    date: '2026-06-25',
  },
  {
    meeting_id: 'france-letrot-salon-de-provence-racecourse-2021-10-04',
    country_id: 'france',
    authority_id: 'letrot',
    racing_system_id: 'france-letrot-system',
    racecourse_id: 'salon-de-provence-racecourse',
    date: '2021-10-04',
  },
];

const bound = bindFranceNonRunningEvidence({
  evidence: [...cancelled.evidence, ...letrot.evidence],
  canonicalMeetings: canonical,
  checkedAt: '2026-09-23T00:00:00Z',
});
assert.equal(bound.meeting_presence_records.length, 3);
assert(bound.meeting_presence_records.every((row) => row.state === 'confirmed_non_running'));
assert(bound.meeting_presence_records.every((row) => row.scope === 'whole_meeting'));
assert(bound.meeting_presence_records.every((row) => row.evidence_type === 'official_explicit_non_running'));

const replacementCanonical = {
  meeting_id: 'france-galop-salon-de-provence-racecourse-2026-09-14',
  country_id: 'france',
  authority_id: 'france-galop',
  racing_system_id: 'france-france-galop-system',
  racecourse_id: 'salon-de-provence-racecourse',
  date: '2026-09-14',
};
const transferredBound = bindFranceNonRunningEvidence({
  evidence: transferred.evidence,
  canonicalMeetings: [replacementCanonical],
  checkedAt: '2026-09-23T00:00:00Z',
});
assert.deepEqual(transferredBound.meeting_presence_records, []);
assert.equal(transferredBound.diagnostics.skipped[0].reason, 'canonical_binding_missing',
  'replacement meeting must not be suppressed when original venue meeting is absent');

const runner = fs.readFileSync('scripts/timetable/run-france-fnch-official-window.mjs', 'utf8');
assert.match(runner, /discoverFranceGalopNonRunningArticles/);
assert.match(runner, /parseFranceGalopNonRunningArticle/);
assert.match(runner, /parseLetrotNonRunningBulletin/);
assert.match(runner, /meeting_presence_records/);
assert.match(runner, /non_running_source_status/);

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
assert.match(workflow, /node scripts\/check-france-non-running-evidence\.mjs/);
assert.ok((workflow.match(/--artifact=\.calendar-unified\/france-galop\.json/g) ?? []).length >= 2);
assert.ok((workflow.match(/--artifact=\.calendar-unified\/france-letrot\.json/g) ?? []).length >= 2);

console.log('FRANCE_NON_RUNNING_EVIDENCE: pass');
console.log('FRANCE_GALOP_WHOLE_AND_TRANSFER: pass');
console.log('FRANCE_PARTIAL_RACE_REJECTION: pass');
console.log('LETROT_WHOLE_MEETING_POSTPONEMENT: pass');
