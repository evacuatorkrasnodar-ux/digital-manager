/* Digital Manager / Working tools and optional Home suggestions v1.
   Available regardless of Home tile selection. Never adds a card without a tap. */
(()=>{
'use strict';
const management=document.getElementById('mgHome');
const managerRow=management?.querySelector('.mg-manager');
const cardsGrid=document.getElementById('mgSwitchGrid');
if(!management||!managerRow||!cardsGrid)return;
const KEY='dm-tool-suggestions-v1';
const DAY=86400000;
const kinds={
 inbox:{title:'Входящие',key:'inboxWidget',icon:'✉',purpose:'Собрать обращение, подготовить ответ и передать на подпись',status:'Сейчас — ручные обращения; почтовые сервисы не подключены',run:()=>window.DMDirectorWorkspace?.open?.('inbox')},
 brief:{title:'Планёрка',key:'briefingWidget',icon:'☀',purpose:'Подготовить речь, недельный план и озвучить его',status:'Работает с записями на этом устройстве',run:()=>window.DMDirectorWorkspace?.open?.('brief')},
 meeting:{title:'Переговоры',key:'briefingWidget',icon:'🤝',purpose:'Разобрать условия сделки и подготовить вопросы',status:'Запись разговоров и онлайн-проверка партнёров пока не подключены',run:()=>window.DMDirectorWorkspace?.open?.('meeting')},
 tax:{title:'Налоговый контроль',key:'taxWidget',icon:'◈',purpose:'Проверить записанные сроки, подготовить сведения для декларации',status:'Даты вводятся вручную, подача в ФНС не подключена',run:()=>window.DMTaxControl?.open?.('list')},
 pulse:{title:'Пульс бизнеса',key:'',icon:'▤',purpose:'Посмотреть фактические записи за день, неделю, месяц или год',status:'Финансовые цифры на больших бизнес-карточках пока демонстрационные',run:()=>window.DMBusinessPulse?.open?.()}
};
const activeCards=[
 {kind:'inbox',name:'Входящие',cardKey:'inboxWidget'},
 {kind:'brief',name:'Штаб директора',cardKey:'briefingWidget'},
 {kind:'tax',name:'Налоговый контроль',cardKey:'taxWidget'}
];
function getPreference(key){
 const input=cardsGrid.querySelector('input[data-mg-card="'+key+'"]');
 return input?input.checked:false;
}
function changePreference(key,enabled){
 const input=cardsGrid.querySelector('input[data-mg-card="'+key+'"]');
 if(!input)return false;
 if(input.checked!==enabled){
  input.checked=enabled;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 return input.checked===enabled;
}
function read(){
 try{
  const val=JSON.parse(localStorage.getItem(KEY)||'{}');
  return val&&typeof val==='object'&&!Array.isArray(val)?val:{};
 }catch(_){return {}}
}
function save(value){
 try{localStorage.setItem(KEY,JSON.stringify(value));return true;}catch(_){return false;}
}
function observeUsage(kind){
 if(!['inbox','brief','meeting','tax'].includes(kind))return;
 const v=read(),now=Date.now();
 const key=kind==='meeting'?'brief':kind;
 const log=v[key]&&typeof v[key]==='object'?v[key]:{};
 const valid=Array.isArray(log.uses)?log.uses.filter(t=>Number.isFinite(t)&&t>now-30*DAY&&t<=now).slice(-16):[];
 valid.push(now);
 v[key]={uses:valid.slice(-16),dismissedUntil:Number(log.dismissedUntil)||0};
 save(v);
 updateSuggestion();
}
function suggested(){
 const v=read(),now=Date.now();
 for(const d of activeCards){
  if(getPreference(d.cardKey))continue;
  const log=v[d.kind];if(!log||now<(Number(log.dismissedUntil)||0))continue;
  const events=Array.isArray(log.uses)?log.uses.filter(t=>Number.isFinite(t)&&t>now-30*DAY&&t<=now):[];
  if(events.length>=3)return {...d,uses:events.length};
 }
 return null;
}
const toolsRow=document.createElement('button');
toolsRow.id='dmManagementToolsEntry';toolsRow.type='button';toolsRow.className='mg-row dm-manager-tools-entry';
toolsRow.innerHTML='<span class="mg-icon mg-blue dm-tools-icon" aria-hidden="true">✦</span>'+
 '<span class="mg-copy"><strong>Рабочие инструменты</strong>'+
 '<small>Входящие · планёрки · переговоры · налоги</small>'+
 '<small>Доступны, даже когда карточки скрыты с Главной</small></span>'+
 '<span class="mg-chevron" aria-hidden="true">›</span>';
managerRow.after(toolsRow);
const suggestion=document.createElement('section');
suggestion.className='dm-management-suggestion';suggestion.id='dmManagementSuggestion';suggestion.hidden=true;
suggestion.setAttribute('aria-label','Предложение управляющего');
toolsRow.after(suggestion);
const overlay=document.createElement('section');
overlay.id='dmManagerToolsPanel';overlay.className='dm-tools-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="dm-tools-frame" role="dialog" aria-modal="true" aria-labelledby="dmToolsTitle" tabindex="-1">'+
 '<header class="dm-tools-head"><div><small>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ · МОЙ НАБОР</small>'+
 '<h2 id="dmToolsTitle">Рабочие инструменты</h2></div><button type="button" data-tools-close aria-label="Закрыть">×</button></header>'+
 '<div id="dmToolsBody" class="dm-tools-body"></div></div>';
document.body.append(overlay);
let priorFocus=null;
function el(tag,cls,words){
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(words!==undefined)element.textContent=words;
 return element;
}
function renderPanel(){
 const body=document.getElementById('dmToolsBody');
 body.replaceChildren();
 const intro=el('p','dm-tools-intro','Здесь живут возможности управляющего. На Главной — только те карточки, которые вы сами выбрали.');
 body.append(intro);
 const list=el('div','dm-tools-list');
 for(const [key,tool] of Object.entries(kinds)){
  const item=el('article','dm-tools-item');
  const art=el('span','dm-tools-item-icon',tool.icon);art.setAttribute('aria-hidden','true');
  const copy=el('div','dm-tools-item-copy');
  copy.append(el('strong','',tool.title),el('span','',tool.purpose),el('small','',tool.status));
  const openButton=el('button','dm-tools-open','Открыть ↗');
  openButton.type='button';openButton.dataset.toolOpen=key;
  openButton.setAttribute('aria-label','Открыть '+tool.title);
  item.append(art,copy,openButton);
  if(tool.key){
   const dock=el('div','dm-tools-dock');
   const text=el('span','',getPreference(tool.key)?'Уже на Главной':'Главная без этой карточки');
   const manage=el('button','',getPreference(tool.key)?'Убрать с Главной':'На Главную +');
   manage.type='button';manage.dataset.toolToggle=tool.key;
   dock.append(text,manage);item.append(dock);
  }
  list.append(item);
 }
 body.append(list);
 const note=el('p','dm-tools-note','Скрытая карточка не отключает инструмент. Доступ к данным и внешним действиям регулируется отдельно; подключённой почты, ФНС и скрытого прослушивания здесь нет.');
 body.append(note);
}
function show(){
 priorFocus=document.activeElement;overlay.hidden=false;
 renderPanel();
 overlay.querySelector('[data-tools-close]')?.focus({preventScroll:true});
}
function close(){
 if(overlay.hidden)return;
 overlay.hidden=true;
 if(priorFocus?.isConnected&&typeof priorFocus.focus==='function')priorFocus.focus({preventScroll:true});
}
function updateSuggestion(){
 const item=suggested();
 suggestion.replaceChildren();
 if(!item){suggestion.hidden=true;return;}
 const content=el('div','dm-management-suggestion-copy');
 content.append(
  el('small','','✦ ПРЕДЛОЖЕНИЕ УПРАВЛЯЮЩЕГО'),
  el('strong','','Часто пользуетесь инструментом «'+item.name+'»'),
  el('p','','По действиям на этом устройстве вижу, что он вам пригождается. Добавим удобную маленькую карточку на Главную?')
 );
 const actions=el('div','dm-management-suggestion-actions');
 const add=el('button','','+ Добавить');
 add.type='button';add.dataset.toolSuggestAdd=item.cardKey;
 const later=el('button','','Не сейчас');
 later.type='button';later.dataset.toolSuggestLater=item.kind;
 actions.append(add,later);
 suggestion.append(content,actions);suggestion.hidden=false;
}
toolsRow.addEventListener('click',show);
overlay.addEventListener('click',e=>{
 if(e.target===overlay){close();return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-tools-close')){close();return;}
 if(b.dataset.toolOpen){
  const tool=kinds[b.dataset.toolOpen];
  close();tool?.run?.();return;
 }
 if(b.dataset.toolToggle){
  const key=b.dataset.toolToggle;
  changePreference(key,!getPreference(key));
  renderPanel();updateSuggestion();
 }
});
overlay.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.stopPropagation();close();}
});
suggestion.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.toolSuggestAdd){
  if(changePreference(btn.dataset.toolSuggestAdd,true))updateSuggestion();
 }else if(btn.dataset.toolSuggestLater){
  const kind=btn.dataset.toolSuggestLater;
  const value=read(),log=value[kind]||{};
  value[kind]={uses:Array.isArray(log.uses)?log.uses:[],dismissedUntil:Date.now()+30*DAY};
  save(value);updateSuggestion();
 }
});
window.addEventListener('dm:tool-opened',event=>observeUsage(event.detail?.kind));
window.addEventListener('dm:management-home',updateSuggestion);
window.addEventListener('dm:cards-changed',()=>{updateSuggestion();if(!overlay.hidden)renderPanel();});
window.addEventListener('storage',e=>{
 if(e.key===KEY||e.key==='digital-manager-black-velvet-v2'){
  updateSuggestion();if(!overlay.hidden)renderPanel();
 }
});
window.DMManagerTools=Object.freeze({open:show,refresh:updateSuggestion});
updateSuggestion();
})();