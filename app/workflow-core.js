/* Digital Manager | universal local work model.
   Read-only adapters normalize *existing* business events without migrating
   or inventing entries. A stage, a draft and actual execution are distinct. */
(()=>{
 'use strict';
 const MAX=300;
 const kinds=Object.freeze({inquiry:'Обращения',task:'Мои дела',delegation:'Поручения'});
 const stage=Object.freeze({new:'new',talk:'in_progress',offer:'in_progress'});
 const finite=t=>Number.isFinite(Number(t))&&Number(t)>0?Number(t):0;
 const safe=(v,n=140)=>String(v??'').trim().slice(0,n);
 const sources=new Map();
 function registerSource(name,read){
  // Adapters are installed by the app itself, never by a stored setting or a chat.
  if(typeof name!=='string'||!/^[a-z][a-z0-9-]{0,30}$/.test(name)||typeof read!=='function'||sources.has(name))return false;
  sources.set(name,read);return true;
 }
 registerSource('sales',()=>{
  const rows=window.DMSalesScreen?.getWorkCandidates?.()||[];
  return rows.slice(0,80).map(r=>({
   id:'sales:'+r.id,ref:safe(r.id,110),kind:'inquiry',
   title:safe(r.title),state:stage[r.stage]||'unknown',
   owner:'person',source:'user-entered-sales',
   at:finite(r.createdAt),dueAt:null
  }));
 });
 registerSource('journal',()=>{
  const data=window.DMTaskJournal?.getWorkSnapshot?.();
  if(!data)return [];
  const tasks=(data.tasks||[]).slice(0,100).map(t=>({
   id:'task:'+t.id,ref:safe(t.id,110),kind:'task',title:safe(t.title),
   state:t.status==='delegated'?'delegated':'open',owner:t.owner==='assistant-queue'?'assistant-queue':'person',
   source:t.source==='sales'?'user-entered-sales-task':'user-entered-task',
   at:finite(t.createdAt),dueAt:t.dueDate||null,overdue:Boolean(t.overdue),today:Boolean(t.today)
  }));
  const queued=(data.queue||[]).slice(0,100).map(t=>({
   id:'delegation:'+t.id,ref:safe(t.id,110),kind:'delegation',title:safe(t.title),
   state:t.draftReady?'draft_prepared':'waiting',owner:'assistant-queue',
   source:'user-approved-delegation',at:finite(t.createdAt),dueAt:null,
   draftReady:Boolean(t.draftReady),reviewed:Boolean(t.reviewed),
   executed:false // queue placement or template preparation never equals external execution
  }));
  return [...tasks,...queued];
 });
 function snapshot(){
  const items=[],seen=new Set(),errors=[];
  for(const [name,read] of sources){
   let rows;
   try{rows=read()}catch(e){errors.push(name);continue}
   if(!Array.isArray(rows)){errors.push(name);continue}
   for(const item of rows.slice(0,MAX)){
    if(!item||typeof item!=='object'||!['inquiry','task','delegation'].includes(item.kind)||typeof item.id!=='string'||seen.has(item.id))continue;
    seen.add(item.id);items.push({...item});
    if(items.length>=MAX)break;
   }
   if(items.length>=MAX)break;
  }
  const unique=items.filter(x=>!(x.kind==='task'&&x.state==='delegated')); // represented by delegation queue; no double counting
  const pending=unique.filter(x=>x.kind==='inquiry');
  const owned=unique.filter(x=>x.kind==='task'&&x.owner==='person');
  const queue=unique.filter(x=>x.kind==='delegation');
  return {
   origin:'local-user-entered-records',collectedAt:Date.now(),
   open:pending.length+owned.length+queue.length,
   inquiries:pending.length,ownerTasks:owned.length,assistantQueue:queue.length,
   tasksDueToday:owned.filter(t=>t.today).length,
   tasksOverdue:owned.filter(t=>t.overdue).length,
   draftsPrepared:queue.filter(t=>t.draftReady).length,
   reviewedDrafts:queue.filter(t=>t.reviewed).length,
   errors,
   items:unique.slice(0,MAX)
  };
 }
 function signals(current=snapshot()){
  const notes=[];
  if(current.tasksOverdue>0)notes.push({id:'late-owner-work',kind:'attention',priority:0,
   title:'Есть дела с просроченным сроком',
   body:'По твоим записям '+current.tasksOverdue+' дел с просроченной датой. Я могу помочь подготовить план, но пока не умею выполнить их без отдельного подтверждения и подключения нужных сервисов.',
   next:'Проверь срочные обязательства или передай подходящие дела управляющему.'});
  else if(current.tasksDueToday>0)notes.push({id:'today-owner-work',kind:'attention',priority:2.6,
   title:'Сегодня есть обязательства',
   body:'По твоим записям на сегодня '+current.tasksDueToday+' дел. Не оставим их без внимания.',
   next:'Могу помочь подготовить решение; выполненным назову только то, что действительно подтверждено.'});
  if(current.assistantQueue>0)notes.push({id:'assistant-queue',kind:'progress',priority:7,
   title:'В очереди управляющего',
   body:'В очереди '+current.assistantQueue+' поручений, из них '+current.draftsPrepared+' с подготовленным черновиком.',
   next:'Поручение в очереди ещё не означает, что внешняя работа выполнена.'});
  return notes;
 }
 window.DMWorkflowCore=Object.freeze({snapshot,signals,registerSource,kinds});
})();