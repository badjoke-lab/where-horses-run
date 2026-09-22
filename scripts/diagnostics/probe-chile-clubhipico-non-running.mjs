import fs from 'node:fs';

const CATEGORY_URL = 'https://www.clubhipico.cl/sala-prensa/categoria/corporativo/';
const KNOWN = [
  {
    id: 'whole_2024_06_14',
    url: 'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-informa-suspension-14-junio/',
  },
  {
    id: 'recalendar_2024_06_14',
    url: 'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-recalendarizacion/',
  },
  {
    id: 'partial_2024_06_21',
    url: 'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-suspende-su-reunion-del-viernes-21-de-junio-a-partir-de-la-11ma-carrera/',
  },
  {
    id: 'partial_2024_08_02',
    url: 'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-anulacion-viernes-2-de-agosto-2024/',
  },
  {
    id: 'postponed_2025_08_17',
    url: 'https://www.clubhipico.cl/sala-prensa/noticias/club-hipico-de-santiago-anuncia-la-postergacion-de-la-jornada-excepcional-de-carreras-agendada-para-el-17-de-agosto-2025/',
  },
];

function decode(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(value) {
  return decode(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    const body = await response.text();
    return {
      requested_url: url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      bytes: Buffer.byteLength(body),
      body,
    };
  } catch (error) {
    return { requested_url: url, ok: false, error: error instanceof Error ? error.message : String(error), body: '' };
  } finally {
    clearTimeout(timer);
  }
}

function extractNewsCandidates(html) {
  const found = new Map();
  const source = String(html ?? '');
  for (const match of source.matchAll(/href\s*=\s*["']([^"']*\/sala-prensa\/noticias\/[^"']+)["']/gi)) {
    const url = new URL(match[1], CATEGORY_URL).toString();
    const context = decode(source.slice(Math.max(0, (match.index ?? 0) - 1200), (match.index ?? 0) + 600));
    const normalized = fold(context);
    if (!/(suspend|posterg|recalendar|anulacion|anulación)/i.test(normalized)) continue;
    if (!found.has(url)) found.set(url, context.slice(0, 900));
  }
  return [...found.entries()].map(([url, context]) => ({ url, context })).slice(0, 40);
}

function fingerprints(text) {
  const normalized = fold(text);
  return {
    club_hipico: normalized.includes('club hipico de santiago'),
    whole_2024_06_14: normalized.includes('suspension de la jornada') && normalized.includes('14 de junio de 2024'),
    recalendar_2024_06_14: normalized.includes('recalendarizacion') && normalized.includes('14 de junio de 2024') && normalized.includes('15 de septiembre de 2024'),
    partial_after_11th: normalized.includes('a partir de la 11ma carrera') || normalized.includes('desde la 11ma carrera'),
    partial_last_three: normalized.includes('ultimas tres competencias') || normalized.includes('últimas tres competencias'),
    postponed_2025_08_17: normalized.includes('postergacion') && normalized.includes('17 de agosto de 2025'),
  };
}

const category = await fetchText(CATEGORY_URL);
const categoryText = decode(category.body);
const candidates = extractNewsCandidates(category.body);

const articleResults = [];
for (const item of KNOWN) {
  const result = await fetchText(item.url);
  articleResults.push({
    id: item.id,
    requested_url: item.url,
    final_url: result.final_url ?? null,
    status: result.status ?? null,
    ok: result.ok,
    bytes: result.bytes ?? 0,
    error: result.error ?? null,
    fingerprints: fingerprints(result.body),
    text_sample: decode(result.body).slice(0, 2200),
  });
}

const artifact = {
  schema_version: 'chile-clubhipico-non-running-probe-v1',
  generated_at: new Date().toISOString(),
  purpose: 'Verify a stable official Club Hipico de Santiago news discovery route for bounded whole-meeting non-running evidence. Partial-race stoppages must remain negative fixtures.',
  category: {
    url: CATEGORY_URL,
    final_url: category.final_url ?? null,
    status: category.status ?? null,
    ok: category.ok,
    bytes: category.bytes ?? 0,
    error: category.error ?? null,
    fingerprints: fingerprints(category.body),
    candidate_count: candidates.length,
    candidates,
    text_sample: categoryText.slice(0, 3500),
  },
  articles: articleResults,
};

fs.writeFileSync('probe-chile-clubhipico-non-running.json', JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify(artifact, null, 2));

if (!category.ok) throw new Error('Club Hipico corporate news category was not fetchable from GitHub Actions');
for (const id of ['whole_2024_06_14', 'partial_2024_06_21', 'postponed_2025_08_17']) {
  const row = articleResults.find((item) => item.id === id);
  if (!row?.ok) throw new Error('Required Club Hipico evidence page failed: ' + id);
}
if (!artifact.category.fingerprints.whole_2024_06_14) throw new Error('Corporate archive no longer exposes the 2024-06-14 whole-meeting suspension');
if (!artifact.category.fingerprints.postponed_2025_08_17) throw new Error('Corporate archive no longer exposes the 2025-08-17 postponement');
if (!articleResults.find((x) => x.id === 'partial_2024_06_21')?.fingerprints.partial_after_11th) {
  throw new Error('Partial-race negative fixture fingerprint missing');
}
