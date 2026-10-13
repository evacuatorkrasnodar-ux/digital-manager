/* Digital Manager | Налоговый контроль v1.
   Self-entered dates only. No FNS access, legal deadline computation, push or automatic filing. */
(()=>{
'use strict';
const KEY='dm-tax-control-v1',MAX=120;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safe=(s,n=180)=>String(s??'').trim().slice(0,n);
const unique=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const todayLocal=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime();};
function dueTime(text){
 const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(text||''));
 if(!m)return null;
 const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12);
 if(d.getFullYear()!==Number(m[1])||d.getMonth()+1!==Number(m[2])||d.getDate()!==Number(m[3]))return null;
 return d.getTime();
}
function daysLeft(text){
 const value=dueTime(text);
 if(value===null)return null;
 return Math.round((value-todayLocal())/86400000);
}
const entities=['Пока не указано','Самозанятый','ИП','ООО','Другая форма'];
const regimes=['Пока не указано','НПД','УСН','ОСНО','ПСН','АУСН','ЕСХН','Другой'];
const types=['Декларация','Налоговый платёж','Уведомление','Страховые взносы','Отчётность','Другое'];
function fresh(){return {version:1,profile:{entity:'Пока не указано',regime:'Пока не указано',region:''},events:[]};}
function load(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||'null');
  if(value?.version!==1||!Array.isArray(value.events))return fresh();
  const profile=value.profile&&typeof value.profile==='object'?value.profile:{};
  return {version:1,profile:{
   entity:entities.includes(profile.entity)?profile.entity:entities[0],
   regime:regimes.includes(profile.regime)?profile.regime:regimes[0],
   region:safe(profile.region,70)
  },events:value.events.filter(e=>e&&typeof e.id==='string'&&dueTime(e.due)!==null).slice(0,MAX)};
 }catch(_){return fresh();}
}
let data=load(),page='list',selected='',previousFocus=null,message='';
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(data));}
 catch(_){message='Не удалось сохранить в этом браузере. Проверьте свободное место.';return false;}
 update();
 try{window.dispatchEvent(new Event('dm:tax-changed'));}catch(_){}
 return true;
}
function snapshot(){
 const pending=data.events.filter(e=>!e.done),outstanding=pending.map(e=>({...e,left:daysLeft(e.due)})).filter(e=>e.left!==null).sort((a,b)=>a.left-b.left);
 const overdue=outstanding.filter(e=>e.left<0),urgent=outstanding.filter(e=>e.left>=0&&e.left<=7),upcoming=outstanding.filter(e=>e.left>=0&&e.left<=14);
 return {profile:{...data.profile},total:data.events.length,pending:pending.length,overdue:overdue.length,
  urgent:urgent.length,upcoming:upcoming.length,nearest:outstanding[0]||null,
  source:'owner-entered-local-dates',asOf:Date.now()};
}
const dashboard=document.querySelector('#homeScreen .dashboard');
const shortcuts=dashboard?.querySelector('.shortcuts');
const mg=document.getElementById('mgHome');
if(!dashboard||!shortcuts||!mg)return;
const card=document.createElement('button');
card.type='button';card.id='dmTaxCard';card.className='dm-workspace-card dm-tax-card';
card.innerHTML='<span class="dm-workspace-emblem" aria-hidden="true">◈</span><span class="dm-workspace-copy">'+
 '<strong>Налоговый контроль</strong><small>Декларации · платежи · отчётность</small>'+
 '<em id="dmTaxCardStatus">Добавьте свои сроки — ничего не придумаем</em></span>'+
 '<span class="dm-workspace-arrow" aria-hidden="true">↗</span>';
shortcuts.after(card);
const mgEntry=document.createElement('button');
mgEntry.type='button';mgEntry.id='dmTaxManagementEntry';mgEntry.className='mg-row dm-tax-management-entry';
mgEntry.innerHTML='<span class="mg-icon mg-blue" aria-hidden="true">◈</span>'+
 '<span class="mg-copy"><strong>Налоговый контроль</strong><small>Режим · отчётность · платежи · сроки</small><small id="dmTaxManagementStatus">Сроки и предупреждения</small></span>'+
 '<span class="mg-chevron" aria-hidden="true">›</span>';
