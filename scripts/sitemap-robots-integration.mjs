import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const PUBLIC_MEETING_LIST = 'data/generated/timetable/public/meeting-list.json';
const RACECOURSE_DATA_FILES = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function extractCanonical(html, file) {
  const match = html.match(/<link\s+[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>|<link\s+[^>]*href="([^"]+)"[^>]*rel="canonical"[^>]*>/i);
  const value = match?.slice(1).find(Boolean);
  if (!value) throw new Error(`Missing canonical URL in rendered HTML: ${file}`);
  const url = new URL(value);
  if (url.origin !== SITE_ORIGIN) throw new Error(`Unexpected canonical origin in ${file}: ${url.origin}`);
  if (url.search || url.hash) throw new Error(`Canonical URL contains query or fragment in ${file}: ${value}`);
  return url;
}

function hasNoIndex(html) {
  return /<meta\s+[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"[^>]*>|<meta\s+[^>]*content="[^"]*noindex[^"]*"[^>]*name="robots"[^>]*>/i.test(html);
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function compareUrls(left, right) {
  const leftUrl = new URL(left);
  const rightUrl = new URL(right);
  if (leftUrl.pathname === '/') return rightUrl.pathname === '/' ? 0 : -1;
  if (rightUrl.pathname === '/') return 1;
  return leftUrl.pathname.localeCompare(rightUrl.pathname, 'en');
}

function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function maxDate(...values) {
  return values.map(validIsoDate).filter(Boolean).sort().at(-1) ?? null;
}

function stripJapanesePrefix(pathname) {
  return pathname.startsWith('/ja/') ? pathname.slice(3) : pathname === '/ja/' ? '/' : pathname;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), file), 'utf8'));
}

async function loadFreshnessIndex() {
  const meetingList = await readJson(PUBLIC_MEETING_LIST);
  if (!Array.isArray(meetingList?.meetings)) throw new Error(`Invalid public meeting list: ${PUBLIC_MEETING_LIST}`);

  const meetingByPath = new Map();
  const countryMeetingDates = new Map();
  const racecourseMeetingDates = new Map();
  for (const meeting of meetingList.meetings) {
    const checked = validIsoDate(meeting?.last_checked_date);
    if (!checked) continue;
    if (typeof meeting.detail_path === 'string' && meeting.detail_path.startsWith('/')) {
      meetingByPath.set(meeting.detail_path, maxDate(meetingByPath.get(meeting.detail_path), checked));
    }
    if (typeof meeting.country_id === 'string' && meeting.country_id) {
      countryMeetingDates.set(meeting.country_id, maxDate(countryMeetingDates.get(meeting.country_id), checked));
    }
    if (typeof meeting.racecourse_id === 'string' && meeting.racecourse_id) {
      racecourseMeetingDates.set(meeting.racecourse_id, maxDate(racecourseMeetingDates.get(meeting.racecourse_id), checked));
    }
  }

  const staticDirectory = path.join(process.cwd(), 'data/static');
  const countryProfileFiles = (await fs.readdir(staticDirectory))
    .filter((name) => /^country-profiles-v2(?:-|\.)/.test(name) && name.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right, 'en'));
  const countries = new Map();
  for (const file of countryProfileFiles) {
    const records = JSON.parse(await fs.readFile(path.join(staticDirectory, file), 'utf8'));
    if (!Array.isArray(records)) throw new Error(`Country profile registry must be an array: ${file}`);
    for (const record of records) {
      if (typeof record?.slug !== 'string' || typeof record?.country_id !== 'string') continue;
      const reviewed = validIsoDate(record.last_reviewed);
      const meetingDate = countryMeetingDates.get(record.country_id);
      countries.set(record.slug, maxDate(countries.get(record.slug), reviewed, meetingDate));
    }
  }

  const racecourses = new Map();
  for (const file of RACECOURSE_DATA_FILES) {
    const records = await readJson(file);
    if (!Array.isArray(records)) throw new Error(`Racecourse registry must be an array: ${file}`);
    for (const record of records) {
      if (typeof record?.slug !== 'string') continue;
      const reviewed = maxDate(record?.data_status?.last_checked, record?.schedule_summary?.last_checked);
      const meetingDate = racecourseMeetingDates.get(record.id ?? record.slug);
      racecourses.set(record.slug, maxDate(racecourses.get(record.slug), reviewed, meetingDate));
    }
  }

  return { meetingByPath, countries, racecourses };
}

function lastModifiedFor(url, freshness) {
  const pathname = stripJapanesePrefix(url.pathname);
  const meetingDate = freshness.meetingByPath.get(pathname);
  if (meetingDate) return meetingDate;

  const country = pathname.match(/^\/countries\/([^/]+)\/$/);
  if (country) return freshness.countries.get(country[1]) ?? null;

  const racecourse = pathname.match(/^\/tracks\/([^/]+)\/$/);
  if (racecourse) return freshness.racecourses.get(racecourse[1]) ?? null;

  return null;
}

export default function sitemapRobotsIntegration() {
  return {
    name: 'where-horses-run-sitemap-robots',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = await walk(outputDirectory);
        const htmlFiles = files.filter((file) => file.endsWith('.html') && path.basename(file) !== '404.html');
        const canonicalUrls = new Set();
        let noIndexFiles = 0;

        for (const file of htmlFiles) {
          const html = await fs.readFile(file, 'utf8');
          if (hasNoIndex(html)) {
            noIndexFiles += 1;
            continue;
          }
          canonicalUrls.add(extractCanonical(html, path.relative(outputDirectory, file)).toString());
        }

        const urls = [...canonicalUrls].sort(compareUrls);
        if (!urls.length) throw new Error('Sitemap generation found no canonical public HTML URLs.');
        const freshness = await loadFreshnessIndex();
        let lastModifiedCount = 0;

        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map((urlValue) => {
            const url = new URL(urlValue);
            const lastmod = lastModifiedFor(url, freshness);
            if (lastmod) lastModifiedCount += 1;
            return lastmod
              ? `  <url><loc>${escapeXml(urlValue)}</loc><lastmod>${lastmod}</lastmod></url>`
              : `  <url><loc>${escapeXml(urlValue)}</loc></url>`;
          }),
          '</urlset>',
          '',
        ].join('\n');
        const robots = [
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
          '',
        ].join('\n');

        await fs.writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap, 'utf8');
        await fs.writeFile(path.join(outputDirectory, 'robots.txt'), robots, 'utf8');

        logger.info(`Generated sitemap.xml with ${urls.length} canonical URLs.`);
        logger.info(`Added source-backed lastmod to ${lastModifiedCount} entity URLs; static pages remain undated rather than using build time.`);
        logger.info(`Excluded ${noIndexFiles} noindex HTML files and the rendered 404 page.`);
      },
    },
  };
}
