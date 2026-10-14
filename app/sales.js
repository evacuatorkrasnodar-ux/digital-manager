/* Продажи — простой язык и реальные записи владельца. Без вымышленных связей с банком. */
(()=>{'use strict';
const KEY='dm-sales-records-v1', LEGACY='digital-manager-black-velvet-v2';
const statuses={new:'Написал',talk:'Обсуждаем',offer:'Предложили',won:'Купил',lost:'Не сложилось'};
const channels=['Сайт','VK','Telegram','MAX','OK','Дзен','Avito','Ozon','Wildberries','Яндекс Маркет','Мегамаркет','Другое'];
const reasons=['Не знаем','Цена не подошла','Долго отвечали','Купил в другом месте','Передумал','Другое'];
const PROMOTION_KEY='dm-promotion-expenses-v1';
let promotion=[];
try{
 const saved=JSON.parse(localStorage.getItem(PROMOTION_KEY)||'[]');
 if(Array.isArray(saved))promotion=saved.filter(x=>x&&typeof x.id==='string'&&channels.includes(x.source)&&Number.isFinite(x.amount)&&x.amount>0&&Number.isFinite(x.createdAt)).slice(0,200);
}catch(_){}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const rub=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n)||0);
const today=ts=>Boolean(ts)&&new Date(ts).toDateString()===new Date().toDateString();
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
let records=[];
try{const r=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(r))records=r.filter(x=>x&&typeof x.id==='string'&&statuses[x.stage]&&typeof x.person==='string').slice(0,400)}catch(_){}
let screen, previousFocus, pictureOpen=false;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(records.slice(0,400)));window.dispatchEvent(new CustomEvent('dm:sales-changed',{detail:totals()}));notifyInsight();return true}catch(e){console.warn(e);return false}};
const totalWon=()=>records.filter(x=>x.stage==='won').reduce((n,x)=>n+(Number(x.amount)||0),0);
const totals=()=>({sales:records.filter(x=>x.stage==='won').length,revenue:totalWon(),source:'user-entered-sales'});
const promotionTotal=()=>promotion.reduce((sum,x)=>sum+x.amount,0);
/* Signals derived exclusively from local entries. They are observations, never verified external AI. */
function getInsight(){
 const awaiting=records.filter(x=>x.stage==='new');
 if(awaiting.length>=3)return {id:'waiting-replies-'+awaiting.length,kind:'attention',title:'Люди ждут ответа',body:'По вашим записям '+awaiting.length+' обращения пока без отметки об ответе. Стоит проверить.',view:'sales'};
 const byChannel=channels.map(source=>{
  const leads=records.filter(x=>x.source===source);
  return {source,leads:leads.length,bought:leads.filter(x=>x.stage==='won').length,spend:promotion.filter(x=>x.source===source).reduce((n,x)=>n+x.amount,0)};
 });
 const warning=byChannel.find(x=>x.spend>0&&x.leads>=2&&x.bought===0);
 if(warning)return {id:'spend-'+warning.source+'-'+warning.leads+'-'+warning.spend,kind:'attention',title:'Проверим продвижение?',body:'На '+warning.source+' есть расходы и '+warning.leads+' обращения, но покупок пока не отмечено.',view:'picture'};
 const possible=byChannel.find(x=>x.bought>=2);
 if(possible)return {id:'buyers-'+possible.source+'-'+possible.bought,kind:'opportunity',title:'Есть хорошая зацепка',body:'Из '+possible.source+' уже '+possible.bought+' покупки по вашим записям. Посмотрим, что помогло?',view:'picture'};
 return null;
}
function notifyInsight(){
 try{window.dispatchEvent(new CustomEvent('dm:sales-insight-changed',{detail:getInsight()}))}catch(_){}
}
function savePromotion(){
 try{
  localStorage.setItem(PROMOTION_KEY,JSON.stringify(promotion.slice(0,200)));
  window.dispatchEvent(new CustomEvent('dm:promotion-changed',{detail:{total:promotionTotal(),source:'manual'}}));
  notifyInsight();
  return true;
 }catch(e){console.warn('Promotion data storage unavailable',e);return false}
}
function addPromotion(form){
 const data=new FormData(form),source=String(data.get('source')||'');
 const amount=Number(data.get('amount'));
 if(!channels.includes(source)||!Number.isFinite(amount)||amount<=0||amount>999999999)return;
 promotion.unshift({id:uid(),source,amount,createdAt:Date.now()});
 savePromotion();renderPicture();
}
function removePromotion(id){
 const entry=promotion.find(x=>x.id===id);if(!entry)return;
 if(!window.confirm('Удалить запись расхода «'+entry.source+'» на '+rub(entry.amount)+'?'))return;
 promotion=promotion.filter(x=>x.id!==id);savePromotion();renderPicture();
}
function legacyOrders(){try{let obj=JSON.parse(localStorage.getItem(LEGACY)||'{}');return Array.isArray(obj.orders)?obj.orders.filter(x=>x&&typeof x.title==='string').slice(0,50):[]}catch(_){return []}}
const options=(arr,current)=>arr.map(x=>'<option value="'+esc(x)+'"'+(x===current?' selected':'')+'>'+esc(x)+'</option>').join('');