const anchor=mg.querySelector('.mg-connections');
(anchor||mg.lastElementChild).after(mgEntry);
const overlay=document.createElement('section');
overlay.id='dmTaxOverlay';overlay.className='dm-tax-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="dm-tax-frame" role="dialog" aria-modal="true" aria-labelledby="dmTaxTitle" tabindex="-1">'+
 '<header class="dm-tax-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · КОНТРОЛЬ СРОКОВ</small><h2 id="dmTaxTitle">Налоговый контроль</h2></div>'+
 '<button type="button" data-tax-close aria-label="Закрыть">×</button></header>'+
 '<nav class="dm-tax-tabs" aria-label="Налоговый контроль"><button type="button" data-tax-page="list">Календарь</button>'+
 '<button type="button" data-tax-page="profile">Мой режим</button></nav>'+
 '<div id="dmTaxBody" class="dm-tax-body"></div></div>';
document.body.append(overlay);
const button=(action,title)=>'<button type="button" data-tax-action="'+action+'">'+title+'</button>';
const select=(name,opts,current)=>'<select name="'+name+'">'+opts.map(x=>'<option '+(x===current?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
const official='<a class="dm-tax-official" href="https://www.nalog.gov.ru/rn77/calendar/" target="_blank" rel="noopener noreferrer">Открыть официальный налоговый календарь ФНС ↗</a>';
const caution='<p class="dm-tax-caution">Это персональный список сроков, введённых вами, а не официальный налоговый календарь. Приложение не проверяет данные ФНС, не рассчитывает обязательные даты по режиму и не сдаёт декларации. Предупреждения видны при открытии приложения, без фоновых push-уведомлений.</p>';
function update(){
 const x=snapshot(),labels=[];
 if(x.overdue)labels.push('Просрочено: '+x.overdue);
 if(x.urgent)labels.push('В ближайшие 7 дней: '+x.urgent);
 if(!labels.length&&x.nearest)labels.push('Ближайший срок: '+x.nearest.due.split('-').reverse().join('.'));
 if(!labels.length)labels.push(x.total?'Нет открытых сроков':'Добавьте свои сроки');
 $('dmTaxCardStatus').textContent=labels.join(' · ');
 $('dmTaxManagementStatus').textContent=labels.join(' · ');
 card.dataset.attention=x.overdue||x.urgent?'yes':'no';
 card.setAttribute('aria-label','Налоговый контроль: '+labels.join(', '));
}
function statusLine(e){
 if(e.done)return '<span class="dm-tax-state done">Отмечено выполненным вручную</span>';
 const left=daysLeft(e.due);
 if(left===null)return '<span class="dm-tax-state">Дата не подтверждена</span>';
 if(left<0)return '<span class="dm-tax-state urgent">Просрочено по вашей записи: '+(-left)+' дн.</span>';
 if(left===0)return '<span class="dm-tax-state urgent">Срок сегодня</span>';
 if(left<=7)return '<span class="dm-tax-state urgent">Осталось '+left+' дн.</span>';
 if(left<=14)return '<span class="dm-tax-state soon">Приближается · '+left+' дн.</span>';
 return '<span class="dm-tax-state">'+e.due.split('-').reverse().join('.')+'</span>';
}
function list(){
 const all=data.events.slice().sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due));
 const x=snapshot(),first=x.nearest;
 return '<section class="dm-tax-panel"><small>КОНТРОЛЬ ДИРЕКТОРА</small>'+
 '<h3>'+(first&&first.left<=7?'Есть срок, который пора проверить':'Всё о налоговых сроках — в одном месте')+'</h3>'+
 '<p>Ваша форма: '+esc(data.profile.entity)+' · режим: '+esc(data.profile.regime)+
 (data.profile.region?' · '+esc(data.profile.region):'')+'</p>'+
 '<div class="dm-tax-actions">'+button('new','+ Добавить срок')+button('profile','Уточнить мой режим')+'</div>'+
 '<p>Налоговая декларация, платёж, уведомление, отчётность — записывайте только подтверждённые обязательства.</p></section>'+
 (all.length?'<section class="dm-tax-list">'+all.map(e=>'<button type="button" class="dm-tax-event" data-tax-event="'+esc(e.id)+'"><span><strong>'+esc(e.name)+'</strong>'+
 '<small>'+esc(e.kind)+' · '+e.due.split('-').reverse().join('.')+'</small></span>'+statusLine(e)+'</button>').join('')+'</section>':
 '<section class="dm-tax-panel"><h3>Сроки пока не добавлены</h3><p>Не подставляю чужие декларации, суммы и даты. Их нужно проверить по конкретному режиму и документам компании.</p></section>')+
 '<section class="dm-tax-panel"><h3>«Бешеный принтер» 📰</h3><p>В будущем управляющий будет отслеживать изменения законов и пересчитывать применимые сроки по официальным источникам. Пока онлайн-мониторинг не подключён.</p>'+
 official+'</section>'+caution;
}
function profileForm(){
 return '<form id="dmTaxProfileForm" class="dm-tax-panel">'+
 '<small>ЗНАКОМСТВО С НАЛОГОВОЙ СИСТЕМОЙ</small><h3>Чей календарь ведём?</h3>'+
 '<label>Форма бизнеса'+select('entity',entities,data.profile.entity)+'</label>'+
 '<label>Налоговый режим'+select('regime',regimes,data.profile.regime)+'</label>'+
 '<label>Регион<input name="region" maxlength="70" placeholder="Например: Краснодарский край" value="'+esc(data.profile.region)+'"></label>'+
 '<p>Эти настройки пока нужны для будущей персонализации. Никакие декларации, обязанности или сроки автоматически не назначаются.</p>'+
 '<div class="dm-tax-actions"><button type="submit">Сохранить</button>'+button('back','← К срокам')+'</div></form>'+
 (data.profile.regime==='НПД'?'<section class="dm-tax-panel"><h3>НПД: важная особенность</h3>'+
 '<p>По налогу на профессиональный доход декларацию не подают. Сумму и срок платежа нужно сверять в приложении «Мой налог». Другие обязанности могут зависеть от вашей ситуации.</p>'+
 '<a class="dm-tax-official" href="https://www.nalog.gov.ru/rn77/taxation/princtax/" target="_blank" rel="noopener noreferrer">Порядок НПД на сайте ФНС ↗</a></section>':'')+official+caution;
}
function deadlineForm(){
 const editing=data.events.find(e=>e.id===selected);
 return '<form id="dmTaxDeadlineForm" class="dm-tax-panel">'+
 '<small>КОНКРЕТНОЕ ОБЯЗАТЕЛЬСТВО · ВРУЧНУЮ</small><h3>'+(editing?'Изменить срок':'Добавить подтверждённый срок')+'</h3>'+
 '<label>Что нужно сделать?<input name="name" maxlength="120" required value="'+esc(editing?.name||'')+'" placeholder="Например: проверить платёж по НПД"></label>'+
 '<label>Вид обязательства'+select('kind',types,editing?.kind||types[0])+'</label>'+
 '<label>Крайний срок<input type="date" name="due" required value="'+esc(editing?.due||'')+'"></label>'+
 '<label>Примечание или источник срока<textarea name="note" maxlength="800" rows="3" placeholder="Откуда узнали дату, кто отвечает, какие документы">'+esc(editing?.note||'')+'</textarea></label>'+
 '<p>Проверьте дату в ФНС, кабинете налогоплательщика или у бухгалтера. Программа её не рассчитывает и не учитывает переносы праздничных дней.</p>'+
 '<div class="dm-tax-actions"><button type="submit">Сохранить срок</button>'+button('back','Отмена')+'</div></form>'+official+caution;
}
function detail(){
 const item=data.events.find(e=>e.id===selected);if(!item){page='list';return list();}
 return '<section class="dm-tax-panel"><small>ОБЯЗАТЕЛЬСТВО · ВРУЧНУЮ</small><h3>'+esc(item.name)+'</h3>'+
 '<p>'+esc(item.kind)+' · до '+item.due.split('-').reverse().join('.')+'</p>'+
 statusLine(item)+(item.note?'<div class="dm-tax-note">'+esc(item.note)+'</div>':'')+
 '<p>Отметка «Выполнено» означает только ваше подтверждение. Мы не проверяем получение декларации ФНС или оплату в банке.</p>'+
 '<div class="dm-tax-actions">'+button(item.done?'reopen':'done',item.done?'Вернуть в работу':'✓ Отметить выполненным')+
 button('edit','✎ Исправить')+button('back','← Все сроки')+button('delete','Удалить')+'</div></section>'+official+caution;
}
function render(){
 $('dmTaxTitle').textContent=page==='profile'?'Мой налоговый режим':page==='edit'||page==='new'?'Срок и документы':'Налоговый контроль';
 overlay.querySelectorAll('[data-tax-page]').forEach(btn=>btn.setAttribute('aria-current',btn.dataset.taxPage===(page==='profile'?'profile':'list')?'page':'false'));
 $('dmTaxBody').innerHTML=(page==='profile'?profileForm():['edit','new'].includes(page)?deadlineForm():page==='detail'?detail():list())+
 (message?'<p class="dm-tax-message" role="status">'+esc(message)+'</p>':'');
 $('dmTaxBody').scrollTop=0;message='';
}
function open(to='list'){
 previousFocus=document.activeElement;page=to==='profile'?'profile':'list';selected='';
 overlay.hidden=false;render();
 overlay.querySelector('[data-tax-close]')?.focus({preventScroll:true});
}
function close(){
 if(overlay.hidden)return;
 overlay.hidden=true;
 if(previousFocus?.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});
}
card.addEventListener('click',()=>open());
mgEntry.addEventListener('click',()=>open('profile'));
overlay.addEventListener('click',e=>{
 if(e.target===overlay){close();return;}
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.hasAttribute('data-tax-close')){close();return;}
 if(btn.dataset.taxPage){page=btn.dataset.taxPage;selected='';render();return;}
 if(btn.dataset.taxEvent){selected=btn.dataset.taxEvent;page='detail';render();return;}
 const act=btn.dataset.taxAction;
 if(!act)return;
 if(act==='back'){page='list';selected='';render();return;}
 if(act==='new'){page='new';selected='';render();return;}
 if(act==='profile'){page='profile';selected='';render();return;}
 if(act==='edit'){page='edit';render();return;}
 const item=data.events.find(x=>x.id===selected);
 if(!item)return;
 if(act==='done'||act==='reopen'){
  if(act==='done'&&!window.confirm('Вы подтверждаете, что обязательство исполнено? Данные ФНС и банка не проверяются.'))return;
  item.done=act==='done';item.doneAt=item.done?Date.now():null;
  if(persist()){message=item.done?'Пометили выполненным вручную.':'Вернули в работу.';render();}
 }else if(act==='delete'){
  if(!window.confirm('Удалить эту запись срока с устройства?'))return;
  data.events=data.events.filter(x=>x.id!==selected);
  if(persist()){selected='';page='list';render();}
 }
});
overlay.addEventListener('submit',e=>{
 e.preventDefault();const f=e.target,fields=new FormData(f);
 if(f.id==='dmTaxProfileForm'){
  const entity=safe(fields.get('entity'),40),regime=safe(fields.get('regime'),30),region=safe(fields.get('region'),70);
  if(!entities.includes(entity)||!regimes.includes(regime)){message='Проверьте параметры режима.';render();return;}
  data.profile={entity,regime,region};
  if(persist()){message='Режим сохранён. Обязательные сроки ещё надо сверить.';page='profile';render();}
 }else if(f.id==='dmTaxDeadlineForm'){
  const name=safe(fields.get('name'),120),kind=safe(fields.get('kind'),40),due=safe(fields.get('due'),10),note=safe(fields.get('note'),800);
  if(!name||!types.includes(kind)||dueTime(due)===null){message='Проверьте название и действительную дату.';render();return;}
  const edit=data.events.find(x=>x.id===selected);
  if(edit){Object.assign(edit,{name,kind,due,note});}
  else{const row={id:'tax-'+unique(),name,kind,due,note,done:false,createdAt:Date.now()};data.events.unshift(row);selected=row.id;}
  data.events=data.events.slice(0,MAX);
  if(persist()){message='Срок сохранён. Он не проверен через ФНС.';page='detail';render();}
 }
});
overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
window.addEventListener('storage',e=>{if(e.key===KEY){data=load();update();if(!overlay.hidden)render();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
window.addEventListener('focus',update);
function routeQuestion(query){
 const q=safe(query,300).toLowerCase();
 if(!/(?:покажи|открой|проверь|напомни|когда|что|какие|срок|календарь)/.test(q)||
 !/налог|декларац|взнос|отч[её]тност|фнс/.test(q))return false;
 open();return true;
}
window.DMTaxControl=Object.freeze({open,refresh:update,snapshot,routeQuestion,source:'owner-entered-local-dates'});
update();
})();