import fs from 'node:fs';

const year = '2026';
const month = '06';
const sourceUrl = 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop';
const outputPath = 'data/generated/timetable/manual-june-2026-nar.json';

const racecourseByCode = new Map([
  ['36', 'Mombetsu'], ['1', 'Sapporo'], ['10', 'Morioka'], ['11', 'Mizusawa'],
  ['18', 'Urawa'], ['19', 'Funabashi'], ['20', 'Ohi'], ['21', 'Kawasaki'],
  ['22', 'Kanazawa'], ['23', 'Kasamatsu'], ['24', 'Nagoya'], ['25', 'Chukyo'],
  ['27', 'Sonoda'], ['28', 'Himeji'], ['31', 'Kochi'], ['32', 'Saga']
]);

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`NAR monthly source fetch failed: ${response.status}`);
const html = await response.text();

const meetings = [];
const seen = new Set();
const linkRe = /href="([^"]*TodayRaceInfo\/RaceList\?k_babaCode=([^&"]+)&amp;k_raceDate=([^&"]+)[^"]*)"[^>]*>(.*?)<\/a>/g;
let match;
while ((match = linkRe.exec(html)) !== null) {
  const code = decodeURIComponent(match[2]);
  const date = decodeURIComponent(match[3]).replaceAll('/', '-');
  if (!date.startsWith(`${year}-${month}-`)) continue;
  const racecourse = racecourseByCode.get(code) || decodeHtml(match[4]);
  if (!racecourse) continue;
  const key = `${date}::${racecourse}`;
  if (seen.has(key)) continue;
  seen.add(key);
  meetings.push([date, racecourse]);
}

if (meetings.length < 1) throw new Error('No NAR June meetings extracted.');

meetings.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));

const output = {
  schema_version: 'manual-june-2026-record-set-v0',
  month: `${year}-${month}`,
  generated_from_route: true,
  record_set: {
    country_id: 'japan',
    country_label: 'Japan',
    group_id: 'nar',
    group_label: 'NAR',
    data_level: 'C',
    source_trace: {
      source_url: sourceUrl,
      source_type: 'official_source',
      source_capture_date: '2026-06-01',
      last_checked: '2026-06-01',
      parser: 'nar-monthly-convene-info'
    },
    meetings
  }
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`[pr-130-nar] wrote ${meetings.length} meetings to ${outputPath}`);
