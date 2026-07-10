import fs from 'node:fs';

function replaceFirst(file, before, after, label) {
  const original = fs.readFileSync(file, 'utf8');
  const index = original.indexOf(before);
  if (index < 0) throw new Error(`${file}: expected ${label} marker not found`);
  const updated = `${original.slice(0, index)}${after}${original.slice(index + before.length)}`;
  fs.writeFileSync(file, updated);
}

function replaceActiveSequence(file) {
  const original = fs.readFileSync(file, 'utf8');
  const sectionStart = original.indexOf('## Active sequence');
  if (sectionStart < 0) throw new Error(`${file}: Active sequence section missing`);
  const fenceStart = original.indexOf('```text', sectionStart);
  if (fenceStart < 0) throw new Error(`${file}: Active sequence code fence missing`);
  const fenceEnd = original.indexOf('```', fenceStart + '```text'.length);
  if (fenceEnd < 0) throw new Error(`${file}: Active sequence closing fence missing`);
  const replacement = `\`\`\`text
1. confirm the reviewed UAE Calendar Readiness and official ERA season-calendar baseline
2. implement a bounded C-level UAE candidate generator with no-write artifact output
3. run source-specific fixture/parser evidence before any Acquisition Registry activation decision
4. explicitly review the UAE handoff boundary after bounded evidence
5. continue to WHR-CAL-PUBLIC-V1 only after the UAE source-specific boundary is reviewed
\`\`\``;
  const updated = `${original.slice(0, fenceStart)}${replacement}${original.slice(fenceEnd + 3)}`;
  fs.writeFileSync(file, updated);
}

replaceFirst(
  'START-HERE.md',
  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`',
  'canonical Current Work ID'
);
replaceFirst(
  'START-HERE.md',
  'Next source-specific Work ID: `WHR-CAL-UAE-ERA`',
  'Next programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'canonical next source Work ID'
);
replaceActiveSequence('START-HERE.md');

replaceFirst(
  'docs/project-roadmap.md',
  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`',
  'canonical Current Work ID'
);
replaceFirst(
  'docs/project-roadmap.md',
  'Next source-specific Work ID: `WHR-CAL-UAE-ERA`',
  'Next programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'canonical next source Work ID'
);
replaceFirst(
  'docs/project-roadmap.md',
  'Last reviewed: 2026-07-10',
  'Last reviewed: 2026-07-11',
  'review date'
);

const projectRoadmapPath = 'docs/project-roadmap.md';
{
  const original = fs.readFileSync(projectRoadmapPath, 'utf8');
  const lineStart = original.indexOf('The NAR source pilot, Acquisition Control Plane foundation');
  if (lineStart < 0) throw new Error(`${projectRoadmapPath}: current-position sentence missing`);
  const lineEnd = original.indexOf('\n', lineStart);
  if (lineEnd < 0) throw new Error(`${projectRoadmapPath}: current-position sentence terminator missing`);
  const replacement = 'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, and HKJC source-specific pilot handoff are complete. Banei and HKJC continue under their accepted reviewed operating boundaries. The current source-specific work is `WHR-CAL-UAE-ERA`; the next programme stage is `WHR-CAL-PUBLIC-V1` after the UAE source-specific handoff boundary is explicitly reviewed.';
  fs.writeFileSync(projectRoadmapPath, `${original.slice(0, lineStart)}${replacement}${original.slice(lineEnd)}`);
}

replaceFirst(
  'docs/calendar/implementation-roadmap.md',
  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`',
  'canonical Current Work ID'
);
replaceFirst(
  'docs/calendar/implementation-roadmap.md',
  'Next source-specific Work ID: `WHR-CAL-UAE-ERA`',
  'Next programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'canonical next source Work ID'
);

console.log('UAE_ENTRYPOINT_SYNC: applied');
