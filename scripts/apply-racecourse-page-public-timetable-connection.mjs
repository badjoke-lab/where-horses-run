import fs from 'node:fs';

const block = (...lines) => lines.join('\n');
const replaceOnce = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`${label}: expected source text not found`);
  return text.replace(search, replacement);
};
const update = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${file}: no change produced`);
  fs.writeFileSync(file, after);
};

update('src/pages/tracks/[slug].astro', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "import BaseLayout from '../../layouts/BaseLayout.astro';\n",
    block(
      "import BaseLayout from '../../layouts/BaseLayout.astro';",
      "import RacecoursePublicMeetingPanel from '../../components/RacecoursePublicMeetingPanel.astro';",
      "import { getPublicRacecourseMeetingState } from '../../lib/racecourses/publicRacecourseMeetingState';",
      '',
    ),
    'English page imports',
  );
  text = replaceOnce(
    text,
    'const profile = track as any;',
    block(
      'const publicMeetingState = getPublicRacecourseMeetingState(track.id, track.timezone);',
      'const profile = track as any;',
    ),
    'English public meeting state',
  );
  text = replaceOnce(text, "const upcomingMeetings = track.schedule_summary?.upcoming_meetings ?? [];\n", '', 'English legacy schedule rows');
  text = replaceOnce(
    text,
    block(
      "const meetingFields: Array<[string, string[]]> = [",
      "  ['Date', ['date', 'local_date', 'meeting_date']],",
      "  ['First post', ['first_post', 'first_race_time', 'first_race']],",
      "  ['Last race', ['last_race_time', 'last_race']],",
      "  ['Races', ['race_count', 'races']],",
      "  ['Status', ['status']]",
      '];',
    ) + '\n',
    '',
    'English legacy meeting fields',
  );
  text = replaceOnce(
    text,
    block(
      '    <article class="card">',
      '      <h2>Schedule</h2>',
      '      {upcomingMeetings.length ? (',
      '        <ul>',
      '          {upcomingMeetings.map((meeting) => <li>{formatRecordFields(meeting, meetingFields)}</li>)}',
      '        </ul>',
      '      ) : (',
      '        <p>Upcoming meetings are not shown on this page yet. Once the calendar data is connected, meeting rows will appear here.</p>',
      '      )}',
      '      <p>{primaryScheduleUrl ? <a href={primaryScheduleUrl}>Check the latest schedule</a> : <a href={calendarHref}>Open calendar view</a>}</p>',
      '    </article>',
    ) + '\n',
    '',
    'English legacy Schedule card',
  );
  text = replaceOnce(
    text,
    block(
      '  </section>',
      '',
      '  <section class="section-grid" aria-label="Racing types and race conditions">',
    ),
    block(
      '  </section>',
      '',
      '  <RacecoursePublicMeetingPanel state={publicMeetingState} officialScheduleUrl={primaryScheduleUrl} />',
      '',
      '  <section class="section-grid" aria-label="Racing types and race conditions">',
    ),
    'English public panel placement',
  );
  return text;
});

update('src/pages/ja/tracks/[slug].astro', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "import BaseLayout from '../../../layouts/BaseLayout.astro';\n",
    block(
      "import BaseLayout from '../../../layouts/BaseLayout.astro';",
      "import RacecoursePublicMeetingPanel from '../../../components/RacecoursePublicMeetingPanel.astro';",
      "import { getPublicRacecourseMeetingState } from '../../../lib/racecourses/publicRacecourseMeetingState';",
      '',
    ),
    'Japanese page imports',
  );
  text = replaceOnce(
    text,
    'const profile = track as any;',
    block(
      'const publicMeetingState = getPublicRacecourseMeetingState(track.id, track.timezone);',
      'const profile = track as any;',
    ),
    'Japanese public meeting state',
  );
  text = replaceOnce(text, "const upcomingMeetings = track.schedule_summary?.upcoming_meetings ?? [];\n", '', 'Japanese legacy schedule rows');
  text = replaceOnce(
    text,
    block(
      "const meetingFields: Array<[string, string[]]> = [",
      "  ['日付', ['date', 'local_date', 'meeting_date']],",
      "  ['1R', ['first_post', 'first_race_time', 'first_race']],",
      "  ['最終', ['last_race_time', 'last_race']],",
      "  ['レース数', ['race_count', 'races']],",
      "  ['状態', ['status']]",
      '];',
    ) + '\n',
    '',
    'Japanese legacy meeting fields',
  );
  text = replaceOnce(
    text,
    block(
      '    <article class="card">',
      '      <h2>開催予定</h2>',
      '      {upcomingMeetings.length ? (',
      '        <ul>',
      '          {upcomingMeetings.map((meeting) => <li>{formatRecordFields(meeting, meetingFields)}</li>)}',
      '        </ul>',
      '      ) : (',
      '        <p>このページでは、直近の開催予定はまだ表示していません。カレンダー側のデータ接続後、この欄に開催予定を表示します。</p>',
      '      )}',
      '      <p>{primaryScheduleUrl ? <a href={primaryScheduleUrl}>最新の開催予定を見る</a> : <a href={calendarHref}>カレンダーを見る</a>}</p>',
      '    </article>',
    ) + '\n',
    '',
    'Japanese legacy Schedule card',
  );
  text = replaceOnce(
    text,
    block(
      '  </section>',
      '',
      '  <section class="section-grid" aria-label="競馬種別とレース条件">',
    ),
    block(
      '  </section>',
      '',
      '  <RacecoursePublicMeetingPanel state={publicMeetingState} lang="ja" officialScheduleUrl={primaryScheduleUrl} />',
      '',
      '  <section class="section-grid" aria-label="競馬種別とレース条件">',
    ),
    'Japanese public panel placement',
  );
  return text;
});

update('START-HERE.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    block(
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
    ),
    block(
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',
    ),
    'START-HERE implementation unit transition',
  );
  text = replaceOnce(
    text,
    block(
      '```text',
      '1. connect reviewed today and upcoming meeting state without inventing absent detail',
      '2. add official source, freshness, course, and distance profiles with explicit unknown states',
      '3. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture',
      '4. validate bilingual responsive racecourse pages and internal-link integrity',
      '```',
    ),
    block(
      '```text',
      '1. add official source, freshness, location, course, and distance profiles with explicit unknown states',
      '2. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture',
      '3. validate bilingual responsive racecourse pages and internal-link integrity',
      '```',
    ),
    'START-HERE active sequence',
  );
  return text;
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    block(
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
    ),
    block(
      'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
      'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
      'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',
    ),
    'implementation roadmap unit transition',
  );
  text = replaceOnce(
    text,
    'Identity reconciliation result: 26 of 26 public timetable racecourse IDs now resolve to canonical bilingual pages; thirteen identity-only records retain unknown profile fields until separate review.',
    'Identity reconciliation result: 26 of 26 public timetable racecourse IDs now resolve to canonical bilingual pages. Public timetable connection result: all 36 bilingual racecourse pages now expose reviewed Today, Next, and upcoming meeting state from the public meeting list; thirteen identity-only records retain unknown profile fields until separate review.',
    'implementation roadmap result summary',
  );
  text = replaceOnce(
    text,
    block(
      '1. connect reviewed today and upcoming meeting state;',
      '2. add official source, freshness, course, and distance profiles without unsupported inference;',
      '3. connect country, type, glossary, Calendar, meeting, and racecourse navigation;',
      '4. validate bilingual responsive pages and internal-link integrity.',
    ),
    block(
      '1. add official source, freshness, location, course, and distance profiles without unsupported inference;',
      '2. connect country, type, glossary, Calendar, meeting, and racecourse navigation;',
      '3. validate bilingual responsive pages and internal-link integrity.',
    ),
    'implementation roadmap active sequence',
  );
  text = text.replace(
    '2. connect reviewed current and upcoming meeting state to canonical racecourse pages\n3. add reviewed source and profile fields without unsupported inference\n4. complete racecourse page-link architecture',
    '2. add reviewed source and profile fields without unsupported inference\n3. complete racecourse page-link architecture\n4. validate bilingual racecourse pages and internal-link integrity',
  );
  return text;
});

