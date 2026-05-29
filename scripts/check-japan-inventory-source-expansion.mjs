import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const inventory = readJson('data/static/country-racing-inventory.json');
const japan = inventory.countries.find((country) => country.country_id === 'japan');

if (!japan) {
  fail('Japan inventory entry is required.');
}

if (japan?.overall_coverage_status !== 'initial_seed_only') {
  fail('Japan must remain initial_seed_only until actual active timetable coverage is added and reviewed.');
}

for (const forbiddenClaim of ['Japan complete', 'NAR covered', 'Banei covered', 'NAR calendar covered', 'Banei calendar covered']) {
  if (!japan?.must_not_claim?.includes(forbiddenClaim)) {
    fail(`Japan must_not_claim must include: ${forbiddenClaim}`);
  }
}

const systems = new Map((japan?.racing_systems ?? []).map((system) => [system.system_id, system]));
const jra = systems.get('jra');
const nar = systems.get('nar');
const banei = systems.get('banei');

if (!jra || !nar || !banei) {
  fail('Japan inventory must include jra, nar, and banei systems.');
}

const requiredNarRacecourses = [
  'obihiro-racecourse',
  'monbetsu-racecourse',
  'morioka-racecourse',
  'mizusawa-racecourse',
  'urawa-racecourse',
  'funabashi-racecourse',
  'oi-racecourse',
  'kawasaki-racecourse',
  'kanazawa-racecourse',
  'kasamatsu-racecourse',
  'nagoya-racecourse',
  'sonoda-racecourse',
  'himeji-racecourse',
  'kochi-racecourse',
  'saga-racecourse',
];

const narRacecourses = new Set((nar?.racecourses ?? []).map((racecourse) => racecourse.racecourse_id));
for (const racecourseId of requiredNarRacecourses) {
  if (!narRacecourses.has(racecourseId)) {
    fail(`NAR inventory is missing ${racecourseId}.`);
  }
}

if ((nar?.racecourses ?? []).length !== requiredNarRacecourses.length) {
  fail(`NAR inventory must list exactly ${requiredNarRacecourses.length} racecourses for this PR.`);
}

for (const racecourse of nar?.racecourses ?? []) {
  if (!racecourse.name_ja) {
    fail(`NAR racecourse ${racecourse.racecourse_id} must include name_ja.`);
  }
  if (!String(racecourse.guide_url ?? '').startsWith('https://www.keiba.go.jp/guide/')) {
    fail(`NAR racecourse ${racecourse.racecourse_id} must include an official keiba.go.jp guide_url.`);
  }
}

if (nar?.coverage_status !== 'not_started') {
  fail('NAR coverage_status must remain not_started because no timetable records are added.');
}
if (!String(nar?.coverage_notes ?? '').includes('Racecourse inventory alone must not be treated as NAR calendar coverage')) {
  fail('NAR coverage_notes must explicitly state that racecourse inventory alone is not calendar coverage.');
}
if (!nar?.official_sources?.some((source) => source.source_id === 'japan-nar-racecourse-guide')) {
  fail('NAR official_sources must include japan-nar-racecourse-guide.');
}

if (banei?.coverage_status !== 'not_started') {
  fail('Banei coverage_status must remain not_started because no timetable records are added.');
}
if (!banei?.official_sources?.some((source) => source.source_id === 'japan-banei-monthly-schedule')) {
  fail('Banei official_sources must include japan-banei-monthly-schedule.');
}
if ((banei?.racecourses ?? []).length !== 1 || banei?.racecourses?.[0]?.racecourse_id !== 'obihiro-racecourse') {
  fail('Banei must remain mapped to Obihiro only.');
}
if (!String(banei?.coverage_notes ?? '').includes('No Banei timetable records have been added yet')) {
  fail('Banei coverage_notes must explicitly state that no Banei timetable records have been added.');
}

if (errors.length) {
  console.error('Japan inventory source expansion check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan inventory source expansion check passed.');
