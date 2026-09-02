import fs from 'node:fs';
import path from 'node:path';
import { loadGlossary } from './glossary-data-loader.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

const hiddenIds = new Set([
  'fixture',
  'official-source',
  'official-calendar',
  'official-racecard',
  'link-first-source',
  'source-status',
  'governing-body',
  'racing-authority',
  'racecourse-operator',
]);

const legacyPatchIds = {
  'all-weather-course': 'all-weather',
  'course-using-both-directions': 'both-directions-course',
  'clerk-of-the-scales': 'clerk-of-scales',
};

const schema = readJson('data/static/glossary-entry-v2.schema.json');
const required = schema.required ?? [];
const allowed = new Set(Object.keys(schema.properties ?? {}));
const categories = new Set(schema.properties?.category?.enum ?? []);

const glossary = loadGlossary(root);
const byId = new Map(glossary.map((entry) => [entry.id, entry]));
for (const patch of readJson('data/static/glossary-public-copy-v1.json')) {
  const targetId = legacyPatchIds[patch.id] ?? patch.id;
  const current = byId.get(targetId);
  if (!current) {
    fail(`public-copy patch references unknown glossary ID: ${patch.id}`);
    continue;
  }
  byId.set(targetId, { ...current, ...patch, id: targetId });
}
const merged = [...byId.values()];
const publicEntries = merged.filter((entry) => !hiddenIds.has(entry.id));

const ids = new Set();
const slugs = new Set();
for (const entry of merged) {
  if (ids.has(entry.id)) fail(`duplicate id: ${entry.id}`);
  ids.add(entry.id);
  if (slugs.has(entry.slug)) fail(`duplicate slug: ${entry.slug}`);
  slugs.add(entry.slug);

  for (const key of required) if (!Object.hasOwn(entry, key)) fail(`${entry.id}: missing ${key}`);
  for (const key of Object.keys(entry)) if (!allowed.has(key)) fail(`${entry.id}: unsupported field ${key}`);
  if (entry.slug !== entry.id) fail(`${entry.id}: slug must equal id`);
  if (!categories.has(entry.category)) fail(`${entry.id}: invalid category ${entry.category}`);
  for (const field of ['term_en', 'term_ja', 'summary_en', 'summary_ja']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) fail(`${entry.id}: invalid ${field}`);
  }
  for (const relatedId of entry.related_term_ids ?? []) {
    if (!byId.has(relatedId)) fail(`${entry.id}: missing related term ${relatedId}`);
    if (relatedId === entry.id) fail(`${entry.id}: cannot relate to itself`);
  }
}

const sourceIds = new Set();
for (const filename of fs.readdirSync(path.join(root, 'data/static'))) {
  if (!/sources.*\.json$/.test(filename) && filename !== 'sources.json') continue;
  const value = readJson(`data/static/${filename}`);
  const records = Array.isArray(value) ? value : (value.source_records ?? []);
  for (const record of records) if (record?.id) sourceIds.add(record.id);
}
const amendments = readJson('data/static/racecourse-link-amendments-v1.json');
for (const record of amendments.source_records ?? []) if (record?.id) sourceIds.add(record.id);
for (const entry of merged) {
  for (const sourceId of entry.source_ids ?? []) {
    if (!sourceIds.has(sourceId)) fail(`${entry.id}: missing source ${sourceId}`);
  }
}

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
for (const entry of publicEntries) {
  for (const [lang, prefix, term, summary] of [
    ['en', '', entry.term_en, entry.summary_en],
    ['ja', 'ja/', entry.term_ja, entry.summary_ja],
  ]) {
    const file = path.join(root, `dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(file)) {
      fail(`${entry.id}: missing ${lang} page`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(term)) fail(`${entry.id}: ${lang} page missing term`);
    if (!html.includes(summary)) fail(`${entry.id}: ${lang} page missing summary`);
    const aliases = lang === 'en' ? entry.aliases_en : entry.aliases_ja;
    for (const alias of aliases ?? []) if (!html.includes(alias)) fail(`${entry.id}: ${lang} page missing alias ${alias}`);
    const beginner = lang === 'en' ? entry.beginner_explanation_en : entry.beginner_explanation_ja;
    if (beginner && !html.includes(beginner)) fail(`${entry.id}: ${lang} page missing beginner explanation`);
  }
}

for (const id of hiddenIds) {
  for (const prefix of ['', 'ja/']) {
    const file = path.join(root, `dist/${prefix}glossary/${id}/index.html`);
    if (fs.existsSync(file)) fail(`${id}: hidden glossary page was generated`);
  }
}

if (errors.length) {
  console.error(`GLOSSARY_PUBLIC_VALIDATION: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('GLOSSARY_PUBLIC_VALIDATION: pass');
console.log(`PUBLIC_TERMS: ${publicEntries.length}`);
console.log(`BILINGUAL_PUBLIC_PAGES: ${publicEntries.length * 2}`);
