import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'scripts/check-country-page-programme-roadmap.mjs');
let value = fs.readFileSync(file, 'utf8');
const before = "  'Latest completed reviewed-note change: PR #327',";
const after = "  'Latest completed reviewed-note change: PR #331',";
if (value.includes(before)) value = value.replace(before, after);
fs.writeFileSync(file, value);
console.log('PATCHED_NOTE_ROADMAP_61_68');
