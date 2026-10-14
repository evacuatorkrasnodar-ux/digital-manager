/* Digital Manager / safe, reversible single-business walkthrough.
   Explicit opt-in; never silently mixes sample leads with user records. */
(()=>{
 'use strict';
 const FLAG='dm-roman-demo-active-v1',BACKUP='dm-roman-demo-backup-v1';
 const PROFILE='digital-manager-black-velvet-v2';
 const SALES='dm-sales-records-v1',PROMO='dm-promotion-expenses-v1';
 const keys=[PROFILE,SALES,PROMO,'dm-initiative-v1','dm-personal-tasks-v1','dm-task-journal-v1'];
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
   localStorage.removeItem(FLAG);localStorage.removeItem(BACKUP);location.reload();
  }catch(_){alert('Не удалось восстановить данные. Резервная копия сохранена.')}
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
  section.append(title,intro,button);hub.append(section);
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
