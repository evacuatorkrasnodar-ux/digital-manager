/* Small optional Home widgets. Reuse existing IndexedDB stores; never invent private data. */
(() => {
  'use strict';
  const root=document.getElementById('dmHomeWidgets');
  if(!root)return;
  const KEY='digital-manager-black-velvet-v2';
  const keys={dayWidget:'day',calendarWidget:'calendar',healthSteps:'steps',breathing:'breathe'};
  const $=id=>document.getElementById(id);
  const pad=n=>String(n).padStart(2,'0');
  const key=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const niceDate=s=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(s+'T12:00:00'));
  const today=()=>key(new Date());
  let events=[],month=new Date(new Date().getFullYear(),new Date().getMonth(),1),selected=today();
  let generation=0,breathTimer=null,breathStartedAt=0;

  function createCard(id,kind,html){
    const el=document.createElement('article');
    el.id=id;el.className='dm-home-widget dm-widget-'+kind;el.hidden=true;el.innerHTML=html;
    root.append(el);
    return el;
  }
  createCard('dmWidgetDay','day',
    '<div class="dm-widget-heading"><span class="dm-widget-icon">✦</span><span>Мой день</span><a href="./myday.html" aria-label="Открыть Мой день">↗</a></div>'+
    '<strong class="dm-widget-big" id="dmWidgetDayCount">—</strong><p class="dm-widget-copy" id="dmWidgetDayStatus">Загружаем планы</p>'+
    '<small class="dm-widget-foot" id="dmWidgetDayNext"></small>');
  createCard('dmWidgetSteps','steps',
    '<div class="dm-widget-heading"><span class="dm-widget-icon">♡</span><span>Здоровье · шаги</span><a href="./myday.html?view=health" aria-label="Открыть Здоровье">↗</a></div>'+
    '<strong class="dm-widget-big" id="dmWidgetStepCount">—</strong><p class="dm-widget-copy" id="dmWidgetStepStatus">Только ваши записи</p>'+
    '<small class="dm-widget-foot">Данные журнала здоровья · не счётчик телефона</small>');
  createCard('dmWidgetBreath','breathe',
    '<div class="dm-widget-heading"><span class="dm-widget-icon">◎</span><span>Дыхание</span><span class="dm-widget-heading-end">1 мин</span></div>'+
    '<div class="dm-breath-body"><div class="dm-breath-orb" id="dmBreathOrb" aria-hidden="true"><span>◌</span></div>'+
    '<div class="dm-breath-copy"><strong id="dmBreathPhase" aria-live="polite">Минута для себя</strong><small id="dmBreathClock">4 вдоха · 4 паузы · 4 выдоха</small>'+
    '<button type="button" id="dmBreathToggle">Начать</button></div></div>');
  createCard('dmWidgetCalendar','calendar',
    '<div class="dm-widget-heading"><span class="dm-widget-icon">▦</span><span>Календарь</span><a href="./myday.html?view=calendar" aria-label="Открыть полный календарь">↗</a></div>'+
    '<div class="dm-calendar-month-head"><button type="button" data-dm-month="-1" aria-label="Предыдущий месяц">‹</button>'+
    '<strong id="dmCalendarMonth"></strong><button type="button" data-dm-month="1" aria-label="Следующий месяц">›</button></div>'+
    '<div class="dm-calendar-weekdays" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>'+
    '<div id="dmCalendarDates" class="dm-calendar-dates" role="group" aria-label="Дни месяца"></div>'+
    '<div class="dm-calendar-reminder" id="dmCalendarReminder" aria-live="polite">Записи загружаются</div>');
  const widgets={day:$('dmWidgetDay'),calendar:$('dmWidgetCalendar'),steps:$('dmWidgetSteps'),breathe:$('dmWidgetBreath')};

  function cardOptions(){
    try {return JSON.parse(localStorage.getItem(KEY)||'{}')?.management?.cards||{};}
    catch(_){return {};}
  }
  function openDb(name){
    return new Promise(async(resolve,reject)=>{
      try{
        if(!window.indexedDB)throw new Error('No storage');
        if(typeof indexedDB.databases==='function'){
          const list=await indexedDB.databases();
          if(!list.some(x=>x.name===name)){resolve(null);return;}
        }
        const req=indexedDB.open(name);
        // A display-only widget must never create or upgrade the user's database.
        req.onupgradeneeded=()=>{req.transaction.abort();};
        req.onerror=()=>reject(req.error||new Error('Unavailable'));
        req.onblocked=()=>reject(new Error('Blocked'));
        req.onsuccess=()=>resolve(req.result);
      }catch(e){reject(e);}
    });
  }
  function read(db,store,method,arg){
    return new Promise((resolve,reject)=>{
      let tx,request,output;
      try{tx=db.transaction(store,'readonly');request=tx.objectStore(store)[method](arg);}
      catch(e){reject(e);return;}
      request.onsuccess=()=>{output=request.result;};
      request.onerror=()=>reject(request.error||new Error('Read failed'));
      tx.oncomplete=()=>resolve(output);
      tx.onerror=()=>reject(tx.error||new Error('Read failed'));
      tx.onabort=()=>reject(tx.error||new Error('Canceled'));
    });
  }
  async function dayRecords(){
    let db;
    try{
      db=await openDb('digital-manager-my-day-v1');
      return db?await read(db,'events','getAll'):[];
    }finally{db?.close();}
  }
  async function latestSteps(){
    let db;
    try{
      db=await openDb('digital-manager-private-health-v1');
      if(!db)return {state:'not-enabled'};
      const consent=await read(db,'settings','get','consent');
      if(consent?.enabled!==true)return {state:'not-enabled'};
      const rows=await read(db,'metrics','getAll');
      const steps=rows.filter(x=>x?.type==='steps'&&Number.isInteger(x.steps)&&x.steps>=0&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))
        .sort((a,b)=>b.date.localeCompare(a.date)||Number(b.source==='manual')-Number(a.source==='manual'));
      return steps.length?{state:'ok',item:steps[0]}:{state:'empty'};
    }finally{db?.close();}
  }
  function renderDay(){
    const active=events.filter(e=>e?.date===today()&&e.done!==true);
    const count=active.length;
    $('dmWidgetDayCount').textContent=String(count);
    $('dmWidgetDayStatus').textContent=count===0?'На сегодня незавершённых дел нет':count===1?'Одно дело на сегодня':'Дел на сегодня: '+count;
    const next=active.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))[0];
    $('dmWidgetDayNext').textContent=next?(next.time?next.time+' · ':'')+String(next.title||'Запись').slice(0,90):'Добавить дело можно в «Моём дне»';
  }
  async function renderSteps(){
    try{
      const result=await latestSteps();
      if(!widgets.steps.hidden){
        if(result.state==='ok'){
          $('dmWidgetStepCount').textContent=new Intl.NumberFormat('ru-RU').format(result.item.steps);
          $('dmWidgetStepStatus').textContent=result.item.date===today()?'Записано сегодня':'Последняя запись: '+niceDate(result.item.date);
        }else{
          $('dmWidgetStepCount').textContent='—';
          $('dmWidgetStepStatus').textContent=result.state==='not-enabled'?'Включите личный журнал в «Здоровье»':'Пока нет записей о шагах';
        }
      }
    }catch(_){
      if(!widgets.steps.hidden){$('dmWidgetStepCount').textContent='—';$('dmWidgetStepStatus').textContent='Не удалось прочитать личный журнал';}
    }
  }
  function renderCalendar(){
    const d=new Date(month.getFullYear(),month.getMonth(),1);
    $('dmCalendarMonth').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(d);
    const start=(d.getDay()+6)%7,days=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    const count=Math.max(35,Math.ceil((start+days)/7)*7);
    const marked=new Set(events.filter(e=>e&&!e.done).map(e=>e.date));
    const dates=$('dmCalendarDates');dates.replaceChildren();
    for(let i=0;i<count;i++){
      const day=new Date(d.getFullYear(),d.getMonth(),1+i-start);
      const date=key(day),button=document.createElement('button');
      button.type='button';button.className='dm-calendar-day';
      if(day.getMonth()!==d.getMonth())button.classList.add('outside');
      if(date===today())button.classList.add('today');
      if(date===selected)button.classList.add('selected');
      button.dataset.date=date;
      button.setAttribute('aria-label',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(day));
      button.setAttribute('aria-pressed',String(date===selected));
      const number=document.createElement('span');number.textContent=String(day.getDate());
      button.append(number);
      if(marked.has(date)){const dot=document.createElement('i');dot.className='dm-calendar-dot';dot.setAttribute('aria-hidden','true');button.append(dot);}
      dates.append(button);
    }
    const daily=events.filter(e=>e?.date===selected&&!e.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const next=events.filter(e=>e?.date>=today()&&!e.done).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'))[0];
    const status=daily.length?((daily[0].time||'На день')+' · '+String(daily[0].title||'Событие')+(daily.length>1?' (ещё '+(daily.length-1)+')':'')):
      next?'Следующее: '+niceDate(next.date)+(next.time?' в '+next.time:'')+' · '+String(next.title||'Событие'):'Ближайших напоминаний пока нет';
    $('dmCalendarReminder').textContent=status.slice(0,180);
  }
  async function refresh(){
    const token=++generation,settings=cardOptions();
    for(const [flag,id] of Object.entries(keys))widgets[id].hidden=settings[flag]!==true;
    const any=Object.values(widgets).some(el=>!el.hidden);
    root.hidden=!any;
    if(!any){stopBreathing();return;}
    if(!widgets.day.hidden||!widgets.calendar.hidden){
      try{const records=await dayRecords();if(token!==generation)return;events=records.filter(e=>e&&typeof e.date==='string');}
      catch(_){if(token!==generation)return;events=[];}
      if(!widgets.day.hidden)renderDay();
      if(!widgets.calendar.hidden)renderCalendar();
    }
    if(!widgets.steps.hidden)await renderSteps();
    if(widgets.breathe.hidden)stopBreathing();
  }
  $('dmWidgetCalendar').addEventListener('click',e=>{
    const monthButton=e.target.closest('[data-dm-month]');
    if(monthButton){
      month=new Date(month.getFullYear(),month.getMonth()+Number(monthButton.dataset.dmMonth),1);
      selected=key(new Date(month.getFullYear(),month.getMonth(),1));
      renderCalendar();return;
    }
    const dayButton=e.target.closest('[data-date]');
    if(dayButton){
      selected=dayButton.dataset.date;
      const parts=selected.split('-').map(Number);
      month=new Date(parts[0],parts[1]-1,1);
      renderCalendar();
    }
  });
  const phases=[['Вдох',4,'in'],['Пауза',4,'hold'],['Выдох',4,'out'],['Отдых',4,'rest']];
  // The layout editor temporarily detaches cards from document during reorder.
  // Resolve controls from the retained widget node, not document.getElementById.
  function stopBreathing(finished=false){
    clearInterval(breathTimer);breathTimer=null;
    widgets.breathe.querySelector('#dmBreathOrb').dataset.phase='rest';
    widgets.breathe.querySelector('#dmBreathPhase').textContent=finished?'Готово ✦':'Минута для себя';
    widgets.breathe.querySelector('#dmBreathClock').textContent=finished?'Четыре спокойных цикла завершены':'4 с вдох · 4 с пауза · 4 с выдох · 4 с отдых';
    widgets.breathe.querySelector('#dmBreathToggle').textContent='Начать';
  }
  function tick(){
    const elapsed=Math.floor((Date.now()-breathStartedAt)/1000);
    if(elapsed>=64){stopBreathing(true);return;}
    const index=Math.floor(elapsed/4)%4,phase=phases[index];
    widgets.breathe.querySelector('#dmBreathOrb').dataset.phase=phase[2];
    widgets.breathe.querySelector('#dmBreathPhase').textContent=phase[0];
    widgets.breathe.querySelector('#dmBreathClock').textContent=String(4-elapsed%4)+' с · '+String(64-elapsed)+' с осталось';
  }
  widgets.breathe.querySelector('#dmBreathToggle').addEventListener('click',()=>{
    if(breathTimer){stopBreathing();return;}
    breathStartedAt=Date.now();widgets.breathe.querySelector('#dmBreathToggle').textContent='Остановить';
    tick();breathTimer=setInterval(tick,240);
  });
  window.addEventListener('dm:cards-changed',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBreathing();else refresh();});
  refresh();
})();
