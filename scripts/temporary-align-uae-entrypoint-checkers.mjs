import fs from 'node:fs';

const files = [
  'scripts/check-calendar-dynamic-dates-release-gate.mjs',
  'scripts/check-calendar-operations-v1-release-gate.mjs',
  'scripts/check-calendar-pipeline-v1-release-gate.mjs',
  'scripts/check-project-governance-docs.mjs',
];

const replacements = [
  ['Current Work ID: `WHR-CAL-HONG-KONG-HKJC`', 'Current Work ID: `WHR-CAL-UAE-ERA`'],
  ['Next source-specific Work ID: `WHR-CAL-UAE-ERA`', 'Next programme Work ID: `WHR-CAL-PUBLIC-V1`'],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-HONG-KONG-HKJC');", "console.log('CURRENT_WORK_ID: WHR-CAL-UAE-ERA');"],
  ["console.log('NEXT_SOURCE_WORK_ID: WHR-CAL-UAE-ERA');", "console.log('NEXT_PROGRAMME_WORK_ID: WHR-CAL-PUBLIC-V1');"],
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [before, after] of replacements) text = text.replaceAll(before, after);

  if (file === 'scripts/check-project-governance-docs.mjs') {
    const roadmapMarker = "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Current Work ID: `WHR-CAL-UAE-ERA`',";
    if (text.includes(roadmapMarker) && !text.includes("  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Current Work ID: `WHR-CAL-UAE-ERA`',")) {
      text = text.replace(roadmapMarker, "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Current Work ID: `WHR-CAL-UAE-ERA`',");
    }
    const implementationMarker = "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Current Work ID: `WHR-CAL-UAE-ERA`',";
    if (text.includes(implementationMarker) && (text.match(/Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`/g) ?? []).length < 2) {
      text = text.replace(implementationMarker, "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Current Work ID: `WHR-CAL-UAE-ERA`',");
    }
    if (!text.includes("console.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');")) {
      text = text.replace(
        "console.log('COMPLETED_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');",
        "console.log('COMPLETED_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');\nconsole.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');"
      );
    }
  }

  fs.writeFileSync(file, text);
}

console.log('UAE_ENTRYPOINT_CHECKER_ALIGNMENT: applied');
