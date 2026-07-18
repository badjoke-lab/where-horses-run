import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dist = path.join(process.cwd(), 'dist');
const routes = {
  legacy_major_country_timetable: 'major-countries/timetable/index.html',
  current_timetable_en: 'major-countries/current-timetable/index.html',
  current_timetable_ja: 'ja/major-countries/current-timetable/index.html',
  search_en: 'search/index.html',
  search_ja: 'ja/search/index.html',
  sources_en: 'sources/index.html',
  sources_ja: 'ja/sources/index.html',
};

const result = {};
for (const [id, relative] of Object.entries(routes)) {
  const buffer = fs.readFileSync(path.join(dist, relative));
  const html = buffer.toString('utf8');
  result[id] = {
    file: relative,
    bytes: buffer.length,
    gzip_bytes: zlib.gzipSync(buffer, { level: 9 }).length,
    element_tags: (html.match(/<[a-z][^>]*>/gi) ?? []).length,
    inline_script_bytes: [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
      .reduce((sum, match) => sum + Buffer.byteLength(match[1], 'utf8'), 0),
    inline_style_bytes: [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
      .reduce((sum, match) => sum + Buffer.byteLength(match[1], 'utf8'), 0),
  };
}

fs.writeFileSync('v1-performance-key-pages.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
