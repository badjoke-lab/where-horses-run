const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const lined = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|table)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\t\u3000 ]+/g, ' ')
  .replace(/\r/g, '')
  .replace(/\n\s+/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

function distinctRaceNumbers(matches) {
  return new Set(matches.map((match) => Number(match[1])).filter((value) => value >= 1 && value <= 30));
}

export function narRaceProgrammePublicationSignals(html) {
  const source = String(html ?? '');
  const text = lined(source);
  const raceLabels = distinctRaceNumbers([...text.matchAll(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/gi)]);
  const raceHeadings = distinctRaceNumbers([...text.matchAll(/第\s*(\d{1,2})\s*競走/g)]);
  const postTimes = [...text.matchAll(/(?:^|\s)(\d{1,2})\s*[:：]\s*(\d{2})(?:\s|$)/g)]
    .filter((match) => Number(match[1]) <= 23 && Number(match[2]) <= 59);
  const detailLinks = [...source.matchAll(/(?:DebaTable|S_DebaTable|DebaTableSmall|RaceMarkTable)[^"'\s>]*?/gi)];

  return {
    race_label_count: raceLabels.size,
    race_heading_count: raceHeadings.size,
    post_time_count: postTimes.length,
    detail_link_count: detailLinks.length,
  };
}

export function narRaceProgrammeLooksPublished(html) {
  const signals = narRaceProgrammePublicationSignals(html);
  const repeatedRaceStructure = signals.race_label_count >= 2 || signals.race_heading_count >= 2;
  const timedRaceStructure = repeatedRaceStructure && signals.post_time_count >= 2;
  const linkedRaceStructure = repeatedRaceStructure && signals.detail_link_count >= 2;
  const repeatedDetailLinks = signals.detail_link_count >= 2 && signals.post_time_count >= 2;
  return timedRaceStructure || linkedRaceStructure || repeatedDetailLinks;
}
