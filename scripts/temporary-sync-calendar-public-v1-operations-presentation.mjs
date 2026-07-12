import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required synchronization anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

replaceRequired(
  'data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json',
  '"expected_public_behavior": "Mixed C and A+ publication is valid; C rows must state that additional detail is not reviewed."',
  '"expected_public_behavior": "Mixed C and A+ publication is valid; C rows must show meeting-only reviewed coverage and their current source-specific public ceiling. Retry ownership is handled by the following Public v1 operations-presentation unit."',
);
replaceRequired(
  'docs/calendar/public-v1-pilot-record-reconciliation.md',
  'Mixed C and A+ output is valid. C rows are schedule identities and must state that additional detail is not reviewed. A+ rows may show the reviewed programme summary.',
  'Mixed C and A+ output is valid. C rows show meeting-only reviewed coverage and their current source-specific public ceiling. A+ rows may show the reviewed programme summary. Retry ownership is handled by the following Public v1 operations-presentation unit rather than inferred from the public projection.',
);
replaceRequired(
  'scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs',
  `if (!narRows.some((row) => row.effective_public_rank === 'C')) fail('NAR must retain C schedule rows.');
if (!narRows.some((row) => row.effective_public_rank === 'A+')) fail('NAR must retain A+ detail rows.');
if (narRows.filter((row) => row.effective_public_rank === 'C').some((row) => row.public_gap_status !== 'more_detail_not_reviewed')) {
  fail('NAR C rows must expose an honest additional-detail gap.');
}`,
  `if (!narRows.some((row) => row.effective_public_rank === 'C')) fail('NAR must retain C schedule rows.');
if (!narRows.some((row) => row.effective_public_rank === 'A+')) fail('NAR must retain A+ detail rows.');
const narCRows = narRows.filter((row) => row.effective_public_rank === 'C');
if (narCRows.some((row) => row.coverage_status !== 'meeting_only')) {
  fail('NAR C rows must expose meeting-only reviewed coverage.');
}
if (!narCRows.some((row) => row.public_gap_status === 'at_current_public_ceiling')) {
  fail('NAR must retain source-specific C-ceiling rows.');
}`,
);

replaceRequired(
  'docs/calendar/README.md',
  '- [`public-v1-pilot-record-reconciliation.md`](public-v1-pilot-record-reconciliation.md) — deterministic reviewed-coverage and additional-detail states across JRA, NAR, Banei, HKJC, and UAE public meeting rows.\n',
  '- [`public-v1-pilot-record-reconciliation.md`](public-v1-pilot-record-reconciliation.md) — deterministic reviewed-coverage and additional-detail states across JRA, NAR, Banei, HKJC, and UAE public meeting rows.\n- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.\n',
);
replaceRequired(
  'docs/calendar/README.md',
  'data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json\n',
  'data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json\ndata/audits/calendar-public-v1-operations-presentation-v1.json\n',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Current implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01` — in review',
  'Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`\nCurrent implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01` — in review',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current Public v1 pilot-record evidence:

- every public meeting row derives a reviewed-coverage label from its effective public rank;
- every row distinguishes unreviewed detail, an applied public ceiling, or the current reviewed ceiling;
- JRA, NAR, Banei, HKJC, and UAE are reconciled against Acquisition Registry and canonical/public evidence;
- source status, HTTPS official source, and last-checked date remain visible;
- no internal review, queue, operator, or raw-source data is exposed;
- automatic acquisition, approval, promotion, and unattended publication remain disabled.`,
  `Completed Public v1 pilot-record evidence:

- every public meeting row derives a reviewed-coverage label from its effective public rank;
- every row distinguishes unreviewed detail, an applied public ceiling, or the current reviewed ceiling;
- JRA, NAR, Banei, HKJC, and UAE are reconciled against Acquisition Registry and canonical/public evidence;
- source status, HTTPS official source, and last-checked date remain visible;
- no internal review, queue, operator, or raw-source data is exposed.

Current Public v1 operations-presentation evidence:

- Calendar, Today, and Tomorrow display bilingual public operations notices;
- current, stale, empty, before-window, and after-window states remain governed by Dynamic Dates;
- visible partial or stale source evidence is identified without exposing internal source records;
- source-failure copy states that no meeting is invented and official sources remain the fallback;
- retry ownership is shown only as reviewed operations, without Queue counts, attempt history, or operator notes;
- automatic acquisition, queue mutation, approval, promotion, and unattended publication remain disabled.`,
);

console.log('CALENDAR_PUBLIC_V1_OPERATIONS_PRESENTATION_SYNC: applied');
