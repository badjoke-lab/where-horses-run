import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const paths = {
  contract: 'data/static/v1-known-limitations-v1.json',
  audit: 'data/audits/v1-known-limitations-v1.json',
  doc: 'docs/release/v1-known-limitations.md',
  checker: 'scripts/check-v1-known-limitations.mjs',
  workflow: '.github/workflows/v1-known-limitations.yml',
  scope: 'data/static/v1-scope-freeze-v1.json',
  dataAudit: 'data/static/v1-data-audit-v1.json',
  mobile: 'data/static/v1-mobile-qa-v1.json',
  accessibility: 'data/static/v1-accessibility-qa-v1.json',
  performance: 'data/static/v1-performance-qa-v1.json',
  sourcePolicy: 'data/static/v1-source-policy-review-v1.json',
  faq: 'data/static/faq-content-pages-contract-v1.json',
  methods: 'data/static/methods-data-policy-contract-v1.json',
  sitemap: 'dist/sitemap.xml',
};

const publicRouteFiles = {
  '/faq/': 'dist/faq/index.html',
  '/ja/faq/': 'dist/ja/faq/index.html',
  '/methods/': 'dist/methods/index.html',
  '/ja/methods/': 'dist/ja/methods/index.html',
};

const temporaryPaths = [
  '.github/workflows/temporary-v1-known-limitations-discovery.yml',
  'scripts/temporary-discover-v1-known-limitations.mjs',
  'data/audits/temporary-v1-known-limitations-discovery.json',
];

for (const required of [...Object.values(paths), ...Object.values(publicRouteFiles)]) {
  if (!fs.existsSync(filePath(required))) fail(`required known-limitations file missing: ${required}`);
}
for (const temporary of temporaryPaths) {
  if (fs.existsSync(filePath(temporary))) fail(`temporary known-limitations file remains: ${temporary}`);
}

const contract = parse(paths.contract);
const audit = parse(paths.audit);

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

const expectedRoutes = ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'];
const publicAudit = contract.public_audit ?? {};
if (publicAudit.public_pages_total !== 771 || publicAudit.locales !== 2 || publicAudit.route_pairs !== 2 || publicAudit.faq_questions_per_locale !== 12 || publicAudit.methods_sections_per_locale !== 9 || publicAudit.limitation_categories !== 12 || publicAudit.new_public_routes !== 0 || publicAudit.new_public_data_classes !== 0 || publicAudit.public_content_rewrite_required !== false) fail('known-limitations public audit differs');
if (!exact(publicAudit.routes, expectedRoutes)) fail('known-limitations audited routes differ');
if (!Array.isArray(contract.limitations) || contract.limitations.length !== 12) fail('known-limitations category count differs');

const expectedLimitations = {
  'official-source-final-confirmation': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'coverage-varies': ['/faq/', '/ja/faq/'],
  'not-real-time': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'dates-and-times-can-change': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'empty-view-is-not-absence': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'last-checked-is-not-validity': ['/methods/', '/ja/methods/'],
  'publication-rank-is-a-display-boundary': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'participant-betting-and-result-data-excluded': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'video-and-direct-streams-excluded': ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/'],
  'viewing-access-not-guaranteed': ['/methods/', '/ja/methods/'],
  'local-time-and-daylight-saving': ['/methods/', '/ja/methods/'],
  'correction-reduction-and-removal': ['/methods/', '/ja/methods/'],
};
for (const item of contract.limitations ?? []) {
  if (!Object.hasOwn(expectedLimitations, item.id)) fail(`unknown known-limitations category: ${item.id}`);
  else if (!exact(item.required_routes, expectedLimitations[item.id])) fail(`known-limitations route coverage differs: ${item.id}`);
  if (typeof item.meaning !== 'string' || !item.meaning.trim()) fail(`known-limitations meaning missing: ${item.id}`);
}
if (new Set((contract.limitations ?? []).map((item) => item.id)).size !== 12) fail('known-limitations category IDs are not unique');

