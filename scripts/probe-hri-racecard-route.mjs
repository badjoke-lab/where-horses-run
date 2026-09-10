const endpoints = [
  'https://www.hri.ie/Ajax/Top7FixtureDate',
  'https://www.hri.ie/Ajax/RaceMeetingByMonth?Month=2026-09-01',
];

function decode(value) {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function text(html) {
  return decode(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function anchors(html, base) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try { href = new URL(decode(match[2]), base).href; } catch { continue; }
    out.push({ href, label: text(match[3]).slice(0, 240) });
  }
  return [...new Map(out.map((row) => [row.href, row])).values()];
}

function contextAround(html, needle) {
  const visible = text(html);
  const index = visible.toLocaleLowerCase('en-IE').indexOf(needle.toLocaleLowerCase('en-IE'));
  return index < 0 ? null : visible.slice(Math.max(0, index - 1000), index + 3500);
}

async function get(url) {
  return fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html,application/xhtml+xml,*/*',
      'accept-language': 'en-IE,en;q=0.9',
      'x-requested-with': 'XMLHttpRequest',
      referer: 'https://www.hri.ie/racecards',
    },
    signal: AbortSignal.timeout(20000),
  });
}

const detailUrls = new Set();
for (const url of endpoints) {
  try {
    const response = await get(url);
    const body = await response.text();
    const allAnchors = anchors(body, response.url);
    const relevant = allAnchors.filter((row) => /racecards|meeting|race=/i.test(row.href));
    for (const row of relevant) {
      if (/\/racecards\/details/i.test(row.href)) detailUrls.add(row.href);
    }
    console.log(JSON.stringify({
      type: 'ajax',
      requested_url: url,
      final_url: response.url,
      status: response.status,
      content_type: response.headers.get('content-type'),
      bytes: body.length,
      anchors: allAnchors.slice(0, 150),
      relevant_anchors: relevant.slice(0, 150),
      ballinrobe_context: contextAround(body, 'Ballinrobe'),
      laytown_context: contextAround(body, 'Laytown'),
    }));
  } catch (error) {
    console.log(JSON.stringify({ type: 'ajax_error', requested_url: url, error: String(error?.message ?? error) }));
  }
}

for (const url of [...detailUrls].slice(0, 8)) {
  try {
    const response = await get(url);
    const body = await response.text();
    console.log(JSON.stringify({
      type: 'detail',
      requested_url: url,
      final_url: response.url,
      status: response.status,
      bytes: body.length,
      anchors: anchors(body, response.url).filter((row) => /racecards|race=|meeting=/i.test(row.href)).slice(0, 120),
      visible_head: text(body).slice(0, 7000),
    }));
  } catch (error) {
    console.log(JSON.stringify({ type: 'detail_error', requested_url: url, error: String(error?.message ?? error) }));
  }
}
