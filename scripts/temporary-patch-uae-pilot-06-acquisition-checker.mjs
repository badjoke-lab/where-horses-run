import fs from 'node:fs';

const file = 'scripts/check-calendar-acquisition-registry.mjs';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  "const requiredProfiles = ['japan-jra-system', 'japan-nar-system', 'japan-banei-system', 'hong-kong-hkjc-system'];",
  "const requiredProfiles = ['japan-jra-system', 'japan-nar-system', 'japan-banei-system', 'hong-kong-hkjc-system', 'uae-national-racing-system'];"
);

const adapterAnchor = "  ['hkjc-fixture-artifact-bridge-v1', { path: 'scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs', marker: \"const ADAPTER_ID = 'hkjc-fixture-artifact-bridge-v1'\" }],\n";
const adapterAddition = `${adapterAnchor}  ['uae-era-pdf-grid-actions-v1', { path: 'scripts/timetable/uae-era-pdf-grid-candidate-core.mjs', marker: \"const ADAPTER_ID = 'uae-era-pdf-grid-actions-v1'\" }],\n`;
if (!text.includes("['uae-era-pdf-grid-actions-v1'")) text = text.replace(adapterAnchor, adapterAddition);

const hkjcBlock = `if (JSON.stringify(hkjcProfile?.supported_observation_ranks) !== JSON.stringify(['C'])) fail('HKJC provisional profile must remain C-only until detail route evidence succeeds.');\n`;
const uaeBlock = `${hkjcBlock}\nconst uaeProfile = registry.records.find((record) => record.system_id === 'uae-national-racing-system');\nif (uaeProfile?.profile_status !== 'provisional' || uaeProfile?.primary_runner !== 'github_actions' || uaeProfile?.fallback_runner !== null) fail('UAE provisional profile must preserve evidence-backed Actions schedule routing and no fallback runner.');\nif (uaeProfile?.schedule_source_id !== 'era-season-calendar' || uaeProfile?.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('UAE provisional profile must preserve the evidence-backed ERA PDF grid schedule route.');\nif (uaeProfile?.detail_source_id !== null || uaeProfile?.detail_adapter_id !== null) fail('UAE provisional profile must not claim detail acquisition.');\nif (JSON.stringify(uaeProfile?.supported_observation_ranks) !== JSON.stringify(['C'])) fail('UAE provisional profile must remain C-only.');\nif (uaeProfile?.supports_source_visible_horizon !== true || uaeProfile?.supports_date_window !== false || uaeProfile?.supports_selected_meetings !== false || uaeProfile?.supports_rank_upgrade_retry !== false) fail('UAE profile scope support must remain source-visible-horizon only.');\n`;
if (!text.includes('const uaeProfile = registry.records.find')) text = text.replace(hkjcBlock, uaeBlock);

text = text.replace(
  "console.log('REQUIRED_SYSTEMS: japan-jra-system,japan-nar-system,japan-banei-system,hong-kong-hkjc-system');",
  "console.log('REQUIRED_SYSTEMS: japan-jra-system,japan-nar-system,japan-banei-system,hong-kong-hkjc-system,uae-national-racing-system');"
);
const outputAnchor = "console.log('HKJC_PROFILE: provisional / github_actions schedule primary / fallback pending / detail pending / C-only');\n";
if (!text.includes("console.log('UAE_PROFILE:")) {
  text = text.replace(outputAnchor, `${outputAnchor}console.log('UAE_PROFILE: provisional / github_actions schedule primary / source-visible-horizon only / C-only');\n`);
}

fs.writeFileSync(file, text);
console.log('UAE_PILOT_06_ACQUISITION_CHECKER_PATCH: applied');
