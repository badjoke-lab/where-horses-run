import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const timetables = JSON.parse(readFileSync(path.join(root, 'data/generated/timetables.json'), 'utf8'));

const allowedKeys = new Set([
  'country_id',
  'racecourse_id',
  'racecourse_name',
  'date',
  'start_time_local',
  'timezone',
  'racing_type',
  'source_id',
  'source_url',
  'last_checked_at',
  'status',
  'confidence',
  'notes',
]);

const requiredKeys = [
  'country_id',
  'date',
  'racecourse_name',
  'source_url',
  'last_checked_at',
  'status',
  'confidence',
];

const forbiddenKeyPatterns = [
  /racecard/i,
  /card_body/i,
  /entries?/i,
  /horses?/i,
  /jockeys?/i,
  /odds?/i,
  /results?/i,
  /payouts?/i,
  /dividends?/i,
  /predictions?/i,
  /tips?/i,
  /raw[_-]?html/i,
  /html[_-]?body/i,
  /body[_-]?text/i,
  /page[_-]?content/i,
  /response[_-]?body/i,
  /official[_-]?page[_-]?content/i,
];

const forbiddenTextPatterns = [
  /racecard/i,
  /card body/i,
  /\bentries?\b/i,
  /\bhorses?\b/i,
  /\bjockeys?\b/i,
  /\bodds?\b/i,
  /\bresults?\b/i,
  /\bpayouts?\b/i,
  /\bdividends?\b/i,
  /\bpredictions?\b/i,
  /\btips?\b/i,
  /betting advice/i,
  /<\s*html\b/i,
  /<\s*body\b/i,
  /<\s*script\b/i,
  /<\s*table\b/i,
  /<!doctype\s+html/i,
];

function fail(message) {
  errors.push(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkForbiddenKey(key, label) {
  for (const pattern of forbiddenKeyPatterns) {
    if (pattern.test(key)) fail(`${label}: forbidden key '${key}'`);
  }
}

function checkForbiddenText(value, label) {
  if (typeof value !== 'string') return;
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(value)) fail(`${label}: forbidden text marker '${pattern}'`);
  }
}

function walk(value, label) {
  checkForbiddenText(value, label);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${label}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    checkForbiddenKey(key, `${label}.${key}`);
    walk(nestedValue, `${label}.${key}`);
  }
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
  }
}

function requireUrl(value, label) {
  requireNonEmptyString(value, label);
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'jra.jp') {
      fail(`${label}: expected official HTTPS JRA URL`);
    }
  } catch {
    fail(`${label}: invalid URL`);
  }
}

const records = Array.isArray(timetables.records) ? timetables.records : [];
const japanRecords = records.filter((record) => record?.country_id === 'japan');
const hongKongRecords = records.filter((record) => record?.country_id === 'hong-kong');

if (japanRecords.length < 1) {
  fail('timetables.records: expected at least one Japan timetable record');
}

if (hongKongRecords.length < 1) {
  fail('timetables.records: expected existing Hong Kong timetable records to remain');
}

japanRecords.forEach((record, index) => {
  const label = `japanRecords[${index}]`;

  if (!isPlainObject(record)) {
    fail(`${label}: expected object`);
    return;
  }

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) fail(`${label}.${key}: unsupported Japan timetable field`);
  }

  walk(record, label);

  for (const key of requiredKeys) {
    if (!(key in record)) fail(`${label}.${key}: required`);
  }

  if (record.country_id !== 'japan') fail(`${label}.country_id: expected japan`);
  if (record.source_id !== 'japan-jra-home') fail(`${label}.source_id: expected japan-jra-home`);
  if (record.timezone !== 'Asia/Tokyo') fail(`${label}.timezone: expected Asia/Tokyo`);

  requireNonEmptyString(record.date, `${label}.date`);
  requireNonEmptyString(record.racecourse_name, `${label}.racecourse_name`);
  requireUrl(record.source_url, `${label}.source_url`);
  requireNonEmptyString(record.last_checked_at, `${label}.last_checked_at`);
  requireNonEmptyString(record.status, `${label}.status`);
  requireNonEmptyString(record.confidence, `${label}.confidence`);
});

if (errors.length) {
  console.error('Japan real timetable seed check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan real timetable seed check passed.');
