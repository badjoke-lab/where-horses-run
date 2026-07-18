import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataModule = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
const imported = [...dataModule.matchAll(/from ['"]\.\.\/\.\.\/(data\/(?:static|generated)\/[^'"]+\.json)['"]/g)].map((match) => match[1]);
const files = [...new Set([...imported, 'data/static/i18n/en.json', 'data/static/i18n/ja.json'])].sort();
const patterns = [
  ['early_candidate', /\bearly candidate\b/i],
  ['candidate_for', /\bcandidate for\b/i],
  ['candidate_generation', /\bcandidate generation\b/i],
  ['source_candidate', /\bsource(?: record)? candidate\b/i],
  ['parser', /\bparser\b/i],
  ['parser_work', /\bparser work\b/i],
  ['automation', /\bautomation\b/i],
  ['automate', /\bautomate\b/i],
  ['internally', /\binternally\b/i],
  ['internal', /\binternal\b/i],
  ['scraping', /\bscrap(?:e|ing)\b/i],
  ['acquisition', /\bacquisition\b/i],
  ['risk_posture', /\brisk posture\b/i],
  ['priority_candidate', /\bpriority candidate\b/i],
  ['m3', /\bm3\b/i],
  ['pr_number', /\bpr[- ]?\d+\b/i],
  ['next_step', /\bnext step\b/i],
  ['dry_run', /\bdry[- ]run\b/i],
  ['live_fetch', /\blive fetch(?:ing)?\b/i],
];
const findings = [];

function scan(value, file, pointer = '$', key = '') {
  if (typeof value === 'string') {
    for (const [code, pattern] of patterns) {
      if (!pattern.test(value)) continue;
      findings.push({ file, pointer, key, code, value: value.trim().slice(0, 500) });
      break;
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scan(item, file, `${pointer}[${index}]`, key));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) scan(child, file, `${pointer}.${childKey}`, childKey);
  }
}

for (const file of files) scan(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')), file);
const byFile = Object.fromEntries([...new Set(findings.map((item) => item.file))].sort().map((file) => [file, findings.filter((item) => item.file === file)]));
const report = {
  schemaVersion: 'v1-data-public-boundary-discovery-v1',
  files: files.length,
  staticFiles: files.filter((file) => file.startsWith('data/static/')).length,
  generatedFiles: files.filter((file) => file.startsWith('data/generated/')).length,
  findings: findings.length,
  filesWithFindings: Object.keys(byFile).length,
  byFile,
};
fs.writeFileSync('v1-data-public-boundary-discovery.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
