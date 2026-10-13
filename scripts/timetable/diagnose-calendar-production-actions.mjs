// GitHub Actions own-repository production run diagnosis.
// Uses ephemeral Actions GITHUB_TOKEN only in-process; no secret is printed or persisted.
const repo=process.env.GITHUB_REPOSITORY??'badjoke-lab/where-horses-run';
const tok=process.env.GITHUB_TOKEN;
if(!tok)throw Error('GITHUB_TOKEN must be supplied by GitHub Actions');
const paths=[
 'calendar-unified-official-refresh.yml',
 'calendar-near-official-refresh.yml',
 'calendar-canada-agco-2026-production-smoke.yml'
];
const output=[];
for(const name of paths){
 const url='https://api.github.com/repos/'+repo+'/actions/workflows/'+name+'/runs?branch=main&per_page=15';
 try{
   const r=await fetch(url,{headers:{'authorization':'Bearer '+tok,'accept':'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'WhereHorsesRun-production-audit'},signal:AbortSignal.timeout(20000)});
   const json=await r.json();
   if(!r.ok)throw Error('GitHub API '+r.status+' '+String(json.message??''));
   output.push({workflow:name,total_count:json.total_count,runs:(json.workflow_runs??[]).slice(0,12).map(x=>({id:x.id,event:x.event,status:x.status,conclusion:x.conclusion,head_sha:x.head_sha,created_at:x.created_at,updated_at:x.updated_at,url:x.html_url}))});
 }catch(e){output.push({workflow:name,error:String(e?.message??e)})}
}
console.log('CALENDAR_PRODUCTION_ACTIONS_RUNS '+JSON.stringify({checked_at:new Date().toISOString(),main_workflows:output}));
