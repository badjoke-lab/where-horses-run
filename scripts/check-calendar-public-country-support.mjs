import assert from 'node:assert/strict';
import fs from 'node:fs';

const supportPath='data/static/calendar-public-country-support-v1.json';
const workflowPath='.github/workflows/calendar-unified-official-refresh.yml';

const support=JSON.parse(fs.readFileSync(supportPath,'utf8'));
const workflow=fs.readFileSync(workflowPath,'utf8');

assert.equal(support.schema_version,'calendar-public-country-support-v1');
assert.ok(Array.isArray(support.countries));

const rows=support.countries;
const ids=rows.map((row)=>row.country_id);
assert.equal(new Set(ids).size,ids.length,'calendar public country support must not contain duplicate country_id values');
for(const row of rows){
  assert.equal(row.calendar_supported,true,`${row.country_id} must be explicitly calendar_supported`);
  assert.ok(typeof row.acquisition_key==='string'&&row.acquisition_key.trim(),`${row.country_id} must have acquisition_key`);
}

const routed=new Set(['japan']);
for(const match of workflow.matchAll(/--country-id=([a-z0-9-]+)/g)) routed.add(match[1]);

const supported=new Set(ids);
const missing=[...routed].filter((id)=>!supported.has(id)).sort();
const extra=[...supported].filter((id)=>!routed.has(id)).sort();

assert.deepEqual(missing,[],`production-routed countries missing from public support: ${missing.join(', ')}`);
assert.deepEqual(extra,[],`public support countries not routed by unified refresh: ${extra.join(', ')}`);

console.log(`CALENDAR_PUBLIC_COUNTRY_SUPPORT: pass routed=${routed.size} supported=${supported.size}`);
