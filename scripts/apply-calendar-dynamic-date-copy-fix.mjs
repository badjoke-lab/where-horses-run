import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/pages/ja/tomorrow.astro';
const before = readFileSync(file, 'utf8');
const after = before.replace(
  'emptyLabel="明日の開催情報はまだありません。最終確認には公式ソースを使用してください。"',
  'emptyLabel="明日の確認済み公開開催はありません。最新情報は公式ソースで確認してください。"'
);
if (after === before) throw new Error('Japanese Tomorrow empty-state marker was not found.');
writeFileSync(file, after);
console.log('CALENDAR_DYNAMIC_DATE_COPY_FIX_APPLIED');
