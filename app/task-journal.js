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
const announceJournalChange=()=>queueMicrotask(()=>{
 try{window.dispatchEvent(new CustomEvent('dm:journal-changed'))}catch(_){}
});
const save=(key,data)=>{try{
 localStorage.setItem(key,JSON.stringify(data.slice(0,100)));
 announceJournalChange();return true
 }catch(e){console.warn('Task storage unavailable',e);return false}};
const findAdvice=()=>delegated.find(x=>x.id===ADVICE_ID);
let lastFocus=null,contactCheck=null,contactFeedback='',transferDraft=null;

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
 const head=card.querySelector('.advice-head'),body=card.querySelector('.advice-body');
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
 // The Director Office owns the single gold signature CTA and its readiness.
 // Journal status may update its own content, never its color or button label.
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

/* Owner-approved handoff is a queue, NOT an external action or blanket permission. */
function transferable(){return personal.filter(t=>t.status!=='done'&&t.status!=='delegated')}
function startTransfer(ids){
 const distinct=[...new Set(ids)].filter(id=>transferable().some(t=>t.id===id));
 if(!distinct.length){contactFeedback='Пока нечего передавать.';transferDraft=null;show('mine');return}
 transferDraft={ids:distinct};
 contactCheck=null;contactFeedback='';
 show('mine');
}
function transferPreview(){
 if(!transferDraft)return '';
 const tasks=transferDraft.ids.map(id=>transferable().find(t=>t.id===id)).filter(Boolean);
 if(!tasks.length)return '<p class="dm-journal-empty">Дела уже перенесены или выполнены. Обновите список.</p>';
 return '<form id="dmTransferForm" class="dm-journal-handoff" aria-label="Передать дела управляющему">'+
  '<small>ПЕРЕДАЧА ТОЛЬКО С ВАШЕГО СОГЛАСИЯ</small><h3>Что мне поручить?</h3>'+
  '<p>Отметьте дела, которые хотите передать. Пока я только сохраню их в «Поручениях» и подготовлю очередь для дальнейшей работы. Я не буду звонить, отправлять сообщения, менять рекламу или тратить деньги.</p>'+
  '<fieldset><legend>Выберите дела</legend>'+
  tasks.map(t=>'<label><input type="checkbox" name="taskId" value="'+esc(t.id)+'" checked><span>'+esc(t.title)+'<small> · '+({today:'сегодня',tomorrow:'завтра',later:'позже'}[taskDay(t)]||'позже')+'</small></span></label>').join('')+
  '</fieldset><label class="dm-handoff-consent"><input type="checkbox" name="consent" id="dmTransferApprove" required>'+
  '<span>Согласен передать выбранные дела управляющему в очередь. Понимаю, что внешние действия ещё не выполняются.</span></label>'+
  '<div class="dm-handoff-buttons"><button type="button" data-transfer-cancel>Отмена</button><button type="submit">Передать выбранные ↗</button></div></form>';
}
function persistHandoff(nextPersonal,nextDelegated){
 // Commit both local stores only after successful writes, otherwise restore the originals.
 if(nextPersonal.length>100||nextDelegated.length>100)return false;
 let oldPersonal,oldDelegated;
 try{
  oldPersonal=localStorage.getItem(PERSONAL_KEY);
  oldDelegated=localStorage.getItem(DELEGATED_KEY);
  localStorage.setItem(PERSONAL_KEY,JSON.stringify(nextPersonal));
  localStorage.setItem(DELEGATED_KEY,JSON.stringify(nextDelegated));
  personal=nextPersonal;delegated=nextDelegated;
  announceJournalChange();return true;
 }catch(e){
  try{if(oldPersonal===null)localStorage.removeItem(PERSONAL_KEY);else if(oldPersonal!==undefined)localStorage.setItem(PERSONAL_KEY,oldPersonal)}catch(_){}
  try{if(oldDelegated===null)localStorage.removeItem(DELEGATED_KEY);else if(oldDelegated!==undefined)localStorage.setItem(DELEGATED_KEY,oldDelegated)}catch(_){}
  console.warn('Unable to transfer tasks',e);
  return false;
 }
}
function transferSelected(ids){
 const selected=[...new Set(ids)].map(id=>transferable().find(t=>t.id===id)).filter(Boolean);
 if(!transferDraft||!selected.length)return false;
 if(selected.some(t=>!transferDraft.ids.includes(t.id)))return false;
 const stamp=Date.now(),dated=now();
 const nextPersonal=personal.map(t=>selected.some(x=>x.id===t.id)?{...t,status:'delegated',assignedAt:stamp}:t);
 const nextDelegated=[...selected.map(t=>({
  id:'owner-task:'+t.id+':'+stamp+'-'+Math.random().toString(36).slice(2,7),origin:'owner-task',personalId:t.id,
  title:t.title,status:'queued',created:dated,createdMs:stamp,
  log:[{at:dated,ms:stamp,message:'Вы передали дело управляющему после подтверждения. Внешних действий не выполнялось.'}]
 })),...delegated];
 if(!persistHandoff(nextPersonal,nextDelegated)){
  contactFeedback='Не удалось сохранить передачу. Ваши дела остаются у вас.';
  transferDraft=null;show('mine');return false;
 }
 transferDraft=null;
 contactFeedback='';
 selected.filter(t=>t.source==='sales').forEach(t=>{
  try{window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId:t.saleId}}))}catch(_){}
 });
 show('delegated');return true;
}
function reclaimTransfer(id){
 const item=delegated.find(t=>t.id===id&&t.origin==='owner-task'&&t.status==='queued');
 if(!item)return false;
 const task=personal.find(t=>t.id===item.personalId&&t.status==='delegated');
 if(!task)return false;
 const stamp=Date.now(),dated=now();
 const nextPersonal=personal.map(t=>t.id===task.id?{...t,status:'open',reclaimedAt:stamp}:t);
 const nextDelegated=delegated.map(t=>t.id===item.id?{...t,status:'returned',returnedAt:stamp,
  log:[...(Array.isArray(t.log)?t.log:[]),{at:dated,ms:stamp,message:'Вы забрали дело обратно в «Мои дела». Никаких внешних действий не было.'}]}:t);
 if(!persistHandoff(nextPersonal,nextDelegated)){
  contactFeedback='Не удалось вернуть дело. Оно по-прежнему в поручениях.';
  show('delegated');return false;
 }
 if(task.source==='sales')try{window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId:task.saleId}}))}catch(_){}
 contactFeedback='Дело снова у вас.';
 transferDraft=null;show('mine');return true;
}

