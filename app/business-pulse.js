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
function render(){
 const x=collect(currentPeriod);
 $('dmPulseTitle').textContent='Пульс бизнеса · '+label[currentPeriod];
 const comparison=x.previous;
 const summary=x.recorded||x.promoCount||x.tasksDue?
  'Сводка построена только по внесённым записям и указанным датам. Текущий период ещё не завершился.':
  'За выбранный период подтверждённых записей для сводки пока нет. Это не означает отсутствие работы.';
 $('dmPulseDetail').innerHTML=
  '<section class="dm-pulse-section"><small class="dm-pulse-eyebrow">ПЕРИОД: '+x.range+'</small>'+
   '<p>'+summary+'</p><div class="dm-pulse-stats">'+
   stat('Новых обращений',String(x.created),'За период · ранее: '+comparison.created)+
   stat('Отмечено покупок',String(x.won),'За период · ранее: '+comparison.won)+
   stat('Суммы отмеченных покупок',x.amountCount?fmtMoney(x.amount):'—',
      x.missingAmounts?'У '+x.missingAmounts+' покупок сумма не указана.':'Это не подтверждённые банковские поступления.')+
   stat('Записано на рекламу',x.promoCount?fmtMoney(x.promo):'—',
      x.promoCount?'Только внесённые расходы · ранее: '+fmtMoney(comparison.promo):'Расходы на продвижение за период не внесены.')+
   stat('Потерянные сделки',String(x.lost),'Только с записанной датой изменения этапа')+
   stat('Открытые задачи со сроком',String(x.tasksDue),'На текущий момент · срок внутри периода')+
   '</div></section>'+
  '<section class="dm-pulse-section"><small class="dm-pulse-eyebrow">ВАЖНО СЕЙЧАС · НЕ ЗАВИСИТ ОТ ПЕРИОДА</small>'+
   '<h3>Что требует внимания директора</h3>'+actionable(x)+'</section>'+
  '<section class="dm-pulse-section"><small class="dm-pulse-eyebrow">ГРАНИЦЫ ДАННЫХ</small>'+
   '<p>Карточки главной используют те же ручные записи за выбранный период. При отсутствии данных показывается отсутствие сведений. Без полного учёта расходов прибыль не определяется, а график не имитирует рост.</p>'+
   '<p>«Покупка» — отмеченная вручную сделка, а не подтверждённая банком оплата. Расходы показываются только по внесённой рекламе. Реальную выручку, прибыль, налоги и остаток денег без учётных источников не рассчитываем.</p>'+
   (x.undated||x.undatedWon?'<p>В истории есть записи без необходимых дат ('+fmtCount(x.undated)+' обращений, '+fmtCount(x.undatedWon)+' покупок). Мы не приписываем их произвольному периоду.</p>':'')+
   (x.flowErrors.length?'<p>Часть источников дел временно не прочитана: '+x.flowErrors.length+'. Сводка может быть неполной.</p>':'')+
   '<div class="dm-pulse-buttons"><button type="button" data-pulse-target="sales">Открыть продажи '+circle+'</button>'+
   '<button type="button" data-pulse-close>Готово</button></div></section>';
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
 const btn=event.target.closest('[data-pulse-close],[data-pulse-target]');if(!btn)return;
 if(btn.hasAttribute('data-pulse-close')){close();return;}
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