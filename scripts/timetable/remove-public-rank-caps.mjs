import fs from 'node:fs';

const path = 'scripts/timetable/pipeline-v1/public-projection-core.mjs';
let source = fs.readFileSync(path, 'utf8');

const oldLowerRank = `function lowerRank(...ranks) {\n  assert(ranks.length > 0, 'lowerRank requires at least one rank');\n  return ranks.reduce((lowest, rank) =>\n    rankIndex(rank, 'rank') < rankIndex(lowest, 'rank') ? rank : lowest\n  );\n}\n\n`;
if (!source.includes(oldLowerRank)) throw new Error('expected lowerRank helper not found');
source = source.replace(oldLowerRank, '');

const oldDecision = `  const maximumPublicRank = lowerRank(policy.max_public_rank, resolved.readiness.public_ceiling);\n  const effectivePublicRank = lowerRank(record.capability_rank, maximumPublicRank);`;
const newDecision = `  const effectivePublicRank = record.capability_rank;`;
if (!source.includes(oldDecision)) throw new Error('expected public rank demotion logic not found');
source = source.replace(oldDecision, newDecision);

const oldAuditField = `    max_public_rank: maximumPublicRank,`;
const newAuditField = `    max_public_rank: record.capability_rank,`;
if (!source.includes(oldAuditField)) throw new Error('expected max_public_rank projection field not found');
source = source.replace(oldAuditField, newAuditField);

fs.writeFileSync(path, source);
console.log('PUBLIC_RANK_CAP_REMOVAL: applied');
