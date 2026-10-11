// Read-only source discovery for New Jersey's 2026 official race-date routes.
// This probe never publishes or invents a meeting date.
const INDEX_URL = 'https://www.njoag.gov/about/divisions-and-offices/nj-racing-commission-home/race-dates/';
const UA = 'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)';
const controller = AbortSignal.timeout(40000);
const response = await fetch(INDEX_URL, {
  redirect: 'follow',
  signal: controller,
  headers: { 'user-agent': UA, accept: 'text/html' },
});
if (!response.ok) throw new Error('NJRC race-date index HTTP ' + response.status);
const host = new URL(response.url).hostname;
if (host !== 'njoag.gov' && host !== 'www.njoag.gov') {
  throw new Error('Unexpected NJRC index redirect host: ' + host);
}
const html = await response.text();
if (html.length < 500 || html.length > 2_000_000) {
  throw new Error('NJRC HTML body size out of bounds');
}
const decode = s => String(s)
  .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
  .replace(/&#39;|&#x27;/gi, "'")
  .replace(/&nbsp;/gi, ' ');
const strip = s => decode(String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const allLinks = [...html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)]
  .map(m => ({
    index: m.index,
    url: decode(m[2]),
    label: strip(m[3]),
  }))
  .filter(x => x.url && x.label);
const yearStart = html.search(/(?:<strong\b[^>]*>|<h[1-6]\b[^>]*>|<p\b[^>]*>)\s*2026\s*</i);
const yearNext = yearStart < 0 ? -1 : html.slice(yearStart + 4).search(/(?:<strong\b[^>]*>|<h[1-6]\b[^>]*>|<p\b[^>]*>)\s*2025\s*</i);
const regionEnd = yearStart < 0 ? -1 : yearNext >= 0 ? yearStart + 4 + yearNext : Math.min(yearStart + 8000, html.length);
const regionLinks = yearStart < 0 ? [] : allLinks.filter(x =>
  x.index >= yearStart && x.index < regionEnd &&
  /(Meadowlands|Monmouth|Freehold|2026)/i.test(x.label + ' ' + x.url));
const candidates = [];
for (const link of regionLinks) {
  let target;
  try { target = new URL(link.url, INDEX_URL); } catch { continue; }
  if (target.protocol !== 'https:') continue;
  if (!/(^|\.)nj\.gov$|(^|\.)njoag\.gov$/i.test(target.hostname)) continue;
  candidates.push({ venue_label: link.label, official_document_url: target.toString() });
}
// Deliberately separate reachability from 2026 schedule evidence.
const status = candidates.length > 0
  ? '2026_official_document_links_found'
  : yearStart >= 0 ? '2026_section_found_no_valid_document_links' : '2026_section_not_found';
console.log(JSON.stringify({
  probe: 'us-new-jersey-2026-state-race-dates',
  status,
  official_index_url: INDEX_URL,
  final_host: host,
  html_bytes: Buffer.byteLength(html),
  indexed_anchor_count: allLinks.length,
  candidates,
  current_year_meetings_extracted: 0,
  production_calendar_ready: false,
  raw_body_retained: false,
  public_calendar_changed: false,
}, null, 2));
// A successful probe can prove source access or linked files, never production date readiness.
