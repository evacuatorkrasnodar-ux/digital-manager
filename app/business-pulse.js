/* Digital Manager | Business Pulse v1. Source-aware period snapshots.
   Read-only local records. No fabricated revenue, profit, bank balance or alerts. */
(()=>{
'use strict';
const dashboard=document.querySelector('#homeScreen .dashboard');
const periodButtons=[...document.querySelectorAll('#homeScreen [data-period]')];
if(!dashboard||periodButtons.length!==4)return;
const label={day:'Сегодня',week:'Неделя',month:'Месяц',year:'Год'};
const accepted=new Set(Object.keys(label)),fmtCount=n=>Number(n||0).toLocaleString('ru-RU');
const fmtMoney=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n||0));
const $=id=>document.getElementById(id);
const read=(key,cap=450)=>{
 try{const data=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(data)?data.slice(0,cap):[];}
 catch(_){return []}
};
const today=()=>new Date();
function interval(period,relative=0){
 const now=today(),y=now.getFullYear(),m=now.getMonth(),d=now.getDate(),weekday=(now.getDay()+6)%7;
 let start,end;
 if(period==='day'){
  start=new Date(y,m,d+relative);end=new Date(y,m,d+relative+1);
 }else if(period==='week'){
  start=new Date(y,m,d-weekday+7*relative);end=new Date(y,m,d-weekday+7*(relative+1));
 }else if(period==='month'){
  start=new Date(y,m+relative,1);end=new Date(y,m+relative+1,1);
 }else{
  start=new Date(y+relative,0,1);end=new Date(y+relative+1,0,1);
 }
 return {start:start.getTime(),end:end.getTime(),name:label[period]};
}
const inSpan=(stamp,span)=>Number.isFinite(Number(stamp))&&Number(stamp)>=span.start&&Number(stamp)<span.end;
const rangeString=span=>{
 const a=new Date(span.start),b=new Date(span.end-1);
 const x=t=>t.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
 return x(a)+' — '+x(b);
};
function collect(period){
 const current=interval(period),past=interval(period,-1);
 const sales=read('dm-sales-records-v1').filter(x=>x&&typeof x.id==='string'&&typeof x.stage==='string');
 const spends=read('dm-promotion-expenses-v1',230).filter(x=>x&&Number.isFinite(Number(x.amount))&&Number(x.amount)>0);
 const created=sales.filter(x=>inSpan(x.createdAt,current));
 const won=sales.filter(x=>x.stage==='won'&&inSpan(x.wonAt,current));
 const lost=sales.filter(x=>x.stage==='lost'&&inSpan(x.lostAt,current));
 const priorCreated=sales.filter(x=>inSpan(x.createdAt,past));
 const priorWon=sales.filter(x=>x.stage==='won'&&inSpan(x.wonAt,past));
 const paidPromotions=spends.filter(x=>inSpan(x.createdAt,current));
 const priorPromotions=spends.filter(x=>inSpan(x.createdAt,past));
 const known=won.filter(x=>Number.isFinite(Number(x.amount))&&Number(x.amount)>0);
 const recordedAmount=known.reduce((sum,x)=>sum+Number(x.amount),0);
 const promoCost=paidPromotions.reduce((sum,x)=>sum+Number(x.amount),0);
 // A record without a dated stage change cannot safely be assigned to a month.
 const undatedWon=sales.filter(x=>x.stage==='won'&&!Number.isFinite(Number(x.wonAt))||x.stage==='won'&&Number(x.wonAt)<=0).length;
 const undated=sales.filter(x=>!Number.isFinite(Number(x.createdAt))||Number(x.createdAt)<=0).length;
 const flow=window.DMWorkflowCore?.snapshot?.()||null;
 const openTasks=Array.isArray(flow?.items)?flow.items.filter(x=>x.kind==='task'&&x.owner==='person'&&x.state==='open'):[];
 const dueTasks=openTasks.filter(t=>{
  if(typeof t.dueAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.dueAt))return false;
  const stamp=new Date(t.dueAt+'T12:00:00').getTime();
  return inSpan(stamp,current);
 });
 const inbox=window.DMDirectorWorkspace?.summary?.()||null;
 const salesSnapshot=window.DMSalesScreen?.getBusinessSnapshot?.()||null;
 const active=Math.max(0,Number(salesSnapshot?.active)||0);
 const warnings=[];
 const tax=window.DMTaxControl?.snapshot?.();
 if(tax?.overdue>0)warnings.push({label:'Налоговые сроки просрочены по вашим записям',count:tax.overdue,target:'tax'});
 if(tax?.urgent>0)warnings.push({label:'Налоговые сроки в ближайшие 7 дней',count:tax.urgent,target:'tax'});
 if(flow?.tasksOverdue>0)warnings.push({label:'Просроченные дела',count:flow.tasksOverdue,target:'tasks'});
 if(inbox?.awaiting>0)warnings.push({label:'Обращения в «Единых входящих» без завершённого ответа',count:inbox.awaiting,target:'inbox'});
 if(salesSnapshot?.waitingDay>0)warnings.push({label:'Новые заявки старше суток без изменения статуса',count:salesSnapshot.waitingDay,target:'sales'});
 if(flow?.assistantQueue>0)warnings.push({label:'Поручения управляющему в очереди',count:flow.assistantQueue,target:'tasks'});
 return {
  period,span:current,range:rangeString(current),asOf:Date.now(),
  recorded:sales.length,created:created.length,won:won.length,lost:lost.length,
  amount:recordedAmount,amountCount:known.length,missingAmounts:won.length-known.length,
  promo:promoCost,promoCount:paidPromotions.length,undated,undatedWon,
  previous:{created:priorCreated.length,won:priorWon.length,promo:priorPromotions.reduce((sum,x)=>sum+Number(x.amount),0)},
  tasksDue:dueTasks.length,active,inbox:inbox||{total:0,awaiting:0,important:0},
  warnings,flowErrors:Array.isArray(flow?.errors)?flow.errors:[]
 };
}
const bar=document.createElement('button');bar.id='dmBusinessPulse';bar.className='dm-business-pulse';bar.type='button';bar.setAttribute('aria-haspopup','dialog');
bar.innerHTML='<span class="dm-pulse-glow" aria-hidden="true">✦</span><span class="dm-pulse-copy">'+
 '<strong id="dmPulseHeading">Пульс бизнеса</strong><small id="dmPulseSummary">Данные из ваших записей · без выдуманных показателей</small>'+
 '</span><span class="dm-pulse-chevron dm-circle-arrow" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ic-chevron"/></svg></span>';
