import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['diff', '--check'], { encoding: 'utf8' });
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const targets = new Map();

for (const line of output.split('\n')) {
  const match = line.match(/^(.+):(\d+): trailing whitespace\.$/);
  if (!match) continue;
  const [, file, lineNumber] = match;
  if (!targets.has(file)) targets.set(file, new Set());
  targets.get(file).add(Number(lineNumber));
}

for (const [file, lineNumbers] of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const lineNumber of lineNumbers) {
    const index = lineNumber - 1;
    if (index >= 0 && index < lines.length) lines[index] = lines[index].replace(/[ \t]+$/, '');
  }
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`cleaned ${file}: ${[...lineNumbers].sort((a, b) => a - b).join(',')}`);
}

const final = spawnSync('git', ['diff', '--check'], { encoding: 'utf8' });
if (final.status !== 0) {
  process.stdout.write(final.stdout ?? '');
  process.stderr.write(final.stderr ?? '');
  process.exit(final.status ?? 1);
}

console.log(`DOC_DIFF_WHITESPACE_CLEAN: files=${targets.size}`);
