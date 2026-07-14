import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const workflowDir = path.join(root, '.github/workflows');
const commands = new Set();

for (const name of fs.readdirSync(workflowDir)) {
  if (!name.endsWith('.yml') && !name.endsWith('.yaml')) continue;
  const text = fs.readFileSync(path.join(workflowDir, name), 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    const match = line.match(/^node\s+(scripts\/check-[A-Za-z0-9._/-]+\.mjs)(?:\s+([^#]+?))?\s*$/);
    if (!match) continue;
    const args = (match[2] ?? '').trim();
    if (/[${}<>|;&`\\]/.test(args)) continue;
    commands.add(`node ${match[1]}${args ? ` ${args}` : ''}`);
  }
}

const ordered = [...commands].sort();
const failures = [];
console.log(`PR505_WORKFLOW_CHECK_DIAGNOSTIC: ${ordered.length} commands`);

for (const [index, command] of ordered.entries()) {
  spawnSync('git', ['reset', '--hard', 'HEAD'], { cwd: root, encoding: 'utf8' });
  spawnSync('git', ['clean', '-fd'], { cwd: root, encoding: 'utf8' });
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const status = result.status ?? 1;
  console.log(`\n[${index + 1}/${ordered.length}] ${command}`);
  console.log(`status=${status} duration_ms=${Date.now() - startedAt}`);
  if (status === 0) {
    const summary = output.trim().split('\n').slice(-3).join('\n');
    if (summary) console.log(summary);
    continue;
  }
  const tail = output.trim().split('\n').slice(-100).join('\n');
  console.log('--- failure tail ---');
  console.log(tail);
  failures.push({ command, status, tail });
}

spawnSync('git', ['reset', '--hard', 'HEAD'], { cwd: root, encoding: 'utf8' });
spawnSync('git', ['clean', '-fd'], { cwd: root, encoding: 'utf8' });

console.log('\nPR505_WORKFLOW_CHECK_FAILURE_SUMMARY');
if (failures.length === 0) {
  console.log('none');
  process.exit(0);
}
for (const failure of failures) console.log(`- ${failure.command} (status ${failure.status})`);
process.exit(1);
