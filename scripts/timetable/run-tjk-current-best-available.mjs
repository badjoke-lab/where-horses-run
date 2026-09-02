import fs from 'node:fs';
import path from 'node:path';
import { collectCandidateBatch, turkeyDate } from './tjk-current-future-candidates.mjs';

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const read = (name, fallback = null) => {
    const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const output = read('output');
  const days = Number(read('days', '30'));
  if (!output) throw new Error('Usage: node scripts/timetable/run-tjk-current-best-available.mjs --output <path> [--days 30]');
  if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be an integer from 1 to 62');
  return { output, days };
}

const { output, days } = parseArgs(process.argv.slice(2));
const now = new Date();
const startDate = turkeyDate(now);
const endDateExclusive = addDays(startDate, days);
const raw = await collectCandidateBatch({ now });
const candidates = raw.candidates.filter((record) => record.date >= startDate && record.date < endDateExclusive);
const rankCounts = {
  C: candidates.filter((record) => record.capability_rank === 'C').length,
  A: candidates.filter((record) => record.capability_rank === 'A').length,
};
const artifact = {
  ...raw,
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
  discovery: {
    ...raw.discovery,
    discovered_before_window_filter: raw.candidates.length,
    detail_pages_attempted: candidates.length,
    rank_counts: rankCounts,
  },
  candidates,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  candidates: candidates.length,
  rank_counts: rankCounts,
}, null, 2));
