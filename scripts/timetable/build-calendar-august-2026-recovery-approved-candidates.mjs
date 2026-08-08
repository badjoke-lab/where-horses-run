import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const artifactRoot = path.resolve(args.get('--artifact-root') ?? '/tmp/calendar-recovery');
const reviewedAt = args.get('--reviewed-at') ?? '2026-08-08T14:15:00Z';
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(artifactRoot, relativePath), 'utf8'));
const write = (relativePath, value) => {
  const output = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
};
const canonicalJraUrl = (value) => String(value).replace(/^https:\/\/jra\.jp\//, 'https://www.jra.go.jp/');

const jra = read('jra/source-snapshot.json');
const nar = read('nar/candidates.json');
const b8 = read('banei/2026-08/candidates.json');
const b9 = read('banei/2026-09/candidates.json');
const hkjc = read('hkjc/candidates.json');

const jraRecords = jra.observations.flatMap((observation) => observation.meetings ?? [])
  .filter((meeting) => meeting.date > '2026-08-17' && meeting.date <= '2026-09-06')
  .sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`))
  .map((meeting) => ({
    candidate_id: `approved-${meeting.meeting_id}`,
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: 'jra',
    racing_system_id: 'japan-jra-system',
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: 'jra-programme',
      official_url: canonicalJraUrl(meeting.official_source_url),
      checked_at: jra.generated_at,
      extraction_method: 'reviewed_snapshot',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Official JRA programme confirms the meeting date and racecourse identity. Published recovery is intentionally capped at Rank C; collected race times and programme rows are not promoted by this envelope.',
  }));
const jraApproved = {
  schema_version: 'timetable-candidate-v1',
  generated_at: jra.generated_at,
  adapter_id: 'jra-august-2026-rolling-horizon-reviewed-promotion-v1',
  country_id: 'japan', authority_id: 'jra', source_id: 'jra-programme',
  candidate_window: { start_date: '2026-08-18', end_date_exclusive: '2026-09-07', timezone: 'Asia/Tokyo' },
  records: jraRecords,
  review: { status: 'approved', reviewed_at: reviewedAt, reviewer: 'badjoke-lab', summary: `Approved ${jraRecords.length} Rank C JRA meeting identities from official programme pages through September 6; collected programme detail is intentionally not promoted.`, promotion_target: 'canonical-timetable-v0' },
};

const narRecords = nar.records.map((record) => ({
  candidate_id: `approved-${record.meeting_id}`,
  meeting_id: record.meeting_id,
  country_id: 'japan', authority_id: 'nar-local-government-racing', racing_system_id: 'japan-nar-system',
  racecourse_id: record.racecourse_id, date: record.date, timezone: 'Asia/Tokyo',
  capability_rank: 'C', first_race_time_local: null, last_race_time_local: null, timetable_rows: [],
  source: { source_id: 'nar-monthly-schedule-grid', official_url: record.official_source_url, checked_at: nar.generated_at, extraction_method: 'adapter_candidate' },
  confidence: 'high', review_status: 'approved',
  notes: 'Approved from the official NAR August/September 2026 monthly schedule. Meeting date and racecourse only; race times and programme detail are not promoted.',
}));
const narApproved = {
  schema_version: 'timetable-candidate-v1', generated_at: nar.generated_at,
  adapter_id: 'nar-august-2026-rolling-horizon-reviewed-schedule-promotion-v1',
  country_id: 'japan', authority_id: 'nar-local-government-racing', source_id: 'nar-monthly-schedule-grid',
  candidate_window: { start_date: '2026-08-18', end_date_exclusive: '2026-09-07', timezone: 'Asia/Tokyo' },
  records: narRecords,
  review: { status: 'approved', reviewed_at: reviewedAt, reviewer: 'badjoke-lab', summary: `Approved ${narRecords.length} Rank C NAR meeting identities from official August/September monthly schedules through September 6.`, promotion_target: 'canonical-timetable-v0' },
};

const baneiRecords = [b8, b9].flatMap((source) => source.meetings
  .filter((meeting) => meeting.date > '2026-08-17' && meeting.date <= '2026-09-06')
  .map((meeting) => ({
    candidate_id: `approved-${meeting.meeting_id}`,
    meeting_id: meeting.meeting_id,
    country_id: 'japan', authority_id: 'banei-tokachi', racing_system_id: 'japan-banei-system', racecourse_id: 'obihiro-racecourse',
    date: meeting.date, timezone: 'Asia/Tokyo', capability_rank: 'C', first_race_time_local: null, last_race_time_local: null, timetable_rows: [],
    source: { source_id: 'banei-official-schedule', official_url: source.source.official_schedule_url, checked_at: source.generated_at, extraction_method: 'adapter_candidate' },
    confidence: 'low', review_status: 'approved',
    notes: 'Approved official Banei monthly-schedule meeting identity. No race times or programme rows are claimed; ordinary automated Banei refresh remains disabled.',
  }))).sort((a, b) => a.date.localeCompare(b.date));
const baneiApproved = {
  schema_version: 'timetable-candidate-v1', generated_at: [b8.generated_at, b9.generated_at].sort().at(-1),
  adapter_id: 'banei-august-2026-rolling-horizon-reviewed-schedule-promotion-v1',
  country_id: 'japan', authority_id: 'banei-tokachi', source_id: 'banei-official-schedule',
  candidate_window: { start_date: '2026-08-18', end_date_exclusive: '2026-09-07', timezone: 'Asia/Tokyo' },
  records: baneiRecords,
  review: { status: 'approved', reviewed_at: reviewedAt, reviewer: 'badjoke-lab', summary: `Approved ${baneiRecords.length} Rank C Banei Obihiro meeting identities from official August/September schedules; ordinary automated Banei refresh remains disabled.`, promotion_target: 'canonical-timetable-v0' },
};

const hkjcRecords = hkjc.records.map((record) => ({
  candidate_id: `approved-${record.meeting_id}`,
  meeting_id: record.meeting_id,
  country_id: 'hong-kong', authority_id: 'hkjc', racing_system_id: 'hong-kong-hkjc-system', racecourse_id: record.racecourse_id,
  date: record.date, timezone: 'Asia/Hong_Kong', capability_rank: 'C', first_race_time_local: null, last_race_time_local: null, timetable_rows: [],
  source: { source_id: 'hkjc-fixture-list', official_url: record.source.official_url, checked_at: record.source.checked_at, extraction_method: 'adapter_candidate' },
  confidence: 'high', review_status: 'approved',
  notes: 'Official HKJC fixture confirms the September 6 Sha Tin meeting identity. Recovery is capped at Rank C; no race times or programme rows are claimed.',
}));
const hkjcApproved = {
  schema_version: 'timetable-candidate-v1', generated_at: hkjc.generated_at,
  adapter_id: 'hkjc-september-2026-season-wakeup-reviewed-promotion-v1',
  country_id: 'hong-kong', authority_id: 'hkjc', source_id: 'hkjc-fixture-list',
  candidate_window: { start_date: '2026-09-06', end_date_exclusive: '2026-09-07', timezone: 'Asia/Hong_Kong' },
  records: hkjcRecords,
  review: { status: 'approved', reviewed_at: reviewedAt, reviewer: 'badjoke-lab', summary: 'Approved the September 6 Sha Tin season-opening meeting identity at Rank C from the official HKJC fixture.', promotion_target: 'canonical-timetable-v0' },
};

const outputs = [
  ['data/candidates/jra-horizon-recovery-2026-08-18-through-2026-09-06-approved.json', jraApproved, 18],
  ['data/candidates/nar-horizon-recovery-2026-08-18-through-2026-09-06-approved.json', narApproved, 69],
  ['data/candidates/banei-horizon-recovery-2026-08-18-through-2026-09-06-approved.json', baneiApproved, 8],
  ['data/candidates/hkjc-horizon-recovery-2026-09-06-approved.json', hkjcApproved, 1],
];
const ids = [];
for (const [file, value, expected] of outputs) {
  if (value.records.length !== expected) throw new Error(`${file}: expected ${expected}, got ${value.records.length}`);
  for (const record of value.records) {
    ids.push(record.meeting_id);
    if (record.capability_rank !== 'C' || record.first_race_time_local !== null || record.last_race_time_local !== null || record.timetable_rows.length !== 0) throw new Error(`${record.meeting_id}: exceeds Rank C`);
  }
  write(file, value);
}
if (ids.length !== 96 || new Set(ids).size !== 96) throw new Error(`recovery identity total differs: ${ids.length}/${new Set(ids).size}`);

const evidenceRoot = 'data/generated/timetable/horizon-recovery-2026-08-08';
fs.mkdirSync(evidenceRoot, { recursive: true });
for (const [source, destination] of [
  ['jra/collection-report.json', 'jra-collection-report.json'],
  ['nar/collection-report.json', 'nar-collection-report.json'],
  ['banei/2026-08/collection-report.json', 'banei-august-collection-report.json'],
  ['banei/2026-09/collection-report.json', 'banei-september-collection-report.json'],
  ['hkjc/collection-report.json', 'hkjc-collection-report.json'],
  ['hkjc/coverage-observation.json', 'hkjc-coverage-observation.json'],
  ['planner/live-state.json', 'planner-live-state.json'],
  ['planner/due-job-plan.json', 'planner-due-job-plan.json'],
]) fs.copyFileSync(path.join(artifactRoot, source), path.join(evidenceRoot, destination));

console.log('AUG8_APPROVED_CANDIDATES: JRA=18 NAR=69 BANEI=8 HKJC=1 TOTAL=96');
