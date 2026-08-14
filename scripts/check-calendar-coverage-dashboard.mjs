import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetCountries = ['japan', 'hong-kong', 'united-arab-emirates', 'south-korea', 'turkey', 'morocco'];
const dimensions = ['racecourses', 'dates', 'events', 'times', 'structures'];
const errors = [];

function fail(message) { errors.push(message); }
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), 'utf8'); }

for (const [route, lang] of [['dist/calendar/index.html', 'en'], ['dist/ja/calendar/index.html', 'ja']]) {
  if (!fs.existsSync(path.join(root, route))) {
    fail(`${route} missing; run npm run build first`);
    continue;
  }
  const html = read(route);
  if ((html.match(/data-calendar-coverage-dashboard/g) ?? []).length !== 1) fail(`${route}: expected one coverage dashboard`);

  const renderedCountries = [...html.matchAll(/data-coverage-country="([^"]+)"/g)].map((match) => match[1]);
  if (JSON.stringify(renderedCountries) !== JSON.stringify(targetCountries)) {
    fail(`${route}: coverage country order/scope mismatch: ${renderedCountries.join(', ')}`);
  }

  for (const country of targetCountries) {
    if (!html.includes(`data-coverage-country="${country}"`)) fail(`${route}: missing ${country}`);
  }

  for (const dimension of dimensions) {
    const count = (html.match(new RegExp(`data-coverage-dimension="${dimension}"`, 'g')) ?? []).length;
    if (count !== targetCountries.length) fail(`${route}: ${dimension} dimension expected ${targetCountries.length}, got ${count}`);
  }

  const moroccoCard = html.match(/<article[^>]*data-coverage-country="morocco"[\s\S]*?<\/article>/)?.[0] ?? '';
  if (!moroccoCard.includes('data-source-status="blocked"')) fail(`${route}: Morocco must remain source-blocked`);
  for (const dimension of dimensions) {
    if (!moroccoCard.includes(`data-coverage-dimension="${dimension}" data-confirmed="false"`)) {
      fail(`${route}: Morocco ${dimension} must remain unverified`);
    }
  }

  const turkeyCard = html.match(/<article[^>]*data-coverage-country="turkey"[\s\S]*?<\/article>/)?.[0] ?? '';
  if (!turkeyCard.includes('data-source-status="verified"')) fail(`${route}: Turkey source capability must be verified`);
  for (const dimension of dimensions) {
    if (!turkeyCard.includes(`data-coverage-dimension="${dimension}" data-confirmed="true"`)) {
      fail(`${route}: Turkey ${dimension} source capability missing`);
    }
  }

  if (/candidate|adapter_status|automatic_approval|canonical_write|public_projection_write/i.test(html)) {
    fail(`${route}: internal workflow vocabulary leaked into public dashboard`);
  }

  if (!/data-public-meetings="\d+"/.test(html) || !/data-public-event-rows="\d+"/.test(html)) {
    fail(`${route}: reviewed public metrics are missing`);
  }

  const expectedHeading = lang === 'ja' ? 'カレンダー Coverage' : 'Calendar coverage';
  if (!html.includes(expectedHeading)) fail(`${route}: localized dashboard heading missing`);
}

if (errors.length) {
  console.error(`Calendar coverage dashboard check failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Calendar coverage dashboard check passed.');
console.log('- countries: 6');
console.log('- dimensions: Racecourses / Dates / Events / Times / Structures');
console.log('- source capability and reviewed public counts remain separate');
console.log('- Morocco remains unverified; Turkey source capability remains verified');
