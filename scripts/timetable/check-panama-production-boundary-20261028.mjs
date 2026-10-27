// Read-only production boundary check. C-only past meetings are not required
// to remain in the rolling future Calendar HTML after their dates have passed.
// This checks committed public facts separately from live EN/JA route reachability.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const input = JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-list.json', 'utf8'));
assert.ok(Array.isArray(input.meetings), 'Public meeting-list must have meetings[]');
const expected = ['2026-10-22', '2026-10-24'];
const matches = [];
for (const date of expected) {
  const rows = input.meetings.filter((x) =>
    x.meeting_id === 'panama-presidente-remon-' + date);
  assert.equal(rows.length, 1, 'Exactly one persisted Panama row required for ' + date);
  const row = rows[0];
  assert.equal(row.country_id, 'panama');
  assert.equal(row.date, date);
  assert.equal(row.racecourse_id, 'panama--hipodromo-presidente-remon');
  assert.equal(row.effective_public_rank, 'C');
  assert.equal(row.first_race_time_local, null, 'Do not invent post time');
  assert.equal(row.last_race_time_local, null, 'Do not invent post time');
  assert.equal(row.detail_path, null, 'C-only rows have no race-level detail page');
  matches.push({date, meeting_id:row.meeting_id, rank:row.effective_public_rank});
}
console.log('PANAMA_COMMITTED_PUBLIC', JSON.stringify({
  generated_at:input.generated_at, count:input.meetings.length, matches,
}));

const pages = [
  {key:'calendar-en',url:'https://whr.badjoke-lab.com/calendar/',phrase:'Global horse racing calendar'},
  {key:'calendar-ja',url:'https://whr.badjoke-lab.com/ja/calendar/',phrase:'世界の競馬開催カレンダー'},
  {key:'track-en',url:'https://whr.badjoke-lab.com/tracks/panama--hipodromo-presidente-remon/',phrase:'Presidente'},
  {key:'track-ja',url:'https://whr.badjoke-lab.com/ja/tracks/panama--hipodromo-presidente-remon/',phrase:'Presidente'},
];
const observations=[];
let failed=false;
for(const page of pages){
  try{
    const response=await fetch(page.url,{
      headers:{'user-agent':'WhereHorsesRun/1.0 owned-site-read-only-qa','accept':'text/html'},
      signal:AbortSignal.timeout(25000),redirect:'follow'
    });
    const body=await response.text();
    const markerPresent=body.includes(page.phrase);
    const looksLikePage=body.includes('<main') || body.includes('data-calendar-runtime-sensitive');
    const passed=response.ok && markerPresent && looksLikePage;
    observations.push({key:page.key,status:response.status,bytes:body.length,
      marker_present:markerPresent,html_page:looksLikePage,pass:passed});
    if(!passed)failed=true;
  }catch(error){
    observations.push({key:page.key,error:String(error?.message??error),pass:false});
    failed=true;
  }
}
console.log('PANAMA_LIVE_EN_JA_HTTP_HTML',JSON.stringify({
  checked_at:new Date().toISOString(),observations,
  note:'HTTP/SSR checks only; no browser/mobile visual QA claim. Past C-only meetings do not require historical rows in the current rolling window.'
}));
if(failed)process.exitCode=1;
