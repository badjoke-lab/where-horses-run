import fs from 'node:fs';
import path from 'node:path';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { projectPublicTimetableRows } from './public-detail-projection.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);
const readJson = (file) => JSON.parse(read(file));
const writeJson = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);

function replaceOnce(text, oldValue, newValue, label) {
  const first = text.indexOf(oldValue);
  if (first < 0) throw new Error(`${label}: expected text not found`);
  if (text.indexOf(oldValue, first + oldValue.length) >= 0) throw new Error(`${label}: expected exactly one occurrence`);
  return text.slice(0, first) + newValue + text.slice(first + oldValue.length);
}

function replaceRegexOnce(text, pattern, replacement, label) {
  let count = 0;
  const next = text.replace(pattern, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count !== 1) throw new Error(`${label}: expected one replacement, got ${count}`);
  return next;
}

function patchReviewedObservations() {
  const file = 'scripts/timetable/apply-reviewed-calendar-observations.mjs';
  let text = read(file);
  text = replaceOnce(
    text,
    "import path from 'node:path';\n",
    "import path from 'node:path';\nimport { deriveBestAvailableRank } from './best-available-rank.mjs';\nimport { projectPublicTimetableRows } from './public-detail-projection.mjs';\n",
    'reviewed imports',
  );
  text = replaceRegexOnce(
    text,
    /function capRank\(value, ceiling\) \{\n  return rank\(value\) <= rank\(ceiling\) \? value : ceiling;\n\}\n/,
    '',
    'capRank removal',
  );

  const start = text.indexOf('function publicDetailFromCanonical(');
  const end = text.indexOf('\n\nconst manifest =', start);
  if (start < 0 || end < 0) throw new Error('publicDetailFromCanonical block not found');
  const replacement = `function publicDetailFromCanonical(meeting, detail, listRow, policy) {
  if (!detail || !['A', 'A+'].includes(listRow.effective_public_rank)) return null;
  const projection = projectPublicTimetableRows(detail.timetable_rows ?? [], policy);
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: listRow.capability_rank,
    effective_public_rank: listRow.effective_public_rank,
    policy_id: listRow.policy_id,
    official_source_url: listRow.official_source_url,
    source_status: 'verified',
    last_checked_date: listRow.last_checked_date,
    show_race_name: projection.visibility.show_race_name,
    show_distance: projection.visibility.show_distance,
    show_surface: projection.visibility.show_surface,
    show_course: projection.visibility.show_course,
    show_live_label: policy.show_live_label ?? false,
    show_replay_label: policy.show_replay_label ?? false,
    timetable_rows: projection.rows,
  };
}`;
  text = text.slice(0, start) + replacement + text.slice(end);

  const loopMarker = 'for (const record of reviewedById.values()) {\n';
  const loopCount = text.split(loopMarker).length - 1;
  if (loopCount !== 2) throw new Error(`reviewed loop count changed: ${loopCount}`);
  text = text.replaceAll(loopMarker, `${loopMarker}  const reviewedRank = deriveBestAvailableRank(record, record.timetable_rows ?? []);\n`);
  text = text.replaceAll('rank(record.capability_rank)', 'rank(reviewedRank)');
  text = replaceOnce(
    text,
    'capability_rank: rankNeedsRepair ? record.capability_rank : previous.capability_rank,',
    'capability_rank: rankNeedsRepair ? reviewedRank : previous.capability_rank,',
    'reviewed canonical rank repair',
  );
  text = replaceOnce(
    text,
    "const detailNeedsRepair = rank(reviewedRank) >= rank('A') && !detail && reviewedRows.length > 0;",
    "const detailNeedsRepair = rank(reviewedRank) >= rank('A') && reviewedRows.length > 0\n    && (!detail || rank(deriveBestAvailableRank(meeting, detail.timetable_rows ?? [])) < rank(reviewedRank));",
    'reviewed detail repair predicate',
  );

  const oldPolicyBlock = `  const policy = choosePolicy(meeting.authority_id, policyDataset);
  const ceiling = policy.max_public_rank ?? 'C';
  let desiredPublicRank = capRank(meeting.capability_rank, ceiling);
  if (rank(desiredPublicRank) >= rank('A') && (!detail || !(detail.timetable_rows ?? []).length)) {
    desiredPublicRank = meeting.first_race_time_local && meeting.last_race_time_local
      ? 'B+'
      : meeting.first_race_time_local ? 'B' : 'C';
  }
  const minimumReviewedPublicRank = capRank(record.capability_rank, ceiling);
  if (rank(desiredPublicRank) < rank(minimumReviewedPublicRank)) {
    throw new Error(\`reviewed data cannot satisfy policy-projected minimum rank for \${record.meeting_id}\`);
  }
`;
  const newPolicyBlock = `  const canonicalEvidenceRank = deriveBestAvailableRank(meeting, detail?.timetable_rows ?? []);
  if (meeting.capability_rank !== canonicalEvidenceRank) {
    meeting = {
      ...meeting,
      capability_rank: canonicalEvidenceRank,
      display_status: canonicalEvidenceRank === 'C' ? 'partial' : 'displayable',
    };
    canonicalById.set(record.meeting_id, meeting);
    changed = true;
    outcomes.canonical_rank_repairs += 1;
  }

  const policy = choosePolicy(meeting.authority_id, policyDataset);
  const desiredPublicRank = canonicalEvidenceRank;
  const minimumReviewedPublicRank = reviewedRank;
  if (rank(desiredPublicRank) < rank(minimumReviewedPublicRank)) {
    throw new Error(\`reviewed evidence was not persisted strongly enough for \${record.meeting_id}\`);
  }
`;
  text = replaceOnce(text, oldPolicyBlock, newPolicyBlock, 'reviewed public rank block');

  const oldNeeds = `  const publicNeedsRepair = !previousPublic
    || rank(previousPublic.effective_public_rank) < rank(minimumReviewedPublicRank)
    || (record.first_race_time_local && !previousPublic.first_race_time_local)
    || (rank(reviewedRank) >= rank('B+') && record.last_race_time_local && !previousPublic.last_race_time_local);
`;
  const newNeeds = `  const publicNeedsRepair = !previousPublic
    || previousPublic.capability_rank !== desiredPublicRank
    || previousPublic.effective_public_rank !== desiredPublicRank
    || previousPublic.policy_id !== policy.id
    || (record.first_race_time_local && !previousPublic.first_race_time_local)
    || (rank(reviewedRank) >= rank('B+') && record.last_race_time_local && !previousPublic.last_race_time_local);
`;
  text = replaceOnce(text, oldNeeds, newNeeds, 'reviewed public repair predicate');
  text = replaceOnce(
    text,
    '      capability_rank: meeting.capability_rank,\n      max_public_rank: ceiling,\n      effective_public_rank: desiredPublicRank,',
    '      capability_rank: desiredPublicRank,\n      effective_public_rank: desiredPublicRank,',
    'reviewed public row rank fields',
  );

  const oldDetailRepair = `  const previousPublicDetail = publicDetailsById.get(record.meeting_id) ?? null;
  const publicDetailNeedsRepair = rank(minimumReviewedPublicRank) >= rank('A') && !previousPublicDetail;
  if (publicDetailNeedsRepair) {
    const repaired = publicDetailFromCanonical(meeting, detail, publicMeeting, policy, previousPublicDetail);
    if (!repaired) throw new Error(\`reviewed public detail could not be rebuilt for \${record.meeting_id}\`);
    publicDetailsById.set(record.meeting_id, repaired);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.public_detail_repairs += 1;
  }
`;
  const newDetailRepair = `  const previousPublicDetail = publicDetailsById.get(record.meeting_id) ?? null;
  const desiredPublicDetail = publicDetailFromCanonical(meeting, detail, publicMeeting, policy);
  const publicDetailNeedsRepair = JSON.stringify(previousPublicDetail) !== JSON.stringify(desiredPublicDetail);
  if (publicDetailNeedsRepair) {
    if (desiredPublicDetail) publicDetailsById.set(record.meeting_id, desiredPublicDetail);
    else publicDetailsById.delete(record.meeting_id);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.public_detail_repairs += 1;
  }
`;
  text = replaceOnce(text, oldDetailRepair, newDetailRepair, 'reviewed public detail repair');
  text = replaceOnce(
    text,
    "  const minimumPublicRank = capRank(record.capability_rank, policy.max_public_rank ?? 'C');",
    '  const minimumPublicRank = reviewedRank;',
    'reviewed final minimum rank',
  );
  write(file, text);
}

