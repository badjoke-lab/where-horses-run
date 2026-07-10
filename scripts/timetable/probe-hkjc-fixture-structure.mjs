const months = process.argv.slice(2).map((value) => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error(`month argument must be YYYY-MM: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]) };
});
if (months.length === 0) throw new Error('at least one YYYY-MM month argument is required');

const timeoutMs = 15000;

function fixtureUrl(year, month) {
  return `https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=${String(month).padStart(2, '0')}&CalYear=${year}`;
}

function countMatches(value, regex) {
  return [...String(value ?? '').matchAll(regex)].length;
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function allowlistPhrasePresence(text) {
  const phrases = [
    'fixture',
    'racing fixture',
    'race meeting',
    'sha tin',
    'happy valley',
    'no record',
    'no fixture',
    'no race meeting',
    'no racing',
    'calendar',
  ];
  const lower = text.toLowerCase();
  return Object.fromEntries(phrases.map((phrase) => [phrase, lower.includes(phrase)]));
}

function safeStructureSummary(html, response, year, month) {
  const visibleText = stripHtml(html);
  const raceDateLinks = [...html.matchAll(/href=["'][^"']*racedate=(\d{4}[\/-]\d{2}[\/-]\d{2})[^"']*(?:Racecourse|racecourse)=([A-Za-z]{2})[^"']*["']/gi)]
    .map((match) => ({ date_token: match[1].replaceAll('/', '-'), racecourse_code: match[2].toUpperCase() }))
    .filter((entry) => ['ST', 'HV'].includes(entry.racecourse_code));
  const uniqueRaceDateLinks = [...new Map(raceDateLinks.map((entry) => [`${entry.date_token}:${entry.racecourse_code}`, entry])).values()];
  const imageAltSequenceCount = countMatches(html, /(?:alt|title)=["']?(?:ST|HV)["']?[^>]*>[\s\S]{0,500}?(?:alt|title)=["']?(?:D|T|N)["']?/gi);
  const venueAltCount = countMatches(html, /(?:alt|title)=["']?(?:ST|HV)["']?/gi);
  const sessionAltCount = countMatches(html, /(?:alt|title)=["']?(?:D|T|N)["']?/gi);
  const raceDateParamCount = countMatches(html, /racedate=/gi);
  const monthEchoTokens = [
    `${year}-${String(month).padStart(2, '0')}`,
    `${String(month).padStart(2, '0')}/${year}`,
    `${year}/${String(month).padStart(2, '0')}`,
    `CalMonth=${String(month).padStart(2, '0')}`,
    `CalYear=${year}`,
  ];

  return {
    requested_month: `${year}-${String(month).padStart(2, '0')}`,
    requested_url: fixtureUrl(year, month),
    http_status: response.status,
    response_ok: response.ok,
    final_url: response.url,
    final_host: new URL(response.url).hostname.toLowerCase(),
    content_type: response.headers.get('content-type'),
    response_bytes: Buffer.byteLength(html),
    visible_text_chars: visibleText.length,
    structure_markers: {
      form_count: countMatches(html, /<form\b/gi),
      select_count: countMatches(html, /<select\b/gi),
      option_count: countMatches(html, /<option\b/gi),
      table_count: countMatches(html, /<table\b/gi),
      img_count: countMatches(html, /<img\b/gi),
      anchor_count: countMatches(html, /<a\b/gi),
      script_src_count: countMatches(html, /<script\b[^>]*\bsrc=/gi),
    },
    fixture_markers: {
      venue_alt_count: venueAltCount,
      session_alt_count: sessionAltCount,
      image_alt_sequence_count: imageAltSequenceCount,
      race_date_param_count: raceDateParamCount,
      unique_race_date_link_count: uniqueRaceDateLinks.length,
      unique_race_date_links: uniqueRaceDateLinks.slice(0, 40),
      visible_sha_tin_count: countMatches(visibleText, /\bSha Tin\b/gi),
      visible_happy_valley_count: countMatches(visibleText, /\bHappy Valley\b/gi),
    },
    month_context: {
      matched_echo_tokens: monthEchoTokens.filter((token) => html.includes(token) || visibleText.includes(token)),
      allowlist_phrase_presence: allowlistPhrasePresence(visibleText),
    },
    raw_body_stored: false,
    public_safe_probe_only: true,
  };
}

async function fetchMonth(year, month) {
  const url = fixtureUrl(year, month);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public calendar research; structure-summary-only)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const html = await response.text();
    return safeStructureSummary(html, response, year, month);
  } finally {
    clearTimeout(timer);
  }
}

const summaries = [];
for (const { year, month } of months) summaries.push(await fetchMonth(year, month));

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-fixture-structure-probe-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-04',
  generated_at: new Date().toISOString(),
  months: summaries,
  raw_body_stored: false,
}, null, 2));