/* Preparing a draft is local, not an AI model call. Nothing is sent or executed. */
function draftSuggestion(item){
 const task=personal.find(t=>t.id===item.personalId);
 const facts=task?.source==='sales'&&task.saleId?window.DMSalesScreen?.getDraftContext?.(task.saleId):null;
 if(facts){
  const person=String(facts.person||'клиент').trim(),subject=String(facts.title||'вашего обращения').trim();
  let body;
  if(facts.stage==='won'){
   body='Здравствуйте, '+person+'! Спасибо за обращение по поводу «'+subject+'». Подскажите, пожалуйста, всё ли в порядке и нужна ли дополнительная помощь?';
  }else if(facts.stage==='lost'){
   body='Здравствуйте, '+person+'! Возвращаюсь к вашему обращению по поводу «'+subject+'». Если вопрос ещё актуален, буду рад уточнить детали. Если нет — всё в порядке.';
  }else if(facts.stage==='offer'){
   body='Здравствуйте, '+person+'! Возвращаюсь к нашему предложению по «'+subject+'». Подскажите, остались ли вопросы и какие детали нам ещё стоит обсудить?';
  }else{
   body='Здравствуйте, '+person+'! Вы обращались по поводу «'+subject+'». Подскажите, вопрос ещё актуален? Могу уточнить детали и предложить следующий шаг.';
  }
  return {kind:'message',text:body,description:'Шаблон по записи клиента в «Продажах». Проверьте текст и факты перед использованием.'};
 }
 const title=String(task?.title||item.title||'поручение').trim();
 return {kind:'plan',text:'Дело: '+title+'\n\n1. Уточнить, какой результат нужен и что уже известно.\n2. Проверить необходимые сведения, сроки и ограничения.\n3. Подготовить конкретное решение и показать владельцу.\n4. Выполнить только то, на что владелец отдельно даст разрешение.',
  description:'Заготовка плана по названию дела. Детали не проверены; можно исправить вручную.'};
}
let assistantFeedback='';
function draftNotice(id,message){
 const root=document.getElementById('dmTaskJournal');
 const status=[...(root?.querySelectorAll('[data-assistant-copy-status]')||[])].find(el=>el.dataset.assistantCopyStatus===id);
 if(status)status.textContent=message;
 else assistantFeedback=message;
}
function draftUpdate(id,makeChange){
 const item=delegated.find(t=>t.id===id&&t.origin==='owner-task'&&t.status==='queued');
 if(!item)return false;
 const modified=makeChange(item);
 if(!modified)return false;
 const newer=delegated.map(t=>t.id===id?modified:t);
 if(!save(DELEGATED_KEY,newer)){
  draftNotice(id,'Не удалось сохранить черновик. Ваши правки остались в поле, попробуйте снова.');
  return false;
 }
 delegated=newer;
 show('delegated',id);return true;
}
function prepareSolution(id,refresh=false){
 const item=delegated.find(t=>t.id===id&&t.origin==='owner-task'&&t.status==='queued');
 if(!item)return false;
 if(item.draft&&!refresh)return false;
 if(refresh&&item.draft&&!window.confirm('Заменить текущий черновик новым? Ваши правки будут потеряны.'))return false;
 const prepared=draftSuggestion(item),stamp=Date.now(),dated=now();
 const updated=draftUpdate(id,t=>({...t,draft:{kind:prepared.kind,text:prepared.text.slice(0,3000),
  description:prepared.description,preparedAt:stamp,reviewedAt:null,source:'local-template'},
  log:[...(Array.isArray(t.log)?t.log:[]),{at:dated,ms:stamp,message:refresh?'Черновик подготовлен заново по доступным записям.':'Подготовлен редактируемый черновик по доступным записям. Ничего вовне не отправлено.'}]}));
 if(updated)assistantFeedback='';
 return updated;
}
function editedDraftText(id){
 const root=document.getElementById('dmTaskJournal');
 const fields=root?.querySelectorAll('[data-assistant-editor]')||[];
 const field=[...fields].find(x=>x.dataset.assistantEditor===id);
 return field&&typeof field.value==='string'?field.value:null;
}
function saveSolution(id){
 const text=editedDraftText(id);
 if(text===null||!text.trim()||text.length>3000){
  draftNotice(id,'Проверьте текст: он не должен быть пустым или длиннее 3000 знаков.');
  return false;
 }
 const item=delegated.find(t=>t.id===id&&t.origin==='owner-task'&&t.status==='queued'&&t.draft);
 if(!item)return false;
 if(text===item.draft.text){draftNotice(id,'Этот черновик уже сохранён.');return true}
 const stamp=Date.now(),dated=now();
 const success=draftUpdate(id,t=>({...t,draft:{...t.draft,text,reviewedAt:null,updatedAt:stamp},
  log:[...(Array.isArray(t.log)?t.log:[]),{at:dated,ms:stamp,message:'Вы изменили и сохранили черновик. Ничего не отправлено.'}]}));
 if(success)draftNotice(id,'Правки сохранены на этом устройстве. Ничего не отправлено.');
 return success;
}
function reviewSolution(id){
 const item=delegated.find(t=>t.id===id&&t.origin==='owner-task'&&t.status==='queued'&&t.draft);
 if(!item)return false;
 const text=editedDraftText(id);
 if(text!==item.draft.text){
  draftNotice(id,'Сначала сохраните изменения, а затем отмечайте просмотр.');
  return false;
 }
 if(item.draft.reviewedAt){draftNotice(id,'Черновик уже просмотрен.');return true}
 const stamp=Date.now(),dated=now();
 const success=draftUpdate(id,t=>({...t,draft:{...t.draft,reviewedAt:stamp},
  log:[...(Array.isArray(t.log)?t.log:[]),{at:dated,ms:stamp,message:'Вы посмотрели черновик. Это не подтверждение отправки или выполнения дела.'}]}));
 if(success)draftNotice(id,'Черновик просмотрен. Ничего клиенту не отправлено.');
 return success;
}
async function copySolution(id){
 const text=editedDraftText(id);if(!text)return;
 const root=document.getElementById('dmTaskJournal');
 const info=root?.querySelector('[data-assistant-copy-status]');
 const status=[...(root?.querySelectorAll('[data-assistant-copy-status]')||[])].find(x=>x.dataset.assistantCopyStatus===id)||info;
 try{
  if(!navigator.clipboard?.writeText)throw Error('no clipboard');
  await navigator.clipboard.writeText(text);
  if(status)status.textContent='Текст скопирован. Отправка не выполнялась.';
 }catch(_){
  const fields=[...(root?.querySelectorAll('[data-assistant-editor]')||[])];
  const field=fields.find(x=>x.dataset.assistantEditor===id);
  field?.select();
  if(status)status.textContent='Текст выделен — скопируйте его вручную. Ничего не отправлено.';
 }
}
function personalList(){
 const active=personal.filter(t=>t.status!=='done'&&t.status!=='delegated');
 const groups=[['today','Сегодня'],['tomorrow','Завтра'],['later','Позже']];
 return '<div class="dm-journal-transfer-launch"><div><strong>Доверь мне дела</strong><small>Выбираете сами. Пока только передача поручений, без внешних действий.</small></div><button type="button" data-transfer-all'+(active.length?'':' disabled')+'>Доверить выбранные ↗</button></div>'+
 '<form id="dmPersonalTaskForm" class="dm-journal-add"><label for="dmTaskTitle">Новое дело</label>'+
 '<input id="dmTaskTitle" name="title" maxlength="120" required placeholder="Например, позвонить поставщику">'+
 '<div class="dm-journal-add-row"><select name="when" aria-label="Когда выполнить"><option value="today">Сегодня</option><option value="tomorrow">Завтра</option><option value="later">Позже</option></select><button type="submit">Добавить</button></div></form>'+
 groups.map(([key,label])=>{
  const tasks=active.filter(t=>taskDay(t)===key);
  return '<section class="dm-journal-group"><h3>'+label+(key==='today'?' <small>и просроченные</small>':'')+'</h3>'+
    (tasks.length?tasks.map(t=>'<article class="dm-journal-personal"><span>'+esc(t.title)+(t.dueDate&&t.dueDate<dayString(Date.now())?' <small>· Давно ждёт</small>':'')+'</span><div class="dm-journal-personal-actions"><select data-personal-when="'+esc(t.id)+'" aria-label="Перенести дело: '+esc(t.title)+'">'+[['today','Сегодня'],['tomorrow','Завтра'],['later','Позже']].map(([value,label])=>'<option value="'+value+'"'+(taskDay(t)===value?' selected':'')+'>'+label+'</option>').join('')+'</select>'+(t.source==='sales'&&t.saleId?'<button type="button" data-journal-sale="'+esc(t.saleId)+'" aria-label="Открыть клиента из продаж">К клиенту ↗</button>':'')+'<button type="button" data-transfer-one="'+esc(t.id)+'" title="Доверить управляющему" aria-label="Поручить управляющему: '+esc(t.title)+'">↗</button><button type="button" data-personal-done="'+esc(t.id)+'" aria-label="Отметить выполненным: '+esc(t.title)+'">✓</button></div></article>').join(''):'<p class="dm-journal-empty">Пока пусто</p>')+
   '</section>';
 }).join('')+
 '<p class="dm-journal-hint">Дела сохраняются на этом устройстве. Завтрашние дела появятся в «Сегодня» в нужный день. Уведомлений на телефон пока нет. Поручения управляющему — отдельно.</p>';
}

