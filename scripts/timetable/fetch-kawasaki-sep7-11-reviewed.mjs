import fs from 'node:fs/promises';

const meetings = [
  ['2026-09-07','https://www.nankankeiba.com/program/20260907210701.do'],
  ['2026-09-08','https://www.nankankeiba.com/program/20260908210702.do'],
  ['2026-09-09','https://www.nankankeiba.com/program/20260909210703.do'],
  ['2026-09-10','https://www.nankankeiba.com/program/20260910210704.do'],
  ['2026-09-11','https://www.nankankeiba.com/program/20260911210705.do'],
];

function decodeHtml(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h,16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(parseInt(d,10)));
}

function textify(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/((div|li|p|tr|td|th|h1|h2|h3|h4|section|article))>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function extractRows(text, date) {
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\d{1,2})R$/);
    if (!m) continue;
    const raceNo = Number(m[1]);
    let time = null;
    let distance = null;
    let name = null;
    for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
      if (/^\d{1,2}R$/.test(lines[j])) break;
      const td = lines[j].match(/(\d{2}:\d{2})\s+(\d{3,4})m/);
      if (td) { time = td[1]; distance = Number(td[2]); continue; }
      const t = lines[j].match(/^(\d{2}:\d{2})$/);
      if (t && !time) { time = t[1]; continue; }
      const d = lines[j].match(/^(\d{3,4})m$/);
      if (d && !distance) { distance = Number(d[1]); continue; }
      if (!name && time && distance && !/^(TOPICS|分析|変更|オッズ|着順速報|払戻金一覧|本日の騎乗一覧|SPAT4LOTO)/.test(lines[j])) {
        name = lines[j].replace(/\s+/g, ' ').trim();
      }
    }
    if (time && distance && name) rows.push({label:`Race ${raceNo}`, post_time_local:time, race_name:name, distance_m:distance, surface:'dirt', course_label:'left-handed'});
  }
  const byNo = new Map(rows.map(r => [Number(r.label.replace('Race ','')), r]));
  const ordered = Array.from({length:12},(_,k)=>byNo.get(k+1)).filter(Boolean);
  if (ordered.length !== 12) {
    console.error(JSON.stringify({date, extracted: ordered, lines: lines.slice(0,400)}, null, 2));
    throw new Error(`${date}: expected 12 races, got ${ordered.length}`);
  }
  return ordered;
}

const out = {schema_version:'reviewed-public-timetable-detail-supplement-v2', last_checked_date:'2026-09-03', meetings:[]};
for (const [date,url] of meetings) {
  const res = await fetch(url, {headers:{'user-agent':'Mozilla/5.0 WhereHorsesRun/1.0'}});
  if (!res.ok) throw new Error(`${date}: HTTP ${res.status}`);
  const html = await res.text();
  const rows = extractRows(textify(html), date);
  out.meetings.push({date, source_url:url, timetable_rows:rows});
}
await fs.writeFile('data/static/kawasaki-2026-09-07-through-11-public-detail-v2.json', JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
