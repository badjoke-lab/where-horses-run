const PAGE = 'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';
const UA = 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function attr(tag, name) {
  return decode(tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '');
}
function cookiesFrom(headers) {
  const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
  return values.map((value) => value.split(';', 1)[0]).join('; ');
}
async function getPage() {
  const res = await fetch(PAGE, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, redirect: 'follow' });
  const html = await res.text();
  if (!res.ok) throw new Error(`GET ${res.status}`);
  return { res, html, cookies: cookiesFrom(res.headers) };
}
function parseMainForm(html) {
  const match = html.match(/<form\b([^>]*\bid=["']form["'][^>]*)>([\s\S]*?)<\/form>/i);
  if (!match) throw new Error('main form missing');
  const action = attr(match[1], 'action');
  const body = match[2];
  const hidden = {};
  for (const m of body.matchAll(/<input\b([^>]*)>/gi)) {
    const tag = m[1];
    if (attr(tag, 'type').toLowerCase() !== 'hidden') continue;
    const name = attr(tag, 'name');
    if (name) hidden[name] = attr(tag, 'value');
  }
  const rows = [...body.matchAll(/<tr\b[^>]*data-ri=["'](\d+)["'][^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => {
    const cells = [...m[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
    const button = m[2].match(/<button\b([^>]*\bclass=["'][^"']*btnDownload[^"']*["'][^>]*)>/i);
    return { row_index: Number(m[1]), date: cells[0] ?? '', venue: cells[1] ?? '', description: cells[2] ?? '', button_name: button ? attr(button[1], 'name') : null };
  });
  return { action: new URL(action, PAGE).href, hidden, rows };
}

const first = await getPage();
const parsed = parseMainForm(first.html);
console.log(JSON.stringify({ type: 'page', status: first.res.status, final_url: first.res.url, bytes: first.html.length, action: parsed.action, cookie_names: first.cookies.split('; ').map((v) => v.split('=')[0]), rows: parsed.rows.slice(0, 10), hidden_names: Object.keys(parsed.hidden) }));

async function downloadMeeting({ date, venue }) {
  const page = await getPage();
  const form = parseMainForm(page.html);
  const row = form.rows.find((item) => item.date === date && item.venue.toLowerCase() === venue.toLowerCase());
  if (!row?.button_name) throw new Error(`download button missing for ${date} ${venue}`);
  const params = new URLSearchParams();
  params.set('form', 'form');
  params.set('form:j_idt41', '');
  params.set('form:j_idt45_input', '');
  params.set('form:j_idt49_input', '');
  for (const [name, value] of Object.entries(form.hidden)) {
    if (name !== 'form') params.set(name, value);
  }
  params.set(row.button_name, '');
  const res = await fetch(form.action, {
    method: 'POST',
    headers: {
      'user-agent': UA,
      accept: 'application/pdf,application/octet-stream,*/*',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: page.cookies,
      origin: new URL(PAGE).origin,
      referer: page.res.url,
    },
    body: params,
    redirect: 'manual',
  });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const prefix = Buffer.from(bytes.slice(0, 24)).toString('latin1');
  console.log(JSON.stringify({ type: 'download', date, venue, button_name: row.button_name, status: res.status, location: res.headers.get('location'), content_type: res.headers.get('content-type'), content_disposition: res.headers.get('content-disposition'), bytes: bytes.length, prefix }));
}

await downloadMeeting({ date: '10/09/2026', venue: 'Meknes' });
await downloadMeeting({ date: '12/09/2026', venue: 'El jadida' });
