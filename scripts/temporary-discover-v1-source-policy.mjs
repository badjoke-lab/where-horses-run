import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataModule = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
const sourceImports = [...dataModule.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]\.\.\/\.\.\/(data\/static\/[^'"]+\.json)['"]/g)]
  .filter(([, variable, file]) => variable === 'sources' || variable.startsWith('countryPageSources') || file === 'data/static/racecourse-link-amendments-v1.json')
  .map(([, variable, file]) => ({ variable, file }));

const forbiddenPublicFields = new Set([
  'terms_risk', 'm3_status', 'm3_notes', 'parser_status', 'parser_notes',
  'acquisition_status', 'acquisition_notes', 'automation_notes', 'internal_notes',
]);
const internalTextPatterns = [
  /\bautomation\b/i,
  /\bautomated\b/i,
  /\bparser\b/i,
  /\bacquisition\b/i,
  /\bterms? risk\b/i,
  /\bregistry status\b/i,
  /\balpha[_ -]link[_ -]first\b/i,
  /\bm3\b/i,
  /\btarget for\b/i,
  /\bcandidate\b/i,
  /\bscrap(?:e|ing)\b/i,
];
const permittedSourceTypes = new Set(['official', 'reference', 'licensed']);
const permittedDataTypes = new Set(['link_only', 'calendar', 'fixture', 'programme', 'racecourse', 'results_reference', 'live', 'replay']);
const permittedAutoLevels = new Set(['A', 'B', 'C', 'not_applicable']);
const permittedTermsRisks = new Set(['low', 'medium', 'high', 'unknown']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function topSourceRows(file, data) {
  if (file === 'data/static/racecourse-link-amendments-v1.json') return data.source_records ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.sources)) return data.sources;
  return [];
}

function countBy(rows, key, fallback = 'not_recorded') {
  const result = {};
  for (const row of rows) {
    const value = typeof row?.[key] === 'string' && row[key].trim() ? row[key].trim() : fallback;
    result[value] = (result[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

const parsed = Object.fromEntries(sourceImports.map(({ file }) => [file, readJson(file)]));
const entries = sourceImports.flatMap(({ file }) => topSourceRows(file, parsed[file]).map((record, index) => ({ file, index, record })));
const records = entries.map(({ record }) => record);

const missingRequired = [];
const invalidUrls = [];
const nonHttpsUrls = [];
const unknownCountries = [];
const forbiddenFieldInstances = [];
const internalTextInstances = [];
const hostCounts = {};
const urlPathKinds = {};
const countryCounts = {};
const notesEmpty = [];
const labelFields = {};

const countryFiles = [...dataModule.matchAll(/from ['"]\.\.\/\.\.\/(data\/static\/(?:countries\.json|country-page-countries-[^'"]+\.json))['"]/g)].map((match) => match[1]);
const countryIds = new Set(countryFiles.flatMap((file) => {
  const data = readJson(file);
  return Array.isArray(data) ? data.map((row) => row.id) : [];
}));

for (const { file, index, record } of entries) {
  const pointer = `${file}#${index}`;
  for (const key of ['id', 'country_id', 'url']) {
    if (typeof record?.[key] !== 'string' || !record[key].trim()) missingRequired.push({ pointer, key });
  }
  if (typeof record?.country_id === 'string' && !countryIds.has(record.country_id)) unknownCountries.push({ pointer, country_id: record.country_id });
  if (typeof record?.url === 'string') {
    try {
      const url = new URL(record.url);
      hostCounts[url.hostname] = (hostCounts[url.hostname] ?? 0) + 1;
      const kind = url.pathname === '/' || url.pathname === '' ? 'host_root' : url.pathname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'deep_page';
      urlPathKinds[kind] = (urlPathKinds[kind] ?? 0) + 1;
      if (!['http:', 'https:'].includes(url.protocol)) invalidUrls.push({ pointer, url: record.url, reason: 'protocol' });
      if (url.protocol !== 'https:') nonHttpsUrls.push({ pointer, url: record.url });
    } catch {
      invalidUrls.push({ pointer, url: record.url, reason: 'parse' });
    }
  }
  if (typeof record?.country_id === 'string') countryCounts[record.country_id] = (countryCounts[record.country_id] ?? 0) + 1;
  for (const [key, value] of Object.entries(record ?? {})) {
    if (forbiddenPublicFields.has(key)) forbiddenFieldInstances.push({ pointer, key, value });
    if (/label|name|title/i.test(key)) labelFields[key] = (labelFields[key] ?? 0) + 1;
    if (typeof value !== 'string') continue;
    for (const pattern of internalTextPatterns) {
      if (!pattern.test(value)) continue;
      internalTextInstances.push({ pointer, key, pattern: pattern.source, value: value.slice(0, 300) });
      break;
    }
  }
  if (typeof record?.notes !== 'string' || !record.notes.trim()) notesEmpty.push({ pointer, id: record?.id ?? '' });
}

const sourceTypeCounts = countBy(records, 'source_type');
const dataTypeCounts = countBy(records, 'data_type');
const autoLevelCounts = countBy(records, 'auto_level');
const termsRiskCounts = countBy(records, 'terms_risk');
const registryStatusCounts = countBy(records, 'm3_status');
const fieldCounts = {};
for (const record of records) for (const key of Object.keys(record)) fieldCounts[key] = (fieldCounts[key] ?? 0) + 1;

const invalidSourceTypes = Object.keys(sourceTypeCounts).filter((value) => value !== 'not_recorded' && !permittedSourceTypes.has(value));
const invalidDataTypes = Object.keys(dataTypeCounts).filter((value) => value !== 'not_recorded' && !permittedDataTypes.has(value));
const invalidAutoLevels = Object.keys(autoLevelCounts).filter((value) => value !== 'not_recorded' && !permittedAutoLevels.has(value));
const invalidTermsRisks = Object.keys(termsRiskCounts).filter((value) => value !== 'not_recorded' && !permittedTermsRisks.has(value));

const renderedSourcePages = ['dist/sources/index.html', 'dist/ja/sources/index.html'];
const renderedFindings = [];
for (const relative of renderedSourcePages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const [code, pattern] of [
    ['automation_level', /Automation level|自動化レベル/i],
    ['terms_risk', /Terms risk|利用条件リスク/i],
    ['registry_status', /Registry status|登録状態/i],
    ['alpha_link_first', /Alpha Link First|アルファ・リンク優先/i],
    ['not_recorded', /Not Recorded|未記録/i],
  ]) if (pattern.test(html)) renderedFindings.push({ page: relative, code });
}

const sourceDetailHtmlFiles = [];
for (const localePrefix of ['', 'ja/']) {
  const directory = path.join(root, 'dist', localePrefix, 'sources');
  if (!fs.existsSync(directory)) continue;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'index.html'))) sourceDetailHtmlFiles.push(path.join(directory, entry.name, 'index.html'));
  }
}
const detailRenderedFindings = [];
for (const file of sourceDetailHtmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [code, pattern] of [
    ['automation_level', /Automation level|自動化レベル/i],
    ['terms_risk', /Terms risk|利用条件リスク/i],
    ['registry_status', /Registry status|登録状態/i],
  ]) if (pattern.test(html)) detailRenderedFindings.push({ page: path.relative(root, file), code });
}

