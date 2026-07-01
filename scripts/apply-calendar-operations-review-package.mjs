import { readFileSync, writeFileSync } from 'node:fs';

const file = '.github/workflows/calendar-operations-review.yml';
let text = readFileSync(file, 'utf8');

const oldBuild = `      - name: Build review-only operations artifact
        run: |
          node scripts/timetable/build-operations-status.mjs \\
            --reference-date "\${{ steps.date.outputs.value }}" \\
            --output /tmp/calendar-operations-status.json`;
const newBuild = `      - name: Build review-only operations artifacts
        run: |
          node scripts/timetable/build-operations-status.mjs \\
            --reference-date "\${{ steps.date.outputs.value }}" \\
            --output /tmp/calendar-operations-status.json
          node scripts/timetable/build-operations-review-package.mjs \\
            --status /tmp/calendar-operations-status.json \\
            --output /tmp/calendar-operations-review-package.json`;

const oldUpload = `          name: calendar-operations-status-\${{ steps.date.outputs.value }}
          path: /tmp/calendar-operations-status.json`;
const newUpload = `          name: calendar-operations-review-\${{ steps.date.outputs.value }}
          path: |
            /tmp/calendar-operations-status.json
            /tmp/calendar-operations-review-package.json`;

if (!text.includes(oldBuild)) throw new Error('Operations workflow build marker missing.');
if (!text.includes(oldUpload)) throw new Error('Operations workflow upload marker missing.');
text = text.replace(oldBuild, newBuild).replace(oldUpload, newUpload);
writeFileSync(file, text);
console.log('CALENDAR_OPERATIONS_REVIEW_PACKAGE_APPLIED');
