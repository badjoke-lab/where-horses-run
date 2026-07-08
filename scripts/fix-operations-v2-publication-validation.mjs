import fs from 'node:fs';

const file = 'scripts/timetable/operations-v2.mjs';
const from = `  if (!Array.isArray(output.systems)) errors.push('systems must be an array');\n`;
const to = `  const publication = output.publication_summary;\n  if (!publication || !PUBLICATION_STATES.includes(publication.state)) errors.push('publication summary state invalid');\n  if (publication?.generated_at !== null && !validDateTime(publication?.generated_at)) errors.push('publication summary generated_at invalid');\n  for (const key of ['meeting_count', 'detail_count']) {\n    if (!Number.isInteger(publication?.[key]) || publication[key] < 0) errors.push(\`publication summary \${key} invalid\`);\n  }\n  if (typeof publication?.stale_for_current_window !== 'boolean') errors.push('publication summary stale flag invalid');\n\n  if (!Array.isArray(output.systems)) errors.push('systems must be an array');\n`;

const text = fs.readFileSync(file, 'utf8');
if (!text.includes(from)) throw new Error('Operations v2 publication validation anchor not found');
fs.writeFileSync(file, text.replace(from, to));
console.log('OPERATIONS_V2_PUBLICATION_VALIDATION_FIXED');