const expectedScopeBoundary = {
  new_route_family_allowed: false,
  new_public_data_class_allowed: false,
  coverage_completeness_claim_allowed: false,
  real_time_guarantee_allowed: false,
  official_confirmation_requirement_may_be_removed: false,
};
if (!exact(contract.scope_boundary, expectedScopeBoundary)) fail('known-limitations scope boundary differs');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('known-limitations privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('known-limitations automation boundary differs');

if (audit.schema_version !== 'v1-known-limitations-audit-v1') fail('known-limitations audit schema differs');
for (const key of ['release_id', 'work_id', 'implementation_unit', 'status', 'reviewed_at', 'previous_implementation_unit', 'next_implementation_unit']) {
  if (audit[key] !== contract[key]) fail(`known-limitations audit identity differs: ${key}`);
}
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('known-limitations behavior audit differs');
for (const key of ['scope_boundary', 'publication_boundary', 'privacy_boundary', 'automation_boundary']) {
  if (!exact(audit[key], contract[key])) fail(`known-limitations audit boundary differs: ${key}`);
}

const baselineFiles = {
  scope: [paths.scope, 'V1-SCOPE-FREEZE-01'],
  dataAudit: [paths.dataAudit, 'V1-DATA-AUDIT-01'],
  mobile: [paths.mobile, 'V1-MOBILE-QA-01'],
  accessibility: [paths.accessibility, 'V1-ACCESSIBILITY-QA-01'],
  performance: [paths.performance, 'V1-PERFORMANCE-QA-01'],
  sourcePolicy: [paths.sourcePolicy, 'V1-SOURCE-POLICY-REVIEW-01'],
  faq: [paths.faq, 'FAQ-CONTENT-PAGES-01'],
  methods: [paths.methods, 'METHODS-DATA-POLICY-01'],
};
for (const [name, [file, unit]] of Object.entries(baselineFiles)) {
  const baseline = parse(file);
  if (baseline.implementation_unit !== unit || !['complete', 'release_ready'].includes(baseline.status)) fail(`known-limitations baseline incomplete: ${name}`);
}

function normalizeHtmlText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

const routeText = {};
for (const [route, file] of Object.entries(publicRouteFiles)) routeText[route] = normalizeHtmlText(read(file));

const requiredMarkers = {
  '/faq/': [
    'official-source links on each page remain the final place to confirm current and complete information',
    'coverage varies because official information',
    'the site does not promise real-time updates',
    'dates and times can change, be postponed, or be cancelled',
    'it does not prove that racing is absent',
    'c covers meeting date and racecourse',
    'entries, horse names, jockey and trainer names',
    'the site does not embed video or publish direct stream urls',
  ],
  '/ja/faq/': [
    '各ページの公式ソースリンクを、最新かつ完全な情報の最終確認先として案内します',
    '掲載範囲は国・地域、競馬場、主催者ごとに異なります',
    'リアルタイム更新を保証するものではありません',
    '日程や時刻は変更、中止、延期される場合があります',
    'その国・地域に競馬がないことを意味しません',
    'cは開催日と競馬場',
    '出走表、馬名、騎手名、調教師名',
    '動画の埋め込み、直接ストリームurl、非公式ミラー、転載映像は扱いません',
  ],
  '/methods/': [
    'use the official source for final confirmation',
    'real-time updates and immediate coverage of every change are not promised',
    'daylight-saving changes, official time changes, postponements, and cancellations',
    'an empty view does not prove that no racing exists',
    'a "last checked" date records when a source or field was last reviewed',
    'a+ is a lightweight programme summary',
    'the site does not publish entries, horse names, jockey or trainer names',
    'it does not guarantee that a meeting will take place',
    'corrected, reduced, or removed',
  ],
  '/ja/methods/': [
    '公式ソースを最終確認先としてください',
    'リアルタイム更新や、すべての変更の即時反映は保証しません',
    '夏時間、公式時刻の変更、延期、中止',
    '開催が表示されていないことは、その国・地域で競馬がないことを意味しません',
    '「最終確認」や確認日は、そのソースまたは項目を最後にレビューした日を示します',
    'a+は開催詳細ページに限り',
    '出走表、馬名、騎手名、調教師名',
    '観戦可否を保証しません',
    '訂正、表示縮小、または削除します',
  ],
};
for (const [route, markers] of Object.entries(requiredMarkers)) {
  for (const marker of markers) {
    if (!routeText[route]?.includes(marker.toLocaleLowerCase('en'))) fail(`known-limitations public marker missing on ${route}: ${marker}`);
  }
}

const faqHtmlEn = read(publicRouteFiles['/faq/']);
const faqHtmlJa = read(publicRouteFiles['/ja/faq/']);
const methodsHtmlEn = read(publicRouteFiles['/methods/']);
const methodsHtmlJa = read(publicRouteFiles['/ja/methods/']);
const count = (text, pattern) => (text.match(pattern) ?? []).length;
if (count(faqHtmlEn, /class="card faq-item"/g) !== 12) fail('English FAQ question count differs');
if (count(faqHtmlJa, /class="card faq-item"/g) !== 12) fail('Japanese FAQ question count differs');
if (count(methodsHtmlEn, /class="card methods-section"/g) !== 9) fail('English Methods section count differs');
if (count(methodsHtmlJa, /class="card methods-section"/g) !== 9) fail('Japanese Methods section count differs');

const sitemap = read(paths.sitemap);
if (count(sitemap, /<loc>/g) !== 771) fail('known-limitations sitemap route count differs');
for (const route of expectedRoutes) {
  const url = `https://whr.badjoke-lab.com${route}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`known-limitations sitemap route missing: ${route}`);
}

const forbiddenClaims = [
  'complete global coverage',
  'all races worldwide',
  'always up to date',
  'guaranteed live',
  'real-time guarantee',
  '世界中のすべての競馬を網羅',
  '常に最新です',
  'ライブ配信を保証',
];
for (const [route, text] of Object.entries(routeText)) {
  for (const forbidden of forbiddenClaims) {
    if (text.includes(forbidden.toLocaleLowerCase('en'))) fail(`known-limitations forbidden public claim on ${route}: ${forbidden}`);
  }
}

const verified = audit.verified ?? {};
const expectedVerified = {
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
  official_source_confirmation_errors: 0,
  coverage_claim_errors: 0,
  real_time_claim_errors: 0,
  date_time_guarantee_errors: 0,
  empty_view_claim_errors: 0,
  last_checked_claim_errors: 0,
  publication_rank_claim_errors: 0,
  excluded_content_boundary_errors: 0,
  video_boundary_errors: 0,
  viewing_access_claim_errors: 0,
  timezone_boundary_errors: 0,
  correction_policy_errors: 0,
  new_public_routes: 0,
  new_public_data_classes: 0,
  scope_errors: 0,
  data_audit_errors: 0,
  mobile_qa_errors: 0,
  accessibility_qa_errors: 0,
  performance_qa_errors: 0,
  source_policy_errors: 0,
  faq_contract_errors: 0,
  methods_contract_errors: 0,
  privacy_boundary_errors: 0,
  automation_boundary_errors: 0,
  workflow_errors: 0,
  contract_errors: 0,
  output_errors: 0,
  temporary_known_limitations_files: 0,
};
if (!exact(verified, expectedVerified)) fail('known-limitations verified audit differs');

const doc = read(paths.doc);
for (const marker of ['V1-KNOWN-LIMITATIONS-01', 'Public pages in the frozen v1 candidate: 771', 'Known-limitation categories: 12', 'scripts/check-v1-known-limitations.mjs', '.github/workflows/v1-known-limitations.yml', 'V1-RELEASE-READINESS-01']) {
  if (!doc.includes(marker)) fail(`known-limitations documentation marker missing: ${marker}`);
}
const workflow = read(paths.workflow);
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
