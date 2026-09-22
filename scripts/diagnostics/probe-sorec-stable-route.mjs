const TARGETS = [
  'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?code=CALEN&description=Calendrier+courses&fctID=1406',
  'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?fctID=1406',
  'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?fctID=2nQEdyraO%2Bg%3D',
];

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    const html = await response.text();
    return {
      requested_url: url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      bytes: Buffer.byteLength(html),
      fingerprints: {
        legend: /id=(["'])legende-report\1[^>]*>\s*R[ée]union\s+report[ée]e/i.test(html),
        jours_evenement: /\bjoursEvenement\s*=\s*(?=\[)/i.test(html),
        key_semantics: /d\s*\+\s*["']{2}\s*\+\s*\(m\s*\+\s*10\)\s*\+\s*["']{2}\s*\+\s*y/i.test(html),
      },
    };
  } catch (error) {
    return { requested_url: url, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const url of TARGETS) results.push(await probe(url));
console.log(JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2));

const stable = results.filter((row) => row.ok && row.fingerprints?.legend && row.fingerprints?.jours_evenement && row.fingerprints?.key_semantics);
if (!stable.length) throw new Error('No stable SOREC status-bearing calendar candidate succeeded');
