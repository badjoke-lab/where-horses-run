import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const files = {
  contract: 'data/static/v1-known-limitations-v1.json',
  audit: 'data/audits/v1-known-limitations-v1.json',
  doc: 'docs/release/v1-known-limitations.md',
  workflow: '.github/workflows/v1-known-limitations.yml',
  sitemap: 'dist/sitemap.xml',
  faqEn: 'dist/faq/index.html',
  faqJa: 'dist/ja/faq/index.html',
  methodsEn: 'dist/methods/index.html',
  methodsJa: 'dist/ja/methods/index.html',
};
const baselines = [
  ['data/static/v1-scope-freeze-v1.json', 'V1-SCOPE-FREEZE-01'],
  ['data/static/v1-data-audit-v1.json', 'V1-DATA-AUDIT-01'],
  ['data/static/v1-mobile-qa-v1.json', 'V1-MOBILE-QA-01'],
  ['data/static/v1-accessibility-qa-v1.json', 'V1-ACCESSIBILITY-QA-01'],
  ['data/static/v1-performance-qa-v1.json', 'V1-PERFORMANCE-QA-01'],
  ['data/static/v1-source-policy-review-v1.json', 'V1-SOURCE-POLICY-REVIEW-01'],
  ['data/static/faq-content-pages-contract-v1.json', 'FAQ-CONTENT-PAGES-01'],
  ['data/static/methods-data-policy-contract-v1.json', 'METHODS-DATA-POLICY-01'],
];

for (const file of [...Object.values(files), ...baselines.map(([file]) => file)]) {
  if (!fs.existsSync(file)) fail(`required known-limitations file missing: ${file}`);
}
for (const file of [
  '.github/workflows/temporary-v1-known-limitations-discovery.yml',
  'scripts/temporary-discover-v1-known-limitations.mjs',
  'data/audits/temporary-v1-known-limitations-discovery.json',
]) {
  if (fs.existsSync(file)) fail(`temporary known-limitations file remains: ${file}`);
}

const contract = json(files.contract);
const audit = json(files.audit);
const routes = ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'];

if (contract.schema_version !== 'v1-known-limitations-v1') fail('known-limitations contract schema differs');
if (contract.release_id !== 'WHR-V1-PREPARATION-V1' || contract.work_id !== contract.release_id) fail('known-limitations release identity differs');
if (contract.implementation_unit !== 'V1-KNOWN-LIMITATIONS-01') fail('known-limitations implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-18') fail('known-limitations release state differs');
if (contract.previous_implementation_unit !== 'V1-SOURCE-POLICY-REVIEW-01' || contract.next_implementation_unit !== 'V1-RELEASE-READINESS-01') fail('known-limitations roadmap linkage differs');

const expectedBaselines = {
  scope: 'V1-SCOPE-FREEZE-01',
  data_audit: 'V1-DATA-AUDIT-01',
  mobile_qa: 'V1-MOBILE-QA-01',
  accessibility_qa: 'V1-ACCESSIBILITY-QA-01',
  performance_qa: 'V1-PERFORMANCE-QA-01',
  source_policy: 'V1-SOURCE-POLICY-REVIEW-01',
  faq: 'FAQ-CONTENT-PAGES-01',
  methods: 'METHODS-DATA-POLICY-01',
};
if (!exact(contract.baseline_units, expectedBaselines)) fail('known-limitations baseline units differ');

const publicAudit = contract.public_audit ?? {};
for (const [key, value] of Object.entries({
  public_pages_total: 771,
  locales: 2,
  route_pairs: 2,
  faq_questions_per_locale: 12,
  methods_sections_per_locale: 9,
  limitation_categories: 12,
  new_public_routes: 0,
  new_public_data_classes: 0,
})) {
  if (publicAudit[key] !== value) fail(`known-limitations public audit differs: ${key}`);
}
if (publicAudit.public_content_rewrite_required !== false || !exact(publicAudit.routes, routes)) fail('known-limitations public route boundary differs');

