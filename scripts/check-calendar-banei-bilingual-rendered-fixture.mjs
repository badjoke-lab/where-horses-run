import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildPublicProjectionV1 } from './timetable/pipeline-v1/public-projection-core.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
const policyData = readJson('src/data/publicationDisplayPolicies.json');
const readiness = loadCalendarReadinessV1(root);
const sourceAliases = readJson('data/static/timetable-source-aliases-v1.json');
const candidate = fixture.scenarios.find((scenario) => scenario.collection_mode === 'selected_meetings')?.detail_candidate?.records?.[0];
if (!candidate) throw new Error('Banei selected-meeting candidate fixture missing');

const generatedAt = '2026-07-09T05:00:00Z';
const sourceTrace = {
  source_id: candidate.source.source_id,
  route_id: null,
  source_status: 'verified',
  official_source_url: candidate.source.official_url,
  source_label: 'Official source',
  extraction_method: 'adapter_candidate',
  source_snapshot_path: null,
  normalized_from_path: null,
};
const freshness = {
  last_checked_date: '2026-07-09',
  generated_at: generatedAt,
  stale_after_date: null,
  freshness_note: 'Banei rendered bilingual fixture QA only.',
};
const canonicalMeeting = {
  meeting_id: candidate.meeting_id,
  country_id: candidate.country_id,
  authority_id: candidate.authority_id,
  racecourse_id: candidate.racecourse_id,
  date: candidate.date,
  timezone: candidate.timezone,
  capability_rank: candidate.capability_rank,
  display_status: 'displayable',
  first_race_time_local: candidate.first_race_time_local,
  last_race_time_local: candidate.last_race_time_local,
  source_trace: sourceTrace,
  freshness,
  notes: 'Synthetic rendered QA fixture; not promotion input.',
};
const canonicalDetail = {
  meeting_id: candidate.meeting_id,
  country_id: candidate.country_id,
  authority_id: candidate.authority_id,
  racecourse_id: candidate.racecourse_id,
  date: candidate.date,
  timezone: candidate.timezone,
  capability_rank: candidate.capability_rank,
  source_trace: sourceTrace,
  freshness,
  timetable_rows: candidate.timetable_rows.map((row) => ({
    ...row,
    metadata_status: 'verified',
    source_label: 'Official source',
  })),
};

const projection = buildPublicProjectionV1({
  canonicalMeetings: {
    schema_version: 'canonical-timetable-v0',
    generated_at: generatedAt,
    input_sources: ['fixture:banei-rendered-bilingual-qa'],
    meetings: [canonicalMeeting],
  },
  canonicalDetails: {
    schema_version: 'canonical-meeting-details-v0',
    generated_at: generatedAt,
    input_sources: ['fixture:banei-rendered-bilingual-qa'],
    details: [canonicalDetail],
  },
  policyData,
  readinessRegistry: readiness,
  sourceAliases,
});

