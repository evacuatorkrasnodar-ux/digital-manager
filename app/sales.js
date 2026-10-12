/* Продажи — простой язык и реальные записи владельца. Без вымышленных связей с банком. */
(()=>{'use strict';
const KEY='dm-sales-records-v1', LEGACY='digital-manager-black-velvet-v2';
const statuses={new:'Написал',talk:'Обсуждаем',offer:'Предложили',won:'Купил',lost:'Не сложилось'};
const channels=['Сайт','VK','Telegram','MAX','OK','Дзен','Avito','Другое'];
const reasons=['Не знаем','Цена не подошла','Долго отвечали','Купил в другом месте','Передумал','Другое'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const rub=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n)||0);
const today=ts=>Boolean(ts)&&new Date(ts).toDateString()===new Date().toDateString();
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
let records=[];
try{const r=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(r))records=r.filter(x=>x&&typeof x.id==='string'&&statuses[x.stage]&&typeof x.person==='string').slice(0,400)}catch(_){}
let screen, previousFocus;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(records.slice(0,400)));window.dispatchEvent(new CustomEvent('dm:sales-changed',{detail:totals()}));return true}catch(e){console.warn(e);return false}};
const totalWon=()=>records.filter(x=>x.stage==='won').reduce((n,x)=>n+(Number(x.amount)||0),0);
const totals=()=>({sales:records.filter(x=>x.stage==='won').length,revenue:totalWon(),source:'user-entered-sales'});
function legacyOrders(){try{let obj=JSON.parse(localStorage.getItem(LEGACY)||'{}');return Array.isArray(obj.orders)?obj.orders.filter(x=>x&&typeof x.title==='string').slice(0,50):[]}catch(_){return []}}
const options=(arr,current)=>arr.map(x=>'<option value="'+esc(x)+'"'+(x===current?' selected':'')+'>'+esc(x)+'</option>').join('');
function create(){
 if(screen)return;
 screen=document.createElement('section');screen.id='salesScreen';screen.className='screen dm-sales-screen';screen.hidden=true;
 screen.setAttribute('aria-label','Продажи');
 screen.innerHTML='<header class="dm-sales-head"><span>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</span><button type="button" id="dmSalesBack" aria-label="Вернуться на главную">←</button><h1>Продажи</h1><p>Кто написал, кому ответить и сколько заработали.</p></header><div id="dmSalesBody" class="dm-sales-body"></div>';
 const anchor=document.getElementById('digitalTraceScreen')||document.getElementById('managementScreen');
 if(anchor)anchor.before(screen);else document.getElementById('app')?.append(screen);
 screen.querySelector('#dmSalesBack').addEventListener('click',close);
 screen.addEventListener('submit',e=>{
  if(e.target.id!=='dmSalesForm')return;
  e.preventDefault();let f=new FormData(e.target);
  let person=String(f.get('person')||'').trim().slice(0,100),title=String(f.get('title')||'').trim().slice(0,140);
  let amount=Number(f.get('amount')||0),stage=String(f.get('stage')||'new'),source=String(f.get('source')||'Другое');
  if(!person||!title||!statuses[stage]||!channels.includes(source)||!Number.isFinite(amount)||amount<0||amount>999999999)return;
  let at=Date.now();
  records.unshift({id:uid(),person,title,amount,stage,source,createdAt:at,wonAt:stage==='won'?at:null,lostAt:stage==='lost'?at:null,lossReason:'Не знаем'});
  save();render();
 });
 screen.addEventListener('change',e=>{
  let el=e.target, id=el.dataset.saleStage||el.dataset.saleReason;
  if(!id)return;
  let entry=records.find(x=>x.id===id);if(!entry)return;
  if(el.dataset.saleStage){
   if(!statuses[el.value])return;
   if(el.value==='won'&&entry.stage!=='won')entry.wonAt=Date.now();
   if(el.value==='lost'&&entry.stage!=='lost')entry.lostAt=Date.now();
   entry.stage=el.value;
  }else if(reasons.includes(el.value))entry.lossReason=el.value;
  save();render();
 });
 screen.addEventListener('click',e=>{
  let b=e.target.closest('button');if(!b)return;
  if(b.dataset.saleAction){action(b.dataset.saleAction,b.dataset.saleId);return}
  if(b.dataset.saleCopy){copyDraft();return}
 });
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
 [['Написали',newToday],['Купили',wonToday.length],['Денег от продаж',rub(sumToday)]].map(([n,v])=>'<div class="dm-sales-metric"><span>'+n+'</span><strong>'+v+'</strong></div>').join('')+'</div></section>'+
 '<section class="dm-sales-section"><h2>Как идут продажи</h2><p class="dm-sales-muted">От первого сообщения до покупки — простыми словами.</p><div class="dm-sales-steps">'+
 stages.map((s,i)=>'<div class="dm-sales-step"><span>'+statuses[s]+'</span><strong>'+tally(s)+'</strong></div>').join('')+'</div><small class="dm-sales-hint">Здесь показано, на каком этапе сейчас ваши записи, а не количество всех прошлых переходов.</small></section>'+
 '<section class="dm-sales-section"><h2>Откуда приходят</h2>'+(srcRows.length?'<div class="dm-sales-sources">'+srcRows.map(x=>'<div><span>'+esc(x.name)+'</span><strong>'+x.count+'</strong></div>').join('')+'</div>':'<p class="dm-sales-muted">Пока неизвестно. Источник можно указать, когда добавляешь обращение.</p>')+'</section>'+
 '<section class="dm-sales-section"><h2>Кому уделить внимание</h2>'+
 (active.length?'<div class="dm-sales-clients">'+active.slice(0,25).map(x=>'<article class="dm-sales-client"><div class="dm-sales-client-top"><div><strong>'+esc(x.person)+'</strong><p>'+esc(x.title)+' · '+esc(x.source)+'</p></div><select data-sale-stage="'+esc(x.id)+'" aria-label="Состояние обращения: '+esc(x.person)+'">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'"'+(k===x.stage?' selected':'')+'>'+v+'</option>').join('')+'</select></div><div class="dm-sales-client-actions">'+
 [['remind','Напомнить'],['reply','Ответить'],['task','Создать дело'],['offer','Предложение']].map(([key,label])=>'<button type="button" data-sale-action="'+key+'" data-sale-id="'+esc(x.id)+'">'+label+'</button>').join('')+
 '</div></article>').join('')+'</div>':'<p class="dm-sales-muted">Сейчас нет обращений, которые ждут продолжения.</p>')+'</section>'+
 '<section class="dm-sales-section"><h2>Где не получилось</h2><p class="dm-sales-muted">'+(lost.length?'Отмечено как «Не сложилось»: '+lost.length+'.':'Пока нет записей о потерянных продажах.')+'</p>'+
 (lostRows.length?'<div class="dm-sales-sources">'+lostRows.map(([name,count])=>'<div><span>'+esc(name)+'</span><strong>'+count+'</strong></div>').join('')+'</div>':'')+
 (lost.length?'<div class="dm-sales-loss">'+lost.slice(0,12).map(x=>'<label>'+esc(x.person)+'<select data-sale-reason="'+esc(x.id)+'" aria-label="Почему не получилось с '+esc(x.person)+'">'+options(reasons,x.lossReason||'Не знаем')+'</select></label>').join('')+'</div>':'')+'</section>'+
 '<section class="dm-sales-section dm-sales-insight"><span>МНЕНИЕ УПРАВЛЯЮЩЕГО · ПО ЗАПИСЯМ</span><h2>Что я заметил</h2><p>'+insight+'</p><small>Это подсказка по введённым данным, а не анализ подключённой рекламы или банков.</small></section>'+
 '<section class="dm-sales-section"><h2>Продажи и деньги</h2><strong class="dm-sales-money">'+rub(totalWon())+'</strong><p class="dm-sales-muted">Всего покупок по новым записям. Сумма обновляется, когда отмечаешь «Купил». С реальными финансами пока не сверяется.</p>'+
 (legacy.length?'<details class="dm-sales-legacy"><summary>Ранее добавленные заказы ('+legacy.length+')</summary><p>Эти записи сохранены в старом разделе, но у них нет дат и источников. Поэтому мы не включаем их в показатели за сегодня.</p>'+legacy.map(x=>'<div><span>'+esc(x.title)+'</span><strong>'+rub(x.amount)+'</strong></div>').join('')+'</details>':'')+'</section>'+
 form+'<section class="dm-sales-section dm-sales-terms"><details><summary>Для Уолл-стрит 😉</summary><p><b>Воронка продаж</b> — путь от «написал» до «купил».</p><p><b>Конверсия</b> — какая доля обратившихся купила.</p><p><b>Источник клиента</b> — откуда человек узнал о вас.</p><p><b>Потерянная сделка</b> — покупка, которая не состоялась.</p><p>Эти слова знать необязательно. Управляющий всё объяснит по-человечески.</p></details></section>';
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
  if(!window.DMTaskJournal?.open){draftPanel('Напоминание','Связаться с '+lead.person+' по поводу «'+lead.title+'».');return}
  window.DMTaskJournal.open('mine');
  const text=document.getElementById('dmTaskTitle'),date=document.querySelector('#dmPersonalTaskForm [name="when"]');
  if(text){text.value=(type==='remind'?'Напомнить: ':'Ответить: ')+lead.person+' — '+lead.title;text.focus()}
  if(date)date.value=type==='remind'?'tomorrow':'today';
  return;
 }
 if(type==='reply')draftPanel('Ответ клиенту','Здравствуйте, '+lead.person+'! Спасибо за обращение по поводу «'+lead.title+'». Подскажите, пожалуйста, что для вас сейчас самое важное?');
 if(type==='offer')draftPanel('Предложение клиенту','Здравствуйте, '+lead.person+'! Подготовили для вас предложение по «'+lead.title+'».'+(lead.amount>0?' Ориентировочная стоимость: '+rub(lead.amount)+'.':'')+' Давайте уточним детали, сроки и окончательную стоимость.');
}
function open(){
 create();
 previousFocus=document.activeElement;
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
function hide(){if(screen)screen.hidden=true}
window.DMSalesScreen=Object.freeze({open,close,hide,getTotals:totals});
})();