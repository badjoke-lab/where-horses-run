import fs from 'node:fs';

const FRANCE_GALOP_ARCHIVE = 'https://www.france-galop.com/fr/hippodromes';
const FRANCE_GALOP_KNOWN = [
  {
    id: 'whole_cancel_2026_06_25',
    url: 'https://www.france-galop.com/fr/content/annulation-des-reunions-de-la-teste-deauville-jeudi-25-juin-2026',
  },
  {
    id: 'venue_transfer_2026_09_14',
    url: 'https://www.france-galop.com/fr/content/transfert-de-la-reunion-de-marseille-borely-salon-de-provence',
  },
  {
    id: 'partial_races_2025_05_10',
    url: 'https://www.france-galop.com/fr/content/report-des-quatre-epreuves-annulees-samedi-10-mai-2025-compiegne',
  },
];

const LETROT_BULLETINS = [
  {
    id: 'current_2026_w38',
    url: 'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication?annee=2026&semaine=38&type=BULLETIN',
  },
  {
    id: 'recent_2026_w03',
    url: 'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication?annee=2026&semaine=3&type=BULLETIN',
  },
  {
    id: 'whole_cancel_reschedule_2021_w40',
    url: 'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication?annee=2021&semaine=40&type=BULLETIN',
  },
];

function decode(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&agrave;/gi, 'à')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&rsquo;|&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(value) {
  return decode(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.7',
      },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.text();
    return {
      requested_url: url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      content_type: response.headers.get('content-type'),
      bytes: Buffer.byteLength(body),
      body,
    };
  } catch (error) {
    return {
      requested_url: url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      body: '',
    };
  }
}

function franceGalopFingerprints(text) {
  const s = fold(text);
  return {
    authority: s.includes('france galop'),
    archive: s.includes('hippodromes'),
    whole_cancel_2026_06_25:
      s.includes('annulation des reunions') &&
      s.includes('la teste') &&
      s.includes('deauville') &&
      s.includes('25 juin 2026'),
    venue_transfer_2026_09_14:
      s.includes('transfert de la reunion') &&
      s.includes('marseille-borely') &&
      s.includes('salon-de-provence') &&
      s.includes('14 septembre 2026'),
    partial_races_2025_05_10:
      s.includes('quatre epreuves annulees') &&
      s.includes('10 mai 2025') &&
      s.includes('compiegne'),
  };
}

function letrotFingerprints(text) {
  const s = fold(text);
  return {
    authority: s.includes('bulletin de la setf') || s.includes('bulletin de la secf'),
    whole_cancel_reschedule:
      s.includes('la reunion annulee') &&
      s.includes('est reportee au'),
    partial_cancelled_races:
      s.includes('courses annulees') &&
      s.includes('ont ete reportees'),
    programme_rectifications:
      s.includes('rectifications aux programmes') || s.includes('index des rectifications'),
  };
}

function archiveCandidates(html) {
  const source = String(html ?? '');
  const found = new Map();
  for (const match of source.matchAll(/href\s*=\s*["']([^"']*\/fr\/content\/[^"']+)["']/gi)) {
    const url = new URL(match[1], FRANCE_GALOP_ARCHIVE).toString();
    const context = decode(source.slice(Math.max(0, (match.index ?? 0) - 1200), (match.index ?? 0) + 600));
    if (!/(annulation|transfert|report)/i.test(fold(context))) continue;
    if (!found.has(url)) found.set(url, context.slice(0, 900));
  }
  return [...found.entries()].map(([url, context]) => ({ url, context })).slice(0, 60);
}

const archive = await fetchText(FRANCE_GALOP_ARCHIVE);
const archiveRows = archiveCandidates(archive.body);

const franceGalopArticles = [];
for (const item of FRANCE_GALOP_KNOWN) {
  const result = await fetchText(item.url);
  franceGalopArticles.push({
    id: item.id,
    requested_url: item.url,
    final_url: result.final_url ?? null,
    status: result.status ?? null,
    ok: result.ok,
    bytes: result.bytes ?? 0,
    error: result.error ?? null,
    fingerprints: franceGalopFingerprints(result.body),
    text_sample: decode(result.body).slice(0, 2400),
  });
}

const letrot = [];
for (const item of LETROT_BULLETINS) {
  const result = await fetchText(item.url);
  letrot.push({
    id: item.id,
    requested_url: item.url,
    final_url: result.final_url ?? null,
    status: result.status ?? null,
    ok: result.ok,
    bytes: result.bytes ?? 0,
    error: result.error ?? null,
    fingerprints: letrotFingerprints(result.body),
    text_sample: decode(result.body).slice(0, 2600),
  });
}

const artifact = {
  schema_version: 'france-non-running-route-probe-v1',
  generated_at: new Date().toISOString(),
  purpose: 'Determine whether France Galop news and LeTROT/SETF bulletins provide stable bounded official positive-evidence routes for whole-meeting cancellation/postponement/transfer without promoting partial-race changes.',
  france_galop: {
    archive: {
      url: FRANCE_GALOP_ARCHIVE,
      final_url: archive.final_url ?? null,
      status: archive.status ?? null,
      ok: archive.ok,
      bytes: archive.bytes ?? 0,
      error: archive.error ?? null,
      fingerprints: franceGalopFingerprints(archive.body),
      candidate_count: archiveRows.length,
      candidates: archiveRows,
    },
    articles: franceGalopArticles,
  },
  letrot: {
    bulletins: letrot,
  },
};

fs.writeFileSync('probe-france-non-running.json', JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify(artifact, null, 2));

if (!archive.ok) throw new Error('France Galop Hippodromes archive was not fetchable');
if (!archiveRows.some((row) => row.url === FRANCE_GALOP_KNOWN[0].url)) {
  throw new Error('France Galop archive no longer discovers the 2026-06-25 whole-meeting cancellation article');
}
for (const id of ['whole_cancel_2026_06_25', 'venue_transfer_2026_09_14', 'partial_races_2025_05_10']) {
  const row = franceGalopArticles.find((item) => item.id === id);
  if (!row?.ok) throw new Error('Required France Galop fixture failed: ' + id);
}
if (!franceGalopArticles.find((x) => x.id === 'whole_cancel_2026_06_25')?.fingerprints.whole_cancel_2026_06_25) {
  throw new Error('France Galop whole-meeting cancellation fingerprint missing');
}
if (!franceGalopArticles.find((x) => x.id === 'venue_transfer_2026_09_14')?.fingerprints.venue_transfer_2026_09_14) {
  throw new Error('France Galop meeting-transfer fingerprint missing');
}
if (!franceGalopArticles.find((x) => x.id === 'partial_races_2025_05_10')?.fingerprints.partial_races_2025_05_10) {
  throw new Error('France Galop partial-race negative fixture fingerprint missing');
}
const historicalLetrot = letrot.find((x) => x.id === 'whole_cancel_reschedule_2021_w40');
if (!historicalLetrot?.ok || !historicalLetrot.fingerprints.whole_cancel_reschedule) {
  throw new Error('LeTROT whole-meeting cancellation/reschedule historical fixture missing');
}
const currentLetrot = letrot.find((x) => x.id === 'current_2026_w38');
if (!currentLetrot?.ok || !currentLetrot.fingerprints.authority) {
  throw new Error('Current LeTROT/SETF bulletin route is not fetchable/stable');
}
