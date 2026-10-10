/* Мой день v1 — calendar and notebook. All records remain in local IndexedDB. */
(() => {
  'use strict';
  const DB_NAME='digital-manager-my-day-v1';
  const ru=window.DMRuCalendar;
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
  let eventFromNote=false;
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
    const calendar=view==='calendar';
    document.documentElement.classList.toggle('myday-calendar-locked',calendar);
    document.querySelector('.day-shell')?.classList.toggle('calendar-fixed',calendar);
    $('calendarView').hidden=!calendar;
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
    renderMonth();renderEvents();renderDayNotes();renderNotes();renderRuStatus();
  }
  function renderMonth(){
    const grid=$('monthGrid');grid.replaceChildren();
    const first=new Date(month.getFullYear(),month.getMonth(),1);
    const offset=(first.getDay()+6)%7;
    const days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    const count=Math.max(35,Math.ceil((offset+days)/7)*7);
    grid.dataset.weeks=String(count/7);
    const eventDates=new Set(events.map(e=>e.date)),noteDates=new Set(notes.map(n=>n.date));
    for(let i=0;i<count;i++){
      const d=new Date(first.getFullYear(),first.getMonth(),i-offset+1),key=dateKey(d);
      const button=elem('button','calendar-day',String(d.getDate()));button.type='button';
      if(d.getMonth()!==first.getMonth())button.classList.add('outside');
      if(key===today())button.classList.add('today');
      if(key===selected)button.classList.add('selected');
      const calendarDay=ru.getDay(key);
      if(calendarDay.weekend)button.classList.add('ru-weekend');
      if(calendarDay.holiday)button.classList.add('ru-holiday');
      if(calendarDay.transferred)button.classList.add('ru-transferred');
      if(calendarDay.off)button.title=calendarDay.label+(calendarDay.confirmed?' · нерабочий день':' · предварительно');
      button.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)+(calendarDay.off?', '+calendarDay.label+', нерабочий день':''));
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
  // Shared thin line-icons for real, accessible notebook controls.
  function strokeSvg(paths){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    for(const d of paths){
      const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p);
    }
    return svg;
  }
  function noteOutline(){return strokeSvg([
    'M7 3.5h8.5l3.2 3.2v12.1c0 1-.8 1.7-1.7 1.7H7c-1 0-1.7-.7-1.7-1.7V5.2c0-1 .7-1.7 1.7-1.7Z',
    'M15.5 3.5v3.4h3.2','M8.4 10.9h7.2','M8.4 13.9h7.2','M8.4 16.9h5.1'
  ]);}
  function littleChevron(){return strokeSvg(['m9 5 7 7-7 7']);}
  // Compact interactive empty cards, without fabricating appointments or notes.
  function compactDayEmpty(list,type,title,message,open){
    const row=elem('div','day-compact-empty '+type);
    const symbol=elem('span','compact-empty-symbol',type==='compact-note'?'':'✦');
    if(type==='compact-note')symbol.append(noteOutline());
    symbol.setAttribute('aria-hidden','true');
    const body=elem('div','compact-empty-content');
    body.append(elem('strong','',title),elem('small','',message));
    const arrow=action('',type==='compact-note'?'Создать заметку':'Добавить событие',open);
    arrow.classList.add('compact-empty-action');
    arrow.append(littleChevron());
    row.append(symbol,body,arrow);
    list.replaceChildren(row);
  }
  function action(symbol,label,callback){
    const button=elem('button','',symbol);button.type='button';
    button.setAttribute('aria-label',label);button.title=label;button.addEventListener('click',callback);
    return button;
  }
  function renderEvents(){
    const list=$('eventsList');list.replaceChildren();
    const items=events.filter(e=>e.date===selected);
    if(!items.length){compactDayEmpty(list,'compact-event','Событий пока нет','Добавьте событие на выбранный день',()=>openEvent());return;}
    for(const item of items){
      const row=elem('article','day-event'+(item.done?' done':''));
      const clock=elem('span','event-clock');
      clock.append(elem('strong','',item.time||'На день'));
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
      main.append(elem('div','event-meta',item.done?'Выполнено':'Запланировано'));
      if(item.detail)main.append(elem('p','event-detail',item.detail));
      const controls=elem('div','item-actions');
      controls.append(action('✎','Изменить событие',()=>openEvent(item)),action('×','Удалить событие',()=>remove(EVENTS,item)));
      row.append(clock,checkbox,main,controls);list.append(row);
    }
  }
  function renderDayNotes(){
    const list=$('dayNotesList');list.replaceChildren();
    const items=notes.filter(n=>n.date===selected);
    if(!items.length){compactDayEmpty(list,'compact-note','Заметок пока нет','Мысли этого дня пока не записаны.',()=>openNote());return;}
    for(const item of items.slice(0,4)){
      const row=elem('div','note-mini');
      const symbol=elem('span','note-mini-symbol');symbol.append(noteOutline());
      symbol.setAttribute('aria-hidden','true');
      const button=elem('button','note-mini-body');
      button.type='button';
      button.append(
        elem('strong','',item.title),
        elem('small','',item.text?.trim().slice(0,110)||'Открыть запись')
      );
      button.addEventListener('click',()=>openNote(item));
      const toPlan=action('','Создать событие из заметки «'+item.title+'»',()=>openEventFromNote(item));
      toPlan.classList.add('note-to-plan');
      toPlan.append(strokeSvg(['M4 12h15','m13 6 6 6-6 6']),elem('span','','В план'));
      const arrow=action('','Открыть запись «'+item.title+'»',()=>openNote(item));
      arrow.classList.add('note-mini-chevron');
      arrow.append(littleChevron());
      row.append(symbol,button,toPlan,arrow);
      list.append(row);
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
      const toPlan=action('','Создать событие из заметки «'+item.title+'»',()=>openEventFromNote(item));
      toPlan.classList.add('note-card-to-plan');
      toPlan.append(strokeSvg(['M4 12h15','m13 6 6 6-6 6']),elem('span','','В план'));
      meta.append(elem('span','',item.date.split('-').reverse().join('.')),elem('span','',item.kind==='business'?'Работа':'Личное'),toPlan);
      card.append(meta);list.append(card);
    }
  }
  function renderRuStatus(){
    const status=$('ruSelectedStatus'),day=ru.getDay(selected);
    if(day.off){
      status.hidden=false;
      const count=events.filter(e=>e.date===selected&&!e.done&&e.kind!=='personal').length;
      status.textContent='✦ '+day.label+' — нерабочий день'+(day.confirmed?'':' (переносы на этот год ещё не подтверждены)')+(count?'. Запланировано рабочих дел: '+count:'')+'.';
    }else status.hidden=true;
    const next=new Date();next.setDate(next.getDate()+1);const date=dateKey(next);
    const tomorrow=ru.getDay(date),banner=$('ruTomorrowWarning');
    const scheduled=events.filter(e=>e.date===date&&!e.done&&e.kind!=='personal').length;
    if(tomorrow.off){
      banner.hidden=false;
      banner.textContent='☀ Шеф, завтра '+(tomorrow.holiday||tomorrow.transferred?tomorrow.label.toLowerCase():'выходной')+'.'+(scheduled?' А у тебя на этот день запланировано рабочих дел: '+scheduled+'. Проверь график.':' Отдых — тоже важная часть плана!')+(tomorrow.confirmed?'':' (переносы предварительные)');
    }else banner.hidden=true;
  }
  function updateRuAdvice(){
    const date=$('eventDate').value,kind=$('eventKind').value,day=ru.getDay(date),box=$('ruEventAdvice');
    if(!day.valid||!day.off||kind==='personal'){box.hidden=true;return;}
    box.hidden=false;
    $('ruEventAdviceText').textContent='⚠ '+day.label+' — нерабочий день'+(day.confirmed?'':' (переносы могут измениться)')+'. Можно оставить дату или выбрать ближайший рабочий день.';
    const next=ru.nextWorkingDay(date);$('ruMoveWorking').hidden=!next;
    $('ruMoveWorking').dataset.next=next||'';
  }
  function openEvent(item){
    eventFromNote=false;
    $('eventFromNoteHint').hidden=true;
    $('eventForm').reset();$('eventId').value=item?.id||'';
    $('eventDialogTitle').textContent=item?'Изменить событие':'Новое событие';
    $('eventTitle').value=item?.title||'';
    $('eventDate').value=item?.date||selected;
    $('eventTime').value=item?.time||'';
    $('eventKind').value=item?.kind||'task';
    $('eventDetail').value=item?.detail||'';
    updateRuAdvice();$('eventDialog').showModal();$('eventTitle').focus();
  }
  // Prefill the regular event editor from a saved note without modifying that note.
  function openEventFromNote(note){
    openEvent();
    eventFromNote=true;
    $('eventDialogTitle').textContent='Событие из заметки';
    $('eventTitle').value=String(note.title||'').slice(0,100);
    $('eventDate').value=note.date||selected;
    $('eventKind').value=note.kind==='business'?'business':'personal';
    const original=String(note.text||'');
    $('eventDetail').value=original.slice(0,2500);
    const hint=$('eventFromNoteHint');
    hint.textContent='Поля заполнены из заметки. Выберите дату и время. Заметка останется в блокноте.'+
      (original.length>2500?' В событие перенесены первые 2500 символов; полный текст сохранён в заметке.':'');
    hint.hidden=false;
    updateRuAdvice();
    $('eventTitle').focus();
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
    const dayOff=ru.getDay(date);
    if(dayOff.off&&$('eventKind').value!=='personal'&&!window.confirm('Шеф, '+ru.formatDate(date)+' — '+dayOff.label+' (нерабочий день). Всё равно сохранить дело на эту дату?'))return;
    const item={
      id:id||uid(),title,date,time:$('eventTime').value,kind:$('eventKind').value,
      detail:$('eventDetail').value.trim(),done:old?.done||false,
      createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()
    };
    try{
      await query(EVENTS,'readwrite',s=>s.put(item));$('eventDialog').close();
      selected=date;const d=parseDate(date);month=new Date(d.getFullYear(),d.getMonth(),1);
      if(eventFromNote)setView('calendar');
      eventFromNote=false;
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
    setView(new URLSearchParams(location.search).get('view')==='notes'?'notes':'calendar');
    $('prevMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);render();});
    $('nextMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);render();});
    $('goToday')?.addEventListener('click',()=>{selected=today();const d=new Date();month=new Date(d.getFullYear(),d.getMonth(),1);setView('calendar');render();});
    $('addEvent').addEventListener('click',()=>openEvent());
    $('eventDate').addEventListener('change',updateRuAdvice);
    $('eventKind').addEventListener('change',updateRuAdvice);
    $('ruMoveWorking').addEventListener('click',()=>{
      const next=$('ruMoveWorking').dataset.next;
      if(next){$('eventDate').value=next;updateRuAdvice();toast('Ближайший рабочий день: '+ru.formatDate(next));}
    });
    $('addNote').addEventListener('click',()=>openNote());
    $('addNoteForDay').addEventListener('click',()=>openNote());
    $('noteSearch').addEventListener('input',renderNotes);
    $('eventForm').addEventListener('submit',saveEvent);
    $('noteForm').addEventListener('submit',saveNote);
    $('exportDay').addEventListener('click',exportBackup);
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
    for(const id of ['eventDialog','noteDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();});
    $('dayGreeting').textContent='Планы на день есть. Главное — не забыть про себя.';
    render();
    try{db=await openDatabase();storageOk=true;await refresh();}
    catch(e){
      fail(e);
      $('calendarView').prepend(elem('div','day-empty','Хранилище браузера недоступно. Календарь можно смотреть, но записи не сохранятся.'));
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();