function assistantDraftControls(item){
 if(item.origin!=='owner-task'||item.status!=='queued')return '';
 const draft=item.draft&&typeof item.draft.text==='string'?item.draft:null;
 if(!draft)return '<button type="button" data-assistant-prepare="'+esc(item.id)+'">Подготовить решение ✨</button>';
 const reviewed=Number.isFinite(draft.reviewedAt)&&draft.reviewedAt>0;
 const kind=draft.kind==='message'?'Черновик ответа клиенту':'Черновик плана';
 return '<div class="dm-assistant-result">'+
  '<small>ЛОКАЛЬНЫЙ ШАБЛОН · ПОКА БЕЗ ИИ · НЕ ОТПРАВЛЕНО</small><h4>'+kind+'</h4>'+
  '<p>'+esc(draft.description||'Шаблон, который можно исправить перед использованием.')+'</p>'+
  '<textarea data-assistant-editor="'+esc(item.id)+'" maxlength="3000" rows="7" aria-label="'+kind+'">'+esc(draft.text)+'</textarea>'+
  '<div class="dm-assistant-draft-actions">'+
  '<button type="button" data-assistant-save="'+esc(item.id)+'">Сохранить правки</button>'+
  '<button type="button" data-assistant-copy="'+esc(item.id)+'">Скопировать ↗</button>'+
  '<button type="button" data-assistant-reviewed="'+esc(item.id)+'">'+(reviewed?'Просмотрено ✓':'Я посмотрел ✓')+'</button>'+
  '<button type="button" data-assistant-refresh="'+esc(item.id)+'">Подготовить заново</button></div>'+
  '<p class="dm-assistant-draft-status" role="status" data-assistant-copy-status="'+esc(item.id)+'">'+
  (reviewed?'Вы просмотрели текст. Он не отправлен.':'Ничего не отправлено. Перед использованием проверьте имена, суммы и подробности.')+
  '</p></div>';
}
function delegatedList(){
 const pending=delegated.filter(t=>t.status!=='reviewed'&&t.status!=='returned');
 if(!pending.length)return '<p class="dm-journal-empty">Активных поручений управляющему пока нет.</p>';
 return pending.map(t=>'<article class="dm-journal-entry"><span>'+(t.origin==='owner-task'?'ПЕРЕДАНО ВАМИ · ОЖИДАЕТ':'ПЛАН · ДЕМО · НЕ ВЫПОЛНЕНО')+'</span><h3>'+esc(t.title)+'</h3>'+
 '<p>'+(t.origin==='owner-task'?'Могу подготовить черновик для вашего просмотра. Никаких звонков, сообщений, покупок и других внешних действий здесь не происходит.':'План подготовлен к проверке. Рекламные данные и реальные интеграции не подключены.')+'</p>'+
 '<ul>'+(Array.isArray(t.log)?t.log:[]).map(l=>'<li><small>'+esc(l.at)+'</small> '+esc(l.message)+'</li>').join('')+'</ul>'+
 assistantDraftControls(t)+
 (t.origin==='owner-task'&&t.status==='queued'?'<button type="button" data-transfer-reclaim="'+esc(t.id)+'">Забрать себе ↩</button>':t.status==='planned'?'<button type="button" data-delegation-review="'+esc(t.id)+'">Я посмотрел план · в историю</button>':'')+'</article>').join('');
}
function historyList(){
 const entries=[];
 personal.filter(t=>t.status==='done').forEach(t=>entries.push({stamp:t.completedMs||0,kind:'mine',title:t.title,info:'Вы отметили дело выполненным',date:t.completed||''}));
 personal.forEach(t=>(Array.isArray(t.moveLog)?t.moveLog:[]).forEach(m=>{
  const label={today:'на сегодня',tomorrow:'на завтра',later:'на потом'}[m.to]||'';
  entries.push({stamp:m.ms||t.createdMs||0,kind:'mine',title:t.title,info:'Вы перенесли дело '+label,date:m.at||''});
 }));
 delegated.forEach(t=>{
  (Array.isArray(t.log)?t.log:[]).forEach((l,i)=>entries.push({stamp:(l.ms||((t.reviewedMs&&i>0?t.reviewedMs:t.createdMs)||0)),kind:'delegated',title:t.title,info:l.message,date:l.at}));
 });
 entries.sort((a,b)=>b.stamp-a.stamp);
 return entries.length?entries.map(t=>'<article class="dm-journal-entry"><span>'+(t.kind==='mine'?'МОЁ ДЕЛО':'ПОРУЧЕНИЕ')+'</span><h3>'+esc(t.title)+'</h3><p>'+esc(t.info)+'</p><small class="dm-journal-timestamp">'+esc(t.date)+'</small></article>').join(''):
 '<p class="dm-journal-empty">История пока пуста. Здесь будут фактические события, а не обещания выполнения.</p>';
}
function show(tab='mine',focusDraftId=null){
 const selected=tab==='tasks'?'delegated':(['mine','delegated','history'].includes(tab)?tab:'mine');
 if(selected!=='mine'){contactCheck=null;transferDraft=null}
 const root=makePanel(),body=root.querySelector('#dmJournalContent');
 if(root.hidden)lastFocus=document.activeElement;
 root.hidden=false;root.dataset.tab=selected;
 const names={mine:'Мои дела',delegated:'Поручения управляющему',history:'История действий'};
 root.querySelector('#dmJournalTitle').textContent=names[selected];
 root.querySelectorAll('[data-journal-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journalTab===selected)));
 body.innerHTML=selected==='mine'?personalList():selected==='delegated'?delegatedList():historyList();
 if(selected==='delegated'&&assistantFeedback)body.insertAdjacentHTML('afterbegin','<p class="dm-journal-contact-feedback" role="status">'+esc(assistantFeedback)+'</p>');
 if(selected==='mine'&&transferDraft){
  body.insertAdjacentHTML('afterbegin',transferPreview());
 }
 if(selected==='mine'&&contactCheck){
  body.insertAdjacentHTML('afterbegin','<section class="dm-journal-contact" aria-label="Результат общения с клиентом"><small>ДЕЛО ОТМЕЧЕНО ВЫПОЛНЕННЫМ</small><p>'+esc(contactCheck.title)+'</p><strong>Удалось связаться с клиентом?</strong><div><button type="button" data-contact-reached="yes">Да, общаемся</button><button type="button" data-contact-reached="no">Нет, только закрыл дело</button></div></section>');
 }else if(selected==='mine'&&contactFeedback){
  body.insertAdjacentHTML('afterbegin','<p class="dm-journal-contact-feedback" role="status">'+esc(contactFeedback)+'</p>');
 }
 root.querySelector('.dm-journal-frame').scrollTop=0;
 root.querySelector('[data-journal-tab="'+selected+'"]').focus({preventScroll:true});
 if(selected==='delegated'&&focusDraftId){
  const editor=[...(root.querySelectorAll('[data-assistant-editor]')||[])].find(x=>x.dataset.assistantEditor===focusDraftId);
  editor?.scrollIntoView?.({block:'nearest',behavior:'instant'});
  editor?.focus?.({preventScroll:true});
 }
 if(transferDraft&&selected==='mine')root.querySelector('#dmTransferApprove')?.focus({preventScroll:true});
 else if(contactCheck&&selected==='mine')root.querySelector('[data-contact-reached="yes"]')?.focus({preventScroll:true});
}
function close(){
 const root=document.getElementById('dmTaskJournal');if(!root||root.hidden)return;
 root.hidden=true;contactCheck=null;transferDraft=null;contactFeedback='';if(lastFocus&&lastFocus.isConnected&&typeof lastFocus.focus==='function')lastFocus.focus({preventScroll:true});
 lastFocus=null;
}
function submitPersonal(form){
 const data=new FormData(form);
 const title=String(data.get('title')||'').trim().slice(0,120);
 const when=String(data.get('when')||'today');
 if(!title||!['today','tomorrow','later'].includes(when))return;
 const entry={id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title,when,dueDate:dueDate(when),status:'open',created:now(),createdMs:Date.now()};
 personal.unshift(entry);
 if(!save(PERSONAL_KEY,personal)){
  personal.shift();
  contactFeedback='Не удалось сохранить дело. Проверьте память устройства.';
 }else{
  contactFeedback='Новое дело записано.';
  window.dispatchEvent(new CustomEvent('dm:local-glyph',{detail:{kind:'task'}}));
 }
 show('mine');
}
function movePersonal(id,when){
 if(!['today','tomorrow','later'].includes(when))return false;
 const task=personal.find(t=>t.id===id&&t.status!=='done'&&t.status!=='delegated');
 if(!task)return false;
 const oldWhen=task.when,oldDate=task.dueDate,previousChanges=task.moveLog;
 const prevDay=taskDay(task);
 if(prevDay===when)return true;
 task.when=when;
 task.dueDate=dueDate(when);
 task.moveLog=(Array.isArray(task.moveLog)?task.moveLog:[]).concat([{
  at:now(),ms:Date.now(),from:prevDay,to:when
 }]).slice(-12);
 if(!save(PERSONAL_KEY,personal)){
  task.when=oldWhen;task.dueDate=oldDate;task.moveLog=previousChanges;
  return false;
 }
 if(task.source==='sales')try{
  window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId:task.saleId}}))
 }catch(_){}
 contactFeedback='Дело перенесено: '+({today:'на сегодня',tomorrow:'на завтра',later:'на потом'}[when])+'.';
 show('mine');
 return true;
}
function completePersonal(id){
 const task=personal.find(t=>t.id===id&&t.status!=='done'&&t.status!=='delegated');if(!task)return;
 task.status='done';task.completed=now();task.completedMs=Date.now();
 if(!save(PERSONAL_KEY,personal)){task.status='open';task.completed=null;task.completedMs=null;return}
 if(task.source==='sales')try{window.dispatchEvent(new CustomEvent('dm:personal-tasks-changed',{detail:{saleId:task.saleId}}))}catch(_){}
 const ask=task.source==='sales'&&['reply','remind'].includes(task.kind)&&window.DMSalesScreen?.getClientStage?.(task.saleId)==='new';
 contactCheck=ask?{saleId:task.saleId,title:task.title}:null;
 contactFeedback=ask?'':'Дело отмечено выполненным.';
 show('mine');
}
function answerContact(reached){
 const task=contactCheck;if(!task)return;
 contactCheck=null;
 if(reached){
  const result=window.DMSalesScreen?.confirmContact?.(task.saleId);
  contactFeedback=result?.ok?'Отметил в «Продажах»: теперь вы обсуждаете заказ.':
   result?.reason==='unchanged'?'У клиента уже другой этап в «Продажах». Ничего не менял.':
   'Не удалось обновить обращение. Дело всё равно сохранено в истории.';
 }else{
  contactFeedback='Дело закрыто. Клиента в «Продажах» не менял.';
 }
 show('mine');
}
/* Read-only work facts for the manager's universal workflow layer.
   A queued delegation is NOT a completed action. Do not expose demo plans. */
