import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildSuisseTrotRecord,parseSuisseTrotCalendarHtml} from './timetable/switzerland-suisse-trot-calendar-core.mjs';

const html='<h1>CALENDRIER 2026</h1><p>MAIENFELD – 4 OCTOBRE 2026</p><p>MAIENFELD – 11 OCTOBRE 2026</p><p>AVENCHES – 15 OCTOBRE 2026</p><p>AVENCHES – 20 OCTOBRE 2026</p>';
const rows=parseSuisseTrotCalendarHtml(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-04','2026-10-11','2026-10-15','2026-10-20']);
assert.equal(rows[0].racecourse_id,'switzerland--rossriet-maienfeld');
assert.equal(rows[2].racecourse_id,'switzerland--iena-avenches');
const rec=buildSuisseTrotRecord(rows[0],{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);

if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  const output='.swiss-trot-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-switzerland-suisse-trot-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('SWITZERLAND_SUISS_TROT_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>[r.date,r.racecourse_id])}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    // Suisse Trot removes completed meetings from the live calendar; validate the current rolling result instead.
    assert.ok((artifact.records??[]).length>=1);
    assert.ok((artifact.records??[]).every(r=>r.date>='2026-10-01'&&r.date<'2026-10-31'));
    assert.ok((artifact.records??[]).every(r=>[
      'switzerland--rossriet-maienfeld',
      'switzerland--iena-avenches',
    ].includes(r.racecourse_id)));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('SWITZERLAND_SUISS_TROT_ADAPTER: pass');
