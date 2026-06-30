import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('scripts/generate-japan-jra-candidates.mjs', [
  [
    `function confidenceFor(rows) {
  return rows.every((row) => row.metadata_status === 'verified') ? 'high' : 'medium';
}
`,
    `function confidenceFor(rows) {
  return rows.every((row) => row.metadata_status === 'verified') ? 'high' : 'medium';
}

function canonicalizeJraOfficialUrl(value, canonicalHost) {
  const url = new URL(value);
  if (!['jra.jp', 'www.jra.go.jp'].includes(url.hostname)) {
    throw new Error(\`Unexpected JRA official host: \${url.hostname}.\`);
  }
  url.hostname = canonicalHost;
  return url.toString();
}
`
  ],
  [
    `  const readinessRegistry = readJson('data/static/calendar-readiness-registry.json');
  const readinessMatches = readinessRegistry.records.filter((record) => record.authority_source_key === readinessKey);
`,
    `  const readinessRegistry = readJson('data/static/calendar-readiness-registry.json');
  const authorityInventory = readJson('data/static/authority-source-inventory.json');
  const readinessMatches = readinessRegistry.records.filter((record) => record.authority_source_key === readinessKey);
  const authorityMatches = authorityInventory.records.filter((record) =>
    record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
  );
`
  ],
  [
    `  if (readinessRegistry.schema_version !== 'calendar-readiness-registry-v1') {
    throw new Error('Unexpected Calendar Readiness registry schema.');
  }
`,
    `  if (readinessRegistry.schema_version !== 'calendar-readiness-registry-v1') {
    throw new Error('Unexpected Calendar Readiness registry schema.');
  }
  if (authorityInventory.schema_version !== 'authority-source-inventory-v1') {
    throw new Error('Unexpected Authority/Source inventory schema.');
  }
`
  ],
  [
    `  if (readinessMatches.length !== 1) {
    throw new Error(\`Expected one JRA programme readiness record, found \${readinessMatches.length}.\`);
  }
  const readiness = readinessMatches[0];
`,
    `  if (readinessMatches.length !== 1) {
    throw new Error(\`Expected one JRA programme readiness record, found \${readinessMatches.length}.\`);
  }
  if (authorityMatches.length !== 1) {
    throw new Error(\`Expected one JRA programme authority/source record, found \${authorityMatches.length}.\`);
  }
  const readiness = readinessMatches[0];
  const authoritySource = authorityMatches[0];
  const canonicalHost = new URL(authoritySource.official_source_url).hostname;
`
  ],
  [
    `          official_url: meeting.official_source_url,
`,
    `          official_url: canonicalizeJraOfficialUrl(meeting.official_source_url, canonicalHost),
`
  ]
]);

replace('scripts/check-japan-jra-candidate-generator.mjs', [
  [
    `  if (!record.source?.official_url?.startsWith('https://jra.jp/')) fail(\`\${record.candidate_id}: official URL must be JRA HTTPS.\`);
`,
    `  try {
    const candidateHost = new URL(record.source?.official_url).hostname;
    const authorityHost = new URL(authoritySource?.official_source_url).hostname;
    if (candidateHost !== authorityHost) fail(\`\${record.candidate_id}: official URL host must match the canonical inventory host.\`);
  } catch {
    fail(\`\${record.candidate_id}: official URL must be valid HTTPS.\`);
  }
`
  ],
  [
    `  'calendar-readiness-registry.json',
`,
    `  'calendar-readiness-registry.json',
  'authority-source-inventory.json',
`
  ]
]);

console.log('JRA_OFFICIAL_HOST_NORMALIZATION_APPLIED');
