/* Director Office v1 — real local approvals + gentle resumable acquaintance.
   No network service, accounting connection, bank authority or external execution. */
(()=>{
'use strict';
const KEY='dm-director-office-v1',DAY=86400000;
const $=selector=>document.querySelector(selector);
const escaped=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const clean=(x,n=220)=>String(x??'').replace(/\s+/g,' ').trim().slice(0,n);
const personName=()=>escaped(clean(window.DMUserProfile?.getName?.()||'Алексей',42));
const companyName=()=>escaped(clean(window.DMUserProfile?.getCompany?.()||'Моя компания',70));
const QUESTIONS=[
 {id:'business',label:'Чем занимается наша компания?',hint:'Можно одной фразой. Например: «Эвакуатор и помощь на дороге в Краснодаре».',kind:'text'},
 {id:'goal',label:'Какая главная цель сейчас?',options:['Больше клиентов и заказов','Повысить прибыль','Навести порядок в процессах','Открыть новое направление']},
 {id:'customers',label:'Откуда приходят клиенты?',options:['Звонки и сообщения','Сайт и заявки','Соцсети','Лично','Разные каналы']},
 {id:'team',label:'Кто работает в компании?',options:['Работаю один','Есть сотрудники','Есть управляющий и команда']},
 {id:'accountant',label:'Кто занимается бухгалтерией?',options:['Штатный бухгалтер','Бухгалтер на аутсорсе','Веду сам','Пока не знаю']},
 {id:'accounting',label:'В какой программе ведётся учёт?',options:['1С','Другая программа','Таблицы или документы','Пока не знаю']},
 {id:'bank',label:'Как обычно принимаются платежи?',options:['Банк и эквайринг','Банковские переводы','Наличные и смешанная оплата','Пока не знаю']},
 {id:'mail',label:'Есть рабочая электронная почта?',options:['Да, есть','Нет отдельной','Пока не знаю']},
 {id:'telephone',label:'Как устроены рабочие звонки?',options:['Телефония / АТС','Обычный рабочий номер','Звонков почти нет']},
 {id:'site',label:'Есть сайт компании?',options:['Да, работает','Сайт создаётся','Пока нет']},
 {id:'crm',label:'Где хранится клиентская база?',options:['CRM','Таблицы','Телефон и заметки','Пока не ведём']},
 {id:'social',label:'Где общаетесь с клиентами?',options:['В мессенджерах','В социальных сетях','И там и там','Почти не общаемся онлайн']},
 {id:'rights',label:'Какой уровень самостоятельности предпочитаете?',options:['Анализируй и готовь, решение за мной','Каждый шаг сначала согласуй','Обсудим полномочия позже']}
];
function empty(){return {version:1,answers:{},skipped:{},reminderAt:0,remindersOff:false,history:[],proposals:[],updatedAt:0};}
function load(){
 try{
  const v=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!v||v.version!==1||typeof v!=='object')return empty();
  return {...empty(),...v,
    answers:v.answers&&typeof v.answers==='object'?v.answers:{},
    skipped:v.skipped&&typeof v.skipped==='object'?v.skipped:{},
    history:Array.isArray(v.history)?v.history.slice(-45):[],
    proposals:Array.isArray(v.proposals)?v.proposals.filter(p=>p&&typeof p.id==='string').slice(-25):[]};
 }catch(_){return empty();}
}
let data=load(),view='desk',department='strategy',sessionSeen=new Set(),previousFocus=null,proposal=null,editorOpened=false;
const root=document.createElement('section');
root.className='dm-director-office';
root.id='dmDirectorOffice';
root.hidden=true;
root.innerHTML='<div class="dm-director-frame" role="dialog" aria-modal="true" aria-labelledby="dmDirectorTitle" tabindex="-1">'+
 '<header class="dm-director-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · ДИРЕКТОРСКАЯ</small><h2 id="dmDirectorTitle">На подпись</h2></div>'+
 '<button type="button" data-director-close aria-label="Закрыть">×</button></header>'+
 '<div id="dmDirectorBody" class="dm-director-body"></div></div>';
document.body.append(root);
function persist(){
 data.updatedAt=Date.now();
 try{localStorage.setItem(KEY,JSON.stringify(data));}
 catch(_){return false;}
 try{window.dispatchEvent(new Event('dm:director-updated'));}catch(_){}
 return true;
}
function businessText(){
 const existing=window.DMBusinessContext?.getProfile?.()?.description||'';
 const journey=window.DMBusinessJourney?.getPlan?.()?.description||'';
 return clean(data.answers.business||existing||journey,450);
}
function filled(key){return key==='business'?businessText():clean(data.answers[key]||'');}
function remaining(){return QUESTIONS.filter(q=>!filled(q.id));}
function progress(){return {answered:QUESTIONS.length-remaining().length,total:QUESTIONS.length,remaining:remaining().map(q=>q.id),reminderAt:data.reminderAt};}
function saveAnswer(id,answer){
 const q=QUESTIONS.find(x=>x.id===id);
 const value=clean(answer,q?.kind==='text'?500:120);
 if(!q||value.length<1||(q.kind!=='text'&&!q.options.includes(value)))return false;
 data.answers[id]=value;
 delete data.skipped[id];
 if(id==='business'&&value.length>=3)window.DMBusinessContext?.saveProfile?.(value);
 return persist();
}
function open(mode='desk',dept=null){
 previousFocus=document.activeElement;
 view=mode;
 if(dept)department=dept;
 sessionSeen=new Set();
 editorOpened=false;
 root.hidden=false;render();
 root.querySelector('[data-director-close]')?.focus({preventScroll:true});
}
function close(){
 if(root.hidden)return;
 root.hidden=true;sessionSeen=new Set();
 if(previousFocus?.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});
 refresh();
}
const circle='<span class="dm-circle-arrow dm-action-circle" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ic-chevron"/></svg></span>';
function button(action,label,extra=''){return '<button type="button" data-do="'+action+'"'+extra+'>'+label.replace(/↗/g,circle)+'</button>';}
function candidate(){
 const offered=data.proposals.find(p=>p&&p.id&&p.title);
 if(offered)return {...offered,origin:'workspace'};
 const tax=window.DMTaxControl?.snapshot?.();
 if(tax&&(tax.overdue>0||tax.urgent>0)){
  return {id:'tax-deadline-attention',kind:'tax',title:'Налоговый срок требует проверки',
   body:(tax.overdue?'В ваших записях просрочено обязательств: '+tax.overdue+'. ':'')+
    (tax.urgent?'В ближайшие 7 дней запланировано обязательств: '+tax.urgent+'. ':'')+
    'Даты введены вручную, не получены из ФНС. Надо сверить исполнение и актуальность сроков.',
   source:'Локальный «Налоговый контроль»: сроки директора',
   next:'Откроем календарь сроков. Не отмечайте «выполнено» без подтверждения.'};
 }
 const pendingTax=window.DMTaxControl?.snapshot?.();
 if(pendingTax?.nearest?.kind==='Декларация'&&
    pendingTax.nearest.left>=8&&pendingTax.nearest.left<=30){
  return {id:'tax-declaration-preparation',kind:'taxprep',title:'Могу помочь подготовить декларацию',
   body:'По вашему собственному налоговому календарю до срока декларации '+pendingTax.nearest.left+' дн. Я помогу собрать исходные данные, проверить режим и подготовиться к бесплатной подаче через ФНС.',
   source:'Вручную введённый срок в «Налоговом контроле»',
   next:'Сначала проверим, нужна ли декларация для вашего режима. Отправка в ФНС и электронная подпись ещё не подключены.'};
 }
 const missing=remaining(),context=businessText();
 const serious=window.DMBusinessBrain?.brief?.()?.priority;
 // A real saved task or sales signal takes precedence over a generic suggestion.
 if(serious&&(serious.title||serious.text)){
  const t=clean(serious.title||serious.text,85);
  const b=clean(serious.body||serious.text||serious.next||'Есть запись, на которую стоит обратить внимание.',450);
  return {id:'observed:'+clean(serious.id||t,55),kind:'review',title:t,body:b,
    source:'Фактические записи в приложении',next:clean(serious.next||'Предлагаю проверить данные и подготовить решение.',220)};
 }
 const inboxSummary=window.DMDirectorWorkspace?.summary?.();
 if(inboxSummary?.awaiting>0){
  return {id:'workspace-inbox-attention',kind:'inbox',title:'Входящие требуют внимания',
   body:'Среди вручную сохранённых обращений '+inboxSummary.awaiting+' ожидают ответа'+
     (inboxSummary.important?' · '+inboxSummary.important+' требуют дополнительной проверки':'')+
     '. Подключённой почты и сообщений соцсетей пока нет.',
   source:'Локальные записи «Единых входящих»',
   next:'Я могу помочь подготовить ответы и принести их на подпись.'};
 }
 if(!context){
  const deferred=data.reminderAt>Date.now()||data.remindersOff;
  return deferred?
   {id:'awaiting-context',kind:'gap',title:'Готов принять дела',body:'Пока у меня нет описания вашей компании. Я не буду придумывать показатели или торопить с вопросами. Когда удобно, продолжим знакомство в Управлении.',
    source:'Знакомство отложено по вашему выбору',next:'Можно продолжить в любой момент.'}:
   {id:'intro',kind:'intro',title:'Давайте познакомимся',body:'Расскажите, чем занимается компания. Я буду постепенно изучать дело, чтобы приносить на подпись полезные решения.',
    source:'Данных о бизнесе пока недостаточно',next:'Можно отвечать постепенно и продолжить позже в настройках.'};
 }
 if(missing.length&&(data.reminderAt===0||Date.now()>=data.reminderAt)&&!data.remindersOff)
  return {id:'continue',kind:'intro',title:'Продолжим знакомство?',body:'Я уже знаю кое-что о компании, но '+missing.length+' '+(missing.length===1?'вопрос остался':'вопросов осталось')+' без ответа. Чем лучше знаю процессы, тем полезнее мои решения.',
    source:'Сохранённые ответы директора',next:'Достаточно ответить на один вопрос; остальное можно отложить.'};
 if(data.answers.accounting==='1С')
  return {id:'link-1c',kind:'connection',title:'Советую подключить 1С',body:'Вы указали, что работаете с 1С. Доступ только для чтения помог бы сопоставлять документы с заказами и банковскими поступлениями. Сейчас интеграция с 1С не подключена.',
    source:'Ваш ответ о бухгалтерии',next:'Сначала нужно уточнить конфигурацию 1С и доступные безопасные способы подключения.'};
 if(data.answers.mail==='Да, есть')
  return {id:'link-mail',kind:'connection',title:'Советую подключить почту',body:'С рабочей почтой смогу помогать замечать заявки и договорённости. Сейчас у меня нет доступа к письмам.',
    source:'Ваш ответ о рабочей почте',next:'Предусмотрим подключение через безопасную авторизацию с разрешения владельца.'};
 return {id:'connect',kind:'connection',title:'Хочу лучше узнать ваш бизнес',body:'Я знаю основное из наших разговоров. Следующий шаг — подключать рабочие источники по одному: почту, заявки, учёт и платежи. Пока никаких внешних данных я не читаю.',
  source:'Сохранённое описание компании',next:'Начнём с того источника, где больше всего обращений и ручной работы.'};
}
function propose(details){
 if(!details||!/^((inbox|deal):)[a-z0-9-]+$/i.test(String(details.id||'')))return false;
 const p={id:clean(details.id,110),kind:details.kind==='message'?'message':'briefing',
 title:clean(details.title,110),body:clean(details.body,550),
 source:clean(details.source,160),next:clean(details.next,240)};
 if(!p.title||!p.body)return false;
 data.proposals=data.proposals.filter(x=>x.id!==p.id);
 data.proposals.unshift(p);data.proposals=data.proposals.slice(0,25);
 const done=persist();if(done)refresh();return done;
}
function clearProposal(id){
 data.proposals=data.proposals.filter(x=>x.id!==id);persist();
}
function dismiss(id){
 if(!data.proposals.some(p=>p.id===id))return false;
 clearProposal(id);refresh();return true;
}
function entryFor(p){return data.history.find(x=>x.proposalId===p.id&&!['revised','dismissed'].includes(x.status))||null;}
function ledger(status,p,notes=''){
 const stamp=Date.now();
 const item={id:'approval-'+stamp+'-'+Math.random().toString(36).slice(2,7),proposalId:p.id,
  title:p.title,kind:p.kind,status,notes:clean(notes,600),source:p.source,
  at:stamp,steps:[{at:stamp,status,notes:clean(notes,600)}]};
 data.history.push(item);
 data.history=data.history.slice(-45);
 persist();
 return item;
}
function historyMarkup(){
 const a=data.history.slice().reverse().slice(0,8);
 return '<section class="dm-director-history"><h3>История директорских решений</h3>'+
 (a.length?a.map(x=>'<article><strong>'+escaped(x.title)+'</strong><small>'+
  escaped(x.status==='blocked'?'Согласовано · ждёт подключения':x.status==='revised'?'Исправление сохранено':
   x.status==='dismissed'?'Отложено':x.status==='approved'?'Согласовано':'В работе')+
  ' · '+new Date(x.at).toLocaleDateString('ru-RU')+'</small>'+
  (x.notes?'<p>'+escaped(x.notes)+'</p>':'')+'</article>').join(''):
  '<p>Пока решений нет. Здесь будут подписи, исправления и результаты — без выдуманного исполнения.</p>')+
 '</section>';
}
function deskMarkup(){
 proposal=candidate();
 const p=proposal,progressText=progress();
 return '<section class="dm-director-proposal"><small>✦ НА СОГЛАСОВАНИЕ</small><h3>'+escaped(p.title)+'</h3>'+
 '<p>'+escaped(p.body)+'</p><div class="dm-director-evidence"><strong>Основание:</strong> '+escaped(p.source)+'</div>'+
 '<p class="dm-director-next">'+escaped(p.next)+'</p>'+
 '<div class="dm-director-actions">'+button('approve','✓ Исполнить')+button('revise','✎ Исправить')+button('later','Позже')+'</div></section>'+
 '<div class="dm-director-sidenote">«Исполнить» означает согласовать показанное действие. Без подключённых сервисов я не стану изображать, что выполнил работу снаружи.</div>'+
 '<section class="dm-director-minor"><strong>Знакомство с бизнесом: '+progressText.answered+' из '+progressText.total+'</strong>'+
 '<p>Неоконченные ответы не потеряются. '+(progressText.remaining.length?'Можно продолжить с любого места в «Управлении».':'Основные вопросы заполнены.')+'</p>'+
 button('intro','Продолжить знакомство ↗')+'</section>'+historyMarkup();
}
function nextQuestion(){
 const unanswered=remaining().filter(q=>!sessionSeen.has(q.id));
 // Ask entirely new questions before revisiting something the director skipped.
 return unanswered.find(q=>!data.skipped[q.id])||unanswered[0]||null;
}
function introMarkup(){
 const p=progress(),q=nextQuestion();
 if(!q)return '<section class="dm-director-welcome"><small>ЗНАКОМСТВО С БИЗНЕСОМ</small><h3>На сегодня всё, '+personName()+'! ☕</h3><p>'+
 (p.remaining.length?'Я запомнил '+p.remaining.length+' незаполненных пунктов. Вернёмся к ним позже — ответы уже сохранены.':'Вы рассказали обо всех основных направлениях. Спасибо!')+
 '</p>'+button('desk','К решениям ↗')+button('close','Закрыть')+'</section>';
 const idx=QUESTIONS.indexOf(q)+1;
 let control='';
 if(q.kind==='text')control='<form id="dmDirectorQuestion" data-question="'+q.id+'"><label for="dmDirectorAnswer">'+escaped(q.label)+'</label>'+
 '<p>'+escaped(q.hint||'')+'</p><textarea id="dmDirectorAnswer" name="answer" maxlength="500" rows="3" placeholder="Можно коротко своими словами" required>'+escaped(filled(q.id))+'</textarea>'+
 '<div class="dm-director-actions"><button type="submit">Сохранить и дальше '+circle+'</button></div></form>';
 else control='<h3>'+escaped(q.label)+'</h3><div class="dm-director-choices">'+q.options.map((x,i)=>button('option',escaped(x),' data-choice="'+i+'"')).join('')+'</div>';
 return '<section class="dm-director-welcome"><small>ЗНАКОМСТВО · ВОПРОС '+idx+' ИЗ '+QUESTIONS.length+
 '</small><p class="dm-director-progress">'+p.answered+' из '+p.total+' уже известно · '+p.remaining.length+' ещё можно уточнить</p>'+
 '<p>'+personName()+', хочу лучше понять ваш бизнес — «'+companyName()+'». Ответьте, как удобно; лишнего спрашивать не буду. 😁</p>'+
 control+'<div class="dm-director-secondary">'+button('skip','Пропустить')+button('pause','Продолжить позже')+'</div>'+
 '<p class="dm-director-muted">Всё сохраняется только в этом браузере. Пропущенное можно дополнять в «Управлении → Знакомство».</p></section>';
}
const AREAS={
 strategy:{name:'Стратегия',text:'Я помогаю искать направления роста и проверять гипотезы. Сейчас опираюсь на ваши сохранённые записи, а не на выдуманный анализ конкурентов.'},
 clients:{name:'Клиенты',text:'Могу отслеживать занесённые обращения, готовить ответы и искать незавершённые договорённости. Для автоматического чтения почты, звонков и CRM потребуется разрешённое подключение.'},
 finance:{name:'Финансы',text:'Я различаю записанные продажи, расходы и подтверждённые поступления. Для сверки бухгалтерии понадобятся реальные данные 1С и банка — сейчас их нет.'},
 automation:{name:'Автоматизация',text:'Я могу предложить сценарии и подготовить черновики. Самостоятельная отправка сообщений, платежи и изменения внешних систем пока не подключены.'}
};
function deptMarkup(){
 const d=AREAS[department]||AREAS.strategy;
 const actual=window.DMWorkflowCore?.snapshot?.();
 let fact='';
 if(actual&&department==='clients')fact='По сохранённым записям: обращений в работе — '+actual.inquiries+'.';
 if(actual&&department==='automation')fact='В очереди управляющего — '+actual.assistantQueue+'. Очередь не равна выполнению.';
 return '<section class="dm-director-proposal"><small>ОТДЕЛ УПРАВЛЯЮЩЕГО</small><h3>'+d.name+'</h3><p>'+d.text+'</p>'+
 (fact?'<div class="dm-director-evidence">'+escaped(fact)+'</div>':'')+
 '<p>Главные решения этого отдела поступают на золотую карточку.</p>'+
 '<div class="dm-director-actions">'+button('desk','На подпись ↗')+button('intro','Уточнить сведения')+'</div></section>';
}
function revisionMarkup(){
 proposal=proposal||candidate();
 return '<section class="dm-director-proposal"><small>ИСПРАВИТЬ РЕШЕНИЕ</small><h3>'+escaped(proposal.title)+'</h3>'+
 '<p>'+personName()+', что изменить? Одного замечания достаточно; я сохраню его вместе с предложением. Настоящая генерация новой версии ИИ потребует подключения.</p>'+
 '<form id="dmDirectorRevision"><label for="dmDirectorRevisionText">Ваше замечание</label><textarea id="dmDirectorRevisionText" maxlength="600" required rows="4" placeholder="Например: не предлагай скидки, сначала проверь расходы"></textarea>'+
 '<div class="dm-director-actions"><button type="submit">Сохранить замечание '+circle+'</button>'+button('desk','Отмена')+'</div></form></section>';
}
function resultMarkup(){
 const item=data.history.at(-1),status=item?.status;
 const report=status==='approved'
 ?'Вы согласовали материал. Письма и сообщения не отправлены; для отправки нужен подключённый сервис или отдельное действие человека.'
 :status==='blocked'?'Поручение согласовано, но внешнее выполнение ещё недоступно и не подтверждено.'
 :'Замечание сохранено. Чтобы подготовить новую версию, потребуется дополнительная работа.';
 return '<section class="dm-director-proposal"><small>РЕШЕНИЕ ЗАФИКСИРОВАНО</small><h3>'+
 escaped(item?.title||'Поручение')+'</h3><p>'+report+'</p><div class="dm-director-evidence">Статус: '+
 (status==='approved'?'Одобрено · не отправлено':status==='blocked'?'Ожидает подключения / исполнителя':'Нужно переработать')+
 '</div><p>'+escaped(item?.notes||'')+'</p>'+button('desk','Вернуться к рекомендациям')+'</section>'+historyMarkup();
}
function render(){
 const title=$('#dmDirectorTitle'),body=$('#dmDirectorBody');
 const titles={desk:'Директорская подпись',intro:'Знакомство с бизнесом',department:'Мои отделы',revision:'Исправление решения',result:'Поручение директора'};
 title.textContent=titles[view]||titles.desk;
 body.innerHTML=view==='intro'?introMarkup():view==='department'?deptMarkup():view==='revision'?revisionMarkup():view==='result'?resultMarkup():deskMarkup();
 body.scrollTop=0;refreshSettings();
}
function refreshSettings(){
 const btn=$('#dmDirectorSetupEntry');if(!btn)return;
 const p=progress();
 const copy=btn.querySelector('small'),label=btn.querySelector('strong');
 if(label)label.textContent=p.remaining.length?'Продолжить знакомство':'Мой бизнес · познакомились';
 if(copy)copy.textContent=p.remaining.length?'Осталось уточнить '+p.remaining.length+' из '+p.total+' · ответы сохранены':'Основные сведения сохранены · можно проверить и дополнить';
}
function refreshGold(){
 const p=candidate();
 const card=$('#homeScreen .recommendation-card');
 if(!card)return;
 const heading=card.querySelector('.advice-head'),body=card.querySelector('.advice-body');
 if(heading)heading.textContent=clean(p.title,52);
 if(body)body.textContent=clean(p.body,96);
 const cta=card.querySelector('#openAdvice');
 // Only a real prepared item from the director's proposal queue is ready
 // for signature. Advice, reminders and demo content are NOT signatures.
 const ready=p.origin==='workspace'&&data.proposals.some(item=>item.id===p.id);
 card.dataset.signatureState=ready?'ready':'idle';
 card.setAttribute('aria-label',ready?
  'Рекомендация управляющего. Есть подготовленное решение на подпись.':
  'Рекомендация управляющего. Решений на подпись сейчас нет.');
 if(cta){
  cta.dataset.signatureState=ready?'ready':'idle';
  cta.setAttribute('aria-label',ready?
   'Открыть подготовленное решение на подпись':
   'Открыть советы управляющего. Решений на подпись пока нет.');
  cta.title=ready?'Решение ждёт согласования директора':'Подготовленных решений на подпись пока нет';
  const textNode=[...cta.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
  if(textNode)textNode.textContent='На подпись ';
 }
}
function refresh(){refreshSettings();refreshGold();}
function createSettingsEntry(){
 const mg=$('#mgHome');if(!mg||$('#dmDirectorSetupEntry'))return;
 const btn=document.createElement('button');
 btn.type='button';btn.id='dmDirectorSetupEntry';btn.className='dm-director-settings-entry';
 btn.innerHTML='<span class="dm-director-mark" aria-hidden="true">✦</span><span><strong>Продолжить знакомство</strong><small>Ваши ответы сохраняются</small></span>'+
 '';
 const manager=mg.querySelector('.mg-manager');
 if(manager)manager.after(btn);else mg.prepend(btn);
 btn.addEventListener('click',()=>open('intro'));
 refreshSettings();
}
function approve(){
 const p=proposal||candidate();
 if(p.kind==='intro'){view='intro';sessionSeen=new Set();render();return;}
 if(p.kind==='gap'){view='intro';sessionSeen=new Set();render();return;}
 if(p.kind==='inbox'){
  close();window.DMDirectorWorkspace?.open?.('inbox');return;
 }
 if(p.kind==='tax'){
  close();window.DMTaxControl?.open?.();return;
 }
 if(p.kind==='taxprep'){
  close();window.DMTaxControl?.prepare?.();return;
 }
 if(p.origin==='workspace'){
  ledger('approved',p,p.kind==='message'?
    'Подготовленный ответ одобрен. Ни одного сообщения не отправлено. Одобренный текст доступен в «Входящих» для копирования.':
    'Директор одобрил проверку условий. Это не означает принятие оферты, подписание договора или проверку контрагента.');
  clearProposal(p.id);
  window.dispatchEvent(new CustomEvent('dm:director-approved',{detail:{proposalId:p.id,kind:p.kind}}));
  view='result';render();refresh();return;
 }
 ledger('blocked',p,p.kind==='connection'?
  'Разрешение на подготовку идеи зафиксировано. Для реальной интеграции необходим официальный интерфейс, настройка прав и отдельное подтверждение. Ничего не подключено.':
  'Поручение принято в директорский журнал. Чтобы действительно решить задачу, требуется доступ к нужному инструменту или действие человека. Результат не подтверждён.');
 view='result';render();refresh();
}
function postpone(){
 if(!proposal)proposal=candidate();
 if(proposal.kind==='intro')data.reminderAt=Date.now()+7*DAY;
 ledger('dismissed',proposal,'Отложено директором, без каких-либо действий.');
 if(proposal.origin==='workspace')clearProposal(proposal.id);
 view='desk';render();refresh();
}
root.addEventListener('click',event=>{
 if(event.target===root){close();return;}
 const el=event.target.closest('[data-director-close],[data-do]');
 if(!el)return;
 if(el.hasAttribute('data-director-close')){close();return;}
 const act=el.dataset.do;
 if(act==='close')return close();
 if(act==='desk'){view='desk';render();return;}
 if(act==='intro'){view='intro';sessionSeen=new Set();render();return;}
 if(act==='revise'){proposal=candidate();view='revision';render();return;}
 if(act==='approve')return approve();
 if(act==='later')return postpone();
 if(act==='pause'){
  data.reminderAt=Date.now()+7*DAY;
  persist();view='desk';render();refresh();return;
 }
 if(act==='skip'){
  const q=nextQuestion();if(!q)return;
  data.skipped[q.id]=Date.now();sessionSeen.add(q.id);
  data.reminderAt=Date.now()+7*DAY;
  persist();render();refresh();return;
 }
 if(act==='option'){
  const q=nextQuestion(),choice=Number(el.dataset.choice);
  if(!q?.options?.[choice])return;
  if(saveAnswer(q.id,q.options[choice])){sessionSeen.add(q.id);render();refresh();}
 }
});
root.addEventListener('submit',event=>{
 event.preventDefault();
 if(event.target.id==='dmDirectorQuestion'){
  const q=nextQuestion(),val=event.target.elements.answer?.value;
  if(q&&saveAnswer(q.id,val)){sessionSeen.add(q.id);render();refresh();}
  return;
 }
 if(event.target.id==='dmDirectorRevision'){
  const value=clean(event.target.querySelector('textarea')?.value,600);
  if(value.length<3)return;
  ledger('revised',proposal||candidate(),value);
  view='result';render();refresh();
 }
});
root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
document.addEventListener('click',event=>{
 const btn=event.target.closest('#openAdvice,#homeScreen .recommendation-card .rec-chevron,.shortcuts .shortcut[data-action]');
 if(!btn||!root.hidden||document.documentElement.classList.contains('dm-layout-editing'))return;
 const action=btn.dataset.action;
 if(action&&['strategy','clients','finance','automation'].includes(action)){
  event.preventDefault();event.stopImmediatePropagation();
  open('department',action);return;
 }
 if(btn.id==='openAdvice'||btn.matches('.rec-chevron')){
  event.preventDefault();event.stopImmediatePropagation();open('desk');
 }
},true);
for(const ev of ['dm:sales-changed','dm:sales-insight-changed','dm:business-context-changed','dm:journal-changed','dm:personal-tasks-changed']){
 window.addEventListener(ev,()=>queueMicrotask(refresh));
}
window.addEventListener('storage',event=>{if(event.key===KEY){data=load();refresh();}});
window.addEventListener('dm:tax-changed',()=>queueMicrotask(refresh));
window.addEventListener('dm:workspace-updated',()=>queueMicrotask(refresh));
window.addEventListener('dm:profile-changed',()=>{if(!root.hidden)render();refresh();});
window.DMDirectorOffice=Object.freeze({open,close,progress,refresh,propose,dismiss,proposal:candidate,getAnswers:()=>({...data.answers})});
createSettingsEntry();
refresh();
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(refresh),{once:true});
})();