function patchPublicViewModel() {
  const file = 'src/lib/timetable/publicTimetableViewModel.ts';
  let text = read(file);
  text = text.replace("import japanAPlusOverridesData from '../../../data/generated/timetable/public/japan-a-plus-overrides.json';\n", '');
  text = replaceRegexOnce(
    text,
    /type JapanMeetingOverride = Pick<[\s\S]*?type PublicTimetableMeetingCorrection =/,
    'type PublicTimetableMeetingCorrection =',
    'view-model override types removal',
  );
  text = replaceRegexOnce(
    text,
    /const japanAPlusOverrides = japanAPlusOverridesData as JapanAPlusPublicOverrides;[\s\S]*?const detailOverrideIndex = new Map\([\s\S]*?\);\n\n/,
    '',
    'view-model override indexes removal',
  );
  text = text.replace(/const maxRank = \(left: CapabilityRank, right: CapabilityRank\): CapabilityRank =>\n  RANK_ORDER\[left\] >= RANK_ORDER\[right\] \? left : right;\n\n/, '');

  const oldMeetings = `const generatedPublicMeetingRows: readonly PublicTimetableMeetingRow[] = meetingListDataset.meetings
  .filter((meeting) => !reviewedPublicExcludedMeetingIds.has(meeting.meeting_id))
  .map((meeting) => {
    const override = meetingOverrideIndex.get(meeting.meeting_id);
    const withRankOverride = override && canApplyMeetingRankOverride(meeting, override)
      ? { ...meeting, effective_public_rank: override.effective_public_rank }
      : meeting;
    const correction = reviewedPublicCorrections.get(meeting.meeting_id);
    return correction ? { ...withRankOverride, ...correction } : withRankOverride;
  });
`;
  const newMeetings = `const generatedPublicMeetingRows: readonly PublicTimetableMeetingRow[] = meetingListDataset.meetings
  .filter((meeting) => !reviewedPublicExcludedMeetingIds.has(meeting.meeting_id))
  .map((meeting) => {
    const correction = reviewedPublicCorrections.get(meeting.meeting_id);
    return correction ? { ...meeting, ...correction } : meeting;
  });
`;
  text = replaceOnce(text, oldMeetings, newMeetings, 'view-model meeting overrides');

  const oldDetails = `const generatedPublicMeetingDetails: readonly PublicTimetableMeetingDetail[] = meetingDetailsDataset.details
  .map((detail) => {
    const override = detailOverrideIndex.get(detail.meeting_id);
    const withRankOverride = override && canApplyDetailRankOverride(detail, override)
      ? {
          ...detail,
          effective_public_rank: override.effective_public_rank,
          show_race_name: override.show_race_name,
          show_distance: override.show_distance,
          show_surface: override.show_surface,
          show_course: override.show_course,
          timetable_rows: override.timetable_rows,
        }
      : detail;
    const correction = reviewedPublicDetailCorrections.get(detail.meeting_id);
    return correction ? { ...withRankOverride, ...correction } : withRankOverride;
  });
`;
  const newDetails = `const generatedPublicMeetingDetails: readonly PublicTimetableMeetingDetail[] = meetingDetailsDataset.details
  .map((detail) => {
    const correction = reviewedPublicDetailCorrections.get(detail.meeting_id);
    return correction ? { ...detail, ...correction } : detail;
  });
`;
  text = replaceOnce(text, oldDetails, newDetails, 'view-model detail overrides');
  text = replaceOnce(
    text,
    '      capability_rank: maxRank(existing.capability_rank, candidate.capability_rank),\n      effective_public_rank: maxRank(existing.effective_public_rank, candidate.effective_public_rank),',
    '      capability_rank: existing.capability_rank,\n      effective_public_rank: existing.effective_public_rank,',
    'view-model meeting overlay rank preservation',
  );
  text = replaceRegexOnce(
    text,
    /      capability_rank: maxRank\(existing\.capability_rank, candidate\.capability_rank\),\n      effective_public_rank: maxRank\(\n        existing\.effective_public_rank,\n        candidate\.effective_public_rank,\n      \) as PublicTimetableMeetingDetail\['effective_public_rank'\],/,
    "      capability_rank: existing.capability_rank,\n      effective_public_rank: existing.effective_public_rank,",
    'view-model detail overlay rank preservation',
  );
  write(file, text);
}

