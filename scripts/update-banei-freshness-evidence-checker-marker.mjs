import fs from 'node:fs';

const file = 'scripts/check-calendar-banei-freshness-rollback-operating-evidence.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = "  'source health and freshness are separate signals',";
const to = "  'Source health and freshness are separate signals',";
if (!text.includes(from)) throw new Error('freshness separation marker missing');
text = text.replace(from, to);
fs.writeFileSync(file, text);
console.log('BANEI_FRESHNESS_EVIDENCE_CHECKER_MARKER_UPDATED');
