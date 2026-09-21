import { parseJraConfirmedNonRunningHtml } from './jra-non-running-evidence.mjs';

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
  accept: 'text/html,*/*;q=.5',
  'accept-language': 'ja,en;q=.7',
};

const plain = (value) => String(value ?? '')
  .normalize('NFKC')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();

function indexUrl() {
  return 'https://www.jra.go.jp/news/index4.html';
}
function candidateArticleLinks(html, baseUrl) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = plain(match[2]);
    if (!/競馬/.test(label)) continue;
    if (!/(開催.{0,10}中止|中止.{0,10}競馬|取消・変更等|代替競馬)/.test(label)) continue;
    let url;
    try { url = new URL(match[1], baseUrl); } catch { continue; }
    if (url.protocol !== 'https:' || url.hostname !== 'www.jra.go.jp') continue;
    if (!/^\/news\/20\d{4}\/\d{6}\.html$/.test(url.pathname)) continue;
    out.push({ url: url.toString(), label });
  }
  return [...new Map(out.map((row) => [row.url, row])).values()];
}
async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url, { redirect: 'follow', headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.jra.go.jp') {
    throw new Error(`unexpected JRA News redirect: ${finalUrl.toString()}`);
  }
  return { body: await response.text(), url: finalUrl.toString() };
}

export async function discoverJraConfirmedNonRunning({
  dates,
  fetchImpl = fetch,
  checkedAt = new Date().toISOString(),
}) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('JRA non-running discovery requires dates');
  const allowed = new Set(dates);
  const records = [];
  const diagnostics = [];
  const source = indexUrl();
  try {
    const page = await fetchHtml(source, fetchImpl);
    const links = candidateArticleLinks(page.body, page.url);
    let fetched = 0;
    let parsed = 0;
    for (const link of links) {
      try {
        const article = await fetchHtml(link.url, fetchImpl);
        fetched += 1;
        const found = parseJraConfirmedNonRunningHtml(article.body, {
          sourceUrl: article.url,
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
      source_url: page.url,
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
  return {
    records: [...new Map(records.map((row) => [row.meeting_id, row])).values()]
      .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id)),
    diagnostics,
  };
}
