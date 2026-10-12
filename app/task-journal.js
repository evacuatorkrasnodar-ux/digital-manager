/* Digital Manager · task lifecycle, isolated from approved card geometry. */
(()=>{
'use strict';
const KEY='dm-task-journal-v1';
const taskId='home-advice-ad-campaign';
const title='Проверить эффективность рекламных каналов';
let records=[];
try{const read=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(read))records=read.filter(x=>x&&typeof x.id==='string'&&typeof x.status==='string').slice(-100)}catch(_){}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toLocaleString('ru-RU');
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(records))}catch(e){console.warn('Task journal storage unavailable',e)}};
const find=()=>records.find(x=>x.id===taskId);
function syncRecommendation(){
 const card=document.querySelector('#homeScreen .recommendation-card');
 if(!card)return;
 const planned=Boolean(find());
 card.dataset.taskState=planned?'accepted':'attention';
 const head=card.querySelector('.advice-head'),body=card.querySelector('.advice-body'),btn=document.getElementById('openAdvice');
 if(head)head.textContent=planned?'Поручение принято':'Есть потенциал для роста в рекламных каналах.';
 if(body)body.textContent=planned?'Проверка рекламных каналов добавлена в план. Внешних действий пока не было.':'Увеличьте бюджет на 20% — прогнозируемый рост выручки до +35% в течение 30 дней.';
 if(btn){btn.textContent=planned?'Мои дела ↗':'Исполнить ↗';btn.setAttribute('aria-label',planned?'Посмотреть поручение':'Добавить проверку в мои дела');}
}
function add(){let task=find();if(!task){task={id:taskId,title,status:'planned',created:now(),log:[{at:now(),message:'Пользователь поручил подготовить проверку. ДЕМО: внешние сервисы не подключены.'}]};records.unshift(task);save()}syncRecommendation();show('tasks')}
function finish(){const t=find();if(!t||t.status!=='planned')return;t.status='reviewed';t.log.push({at:now(),message:'Пользователь отметил план как просмотренный. Внешние действия не выполнялись.'});save();show('history')}
function panel(){let root=document.getElementById('dmTaskJournal');if(root)return root;root=document.createElement('section');root.id='dmTaskJournal';root.className='dm-journal-overlay';root.hidden=true;root.innerHTML='<div class="dm-journal-frame" role="dialog" aria-modal="true" aria-label="Мои дела и история"><header><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</small><h2 id="dmJournalTitle">Мои дела</h2></div><button type="button" data-journal-close aria-label="Закрыть">×</button></header><nav><button type="button" data-journal-tab="tasks">Мои дела</button><button type="button" data-journal-tab="history">История действий</button></nav><div id="dmJournalContent"></div></div>';document.body.append(root);return root}
function show(tab='tasks'){const root=panel(),body=root.querySelector('#dmJournalContent');root.hidden=false;root.dataset.tab=tab;root.querySelector('#dmJournalTitle').textContent=tab==='tasks'?'Мои дела':'История действий';root.querySelectorAll('[data-journal-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journalTab===tab)));const rows=records.filter(t=>(tab==='history')=== (t.status==='reviewed'));body.innerHTML=rows.length?rows.map(t=>'<article class="dm-journal-entry"><span>'+(t.status==='reviewed'?'ПЛАН ПРОСМОТРЕН · ДЕМО':'В ПЛАНЕ · НЕ ИСПОЛНЕНО')+'</span><h3>'+esc(t.title)+'</h3><p>Рекламные показатели необходимо подтвердить в подключённых источниках. Прогнозы на главной пока демонстрационные.</p><ul>'+t.log.map(l=>'<li><small>'+esc(l.at)+'</small> '+esc(l.message)+'</li>').join('')+'</ul>'+(t.status==='planned'?'<button data-journal-finish type="button">Отметить план просмотренным</button>':'')+'</article>').join(''):'<p class="dm-journal-empty">'+(tab==='tasks'?'Активных поручений пока нет. На главной можно передать рекомендацию в план.':'Завершённых записей пока нет.')+'</p>';root.querySelector('.dm-journal-frame').scrollTop=0}
function init(){const button=document.getElementById('openAdvice');if(button){syncRecommendation();button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();add()},true)}const home=document.getElementById('mgHome');if(home&&!home.querySelector('[data-journal-open]')){const anchor=home.querySelector('.mg-main');const box=document.createElement('div');box.className='dm-journal-entry-links';box.innerHTML='<button type="button" data-journal-open="tasks">Мои дела <span>↗</span></button><button type="button" data-journal-open="history">История действий <span>↗</span></button>';if(anchor)anchor.before(box);else home.append(box)}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.journalOpen){show(b.dataset.journalOpen)}else if(b.hasAttribute('data-journal-close')){panel().hidden=true}else if(b.dataset.journalTab){show(b.dataset.journalTab)}else if(b.hasAttribute('data-journal-finish')){finish()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const el=document.getElementById('dmTaskJournal');if(el&&!el.hidden)el.hidden=true}});
window.DMTaskJournal=Object.freeze({open:show});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();