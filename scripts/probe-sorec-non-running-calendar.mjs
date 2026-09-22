const URL = 'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?fctID=2nQEdyraO%2Bg%3D';

function visible(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&agrave;/gi, 'à')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function snippets(raw, needle) {
  const lower = raw.toLocaleLowerCase('fr-FR');
  const target = needle.toLocaleLowerCase('fr-FR');
  const out = [];
  let from = 0;
  while (out.length < 12) {
    const index = lower.indexOf(target, from);
    if (index < 0) break;
    out.push(raw.slice(Math.max(0, index - 500), Math.min(raw.length, index + target.length + 900)));
    from = index + target.length;
  }
  return out;
}

try {
  const response = await fetch(URL, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'fr-MA,fr;q=0.9,en;q=0.5',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  const text = visible(body);
  const reportRows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => ({ raw: match[0], text: visible(match[0]) }))
    .filter((row) => /report/i.test(row.text) || /report/i.test(row.raw))
    .slice(0, 20);
  console.log(JSON.stringify({
    source_url: URL,
    final_url: response.url,
    http_status: response.status,
    content_type: response.headers.get('content-type'),
    body_bytes: body.length,
    has_reunion_reportee: /Réunion\s+reportée/i.test(text),
    visible_report_contexts: snippets(text, 'report').map((value) => visible(value)),
    raw_report_contexts: snippets(body, 'report').map((value) => value.replace(/\s+/g, ' ').slice(0, 1400)),
    report_rows: reportRows.map((row) => ({ text: row.text, raw: row.raw.replace(/\s+/g, ' ').slice(0, 1800) })),
  }, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    source_url: URL,
    status: 'probe_failed',
    error: String(error?.message ?? error),
  }, null, 2));
}
