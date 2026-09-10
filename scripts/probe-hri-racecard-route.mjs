const urls = [
  'https://www.hri.ie/racecards',
  'https://www.hri.ie/racecards?date=2026-09-11',
  'https://www.hri.ie/racecards?Date=2026-09-11',
  'https://www.hri.ie/racecards?meetingDate=2026-09-11',
  'https://www.hri.ie/fixture-list',
];

function decode(value) {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function text(html) {
  return decode(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function links(html, base) {
  const out = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try { href = new URL(decode(match[2]), base).href; } catch { continue; }
    if (!/hri\.ie\/(?:racecards\/details|entries\/Microsoft_Word__)/i.test(href)) continue;
    out.push({ href, label: text(match[3]).slice(0, 160) });
  }
  return [...new Map(out.map((row) => [row.href, row])).values()];
}

for (const url of urls) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-IE,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.text();
    const visible = text(body);
    const needle = visible.toLowerCase().indexOf('ballinrobe');
    console.log(JSON.stringify({
      requested_url: url,
      final_url: response.url,
      status: response.status,
      content_type: response.headers.get('content-type'),
      bytes: body.length,
      racecard_or_entry_links: links(body, response.url).slice(0, 80),
      ballinrobe_context: needle >= 0 ? visible.slice(Math.max(0, needle - 500), needle + 1500) : null,
    }));
  } catch (error) {
    console.log(JSON.stringify({ requested_url: url, error: String(error?.message ?? error) }));
  }
}
