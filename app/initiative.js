/* Digital Manager | Owner-approved initiative. Works with LOCAL, user-entered sales only.
   No AI API, messaging, banking, external actions, background workers or imaginary revenue. */
(()=>{
'use strict';
const STORE='dm-initiative-v1';
const MAX_ITEMS=80;
const labels={new:'Ждёт первого ответа',talk:'Обсуждаем',offer:'Получил предложение'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timestamp=()=>new Date().toLocaleString('ru-RU');
const initial=()=>({enabled:false,items:[],events:[]});
function read(){
 try{
  const x=JSON.parse(localStorage.getItem(STORE)||'null');
  if(!x||typeof x!=='object')return initial();
  return {enabled:x.enabled===true,
   items:Array.isArray(x.items)?x.items.filter(t=>t&&typeof t.id==='string'&&typeof t.draft==='string').slice(0,MAX_ITEMS):[],
   events:Array.isArray(x.events)?x.events.filter(e=>e&&typeof e.text==='string').slice(0,80):[]};
 }catch(_){return initial()}
}
let state=read(),root,view='board',selectedId=null,feedback='',restoreFocus=null;
let lastScan=0;
function log(next,message){
 const e={at:timestamp(),atMs:Date.now(),text:message};
 next.events=[e,...next.events].slice(0,80);
}
function commit(next){
 try{localStorage.setItem(STORE,JSON.stringify(next));state=next;return true}
 catch(e){console.warn('Initiative records cannot be saved',e);return false}
}
function sources(){
 const x=window.DMSalesScreen?.getWorkCandidates?.();
 return Array.isArray(x)?x.filter(t=>t&&typeof t.id==='string'&&labels[t.stage]).slice(0,MAX_ITEMS):[];
}
function messageFor(x){
 const name=String(x.person||'').trim()||'клиент';
 const subject=String(x.title||'').trim()||'ваше обращение';
 if(x.stage==='offer')return 'Здравствуйте, '+name+'! Возвращаюсь к предложению по «'+subject+'». Подскажите, остались ли вопросы или детали, которые стоит уточнить?';
 if(x.stage==='talk')return 'Здравствуйте, '+name+'! Мы обсуждали «'+subject+'». Подскажите, что для вас сейчас важнее всего: сроки, стоимость или условия? Я уточню детали.';
 return 'Здравствуйте, '+name+'! Спасибо за обращение по поводу «'+subject+'». Подскажите, пожалуйста, вопрос ещё актуален? Давайте уточним детали и подберём следующий шаг.';
}
function currentItems(){
 const active=new Map(sources().map(x=>[x.id,x]));
 return state.items.filter(t=>active.has(t.saleId)).map(t=>({...t,sale:active.get(t.saleId),stale:t.stage!==active.get(t.saleId).stage}))
  .sort((a,b)=>a.reviewedAt===null&&b.reviewedAt!==null?-1:a.reviewedAt!==null&&b.reviewedAt===null?1:b.preparedAt-a.preparedAt);
}
function summary(){
 const visible=currentItems();
 return {enabled:state.enabled,prepared:visible.length,awaitingReview:visible.filter(x=>!x.reviewedAt).length,
  reviewed:visible.filter(x=>x.reviewedAt).length,stored:state.items.length,lastScan};
}
function scan(){
 if(!state.enabled)return summary();
 const candidates=sources(),byId=new Map(state.items.map(x=>[x.saleId,x]));
 const updated=state.items.slice(),newOnes=[];
 let changed=false;
 for(const x of candidates){
  const previous=byId.get(x.id);
  if(previous){
   // New sales stage? Refresh only untouched drafts; user's own corrections are sacred.
   if(previous.stage!==x.stage&&!previous.edited){
    const copy={...previous,stage:x.stage,draft:messageFor(x),reviewedAt:null,preparedAt:Date.now(),source:'local-rule'};
    const pos=updated.indexOf(previous);
    if(pos>=0)updated[pos]=copy;
    changed=true;
   }
   continue;
  }
  if(updated.length>=MAX_ITEMS)break;
  const item={id:'local-work:'+x.id,saleId:x.id,stage:x.stage,draft:messageFor(x),
   edited:false,reviewedAt:null,preparedAt:Date.now(),source:'local-rule'};
  updated.unshift(item);newOnes.push(item);changed=true;
 }
 if(changed){
  const next={...state,items:updated.slice(0,MAX_ITEMS)};
  if(newOnes.length)log(next,'Подготовлено '+newOnes.length+' черновиков по обращениям из «Продаж». Ничего не отправлено.');
  else log(next,'Обновлены черновики после изменения этапа обращения. Ничего не отправлено.');
  if(!commit(next))feedback='Не удалось сохранить подготовленные ответы. Проверьте память устройства.';
  else if(newOnes.length)try{
   window.dispatchEvent(new CustomEvent('dm:initiative-prepared',{detail:{count:newOnes.length}}));
  }catch(_){}
 }
 lastScan=Date.now();updateEntrances();
 if(root&&!root.hidden&&view==='board')render();
 return summary();
}
function enable(){
 const next={...state,enabled:true};
 log(next,'Вы разрешили автоматически готовить локальные черновики по вашим записям. Внешних действий нет.');
 if(!commit(next)){feedback='Не удалось включить режим: настройки не сохранились.';view='consent';render();return false}
 view='board';feedback='Теперь я сам подготавливаю ответы по новым обращениям на этом устройстве.';
 scan();render();return true;
}
function pause(){
 const next={...state,enabled:false};
 log(next,'Подготовка новых черновиков остановлена вами. Сохранённые тексты остались.');
 if(!commit(next)){feedback='Не удалось сохранить паузу. Попробуйте ещё раз.';render();return false}
 feedback='Поставил на паузу. Сохранённые черновики остались на месте.';
 view='board';updateEntrances();render();return true;
}
function headline(){
 const s=summary();
 if(!s.enabled)return 'Готов взять подготовку на себя';
 if(s.prepared===0)return 'Сейчас нет новых обращений для разбора';
 if(s.awaitingReview>0)return 'Подготовил '+s.awaitingReview+' '+(s.awaitingReview===1?'ответ':'ответов')+'. Покажу результат.';
 return 'Черновики просмотрены. Жду новых обращений.';
}
function entries(){
 const count=summary();
 const sub=count.enabled?count.awaitingReview+' ждут просмотра · '+count.reviewed+' просмотрено':
  'Включается только после вашего согласия';
 const label=count.enabled?'Я разбираю обращения':'Можно доверить мне подготовку';
 for(const [id] of [['dmInitPlasma'],['dmInitManagement'],['dmInitAssistant']]){
  const el=document.getElementById(id);
  if(el){const name=el.querySelector('[data-initiative-head]'),hint=el.querySelector('[data-initiative-hint]');
   if(name)name.textContent=label;if(hint)hint.textContent=sub;
   el.dataset.enabled=String(count.enabled);
  }
 }
}
function updateEntrances(){entries()}
function mountEntrances(){
 const chat=document.getElementById('plasmaChatPanel');
 if(chat&&!document.getElementById('dmInitPlasma')){
  const button=document.createElement('button');button.type='button';button.id='dmInitPlasma';
  button.className='dm-init-trigger dm-init-in-chat';
  button.innerHTML='<span class="dm-init-pulse" aria-hidden="true">✦</span><span class="dm-init-trigger-copy"><strong data-initiative-head>Я разбираю обращения</strong><small data-initiative-hint>Посмотреть ход работы</small></span><span aria-hidden="true">↗</span>';
  chat.insertBefore(button,chat.querySelector('form')||null);
 }
 const manager=document.querySelector('#mgHome .mg-manager');
 if(manager&&!document.getElementById('dmInitManagement')){
  const button=document.createElement('button');button.type='button';button.id='dmInitManagement';
  button.className='dm-init-trigger dm-init-in-management';
  button.innerHTML='<span class="dm-init-pulse" aria-hidden="true">✦</span><span class="dm-init-trigger-copy"><strong data-initiative-head>Я разбираю обращения</strong><small data-initiative-hint>Посмотреть ход работы</small></span><span aria-hidden="true">↗</span>';
  manager.insertAdjacentElement('afterend',button);
 }
 const welcome=document.querySelector('#assistantScreen .assistant-welcome');
 if(welcome&&!document.getElementById('dmInitAssistant')){
  const button=document.createElement('button');button.type='button';button.id='dmInitAssistant';
  button.className='dm-init-trigger dm-init-in-assistant';
  button.innerHTML='<span class="dm-init-pulse" aria-hidden="true">✦</span><span class="dm-init-trigger-copy"><strong data-initiative-head>Я разбираю обращения</strong><small data-initiative-hint>Посмотреть ход работы</small></span><span aria-hidden="true">↗</span>';
  welcome.insertAdjacentElement('afterend',button);
 }
 updateEntrances();
}
function buildPanel(){
 if(root)return root;
 root=document.createElement('section');root.id='dmInitiativeScreen';root.className='dm-init-overlay';
 root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-labelledby','dmInitTitle');
 root.innerHTML='<div class="dm-init-frame"><header class="dm-init-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</small><h2 id="dmInitTitle">Я на связи</h2></div><button type="button" data-init-close aria-label="Закрыть">×</button></header><div class="dm-init-content" id="dmInitBody"></div></div>';
 document.body.append(root);
 root.addEventListener('click',handleClick);
 root.addEventListener('submit',handleSubmit);
 root.addEventListener('click',e=>{if(e.target===root)close()});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 return root;
}
const infoFoot='<p class="dm-init-fine">Сейчас я работаю только с вручную внесёнными записями на этом устройстве и только пока приложение открыто. Настоящие ИИ, отправка сообщений, расходы и постоянная серверная работа ещё не подключены.</p>';
function introMarkup(){
 const data=summary();
 return '<div class="dm-init-intro"><div class="dm-init-emblem" aria-hidden="true"><span>✦</span></div>'+
  '<span class="dm-init-eyebrow">ИНИЦИАТИВА УПРАВЛЯЮЩЕГО</span><h3>'+esc(headline())+'</h3>'+
  '<p>Можешь поручить мне рутину. Я сам замечу новые обращения в «Продажах», составлю черновики ответов и покажу, что получилось. Тебе не нужно каждый раз создавать задание.</p>'+
  '<button class="dm-init-main-button" type="button" data-init-consent>Разрешить подготовку ↗</button>'+
  (data.stored?'<p>Уже сохранено черновиков: '+data.stored+'. Они не удалены.</p>':'')+
  infoFoot+'</div>';
}
function consentMarkup(){
 return '<form id="dmInitConsentForm" class="dm-init-consent">'+
  '<span class="dm-init-eyebrow">ОДНО РАЗРЕШЕНИЕ · ТОЛЬКО ЛОКАЛЬНЫЕ ДЕЙСТВИЯ</span>'+
  '<h3>Я беру подготовку ответов на себя</h3>'+
  '<p>Когда в «Продажах» появится новый клиент, я сам составлю черновик по его записи и сохраню его здесь. Ты сможешь посмотреть, исправить и скопировать текст.</p>'+
  '<label><input type="checkbox" name="approved" required><span>Разрешаю автоматически читать мои записи о продажах и сохранять черновики <strong>на этом устройстве</strong>. Понимаю, что сообщения клиентам не отправляются и деньги не тратятся.</span></label>'+
  '<div class="dm-init-actions"><button type="button" data-init-cancel>Не сейчас</button><button type="submit">Доверяю подготовку ↗</button></div>'+
  infoFoot+'</form>';
}
function statusMarkup(){
 const data=summary(),all=currentItems(),insight=window.DMSalesScreen?.getInsight?.()||null;
 let main='<section class="dm-init-summary"><span class="dm-init-eyebrow">МОЙ ХОД · ПО РЕАЛЬНЫМ ЗАПИСЯМ</span><h3>'+esc(headline())+'</h3>'+
  '<p>'+(all.length?'Я сам подготовил черновики по вашим обращениям. Список ниже — только текущие клиенты.': 'Как появятся обращения в «Продажах», я подготовлю ответы без отдельной команды.')+'</p>'+
  '<div class="dm-init-metrics"><div><strong>'+data.prepared+'</strong><small>Черновиков по клиентам</small></div><div><strong>'+data.awaitingReview+'</strong><small>Нужно посмотреть</small></div><div><strong>'+data.reviewed+'</strong><small>Просмотрено</small></div></div>'+
  '<button class="dm-init-pause" type="button" data-init-pause>Приостановить подготовку</button></section>';
 if(insight&&insight.body)main+='<section class="dm-init-insight"><small>Я заметил</small><p>'+esc(insight.body)+'</p><span>Вывод по вашим записям, не по подключённой рекламе.</span></section>';
 if(all.length){
  main+='<section class="dm-init-work"><h3>Что я подготовил</h3>'+
   all.slice(0,40).map((x,i)=>'<article class="dm-init-work-row"><span class="dm-init-work-index">'+String(i+1).padStart(2,'0')+'</span><div>'+
    '<strong>'+esc(x.sale.person||'Клиент')+'</strong><p>'+esc(x.sale.title||'Обращение')+'</p>'+
    '<small>'+esc(labels[x.sale.stage]||'Обращение')+' · '+(x.stale?'Нужно обновить':x.reviewedAt?'Просмотрено':'Черновик готов')+'</small></div>'+
    '<button type="button" data-init-open="'+esc(x.saleId)+'" aria-label="Посмотреть черновик для '+esc(x.sale.person)+'">↗</button></article>').join('')+'</section>';
  if(all.length>40)main+='<p class="dm-init-fine">Показаны первые 40 обращений из '+all.length+'.</p>';
 }
 main+='<details class="dm-init-history"><summary>Что я действительно сделал · история</summary>'+
 (state.events.length?'<ol>'+state.events.slice(0,35).map(e=>'<li><small>'+esc(e.at)+'</small>'+esc(e.text)+'</li>').join('')+'</ol>':'<p>Пока нет записанных действий.</p>')+'</details>'+
 infoFoot;
 return main;
}
function editorMarkup(){
 const work=state.items.find(t=>t.saleId===selectedId);
 const candidate=sources().find(x=>x.id===selectedId);
 if(!work)return '<p class="dm-init-fine">Черновик не найден.</p><button type="button" data-init-back>К обзору</button>';
 const stale=candidate&&candidate.stage!==work.stage;
 return '<section class="dm-init-editor"><button type="button" data-init-back class="dm-init-back">← К моим делам</button>'+
  '<span class="dm-init-eyebrow">ПОДГОТОВЛЕНО ЛОКАЛЬНО · НЕ ОТПРАВЛЕНО</span><h3>'+esc(candidate?.person||'Клиент')+'</h3>'+
  '<p>'+esc(candidate?.title||'Сохранённый черновик')+'</p>'+
  (stale?'<p class="dm-init-warning">Этап клиента изменился. Этот черновик мог устареть. Проверьте его прежде чем использовать.</p>':'')+
  '<label for="dmInitDraft">Я подготовил текст. Можешь поправить:</label>'+
  '<textarea id="dmInitDraft" maxlength="2500" rows="8">'+esc(work.draft)+'</textarea>'+
  '<div class="dm-init-editor-actions"><button type="button" data-init-save>Сохранить правки</button>'+
  '<button type="button" data-init-copy>Скопировать ↗</button>'+
  '<button type="button" data-init-review>'+(work.reviewedAt?'Просмотрено ✓':'Я посмотрел ✓')+'</button>'+
  '<button type="button" data-init-client>К клиенту ↗</button></div>'+
  '<p id="dmInitEditorStatus" class="dm-init-editor-status" role="status">Ничего не отправлено. Отметка «Просмотрено» не означает, что клиенту ответили.</p>'+
  '</section>'+infoFoot;
}
function render(){
 if(!root||root.hidden)return;
 const title=root.querySelector('#dmInitTitle'),body=root.querySelector('#dmInitBody');
 if(title)title.textContent=view==='editor'?'Готовый ответ':state.enabled?'Мои дела в работе':'Я на связи';
 if(body)body.innerHTML=(view==='consent'?consentMarkup():view==='editor'?editorMarkup():state.enabled?statusMarkup():introMarkup())+
  (feedback?'<p class="dm-init-feedback" role="status">'+esc(feedback)+'</p>':'');
 const closeButton=root.querySelector('[data-init-close]');
 if(view==='editor')root.querySelector('#dmInitDraft')?.focus({preventScroll:true});
 else closeButton?.focus({preventScroll:true});
}
function open(){
 buildPanel();
 restoreFocus=document.activeElement;
 view=state.enabled?'board':'intro';selectedId=null;feedback='';
 root.hidden=false;scan();render();
 root.querySelector('.dm-init-frame')?.scrollTo({top:0,behavior:'instant'});
}
function close(){
 if(!root||root.hidden)return;
 root.hidden=true;selectedId=null;feedback='';
 if(restoreFocus?.isConnected&&typeof restoreFocus.focus==='function')restoreFocus.focus({preventScroll:true});
 restoreFocus=null;
}
function updateDraft(action){
 const item=state.items.find(x=>x.saleId===selectedId);
 if(!item)return;
 const field=root?.querySelector('#dmInitDraft'),status=root?.querySelector('#dmInitEditorStatus');
 const draft=field?.value||'';
 const note=value=>{if(status)status.textContent=value};
 if(action==='save'||action==='review'){
  if(!draft.trim()||draft.length>2500){note('Проверьте текст: от 1 до 2500 знаков.');return}
  if(action==='review'&&draft!==item.draft){note('Сначала сохраните правки. Затем отметьте просмотр.');return}
  if(action==='review'&&item.reviewedAt){note('Этот черновик уже просмотрен.');return}
  if(action==='save'&&item.draft===draft){note('Черновик уже сохранён.');return}
  const stamp=Date.now();
  const next={...state,items:state.items.map(t=>t.id===item.id?{...t,
   draft:action==='save'?draft:t.draft,edited:action==='save'?true:t.edited,
   reviewedAt:action==='review'?stamp:null}:t)};
  log(next,action==='save'?'Вы сохранили правки к ответу для '+(sources().find(x=>x.id===selectedId)?.person||'клиента')+'. Ничего не отправлено.':
    'Вы посмотрели подготовленный ответ. Это не отправка клиенту.');
  if(!commit(next)){note('Не удалось сохранить. Текст остался в поле; попробуйте ещё раз.');return}
  const reviewButton=root?.querySelector('[data-init-review]');
  if(reviewButton)reviewButton.textContent=action==='save'?'Я посмотрел ✓':'Просмотрено ✓';
  note(action==='save'?'Правки сохранены на этом устройстве. Ничего не отправлено.':'Отметил просмотр. Сообщение ещё не отправлено.');
  updateEntrances();
 }
}
async function copyCurrent(){
 const text=root?.querySelector('#dmInitDraft')?.value;
 if(!text)return;
 const status=root?.querySelector('#dmInitEditorStatus');
 try{
  if(!navigator.clipboard?.writeText)throw Error('no clipboard');
  await navigator.clipboard.writeText(text);
  if(status)status.textContent='Скопировано! Отправки клиенту не было.';
 }catch(_){
  root?.querySelector('#dmInitDraft')?.select();
  if(status)status.textContent='Текст выделен — скопируйте вручную. Ничего не отправлено.';
 }
}
function handleClick(event){
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-init-close')){close();return}
 if(button.hasAttribute('data-init-consent')){view='consent';feedback='';render();return}
 if(button.hasAttribute('data-init-cancel')){view='intro';feedback='';render();return}
 if(button.hasAttribute('data-init-pause')){pause();return}
 if(button.hasAttribute('data-init-back')){view='board';selectedId=null;feedback='';render();return}
 if(button.dataset.initOpen){selectedId=button.dataset.initOpen;view='editor';feedback='';render();return}
 if(button.hasAttribute('data-init-save')){updateDraft('save');return}
 if(button.hasAttribute('data-init-review')){updateDraft('review');return}
 if(button.hasAttribute('data-init-copy')){copyCurrent();return}
 if(button.hasAttribute('data-init-client')){
  const id=selectedId;close();
  if(id)window.DMSalesScreen?.openClient?.(id);
 }
}
function handleSubmit(event){
 if(event.target.id!=='dmInitConsentForm')return;
 event.preventDefault();
 const values=new FormData(event.target);
 if(values.get('approved')!=='on'){feedback='Для включения требуется явное согласие.';render();return}
 enable();
}
function init(){
 mountEntrances();buildPanel();root.hidden=true;
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('#dmInitPlasma,#dmInitManagement,#dmInitAssistant');
  if(trigger){event.preventDefault();open()}
 });
 window.addEventListener('dm:sales-changed',scan);
 window.addEventListener('pageshow',scan);
 window.addEventListener('storage',e=>{
  if(e.key===STORE){state=read();updateEntrances();if(root&&!root.hidden&&view!=='editor')render()}
  else if(e.key==='dm-sales-records-v1')scan();
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)scan()});
 scan();updateEntrances();
 window.DMInitiative=Object.freeze({open,scan,getSummary:summary});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();