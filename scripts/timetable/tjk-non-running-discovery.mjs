import { parseTjkConfirmedNonRunningHtml } from './tjk-non-running-evidence.mjs';

export const TJK_NEWS_QUERY_URL = 'https://www.tjk.org/TR/YarisSever/Query/Page/Haberler';

const HEADERS = {
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'tr-TR,tr;q=0.9,en;q=0.6',
  'user-agent': 'WhereHorsesRun-source-verification/1.0',
};

const DOMESTIC_VENUES = [
  'Adana', 'İzmir', 'İstanbul', 'Istanbul', 'Bursa', 'Ankara',
  'Şanlıurfa', 'Sanliurfa', 'Elazığ', 'Elazig',
  'Diyarbakır', 'Diyarbakir', 'Kocaeli',
];

function dateForQuery(iso) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function shiftDays(iso, days) {
  const value = new Date(`${iso}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function plain(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function buildQueryUrl(startDate, endDateInclusive, subject) {
  const url = new URL(TJK_NEWS_QUERY_URL);
  url.searchParams.set('QueryParameter_InTurkish', '1');
  url.searchParams.set('QueryParameter_IsYarisSever', '1');
  url.searchParams.set('QueryParameter_Tarih_Start', dateForQuery(startDate));
  url.searchParams.set('QueryParameter_Tarih_End', dateForQuery(endDateInclusive));
  url.searchParams.set('QueryParameter_Konu', subject);
  return url.href;
}

function domesticCancellationTitle(label) {
  if (!DOMESTIC_VENUES.some((venue) => label.includes(venue))) return false;
  if (!/yarışları/i.test(label)) return false;
  return /(ertelendi|iptal edildi|iptal edilmiştir)/i.test(label.toLocaleLowerCase('tr-TR'));
}

function candidateLinks(html, baseUrl) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = plain(match[2]);
    if (!domesticCancellationTitle(label)) continue;
    let url;
    try { url = new URL(match[1], baseUrl); } catch { continue; }
    if (url.protocol !== 'https:' || url.hostname !== 'www.tjk.org') continue;
    const id = url.pathname.match(/^\/TR\/(?:YarisSever|Yar|Kurumsal|map)\/News\/(?:Page|Data)\/(\d+)$/i)?.[1];
    if (!id) continue;
    const dataUrl = new URL(url.href);
    dataUrl.pathname = dataUrl.pathname.replace(/\/News\/(?:Page|Data)\/\d+$/i, `/News/Data/${id}`);
    out.push({ label, page_url: url.href, data_url: dataUrl.href });
  }
  return [...new Map(out.map((row) => [row.data_url, row])).values()];
}

async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow',
    headers: HEADERS,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.tjk.org') {
    throw new Error(`unexpected TJK redirect: ${finalUrl.toString()}`);
  }
  return { body: await response.text(), url: finalUrl.toString() };
}

export async function discoverTjkConfirmedNonRunning({
  meetingDates,
  fetchImpl = fetch,
  checkedAt = new Date().toISOString(),
  newsStartDate = null,
  newsEndDateInclusive = null,
  subjects = ['ertelendi', 'iptal', 'tehir'],
} = {}) {
  if (!Array.isArray(meetingDates) || meetingDates.length === 0) {
    throw new Error('TJK non-running discovery requires meetingDates');
  }
  const sortedDates = [...new Set(meetingDates)].sort();
  const allowed = new Set(sortedDates);
  const queryStart = newsStartDate ?? shiftDays(sortedDates[0], -62);
  const queryEnd = newsEndDateInclusive ?? sortedDates[0];
  const records = [];
  const diagnostics = [];
  const seenArticles = new Set();

  for (const subject of subjects) {
    const queryUrl = buildQueryUrl(queryStart, queryEnd, subject);
    try {
      const page = await fetchHtml(queryUrl, fetchImpl);
      const links = candidateLinks(page.body, page.url);
      let fetched = 0;
      let parsed = 0;
      for (const link of links) {
        if (seenArticles.has(link.data_url)) continue;
        seenArticles.add(link.data_url);
        try {
          const article = await fetchHtml(link.data_url, fetchImpl);
          fetched += 1;
          const found = parseTjkConfirmedNonRunningHtml(article.body, {
            sourceUrl: article.url,
            checkedAt,
          }).filter((row) => allowed.has(row.date));
          parsed += found.length;
          records.push(...found);
        } catch (error) {
          diagnostics.push({
            source_url: link.data_url,
            status: 'article_fetch_or_parse_failed',
            error: String(error?.message ?? error),
          });
        }
      }
      diagnostics.push({
        source_url: page.url,
        status: 'success',
        subject,
        candidate_link_count: links.length,
        fetched_article_count: fetched,
        confirmed_non_running_count: parsed,
      });
    } catch (error) {
      diagnostics.push({
        source_url: queryUrl,
        status: 'query_fetch_failed',
        subject,
        error: String(error?.message ?? error),
      });
    }
  }

  return {
    records: [...new Map(records.map((row) => [row.meeting_id, row])).values()]
      .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id)),
    diagnostics,
    query_window: { start_date: queryStart, end_date_inclusive: queryEnd },
  };
}
