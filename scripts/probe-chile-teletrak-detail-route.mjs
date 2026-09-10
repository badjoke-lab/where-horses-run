import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const TELETRAK = 'https://teletrak.cl/';

function decode(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}
function text(html) { return decode(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function anchors(html, base) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try { href = new URL(decode(match[2]), base).href; } catch { continue; }
    out.push({ href, label: text(match[3]).slice(0, 180), index: match.index });
  }
  return out;
}
async function pdfText(bytes) {
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const lines = [];
  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 12); pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const value = item.str.replace(/\s+/g, ' ').trim();
      if (value) line += `${line ? ' ' : ''}${value}`;
      if (item.hasEOL && line) { lines.push(line); line = ''; }
    }
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

const page = await fetch(TELETRAK, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)', accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(20000) });
const html = await page.text();
const visible = text(html);
const links = anchors(html, page.url);
console.log(JSON.stringify({ type: 'homepage', status: page.status, final_url: page.url, bytes: html.length, visible: visible.slice(0, 10000), programme_links: links.filter((row) => /program|volante|pdf|clubhipico|elturf|hipodromo/i.test(`${row.label} ${row.href}`)).map((row) => ({ ...row, context: text(html.slice(Math.max(0, row.index - 900), row.index + 1000)) })) }));

const candidates = [...new Map(links.filter((row) => /descargar programa/i.test(row.label) || /\.(?:pdf)(?:\?|$)/i.test(row.href)).map((row) => [row.href, row])).values()];
for (const candidate of candidates) {
  try {
    const response = await fetch(candidate.href, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)', accept: 'application/pdf,text/html,*/*;q=0.8' }, signal: AbortSignal.timeout(20000) });
    const contentType = response.headers.get('content-type') ?? '';
    if (/pdf/i.test(contentType) || /\.pdf(?:\?|$)/i.test(response.url)) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      const extracted = await pdfText(bytes);
      console.log(JSON.stringify({ type: 'programme_pdf', requested_url: candidate.href, final_url: response.url, status: response.status, content_type: contentType, bytes: bytes.length, text: extracted.slice(0, 16000), clock_tokens: [...new Set(extracted.match(/\b(?:[01]?\d|2[0-3])[:.]\d{2}\b/g) ?? [])].slice(0, 120) }));
    } else {
      const body = await response.text();
      console.log(JSON.stringify({ type: 'programme_html', requested_url: candidate.href, final_url: response.url, status: response.status, content_type: contentType, bytes: body.length, visible: text(body).slice(0, 16000), links: anchors(body, response.url).filter((row) => /program|pdf|carrera|reunion/i.test(`${row.label} ${row.href}`)).slice(0, 80) }));
    }
  } catch (error) {
    console.log(JSON.stringify({ type: 'programme_error', requested_url: candidate.href, error: String(error?.message ?? error) }));
  }
}
