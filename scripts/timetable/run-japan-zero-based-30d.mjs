import fs from 'node:fs';
import path from 'node:path';
import { runJapanZeroBased30d } from './japan-zero-based-30d-core.mjs';
import { japanOfficial30dAdapters } from './japan-official-30d-adapters.mjs';

const args = new Map(process.argv.slice(2).map((value) => value.split(/=(.*)/s).slice(0, 2)));
const executionDate = args.get('--execution-date') ?? new Date().toISOString().slice(0, 10);
const output = args.get('--output') ?? 'data/generated/timetable/japan-zero-based-30d-reconciliation.json';
const canonicalPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicPath = 'data/generated/timetable/public/meeting-list.json';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const result = await runJapanZeroBased30d({ executionDate, adapters: japanOfficial30dAdapters, loadExisting: () => ({ canonical: read(canonicalPath).meetings, details: read(detailsPath).details, public: read(publicPath).meetings }) });
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); };
write(canonicalPath, { ...read(canonicalPath), generated_at: result.checked_at, meetings: result.canonical });
write(detailsPath, { ...read(detailsPath), generated_at: result.checked_at, details: result.details });
write(publicPath, { ...read(publicPath), generated_at: result.checked_at, meetings: result.public });
write(output, { ...result, canonical: undefined, public: undefined, details: undefined });
console.log(JSON.stringify({ range: result.range, official_counts: result.official_counts, outcomes: Object.groupBy(result.reconciliations, (row) => row.outcome), complete: result.complete, public_rank_lower_than_official: result.public_rank_lower_than_official }));
