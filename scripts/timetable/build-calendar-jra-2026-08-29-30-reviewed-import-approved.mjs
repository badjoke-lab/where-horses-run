import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { loadAuthoritySourceInventoryV1 } from './load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { validateCollectionJobV1 } from './collection-job-validation.mjs';

const root = process.cwd();
const OUTPUT = 'data/candidates/jra-2026-08-29-30-reviewed-import-a-plus-approved.json';
const GENERATED_AT = '2026-08-23T05:30:00Z';
const REVIEWED_AT = '2026-08-23T05:31:00Z';
const REVIEWER = 'badjoke-lab';
const CAMPAIGN_ID = 'jra-august-2026-manual-recovery-001';
const SOURCE_ID = 'jra-programme';
const SYSTEM_ID = 'japan-jra-system';
const AUTHORITY_ID = 'jra';
const SOURCE_URLS = {
  '2026-08-29': 'https://www.jra.go.jp/keiba/calendar2026/2026/8/0829.html',
  '2026-08-30': 'https://www.jra.go.jp/keiba/calendar2026/2026/8/0830.html',
};

const jobs = ['2026-08-29', '2026-08-30'].map((date) => ({
  schema_version: 'calendar-collection-job-v1',
  job_id: `jra-${date}-reviewed-import-001`,
  campaign_id: CAMPAIGN_ID,
  system_id: SYSTEM_ID,
  runner_policy: { mode: 'exact', runner: 'reviewed_import' },
  collection_mode: 'single_date',
  requested_scope: { date, timezone: 'Asia/Tokyo' },
  rank_strategy: 'best_available',
  target_rank: null,
  reason: 'manual_recovery',
  requested_at: GENERATED_AT,
}));

