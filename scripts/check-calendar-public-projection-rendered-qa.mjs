import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/calendar-public-projection-release-v1.json');
const meetingList = parse('data/generated/timetable/public/meeting-list.json');
const meetingDetails = parse('data/generated/timetable/public/meeting-details.json');

function listHtml(directory, result = []) {
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) listHtml(full, result);
    else if (entry.endsWith('.html')) result.push(full);
  }
  return result;
}

function assertHtml(relativePath, markers = []) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`missing rendered page ${relativePath}`);
    return '';
  }
  const html = readFileSync(absolute, 'utf8');
  if (html.length < 500) fail(`${relativePath} is unexpectedly small`);
  for (const marker of markers) if (!html.includes(marker)) fail(`${relativePath} missing marker ${marker}`);
  for (const marker of ['[object Object]', '>undefined<', '>NaN<', 'Internal Server Error']) {
    if (html.includes(marker)) fail(`${relativePath} contains render error marker ${marker}`);
  }
  return html;
}

for (const route of [
  'dist/calendar/index.html',
  'dist/ja/calendar/index.html',
  'dist/today/index.html',
  'dist/ja/today/index.html',
  'dist/tomorrow/index.html',
  'dist/ja/tomorrow/index.html'
]) {
  assertHtml(route, ['<!DOCTYPE html']);
}

const detailById = new Map(meetingDetails.details.map((detail) => [detail.meeting_id, detail]));
for (const meeting of meetingList.meetings) {
  const hasDetail = detailById.has(meeting.meeting_id);
  if (Boolean(meeting.detail_path) !== hasDetail) fail(`${meeting.meeting_id} detail_path mismatch before rendered QA`);
  if (!hasDetail) continue;

  const detailPath = `dist/timetable/meetings/${meeting.meeting_id}/index.html`;
  const html = assertHtml(detailPath, [
    `Public rank: ${meeting.effective_public_rank}`,
    'Public-safe race timetable',
    'Open official source'
  ]);
  const detail = detailById.get(meeting.meeting_id);
  for (const row of detail.timetable_rows) {
    if (!html.includes(`>${row.label}<`)) fail(`${detailPath} does not render row label ${row.label}`);
    if (!html.includes(`>${row.post_time_local}<`)) fail(`${detailPath} does not render post time ${row.post_time_local}`);
  }

  if (detail.effective_public_rank === 'A') {
    for (const header of ['<th>Race name</th>', '<th>Distance</th>', '<th>Surface</th>', '<th>Course</th>']) {
      if (html.includes(header)) fail(`${detailPath} renders A+ table header at public rank A: ${header}`);
    }
  }
}

const htmlFiles = listHtml(path.join(root, 'dist'));
const combinedHtml = htmlFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
for (const meetingId of audit.meetings.removed_ids) {
  if (combinedHtml.includes(meetingId)) fail(`removed link-only meeting ID leaked into rendered HTML: ${meetingId}`);
  const detailPath = path.join(root, 'dist', 'timetable', 'meetings', meetingId, 'index.html');
  if (existsSync(detailPath)) fail(`removed link-only meeting still has a rendered detail route: ${meetingId}`);
}

for (const detail of meetingDetails.details) {
  if (!['A', 'A+'].includes(detail.effective_public_rank)) fail(`${detail.meeting_id} rendered detail rank is below A`);
  if (detail.effective_public_rank === 'A') {
    if (detail.show_race_name || detail.show_distance || detail.show_surface || detail.show_course) {
      fail(`${detail.meeting_id} A detail has A+ display flags`);
    }
    for (const row of detail.timetable_rows) {
      const extra = Object.keys(row).filter((key) => !['label', 'post_time_local'].includes(key));
      if (extra.length) fail(`${detail.meeting_id} A detail row contains optional fields: ${extra.join(', ')}`);
    }
  }
}

if (audit.boundaries.forbidden_key_findings.length !== 0) fail('release audit contains forbidden key findings');
if (audit.after.meeting_count !== meetingList.meetings.length) fail('release audit meeting count differs from public JSON');
if (audit.after.detail_count !== meetingDetails.details.length) fail('release audit detail count differs from public JSON');
if (audit.details.optional_field_occurrence_delta.race_name !== -57) fail('expected reviewed race_name removal count changed');
if (audit.details.optional_field_occurrence_delta.distance_m !== -57) fail('expected reviewed distance removal count changed');

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_PROJECTION_RENDERED_QA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_PUBLIC_PROJECTION_RENDERED_QA: pass html_files=${htmlFiles.length} meetings=${meetingList.meetings.length} details=${meetingDetails.details.length}`);
console.log(`REMOVED_LINK_ONLY_MEETINGS: ${audit.meetings.removed_ids.length}`);
console.log('BILINGUAL_CORE_ROUTES: pass');
console.log('A_PLUS_FIELD_LEAKS: 0');
