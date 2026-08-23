import fs from 'node:fs';
import path from 'node:path';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

export function validateCalendarReviewedSourceCoverageV1(value) {
  const errors = [];
  if (value?.schema_version !== 'calendar-reviewed-source-coverage-v1') errors.push('reviewed source coverage schema_version differs');
  if (!validDateTime(value?.generated_at)) errors.push('reviewed source coverage generated_at invalid');
  if (!Array.isArray(value?.records)) return [...errors, 'reviewed source coverage records must be an array'];

  const identities = new Set();
  for (const [index, record] of value.records.entries()) {
    const location = `reviewed source coverage records[${index}]`;
    if (typeof record?.system_id !== 'string' || record.system_id === '') errors.push(`${location}.system_id invalid`);
    if (typeof record?.source_id !== 'string' || record.source_id === '') errors.push(`${location}.source_id invalid`);
    if (!validDateTime(record?.checked_at)) errors.push(`${location}.checked_at invalid`);
    if (record?.coverage_claim !== 'source_window_complete') errors.push(`${location}.coverage_claim must be source_window_complete`);

    const scope = record?.observed_scope;
    if (scope?.kind !== 'date_window') errors.push(`${location}.observed_scope.kind must be date_window`);
    if (!validDate(scope?.start_date)) errors.push(`${location}.observed_scope.start_date invalid`);
    if (!validDate(scope?.end_date_exclusive)) errors.push(`${location}.observed_scope.end_date_exclusive invalid`);
    if (validDate(scope?.start_date) && validDate(scope?.end_date_exclusive) && scope.start_date >= scope.end_date_exclusive) {
      errors.push(`${location}.observed_scope window invalid`);
    }
    if (typeof scope?.timezone !== 'string' || scope.timezone.trim() === '') errors.push(`${location}.observed_scope.timezone invalid`);

    if (!Number.isInteger(record?.records_discovered) || record.records_discovered < 0) errors.push(`${location}.records_discovered invalid`);
    for (const key of ['unresolved_dates', 'unresolved_meeting_ids', 'source_errors']) {
      if (!Array.isArray(record?.[key])) errors.push(`${location}.${key} must be an array`);
      else if (record[key].length !== 0) errors.push(`${location}.${key} must be empty for reviewed complete coverage`);
    }

    if (record?.review_state !== 'reviewed') errors.push(`${location}.review_state must be reviewed`);
    if (typeof record?.reviewer !== 'string' || record.reviewer.trim() === '') errors.push(`${location}.reviewer invalid`);
    if (!validDateTime(record?.reviewed_at)) errors.push(`${location}.reviewed_at invalid`);
    if (validDateTime(record?.checked_at) && validDateTime(record?.reviewed_at)
      && Date.parse(record.reviewed_at) < Date.parse(record.checked_at)) errors.push(`${location}.reviewed_at predates checked_at`);

    const sourceObservation = record?.source_observation;
    if (typeof sourceObservation?.run_id !== 'string' || sourceObservation.run_id.trim() === '') errors.push(`${location}.source_observation.run_id invalid`);
    if (!Number.isInteger(sourceObservation?.pr_number) || sourceObservation.pr_number < 1) errors.push(`${location}.source_observation.pr_number invalid`);
    if (typeof sourceObservation?.branch !== 'string' || sourceObservation.branch.trim() === '') errors.push(`${location}.source_observation.branch invalid`);
    if (typeof sourceObservation?.path !== 'string' || sourceObservation.path.trim() === '' || sourceObservation.path.includes('..')) errors.push(`${location}.source_observation.path invalid`);
    if (typeof sourceObservation?.blob_sha !== 'string' || !SHA_PATTERN.test(sourceObservation.blob_sha)) errors.push(`${location}.source_observation.blob_sha invalid`);

    if (!Array.isArray(record?.evidence_urls) || record.evidence_urls.length === 0
      || record.evidence_urls.some((url) => typeof url !== 'string' || !url.startsWith('https://'))) {
      errors.push(`${location}.evidence_urls invalid`);
    }
    if (typeof record?.evidence_note !== 'string' || record.evidence_note.trim() === '') errors.push(`${location}.evidence_note invalid`);

    const identity = `${record?.system_id ?? ''}:${record?.source_id ?? ''}:${scope?.start_date ?? ''}:${scope?.end_date_exclusive ?? ''}`;
    if (identities.has(identity)) errors.push(`duplicate reviewed source coverage identity ${identity}`);
    identities.add(identity);
  }
  return errors;
}

export function loadCalendarReviewedSourceCoverageV1(root, relativePath = 'data/static/calendar-reviewed-source-coverage-v1.json') {
  const absolute = path.resolve(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  const errors = validateCalendarReviewedSourceCoverageV1(value);
  if (errors.length) throw new Error(`invalid reviewed source coverage state: ${errors.join('; ')}`);
  return value;
}

export function reviewedCompleteCoverageWindowsForSystem(state, systemId, asOf) {
  const cutoff = Date.parse(asOf);
  return state.records
    .filter((record) => record.system_id === systemId
      && Date.parse(record.checked_at) <= cutoff
      && Date.parse(record.reviewed_at) <= cutoff
      && record.coverage_claim === 'source_window_complete')
    .map((record) => ({ ...record.observed_scope }))
    .sort((left, right) => `${left.start_date}:${left.end_date_exclusive}`.localeCompare(`${right.start_date}:${right.end_date_exclusive}`));
}

export function extendContiguousSourceHorizon(publicHorizonEndExclusive, reviewedWindows) {
  if (publicHorizonEndExclusive === null) return null;
  let horizon = publicHorizonEndExclusive;
  for (const window of reviewedWindows) {
    if (window.start_date <= horizon && horizon < window.end_date_exclusive) horizon = window.end_date_exclusive;
  }
  return horizon;
}
