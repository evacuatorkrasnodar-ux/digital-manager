/* Digital Manager | Business before business: small, owner-entered demand tests.
 * No automated survey, AI market research, external delivery, verified clients
 * or evidence that a business will be profitable. Data stays on this device. */
(()=>{
'use strict';
const KEY='dm-demand-test-v1',LIMIT=100,MAX_NOTE=250;
const validTypes=new Set(['interested','question','not_interested']);
const validSources=new Set(['conversation','message','survey','other']);
const clean=(x,n)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
const counted=(n,one,few,many)=>{const d=n%10,c=n%100;return n+' '+(c>=11&&c<=14?many:d===1?one:d>=2&&d<=4?few:many)};
function fingerprint(plan){
 if(!plan||plan.source!=='owner-entered-local-plan'||plan.mode!=='start')return null;
 return JSON.stringify([clean(plan.description,600).toLowerCase(),clean(plan.location,180).toLowerCase(),Boolean(plan.unknownIdea)]);
}
function load(){
 try{
  const a=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(a))return [];
  return a.filter(x=>x&&typeof x.id==='string'&&x.id.length<75&&typeof x.fingerprint==='string'&&x.fingerprint.length<1000&&validTypes.has(x.type)&&validSources.has(x.channel)&&Number.isFinite(x.at)).slice(0,LIMIT)
   .map(x=>({id:x.id,fingerprint:x.fingerprint,type:x.type,channel:x.channel,note:clean(x.note,MAX_NOTE),at:x.at}));
 }catch(_){return []}
}
let entries=load();
function current(plan){
 const key=fingerprint(plan);
 return key?entries.filter(x=>x.fingerprint===key):[];
}
const count=(a,type)=>a.filter(x=>x.type===type).length;
function summary(plan){
 const items=current(plan);
 const interested=count(items,'interested'),questions=count(items,'question'),negative=count(items,'not_interested');
 const total=items.length;
 const note=total===0?'Начнём с коротких разговоров с людьми, которым может быть нужна твоя идея. Черновик вопросов я уже подготовил.':
  total<5?'Первые ответы появились, но их ещё очень мало. Послушаем больше людей, особенно тех, кого не знаем лично.':
  interested>negative?'Есть заинтересованные отклики — это обнадёживает. Но они не доказывают размер спроса или будущую прибыль. Проверь, готовы ли люди реально воспользоваться предложением.':
  negative>interested?'Пока сомнений больше, чем интереса. Это повод уточнить предложение, цену и аудиторию до крупных вложений. Не обязательно бросать идею.':
  'Появилась первая обратная связь. Следующий шаг — уточнить причины ответов и проверить реальную готовность людей обращаться.';
 return Object.freeze({source:'owner-reported-local-feedback',total,interested,questions,negative,
  note,hasPlan:Boolean(fingerprint(plan)),feedback:items.slice().reverse().map(x=>Object.freeze({...x}))});
}
function add(plan,{type,channel,note}={}){
 const key=fingerprint(plan);
 if(!key)return {ok:false,error:'Сначала расскажи, какое дело мы проверяем.'};
 if(!validTypes.has(type)||!validSources.has(channel))return {ok:false,error:'Выбери результат разговора и способ получения отклика.'};
 if(typeof note!=='string'||note.length>MAX_NOTE)return {ok:false,error:'Запись слишком длинная — максимум 250 символов.'};
 if(entries.length>=LIMIT)return {ok:false,error:'Память откликов заполнена (100 записей). Ничего автоматически не удаляю.'};
 const next={id:'feedback-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  fingerprint:key,type,channel,note:clean(note,MAX_NOTE),at:Date.now()};
 const update=[...entries,next];
 try{localStorage.setItem(KEY,JSON.stringify(update));entries=update}
 catch(_){return {ok:false,error:'Не удалось сохранить отклик. Проверь память устройства.'}}
 try{window.dispatchEvent(new CustomEvent('dm:demand-test-changed'))}catch(_){}
 return {ok:true,summary:summary(plan)};
}
function remove(plan,id){
 const key=fingerprint(plan);
 if(!key||typeof id!=='string'||!entries.some(x=>x.fingerprint===key&&x.id===id))
  return {ok:false,error:'Такого отклика нет в текущем плане.'};
 const update=entries.filter(x=>!(x.fingerprint===key&&x.id===id));
 try{localStorage.setItem(KEY,JSON.stringify(update));entries=update}
 catch(_){return {ok:false,error:'Не удалось убрать запись. Она осталась на месте.'}}
 try{window.dispatchEvent(new CustomEvent('dm:demand-test-changed'))}catch(_){}
 return {ok:true,summary:summary(plan)};
}
function report(){
 const plan=window.DMBusinessJourney?.getPlan?.(),r=summary(plan);
 if(!r.hasPlan)return null;
 return r.total?'По твоей идее записано '+counted(r.total,'отклик','отклика','откликов')+
  ': интерес — '+r.interested+', вопросы — '+r.questions+', без интереса — '+r.negative+
  '. Это твои собственные записи, а не проверенные сообщения клиентов. '+r.note:
  'Мы пока не записали ни одного отклика на идею. Я подготовил вопросы, чтобы проверить интерес без больших расходов. Реальный опрос ещё не проводился.';
}
window.addEventListener?.('storage',e=>{if(e.key===KEY){entries=load();try{window.dispatchEvent(new CustomEvent('dm:demand-test-changed'))}catch(_){}}});
window.DMDemandTest=Object.freeze({summary,add,remove,report});
})();