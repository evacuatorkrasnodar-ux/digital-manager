/* Director Workspace v1: honest local unified inbox + briefing and negotiation desk.
   No mailbox OAuth, API sending, background transcription or counterparty lookup. */
(()=>{
'use strict';
const KEY='dm-director-workspace-v1',MAX_INBOX=80,MAX_PLANS=30;
const $=id=>document.getElementById(id);
const safe=(v,max=280)=>String(v??'').trim().slice(0,max);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const date=t=>new Date(t).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const makeId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const channels=['Почта','Telegram','ВКонтакте','Сайт','Другое'];
function cleanState(){
 return {version:1,inbox:[],briefs:[],negotiations:[],updatedAt:0};
}
function load(){
 try{
  const d=JSON.parse(localStorage.getItem(KEY)||'null');
  if(d?.version!==1)return cleanState();
  return {...cleanState(),inbox:Array.isArray(d.inbox)?d.inbox.slice(0,MAX_INBOX):[],
    briefs:Array.isArray(d.briefs)?d.briefs.slice(0,MAX_PLANS):[],
    negotiations:Array.isArray(d.negotiations)?d.negotiations.slice(0,MAX_PLANS):[]};
 }catch(_){return cleanState();}
}
let data=load(),screen='inbox',mode='list',selected='',focusBefore=null,notification='',spoken=false;
function save(){
 const next={...data,updatedAt:Date.now()};
 try{localStorage.setItem(KEY,JSON.stringify(next));data=next;updateCards();window.dispatchEvent(new Event('dm:workspace-updated'));return true;}
 catch(_){notification='Не удалось сохранить в этом браузере. Возможно, мало свободного места.';return false;}
}
function classify(item){
 const body=(item.title+' '+item.body).toLowerCase();
 if(/сроч|сегодня|жалоб|претензи|неустойк|штраф|мошен|предоплат|расторжен|опасн|нарушен|долг/.test(body))return {name:'Нужно проверить',urgent:true};
 if(/сч[её]т|договор|коммерческ|сотрудничест|предложен|поставк|оплат|прайс|цен[ауе]|заказ|эвакуатор/.test(body))return {name:'По делу',urgent:false};
 return {name:'Новое обращение',urgent:false};
}
function initialReply(m){
 const tag=classify(m);
 const name=safe(m.sender,65);
 const welcome=name?'Здравствуйте, '+name+'!':'Здравствуйте!';
 if(tag.urgent)return welcome+'\n\nСпасибо за сообщение. Мы получили ваш вопрос и уточняем обстоятельства. Вернёмся с ответом после проверки.\n\nС уважением,\nКоманда компании';
 if(tag.name==='По делу')return welcome+'\n\nБлагодарим за обращение! Чтобы подготовить точное предложение, уточните, пожалуйста, удобные сроки и подробности задачи. Мы вернёмся с ответом после согласования условий.\n\nС уважением,\nКоманда компании';
 return welcome+'\n\nСпасибо за ваше сообщение! Мы ознакомимся с вопросом и вернёмся с ответом.\n\nС уважением,\nКоманда компании';
}
const entries=()=>data.inbox.filter(x=>x&&x.id&&typeof x.body==='string');
function updateCards(){
 const waiting=entries().filter(x=>x.status==='new'||x.status==='draft'||x.status==='approval').length;
 const urgent=entries().filter(x=>x.status!=='archived'&&classify(x).urgent).length;
 if($('dmWorkspaceInboxCount'))$('dmWorkspaceInboxCount').textContent=waiting?waiting+' требуют ответа':'Нет ожидающих ответов';
 if($('dmWorkspaceInboxStatus'))$('dmWorkspaceInboxStatus').textContent=entries().length?
   (urgent?urgent+' важных · ':'')+'Записи добавлены вручную · почта пока не подключена':
   'Подключения впереди · пока можно добавить обращение вручную';
 const recent=data.briefs[0];
 if($('dmWorkspaceBriefStatus'))$('dmWorkspaceBriefStatus').textContent=recent?'План сохранён '+date(recent.at):'Планёрка и переговоры · подготовка директора';
}
const card=(id,icon,title,text,count)=>'<button type="button" id="'+id+'" class="dm-workspace-card" aria-label="'+title+' — открыть">'+
 '<span class="dm-workspace-emblem" aria-hidden="true">'+icon+'</span><span class="dm-workspace-copy"><strong>'+title+'</strong>'+
 '<small id="'+text+'">'+(count||'')+'</small><em id="'+(id==='dmWorkspaceInboxCard'?'dmWorkspaceInboxCount':'dmWorkspaceBriefStatus')+'"></em></span>'+
 '<span class="dm-workspace-arrow" aria-hidden="true">↗</span></button>';
const dashboard=document.querySelector('#homeScreen .dashboard');
const quick=dashboard?.querySelector('.shortcuts');
if(!dashboard||!quick)return;
const inboxCard=document.createElement('div');
inboxCard.innerHTML=card('dmWorkspaceInboxCard','✉','Входящие','dmWorkspaceInboxStatus','Единое место для обращений');
const briefCard=document.createElement('div');
briefCard.innerHTML=card('dmWorkspaceBriefCard','✦','Штаб директора','dmWorkspaceBriefHint','Планёрки · встречи · переговоры');
const inbox=inboxCard.firstElementChild,brief=briefCard.firstElementChild;
quick.after(inbox,brief);

const overlay=document.createElement('section');overlay.id='dmWorkspaceOverlay';overlay.className='dm-workspace-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="dm-workspace-frame" role="dialog" aria-modal="true" aria-labelledby="dmWorkspaceTitle" tabindex="-1">'+
 '<header class="dm-workspace-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · РАБОЧИЙ СТОЛ</small><h2 id="dmWorkspaceTitle">Входящие</h2></div><button type="button" data-ws-close aria-label="Закрыть">×</button></header>'+
 '<nav class="dm-workspace-tabs" aria-label="Рабочие инструменты"><button type="button" data-ws-screen="inbox">✉ Входящие</button><button type="button" data-ws-screen="brief">☀ Планёрка</button><button type="button" data-ws-screen="meeting">🤝 Переговоры</button></nav>'+
 '<div id="dmWorkspaceBody" class="dm-workspace-body"></div></div>';
document.body.append(overlay);
const body=()=> $('dmWorkspaceBody');
const btn=(act,label,extra='')=>'<button type="button" data-ws="'+act+'"'+extra+'>'+label+'</button>';
const note='<p class="dm-workspace-honest">Работает локально на этом устройстве. Подключения к почте, соцсетям, микрофону и внешняя отправка пока отсутствуют.</p>';
function open(where='inbox',itemId=''){
 focusBefore=document.activeElement;screen=where;mode=itemId?'detail':'list';selected=itemId;notification='';
 overlay.hidden=false;render();overlay.querySelector('[data-ws-close]')?.focus({preventScroll:true});
}
function close(){
 if(overlay.hidden)return;
 if(window.speechSynthesis)window.speechSynthesis.cancel();spoken=false;
 overlay.hidden=true;
 if(focusBefore?.isConnected&&typeof focusBefore.focus==='function')focusBefore.focus({preventScroll:true});
}
const statusText=x=>({new:'Новое',draft:'Черновик',approval:'На подпись',approved:'Одобрено, не отправлено',archived:'Завершено вручную'}[x]||'Записано');
function inboxList(){
 const items=entries().slice();
 return '<div class="dm-workspace-intro"><h3>Все обращения — в одном месте</h3>'+
 '<p>Когда появятся реальные подключения, управляющий сможет собирать письма и заявки автоматически. Сейчас можно сохранить обращение и подготовить на него ответ.</p>'+
 btn('new-message','+ Добавить обращение')+'</div>'+
 (items.length?'<div class="dm-workspace-list">'+items.map(m=>'<button type="button" class="dm-workspace-row" data-ws-message="'+esc(m.id)+'">'+
 '<span><strong>'+esc(m.title||'Без темы')+'</strong><small>'+esc(m.sender||'Контакт не указан')+' · '+esc(m.channel)+'</small></span>'+
 '<span class="dm-workspace-row-meta">'+esc(statusText(m.status))+'<small>'+date(m.at)+'</small></span></button>').join('')+'</div>':
 '<section class="dm-workspace-empty"><strong>Пока нет обращений</strong><p>Не показываю выдуманные письма. При подключении почты и других каналов здесь появится реальная переписка.</p></section>')+note;
}
function messageForm(){
 return '<form id="dmWorkspaceMessageForm"><small class="dm-ws-eyebrow">НОВОЕ ОБРАЩЕНИЕ · ВРУЧНУЮ</small><h3>Сохраним сообщение</h3>'+
 '<label>Откуда пришло<select name="channel">'+channels.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
 '<label>От кого<input name="sender" maxlength="80" placeholder="Имя или компания"></label>'+
 '<label>Тема<input name="title" maxlength="110" placeholder="Например: запрос на сотрудничество" required></label>'+
 '<label>Текст сообщения<textarea name="body" rows="6" maxlength="4000" placeholder="Вставьте обращение клиента…" required></textarea></label>'+
 '<div class="dm-workspace-actions"><button type="submit">Сохранить и разобрать ↗</button>'+btn('back','Отмена')+'</div>'+
 '<p class="dm-workspace-honest">Не копируйте сюда пароли, реквизиты карт или ненужные персональные данные.</p></form>';
}
function messageDetail(){
 const m=entries().find(x=>x.id===selected);
 if(!m){mode='list';return inboxList();}
 const tag=classify(m);
 return '<section class="dm-workspace-detail"><small class="dm-ws-eyebrow">'+esc(m.channel)+' · '+date(m.at)+' · '+esc(tag.name)+'</small>'+
 '<h3>'+esc(m.title)+'</h3><p>Отправитель: '+esc(m.sender||'не указан')+'</p>'+
 '<div class="dm-workspace-quote">'+esc(m.body)+'</div>'+
 '<p class="dm-workspace-honest">Пометка «'+esc(tag.name)+'» получена простыми локальными правилами, не является проверкой фактов или анализом нейросети.</p>'+
 '<label>Черновик ответа — директор может исправить<textarea id="dmWorkspaceReply" rows="7" maxlength="4000">'+esc(m.draft||initialReply(m))+'</textarea></label>'+
 '<p class="dm-workspace-honest">Статус: '+statusText(m.status)+'. Одобрение не отправляет сообщение. Внешняя отправка потребует отдельного подключения.</p>'+
 '<div class="dm-workspace-actions">'+btn('save-draft','Сохранить правки')+btn('request-approval','На подпись директору')+
 (m.status==='approved'?btn('copy-reply','Скопировать одобренный ответ'):'')+
 btn('back','← К обращениям')+'</div>'+
 '<div class="dm-workspace-actions">'+btn('manual-close','Отметить завершённым вручную')+btn('delete-message','Удалить запись')+'</div></section>'+note;
}
function makeAgenda(){
 const snapshot=window.DMWorkflowCore?.snapshot?.();
 const insight=window.DMBusinessBrain?.brief?.();
 const tasks=snapshot?.ownerTasks||0,overdue=snapshot?.tasksOverdue||0,today=snapshot?.tasksDueToday||0,queue=snapshot?.assistantQueue||0;
 const todayDate=new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
 return 'ПЛАНЁРКА · '+todayDate+'\n\n'+
 '1. Начнём с главного. Проверим, что действительно выполнено вчера, и что мешает работе сегодня.\n'+
 (snapshot?'2. Из записей приложения: '+tasks+' личных дел, из них '+today+' на сегодня'+(overdue?', просрочено '+overdue:'')+'; управляющему передано '+queue+' поручений. Это не внешняя проверка.\n':
 '2. Пока у меня нет подтверждённых записей о выполненной работе. Спросим ответственных о фактах.\n')+
 '3. '+safe(insight?.headline||'Обсудим текущие обращения и сроки.',190)+'.\n'+
 '4. Каждый сотрудник называет одну главную задачу, ожидаемый результат и срок.\n'+
 '5. Выявляем, где нужна помощь директора, и подтверждаем поручения.\n\n'+
 'В завершение: благодарю команду. Договорённости запишем и проверим по фактическому выполнению.';
}
function briefing(){
 const prepared=data.briefs.slice(0,8);
 return '<div class="dm-workspace-intro"><h3>Утренняя планёрка</h3><p>Я соберу речь по доступным записям о делах. Не буду придумывать результаты сотрудников. План можно исправить, сохранить, скопировать или озвучить на этом устройстве.</p>'+
 '<div class="dm-workspace-actions">'+btn('make-agenda','✦ Подготовить планёрку')+btn('week','План на неделю')+'</div></div>'+
 (prepared.length?'<section class="dm-workspace-list"><h3>Сохранённые планы</h3>'+prepared.map(x=>'<button class="dm-workspace-row" type="button" data-ws-plan="'+esc(x.id)+'"><span><strong>'+esc(x.title)+'</strong><small>'+esc(date(x.at))+'</small></span><span>↗</span></button>').join('')+'</section>':'')+note;
}
function planEditor(){
 const p=data.briefs.find(x=>x.id===selected),text=p?p.text:makeAgenda();
 return '<section class="dm-workspace-detail"><small class="dm-ws-eyebrow">ШТАБ ДИРЕКТОРА · ПЛАНЁРКА</small><h3>'+esc(p?.title||'Подготовленная планёрка')+'</h3>'+
 '<label>Проверьте и исправьте план<textarea id="dmWorkspaceAgendaText" rows="13" maxlength="8000">'+esc(text)+'</textarea></label>'+
 '<div class="dm-workspace-actions">'+btn('save-plan','Сохранить план')+btn('copy-plan','Скопировать')+btn('speak-plan','▶ Озвучить')+
 btn('stop-speech','■ Остановить')+btn('back','← К планёркам')+'</div>'+
 '<p class="dm-workspace-honest">Озвучивание выполняется голосовым движком устройства по нажатию. Оно не проводит видеосовещание и не отправляет поручения сотрудникам.</p></section>';
}
function dealQuestions(text){
 const t=text.toLowerCase(),warnings=[];
 if(/предоплат|аванс|впер[её]д оплат/.test(t))warnings.push('Есть тема предоплаты: уточните получателя, возврат, обеспечение и условия возврата денег.');
 if(/штраф|пен[ия]|неустойк/.test(t))warnings.push('Есть штрафы или пени: уточните точный размер и симметричность ответственности.');
 if(/расторж|продлен|автоматически/.test(t))warnings.push('Проверьте порядок расторжения и автоматического продления договора.');
 if(/кредит|процент|ставк|займ|заём/.test(t))warnings.push('Проверьте полную стоимость финансирования, срок, дополнительные комиссии и обеспечение.');
 if(/ндс|налог/.test(t))warnings.push('Уточните, включён ли НДС в цену и как оформляются документы.');
 if(/срочно подп|только сегодня|немедленно перев/.test(t))warnings.push('Собеседник торопит с решением: не подписывайте, пока не проверены важные условия.');
 if(!warnings.length)warnings.push('Проверьте цену, сроки оплаты, предмет договора, ответственность, порядок выхода и полномочия подписанта.');
 return warnings;
}
function negotiationForm(){
 return '<form id="dmWorkspaceNegotiationForm" class="dm-workspace-detail">'+
 '<small class="dm-ws-eyebrow">ПЕРЕГОВОРЫ · ПОДГОТОВКА</small><h3>Разберём предложение партнёра</h3>'+
 '<label>С кем переговоры?<input name="partner" maxlength="120" placeholder="Название компании или представитель" required></label>'+
 '<label>Что предлагает и на каких условиях?<textarea name="offer" rows="7" maxlength="5000" placeholder="Договор, цены, предоплата, штрафы, сроки или заметки разговора…" required></textarea></label>'+
 '<label>Что важно для вас?<textarea name="goal" rows="3" maxlength="1500" placeholder="Например: прибыль не ниже…, оплата не позднее…"></textarea></label>'+
 '<div class="dm-workspace-actions"><button type="submit">Разобрать условия ↗</button>'+btn('back','Отмена')+'</div>'+
 '<p class="dm-workspace-honest">Этот экран не записывает и не прослушивает разговор. Если вы вставляете запись или расшифровку, убедитесь, что имеете на это право.</p></form>';
}
function negotiationList(){
 const items=data.negotiations.slice();
 return '<div class="dm-workspace-intro"><h3>Переговорный помощник</h3>'+
 '<p>До встречи подготовлю вопросы, после — помогу разобрать записанные условия и найти места, где стоит быть осторожнее. Проверку реестров и живое прослушивание добавим после надёжных подключений.</p>'+
 btn('new-deal','+ Разобрать переговоры')+'</div>'+
 (items.length?'<section class="dm-workspace-list">'+items.map(x=>'<button class="dm-workspace-row" type="button" data-ws-deal="'+esc(x.id)+'"><span><strong>'+esc(x.partner)+'</strong><small>'+date(x.at)+'</small></span><span>↗</span></button>').join('')+'</section>':
 '<section class="dm-workspace-empty"><strong>Пока нет переговоров</strong><p>Можно начать с любого конкретного предложения, которое вам принесли.</p></section>')+note;
}
function negotiationDetail(){
 const d=data.negotiations.find(x=>x.id===selected);
 if(!d){mode='list';return negotiationList();}
 const questions=dealQuestions(d.offer);
 return '<section class="dm-workspace-detail"><small class="dm-ws-eyebrow">РАЗБОР УСЛОВИЙ · '+date(d.at)+'</small>'+
 '<h3>'+esc(d.partner)+'</h3><p>Предложение / заметки:</p><div class="dm-workspace-quote">'+esc(d.offer)+'</div>'+
 (d.goal?'<p>Цель директора: '+esc(d.goal)+'</p>':'')+
 '<h3>Что стоит уточнить</h3><ol class="dm-workspace-questions">'+questions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+
 '<p class="dm-workspace-honest">Это подсказки по ключевым словам, а не достоверная оценка добросовестности партнёра. Реальная проверка юрлица потребует идентификации по ИНН/ОГРН, официальных источников и правовой оценки условий.</p>'+
 '<div class="dm-workspace-actions">'+btn('copy-deal','Скопировать вопросы')+
 btn('approve-deal','На подпись: проверить условия')+btn('delete-deal','Удалить')+btn('back','← К переговорам')+'</div></section>';
}
function render(){
 const titles={inbox:'Единые входящие',brief:'Планёрка директора',meeting:'Переговоры и сделки'};
 $('dmWorkspaceTitle').textContent=titles[screen]||titles.inbox;
 for(const tab of overlay.querySelectorAll('[data-ws-screen]'))tab.setAttribute('aria-current',tab.dataset.wsScreen===screen?'page':'false');
 let html='';
 if(screen==='inbox')html=mode==='new'?messageForm():mode==='detail'?messageDetail():inboxList();
 if(screen==='brief')html=(mode==='detail'||mode==='week')?planEditor():briefing();
 if(screen==='meeting')html=mode==='new'?negotiationForm():mode==='detail'?negotiationDetail():negotiationList();
 body().innerHTML=html+(notification?'<p class="dm-workspace-feedback" role="status">'+esc(notification)+'</p>':'');
 body().scrollTop=0;notification='';
}
function updateDraft(){
 const m=data.inbox.find(x=>x.id===selected),txt=$('dmWorkspaceReply')?.value?.trim();
 if(!m||!txt||txt.length>4000){notification='Проверьте текст ответа.';return false;}
 m.draft=txt;
 if(m.status==='new'||m.status==='approval'||m.status==='approved')m.status='draft';
 return save();
}
function officeProposal(p){
 const api=window.DMDirectorOffice;
 if(api?.propose){
  const ok=api.propose(p);
  if(ok){close();api.open('desk');return true;}
 }
 notification='Предложение сохранено здесь, но директорский центр недоступен. Откройте золотую рекомендацию.';
 return false;
}
async function copy(text){
 const s=String(text||'');
 if(!s)return;
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(s);notification='Скопировано. Ничего никому не отправлено.';}
 catch(_){notification='Не удалось скопировать. Выделите текст в поле вручную.';}
 if(screen==='brief'&&(mode==='detail'||mode==='week')){
  body()?.querySelector('.dm-workspace-feedback')?.remove();
  const status=document.createElement('p');status.className='dm-workspace-feedback';status.setAttribute('role','status');
  status.textContent=notification;body()?.append(status);notification='';
 }else render();
}
function planText(){return $('dmWorkspaceAgendaText')?.value?.trim()||'';}
function savePlan(){
 const value=planText();
 if(value.length<10){notification='План слишком короткий.';render();return;}
 const existing=data.briefs.find(x=>x.id===selected);
 if(existing){existing.text=value;existing.at=Date.now();}
 else{const p={id:makeId('brief'),title:mode==='week'?'План на неделю':'Планёрка',text:value,at:Date.now()};
 data.briefs.unshift(p);selected=p.id;}
 data.briefs=data.briefs.slice(0,MAX_PLANS);
 if(save())notification='План сохранён. Сотрудникам он не отправлен.';mode='detail';render();
}
function weekPlan(){
 const day=makeAgenda();
 return 'ПЛАН НА НЕДЕЛЮ · подготовка к обсуждению\n\n'+
 '1. Сверить реальные итоги прошлой недели, не подменяя их прогнозом.\n'+
 '2. Определить три приоритета по клиентам, выручке и качеству.\n'+
 '3. Проверить доступность команды и договориться об ответственных.\n'+
 '4. Уточнить сроки и риски по действующим заказам.\n'+
 '5. В конце недели проверить результаты по фактам.\n\n'+
 'КОНТЕКСТ ПО ДОСТУПНЫМ ЗАПИСЯМ:\n'+day;
}
function speak(text){
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
  notification='На этом устройстве озвучивание не поддерживается.';render();return;
 }
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text.slice(0,6000));utterance.lang='ru-RU';utterance.rate=.96;
 window.speechSynthesis.speak(utterance);spoken=true;
}
overlay.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el){if(event.target===overlay)close();return;}
 if(el.hasAttribute('data-ws-close')){close();return;}
 if(el.dataset.wsScreen){screen=el.dataset.wsScreen;mode='list';selected='';notification='';render();return;}
 if(el.dataset.wsMessage){selected=el.dataset.wsMessage;mode='detail';render();return;}
 if(el.dataset.wsPlan){selected=el.dataset.wsPlan;mode='detail';render();return;}
 if(el.dataset.wsDeal){selected=el.dataset.wsDeal;mode='detail';render();return;}
 const act=el.dataset.ws;if(!act)return;
 const m=data.inbox.find(x=>x.id===selected);
 const d=data.negotiations.find(x=>x.id===selected);
 if(act==='back'){mode='list';selected='';render();return;}
 if(act==='new-message'||act==='new-deal'){mode='new';selected='';render();return;}
 if(act==='make-agenda'){screen='brief';mode='detail';selected='';render();return;}
 if(act==='week'){screen='brief';mode='week';selected='';render();$('dmWorkspaceAgendaText').value=weekPlan();return;}
 if(act==='save-draft'&&m){if(updateDraft())notification='Черновик сохранён. Ничего не отправлено.';render();return;}
 if(act==='request-approval'&&m){
  if(!updateDraft()){render();return;}
  m.status='approval';save();
  const sent=officeProposal({id:'inbox:'+m.id,kind:'message',title:'Ответить: '+m.title,
    body:'Входящее из «'+m.channel+'» от «'+(m.sender||'клиента')+'». Подготовлен черновик ответа. Он не будет отправлен без отдельного действия.',
    source:'Вручную добавленное обращение',next:'Проверить текст черновика и дать разрешение на использование.'});
  if(!sent)render();
  return;
 }
 if(act==='copy-reply'&&m&&m.status==='approved'){copy(m.draft||'');return;}
 if(act==='manual-close'&&m){
  if(!window.confirm('Вы действительно завершили работу с этим обращением вне приложения? Это не означает отправку через нашу систему.'))return;
  m.status='archived';save();render();return;
 }
 if(act==='delete-message'&&m){
  if(!window.confirm('Удалить запись обращения и черновик с этого устройства?'))return;
  window.DMDirectorOffice?.dismiss?.('inbox:'+m.id);
  data.inbox=data.inbox.filter(x=>x.id!==m.id);save();selected='';mode='list';render();return;
 }
 if(act==='save-plan'){savePlan();return;}
 if(act==='copy-plan'){copy(planText());return;}
 if(act==='speak-plan'){speak(planText());return;}
 if(act==='stop-speech'){window.speechSynthesis?.cancel();spoken=false;return;}
 if(act==='copy-deal'&&d){copy(dealQuestions(d.offer).map((x,i)=>(i+1)+'. '+x).join('\n'));return;}
 if(act==='approve-deal'&&d){
  const sent=officeProposal({id:'deal:'+d.id,kind:'briefing',title:'Проверить условия: '+d.partner,
    body:'Предложение и вопросы сохранены в «Штабе директора». Есть '+dealQuestions(d.offer).length+' пунктов для проверки. Оценки репутации по интернету пока нет.',
    source:'Заметки директора о переговорах',next:'Уточнить существенные условия, при необходимости привлечь юриста или бухгалтера.'});
  if(!sent)render();return;
 }
 if(act==='delete-deal'&&d){
  if(!window.confirm('Удалить сохранённые заметки этой встречи?'))return;
  window.DMDirectorOffice?.dismiss?.('deal:'+d.id);
  data.negotiations=data.negotiations.filter(x=>x.id!==d.id);save();selected='';mode='list';render();return;
 }
});
overlay.addEventListener('submit',event=>{
 event.preventDefault();
 const form=event.target;const fd=new FormData(form);
 if(form.id==='dmWorkspaceMessageForm'){
  const title=safe(fd.get('title'),110),text=safe(fd.get('body'),4000),channel=safe(fd.get('channel'),25),sender=safe(fd.get('sender'),80);
  if(!title||!text||!channels.includes(channel)){notification='Укажите тему, источник и текст обращения.';render();return;}
  const item={id:makeId('msg'),title,body:text,sender,channel,at:Date.now(),status:'new',draft:''};
  data.inbox.unshift(item);data.inbox=data.inbox.slice(0,MAX_INBOX);
  if(save()){selected=item.id;mode='detail';render();}
 }
 if(form.id==='dmWorkspaceNegotiationForm'){
  const partner=safe(fd.get('partner'),120),offer=safe(fd.get('offer'),5000),goal=safe(fd.get('goal'),1500);
  if(!partner||!offer){notification='Укажите партнёра и условия.';render();return;}
  const deal={id:makeId('deal'),partner,offer,goal,at:Date.now()};
  data.negotiations.unshift(deal);data.negotiations=data.negotiations.slice(0,MAX_PLANS);
  if(save()){selected=deal.id;mode='detail';render();}
 }
});
overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
inbox.addEventListener('click',()=>open('inbox'));
brief.addEventListener('click',()=>open('brief'));
window.addEventListener('storage',event=>{if(event.key===KEY){data=load();updateCards();if(!overlay.hidden)render();}});
window.addEventListener('dm:director-approved',event=>{
 const id=String(event.detail?.proposalId||'');
 if(!id.startsWith('inbox:'))return;
 const m=data.inbox.find(x=>'inbox:'+x.id===id);
 if(!m)return;
 m.status='approved';save();
});
window.DMDirectorWorkspace=Object.freeze({open,close,count:()=>entries().length,
 summary:()=>({total:entries().length,awaiting:entries().filter(x=>['new','draft','approval'].includes(x.status)).length,
 important:entries().filter(x=>x.status!=='archived'&&classify(x).urgent).length}),
 refresh:updateCards});
updateCards();
})();