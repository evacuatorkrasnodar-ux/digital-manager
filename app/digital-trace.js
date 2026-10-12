/* Digital Trace: real manual measurements, source registry, comparisons and decisions.
   No fabricated data, no external actions and no executable user-authored code. */
(()=>{'use strict';
const KEY='dm-digital-trace-v2', EVENT_KEY='dm-attention-events-v1';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=s=>{const x=Number(String(s).replace(',','.'));return Number.isFinite(x)&&x>=0&&x<=1e9?x:null};
const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
const when=t=>new Date(t).toLocaleString('ru-RU');
const labels={visits:'Посещения сайта',leads:'Заявки',orders:'Заказы',revenue:'Выручка',expenses:'Расходы',clients:'Клиенты'};
const categories={site:'Сайт и реклама',social:'Соцсети и мессенджеры',orders:'Заказы и клиенты',finance:'Финансы',operations:'Процессы',other:'Другое'};
let store={sources:[],metrics:[],decisions:[]};
try{const a=JSON.parse(localStorage.getItem(KEY)||'{}');if(a&&typeof a==='object')for(const k of Object.keys(store))if(Array.isArray(a[k]))store[k]=a[k].slice(0,200)}catch(_){}
let returnTab='management',section='overview';
const screen=()=>document.getElementById('digitalTraceScreen');
const $=id=>document.getElementById(id);
const id=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const source=id=>store.sources.find(x=>x.id===id);
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));return true}catch(_){alert('Нет возможности сохранить данные на этом устройстве.');return false}}
function verifiedEvents(){try{let a=JSON.parse(localStorage.getItem(EVENT_KEY)||'[]');return Array.isArray(a)?a.filter(x=>x?.verified===true&&typeof x.source==='string'&&x.source.trim()&&typeof x.title==='string'&&Number.isFinite(x.timestamp)).slice(0,40):[]}catch(_){return []}}
function compare(){
 const groups=new Map();
 for(const m of store.metrics){if(!source(m.sourceId)||!(m.metric in labels)||num(m.value)===null)continue;const k=m.sourceId+'|'+m.metric;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(m)}
 const found=[];
 for(const g of groups.values()){
  g.sort((a,b)=>b.time-a.time);
  if(g.length<2)continue;
  const a=g[0],b=g[1],diff=num(a.value)-num(b.value);
  const percent=num(b.value)>0?100*diff/num(b.value):null;
  if(diff===0||percent!==null&&Math.abs(percent)<10)continue;
  const name=labels[a.metric],change=(diff>0?'+':'−')+fmt(Math.abs(diff))+(percent===null?'':' ('+(percent>0?'+':'−')+fmt(Math.abs(percent))+'%)');
  found.push({id:a.id,title:name+': '+(diff>0?'рост':'снижение'),message:change+' относительно предыдущего замера.',source:source(a.sourceId).name,time:a.time,tip:a.metric==='visits'?'Сравните посещения с количеством заявок.':a.metric==='expenses'?'Проверьте, из-за чего изменились расходы.':'Посмотрите связанные показатели за тот же период.'});
 }
 for(const e of verifiedEvents())found.push({id:'event-'+e.timestamp+'-'+e.title,title:e.title,message:e.description||'Подтверждённое событие',source:e.source,time:e.timestamp,tip:'Проверьте первоисточник перед действием.'});
 return found.sort((a,b)=>b.time-a.time);
}
function options(obj){return Object.entries(obj).map(([k,v])=>'<option value="'+E(k)+'">'+E(v)+'</option>').join('')}
function viewMarkup(){
 const findings=compare(),s=store.sources,m=store.metrics;
 const intro='<div class="dm-trace-summary"><span>ЦИФРОВОЙ СЛЕД · МОЯ КАРТИНА</span><h2>'+(s.length?'Смотрю на факты, а не догадки':'Начнём с настоящих данных')+'</h2><p>Добавленные вручную показатели отмечены как ручные. Автоматических подключений пока нет.</p><button type="button" class="dm-trace-secondary" data-trace-connections>Перейти к связям ↗</button><div class="dm-trace-kpis"><div><strong>'+s.length+'</strong><small>Источников</small></div><div><strong>'+m.length+'</strong><small>Замеров</small></div><div><strong>'+findings.length+'</strong><small>Наблюдений</small></div></div></div>';
 const demo='<section class="dm-trace-demo"><div class="dm-trace-demo-label"><strong>ДЕМО · ПРИМЕР РАБОТЫ</strong><span>Все цифры вымышленные</span></div><h3>Управляющий увидел связь</h3><p>Реклама привела людей на сайт, но до заявки дошли не все. Вот как это может выглядеть после подключения настоящих источников.</p><div class="dm-trace-flow">'+[['Реклама','12 400','показов'],['Сайт','860','визитов'],['Заявки','23','обращения'],['Продажи','8','заказов'],['Деньги','64 000 ₽','выручка']].map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong><span>'+x[2]+'</span></div>').join('')+'</div><div class="dm-trace-demo-insight"><span>✦ Я заметил · демо</span><strong>Посетители приходят, но оставляют мало заявок.</strong><p>Предлагаю проверить форму обращения и заметность кнопки заказа. Это пример рекомендации, не результат реального анализа.</p><button type="button" data-trace-demo-history>Посмотреть план действий →</button></div></section>'; 
 const marketplaces='<section class="dm-trace-panel dm-trace-marketplaces"><div class="dm-trace-market-head"><div><span class="dm-trace-market-kicker">ЦИФРОВОЙ СЛЕД · ТОРГОВЫЕ ПЛОЩАДКИ</span><h3>Маркетплейсы под присмотром</h3></div><span class="dm-trace-market-demo">ДЕМО</span></div><p>Продажи, заказы, цены, остатки, отзывы и реклама — одна картина. Настоящие подключения ещё не настроены.</p><div class="dm-trace-market-grid">'+[['ozon','Ozon','Цены и продажи'],['wb','Wildberries','Остатки и заказы'],['ym','Яндекс Маркет','Спрос и реклама'],['mega','Мегамаркет','Товары и возможности']].map(x=>'<button type="button" data-trace-market="'+x[0]+'" class="dm-trace-market-card"><strong>'+x[1]+'</strong><small>'+x[2]+'</small><span>Посмотреть пример ↗</span></button>').join('')+'</div><div class="dm-trace-market-example"><span>ПРИМЕР НАБЛЮДЕНИЯ · ВЫМЫШЛЕННЫЕ ДАННЫЕ</span><strong>Ozon: цена на 11% выше условной рыночной.</strong><p>Прежде чем менять цену, управляющий сравнит спрос, рекламу, остатки и маржу. Это не реальная проверка Ozon.</p><button type="button" class="dm-trace-secondary" data-trace-market-action>Сохранить идею проверки в историю</button></div><div class="dm-trace-market-link"><strong>Ищу возможности, а не только проблемы</strong><p>Avito, Яндекс Маркет, Мегамаркет и соцсети могут стать новыми каналами продаж. Сначала анализируем спрос, затем предлагаем действия — без автоматических расходов и публикаций.</p></div></section>';
 const nav='<div class="dm-trace-tabs" role="group" aria-label="Разделы Цифрового следа">'+[['overview','Картина'],['sources','Источники'],['findings','Выводы'],['history','История']].map(([k,n])=>'<button type="button" data-trace-tab="'+k+'" aria-pressed="'+(section===k)+'">'+n+'</button>').join('')+'</div>';
 let content='';
 if(section==='overview'){
  content=demo+marketplaces+'<div class="dm-trace-panel"><h3>Новый замер</h3><p>Введите показатель из ваших настоящих отчётов. Сравнение появится после второго замера того же показателя.</p>'+
   (s.length?'<form id="traceMetricForm" class="dm-trace-form"><label>Источник<select name="sourceId" required>'+s.map(x=>'<option value="'+E(x.id)+'">'+E(x.name)+'</option>').join('')+'</select></label><label>Показатель<select name="metric">'+options(labels)+'</select></label><label>Значение<input type="number" name="value" min="0" max="1000000000" step="any" required placeholder="Например, 24"></label><label>Период или дата<input type="date" name="date" required value="'+new Date().toISOString().slice(0,10)+'"></label><button type="submit">Сохранить замер</button></form>':'<p class="dm-trace-empty">Добавьте первый источник во вкладке «Источники».</p><button type="button" data-trace-tab="sources" class="dm-trace-secondary">Добавить источник</button>')+'</div>'+
   '<div class="dm-trace-panel"><h3>Последние измерения</h3>'+(m.length?m.slice().sort((a,b)=>b.time-a.time).slice(0,8).map(x=>'<div class="dm-trace-row"><div><strong>'+E(labels[x.metric]||'Показатель')+': '+fmt(num(x.value)||0)+'</strong><small>'+E(source(x.sourceId)?.name||'Удалённый источник')+' · ручной ввод · '+E(x.day||when(x.time))+'</small></div><button type="button" data-trace-delete-metric="'+E(x.id)+'" aria-label="Удалить замер">×</button></div>').join(''):'<p class="dm-trace-empty">Замеров пока нет.</p>')+'</div>';
 }else if(section==='sources'){
  content='<div class="dm-trace-panel"><h3>Мои источники</h3><p>Назовите источник, откуда будете переносить достоверные показатели. Это не подключает сервис автоматически.</p><form id="traceSourceForm" class="dm-trace-form"><label>Название<input name="name" maxlength="70" required placeholder="Например, мой сайт"></label><label>Тип источника<select name="category">'+options(categories)+'</select></label><button type="submit">Добавить источник</button></form></div>'+
  '<div class="dm-trace-panel"><h3>Список источников</h3>'+(s.length?s.map(x=>'<div class="dm-trace-row"><div><strong>'+E(x.name)+'</strong><small>'+E(categories[x.category]||'Другой')+' · ручной источник</small></div><button type="button" data-trace-delete-source="'+E(x.id)+'" aria-label="Удалить источник">×</button></div>').join(''):'<p class="dm-trace-empty">Источники ещё не добавлены.</p>')+'</div>';
 }else if(section==='findings'){
  content='<div class="dm-trace-panel"><h3>Что я заметил</h3><p>Здесь сравниваются два последних замера одного показателя из одного источника. Это не прогноз и не доказательство причины изменения.</p>'+(findings.length?findings.map(x=>'<article class="dm-trace-insight"><span>НАБЛЮДЕНИЕ · '+E(when(x.time))+'</span><h4>'+E(x.title)+'</h4><p>'+E(x.message)+'</p><small>Источник: '+E(x.source)+'</small><div class="dm-trace-suggestion">Я бы проверил: '+E(x.tip)+'</div><button type="button" data-trace-decision="'+E(x.id)+'">Оставить решение в истории</button></article>').join(''):'<p class="dm-trace-empty">Пока нечего сравнивать. Добавьте по два замера одного показателя.</p>')+'</div>';
 }else{
  content='<div class="dm-trace-panel"><h3>История решений</h3><p>Ваши заметки и решения остаются в этом браузере. Внешние действия не выполняются.</p><form id="traceDecisionForm" class="dm-trace-form"><label>Что решили или сделали?<textarea name="text" maxlength="400" rows="3" required placeholder="Например, проверить форму заявки"></textarea></label><button type="submit">Записать в историю</button></form>'+
  (store.decisions.length?store.decisions.slice().reverse().map(x=>'<div class="dm-trace-row"><div><strong>'+E(x.text)+'</strong><small>'+E(when(x.time))+' · запись пользователя</small></div><button type="button" data-trace-delete-decision="'+E(x.id)+'" aria-label="Удалить запись">×</button></div>').join(''):'<p class="dm-trace-empty">Решений пока нет.</p>')+'</div>';
 }
 return nav+intro+content+'<p class="dm-trace-disclaimer">Это рабочая локальная аналитика. Подключения к банкам, соцсетям и сайтам пока не настроены; данные не синхронизируются между устройствами.</p>';
}
function render(){
 const parent=screen()?.querySelector('.dm-trace-body');if(!parent)return false;
 try{
  const markup=viewMarkup();
  parent.innerHTML=markup;
  return true;
 }catch(error){
  console.error('Digital Trace render:',error);
  parent.innerHTML='<div class="dm-trace-panel"><h3>Не удалось показать данные</h3><p>Вернитесь назад и попробуйте снова. Сохранённые замеры не удалены.</p></div>';
  return false;
 }
}
// Reset the actual page scroller after a hidden screen becomes visible.
// A synchronous scroll alone can be undone by layout and scroll anchoring.
function resetTraceScroll(){
 const el=screen();if(!el||el.hidden)return;
 const reset=()=>{
  if(el.hidden)return;
  el.scrollTop=0;
  const shell=document.getElementById('app');
  if(shell)shell.scrollTop=0;
  document.scrollingElement?.scrollTo({top:0,behavior:'instant'});
  window.scrollTo({top:0,behavior:'instant'});
 };
 reset();
 requestAnimationFrame(()=>{reset();requestAnimationFrame(reset)});
}
function open(from='management'){
 const el=screen();if(!el)return;
 returnTab=from==='home'?'home':'management';
 // Prepare the content first: no blank screen when storage or rendering fails.
 render();
 ['homeScreen','assistantScreen','managementScreen'].forEach(x=>{if($(x))$(x).hidden=true});
 el.hidden=false;
 el.removeAttribute('hidden');
 resetTraceScroll();
}
function close(){
 if(screen())screen().hidden=true;
 const button=$(returnTab==='home'?'tabHome':'tabManagement');if(button)button.click();
}
function init(){
 $('dmTraceBack')?.addEventListener('click',close);
 screen()?.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.traceMarket){
   const label={ozon:'Ozon',wb:'Wildberries',ym:'Яндекс Маркет',mega:'Мегамаркет'}[b.dataset.traceMarket];
   if(label){const box=screen()?.querySelector('.dm-trace-market-example');if(box){const title=box.querySelector('strong'),desc=box.querySelector('p');title.textContent=label+': какие сигналы стоит проверить';desc.textContent='Демо: анализ заказов, цен, остатков, отзывов и рекламы для '+label+'. Данных площадки пока нет — это список возможностей, а не обнаруженная проблема.';box.scrollIntoView({block:'nearest',behavior:'smooth'});} }return;
  }
  if(b.hasAttribute('data-trace-market-action')){
   store.decisions.push({id:id(),text:'Идея: проверить цены, заказы, остатки, отзывы и рекламу на маркетплейсах перед изменением условий продаж. (Демонстрационный сценарий)',time:Date.now()});
   if(store.decisions.length>200)store.decisions=store.decisions.slice(-200);
   save();section='history';render();resetTraceScroll();return;
  }
  if(b.hasAttribute('data-trace-demo-history')){section='history';render();resetTraceScroll();return;}
  if(b.hasAttribute('data-trace-connections')){if(screen())screen().hidden=true;$('tabManagement')?.click();document.querySelector('[data-mg-open="connections"]')?.click();return;}
  if(b.dataset.traceTab){section=b.dataset.traceTab;render();resetTraceScroll();return;}
  for(const [kind,key] of [['source','sources'],['metric','metrics'],['decision','decisions']]){
   const prop='traceDelete'+kind[0].toUpperCase()+kind.slice(1);
   if(b.dataset[prop]){
    const target=b.dataset[prop];
    if(!confirm('Удалить запись?'))return;
    store[key]=store[key].filter(x=>x.id!==target);
    if(kind==='source')store.metrics=store.metrics.filter(x=>x.sourceId!==target);
    save();render();return;
   }
  }
  if(b.dataset.traceDecision){const observation=compare().find(x=>x.id===b.dataset.traceDecision);if(observation){store.decisions.push({id:id(),text:'Проверить: '+observation.title+'. '+observation.tip,time:Date.now()});save();section='history';render();}return;}
 });
 screen()?.addEventListener('submit',e=>{
  const form=e.target;if(!['traceSourceForm','traceMetricForm','traceDecisionForm'].includes(form.id))return;e.preventDefault();
  const fd=new FormData(form);
  if(form.id==='traceSourceForm'){
   const name=String(fd.get('name')||'').trim().slice(0,70);if(!name)return;
   if(store.sources.length>=30){alert('До 30 источников.');return;}
   store.sources.push({id:id(),name,category:categories[fd.get('category')]?fd.get('category'):'other'});
  }else if(form.id==='traceMetricForm'){
   const value=num(fd.get('value')),sourceId=String(fd.get('sourceId')),metric=String(fd.get('metric')),day=String(fd.get('date'));
   if(!source(sourceId)||!labels[metric]||value===null||!/^\d{4}-\d{2}-\d{2}$/.test(day))return;
   if(store.metrics.length>=200){alert('До 200 замеров.');return;}
   store.metrics.push({id:id(),sourceId,metric,value,day,time:new Date(day+'T12:00:00').getTime()});
  }else{
   const value=String(fd.get('text')||'').trim().slice(0,400);if(!value)return;
   if(store.decisions.length>=200){alert('До 200 решений.');return;}
   store.decisions.push({id:id(),text:value,time:Date.now()});
  }
  save();render();
 });
 window.addEventListener('dm:assistant-event',()=>{if(screen()&&!screen().hidden)render()});
 window.DMDigitalTrace=Object.freeze({open,close});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
