import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required synchronization anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

replaceRequired(
  'data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json',
  '"expected_public_behavior": "Mixed C and A+ publication is valid; C rows must state that additional detail is not reviewed."',
  '"expected_public_behavior": "Mixed C and A+ publication is valid; C rows below a higher reviewed ceiling must state that additional detail is not reviewed, while C-ceiling legacy rows remain at the current public ceiling."',
);
replaceRequired(
  'docs/calendar/public-v1-pilot-record-reconciliation.md',
  'Mixed C and A+ output is valid. C rows are schedule identities and must state that additional detail is not reviewed. A+ rows may show the reviewed programme summary.',
  'Mixed C and A+ output is valid. C rows below a higher reviewed ceiling state that additional detail is not reviewed. Legacy C-ceiling rows remain at the current public ceiling. A+ rows may show the reviewed programme summary.',
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
const narUpgradeableCRows = narRows.filter((row) => row.effective_public_rank === 'C' && rankIndex(row.max_public_rank) > rankIndex('C'));
const narCeilingCRows = narRows.filter((row) => row.effective_public_rank === 'C' && row.max_public_rank === 'C');
if (narUpgradeableCRows.length === 0) fail('NAR must retain C rows below a higher reviewed ceiling.');
if (narUpgradeableCRows.some((row) => row.public_gap_status !== 'more_detail_not_reviewed')) {
  fail('NAR upgradeable C rows must expose an honest additional-detail gap.');
}
if (narCeilingCRows.some((row) => row.public_gap_status !== 'at_current_public_ceiling')) {
  fail('NAR C-ceiling rows must expose the current reviewed public ceiling.');
}`,
);

replaceRequired(
  'docs/calendar/README.md',
  '- [`public-v1-surface-audit.md`](public-v1-surface-audit.md) — Calendar Public v1 Calendar/Today/Tomorrow shared-surface audit, validator reconciliation, bilingual parity, one-meeting-per-row boundary, and rendered fixture matrix.\n',
  '- [`public-v1-surface-audit.md`](public-v1-surface-audit.md) — Calendar Public v1 Calendar/Today/Tomorrow shared-surface audit, validator reconciliation, bilingual parity, one-meeting-per-row boundary, and rendered fixture matrix.\n- [`public-v1-pilot-record-reconciliation.md`](public-v1-pilot-record-reconciliation.md) — deterministic reviewed-coverage and additional-detail states across JRA, NAR, Banei, HKJC, and UAE public meeting rows.\n',
);
replaceRequired(
  'docs/calendar/README.md',
  'data/audits/calendar-public-v1-surface-audit-v1.json\n',
  'data/audits/calendar-public-v1-surface-audit-v1.json\ndata/audits/calendar-public-v1-pilot-record-reconciliation-v1.json\n',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Current implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01` — in review',
  'Completed implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01`\nCurrent implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01` — in review',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current Public v1 evidence unit:

- Calendar, Today, and Tomorrow share explicit reference-date/timezone resolution;
- English and Japanese routes use the shared \`CalendarDateStatus\` and \`TimetableMeetingList\`;
- one meeting remains one list row;
- C/B/B+/A/A+ list visibility and separate meeting-detail boundaries are checked;
- reproducible current-window and stale-window rendered fixtures are validated;
- automatic acquisition, approval, promotion, and unattended publication remain disabled.`,
  `Completed Public v1 surface evidence:

- Calendar, Today, and Tomorrow share explicit reference-date/timezone resolution;
- English and Japanese routes use the shared \`CalendarDateStatus\` and \`TimetableMeetingList\`;
- one meeting remains one list row;
- C/B/B+/A/A+ list visibility and separate meeting-detail boundaries are checked;
- reproducible current-window and stale-window rendered fixtures are validated.

Current Public v1 pilot-record evidence:

- every public meeting row derives a reviewed-coverage label from its effective public rank;
- every row distinguishes unreviewed detail, an applied public ceiling, or the current reviewed ceiling;
- JRA, NAR, Banei, HKJC, and UAE are reconciled against Acquisition Registry and canonical/public evidence;
- source status, HTTPS official source, and last-checked date remain visible;
- no internal review, queue, operator, or raw-source data is exposed;
- automatic acquisition, approval, promotion, and unattended publication remain disabled.`,
);

console.log('CALENDAR_PUBLIC_V1_PILOT_RECORD_SYNC: applied');
