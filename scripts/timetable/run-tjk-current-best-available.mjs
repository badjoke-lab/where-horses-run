import fs from 'node:fs';
import path from 'node:path';
import {
  ENTRY_URL,
  SCHEMA,
  TIMEZONE,
  detectRaceSchedule,
  discoverFromIndexHtml,
  turkeyDate,
} from './tjk-current-future-candidates.mjs';
import { discoverAnnualFixtures } from './tjk-annual-fixture-discovery.mjs';

const TJK_RACECOURSE_IDENTITIES = new Map([
  ['1', { racecourse_id: 'adana-racecourse', name_en: 'Adana Racecourse', name_ja: 'アダナ競馬場' }],
  ['2', { racecourse_id: 'izmir-racecourse', name_en: 'Izmir Racecourse', name_ja: 'イズミル競馬場' }],
  ['3', { racecourse_id: 'istanbul-racecourse', name_en: 'Istanbul Racecourse', name_ja: 'イスタンブール競馬場' }],
  ['4', { racecourse_id: 'bursa-racecourse', name_en: 'Bursa Racecourse', name_ja: 'ブルサ競馬場' }],
  ['5', { racecourse_id: 'ankara-racecourse', name_en: 'Ankara Racecourse', name_ja: 'アンカラ競馬場' }],
  ['6', { racecourse_id: 'sanliurfa-racecourse', name_en: 'Sanliurfa Racecourse', name_ja: 'シャンルウルファ競馬場' }],
  ['7', { racecourse_id: 'elazig-racecourse', name_en: 'Elazig Racecourse', name_ja: 'エラズー競馬場' }],
  ['8', { racecourse_id: 'diyarbakir-racecourse', name_en: 'Diyarbakir Racecourse', name_ja: 'ディヤルバクル競馬場' }],
  ['9', { racecourse_id: 'kocaeli-racecourse', name_en: 'Kocaeli Racecourse', name_ja: 'コジャエリ競馬場' }],
]);

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bindRacecourseIdentity(candidate) {
  const identity = TJK_RACECOURSE_IDENTITIES.get(String(candidate.racecourse_source_id));
  if (!identity) throw new Error(`Unknown TJK domestic racecourse source id: ${candidate.racecourse_source_id}`);
  return {
    ...candidate,
    meeting_id: `tjk-${identity.racecourse_id}-${candidate.date}`,
    racecourse_id: identity.racecourse_id,
    racecourse_name_en: identity.name_en,
    racecourse_name_ja: identity.name_ja,
    timezone: TIMEZONE,
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`TJK programme page fetch failed: HTTP ${response.status} ${url}`);
  return response.text();
}

async function enrichBestAvailableFromAnnualFixture(fixture, startDate) {
  try {
    const indexHtml = await fetchHtml(fixture.source_url);
    const discovered = discoverFromIndexHtml(indexHtml, fixture.source_url, startDate);
    const detail = discovered.candidates.find((candidate) =>
      candidate.date === fixture.date && candidate.racecourse_source_id === fixture.racecourse_source_id,
    );
    if (!detail) {
      return bindRacecourseIdentity({
        ...fixture,
        detail_observation: { status: 'not_published', race_count: 0, conflicts: [] },
      });
    }

    const detailHtml = await fetchHtml(detail.source_url);
    const detected = detectRaceSchedule(detailHtml);
    if (detected.schedule.length === 0) {
      return bindRacecourseIdentity({
        ...fixture,
        source_url: detail.source_url,
        provenance: {
          ...fixture.provenance,
          detail_discovered_from: fixture.source_url,
          detail_discovered_href: detail.provenance.discovered_href,
          detail_discovery_method: 'official_page_discovered_venue_detail',
        },
        detail_observation: {
          status: detected.conflicts.length ? 'conflict' : 'not_published',
          race_count: 0,
          conflicts: detected.conflicts,
        },
      });
    }

    return bindRacecourseIdentity({
      ...fixture,
      source_url: detail.source_url,
      capability_rank: 'A',
      first_race_time_local: detected.schedule[0].post_time_local,
      last_race_time_local: detected.schedule.at(-1).post_time_local,
      timetable_rows: detected.schedule,
      provenance: {
        ...fixture.provenance,
        detail_discovered_from: fixture.source_url,
        detail_discovered_href: detail.provenance.discovered_href,
        detail_discovery_method: 'official_page_discovered_venue_detail',
      },
      detail_observation: { status: 'available', race_count: detected.schedule.length, conflicts: [] },
    });
  } catch (error) {
    if (String(error?.message ?? '').startsWith('Unknown TJK domestic racecourse source id:')) throw error;
    return bindRacecourseIdentity({
      ...fixture,
      detail_observation: { status: 'source_error', race_count: 0, conflicts: [] },
    });
  }
}

function parseArgs(argv) {
  const read = (name, fallback = null) => {
    const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const output = read('output');
  const days = Number(read('days', '30'));
  if (!output) throw new Error('Usage: node scripts/timetable/run-tjk-current-best-available.mjs --output <path> [--days 30]');
  if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be an integer from 1 to 62');
  return { output, days };
}

const { output, days } = parseArgs(process.argv.slice(2));
const now = new Date();
const startDate = turkeyDate(now);
const endDateExclusive = addDays(startDate, days);
const retrievedAt = now.toISOString();

const annual = await discoverAnnualFixtures({ startDate, endDateExclusive });
const candidates = [];
for (const fixture of annual.fixtures) {
  candidates.push(await enrichBestAvailableFromAnnualFixture(fixture, startDate));
}

const rankCounts = {
  C: candidates.filter((record) => record.capability_rank === 'C').length,
  A: candidates.filter((record) => record.capability_rank === 'A').length,
};
const detailStatusCounts = Object.fromEntries(
  ['available', 'not_published', 'conflict', 'source_error'].map((status) => [
    status,
    candidates.filter((record) => record.detail_observation?.status === status).length,
  ]),
);

const artifact = {
  schema: SCHEMA,
  source: 'tjk',
  country: 'Turkey',
  timezone: TIMEZONE,
  entry_url: ENTRY_URL,
  retrieved_at: retrievedAt,
  effective_today: startDate,
  technical_capability_rank: 'A+',
  publication_ceiling: 'A',
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  disposition: {
    target: 'candidate_only',
    requires_review: true,
    canonical_write: false,
    public_write: false,
  },
  discovery: {
    method: 'official_annual_programme_fixture_union_daily_detail',
    schedule_source_id: annual.schedule_source_id,
    schedule_source_url: annual.source_url,
    annual_pages_fetched: annual.pages.length,
    official_fixture_count: annual.fixtures.length,
    detail_pages_attempted: candidates.length,
    rank_counts: rankCounts,
    detail_status_counts: detailStatusCounts,
  },
  candidates,
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
};

const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  official_fixture_count: annual.fixtures.length,
  candidates: candidates.length,
  rank_counts: rankCounts,
  detail_status_counts: detailStatusCounts,
}, null, 2));
