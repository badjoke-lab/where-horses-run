export function parseUstaFullRacecard(html, options = {}) {
  const sourceCaptureDate = options.sourceCaptureDate ?? '2026-05-31';
  const sectionRegex = /<section\s+data-racecourse="([^"]+)"\s+data-date="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  const raceRegex = /<article\s+data-race="(\d+)"\s+data-time="([^"]+)"\s+data-name="([^"]*)"\s+data-distance="([^"]*)"[^>]*><\/article>/gi;
  const records = [];

  for (const section of html.matchAll(sectionRegex)) {
    const racecourse = section[1].trim();
    const meetingDate = section[2].trim();
    const sectionBody = section[3];
    const races = [];

    for (const race of sectionBody.matchAll(raceRegex)) {
      races.push({
        race_number: Number.parseInt(race[1], 10),
        race_time: race[2].trim(),
        race_name: race[3].trim(),
        distance: race[4].trim()
      });
    }

    if (!racecourse || !meetingDate || races.length === 0) continue;

    records.push({
      country_id: 'united-states',
      group_id: 'usta-harness',
      data_level: 'A',
      racecourse,
      meeting_date: meetingDate,
      first_race_time: races[0].race_time,
      races,
      source_url: 'fixture:us-usta-racecard-full',
      source_type: 'official_racecard_fixture',
      source_capture_date: sourceCaptureDate,
      last_checked: sourceCaptureDate,
      parser: 'usta-full-racecard',
      promotion_note: 'Full harness racecard fixture exposes all race rows and race times for this meeting.'
    });
  }

  return records;
}
