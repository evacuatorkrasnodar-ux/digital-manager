/* Мой день v1 — calendar and notebook. All records remain in local IndexedDB. */
(() => {
  'use strict';
  const DB_NAME='digital-manager-my-day-v1';
  const EVENTS='events',NOTES='notes';
  const $=id=>document.getElementById(id);
  const pad=n=>String(n).padStart(2,'0');
  const dateKey=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const today=()=>dateKey(new Date());
  const parseDate=value=>{const p=String(value).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
  const monthLabel=d=>new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(d);
  const dayLabel=d=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(parseDate(d));
  const category={task:'Дело',meeting:'Встреча',personal:'Личное',business:'Бизнес'};
  let db=null,storageOk=false,events=[],notes=[],selected=today();
  let month=new Date(new Date().getFullYear(),new Date().getMonth(),1),toastTimeout;
  function elem(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function toast(message){const t=$('dayToast');t.textContent=message;t.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.hidden=true,3300);}
  function fail(e){console.error('My Day storage:',e);toast('Не удалось сохранить. Проверьте настройки браузера и свободное место.');}
  function openDatabase(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB disabled'));return;}
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const database=req.result;
        for(const name of [EVENTS,NOTES]){
          if(!database.objectStoreNames.contains(name)){
            const store=database.createObjectStore(name,{keyPath:'id'});
            store.createIndex('date','date',{unique:false});
          }
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Cannot open database'));
      req.onblocked=()=>reject(new Error('Database open is blocked by another tab'));
    });
  }
  function query(name,mode,operation){
    return new Promise((resolve,reject)=>{
      if(!db){reject(new Error('Database unavailable'));return;}
      let tx,request,result;
      try {
        tx=db.transaction(name,mode);
        request=operation(tx.objectStore(name));
      } catch(e){reject(e);return;}
      if(request){
        request.onsuccess=()=>{result=request.result;};
        request.onerror=()=>reject(request.error||new Error('Request failed'));
      }
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error||new Error('Transaction failed'));
      tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));
    });
  }
  async function refresh(){
    events=await query(EVENTS,'readonly',s=>s.getAll());
    notes=await query(NOTES,'readonly',s=>s.getAll());
    events.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')||a.createdAt-b.createdAt);
    notes.sort((a,b)=>b.updatedAt-a.updatedAt);
    render();
  }
  function setView(view){
    $('calendarView').hidden=view!=='calendar';
    $('notesView').hidden=view!=='notes';
    document.querySelectorAll('[data-view]').forEach(btn=>{
      const active=btn.dataset.view===view;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
    });
  }
  function render(){
    $('calendarMonth').textContent=monthLabel(month);
    $('selectedDateLabel').textContent=dayLabel(selected);
    $('notesCount').textContent=notes.length;
    $('notesCount').hidden=notes.length===0;
    renderMonth();renderEvents();renderDayNotes();renderNotes();
  }
  function renderMonth(){
    const grid=$('monthGrid');grid.replaceChildren();
    const first=new Date(month.getFullYear(),month.getMonth(),1);
    const offset=(first.getDay()+6)%7;
    const days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    const count=Math.max(35,Math.ceil((offset+days)/7)*7);
    const eventDates=new Set(events.map(e=>e.date)),noteDates=new Set(notes.map(n=>n.date));
    for(let i=0;i<count;i++){
      const d=new Date(first.getFullYear(),first.getMonth(),i-offset+1),key=dateKey(d);
      const button=elem('button','calendar-day',String(d.getDate()));button.type='button';
      if(d.getMonth()!==first.getMonth())button.classList.add('outside');
      if(key===today())button.classList.add('today');
      if(key===selected)button.classList.add('selected');
      button.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d));
      button.setAttribute('aria-pressed',String(key===selected));
      const markers=elem('span','markers');markers.setAttribute('aria-hidden','true');
      if(eventDates.has(key))markers.append(elem('i','event'));
      if(noteDates.has(key))markers.append(elem('i','note'));
      button.append(markers);
      button.addEventListener('click',()=>{selected=key;month=new Date(d.getFullYear(),d.getMonth(),1);render();});
      grid.append(button);
    }
  }
  function empty(list,symbol,message){
    const wrapper=elem('div','day-empty');
    wrapper.append(elem('span','empty-icon',symbol),elem('span','',message));
    list.replaceChildren(wrapper);
  }
  function action(symbol,label,callback){
    const button=elem('button','',symbol);button.type='button';
    button.setAttribute('aria-label',label);button.title=label;button.addEventListener('click',callback);
    return button;
  }
  function renderEvents(){
    const list=$('eventsList');list.replaceChildren();
    const items=events.filter(e=>e.date===selected);
    if(!items.length){empty(list,'✦','План свободен. Самое время придумать что-нибудь хорошее.');return;}
    for(const item of items){
      const row=elem('article','day-event'+(item.done?' done':''));
      const checkbox=elem('input','event-check');checkbox.type='checkbox';checkbox.checked=Boolean(item.done);
      checkbox.setAttribute('aria-label','Выполнено: '+item.title);
      checkbox.addEventListener('change',async()=>{
        try{
          await query(EVENTS,'readwrite',s=>s.put({...item,done:checkbox.checked,updatedAt:Date.now()}));
          await refresh();
        }catch(e){fail(e);refresh().catch(()=>{});}
      });
      const main=elem('div','event-main'),head=elem('div','event-head');
      head.append(elem('span','event-title',item.title),elem('span','event-tag '+item.kind,category[item.kind]||'Дело'));main.append(head);
      main.append(elem('div','event-meta',(item.time?item.time+' · ':'')+(item.done?'Выполнено':'Запланировано')));
      if(item.detail)main.append(elem('p','event-detail',item.detail));
      const controls=elem('div','item-actions');
      controls.append(action('✎','Изменить событие',()=>openEvent(item)),action('×','Удалить событие',()=>remove(EVENTS,item)));
      row.append(checkbox,main,controls);list.append(row);
    }
  }
  function renderDayNotes(){
    const list=$('dayNotesList');list.replaceChildren();
    const items=notes.filter(n=>n.date===selected);
    if(!items.length){empty(list,'✎','Мысли этого дня пока не записаны.');return;}
    for(const item of items.slice(0,4)){
      const row=elem('div','note-mini');
      const button=elem('button','',item.title);button.type='button';button.addEventListener('click',()=>openNote(item));
      row.append(elem('span','','✎'),button,elem('small','',item.kind==='business'?'Работа':'Личное'));list.append(row);
    }
    if(items.length>4){const more=elem('button','day-add subtle','Все записи: '+items.length);more.type='button';more.addEventListener('click',()=>setView('notes'));list.append(more);}
  }
  function renderNotes(){
    const list=$('notesList');list.replaceChildren();
    const search=$('noteSearch').value.trim().toLocaleLowerCase('ru');
    const matches=notes.filter(n=>!search||(n.title+' '+n.text).toLocaleLowerCase('ru').includes(search));
    if(!matches.length){empty(list,'✍','Пока нет подходящих записей. Первая идея уже ждёт.');return;}
    for(const item of matches){
      const card=elem('article','note-card'),head=elem('div','note-card-header');
      const controls=elem('div','item-actions');
      controls.append(action('✎','Изменить заметку',()=>openNote(item)),action('×','Удалить заметку',()=>remove(NOTES,item)));
      head.append(elem('div','note-card-title',item.title),controls);card.append(head,elem('p','note-card-content',item.text));
      const meta=elem('div','note-card-meta');
      meta.append(elem('span','',item.date.split('-').reverse().join('.')),elem('span','',item.kind==='business'?'Работа':'Личное'));
      card.append(meta);list.append(card);
    }
  }
  function openEvent(item){
    $('eventForm').reset();$('eventId').value=item?.id||'';
    $('eventDialogTitle').textContent=item?'Изменить событие':'Новое событие';
    $('eventTitle').value=item?.title||'';
    $('eventDate').value=item?.date||selected;
    $('eventTime').value=item?.time||'';
    $('eventKind').value=item?.kind||'task';
    $('eventDetail').value=item?.detail||'';
    $('eventDialog').showModal();$('eventTitle').focus();
  }
  function openNote(item){
    $('noteForm').reset();$('noteId').value=item?.id||'';
    $('noteDialogTitle').textContent=item?'Изменить запись':'Новая запись';
    $('noteTitle').value=item?.title||'';
    $('noteDate').value=item?.date||selected;
    $('noteKind').value=item?.kind||'personal';
    $('noteText').value=item?.text||'';
    $('noteDialog').showModal();$('noteTitle').focus();
  }
  function uid(){return window.crypto?.randomUUID?.()||'md-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
  async function remove(store,item){
    if(!confirm('Удалить «'+item.title+'»? Восстановить запись будет нельзя.'))return;
    try{await query(store,'readwrite',s=>s.delete(item.id));await refresh();toast('Запись удалена');}catch(e){fail(e);}
  }
  async function saveEvent(e){
    e.preventDefault();
    if(!storageOk){toast('Хранилище недоступно: не удалось сохранить.');return;}
    const id=$('eventId').value,old=events.find(x=>x.id===id),title=$('eventTitle').value.trim(),date=$('eventDate').value;
    if(!title||!(/^\d{4}-\d{2}-\d{2}$/).test(date))return;
    const item={
      id:id||uid(),title,date,time:$('eventTime').value,kind:$('eventKind').value,
      detail:$('eventDetail').value.trim(),done:old?.done||false,
      createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()
    };
    try{
      await query(EVENTS,'readwrite',s=>s.put(item));$('eventDialog').close();
      selected=date;const d=parseDate(date);month=new Date(d.getFullYear(),d.getMonth(),1);
      await refresh();toast('Событие сохранено');
    }catch(error){fail(error);}
  }
  async function saveNote(e){
    e.preventDefault();
    if(!storageOk){toast('Хранилище недоступно: не удалось сохранить.');return;}
    const id=$('noteId').value,old=notes.find(x=>x.id===id);
    const title=$('noteTitle').value.trim(),date=$('noteDate').value,text=$('noteText').value.trim();
    if(!title||!text||!(/^\d{4}-\d{2}-\d{2}$/).test(date))return;
    const item={id:id||uid(),title,date,kind:$('noteKind').value,text,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};
    try{await query(NOTES,'readwrite',s=>s.put(item));$('noteDialog').close();await refresh();toast('Запись сохранена');}
    catch(error){fail(error);}
  }
  function exportBackup(){
    if(!storageOk){toast('Хранилище недоступно');return;}
    const backup={format:'digital-manager-my-day',version:1,exportedAt:new Date().toISOString(),events,notes};
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='moy-den-'+today()+'.json';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
    toast('Копия создана. JSON содержит личные данные без шифрования.');
  }
  async function init(){
    // Calendar links from the notification center open the actual event date.
    const dateParam=new URLSearchParams(location.search).get('date');
    if(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)){
      const d=parseDate(dateParam);
      if(dateKey(d)===dateParam){
        selected=dateParam;
        month=new Date(d.getFullYear(),d.getMonth(),1);
      }
    }
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    $('prevMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);render();});
    $('nextMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);render();});
    $('goToday').addEventListener('click',()=>{selected=today();const d=new Date();month=new Date(d.getFullYear(),d.getMonth(),1);setView('calendar');render();});
    $('addEvent').addEventListener('click',()=>openEvent());
    $('addNote').addEventListener('click',()=>openNote());
    $('addNoteForDay').addEventListener('click',()=>openNote());
    $('noteSearch').addEventListener('input',renderNotes);
    $('eventForm').addEventListener('submit',saveEvent);
    $('noteForm').addEventListener('submit',saveNote);
    $('exportDay').addEventListener('click',exportBackup);
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
    for(const id of ['eventDialog','noteDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();});
    const greetings=[
      'Напоминать — моя работа. Успевать всё — не обязательно.',
      'Планы на день есть. Главное — не забыть про себя.',
      'Хорошие идеи любят блокнот. И иногда кофе.',
      'Пусть важные дела будут под рукой, а нервы — в отпуске.'
    ];
    $('dayGreeting').textContent=greetings[new Date().getDate()%greetings.length];
    render();
    try{db=await openDatabase();storageOk=true;await refresh();}
    catch(e){
      fail(e);
      $('calendarView').prepend(elem('div','day-empty','Хранилище браузера недоступно. Календарь можно смотреть, но записи не сохранятся.'));
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();