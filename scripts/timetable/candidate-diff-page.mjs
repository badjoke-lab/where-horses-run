const ALLOWED_CANDIDATE_SCHEMAS = new Set(['timetable-candidate-v1']);
const ALLOWED_BASELINE_SCHEMA = 'canonical-timetable-v0';
const ALLOWED_DETAILS_SCHEMA = 'canonical-meeting-details-v0';

const FORBIDDEN_KEYS = new Set([
  'html', 'body', 'raw_html', 'raw_body', 'response_body', 'racecard', 'racecards',
  'runner', 'runners', 'participant', 'participants', 'horse', 'horses', 'jockey', 'jockeys',
  'trainer', 'trainers', 'owner', 'owners', 'odds', 'result', 'results', 'payout', 'payouts',
  'prediction', 'predictions', 'tip', 'tips', 'stream_url', 'stream_urls', 'password', 'secret',
  'token', 'access_token', 'api_key', 'authorization', 'cookie', 'set_cookie'
]);

const MEETING_FIELDS = [
  'country_id', 'authority_id', 'racecourse_id', 'source_venue_id', 'source_venue_label', 'date',
  'timezone', 'capability_rank', 'candidate_rank', 'first_race_time_local', 'last_race_time_local'
];

const ROW_FIELDS = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(key) {
  return String(key).trim().replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().replace(/[ -]/g, '_');
}

function assertNoForbiddenKeys(value, path = 'candidate') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    invariant(!FORBIDDEN_KEYS.has(normalizeKey(key)), `${path}.${key} is prohibited from candidate review output`);
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function text(value) {
  return value === null || value === undefined ? null : String(value);
}

function sourceUrl(record) {
  const source = isObject(record.source) ? record.source : {};
  const trace = isObject(record.source_trace) ? record.source_trace : {};
  const value = source.official_url ?? source.landing_url ?? source.source_url ?? trace.official_source_url ?? record.source_url ?? null;
  if (value === null) return null;
  try {
    const url = new URL(value);
    invariant(['http:', 'https:'].includes(url.protocol), 'source URL must use http(s)');
    invariant(!url.username && !url.password, 'source URL must not contain credentials');
    for (const key of url.searchParams.keys()) {
      invariant(!/^(token|access_token|api_key|apikey|secret|password|authorization)$/i.test(key), `source URL contains sensitive query parameter: ${key}`);
    }
    return url.toString();
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`Invalid source URL: ${value}`);
    throw error;
  }
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    key: text(row.label ?? row.race_number ?? index + 1),
    label: text(row.label ?? (row.race_number !== undefined ? `Race ${row.race_number}` : `Race ${index + 1}`)),
    post_time_local: text(row.post_time_local),
    race_name: text(row.race_name),
    distance_m: row.distance_m === null || row.distance_m === undefined ? null : Number(row.distance_m),
    surface: text(row.surface),
    course_label: text(row.course_label)
  }));
}

function normalizeCandidateRecord(record) {
  const rank = text(record.candidate_rank ?? record.capability_rank ?? record.publication_rank);
  const normalized = {
    meeting_id: text(record.meeting_id),
    country_id: text(record.country_id),
    authority_id: text(record.authority_id),
    racecourse_id: text(record.racecourse_id),
    source_venue_id: text(record.source_venue_id),
    source_venue_label: text(record.source_venue_label),
    date: text(record.date),
    timezone: text(record.timezone),
    capability_rank: text(record.capability_rank ?? record.technical_capability_rank),
    candidate_rank: rank,
    first_race_time_local: text(record.first_race_time_local ?? record.start_time_local),
    last_race_time_local: text(record.last_race_time_local),
    timetable_rows: normalizeRows(record.timetable_rows),
    source_url: sourceUrl(record),
    review_status: text(record.review_status ?? 'needs_review')
  };
  invariant(normalized.country_id && normalized.authority_id && normalized.date, 'candidate record must identify country, authority, and date');
  invariant(normalized.meeting_id || normalized.racecourse_id || normalized.source_venue_id, 'candidate record must have meeting/racecourse/source venue identity');
  return normalized;
}

function normalizeBaselineRecord(record) {
  return {
    meeting_id: text(record.meeting_id),
    country_id: text(record.country_id),
    authority_id: text(record.authority_id),
    racecourse_id: text(record.racecourse_id),
    source_venue_id: null,
    source_venue_label: null,
    date: text(record.date),
    timezone: text(record.timezone),
    capability_rank: text(record.capability_rank),
    candidate_rank: text(record.capability_rank),
    first_race_time_local: text(record.first_race_time_local),
    last_race_time_local: text(record.last_race_time_local),
    timetable_rows: [],
    source_url: sourceUrl(record),
    review_status: 'canonical'
  };
}

