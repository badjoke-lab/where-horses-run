import { parseNarConfirmedNonRunningHtml } from './nar-non-running-evidence.mjs';

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
  accept: 'text/html,*/*;q=.5',
  'accept-language': 'ja,en;q=.7',
};

const VENUES = [
  '門別','盛岡','水沢','浦和','船橋','大井','川崎','金沢','笠松','名古屋','園田','姫路','高知','佐賀',
];

const plain = (value) => String(value ?? '')
  .normalize('NFKC')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();

function decodeHtml(bytes) {
  return ['utf-8', 'shift_jis']
    .map((encoding) => {
      try {
        const body = new TextDecoder(encoding).decode(bytes);
        const score = body.match(/[地方競馬開催中止取止取り止め]/g)?.length ?? 0;
        return { body, score };
      } catch {
        return { body: '', score: -1 };
      }
    })
    .sort((a, b) => b.score - a.score)[0].body;
}

function shiftDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function candidateYears(dates) {
  return [...new Set([shiftDays(dates[0], -14), ...dates].map((date) => date.slice(0, 4)))].sort();
}

function indexUrl(year) {
  return `https://www.keiba.go.jp/jranet/topics/${year}/index.html`;
}

function candidateArticleLinks(html, baseUrl) {
  const out = [];
  const venuePattern = new RegExp(`^(${VENUES.join('|')})競馬の開催(?:取り止め|中止)`);
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = plain(match[2]);
    if (!venuePattern.test(label)) continue;
    if (/第\d+(?:競走|R)|競走(?:の)?取り止め/.test(label)) continue;

    let url;
    try { url = new URL(match[1], baseUrl); } catch { continue; }
    if (url.protocol !== 'https:' || url.hostname !== 'www.keiba.go.jp') continue;
    if (!/^\/jranet\/topics\/20\d{2}\/n\d+\.html$/.test(url.pathname)) continue;
    out.push({ url: url.toString(), label });
  }
  return [...new Map(out.map((row) => [row.url, row])).values()];
}

async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url, { redirect: 'follow', headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.keiba.go.jp') {
    throw new Error(`unexpected NAR JRA-net redirect: ${finalUrl.toString()}`);
  }
  return { body: decodeHtml(await response.arrayBuffer()), url: finalUrl.toString() };
}

export async function discoverNarConfirmedNonRunning({
  dates,
  fetchImpl = fetch,
  checkedAt = new Date().toISOString(),
}) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('NAR non-running discovery requires dates');

  const allowed = new Set(dates);
  const records = [];
  const diagnostics = [];

  for (const year of candidateYears(dates)) {
    const source = indexUrl(year);
    try {
      const index = await fetchHtml(source, fetchImpl);
      const links = candidateArticleLinks(index.body, index.url);
      let fetched = 0;
      let parsed = 0;

      for (const link of links) {
        try {
          const article = await fetchHtml(link.url, fetchImpl);
          fetched += 1;
          const found = parseNarConfirmedNonRunningHtml(article.body, {
            sourceUrl: article.url,
            allowedDates: dates,
            checkedAt,
          }).filter((row) => allowed.has(row.date));
          parsed += found.length;
          records.push(...found);
        } catch (error) {
          diagnostics.push({
            source_url: link.url,
            status: 'article_fetch_or_parse_failed',
            error: String(error?.message ?? error),
          });
        }
      }

      diagnostics.push({
        source_url: index.url,
        status: 'success',
        candidate_link_count: links.length,
        fetched_article_count: fetched,
        confirmed_non_running_count: parsed,
      });
    } catch (error) {
      diagnostics.push({
        source_url: source,
        status: 'index_fetch_failed',
        error: String(error?.message ?? error),
      });
    }
  }

  return {
    records: [...new Map(records.map((row) => [row.meeting_id, row])).values()]
      .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id)),
    diagnostics,
  };
}
