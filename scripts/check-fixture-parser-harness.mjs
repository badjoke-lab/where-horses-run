import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseSimpleFixtureHtml } from './lib/parse-simple-fixture.mjs';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return null;
  }
}

function collectFixtureDirs(dir) {
  if (!existsSync(dir)) return [];

  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (!statSync(fullPath).isDirectory()) continue;

    const inputPath = path.join(fullPath, 'input.html');
    const expectedPath = path.join(fullPath, 'expected.json');

    if (existsSync(inputPath) || existsSync(expectedPath)) {
      results.push(path.relative(root, fullPath));
    }

    results.push(...collectFixtureDirs(fullPath));
  }

  return [...new Set(results)].sort();
}

function sourceUrlMap() {
  const sources = readJson('data/static/sources.json') ?? [];
  const map = {};
  for (const source of sources) {
    if (
      source &&
      typeof source.id === 'string' &&
      typeof source.url === 'string'
    ) {
      map[source.id] = source.url;
    }
  }
  return map;
}

function validateFixture(fixtureDir, sourceUrlById) {
  const inputPath = path.join(fixtureDir, 'input.html');
  const expectedPath = path.join(fixtureDir, 'expected.json');

  if (!existsSync(path.join(root, inputPath))) {
    fail(`${fixtureDir}: missing input.html`);
    return;
  }

  if (!existsSync(path.join(root, expectedPath))) {
    fail(`${fixtureDir}: missing expected.json`);
    return;
  }

  const html = readFileSync(path.join(root, inputPath), 'utf8');
  const expected = readJson(expectedPath);
  if (!expected) return;

  const actual = parseSimpleFixtureHtml(html, {
    sourceUrlById
  });

  if (!isDeepStrictEqual(actual, expected)) {
    fail(`${fixtureDir}: parser output does not match expected.json`);
    fail(`${fixtureDir}: actual=${JSON.stringify(actual, null, 2)}`);
    fail(`${fixtureDir}: expected=${JSON.stringify(expected, null, 2)}`);
  }
}

const fixtureDirs = collectFixtureDirs(path.join(root, 'fixtures/parser'));
const sourceUrlById = sourceUrlMap();

if (fixtureDirs.length === 0) {
  fail('fixtures/parser: no parser fixture directories found');
}

for (const fixtureDir of fixtureDirs) {
  validateFixture(fixtureDir, sourceUrlById);
}

if (errors.length) {
  console.error('Fixture parser harness check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Fixture parser harness check passed for ${fixtureDirs.length} fixture(s).`);
