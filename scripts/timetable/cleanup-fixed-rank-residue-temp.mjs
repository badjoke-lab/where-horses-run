import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function scrubPublicCeiling(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== 'public_ceiling' && !(typeof item === 'string' && item.includes('public_ceiling')))
      .map(scrubPublicCeiling);
  }
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === 'public_ceiling' || key === 'public_ceiling_enum') continue;
      next[key] = scrubPublicCeiling(child);
    }
    return next;
  }
  return value;
}

for (const file of walk('data/static').filter((file) => /calendar-readiness.*\.json$/.test(file))) {
  const data = JSON.parse(read(file));
  write(file, `${JSON.stringify(scrubPublicCeiling(data), null, 2)}\n`);
}

function removeLinesContaining(file, needles) {
  if (!fs.existsSync(file)) return;
  const lines = read(file).split('\n');
  const next = lines.filter((line) => !needles.some((needle) => line.includes(needle)));
  write(file, next.join('\n'));
}

{
  const file = 'scripts/timetable/load-calendar-readiness.mjs';
  let text = read(file);
  text = text.replace("const AMENDMENT_FIELDS = new Set(['public_ceiling', 'confirmed_fields', 'reason']);", "const AMENDMENT_FIELDS = new Set(['confirmed_fields', 'reason']);");
  text = text.replace(/\n\s*if \(amendment\.public_ceiling != null\) \{[\s\S]*?\n\s*\}\n\n\s*if \(amendment\.confirmed_fields != null\)/, '\n\n    if (amendment.confirmed_fields != null)');
  text = text.replace(/\n\s*\.\.\.\(amendment\.public_ceiling == null \? \{\} : \{ public_ceiling: amendment\.public_ceiling \}\),/g, '');
  write(file, text);
}

for (const file of [
  'scripts/timetable/manual-refresh-jra.mjs',
  'scripts/timetable/manual-promote-reviewed-nar-monthly.mjs',
]) {
  removeLinesContaining(file, [
    'data/generated/timetable/public/japan-a-plus-overrides.json',
    'build-japan-a-plus-public-overrides.mjs',
    'check-japan-a-plus-public-overrides.mjs',
  ]);
}

removeLinesContaining('scripts/check-calendar-runtime-import-boundary.mjs', [
  'data/generated/timetable/public/japan-a-plus-overrides.json',
]);

{
  const file = 'scripts/check-japan-best-available-rank.mjs';
  let text = read(file);
  text = text.replace(/assert\.match\(\n  publicViewModelSource,\n  \/canApplyMeetingRankOverride[\s\S]*?\n\);\n/g, "assert.doesNotMatch(publicViewModelSource, /RankOverride/, 'static public rank overrides must not exist');\n");
  text = text.replace(/assert\.match\(\n  publicViewModelSource,\n  \/canApplyDetailRankOverride[\s\S]*?\n\);\n/g, '');
  write(file, text);
}

{
  const file = 'scripts/check-calendar-jra-pilot-completion-v2.mjs';
  if (fs.existsSync(file)) {
    let text = read(file);
    text = text.replace("const overrides = json('data/generated/timetable/public/japan-a-plus-overrides.json');\n", '');
    text = text.replace("if (!ready || ready.technical_rank !== 'A+' || ready.public_ceiling !== 'A+') fail('JRA readiness');", "if (!ready || ready.technical_rank !== 'A+') fail('JRA readiness');");
    text = text.replace(/\nif \(overrides\.generated_at !== list\.generated_at \|\| overrides\.generated_at !== detailData\.generated_at\) fail\('override timestamp'\);/, '');
    write(file, text);
  }
}

{
  const file = 'scripts/check-calendar-nar-reviewed-promotion-operator.mjs';
  if (fs.existsSync(file)) {
    let text = read(file);
    text = text.replaceAll("'data/generated/timetable/public/japan-a-plus-overrides.json',\n", '');
    text = text.replaceAll('data/generated/timetable/public/japan-a-plus-overrides.json', 'data/generated/timetable/public/meeting-details.json');
    text = text.replaceAll('build-japan-a-plus-public-overrides.mjs', 'build-public-timetable-view.mjs');
    text = text.replaceAll('check-japan-a-plus-public-overrides.mjs', 'check-public-timetable-view.mjs');
    write(file, text);
  }
}

{
  const file = 'scripts/check-calendar-banei-bilingual-rendered-fixture.mjs';
  if (fs.existsSync(file)) {
    let text = read(file);
    const marker = "writeJson(path.join(worktree, 'data/generated/timetable/public/japan-a-plus-overrides.json'), {";
    const start = text.indexOf(marker);
    if (start >= 0) {
      const end = text.indexOf('\n  });', start);
      if (end < 0) throw new Error('Could not remove legacy Japan override fixture block');
      text = text.slice(0, start) + text.slice(end + '\n  });'.length);
    }
    write(file, text);
  }
}

for (const file of [
  'scripts/check-japan-a-plus-public-overrides.mjs',
]) {
  if (fs.existsSync(file)) fs.rmSync(file);
}

// Remove stale references to the deleted checker from operator/workflow/package text where it can only be a standalone command.
for (const file of [...walk('.github/workflows'), 'package.json'].filter((file) => fs.existsSync(file))) {
  const before = read(file);
  const lines = before.split('\n');
  const next = lines.filter((line) => !line.includes('check-japan-a-plus-public-overrides.mjs') && !line.includes('build-japan-a-plus-public-overrides.mjs'));
  if (next.join('\n') !== before) write(file, next.join('\n'));
}

console.log('FIXED_RANK_RESIDUE_CLEANUP: applied');
