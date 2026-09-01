import fs from 'node:fs';
import path from 'node:path';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith('--') || !value || value.startsWith('--')) throw new Error(`invalid argument near ${key ?? '<end>'}`);
  args.set(key.slice(2), value);
  index += 1;
}

const artifactDir = args.get('artifact-dir');
const output = args.get('output');
if (!artifactDir || !output) {
  throw new Error('Usage: node scripts/timetable/build-reviewed-kra-current-a-candidate.mjs --artifact-dir <dir> --output <data/candidates/file.json>');
}

const expected = new Map([
  ['kra-busan-gyeongnam-racecourse-2026-09-04', 8],
  ['kra-jeju-racecourse-2026-09-04', 8],
  ['kra-jeju-racecourse-2026-09-05', 7],
  ['kra-seoul-racecourse-2026-09-05', 10],
  ['kra-busan-gyeongnam-racecourse-2026-09-06', 7],
  ['kra-seoul-racecourse-2026-09-06', 10],
]);

const observationDir = path.join(artifactDir, 'kra-current');
const files = fs.readdirSync(observationDir).filter((name) => name.endsWith('.json')).sort();
const observations = files.map((name) => JSON.parse(fs.readFileSync(path.join(observationDir, name), 'utf8')));
if (observations.length !== expected.size) throw new Error(`expected ${expected.size} observations, got ${observations.length}`);

const seen = new Set();
for (const observation of observations) {
  if (!expected.has(observation.meeting_id)) throw new Error(`unexpected meeting ${observation.meeting_id}`);
  if (seen.has(observation.meeting_id)) throw new Error(`duplicate meeting ${observation.meeting_id}`);
  seen.add(observation.meeting_id);
  if (!['A', 'A+'].includes(observation.capability_rank)) throw new Error(`${observation.meeting_id} is not A/A+`);
  if (observation.timetable_rows?.length !== expected.get(observation.meeting_id)) throw new Error(`${observation.meeting_id} race count differs`);
  if (observation.first_race_time_local !== observation.timetable_rows[0].post_time_local) throw new Error(`${observation.meeting_id} first time differs`);
  if (observation.last_race_time_local !== observation.timetable_rows.at(-1).post_time_local) throw new Error(`${observation.meeting_id} last time differs`);
  if (observation.source?.official_url !== 'https://race.kra.co.kr/thisweekrace/ThisWeekBaljuTime.do') throw new Error(`${observation.meeting_id} official URL differs`);
}

const generatedAt = observations.map((row) => row.source.checked_at).sort().at(-1);
const candidate = {
  schema_version: 'timetable-candidate-v1',
  generated_at: generatedAt,
  adapter_id: 'kra-current-2026-09-04-through-2026-09-06-reviewed-a-v1',
  country_id: 'south-korea',
  authority_id: 'korea-racing-authority',
  source_id: 'kra-weekly-start-times',
  technical_capability_rank: 'A',
  publication_ceiling: 'A',
  candidate_window: {
    start_date: '2026-09-04',
    end_date_exclusive: '2026-09-07',
    timezone: 'Asia/Seoul',
  },
  records: observations
    .sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`))
    .map((observation) => ({
      candidate_id: `candidate-${observation.meeting_id}`,
      meeting_id: observation.meeting_id,
      country_id: 'south-korea',
      authority_id: 'korea-racing-authority',
      racing_system_id: 'kra-national-racing-system',
      racecourse_id: observation.racecourse_id,
      date: observation.date,
      timezone: 'Asia/Seoul',
      capability_rank: 'A',
      first_race_time_local: observation.first_race_time_local,
      last_race_time_local: observation.last_race_time_local,
      timetable_rows: observation.timetable_rows.map((row) => ({
        label: row.label,
        post_time_local: row.post_time_local,
      })),
      source: {
        source_id: 'kra-weekly-start-times',
        official_url: 'https://race.kra.co.kr/thisweekrace/ThisWeekBaljuTime.do',
        checked_at: observation.source.checked_at,
        extraction_method: 'adapter_candidate',
      },
      confidence: 'high',
      review_status: 'approved',
      notes: 'Reviewed KRA current timetable from live proof run 33517131024. Public output is bounded to Rank A with Race 1-N labels and post times only.',
    })),
  review: {
    status: 'approved',
    reviewed_at: '2026-09-01T14:50:00Z',
    reviewer: 'badjoke-lab',
    promotion_target: 'canonical-timetable-v0',
  },
  publication_effect: 'reviewed-promotion-unit',
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(candidate, null, 2)}\n`);
console.log(JSON.stringify({ output, meeting_count: candidate.records.length, public_rank: 'A', generated_at: generatedAt }, null, 2));
