/* Digital Manager — first acquaintance & Business Builder.
 * First-time journey, not mandatory multi-page paperwork; local user-owned notes.
 * Planning is NOT registration, site publication, social integration or revenue.
 */
(()=>{
'use strict';
const KEY='dm-business-journey-v1',SKIP='dm-business-journey-existing-v1',LIMIT=600;
const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const compact=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,LIMIT);
const steps={
 start:[
  {title:'Найдём направление',note:'Разберём, что нравится, что умеешь, какие есть возможности и какие идеи стоит проверить.'},
  {title:'Проверим идею',note:'Выясним, кому нужен товар или услуга, что уже предлагают другие и как безопасно проверить спрос.'},
  {title:'Разберём оформление',note:'Уточним страну, возраст и обстоятельства. Подберём подходящий законный вариант через официальные сервисы, с нужными согласиями.'},
  {title:'Подготовим основу',note:'Название, предложение для клиента, простой сайт, контакты и необходимые рабочие инструменты — без обещания автоматической публикации.'},
  {title:'Найдём первых клиентов',note:'Подберём подходящие площадки и способы продвижения. Подключение и публикации — только после проверки и разрешения.'},
  {title:'Начнём управлять и расти',note:'Будем разбирать реальные заявки, результат работы, расходы и следующие возможности для роста.'}
 ],
 existing:[
  {title:'Познакомлюсь с твоим делом',note:'Разберём, что продаёшь или какие услуги оказываешь, как устроена работа и чем сейчас помогаешь клиентам.'},
  {title:'Проверим, что уже работает',note:'Сайт, площадки, клиенты, заказы, запись, доставка, сотрудники — только по твоим ответам и разрешённым источникам.'},
  {title:'Найдём узкие места',note:'Проверим сроки, обращения, расходы и потери. Не стану делать выводы там, где ещё нет данных.'},
  {title:'Подключим нужные инструменты',note:'Составим порядок подключения сайта, сообщений, площадок и рабочего учёта. Внешние подключения требуют отдельного согласия.'},
  {title:'Возьму разрешённую рутину',note:'Начнём с безопасных действий и будем постепенно расширять самостоятельность с отчётами и возможностью остановить.'},
  {title:'Будем развиваться вместе',note:'Научимся видеть повторяемые результаты, искать новые возможности и расширять дело по фактам.'}
 ]
};
const titles={start:'Создаю своё дело',existing:'Уже веду бизнес'};
function journeySteps(record=state){
 if(!record)return [];
 const path=steps[record.mode]||[];
 // If an idea is already named, the next honest step is testing it,
 // not pretending that we must look for an idea from scratch.
 const base=record.mode==='start'&&!record.unknownIdea&&record.description?path.slice(1):path;
 if(!record.location)return base;
 return [{title:record.locationFixed?'Найдём преимущество в выбранном месте':'Проверим место и конкуренцию',
  note:record.locationFixed?'Ты выбрал место. Найдём, почему клиенты захотят прийти именно сюда, и проверим риски, прежде чем вкладывать серьёзные деньги.':
   'Изучим реальные соседние компании, отзывы, цены, спрос, доступность, аренду и ограничения. Без проверенных данных не будем делать вид, что рынок уже изучен.'},...base];
}
let state=read(),view='welcome',root=null,lastFocus=null,previousPage='';
function read(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(raw?.version===1&&['start','existing'].includes(raw.mode))
   return {version:1,mode:raw.mode,description:compact(raw.description||''),have:compact(raw.have||''),
    unknownIdea:Boolean(raw.unknownIdea),location:compact(raw.location||'').slice(0,180),locationFixed:Boolean(raw.locationFixed),startedAt:Number(raw.startedAt)||Date.now(),savedAt:Number(raw.savedAt)||Date.now()};
 }catch(_){}
 return null;
}
function draft(){return state?{...state}:{
 version:1,mode:null,description:'',have:'',location:'',locationFixed:false,unknownIdea:false,startedAt:Date.now(),savedAt:Date.now()}}
