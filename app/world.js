/* Digital Manager · My World v249. Local personal tools, not remote AI. */
(() => {
  'use strict';
  const DB='digital-manager-my-world-v1',STORES=['family','memory','finance'];
  const $=id=>document.getElementById(id),today=()=>localDate(new Date());
  const pad=n=>String(n).padStart(2,'0');
  const localDate=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const validDate=str=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str));if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3],12);return localDate(d)===str?d:null;};
  const money=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(n||0);
  const shortDate=str=>validDate(str)?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(validDate(str)):'—';
  const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return localDate(d);};
  const node=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
  let db=null,data={family:[],memory:[],finance:[]},calendarEvents=[],view='morning',timer;
  function dmTrashGlyph(){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    for(const d of ['M4 7h16','M9 7V4h6v3','M6 7l1 13h10l1-13','M10 11v6','M14 11v6']){
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',d);
      svg.append(path);
    }
    return svg;
  }
  function toast(t){const el=$('worldToast');el.textContent=t;el.hidden=false;clearTimeout(timer);timer=setTimeout(()=>el.hidden=true,3600);}
  function error(e){console.error('My World data:',e);toast('Не удалось сохранить запись. Проверь настройки браузера.');}
  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
      const r=indexedDB.open(DB,1);
      r.onupgradeneeded=()=>{for(const s of STORES)if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:'id'});};
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('DB open error'));r.onblocked=()=>reject(new Error('Close other tabs'));
    });
  }
  function query(name,mode,fn){
    return new Promise((resolve,reject)=>{
      if(!db){reject(new Error('No storage'));return;}
      let tx,req,res;try{tx=db.transaction(name,mode);req=fn(tx.objectStore(name));}catch(e){reject(e);return;}
      req.onsuccess=()=>{res=req.result;};req.onerror=()=>reject(req.error||new Error('Request error'));
      tx.oncomplete=()=>resolve(res);tx.onerror=()=>reject(tx.error||new Error('Transaction error'));tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));
    });
  }
  async function reload(){
    for(const s of STORES)data[s]=await query(s,'readonly',store=>store.getAll());
    data.family.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ru'));
    data.memory.sort((a,b)=>(Number(b.pinned)-Number(a.pinned))+(b.updatedAt-a.updatedAt));
    data.finance.sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt-a.updatedAt));
    render();
  }
  function show(type){
    const changed=view!==type;
    view=type;
    // World has its own content scroller; never move the shared header/rail.
    if(changed){
      const content=document.querySelector('body > .world-shell > main');
      if(content)content.scrollTop=0;
    }
    document.querySelectorAll('[data-world]').forEach(b=>{const active=b.dataset.world===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-world-view]').forEach(s=>s.hidden=s.dataset.worldView!==type);
    if(type==='morning')loadCalendar().then(renderBrief).catch(()=>renderBrief());
  }
  function item(icon,title,description,meta,edit,del,cls){
    const card=node('article','world-item');
    card.append(node('span','world-item-icon'+(cls?' '+cls:''),icon));
    const body=node('div','world-item-text');body.append(node('strong','',title));
    if(description)body.append(node('p','',description));
    if(meta)body.append(node('small','',meta));
    card.append(body);
    if(edit||del){
      const actions=node('div','world-item-actions');
      if(edit){const b=node('button','','✎');b.type='button';b.setAttribute('aria-label','Изменить '+title);b.addEventListener('click',edit);actions.append(b);}
      if(del){const b=node('button','dm-delete-action');b.type='button';b.append(dmTrashGlyph());b.setAttribute('aria-label','Удалить '+title);b.addEventListener('click',del);actions.append(b);}
      card.append(actions);
    }
    return card;
  }
  function empty(host,text){host.replaceChildren(node('div','world-empty',text));}
  function upcomingYearDate(date){
    const base=validDate(date);if(!base)return null;
    const now=new Date(),y=now.getFullYear();
    let d=new Date(y,base.getMonth(),base.getDate(),12);
    const start=new Date(y,now.getMonth(),now.getDate(),0);
    if(d<start)d=new Date(y+1,base.getMonth(),base.getDate(),12);
    return localDate(d);
  }
  function familyDates(){
    const all=[];
    for(const person of data.family){
      if(person.birthday){const date=upcomingYearDate(person.birthday);if(date)all.push({date,personId:person.id,name:person.name,kind:'birthday',title:'День рождения: '+person.name});}
      if(person.occasion){const date=upcomingYearDate(person.occasion);if(date)all.push({date,personId:person.id,name:person.name,kind:'occasion',title:(person.occasionName||'Важная дата')+' · '+person.name});}
    }
    return all.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function renderFamily(){
    const list=$('familyList');list.replaceChildren();
    if(!data.family.length){empty(list,'Добавь близких людей и памятные даты. Об их праздниках больше не придётся вспоминать в последний момент. ♡');return;}
    for(const person of data.family){
      const next=familyDates().filter(e=>e.personId===person.id)[0];
      const description=[person.relation||'',person.notes||''].filter(Boolean).join(' · ');
      list.append(item('♡',person.name,description,next?'Ближайшее: '+shortDate(next.date)+' · '+next.title:'Важные даты пока не указаны',()=>openForm('family',person),()=>remove('family',person),'rose'));
    }
  }
  function renderMemory(){
    const list=$('memoryList');list.replaceChildren();
    const q=$('memorySearch').value.trim().toLocaleLowerCase('ru');
    const found=data.memory.filter(x=>(x.title+' '+x.text+' '+(x.tag||'')).toLocaleLowerCase('ru').includes(q));
    if(!found.length){empty(list,q?'Ничего не найдено. Попробуй другое слово.':'Здесь будет твоя добровольная память: идеи, важные факты и тёплые мелочи.');return;}
    for(const m of found)list.append(item(m.pinned?'★':'✦',m.title,m.text.slice(0,240),[m.tag,m.pinned?'Для брифинга':null].filter(Boolean).join(' · '),()=>openForm('memory',m),()=>remove('memory',m),m.pinned?'warm':''));
  }
  function renderFinance(){
    const list=$('financeList');list.replaceChildren();
    const prefix=today().slice(0,7);
    const month=data.finance.filter(x=>x.date?.startsWith(prefix));
    const income=month.filter(x=>x.type==='income').reduce((acc,x)=>acc+Number(x.amount),0);
    const expense=month.filter(x=>x.type!=='income').reduce((acc,x)=>acc+Number(x.amount),0);
    $('finIncome').textContent=money(income);$('finExpense').textContent=money(expense);$('finBalance').textContent=money(income-expense);
    if(!data.finance.length){empty(list,'Здесь будут личные доходы, расходы и отдельные записи о подписках. Банковских доступов не нужно.');return;}
    for(const f of data.finance.slice(0,70)){
      const isIncome=f.type==='income';const sign=isIncome?'+':'−';
      list.append(item(isIncome?'↗':f.type==='subscription'?'◈':'↙',f.title,sign+' '+money(Number(f.amount)),shortDate(f.date)+(f.category?' · '+f.category:'')+(f.type==='subscription'?' · подписка (без автоповтора)':''),()=>openForm('finance',f),()=>remove('finance',f),isIncome?'':'warm'));
    }
  }
  async function loadCalendar(){
    try{
      const req=indexedDB.open('digital-manager-my-day-v1',1);
      const d=await new Promise((resolve,reject)=>{
        req.onupgradeneeded=()=>{const db=req.result;for(const x of ['events','notes'])if(!db.objectStoreNames.contains(x)){const store=db.createObjectStore(x,{keyPath:'id'});store.createIndex('date','date',{unique:false});}};
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('DB busy'));
      });
      if(!d.objectStoreNames.contains('events')){d.close();return;}
      calendarEvents=await new Promise((resolve,reject)=>{
        let val=[];const tx=d.transaction('events','readonly'),r=tx.objectStore('events').getAll();
        r.onsuccess=()=>{val=r.result||[];};tx.oncomplete=()=>resolve(val);tx.onerror=()=>reject(tx.error);
      });
      d.close();
    }catch(e){console.warn('My Day events unavailable:',e);calendarEvents=[];}
  }
  function nextSeven(){
    const start=today(),end=new Date();end.setDate(end.getDate()+7);
    return calendarEvents.filter(e=>e.date>=start&&e.date<=localDate(end)&&!e.done).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
  }
  function briefingFacts(){
    const events=nextSeven(),family=familyDates();
    const sevenEnd=new Date();sevenEnd.setDate(sevenEnd.getDate()+7);
    const countFamily=family.filter(x=>x.date<=localDate(sevenEnd)).length;
    const prefix=today().slice(0,7);
    const monthly=data.finance.filter(x=>x.date?.startsWith(prefix));
    const out=monthly.filter(x=>x.type!=='income').reduce((sum,x)=>sum+Number(x.amount),0);
    return {events,family,countFamily,spent:out,memory:data.memory.filter(x=>x.pinned)};
  }
  function renderBrief(){
    const hour=new Date().getHours(),hello=hour<12?'Доброе утро':hour<18?'Добрый день':'Добрый вечер';
    $('briefHello').textContent=hello+', шеф!';
    const s=briefingFacts();
    $('briefQuote').textContent=s.events.length?'На горизонте есть дела. Хорошо, что у нас есть план.':'Можно спокойно начинать день. А кофе — тоже часть стратегии. ☕';
    const stats=$('briefStats');stats.replaceChildren();
    for(const [n,label] of [[s.events.length,'Дела на 7 дней'],[s.countFamily,'Важные даты'],[s.memory.length,'В памяти']]){
      const box=node('div','world-fact');box.append(node('strong','',n),node('span','',label));stats.append(box);
    }
    const list=$('briefList');list.replaceChildren();
    let total=0;
    const todayEvents=s.events.filter(x=>x.date===today());
    for(const e of todayEvents.slice(0,4)){list.append(item('◷',e.title,(e.time?e.time+' · ':'')+(e.kind==='meeting'?'Встреча':'Мой день'),'Сегодня',null,null));total++;}
    const next=s.events.filter(x=>x.date>today());
    for(const e of next.slice(0,3)){list.append(item('◷',e.title,'Предстоящее дело',shortDate(e.date)+(e.time?' · '+e.time:'')));total++;}
    const latestFamily=s.family.slice(0,3);
    for(const p of latestFamily.filter(x=>{const d=new Date();d.setDate(d.getDate()+30);return x.date<=localDate(d);})){
      list.append(item('♡',p.title,'Лучше поздравить заранее. Цветы сами себя не купят. 😄',shortDate(p.date),null,null,'rose'));total++;
    }
    const pendingSubs=data.finance.filter(f=>f.type==='subscription'&&f.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
    for(const p of pendingSubs){list.append(item('₽',p.title,'Предстоящий платёж: '+money(Number(p.amount)),shortDate(p.date),null,null,'warm'));total++;}
    for(const m of s.memory.slice(0,2)){list.append(item('★',m.title,m.text.slice(0,130),'Сохранено в памяти',null,null,'warm'));total++;}
    if(!total)empty(list,'Сегодня нет срочных дел и важных дат. Спокойный день — тоже успех.');
  }
  function render(){renderFamily();renderMemory();renderFinance();renderBrief();}
  function uid(){return crypto?.randomUUID?.()||'world-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
  function openForm(type,item){
    if(!db){toast('Хранилище недоступно');return;}
    $('worldForm').reset();
    $('worldEntryId').value=item?.id||'';$('worldEntryType').value=type;
    $('worldDialogTitle').textContent=(item?'Изменить: ':'Добавить: ')+({family:'Семья',memory:'Память',finance:'Финансы'}[type]);
    for(const x of ['Family','Memory','Finance'])$('world'+x+'Fields').hidden=x.toLowerCase()!==type;
    if(type==='family'){
      $('familyName').value=item?.name||'';$('familyRelation').value=item?.relation||'';
      $('familyBirthday').value=item?.birthday||'';$('familyOccasion').value=item?.occasion||'';
      $('familyOccasionName').value=item?.occasionName||'';$('familyNotes').value=item?.notes||'';
    }else if(type==='memory'){
      $('memoryTitle').value=item?.title||'';$('memoryText').value=item?.text||'';
      $('memoryTag').value=item?.tag||'';$('memoryImportant').checked=!!item?.pinned;
    }else{
      $('finTitle').value=item?.title||'';$('finAmount').value=item?.amount??'';
      $('finType').value=item?.type||'expense';$('finDate').value=item?.date||today();$('finCategory').value=item?.category||'';
    }
    $('worldFormDialog').showModal();
    const first={family:'familyName',memory:'memoryTitle',finance:'finTitle'}[type];$(first).focus();
  }
  async function save(e){
    e.preventDefault();const type=$('worldEntryType').value;if(!STORES.includes(type))return;
    const id=$('worldEntryId').value||uid(),old=data[type].find(x=>x.id===id);
    let record={id,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};
    if(type==='family'){
      record={...record,name:$('familyName').value.trim(),relation:$('familyRelation').value.trim(),
        birthday:$('familyBirthday').value,occasion:$('familyOccasion').value,
        occasionName:$('familyOccasionName').value.trim(),notes:$('familyNotes').value.trim()};
      if(!record.name){toast('Введи имя');return;}
    }else if(type==='memory'){
      record={...record,title:$('memoryTitle').value.trim(),text:$('memoryText').value.trim(),
        tag:$('memoryTag').value.trim(),pinned:$('memoryImportant').checked};
      if(!record.title||!record.text){toast('Добавь заголовок и текст');return;}
    }else{
      const amount=Number($('finAmount').value);
      record={...record,title:$('finTitle').value.trim(),amount:Math.round(amount*100)/100,
        type:$('finType').value,date:$('finDate').value,category:$('finCategory').value.trim()};
      if(!record.title||!Number.isFinite(amount)||amount<=0||amount>999999999||!validDate(record.date)){
        toast('Укажи описание, дату и положительную сумму');return;
      }
    }
    try{await query(type,'readwrite',store=>store.put(record));$('worldFormDialog').close();await reload();toast('Сохранено ✓');}
    catch(e){error(e);}
  }
  async function remove(type,item){
    if(!confirm('Удалить «'+(item.title||item.name)+'»? Восстановить без резервной копии нельзя.'))return;
    try{await query(type,'readwrite',store=>store.delete(item.id));await reload();toast('Запись удалена');}
    catch(e){error(e);}
  }
  function reply(q){
    const text=q.toLocaleLowerCase('ru'),brief=briefingFacts();
    if(/лекарств|таблет|цикл|здоровь|рецепт|анализ/.test(text))
      return 'Медицинские записи я не читаю в общем помощнике. Они остаются отдельно, в «Заботе ♡».';
    if(/сегодня|план|встреч|дела|завтра/.test(text)){
      const match=brief.events.filter(e=>text.includes('завтра')?e.date===tomorrow():e.date===today());
      return match.length?match.slice(0,5).map(x=>(x.time||'В течение дня')+' — '+x.title).join('\n'):'В календаре нет записанных дел на выбранный день. Можно добавить новые в «Мой день».';
    }
    if(/семь|близк|родн|рождени|годовщин|поздрав/.test(text)){
      const list=brief.family.slice(0,5);
      return list.length?'Ближайшие даты:\n'+list.map(x=>shortDate(x.date)+' — '+x.title).join('\n'):'Пока семейные даты не записаны. Добавь их в раздел «Семья».';
    }
    if(/расход|бюджет|финанс|деньг|доход|подписк/.test(text)){
      const month=data.finance.filter(x=>x.date?.startsWith(today().slice(0,7)));
      const inc=month.filter(x=>x.type==='income').reduce((a,b)=>a+Number(b.amount),0);
      const out=month.filter(x=>x.type!=='income').reduce((a,b)=>a+Number(b.amount),0);
      return 'По твоим ручным записям за текущий месяц:\nДоходы — '+money(inc)+'\nРасходы — '+money(out)+'\nРазница — '+money(inc-out)+'.\nЭто не банковский баланс.';
    }
    if(/помн|памят|знаешь|иде|факт/.test(text)){
      const match=data.memory.slice(0,6);
      return match.length?'Я помню только то, что ты сам сохранил:\n'+match.map(x=>'✦ '+x.title+(x.pinned?' ★':'')).join('\n'):'Ничего тайком не запоминаю. «Умная память» сейчас пустая.';
    }
    if(/привет|добрый|здравствуй/.test(text))return 'Привет, шеф! ☕ Сегодня можем разобраться с планами, семьёй или финансами. Какой фронт работ выбираем?';
    return 'Пока я локальный помощник без облачного ИИ. Попробуй: «Что у меня сегодня?», «Когда дни рождения?», «Как мои расходы?» или «Что ты помнишь?».';
  }
  function ask(q){
    const log=$('worldChat');
    log.append(node('div','world-msg user',q));
    log.append(node('div','world-msg bot',reply(q)));
    while(log.children.length>30)log.firstElementChild.remove();
    log.scrollTop=log.scrollHeight;
  }
  function exportBackup(){
    if(!db){toast('Хранилище недоступно');return;}
    const blob=new Blob([JSON.stringify({format:'digital-manager-my-world',version:1,exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='moy-mir-'+today()+'.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast('Копия создана. Файл не зашифрован.');
  }
  function init(){
    document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.world)));
    $('briefRefresh').addEventListener('click',async()=>{await loadCalendar();renderBrief();toast('Брифинг обновлён');});
    $('addFamily').addEventListener('click',()=>openForm('family'));
    $('addMemory').addEventListener('click',()=>openForm('memory'));
    $('addFinance').addEventListener('click',()=>openForm('finance'));
    $('memorySearch').addEventListener('input',renderMemory);
    $('worldForm').addEventListener('submit',save);
    $('worldFormClose').addEventListener('click',()=>$('worldFormDialog').close());
    $('worldFormCancel').addEventListener('click',()=>$('worldFormDialog').close());
    $('worldFormDialog').addEventListener('click',e=>{if(e.target===$('worldFormDialog'))$('worldFormDialog').close();});
    $('worldAskForm').addEventListener('submit',e=>{e.preventDefault();const inp=$('worldQuestion'),q=inp.value.trim();if(q){ask(q);inp.value='';}});
    document.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.ask)));
    $('exportWorld').addEventListener('click',exportBackup);
    const target=new URLSearchParams(location.search).get('tab');
    if(['morning','family','memory','finance','assistant'].includes(target))show(target);else show('morning');
    openDB().then(async result=>{db=result;await reload();await loadCalendar();renderBrief();}).catch(error);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&view==='morning')loadCalendar().then(renderBrief);});
  }
  document.addEventListener('DOMContentLoaded',init);
})();