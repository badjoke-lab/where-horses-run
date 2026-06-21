import fs from 'node:fs';

const file = 'src/components/CountryDetailPage.astro';
let text = fs.readFileSync(file, 'utf8');

const timezoneBefore = `const formatTimezone = (value?: string | null) => {
  if (value === 'Asia/Tokyo') return pick('JST / UTC+9', 'JST（UTC+9）');
  if (value === 'Asia/Hong_Kong') return pick('Hong Kong Time / UTC+8', '香港時間（UTC+8）');
  if (!value) return pick('Check local time', '現地時刻を確認');
  if (profile?.typical_schedule.timezone === value) {
    return isJa
      ? \`${'${value}'}（${'${profile.typical_schedule.utc_offset_label}'}）\`
      : \`${'${value}'} (${'${profile.typical_schedule.utc_offset_label}'})\`;
  }
  return value;
};`;

const timezoneAfter = `const formatTimezone = (value?: string | null) => {
  if (value === 'Asia/Tokyo') return pick('JST / UTC+9', 'JST（UTC+9）');
  if (value === 'Asia/Hong_Kong') return pick('Hong Kong Time / UTC+8', '香港時間（UTC+8）');
  if (!value) return pick('Check local time', '現地時刻を確認');
  if (profile?.typical_schedule.timezone === value) {
    const offsetLabel = profile.typical_schedule.utc_offset_label?.trim();
    const hasPublicOffset = offsetLabel && !/^(?:verify|check)\\b/i.test(offsetLabel);
    if (!hasPublicOffset) return value;
    return isJa ? \`${'${value}'}（${'${offsetLabel}'}）\` : \`${'${value}'} (${'${offsetLabel}'})\`;
  }
  return value;
};`;

const introBefore = `const upcomingIntro = pick(
  'This section shows currently available verified meeting records. After the calendar data model is finalized, this list will read from the same calendar dataset used by the calendar pages. One row represents one meeting; racecards, entries, odds, results, and payouts are not reproduced here.',
  'この欄は、現在利用できる確認済み開催レコードを表示しています。カレンダー機能の実データモデルが確定した後、この一覧はカレンダーページと同じデータを読む形に差し替えます。1行につき1開催を表示し、出走表、馬名、騎手、オッズ、結果、払戻は掲載しません。'
);`;

const introAfter = `const upcomingIntro = pick(
  'This section shows currently available verified meeting records. One row represents one meeting. Open the official sources for the latest complete schedule; racecards, entries, odds, results, and payouts are not reproduced here.',
  'この欄は、現在利用できる確認済み開催レコードを表示しています。1行につき1開催を表示します。最新の完全な日程は公式ソースで確認してください。出走表、馬名、騎手、オッズ、結果、払戻は掲載しません。'
);`;

for (const [before, after, label] of [
  [timezoneBefore, timezoneAfter, 'timezone formatter'],
  [introBefore, introAfter, 'upcoming meetings introduction']
]) {
  if (!text.includes(before)) throw new Error(`Missing expected ${label}`);
  text = text.replace(before, after);
}

fs.writeFileSync(file, text);
console.log('PUBLIC_COUNTRY_COPY_PATCHED');