let working=draft();
function store(next){
 const record={...next,savedAt:Date.now()};
 if(!['start','existing'].includes(record.mode))return false;
 try{localStorage.setItem(KEY,JSON.stringify(record));state=record;working={...record}}
 catch(_){return false}
 try{window.dispatchEvent(new CustomEvent('dm:business-journey-changed',{detail:{mode:record.mode}}))}catch(_){}
 return true;
}
const suggestIdea=mode=>{
 if(mode==='existing')return 'Каким бизнесом занимаешься? Можно рассказать обычными словами, как другу.';
 return 'Что тебе интересно? Может, уже есть идея, а может, пока совсем не знаешь — это тоже нормально.';
};
const havePrompt=mode=>mode==='existing'
 ?'Что у тебя уже есть: сайт, клиенты, помещение, соцсети, техника, команда? А чего пока не хватает?'
 :'Что у тебя уже есть для старта: время, навыки, оборудование, деньги, знакомые? Даже если ничего — так и скажи.';
function locationAdvice(){
 if(!state?.location||!window.DMBusinessLocation)return null;
 return window.DMBusinessLocation.evaluate({description:state.description,location:state.location,fixed:state.locationFixed});
}
function locationMarkup(){
 const advice=locationAdvice();
 if(!advice)return '';
 return '<section class="dm-journey-local">'+
  '<span class="dm-journey-eyebrow">Я ДУМАЮ О ВЫБРАННОМ МЕСТЕ</span>'+
  '<h3>'+escape(advice.headline)+'</h3>'+
  '<p>'+escape(advice.observation)+'</p>'+
  '<div class="dm-journey-local-actions">'+
  (advice.fixed?'<span>✓ Твой выбор зафиксирован</span><button type="button" data-journey-reconsider>Сравнить варианты</button>':
   '<button type="button" data-journey-keep-location>Хочу открываться именно здесь ↗</button>')+
  '</div>'+
  '<details><summary>Что проверю перед открытием</summary><ol>'+
  advice.evidence.map(item=>'<li>'+escape(item)+'</li>').join('')+
  '</ol><small>Пункты проверки, а не результаты исследования. Карты и данные конкурентов пока не подключены.</small></details>'+
  '<details><summary>Как будем привлекать клиентов, если остаёмся здесь</summary><ol>'+
  advice.plan.map(item=>'<li>'+escape(item)+'</li>').join('')+
  '</ol><small>Варианты действий, а не обещание продаж или уже выполненная реклама.</small></details>'+
  '</section>';
}
function preparedMarkup(){
 const result=window.DMFirstResult?.build?.(getPlan());
 if(!result)return '';
 return '<details class="dm-journey-prepared">'+
  '<summary><span>✦ Уже подготовил первые материалы</span><small>'+result.docs.length+' черновика · не опубликованы</small></summary>'+
  '<div class="dm-journey-prepared-body">'+
  '<p>Я взялся за первые заготовки по твоим ответам. Их можно посмотреть и скопировать; перед использованием проверь факты и поправь текст под себя.</p>'+
  result.docs.map(doc=>'<article class="dm-journey-prepared-item">'+
    '<div class="dm-journey-prepared-title"><strong>'+escape(doc.title)+'</strong>'+
    '<button type="button" data-journey-copy="'+escape(doc.id)+'">Скопировать ↗</button></div>'+
    '<textarea readonly rows="5" aria-label="'+escape(doc.title)+'">'+escape(doc.text)+'</textarea>'+
    '</article>').join('')+
  '<p class="dm-journey-small">Это локальные шаблоны, не рыночное исследование и не работа настоящего ИИ. Сообщения не отправлены, сайт не создан, публикаций и расходов не было.</p>'+
  '<p class="dm-journey-copy-status" data-journey-copy-status role="status"></p></div></details>';
}
function markup(){
 if(view==='welcome')return '<section class="dm-journey-chat">'+
  '<div class="dm-journey-halo" aria-hidden="true">✦</div><span class="dm-journey-eyebrow">НАШЕ ПЕРВОЕ ЗНАКОМСТВО</span>'+
  '<h2>Привет! Я твой цифровой управляющий.</h2>'+
  '<p>Не нужно разбираться в сотне кнопок. Будем вместе искать возможности, решать задачи и развивать твоё дело. С чего начнём?</p>'+
  '<div class="dm-journey-options">'+
  '<button type="button" data-journey-mode="start"><strong>Создаю бизнес с нуля</strong><small>Даже если ещё нет идеи</small><span>↗</span></button>'+
  '<button type="button" data-journey-mode="existing"><strong>У меня уже есть бизнес</strong><small>Помоги развивать и управлять</small><span>↗</span></button>'+
  '</div>'+
  '<p class="dm-journey-small">Можно всё изменить позже. Пока мы ничего не оформляем, не публикуем и не оплачиваем.</p></section>';
 if(view==='idea')return '<form id="dmJourneyIdeaForm" class="dm-journey-chat">'+
  '<span class="dm-journey-eyebrow">ЗНАКОМИМСЯ · ШАГ 1</span><h2>'+escape(suggestIdea(working.mode))+'</h2>'+
  '<p>'+(working.mode==='start'?'Мы не обязаны сразу выбирать идею. Я помогу найти направление по твоим интересам и возможностям.':'Пойму, чем занимается компания, а не буду навязывать ей чужой шаблон.')+'</p>'+
  '<textarea id="dmJourneyIdea" name="idea" rows="4" maxlength="600" placeholder="'+(working.mode==='start'?'Например: люблю цветы, но не знаю, как на них заработать':'Например: магазин цветов, букеты на заказ и доставка')+'">'+escape(working.description)+'</textarea>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-back>← Назад</button>'+
  (working.mode==='start'?'<button type="button" data-journey-unknown>Пока не знаю</button>':'')+
  '<button type="submit">Дальше ↗</button></div></form>';
 if(view==='location')return '<form id="dmJourneyLocationForm" class="dm-journey-chat">'+
  '<span class="dm-journey-eyebrow">ЗНАКОМИМСЯ · ШАГ 2</span>'+
  '<h2>'+(working.mode==='start'?'Где хочешь открыть своё дело?':'В каком городе или районе работаешь?')+'</h2>'+
  '<p>Город, район или улица — как тебе удобно. Я не буду оценивать конкурентов наугад. Сначала проверим реальную обстановку и возможности.</p>'+
  '<textarea name="location" rows="3" maxlength="180" placeholder="Например: Краснодар, район Фестивальный">'+escape(working.location||'')+'</textarea>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-back>← Назад</button>'+
  '<button type="button" data-journey-skip-location>Пока не решил</button>'+
  '<button type="submit">Дальше ↗</button></div></form>';
 if(view==='have')return '<form id="dmJourneyHaveForm" class="dm-journey-chat">'+
  '<span class="dm-journey-eyebrow">ЗНАКОМИМСЯ · ПОСЛЕДНИЙ ШАГ</span><h2>'+escape(havePrompt(working.mode))+'</h2>'+
  '<p>Пиши как есть. Можно коротко, без цифр и специальных слов. Это не экзамен и не анкета.</p>'+
  '<textarea id="dmJourneyHave" name="have" rows="4" maxlength="600" placeholder="Например: есть свободное время и телефон, но нет сайта и клиентов">'+escape(working.have)+'</textarea>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-back>← Назад</button><button type="submit">Построим маршрут ↗</button></div></form>';
 const mode=state?.mode||'start',roadmap=journeySteps(state);
 return '<section class="dm-journey-chat dm-journey-roadmap">'+
  '<span class="dm-journey-eyebrow">МЫ В ОДНОЙ КОМАНДЕ</span>'+
  '<h2>'+(mode==='start'?'Создадим твоё дело вместе.':'Помогу развивать твой бизнес.')+'</h2>'+
  '<p>'+(state.description?'Ты рассказал: «'+escape(state.description)+'». ':'')+
   (state.have?'У тебя уже есть: «'+escape(state.have)+'». ':'')+
   'Вот первые ориентиры. Будем идти постепенно, не перекладывая на тебя всю работу.</p>'+
  '<div class="dm-journey-next"><small>НАЧНЁМ С ЭТОГО</small><strong>'+escape(roadmap[0].title)+'</strong>'+
  '<p>'+escape(roadmap[0].note)+'</p><span>План составлен, действие ещё не выполнено.</span></div>'+
  locationMarkup()+
  preparedMarkup()+
  '<details class="dm-journey-steps"><summary>Как пойдём дальше · '+roadmap.length+' этапов</summary>'+
  '<ol>'+roadmap.map(item=>'<li><strong>'+escape(item.title)+'</strong><small>'+escape(item.note)+'</small></li>').join('')+'</ol></details>'+
  '<p class="dm-journey-small">Я пока не подключён к сайтам, госуслугам или площадкам. Здесь сохранён твой маршрут, а не выполненные регистрации или заработанные деньги.</p>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-edit>Изменить ответы</button>'+
  '<button type="button" data-journey-finish>К управляющему ↗</button></div></section>';
}
function mount(){
 if(root)return root;
 root=document.createElement('section');root.id='dmBusinessJourneyScreen';root.className='dm-journey-overlay';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','dmJourneyHeading');
 root.innerHTML='<div class="dm-journey-panel"><header><span>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</span><button type="button" data-journey-close aria-label="Закрыть знакомство">×</button></header><div id="dmJourneyBody"></div></div>';
 document.body.append(root);
 root.addEventListener('click',onClick);
 root.addEventListener('submit',onSubmit);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 root.addEventListener('click',e=>{if(e.target===root)close()});
 return root;
}
function render(){
 if(!root||root.hidden)return;
 const body=root.querySelector('#dmJourneyBody');
 if(body)body.innerHTML=markup();
 const h=body?.querySelector('h2');if(h){h.id='dmJourneyHeading';h.tabIndex=-1;h.focus({preventScroll:true})}
 root.querySelector('.dm-journey-panel')?.scrollTo({top:0,behavior:'instant'});
}
function open(){
 mount();
 lastFocus=document.activeElement;
 working=draft();
 view=state?'roadmap':'welcome';
 root.hidden=false;render();
}
function close(){
 if(!root||root.hidden)return;
 root.hidden=true;
 if(!state){try{localStorage.setItem(SKIP,'1')}catch(_){}}
 if(lastFocus?.isConnected&&typeof lastFocus.focus==='function')lastFocus.focus({preventScroll:true});
 lastFocus=null;
}
function onClick(e){
 const button=e.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-journey-close'))return close();
 if(button.dataset.journeyMode){
  working={...working,mode:button.dataset.journeyMode,description:'',have:'',location:'',locationFixed:false,unknownIdea:false};
  view='idea';return render();
 }
 if(button.hasAttribute('data-journey-back')){view=view==='have'?(working.description?'location':'idea'):view==='location'?'idea':'welcome';return render()}
 if(button.hasAttribute('data-journey-unknown')){working.description='';working.unknownIdea=true;working.location='';working.locationFixed=false;view='have';return render()}
 if(button.hasAttribute('data-journey-skip-location')){working.location='';working.locationFixed=false;view='have';return render()}
 if(button.hasAttribute('data-journey-keep-location')||button.hasAttribute('data-journey-reconsider')){
  if(!state?.location)return;
  const fixed=button.hasAttribute('data-journey-keep-location');
  if(!store({...state,locationFixed:fixed})){
   const panel=root?.querySelector('.dm-journey-local');
   if(panel)panel.insertAdjacentHTML('beforeend','<p role="alert">Не удалось сохранить выбор. Попробуй ещё раз.</p>');
   return;
  }
  return render();
 }
 if(button.hasAttribute('data-journey-copy')){
  const id=button.dataset.journeyCopy;
  const doc=window.DMFirstResult?.build?.(getPlan())?.docs.find(x=>x.id===id);
  const field=button.closest('.dm-journey-prepared-item')?.querySelector('textarea');
  const status=root?.querySelector('[data-journey-copy-status]');
  const say=message=>{if(status)status.textContent=message};
  if(!doc||!field)return;
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   navigator.clipboard.writeText(doc.text).then(()=>say('Текст скопирован. Ничего не опубликовано и не отправлено.')).catch(()=>{
    field.select();say('Текст выделен — скопируй вручную. Ничего не отправлено.');
   });
  }catch(_){field.select();say('Текст выделен — скопируй вручную. Ничего не отправлено.')}
  return;
 }
 if(button.hasAttribute('data-journey-edit')){working=draft();view='idea';return render()}
 if(button.hasAttribute('data-journey-finish'))return close();
}
function onSubmit(e){
 if(e.target.id==='dmJourneyIdeaForm'){
  e.preventDefault();
  working.description=compact(e.target.querySelector('[name="idea"]')?.value);
  working.unknownIdea=working.mode==='start'&&!working.description;
  view=working.description?'location':'have';return render();
 }
 if(e.target.id==='dmJourneyLocationForm'){
  e.preventDefault();
  working.location=compact(e.target.querySelector('[name="location"]')?.value).slice(0,180);
  working.locationFixed=state?.location===working.location&&Boolean(state?.locationFixed);
  view='have';return render();
 }
 if(e.target.id==='dmJourneyHaveForm'){
  e.preventDefault();
  working.have=compact(e.target.querySelector('[name="have"]')?.value);
  if(!store(working)){
   const status=e.target.querySelector('[data-journey-error]')||document.createElement('p');
   status.dataset.journeyError='true';
   status.setAttribute('role','alert');status.textContent='Не удалось сохранить маршрут. Твой текст остался здесь — попробуй ещё раз.';
   e.target.append(status);return;
  }
  // Existing business description becomes context only when owner submitted it.
  if(state.mode==='existing'&&state.description.length>=3){
   window.DMBusinessContext?.saveProfile?.(state.description);
  }
  view='roadmap';return render();
 }
}
function getState(){return state?Object.freeze({...state}):null}
function getPlan(){return state?Object.freeze({mode:state.mode,modeLabel:titles[state.mode],description:state.description,
 have:state.have,unknownIdea:state.unknownIdea,
 location:state.location||'',locationFixed:Boolean(state.locationFixed),
 steps:journeySteps(state).map(x=>({...x,status:'planned'})),source:'owner-entered-local-plan'}):null}
