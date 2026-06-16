import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHandoff } from './validate-handoff.mjs';

const pick = (value, keys) => Object.fromEntries(keys.map((key) => [key, value?.[key]]));
const option = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

export const exportHandoff = (input, generatedAt) => {
  const data = {
    schema_version: '1.0.0',
    evidence_id: input.evidence_id,
    generated_at: generatedAt,
    country: pick(input.country, ['delivery_no', 'slug', 'name_en', 'name_ja']),
    source: pick(input.source, ['source_id', 'tested_url', 'final_url', 'document_owner', 'public_distributor', 'content_type', 'source_type']),
    capture: {
      ...pick(input.capture, ['fetched_at', 'http_status', 'method']),
      artifacts: (input.capture?.artifacts ?? []).map((item) => pick(item, ['role', 'sha256', 'size_bytes']))
    },
    meeting: pick(input.meeting, ['tested_meeting_date', 'racecourse', 'race_count']),
    decision: pick(input.decision, ['status', 'technical_rank', 'fallback_rank', 'public_display_ceiling', 'confirmed_fields', 'unconfirmed_fields', 'summary']),
    public_safety: {
      raw_source_included: false,
      restricted_records_included: false,
      local_paths_included: false,
      direct_media_routes_included: false
    }
  };
  const errors = validateHandoff(data);
  if (errors.length) throw new Error(errors.join('\n'));
  return data;
};

const run = () => {
  const inputFile = option('input');
  const outputDir = option('output');
  const generatedAt = option('generated-at') ?? new Date().toISOString();
  if (!inputFile || !outputDir) throw new Error('Use --input and --output');
  const data = exportHandoff(JSON.parse(fs.readFileSync(inputFile, 'utf8')), generatedAt);
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${data.country.delivery_no}-${data.country.slug}-${data.evidence_id}.handoff.json`;
  const outputFile = path.join(outputDir, filename);
  fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`WROTE ${outputFile}`);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { run(); } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1); }
}
