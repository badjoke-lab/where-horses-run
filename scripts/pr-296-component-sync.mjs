import fs from 'node:fs';

const file = 'src/components/CountryDetailPage.astro';
const input = fs.readFileSync(file, 'utf8').split('\n');
const output = [];
let insertedCeiling = false;
let updatedGuide = false;
let wrappedColumns = 0;

for (const line of input) {
  output.push(line);

  if (!insertedCeiling && line.includes('const profile = getCountryProfileByCountryId')) {
    output.push("const publicDisplayCeiling = profile?.public_display_ceiling ?? 'C';");
    output.push("const showMeetingDetails = ['A+', 'A', 'B+', 'B'].includes(publicDisplayCeiling);");
    insertedCeiling = true;
    continue;
  }

  if (line.includes('profile.beginner_guide_en') && line.includes('<p>')) {
    output[output.length - 1] = line
      .replace('profile.beginner_guide_en', 'profile.beginner_guide_en ?? profile.coverage_note_en')
      .replace('profile.beginner_guide_ja', 'profile.beginner_guide_ja ?? profile.coverage_note_ja');
    updatedGuide = true;
    continue;
  }

  const isMeetingColumn =
    (line.includes('<th ') || line.includes('<td ')) &&
    ['System', 'Start time', 'Timezone', 'Official'].some((label) => line.includes(`pick('${label}'`));

  if (isMeetingColumn && !line.includes('showMeetingDetails')) {
    const indent = line.match(/^\s*/)?.[0] ?? '';
    const content = line.trim();
    output[output.length - 1] = `${indent}{showMeetingDetails && ${content}}`;
    wrappedColumns += 1;
  }
}

if (!insertedCeiling) throw new Error('profile marker not found');
if (!updatedGuide) throw new Error('beginner guide marker not found');
if (wrappedColumns !== 16) throw new Error(`expected 16 meeting columns, updated ${wrappedColumns}`);

fs.writeFileSync(file, output.join('\n'));
console.log('PR_296_COMPONENT_SYNC_COMPLETE');