const report = {
  schemaVersion: 'v1-source-policy-discovery-v1',
  generatedAt: new Date().toISOString(),
  sourceImportFiles: sourceImports.length,
  sourceRecords: records.length,
  countriesWithSources: Object.keys(countryCounts).length,
  uniqueHosts: Object.keys(hostCounts).length,
  duplicateIds: duplicates(records.map((row) => row.id)),
  duplicateUrls: duplicates(records.map((row) => row.url)),
  missingRequired,
  invalidUrls,
  nonHttpsUrls,
  unknownCountries,
  notesEmpty,
  fieldCounts: Object.fromEntries(Object.entries(fieldCounts).sort(([a], [b]) => a.localeCompare(b))),
  labelFields: Object.fromEntries(Object.entries(labelFields).sort(([a], [b]) => a.localeCompare(b))),
  sourceTypeCounts,
  dataTypeCounts,
  autoLevelCounts,
  termsRiskCounts,
  registryStatusCounts,
  invalidSourceTypes,
  invalidDataTypes,
  invalidAutoLevels,
  invalidTermsRisks,
  forbiddenPublicFieldInstances: forbiddenFieldInstances.length,
  forbiddenPublicFieldsByName: countBy(forbiddenFieldInstances.map((item) => ({ key: item.key })), 'key'),
  internalTextInstances: internalTextInstances.length,
  renderedDirectoryFindings: renderedFindings,
  sourceCountryPages: sourceDetailHtmlFiles.length,
  renderedCountryPageFindings: detailRenderedFindings,
  hostCounts: Object.fromEntries(Object.entries(hostCounts).sort(([, a], [, b]) => b - a || 0)),
  urlPathKinds,
  countryCounts: Object.fromEntries(Object.entries(countryCounts).sort(([a], [b]) => a.localeCompare(b))),
  sampleForbiddenFields: forbiddenFieldInstances.slice(0, 100),
  sampleInternalText: internalTextInstances.slice(0, 100),
};

fs.writeFileSync(path.join(root, 'v1-source-policy-discovery.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  schemaVersion: report.schemaVersion,
  sourceImportFiles: report.sourceImportFiles,
  sourceRecords: report.sourceRecords,
  countriesWithSources: report.countriesWithSources,
  uniqueHosts: report.uniqueHosts,
  duplicateIds: report.duplicateIds.length,
  duplicateUrls: report.duplicateUrls.length,
  missingRequired: report.missingRequired.length,
  invalidUrls: report.invalidUrls.length,
  nonHttpsUrls: report.nonHttpsUrls.length,
  unknownCountries: report.unknownCountries.length,
  notesEmpty: report.notesEmpty.length,
  sourceTypeCounts: report.sourceTypeCounts,
  dataTypeCounts: report.dataTypeCounts,
  autoLevelCounts: report.autoLevelCounts,
  termsRiskCounts: report.termsRiskCounts,
  registryStatusCounts: report.registryStatusCounts,
  forbiddenPublicFieldInstances: report.forbiddenPublicFieldInstances,
  internalTextInstances: report.internalTextInstances,
  renderedDirectoryFindings: report.renderedDirectoryFindings,
  sourceCountryPages: report.sourceCountryPages,
  renderedCountryPageFindings: report.renderedCountryPageFindings.length,
}, null, 2));