function identity(record) {
  if (record.meeting_id) return `meeting:${record.meeting_id}`;
  if (record.racecourse_id) return `course:${record.country_id}:${record.authority_id}:${record.racecourse_id}:${record.date}`;
  return `source-venue:${record.country_id}:${record.authority_id}:${record.source_venue_id}:${record.date}`;
}

function stableRows(rows) {
  return rows.map((row) => Object.fromEntries(ROW_FIELDS.map((field) => [field, row[field] ?? null])));
}

function changedFields(candidate, baseline) {
  const changes = [];
  for (const field of MEETING_FIELDS) {
    const left = candidate[field] ?? null;
    const right = baseline[field] ?? null;
    if (JSON.stringify(left) !== JSON.stringify(right)) changes.push(field);
  }
  if (JSON.stringify(stableRows(candidate.timetable_rows)) !== JSON.stringify(stableRows(baseline.timetable_rows))) changes.push('timetable_rows');
  return changes;
}

function inWindow(record, candidateFile) {
  const window = candidateFile.candidate_window ?? {};
  const start = window.start_date ?? null;
  const endExclusive = window.end_date_exclusive ?? null;
  if (start && record.date < start) return false;
  if (endExclusive && record.date >= endExclusive) return false;
  return true;
}

export function buildCandidateDiff(candidateFile, baselineFile, baselineDetailsFile = null) {
  assertNoForbiddenKeys(candidateFile);
  invariant(ALLOWED_CANDIDATE_SCHEMAS.has(candidateFile.schema_version), `unsupported candidate schema: ${candidateFile.schema_version}`);
  invariant(baselineFile?.schema_version === ALLOWED_BASELINE_SCHEMA, `baseline must use ${ALLOWED_BASELINE_SCHEMA}`);
  if (baselineDetailsFile !== null) invariant(baselineDetailsFile?.schema_version === ALLOWED_DETAILS_SCHEMA, `baseline details must use ${ALLOWED_DETAILS_SCHEMA}`);

  const candidates = (candidateFile.records ?? []).map(normalizeCandidateRecord);
  const candidateCountry = text(candidateFile.country_id ?? candidates[0]?.country_id);
  const candidateAuthority = text(candidateFile.authority_id ?? candidates[0]?.authority_id);
  invariant(candidateCountry && candidateAuthority, 'candidate file must identify country and authority');
  invariant(candidates.every((record) => record.country_id === candidateCountry && record.authority_id === candidateAuthority), 'candidate records must stay within one country/authority review partition');

  const detailsByMeeting = new Map((baselineDetailsFile?.details ?? []).map((detail) => [detail.meeting_id, normalizeRows(detail.timetable_rows)]));
  const baseline = (baselineFile.meetings ?? [])
    .filter((record) => record.country_id === candidateCountry && record.authority_id === candidateAuthority)
    .map(normalizeBaselineRecord)
    .filter((record) => inWindow(record, candidateFile))
    .map((record) => ({ ...record, timetable_rows: detailsByMeeting.get(record.meeting_id) ?? [] }));

  const baselineByIdentity = new Map(baseline.map((record) => [identity(record), record]));
  const seen = new Set();
  const rows = [];

  for (const candidate of candidates) {
    const key = identity(candidate);
    invariant(!seen.has(key), `duplicate candidate identity: ${key}`);
    seen.add(key);
    const current = baselineByIdentity.get(key) ?? null;
    if (!current) {
      rows.push({ state: 'candidate_only', key, changed_fields: [], candidate, baseline: null, removal_implied: false });
      continue;
    }
    const fields = changedFields(candidate, current);
    rows.push({ state: fields.length ? 'changed' : 'unchanged', key, changed_fields: fields, candidate, baseline: current, removal_implied: false });
    baselineByIdentity.delete(key);
  }

  for (const [key, current] of baselineByIdentity) {
    rows.push({
      state: 'baseline_only',
      key,
      changed_fields: [],
      candidate: null,
      baseline: current,
      removal_implied: false,
      note: 'Baseline-only means not present in this candidate partition. It is not a deletion instruction.'
    });
  }

  const order = { changed: 0, candidate_only: 1, baseline_only: 2, unchanged: 3 };
  rows.sort((a, b) => (order[a.state] - order[b.state]) || a.key.localeCompare(b.key));

  const counts = Object.fromEntries(['changed', 'candidate_only', 'baseline_only', 'unchanged'].map((state) => [state, rows.filter((row) => row.state === state).length]));
  return {
    schema_version: 'candidate-review-diff-v1',
    review_only: true,
    approval_effect: 'none',
    publication_effect: 'none',
    country_id: candidateCountry,
    authority_id: candidateAuthority,
    candidate_schema: candidateFile.schema_version,
    candidate_adapter_id: text(candidateFile.adapter_id ?? candidateFile.source_adapter_id),
    candidate_generated_at: text(candidateFile.generated_at),
    candidate_window: candidateFile.candidate_window ?? null,
    candidate_review_status: text(candidateFile.review?.status ?? null),
    baseline_schema: baselineFile.schema_version,
    baseline_generated_at: text(baselineFile.generated_at),
    counts,
    rows
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function valueCell(value) {
  if (Array.isArray(value)) return escapeHtml(value.map((item) => typeof item === 'object' ? JSON.stringify(item) : item).join('\n'));
  return escapeHtml(value ?? '—');
}

function recordTable(record, title) {
  if (!record) return `<section class="record empty"><h3>${escapeHtml(title)}</h3><p>—</p></section>`;
  const fields = [...MEETING_FIELDS, 'source_url', 'review_status'];
  const rows = fields.map((field) => `<tr><th>${escapeHtml(field)}</th><td>${valueCell(record[field])}</td></tr>`).join('');
  const raceRows = record.timetable_rows.length
    ? `<details><summary>Timetable rows (${record.timetable_rows.length})</summary><pre>${escapeHtml(JSON.stringify(stableRows(record.timetable_rows), null, 2))}</pre></details>`
    : '<p class="muted">No timetable rows in this side of the review.</p>';
  return `<section class="record"><h3>${escapeHtml(title)}</h3><table>${rows}</table>${raceRows}</section>`;
}

export function renderCandidateDiffHtml(diff, { title = 'Candidate review diff' } = {}) {
  invariant(diff?.review_only === true && diff?.approval_effect === 'none' && diff?.publication_effect === 'none', 'diff is not review-only');
  const cards = diff.rows.map((row) => `
    <article class="diff-card state-${escapeHtml(row.state)}">
      <header><span class="state">${escapeHtml(row.state)}</span><code>${escapeHtml(row.key)}</code></header>
      ${row.changed_fields.length ? `<p><strong>Changed:</strong> ${escapeHtml(row.changed_fields.join(', '))}</p>` : ''}
      ${row.note ? `<p class="warning">${escapeHtml(row.note)}</p>` : ''}
      <div class="compare">${recordTable(row.baseline, 'Reviewed / canonical baseline')}${recordTable(row.candidate, 'Candidate')}</div>
    </article>`).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="robots" content="noindex,nofollow,noarchive">
<style>
:root{color-scheme:dark;font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0d10;color:#e8eaed}body{margin:0;padding:24px}main{max-width:1400px;margin:auto}.banner,.diff-card{border:1px solid #343a40;border-radius:12px;padding:16px;margin:0 0 16px;background:#12161b}.banner strong{color:#ffd166}.stats{display:flex;gap:10px;flex-wrap:wrap}.stats span,.state{border:1px solid #4b5563;border-radius:999px;padding:4px 8px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:14px}.record{min-width:0}table{width:100%;border-collapse:collapse}th,td{padding:6px;border-bottom:1px solid #2b3137;text-align:left;vertical-align:top}th{width:34%;color:#adb5bd}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#0b0d10;padding:10px;border-radius:8px}.warning{color:#ffd166}.muted{color:#929aa3}code{overflow-wrap:anywhere}.state-changed{border-left:4px solid #ffd166}.state-candidate_only{border-left:4px solid #7bdff2}.state-baseline_only{border-left:4px solid #f7a072}.state-unchanged{border-left:4px solid #8ac926}@media(max-width:800px){body{padding:12px}.compare{grid-template-columns:1fr}}
</style></head><body><main>
<h1>${escapeHtml(title)}</h1>
<section class="banner"><strong>REVIEW ONLY — NOT PUBLICATION</strong><p>This artifact compares a candidate with the reviewed/canonical baseline. It cannot approve, promote, delete, publish, merge, or deploy data. Baseline-only rows never imply removal.</p></section>
<p><strong>Partition:</strong> ${escapeHtml(diff.country_id)} / ${escapeHtml(diff.authority_id)}</p>
<p><strong>Candidate:</strong> ${escapeHtml(diff.candidate_adapter_id ?? 'unknown')} · ${escapeHtml(diff.candidate_generated_at ?? 'unknown')} · review ${escapeHtml(diff.candidate_review_status ?? 'unknown')}</p>
<p><strong>Baseline:</strong> ${escapeHtml(diff.baseline_schema)} · ${escapeHtml(diff.baseline_generated_at ?? 'unknown')}</p>
<div class="stats"><span>Changed ${diff.counts.changed}</span><span>Candidate only ${diff.counts.candidate_only}</span><span>Baseline only ${diff.counts.baseline_only}</span><span>Unchanged ${diff.counts.unchanged}</span></div>
${cards || '<p>No records in this review partition.</p>'}
</main></body></html>`;
}
