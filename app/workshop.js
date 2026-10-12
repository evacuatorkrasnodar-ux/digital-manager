/* My Workshop: safe local tool builder, no arbitrary JS or external actions. */
(()=>{
'use strict';
const KEY='dm-workshop-tools-v1';
let items=[];
try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))items=a.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&['delivery','general','custom'].includes(x.kind)).slice(0,30);}catch(_){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Math.max(0,Math.min(10000000,Number(v)||0));
const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v)+' ₽';
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch(_){return false}}
function mount(container){
 if(!container)return;
 container.innerHTML='<div class="dm-workshop">'+
 '<p class="dm-workshop-lead">Расскажите, какой инструмент вам нужен. Карточка появится сразу — затем добавляйте записи и меняйте её под свою задачу.</p>'+ '<form id="wsIdeaForm" class="dm-workshop-idea"><label for="wsIdea">Что создадим?</label><textarea id="wsIdea" name="idea" maxlength="400" rows="3" required placeholder="Например: журнал клиентов, список проверок автомобиля или учёт заказов"></textarea><button type="submit">✦ Создать карточку</button></form>'+ '<p class="dm-workshop-hint">Можно описать любую задачу. Сначала создаётся универсальная карточка; подключение ИИ для автоматической сборки сложных функций — следующий этап.</p>'+ '<h3>Или начните с готового расчёта</h3>'+ 
 '<div class="dm-workshop-presets"><button type="button" data-ws-new="delivery"><span>🚚</span><strong>Перевозки и доставка</strong><small>Расстояние, тариф, погрузка</small></button>'+
 '<button type="button" data-ws-new="general"><span>▦</span><strong>Свой калькулятор</strong><small>Количество, цена, надбавка</small></button></div>'+
 '<div id="wsEditor"></div><h3>Мои инструменты</h3><div id="wsTools"></div>'+
 '<p class="dm-workshop-foot">Инструменты сохраняются только в этом браузере. Автоматическая сборка по запросу к ИИ пока не подключена. Расчёты справочные.</p></div>';
 renderList(container);
 container.onclick=e=>{
 const newBtn=e.target.closest('[data-ws-new]');if(newBtn){renderEditor(container,{id:'',kind:newBtn.dataset.wsNew,name:newBtn.dataset.wsNew==='delivery'?'Калькулятор перевозки':'Мой калькулятор',base:0,rate:50,extra:0});return;}
 const act=e.target.closest('[data-ws-action]');if(!act)return;
 const id=act.dataset.wsId, item=items.find(x=>x.id===id);
 if(act.dataset.wsAction==='edit'&&item){if(item.kind==='custom')renderCustom(container,item);else renderEditor(container,item);}
 if(act.dataset.wsAction==='delete'&&item&&window.confirm('Удалить инструмент «'+item.name+'»?')){items=items.filter(x=>x.id!==id);save();renderList(container);const editor=container.querySelector('#wsEditor');editor.replaceChildren();}
 if(act.dataset.wsAction==='cancel')container.querySelector('#wsEditor').replaceChildren();
 if(act.dataset.wsAction==='calc')calculate(container);
 if(act.dataset.wsAction==='check'&&item?.kind==='custom'){const idx=Number(act.dataset.wsIndex);if(Number.isInteger(idx)&&idx>=0&&idx<(item.entries||[]).length){item.entries[idx].done=!item.entries[idx].done;save();renderCustom(container,item);}}
 if(act.dataset.wsAction==='remove-entry'&&item?.kind==='custom'){const idx=Number(act.dataset.wsIndex);if(Number.isInteger(idx)&&idx>=0&&idx<(item.entries||[]).length){item.entries.splice(idx,1);save();renderCustom(container,item);}}
 };
 container.onsubmit=e=>{
 if(e.target.id==='wsIdeaForm'){
  e.preventDefault();const idea=String(new FormData(e.target).get('idea')||'').trim().slice(0,400);
  if(!idea)return;if(items.length>=30){alert('Можно сохранить до 30 инструментов.');return;}
  const name=idea.replace(/[.!?]+$/,'').slice(0,60);
  const item={id:'tool-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),kind:'custom',name,description:idea,entries:[]};
  items.unshift(item);if(!save()){items.shift();alert('Не удалось сохранить карточку в браузере.');return;}
  e.target.reset();renderList(container);renderCustom(container,item);return;
 }
 if(e.target.id==='wsEntryForm'){
  e.preventDefault();const fd=new FormData(e.target),item=items.find(x=>x.id===fd.get('id'));
  const value=String(fd.get('entry')||'').trim().slice(0,250);
  if(item?.kind==='custom'&&value){item.entries??=[];if(item.entries.length>=100){alert('В одной карточке до 100 записей.');return;}item.entries.push({text:value,done:false});save();renderCustom(container,item);}return;
 }
 if(e.target.id==='wsRenameForm'){
  e.preventDefault();const fd=new FormData(e.target),item=items.find(x=>x.id===fd.get('id'));
  if(item?.kind==='custom'){const name=String(fd.get('name')||'').trim().slice(0,60);if(name){item.name=name;item.description=String(fd.get('description')||'').trim().slice(0,400);save();renderList(container);renderCustom(container,item);}}return;
 }
 if(e.target.id!=='wsForm')return;
 e.preventDefault();const form=e.target,fd=new FormData(form),kind=fd.get('kind');
 const name=String(fd.get('name')||'').trim().slice(0,60);if(!name){form.querySelector('[name=name]').focus();return;}
 const id=String(fd.get('id')||'')||('tool-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
 const item={id,kind,name,base:num(fd.get('base')),rate:num(fd.get('rate')),extra:num(fd.get('extra'))};
 const idx=items.findIndex(x=>x.id===id);
 if(idx===-1){if(items.length>=30){alert('Можно сохранить до 30 инструментов.');return;}items.unshift(item);}else items[idx]=item;
 if(!save()){alert('Не удалось сохранить в этом браузере.');return;}
 renderList(container);renderEditor(container,item);const status=container.querySelector('#wsSaved');if(status)status.textContent='Сохранено ✓';
 };
 container.oninput=e=>{if(e.target.closest('#wsForm'))calculate(container);};
}
function renderList(container){
 const el=container.querySelector('#wsTools');if(!el)return;
 el.innerHTML=items.length?items.map(x=>'<article class="dm-workshop-tool"><span class="dm-workshop-tool-icon">'+(x.kind==='delivery'?'🚚':x.kind==='custom'?'✦':'▦')+'</span><span class="dm-workshop-tool-copy"><strong>'+esc(x.name)+'</strong><small>'+(x.kind==='delivery'?'Перевозки и доставка':x.kind==='custom'?'Моя карточка':'Свой калькулятор')+'</small></span><button type="button" data-ws-action="edit" data-ws-id="'+esc(x.id)+'" aria-label="Открыть '+esc(x.name)+'">Открыть</button><button type="button" data-ws-action="delete" data-ws-id="'+esc(x.id)+'" aria-label="Удалить '+esc(x.name)+'">×</button></article>').join(''):'<p class="dm-workshop-empty">Пока нет карточек. Опишите идею выше — первая появится сразу.</p>';
}
function renderCustom(container,item){
 const el=container.querySelector('#wsEditor');if(!el)return;
 const entries=Array.isArray(item.entries)?item.entries:[];
 el.innerHTML='<section class="dm-workshop-editor dm-workshop-custom"><h3>Карточка готова ✓</h3>'+
 '<form id="wsRenameForm"><input type="hidden" name="id" value="'+esc(item.id)+'"><label class="dm-workshop-name">Название<input name="name" maxlength="60" required value="'+esc(item.name)+'"></label><label class="dm-workshop-name">Описание<textarea name="description" maxlength="400" rows="2">'+esc(item.description||'')+'</textarea></label><button type="submit">Сохранить изменения</button></form>'+
 '<h3>Мои записи</h3><form id="wsEntryForm" class="dm-workshop-entry"><input type="hidden" name="id" value="'+esc(item.id)+'"><input name="entry" maxlength="250" required placeholder="Добавить задачу, запись или пункт"><button type="submit">Добавить</button></form>'+
 '<div class="dm-workshop-entries">'+(entries.length?entries.map((x,i)=>'<div class="dm-workshop-entry-row"><button type="button" data-ws-action="check" data-ws-id="'+esc(item.id)+'" data-ws-index="'+i+'" aria-label="Отметить запись">'+(x.done?'☑':'□')+'</button><span'+(x.done?' class="is-done"':'')+'>'+esc(x.text)+'</span><button type="button" data-ws-action="remove-entry" data-ws-id="'+esc(item.id)+'" data-ws-index="'+i+'" aria-label="Удалить запись">×</button></div>').join(''):'<p class="dm-workshop-empty">Добавьте первую запись — например, заказ, задачу или контрольный пункт.</p>')+'</div>'+
 '<button type="button" data-ws-action="cancel">Закрыть карточку</button></section>';
}
function renderEditor(container,item){
 const delivery=item.kind==='delivery';
 const row=(key,label,value,unit)=>'<label class="dm-workshop-field"><span>'+label+'</span><input type="number" name="'+key+'" min="0" max="10000000" step="any" inputmode="decimal" value="'+num(value)+'"><small>'+unit+'</small></label>';
 container.querySelector('#wsEditor').innerHTML='<form id="wsForm" class="dm-workshop-editor"><input type="hidden" name="id" value="'+esc(item.id)+'"><input type="hidden" name="kind" value="'+esc(item.kind)+'">'+
 '<label class="dm-workshop-name">Название инструмента<input name="name" maxlength="60" required value="'+esc(item.name)+'" placeholder="Например, расчёт эвакуатора"></label>'+
 '<p>Настройка тарифа</p>'+
 row('base',delivery?'Минимальная стоимость':'Базовая сумма',item.base,'₽')+
 row('rate',delivery?'Цена за километр':'Цена за единицу',item.rate,delivery?'₽/км':'₽/шт')+
 row('extra',delivery?'Погрузка и допуслуги':'Дополнительная сумма',item.extra,'₽')+
 '<p>Проверить на примере</p>'+
 '<label class="dm-workshop-field"><span>'+(delivery?'Расстояние':'Количество')+'</span><input type="number" name="quantity" min="0" max="10000000" step="any" inputmode="decimal" value="10"><small>'+(delivery?'км':'шт')+'</small></label>'+
 '<output class="dm-workshop-total" id="wsTotal"></output>'+
 '<div class="dm-workshop-actions"><button type="submit">Сохранить инструмент</button><button type="button" data-ws-action="cancel">Закрыть</button></div><p id="wsSaved" role="status"></p></form>';
 calculate(container);
}
function calculate(container){
 const form=container.querySelector('#wsForm');if(!form)return;
 const d=new FormData(form),base=num(d.get('base')),rate=num(d.get('rate')),quantity=num(d.get('quantity')),extra=num(d.get('extra'));
 const total=base+rate*quantity+extra;
 const out=form.querySelector('#wsTotal');
 out.textContent=Number.isFinite(total)&&total<=1e14?'Итого: '+money(total):'Проверьте значения';
}
window.DMWorkshop=Object.freeze({mount});
})();
