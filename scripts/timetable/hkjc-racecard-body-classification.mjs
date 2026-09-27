function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function visibleText(body) {
  return decodeEntities(body)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

export function hkjcRacecardNavigationNumbers(body) {
  return [...new Set(
    [...String(body ?? '').matchAll(/(?:RaceNo|raceno)=([0-9]{1,2})/gi)]
      .map((match) => Number(match[1]))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 20),
  )].sort((a, b) => a - b);
}

export function hkjcPublishedRacecardSignal(body) {
  const text = visibleText(body);
  const raceNumbers = hkjcRacecardNavigationNumbers(body);
  const hasPostTime = /\b\d{1,2}:\d{2}\b/.test(text);
  const hasRaceShape = /\b\d{3,4}M\b/i.test(text) || /\b(?:Turf|All Weather Track|All Weather|Dirt)\b/i.test(text);
  return raceNumbers.length >= 2 && hasPostTime && hasRaceShape;
}

export function classifyHkjcRacecardBody(body) {
  const text = visibleText(body);
  if (!body || text.length === 0) {
    return { status: 'empty_response', reason: 'Official response body was empty.' };
  }
  if (hkjcPublishedRacecardSignal(body)) return null;
  if (/access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text)) {
    return {
      status: 'blocked_or_bot_page',
      reason: 'Official response appears to be an access-control or bot-protection page without published-racecard evidence.',
    };
  }
  if (/No race card|not available|not yet available|will be available|Race Card is not available/i.test(text)) {
    return { status: 'racecard_not_published', reason: 'Official page indicates the racecard is not published yet.' };
  }
  return null;
}
