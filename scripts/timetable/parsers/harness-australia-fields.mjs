export function parseHarnessAustraliaCurrentRaces(html, options = {}) {
  const sourceUrl = options.sourceUrl ?? 'https://www.harness.org.au/racing/fields/';
  const sourceCaptureDate = options.sourceCaptureDate ?? new Date().toISOString().slice(0, 10);
  const meetingDate = options.meetingDate ?? null;

  const rowRegex = />([^<]*?)\s+R(\d+)\s*\((\d{1,2}:\d{2}\s*(?:AM|PM))\)</gi;
  const byRacecourse = new Map();

  for (const match of html.matchAll(rowRegex)) {
    const racecourse = match[1].replace(/\s+/g, ' ').trim();
    const raceNumber = Number.parseInt(match[2], 10);
    const raceTime = match[3].toUpperCase();
    if (!racecourse || !Number.isInteger(raceNumber)) continue;
    if (!byRacecourse.has(racecourse)) {
      byRacecourse.set(racecourse, []);
    }
    byRacecourse.get(racecourse).push({
      race_number: raceNumber,
      race_time: raceTime,
      race_name_or_label: `R${raceNumber}`
    });
  }

  return [...byRacecourse.entries()].map(([racecourse, races]) => {
    races.sort((a, b) => a.race_number - b.race_number);
    const firstRace = races[0] ?? null;
    const hasSequentialRaceRows = races.length >= 2;

    return {
      country_id: 'australia',
      group_id: 'harness-australia',
      data_level: hasSequentialRaceRows ? 'B' : 'C',
      racecourse,
      meeting_date: meetingDate,
      first_race_time: firstRace?.race_time ?? null,
      races: [],
      source_url: sourceUrl,
      source_type: 'official_fields_current_races',
      source_capture_date: sourceCaptureDate,
      last_checked: sourceCaptureDate,
      parser: 'harness-australia-fields',
      promotion_note: hasSequentialRaceRows
        ? 'Current races rail exposed first-race time; full race rows require meeting page parser before Level A.'
        : 'Current races rail exposed racecourse; meeting date still required for durable Level C.'
    };
  });
}
