import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildRomaniaPloiestiMeetingRecord,extractPloiestiArticleLinks,parsePloiestiArticleHtml} from './timetable/romania-ploiesti-calendar-core.mjs';

const category='<a href="https://www.csmploiesti.ro/2026/09/20/hipodromul-ploiesti-test/">A</a><a href="https://www.csmploiesti.ro/2026/09/18/reuniunea-test/">B</a>';
assert.equal(extractPloiestiArticleLinks(category).length,2);

const resultHtml='<p>Următorul eveniment hipic este programat duminică, 4 octombrie, atunci când se vor ţine Premiul Agriculturii şi Premiul României la Trap.</p>';
const rows=parsePloiestiArticleHtml(resultHtml,{sourceUrl:'https://www.csmploiesti.ro/2026/09/20/hipodromul-ploiesti-test/'});
assert.deepEqual(rows.map(r=>r.date),['2026-10-04']);

const noticeHtml='<p>Duminică, 20 septembrie, începând cu ora 10:00, Hipodromul Ploieşti va fi gazda unei noi reuniune hipică oficială.</p>';
const noticeRows=parsePloiestiArticleHtml(noticeHtml,{sourceUrl:'https://www.csmploiesti.ro/2026/09/18/reuniunea-test/'});
assert.deepEqual(noticeRows.map(r=>r.date),['2026-09-20']);

const rec=buildRomaniaPloiestiMeetingRecord(rows[0],{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'romania--hipodromul-ploiesti');

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.romania-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-romania-ploiesti-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:180000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('ROMANIA_PLOIESTI_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-04'),'official recent notices must expose the 2026-10-04 Ploiesti meeting');
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('ROMANIA_PLOIESTI_ADAPTER: pass');
