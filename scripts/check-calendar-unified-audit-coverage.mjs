import assert from 'node:assert/strict';
import fs from 'node:fs';

const support=JSON.parse(fs.readFileSync('data/static/calendar-public-country-support-v1.json','utf8'));
const registry=JSON.parse(fs.readFileSync('data/static/calendar-acquisition-registry.json','utf8'));
const full=fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml','utf8');
const near=fs.readFileSync('.github/workflows/calendar-near-official-refresh.yml','utf8');
const auditBuilder=fs.readFileSync('scripts/timetable/build-refresh-audit-summary.mjs','utf8');
const auditWorkflow=fs.readFileSync('.github/workflows/calendar-refresh-audit-summary.yml','utf8');

const supportedCountries=new Set(
  (support.countries??[])
    .filter((row)=>row.calendar_supported===true)
    .map((row)=>row.country_id)
);

const requiredSystems=(registry.records??[])
  .filter((row)=>row.profile_status==='active')
  .filter((row)=>row.country_id!=='japan')
  .filter((row)=>supportedCountries.has(row.country_id));

function workflowSystems(text){
  return new Set([...text.matchAll(/--racing-system-id=([a-z0-9-]+)/g)].map((match)=>match[1]));
}
function auditedSystems(text){
  return new Set([...text.matchAll(/racing_system_id:\s*'([^']+)'/g)].map((match)=>match[1]));
}
function missing(required,actual){
  return required.filter((row)=>!actual.has(row.system_id)).map((row)=>row.system_id).sort();
}

const fullSystems=workflowSystems(full);
const nearSystems=workflowSystems(near);
const auditSystems=auditedSystems(auditBuilder);

function runBlockLengths(text){
  const lines=text.split('\n');
  const lengths=[];
  for(let index=0;index<lines.length;index+=1){
    const match=lines[index].match(/^(\s*)run:\s*\|\s*$/);
    if(!match) continue;
    const indent=match[1].length;
    const body=[];
    for(let cursor=index+1;cursor<lines.length;cursor+=1){
      const line=lines[cursor];
      const leading=(line.match(/^ */)?.[0].length??0);
      if(line.trim()!==''&&leading<=indent) break;
      body.push(line);
    }
    lengths.push(body.join('\n').length);
  }
  return lengths;
}
const maxFullRun=Math.max(0,...runBlockLengths(full));
const maxNearRun=Math.max(0,...runBlockLengths(near));
assert.ok(maxFullRun<=21000,`full unified workflow run block exceeds GitHub Actions 21000-character limit: ${maxFullRun}`);
assert.ok(maxNearRun<=21000,`near unified workflow run block exceeds GitHub Actions 21000-character limit: ${maxNearRun}`);
assert.ok(fs.existsSync('scripts/timetable/rebuild-unified-non-japan-on-main.sh'),'bounded unified rebuild script must exist');

const missingFull=missing(requiredSystems,fullSystems);
const missingNear=missing(requiredSystems,nearSystems);
const missingAudit=missing(requiredSystems,auditSystems);

assert.deepEqual(missingFull,[],`supported active systems missing from full unified refresh: ${missingFull.join(', ')}`);
assert.deepEqual(missingNear,[],`supported active systems missing from near unified refresh: ${missingNear.join(', ')}`);
assert.deepEqual(missingAudit,[],`supported active systems missing from downstream audit: ${missingAudit.join(', ')}`);
assert.match(auditWorkflow,/workflows:[\s\S]*- Calendar unified official refresh/,'downstream audit must trigger from full unified refresh');
assert.match(auditWorkflow,/workflows:[\s\S]*- Calendar near official refresh/,'downstream audit must trigger from near unified refresh');

console.log(`CALENDAR_UNIFIED_AUDIT_COVERAGE: pass supported_countries=${supportedCountries.size} non_japan_systems=${requiredSystems.length} full=${fullSystems.size} near=${nearSystems.size} audit=${auditSystems.size} max_full_run=${maxFullRun} max_near_run=${maxNearRun}`);
