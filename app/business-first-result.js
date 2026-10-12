/* Digital Manager | The first tangible, honest Business Builder result.
 * Local draft generator, NOT AI, market research, a published website, sent
 * message, legal filing, commercial offer or verified external operation. */
(()=>{
'use strict';
const clean=(v,max=180)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
const area=p=>clean(p.location,180)||'твоём городе';
const businessType=(p)=>{
 const kind=window.DMBusinessLocation?.caseFor?.(p.description)?.kind||'generic';
 return kind;
};
const settings={
 beauty:{kind:'beauty',label:'парикмахерскую или салон красоты',
  focus:'удобная запись, понятные цены и услуги, ради которых возвращаются',
  main:'услуги парикмахерской',ask:'Как часто вы пользуетесь услугами парикмахера и чего не хватает поблизости?',
  details:'Что для вас важнее: опыт мастера, стоимость, близость или запись на удобное время?'},
 flowers:{kind:'flowers',label:'цветочный магазин',focus:'свежесть, букеты под событие и удобство получения заказа',
  main:'цветы и букеты',ask:'Как часто вы покупаете букеты рядом с домом или работой?',
  details:'Важнее выбор, свежесть, цена, доставка или возможность быстро собрать букет?'},
 food:{kind:'food',label:'кафе или пекарню',focus:'понятное меню, стабильное качество и удобное время посещения',
  main:'еду и напитки',ask:'Чего вам не хватает среди кафе или пекарен поблизости?',
  details:'Важнее вкус, скорость, время работы, цена или удобство забрать с собой?'},
 retail:{kind:'retail',label:'магазин',focus:'товары, которые действительно нужны соседям, и удобство покупок',
  main:'товары',ask:'За какими товарами вам приходится ездить далеко?',
  details:'Что важнее: ассортимент, стоимость, близость или заказ заранее?'},
 generic:{kind:'generic',label:'своё дело',focus:'конкретная польза клиенту и удобный способ обратиться',
  main:'товары или услуги',ask:'Какую задачу вам сложнее всего решить с местными компаниями?',
  details:'Какие условия помогли бы вам выбрать нового поставщика или специалиста?'}
};
function build(plan){
 if(!plan||plan.source!=='owner-entered-local-plan'||!['start','existing'].includes(plan.mode))return null;
 const description=clean(plan.description,600),place=area(plan),where=clean(plan.location,180),
  kind=businessType(plan),config=settings[kind]||settings.generic,
  start=plan.mode==='start',unknown=!description||plan.unknownIdea,
  local=where?' Место: '+place+'.':'',
  scope=where?'рядом с выбранным местом — '+place:'в выбранном районе';
 let lead,probe,site;
 if(unknown){
  lead='Пока не выбираем помещение и не тратим деньги. Сначала найдём подходящее направление по тому, что тебе нравится и какие есть возможности. '+(plan.have?'Ты рассказал: «'+clean(plan.have,250)+'». ':'')+'Сравним несколько идей и проверим реальный интерес.';
  probe='Я выбираю дело, которым хотел(а) бы заниматься. Какие товары или услуги '+scope+' вам нужны чаще всего, но их неудобно получать? Что вы хотели бы улучшить?';
  site='Будущее дело — сначала проверим идею. Прежде чем запускать сайт, определим, кому мы помогаем и какую проблему решаем.';
 }else if(start){
  lead='Твоя идея: «'+description+'»'+(where?'. Место: '+place:'')+'. Можем выделиться благодаря таким преимуществам, как '+config.focus+'. Это гипотеза: её нужно проверить на людях, а не принимать за доказанный спрос.';
  probe='Здравствуйте! Планирую открыть '+config.label+'.'+local+' Пока изучаю потребности и ничего не продаю. '+config.ask+' '+config.details+' Спасибо за ответ — он поможет сделать предложение полезнее.';
  site='Планируем открытие: '+description+(where?' — '+place:'')+'.\n'+
   'Готовим предложение для клиентов. Важные направления: '+config.focus+'.\n'+
   'Открытие, цены и запись пока не объявлены. Мы сначала проверяем спрос.';
 }else{
  lead='Ты уже ведёшь дело: «'+description+'»'+(where?'. Место: '+place:'')+'. Можно проверить, насколько клиентам понятно предложение, и чем ты отличаешься: '+config.focus+'. Без отзывов и реальных данных это пока предположение.';
  probe='Здравствуйте! Хотим сделать наши '+config.main+' удобнее. '+config.ask+' '+config.details+' Ваш ответ поможет нам улучшиться.';
  site=description+(where?' — '+place:'')+'.\n'+
   'Рассказываем, чем занимаемся, как помогаем клиентам и как связаться. Прежде чем публиковать страницу, уточним фактические услуги, цены, график и контакты.';
 }
 const docs=[
  {id:'position',title:'Наше возможное преимущество',text:lead},
  {id:'probe',title:'Черновик для проверки спроса',text:probe},
  {id:'site',title:'Текст для первой страницы сайта',text:site}
 ];
 return Object.freeze({
  source:'local-owner-story-template',mode:plan.mode,kind,location:where,description,
  status:'prepared-local-drafts-not-verified-or-sent',
  limitation:'Подготовлены только локальные черновики из слов владельца: без ИИ, проверки конкурентов, публикаций или действий на внешних площадках.',
  docs:docs.map(d=>Object.freeze(d))
 });
}
function describe(){
 const p=window.DMBusinessJourney?.getPlan?.();
 const result=build(p);
 return result?'Я подготовил '+result.docs.length+' черновика по твоей идее: возможное отличие, вопрос для проверки спроса и текст для первой страницы. Это локальные заготовки, ничего не опубликовано и никому не отправлено.':'Сначала познакомимся с твоим делом, чтобы я мог подготовить первые материалы по нему.';
}
window.DMFirstResult=Object.freeze({build,describe});
})();