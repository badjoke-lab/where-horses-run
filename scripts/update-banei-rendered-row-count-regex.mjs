import fs from 'node:fs';

const file = 'scripts/check-calendar-banei-bilingual-rendered-fixture.mjs';
let text = fs.readFileSync(file, 'utf8');
const replacements = [
  ["const enRows = (enDetail.match(/<tr>/g) ?? []).length;", "const enRows = (enDetail.match(/<tr(?:\\s|>)/g) ?? []).length;"],
  ["const jaRows = (jaDetail.match(/<tr>/g) ?? []).length;", "const jaRows = (jaDetail.match(/<tr(?:\\s|>)/g) ?? []).length;"],
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`row-count marker missing: ${from}`);
  text = text.replace(from, to);
}
fs.writeFileSync(file, text);
console.log('BANEI_RENDERED_ROW_COUNT_REGEX_UPDATED');
