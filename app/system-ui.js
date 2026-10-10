/* Digital Manager OS v273 — only real calendar reminders.
   iOS/Android own time, connectivity, battery, camera cutouts and status icons.
   No fake status strip, notification bell, or inaccessible in-app notification dialog. */
(() => {
  'use strict';
  if(!document.querySelector('.hero,.day-shell'))return;
  const DB_NAME='digital-manager-my-day-v1';
  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const validDate=key=>{
    const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
    if(!parts)return null;
    const date=new Date(+parts[1],+parts[2]-1,+parts[3]);
    return dayKey(date)===key?date:null;
  };
  const banner=document.createElement('div');
  banner.className='os-banner';
  banner.setAttribute('role','status');
  banner.hidden=true;
  const message=document.createElement('span');
  const dismiss=document.createElement('button');
  dismiss.type='button';
  dismiss.className='os-banner-x';
  dismiss.textContent='×';
  dismiss.setAttribute('aria-label','Скрыть напоминание');
  banner.append(message,dismiss);
  document.body.append(banner);
  let timeout=null;
  const hide=()=>{banner.hidden=true;clearTimeout(timeout);};
  dismiss.addEventListener('click',hide);
  function showReminder(item){
    if(document.visibilityState!=='visible')return;
    message.textContent='Скоро: '+item.title+' · '+item.time;
    message.style.cursor='pointer';
    message.onclick=()=>location.assign('./myday.html?date='+encodeURIComponent(item.date));
    banner.hidden=false;
    clearTimeout(timeout);
    timeout=setTimeout(hide,7000);
  }
  function checkDue(events){
    const start=Date.now(),end=start+15*60000;
    const upcoming=events
      .filter(e=>e&&!e.done&&typeof e.title==='string'&&typeof e.time==='string'&&/^\d\d:\d\d$/.test(e.time))
      .sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.time.localeCompare(b.time));
    for(const item of upcoming){
      const date=validDate(item.date);
      if(!date)continue;
      const [h,m]=item.time.split(':').map(Number);
      if(h>23||m>59)continue;
      date.setHours(h,m,0,0);
      if(date.getTime()<start||date.getTime()>end)continue;
      const key='os-due-'+item.id+':'+item.date+':'+item.time;
      try{if(sessionStorage.getItem(key)==='1')continue;}catch(_){}
      try{sessionStorage.setItem(key,'1');}catch(_){}
      showReminder(item);
      break;
    }
  }
  async function loadEvents(){
    if(document.visibilityState==='hidden'||!('indexedDB' in window))return;
    let db=null;
    try{
      db=await new Promise((resolve,reject)=>{
        const request=indexedDB.open(DB_NAME,1);
        request.onupgradeneeded=()=>{
          const database=request.result;
          for(const name of ['events','notes']){
            if(!database.objectStoreNames.contains(name)){
              const store=database.createObjectStore(name,{keyPath:'id'});
              store.createIndex('date','date',{unique:false});
            }
          }
        };
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error||new Error('Calendar database unavailable'));
        request.onblocked=()=>reject(new Error('Calendar database busy'));
      });
      if(!db.objectStoreNames.contains('events'))return;
      const events=await new Promise((resolve,reject)=>{
        const tx=db.transaction('events','readonly');
        const req=tx.objectStore('events').getAll();
        let values=[];
        req.onsuccess=()=>{values=req.result||[];};
        tx.oncomplete=()=>resolve(values);
        tx.onerror=()=>reject(tx.error||new Error('Calendar read failed'));
        tx.onabort=()=>reject(tx.error||new Error('Calendar read aborted'));
      });
      checkDue(events);
    }catch(e){console.warn('Calendar reminders unavailable:',e);}
    finally{if(db)db.close();}
  }
  setInterval(loadEvents,60000);
  window.addEventListener('focus',loadEvents);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadEvents();});
  loadEvents();
})();