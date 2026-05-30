import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertExists(relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: required file is missing`);
    return false;
  }
  return true;
}

function assertIncludes(relativePath, text, required) {
  if (!text.includes(required)) fail(`${relativePath}: missing required text: ${required}`);
}

function assertLowerIncludes(relativePath, text, required) {
  if (!text.toLowerCase().includes(required.toLowerCase())) {
    fail(`${relativePath}: missing required phrase: ${required}`);
  }
}

const templatePath = 'docs/runbooks/country-adapter-template.md';
const prPath = 'docs/runbooks/pr-081.md';
const sourceAdapterPath = 'src/lib/timetable/source-adapter.ts';
const templateHelperPath = 'src/lib/timetable/country-adapter-template.ts';

const hasTemplate = assertExists(templatePath);
const hasPr = assertExists(prPath);

if (hasTemplate) {
  const template = read(templatePath);
  for (const phrase of [
    'source inventory',
    'candidate JSON',
    'approved bundle',
    'human review',
    'season gap',
    'no active-window meetings',
    'partial coverage',
    'official source links',
    'storeSourceBody: false',
    'storeRawMarkup: false',
    'publishWithoutReview: false',
    "allowedOutput: 'meeting_level_only'"
  ]) {
    assertLowerIncludes(templatePath, template, phrase);
  }
}

if (hasPr) {
  const pr = read(prPath);
  for (const phrase of [
    'Summary',
    'Files',
    'User-facing outcome: documentation/template only',
    'Safety boundary',
    'M4 usage',
    'Validation commands',
    'Next PR: PR-082 South Korea source inventory + adapter'
  ]) {
    assertIncludes(prPath, pr, phrase);
  }
}

if (assertExists('package.json')) {
  const packageJson = readJson('package.json');
  const scripts = packageJson.scripts ?? {};
  const validateCommand = 'node scripts/check-country-adapter-template.mjs';
  const checkCommand = scripts.check ?? '';
  const releaseGateCommand = 'npm run validate:m3-v0-release-gate';
  const templateCommand = 'npm run validate:country-adapter-template';

  if (scripts['validate:country-adapter-template'] !== validateCommand) {
    fail('package.json: missing validate:country-adapter-template script');
  }
  if (!checkCommand.includes(templateCommand)) {
    fail('package.json: npm run check must include validate:country-adapter-template');
  }
  if (
    checkCommand.includes(releaseGateCommand) &&
    checkCommand.includes(templateCommand) &&
    checkCommand.indexOf(templateCommand) < checkCommand.indexOf(releaseGateCommand)
  ) {
    fail('package.json: validate:country-adapter-template must run after validate:m3-v0-release-gate');
  }
}

if (assertExists(sourceAdapterPath)) {
  const sourceAdapter = read(sourceAdapterPath);
  for (const required of [
    'export interface SafeSourceAdapter',
    'SourceAdapterSafetyPolicy',
    'SourceAdapterInput',
    'TimetableCandidateFile',
    'TimetableCandidateRecord',
    'defaultSafeSourceAdapterSafetyPolicy',
    'storeSourceBody: false',
    'storeRawMarkup: false',
    'publishWithoutReview: false',
    "allowedOutput: 'meeting_level_only'"
  ]) {
    assertIncludes(sourceAdapterPath, sourceAdapter, required);
  }
}

for (const relativePath of [templateHelperPath]) {
  if (!existsSync(path.join(root, relativePath))) continue;
  const text = read(relativePath);
  for (const forbidden of [
    'fetch(',
    'XMLHttpRequest',
    'axios',
    'cheerio',
    'node-fetch',
    'undici',
    'parse5',
    'JSDOM',
    'rawHtml',
    'sourceBody',
    'storeSourceBody: true',
    'storeRawMarkup: true',
    'publishWithoutReview: true'
  ]) {
    if (text.includes(forbidden)) fail(`${relativePath}: no new live-fetch or raw-source implementation marker allowed: ${forbidden}`);
  }
}

if (errors.length) {
  console.error('Country adapter template check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country adapter template check passed.');
