import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const checkScript = packageJson.scripts?.check;
if (typeof checkScript !== 'string' || checkScript.length === 0) {
  throw new Error('package.json scripts.check is missing');
}

const commands = checkScript
  .split(/\s*&&\s*/)
  .map((command) => command.trim())
  .filter(Boolean);

const failures = [];
console.log(`PR505_ALL_CHECKS_DIAGNOSTIC: ${commands.length} commands`);

for (const [index, command] of commands.entries()) {
  spawnSync('git', ['reset', '--hard', 'HEAD'], { encoding: 'utf8' });
  const startedAt = Date.now();
  const result = spawnSync(command, {
    shell: true,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    maxBuffer: 20 * 1024 * 1024,
  });
  const durationMs = Date.now() - startedAt;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const status = result.status ?? 1;
  console.log(`\n[${index + 1}/${commands.length}] ${command}`);
  console.log(`status=${status} duration_ms=${durationMs}`);
  if (status === 0) {
    const summary = output.trim().split('\n').slice(-4).join('\n');
    if (summary) console.log(summary);
    continue;
  }

  const tail = output.trim().split('\n').slice(-120).join('\n');
  console.log('--- failure tail ---');
  console.log(tail);
  failures.push({ command, status, tail });
}

spawnSync('git', ['reset', '--hard', 'HEAD'], { encoding: 'utf8' });

console.log('\nPR505_ALL_CHECKS_FAILURE_SUMMARY');
if (failures.length === 0) {
  console.log('none');
  process.exit(0);
}
for (const failure of failures) {
  console.log(`- ${failure.command} (status ${failure.status})`);
}
process.exit(1);