function explain(){
 const p=getPlan();if(!p)return null;
 return p.mode==='start'
  ?'Мы договорились строить дело с нуля. '+(p.description?'Тебе интересно: '+p.description+'. ':'Направление ещё не выбрано. ')+
   'Начинаем с шага «'+p.steps[0].title+'». Это пока план, а не выполненная работа.'
  :'Мы договорились развивать действующий бизнес. '+(p.description?'Ты описал его так: '+p.description+'. ':'')+
   'Первый шаг — «'+p.steps[0].title+'». Это пока план, а не готовый анализ.';
}
function oldUser(){
 if(state)return true;
 try{if(localStorage.getItem(SKIP)==='1')return true}catch(_){return false}
 // Important: default PWA user/name state is created for brand-new visitors.
 // Only real, prior nonempty business data indicates an existing installation.
 for(const key of ['dm-sales-records-v1','dm-personal-tasks-v1','dm-task-journal-v1']){
  try{const v=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(v)&&v.length)return true}catch(_){}
 }
 for(const key of ['dm-business-profile-v1','dm-initiative-v1']){
  try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v?.description||v?.enabled===true||v?.items?.length)return true}catch(_){}
 }
 return false;
}
function init(){
 mount();
 document.addEventListener('click',e=>{
  const trigger=e.target.closest('#mgOpenBusinessJourney,[data-open-business-journey]');
  if(trigger){e.preventDefault();open()}
 });
 window.DMBusinessJourney=Object.freeze({open,close,getState,getPlan,explain,getLocationAdvice:locationAdvice});
 if(!oldUser()&&!new URLSearchParams(location.search).has('jump')){
  // A new visitor meets the assistant, while existing owners are not interrupted.
  setTimeout(()=>{if(!state&&root.hidden)open()},380);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();