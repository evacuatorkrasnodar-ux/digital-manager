/**
 * Server-only provider adapter: read-only, bounded organization search in 2GIS.
 * NOT deployed, NOT accessible from app, and NOT an HTTP endpoint.
 *
 * Requires an authenticated backend to resolve user identity and permissions
 * server-side. Never place the provider's API key in GitHub Pages or client JS.
 *
 * Official API: https://docs.2gis.com/en/api/search/places/overview
 * Rate limits, caching, commercial license and data retention must be solved
 * by the deploying service. Do not silently poll on a public shared API.
 */
const API='https://catalog.api.2gis.com/3.0/items';
const clean=(v,max)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
export function marketQuery({business='',location=''}={}){
 const b=clean(business,90),l=clean(location,130);
 if(b.length<3||l.length<3)throw new Error('Business and location required');
 if(/[<>{}\r\n]/.test(b+l))throw new Error('Invalid market query');
 return b+' '+l;
}
export async function searchOrganizationsOnServer({
 authenticatedUserId,permissions,business,location,apiKey=process.env.TWOGIS_API_KEY,
 fetchImpl=globalThis.fetch,limit=10
}={}){
 // The calling API route MUST prove these values against the authenticated
 // session and permissions store, not trust browser-supplied JSON booleans.
 if(typeof authenticatedUserId!=='string'||!authenticatedUserId.trim())throw new Error('Authentication required');
 if(permissions?.marketResearch!==true)throw new Error('Market research permission required');
 if(!apiKey)throw new Error('2GIS server API key not configured');
 if(typeof fetchImpl!=='function')throw new Error('No fetch transport');
 const q=marketQuery({business,location});
 const pageSize=Math.max(1,Math.min(10,Math.floor(Number(limit)||10)));
 const url=new URL(API);
 url.searchParams.set('q',q);
 url.searchParams.set('type','branch');
 url.searchParams.set('page_size',String(pageSize));
 url.searchParams.set('key',apiKey);
 // Does not include private customer, payment, bank or account data.
 const response=await fetchImpl(url.href,{
  method:'GET',headers:{'Accept':'application/json'},signal:AbortSignal.timeout(9000)
 });
 if(!response.ok)throw new Error('2GIS Places API status '+response.status);
 const raw=await response.json();
 if(!Array.isArray(raw?.result?.items))throw new Error('Invalid 2GIS response');
 const places=raw.result.items.slice(0,pageSize).map(x=>{
  const name=clean(x?.name||x?.name_ex?.primary,130);
  const address=clean(x?.address_name||x?.full_address_name,180);
  const id=clean(x?.id,50);
  if(!name||!id)return null;
  return {provider:'2gis',providerId:id,name,address,
   observedAt:Date.now(),origin:'api-directory-listing'};
 }).filter(Boolean);
 return {
  provider:'2gis',query:q,places,searchReturned:places.length,
  totalResultsKnown:typeof raw.result.total==='number'?raw.result.total:null,
  completeness:'limited-api-page-not-exhaustive',verifiedMarketDemand:false,
  conclusion:'Список организаций из каталога сам по себе не доказывает уровень конкуренции или спрос. Сравните специализацию, цены, отзывы, радиус и загрузку рынка.'
 };
}