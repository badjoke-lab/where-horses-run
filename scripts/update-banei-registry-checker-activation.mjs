import fs from 'node:fs';

const file = 'scripts/check-calendar-acquisition-registry.mjs';
let text = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    "  ['japan-banei-dry-run-adapter', { path: 'data/candidates/japan-banei-candidates.json', marker: '\"source_adapter_id\": \"japan-banei-dry-run-adapter\"' }],",
    "  ['japan-banei-dry-run-adapter', { path: 'data/candidates/japan-banei-candidates.json', marker: '\"source_adapter_id\": \"japan-banei-dry-run-adapter\"' }],\n  ['banei-nar-race-list-detail-v1', { path: 'data/fixtures/calendar-banei-live-smoke-evidence-v1.json', marker: '\"adapter_id\": \"banei-nar-race-list-detail-v1\"' }],",
  ],
  [
    "if (baneiProfile?.profile_status !== 'provisional' || baneiProfile?.detail_source_id !== null || baneiProfile?.detail_adapter_id !== null) fail('Banei initial profile must preserve explicit pending detail source/adapter state.');",
    "if (baneiProfile?.profile_status !== 'provisional'\n  || baneiProfile?.primary_runner !== 'reviewed_import'\n  || baneiProfile?.detail_source_id !== 'nar-banei-race-list-deba-table'\n  || baneiProfile?.detail_adapter_id !== 'banei-nar-race-list-detail-v1'\n  || baneiProfile?.supports_date_window !== true\n  || baneiProfile?.supports_selected_meetings !== false\n  || baneiProfile?.supports_rank_upgrade_retry !== false) {\n  fail('Banei detail activation must preserve provisional reviewed_import routing, evidence-backed detail source/adapter, date-window support, and disabled selected/retry capability.');\n}",
  ],
  [
    "console.log('BANEI_DETAIL_PROFILE: pending');",
    "console.log('BANEI_DETAIL_PROFILE: live-evidence-backed detail source/adapter / date-window enabled / selected+retry disabled');",
  ],
];

for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`required Registry checker anchor missing: ${from}`);
  text = text.replace(from, to);
}

fs.writeFileSync(file, text);
console.log('BANEI_REGISTRY_CHECKER_ACTIVATION_UPDATED');