const requiredRoutes = {
  'official-source-final-confirmation': routes,
  'coverage-varies': ['/faq/', '/ja/faq/'],
  'not-real-time': routes,
  'dates-and-times-can-change': routes,
  'empty-view-is-not-absence': routes,
  'last-checked-is-not-validity': ['/methods/', '/ja/methods/'],
  'publication-rank-is-a-display-boundary': routes,
  'participant-betting-and-result-data-excluded': routes,
  'video-and-direct-streams-excluded': routes,
  'viewing-access-not-guaranteed': ['/methods/', '/ja/methods/'],
  'local-time-and-daylight-saving': ['/methods/', '/ja/methods/'],
  'correction-reduction-and-removal': ['/methods/', '/ja/methods/'],
};
if (!Array.isArray(contract.limitations) || contract.limitations.length !== 12) fail('known-limitations category count differs');
for (const item of contract.limitations ?? []) {
  if (!Object.hasOwn(requiredRoutes, item.id)) fail(`unknown known-limitations category: ${item.id}`);
  else if (!exact(item.required_routes, requiredRoutes[item.id])) fail(`known-limitations route coverage differs: ${item.id}`);
  if (typeof item.meaning !== 'string' || !item.meaning.trim()) fail(`known-limitations meaning missing: ${item.id}`);
}
if (new Set((contract.limitations ?? []).map((item) => item.id)).size !== 12) fail('known-limitations category IDs are not unique');

