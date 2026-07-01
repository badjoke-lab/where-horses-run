import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('.github/workflows/calendar-operations-review.yml', [
  [
    `      - name: Build review-only operations artifact
        run: |
          node scripts/timetable/build-operations-status.mjs \\
            --reference-date "\${{ steps.date.outputs.value }}" \\
            --output /tmp/calendar-operations-status.json`,
    `      - name: Build review-only operations artifacts
        run: |
          node scripts/timetable/build-operations-status.mjs \\
            --reference-date "\${{ steps.date.outputs.value }}" \\
            --output /tmp/calendar-operations-status.json
          node scripts/timetable/build-operations-review-package.mjs \\
            --status /tmp/calendar-operations-status.json \\
            --output /tmp/calendar-operations-review-package.json`
  ],
  [
    `          name: calendar-operations-status-\${{ steps.date.outputs.value }}
          path: /tmp/calendar-operations-status.json`,
    `          name: calendar-operations-review-\${{ steps.date.outputs.value }}
          path: |
            /tmp/calendar-operations-status.json
            /tmp/calendar-operations-review-package.json`
  ]
]);

replace('docs/calendar/operations-v1-contract.md', [
  [
    `It does not fetch sources or change candidate, canonical, or public timetable data.
`,
    `It does not fetch sources or change candidate, canonical, or public timetable data.

The second layer adds a deterministic review package and canonical pause/rollback controls. The package prepares human review only; it does not create an update pull request.
`
  ],
  [
    `The report contains source age, review thresholds, revalidation actions, blocked and unavailable states, JRA candidate freshness, public projection age, current-window counts, and stable operator actions.
`,
    `The report contains source age, review thresholds, revalidation actions, blocked and unavailable states, JRA candidate freshness, public projection age, current-window counts, and stable operator actions.

## Review package

\`scripts/timetable/build-operations-review-package.mjs\` writes \`data/generated/timetable/operations-review-package.json\`.

The package adds stable action priority, six SHA-256 input digests, required human checks, and pause/rollback instructions. It proposes no changed files and records \`public_release_expected: false\`.

## Operations control

\`data/static/calendar-operations-control.json\` is the canonical control. Current mode is \`paused_review_only\`; scheduled refresh, live fetch in the canonical review workflow, automatic approval, canonical/public writes, and unattended publication remain disabled.
`
  ],
  [
    `.github/workflows/calendar-operations-review.yml\` is read-only. It generates a report artifact for an optional reference date and has \`contents: read\` permission only.
`,
    `.github/workflows/calendar-operations-review.yml\` is read-only. It generates status and review-package artifacts for an optional reference date and has \`contents: read\` permission only.
`
  ],
  [
    `node scripts/check-calendar-operations-status.mjs
`,
    `node scripts/check-calendar-operations-status.mjs
node scripts/timetable/build-operations-review-package.mjs --check
node scripts/check-calendar-operations-review-package.mjs
`
  ],
  [
    `- update-package preparation;
- pause and rollback ownership;
`,
    ``
  ]
]);

replace('docs/calendar/README.md', [
  [
    `- [\`../runbooks/calendar-operations-status-review.md\`](../runbooks/calendar-operations-status-review.md) — operator review order and escalation rules.
`,
    `- [\`../runbooks/calendar-operations-status-review.md\`](../runbooks/calendar-operations-status-review.md) — operator review order and escalation rules.
- [\`../runbooks/calendar-operations-pause-rollback.md\`](../runbooks/calendar-operations-pause-rollback.md) — canonical pause, rollback, and source-breakage controls.
`
  ],
  [
    `data/generated/timetable/operations-status.json
`,
    `data/static/calendar-operations-control.json
data/generated/timetable/operations-status.json
data/generated/timetable/operations-review-package.json
`
  ],
  [
    `scripts/check-calendar-operations-status.mjs
`,
    `scripts/check-calendar-operations-status.mjs
scripts/check-calendar-operations-review-package.mjs
`
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    `- \`docs/calendar/dynamic-dates-release-gate.md\`
`,
    `- \`docs/calendar/dynamic-dates-release-gate.md\`
- \`docs/calendar/operations-v1-contract.md\`
- \`docs/runbooks/calendar-operations-status-review.md\`
- \`docs/runbooks/calendar-operations-pause-rollback.md\`
`
  ],
  [
    `- \`data/audits/calendar-dynamic-dates-release-gate.json\`
`,
    `- \`data/audits/calendar-dynamic-dates-release-gate.json\`
- \`data/static/calendar-operations-control.json\`
- \`data/generated/timetable/operations-status.json\`
- \`data/generated/timetable/operations-review-package.json\`
`
  ],
  [
    `- \`scripts/check-calendar-dynamic-dates-release-gate.mjs\`
`,
    `- \`scripts/check-calendar-dynamic-dates-release-gate.mjs\`
- \`scripts/check-calendar-operations-status.mjs\`
- \`scripts/check-calendar-operations-review-package.mjs\`
`
  ]
]);

console.log('CALENDAR_OPERATIONS_REVIEW_PACKAGE_APPLIED');
