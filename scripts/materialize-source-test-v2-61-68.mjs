import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resolve = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(resolve(file), 'utf8');
const write = (file, value) => fs.writeFileSync(resolve(file), value);
const readJson = (file) => JSON.parse(read(file));

function replaceOnce(text, before, after, label) {
  if (text.includes(after) && !text.includes(before)) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return text.replace(before, after);
}

const entries = [
  ['61', 'slovenia', 'remote_partial', 'Official federation identified; stable current-season calendar not confirmed, so link-only.'],
  ['62', 'croatia', 'remote_complete', 'Official Zagreb 2026 calendar supports a manual C-level decision.'],
  ['63', 'dominican-republic', 'remote_complete', 'Official Hipódromo V Centenario date routes support a bounded C-level prototype.'],
  ['64', 'tunisia', 'remote_partial', 'Official calendar supports manual confirmation but reachability and country completeness remain partial.'],
  ['65', 'lebanon', 'remote_partial', 'Official member page identifies the racing system but no current 2026 calendar is available.'],
  ['66', 'libya', 'remote_partial', 'Official racing page identified; no current 2026 upcoming calendar confirmed.'],
  ['67', 'mainland-china', 'remote_partial', 'Official Conghua launch is confirmed, but no date-addressable meeting calendar is available yet.'],
  ['68', 'indonesia', 'remote_complete', 'Official PORDASI 2026 race-event calendar supports manual C-level confirmation.'],
];

const authorities = [
  {country_id:'slovenia',authority_id:'kasaska-zveza-slovenije',authority_name_en:'Slovenian Trotting Association',authority_name_local:'Kasaška zveza Slovenije',authority_type:'national',racecourse_scope:'countrywide',official_source_id:'slovenian-trotting-home',official_source_url:'https://www.kasaska-zveza.si/',source_kind:'official_link',source_status:'partial',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'needs_review',notes:'Official federation route is verified, but a stable current-season meeting calendar was not confirmed.'},
  {country_id:'croatia',authority_id:'hrvatski-galopski-savez',authority_name_en:'Croatian Gallop Federation',authority_name_local:'Hrvatski Galopski Savez',authority_type:'national',racecourse_scope:'single_racecourse',official_source_id:'hgs-2026-calendar',official_source_url:'https://crogallop.com.hr/kalendar/',source_kind:'calendar',source_status:'verified',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'candidate',notes:'Official 2026 Zagreb calendar confirms meeting dates and venue; one August date remains provisional.'},
  {country_id:'dominican-republic',authority_id:'hipodromo-v-centenario',authority_name_en:'Hipódromo V Centenario',authority_name_local:'Hipódromo V Centenario',authority_type:'racecourse_operator',racecourse_scope:'single_racecourse',official_source_id:'hvc-programme-calendar',official_source_url:'https://hvc.com.do/calendario/',source_kind:'calendar',source_status:'verified',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'candidate',notes:'Official date-addressable calendar routes support meeting-date and venue confirmation for the reviewed racecourse.'},
  {country_id:'tunisia',authority_id:'societe-des-courses-hippiques',authority_name_en:'Société des Courses Hippiques',authority_name_local:'Société des Courses Hippiques',authority_type:'national',racecourse_scope:'all_authority_racecourses',official_source_id:'sch-official-calendar',official_source_url:'https://www.sc-hippique.tn/webstecourse/Calendrier.php',source_kind:'calendar',source_status:'partial',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'needs_review',notes:'Official calendar route exists but may be intermittently slow or unavailable; manual confirmation is required.'},
  {country_id:'lebanon',authority_id:'lebanon-racing-authority',authority_name_en:'Lebanon racing authority',authority_name_local:null,authority_type:'national',racecourse_scope:'single_racecourse',official_source_id:'ifahr-lebanon-member-page',official_source_url:'https://www.ifahr.net/member-info/lebanon/',source_kind:'official_link',source_status:'partial',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'needs_review',notes:'Official international member page identifies the authority context, but no current 2026 calendar is published.'},
  {country_id:'libya',authority_id:'libyan-racing-body',authority_name_en:'Libyan Horse Racing Authority',authority_name_local:null,authority_type:'national',racecourse_scope:'all_authority_racecourses',official_source_id:'official-racing-page',official_source_url:'https://lha.gov.ly/en/racing/',source_kind:'official_link',source_status:'stale',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'needs_review',notes:'Official racing route is identifiable, but no current 2026 upcoming calendar was confirmed.'},
  {country_id:'mainland-china',authority_id:'hong-kong-jockey-club',authority_name_en:'Hong Kong Jockey Club',authority_name_local:'香港賽馬會',authority_type:'racecourse_operator',racecourse_scope:'single_racecourse',official_source_id:'hkjc-conghua-launch',official_source_url:'https://corporate.hkjc.com/en-US/corporate-news/2026-03/news_2026031701851',source_kind:'official_link',source_status:'partial',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'blocked',notes:'Official source confirms an October 2026 launch at Conghua, but no stable upcoming meeting-date calendar is published.'},
  {country_id:'indonesia',authority_id:'pordasi',authority_name_en:'Equestrian Sports Association of Indonesia',authority_name_local:'Persatuan Olahraga Berkuda Seluruh Indonesia',authority_type:'national',racecourse_scope:'all_authority_racecourses',official_source_id:'pordasi-race-calendar-2026',official_source_url:'https://pordasi.id/',source_kind:'calendar',source_status:'verified',last_checked_date:'2026-06-29',capability_rank:'C',adapter_candidate_status:'candidate',notes:'Official 2026 race-event calendar supports meeting-date and venue confirmation through manual review.'},
];

