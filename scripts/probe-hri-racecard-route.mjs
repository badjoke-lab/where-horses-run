const urls = [
  'https://www.hri.ie/racecards',
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

function extractScripts(html, base) {
  const scripts = [];
  for (const match of String(html).matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi)) {
    try { scripts.push(new URL(decode(match[2]), base).href); } catch {}
  }
  return [...new Set(scripts)];
}

function inlineRelevant(html) {
  const out = [];
  for (const match of String(html).matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = decode(match[1]);
    if (!/(racecard|meeting|fixture|ajax|api|fetch\s*\()/i.test(body)) continue;
    out.push(body.replace(/\s+/g, ' ').slice(0, 4000));
  }
  return out;
}

function relevantSnippets(source) {
  const flat = String(source).replace(/\s+/g, ' ');
  const needles = [/racecards?/ig, /meeting/ig, /fixture/ig, /\/api\//ig, /ajax/ig];
  const snippets = [];
  for (const pattern of needles) {
    for (const match of flat.matchAll(pattern)) {
      const start = Math.max(0, match.index - 220);
      const end = Math.min(flat.length, match.index + 500);
      snippets.push(flat.slice(start, end));
      if (snippets.length >= 30) return [...new Set(snippets)];
    }
  }
  return [...new Set(snippets)];
}

async function fetchPage(url) {
  return fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html,application/xhtml+xml,*/*',
      'accept-language': 'en-IE,en;q=0.9',
    },
    signal: AbortSignal.timeout(20000),
  });
}

for (const url of urls) {
  try {
    const response = await fetchPage(url);
    const body = await response.text();
    const scriptUrls = extractScripts(body, response.url);
    console.log(JSON.stringify({
      type: 'page',
      requested_url: url,
      final_url: response.url,
      status: response.status,
      bytes: body.length,
      scripts: scriptUrls,
      inline_relevant: inlineRelevant(body),
      html_relevant: relevantSnippets(body).slice(0, 20),
    }));
    if (!url.endsWith('/racecards')) continue;
    for (const scriptUrl of scriptUrls) {
      if (!scriptUrl.startsWith('https://www.hri.ie/')) continue;
      try {
        const jsResponse = await fetchPage(scriptUrl);
        const js = await jsResponse.text();
        const snippets = relevantSnippets(js);
        if (!snippets.length) continue;
        console.log(JSON.stringify({
          type: 'script',
          url: scriptUrl,
          status: jsResponse.status,
          bytes: js.length,
          snippets,
        }));
      } catch (error) {
        console.log(JSON.stringify({ type: 'script_error', url: scriptUrl, error: String(error?.message ?? error) }));
      }
    }
  } catch (error) {
    console.log(JSON.stringify({ type: 'page_error', requested_url: url, error: String(error?.message ?? error) }));
  }
}
