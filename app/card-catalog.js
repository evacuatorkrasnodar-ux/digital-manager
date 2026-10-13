/* Digital Manager | one card = one optional Home tool + an explanatory preview.
   Changes only Management's mini-card markup; does not clone Home functionality. */
(()=>{
'use strict';
const grid=document.getElementById('mgSwitchGrid');
if(!grid)return;
const catalog={
 inside:{title:'Бизнес внутри',icon:'◇',section:'Развитие',summary:'В будущем — внутренние процессы компании.',works:'Пока сохраняется выбор, но отдельная рабочая карточка не появляется.',preview:'Задачи команды, загрузка, сроки и процессы.',tone:'silver',ready:false},
 picture:{title:'Картина',icon:'▤',section:'Картина бизнеса',summary:'Общая аналитика: что произошло за день, неделю, месяц или год.',works:'«Пульс бизнеса» уже показывает сведения из вручную сохранённых записей; этот старый переключатель пока не управляет отдельной карточкой.',preview:'Короткие итоги, сравнения и вопросы, требующие внимания.',tone:'blue',ready:false},
 tasks:{title:'Мои дела',icon:'✓',section:'Мой день',summary:'Поручения, сроки и запланированные задачи.',works:'Рабочий журнал дел уже доступен отдельно. Этот переключатель пока только сохраняет настройку будущей карточки.',preview:'Что нужно сделать сегодня и что просрочено.',tone:'pink',ready:false},
 dayWidget:{title:'Мой день',icon:'☼',section:'Мой день',summary:'Ваш персональный распорядок на главной.',works:'Можно добавить или убрать существующий виджет дня.',preview:'Небольшая сводка дел без перехода в календарь.',tone:'violet',ready:true},
 calendarWidget:{title:'Календарь',icon:'▦',section:'Мой день',summary:'Ближайшие даты и события.',works:'Можно включить настоящий виджет календаря на главной.',preview:'Чтобы видеть дни и планы без лишних переходов.',tone:'blue',ready:true},
 healthSteps:{title:'Шаги',icon:'⌁',section:'Моё здоровье',summary:'Движение и шаги в вашем личном разделе.',works:'Добавляет существующий виджет шагов; данные берутся из личного журнала, а не выдумываются.',preview:'Легко держать активность перед глазами.',tone:'cyan',ready:true},
 breathing:{title:'Дыхание',icon:'◎',section:'Моё здоровье',summary:'Короткая передышка в напряжённый рабочий день.',works:'Включает на главной существующий инструмент дыхания.',preview:'Остановиться на минуту и восстановить спокойный ритм.',tone:'silver',ready:true},
 inboxWidget:{title:'Входящие',icon:'✉',section:'Штаб директора',summary:'Письма и обращения в одном месте.',works:'Уже можно вручную сохранить обращение, подготовить ответ и отправить черновик на директорскую подпись. Автоматическое получение писем из сервисов ещё не подключено.',preview:'Важные сообщения, ожидающие ответа, и готовые черновики.',tone:'blue',ready:true},
 briefingWidget:{title:'Штаб директора',icon:'✦',section:'Штаб директора',summary:'Планёрки, встречи и переговоры.',works:'Подготовка планёрки, заметки переговоров, проверочные вопросы и согласование решений уже доступны. Живое прослушивание и проверка контрагентов ещё не подключены.',preview:'Собрание через десять минут? Соберём речь и рабочий план.',tone:'violet',ready:true},
 taxWidget:{title:'Налоговый контроль',icon:'◈',section:'Штаб директора',summary:'Декларации, сроки и налоговые обязательства.',works:'Ввод сроков вручную, предупреждения и помощь со сбором исходных данных для декларации. Подключения к ФНС и автоматической отправки пока нет.',preview:'Проверить приближающийся срок, не платить посредникам без надобности.',tone:'amber',ready:true}
};
const byKey=new Map();
for(const label of [...grid.querySelectorAll('label.mg-tile')]){
 const input=label.querySelector('input[data-mg-card]');
 if(!input)continue;
 const key=input.dataset.mgCard;
 const info=catalog[key]||{title:key,icon:'✦',section:'Инструменты',summary:'Подробнее о карточке',works:'Появится позже',preview:'',tone:'blue',ready:false};
 const surface=document.createElement('div');
 surface.className=label.className+' dm-catalog-tile';
 surface.dataset.catalogKey=key;
 const picture=document.createElement('button');
 picture.type='button';picture.className='dm-catalog-preview-trigger';
 picture.dataset.cardPreview=key;
 picture.setAttribute('aria-label','Предпросмотр: '+info.title+'. Для чего нужна карточка');
 picture.title='Посмотреть карточку и описание';
 const icon=label.querySelector('.mg-tile-art'),caption=label.querySelector('.mg-tile-caption');
 if(icon)picture.append(icon);
 if(caption)picture.append(caption);
 const badge=document.createElement('span');badge.className='dm-catalog-eye';badge.setAttribute('aria-hidden','true');badge.textContent='◌';
 picture.append(badge);
 const switchControl=document.createElement('label');switchControl.className='dm-catalog-switch';
 const suffix=document.createElement('span');suffix.textContent='На главной';suffix.className='dm-catalog-switch-label';
 switchControl.append(suffix,input);
 const slider=label.querySelector('i');
 if(slider)switchControl.append(slider);
 switchControl.setAttribute('title','Показать или скрыть на главной');
 surface.append(picture,switchControl);
 label.replaceWith(surface);
 byKey.set(key,{input,surface,info});
}
const overlay=document.createElement('section');
overlay.id='dmCardCatalogPreview';overlay.className='dm-catalog-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="dm-catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="dmCatalogTitle" tabindex="-1">'+
 '<div class="dm-catalog-head"><div><small>МОЯ ГЛАВНАЯ · ПРЕДПРОСМОТР</small><h2 id="dmCatalogTitle">Карточка</h2></div>'+
 '<button type="button" class="dm-catalog-close" data-catalog-close aria-label="Закрыть">×</button></div>'+
 '<div class="dm-catalog-content" id="dmCatalogContent"></div></div>';
document.body.append(overlay);
let selected='',lastFocused=null;
const text=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=content;return el;};
const status=()=>selected?byKey.get(selected):null;
function render(){
 const row=status();if(!row)return;
 const {info,input}=row;
 document.getElementById('dmCatalogTitle').textContent=info.title;
 const container=document.getElementById('dmCatalogContent');
 container.replaceChildren();
 const sample=document.createElement('div');
 sample.className='dm-catalog-sample dm-catalog-sample-'+info.tone;
 sample.append(text('span','dm-catalog-sample-icon',info.icon));
 const sampleCopy=document.createElement('div');sampleCopy.className='dm-catalog-sample-copy';
 sampleCopy.append(text('small','',info.section));
 sampleCopy.append(text('strong','',info.title));
 sampleCopy.append(text('span','',info.preview));
 sample.append(sampleCopy);
 container.append(sample);
 container.append(text('p','dm-catalog-description',info.summary));
 const details=document.createElement('div');details.className='dm-catalog-explainer';
 details.append(text('strong','','Что умеет и для чего пригодится'));
 details.append(text('p','',info.works));
 container.append(details);
 const group=document.createElement('div');group.className='dm-catalog-bottom';
 const state=text('small','dm-catalog-current',info.ready?(input.checked?'Сейчас показана на главной':'Сейчас скрыта с главной'):'Карточка ещё готовится · показ на главной пока недоступен');
 group.append(state);
 const toggle=document.createElement('button');toggle.type='button';toggle.dataset.catalogToggle='true';
 toggle.textContent=input.checked?'Убрать с главной':'Добавить на главную';
 // Old incomplete toggles still retain their existing behavior — we never
 // describe an unavailable dashboard card as installed.
 if(!info.ready){toggle.disabled=true;toggle.textContent='В разработке';}
 group.append(toggle);container.append(group);
}
function open(key){
 if(!byKey.has(key))return;
 lastFocused=document.activeElement;selected=key;overlay.hidden=false;render();
 overlay.querySelector('[data-catalog-close]')?.focus({preventScroll:true});
}
function close(){
 if(overlay.hidden)return;
 overlay.hidden=true;
 if(lastFocused?.isConnected&&typeof lastFocused.focus==='function')lastFocused.focus({preventScroll:true});
}
grid.addEventListener('click',e=>{
 const target=e.target.closest('[data-card-preview]');
 if(target)open(target.dataset.cardPreview);
});
overlay.addEventListener('click',e=>{
 if(e.target===overlay){close();return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-catalog-close')){close();return;}
 if(b.dataset.catalogToggle==='true'){
  const row=status();if(!row)return;
  row.input.checked=!row.input.checked;
  row.input.dispatchEvent(new Event('change',{bubbles:true}));
  render();
 }
});
overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
window.DMCardCatalog=Object.freeze({open,close,refresh:()=>{if(!overlay.hidden)render();}});
})();