import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHandoff as validateObject } from './validate-object.mjs';
import { validateIdentity } from './validate-identity.mjs';
import { validateArtifacts } from './validate-artifacts.mjs';
import { validateMeeting } from './validate-meeting.mjs';

export const validateHandoff = (data) => [
  ...validateObject(data),
  ...validateIdentity(data),
  ...validateArtifacts(data),
  ...validateMeeting(data)
];

const run = () => {
  const input = process.argv[2];
  if (!input) throw new Error('Provide a JSON file or directory');
  const stat = fs.statSync(input);
  const files = stat.isFile()
    ? [input]
    : fs.readdirSync(input).filter((name) => name.endsWith('.json')).sort().map((name) => path.join(input, name));
  let failed = false;
  for (const file of files) {
    const errors = validateHandoff(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (errors.length) {
      failed = true;
      console.error(`INVALID ${file}`);
      errors.forEach((error) => console.error(`- ${error}`));
    } else {
      console.log(`VALID ${file}`);
    }
  }
  if (failed) process.exit(1);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { run(); } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1); }
}