/* Short, explicit outcome confirmation; an unconfirmed select must never record a purchase. */
function setStage(entry,stage,detail={}){
 if(!entry||!statuses[stage])return false;
 const snapshot={...entry};
 const stamp=Date.now(),previous=entry.stage;
 if(stage==='won'){
  const amount=Number(detail.amount);
  if(!Number.isFinite(amount)||amount<0||amount>999999999)return false;
  entry.amount=amount;
  entry.wonAt=previous==='won'&&Number.isFinite(entry.wonAt)?entry.wonAt:stamp;
  entry.lostAt=null;
 }else if(stage==='lost'){
  if(!reasons.includes(detail.reason))return false;
  entry.lossReason=detail.reason;
  entry.lostAt=previous==='lost'&&Number.isFinite(entry.lostAt)?entry.lostAt:stamp;
  entry.wonAt=null;
 }else{
  entry.wonAt=null;entry.lostAt=null;
 }
 entry.stage=stage;
 entry.changedAt=stamp;
 if(!save()){Object.assign(entry,snapshot);return false}
 if(stage==='won'&&previous!=='won')window.dispatchEvent(new CustomEvent('dm:local-glyph',{detail:{kind:'finance'}}));
 render();
 return true;
}
function outcomeDialog(entry,stage){
 if(!entry||!['won','lost'].includes(stage))return;
 const old=document.getElementById('dmSalesUpdate');
 if(old)old.remove();
 const overlay=document.createElement('div');
 overlay.id='dmSalesUpdate';overlay.className='dm-sales-draft';
 const title=stage==='won'?'Клиент купил':'Почему не сложилось?';
 const amount=Number(entry.amount);
 overlay.innerHTML='<form class="dm-sales-draft-inner dm-sales-outcome" id="dmSalesOutcomeForm" role="dialog" aria-modal="true" aria-labelledby="dmSalesOutcomeTitle">'+
 '<header><strong id="dmSalesOutcomeTitle">'+title+'</strong><button type="button" data-sale-outcome-cancel aria-label="Закрыть">×</button></header>'+
 '<p>'+esc(entry.person)+' · '+esc(entry.title)+'</p>'+
 (stage==='won'?'<label>Сколько заплатил, ₽<small>Если сумма пока неизвестна, оставьте поле пустым</small><input type="number" name="amount" min="0" max="999999999" step="1" placeholder="Сумма покупки" value="'+(amount>0&&Number.isFinite(amount)?amount:'')+'"></label>':
 '<label>Почему не купил?<select name="reason">'+options(reasons,entry.lossReason||'Не знаем')+'</select></label>')+
 '<div class="dm-sales-outcome-actions"><button type="button" data-sale-outcome-cancel>Отмена</button><button type="submit">'+(stage==='won'?'Сохранить покупку':'Сохранить причину')+'</button></div></form>';
 const restore=document.activeElement;
 const dismiss=()=>{overlay.remove();if(restore?.isConnected&&typeof restore.focus==='function')restore.focus({preventScroll:true})};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();dismiss()}};
 document.body.append(overlay);
 overlay.querySelectorAll('[data-sale-outcome-cancel]').forEach(x=>x.addEventListener('click',dismiss));
 overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss()});
 overlay.addEventListener('keydown',onKey);
 overlay.querySelector('form').addEventListener('submit',e=>{
  e.preventDefault();
  const data=new FormData(e.currentTarget);
  const ok=stage==='won'?setStage(entry,'won',{amount:data.get('amount')||0}):setStage(entry,'lost',{reason:String(data.get('reason')||'Не знаем')});
  if(ok)dismiss();
 });
 (overlay.querySelector('input,select')||overlay.querySelector('[type="submit"]')).focus();
}
function reopenSale(id){
 const entry=records.find(x=>x.id===id);
 if(!entry||!['won','lost'].includes(entry.stage))return;
 if(!window.confirm('Вернуть запись о '+entry.person+' в обсуждение? Её перестанут считать состоявшейся покупкой или отказом.'))return;
 setStage(entry,'talk');
}
function goToNewSale(){
 const form=screen?.querySelector('#dmSalesForm');
 if(!form)return;
 form.scrollIntoView({behavior:'smooth',block:'start'});
 form.querySelector('[name="person"]')?.focus({preventScroll:true});
}
function create(){
 if(screen)return;
 screen=document.createElement('section');screen.id='salesScreen';screen.className='screen dm-sales-screen';screen.hidden=true;
 screen.setAttribute('aria-label','Продажи');
 screen.innerHTML='<header class="dm-sales-head"><span>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</span><button type="button" id="dmSalesBack" aria-label="Вернуться на главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h1>Продажи</h1><p>Кто написал, кому ответить и сколько заработали.</p></header><div id="dmSalesBody" class="dm-sales-body"></div><div id="dmBusinessPicture" class="dm-sales-body" hidden></div>';
 const anchor=document.getElementById('digitalTraceScreen')||document.getElementById('managementScreen');
 if(anchor)anchor.before(screen);else document.getElementById('app')?.append(screen);
 screen.querySelector('#dmSalesBack').addEventListener('click',()=>pictureOpen?closePicture():close());
 screen.addEventListener('submit',e=>{
  if(e.target.id==='dmPromotionExpenseForm'){e.preventDefault();addPromotion(e.target);return}
  if(e.target.id!=='dmSalesForm')return;
  e.preventDefault();let f=new FormData(e.target);
  let person=String(f.get('person')||'').trim().slice(0,100),title=String(f.get('title')||'').trim().slice(0,140);
  let amount=Number(f.get('amount')||0),stage=String(f.get('stage')||'new'),source=String(f.get('source')||'Другое');
  if(!person||!title||!statuses[stage]||!channels.includes(source)||!Number.isFinite(amount)||amount<0||amount>999999999)return;
  let at=Date.now();
  records.unshift({id:uid(),person,title,amount,stage,source,createdAt:at,wonAt:stage==='won'?at:null,lostAt:stage==='lost'?at:null,lossReason:'Не знаем'});
  if(save())window.dispatchEvent(new CustomEvent('dm:local-glyph',{detail:{kind:'clients'}}));
  render();
 });
 screen.addEventListener('change',e=>{
  let el=e.target, id=el.dataset.saleStage||el.dataset.saleReason;
  if(!id)return;
  let entry=records.find(x=>x.id===id);if(!entry)return;
  if(el.dataset.saleStage){
   if(!statuses[el.value])return;
   const next=el.value;
   el.value=entry.stage;
   if(next==='won'||next==='lost'){outcomeDialog(entry,next);return}
   setStage(entry,next);return;
  }
  if(reasons.includes(el.value)){entry.lossReason=el.value;save();render()}
 });
 screen.addEventListener('click',e=>{
  let b=e.target.closest('button');if(!b)return;
  if(b.id==='dmBusinessPictureOpen'){showPicture();return}
  if(b.dataset.expenseDelete){removePromotion(b.dataset.expenseDelete);return}
  if(b.dataset.pictureGoSales){closePicture();return}
  if(b.id==='dmSalesNewLead'){screen.querySelector('#dmSalesFullLedger').open=true;goToNewSale();return}
  if(b.dataset.saleOpen){openClient(b.dataset.saleOpen);return}
  if(b.dataset.saleOutcome){outcomeDialog(records.find(x=>x.id===b.dataset.saleId),b.dataset.saleOutcome);return}
  if(b.dataset.saleReopen){reopenSale(b.dataset.saleReopen);return}
  if(b.dataset.saleAction){action(b.dataset.saleAction,b.dataset.saleId);return}
  if(b.dataset.saleCopy){copyDraft();return}
 });
}
function followupLine(saleId){
 const tasks=window.DMTaskJournal?.forSale?.(saleId)||[];
 if(!tasks.length)return '';
 const byDay={today:'сегодня',tomorrow:'завтра',later:'позже'};
 return '<p class="dm-sales-follow-up">✓ '+tasks.slice(0,2).map(t=>t.assigned?'У управляющего: '+esc(t.kind==='remind'?'связаться':'ответить')+' (в очереди)':'В «Моих делах»: '+esc(t.kind==='remind'?'связаться':'ответить')+' '+(byDay[t.when]||'позже')).join(', ')+(tasks.length>2?' и ещё '+(tasks.length-2):'')+'</p>';
}
function render(){
 if(!screen)return;
 const newToday=records.filter(x=>today(x.createdAt)).length;
 const wonToday=records.filter(x=>x.stage==='won'&&today(x.wonAt));
 const sumToday=wonToday.reduce((a,x)=>a+(Number(x.amount)||0),0);
 const stages=['new','talk','offer','won'];
 const tally=key=>records.filter(x=>x.stage===key).length;
 const srcRows=channels.map(name=>({name,count:records.filter(x=>x.source===name).length})).filter(x=>x.count);
 const active=records.filter(x=>!['won','lost'].includes(x.stage));
 const lost=records.filter(x=>x.stage==='lost');
 const counts=new Map();lost.forEach(x=>counts.set(x.lossReason||'Не знаем',(counts.get(x.lossReason||'Не знаем')||0)+1));
 const lostRows=[...counts].sort((a,b)=>b[1]-a[1]);
 const legacy=legacyOrders();
 const insight=records.length<3?'Пока записей мало. Добавь несколько обращений — и я смогу подсказать, где люди чаще останавливаются.':lost.length>=3&&lostRows[0][0]!=='Не знаем'?'Чаще всего сделки срывались по причине «'+esc(lostRows[0][0])+'» ('+lostRows[0][1]+' из '+lost.length+'). Стоит разобраться.':active.filter(x=>x.stage==='new').length>=3?'Есть '+tally('new')+' обращения без отметки об ответе. Возможно, стоит ответить этим людям в первую очередь.':'По вашим записям: '+tally('won')+' покупок из '+records.length+' обращений. Для объяснения роста или падения нужны данные за разные дни.';
 const form='<form id="dmSalesForm" class="dm-sales-form"><h2>Записать обращение</h2><div class="dm-sales-two"><label>Кто написал<input required maxlength="100" name="person" placeholder="Имя клиента"></label><label>О чём договорились<input required maxlength="140" name="title" placeholder="Услуга или товар"></label></div>'+
 '<div class="dm-sales-two"><label>Откуда пришёл<select name="source">'+options(channels,'Сайт')+'</select></label><label>На каком этапе<select name="stage">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label></div>'+
 '<label>Сумма, ₽ <small>если пока неизвестна — оставь ноль</small><input type="number" name="amount" min="0" max="999999999" step="1" value="0"></label><button type="submit">Сохранить обращение <span>↗</span></button></form>';
 document.getElementById('dmSalesBody').innerHTML=
 '<section class="dm-sales-section"><div class="dm-sales-title"><h2>Сегодня</h2><span class="dm-sales-demo">По вашим записям</span></div><div class="dm-sales-metrics">'+
 [['Написали',newToday],['Купили',wonToday.length],['По известным суммам',rub(sumToday)]].map(([n,v])=>'<div class="dm-sales-metric"><span>'+n+'</span><strong>'+v+'</strong></div>').join('')+'</div></section>'+
 '<section class="dm-sales-section"><h2>Как идут продажи</h2><p class="dm-sales-muted">От первого сообщения до покупки — простыми словами.</p><div class="dm-sales-steps">'+
 stages.map((s,i)=>'<div class="dm-sales-step"><span>'+statuses[s]+'</span><strong>'+tally(s)+'</strong></div>').join('')+'</div><small class="dm-sales-hint">Здесь показано, на каком этапе сейчас ваши записи, а не количество всех прошлых переходов.</small></section>'+
 '<section class="dm-sales-section"><h2>Откуда приходят</h2>'+(srcRows.length?'<div class="dm-sales-sources">'+srcRows.map(x=>'<div><span>'+esc(x.name)+'</span><strong>'+x.count+'</strong></div>').join('')+'</div>':'<p class="dm-sales-muted">Пока неизвестно. Источник можно указать, когда добавляешь обращение.</p>')+'</section>'+
 '<section class="dm-sales-section"><h2>Кому уделить внимание</h2><p class="dm-sales-muted">«Напомнить» добавляет дело на завтра. Само сообщение клиенту пока не отправляется.</p>'+
 (active.length?'<div class="dm-sales-clients">'+active.slice(0,25).map(x=>'<article class="dm-sales-client" data-sale-client-id="'+esc(x.id)+'"><div class="dm-sales-client-top"><div><strong>'+esc(x.person)+'</strong><p>'+esc(x.title)+' · '+esc(x.source)+'</p></div><select data-sale-stage="'+esc(x.id)+'" aria-label="Состояние обращения: '+esc(x.person)+'">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'"'+(k===x.stage?' selected':'')+'>'+v+'</option>').join('')+'</select></div><div class="dm-sales-client-actions">'+
 [['remind','Напомнить'],['reply','Ответить'],['task','Создать дело'],['offer','Предложение']].map(([key,label])=>{
 const exist=(key==='remind'||key==='task')&&(window.DMTaskJournal?.forSale?.(x.id)||[]).some(t=>t.kind===(key==='remind'?'remind':'reply'));
 const handed=(key==='remind'||key==='task')&&(window.DMTaskJournal?.forSale?.(x.id)||[]).some(t=>t.kind===(key==='remind'?'remind':'reply')&&t.assigned);
 return '<button type="button" data-sale-action="'+key+'" data-sale-id="'+esc(x.id)+'">'+(handed?'У управляющего ↗':exist?'В моих делах ✓':label)+'</button>';
}).join('')+
 '</div>'+followupLine(x.id)+'<div class="dm-sales-result-actions"><button type="button" data-sale-outcome="won" data-sale-id="'+esc(x.id)+'">✓ Купил</button><button type="button" data-sale-outcome="lost" data-sale-id="'+esc(x.id)+'">Не сложилось</button></div></article>').join('')+'</div>':'<p class="dm-sales-muted">Сейчас нет обращений, которые ждут продолжения.</p>')+'</section>'+
 '<section class="dm-sales-section"><h2>Кто уже купил</h2>'+
 (records.some(x=>x.stage==='won')?'<div class="dm-sales-clients">'+records.filter(x=>x.stage==='won').slice(0,20).map(x=>'<article class="dm-sales-client" data-sale-client-id="'+esc(x.id)+'"><div class="dm-sales-client-top"><div><strong>'+esc(x.person)+'</strong><p>'+esc(x.title)+' · '+esc(x.source)+' · '+(Number(x.amount)>0?rub(x.amount):'Сумма ещё неизвестна')+'</p></div></div><div class="dm-sales-result-actions"><button type="button" data-sale-outcome="won" data-sale-id="'+esc(x.id)+'">Изменить сумму</button><button type="button" data-sale-reopen="'+esc(x.id)+'">Вернуть в работу</button></div></article>').join('')+'</div>':'<p class="dm-sales-muted">Покупки появятся здесь, когда отметите, что клиент купил.</p>')+'</section>'+
 '<section class="dm-sales-section"><h2>Где не получилось</h2><p class="dm-sales-muted">'+(lost.length?'Отмечено как «Не сложилось»: '+lost.length+'.':'Пока нет записей о потерянных продажах.')+'</p>'+
 (lostRows.length?'<div class="dm-sales-sources">'+lostRows.map(([name,count])=>'<div><span>'+esc(name)+'</span><strong>'+count+'</strong></div>').join('')+'</div>':'')+
 (lost.length?'<div class="dm-sales-loss">'+lost.slice(0,12).map(x=>'<div class="dm-sales-loss-entry" data-sale-client-id="'+esc(x.id)+'"><label>'+esc(x.person)+'<select data-sale-reason="'+esc(x.id)+'" aria-label="Почему не получилось с '+esc(x.person)+'">'+options(reasons,x.lossReason||'Не знаем')+'</select></label><button type="button" data-sale-reopen="'+esc(x.id)+'">Вернуть в работу</button></div>').join('')+'</div>':'')+'</section>'+
 '<section class="dm-sales-section dm-sales-insight"><span>МНЕНИЕ УПРАВЛЯЮЩЕГО · ПО ЗАПИСЯМ</span><h2>Что я заметил</h2><p>'+insight+'</p><small>Это подсказка по введённым данным, а не анализ подключённой рекламы или банков.</small></section>'+
 '<section class="dm-sales-section"><h2>Продажи и деньги</h2><strong class="dm-sales-money">'+rub(totalWon())+'</strong><p class="dm-sales-muted">Сумма покупок, которые вы отметили и для которых указали стоимость. Неизвестные суммы считаются нулём. С банковскими поступлениями пока не сверяется.</p>'+
 (legacy.length?'<details class="dm-sales-legacy"><summary>Ранее добавленные заказы ('+legacy.length+')</summary><p>Эти записи сохранены в старом разделе, но у них нет дат и источников. Поэтому мы не включаем их в показатели за сегодня.</p>'+legacy.map(x=>'<div><span>'+esc(x.title)+'</span><strong>'+rub(x.amount)+'</strong></div>').join('')+'</details>':'')+'</section>'+
 form+'<section class="dm-sales-section dm-sales-terms"><details><summary>Для Уолл-стрит 😉</summary><p><b>Воронка продаж</b> — путь от «написал» до «купил».</p><p><b>Конверсия</b> — какая доля обратившихся купила.</p><p><b>Источник клиента</b> — откуда человек узнал о вас.</p><p><b>Потерянная сделка</b> — покупка, которая не состоялась.</p><p>Эти слова знать необязательно. Управляющий всё объяснит по-человечески.</p></details></section>';
 document.getElementById('dmSalesBody').insertAdjacentHTML('afterbegin','<button type="button" id="dmBusinessPictureOpen" class="dm-picture-open"><span><b>Что происходит с бизнесом?</b><small>Продажи · Деньги · Продвижение</small></span><span class="dm-circle-arrow" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></span></button>');
 document.getElementById('dmBusinessPictureOpen').insertAdjacentHTML('afterend','<button type="button" id="dmSalesNewLead" class="dm-sales-add-shortcut">+ Добавить обращение</button>');
 // Decision-first overview. Full original records and controls stay available,
 // but the owner no longer has to navigate dozens of dropdowns.
 const host=document.getElementById('dmSalesBody');
 const details=document.createElement('details');
 details.className='dm-sales-full-ledger';
 details.id='dmSalesFullLedger';
 details.innerHTML='<summary>Полный учёт и настройки</summary>';
 while(host.firstChild)details.append(host.firstChild);
 const first=active.find(x=>x.stage==='new')||active[0]||null;
 const intro=document.createElement('section');
 intro.className='dm-sales-decision';
 const main=first?
   '<strong>'+esc(first.person)+'</strong><p>'+esc(first.title)+' · '+esc(statuses[first.stage])+'</p>'+
   '<button type="button" data-sale-action="'+(first.stage==='offer'?'offer':'reply')+'" data-sale-id="'+esc(first.id)+'">'+(first.stage==='offer'?'Готовое предложение':'Готовый ответ')+' ↗</button>'
   :'<strong>Сейчас всё спокойно</strong><p>В ваших записях нет обращений, ожидающих продолжения.</p>';
 intro.innerHTML='<small>УПРАВЛЯЮЩИЙ · СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</small>'+main;
 host.append(intro);
 const queue=document.createElement('section');
 queue.className='dm-sales-queue';
 queue.innerHTML='<h2>Клиенты в работе <span>'+active.length+'</span></h2>'+
  (active.length?'<div class="dm-sales-queue-list">'+active.slice(0,25).map(x=>
    '<div class="dm-sales-queue-row"><div><strong>'+esc(x.person)+'</strong><small>'+esc(statuses[x.stage])+' · '+esc(x.title)+'</small></div>'+
    '<button type="button" data-sale-open="'+esc(x.id)+'" aria-label="Открыть карточку клиента '+esc(x.person)+'">Подробнее ↗</button></div>'
  ).join('')+'</div>':'<p>Новых дел пока нет.</p>');
 host.append(queue,details);
}
function draftPanel(title,text){
 const old=document.getElementById('dmSalesDraft');
 if(old)old.remove();
 const box=document.createElement('div');box.className='dm-sales-draft';box.id='dmSalesDraft';box.setAttribute('role','dialog');box.setAttribute('aria-label',title);
 box.innerHTML='<div class="dm-sales-draft-inner"><header><strong>'+esc(title)+'</strong><button type="button" id="dmSalesDraftClose" aria-label="Закрыть">×</button></header><p>Черновик. Ничего не отправлено.</p><textarea id="dmSalesDraftText" rows="6">'+esc(text)+'</textarea><button type="button" data-sale-copy>Скопировать текст</button><small id="dmSalesCopyStatus" role="status"></small></div>';
 document.body.append(box);
 box.querySelector('#dmSalesDraftClose').addEventListener('click',()=>box.remove());
 box.querySelector('[data-sale-copy]').addEventListener('click',copyDraft);
 box.addEventListener('click',e=>{if(e.target===box)box.remove()});
 box.querySelector('textarea').focus();
}
async function copyDraft(){
 const field=document.getElementById('dmSalesDraftText'),status=document.getElementById('dmSalesCopyStatus');if(!field)return;
 try{await navigator.clipboard.writeText(field.value);status.textContent='Текст скопирован'}catch(_){field.select();status.textContent='Выделил текст — скопируйте его вручную'}
}
function action(type,id){
 const lead=records.find(x=>x.id===id);if(!lead)return;
 if(type==='task'||type==='remind'){
  // "Напомнить" stores a tomorrow task, not a push notification or sent message.
  const result=window.DMTaskJournal?.createForSale?.({
   saleId:lead.id,person:lead.person,subject:lead.title,
   when:type==='remind'?'tomorrow':'today',kind:type==='remind'?'remind':'reply'
  });
  if(!result?.ok){window.alert('Не удалось сохранить дело. Проверьте память устройства.');return}
  // The journal opens on the saved task; a second click will not duplicate it.
  return;
 }
 if(type==='reply')draftPanel('Ответ клиенту','Здравствуйте, '+lead.person+'! Спасибо за обращение по поводу «'+lead.title+'». Подскажите, пожалуйста, что для вас сейчас самое важное?');
 if(type==='offer')draftPanel('Предложение клиенту','Здравствуйте, '+lead.person+'! Подготовили для вас предложение по «'+lead.title+'».'+(lead.amount>0?' Ориентировочная стоимость: '+rub(lead.amount)+'.':'')+' Давайте уточним детали, сроки и окончательную стоимость.');
}

