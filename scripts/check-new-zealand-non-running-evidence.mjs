import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NZTR_NEWS_URL,
  HRNZ_NEWS_URL,
  bindNewZealandNonRunningEvidence,
  discoverNztrNonRunningArticles,
  discoverHrnzNonRunningArticles,
  parseNztrNonRunningArticle,
  parseHrnzNonRunningArticle,
} from './timetable/new-zealand-non-running-evidence.mjs';

const nztrRemovedUrl='https://nztr.co.nz/news/awapuni-synthetic-meeting-update-and-incentive-series-confirmed';
const nztrTransferUrl='https://nztr.co.nz/news/ellerslie-25-may-meeting-transferred-following-abandonment-saturday';
const nztrPartialUrl='https://nztr.co.nz/news/nztr-statement-awapuni-abandonment';
const hrnzCalledOffUrl='https://www.hrnz.co.nz/news/cambridges-thursday-meeting-called-off-not-viable/';
const hrnzPostponedUrl='https://www.hrnz.co.nz/news/thursdays-alexandra-park-meeting-postponed-until-saturday/';
const hrnzTransferUrl='https://www.hrnz.co.nz/news/methven-meeting-transferred-to-ashburton/';

const nztrIndex='<html><body>NZTR News'
  +'<a href="'+nztrRemovedUrl+'">Awapuni meeting removed</a>'
  +'<a href="'+nztrTransferUrl+'">Ellerslie meeting transferred</a>'
  +'<a href="'+nztrPartialUrl+'">Awapuni abandonment</a>'
  +'</body></html>';
const nztrDiscovered=discoverNztrNonRunningArticles(nztrIndex,{sourceUrl:NZTR_NEWS_URL});
assert.deepEqual(nztrDiscovered.article_urls,[nztrRemovedUrl,nztrTransferUrl,nztrPartialUrl]);

const hrnzIndex='<html><body>Harness Racing New Zealand News'
  +'<a href="'+hrnzCalledOffUrl+'">Cambridge meeting called off</a>'
  +'<a href="'+hrnzPostponedUrl+'">Alexandra Park meeting postponed</a>'
  +'<a href="'+hrnzTransferUrl+'">Methven meeting transferred</a>'
  +'</body></html>';
const hrnzDiscovered=discoverHrnzNonRunningArticles(hrnzIndex,{sourceUrl:HRNZ_NEWS_URL});
assert.deepEqual(hrnzDiscovered.article_urls,[hrnzCalledOffUrl,hrnzPostponedUrl,hrnzTransferUrl]);

const removedHtml='<html><body>IN NZTR Awapuni Synthetic Meeting Update and Incentive Series Confirmed '
  +'Following a review of the upcoming synthetic track programme, the Awapuni synthetic meeting scheduled for Sunday 7 June has been removed from the racing calendar. '
  +'New Zealand Thoroughbred Racing | May 07, 2026</body></html>';
const removed=parseNztrNonRunningArticle(removedHtml,{
  sourceUrl:nztrRemovedUrl,startDate:'2026-06-01',endDateExclusive:'2026-07-01'
});
assert.equal(removed.evidence.length,1);
assert.equal(removed.evidence[0].date,'2026-06-07');
assert.equal(removed.evidence[0].racecourse_id,'awapuni-racecourse');

const transferredHtml='<html><body>IN NZTR Ellerslie 25 May Meeting Transferred Following Abandonment on Saturday '
  +'Following the partial abandonments of race meetings at Ellerslie on 10 and 20 April the race meeting scheduled to be held at Ellerslie on May 25th is moving to Pukekohe Park. '
  +'NZTR | April 22, 2024</body></html>';
const transferred=parseNztrNonRunningArticle(transferredHtml,{
  sourceUrl:nztrTransferUrl,startDate:'2024-05-01',endDateExclusive:'2024-06-01'
});
assert.equal(transferred.evidence.length,1);
assert.equal(transferred.evidence[0].date,'2024-05-25');
assert.equal(transferred.evidence[0].racecourse_id,'ellerslie-racecourse');
assert.equal(transferred.evidence[0].replacement_racecourse_id,'pukekohe-park-racecourse');
assert.equal(transferred.evidence[0].replacement_date,'2024-05-25');

const partialHtml='<html><body>IN NZTR NZTR Statement: Awapuni Abandonment '
  +'New Zealand Thoroughbred Racing (NZTR) acknowledge the industry’s disappointment regarding today’s abandonment at Awapuni following a slip in the first race. '
  +'The Listed Anzac Mile programmed for today will be transferred to Wanganui. NZTR | April 25, 2025</body></html>';
const partial=parseNztrNonRunningArticle(partialHtml,{
  sourceUrl:nztrPartialUrl,startDate:'2025-04-01',endDateExclusive:'2025-05-01'
});
assert.deepEqual(partial.evidence,[]);
assert.equal(partial.diagnostics.disposition,'rejected_partial_or_in_progress_abandonment');

const calledOffHtml='<html><body>Cambridge&#039;s Thursday meeting called off - "not viable" | Harness Racing New Zealand '
  +'4 August 2025 , News Harness Racing New Zealand is looking at ways it can make up for Thursday&#039;s abandoned meeting at Cambridge. '
  +'Just 28 horses remained after extended nominations, prompting HRNZ to make the call and cancel the meeting.</body></html>';
const calledOff=parseHrnzNonRunningArticle(calledOffHtml,{
  sourceUrl:hrnzCalledOffUrl,startDate:'2025-08-01',endDateExclusive:'2025-08-15'
});
assert.equal(calledOff.evidence.length,1);
assert.equal(calledOff.evidence[0].date,'2025-08-07');
assert.equal(calledOff.evidence[0].racecourse_id,'cambridge-raceway');

