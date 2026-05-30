import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const checkedFiles = [];

const candidateFiles = [
  {
    relativePath: 'data/candidates/japan-active-window-approved-candidates.json',
    kind: 'japan-approved'
  },
  {
    relativePath: 'data/candidates/hong-kong-active-window-approved-candidates.json',
    kind: 'hong-kong-approved'
  },
  {
    relativePath: 'data/candidates/uae-active-window-approved-candidates.json',
    kind: 'uae-approved'
  },
  {
    relativePath: 'data/candidates/hong-kong-hkjc-candidates.json',
    kind: 'hong-kong-candidates'
  },
  {
    relativePath: 'data/candidates/uae-era-candidates.json',
    kind: 'uae-candidates'
  }
];

const allowedReviewStatuses = new Set(['needs_review', 'approved']);
const allowedRecordStatuses = new Set(['candidate', 'source-reviewed']);
const forbiddenMarkers = [
  'raw html',
  'source body',
  'source response body',
  'racecard',
  'entries',
  'horse names',
  'jockey names',
  'trainer names',
  'odds',
  'results',
  'payouts',
  'prediction',
  'tips'
];

function fail(relativePath, message) {
  errors.push(`${relativePath}: ${message}`);
}

function present(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

function readCandidateFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const text = readFileSync(absolutePath, 'utf8');
  try {
    return { text, data: JSON.parse(text) };
  } catch (error) {
    fail(relativePath, `must be valid JSON (${error.message})`);
    return { text, data: null };
  }
}

function includesMarker(text, marker) {
  return text.toLowerCase().includes(marker);
}

function validateForbiddenMarkers(relativePath, text) {
  const lowerText = text.toLowerCase();
  for (const marker of forbiddenMarkers) {
    if (includesMarker(lowerText, marker)) fail(relativePath, `forbidden marker found: ${marker}`);
  }
}

function validateTopLevel(relativePath, file) {
  if (file.schema_version !== 'timetable-candidates-v0') fail(relativePath, 'schema_version must be timetable-candidates-v0');
  if (!present(file.country_id)) fail(relativePath, 'country_id must be present');
  if (!present(file.source_adapter_id)) fail(relativePath, 'source_adapter_id must be present');

  if (!file.candidate_window || typeof file.candidate_window !== 'object' || Array.isArray(file.candidate_window)) {
    fail(relativePath, 'candidate_window must be present');
  } else {
    for (const key of ['start_date', 'end_date_exclusive', 'timezone']) {
      if (!present(file.candidate_window[key])) fail(relativePath, `candidate_window.${key} must be present`);
    }
  }

  if (!Array.isArray(file.records)) fail(relativePath, 'records must be an array');
  if (!file.review || typeof file.review !== 'object' || Array.isArray(file.review)) {
    fail(relativePath, 'review must exist');
  } else if (!allowedReviewStatuses.has(file.review.review_status)) {
    fail(relativePath, 'review.review_status must be one of needs_review, approved');
  }
}

function validateRecords(relativePath, file) {
  if (!Array.isArray(file.records)) return;

  const candidateIds = new Set();
  const logicalKeys = new Set();

  for (const [index, record] of file.records.entries()) {
    const label = record?.candidate_id || `records[${index}]`;
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      fail(relativePath, `records[${index}] must be an object`);
      continue;
    }

    for (const key of ['candidate_id', 'racing_system_id', 'racecourse_id', 'date', 'timezone', 'source_id', 'source_url']) {
      if (!present(record[key])) fail(relativePath, `${label}: ${key} must be present`);
    }

    if (record.country_id !== file.country_id) fail(relativePath, `${label}: country_id must match top-level country_id`);
    if (!allowedRecordStatuses.has(record.status)) fail(relativePath, `${label}: status must be one of candidate, source-reviewed`);
    if (!allowedReviewStatuses.has(record.review_status)) fail(relativePath, `${label}: review_status must be one of needs_review, approved`);
    if (record.status === 'candidate' && record.review_status !== 'needs_review') {
      fail(relativePath, `${label}: candidate status must have review_status needs_review`);
    }
    if (record.status === 'source-reviewed' && record.review_status !== 'approved') {
      fail(relativePath, `${label}: source-reviewed status must have review_status approved`);
    }

    if (present(record.candidate_id)) {
      if (candidateIds.has(record.candidate_id)) fail(relativePath, `${label}: duplicate candidate_id`);
      candidateIds.add(record.candidate_id);
    }

    const logicalKeyParts = [record.country_id, record.date, record.racing_system_id, record.racecourse_id, record.source_id];
    if (logicalKeyParts.every(present)) {
      const logicalKey = logicalKeyParts.join('|');
      if (logicalKeys.has(logicalKey)) fail(relativePath, `${label}: duplicate logical key ${logicalKey}`);
      logicalKeys.add(logicalKey);
    }
  }
}

