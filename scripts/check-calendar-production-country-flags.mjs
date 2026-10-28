import assert from 'node:assert/strict';
import fs from 'node:fs';

const coverage=JSON.parse(fs.readFileSync('data/static/calendar-98-tier-execution-coverage.json','utf8'));
const code=fs.readFileSync('src/lib/calendarDisplayNames.ts','utf8');
const mapBody=code.match(/const countryFlagEmojiById:[^{]*\{([^}]+)\};/)?.[1];
assert.ok(mapBody,'Calendar flag map is missing');
const flags=new Map();
for(const line of mapBody.split('\n')){
  if(!line.trim()) continue;
  const match=line.match(/^\s*(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*'([^']+)',\s*$/);
  assert.ok(match,'Malformed flag map entry: '+line.trim());
  const id=match[1]??match[2],value=match[3];
  assert.ok(!flags.has(id),'Duplicate flag mapping: '+id);
  assert.match(value,/^\p{Regional_Indicator}{2}$/u,'Must be an actual regional-flag emoji: '+id);
  flags.set(id,value);
}
const routed=coverage.registry_routed_country_ids;
assert.equal(routed.length,coverage.counts.registry_routed_tiers);
const missing=routed.filter(id=>!flags.has(id));
assert.deepEqual(missing,[],'All actively routed countries must show flags, not globe fallback');
assert.equal(flags.get('indonesia'),'🇮🇩');
assert.equal(flags.get('panama'),'🇵🇦');
assert.equal(flags.get('jamaica'),'🇯🇲');
console.log('CALENDAR_PRODUCTION_COUNTRY_FLAGS',JSON.stringify({
  routed:routed.length,flag_count:flags.size,missing,indonesia:flags.get('indonesia')
}));
