import fs from 'node:fs';

const adapterPath = 'scripts/timetable/japan-official-30d-adapters.mjs';
let adapter = fs.readFileSync(adapterPath, 'utf8');
const functionStart = adapter.indexOf('function narRaceNameFromBlock(block, raceNumber) {');
const functionEnd = adapter.indexOf('\n\nfunction discoverNarRaceNumbers', functionStart);
if (functionStart < 0 || functionEnd < 0) throw new Error('narRaceNameFromBlock boundary missing');
const replacement = `function narRaceNameFromBlock(block, raceNumber) {
  for (const match of block.matchAll(/<a\\b([^>]*)>([\\s\\S]*?)<\\/a>/gi)) {
    const hrefMatch = match[1].match(/\\bhref\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
    const href = entities(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '');
    if (!/(?:^|\\/)(?:S_)?DebaTable(?:\\?|$)/i.test(href)) continue;
    const value = plain(match[2]);
    if (value && !new RegExp(\`^\${raceNumber}\\\\s*R$\`, 'i').test(value) && !/(出馬表|詳細)/.test(value)) return value;
  }
  return null;
}`;
adapter = adapter.slice(0, functionStart) + replacement + adapter.slice(functionEnd);
fs.writeFileSync(adapterPath, adapter);

const checkPath = 'scripts/check-japan-zero-based-30d.mjs';
let check = fs.readFileSync(checkPath, 'utf8');
const anchor = "assert.equal(narRows[0].race_name, 'Ｃ６組');\nassert.equal(narRows[0].distance_m, 1500);\n";
if (!check.includes(anchor)) throw new Error('NAR assertion anchor missing');
const addition = `${anchor}\nconst narCurrentUnquotedHrefFixture = \`<table><tr class="data">\n<td>1R</td><td>15:25</td><td></td><td>特別</td>\n<td><a href=/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F09%2F05&amp;k_raceNo=1&amp;k_babaCode=31>徳島県ミルクとすだち特別２歳－４</a></td>\n<td>右1300m</td><td>曇</td><td>不良</td><td>8</td>\n</tr></table>\`;\nconst narCurrentUnquotedRows = parseNarRaceListPage(narCurrentUnquotedHrefFixture);\nassert.equal(narCurrentUnquotedRows.length, 1);\nassert.equal(narCurrentUnquotedRows[0].race_name, '徳島県ミルクとすだち特別２歳－４');\nassert.equal(narCurrentUnquotedRows[0].post_time_local, '15:25');\nassert.equal(narCurrentUnquotedRows[0].distance_m, 1300);\n`;
check = check.replace(anchor, addition);
fs.writeFileSync(checkPath, check);
