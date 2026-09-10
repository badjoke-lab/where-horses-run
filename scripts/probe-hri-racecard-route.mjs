const url = 'https://www.hri.ie/Ajax/RaceMeetingByMonth?Month=2026-09-01';

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

function contextRaw(html, needle, before = 2500, after = 9000) {
  const lower = html.toLocaleLowerCase('en-IE');
  const index = lower.indexOf(needle.toLocaleLowerCase('en-IE'));
  return index < 0 ? null : html.slice(Math.max(0, index - before), index + after);
}

const response = await fetch(url, {
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
const body = decode(await response.text());
console.log(JSON.stringify({
  status: response.status,
  bytes: body.length,
  ballinrobe_raw: contextRaw(body, 'Ballinrobe'),
  downpatrick_raw: contextRaw(body, 'Downpatrick', 1500, 5000),
  laytown_raw: contextRaw(body, 'Laytown', 1500, 6000),
}));
