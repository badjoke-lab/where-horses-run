import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'scripts/check-country-profiles-53-60.mjs');
let value = fs.readFileSync(file, 'utf8');
const before = `  if (!['profile_ready', 'published'].includes(row[index.programme_status])) fail(\`${'${slug}'}: must be profile_ready or published\`);
  if (row[index.note_status] !== 'reviewed' || row[index.profile_status] !== 'reviewed') fail(\`${'${slug}'}: note and profile must be reviewed\`);
  if (row[index.profile_last_reviewed] !== '2026-06-29') fail(\`${'${slug}'}: profile review date mismatch\`);
  if (row[index.programme_status] === 'profile_ready') {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(\`${'${slug}'}: profile-ready routes must be complete\`);
    if (row[index.qa_status] !== 'not_started' || row[index.page_published_at]) fail(\`${'${slug}'}: publication state must remain untouched\`);
  }`;
const after = `  if (!['profile_ready', 'page_qa', 'published'].includes(row[index.programme_status])) fail(\`${'${slug}'}: must be profile_ready, page_qa, or published\`);
  if (row[index.note_status] !== 'reviewed' || row[index.profile_status] !== 'reviewed') fail(\`${'${slug}'}: note and profile must be reviewed\`);
  if (row[index.profile_last_reviewed] !== '2026-06-29') fail(\`${'${slug}'}: profile review date mismatch\`);
  if (row[index.programme_status] === 'profile_ready') {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(\`${'${slug}'}: profile-ready routes must be complete\`);
    if (row[index.qa_status] !== 'not_started' || row[index.page_published_at]) fail(\`${'${slug}'}: publication state must remain untouched\`);
  } else if (row[index.programme_status] === 'page_qa') {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(\`${'${slug}'}: page-QA routes must be complete\`);
    if (row[index.qa_status] !== 'pending' || row[index.page_published_at]) fail(\`${'${slug}'}: page-QA state is invalid\`);
  }`;
if (value.includes(after)) process.exit(0);
if (!value.includes(before)) throw new Error('profile validator publication patch target not found');
value = value.replace(before, after).replace('tracker=profile_ready_or_published', 'tracker=profile_ready_page_qa_or_published');
fs.writeFileSync(file, value);
console.log('PATCHED_PROFILE_VALIDATOR_FOR_PUBLICATION_53_60');
