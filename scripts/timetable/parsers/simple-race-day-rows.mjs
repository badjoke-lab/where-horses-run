const MONTHS = new Map([
  ['january', '01'],
  ['february', '02'],
  ['march', '03'],
  ['april', '04'],
  ['may', '05'],
  ['june', '06'],
  ['july', '07'],
  ['august', '08'],
  ['september', '09'],
  ['october', '10'],
  ['november', '11'],
  ['december', '12']
]);

function toIsoDate(monthName, day, year) {
  const month = MONTHS.get(monthName.toLowerCase());
  if (!month) return null;
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

export function parseSimpleRaceDayRows(html, options = {}) {
  const year = options.year ?? 2026;
  const countryId = options.countryId;
  const groupId = options.groupId;
  const sourceUrl = options.sourceUrl;
  const sourceCaptureDate = options.sourceCaptureDate ?? new Date().toISOString().slice(0, 10);
  const sourceType = options.sourceType ?? 'official_race_day_index';
  const parserName = options.parserName ?? 'simple-race-day-rows';

  const rowRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Za-z]+)\s+(\d{1,2})\s+at\s+(.+?)\s+(?:Post\s+Time|First\s+Race)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;
  const records = [];

  for (const match of html.matchAll(rowRegex)) {
    const meetingDate = toIsoDate(match[1], Number.parseInt(match[2], 10), year);
    const racecourse = match[3].replace(/\s+/g, ' ').trim();
    const firstRaceTime = match[4].trim().toUpperCase();
    if (!meetingDate || !racecourse || !firstRaceTime) continue;

    records.push({
      country_id: countryId,
      group_id: groupId,
      data_level: 'B',
      racecourse,
      meeting_date: meetingDate,
      first_race_time: firstRaceTime,
      races: [],
      source_url: sourceUrl,
      source_type: sourceType,
      source_capture_date: sourceCaptureDate,
      last_checked: sourceCaptureDate,
      parser: parserName,
      promotion_note: 'Race-day row exposed meeting date, racecourse, and first race/post time. Full race rows require a racecard parser before Level A.'
    });
  }

  return records;
}
