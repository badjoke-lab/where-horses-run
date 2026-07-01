import { readFileSync, writeFileSync } from 'node:fs';

const file = 'scripts/check-jra-pilot-foundation.mjs';
const before = readFileSync(file, 'utf8');
const after = before.replace("'source_body','stream_url'", "'source_body_content','stream_url'");
if (after === before) throw new Error('JRA pilot validator marker missing.');
writeFileSync(file, after);
console.log('JRA_PILOT_VALIDATOR_FIX_APPLIED');
