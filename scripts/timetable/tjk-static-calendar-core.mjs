export const TJK_STATIC_CALENDAR_URL = 'https://medya-cdn.tjk.org/haberftp/2025/2026takvim161225.pdf';
export const TJK_STATIC_CALENDAR_YEAR = 2026;

export const TJK_STATIC_CALENDAR_VENUES = Object.freeze({
  ADA: { source_venue_id: '1', label: 'Adana' },
  IZM: { source_venue_id: '2', label: 'İzmir' },
  IST: { source_venue_id: '3', label: 'İstanbul' },
  BUR: { source_venue_id: '4', label: 'Bursa' },
  ANK: { source_venue_id: '5', label: 'Ankara' },
  URF: { source_venue_id: '6', label: 'Şanlıurfa' },
  ELZ: { source_venue_id: '7', label: 'Elazığ' },
  DYB: { source_venue_id: '8', label: 'Diyarbakır' },
  KOC: { source_venue_id: '9', label: 'Kocaeli' },
  ANT: { source_venue_id: '10', label: 'Antalya' },
});

const TURKISH_NORMALIZE = Object.freeze({
  'İ': 'I',
  'ı': 'i',
  'Ş': 'S',
  'ş': 's',
  'Ğ': 'G',
  'ğ': 'g',
  'Ü': 'U',
  'ü': 'u',
  'Ö': 'O',
  'ö': 'o',
  'Ç': 'C',
  'ç': 'c',
});

export function normalizeTjkCalendarToken(value) {
  return String(value ?? '')
    .replace(/[İışŞğĞüÜöÖçÇ]/g, (ch) => TURKISH_NORMALIZE[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function identifyTjkVenueCode(value) {
  const code = normalizeTjkCalendarToken(value);
  return Object.prototype.hasOwnProperty.call(TJK_STATIC_CALENDAR_VENUES, code) ? code : null;
}

export const TJK_STATIC_MONTHS = Object.freeze({
  OCAK: 1,
  SUBAT: 2,
  MART: 3,
  NISAN: 4,
  MAYIS: 5,
  HAZIRAN: 6,
  TEMMUZ: 7,
  AGUSTOS: 8,
  EYLUL: 9,
  EKIM: 10,
  KASIM: 11,
  ARALIK: 12,
});

export function identifyTjkMonth(value) {
  return TJK_STATIC_MONTHS[normalizeTjkCalendarToken(value)] ?? null;
}


function pointFromItem(item) {
  return {
    text: String(item?.str ?? '').trim(),
    x: Number(item?.transform?.[4] ?? 0),
    y: Number(item?.transform?.[5] ?? 0),
    width: Math.max(0, Number(item?.width ?? 0)),
  };
}

function tokenPoints(item, matcher, mapper) {
  const point = pointFromItem(item);
  if (!point.text) return [];
  const matches = [...point.text.matchAll(matcher)];
  return matches.map((match) => {
    const start = Number(match.index ?? 0);
    const centerOffset = start + String(match[0]).length / 2;
    const ratio = point.text.length ? centerOffset / point.text.length : 0;
    return {
      value: mapper(match[0]),
      x: point.x + point.width * ratio,
      y: point.y,
      raw: point.text,
    };
  }).filter((row) => row.value != null);
}

function monthPanels(items) {
  const headings = [];
  for (const item of items) {
    const month = identifyTjkMonth(item?.str);
    if (!month) continue;
    const p = pointFromItem(item);
    headings.push({ month, x: p.x, y: p.y });
  }
  if (headings.length !== 12 || new Set(headings.map((row) => row.month)).size !== 12) {
    throw new Error(`TJK static calendar month headings invalid: ${headings.length}`);
  }

  return headings
    .sort((a, b) => a.month - b.month)
    .map((heading) => ({
      ...heading,
      x_min: heading.x - 138,
      x_max: heading.x + 138,
      y_max: heading.y - 6,
      y_min: heading.y - 208,
    }));
}

function panelForPoint(panels, point) {
  return panels.find((panel) =>
    point.x >= panel.x_min
    && point.x <= panel.x_max
    && point.y >= panel.y_min
    && point.y <= panel.y_max
  ) ?? null;
}

export function parseTjkStaticCalendarItems(items, { year = TJK_STATIC_CALENDAR_YEAR } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('TJK static calendar text items must be non-empty');
  }
  const panels = monthPanels(items);

  const dayPoints = [];
  const codePoints = [];
  for (const item of items) {
    dayPoints.push(...tokenPoints(
      item,
      /\b(?:[1-9]|[12]\d|3[01])\b/g,
      (value) => Number(value),
    ));
    codePoints.push(...tokenPoints(
      item,
      /\b(?:ADA|ANK|ANT|BUR|DYB|ELZ|İST|IST|İZM|IZM|KOC|URF)\b/giu,
      (value) => identifyTjkVenueCode(value),
    ));
  }

  const daysByMonth = new Map();
  for (const point of dayPoints) {
    const panel = panelForPoint(panels, point);
    if (!panel) continue;
    const date = new Date(Date.UTC(year, panel.month - 1, point.value));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== panel.month - 1
      || date.getUTCDate() !== point.value
    ) continue;
    const key = panel.month;
    const rows = daysByMonth.get(key) ?? [];
    rows.push({ ...point, month: panel.month });
    daysByMonth.set(key, rows);
  }

  const fixtures = [];
  const unmatchedCodes = [];
  for (const codePoint of codePoints) {
    const panel = panelForPoint(panels, codePoint);
    if (!panel) continue;
    const candidates = (daysByMonth.get(panel.month) ?? [])
      .map((day) => ({
        day,
        dx: Math.abs(day.x - codePoint.x),
        dy: day.y - codePoint.y,
      }))
      .filter((row) => row.dy >= -2 && row.dy <= 28 && row.dx <= 34)
      .sort((a, b) => (a.dy * 3 + a.dx) - (b.dy * 3 + b.dx));

    const nearest = candidates[0] ?? null;
    if (!nearest) {
      unmatchedCodes.push({ ...codePoint, month: panel.month });
      continue;
    }

    const venue = TJK_STATIC_CALENDAR_VENUES[codePoint.value];
    const month = String(panel.month).padStart(2, '0');
    const day = String(nearest.day.value).padStart(2, '0');
    fixtures.push({
      candidate_id: `tjk-${year}-${month}-${day}-${venue.source_venue_id}`,
      source: 'tjk',
      country: 'Turkey',
      date: `${year}-${month}-${day}`,
      racecourse: venue.label,
      racecourse_source_id: venue.source_venue_id,
      source_url: TJK_STATIC_CALENDAR_URL,
      capability_rank: 'C',
      publication_ceiling: 'A',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      detail_observation: { status: 'not_published', race_count: 0, conflicts: [] },
      provenance: {
        discovered_from: TJK_STATIC_CALENDAR_URL,
        discovery_method: 'official_static_annual_calendar_pdf',
        calendar_code: codePoint.value,
      },
    });
  }

  const unique = new Map();
  for (const fixture of fixtures) unique.set(fixture.candidate_id, fixture);
  return {
    fixtures: [...unique.values()].sort((a, b) => a.date.localeCompare(b.date) || Number(a.racecourse_source_id) - Number(b.racecourse_source_id)),
    unmatched_codes: unmatchedCodes,
    month_count: panels.length,
    code_points: codePoints.length,
    day_points: dayPoints.length,
  };
}