const postponedHtml='<html><body>Thursday&#039;s Alexandra Park meeting postponed until Saturday | Harness Racing New Zealand '
  +'17 April 2025 , News The Alexandra Park meeting postponed on Thursday because of shocking weather in Auckland will move to Saturday. '
  +'The call to postpone the meeting was made early afternoon on Thursday over weather and safety concerns.</body></html>';
const postponed=parseHrnzNonRunningArticle(postponedHtml,{
  sourceUrl:hrnzPostponedUrl,startDate:'2025-04-01',endDateExclusive:'2025-05-01'
});
assert.equal(postponed.evidence.length,1);
assert.equal(postponed.evidence[0].date,'2025-04-17');
assert.equal(postponed.evidence[0].replacement_date,'2025-04-19');
assert.equal(postponed.evidence[0].racecourse_id,'alexandra-park-racecourse');

const transferHtml='<html><body>Methven meeting transferred to Ashburton | Harness Racing New Zealand '
  +'23 January 2026 , News Sunday&#039;s scheduled meeting at Methven will now be held on the all-weather track at Ashburton. '
  +'The decision follows an inspection today of the grass track at Mt Harding.</body></html>';
const hrnzTransfer=parseHrnzNonRunningArticle(transferHtml,{
  sourceUrl:hrnzTransferUrl,startDate:'2026-01-20',endDateExclusive:'2026-02-01'
});
assert.equal(hrnzTransfer.evidence.length,1);
assert.equal(hrnzTransfer.evidence[0].date,'2026-01-25');
assert.equal(hrnzTransfer.evidence[0].racecourse_id,'mt-harding-racecourse');
assert.equal(hrnzTransfer.evidence[0].replacement_racecourse_id,'ashburton-raceway');

const canonical=[
  {meeting_id:'new-zealand-thoroughbred-awapuni-racecourse-2026-06-07',country_id:'new-zealand',authority_id:'new-zealand-thoroughbred-racing',racing_system_id:'new-zealand-thoroughbred-system',racecourse_id:'awapuni-racecourse',date:'2026-06-07'},
  {meeting_id:'new-zealand-harness-cambridge-raceway-2025-08-07',country_id:'new-zealand',authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',racecourse_id:'cambridge-raceway',date:'2025-08-07'},
  {meeting_id:'new-zealand-harness-alexandra-park-racecourse-2025-04-17',country_id:'new-zealand',authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',racecourse_id:'alexandra-park-racecourse',date:'2025-04-17'},
  {meeting_id:'new-zealand-harness-mt-harding-racecourse-2026-01-25',country_id:'new-zealand',authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',racecourse_id:'mt-harding-racecourse',date:'2026-01-25'},
];
const bound=bindNewZealandNonRunningEvidence({
  evidence:[...removed.evidence,...calledOff.evidence,...postponed.evidence,...hrnzTransfer.evidence],
  canonicalMeetings:canonical,
  checkedAt:'2026-09-23T00:00:00Z'
});
assert.equal(bound.meeting_presence_records.length,4);
assert(bound.meeting_presence_records.every(row=>row.state==='confirmed_non_running'));
assert(bound.meeting_presence_records.every(row=>row.scope==='whole_meeting'));

const replacementOnly=bindNewZealandNonRunningEvidence({
  evidence:transferred.evidence,
  canonicalMeetings:[{
    meeting_id:'new-zealand-thoroughbred-pukekohe-park-racecourse-2024-05-25',
    country_id:'new-zealand',authority_id:'new-zealand-thoroughbred-racing',
    racing_system_id:'new-zealand-thoroughbred-system',racecourse_id:'pukekohe-park-racecourse',date:'2024-05-25'
  }],
  checkedAt:'2026-09-23T00:00:00Z'
});
assert.deepEqual(replacementOnly.meeting_presence_records,[]);
assert.equal(replacementOnly.diagnostics.skipped[0].reason,'canonical_binding_missing');

assert.throws(()=>parseNztrNonRunningArticle(removedHtml,{sourceUrl:'https://example.com/news/fake'}),/official nztr\.co\.nz/);
assert.throws(()=>parseHrnzNonRunningArticle(calledOffHtml,{sourceUrl:'https://example.com/news/fake'}),/official hrnz\.co\.nz/);

const runner=fs.readFileSync('scripts/timetable/run-new-zealand-official-window.mjs','utf8');
assert.match(runner,/discoverNztrNonRunningArticles/);
assert.match(runner,/discoverHrnzNonRunningArticles/);
assert.match(runner,/meeting_presence_records/);
assert.match(runner,/non_running_source_status/);

const workflow=fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml','utf8');
assert.match(workflow,/node scripts\/check-new-zealand-non-running-evidence\.mjs/);
assert.ok((workflow.match(/--artifact=\.calendar-unified\/new-zealand-thoroughbred\.json/g)??[]).length>=6);
assert.ok((workflow.match(/--artifact=\.calendar-unified\/new-zealand-harness\.json/g)??[]).length>=6);

console.log('NEW_ZEALAND_NON_RUNNING_EVIDENCE: pass');
console.log('NZTR_FUTURE_MEETING_REMOVAL_TRANSFER: pass');
console.log('NZTR_PARTIAL_ABANDONMENT_REJECTION: pass');
console.log('HRNZ_CANCEL_POSTPONE_TRANSFER: pass');
