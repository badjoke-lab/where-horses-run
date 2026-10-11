import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const INDEX_URL = 'https://www.txrc.texas.gov/home/racetracks';
const USER_AGENT = 'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)';
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const allowedHosts = new Set(['www.txrc.texas.gov', 'txrc.texas.gov', 'static1.squarespace.com']);

async function readUrl(url, accept) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': USER_AGENT, accept },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`TXRC HTTP ${response.status} at ${url}`);
  if (!allowedHosts.has(new URL(response.url).hostname)) {
    throw new Error(`TXRC unexpected redirect host: ${new URL(response.url).hostname}`);
  }
  return response;
}

function extractOfficialPdfUrl(html) {
  const links = [...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1].replaceAll('&amp;', '&'));
  const candidates = links.filter((link) => /live[-+ _%]*(race|racing)[-+ _%]*dates[-+ _%]*2026/i.test(link) && /\.pdf(?:[?#]|$)/i.test(link));
  if (candidates.length !== 1) {
    throw new Error(`TXRC expected exactly one 2026 live race-date PDF link, got ${candidates.length}`);
  }
  const u = new URL(candidates[0], INDEX_URL);
  if (u.protocol !== 'https:' || !allowedHosts.has(u.hostname)) {
    throw new Error('TXRC PDF link must remain at a reviewed official/hosting origin');
  }
  return u.toString();
}

const page = await readUrl(INDEX_URL, 'text/html');
const html = await page.text();
if (!/Latest Live Race Dates 2026/i.test(html)) {
  throw new Error('TXRC 2026 latest live dates index fingerprint missing');
}
const pdfUrl = extractOfficialPdfUrl(html);
const pdfResponse = await readUrl(pdfUrl, 'application/pdf');
const bytes = new Uint8Array(await pdfResponse.arrayBuffer());
if (bytes.length < 2000 || bytes.length > MAX_PDF_BYTES) {
  throw new Error(`TXRC PDF size outside expected guard: ${bytes.length}`);
}
if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') {
  throw new Error('TXRC linked document is not a PDF');
}
const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
if (pdf.numPages < 1 || pdf.numPages > 20) {
  throw new Error(`TXRC unexpected page count: ${pdf.numPages}`);
}
const texts = [];
for (let i = 1; i <= pdf.numPages; i++) {
  const content = await (await pdf.getPage(i)).getTextContent();
  texts.push(content.items.map((item) => String(item.str ?? '')).join(' '));
}
const allText = texts.join(' ');
if (!/2026/.test(allText) || !/rac(?:e|ing)/i.test(allText)) {
  throw new Error('TXRC PDF 2026 horse-racing text fingerprint missing');
}
// This read-only probe intentionally does NOT create meetings or publish extracted text.
const venueTokens = ['Lone Star Park', 'Sam Houston', 'Retama', 'Gillespie'].filter((name) =>
  allText.toLowerCase().includes(name.toLowerCase()));
console.log(JSON.stringify({
  probe: 'txrc-2026-live-race-dates',
  status: 'source_fingerprint_success',
  index_url: INDEX_URL,
  pdf_url: pdfResponse.url,
  pdf_pages: pdf.numPages,
  pdf_bytes: bytes.length,
  text_characters: allText.length,
  venue_tokens_seen: venueTokens,
  meeting_records_emitted: 0,
  raw_document_retained: false,
  public_calendar_changed: false,
}, null, 2));