update('docs/project-roadmap.md', (input) => replaceOnce(
  input,
  block(
    'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
    'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
    '',
    'Current product stage: connect reviewed timetable state to the now-complete canonical racecourse identity set, then strengthen profile evidence and page-link architecture.',
  ),
  block(
    'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',
    'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',
    'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',
    '',
    'Current product stage: all canonical racecourse pages now show reviewed Today, Next, and upcoming public meetings; next strengthen official source, freshness, location, course, and distance evidence before completing page-link architecture.',
  ),
  'project roadmap implementation transition',
));

update('docs/governance/document-authority.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    '- `docs/racecourses/identity-reconciliation.md`\n',
    block(
      '- `docs/racecourses/identity-reconciliation.md`',
      '- `docs/racecourses/public-timetable-connection.md`',
      '',
    ),
    'document authority connection document',
  );
  text = replaceOnce(
    text,
    '- `data/audits/racecourse-page-identity-reconciliation-v1.json`\n',
    block(
      '- `data/audits/racecourse-page-identity-reconciliation-v1.json`',
      '- `data/audits/racecourse-page-public-timetable-connection-v1.json`',
      '',
    ),
    'document authority connection audit',
  );
  text = replaceOnce(
    text,
    '- `scripts/check-racecourse-page-identity-reconciliation.mjs`\n',
    block(
      '- `scripts/check-racecourse-page-identity-reconciliation.mjs`',
      '- `scripts/check-racecourse-page-public-timetable-connection.mjs`',
      '- `src/lib/racecourses/publicRacecourseMeetingState.ts`',
      '- `src/components/RacecoursePublicMeetingPanel.astro`',
      '',
    ),
    'document authority connection implementation',
  );
  return text;
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "  'scripts/check-racecourse-page-identity-reconciliation.mjs',\n",
    block(
      "  'scripts/check-racecourse-page-identity-reconciliation.mjs',",
      "  'docs/racecourses/public-timetable-connection.md',",
      "  'data/audits/racecourse-page-public-timetable-connection-v1.json',",
      "  'src/lib/racecourses/publicRacecourseMeetingState.ts',",
      "  'src/components/RacecoursePublicMeetingPanel.astro',",
      "  'scripts/check-racecourse-page-public-timetable-connection.mjs',",
      '',
    ),
    'governance required connection files',
  );
  text = replaceOnce(
    text,
    block(
      "  'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',",
      "  'Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`'",
    ),
    block(
      "  'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',",
      "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',",
      "  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`'",
    ),
    'governance START-HERE connection markers',
  );
  text = replaceOnce(
    text,
    "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Calendar Public v1 release decision accepted',",
    block(
      "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',",
      "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',",
      "  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',",
      "  'Calendar Public v1 release decision accepted',",
    ),
    'governance project roadmap connection markers',
  );
  text = replaceOnce(
    text,
    "  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',",
    block(
      "  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',",
      "  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',",
      "  'Current implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',",
      "  'ACP-1 — NAR formal workflow dispatch — complete',",
    ),
    'governance implementation roadmap connection markers',
  );
  return text;
});

console.log('RACECOURSE_PAGE_PUBLIC_TIMETABLE_CONNECTION_APPLIED');
