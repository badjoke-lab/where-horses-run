// One-off public OSM Nominatim read-only geocode diagnostic; no venue coordinates promoted automatically.
const queries=['Грозненский ипподром имени Сайд-Хусейна Закаева Чечен-Аул','Чечен-Аул Ипподромная улица 2'];
for(let i=0;i<queries.length;i++){
 const url='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q='+encodeURIComponent(queries[i]);
 try{
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),
   headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/; public-map-validation)','accept':'application/json'}});
  if(response.status!==200){console.log('GROZNY_GEO '+JSON.stringify({index:i,http:response.status,status:'unavailable'}));continue}
  const type=response.headers.get('content-type')||'';
  if(!type.includes('json')){console.log('GROZNY_GEO '+JSON.stringify({index:i,status:'invalid_content_type'}));continue}
  const results=await response.json();
  if(!Array.isArray(results)){console.log('GROZNY_GEO '+JSON.stringify({index:i,status:'invalid_response'}));continue}
  console.log('GROZNY_GEO '+JSON.stringify({index:i,status:'ok',count:results.length,
    candidates:results.slice(0,5).map(x=>({display_name:x.display_name,lat:x.lat,lon:x.lon,type:x.type,category:x.category,osm_id:x.osm_id,osm_type:x.osm_type,importance:x.importance}))}));
 }catch(e){console.log('GROZNY_GEO '+JSON.stringify({index:i,status:'fetch_error',name:String(e?.name||'error')}))}
 if(i<queries.length-1)await new Promise(resolve=>setTimeout(resolve,1500));
}
console.log('GROZNY_GEO_END no_coordinates_written');
