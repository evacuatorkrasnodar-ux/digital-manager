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
const dayString=date=>{
 const d=new Date(date);
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
};
const dueDate=(when,created=Date.now())=>{
 if(when==='later')return null;
 const date=new Date(created);
 if(when==='tomorrow')date.setDate(date.getDate()+1);
 return dayString(date);
};
const taskDay=task=>{
 if(task.when==='later')return 'later';
 const due=task.dueDate||dueDate(task.when,Number(task.createdMs)||Date.now());
 const today=dayString(Date.now());
 const tomorrowDate=new Date();tomorrowDate.setDate(tomorrowDate.getDate()+1);
 return due<=today?'today':due===dayString(tomorrowDate)?'tomorrow':'later';
};
const save=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data.slice(0,100)));return true}catch(e){console.warn('Task storage unavailable',e);return false}};
const findAdvice=()=>delegated.find(x=>x.id===ADVICE_ID);
let lastFocus=null;

/* One approved dashboard card, many messages; no second card and no fake execution. */
const currentInsight=()=>{
 const item=window.DMSalesScreen?.getInsight?.()||null;
 return item&&!delegated.some(t=>t.id==='sales-insight:'+item.id&&t.status==='reviewed')?item:null;
};
const pendingTask=()=>delegated.find(t=>t.status==='planned'&&String(t.id).startsWith('sales-insight:'))||delegated.find(t=>t.status==='planned'&&t.id===ADVICE_ID)||null;
function syncRecommendation(){
 const card=document.querySelector('#homeScreen .recommendation-card');
 if(!card)return;
 const pending=pendingTask(),insight=currentInsight(),old=findAdvice();
 const head=card.querySelector('.advice-head'),body=card.querySelector('.advice-body'),button=document.getElementById('openAdvice');
 const archived=delegated.find(t=>t.status==='reviewed'&&String(t.id).startsWith('sales-insight:'));
 let title,description,action,colour='attention';
 if(pending){
  colour='accepted';title='Поручение принято';
  description='Проверка добавлена в поручения. Внешних действий пока не было.';
  action='Поручения ';
 }else if(insight){
  colour=insight.kind==='opportunity'?'opportunity':'attention';
  title=insight.title;description=insight.body;action='Исполнить ';
 }else if(old?.status==='reviewed'||archived){
  colour='accepted';title='План просмотрен';
  description='План сохранён в истории. Реальных внешних действий не было.';
  action='История ';
 }else{
  title='Есть потенциал для роста в рекламных каналах.';
  description='ДЕМО: проверьте расходы и реальные продажи перед увеличением бюджета.';
  action='Исполнить ';
 }
 card.dataset.taskState=colour;
 if(head)head.textContent=title;
 if(body)body.textContent=description;
 if(button){
  // Change the label, never replace the approved SVG arrow.
  if(!button.firstChild||button.firstChild.nodeType!==3)button.prepend(document.createTextNode(''));
  button.firstChild.textContent=action;
  button.setAttribute('aria-label',action.trim()==='Исполнить'?'Создать поручение на проверку':'Открыть '+action.trim().toLowerCase());
 }
}
function addDelegation(){
 const pending=pendingTask();
 if(pending){show('delegated');return}
 const signal=currentInsight();
 if(signal){
  const id='sales-insight:'+signal.id;
  if(!delegated.some(t=>t.id===id&&t.status==='planned')){
   delegated.unshift({
    id,title:'Проверить: '+signal.title,status:'planned',created:now(),createdMs:Date.now(),
    log:[{at:now(),message:'По вашим записям: '+signal.body},{at:now(),message:'Поручение создано. Данные внешних сервисов не проверялись, никаких изменений не выполнялось.'}]
   });
   save(DELEGATED_KEY,delegated);
  }
 }else if(findAdvice()?.status==='reviewed'||delegated.some(t=>t.status==='reviewed'&&String(t.id).startsWith('sales-insight:'))){
  show('history');return;
 }else if(!findAdvice()){
  delegated.unshift({id:ADVICE_ID,title:ADVICE_TITLE,status:'planned',created:now(),createdMs:Date.now(),log:[{at:now(),message:'Создано демонстрационное поручение на проверку. Интеграции не подключены, проверка не выполнялась.'}]});
  save(DELEGATED_KEY,delegated);
 }
 syncRecommendation();show('delegated');
}
function openRecommendationDetail(event){
 const task=pendingTask(),insight=currentInsight(),old=findAdvice();
 if(!task&&!insight&&old?.status!=='reviewed'&&!delegated.some(t=>t.status==='reviewed'&&String(t.id).startsWith('sales-insight:')))return; // retain the original detail modal for demo
 event.preventDefault();event.stopImmediatePropagation();
 if(task){show('delegated');return}
 if(insight){
  if(insight.view==='picture')window.DMSalesScreen?.openPicture?.();
  else window.DMSalesScreen?.open?.();
  return;
 }
 show('history');
}
function reviewDelegation(id){
 const task=delegated.find(t=>t.id===id&&t.status==='planned');
 if(!task)return;
 task.status='reviewed';task.reviewedMs=Date.now();
 if(!Array.isArray(task.log))task.log=[];
 task.log.push({at:now(),message:'Пользователь посмотрел план и перенёс его в историю. Никаких внешних действий не выполнялось.'});
 save(DELEGATED_KEY,delegated);syncRecommendation();show('history');
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
  const tasks=active.filter(t=>taskDay(t)===key);
  return '<section class="dm-journal-group"><h3>'+label+(key==='today'?' <small>и просроченные</small>':'')+'</h3>'+
    (tasks.length?tasks.map(t=>'<article class="dm-journal-personal"><span>'+esc(t.title)+(t.dueDate&&t.dueDate<dayString(Date.now())?' <small>· Давно ждёт</small>':'')+'</span><div class="dm-journal-personal-actions">'+(t.source==='sales'&&t.saleId?'<button type="button" data-journal-sale="'+esc(t.saleId)+'" aria-label="Открыть клиента из продаж">К клиенту ↗</button>':'')+'<button type="button" data-personal-done="'+esc(t.id)+'" aria-label="Отметить выполненным: '+esc(t.title)+'">✓</button></div></article>').join(''):'<p class="dm-journal-empty">Пока пусто</p>')+
   '</section>';
 }).join('')+
 '<p class="dm-journal-hint">Дела сохраняются на этом устройстве. Завтрашние дела появятся в «Сегодня» в нужный день. Уведомлений на телефон пока нет. Поручения управляющему — отдельно.</p>';
}
function delegatedList(){
 const pending=delegated.filter(t=>t.status!=='reviewed');
 if(!pending.length)return '<p class="dm-journal-empty">Активных поручений управляющему пока нет.</p>';
 return pending.map(t=>'<article class="dm-journal-entry"><span>ПЛАН · ДЕМО · НЕ ВЫПОЛНЕНО</span><h3>'+esc(t.title)+'</h3>'+
 '<p>План подготовлен к проверке. Рекламные данные и реальные интеграции не подключены.</p>'+
 '<ul>'+(Array.isArray(t.log)?t.log:[]).map(l=>'<li><small>'+esc(l.at)+'</small> '+esc(l.message)+'</li>').join('')+'</ul>'+
 (t.status==='planned'?'<button type="button" data-delegation-review="'+esc(t.id)+'">Я посмотрел план · в историю</button>':'')+'</article>').join('');
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
 personal.unshift({id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title,when,dueDate:dueDate(when),status:'open',created:now(),createdMs:Date.now()});
 save(PERSONAL_KEY,personal);show('mine');
}
function completePersonal(id){
 const task=personal.find(t=>t.id===id&&t.status!=='done');if(!task)return;
 task.status='done';task.completed=now();task.completedMs=Date.now();
 if(!save(PERSONAL_KEY,personal)){task.status='open';task.completed=null;task.completedMs=null;return}
 if(task.source==='sales')try{window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId:task.saleId}}))}catch(_){}
 show('mine');
}
/* A genuine owner task created from a deliberate button press in Sales. */
function forSale(saleId){
 return personal.filter(t=>t.source==='sales'&&t.saleId===saleId&&t.status!=='done')
  .map(t=>({id:t.id,title:t.title,when:taskDay(t),kind:t.kind,dueDate:t.dueDate||null}));
}
function createForSale({saleId,person,subject,when='today',kind='reply'}={}){
 if(typeof saleId!=='string'||!saleId.trim()||typeof person!=='string'||!person.trim()
    ||!['today','tomorrow'].includes(when)||!['reply','remind'].includes(kind))return {ok:false};
 const existing=personal.find(t=>t.source==='sales'&&t.saleId===saleId&&t.kind===kind&&t.status!=='done');
 if(existing){show('mine');return {ok:true,created:false,taskId:existing.id}}
 const title=(kind==='remind'?'Связаться с ':'Ответить: ')+person.trim()+' — '+String(subject||'обращение').trim();
 const created=Date.now();
 const task={id:'sale-task-'+created+'-'+Math.random().toString(36).slice(2,8),
  title:title.slice(0,120),when,dueDate:dueDate(when,created),
  status:'open',created:now(),createdMs:created,source:'sales',saleId,kind};
 personal.unshift(task);
 if(!save(PERSONAL_KEY,personal)){personal.shift();return {ok:false}}
 try{window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId}}))}catch(_){}
 show('mine');
 return {ok:true,created:true,taskId:task.id};
}
function init(){
 const button=document.getElementById('openAdvice');
 if(button){
  syncRecommendation();
  button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();addDelegation()},true);
 }
 const details=document.querySelector('#homeScreen .recommendation-card .rec-chevron');
 if(details)details.addEventListener('click',openRecommendationDetail,true);
 window.addEventListener('dm:sales-insight-changed',syncRecommendation);
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
  else if(b.hasAttribute('data-delegation-review'))reviewDelegation(b.dataset.delegationReview);
  else if(b.dataset.journalSale){
   const saleId=b.dataset.journalSale;
   close();
   window.DMSalesScreen?.openClient?.(saleId);
  }else if(b.dataset.personalDone)completePersonal(b.dataset.personalDone);
 });
 document.addEventListener('submit',e=>{
  if(e.target.id==='dmPersonalTaskForm'){e.preventDefault();submitPersonal(e.target)}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.addEventListener('click',e=>{const root=document.getElementById('dmTaskJournal');if(root&&!root.hidden&&e.target===root)close()});
 window.DMTaskJournal=Object.freeze({open:show,createForSale,forSale});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();