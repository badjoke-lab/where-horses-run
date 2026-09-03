import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { compileRunnerExecutionV1 } from './runner-compatibility.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
function splitByMonth(startDate, endDateExclusive) {
  const windows = [];
  let cursor = startDate;
  while (cursor < endDateExclusive) {
    const [year, month] = cursor.split('-').map(Number);
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const end = nextMonth < endDateExclusive ? nextMonth : endDateExclusive;
    windows.push({ start_date: cursor, end_date_exclusive: end, timezone: 'Asia/Hong_Kong' });
    cursor = end;
  }
  return windows;
}
function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(), encoding: 'utf8', maxBuffer: 30 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed: ${(result.stderr || result.stdout || '').slice(0, 8000)}`);
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const registry = loadCalendarAcquisitionRegistryV1(process.cwd());
const compatibility = JSON.parse(fs.readFileSync('data/static/calendar-runner-compatibility-contract-v1.json', 'utf8'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-window-'));
const generatedAt = new Date().toISOString();
const runToken = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
const collected = [];
try {
  const windows = splitByMonth(startDate, endDateExclusive);
  for (let index = 0; index < windows.length; index += 1) {
    const scope = windows[index];
    const job = {
      schema_version: 'calendar-collection-job-v1',
      job_id: `hkjc-official-window-${runToken}-${index + 1}`,
      campaign_id: `hkjc-official-window-${startDate}`,
      system_id: 'hong-kong-hkjc-system',
      runner_policy: { mode: 'exact', runner: 'github_actions' },
      collection_mode: 'date_window',
      requested_scope: scope,
      rank_strategy: 'best_available',
      target_rank: null,
      reason: 'regular_refresh',
      requested_at: generatedAt,
    };
    const batchId = `hkjc-official-window-${runToken}-${String(index + 1).padStart(2, '0')}`;
    const execution = compileRunnerExecutionV1(job, { batch_id: batchId }, registry, compatibility);
    const jobPath = path.join(temp, `${batchId}-job.json`);
    const executionPath = path.join(temp, `${batchId}-execution.json`);
    const statusPath = path.join(temp, `${batchId}-status.json`);
    fs.writeFileSync(jobPath, `${JSON.stringify(job, null, 2)}\n`);
    fs.writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`);
    runNode('scripts/timetable/run-calendar-actions-job.mjs', [
      `--job=${jobPath}`, `--execution=${executionPath}`, `--status-output=${statusPath}`,
    ]);
    const candidatePath = path.join('data/generated/timetable/actions-multi-job', batchId, 'candidates.json');
    const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    collected.push(...(candidate.records ?? []));
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const rankOrder = new Map(['C', 'B', 'B+', 'A', 'A+'].map((value, index) => [value, index]));
const byId = new Map();
for (const record of collected) {
  if (!record?.meeting_id) continue;
  const previous = byId.get(record.meeting_id);
  if (!previous || (rankOrder.get(record.capability_rank) ?? -1) >= (rankOrder.get(previous.capability_rank) ?? -1)) {
    byId.set(record.meeting_id, record);
  }
}
const records = [...byId.values()].filter((row) => row.date >= startDate && row.date < endDateExclusive)
  .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
const artifact = {
  schema_version: 'hkjc-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  racing_system_id: 'hong-kong-hkjc-system',
  timezone: 'Asia/Hong_Kong',
  discovery: {
    method: 'official_fixture_list_plus_best_available_racecard',
    schedule_source_id: 'hkjc-fixture-list',
    schedule_source_url: 'https://racing.hkjc.com/racing/information/English/Racing/Fixture.aspx',
  },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
  records,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, official_fixture_count: records.length, start_date: startDate, end_date_exclusive: endDateExclusive }));
