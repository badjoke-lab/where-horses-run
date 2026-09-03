import fs from 'node:fs';

const RANK_ORDER = new Map([['C', 0], ['B', 1], ['B+', 2], ['A', 3], ['A+', 4]]);
const reconciliationPath = process.argv[2] ?? 'data/generated/timetable/tjk-zero-based-30d-reconciliation.json';
const publicPath = 'data/generated/timetable/public/meeting-list.json';

const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, 'utf8'));
const publicData = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
if (reconciliation.schema_version !== 'tjk-zero-based-30d-reconciliation-v1') throw new Error('unsupported TJK reconciliation schema');
if (reconciliation.complete !== true) throw new Error('TJK reconciliation is incomplete');
if (!Array.isArray(reconciliation.official_meeting_ids) || reconciliation.official_meeting_ids.length !== reconciliation.official_fixture_count) throw new Error('TJK official mother-set count mismatch');
if ((reconciliation.removed_stale_public_candidates ?? []).some((id) => reconciliation.official_meeting_ids.includes(id))) throw new Error('TJK stale removal intersects official mother set');

const publicById = new Map(publicData.meetings.map((x) => [x.meeting_id, x]));
const outcomeById = new Map(reconciliation.outcomes.map((x) => [x.meeting_id, x]));
const missing = [];
const below = [];
for (const meetingId of reconciliation.official_meeting_ids) {
  const record = publicById.get(meetingId);
  if (!record) {
    missing.push(meetingId);
    continue;
  }
  if (record.country_id !== 'turkey' || record.authority_id !== 'turkiye-jokey-kulubu') throw new Error(`${meetingId} public identity mismatch`);
  const expected = outcomeById.get(meetingId)?.official_rank ?? 'C';
  if (!RANK_ORDER.has(record.effective_public_rank) || RANK_ORDER.get(record.effective_public_rank) < RANK_ORDER.get(expected)) {
    below.push({ meeting_id: meetingId, official_rank: expected, public_rank: record.effective_public_rank });
  }
}
if (missing.length) throw new Error(`TJK official meetings missing from public timetable: ${missing.join(', ')}`);
if (below.length) throw new Error(`TJK public rank below current official acquisition: ${JSON.stringify(below)}`);

const window = reconciliation.window;
const officialIds = new Set(reconciliation.official_meeting_ids);
const extra = publicData.meetings.filter((x) =>
  x.country_id === 'turkey' && x.authority_id === 'turkiye-jokey-kulubu' &&
  x.date >= window.start_date && x.date < window.end_date_exclusive && !officialIds.has(x.meeting_id)
).map((x) => x.meeting_id);
if (extra.length) throw new Error(`stale TJK public meetings remain inside official 30-day window: ${extra.join(', ')}`);

console.log(JSON.stringify({
  ok: true,
  official_fixture_count: reconciliation.official_fixture_count,
  public_present: reconciliation.official_fixture_count,
  public_rank_lower_than_official: 0,
  stale_public_inside_window: 0,
}, null, 2));