import assert from 'node:assert/strict';
import {
  UAE_ERA_CURRENT_SEASON_URL,
  UAE_ERA_HOME_URL,
  buildUaeEraDiscoveryFailureArtifact,
  discoverUaeEraCurrentSeasonFixtures,
} from './timetable/uae-era-current-season-discovery.mjs';

const html=`
<html><body>
  <section>MEY 14-10-2026</section>
  <section>AEC 21-10-2026</section>
  <section>ABU 22-10-2026</section>
</body></html>`;

const calls=[];
const fallbackFetch=async (url,options={})=>{
  calls.push({url,options});
  if(calls.length<3) return {ok:false,status:403,url,text:async()=>''};
  return {ok:true,status:200,url:UAE_ERA_HOME_URL,text:async()=>html};
};
const recovered=await discoverUaeEraCurrentSeasonFixtures({
  startDate:'2026-10-10',days:30,fetchImpl:fallbackFetch,
});
assert.equal(calls.length,3);
assert.ok(calls[0].url.startsWith(UAE_ERA_CURRENT_SEASON_URL+'?fixture=2026-10-10'));
assert.equal(calls[1].url,UAE_ERA_CURRENT_SEASON_URL);
assert.equal(calls[2].url,UAE_ERA_HOME_URL);
assert.match(String(calls[0].options?.headers?.['user-agent']??''),/Mozilla\/5\.0/);
assert.deepEqual(recovered.fixtures.map(x=>x.date),['2026-10-14','2026-10-21','2026-10-22']);
assert.equal(recovered.route_attempts.filter(x=>x.status==='http_error').length,2);
assert.equal(recovered.route_attempts.at(-1).status,'success');

const offDomain=async (url)=>({ok:true,status:200,url:'https://example.com/calendar',text:async()=>html});
await assert.rejects(
  ()=>discoverUaeEraCurrentSeasonFixtures({startDate:'2026-10-10',days:30,fetchImpl:offDomain}),
  /acquisition failed across official routes/,
);

let failure;
try {
  await discoverUaeEraCurrentSeasonFixtures({
    startDate:'2026-10-10',
    days:30,
    fetchImpl:async (url)=>({ok:false,status:403,url,text:async()=>''}),
  });
} catch (error) {
  failure=error;
}
assert.ok(failure);
const artifact=buildUaeEraDiscoveryFailureArtifact({
  startDate:'2026-10-10',days:30,generatedAt:'2026-10-10T00:00:00Z',error:failure,
});
assert.equal(artifact.acquisition_attempt.status,'network_error');
assert.equal(artifact.acquisition_attempt.error_code,'fetch_error');
assert.equal(artifact.window.coverage_claim,'acquisition_failed_preserve_verified_state');
assert.deepEqual(artifact.records,[]);
assert.deepEqual(artifact.meeting_presence_records,[]);
assert.equal(artifact.diagnostics.source_errors.length,1);
assert.equal(artifact.discovery.route_attempts.length,3);

console.log('UAE_ERA_SEASON_DISCOVERY: pass');
