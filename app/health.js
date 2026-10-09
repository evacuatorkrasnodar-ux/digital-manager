/* Health diary — explicit local opt-in, no server, no medical prescribing, no system push. */
(() => {
 'use strict';
 const DB='digital-manager-private-health-v1',STORES=['settings','meds','logs','sleep','docs'];
 const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
 const key=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
 const today=()=>key(new Date());
 const dateOk=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));if(!m)return false;const d=new Date(+m[1],+m[2]-1,+m[3],12);return key(d)===s;};
 const node=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;};
 const nice=date=>dateOk(date)?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(date+'T12:00:00')):'—';
 const fmtSize=n=>n<1024*1024?Math.round(n/1024)+' КБ':(n/1024/1024).toFixed(1)+' МБ';
 let db=null,enabled=false,meds=[],logs=[],sleep=[],docs=[],timer,active='meds';
 const notified=new Set();
 function toast(msg){const t=$('healthToast');t.textContent=msg;t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>t.hidden=true,4200);}
 function error(e){console.error('Health private store:',e);toast('Не удалось сохранить запись. Проверь настройки браузера.');}
 function openDB(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
   const r=indexedDB.open(DB,1);
   r.onupgradeneeded=()=>{for(const name of STORES)if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name,{keyPath:'id'});};
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('DB unavailable'));
   r.onblocked=()=>reject(new Error('Close other tabs'));
  });
 }
 function tx(store,mode,cb){
  return new Promise((resolve,reject)=>{
   if(!db){reject(new Error('No DB'));return;}
   let t,r,value;
   try{t=db.transaction(store,mode);r=cb(t.objectStore(store));}catch(e){reject(e);return;}
   if(r){r.onsuccess=()=>{value=r.result;};r.onerror=()=>reject(r.error||new Error('Request failed'));}
   t.oncomplete=()=>resolve(value);t.onerror=()=>reject(t.error||new Error('Transaction failed'));t.onabort=()=>reject(t.error||new Error('Transaction aborted'));
  });
 }
 function uid(){return crypto?.randomUUID?.()||'health-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
 async function reload(){
  const [settings,...lists]=await Promise.all([tx('settings','readonly',s=>s.get('consent')),...STORES.slice(1).map(n=>tx(n,'readonly',s=>s.getAll()))]);
  enabled=settings?.enabled===true;
  [meds,logs,sleep,docs]=lists;
  meds.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ru'));
  sleep.sort((a,b)=>b.date.localeCompare(a.date));
  docs.sort((a,b)=>b.updatedAt-a.updatedAt);
  render();
 }
 function setView(next){
  active=next;
  document.querySelectorAll('[data-health]').forEach(btn=>{const yes=btn.dataset.health===next;btn.classList.toggle('active',yes);btn.setAttribute('aria-pressed',String(yes));});
  document.querySelectorAll('[data-health-view]').forEach(s=>s.hidden=s.dataset.healthView!==next);
 }
 function blank(host,message){host.replaceChildren(node('div','health-empty',message));}
 function card(icon,title,desc,small){
  const row=node('article','health-card');
  row.append(node('div','health-card-icon',icon));
  const body=node('div','health-card-body');
  body.append(node('strong','',title));
  if(desc)body.append(node('p','',desc));
  if(small)body.append(node('small','',small));
  row.append(body);return {row,body};
 }
 function controls(row,edit,remove){
  const a=node('div','health-actions');
  const b=node('button','','✎');b.type='button';b.setAttribute('aria-label','Изменить');b.addEventListener('click',edit);
  const c=node('button','','×');c.type='button';c.setAttribute('aria-label','Удалить');c.addEventListener('click',remove);
  a.append(b,c);row.append(a);
 }
 function medicationTimes(src){return src.split(/[,\s;]+/).map(x=>x.trim()).filter(Boolean);}
 function activeToday(m){
  const now=today();
  return m.start<=now&&(!m.end||m.end>=now);
 }
 function render(){
  $('healthConsentPanel').hidden=enabled;$('healthMain').hidden=!enabled;
  if(!enabled)return;
  renderMeds();renderSleep();renderDocs();
 }
 function renderMeds(){
  const list=$('healthMeds');list.replaceChildren();
  if(!meds.length)blank(list,'Препаратов пока нет. Добавь назначенный график — и будем следить за отметками, без самолечения.');
  for(const m of meds){
   const times=medicationTimes(m.times);
   const {row}=card('◈',m.name,m.dose+(m.note?'\n'+m.note:''),times.join(' · ')+' · c '+nice(m.start)+(m.end?' по '+nice(m.end):''));
   controls(row,()=>openMed(m),()=>eraseOne('meds',m));
   list.append(row);
  }
  const due=$('healthToday');due.replaceChildren();
  let count=0;
  for(const med of meds.filter(activeToday)){
   for(const time of medicationTimes(med.times)){
    const id=med.id+'|'+today()+'|'+time,log=logs.find(x=>x.id===id);
    const {row,body}=card('◷',time+' · '+med.name,med.dose,'По твоему расписанию');
    if(log?.status==='taken'||log?.status==='missed'){
     body.append(node('span','health-pill-status'+(log.status==='missed'?' missed':''),log.status==='taken'?'✓ Отмечено: принято':'Отмечено: пропущено'));
    }else{
     const buttons=node('div','health-take-actions');
     const taken=node('button','health-success','✓ Принято'),missed=node('button','health-missed','Пропущено'),later=node('button','','Позже, 10 мин');
     for(const b of [taken,missed,later])b.type='button';
     taken.addEventListener('click',()=>recordDose(id,med,time,'taken'));
     missed.addEventListener('click',()=>recordDose(id,med,time,'missed'));
     later.addEventListener('click',()=>recordDose(id,med,time,'later'));
     buttons.append(taken,missed,later);body.append(buttons);
    }
    due.append(row);count++;
   }
  }
  if(!count)blank(due,meds.length?'На сегодня приёмов по записанному расписанию нет.':'Сначала добавь препарат и график приёма.');
 }
 async function recordDose(id,med,time,status){
  const previous=logs.find(x=>x.id===id);
  const entry={id,medId:med.id,date:today(),time,status,
   nextAt:status==='later'?Date.now()+10*60*1000:0,updatedAt:Date.now(),name:med.name};
  try{await tx('logs','readwrite',s=>s.put(entry));await reload();
   toast(status==='taken'?'Отметка «Принято» сохранена':status==='later'?'Напомню через 10 минут, пока страница открыта':'Пропуск отмечен. Не удваивай дозу без указания врача.');
  }catch(e){error(e);}
 }
 function renderSleep(){
  const host=$('healthSleep'),summary=$('healthSleepSummary');host.replaceChildren();
  if(!sleep.length){summary.replaceChildren();blank(host,'Добавь первую запись сна. Сон — тоже пункт в списке важных дел. ☾');return;}
  const subset=sleep.slice(0,7),avg=subset.reduce((s,x)=>s+Number(x.hours),0)/subset.length;
  summary.replaceChildren(node('strong','',avg.toFixed(1)+' ч'),node('span','','Среднее по последним '+subset.length+' записям (по твоим отметкам)'));
  for(const entry of sleep.slice(0,45)){
   const quality={great:'Отлично',normal:'Нормально',poor:'Беспокойно'}[entry.quality]||'—';
   const {row}=card('☾',nice(entry.date)+' · '+entry.hours+' ч',entry.note||'',quality);
   controls(row,()=>openSleep(entry),()=>eraseOne('sleep',entry));host.append(row);
  }
 }
 function renderDocs(){
  const host=$('healthDocuments');host.replaceChildren();
  if(!docs.length){blank(host,'Документов пока нет. Добавляй только на личном, защищённом устройстве.');return;}
  for(const doc of docs){
   const {row,body}=card('▤',doc.name,'Сохранено на устройстве',fmtSize(doc.size)+' · '+nice(doc.date));
   const open=node('button','health-doc-link','↓ Скачать документ');open.type='button';
   open.addEventListener('click',()=>downloadDoc(doc));body.append(open);
   const del=node('div','health-actions'),b=node('button','','×');b.type='button';
   b.setAttribute('aria-label','Удалить документ '+doc.name);b.addEventListener('click',()=>eraseOne('docs',doc));
   del.append(b);row.append(del);host.append(row);
  }
 }
 function openMed(m){
  $('healthMedForm').reset();$('healthMedId').value=m?.id||'';
  $('healthMedTitle').textContent=m?'Изменить лекарство':'Добавить лекарство';
  $('healthMedName').value=m?.name||'';$('healthMedDose').value=m?.dose||'';
  $('healthMedTimes').value=m?.times||'08:00';
  $('healthMedStart').value=m?.start||today();$('healthMedEnd').value=m?.end||'';
  $('healthMedNote').value=m?.note||'';
  $('healthMedDialog').showModal();
 }
 function openSleep(m){
  $('healthSleepForm').reset();$('healthSleepTitle').textContent=m?'Изменить сон':'Записать сон';
  $('healthSleepDate').value=m?.date||today();
  $('healthSleepHours').value=m?.hours??'';
  $('healthSleepQuality').value=m?.quality||'normal';
  $('healthSleepNote').value=m?.note||'';
  $('healthSleepDialog').showModal();
 }
 async function saveMed(e){
  e.preventDefault();const id=$('healthMedId').value||uid(),times=medicationTimes($('healthMedTimes').value);
  if(times.length<1||times.length>8||times.some(s=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))||new Set(times).size!==times.length){toast('Укажи от 1 до 8 разных часов в формате 08:00, 20:00');return;}
  const start=$('healthMedStart').value,end=$('healthMedEnd').value;
  if(!dateOk(start)||(end&&(!dateOk(end)||end<start))){toast('Проверь даты курса');return;}
  const old=meds.find(x=>x.id===id);
  const row={id,name:$('healthMedName').value.trim(),dose:$('healthMedDose').value.trim(),
   times:times.sort().join(', '),start,end,note:$('healthMedNote').value.trim(),updatedAt:Date.now(),createdAt:old?.createdAt||Date.now()};
  if(!row.name||!row.dose){toast('Укажи название и дозировку из назначения');return;}
  try{await tx('meds','readwrite',s=>s.put(row));$('healthMedDialog').close();await reload();toast('Расписание сохранено');}catch(e){error(e);}
 }
 async function saveSleep(e){
  e.preventDefault();const date=$('healthSleepDate').value,h=Number($('healthSleepHours').value);
  if(!dateOk(date)||date>today()||!Number.isFinite(h)||h<=0||h>24){toast('Проверь дату и часы сна');return;}
  const row={id:date,date,hours:h,quality:$('healthSleepQuality').value,note:$('healthSleepNote').value.trim(),updatedAt:Date.now()};
  try{await tx('sleep','readwrite',s=>s.put(row));$('healthSleepDialog').close();await reload();toast('Сон записан');}catch(e){error(e);}
 }
 async function uploadFile(e){
  const file=e.target.files?.[0];e.target.value='';
  if(!file||!enabled)return;
  const valid=/\.(pdf|jpe?g|png|webp|txt|docx?)$/i.test(file.name);
  if(!valid){toast('Поддерживаются PDF, фото, TXT, DOC и DOCX');return;}
  if(file.size>8*1024*1024||file.size===0){toast('Размер файла должен быть от 1 байта до 8 МБ');return;}
  if(!confirm('Сохранить медицинский файл «'+file.name+'» без шифрования только в этом браузере?'))return;
  const entry={id:uid(),name:file.name.slice(0,180),size:file.size,type:file.type||'application/octet-stream',date:today(),blob:file,updatedAt:Date.now()};
  try{await tx('docs','readwrite',s=>s.put(entry));await reload();setView('files');toast('Документ сохранён только на этом устройстве');}catch(e){error(e);}
 }
 function downloadDoc(doc){
  if(!(doc.blob instanceof Blob)){toast('Файл недоступен');return;}
  const url=URL.createObjectURL(doc.blob),a=node('a');a.href=url;a.download=doc.name;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000);
 }
 async function eraseOne(store,item){
  if(!confirm('Удалить «'+(item.name||item.date)+'»? Без резервной копии не восстановить.'))return;
  try{await tx(store,'readwrite',s=>s.delete(item.id));await reload();toast('Удалено');}catch(e){error(e);}
 }
 function exportRecords(){
  if(!db||!enabled)return;
  const out={format:'digital-manager-health-journal',version:1,exportedAt:new Date().toISOString(),meds,logs,sleep,documentsExcluded:true};
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='zhurnal-zdorovya-'+today()+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  toast('Копия записей создана. Документы в неё не входят.');
 }
 async function eraseAll(){
  if(!confirm('Удалить ВСЁ из этого раздела: лекарства, отметки, сон, медицинские файлы?'))return;
  if(!confirm('Подтвердить окончательное удаление всех медицинских данных из этого браузера?'))return;
  try{
   await new Promise((resolve,reject)=>{
    const t=db.transaction(STORES,'readwrite');for(const name of STORES)t.objectStore(name).clear();
    t.oncomplete=resolve;t.onerror=()=>reject(t.error||new Error('Delete failed'));t.onabort=()=>reject(t.error||new Error('Delete canceled'));
   });
   $('healthConsent').checked=false;$('healthEnable').disabled=true;await reload();toast('Все медицинские записи удалены');
  }catch(e){error(e);}
 }
 function reminderCheck(){
  if(!enabled||document.visibilityState==='hidden')return;
  const now=new Date(),minutes=now.getHours()*60+now.getMinutes();
  for(const med of meds.filter(activeToday)){
   for(const time of medicationTimes(med.times)){
    const id=med.id+'|'+today()+'|'+time,log=logs.find(x=>x.id===id),part=time.split(':').map(Number);
    const scheduled=part[0]*60+part[1];
    const reminder=log?.status==='later'?Date.now()>=log.nextAt&&Date.now()<log.nextAt+60000:
     (!log&&minutes>=scheduled&&minutes<scheduled+1);
    if(!reminder||log?.status==='taken'||log?.status==='missed'||notified.has(id+':'+(log?.nextAt||0)))continue;
    notified.add(id+':'+(log?.nextAt||0));
    toast('Напоминание по вашему графику: '+med.name+' · '+time+'. Проверьте назначение.');
    return;
   }
  }
 }
 function init(){
  document.querySelectorAll('[data-health]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.health)));
  $('healthConsent').addEventListener('change',()=>$('healthEnable').disabled=!$('healthConsent').checked);
  $('healthEnable').addEventListener('click',async()=>{
   if(!$('healthConsent').checked||!db)return;
   try{await tx('settings','readwrite',s=>s.put({id:'consent',enabled:true,createdAt:Date.now()}));await reload();toast('Личный журнал включён');}catch(e){error(e);}
  });
  $('healthAddMed').addEventListener('click',()=>openMed());
  $('healthAddSleep').addEventListener('click',()=>openSleep());
  $('healthChooseFile').addEventListener('click',()=>$('healthFileInput').click());
  $('healthFileInput').addEventListener('change',uploadFile);
  $('healthMedForm').addEventListener('submit',saveMed);
  $('healthSleepForm').addEventListener('submit',saveSleep);
  $('healthExport').addEventListener('click',exportRecords);
  $('healthDeleteAll').addEventListener('click',eraseAll);
  document.querySelectorAll('[data-health-close]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.healthClose).close()));
  for(const x of ['healthMedDialog','healthSleepDialog'])$(x).addEventListener('click',e=>{if(e.target===$(x))$(x).close();});
  openDB().then(async result=>{db=result;await reload();reminderCheck();}).catch(e=>{
   console.error('Health IndexedDB:',e);$('healthConsentPanel').hidden=false;$('healthMain').hidden=true;
   $('healthConsent').disabled=true;$('healthEnable').disabled=true;
   $('healthConsentPanel').append(node('p','health-hint','Сохранение данных недоступно в этом браузере.'));
  });
  setInterval(()=>{if(enabled){reminderCheck();}},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&db)reload().then(reminderCheck).catch(error);});
 }
 document.addEventListener('DOMContentLoaded',init);
})();