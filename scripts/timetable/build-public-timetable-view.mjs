import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function lowerRank(capability, maximum) {
  return rankOrder.indexOf(capability) <= rankOrder.indexOf(maximum)
    ? capability
    : maximum;
}

function matches(value, allowed) {
  return !allowed || allowed.length === 0 || allowed.includes(value);
}

function findPolicy(record, policyData) {
  return (
    [...policyData.policies]
      .sort((left, right) => right.priority - left.priority)
      .find((policy) =>
        matches(record.country_id, policy.match.country_ids) &&
        matches(record.authority_id, policy.match.authority_ids) &&
        matches(record.source_trace.source_id, policy.match.source_ids),
      ) ?? policyData.default_policy
  );
}

function resolveDecision(record, policyData) {
  const policy = findPolicy(record, policyData);
  const effectiveRank = lowerRank(record.capability_rank, policy.max_public_rank);
  const showAPlus = effectiveRank === 'A+';

  return {
    policy_id: policy.id,
    max_public_rank: policy.max_public_rank,
    effective_public_rank: effectiveRank,
    include_in_public_list:
      policy.include_in_public_list &&
      effectiveRank !== 'not_listed' &&
      effectiveRank !== 'D',
    show_race_name: showAPlus && policy.a_plus_fields.show_race_name,
    show_distance: showAPlus && policy.a_plus_fields.show_distance,
    show_surface: showAPlus && policy.a_plus_fields.show_surface,
    show_course: showAPlus && policy.a_plus_fields.show_course,
    show_live_label: policy.show_live_label,
    show_replay_label: policy.show_replay_label,
  };
}

function atLeast(rank, minimum) {
  return rankOrder.indexOf(rank) >= rankOrder.indexOf(minimum);
}

const canonicalMeetings = readJson(
  'data/generated/timetable/canonical/meetings.json',
);
const canonicalDetails = readJson(
  'data/generated/timetable/canonical/meeting-details.json',
);
const policyData = readJson('src/data/publicationDisplayPolicies.json');

const detailIds = new Set(
  (canonicalDetails.details ?? []).map((detail) => detail.meeting_id),
);

const meetingList = (canonicalMeetings.meetings ?? [])
  .map((meeting) => {
    const decision = resolveDecision(meeting, policyData);
    if (!decision.include_in_public_list) return null;

    return {
      meeting_id: meeting.meeting_id,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: meeting.timezone,
      capability_rank: meeting.capability_rank,
      max_public_rank: decision.max_public_rank,
      effective_public_rank: decision.effective_public_rank,
      first_race_time_local: atLeast(decision.effective_public_rank, 'B')
        ? meeting.first_race_time_local ?? null
        : null,
      last_race_time_local: atLeast(decision.effective_public_rank, 'B+')
        ? meeting.last_race_time_local ?? null
        : null,
      policy_id: decision.policy_id,
      source_status: meeting.source_trace.source_status,
      official_source_url: meeting.source_trace.official_source_url,
      last_checked_date: meeting.freshness.last_checked_date,
      detail_path: detailIds.has(meeting.meeting_id)
        ? `/timetable/meetings/${meeting.meeting_id}/`
        : null,
      show_live_label: decision.show_live_label,
      show_replay_label: decision.show_replay_label,
    };
  })
  .filter(Boolean)
  .sort((left, right) =>
    `${left.date}:${left.country_id}:${left.racecourse_id}`.localeCompare(
      `${right.date}:${right.country_id}:${right.racecourse_id}`,
    ),
  );

const meetingDetails = (canonicalDetails.details ?? [])
  .map((detail) => {
    const decision = resolveDecision(detail, policyData);
    if (
      decision.effective_public_rank !== 'A' &&
      decision.effective_public_rank !== 'A+'
    ) {
      return null;
    }

    const timetableRows = detail.timetable_rows.map((row) => {
      const publicRow = {
        label: row.label,
        post_time_local: row.post_time_local,
      };

      if (decision.show_race_name && row.race_name) {
        publicRow.race_name = row.race_name;
      }
      if (decision.show_distance && row.distance_m != null) {
        publicRow.distance_m = row.distance_m;
      }
      if (decision.show_surface && row.surface) {
        publicRow.surface = row.surface;
      }
      if (decision.show_course && row.course_label) {
        publicRow.course_label = row.course_label;
      }

      return publicRow;
    });

    return {
      meeting_id: detail.meeting_id,
      country_id: detail.country_id,
      authority_id: detail.authority_id,
      racecourse_id: detail.racecourse_id,
      date: detail.date,
      timezone: detail.timezone,
      capability_rank: detail.capability_rank,
      max_public_rank: decision.max_public_rank,
      effective_public_rank: decision.effective_public_rank,
      policy_id: decision.policy_id,
      official_source_url: detail.source_trace.official_source_url,
      source_status: detail.source_trace.source_status,
      last_checked_date: detail.freshness.last_checked_date,
      show_race_name: decision.show_race_name,
      show_distance: decision.show_distance,
      show_surface: decision.show_surface,
      show_course: decision.show_course,
      show_live_label: decision.show_live_label,
      show_replay_label: decision.show_replay_label,
      timetable_rows: timetableRows,
    };
  })
  .filter(Boolean)
  .sort((left, right) => left.meeting_id.localeCompare(right.meeting_id));

const generatedAt = new Date().toISOString();

writeJson('data/generated/timetable/public/meeting-list.json', {
  schema_version: 'public-timetable-meeting-list-v0',
  generated_at: generatedAt,
  canonical_source: 'data/generated/timetable/canonical/meetings.json',
  policy_source: 'src/data/publicationDisplayPolicies.json',
  meetings: meetingList,
});

writeJson('data/generated/timetable/public/meeting-details.json', {
  schema_version: 'public-timetable-meeting-details-v0',
  generated_at: generatedAt,
  canonical_source:
    'data/generated/timetable/canonical/meeting-details.json',
  policy_source: 'src/data/publicationDisplayPolicies.json',
  details: meetingDetails,
});

console.log(
  `[public timetable] wrote ${meetingList.length} meeting-list rows and ${meetingDetails.length} detail records`,
);
