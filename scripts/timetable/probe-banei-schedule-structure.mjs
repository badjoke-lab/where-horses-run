const url = 'https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=1788188400';
const response = await fetch(url, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
    accept: 'text/html',
    'accept-language': 'ja,en;q=.7',
  },
});
const html = await response.text();
const plain = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();
const rows = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match, index) => ({
  index,
  cells: [...match[0].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((cell) => plain(cell[1])),
  text: plain(match[0]),
}));
console.log(`BANEI_PROBE_STATUS ${response.status} bytes=${Buffer.byteLength(html)} rows=${rows.length}`);
console.log(`BANEI_PROBE_ROWS ${JSON.stringify(rows.filter((row) => /(?:2026年9月|日付|ばんえい開催|帯広競馬場)/.test(row.text)).slice(0, 30))}`);
console.log(`BANEI_PROBE_HREFS ${JSON.stringify([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]).filter((href) => /race_schedule|race_info|k_raceDate/i.test(href)).slice(0, 50))}`);
