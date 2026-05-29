import { readFileSync } from 'node:fs';
import path from 'node:path';
import { probeSourceUrl } from './lib/live-fetch-probe.mjs';

const root = process.cwd();
const sourceId = process.argv[2] ?? 'hong-kong-hkjc-home';
const sources = JSON.parse(readFileSync(path.join(root, 'data/static/sources.json'), 'utf8'));
const source = sources.find((item) => item.id === sourceId);

if (!source) {
  console.error(`Unknown source id: ${sourceId}`);
  process.exit(1);
}

const result = await probeSourceUrl(source);
console.log(JSON.stringify(result, null, 2));
