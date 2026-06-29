import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourcePath = path.join(root, 'scripts/apply-pub-53-60.mjs');
const fixedPath = path.join(root, 'scripts/.apply-pub-53-60.fixed.mjs');
let source = fs.readFileSync(sourcePath, 'utf8');
const before = '6. PR #325 must merge without \\`[CF-Pages-Skip]`, followed by one production-deployment confirmation.';
const after = '6. PR #325 must merge without \\`[CF-Pages-Skip]\\`, followed by one production-deployment confirmation.';
if (!source.includes(before)) throw new Error('publication finalizer syntax repair target not found');
source = source.replace(before, after);
fs.writeFileSync(fixedPath, source);
try {
  await import(`${pathToFileURL(fixedPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(fixedPath, { force: true });
}