// [race no, post time, race name, distance m, surface, course label]
const reviewed = {
  '2026-08-29': {
    'niigata-racecourse': [
      [1,'09:40','障害3歳以上未勝利',2850,'Turf','Turf Outer Course'],
      [2,'10:15','3歳未勝利',1800,'Dirt','Dirt Course'],
      [3,'10:45','2歳未勝利',1600,'Turf','Turf Outer Course'],
      [4,'11:15','2歳新馬',1400,'Turf','Turf Course'],
      [5,'11:45','3歳未勝利',2200,'Turf','Turf Course'],
      [6,'14:35','新発田城特別 3歳以上1勝クラス',1800,'Dirt','Dirt Course'],
      [7,'15:10','赤倉特別 3歳以上2勝クラス',2000,'Turf','Turf Outer Course'],
      [8,'15:45','BSN賞（L） 3歳以上オープン',1800,'Dirt','Dirt Course'],
      [9,'16:25','3歳以上1勝クラス',2200,'Turf','Turf Course'],
      [10,'17:00','3歳以上1勝クラス',1400,'Turf','Turf Course'],
      [11,'17:30','3歳未勝利',2000,'Turf','Turf Course'],
      [12,'18:05','3歳未勝利',1200,'Dirt','Dirt Course'],
    ],
    'chukyo-racecourse': [
      [1,'09:50','2歳未勝利',2000,'Turf','Turf Course'],
      [2,'10:25','2歳未勝利',1800,'Dirt','Dirt Course'],
      [3,'10:55','2歳新馬',1400,'Turf','Turf Course'],
      [4,'11:25','3歳未勝利',2200,'Turf','Turf Course'],
      [5,'11:55','3歳未勝利',2000,'Turf','Turf Course'],
      [6,'15:00','清洲特別 3歳以上2勝クラス',1200,'Dirt','Dirt Course'],
      [7,'15:35','長篠ステークス 3歳以上3勝クラス',1400,'Turf','Turf Course'],
      [8,'16:10','桑名特別 3歳以上2勝クラス',1400,'Turf','Turf Course'],
      [9,'16:45','3歳以上1勝クラス',1800,'Dirt','Dirt Course'],
      [10,'17:15','3歳以上1勝クラス',1400,'Dirt','Dirt Course'],
      [11,'17:45','3歳以上1勝クラス',1600,'Turf','Turf Course'],
      [12,'18:15','3歳未勝利',1800,'Dirt','Dirt Course'],
    ],
    'sapporo-racecourse': [
      [1,'10:00','3歳未勝利',1700,'Dirt','Dirt Course'],
      [2,'10:30','2歳未勝利',1500,'Turf','Turf Course'],
      [3,'11:00','2歳未勝利',1800,'Turf','Turf Course'],
      [4,'11:30','3歳未勝利',1000,'Dirt','Dirt Course'],
      [5,'12:20','2歳新馬',1700,'Dirt','Dirt Course'],
      [6,'12:50','3歳未勝利',1500,'Turf','Turf Course'],
      [7,'13:20','3歳以上1勝クラス',1200,'Turf','Turf Course'],
      [8,'13:50','3歳以上1勝クラス',1700,'Dirt','Dirt Course'],
      [9,'14:20','3歳以上1勝クラス',1800,'Turf','Turf Course'],
      [10,'14:50','すずらん賞 2歳オープン',1200,'Turf','Turf Course'],
      [11,'15:25','札幌日刊スポーツ杯 3歳以上2勝クラス',2000,'Turf','Turf Course'],
      [12,'16:00','千歳特別 3歳以上2勝クラス',1700,'Dirt','Dirt Course'],
    ],
  },
  '2026-08-30': {
    'niigata-racecourse': [
      [1,'09:40','障害3歳以上未勝利',2850,'Turf','Turf Outer Course'],
      [2,'10:15','2歳新馬',1800,'Dirt','Dirt Course'],
      [3,'10:45','2歳未勝利',2000,'Turf','Turf Course'],
      [4,'11:15','2歳新馬',1800,'Turf','Turf Outer Course'],
      [5,'11:45','3歳未勝利',1400,'Turf','Turf Course'],
      [6,'14:35','両津湾特別 3歳以上2勝クラス',1800,'Dirt','Dirt Course'],
      [7,'15:10','日本海ステークス 3歳以上3勝クラス',2200,'Turf','Turf Course'],
      [8,'15:45','サマー2000シリーズ 第62回 農林水産省賞典 新潟記念（GⅢ） 3歳以上オープン',2000,'Turf','Turf Outer Course'],
      [9,'16:25','閃光特別 3歳以上2勝クラス',1000,'Turf','Turf Course'],
      [10,'17:00','3歳未勝利',1800,'Dirt','Dirt Course'],
      [11,'17:30','3歳以上1勝クラス',1800,'Turf','Turf Outer Course'],
      [12,'18:05','3歳以上1勝クラス',1200,'Dirt','Dirt Course'],
    ],
    'chukyo-racecourse': [
      [1,'09:50','2歳未勝利',1400,'Turf','Turf Course'],
      [2,'10:25','2歳新馬',1600,'Turf','Turf Course'],
      [3,'10:55','2歳新馬',2000,'Turf','Turf Course'],
      [4,'11:25','3歳未勝利',1400,'Dirt','Dirt Course'],
      [5,'11:55','3歳以上1勝クラス',1800,'Dirt','Dirt Course'],
      [6,'15:00','白川郷ステークス 3歳以上3勝クラス',1900,'Dirt','Dirt Course'],
      [7,'15:35','第2回 中京2歳ステークス（GⅢ） 2歳オープン',1400,'Turf','Turf Course'],
      [8,'16:10','熊野特別 3歳以上2勝クラス',2200,'Turf','Turf Course'],
      [9,'16:45','3歳未勝利',1800,'Dirt','Dirt Course'],
      [10,'17:15','3歳以上1勝クラス',2000,'Turf','Turf Course'],
      [11,'17:45','3歳未勝利',1400,'Turf','Turf Course'],
      [12,'18:15','3歳以上1勝クラス',1200,'Dirt','Dirt Course'],
    ],
    'sapporo-racecourse': [
      [1,'10:00','3歳未勝利',1700,'Dirt','Dirt Course'],
      [2,'10:30','2歳未勝利',1200,'Turf','Turf Course'],
      [3,'11:00','3歳未勝利',1700,'Dirt','Dirt Course'],
      [4,'11:30','3歳未勝利',2000,'Turf','Turf Course'],
      [5,'12:20','2歳新馬',1800,'Turf','Turf Course'],
      [6,'12:50','3歳以上1勝クラス',1700,'Dirt','Dirt Course'],
      [7,'13:20','3歳以上1勝クラス',1000,'Dirt','Dirt Course'],
      [8,'13:50','3歳以上1勝クラス',1500,'Turf','Turf Course'],
      [9,'14:20','3歳以上1勝クラス',1700,'Dirt','Dirt Course'],
      [10,'14:50','HBC賞 3歳以上2勝クラス',1200,'Turf','Turf Course'],
      [11,'15:25','日高ステークス 3歳以上3勝クラス',1500,'Turf','Turf Course'],
      [12,'16:00','北辰特別 3歳以上1勝クラス',2600,'Turf','Turf Course'],
    ],
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const registry = loadCalendarAcquisitionRegistryV1(root);
for (const job of jobs) {
  const errors = validateCollectionJobV1(job, registry);
  assert(errors.length === 0, `${job.job_id} invalid: ${errors.join('; ')}`);
  assert(job.runner_policy.mode === 'exact' && job.runner_policy.runner === 'reviewed_import', `${job.job_id} runner boundary differs`);
  assert(job.collection_mode === 'single_date' && job.reason === 'manual_recovery', `${job.job_id} fallback contract differs`);
}

const inventory = loadAuthoritySourceInventoryV1(root);
const source = inventory.records.find((record) => record.country_id === 'japan' && record.authority_id === AUTHORITY_ID && record.official_source_id === SOURCE_ID);
assert(source, 'JRA programme authority/source record missing');
assert(source.capability_rank === 'A+' && source.source_status === 'verified' && source.adapter_candidate_status !== 'blocked', 'JRA programme source is not promotion eligible');
assert(new URL(source.official_source_url).hostname === 'www.jra.go.jp', 'JRA programme source host differs');

const readiness = loadCalendarReadinessV1(root).records.find((record) => record.authority_source_key === `japan/${AUTHORITY_ID}/${SOURCE_ID}`);
assert(readiness, 'JRA programme readiness record missing');
assert(readiness.system_id === SYSTEM_ID && readiness.technical_rank === 'A+' && readiness.public_ceiling === 'A+', 'JRA A+ readiness differs');
for (const field of ['meeting_date','racecourse','first_race_time','last_race_time','per_race_post_times','race_name','distance','surface','course']) {
  assert(readiness.confirmed_fields?.[field] === true, `JRA readiness no longer confirms ${field}`);
}

const records = [];
for (const date of Object.keys(reviewed).sort()) {
  const url = SOURCE_URLS[date];
  assert(new URL(url).hostname === 'www.jra.go.jp', `reviewed source host differs for ${date}`);
  for (const racecourseId of Object.keys(reviewed[date]).sort()) {
    const rawRows = reviewed[date][racecourseId];
    assert(rawRows.length === 12, `${date} ${racecourseId} must contain 12 races`);
    const timetableRows = rawRows.map(([raceNumber, postTime, raceName, distanceM, surface, courseLabel], index) => {
      assert(raceNumber === index + 1, `${date} ${racecourseId} race numbers are not continuous`);
      for (const [value, field] of [[postTime,'post_time_local'],[raceName,'race_name'],[distanceM,'distance_m'],[surface,'surface'],[courseLabel,'course_label']]) {
        assert(value !== null && value !== '', `${date} ${racecourseId} Race ${raceNumber} missing ${field}`);
      }
      return { label: `Race ${raceNumber}`, post_time_local: postTime, race_name: raceName, distance_m: distanceM, surface, course_label: courseLabel };
    });
    const meetingId = `jra-${racecourseId}-${date}`;
    records.push({
      candidate_id: `approved-${meetingId}`,
      meeting_id: meetingId,
      country_id: 'japan',
      authority_id: AUTHORITY_ID,
      racing_system_id: SYSTEM_ID,
      racecourse_id: racecourseId,
      date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      first_race_time_local: timetableRows[0].post_time_local,
      last_race_time_local: timetableRows.at(-1).post_time_local,
      timetable_rows: timetableRows,
      source: {
        source_id: SOURCE_ID,
        official_url: url,
        checked_at: GENERATED_AT,
        extraction_method: 'manual_import',
      },
      confidence: 'high',
      review_status: 'approved',
      notes: 'Approved through the registered JRA reviewed_import single-date fallback from the official scheduled programme. Only public-safe A+ timetable fields are retained; the programme remains subject to official change.',
    });
  }
}

assert(records.length === 6, `expected six JRA reviewed-import records, got ${records.length}`);
assert(records.reduce((sum, record) => sum + record.timetable_rows.length, 0) === 72, 'expected 72 JRA timetable rows');
const ids = records.map((record) => record.meeting_id).sort();
const expectedIds = [
  'jra-chukyo-racecourse-2026-08-29','jra-niigata-racecourse-2026-08-29','jra-sapporo-racecourse-2026-08-29',
  'jra-chukyo-racecourse-2026-08-30','jra-niigata-racecourse-2026-08-30','jra-sapporo-racecourse-2026-08-30',
].sort();
assert(JSON.stringify(ids) === JSON.stringify(expectedIds), `JRA reviewed identity set differs: ${JSON.stringify(ids)}`);
const serialized = JSON.stringify(records).toLowerCase();
for (const forbidden of ['horse_name','jockey','trainer','odds','popularity','payout','result','prediction','raw_html','stream_url']) {
  assert(!serialized.includes(forbidden), `JRA reviewed import contains forbidden field ${forbidden}`);
}

const candidate = {
  schema_version: 'timetable-candidate-v1',
  generated_at: GENERATED_AT,
  adapter_id: 'jra-reviewed-import-2026-08-29-30-a-plus-v1',
  country_id: 'japan',
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  candidate_window: { start_date: '2026-08-29', end_date_exclusive: '2026-08-31', timezone: 'Asia/Tokyo' },
  records,
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved six JRA A+ meeting details for August 29-30 via the registered reviewed_import single-date manual-recovery fallback. The two exact fallback Jobs are review-only acquisition semantics; publication remains a separate bounded promotion.',
    promotion_target: 'canonical-timetable-v0',
  },
};

const outputPath = path.join(root, OUTPUT);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(candidate, null, 2)}\n`);
console.log(JSON.stringify({
  output: OUTPUT,
  campaign_id: CAMPAIGN_ID,
  jobs: jobs.map((job) => ({ job_id: job.job_id, runner: job.runner_policy.runner, mode: job.collection_mode, date: job.requested_scope.date })),
  records: records.length,
  rows: 72,
  rank: 'A+',
  publication_effect: 'none',
}));
