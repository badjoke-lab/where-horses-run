import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { validateHandoff } from './validate-handoff.mjs';

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (file) => {
  const bytes = fs.readFileSync(file);
  return {
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    size_bytes: bytes.length
  };
};

const listInputs = (input) => {
  const stat = fs.statSync(input);
  if (stat.isFile()) return [input];
  if (!stat.isDirectory()) throw new Error(`Input is neither a file nor directory: ${input}`);
  return fs.readdirSync(input)
    .filter((name) => name.endsWith('.handoff-input.json'))
    .sort()
    .map((name) => path.join(input, name));
};

const required = (value, label) => {
  if (value === undefined || value === null || value === '') throw new Error(`Missing ${label}`);
  return value;
};

const buildHandoff = (manifest, manifestFile, generatedAt) => {
  const artifacts = required(manifest.capture?.raw_artifacts, 'capture.raw_artifacts');
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error('capture.raw_artifacts must be a non-empty array');
  }

  const manifestDir = path.dirname(manifestFile);
  const publicArtifacts = artifacts.map((artifact, index) => {
    const role = required(artifact.role, `capture.raw_artifacts[${index}].role`);
    const rawPath = required(artifact.path, `capture.raw_artifacts[${index}].path`);
    const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(manifestDir, rawPath);
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) throw new Error(`Artifact is not a file: ${rawPath}`);
    return { role, ...sha256(resolved) };
  });

  return {
    schema_version: '1.0.0',
    evidence_id: required(manifest.evidence_id, 'evidence_id'),
    generated_at: generatedAt,
    country: {
      delivery_no: required(manifest.country?.delivery_no, 'country.delivery_no'),
      slug: required(manifest.country?.slug, 'country.slug'),
      name_en: required(manifest.country?.name_en, 'country.name_en'),
      name_ja: required(manifest.country?.name_ja, 'country.name_ja')
    },
    source: {
      source_id: required(manifest.source?.source_id, 'source.source_id'),
      tested_url: required(manifest.source?.tested_url, 'source.tested_url'),
      final_url: required(manifest.source?.final_url, 'source.final_url'),
      document_owner: required(manifest.source?.document_owner, 'source.document_owner'),
      public_distributor: required(manifest.source?.public_distributor, 'source.public_distributor'),
      content_type: required(manifest.source?.content_type, 'source.content_type'),
      source_type: required(manifest.source?.source_type, 'source.source_type')
    },
    capture: {
      fetched_at: required(manifest.capture?.fetched_at, 'capture.fetched_at'),
      http_status: required(manifest.capture?.http_status, 'capture.http_status'),
      method: required(manifest.capture?.method, 'capture.method'),
      artifacts: publicArtifacts
    },
    meeting: {
      tested_meeting_date: required(manifest.meeting?.tested_meeting_date, 'meeting.tested_meeting_date'),
      racecourse: required(manifest.meeting?.racecourse, 'meeting.racecourse'),
      race_count: required(manifest.meeting?.race_count, 'meeting.race_count')
    },
    decision: {
      status: required(manifest.decision?.status, 'decision.status'),
      technical_rank: required(manifest.decision?.technical_rank, 'decision.technical_rank'),
      fallback_rank: required(manifest.decision?.fallback_rank, 'decision.fallback_rank'),
      public_display_ceiling: required(manifest.decision?.public_display_ceiling, 'decision.public_display_ceiling'),
      confirmed_fields: required(manifest.decision?.confirmed_fields, 'decision.confirmed_fields'),
      unconfirmed_fields: required(manifest.decision?.unconfirmed_fields, 'decision.unconfirmed_fields'),
      summary: required(manifest.decision?.summary, 'decision.summary')
    },
    public_safety: {
      raw_source_included: false,
      participant_records_included: false,
      wagering_records_included: false,
      outcome_records_included: false,
      local_paths_included: false,
      direct_media_routes_included: false
    }
  };
};

export const exportHandoff = ({ input, output, generatedAt = new Date().toISOString() }) => {
  fs.mkdirSync(output, { recursive: true });
  const written = [];
  for (const inputFile of listInputs(input)) {
    const handoff = buildHandoff(readJson(inputFile), inputFile, generatedAt);
    const errors = validateHandoff(handoff);
    if (errors.length) throw new Error(`Invalid exported handoff:\n${errors.join('\n')}`);
    const filename = `${handoff.country.delivery_no}-${handoff.country.slug}-${handoff.evidence_id}.handoff.json`;
    const outputFile = path.join(output, filename);
    fs.writeFileSync(outputFile, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');
    written.push(outputFile);
  }
  if (!written.length) throw new Error('No handoff input files found');
  return written;
};

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const input = required(args.input, '--input');
    const output = required(args.output, '--output');
    for (const file of exportHandoff({ input, output, generatedAt: args['generated-at'] })) {
      console.log(`WROTE ${file}`);
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