dashboard.prepend(bar);
const overlay=document.createElement('section');
overlay.id='dmBusinessPulseOverlay';overlay.className='dm-business-pulse-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="dm-pulse-frame" role="dialog" aria-modal="true" aria-labelledby="dmPulseTitle" tabindex="-1">'+
 '<header class="dm-pulse-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · ПУЛЬС БИЗНЕСА</small><h2 id="dmPulseTitle">Пульс бизнеса</h2></div>'+
 '<button type="button" data-pulse-close aria-label="Закрыть">×</button></header>'+
 '<div class="dm-pulse-detail" id="dmPulseDetail"></div></div>';
document.body.append(overlay);
let currentPeriod='day',priorFocus=null;
function choosePeriod(){
 const selected=periodButtons.find(b=>b.getAttribute('aria-pressed')==='true'||b.classList.contains('selected'));
 return selected&&accepted.has(selected.dataset.period)?selected.dataset.period:'day';
}
function refresh(){
 currentPeriod=choosePeriod();
 const d=collect(currentPeriod);
 $('dmPulseHeading').textContent='Пульс бизнеса · '+label[currentPeriod];
 const extra=d.warnings.length?' · '+d.warnings.length+' требуют внимания':'';
 const text=d.recorded?'По вашим записям · обращений: '+d.created+' · покупок: '+d.won+extra:
  'Записи о продажах пока не внесены'+(d.warnings.length?extra:'');
 $('dmPulseSummary').textContent=text;
 bar.dataset.attention=d.warnings.length?'yes':'no';
 bar.setAttribute('aria-label','Пульс бизнеса за '+label[currentPeriod].toLowerCase()+'. '+text+'. Открыть подробности.');
 bar.title='Сводка и карточки за выбранный период — по ручным записям';
 window.DMHomeMetricsRefresh?.();
 if(!overlay.hidden)render();
 return d;
}
function stat(title,value,detail=''){
 return '<div class="dm-pulse-stat"><span>'+title+'</span><strong>'+value+'</strong>'+
 (detail?'<small>'+detail+'</small>':'')+'</div>';
}
const circle='<span class="dm-circle-arrow dm-action-circle" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ic-chevron"/></svg></span>';
function actionable(p){
 if(!p.warnings.length)return '<p class="dm-pulse-empty">По доступным записям отдельных срочных сигналов сейчас нет. Это не проверка всех систем компании.</p>';
 return '<div class="dm-pulse-alert-list">'+p.warnings.map(x=>
  '<div class="dm-pulse-alert"><span><strong>'+x.count+'</strong> '+x.label+'</span>'+
  (x.target==='tax'?'<button type="button" data-pulse-target="tax">Проверить '+circle+'</button>':
   x.target==='inbox'?'<button type="button" data-pulse-target="inbox">Открыть '+circle+'</button>':
   x.target==='sales'?'<button type="button" data-pulse-target="sales">Проверить '+circle+'</button>':
    '<button type="button" data-pulse-target="tasks">К делам '+circle+'</button>')+'</div>').join('')+'</div>';
}
function romanAssistantBrief(x){
 if(localStorage.getItem('dm-roman-demo-active-v1')!=='1')return '';
 const candidates=window.DMSalesScreen?.getWorkCandidates?.()||[];
 const waiting=candidates.filter(item=>item.stage==='new');
 const inTalk=candidates.filter(item=>item.stage==='talk'||item.stage==='offer');
 const lead=waiting[0]||inTalk[0]||null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const guidance=lead?
  (waiting.length?'У нас '+waiting.length+' новых обращения без отметки об ответе. Я бы начал с '+lead.person+' — подготовленный ответ уже ждёт проверки.':
   'В переговорах '+inTalk.length+' клиента. Предлагаю проверить следующий шаг по обращению '+lead.person+'.'):
  'Сейчас среди записанных клиентов нет открытых обращений. Самое время посмотреть, какие услуги приносят больше заказов.';
 const priority=lead?(
  waiting.length?
   'Первое дело: ответить '+lead.person+' по запросу «'+lead.title+'». Новое обращение ещё не отмечено как обработанное — скорость ответа сейчас важнее рекламных экспериментов.':
   'Первое дело: продвинуть переговоры с '+lead.person+' по проекту «'+lead.title+'». Предлагаю проверить черновик ответа и согласовать следующий шаг.'
  ):(
   x.warnings.length?'Первое дело: разобрать предупреждения в Пульсе бизнеса — они уже отмечены в наших записях.':
   'Первое дело: проверить закрытые проекты и источники заявок, прежде чем планировать новые расходы.'
  );
 const summary=x.amountCount?
  'За '+label[currentPeriod].toLowerCase()+' отмечено продаж на '+fmtMoney(x.amount)+'.':
  'За '+label[currentPeriod].toLowerCase()+' в записях нет завершённых продаж с суммами.';
 const sales=read('dm-sales-records-v1').filter(item=>item?.stage==='won'&&inSpan(item.wonAt,x.span));
 const projects=sales.filter(item=>Number(item.amount)>0).sort((a,b)=>Number(b.amount)-Number(a.amount));
 const biggest=projects[0];
 const finance=x.amountCount||x.promoCount?
  'По проектам отмечено '+fmtMoney(x.amount)+'; на рекламу записано '+fmtMoney(x.promo)+'.'+
  (biggest?' Самый крупный завершённый проект за этот период — «'+String(biggest.title||'Проект').slice(0,75)+'» ('+fmtMoney(biggest.amount)+').':'')+
  ' Рекламу можно сопоставить с результатами, но эти две суммы ещё не дают чистой прибыли.':
  'В этом периоде нет завершённых проектов или рекламных расходов с указанными датами. Сначала проверим записи, а не будем угадывать цифры.';
 const entries=read('dm-sales-records-v1');
 const expenses=read('dm-promotion-expenses-v1',230);
 const channels=[...new Set([...entries.map(e=>e?.source),...expenses.map(e=>e?.source)].filter(Boolean))];
 const channelRows=channels.map(name=>{
  const leads=entries.filter(e=>e.source===name&&inSpan(e.createdAt,x.span));
  const wins=entries.filter(e=>e.source===name&&e.stage==='won'&&inSpan(e.wonAt,x.span));
  const spend=expenses.filter(e=>e.source===name&&inSpan(e.createdAt,x.span)).reduce((a,e)=>a+Math.max(0,Number(e.amount)||0),0);
  return {name,leads:leads.length,wins:wins.length,spend};
 }).filter(row=>row.leads||row.wins||row.spend).sort((a,b)=>b.wins-a.wins||b.leads-a.leads||b.spend-a.spend);
 const channelAdvice=channelRows.length?
  channelRows.map(row=>row.name+': обращений '+row.leads+', продаж '+row.wins+', рекламных затрат '+fmtMoney(row.spend)).join('; ')+
  '. Это сопоставление записей, не доказательство окупаемости рекламы: заказ мог прийти без платного продвижения.':
  'В выбранном периоде пока нет записей по каналам. Анализировать эффективность рекламы рано.';
 const channelDecision=channelRows.some(r=>r.spend>0&&r.wins===0)?
  'По каналам с расходами без отмеченных покупок сначала проверь заявки и качество обращений; пока не увеличивай бюджет вслепую.':
  'Сравни стоимость привлечения и качество заявок, а затем решай, какой канал развивать.';
 const next=x.promoCount?
  'Я предлагаю проверить, какие рекламные каналы дали заказы, прежде чем увеличивать бюджет.':
  'Я предлагаю сравнить завершённые проекты и обращения: увидим, какие услуги стоит развивать.';
 return '<section class="dm-pulse-section" aria-label="Обзор управляющего для Романа">'+
  '<small class="dm-pulse-eyebrow">ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · СТУДИЯ «ЦИФРОВОЙ БИЗНЕС» · ПРИМЕР</small>'+
  '<h3>Роман, я посмотрел наши дела</h3>'+
  '<h3>Главное дело сейчас</h3><p>'+esc(priority)+'</p>'+
  '<p>'+esc(summary)+' '+esc(guidance)+'</p>'+
  '<h3>Что с деньгами и проектами</h3><p>'+esc(finance)+'</p><p>'+esc(next)+'</p>'+
  '<h3>Откуда приходят заказы</h3><p>'+esc(channelAdvice)+'</p><p>'+esc(channelDecision)+'</p>'+
  '<p>Без паники: сначала клиенты, потом всё остальное. Деньги любят порядок, а клиенты — своевременные ответы. 🙂</p>'+
  '<div class="dm-pulse-buttons">'+(lead?'<button type="button" data-pulse-client-draft="'+esc(lead.id)+'">Готовый ответ '+circle+'</button>':'')+'<button type="button" data-pulse-target="sales">Посмотреть клиентов '+circle+'</button></div>'+
  '</section>';
}
function render(){
 const x=collect(currentPeriod);
 $('dmPulseTitle').textContent='Пульс бизнеса · '+label[currentPeriod];
 const comparison=x.previous;
 const candidates=localStorage.getItem('dm-roman-demo-active-v1')==='1'
   ?(window.DMSalesScreen?.getWorkCandidates?.()||[]):[];
 const lead=candidates.find(c=>c.stage==='new')||candidates.find(c=>c.stage==='talk'||c.stage==='offer');
 const top=x.warnings[0];
 const priority=top
   ?top.count+' · '+top.label
   :lead?'Следующий шаг — '+String(lead.person||'клиент')+': '+String(lead.title||'обращение')
   :x.created?'Есть '+x.created+' обращений за период. Проверь, кто ждёт ответа.'
   :'Срочных сигналов в доступных записях нет.';
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>c==="'"?'&#39;':({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const button=top?
   '<button type="button" data-pulse-target="'+top.target+'">Перейти к делу '+circle+'</button>'
   :lead?'<button type="button" data-pulse-client-draft="'+safe(lead.id)+'">Подготовленный следующий шаг '+circle+'</button>'
   :'<button type="button" data-pulse-close>Понятно</button>';
 const comparisonNote=x.recorded?
   'По вашим записям: обращений '+x.created+', отмеченных покупок '+x.won+'.'
   :'Для полного анализа пока не хватает записей о продажах.';
 const stats='<div class="dm-pulse-compact-stats" aria-label="Краткая картина">'+
  stat('Обращения',String(x.created))+
  stat('Покупки',String(x.won))+
  stat('Потери',String(x.lost))+
  stat('Дела со сроком',String(x.tasksDue))+'</div>';
 const rest=x.warnings.filter(w=>w!==top);
 const details='<div class="dm-pulse-expanded">'+
  '<div class="dm-pulse-stats">'+
  stat('Покупки по записям',x.amountCount?fmtMoney(x.amount):'—','Не банковское поступление')+
  stat('Реклама',x.promoCount?fmtMoney(x.promo):'—','Только внесённые расходы')+
  stat('Обращения ранее',String(comparison.created))+
  stat('Покупки ранее',String(comparison.won))+'</div>'+
  (rest.length?'<div class="dm-pulse-other-signals"><strong>Другие сигналы</strong><ul>'+
    rest.map(w=>'<li>'+safe(w.count+' · '+w.label)+'</li>').join('')+'</ul></div>':'')+
  '<p class="dm-pulse-disclaimer">По внесённым записям. Покупка не означает банковское поступление; прибыль без всех расходов не рассчитываем. Внешние действия — только с разрешения.</p>'+
  (x.flowErrors.length?'<p class="dm-pulse-disclaimer">Часть данных недоступна: '+x.flowErrors.length+'.</p>':'')+
  '</div>';
 $('dmPulseDetail').innerHTML=
  '<section class="dm-pulse-decision" aria-label="Главный вывод помощника">'+
  '<small class="dm-pulse-eyebrow">УПРАВЛЯЮЩИЙ · ГЛАВНОЕ</small>'+
  '<h3>Главное сейчас</h3><p>'+safe(priority)+'</p>'+
  '<div class="dm-pulse-buttons">'+button+'</div></section>'+
  '<section class="dm-pulse-glance"><h3>Краткая картина</h3>'+stats+'</section>'+
  '<details class="dm-pulse-extra"><summary>Подробности и сигналы</summary>'+details+'</details>';

}

function open(){
 currentPeriod=choosePeriod();priorFocus=document.activeElement;
 overlay.hidden=false;render();overlay.querySelector('[data-pulse-close]')?.focus({preventScroll:true});
}
function close(){
 if(overlay.hidden)return;
 overlay.hidden=true;
 if(priorFocus?.isConnected&&typeof priorFocus.focus==='function')priorFocus.focus({preventScroll:true});
}
bar.addEventListener('click',open);
overlay.addEventListener('click',event=>{
 if(event.target===overlay){close();return;}
 const btn=event.target.closest('[data-pulse-close],[data-pulse-target],[data-pulse-client-draft]');if(!btn)return;
 if(btn.hasAttribute('data-pulse-close')){close();return;}
 if(btn.dataset.pulseClientDraft){
   const id=btn.dataset.pulseClientDraft;
   close();
   if(!window.DMInitiative?.openForClient?.(id))window.DMSalesScreen?.openClient?.(id);
   return;
 }
 const target=btn.dataset.pulseTarget;close();
 if(target==='tax')window.DMTaxControl?.open?.();
 else if(target==='inbox')window.DMDirectorWorkspace?.open?.('inbox');
 else if(target==='sales')window.DMSalesScreen?.open?.();
 else if(target==='tasks')window.DMTaskJournal?.open?.('mine');
});
overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
for(const event of ['dm:period-changed','dm:sales-changed','dm:personal-tasks-changed','dm:workspace-updated','dm:director-updated','dm:tax-changed']){
 window.addEventListener(event,refresh);
}
window.addEventListener('storage',e=>{
 if(['dm-sales-records-v1','dm-promotion-expenses-v1','dm-director-workspace-v1','dm-personal-tasks-v1','dm-tax-control-v1'].includes(e.key))refresh();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
function routeQuestion(query){
 const q=String(query??'').toLowerCase().trim();
 if(!/пульс бизнеса|(?:покажи|открой|проверь|сравни|итоги|отч[её]т).{0,42}(?:за сегодня|за день|за неделю|за месяц|за год|бизнес)|(?:как дела|как идут дела).{0,20}(?:недел|месяц|год)/.test(q))return false;
 let target=null;
 if(/сегодня|за день/.test(q))target='day';
 else if(/недел/.test(q))target='week';
 else if(/месяц/.test(q))target='month';
 else if(/за год|годов|год/.test(q))target='year';
 if(target){
  const b=periodButtons.find(el=>el.dataset.period===target);
  b?.click();
 }
 open();return true;
}
window.DMBusinessPulse=Object.freeze({open,refresh,routeQuestion,snapshot:(requested=currentPeriod)=>collect(accepted.has(requested)?requested:currentPeriod)});
refresh();
})();