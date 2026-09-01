import fs from 'node:fs';

const file = 'scripts/check-calendar-pipeline-v1-public-projection.mjs';
let s = fs.readFileSync(file, 'utf8');

s = s.replace("const rankIndex = (rank) => publicProjectionRanksV1.indexOf(rank);\n", '');

s = s.replace(
`  const decisionById = new Map(first.audit.decisions.map((decision) => [decision.meeting_id, decision]));\n  const meetingById = new Map(first.meetingListDataset.meetings.map((meeting) => [meeting.meeting_id, meeting]));`,
`  const decisionById = new Map(first.audit.decisions.map((decision) => [decision.meeting_id, decision]));\n  const canonicalById = new Map(canonicalMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));\n  const meetingById = new Map(first.meetingListDataset.meetings.map((meeting) => [meeting.meeting_id, meeting]));`
);

s = s.replace(
`  for (const decision of first.audit.decisions) {\n    if (rankIndex(decision.max_public_rank) > rankIndex(decision.readiness_public_ceiling)) {\n      fail(\`${'${decision.meeting_id}'} exceeds Calendar Readiness Public Ceiling\`);\n    }\n    if (rankIndex(decision.effective_public_rank) > rankIndex(decision.max_public_rank)) {\n      fail(\`${'${decision.meeting_id}'} effective rank exceeds maximum public rank\`);\n    }\n  }`,
`  for (const decision of first.audit.decisions) {\n    const canonical = canonicalById.get(decision.meeting_id);\n    if (!canonical) {\n      fail(\`${'${decision.meeting_id}'} has no canonical meeting\`);\n      continue;\n    }\n    if (decision.effective_public_rank !== canonical.capability_rank) {\n      fail(\`${'${decision.meeting_id}'} public rank differs from canonical capability rank\`);\n    }\n    if (decision.max_public_rank !== canonical.capability_rank) {\n      fail(\`${'${decision.meeting_id}'} projected rank metadata differs from canonical capability rank\`);\n    }\n  }`
);

s = s.replace("    if (jraDecision.readiness_public_ceiling !== 'A+') fail('JRA readiness fixture must permit A+ public output');\n", '');

s = s.replace(
`    if (hkjcDecision.readiness_public_ceiling !== 'A') fail('HKJC readiness fixture must cap public output at A');\n    if (hkjcDecision.effective_public_rank !== 'A') fail('HKJC A+ canonical record must project at A');`,
`    if (hkjcDecision.effective_public_rank !== 'A+') fail('HKJC A+ canonical record must remain A+ regardless of readiness ceiling metadata');`
);

s = s.replace(
`  if (!hkjcDetail) fail('HKJC authority-wide projection must retain Happy Valley detail');\n  else if (hkjcDetail.timetable_rows.some((row) => Object.keys(row).some((key) => !['label', 'post_time_local'].includes(key)))) {\n    fail('HKJC A projection must strip all A+ programme-summary fields');\n  }`,
`  if (!hkjcDetail) fail('HKJC authority-wide projection must retain Happy Valley detail');\n  else {\n    if (!hkjcDetail.show_race_name || !hkjcDetail.show_distance) fail('HKJC confirmed A+ programme fields must remain visible');\n    if (hkjcDetail.show_surface || hkjcDetail.show_course) fail('HKJC unconfirmed A+ fields must remain hidden');\n    if (hkjcDetail.timetable_rows.some((row) => 'surface' in row || 'course_label' in row)) fail('HKJC unconfirmed A+ fields leaked into rows');\n  }`
);

s = s.replace(
`  if (!uaeDecision || uaeDecision.max_public_rank !== 'C' || uaeDecision.effective_public_rank !== 'C') {\n    fail('UAE legacy source must project at reviewed C ceiling');\n  }`,
`  if (!uaeDecision || uaeDecision.max_public_rank !== 'C' || uaeDecision.effective_public_rank !== 'C') {\n    fail('UAE canonical C source must remain public C');\n  }`
);

s = s.replace(
`    if (baneiReadiness.technical_rank !== 'C' || baneiReadiness.public_ceiling !== 'C') {\n      fail('Banei reviewed schedule Readiness must remain limited to Rank C');\n    }`,
`    if (baneiReadiness.technical_rank !== 'C') {\n      fail('Banei reviewed schedule technical rank fixture must remain C');\n    }`
);

s = s.replace(
`    if (raisedDecision?.effective_public_rank !== 'A+') fail('raised HKJC ceiling fixture did not reach A+');`,
`    if (raisedDecision?.effective_public_rank !== hkjcDecision?.effective_public_rank) fail('changing HKJC readiness ceiling metadata changed public rank');`
);

s = s.replace(
`console.log('PUBLIC_CEILING_ENFORCED: true');`,
`console.log('CANONICAL_PUBLIC_RANK_PARITY_ENFORCED: true');`
);

if (s.includes('effective rank exceeds maximum public rank') || s.includes('HKJC A+ canonical record must project at A') || s.includes('PUBLIC_CEILING_ENFORCED: true')) {
  throw new Error('stale public-rank ceiling assertions remain');
}

fs.writeFileSync(file, s);
console.log('PUBLIC_PROJECTION_VALIDATOR_RANK_PARITY_MIGRATION: applied');
