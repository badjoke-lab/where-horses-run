import fs from 'node:fs';

const file = 'scripts/check-calendar-banei-retry-queue-state-apply.mjs';
let text = fs.readFileSync(file, 'utf8');
const replacements = [
  ["  'rollback evidence before replacement',", "  'Rollback evidence before replacement',"],
  ["  'explicit --apply',", "  'explicit `--apply`',"],
  ["  'explicit --restore',", "  'explicit `--restore`',"],
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`marker missing: ${from}`);
  text = text.replace(from, to);
}
fs.writeFileSync(file, text);
console.log('BANEI_STATE_APPLY_CHECKER_MARKERS_UPDATED');