function patchJapanCore() {
  const file = 'scripts/timetable/japan-zero-based-30d-core.mjs';
  let text = read(file);
  text = replaceOnce(
    text,
    '    const { max_public_rank: _legacyMaxPublicRank, ...previousPublicWithoutCeiling } = previousPublic;\n',
    '    const previousPublicWithoutCeiling = previousPublic;\n',
    'Japan legacy ceiling cleanup',
  );
  write(file, text);
}

function removeLegacyFiles() {
  for (const file of [
    'data/generated/timetable/public/japan-a-plus-overrides.json',
    'scripts/timetable/build-japan-a-plus-public-overrides.mjs',
    'scripts/timetable/migrate-public-projection-validator-to-rank-parity.mjs',
    'scripts/timetable/remove-public-rank-caps.mjs',
  ]) {
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}

function reprojectPublicSnapshots() {
  const canonical = readJson('data/generated/timetable/canonical/meetings.json');
  const canonicalDetails = readJson('data/generated/timetable/canonical/meeting-details.json');
  const oldPublic = readJson('data/generated/timetable/public/meeting-list.json');
  const oldDetails = readJson('data/generated/timetable/public/meeting-details.json');
  const policyData = readJson('src/data/publicationDisplayPolicies.json');
  const detailById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
  const oldPublicById = new Map((oldPublic.meetings ?? []).map((row) => [row.meeting_id, row]));
  const choosePolicy = (authorityId) => (policyData.policies ?? [])
    .filter((policy) => (policy.match?.authority_ids ?? []).includes(authorityId))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? policyData.default_policy;

  const meetings = [];
  const details = [];
  for (const meeting of canonical.meetings ?? []) {
    const detail = detailById.get(meeting.meeting_id) ?? null;
    const rank = deriveBestAvailableRank(meeting, detail?.timetable_rows ?? []);
    const policy = choosePolicy(meeting.authority_id);
    if (policy.include_in_public_list === false) continue;
    const old = oldPublicById.get(meeting.meeting_id) ?? {};
    const canDetail = ['A', 'A+'].includes(rank) && detail;
    meetings.push({
      meeting_id: meeting.meeting_id,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: meeting.timezone,
      capability_rank: rank,
      effective_public_rank: rank,
      first_race_time_local: meeting.first_race_time_local ?? detail?.timetable_rows?.[0]?.post_time_local ?? null,
      last_race_time_local: meeting.last_race_time_local ?? detail?.timetable_rows?.at(-1)?.post_time_local ?? null,
      policy_id: policy.id,
      source_status: meeting.source_trace?.source_status ?? old.source_status ?? 'verified',
      official_source_url: meeting.source_trace?.official_source_url ?? old.official_source_url,
      last_checked_date: meeting.freshness?.last_checked_date ?? old.last_checked_date ?? null,
      detail_path: canDetail ? `/timetable/meetings/${meeting.meeting_id}/` : null,
      show_live_label: policy.show_live_label ?? old.show_live_label ?? false,
      show_replay_label: policy.show_replay_label ?? old.show_replay_label ?? false,
    });
    if (canDetail) {
      const projection = projectPublicTimetableRows(detail.timetable_rows ?? [], policy);
      details.push({
        meeting_id: meeting.meeting_id,
        country_id: meeting.country_id,
        authority_id: meeting.authority_id,
        racecourse_id: meeting.racecourse_id,
        date: meeting.date,
        timezone: meeting.timezone,
        capability_rank: rank,
        effective_public_rank: rank,
        policy_id: policy.id,
        official_source_url: meeting.source_trace?.official_source_url ?? old.official_source_url,
        source_status: meeting.source_trace?.source_status ?? old.source_status ?? 'verified',
        last_checked_date: meeting.freshness?.last_checked_date ?? old.last_checked_date ?? null,
        show_race_name: projection.visibility.show_race_name,
        show_distance: projection.visibility.show_distance,
        show_surface: projection.visibility.show_surface,
        show_course: projection.visibility.show_course,
        show_live_label: policy.show_live_label ?? false,
        show_replay_label: policy.show_replay_label ?? false,
        timetable_rows: projection.rows,
      });
    }
  }
  meetings.sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  details.sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  writeJson('data/generated/timetable/public/meeting-list.json', { ...oldPublic, generated_at: canonical.generated_at, meetings });
  writeJson('data/generated/timetable/public/meeting-details.json', { ...oldDetails, generated_at: canonicalDetails.generated_at, details });
}

patchReviewedObservations();
patchPublicViewModel();
patchJapanCore();
removeLegacyFiles();
reprojectPublicSnapshots();
console.log('CALENDAR_RANK_CEILING_FINALIZER: applied');
