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
  const confirmed=sales.filter(x=>x.stage==='won'&&typeof x.id==='string');
  const ids=new Set(confirmed.map(x=>x.id));
  const valid=state.projects.filter(x=>ids.has(x.id));
  if(valid.length!==state.projects.length){state.projects=valid;changed=true;}
  for(const sale of confirmed){
   let p=state.projects.find(x=>x.id===sale.id);
   if(!p){
    p={id:sale.id,name:sale.title,client:sale.person,step:0,date:day};
    state.projects.push(p);
    state.events.unshift('Составлен учебный план: '+p.name);
    changed=true;
   }
   // Do not claim execution merely because another day has passed.
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
  hub.append(section);
 }
 function mountAutopilot(){
  if(!isActive())return;
  const container=document.querySelector('#managementScreen #mgDetail .mg-auto-compact');
  if(!container||container.querySelector('#dmRomanAutopilot'))return;
  const section=document.createElement('section');
  section.id='dmRomanAutopilot';section.className='mg-auto-active';
  const title=document.createElement('h2');title.textContent='Роман · учебный автопилот';
  const note=document.createElement('p');
  const details=document.createElement('details');
  const summary=document.createElement('summary');
  summary.textContent='Подробности работы управляющего';
  const list=document.createElement('div');list.style.cssText='font-size:13px;line-height:1.5;margin-top:12px';
  const readObject=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')||{}}catch(_){return {}}};
  const line=(target,value)=>{
   const p=document.createElement('p');p.textContent=value;p.style.cssText='font-size:13px;line-height:1.5;margin:7px 0';target.append(p);
  };
  const heading=value=>{
   const h=document.createElement('h3');h.textContent=value;h.style.cssText='font-size:14px;margin:15px 0 6px';list.append(h);
  };
  function renderLog(){
   if(!isActive())return;
   window.DMInitiative?.scan?.();
   const tasks=autopilot(),projects=projectReview();
   const summaryData=window.DMInitiative?.getSummary?.()||{};
   const leads=tasks.find(t=>t.id==='new');
   const sales=readObject(SALES);
   const initiative=readObject('dm-initiative-v1');
   const pending=Array.isArray(sales)?sales.filter(x=>['new','talk','offer'].includes(x.stage)):[];
   const drafts=Array.isArray(initiative.items)?initiative.items:[];
   const proposals=pending.filter(x=>drafts.some(d=>d.saleId===x.id));
   const rub=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n)||0);
   note.textContent='Подготовлено ответов: '+Number(summaryData.prepared||0)+
    ' · Предложений к обсуждению: '+proposals.length+
    ' · Учебных планов: '+projects.projects.length+
    ' · '+(leads?.detail||'Обращения проверены')+'.';
   if(!details.open)return;
   list.replaceChildren();
   const stages=['План составлен','В работе (учебный план)','Внутренняя проверка'];
   heading('Что подготовлено');
   for(const t of tasks)line(list,(t.done?'✓ ':'→ ')+t.text+' · '+t.detail);
   heading('Предложения клиентам · ожидают решения');
   if(!proposals.length)line(list,'Открытых обращений с подготовленными черновиками пока нет.');
   for(const p of proposals.slice(0,8)){
    const sum=Number(p.amount)>0?' · ориентир '+rub(p.amount):' · стоимость уточняется';
    line(list,p.person+' — '+p.title+sum+' · черновик подготовлен, не отправлен; заказ не подтверждён.');
   }
   heading('План действий на сегодня');
   const fresh=pending.filter(p=>p.stage==='new');
   const negotiating=pending.filter(p=>p.stage==='talk'||p.stage==='offer');
   const leader=fresh[0]||negotiating[0];
   if(leader){
    line(list,'Приоритет №1: '+(leader.stage==='new'?'проверить новое обращение':'продвинуть переговоры')+' — '+leader.person+' · '+leader.title+'.');
    line(list,'Управляющий подготовил внутренние материалы. Следующее действие: проверить ответ и условия. До подтверждения клиента это не продажа.');
   }else line(list,'Срочных открытых обращений в записях не найдено.');
   const expenses=readObject(PROMO);
   const spent=Array.isArray(expenses)?expenses.reduce((sum,e)=>sum+(Number(e.amount)>0?Number(e.amount):0),0):0;
   const completed=Array.isArray(sales)?sales.filter(e=>e.stage==='won'):[];
   const total=completed.reduce((sum,e)=>sum+(Number(e.amount)>0?Number(e.amount):0),0);
   heading('Финансовый контроль');
   line(list,'Отмеченные завершённые заказы: '+rub(total)+' · записанные расходы на продвижение: '+rub(spent)+'.');
   line(list,'Проверка: это не чистая прибыль и не подтверждённые банковские поступления. Для решения о бюджете нужен учёт остальных затрат.');
   heading('Проекты студии');
   if(!projects.projects.length)line(list,'Подтверждённых учебных проектов пока нет.');
   for(const p of projects.projects)line(list,p.name+' — '+stages[Math.min(2,p.step)]+' · '+p.client);
   heading('История решений');
   const local=readObject(AUTO);
   const events=[
    ...projects.events.map((text,i)=>({time:projects.projects[0]?.date||'',text,order:100-i})),
    ...(Array.isArray(local.events)?local.events:[]).map(e=>({time:e.at||e.date||'',text:e.text||'',order:Number(e.atMs)||0})),
    ...(Array.isArray(initiative.events)?initiative.events:[]).map(e=>({time:e.at||'',text:e.text||'',order:Number(e.atMs)||0}))
   ].filter(e=>e.text).sort((a,b)=>b.order-a.order).slice(0,12);
   if(!events.length)line(list,'Пока нет сохранённых действий.');
   for(const event of events)line(list,(event.time?event.time+' · ':'')+event.text);
   line(list,'Внешних отправок и платежей автопилот не выполнял.');
  }
  details.addEventListener('toggle',renderLog);
  details.append(summary,list);section.append(title,note,details);
  container.insertBefore(section,container.firstChild);
  renderLog(); }
 // Demo autopilot works while a page is open. It is not a server worker:
 // every pass is idempotent and uses only local records.
 let scheduled=null,running=false;
 function runAutonomousCheck(){
  if(!isActive()||running)return;
  running=true;
  try{
   window.DMInitiative?.scan?.();
   autopilot();
   projectReview();
  }catch(e){console.warn('Roman demo autopilot check failed',e)}
  finally{running=false}
 }
 function scheduleCheck(){
  if(scheduled!==null)clearTimeout(scheduled);
  scheduled=setTimeout(()=>{scheduled=null;runAutonomousCheck()},500);
 }
 function boot(){
  const root=document.querySelector('#managementScreen #mgDetail');
  if(!root)return;
  const observer=new MutationObserver(()=>{inject();mountAutopilot()});
  observer.observe(root,{childList:true,subtree:false});
  inject();mountAutopilot();
  if(isActive()){
   scheduleCheck();
   window.addEventListener('dm:sales-changed',scheduleCheck);
   window.addEventListener('focus',scheduleCheck);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleCheck()});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.DMRomanDemo=Object.freeze({isActive});
})();