const expectedScope = {
  new_route_family_allowed: false,
  new_public_data_class_allowed: false,
  coverage_completeness_claim_allowed: false,
  real_time_guarantee_allowed: false,
  official_confirmation_requirement_may_be_removed: false,
};
if (!exact(contract.scope_boundary, expectedScope)) fail('known-limitations scope boundary differs');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('known-limitations privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('known-limitations automation boundary differs');

if (audit.schema_version !== 'v1-known-limitations-audit-v1') fail('known-limitations audit schema differs');
for (const key of ['release_id', 'work_id', 'implementation_unit', 'status', 'reviewed_at', 'previous_implementation_unit', 'next_implementation_unit']) {
  if (audit[key] !== contract[key]) fail(`known-limitations audit identity differs: ${key}`);
}
for (const key of ['scope_boundary', 'publication_boundary', 'privacy_boundary', 'automation_boundary']) {
  if (!exact(audit[key], contract[key])) fail(`known-limitations audit boundary differs: ${key}`);
}
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('known-limitations behavior audit differs');
for (const [key, value] of Object.entries({
  public_pages_total: 771,
  audited_routes: 4,
  route_pairs: 2,
  locales: 2,
  english_faq_questions: 12,
  japanese_faq_questions: 12,
  english_methods_sections: 9,
  japanese_methods_sections: 9,
  limitation_categories: 12,
  categories_missing_from_required_routes: 0,
  new_public_routes: 0,
  new_public_data_classes: 0,
  contract_errors: 0,
  output_errors: 0,
})) {
  if (audit.verified?.[key] !== value) fail(`known-limitations audit measurement differs: ${key}`);
}

for (const [file, unit] of baselines) {
  const baseline = json(file);
  if (baseline.implementation_unit !== unit || !['complete', 'release_ready'].includes(baseline.status)) fail(`known-limitations baseline incomplete: ${unit}`);
}

function renderedText(file) {
  return read(file)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#39;|&apos;|&lsquo;|&rsquo;/gi, "'")
    .replace(/[“”「」]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

const rendered = {
  '/faq/': renderedText(files.faqEn),
  '/ja/faq/': renderedText(files.faqJa),
  '/methods/': renderedText(files.methodsEn),
  '/ja/methods/': renderedText(files.methodsJa),
};
const markers = {
  '/faq/': [
    'final place to confirm current and complete information',
    'coverage varies because official information',
    'does not promise real-time updates',
    'dates and times can change',
    'does not prove that racing is absent',
    'c covers meeting date and racecourse',
    'entries, horse names, jockey and trainer names',
    'does not embed video or publish direct stream urls',
  ],
  '/ja/faq/': [
    '最新かつ完全な情報の最終確認先',
    '掲載範囲は国・地域、競馬場、主催者ごとに異なります',
    'リアルタイム更新を保証するものではありません',
    '日程や時刻は変更、中止、延期される場合があります',
    '競馬がないことを意味しません',
    'cは開催日と競馬場',
    '出走表、馬名、騎手名、調教師名',
    '動画の埋め込み、直接ストリームurl、非公式ミラー、転載映像は扱いません',
  ],
  '/methods/': [
    'use the official source for final confirmation',
    'real-time updates and immediate coverage of every change are not promised',
    'daylight-saving changes',
    'an empty view does not prove that no racing exists',
    'last checked" date records when a source or field was last reviewed',
    'a+ is a lightweight programme summary',
    'does not publish entries, horse names, jockey or trainer names',
    'does not guarantee that a meeting will take place',
    'corrected, reduced, or removed',
  ],
  '/ja/methods/': [
    '公式ソースを最終確認先としてください',
    'リアルタイム更新や、すべての変更の即時反映は保証しません',
    '夏時間、公式時刻の変更、延期、中止',
    '競馬がないことを意味しません',
    '最終確認"や確認日は、そのソースまたは項目を最後にレビューした日を示します',
    'a+は開催詳細ページに限り',
    '出走表、馬名、騎手名、調教師名',
    '観戦可否を保証しません',
    '訂正、表示縮小、または削除します',
  ],
};
for (const [route, values] of Object.entries(markers)) {
  for (const marker of values) {
    if (!rendered[route].includes(marker.toLocaleLowerCase('en'))) fail(`known-limitations marker missing on ${route}: ${marker}`);
  }
}

const count = (value, pattern) => (value.match(pattern) ?? []).length;
if (count(read(files.faqEn), /class="card faq-item"/g) !== 12) fail('English FAQ question count differs');
if (count(read(files.faqJa), /class="card faq-item"/g) !== 12) fail('Japanese FAQ question count differs');
if (count(read(files.methodsEn), /class="card methods-section"/g) !== 9) fail('English Methods section count differs');
if (count(read(files.methodsJa), /class="card methods-section"/g) !== 9) fail('Japanese Methods section count differs');

const sitemap = read(files.sitemap);
if (count(sitemap, /<loc>/g) !== 771) fail('known-limitations sitemap route count differs');
for (const route of routes) {
  if (!sitemap.includes(`<loc>https://whr.badjoke-lab.com${route}</loc>`)) fail(`known-limitations sitemap route missing: ${route}`);
}
for (const [route, value] of Object.entries(rendered)) {
  for (const forbidden of ['complete global coverage', 'all races worldwide', 'always up to date', 'guaranteed live', 'real-time guarantee', '世界中のすべての競馬を網羅', '常に最新です', 'ライブ配信を保証']) {
    if (value.includes(forbidden.toLocaleLowerCase('en'))) fail(`known-limitations forbidden claim on ${route}: ${forbidden}`);
  }
}

const doc = read(files.doc);
for (const marker of ['V1-KNOWN-LIMITATIONS-01', 'Public pages in the frozen v1 candidate: 771', 'Known-limitation categories: 12', 'scripts/check-v1-known-limitations.mjs', '.github/workflows/v1-known-limitations.yml', 'V1-RELEASE-READINESS-01']) {
  if (!doc.includes(marker)) fail(`known-limitations documentation marker missing: ${marker}`);
}
const workflow = read(files.workflow);
for (const marker of ['permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build', 'node scripts/check-v1-source-policy-review.mjs', 'node scripts/check-faq-content-pages.mjs', 'node scripts/check-methods-data-policy.mjs', 'node scripts/check-v1-known-limitations.mjs', 'git status --porcelain']) {
  if (!workflow.includes(marker)) fail(`known-limitations workflow marker missing: ${marker}`);
}
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  if (workflow.toLocaleLowerCase('en').includes(forbidden.toLocaleLowerCase('en'))) fail(`known-limitations workflow contains forbidden marker: ${forbidden}`);
}

if (errors.length) {
  console.error(`V1_KNOWN_LIMITATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('V1_KNOWN_LIMITATIONS: pass');
console.log('PUBLIC_PAGES: 771');
console.log('AUDITED_ROUTES: 4');
console.log('LIMITATION_CATEGORIES: 12');
console.log('NEW_PUBLIC_ROUTES: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-RELEASE-READINESS-01');
