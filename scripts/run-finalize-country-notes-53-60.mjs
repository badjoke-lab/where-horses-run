import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourcePath = path.join(root, 'scripts/finalize-country-notes-53-60.mjs');
const fixedPath = path.join(root, 'scripts/.finalize-country-notes-53-60.fixed.mjs');
let source = fs.readFileSync(sourcePath, 'utf8');

const replacements = [
  ["console.log('CURRENT_WORK_ID: WIRNOTE-53-60');", "console.log('CURRENT_WORK_ID: WHR-NOTE-53-60');"],
  ["  'Latest completed reviewed-note change: PR #327',\" 'roadmap phrases');", "  'Latest completed reviewed-note change: PR #327',\", 'roadmap phrases');"],
  [", \"roadmap logs');", ", 'roadmap logs');"],
  ["- tracker transition: \\`source_tested\\` to \\`note_reviewed`", "- tracker transition: \\`source_tested\\` to \\`note_reviewed\\`"],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Finalizer repair target not found: ${before}`);
  source = source.replace(before, after);
}

fs.writeFileSync(fixedPath, source);
try {
  await import(`${pathToFileURL(fixedPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(fixedPath, { force: true });
}
