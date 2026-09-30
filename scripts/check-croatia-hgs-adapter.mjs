import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildCroatiaMeetingRecord,parseCroatiaCalendarHtml,parseCroatiaCurrentSeasonHtml} from './timetable/croatia-hgs-calendar-core.mjs';

const current='<h1>Aktualna sezona</h1><p>I. – Zagreb – 06.04.2026. – Test</p><p>III. – Zagreb – 10.10.2026. – Zagrebačka milja</p>';
const currentRows=parseCroatiaCurrentSeasonHtml(current);
assert.deepEqual(currentRows.map(r=>r.date),['2026-04-06','2026-10-10']);

const calendar='<h1>Kalendar</h1><p>1. Hipodrom Zagreb, 06.04.2026. – Test</p><p>4. Hipodrom Zagreb, 17.10.2026. – St. Leger</p>';
const calendarRows=parseCroatiaCalendarHtml(calendar);
assert.deepEqual(calendarRows.map(r=>r.date),['2026-04-06','2026-10-17']);

const rec=buildCroatiaMeetingRecord(currentRows[1],{checkedAt:'2026-09-30T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'croatia--hipodrom-zagreb');

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.croatia-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-croatia-hgs-official-window.mjs','--as-of=2026-09-30','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('CROATIA_HGS_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-10'),'current-season route must include 2026-10-10 Zagreb');
    assert.ok(!(artifact.records??[]).some(r=>r.date==='2026-10-17'),'stale calendar fallback must not override current-season 2026-10-10 date');
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('CROATIA_HGS_ADAPTER: pass');
