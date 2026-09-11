const url = 'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';
const response = await fetch(url, { headers: { 'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)', accept: 'text/html,application/xhtml+xml' }, redirect: 'follow' });
const html = await response.text();
console.log(JSON.stringify({ type: 'page', status: response.status, final_url: response.url, bytes: html.length }));

const compact = (value) => value.replace(/\s+/g, ' ').trim();
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].map((match, index) => {
  const attrs = match[1];
  const body = match[2];
  const inputs = [...body.matchAll(/<(?:input|button|select|a)\b([^>]*)>/gi)].map((m) => compact(decode(m[1]))).filter((attrsText) => /name=|id=|onclick=|href=|value=/i.test(attrsText));
  return { index, attrs: compact(decode(attrs)), controls: inputs.slice(0, 120) };
});
console.log(JSON.stringify({ type: 'forms', forms }));

const interesting = [];
for (const needle of ['Meknes', '10/09/2026', 'El jadida', '12/09/2026', 'Télecharger', 'Telecharger', 'javax.faces.ViewState', 'PrimeFaces', 'mojarra.jsfcljs']) {
  let from = 0;
  let count = 0;
  while (count < 12) {
    const index = html.toLowerCase().indexOf(needle.toLowerCase(), from);
    if (index < 0) break;
    interesting.push({ needle, index, snippet: compact(decode(html.slice(Math.max(0, index - 800), Math.min(html.length, index + 1800)))) });
    from = index + needle.length;
    count += 1;
  }
}
console.log(JSON.stringify({ type: 'interesting', items: interesting }));

const scripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map((m) => new URL(decode(m[1]), response.url).href);
console.log(JSON.stringify({ type: 'scripts', scripts }));

const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ attrs: compact(decode(m[1])), text: compact(m[2].replace(/<[^>]+>/g, ' ')) })).filter((row) => /download|telecharger|t[eé]lecharger|programme|document/i.test(`${row.attrs} ${row.text}`));
console.log(JSON.stringify({ type: 'links', links: links.slice(0, 100) }));