const authorityPath = 'data/static/authority-source-inventory.json';
const authority = readJson(authorityPath);
const authorityKeys = new Set(authority.records.map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
for (const record of authorities) {
  const key = `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
  if (!authorityKeys.has(key)) authority.records.push(record);
}
if (authority.records.length !== 86) throw new Error(`authority record count must be 86; found ${authority.records.length}`);
write(authorityPath, `${JSON.stringify(authority, null, 2)}\n`);

const registryPath = 'data/static/calendar-readiness-registry.json';
const registry = readJson(registryPath);
const readinessIds = new Set(registry.records.map((record) => record.readiness_id));
for (const [deliveryNo, slug] of entries) {
  const sourceRef = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  const summary = readJson(sourceRef);
  const record = summary.records[0];
  if (!readinessIds.has(record.readiness_id)) {
    registry.records.push({...record,country_id:slug,country_tracker_delivery_no:deliveryNo,checked_date:summary.checked_date,evidence_reviewed_at:summary.evidence_reviewed_at,source_test_ref:sourceRef});
  }
}
registry.programme_state.countries_with_closed_decision = 68;
registry.programme_state.readiness_records = registry.records.length;
registry.programme_state.next_backfill_work_ids = ['WHR-ST2-69-76'];
if (registry.records.length !== 86) throw new Error(`readiness record count must be 86; found ${registry.records.length}`);
write(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const trackerLines = read(trackerPath).trimEnd().split(/\r?\n/);
const trackerHeaders = trackerLines[0].split('\t');
const trackerIndex = Object.fromEntries(trackerHeaders.map((name, position) => [name, position]));
const trackerRows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, acquisition, remark] of entries) {
  const row = trackerRows.find((candidate) => candidate[trackerIndex.delivery_no] === deliveryNo);
  if (!row || row[trackerIndex.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[trackerIndex.programme_status] = 'source_tested';
  row[trackerIndex.acquisition_status] = acquisition;
  row[trackerIndex.source_last_checked] = '2026-06-29';
  row[trackerIndex.evidence_reviewed_at] = '2026-06-29';
  row[trackerIndex.remarks] = remark;
}
write(trackerPath, `${[trackerHeaders.join('\t'), ...trackerRows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-PUB-53-60`', 'Previous completed Work ID: `WHR-ST2-61-68`', 'START previous');
value = replaceOnce(value, 'WHR-ST2-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-NOTE-61-68', 'WHR-NOTE-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-PROFILE-61-68', 'START IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value, 'Current Work ID: `WHR-ST2-61-68`  \nNext Work ID: `WHR-NOTE-61-68`', 'Current Work ID: `WHR-NOTE-61-68`  \nNext Work ID: `WHR-PROFILE-61-68`', 'project IDs');
value = replaceOnce(value, 'source_tested:                  0\nnot_started:                   38', 'source_tested:                  8\nnot_started:                   30', 'project counts');
value = replaceOnce(value, 'Calendar Readiness decisions are closed through entry 60, covering 60 countries and 78 system/source records.', 'Calendar Readiness decisions are closed through entry 68, covering 68 countries and 86 system/source records.', 'project readiness');
value = replaceOnce(value, 'Current Work ID: `WHR-ST2-61-68`', 'Completed: `WHR-ST2-61-68` via PR #330.\n\nCurrent Work ID: `WHR-NOTE-61-68`', 'project phase 5');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Latest completed Source Test v2 change: PR #326 — entries 53-60', 'Latest completed Source Test v2 change: PR #330 — entries 61-68', 'programme latest source test');
value = replaceOnce(value, 'Current Work ID: WHR-ST2-61-68\nNext working branch: source-test-v2-61-68', 'Current Work ID: WHR-NOTE-61-68\nNext working branch: country-notes-61-68', 'programme current');
value = replaceOnce(value, 'Current tracker counts after publication 53-60:', 'Current tracker counts after Source Test v2 61-68:', 'programme heading');
value = replaceOnce(value, 'source_tested:    0\nnot_started:     38', 'source_tested:    8\nnot_started:     30', 'programme counts');
value = replaceOnce(value, 'PR #329 publishes entries 53-60 after the approved rendered Cloudflare preview. Source Test v2 for entries 61-68 is now active.', 'PR #330 closes Source Test v2 and Calendar Readiness decisions for entries 61-68. Reviewed-note work for these entries is now active.', 'programme summary');
const wave61 = `## 11. Wave 61-68\n\nEntries: Slovenia, Croatia, Dominican Republic, Tunisia, Lebanon, Libya, Mainland China, and Indonesia.\n\n| Work | Status | Result |\n| --- | --- | --- |\n| #330 / \`WHR-ST2-61-68\` | complete | Added eight Source Test v2 records and eight Calendar Readiness decisions. |\n| \`WHR-NOTE-61-68\` | next | Convert the verified boundaries into reviewed editorial notes. |\n| \`WHR-PROFILE-61-68\` | planned | Add bilingual Profile v2 records. |\n| \`WHR-PUB-61-68\` | planned | QA and publish after one rendered preview. |\n\nReadiness result: 3 manual-ready, 1 prototype-ready, 3 link-only, and 1 blocked. Every country public ceiling remains C.\n\n## 12. Remaining wave schedule`;
value = replaceOnce(value, '## 11. Remaining wave schedule', wave61, 'programme wave 61');
value = value.replace('## 12. Final release gate', '## 13. Final release gate').replace('## 13. Roadmap maintenance rules', '## 14. Roadmap maintenance rules');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value, '{ published: 60, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 38 }', '{ published: 60, profile_ready: 0, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 30 }', 'programme expected counts');
value = replaceOnce(value, "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=0 not_started=38');", "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=8 note_reviewed=0 not_started=30');", 'programme count log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value, "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-ST2-61-68`', 'Next Work ID: `WHR-NOTE-61-68`']]", "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-NOTE-61-68`', 'Next Work ID: `WHR-PROFILE-61-68`']]", 'calendar roadmap');
value = replaceOnce(value, "[paths.startHere, startHereText, ['WHR-ST2-61-68', 'WHR-NOTE-61-68']]", "[paths.startHere, startHereText, ['WHR-NOTE-61-68', 'WHR-PROFILE-61-68']]", 'calendar start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-ST2-61-68');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-61-68');", "console.log('CURRENT_WORK_ID: WHR-NOTE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-61-68');", 'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value, "'Current Work ID: `WHR-ST2-61-68`',\n    'Next Work ID: `WHR-NOTE-61-68`',", "'Current Work ID: `WHR-NOTE-61-68`',\n    'Next Work ID: `WHR-PROFILE-61-68`',", 'governance roadmap');
value = replaceOnce(value, "'START-HERE.md': ['WHR-ST2-61-68', 'WHR-NOTE-61-68', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-NOTE-61-68', 'WHR-PROFILE-61-68', 'calendar-readiness-registry.json'],", 'governance start');
value = replaceOnce(value, "    '\"countries_with_closed_decision\": 60',\n    '\"WHR-ST2-61-68\"',", "    '\"countries_with_closed_decision\": 68',\n    '\"WHR-ST2-69-76\"',", 'governance registry');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-ST2-61-68');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-61-68');", "console.log('CURRENT_WORK_ID: WHR-NOTE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-61-68');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value, 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 340]) {', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 340]) {', 'roadmap PR list');
value = replaceOnce(value, "  'Current Work ID: WHR-ST2-61-68',\n  'Next working branch: source-test-v2-61-68',\n  'Latest completed Source Test v2 change: PR #326',", "  'Current Work ID: WHR-NOTE-61-68',\n  'Next working branch: country-notes-61-68',\n  'Latest completed Source Test v2 change: PR #330',", 'roadmap phrases');
value = replaceOnce(value, "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,340');\nconsole.log('CURRENT_WORK: entries 53-60 published; current Work ID WHR-ST2-61-68');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,340');\nconsole.log('CURRENT_WORK: entries 61-68 source-tested; current Work ID WHR-NOTE-61-68');", 'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

write('docs/runbooks/source-test-v2-61-68.md', `# Source Test v2 — entries 61-68\n\nStatus: complete  \nWork ID: \`WHR-ST2-61-68\`  \nPR: #330  \nDeployment: not required\n\n## Result\n\n- 8 Source Test v2 records\n- 8 authority/source inventory records\n- 8 Calendar Readiness records\n- cumulative closed countries: 68\n- cumulative readiness records: 86\n- readiness mix: manual-ready 3, prototype-ready 1, link-only 3, blocked 1\n- every public ceiling remains C\n- all implementation states remain \`not_started\`\n\n## Next\n\n\`WHR-NOTE-61-68\`\n`);

console.log('MATERIALIZED_SOURCE_TEST_V2_61_68 countries=68 authority=86 readiness=86 current=WHR-NOTE-61-68');
