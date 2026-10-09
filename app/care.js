/* Private care calendar: voluntary, locally stored, never mixed with public notifications. */
(() => {
  'use strict';
  const DB='digital-manager-private-care-v1',PERIODS='periods',MOODS='moods',SETTINGS='settings';
  const $=id=>document.getElementById(id);
  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const today=()=>dayKey(new Date());
  const parse=key=>{
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
    if(!m)return null;
    const d=new Date(+m[1],+m[2]-1,+m[3],12);
    return dayKey(d)===key?d:null;
  };
  const addDays=(key,days)=>{const d=parse(key);if(!d)return null;d.setDate(d.getDate()+days);return dayKey(d);};
  const distance=(a,b)=>{const x=parse(a),y=parse(b);return x&&y?Math.round((Date.UTC(y.getFullYear(),y.getMonth(),y.getDate())-Date.UTC(x.getFullYear(),x.getMonth(),x.getDate()))/86400000):NaN;};
  const nice=key=>{const d=parse(key);return d?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(d):'—';};
  const full=key=>{const d=parse(key);return d?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d):'—';};
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
  const moods={great:'✨ Прекрасно',calm:'🌿 Спокойно',tired:'☕ Устала',sensitive:'♡ Чувствительно',pain:'☾ Дискомфорт',other:'✎ По-разному'};
  let db,enabled=false,settings={cycle:28,length:5},periods=[],diary=[],selected=today();
  let month=new Date(new Date().getFullYear(),new Date().getMonth(),1),toastTimer;
  function toast(message){const t=$('careToast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3600);}
  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{
        const database=req.result;
        for(const store of [PERIODS,MOODS,SETTINGS]){
          if(!database.objectStoreNames.contains(store))database.createObjectStore(store,{keyPath:'id'});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Database error'));
      req.onblocked=()=>reject(new Error('Database blocked in other tab'));
    });
  }
  function txn(store,mode,op){
    return new Promise((resolve,reject)=>{
      if(!db){reject(new Error('No storage'));return;}
      let request,result,tx;
      try{tx=db.transaction(store,mode);request=op(tx.objectStore(store));}
      catch(error){reject(error);return;}
      if(request){request.onsuccess=()=>{result=request.result;};request.onerror=()=>reject(request.error||new Error('Store request error'));}
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error||new Error('Store failed'));
      tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));
    });
  }
  function uuid(){return crypto?.randomUUID?.()||'care-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
  function error(e){console.error('Private care storage:',e);toast('Не удалось сохранить: проверьте настройки браузера.');}
  async function load(){
    const [config,items,moodsData]=await Promise.all([
      txn(SETTINGS,'readonly',s=>s.get('private')),
      txn(PERIODS,'readonly',s=>s.getAll()),
      txn(MOODS,'readonly',s=>s.getAll())
    ]);
    enabled=config?.enabled===true;
    const c=Number(config?.cycle),l=Number(config?.length);
    settings={cycle:Number.isInteger(c)&&c>=21&&c<=45?c:28,length:Number.isInteger(l)&&l>=2&&l<=10?l:5};
    periods=(items||[]).filter(x=>parse(x.start)).sort((a,b)=>b.start.localeCompare(a.start));
    diary=(moodsData||[]).filter(x=>parse(x.date));
    render();
  }
  function render(){
    $('careSetup').hidden=enabled;
    $('careEnabled').hidden=!enabled;
    if(!enabled)return;
    $('careCycleLength').value=settings.cycle;
    $('carePeriodLength').value=settings.length;
    const hasRecords=periods.length>0;
    $('careEmpty').hidden=hasRecords;
    $('careDashboard').hidden=!hasRecords;
    if(hasRecords)renderStats();
    renderMonth();renderDetails();renderHistory();
  }
  function latest(){return periods[0]||null;}
  function forecast(){
    const last=latest();
    if(!last||distance(last.start,today())>140||distance(last.start,today())<0)return null;
    return addDays(last.start,settings.cycle);
  }
  function renderStats(){
    const last=latest(),elapsed=distance(last.start,today()),expected=forecast();
    if(elapsed>=0&&elapsed<settings.cycle){
      $('careCycleDay').textContent=(elapsed+1)+'-й день';
      $('careCycleCaption').textContent='По последней отметке';
    }else{
      $('careCycleDay').textContent='—';
      $('careCycleCaption').textContent='Добавь новое начало цикла';
    }
    if(expected){
      const delta=distance(today(),expected);
      $('careNextDate').textContent=delta>=0?nice(expected):'Уточнить';
      $('careNextCaption').textContent=delta>0?'Через '+delta+' дн. (примерно)':delta===0?'Ожидается сегодня':'Предполагаемая дата прошла';
    }else{
      $('careNextDate').textContent='—';
      $('careNextCaption').textContent='Нужна новая запись';
    }
    const observed=periods.map(p=>p.start).sort();
    const gaps=observed.slice(1).map((date,i)=>distance(observed[i],date)).filter(n=>n>=15&&n<=70);
    $('careForecastNote').textContent=gaps.length
      ? 'По истории: интервалы от '+Math.min(...gaps)+' до '+Math.max(...gaps)+' дней. Прогноз рассчитывается по выбранной длине '+settings.cycle+' дней и может отличаться от реальности.'
      : 'Это предварительный расчёт по заданной длине '+settings.cycle+' дней. У разных людей цикл отличается, а со временем может изменяться.';
  }
  function periodFor(key){
    for(const p of periods){
      const end=p.end||addDays(p.start,settings.length-1);
      if(key>=p.start&&key<=end)return p;
    }
    return null;
  }
  function predicted(key){
    const start=forecast();
    return start&&key>=start&&key<=addDays(start,settings.length-1)&&!periodFor(key);
  }
  function renderMonth(){
    const grid=$('careCalendarGrid');grid.replaceChildren();
    $('careMonthTitle').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(month);
    const begin=new Date(month.getFullYear(),month.getMonth(),1,12),offset=(begin.getDay()+6)%7,days=new Date(begin.getFullYear(),begin.getMonth()+1,0).getDate();
    const count=Math.max(35,Math.ceil((offset+days)/7)*7);
    const marked=new Set(diary.map(d=>d.date));
    for(let i=0;i<count;i++){
      const d=new Date(begin.getFullYear(),begin.getMonth(),i-offset+1,12),key=dayKey(d);
      const cell=el('button','calendar-day',d.getDate());cell.type='button';
      if(d.getMonth()!==begin.getMonth())cell.classList.add('outside');
      if(key===today())cell.classList.add('today');
      if(key===selected)cell.classList.add('selected');
      if(periodFor(key))cell.classList.add('recorded');else if(predicted(key))cell.classList.add('forecast');
      const markers=el('span','markers');markers.setAttribute('aria-hidden','true');
      if(periodFor(key))markers.append(el('i','event'));
      if(marked.has(key))markers.append(el('i','note'));
      cell.append(markers);
      cell.setAttribute('aria-label',full(key)+(periodFor(key)?', отмечена менструация':predicted(key)?', предварительный прогноз':'')+(marked.has(key)?', отметка самочувствия':''));
      cell.setAttribute('aria-pressed',String(key===selected));
      cell.addEventListener('click',()=>{selected=key;month=new Date(d.getFullYear(),d.getMonth(),1);renderMonth();renderDetails();});
      grid.append(cell);
    }
  }
  function detail(text,subtitle,glyph){
    const card=el('div','care-day-item'),icon=el('span','care-day-glyph',glyph),copy=el('div','care-day-copy');
    copy.append(el('strong','',text),el('small','',subtitle));card.append(icon,copy);return card;
  }
  function renderDetails(){
    $('careChosenTitle').textContent=nice(selected);
    const list=$('careDayDetails');list.replaceChildren();
    const period=periodFor(selected);
    if(period)list.append(detail('Отмечена менструация','Начало: '+nice(period.start)+' · '+(period.end?'конец: '+nice(period.end):'длительность пока приблизительная'),'❀'));
    else if(predicted(selected))list.append(detail('Прогнозируемые дни','Только ориентир — не фактическая запись','✧'));
    const mood=diary.find(x=>x.date===selected);
    if(mood){
      const card=detail(moods[mood.value]||'Мои ощущения',mood.note||'Без заметки','♡');
      const edit=el('button','care-history-edit','✎');edit.type='button';edit.setAttribute('aria-label','Изменить самочувствие');
      edit.addEventListener('click',()=>openMood(selected));card.append(edit);list.append(card);
      const del=el('button','care-history-edit','×');del.type='button';del.setAttribute('aria-label','Удалить отметку самочувствия');
      del.addEventListener('click',async()=>{if(!confirm('Удалить запись самочувствия за '+full(selected)+'?'))return;try{await txn(MOODS,'readwrite',s=>s.delete(selected));await load();toast('Отметка удалена');}catch(e){error(e);}});card.append(del);
    }
    if(!period&&!predicted(selected)&&!mood)list.append(el('p','care-quiet','Здесь пока нет отметок. И это тоже нормально. ♡'));
  }
  function renderHistory(){
    const list=$('carePeriodHistory');list.replaceChildren();
    if(!periods.length){list.append(el('p','care-quiet','Здесь появятся даты начала цикла.'));return;}
    for(const p of periods.slice(0,24)){
      const row=el('article','care-history-item'),copy=el('div','care-history-content','✿ '+full(p.start));
      copy.append(el('small','',p.end?'По '+full(p.end):'Продолжительность не указана'));
      const edit=el('button','','✎');edit.type='button';edit.setAttribute('aria-label','Изменить начало '+p.start);edit.addEventListener('click',()=>openPeriod(p));
      const del=el('button','','×');del.type='button';del.setAttribute('aria-label','Удалить начало '+p.start);
      del.addEventListener('click',async()=>{
        if(!confirm('Удалить отметку начала цикла '+full(p.start)+'?'))return;
        try{await txn(PERIODS,'readwrite',s=>s.delete(p.id));await load();toast('Дата удалена');}catch(e){error(e);}
      });
      row.append(copy,edit,del);list.append(row);
    }
  }
  function openPeriod(p){
    if(!enabled)return;
    $('carePeriodForm').reset();$('carePeriodDialogTitle').textContent=p?'Изменить отметку':'Начало цикла';
    $('carePeriodId').value=p?.id||'';
    $('carePeriodDate').value=p?.start||((selected<=today()&&parse(selected))?selected:today());
    $('carePeriodDate').max=today();
    $('carePeriodEnd').value=p?.end||'';
    $('carePeriodEnd').max=today();
    $('carePeriodDialog').showModal();
  }
  function openMood(date){
    if(!enabled)return;
    $('careMoodForm').reset();
    const record=diary.find(d=>d.date===date);
    $('careMoodDate').value=date||today();
    $('careMoodDate').max=today();
    $('careMoodValue').value=record?.value||'calm';
    $('careMoodNote').value=record?.note||'';
    $('careMoodDialog').showModal();
  }
  async function savePeriod(e){
    e.preventDefault();
    const start=$('carePeriodDate').value,end=$('carePeriodEnd').value;
    if(!parse(start)||start>today()){toast('Укажи реальную дату начала, не позже сегодняшней.');return;}
    if(end&&(!parse(end)||end<start||end>today()||distance(start,end)>14)){toast('Конец должен быть после начала и не позже 14 дней от него.');return;}
    const id=$('carePeriodId').value||uuid();
    const conflict=periods.some(p=>p.id!==id&&p.start===start);
    if(conflict){toast('Эта дата уже записана. Её можно изменить в истории.');return;}
    try{
      await txn(PERIODS,'readwrite',s=>s.put({id,start,end,updatedAt:Date.now()}));
      $('carePeriodDialog').close();selected=start;const d=parse(start);month=new Date(d.getFullYear(),d.getMonth(),1);
      await load();toast('Отметка сохранена ♡');
    }catch(error){error(error);}
  }
  async function saveMood(e){
    e.preventDefault();
    const date=$('careMoodDate').value;
    if(!parse(date)||date>today()){toast('Дату самочувствия можно отметить только за прошедшие дни или сегодня.');return;}
    try{
      await txn(MOODS,'readwrite',s=>s.put({id:date,date,value:$('careMoodValue').value,note:$('careMoodNote').value.trim(),updatedAt:Date.now()}));
      $('careMoodDialog').close();selected=date;const d=parse(date);month=new Date(d.getFullYear(),d.getMonth(),1);
      await load();toast('Самочувствие сохранено ♡');
    }catch(error){error(error);}
  }
  async function saveSettings(e){
    e.preventDefault();const c=Number($('careCycleLength').value),l=Number($('carePeriodLength').value);
    if(!Number.isInteger(c)||c<21||c>45||!Number.isInteger(l)||l<2||l>10){toast('Допустимо: цикл 21–45 дней, менструация 2–10 дней.');return;}
    try{await txn(SETTINGS,'readwrite',s=>s.put({id:'private',enabled:true,cycle:c,length:l}));await load();toast('Твой ритм сохранён');}catch(error){error(error);}
  }
  async function enable(){
    if(!$('careConsent').checked){toast('Нужно согласиться с условиями хранения.');return;}
    try{await txn(SETTINGS,'readwrite',s=>s.put({id:'private',enabled:true,cycle:28,length:5}));await load();toast('Твоё личное пространство готово ♡');}catch(error){error(error);}
  }
  function exportPrivate(){
    if(!enabled)return;
    const copy={format:'digital-manager-private-care',version:1,exportedAt:new Date().toISOString(),settings,periods,wellbeing:diary};
    const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=el('a');
    a.href=url;a.download='lichnyj-kalendar-'+today()+'.json';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    toast('Личная копия создана. Файл не зашифрован — храни осторожно.');
  }
  async function erase(){
    if(!confirm('Полностью удалить все записи цикла и самочувствия с этого устройства? Восстановить без резервной копии нельзя.'))return;
    if(!confirm('Подтвердить окончательное удаление всех данных раздела «Забота»?'))return;
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction([PERIODS,MOODS,SETTINGS],'readwrite');
        tx.objectStore(PERIODS).clear();tx.objectStore(MOODS).clear();tx.objectStore(SETTINGS).clear();
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Erase failed'));tx.onabort=()=>reject(tx.error||new Error('Erase aborted'));
      });
      $('careConsent').checked=false;$('careEnable').disabled=true;
      await load();toast('Все личные записи на этом устройстве удалены');
    }catch(error){error(error);}
  }
  async function init(){
    $('careConsent').addEventListener('change',()=>{$('careEnable').disabled=!$('careConsent').checked;});
    $('careEnable').addEventListener('click',enable);
    $('careFirstPeriod').addEventListener('click',()=>openPeriod());
    $('careAddPeriod').addEventListener('click',()=>openPeriod());
    $('careAddMood').addEventListener('click',()=>openMood(selected<=today()?selected:today()));
    $('carePeriodForm').addEventListener('submit',savePeriod);
    $('careMoodForm').addEventListener('submit',saveMood);
    $('careSettingsForm').addEventListener('submit',saveSettings);
    $('carePrevMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderMonth();});
    $('careNextMonth').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderMonth();});
    $('careExport').addEventListener('click',exportPrivate);
    $('careErase').addEventListener('click',erase);
    document.querySelectorAll('[data-care-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.careClose).close()));
    for(const id of ['carePeriodDialog','careMoodDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();});
    try{db=await openDB();await load();}
    catch(e){
      console.error('Private care unavailable:',e);
      $('careSetup').hidden=false;$('careEnabled').hidden=true;
      $('careEnable').disabled=true;$('careConsent').disabled=true;
      $('careSetup').append(el('p','care-privacy-note','Хранилище браузера недоступно. Включить сохранение записей на этом устройстве сейчас нельзя.'));
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();