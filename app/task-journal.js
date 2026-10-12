/* Digital Manager · owner tasks, delegated plans and truthful action history. */
(()=>{
'use strict';
const DELEGATED_KEY='dm-task-journal-v1'; // retain legacy records
const PERSONAL_KEY='dm-personal-tasks-v1';
const ADVICE_ID='home-advice-ad-campaign';
const ADVICE_TITLE='Проверить эффективность рекламных каналов';
const read=(key)=>{try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.slice(0,100):[]}catch(_){return []}};
let delegated=read(DELEGATED_KEY).filter(x=>x&&typeof x.id==='string'&&typeof x.status==='string');
let personal=read(PERSONAL_KEY).filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const now=()=>new Date().toLocaleString('ru-RU');
const save=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data.slice(0,100)))}catch(e){console.warn('Task storage unavailable',e)}};
const findAdvice=()=>delegated.find(x=>x.id===ADVICE_ID);
let lastFocus=null;

function syncRecommendation(){
 const card=document.querySelector('#homeScreen .recommendation-card');
 if(!card)return;
 const task=findAdvice(),planned=Boolean(task);
 card.dataset.taskState=planned?'accepted':'attention';
 const head=card.querySelector('.advice-head'),body=card.querySelector('.advice-body');
 const button=document.getElementById('openAdvice');
 if(head)head.textContent=task?.status==='reviewed'?'План просмотрен':planned?'Поручение принято':'Есть потенциал для роста в рекламных каналах.';
 if(body)body.textContent=task?.status==='reviewed'?'План сохранён в истории. Реальная проверка и изменения рекламы не выполнялись.':planned?'Проверка рекламных каналов добавлена в план. Внешних действий пока не было.':'Увеличьте бюджет на 20% — прогнозируемый рост выручки до +35% в течение 30 дней.';
 if(button){
  // Keep the approved arrow SVG and button geometry intact.
  if(!button.firstChild||button.firstChild.nodeType!==3)button.prepend(document.createTextNode(''));
  button.firstChild.textContent=task?.status==='reviewed'?'История ':planned?'Поручения ':'Исполнить ';
  button.setAttribute('aria-label',planned?'Посмотреть поручение управляющему':'Создать демонстрационное поручение на проверку');
 }
}
function addDelegation(){
 if(!findAdvice()){
  delegated.unshift({id:ADVICE_ID,title:ADVICE_TITLE,status:'planned',created:now(),createdMs:Date.now(),log:[{at:now(),message:'Создано демонстрационное поручение на проверку. Интеграции не подключены, проверка не выполнялась.'}]});
  save(DELEGATED_KEY,delegated);
 }
 syncRecommendation();show(findAdvice()?.status==='reviewed'?'history':'delegated');
}
function reviewDelegation(){
 const task=findAdvice();
 if(!task||task.status!=='planned')return;
 task.status='reviewed';task.reviewedMs=Date.now();
 if(!Array.isArray(task.log))task.log=[];
 task.log.push({at:now(),message:'План отмечен просмотренным и архивирован. Реальная проверка не выполнялась.'});
 save(DELEGATED_KEY,delegated);show('history');
}
function makePanel(){
 let root=document.getElementById('dmTaskJournal');
 if(root)return root;
 root=document.createElement('section');root.id='dmTaskJournal';root.className='dm-journal-overlay';root.hidden=true;
 root.innerHTML='<div class="dm-journal-frame" role="dialog" aria-modal="true" aria-labelledby="dmJournalTitle" tabindex="-1">'+
 '<header><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</small><h2 id="dmJournalTitle">Мои дела</h2></div><button type="button" data-journal-close aria-label="Закрыть">×</button></header>'+
 '<nav aria-label="Разделы"><button type="button" data-journal-tab="mine">Мои дела</button><button type="button" data-journal-tab="delegated">Поручения</button><button type="button" data-journal-tab="history">История</button></nav>'+
 '<div id="dmJournalContent"></div></div>';
 document.body.append(root);return root;
}
function personalList(){
 const active=personal.filter(t=>t.status!=='done');
 const groups=[['today','Сегодня'],['tomorrow','Завтра'],['later','Позже']];
 return '<form id="dmPersonalTaskForm" class="dm-journal-add"><label for="dmTaskTitle">Новое дело</label>'+
 '<input id="dmTaskTitle" name="title" maxlength="120" required placeholder="Например, позвонить поставщику">'+
 '<div class="dm-journal-add-row"><select name="when" aria-label="Когда выполнить"><option value="today">Сегодня</option><option value="tomorrow">Завтра</option><option value="later">Позже</option></select><button type="submit">Добавить</button></div></form>'+
 groups.map(([key,label])=>{
  const tasks=active.filter(t=>t.when===key);
  return '<section class="dm-journal-group"><h3>'+label+'</h3>'+
    (tasks.length?tasks.map(t=>'<article class="dm-journal-personal"><span>'+esc(t.title)+'</span><button type="button" data-personal-done="'+esc(t.id)+'" aria-label="Отметить выполненным: '+esc(t.title)+'">✓</button></article>').join(''):'<p class="dm-journal-empty">Пока пусто</p>')+
   '</section>';
 }).join('')+
 '<p class="dm-journal-hint">Дела человека сохраняются на этом устройстве. Поручения управляющему находятся отдельно.</p>';
}
function delegatedList(){
 const pending=delegated.filter(t=>t.status!=='reviewed');
 if(!pending.length)return '<p class="dm-journal-empty">Активных поручений управляющему пока нет.</p>';
 return pending.map(t=>'<article class="dm-journal-entry"><span>ПЛАН · ДЕМО · НЕ ВЫПОЛНЕНО</span><h3>'+esc(t.title)+'</h3>'+
 '<p>План подготовлен к проверке. Рекламные данные и реальные интеграции не подключены.</p>'+
 '<ul>'+(Array.isArray(t.log)?t.log:[]).map(l=>'<li><small>'+esc(l.at)+'</small> '+esc(l.message)+'</li>').join('')+'</ul>'+
 (t.id===ADVICE_ID&&t.status==='planned'?'<button type="button" data-delegation-review>Архивировать просмотренный план</button>':'')+'</article>').join('');
}
function historyList(){
 const entries=[];
 personal.filter(t=>t.status==='done').forEach(t=>entries.push({stamp:t.completedMs||0,kind:'mine',title:t.title,info:'Вы отметили дело выполненным',date:t.completed||''}));
 delegated.forEach(t=>{
  (Array.isArray(t.log)?t.log:[]).forEach((l,i)=>entries.push({stamp:(t.reviewedMs&&i>0?t.reviewedMs:t.createdMs)||0,kind:'delegated',title:t.title,info:l.message,date:l.at}));
 });
 entries.sort((a,b)=>b.stamp-a.stamp);
 return entries.length?entries.map(t=>'<article class="dm-journal-entry"><span>'+(t.kind==='mine'?'МОЁ ДЕЛО':'ПОРУЧЕНИЕ · ДЕМО')+'</span><h3>'+esc(t.title)+'</h3><p>'+esc(t.info)+'</p><small class="dm-journal-timestamp">'+esc(t.date)+'</small></article>').join(''):
 '<p class="dm-journal-empty">История пока пуста. Здесь будут фактические события, а не обещания выполнения.</p>';
}
function show(tab='mine'){
 const selected=tab==='tasks'?'delegated':(['mine','delegated','history'].includes(tab)?tab:'mine');
 const root=makePanel(),body=root.querySelector('#dmJournalContent');
 if(root.hidden)lastFocus=document.activeElement;
 root.hidden=false;root.dataset.tab=selected;
 const names={mine:'Мои дела',delegated:'Поручения управляющему',history:'История действий'};
 root.querySelector('#dmJournalTitle').textContent=names[selected];
 root.querySelectorAll('[data-journal-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journalTab===selected)));
 body.innerHTML=selected==='mine'?personalList():selected==='delegated'?delegatedList():historyList();
 root.querySelector('.dm-journal-frame').scrollTop=0;
 root.querySelector('[data-journal-tab="'+selected+'"]').focus({preventScroll:true});
}
function close(){
 const root=document.getElementById('dmTaskJournal');if(!root||root.hidden)return;
 root.hidden=true;if(lastFocus&&lastFocus.isConnected&&typeof lastFocus.focus==='function')lastFocus.focus({preventScroll:true});
 lastFocus=null;
}
function submitPersonal(form){
 const data=new FormData(form);
 const title=String(data.get('title')||'').trim().slice(0,120);
 const when=String(data.get('when')||'today');
 if(!title||!['today','tomorrow','later'].includes(when))return;
 personal.unshift({id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title,when,status:'open',created:now(),createdMs:Date.now()});
 save(PERSONAL_KEY,personal);show('mine');
}
function completePersonal(id){
 const task=personal.find(t=>t.id===id&&t.status!=='done');if(!task)return;
 task.status='done';task.completed=now();task.completedMs=Date.now();
 save(PERSONAL_KEY,personal);show('mine');
}
function init(){
 const button=document.getElementById('openAdvice');
 if(button){
  syncRecommendation();
  button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();addDelegation()},true);
 }
 const management=document.getElementById('mgHome');
 if(management&&!management.querySelector('[data-journal-open]')){
  const anchor=management.querySelector('.mg-main'),box=document.createElement('div');
  box.className='dm-journal-entry-links';
  box.innerHTML='<button type="button" data-journal-open="mine">Мои дела <span>↗</span></button><button type="button" data-journal-open="history">История действий <span>↗</span></button>';
  if(anchor)anchor.before(box);else management.append(box);
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.journalOpen){show(b.dataset.journalOpen)}
  else if(b.hasAttribute('data-journal-close'))close();
  else if(b.dataset.journalTab)show(b.dataset.journalTab);
  else if(b.hasAttribute('data-delegation-review'))reviewDelegation();
  else if(b.dataset.personalDone)completePersonal(b.dataset.personalDone);
 });
 document.addEventListener('submit',e=>{
  if(e.target.id==='dmPersonalTaskForm'){e.preventDefault();submitPersonal(e.target)}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.addEventListener('click',e=>{const root=document.getElementById('dmTaskJournal');if(root&&!root.hidden&&e.target===root)close()});
 window.DMTaskJournal=Object.freeze({open:show});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();