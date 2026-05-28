function textByClass(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`,
    'i'
  );
  const match = html.match(pattern);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function shortTrackId(trackId) {
  if (typeof trackId !== 'string') return 'unknown-track';
  return trackId.replace(/-racecourse$/, '') || trackId;
}

export function parseSimpleFixtureHtml(html, options = {}) {
  const sourceId = textByClass(html, 'source-id');
  const countryId = textByClass(html, 'country-id');
  const trackName = textByClass(html, 'track-name');
  const trackId = textByClass(html, 'track-id');
  const localDate = textByClass(html, 'local-date');
  const timezone = textByClass(html, 'timezone');
  const racingType = textByClass(html, 'racing-type');
  const status = textByClass(html, 'status') || 'unknown';

  const sourceUrl = options.sourceUrlById?.[sourceId] ?? '';

  return {
    parser_version: 'fixture-v0',
    source_id: sourceId,
    fixture_generated_at: options.fixtureGeneratedAt ?? '2026-05-29T00:00:00Z',
    status: 'ok',
    meetings: [
      {
        meeting_id: `fixture-${countryId}-${shortTrackId(trackId)}-${localDate}`,
        country_id: countryId,
        track_id: trackId,
        track_name: trackName,
        local_date: localDate,
        timezone,
        source_id: sourceId,
        source_url: sourceUrl,
        status,
        racing_type: racingType,
        notes: 'Public-safe manual fixture. Not live schedule data.'
      }
    ],
    warnings: [
      'Fixture uses manually simplified sample markup.'
    ],
    errors: []
  };
}
