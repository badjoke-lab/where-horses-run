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