/* Linked picture: only manual sales and promotional spending.
   Home finance demo data must never be added to these calculations. */
function renderPicture(){
 if(!screen)return;
 const host=screen.querySelector('#dmBusinessPicture');if(!host)return;
 const won=records.filter(x=>x.stage==='won');
 const income=totalWon(),spent=promotionTotal();
 const sources=channels.map(source=>{
  const leads=records.filter(x=>x.source===source);
  const paid=won.filter(x=>x.source===source);
  const expenses=promotion.filter(x=>x.source===source);
  return {source,leads:leads.length,purchases:paid.length,income:paid.reduce((n,x)=>n+(Number(x.amount)||0),0),spend:expenses.reduce((n,x)=>n+x.amount,0)};
 }).filter(x=>x.leads||x.spend);
 const interval=7*86400000,now=Date.now();
 const week=won.filter(x=>Number.isFinite(x.wonAt)&&x.wonAt>=now-interval&&x.wonAt<=now);
 const lastWeek=won.filter(x=>Number.isFinite(x.wonAt)&&x.wonAt>=now-2*interval&&x.wonAt<now-interval);
 const sumAmount=list=>list.reduce((n,x)=>n+(Number(x.amount)||0),0);
 const amountWeek=sumAmount(week),amountLastWeek=sumAmount(lastWeek);
 const notAnswered=records.filter(x=>x.stage==='new').length;
 const spentWithoutSales=sources.find(x=>x.spend>0&&x.leads>=2&&x.purchases===0);
 let note;
 if(!records.length&&!promotion.length){
  note='Пока данных мало. Добавьте обращения и запишите расходы на продвижение — тогда я смогу показать, как всё связано.';
 }else if(spentWithoutSales){
  note='На '+esc(spentWithoutSales.source)+' записано '+spentWithoutSales.leads+' обращений и '+rub(spentWithoutSales.spend)+' расходов, но ни одной отмеченной покупки. Стоит проверить ответы и предложения. Это ещё не означает, что реклама не работает.';
 }else if(week.length>=2&&lastWeek.length>=2){
  const change=amountWeek-amountLastWeek;
  note=change===0?'В последние две недели суммы отмеченных покупок одинаковые. Для объяснения причин нужны дополнительные данные.':'За последние 7 дней отмечены покупки на '+rub(amountWeek)+' — '+(change>0?'на '+rub(change)+' больше':'на '+rub(-change)+' меньше')+', чем за предыдущие 7 дней. Пока неизвестно, связано ли это с продвижением.';
 }else if(notAnswered>=3){
  note='Есть '+notAnswered+' новых обращений без отметки об ответе. Я бы начал с них: возможно, кто-то уже готов купить.';
 }else{
  note='По вашим записям '+won.length+' покупок на '+rub(income)+'. Чтобы увидеть причины роста или падения, понадобятся более полные данные по датам, людям и расходам.';
 }
 const rowHtml=sources.length?sources.map(x=>'<article class="dm-picture-source"><div class="dm-picture-source-top"><strong>'+esc(x.source)+'</strong><small>Написали '+x.leads+' · Купили '+x.purchases+'</small></div><div><span>Продажи: '+rub(x.income)+'</span><span>Продвижение: '+rub(x.spend)+'</span></div></article>').join(''):'<p class="dm-sales-muted">Когда появятся обращения с источниками или расходы на продвижение, я покажу их рядом.</p>';
 const costsHtml=promotion.length?promotion.slice(0,30).map(x=>'<div class="dm-picture-expense"><span>'+esc(x.source)+' · '+new Date(x.createdAt).toLocaleDateString('ru-RU')+'</span><strong>'+rub(x.amount)+'</strong><button type="button" data-expense-delete="'+esc(x.id)+'" aria-label="Удалить запись расхода">×</button></div>').join(''):'<p class="dm-sales-muted">Пока не записано ни одного расхода.</p>';
 host.innerHTML=
 '<section class="dm-sales-section dm-picture-intro"><span>ПО ВАШИМ ЗАПИСЯМ</span><h2>Вот что я вижу</h2><p>Я сопоставляю покупки, откуда пришли люди, и расходы на продвижение. Подключений к банкам и рекламе здесь пока нет.</p></section>'+
 '<section class="dm-sales-section"><h2>Деньги и продвижение</h2><div class="dm-picture-metrics">'+
 '<div><span>Сумма покупок</span><strong>'+rub(income)+'</strong></div>'+
 '<div><span>Расходы на продвижение</span><strong>'+rub(spent)+'</strong></div>'+
 '<div><span>Разница</span><strong>'+rub(income-spent)+'</strong></div>'+
 '</div><p class="dm-sales-hint">Это не прибыль и не остаток в банке: другие расходы и даты оплаты неизвестны. Учитываются суммы покупок, отмеченных вами как состоявшиеся.</p></section>'+
 '<section class="dm-sales-section"><h2>Откуда приходят люди</h2><p class="dm-sales-muted">Сумму покупки показываю рядом с источником, который вы сами указали.</p><div class="dm-picture-sources">'+rowHtml+'</div></section>'+
 '<section class="dm-sales-section dm-sales-insight"><span>НАБЛЮДЕНИЕ УПРАВЛЯЮЩЕГО</span><h2>Что я заметил</h2><p>'+note+'</p><small>Это подсказка по ручным записям, а не проверенный вывод о работе рекламных площадок.</small></section>'+
 '<form id="dmPromotionExpenseForm" class="dm-sales-form"><h2>Записать расход на продвижение</h2><p class="dm-sales-muted">Например, сколько заплатили за рекламу во VK.</p><div class="dm-sales-two"><label>Где потратили<select name="source">'+options(channels,'VK')+'</select></label><label>Сколько, ₽<input name="amount" type="number" min="1" max="999999999" step="1" required placeholder="3000"></label></div><button type="submit">Сохранить расход <span>↗</span></button></form>'+
 '<section class="dm-sales-section"><h2>Записанные расходы</h2><div class="dm-picture-expenses">'+costsHtml+'</div></section>'+
 '<section class="dm-sales-section dm-sales-terms"><details><summary>Для Уолл-стрит 😉</summary><p><b>Выручка</b> — сумма отмеченных продаж.</p><p><b>Расходы на привлечение</b> — деньги, потраченные, чтобы о вас узнали.</p><p><b>Рентабельность</b> — сколько бизнес в итоге заработал с учётом всех расходов. Здесь мы её пока не считаем.</p><p><b>Атрибуция</b> — определение того, откуда пришёл покупатель.</p></details></section>'+
 '<button type="button" class="dm-picture-return" data-picture-go-sales>← Вернуться к продажам</button>';
}
function showPicture(){
 if(!screen)return;
 pictureOpen=true;
 const body=screen.querySelector('#dmSalesBody'),picture=screen.querySelector('#dmBusinessPicture');
 renderPicture();body.hidden=true;picture.hidden=false;
 screen.querySelector('.dm-sales-head h1').textContent='Что происходит с бизнесом?';
 screen.querySelector('.dm-sales-head p').textContent='Откуда приходят люди, сколько приносят и что стоит реклама.';
 screen.querySelector('#dmSalesBack').setAttribute('aria-label','Назад к продажам');
 window.scrollTo({top:0,behavior:'instant'});
 screen.querySelector('#dmSalesBack').focus({preventScroll:true});
}
function closePicture(){
 if(!screen)return;
 pictureOpen=false;
 screen.querySelector('#dmSalesBody').hidden=false;
 screen.querySelector('#dmBusinessPicture').hidden=true;
 screen.querySelector('.dm-sales-head h1').textContent='Продажи';
 screen.querySelector('.dm-sales-head p').textContent='Кто написал, кому ответить и сколько заработали.';
 screen.querySelector('#dmSalesBack').setAttribute('aria-label','Вернуться на главную');
 window.scrollTo({top:0,behavior:'instant'});
 screen.querySelector('#dmBusinessPictureOpen')?.focus({preventScroll:true});
}
function open(source='sales'){
 create();
 if(pictureOpen)closePicture();
 previousFocus=document.activeElement;
 const clients=source==='clients';
 screen.querySelector('.dm-sales-head h1').textContent=clients?'Клиенты и заявки':'Продажи';
 screen.querySelector('.dm-sales-head p').textContent=clients?'Все сохранённые обращения и задачи по клиентам.':'Кто написал, кому ответить и сколько заработали.';
 screen.setAttribute('aria-label',clients?'Клиенты и заявки':'Продажи');
 ['homeScreen','assistantScreen','managementScreen','digitalTraceScreen'].forEach(id=>{let el=document.getElementById(id);if(el)el.hidden=true});
 screen.hidden=false;render();
 window.scrollTo({top:0,behavior:'instant'});
 screen.querySelector('#dmSalesBack').focus({preventScroll:true});
}
function close(){
 if(!screen||screen.hidden)return;
 screen.hidden=true;
 const home=document.getElementById('homeScreen');if(home)home.hidden=false;
 window.scrollTo({top:0,behavior:'instant'});
 const target=document.getElementById('ordersCard');
 if(target)target.focus({preventScroll:true});
}
function hide(){if(screen){screen.hidden=true;if(pictureOpen)closePicture()}}
/* A finished human task is not proof of contacting the customer.
   Only an explicit follow-up confirmation may advance a NEW lead. */
