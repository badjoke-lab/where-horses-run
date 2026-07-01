import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = 'data/generated/timetable/jra-planned-program-intake.json';
const check = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');
if (check && dryRun) throw new Error('--check and --dry-run are mutually exclusive.');

const programme = [
  {
    date: '2026-07-04',
    official_url: 'https://www.jra.go.jp/keiba/calendar2026/2026/7/0704.html',
    meetings: [
      ['fukushima-racecourse', 'Fukushima', '2回福島3日', ['10:05','10:40','11:10','11:40','12:30','13:00','13:30','14:00','14:35','15:10','15:45','16:30']],
      ['kokura-racecourse', 'Kokura', '2回小倉3日', ['09:55','10:30','11:00','11:30','12:20','12:50','13:20','13:50','14:20','14:55','15:30','16:15']],
      ['hakodate-racecourse', 'Hakodate', '1回函館7日', ['09:50','10:20','10:50','11:20','12:10','12:40','13:10','13:40','14:10','14:45','15:20','16:05']]
    ]
  },
  {
    date: '2026-07-05',
    official_url: 'https://www.jra.go.jp/keiba/calendar2026/2026/7/0705.html',
    meetings: [
      ['fukushima-racecourse', 'Fukushima', '2回福島4日', ['09:55','10:30','11:00','11:30','12:20','12:50','13:20','13:50','14:20','14:55','15:30','16:15']],
      ['kokura-racecourse', 'Kokura', '2回小倉4日', ['10:05','10:40','11:10','11:40','12:30','13:00','13:30','14:00','14:35','15:10','15:45','16:30']],
      ['hakodate-racecourse', 'Hakodate', '1回函館8日', ['09:50','10:20','10:50','11:20','12:10','12:40','13:10','13:40','14:10','14:45','15:20','16:05']]
    ]
  }
];

const records = programme.flatMap((day) => day.meetings.map(([racecourseId, racecourseName, meetingLabelJa, times]) => ({
  meeting_id: `jra-${racecourseId}-${day.date}`,
  country_id: 'japan',
  authority_id: 'jra',
  racing_system_id: 'japan-jra-system',
  racecourse_id: racecourseId,
  racecourse_name: racecourseName,
  meeting_label_ja: meetingLabelJa,
  date: day.date,
  timezone: 'Asia/Tokyo',
  source_stage: 'planned_program',
  promotion_eligible: false,
  first_race_time_local: times[0],
  last_race_time_local: times.at(-1),
  timetable_rows: times.map((postTime, index) => ({
    label: `Race ${index + 1}`,
    post_time_local: postTime,
    race_name: null,
    distance_m: null,
    surface: null,
    course_label: null
  })),
  source: {
    source_id: 'jra-programme',
    official_url: day.official_url,
    checked_at: '2026-07-01T00:00:00.000Z',
    acquisition_method: 'human_reviewed_official_programme'
  }
})));

const intake = {
  schema_version: 'jra-planned-program-intake-v1',
  work_id: 'WHR-CAL-JAPAN-JRA',
  generated_at: '2026-07-01T00:00:00.000Z',
  source_stage: 'planned_program',
  source_stage_note: 'Official JRA programme pages are advance schedules. Final confirmation is required from the race menu after the normal Thursday 16:00 publication window.',
  final_confirmation_after: '2026-07-02T16:00:00+09:00',
  review_status: 'needs_final_confirmation',
  promotion_eligible: false,
  records,
  boundaries: {
    source_body_stored: false,
    participant_data_stored: false,
    betting_data_stored: false,
    result_data_stored: false,
    candidate_generated: false,
    canonical_written: false,
    public_projection_written: false
  }
};

const serialized = `${JSON.stringify(intake, null, 2)}\n`;
if (dryRun) {
  console.log(JSON.stringify({ records: records.length, rows: records.reduce((sum, record) => sum + record.timetable_rows.length, 0), source_stage: intake.source_stage, promotion_eligible: intake.promotion_eligible }, null, 2));
  process.exit(0);
}
const absoluteOutput = path.join(root, outputPath);
if (check) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error('JRA planned-program intake is stale.');
  console.log('JRA_PLANNED_PROGRAM_INTAKE: current');
  process.exit(0);
}
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`JRA_PLANNED_PROGRAM_INTAKE: wrote records=${records.length}`);
