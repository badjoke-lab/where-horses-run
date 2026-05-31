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

export function parseCanadaWoodbineRaceDays(html, options = {}) {
  const year = options.year ?? 2026;
  const countryId = options.countryId ?? 'canada';
  const groupId = options.groupId ?? 'woodbine-thoroughbred';
  const racecourse = options.racecourse ?? 'Woodbine Racetrack';
  const sourceUrl = options.sourceUrl ?? 'https://woodbine.com/race/';
  const sourceCaptureDate = options.sourceCaptureDate ?? new Date().toISOString().slice(0, 10);
  const sourceType = options.sourceType ?? 'official_operator_race_day_index';

  const rowRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Za-z]+)\s+(\d{1,2})\s+Live\s+at\s+(.+?)\s+Post-Time:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
  const records = [];

  for (const match of html.matchAll(rowRegex)) {
    const monthName = match[1];
    const day = Number.parseInt(match[2], 10);
    const parsedRacecourse = match[3].replace(/\s+/g, ' ').trim();
    const firstRaceTime = match[4].toUpperCase();
    const meetingDate = toIsoDate(monthName, day, year);
    if (!meetingDate) continue;

    records.push({
      country_id: countryId,
      group_id: groupId,
      data_level: firstRaceTime ? 'B' : 'C',
      racecourse: parsedRacecourse || racecourse,
      meeting_date: meetingDate,
      first_race_time: firstRaceTime || null,
      races: [],
      source_url: sourceUrl,
      source_type: sourceType,
      source_capture_date: sourceCaptureDate,
      last_checked: sourceCaptureDate,
      parser: 'canada-woodbine-race-days',
      promotion_note: 'Official operator race-day index exposed meeting date, racecourse, and post time. Full race rows require racecard parser before Level A.'
    });
  }

  return records;
}
