/* Digital Manager | sourced local market research for Business Builder.
 * The user opens current map searches and records specific observed listings.
 * NOT an autonomous map API, exhaustive competitor census or verified demand.
 * Public web sources remain external; only user-entered observations are saved.
 */
(()=>{
'use strict';
const KEY='dm-market-scout-v1',MAX=60;
const clean=(s,max=180)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,max);
const allowedLink=value=>{
 try{
  const u=new URL(String(value||'').trim());
  if(u.protocol!=='https:')return null;
  if(u.hostname==='2gis.ru'||u.hostname==='www.2gis.ru')return u.href.slice(0,800);
  if((u.hostname==='yandex.ru'||u.hostname==='www.yandex.ru')&&u.pathname.startsWith('/maps'))return u.href.slice(0,800);
  if(u.hostname==='maps.yandex.ru')return u.href.slice(0,800);
 }catch(_){}
 return null;
};
function areaKey(plan){
 if(!plan||plan.source!=='owner-entered-local-plan')return null;
 const description=clean(plan.description,300),location=clean(plan.location,180);
 if(!description||!location||plan.unknownIdea)return null;
 return JSON.stringify([description.toLowerCase(),location.toLowerCase()]);
}
const categoryFrom=plan=>{
 const id=window.DMIdeaExplorer?.categoryFor?.(plan.ideaHypothesisId)||
  window.DMBusinessLocation?.caseFor?.(plan.description)?.kind||'generic';
 return ({beauty:'парикмахерские салоны красоты',flowers:'цветочные магазины',food:'кафе пекарни',
  retail:'магазины',services:'услуги',projects:'агентства',generic:'организации'})[id]||'организации';
};
function search(plan){
 const key=areaKey(plan);if(!key)return null;
 const area=clean(plan.location,180),term=categoryFrom(plan),query=term+' '+area;
 const links=[{provider:'Яндекс Карты',label:'Посмотреть организации на Яндекс Картах',
  url:'https://yandex.ru/maps/?text='+encodeURIComponent(query)}];
 if(/краснодар/i.test(area))links.unshift({provider:'2ГИС',label:'Посмотреть организации в 2ГИС',
  url:'https://2gis.ru/krasnodar/search/'+encodeURIComponent(query)});
 return Object.freeze({query,location:area,term,links,source:'live-external-map-search-links',
  checked:false,reason:'Результаты карт открываются в новой вкладке. Управляющий ещё не получил их автоматически.'});
}
function load(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(value))return [];
  return value.slice(0,MAX).filter(x=>x&&typeof x.id==='string'&&x.id.length<65&&
   typeof x.key==='string'&&x.key.length<550&&
   typeof x.name==='string'&&typeof x.note==='string'&&
   Number.isFinite(x.at)&&allowedLink(x.url))
   .map(x=>({id:x.id,key:x.key,name:clean(x.name,100),url:allowedLink(x.url),
    note:clean(x.note,250),at:x.at})).filter(x=>x.name);
 }catch(_){return []}
}
let saved=load();
function summary(plan){
 const key=areaKey(plan),items=key?saved.filter(x=>x.key===key):[];
 const total=items.length;
 return Object.freeze({
  source:'owner-reviewed-public-map-listings',
  hasLocation:Boolean(key),count:total,
  entries:items.slice().reverse().map(x=>Object.freeze({...x})),
  lastCheckedAt:items.length?Math.max(...items.map(x=>x.at)):null,
  verifiedExternally:false,
  conclusion:!key?'Для разведки рынка сначала выберем идею и город, район или улицу.':
   !total?'Я подготовил ссылки на актуальный поиск организаций. Пока ты не добавил ни одной просмотренной карточки, я не буду делать вывод о конкуренции.':
   'Мы сохранили '+total+' '+(total===1?'наблюдение':total<5?'наблюдения':'наблюдений')+
   ' из публичных карт. Это не полный список организаций и не оценка спроса, поэтому называть район свободным или переполненным конкурентами пока рано.'
 });
}
function add(plan,{name,url,note=''}={}){
 const key=areaKey(plan);
 if(!key)return {ok:false,error:'Сначала укажи дело и конкретное место.'};
 if(typeof name!=='string'||!name.trim()||name.length>100)return {ok:false,error:'Укажи название организации (до 100 символов).'};
 const safeUrl=allowedLink(url);
 if(!safeUrl)return {ok:false,error:'Нужна настоящая HTTPS-ссылка на карточку в 2ГИС или Яндекс Картах.'};
 if(typeof note!=='string'||note.length>250)return {ok:false,error:'Примечание слишком длинное (максимум 250 символов).'};
 if(saved.length>=MAX)return {ok:false,error:'Сохранено уже 60 наблюдений. Ничего автоматически не удаляю.'};
 if(saved.some(x=>x.key===key&&(x.url===safeUrl||x.name.toLowerCase()===clean(name,100).toLowerCase())))
  return {ok:false,error:'Похоже, эта организация уже есть в списке.'};
 const next={id:'market-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  key,name:clean(name,100),url:safeUrl,note:clean(note,250),at:Date.now()};
 const all=[...saved,next];
 try{localStorage.setItem(KEY,JSON.stringify(all));saved=all}
 catch(_){return {ok:false,error:'Не удалось сохранить наблюдение. Старые записи остались на месте.'}}
 try{window.dispatchEvent(new CustomEvent('dm:market-scout-changed'))}catch(_){}
 return {ok:true,summary:summary(plan)};
}
function remove(plan,id){
 const key=areaKey(plan);
 if(!key||!saved.some(x=>x.key===key&&x.id===id))return {ok:false,error:'Такой записи нет в этом районе.'};
 const rest=saved.filter(x=>!(x.key===key&&x.id===id));
 try{localStorage.setItem(KEY,JSON.stringify(rest));saved=rest}
 catch(_){return {ok:false,error:'Не удалось удалить запись. Она сохранена.'}}
 try{window.dispatchEvent(new CustomEvent('dm:market-scout-changed'))}catch(_){}
 return {ok:true};
}
function report(){
 const plan=window.DMBusinessJourney?.getPlan?.(),result=summary(plan);
 return result.hasLocation?result.conclusion+
  (result.count?' Примеры по твоим записям: '+result.entries.slice(0,3).map(x=>x.name).join('; ')+'.':'')+
  ' Проверить актуальность каждой карточки можно по сохранённой ссылке.':'Чтобы исследовать конкурентов, сначала уточним место и идею.';
}
window.addEventListener?.('storage',e=>{
 if(e.key===KEY){saved=load();try{window.dispatchEvent(new CustomEvent('dm:market-scout-changed'))}catch(_){}}
});
window.DMMarketScout=Object.freeze({search,summary,add,remove,report});
})();