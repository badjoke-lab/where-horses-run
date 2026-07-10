import fs from 'node:fs';

const file = 'docs/calendar/implementation-roadmap.md';
const before = `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational integration current
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Current Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Next source Work ID: \`WHR-CAL-HONG-KONG-HKJC\``;
const after = `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational handoff accepted; HKJC pilot current
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source Work ID: \`WHR-CAL-UAE-ERA\``;
const original = fs.readFileSync(file, 'utf8');
if (!original.includes(before)) throw new Error('expected stale Stage 6 state block not found');
fs.writeFileSync(file, original.replace(before, after));
console.log('HKJC_P4_ROADMAP_BASE_ALIGNMENT: applied');
