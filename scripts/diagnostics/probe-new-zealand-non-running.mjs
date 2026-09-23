import fs from 'node:fs';

const SOURCES = {
  nztrNews: 'https://nztr.co.nz/news',
  nztrRemoved: 'https://nztr.co.nz/news/awapuni-synthetic-meeting-update-and-incentive-series-confirmed',
  nztrTransfer: 'https://nztr.co.nz/news/ellerslie-25-may-meeting-transferred-following-abandonment-saturday',
  nztrPartial: 'https://nztr.co.nz/news/nztr-statement-awapuni-abandonment',
  hrnzNews: 'https://www.hrnz.co.nz/news/',
  hrnzCalledOff: 'https://www.hrnz.co.nz/news/cambridges-thursday-meeting-called-off-not-viable/',
  hrnzPostponed: 'https://www.hrnz.co.nz/news/thursdays-alexandra-park-meeting-postponed-until-saturday/',
  hrnzTransfer: 'https://www.hrnz.co.nz/news/methven-meeting-transferred-to-ashburton/',
};

function decode(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function fold(value) {
  return decode(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'en-NZ,en;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.text();
    return {
      requested_url: url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      content_type: response.headers.get('content-type'),
      bytes: Buffer.byteLength(body),
      body,
    };
  } catch (error) {
    return { requested_url: url, ok: false, error: error instanceof Error ? error.message : String(error), body: '' };
  }
}
function newsCandidates(html, baseUrl) {
  const source = String(html ?? '');
  const found = new Map();
  for (const match of source.matchAll(/href\s*=\s*["']([^"']*\/news\/[^"'?#]+)["']/gi)) {
    let url;
    try { url = new URL(match[1], baseUrl).toString(); } catch { continue; }
    if (/\/news\/?$/.test(new URL(url).pathname)) continue;
    const context = decode(source.slice(Math.max(0, (match.index ?? 0) - 1100), (match.index ?? 0) + 700));
    if (!/(abandon|postpon|transfer|called off|cancel|removed from the racing calendar)/i.test(fold(context))) continue;
    if (!found.has(url)) found.set(url, context.slice(0, 1100));
  }
  return [...found.entries()].map(([url, context]) => ({url, context})).slice(0, 50);
}
function fingerprints(key, html) {
  const s=fold(html);
  const common={authority_nztr:s.includes('new zealand thoroughbred racing')||s.includes('nztr'),authority_hrnz:s.includes('harness racing new zealand')};
  if(key==='nztrRemoved') return {...common,match:s.includes('awapuni synthetic meeting')&&s.includes('sunday 7 june')&&s.includes('removed from the racing calendar')};
  if(key==='nztrTransfer') return {...common,match:s.includes('race meeting scheduled to be held at ellerslie on may 25')&&s.includes('moving to pukekohe park')};
  if(key==='nztrPartial') return {...common,match:s.includes('meeting')&&s.includes('abandon')&&s.includes('after race 1')};
  if(key==='hrnzCalledOff') return {...common,match:s.includes("cambridge's thursday meeting called off")&&s.includes('cancel the meeting')};
  if(key==='hrnzPostponed') return {...common,match:s.includes("alexandra park meeting postponed")&&s.includes('move to saturday')};
  if(key==='hrnzTransfer') return {...common,match:s.includes('methven meeting transferred to ashburton')&&s.includes("sunday's scheduled meeting at methven")&&s.includes('held on the all-weather track at ashburton')};
  return common;
}

const results={};
for(const [key,url] of Object.entries(SOURCES)) {
  const row=await fetchPage(url);
  results[key]={
    requested_url:url,final_url:row.final_url??null,status:row.status??null,ok:row.ok,
    content_type:row.content_type??null,bytes:row.bytes??0,error:row.error??null,
    fingerprints:fingerprints(key,row.body),
    text_sample:decode(row.body).slice(0,2600),
  };
}
results.nztrNews.candidates=newsCandidates((await fetchPage(SOURCES.nztrNews)).body,SOURCES.nztrNews);
results.hrnzNews.candidates=newsCandidates((await fetchPage(SOURCES.hrnzNews)).body,SOURCES.hrnzNews);

const artifact={
  schema_version:'new-zealand-non-running-route-probe-v1',
  generated_at:new Date().toISOString(),
  purpose:'Verify stable official NZTR/HRNZ news routes and known whole-meeting versus partial-abandonment fixtures before any production automation.',
  results,
};
fs.writeFileSync('probe-new-zealand-non-running.json',JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify(artifact,null,2));

for(const key of Object.keys(SOURCES)) {
  if(!results[key].ok) throw new Error('Official New Zealand source failed: '+key);
}
for(const key of ['nztrRemoved','nztrTransfer','nztrPartial','hrnzCalledOff','hrnzPostponed','hrnzTransfer']) {
  if(!results[key].fingerprints.match) throw new Error('Expected official fixture fingerprint missing: '+key);
}
if(!results.nztrNews.fingerprints.authority_nztr) throw new Error('NZTR news index fingerprint missing');
if(!results.hrnzNews.fingerprints.authority_hrnz) throw new Error('HRNZ news index fingerprint missing');