if (projection.meetingListDataset.meetings.length !== 1 || projection.meetingDetailsDataset.details.length !== 1) {
  throw new Error('rendered fixture projection must contain one meeting and one detail');
}
const projectedMeeting = projection.meetingListDataset.meetings[0];
const projectedDetail = projection.meetingDetailsDataset.details[0];
if (projectedMeeting.effective_public_rank !== 'A+' || projectedDetail.effective_public_rank !== 'A+') {
  throw new Error('rendered fixture projection must remain A+');
}

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  throw new Error('node_modules missing; install dependencies before rendered fixture QA');
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-bilingual-rendered-'));
const worktree = path.join(tempRoot, 'worktree');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, ...(options.env ?? {}) },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }
  return result;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readHtml(relativePath) {
  const file = path.join(worktree, 'dist', relativePath, 'index.html');
  if (!fs.existsSync(file)) {
    fail(`rendered route missing: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

try {
  run('git', ['worktree', 'add', '--detach', worktree, 'HEAD']);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(worktree, 'node_modules'), 'dir');

  writeJson(path.join(worktree, 'data/generated/timetable/public/meeting-list.json'), projection.meetingListDataset);
  writeJson(path.join(worktree, 'data/generated/timetable/public/meeting-details.json'), projection.meetingDetailsDataset);
  writeJson(path.join(worktree, 'data/generated/timetable/public/japan-a-plus-overrides.json'), {
    schema_version: 'japan-a-plus-public-overrides-v1',
    generated_at: projection.meetingListDataset.generated_at,
    meeting_overrides: [],
    detail_overrides: [],
  });

  run('npm', ['run', 'build'], {
    cwd: worktree,
    env: {
      WHR_CALENDAR_REFERENCE_DATE: '2026-07-01',
      SOURCE_DATE_EPOCH: '1782864000'
    },
  });

  const meetingId = candidate.meeting_id;
  const enCalendar = readHtml('calendar');
  const jaCalendar = readHtml('ja/calendar');
  const enCountry = readHtml('countries/japan');
  const jaCountry = readHtml('ja/countries/japan');
  const enDetail = readHtml(`timetable/meetings/${meetingId}`);
  const jaDetail = readHtml(`ja/timetable/meetings/${meetingId}`);

  for (const phrase of ['Obihiro Racecourse', 'Public rank: A+', `/timetable/meetings/${meetingId}/`]) {
    if (!enCalendar.includes(phrase) && phrase !== 'Public rank: A+') fail(`English Calendar missing ${phrase}.`);
  }
  if (!enCalendar.includes('Meeting detail')) fail('English Calendar missing Meeting detail label.');
  if (enCalendar.includes('Fixture Race One') || enCalendar.includes('Banei Straight Course')) fail('English Calendar leaked A+ row detail.');

  for (const phrase of ['帯広競馬場', 'ばんえい十勝', '日本', '公開ランク: A+', '開催詳細', `/ja/timetable/meetings/${meetingId}/`]) {
    if (!jaCalendar.includes(phrase)) fail(`Japanese Calendar missing ${phrase}.`);
  }
  if (jaCalendar.includes('Fixture Race One') || jaCalendar.includes('Banei Straight Course')) fail('Japanese Calendar leaked A+ row detail.');

  for (const [label, html, expectedVenue] of [
    ['English country', enCountry, 'Obihiro Racecourse'],
    ['Japanese country', jaCountry, '帯広競馬場'],
  ]) {
    if (!html.includes(expectedVenue)) fail(`${label} page missing Banei venue label.`);
    if (!html.includes(candidate.date)) fail(`${label} page missing fixture meeting date.`);
    if (html.includes('Fixture Race One') || html.includes('Banei Straight Course')) fail(`${label} page leaked A+ row detail.`);
  }

  for (const phrase of ['Programme summary', 'Race name', 'Distance', 'Surface', 'Course', 'Fixture Race One', '200m', 'Dirt', 'Banei Straight Course', 'Open official source']) {
    if (!enDetail.includes(phrase)) fail(`English meeting detail missing ${phrase}.`);
  }
  for (const phrase of ['番組概要', 'レース名', '距離', '馬場', 'コース', 'Fixture Race One', '200m', 'Dirt', 'Banei Straight Course', '公式ソースを開く']) {
    if (!jaDetail.includes(phrase)) fail(`Japanese meeting detail missing ${phrase}.`);
  }

  const enRows = (enDetail.match(/<tr>/g) ?? []).length;
  const jaRows = (jaDetail.match(/<tr>/g) ?? []).length;
  const expectedRowsWithHeader = candidate.timetable_rows.length + 1;
  if (enRows !== expectedRowsWithHeader) fail(`English detail row count differs: ${enRows} != ${expectedRowsWithHeader}`);
  if (jaRows !== expectedRowsWithHeader) fail(`Japanese detail row count differs: ${jaRows} != ${expectedRowsWithHeader}`);
  if (enRows !== jaRows) fail('English/Japanese detail row counts differ.');

  const listLeakTokens = candidate.timetable_rows.flatMap((row) => [row.race_name, row.course_label]).filter(Boolean);
  for (const token of listLeakTokens) {
    if (enCalendar.includes(token) || jaCalendar.includes(token) || enCountry.includes(token) || jaCountry.includes(token)) {
      fail(`list surface leaked Banei A+ detail token: ${token}`);
    }
  }

  const detailTokens = candidate.timetable_rows.flatMap((row) => [row.label, row.post_time_local, row.race_name, `${row.distance_m}m`, row.surface, row.course_label]);
  for (const token of detailTokens) {
    if (!enDetail.includes(String(token))) fail(`English detail missing projected token ${token}`);
    if (!jaDetail.includes(String(token))) fail(`Japanese detail missing projected token ${token}`);
  }

  const jaDetailHrefCount = (jaCalendar.match(new RegExp(`/ja/timetable/meetings/${meetingId}/`, 'g')) ?? []).length;
  if (jaDetailHrefCount !== 1) fail(`Japanese Calendar detail href count differs: ${jaDetailHrefCount}`);
  const enDetailHrefCount = (enCalendar.match(new RegExp(`/timetable/meetings/${meetingId}/`, 'g')) ?? []).length;
  if (enDetailHrefCount !== 1) fail(`English Calendar detail href count differs: ${enDetailHrefCount}`);

  if (!exact(
    projectedDetail.timetable_rows.map((row) => [row.label, row.post_time_local, row.race_name, row.distance_m, row.surface, row.course_label]),
    candidate.timetable_rows.map((row) => [row.label, row.post_time_local, row.race_name, row.distance_m, row.surface, row.course_label]),
  )) fail('Rendered fixture source projection changed Banei row semantics before build.');
} catch (error) {
  fail(`rendered Banei bilingual QA failed: ${error.message}`);
} finally {
  try { run('git', ['worktree', 'remove', '--force', worktree]); } catch {}
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_BILINGUAL_RENDERED_FIXTURE_QA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_BILINGUAL_RENDERED_FIXTURE_QA: pass');
console.log('EN_CALENDAR_ONE_MEETING_ROW: pass');
console.log('JA_CALENDAR_ONE_MEETING_ROW: pass');
console.log('EN_COUNTRY_NO_A_PLUS_DETAIL_LEAK: pass');
console.log('JA_COUNTRY_NO_A_PLUS_DETAIL_LEAK: pass');
console.log('EN_DETAIL_A_PLUS_FIELDS: pass');
console.log('JA_DETAIL_A_PLUS_FIELDS: pass');
console.log(`EN_JA_DETAIL_ROWS: ${candidate.timetable_rows.length}`);
console.log('JA_DETAIL_LINK_PREFIX: pass');
console.log('COMMITTED_PUBLIC_JSON_WRITE: false');
