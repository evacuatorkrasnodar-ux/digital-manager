/* Digital Manager | Flexible business DNA, not a fixed industry selector.
   A local description controls helpful advisory areas only. No external data,
   automatic financial action, AI classification or imaginary business metrics. */
(()=>{
'use strict';
const KEY='dm-business-profile-v1';
const MAX=600;
const COMMON=['Клиенты и обращения','Доходы и расходы','Сроки и качество','Возможности роста'];
const special=[
 {id:'flowers',re:/цвет|букет|флорист|растени|питомник/i,areas:['Остатки и свежесть товаров','Сезонность и списания','Заказы и доставка','Повторные клиенты']},
 {id:'retail',re:/магазин|торгов|товар|розниц|витрин|шоурум|покупател|маркетплейс|e-commerce|интернет-магазин/i,areas:['Ассортимент и остатки','Закупки и поставщики','Возвраты и повторные покупки','Продажи по каналам']},
 {id:'services',re:/услуг|сервис|салон|парикмах|клиник|доктор|врач|репетитор|массаж|консультац|ремонт|мастерск|эвакуат|автосервис|уборк|стоматолог/i,areas:['Заявки и запись','Загрузка специалистов и техники','Сроки выполнения','Качество и повторные клиенты']},
 {id:'logistics',re:/достав|курьер|перевоз|транспорт|логист|такси|эвакуат|склад/i,areas:['Маршруты и время отклика','Загрузка транспорта','Расходы на поездки','Срывы сроков']},
 {id:'production',re:/производ|завод|цех|изготов|фабрик|пекарн|пищево|сборк|промышлен|станок/i,areas:['Заказы и план выпуска','Материалы и остатки','Сроки и загрузка производства','Брак и себестоимость']},
 {id:'projects',re:/стройк|строител|подряд|проект|монтаж|дизайн|разработк|агентств|архитект|инженер/i,areas:['Этапы и сроки проектов','Загрузка команды','Договорённости и изменения','Стоимость работ']},
 {id:'subscription',re:/подписк|абонемент|аренд|saas|лицензи|регулярн|членств/i,areas:['Продления и удержание','Регулярные платежи','Использование услуги','Причины отказов']},
 {id:'wholesale',re:/оптов|дистрибуц|поставк|дилер|контракт|юрлиц|b2b/i,areas:['Заказы и договоры','Отгрузки и поставки','Дебиторская задолженность','Повторные заказы']},
 {id:'hospitality',re:/кафе|ресторан|кофейн|отел|гостиниц|хостел|общепит/i,areas:['Поток гостей и загрузка','Запасы и списания','Смены и персонал','Качество обслуживания']},
 {id:'multisite',re:/филиал|сет[ьи] .{0,40}(?:магазин|салон|клиник|кафе|точек|офис|сервис)|несколько точек|холдинг|подразделени|предприяти[йя]|региональн/i,areas:['Результаты подразделений','Ответственные и согласования','Единые стандарты','Риски и отклонения по точкам']}
];
const safe=x=>String(x??'').replace(/\s+/g,' ').trim().slice(0,MAX);
function read(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  return raw&&raw.version===1&&typeof raw.description==='string'
   ?{version:1,description:safe(raw.description),savedAt:Number(raw.savedAt)||null}
   :{version:1,description:'',savedAt:null};
 }catch(_){return {version:1,description:'',savedAt:null}}
}
let current=read();
function derive(text){
 const description=safe(text);
 // Very common negations are not positive evidence of a business capability.
 // This remains a limited local keyword hint, not language understanding.
 const evidence=description.replace(/(?:без|нет|не делаем|не оказываем|не занимаемся)\s+(?:своей\s+|собственной\s+)?достав\w*/gi,'');
 const matches=special.filter(item=>item.re.test(evidence));
 // Mixed businesses retain *all* matching processes rather than one industry.
 const areas=[...new Set([...matches.flatMap(item=>item.areas),...COMMON])].slice(0,16);
 return Object.freeze({description,configured:Boolean(description),
  hints:matches.map(x=>x.id),areas,
  source:'self-described-local',verified:false});
}
function getProfile(){return Object.freeze({...current})}
function getContext(){return derive(current.description)}
function saveProfile(description){
 if(typeof description!=='string'||description.length>MAX||description.trim().length<3)return {ok:false,reason:'description'};
 const next={version:1,description:safe(description),savedAt:Date.now()};
 try{localStorage.setItem(KEY,JSON.stringify(next));current=next}
 catch(_){return {ok:false,reason:'storage'}}
 try{window.dispatchEvent(new CustomEvent('dm:business-context-changed',{detail:{configured:true}}))}catch(_){}
 return {ok:true,profile:getProfile(),context:getContext()};
}
function clearProfile(){
 try{localStorage.removeItem(KEY);current={version:1,description:'',savedAt:null}}
 catch(_){return {ok:false,reason:'storage'}}
 try{window.dispatchEvent(new CustomEvent('dm:business-context-changed',{detail:{configured:false}}))}catch(_){}
 return {ok:true};
}
function describe(){
 const x=getContext();
 if(!x.configured)return 'Пока я знаю только то, что ты занёс в приложение. Расскажи одной фразой, чем занимается твой бизнес — я подберу направления внимания. Это не подключит внешние данные.';
 return 'Ты описал бизнес так: «'+x.description+'». Поэтому мне стоит учитывать не только продажи, но и '+x.areas.slice(0,4).map(s=>s.toLowerCase()).join(', ')+'. Это пока ориентиры по твоему описанию, а не проверенные показатели.';
}
window.addEventListener('storage',e=>{if(e.key===KEY){current=read();try{window.dispatchEvent(new CustomEvent('dm:business-context-changed',{detail:{configured:Boolean(current.description)}}))}catch(_){}}});
window.DMBusinessContext=Object.freeze({getProfile,getContext,saveProfile,clearProfile,describe,derive});
})();