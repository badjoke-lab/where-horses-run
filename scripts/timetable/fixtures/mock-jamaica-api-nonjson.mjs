// Strict, offline fixture. The API returns HTTP 200 HTML while the same
// first-party Entries page already contains a valid monthly date listing.
const bootstrap=`<html><body>
<h6>October 2026 Overnight Programmes</h6><h2>Entries</h2>
<h6>Saturday</h6><h3>17</h3>
<h6>Sunday</h6><h3>18</h3>
<h6>Saturday</h6><h3>31</h3>
<h5>Racing Navigation</h5><p>Saturday 10</p>
</body></html>`;
let calls=0;
globalThis.fetch=async (url)=>{
  calls+=1;
  if(calls>2)throw Error('Unexpected extra fetch (fixture disallows another source request)');
  const isApi=String(url).includes('/api/site/racing-information/entries');
  return {
    ok:true,status:200,url:String(url),
    headers:{
      getSetCookie:()=>[],
      get:(key)=>key.toLowerCase()==='content-type'?(isApi?'text/html; charset=UTF-8':'text/html'):null
    },
    text:async()=>isApi?'<html><body>not json</body></html>':bootstrap
  };
};
process.on('exit',()=>{
  if(calls!==2)console.error('JAMAICA_FIXTURE_REQUEST_COUNT_MISMATCH',calls);
});
