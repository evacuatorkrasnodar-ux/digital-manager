/* My Workshop: safe local tool builder, no arbitrary JS or external actions. */
(()=>{
'use strict';
const KEY='dm-workshop-tools-v1';
let items=[];
try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))items=a.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&['delivery','general'].includes(x.kind)).slice(0,30);}catch(_){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Math.max(0,Math.min(10000000,Number(v)||0));
const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v)+' ₽';
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch(_){return false}}
function mount(container){
 if(!container)return;
 container.innerHTML='<div class="dm-workshop">'+
 '<p class="dm-workshop-lead">Создавайте собственные инструменты для работы. Сначала задайте тарифы, затем проверьте расчёт.</p>'+
 '<div class="dm-workshop-presets"><button type="button" data-ws-new="delivery"><span>🚚</span><strong>Перевозки и доставка</strong><small>Расстояние, тариф, погрузка</small></button>'+
 '<button type="button" data-ws-new="general"><span>▦</span><strong>Свой калькулятор</strong><small>Количество, цена, надбавка</small></button></div>'+
 '<div id="wsEditor"></div><h3>Мои инструменты</h3><div id="wsTools"></div>'+
 '<p class="dm-workshop-foot">Инструменты сохраняются только в этом браузере. Автоматическая сборка по запросу к ИИ пока не подключена. Расчёты справочные.</p></div>';
 renderList(container);
 container.onclick=e=>{
 const newBtn=e.target.closest('[data-ws-new]');if(newBtn){renderEditor(container,{id:'',kind:newBtn.dataset.wsNew,name:newBtn.dataset.wsNew==='delivery'?'Калькулятор перевозки':'Мой калькулятор',base:0,rate:50,extra:0});return;}
 const act=e.target.closest('[data-ws-action]');if(!act)return;
 const id=act.dataset.wsId, item=items.find(x=>x.id===id);
 if(act.dataset.wsAction==='edit'&&item)renderEditor(container,item);
 if(act.dataset.wsAction==='delete'&&item&&window.confirm('Удалить инструмент «'+item.name+'»?')){items=items.filter(x=>x.id!==id);save();renderList(container);const editor=container.querySelector('#wsEditor');editor.replaceChildren();}
 if(act.dataset.wsAction==='cancel')container.querySelector('#wsEditor').replaceChildren();
 if(act.dataset.wsAction==='calc')calculate(container);
 };
 container.onsubmit=e=>{
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
 el.innerHTML=items.length?items.map(x=>'<article class="dm-workshop-tool"><span class="dm-workshop-tool-icon">'+(x.kind==='delivery'?'🚚':'▦')+'</span><span class="dm-workshop-tool-copy"><strong>'+esc(x.name)+'</strong><small>'+(x.kind==='delivery'?'Перевозки и доставка':'Свой калькулятор')+'</small></span><button type="button" data-ws-action="edit" data-ws-id="'+esc(x.id)+'" aria-label="Открыть '+esc(x.name)+'">Открыть</button><button type="button" data-ws-action="delete" data-ws-id="'+esc(x.id)+'" aria-label="Удалить '+esc(x.name)+'">×</button></article>').join(''):'<p class="dm-workshop-empty">Пока нет инструментов. Выберите шаблон выше.</p>';
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