function getWorkSnapshot(){
 const nowMs=Date.now(),today=dayString(nowMs);
 const taskRows=personal.filter(t=>t.status==='open'||t.status==='delegated').slice(0,100)
  .map(t=>{
   const due=t.when==='later'?null:(typeof t.dueDate==='string'?t.dueDate:dueDate(t.when,Number(t.createdMs)||nowMs));
   return {id:String(t.id).slice(0,100),title:String(t.title||'Дело').slice(0,120),
    owner:t.status==='delegated'?'assistant-queue':'person',
    status:t.status,dueDate:due,overdue:Boolean(due&&due<today),
    today:Boolean(due&&due<=today),
    source:t.source==='sales'?'sales':'manual-task',createdAt:Number(t.createdMs)||0};
  });
 const queued=delegated.filter(t=>t.origin==='owner-task'&&t.status==='queued').slice(0,100).map(t=>({
  id:String(t.id).slice(0,120),title:String(t.title||'Поручение').slice(0,120),
  personalId:String(t.personalId||'').slice(0,100),
  draftReady:Boolean(t.draft&&typeof t.draft.text==='string'),
  reviewed:Boolean(t.draft?.reviewedAt),
  createdAt:Number(t.createdMs)||0
 }));
 return {source:'user-entered-local-work',recordedTasks:personal.length,
  owned:taskRows.filter(t=>t.status==='open').length,
  delegated:taskRows.filter(t=>t.status==='delegated').length,
  overdue:taskRows.filter(t=>t.overdue&&t.status==='open').length,
  dueToday:taskRows.filter(t=>t.today&&t.status==='open').length,
  queued:queued.length,prepared:queued.filter(t=>t.draftReady).length,
  reviewed:queued.filter(t=>t.reviewed).length,
  tasks:taskRows,queue:queued,asOf:nowMs};
}
/* A genuine owner task created from a deliberate button press in Sales. */
function forSale(saleId){
 return personal.filter(t=>t.source==='sales'&&t.saleId===saleId&&t.status!=='done')
  .map(t=>({id:t.id,title:t.title,when:taskDay(t),kind:t.kind,dueDate:t.dueDate||null,assigned:t.status==='delegated'}));
}
function createForSale({saleId,person,subject,when='today',kind='reply'}={}){
 if(typeof saleId!=='string'||!saleId.trim()||typeof person!=='string'||!person.trim()
    ||!['today','tomorrow'].includes(when)||!['reply','remind'].includes(kind))return {ok:false};
 const existing=personal.find(t=>t.source==='sales'&&t.saleId===saleId&&t.kind===kind&&t.status!=='done');
 if(existing){show(existing.status==='delegated'?'delegated':'mine');return {ok:true,created:false,taskId:existing.id,assigned:existing.status==='delegated'}}
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
 // The task journal belongs to the working day, not the Management settings.
 // Keep its existing records, delegation workflow and recommendation entry point.
 const journalRoute=new URLSearchParams(location.search).get('journal');
 if(['mine','delegated','history'].includes(journalRoute)){
  // Remove the one-shot deep link so refresh does not reopen the overlay.
  const clean=new URL(location.href);clean.searchParams.delete('journal');
  history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
  requestAnimationFrame(()=>show(journalRoute));
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.journalOpen){show(b.dataset.journalOpen)}
  else if(b.hasAttribute('data-journal-close'))close();
  else if(b.dataset.journalTab)show(b.dataset.journalTab);
  else if(b.hasAttribute('data-delegation-review'))reviewDelegation(b.dataset.delegationReview);
  else if(b.dataset.contactReached==='yes'||b.dataset.contactReached==='no')answerContact(b.dataset.contactReached==='yes');
  else if(b.dataset.assistantPrepare)prepareSolution(b.dataset.assistantPrepare);
  else if(b.dataset.assistantRefresh)prepareSolution(b.dataset.assistantRefresh,true);
  else if(b.dataset.assistantSave)saveSolution(b.dataset.assistantSave);
  else if(b.dataset.assistantCopy)copySolution(b.dataset.assistantCopy);
  else if(b.dataset.assistantReviewed)reviewSolution(b.dataset.assistantReviewed);
  else if(b.hasAttribute('data-transfer-all'))startTransfer(transferable().map(t=>t.id));
  else if(b.dataset.transferOne)startTransfer([b.dataset.transferOne]);
  else if(b.hasAttribute('data-transfer-cancel')){transferDraft=null;contactFeedback='Передача отменена. Дела остались у вас.';show('mine')}
  else if(b.dataset.transferReclaim){
   if(window.confirm('Вернуть дело обратно в «Мои дела»?'))reclaimTransfer(b.dataset.transferReclaim);
  }
  else if(b.dataset.journalSale){
   const saleId=b.dataset.journalSale;
   close();
   window.DMSalesScreen?.openClient?.(saleId);
  }else if(b.dataset.personalDone)completePersonal(b.dataset.personalDone);
 });
 document.addEventListener('change',e=>{
  const target=e.target;
  if(target?.dataset?.personalWhen){
   const t=personal.find(x=>x.id===target.dataset.personalWhen&&x.status!=='done');
   if(!t)return;
   if(!movePersonal(t.id,target.value)){
    target.value=taskDay(t);
    contactFeedback='Не удалось сохранить перенос. Попробуйте ещё раз.';
    show('mine');
   }
  }
 });
 document.addEventListener('submit',e=>{
  if(e.target.id==='dmPersonalTaskForm'){e.preventDefault();submitPersonal(e.target)}
  else if(e.target.id==='dmTransferForm'){
   e.preventDefault();
   const data=new FormData(e.target);
   if(data.get('consent')!=='on')return;
   const ids=data.getAll('taskId').map(String);
   if(!ids.length){contactFeedback='Выберите хотя бы одно дело.';transferDraft=null;show('mine');return}
   transferSelected(ids);
  }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.addEventListener('click',e=>{const root=document.getElementById('dmTaskJournal');if(root&&!root.hidden&&e.target===root)close()});
 window.DMTaskJournal=Object.freeze({open:show,createForSale,forSale,getWorkSnapshot});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();