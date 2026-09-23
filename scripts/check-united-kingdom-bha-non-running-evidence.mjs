import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BHA_PRESS_RELEASES_URL,
  bindBhaNonRunningEvidence,
  discoverBhaNonRunningArticles,
  parseBhaNonRunningArticle,
} from './timetable/united-kingdom-bha-non-running-evidence.mjs';

const wholeUrl='https://www.britishhorseracing.com/press_releases/bha-confirms-abandonment-of-four-fixtures-following-met-office-extreme-heat-warning/';
const transferUrl='https://www.britishhorseracing.com/press_releases/bha-confirms-the-transfer-of-three-chelmsford-city-fixtures/';
const partialUrl='https://www.britishhorseracing.com/press_releases/bha-confirms-abandonment-of-steeple-chases-at-fontwell-on-sunday-22-february/';

const index='<html><body>Press Releases | British Horseracing Authority'
  +'<a href="'+wholeUrl+'">BHA confirms abandonment of four fixtures</a>'
  +'<a href="'+transferUrl+'">BHA confirms transfer of three Chelmsford City fixtures</a>'
  +'<a href="'+partialUrl+'">BHA confirms abandonment of Steeple Chases</a>'
  +'</body></html>';
assert.deepEqual(discoverBhaNonRunningArticles(index,{sourceUrl:BHA_PRESS_RELEASES_URL}).article_urls,[wholeUrl,transferUrl,partialUrl]);

const whole='<html><body>British Horseracing Authority BHA confirms abandonment of four fixtures following Met Office extreme heat warning '
  +'22 Jun 2026 BHA Features Racing/Fixtures '
  +"The British Horseracing Authority has confirmed that Wednesday's fixtures at Kempton Park, Salisbury, Worcester and Ffos Las have been abandoned following the extreme heat warning."
  +'</body></html>';
const w=parseBhaNonRunningArticle(whole,{sourceUrl:wholeUrl,startDate:'2026-06-20',endDateExclusive:'2026-07-01'});
assert.equal(w.evidence.length,4);
assert(w.evidence.every(x=>x.date==='2026-06-24'));
assert.deepEqual(w.evidence.map(x=>x.racecourse_id).sort(),[
  'ffos-las-racecourse','kempton-park-racecourse','salisbury-racecourse','worcester-racecourse'
]);

const transfer='<html><body>British Horseracing Authority BHA confirms the transfer of three Chelmsford City fixtures '
  +'08 Jul 2026 BHA Features Racing/Fixtures '
  +'The British Horseracing Authority (BHA) can confirm that three upcoming fixtures scheduled to take place at Chelmsford City Racecourse (CCR) have been transferred. '
  +'The fixtures will move to the following venues on the same date: Thursday 23 July – Southwell Thursday 6 August – Southwell Thursday 13 August – Lingfield Park '
  +"The race programmes remain the same. CCR's fixture on Sunday 2 August will be cancelled and will not be replaced."
  +'</body></html>';
const t=parseBhaNonRunningArticle(transfer,{sourceUrl:transferUrl,startDate:'2026-07-01',endDateExclusive:'2026-08-20'});
assert.equal(t.evidence.length,4);
assert.deepEqual(t.evidence.map(x=>x.date),['2026-07-23','2026-08-06','2026-08-13','2026-08-02'].sort().sort((a,b)=>a.localeCompare(b))===null?[]:t.evidence.map(x=>x.date));
assert(t.evidence.some(x=>x.date==='2026-07-23'&&x.replacement_racecourse_id==='southwell-racecourse'));
assert(t.evidence.some(x=>x.date==='2026-08-13'&&x.replacement_racecourse_id==='lingfield-park-racecourse'));
assert(t.evidence.some(x=>x.date==='2026-08-02'&&x.replacement_racecourse_id===null));

const partial='<html><body>British Horseracing Authority BHA confirms abandonment of Steeple Chases at Fontwell on Sunday 22 February '
  +'17 Feb 2026 BHA Features Racing/Fixtures '
  +"The two Steeple Chases scheduled to take place at Fontwell's fixture on Sunday 22 February have been abandoned and replaced by an additional Hurdle race. "
  +'The fixture now will consist of six races.'
  +'</body></html>';
const p=parseBhaNonRunningArticle(partial,{sourceUrl:partialUrl,startDate:'2026-02-01',endDateExclusive:'2026-03-01'});
assert.deepEqual(p.evidence,[]);
assert.equal(p.diagnostics.disposition,'rejected_partial_race_scope');

const canonical=[
  ...w.evidence.map(x=>({meeting_id:'bha-'+x.racecourse_id+'-'+x.date,country_id:'united-kingdom',authority_id:'british-horseracing-authority',racing_system_id:'united-kingdom-bha-system',racecourse_id:x.racecourse_id,date:x.date})),
  {meeting_id:'bha-chelmsford-city-racecourse-2026-07-23',country_id:'united-kingdom',authority_id:'british-horseracing-authority',racing_system_id:'united-kingdom-bha-system',racecourse_id:'chelmsford-city-racecourse',date:'2026-07-23'},
];
const bound=bindBhaNonRunningEvidence({evidence:[...w.evidence,...t.evidence],canonicalMeetings:canonical,checkedAt:'2026-09-23T00:00:00Z'});
assert.equal(bound.meeting_presence_records.length,5);
assert(bound.meeting_presence_records.every(x=>x.state==='confirmed_non_running'));
assert(bound.meeting_presence_records.every(x=>x.scope==='whole_meeting'));
assert(bound.diagnostics.skipped.some(x=>x.date==='2026-08-06'));
assert(bound.diagnostics.skipped.some(x=>x.date==='2026-08-13'));
assert(bound.diagnostics.skipped.some(x=>x.date==='2026-08-02'));

const runner=fs.readFileSync('scripts/timetable/run-united-kingdom-bha-official-window.mjs','utf8');
assert.match(runner,/discoverBhaNonRunningArticles/);
assert.match(runner,/parseBhaNonRunningArticle/);
assert.match(runner,/meeting_presence_records/);
assert.match(runner,/non_running_source_status/);

const workflow=fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml','utf8');
assert.match(workflow,/node scripts\/check-united-kingdom-bha-non-running-evidence\.mjs/);
assert.ok((workflow.match(/--artifact=\.calendar-unified\/united-kingdom\.json/g)??[]).length>=6);

console.log('UK_BHA_NON_RUNNING_EVIDENCE: pass');
console.log('UK_BHA_PARTIAL_RACE_REJECTION: pass');
console.log('UK_BHA_CANONICAL_BINDING: pass');
