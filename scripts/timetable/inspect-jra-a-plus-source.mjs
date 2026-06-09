const url = process.argv[2] ?? 'https://jra.jp/keiba/calendar2026/2026/6/0606.html';

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;|&#47;/gi, '/')
    .replace(/&#x3A;|&#58;/gi, ':');
}

function decodeBody(buffer) {
  const candidates = ['shift_jis', 'utf-8'].map((encoding) => {
    try {
      const text = new TextDecoder(encoding).decode(buffer);
      const score = ['発走時刻', 'レース', '芝', 'ダート', 'メートル', '東京', '阪神']
        .reduce((total, token) => total + (text.split(token).length - 1), 0);
      return { encoding, text, score };
    } catch {
      return { encoding, text: '', score: -1 };
    }
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0];
}

function compact(value) {
  return decodeEntities(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function printSection(title, rows) {
  console.log(`\n===== ${title} (${rows.length}) =====`);
  for (const row of rows.slice(0, 30)) console.log(row);
}

const response = await fetch(url, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
  },
});

const buffer = await response.arrayBuffer();
const decoded = decodeBody(buffer);
const html = decoded.text;

console.log('url:', url);
console.log('http_status:', response.status);
console.log('encoding:', decoded.encoding);
console.log('body_size:', buffer.byteLength);
console.log('counts:', {
  race: (html.match(/レース/g) ?? []).length,
  post_time: (html.match(/発走時刻/g) ?? []).length,
  turf: (html.match(/芝/g) ?? []).length,
  dirt: (html.match(/ダート/g) ?? []).length,
  metre: (html.match(/メートル/g) ?? []).length,
  lowercase_m: (html.match(/\d\s*m\b/gi) ?? []).length,
  alt: (html.match(/\balt\s*=/gi) ?? []).length,
  title: (html.match(/\btitle\s*=/gi) ?? []).length,
  aria_label: (html.match(/\baria-label\s*=/gi) ?? []).length,
});

const interestingTags = [...html.matchAll(/<[^>]+>/g)]
  .map((match) => compact(match[0]))
  .filter((tag) => /(芝|ダート|障害|メートル|\d[,，]?\d{3}\s*[mｍＭ]|Aコース|Bコース|Cコース|Dコース|右|左|内|外)/i.test(tag));
printSection('TAGS_WITH_METADATA', [...new Set(interestingTags)]);

const attributeTags = [...html.matchAll(/<[^>]+(?:alt|title|aria-label|data-[\w-]+)\s*=\s*["'][^"']+["'][^>]*>/gi)]
  .map((match) => compact(match[0]))
  .filter((tag) => /(芝|ダート|障害|メートル|\d[,，]?\d{3}\s*[mｍＭ]|レース|発走)/i.test(tag));
printSection('ATTRIBUTE_TAGS', [...new Set(attributeTags)]);

const plain = decodeEntities(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[ \t\u3000]+/g, ' ')
  .replace(/\r/g, '')
  .replace(/\n\s+/g, '\n')
  .replace(/\n{2,}/g, '\n');

const tokens = ['メートル', '芝', 'ダート', '障害', 'Aコース', 'Bコース', 'Cコース', 'Dコース'];
for (const token of tokens) {
  const samples = [];
  let from = 0;
  while (samples.length < 12) {
    const index = plain.indexOf(token, from);
    if (index < 0) break;
    samples.push(compact(plain.slice(Math.max(0, index - 220), Math.min(plain.length, index + 320))));
    from = index + token.length;
  }
  printSection(`TEXT_AROUND_${token}`, samples);
}
