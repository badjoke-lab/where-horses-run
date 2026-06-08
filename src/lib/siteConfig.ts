export const siteConfig = {
  url: 'https://whr.badjoke-lab.com',
  name: 'Where Horses Run',
  nameJa: '競馬どこ？',
  description: 'Global horse racing calendar, timetable, racecourse and official source guide.',
  descriptionJa: '世界の競馬開催カレンダー、レース時刻表、競馬場、公式ソース案内。',
  gaMeasurementId: 'G-79W3MF08Y9',
} as const;

export function withSiteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.url).toString();
}