const getClientStage=id=>records.find(x=>x.id===id)?.stage||null;
/* Return only manually recorded facts needed for an owner-approved draft. */
/* Aggregate business picture for the local, non-AI business brain.
   Dates and sources are entered by the owner, not verified with any external service. */
function getBusinessSnapshot(){
 const now=Date.now(),valid=records.filter(x=>statuses[x.stage]);
 const getAmount=x=>Number.isFinite(Number(x.amount))&&Number(x.amount)>0?Number(x.amount):0;
 const newLeads=valid.filter(x=>x.stage==='new');
 const pending=valid.filter(x=>['new','talk','offer'].includes(x.stage));
 const waitingDay=newLeads.filter(x=>Number.isFinite(x.createdAt)&&x.createdAt>0&&now-x.createdAt>=86400000).length;
 const bySource=channels.map(source=>{
  const selected=valid.filter(x=>x.source===source),won=selected.filter(x=>x.stage==='won');
  return {source,leads:selected.length,purchases:won.length,
   revenue:won.reduce((sum,x)=>sum+getAmount(x),0),
   promotion:promotion.filter(x=>x.source===source).reduce((sum,x)=>sum+x.amount,0)};
 }).filter(x=>x.leads||x.promotion);
 const won=valid.filter(x=>x.stage==='won');
 return Object.freeze({source:'user-entered-local-records',total:valid.length,
  newLeads:newLeads.length,waitingDay,active:pending.length,
  inTalk:valid.filter(x=>x.stage==='talk').length,inOffer:valid.filter(x=>x.stage==='offer').length,
  purchases:won.length,lost:valid.filter(x=>x.stage==='lost').length,
  knownRevenue:won.reduce((sum,x)=>sum+getAmount(x),0),
  unknownAmounts:won.filter(x=>getAmount(x)===0).length,
  promotionSpend:promotionTotal(),
  bySource,recordedAt:now});
}
/* Read-only, bounded candidates for local proactive preparation. Never fabricate clients. */
function getWorkCandidates(){
 return records.filter(x=>['new','talk','offer'].includes(x.stage))
  .slice(0,80).map(x=>({id:x.id,person:String(x.person||'').slice(0,100),
   title:String(x.title||'').slice(0,140),stage:x.stage,
   source:channels.includes(x.source)?x.source:'Другое',createdAt:x.createdAt||0}));
}
function getDraftContext(id){
 const x=records.find(item=>item.id===id);
 if(!x)return null;
 return {person:String(x.person||'').slice(0,100),title:String(x.title||'').slice(0,140),
  source:channels.includes(x.source)?x.source:'Другое',
  stage:statuses[x.stage]?x.stage:'new',
  amount:Number.isFinite(Number(x.amount))&&Number(x.amount)>0?Number(x.amount):null};
}
function confirmContact(id){
 const entry=records.find(x=>x.id===id);
 if(!entry)return {ok:false,reason:'missing'};
 if(entry.stage!=='new')return {ok:false,reason:'unchanged',stage:entry.stage};
 const done=setStage(entry,'talk');
 return done?{ok:true,stage:'talk'}:{ok:false,reason:'save'};
}
function openClient(id){
 open();
 if(typeof id!=='string')return;
 const target=[...screen.querySelectorAll('[data-sale-client-id]')].find(el=>el.dataset.saleClientId===id);
 if(target){const ledger=screen.querySelector('#dmSalesFullLedger');if(ledger)ledger.open=true;target.scrollIntoView({block:'center',behavior:'instant'});target.focus?.({preventScroll:true})}
}
function openPicture(source='picture'){
 open();showPicture();
 if(source==='finance'){
  screen.querySelector('.dm-sales-head h1').textContent='Финансовый анализ';
  screen.querySelector('.dm-sales-head p').textContent='Отмеченные продажи, рекламные расходы и их источники.';
 }
}
window.DMSalesScreen=Object.freeze({open,openPicture,openClient,confirmContact,getClientStage,getDraftContext,getWorkCandidates,getBusinessSnapshot,close,hide,getInsight,getTotals:totals,getBusinessSummary:()=>({salesRevenue:totalWon(),promotionExpenses:promotionTotal(),source:'manual-local-records'})});
window.addEventListener('dm:personal-tasks-changed',()=>{
 if(screen&&!screen.hidden&&!pictureOpen)render();
});
// Restore the living recommendation after a reload, even without a new sale.
notifyInsight();
})();