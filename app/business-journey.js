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
let state=read(),view='welcome',root=null,lastFocus=null,previousPage='';
function read(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(raw?.version===1&&['start','existing'].includes(raw.mode))
   return {version:1,mode:raw.mode,description:compact(raw.description||''),have:compact(raw.have||''),
    unknownIdea:Boolean(raw.unknownIdea),startedAt:Number(raw.startedAt)||Date.now(),savedAt:Number(raw.savedAt)||Date.now()};
 }catch(_){}
 return null;
}
function draft(){return state?{...state}:{
 version:1,mode:null,description:'',have:'',unknownIdea:false,startedAt:Date.now(),savedAt:Date.now()}}
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
  '<span class="dm-journey-eyebrow">ЗНАКОМИМСЯ · 1 ИЗ 2</span><h2>'+escape(suggestIdea(working.mode))+'</h2>'+
  '<p>'+(working.mode==='start'?'Мы не обязаны сразу выбирать идею. Я помогу найти направление по твоим интересам и возможностям.':'Пойму, чем занимается компания, а не буду навязывать ей чужой шаблон.')+'</p>'+
  '<textarea id="dmJourneyIdea" name="idea" rows="4" maxlength="600" placeholder="'+(working.mode==='start'?'Например: люблю цветы, но не знаю, как на них заработать':'Например: магазин цветов, букеты на заказ и доставка')+'">'+escape(working.description)+'</textarea>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-back>← Назад</button>'+
  (working.mode==='start'?'<button type="button" data-journey-unknown>Пока не знаю</button>':'')+
  '<button type="submit">Дальше ↗</button></div></form>';
 if(view==='have')return '<form id="dmJourneyHaveForm" class="dm-journey-chat">'+
  '<span class="dm-journey-eyebrow">ЗНАКОМИМСЯ · 2 ИЗ 2</span><h2>'+escape(havePrompt(working.mode))+'</h2>'+
  '<p>Пиши как есть. Можно коротко, без цифр и специальных слов. Это не экзамен и не анкета.</p>'+
  '<textarea id="dmJourneyHave" name="have" rows="4" maxlength="600" placeholder="Например: есть свободное время и телефон, но нет сайта и клиентов">'+escape(working.have)+'</textarea>'+
  '<div class="dm-journey-bottom"><button type="button" data-journey-back>← Назад</button><button type="submit">Построим маршрут ↗</button></div></form>';
 const mode=state?.mode||'start',roadmap=steps[mode];
 return '<section class="dm-journey-chat dm-journey-roadmap">'+
  '<span class="dm-journey-eyebrow">МЫ В ОДНОЙ КОМАНДЕ</span>'+
  '<h2>'+(mode==='start'?'Создадим твоё дело вместе.':'Помогу развивать твой бизнес.')+'</h2>'+
  '<p>'+(state.description?'Ты рассказал: «'+escape(state.description)+'». ':'')+
   (state.have?'У тебя уже есть: «'+escape(state.have)+'». ':'')+
   'Вот первые ориентиры. Будем идти постепенно, не перекладывая на тебя всю работу.</p>'+
  '<div class="dm-journey-next"><small>НАЧНЁМ С ЭТОГО</small><strong>'+escape(roadmap[0].title)+'</strong>'+
  '<p>'+escape(roadmap[0].note)+'</p><span>План составлен, действие ещё не выполнено.</span></div>'+
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
  working={...working,mode:button.dataset.journeyMode,description:'',have:'',unknownIdea:false};
  view='idea';return render();
 }
 if(button.hasAttribute('data-journey-back')){view=view==='have'?'idea':'welcome';return render()}
 if(button.hasAttribute('data-journey-unknown')){working.description='';working.unknownIdea=true;view='have';return render()}
 if(button.hasAttribute('data-journey-edit')){working=draft();view='idea';return render()}
 if(button.hasAttribute('data-journey-finish'))return close();
}
function onSubmit(e){
 if(e.target.id==='dmJourneyIdeaForm'){
  e.preventDefault();
  working.description=compact(e.target.querySelector('[name="idea"]')?.value);
  working.unknownIdea=working.mode==='start'&&!working.description;
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
 steps:steps[state.mode].map(x=>({...x,status:'planned'})),source:'owner-entered-local-plan'}):null}
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
 if(localStorage.getItem(SKIP)==='1')return true;
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
 window.DMBusinessJourney=Object.freeze({open,close,getState,getPlan,explain});
 if(!oldUser()&&!new URLSearchParams(location.search).has('jump')){
  // A new visitor meets the assistant, while existing owners are not interrupted.
  setTimeout(()=>{if(!state&&root.hidden)open()},380);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();