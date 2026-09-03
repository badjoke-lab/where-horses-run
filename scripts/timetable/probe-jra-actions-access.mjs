const targets = [
  'https://www.jra.go.jp/keiba/calendar/',
  'https://www.jra.go.jp/keiba/calendar/sep.html',
  'https://www.jra.go.jp/keiba/calendar2026/2026/9/0905.html',
  'https://www.jra.go.jp/keiba/calendar2026/2026/9/0903.html',
];

export async function probeJraActionsAccess() {
  const results = [];
  for (const url of targets) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
          accept: 'text/html',
          'accept-language': 'ja,en;q=.7',
        },
      });
      const body = await response.text();
      results.push({
        url,
        status: response.status,
        ok: response.ok,
        final_url: response.url,
        bytes: Buffer.byteLength(body),
        has_programme: /競馬番組/.test(body),
        has_0905: /0905\.html/.test(body),
        has_calendar2026: /calendar2026/.test(body),
      });
    } catch (error) {
      results.push({ url, error: String(error?.message ?? error) });
    }
  }
  console.log(`JRA_ACTIONS_ACCESS_PROBE ${JSON.stringify(results)}`);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) await probeJraActionsAccess();