function validateJapanApproved(relativePath, file) {
  if (file.country_id !== 'japan') fail(relativePath, 'Japan approved bundle country_id must be japan');
  const systems = new Set();
  for (const record of file.records ?? []) {
    systems.add(record.racing_system_id);
    if (record.status !== 'source-reviewed') fail(relativePath, `${record.candidate_id}: Japan approved records must be source-reviewed`);
    if (record.review_status !== 'approved') fail(relativePath, `${record.candidate_id}: Japan approved records must be approved`);
  }
  if ((file.records ?? []).length > 0) {
    for (const system of ['jra', 'nar', 'banei']) {
      if (!systems.has(system)) fail(relativePath, `Japan approved bundle should include ${system}`);
    }
  }
}

function validateHongKong(relativePath, file, approved) {
  if (file.country_id !== 'hong-kong') fail(relativePath, 'Hong Kong file country_id must be hong-kong');
  if (file.candidate_window?.timezone !== 'Asia/Hong_Kong') fail(relativePath, 'Hong Kong candidate_window.timezone should be Asia/Hong_Kong');
  for (const record of file.records ?? []) {
    if (record.timezone !== 'Asia/Hong_Kong') fail(relativePath, `${record.candidate_id}: timezone should be Asia/Hong_Kong`);
  }

  if (approved && (file.records ?? []).length > 0) {
    const racecourseIds = new Set(file.records.map((record) => record.racecourse_id));
    for (const racecourseId of ['happy-valley-racecourse', 'sha-tin-racecourse']) {
      if (!racecourseIds.has(racecourseId)) fail(relativePath, `Hong Kong approved bundle should include ${racecourseId}`);
    }
  }
}

function hasTruthyPublicCoverageClaim(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.public_coverage === true || value.claims_public_coverage === true) return true;
  return Object.values(value).some((child) => hasTruthyPublicCoverageClaim(child));
}

function validateUae(relativePath, file, text, approved) {
  if (file.country_id !== 'united-arab-emirates') fail(relativePath, 'UAE file country_id must be united-arab-emirates');
  if (file.candidate_window?.timezone !== 'Asia/Dubai') fail(relativePath, 'UAE candidate_window.timezone should be Asia/Dubai');
  for (const record of file.records ?? []) {
    if (record.timezone !== 'Asia/Dubai') fail(relativePath, `${record.candidate_id}: timezone should be Asia/Dubai`);
  }

  if (!approved) return;

  if ((file.records ?? []).length === 0) {
    const lowerText = text.toLowerCase();
    if (!lowerText.includes('season gap') || !lowerText.includes('no active-window')) {
      fail(relativePath, 'empty UAE bundle must clearly include season gap and no active-window wording');
    }
    if (!lowerText.includes('not public coverage') && !lowerText.includes('no public coverage')) {
      fail(relativePath, 'empty UAE bundle must explicitly negate public coverage');
    }
    if (file.review?.promotion_target !== null) fail(relativePath, 'empty UAE bundle must not have a promotion target');
    if (hasTruthyPublicCoverageClaim(file)) fail(relativePath, 'empty UAE bundle must not claim public coverage');
    for (const claim of ['is public coverage', 'public coverage available', 'public coverage: true']) {
      if (lowerText.includes(claim)) fail(relativePath, `empty UAE bundle must not claim public coverage with: ${claim}`);
    }
  }
}

for (const { relativePath, kind } of candidateFiles) {
  if (!existsSync(path.join(root, relativePath))) continue;
  checkedFiles.push(relativePath);
  const { text, data } = readCandidateFile(relativePath);
  validateForbiddenMarkers(relativePath, text);
  if (!data) continue;
  validateTopLevel(relativePath, data);
  validateRecords(relativePath, data);

  if (kind === 'japan-approved') validateJapanApproved(relativePath, data);
  if (kind === 'hong-kong-approved') validateHongKong(relativePath, data, true);
  if (kind === 'hong-kong-candidates') validateHongKong(relativePath, data, false);
  if (kind === 'uae-approved') validateUae(relativePath, data, text, true);
  if (kind === 'uae-candidates') validateUae(relativePath, data, text, false);
}

if (errors.length) {
  console.error('Cross-country candidate validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Cross-country candidate validation passed for ${checkedFiles.length} file(s):`);
for (const relativePath of checkedFiles) console.log(`- ${relativePath}`);
