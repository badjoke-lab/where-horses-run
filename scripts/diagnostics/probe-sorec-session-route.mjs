const PROGRAMME_URL =
  'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';

function decodeHtmlUrl(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/gi, '&');
}

function calendarHref(html) {
  for (const match of String(html).matchAll(/href=["']([^"']*calendrier_course\.jsf[^"']*)["']/gi)) {
    const href = decodeHtmlUrl(match[1]);
    let url;
    try {
      url = new URL(href, PROGRAMME_URL);
    } catch {
      continue;
    }
    if (url.hostname !== 'www.sorec-galop.ma') continue;
    if (url.pathname.split(';')[0] !== '/pages/course_a_venir/calendrier_course.jsf') continue;
    if (url.searchParams.get('code') !== 'CALEN') continue;
    if (url.searchParams.get('description') !== 'Calendrier courses') continue;
    if (url.searchParams.get('fctID') !== '1406') continue;
    return url.href;
  }
  return null;
}

function cookiesFrom(response) {
  const raw = response.headers.get('set-cookie');
  if (!raw) return null;
  return raw
    .split(/,(?=[^;]+?=)/g)
    .map((item) => item.split(';', 1)[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function fetchHtml(url, { cookie = null } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const headers = {
      'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml',
    };
    if (cookie) headers.cookie = cookie;
    const response = await fetch(url, { redirect: 'follow', headers, signal: controller.signal });
    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      final_url: response.url,
      html,
      cookie: cookiesFrom(response),
    };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error), html: '' };
  } finally {
    clearTimeout(timer);
  }
}

function fingerprints(html) {
  return {
    legend: /id=(["'])legende-report\1[^>]*>\s*R[ée]union\s+report[ée]e/i.test(html),
    jours_evenement: /\bjoursEvenement\s*=\s*(?=\[)/i.test(html),
    key_semantics: /d\s*\+\s*["']{2}\s*\+\s*\(m\s*\+\s*10\)\s*\+\s*["']{2}\s*\+\s*y/i.test(html),
  };
}

async function attempt(number) {
  const programme = await fetchHtml(PROGRAMME_URL);
  const href = programme.ok ? calendarHref(programme.html) : null;
  const calendar = href
    ? await fetchHtml(href, { cookie: programme.cookie })
    : { ok: false, status: null, error: 'calendar menu href not found', html: '' };

  return {
    attempt: number,
    programme: {
      ok: programme.ok,
      status: programme.status,
      final_url: programme.final_url ?? null,
      bytes: Buffer.byteLength(programme.html || ''),
      set_cookie_present: Boolean(programme.cookie),
    },
    discovered_calendar_url: href,
    discovered_has_jsessionid: Boolean(href && /;jsessionid=/i.test(href)),
    calendar: {
      ok: calendar.ok,
      status: calendar.status,
      final_url: calendar.final_url ?? null,
      bytes: Buffer.byteLength(calendar.html || ''),
      error: calendar.error ?? null,
      fingerprints: fingerprints(calendar.html || ''),
    },
  };
}

const results = [];
for (let i = 1; i <= 3; i += 1) results.push(await attempt(i));

console.log(JSON.stringify({
  generated_at: new Date().toISOString(),
  method: 'programme_menu_session_bound_calendar_discovery',
  results,
}, null, 2));

const passed = results.every((result) =>
  result.programme.ok
  && result.discovered_calendar_url
  && result.calendar.ok
  && result.calendar.fingerprints.legend
  && result.calendar.fingerprints.jours_evenement
  && result.calendar.fingerprints.key_semantics
);
if (!passed) throw new Error('SOREC session-bound calendar discovery was not stable across all probe attempts');
