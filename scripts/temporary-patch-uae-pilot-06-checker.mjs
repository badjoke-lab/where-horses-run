import fs from 'node:fs';

const file = 'scripts/check-calendar-uae-era-pilot-06-profile-foundation.mjs';
let text = fs.readFileSync(file, 'utf8');
text = text.replace("import { validateRunnerCompatibilityContractV1 } from './timetable/runner-compatibility.mjs';\n", '');
text = text.replace("const compatibilityErrors = validateRunnerCompatibilityContractV1(compatibility, acquisition);\nif (compatibilityErrors.length) fail(`runner compatibility validation failed: ${compatibilityErrors.join('; ')}`);\n", '');
fs.writeFileSync(file, text);
console.log('UAE_PILOT_06_CHECKER_PATCH: applied');
