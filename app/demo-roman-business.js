/* Digital Manager / safe, reversible single-business walkthrough.
   Explicit opt-in; never silently mixes sample leads with user records. */
(()=>{
 'use strict';
 const FLAG='dm-roman-demo-active-v1',BACKUP='dm-roman-demo-backup-v1';
 const PROFILE='digital-manager-black-velvet-v2';
 const SALES='dm-sales-records-v1',PROMO='dm-promotion-expenses-v1';
 const keys=[PROFILE,SALES,PROMO,'dm-initiative-v1','dm-personal-tasks-v1','dm-task-journal-v1','dm-roman-projects-v1'];
 const isActive=()=>localStorage.getItem(FLAG)==='1';
 const day=(offset,hour=11)=>{const d=new Date();d.setDate(d.getDate()+offset);d.setHours(hour,20,0,0);return d.getTime()};
 const clients=[
  ['Ирина Ковалёва','Лендинг для студии красоты','new','Сайт',34000,-2],
  ['Максим Волков','Сайт для сервиса кондиционеров','talk','Telegram',56000,-1],
  ['Анна Демидова','Подключение онлайн-записи','offer','VK',24000,-3],
  ['Дмитрий Орлов','Разработка сайта доставки','won','Сайт',68000,-6],
  ['Мария Соколова','Автоматизация записи клиентов','won','Avito',42000,-4],
  ['Олег Миронов','Логотип и фирменный стиль','lost','VK',18000,-8],
  ['Елена Белова','Презентация для частной клиники','new','Сайт',27000,-1],
  ['Павел Жуков','Поддержка корпоративного сайта','talk','Telegram',15000,-1]
 ];
 function seed(){
  const snapshot={};
  for(const key of keys)snapshot[key]=localStorage.getItem(key);
  localStorage.setItem(BACKUP,JSON.stringify(snapshot));
  try{
   const profile=JSON.parse(snapshot[PROFILE]||'{}')||{};
   localStorage.setItem(PROFILE,JSON.stringify({...profile,name:'Роман',company:'Студия «Цифровой бизнес»',industry:'Цифровые услуги',city:'Краснодар'}));
   localStorage.setItem(SALES,JSON.stringify(clients.map((c,i)=>({
    id:'roman-demo-lead-'+(i+1),person:c[0],title:c[1],stage:c[2],source:c[3],
    amount:c[4],createdAt:day(c[5],10+i),wonAt:c[2]==='won'?day(c[5]+1,15):null,
    lostAt:c[2]==='lost'?day(c[5]+2,14):null,
    lossReason:c[2]==='lost'?'Цена не подошла':'Не знаем'
   }))));
   localStorage.setItem(PROMO,JSON.stringify([
    {id:'roman-demo-promo-1',source:'VK',amount:6800,createdAt:day(-5)},
    {id:'roman-demo-promo-2',source:'Сайт',amount:3400,createdAt:day(-3)}
   ]));
   // Enabled assistant can prepare actual locally-generated drafts for these
   // sample clients using the existing initiative mechanism.
   localStorage.setItem('dm-initiative-v1',JSON.stringify({enabled:true,items:[],events:[]}));
   localStorage.setItem('dm-personal-tasks-v1','[]');
   localStorage.setItem('dm-task-journal-v1','[]');
   localStorage.removeItem(PROJECT_KEY);
   localStorage.setItem(FLAG,'1');
   location.reload();
  }catch(error){
   for(const key of keys){const old=snapshot[key];if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old)}
   localStorage.removeItem(BACKUP);localStorage.removeItem(FLAG);
   alert('Не удалось включить пример: '+error.message);
  }
 }
 function restore(){
  let backup;
  try{backup=JSON.parse(localStorage.getItem(BACKUP)||'null')}catch(_){}
  if(!backup){alert('Исходная копия не найдена. Данные не изменены.');return}
  try{
   for(const key of keys){if(backup[key]===null||backup[key]===undefined)localStorage.removeItem(key);else localStorage.setItem(key,backup[key])}
   if(!Object.prototype.hasOwnProperty.call(backup,PROJECT_KEY))localStorage.removeItem(PROJECT_KEY);
   localStorage.removeItem(FLAG);localStorage.removeItem(BACKUP);location.reload();
  }catch(_){alert('Не удалось восстановить данные. Резервная копия сохранена.')}
 }
 const AUTO='dm-roman-autopilot-v1';
 function autopilot(){
  if(!isActive())return [];
  const read=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}};
  const rows=read(SALES);
  const drafts=window.DMInitiative?.getSummary?.()||{};
  // Only actions verifiable from local state; no invented outbound messages.
  const tasks=[
   {id:'drafts',text:'Подготовка персональных ответов',detail:'Готовых черновиков: '+Number(drafts.prepared||0),done:Number(drafts.prepared||0)>0},
   {id:'new',text:'Первым делом — новые обращения',detail:'Ожидают обработки: '+rows.filter(x=>x.stage==='new').length,done:false},
   {id:'talk',text:'Переговоры и предложения',detail:'В работе: '+rows.filter(x=>x.stage==='talk'||x.stage==='offer').length,done:false},
   {id:'finance',text:'Контроль завершённых проектов',detail:'Отмечено завершённых сделок: '+rows.filter(x=>x.stage==='won').length,done:true}
  ];
  let old={events:[],signature:''};try{old=JSON.parse(localStorage.getItem(AUTO)||'null')||old}catch(_){}
  const signature=tasks.map(x=>x.id+':'+x.detail+':'+x.done).join('|');
  if(old.signature!==signature){
   const event={date:new Date().toLocaleString('ru-RU'),text:'Проведена локальная проверка: '+tasks.map(x=>x.detail).join(' · ')};
   try{localStorage.setItem(AUTO,JSON.stringify({signature,events:[event,...(old.events||[])].slice(0,20)}))}catch(_){}
  }
  return tasks;
 }

 const PROJECT_KEY='dm-roman-projects-v1';
 function projectReview(){
  const day=new Date().toISOString().slice(0,10);
  const sales=JSON.parse(localStorage.getItem(SALES)||'[]');
  let state=JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')||{projects:[],events:[]};
  if(!Array.isArray(state.projects)||!Array.isArray(state.events))state={projects:[],events:[]};
  let changed=false;
  for(const sale of sales.filter(x=>x.stage==='won'&&typeof x.id==='string')){
   let p=state.projects.find(x=>x.id===sale.id);
   if(!p){
    p={id:sale.id,name:sale.title,client:sale.person,step:0,date:day};
    state.projects.push(p);
    state.events.unshift('Составлен учебный план: '+p.name);
    changed=true;
   }else if(p.date!==day&&p.step<2){
    p.step++;p.date=day;changed=true;
    state.events.unshift('Пересмотрен внутренний план: '+p.name);
   }
  }
  if(changed)localStorage.setItem(PROJECT_KEY,JSON.stringify({projects:state.projects,events:state.events.slice(0,20)}));
  return state;
 }
 function inject(){
  const hub=document.querySelector('#managementScreen #mgDetail .mg-unified-hub');
  if(!hub||!document.querySelector('#mgOpenBusinessJourney')||hub.querySelector('#dmRomanDemoToggle'))return;
  const section=document.createElement('section');section.className='mg-unified-panel dm-roman-demo-control';
  const active=isActive();
  const title=document.createElement('h2');title.textContent=active?'Роман · учебная компания':'Пример готового бизнеса';
  const intro=document.createElement('p');intro.className='mg-unified-note';
  intro.textContent=active?'Сейчас приложение показывает студию Романа: клиентов, продажи, рекламу и предложения управляющего.':'Один раз включи готовый бизнес Романа — и исследуй работу помощника на связанных примерах. Твои текущие данные сохранятся отдельно.';
  const button=document.createElement('button');button.type='button';button.id='dmRomanDemoToggle';
  button.textContent=active?'Вернуть мои данные':'Пожить в бизнесе Романа';
  button.addEventListener('click',()=>{if(active){if(confirm('Завершить пример Романа и восстановить прежние данные?'))restore()}else if(confirm('Включить учебный бизнес Романа? Текущее состояние приложения будет сохранено для возврата.'))seed()});
  section.append(title,intro,button);
  if(active){
   const auto=document.createElement('div');auto.className='dm-roman-autopilot';
   const autoTitle=document.createElement('h3');autoTitle.textContent='Автопилот · полная свобода в учебной студии';
   const autoNote=document.createElement('p');autoNote.textContent='Сам анализирует записи и готовит черновики. Внешние сообщения и платежи не выполняются.';
   const details=document.createElement('details');
   const summary=document.createElement('summary');summary.textContent='Решения и действия управляющего';
   const body=document.createElement('div');body.className='dm-roman-autopilot-items';
   const refresh=()=>{
    window.DMInitiative?.scan?.();
    const tasks=autopilot();body.replaceChildren();
    for(const t of tasks){
     const p=document.createElement('p');p.textContent=(t.done?'✓ Выполнено: ':'→ Приоритет: ')+t.text+' — '+t.detail;body.append(p);
    }
    const projects=projectReview(),steps=['План составлен','В работе (учебный план)','Внутренняя проверка'];
    const heading=document.createElement('h4');heading.textContent='Проекты студии · внутренние этапы';body.append(heading);
    for(const item of projects.projects){
     const p=document.createElement('p');p.textContent=item.name+' · '+item.client+' — '+steps[item.step];body.append(p);
    }
    const journal=document.createElement('h4');journal.textContent='Журнал решений';body.append(journal);
    for(const event of projects.events.slice(0,5)){const p=document.createElement('p');p.textContent=event;body.append(p)}

   };
   details.addEventListener('toggle',()=>{if(details.open)refresh()});
   details.append(summary,body);auto.append(autoTitle,autoNote,details);section.append(auto);
  }
  hub.append(section);
 }
 function boot(){
  const root=document.querySelector('#managementScreen #mgDetail');
  if(!root)return;
  const observer=new MutationObserver(()=>inject());
  observer.observe(root,{childList:true,subtree:false});
  inject();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.DMRomanDemo=Object.freeze({isActive});
})();
