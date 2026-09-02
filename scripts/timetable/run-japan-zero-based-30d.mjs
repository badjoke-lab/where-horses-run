import fs from 'node:fs';
import path from 'node:path';
import { runJapanZeroBased30d } from './japan-zero-based-30d-core.mjs';
import { japanOfficial30dAdapters } from './japan-official-30d-adapters.mjs';

function japanToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

const args = new Map(process.argv.slice(2).map((value) => value.split(/=(.*)/s).slice(0, 2)));
const executionDate = args.get('--execution-date') ?? japanToday();
const output = args.get('--output') ?? 'data/generated/timetable/japan-zero-based-30d-reconciliation.json';
const canonicalPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicPath = 'data/generated/timetable/public/meeting-list.json';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const result = await runJapanZeroBased30d({
  executionDate,
  adapters: japanOfficial30dAdapters,
  loadExisting: () => ({
    canonical: read(canonicalPath).meetings,
    details: read(detailsPath).details,
    public: read(publicPath).meetings,
  }),
});
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
write(canonicalPath, { ...read(canonicalPath), generated_at: result.checked_at, meetings: result.canonical });
write(detailsPath, { ...read(detailsPath), generated_at: result.checked_at, details: result.details });
write(publicPath, { ...read(publicPath), generated_at: result.checked_at, meetings: result.public });
write(output, { ...result, canonical: undefined, public: undefined, details: undefined });
const outcomes = Object.fromEntries(result.reconciliations.map((row) => row.outcome).reduce((map, outcome) => map.set(outcome, (map.get(outcome) ?? 0) + 1), new Map()));
console.log(JSON.stringify({
  range: result.range,
  official_counts: result.official_counts,
  official_meeting_count: result.official_meeting_count,
  outcomes,
  complete: result.complete,
  public_rank_lower_than_official: result.public_rank_lower_than_official,
}));
