import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

function rejectText(source, token, label) {
  if (source.includes(token)) errors.push(`${label} contains forbidden text: ${token}`);
}

const page = read('src/pages/timetable/meetings/[meeting_id].astro');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');
const notes = read('PR-266.md');

for (const token of [
  'getPublicTimetableMeetingDetail',
  'getPublicTimetableMeetingRows',
  'PublicTimetableMeetingDetail',
  'PublicTimetableMeetingRow',
  'detail.effective_public_rank',
  'detail.show_race_name',
  'detail.show_distance',
  'detail.show_surface',
  'detail.show_course',
  'detail.timetable_rows.map',
  'Open official source',
  'Publication boundary',
]) requireText(page, token, 'meeting detail page');

for (const forbidden of [
  'normalizedTimetableMeetingDetails',
  'normalizedTimetableCalendarPreview',
  'getNormalizedTimetableMeetingDetail',
  'createNormalizedTimetableMeetingDetailPath',
  'entries',
  'runners',
  'odds',
  'payouts',
  'predictions',
  'tips',
]) rejectText(page, forbidden, 'meeting detail page');

const details = publicDetails.details ?? [];
const hkjc = details.find((detail) => detail.meeting_id === 'hkjc-sha-tin-racecourse-2026-06-07');
const jra = details.find((detail) => detail.meeting_id === 'jra-tokyo-racecourse-2026-06-07');

if (!hkjc) errors.push('Missing HKJC public detail fixture.');
if (!jra) errors.push('Missing JRA public detail fixture.');

if (hkjc) {
  if (hkjc.effective_public_rank !== 'A+') errors.push('HKJC fixture must remain A+ for detail display test.');
  for (const field of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
    if (hkjc[field] !== true) errors.push(`HKJC fixture must enable ${field}.`);
  }
}

if (jra) {
  if (jra.effective_public_rank !== 'A') errors.push('JRA fixture must remain A for detail display test.');
  for (const row of jra.timetable_rows ?? []) {
    for (const forbidden of ['race_name', 'distance_m', 'surface', 'course_label']) {
      if (forbidden in row) errors.push(`JRA A detail row must not include ${forbidden}.`);
    }
  }
}

for (const token of [
  'Meeting detail pages now read from public meeting-details.',
  'A detail rows show race label and post time only.',
  'A+ detail rows show only policy-approved programme summary fields.',
  'No country page is changed.',
  'No racecourse page is changed.',
  'Next roadmap item is PR-11 legacy display input isolation.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Meeting detail public view check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Meeting detail public view check passed.');
