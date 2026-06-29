import fs from 'node:fs';
import zlib from 'node:zlib';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const writeJson = (path, value) => fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const decode = (path) => {
  const encoded = fs.readFileSync(path, 'utf8').trim();
  const value = JSON.parse(zlib.inflateSync(Buffer.from(encoded, 'base64')).toString('utf8'));
  return Array.isArray(value) ? value : value.records;
};

const authorityPath = 'data/static/authority-source-inventory.json';
const registryPath = 'data/static/calendar-readiness-registry.json';
const authority = readJson(authorityPath);
const registry = readJson(registryPath);
const authorityAdditions = decode('.tmp/calendar-readiness-authority-additions-37-52.zlib.b64');
const readinessAdditions = decode('.tmp/calendar-readiness-record-additions-37-52.zlib.b64');

if (authority.records.length !== 52 || authorityAdditions.length !== 18) throw new Error('Unexpected authority record counts');
if (registry.records.length !== 51 || readinessAdditions.length !== 19) throw new Error('Unexpected readiness record counts');

authority.records.push(...authorityAdditions);
registry.records.push(...readinessAdditions);
registry.bootstrap_status = 'complete';
registry.programme_state = {
  country_target: 98,
  countries_with_closed_decision: 52,
  readiness_records: 70,
  next_backfill_work_ids: ['WHR-ST2-53-60'],
};

if (authority.records.length !== 70 || registry.records.length !== 70) throw new Error('Final record counts are invalid');
writeJson(authorityPath, authority);
writeJson(registryPath, registry);
console.log('MATERIALIZED_CALENDAR_BACKFILL_DATA authority=70 readiness=70 countries=52');
