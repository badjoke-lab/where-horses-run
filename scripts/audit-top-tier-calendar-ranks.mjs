import fs from 'node:fs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith('--') || value == null) throw new Error(`invalid argument sequence near ${key ?? '<end>'}`);
  args.set(key.slice(2), value);
}

const start = args.get('start') ?? '0000-01-01';
const end = args.get('end') ?? '9999-12-31';
const output = args.get('output') ?? null;

const publicMeetings = JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-list.json', 'utf8'));
const meetings = (publicMeetings.meetings ?? []).filter((meeting) => meeting.date >= start && meeting.date < end);

const emptyRanks = () => ({ C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 });
const emptyReasons = () => ({
  canonical_capability_c: 0,
  public_ceiling_c_with_higher_capability: 0,
  other_effective_c: 0,
});

const authoritySummary = {};
const countrySummary = {};
const cMeetings = [];

function add(summaryMap, key, meeting, reason) {
  const summary = summaryMap[key] ?? {
    meeting_count: 0,
    ranks: emptyRanks(),
    c_reason_counts: emptyReasons(),
  };
  summary.meeting_count += 1;
  summary.ranks[meeting.effective_public_rank] = (summary.ranks[meeting.effective_public_rank] ?? 0) + 1;
  if (reason) summary.c_reason_counts[reason] += 1;
  summaryMap[key] = summary;
}

for (const meeting of meetings) {
  let reason = null;
  if (meeting.effective_public_rank === 'C') {
    if (meeting.capability_rank === 'C') reason = 'canonical_capability_c';
    else if (meeting.max_public_rank === 'C') reason = 'public_ceiling_c_with_higher_capability';
    else reason = 'other_effective_c';
    cMeetings.push({
      meeting_id: meeting.meeting_id,
      date: meeting.date,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racecourse_id: meeting.racecourse_id,
      capability_rank: meeting.capability_rank,
      max_public_rank: meeting.max_public_rank,
      effective_public_rank: meeting.effective_public_rank,
      policy_id: meeting.policy_id,
      first_race_time_local: meeting.first_race_time_local,
      last_race_time_local: meeting.last_race_time_local,
      detail_path: meeting.detail_path,
      source_status: meeting.source_status,
      official_source_url: meeting.official_source_url,
      last_checked_date: meeting.last_checked_date,
      reason,
    });
  }
  add(authoritySummary, meeting.authority_id, meeting, reason);
  add(countrySummary, meeting.country_id, meeting, reason);
}

const totals = {
  meeting_count: meetings.length,
  ranks: emptyRanks(),
  c_reason_counts: emptyReasons(),
};
for (const meeting of meetings) totals.ranks[meeting.effective_public_rank] = (totals.ranks[meeting.effective_public_rank] ?? 0) + 1;
for (const row of cMeetings) totals.c_reason_counts[row.reason] += 1;

const result = {
  schema_version: 'calendar-rank-gap-audit-v2',
  public_dataset_generated_at: publicMeetings.generated_at,
  window: { start_inclusive: start, end_exclusive: end },
  definition: 'Every meeting in the published Calendar dataset within the requested window; no authority or publication-policy tier is excluded.',
  totals,
  authority_summary: Object.entries(authoritySummary)
    .map(([authority_id, summary]) => ({ authority_id, ...summary }))
    .sort((a, b) => a.authority_id.localeCompare(b.authority_id)),
  country_summary: Object.entries(countrySummary)
    .map(([country_id, summary]) => ({ country_id, ...summary }))
    .sort((a, b) => a.country_id.localeCompare(b.country_id)),
  c_meetings: cMeetings.sort((a, b) => `${a.date}:${a.meeting_id}`.localeCompare(`${b.date}:${b.meeting_id}`)),
};

const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (output) fs.writeFileSync(output, serialized);
process.stdout.write(serialized);
