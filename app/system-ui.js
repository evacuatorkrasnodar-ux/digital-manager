/* Digital Manager OS v1: live clock, optional actual battery, local event center.
   No fake system indicators and no simulated/background push delivery. */
(() => {
  'use strict';
  const DB_NAME='digital-manager-my-day-v1';
  const READ_KEY='digital-manager-os-read-v1';
  const $=id=>document.getElementById(id);
  const make=(tag,cls,text)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=String(text);
    return n;
  };
  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const safeDate=key=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3]);return dayKey(d)===key?d:null;};
  const eventLink=key=>'./myday.html?date='+encodeURIComponent(key);
  const icon=(kind)=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    const paths=kind==='bell'?['M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9','M10 21h4']
      :kind==='offline'?['M2 9c5-5 15-5 20 0','M5 12.5c4-4 10-4 14 0','M8.6 16c2-2 4.8-2 6.8 0','M12 20h.01','M3 3l18 18']
      :['M2 9c5-5 15-5 20 0','M5 12.5c4-4 10-4 14 0','M8.6 16c2-2 4.8-2 6.8 0','M12 20h.01'];
    for(const d of paths){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);svg.append(p);}
    return svg;
  };
  const status=make('div','os-status');
  status.setAttribute('aria-label','Строка состояния приложения');
  const left=make('div','os-status-main'),clock=make('time','os-clock','--:--');
  clock.setAttribute('aria-label','Местное время');left.append(clock);
  const right=make('div','os-status-right');
  const network=make('span','os-network');const netIcon=icon('online'),netText=make('span','os-network-label','');
  network.append(netIcon,netText);
  const battery=make('span','os-battery');battery.hidden=true;
  const batteryText=make('span','os-battery-text');
  const batteryIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');batteryIcon.setAttribute('viewBox','0 0 26 14');batteryIcon.setAttribute('aria-hidden','true');
  const batteryRect=document.createElementNS('http://www.w3.org/2000/svg','rect');batteryRect.setAttribute('x','1');batteryRect.setAttribute('y','2');batteryRect.setAttribute('width','20');batteryRect.setAttribute('height','10');batteryRect.setAttribute('rx','2.1');
  const terminal=document.createElementNS('http://www.w3.org/2000/svg','path');terminal.setAttribute('d','M23 5v4');
  const batteryFill=document.createElementNS('http://www.w3.org/2000/svg','rect');batteryFill.setAttribute('class','os-battery-fill');batteryFill.setAttribute('x','3');batteryFill.setAttribute('y','4');batteryFill.setAttribute('width','16');batteryFill.setAttribute('height','6');batteryFill.setAttribute('rx','1');
  batteryIcon.append(batteryRect,terminal,batteryFill);battery.append(batteryIcon,batteryText);
  const bell=make('button','os-bell');bell.type='button';bell.setAttribute('aria-label','Открыть центр уведомлений');bell.append(icon('bell'));
  const badge=make('span','os-bell-count');badge.hidden=true;badge.setAttribute('aria-hidden','true');bell.append(badge);
  right.append(network,battery,bell);status.append(left,right);
  const target=document.querySelector('.hero')||document.querySelector('.day-shell');
  if(!target)return;
  target.insertBefore(status,target.firstElementChild?.classList.contains('hero-photo')?target.children[1]:target.firstChild);
  // In the dashboard, this status area sits before the hero image and header.
  const center=make('dialog','os-center');center.setAttribute('aria-labelledby','osCenterTitle');
  const header=make('div','os-center-header'),heading=make('div');
  heading.append(make('span','os-center-eyebrow','DIGITAL MANAGER OS'));
  const title=make('h2','','Центр уведомлений');title.id='osCenterTitle';heading.append(title);
  const close=make('button','os-center-close','×');close.type='button';close.setAttribute('aria-label','Закрыть уведомления');
  header.append(heading,close);
  const scroller=make('div','os-center-scroll');
  const summary=make('p','os-center-summary','Ваши настоящие дела и состояние приложения. Только то, что известно устройству.');
  const section=make('div','os-center-section'),sectionLabel=make('h3','','Мой день'),markAll=make('button','os-center-read','Отметить прочитанным');
  markAll.type='button';section.append(sectionLabel,markAll);
  const notices=make('div','os-status-list');
  const deviceSection=make('div','os-center-section');deviceSection.append(make('h3','','Состояние устройства'));
  const onlineRow=make('div','os-device-row'),onlineLabel=make('span','','Соединение'),onlineValue=make('strong','','—');onlineRow.append(onlineLabel,onlineValue);
  const powerRow=make('div','os-device-row'),powerLabel=make('span','','Батарея'),powerValue=make('strong','','Недоступно');powerRow.append(powerLabel,powerValue);
  const help=make('p','os-center-help','Это внутренний центр событий, а не системная шторка iOS или Android. Напоминания всплывают только при открытом приложении; фоновые push-уведомления ещё не подключены.');
  const link=make('a','os-center-link','Открыть «Мой день»');link.href='./myday.html';
  scroller.append(summary,section,notices,deviceSection,onlineRow,powerRow,help,link);center.append(header,scroller);document.body.append(center);
  const banner=make('div','os-banner');banner.hidden=true;banner.setAttribute('role','status');
  const bannerText=make('span',''),bannerClose=make('button','os-banner-x','×');
  bannerClose.type='button';bannerClose.setAttribute('aria-label','Скрыть уведомление');banner.append(bannerText,bannerClose);
  document.body.append(banner);
  let currentEvents=[],batteryInfo=null,readState={},lastWarning='',bannerTimeout=null;
  try {const value=JSON.parse(localStorage.getItem(READ_KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))readState=value;}catch(_){}
  function clockTick(){const d=new Date();clock.textContent=pad(d.getHours())+':'+pad(d.getMinutes());clock.dateTime=d.toISOString();}
  function networkTick(){
    const online=navigator.onLine!==false;
    network.classList.toggle('offline',!online);network.replaceChild(icon(online?'online':'offline'),network.firstChild);
    netText.textContent=online?'Сеть':'Офлайн';network.title=online?'Устройство сообщает о наличии сетевого соединения; доступ в интернет не проверен':'Устройство сообщает об отсутствии сетевого соединения';
    onlineValue.textContent=online?'Подключение есть':'Офлайн';
    return online;
  }
  function batteryTick(){
    if(!batteryInfo){battery.hidden=true;powerValue.textContent='Браузер не предоставляет данные';return;}
    const pct=Math.max(0,Math.min(100,Math.round(batteryInfo.level*100)));
    battery.hidden=false;batteryText.textContent=pct+'%';batteryFill.setAttribute('width',String(Math.max(0,pct/100*16)));
    battery.classList.toggle('low',!batteryInfo.charging&&pct<=20);
    battery.title='Реальный заряд: '+pct+'%'+(batteryInfo.charging?' · Заряжается':'');
    powerValue.textContent=pct+'%'+(batteryInfo.charging?' · зарядка':'');
    if(!batteryInfo.charging&&pct<=15&&lastWarning!=='low'){
      lastWarning='low';showBanner('Батарея '+pct+'%. Зарядка не помешает, шеф. 🔋',null);
    }
    if(batteryInfo.charging||pct>20)lastWarning='';
  }
  async function setupBattery(){
    if(typeof navigator.getBattery!=='function'){batteryTick();return;}
    try{
      batteryInfo=await navigator.getBattery();
      if(!batteryInfo||typeof batteryInfo.level!=='number'){batteryInfo=null;batteryTick();return;}
      batteryInfo.addEventListener('levelchange',batteryTick);
      batteryInfo.addEventListener('chargingchange',batteryTick);batteryTick();
    }catch(_){batteryInfo=null;batteryTick();}
  }
  function readToken(e){return String(e.id)+':'+String(e.updatedAt||0);}
  function storeRead(){try{
    const keep=Object.entries(readState).slice(-180);readState=Object.fromEntries(keep);
    localStorage.setItem(READ_KEY,JSON.stringify(readState));
  }catch(_){/* private mode: session-only */}}
  function currentUpcoming(){
    const start=dayKey(new Date()),limit=new Date();limit.setDate(limit.getDate()+7);
    const end=dayKey(limit);
    return currentEvents.filter(e=>!e.done&&typeof e.title==='string'&&e.date>=start&&e.date<=end&&safeDate(e.date))
      .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')).slice(0,12);
  }
  function showBanner(message,href){
    if(document.visibilityState==='hidden')return;
    bannerText.textContent=message;banner.hidden=false;
    if(href){banner.style.cursor='pointer';bannerText.style.cursor='pointer';bannerText.onclick=()=>location.assign(href);}
    else {banner.style.cursor='default';bannerText.style.cursor='default';bannerText.onclick=null;}
    clearTimeout(bannerTimeout);bannerTimeout=setTimeout(()=>banner.hidden=true,7000);
  }
  function checkDue(events){
    const now=new Date(),start=now.getTime(),end=start+15*60000;
    for(const event of events){
      if(!event.time||!/^\d\d:\d\d$/.test(event.time))continue;
      const d=safeDate(event.date);if(!d)continue;
      const [h,m]=event.time.split(':').map(Number);d.setHours(h,m,0,0);
      const at=d.getTime();if(at<start||at>end)continue;
      const key=event.id+':'+event.date+':'+event.time;
      if(sessionStorage.getItem('os-due-'+key)==='1')continue;
      try{sessionStorage.setItem('os-due-'+key,'1');}catch(_){}
      showBanner('Скоро: '+event.title+' · '+event.time,eventLink(event.date));break;
    }
  }
  async function loadCalendar(){
    if(!('indexedDB' in window))return;
    try{
      // Same v1 schema as My Day; safe even when the calendar was not yet opened.
      const request=indexedDB.open(DB_NAME,1);
      const database=await new Promise((resolve,reject)=>{
        request.onupgradeneeded=()=>{
          const db=request.result;
          for(const name of ['events','notes'])if(!db.objectStoreNames.contains(name)){
            const store=db.createObjectStore(name,{keyPath:'id'});
            store.createIndex('date','date',{unique:false});
          }
        };
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error||new Error('Database unavailable'));
        request.onblocked=()=>reject(new Error('Database busy'));
      });
      if(!database.objectStoreNames.contains('events')){database.close();return;}
      const data=await new Promise((resolve,reject)=>{
        const tx=database.transaction('events','readonly');
        const req=tx.objectStore('events').getAll();let value=[];
        req.onsuccess=()=>{value=req.result||[];};
        tx.oncomplete=()=>resolve(value);
        tx.onerror=()=>reject(tx.error||new Error('Calendar read failed'));
      });
      database.close();currentEvents=data;refreshNotices();
    }catch(e){console.warn('OS calendar events unavailable:',e);summary.textContent='Календарь сейчас недоступен. Проверьте настройки хранилища браузера.';}
  }
  function niceDate(value){
    if(value===dayKey(new Date()))return 'Сегодня';
    const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
    if(value===dayKey(tomorrow))return 'Завтра';
    const d=safeDate(value);
    return d?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d):value;
  }
  function refreshNotices(){
    const upcoming=currentUpcoming();
    const unread=upcoming.filter(e=>!readState[readToken(e)]);
    badge.hidden=unread.length===0;
    badge.textContent=unread.length>9?'9+':String(unread.length);
    bell.setAttribute('aria-label',unread.length?'Центр уведомлений: '+unread.length+' непрочитанных':'Открыть центр уведомлений');
    markAll.disabled=!unread.length;
    summary.textContent=upcoming.length
      ? 'Ваших ближайших дел: '+upcoming.length+'. Новых напоминаний: '+unread.length+'.'
      : 'Новых дел на ближайшую неделю нет. Важное всегда можно записать в «Мой день».';
    notices.replaceChildren();
    if(!upcoming.length){
      notices.append(make('div','os-center-empty','Пока тихо. Ваш календарь готов принять первое важное дело. ✦'));
    }else{
      for(const e of upcoming){
        const read=Boolean(readState[readToken(e)]);
        const row=make('article','os-notice'+(read?' is-read':''));
        row.append(make('span','os-notice-graphic',e.kind==='meeting'?'◷':e.kind==='personal'?'♡':e.kind==='business'?'◆':'✓'));
        const col=make('div','os-notice-content');
        col.append(make('strong','os-notice-title',e.title));
        col.append(make('small','os-notice-meta',niceDate(e.date)+(e.time?' · '+e.time:'')+' · '+({task:'Дело',meeting:'Встреча',personal:'Личное',business:'Бизнес'}[e.kind]||'Событие')));
        const a=make('a','os-notice-action','Открыть в календаре →');a.href=eventLink(e.date);col.append(a);row.append(col);
        const toggle=make('button','os-notice-check',read?'✓':'•');toggle.type='button';
        toggle.setAttribute('aria-label',read?'Сделать непрочитанным':'Отметить прочитанным');
        toggle.addEventListener('click',()=>{
          if(read)delete readState[readToken(e)];else readState[readToken(e)]=true;
          storeRead();refreshNotices();
        });
        row.append(toggle);notices.append(row);
      }
    }
    checkDue(upcoming);
  }
  bell.addEventListener('click',()=>{loadCalendar().finally(()=>{if(!center.open)center.showModal();});});
  close.addEventListener('click',()=>center.close());
  center.addEventListener('click',e=>{if(e.target===center)center.close();});
  markAll.addEventListener('click',()=>{
    for(const e of currentUpcoming())readState[readToken(e)]=true;
    storeRead();refreshNotices();
  });
  bannerClose.addEventListener('click',()=>{banner.hidden=true;clearTimeout(bannerTimeout);});
  clockTick();networkTick();batteryTick();
  setInterval(clockTick,1000*20);
  setInterval(()=>{if(document.visibilityState==='visible'){loadCalendar();networkTick();}},60000);
  window.addEventListener('online',networkTick);window.addEventListener('offline',networkTick);
  window.addEventListener('focus',()=>{clockTick();networkTick();loadCalendar();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){clockTick();networkTick();loadCalendar();}});
  setupBattery();loadCalendar();
})();