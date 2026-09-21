import { parseBaneiConfirmedNonRunningHtml } from './banei-non-running-evidence.mjs';

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

function shiftDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function monthKey(date) { return String(date).slice(0, 7); }
function candidateMonths(dates) {
  return [...new Set([shiftDays(dates[0], -14), ...dates].map(monthKey))].sort();
}
function monthEpoch(month) {
  return Math.floor(Date.parse(`${month}-01T00:00:00+09:00`) / 1000);
}
function archiveUrl(month, page = 0) {
  return `https://www.banei-keiba.or.jp/tp_list.php?no=${page}&wt=mon&wv=${monthEpoch(month)}`;
}
function assertOfficial(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['www.banei-keiba.or.jp', 'banei-keiba.or.jp'].includes(parsed.hostname)) {
    throw new Error(`unexpected Banei redirect: ${parsed.toString()}`);
  }
  return parsed;
}
async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url, { redirect: 'follow', headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = assertOfficial(response.url || url);
  return { body: await response.text(), url: finalUrl.toString() };
}
function articleLinks(html, baseUrl) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = plain(match[2]);
    if (!/(中止|取り止め|取止め)/.test(label)) continue;
    if (!/(開催|ばんえい|競馬|競走)/.test(label)) continue;
    let url;
    try { url = new URL(match[1], baseUrl); } catch { continue; }
    if (!['www.banei-keiba.or.jp', 'banei-keiba.or.jp'].includes(url.hostname)) continue;
    if (url.pathname !== '/tp_detail.php' || !/^\d+$/.test(url.searchParams.get('id') ?? '')) continue;
    out.push({ url: url.toString(), label });
  }
  return [...new Map(out.map((row) => [row.url, row])).values()];
}
function paginationPages(html, baseUrl, epoch) {
  const pages = new Set([0]);
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let url;
    try { url = new URL(match[1], baseUrl); } catch { continue; }
    if (!['www.banei-keiba.or.jp', 'banei-keiba.or.jp'].includes(url.hostname) || url.pathname !== '/tp_list.php') continue;
    if (url.searchParams.get('wt') !== 'mon' || url.searchParams.get('wv') !== String(epoch)) continue;
    const page = Number(url.searchParams.get('no') ?? '0');
    if (Number.isInteger(page) && page >= 0 && page <= 10) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export async function discoverBaneiConfirmedNonRunning({
  dates,
  fetchImpl = fetch,
  checkedAt = new Date().toISOString(),
}) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Banei non-running discovery requires dates');
  const allowed = new Set(dates);
  const records = [];
  const diagnostics = [];
  for (const month of candidateMonths(dates)) {
    const epoch = monthEpoch(month);
    let first;
    try {
      first = await fetchHtml(archiveUrl(month, 0), fetchImpl);
    } catch (error) {
      diagnostics.push({ source_url: archiveUrl(month, 0), status: 'archive_fetch_failed', error: String(error?.message ?? error) });
      continue;
    }
    const pages = paginationPages(first.body, first.url, epoch);
    let candidateCount = 0;
    let fetchedCount = 0;
    let parsedCount = 0;
    const seenArticles = new Set();
    for (const page of pages) {
      let archive = first;
      if (page !== 0) {
        try {
          archive = await fetchHtml(archiveUrl(month, page), fetchImpl);
        } catch (error) {
          diagnostics.push({ source_url: archiveUrl(month, page), status: 'archive_page_fetch_failed', error: String(error?.message ?? error) });
          continue;
        }
      }
      for (const link of articleLinks(archive.body, archive.url)) {
        if (seenArticles.has(link.url)) continue;
        seenArticles.add(link.url);
        candidateCount += 1;
        try {
          const article = await fetchHtml(link.url, fetchImpl);
          fetchedCount += 1;
          const found = parseBaneiConfirmedNonRunningHtml(article.body, {
            sourceUrl: article.url,
            checkedAt,
          }).filter((row) => allowed.has(row.date));
          parsedCount += found.length;
          records.push(...found);
        } catch (error) {
          diagnostics.push({ source_url: link.url, status: 'article_fetch_or_parse_failed', error: String(error?.message ?? error) });
        }
      }
    }
    diagnostics.push({
      source_url: first.url,
      status: 'success',
      archive_page_count: pages.length,
      candidate_link_count: candidateCount,
      fetched_article_count: fetchedCount,
      confirmed_non_running_count: parsedCount,
    });
  }
  return {
    records: [...new Map(records.map((row) => [row.meeting_id, row])).values()].sort((a, b) => a.date.localeCompare(b.date)),
    diagnostics,
  };
}
