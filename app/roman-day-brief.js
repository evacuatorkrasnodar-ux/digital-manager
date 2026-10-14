/* Roman studio: compact day briefing from the same local sources. */
(()=>{
 'use strict';
 if(localStorage.getItem('dm-roman-demo-active-v1')!=='1')return;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}};
 const rows=read('dm-sales-records-v1',[]);
 const leads=Array.isArray(rows)?rows:[];
 const initiative=read('dm-initiative-v1',{});
 const projects=read('dm-roman-projects-v1',{});
 const newLeads=leads.filter(x=>x.stage==='new');
 const working=leads.filter(x=>x.stage==='talk'||x.stage==='offer');
 const prepared=Array.isArray(initiative.items)?initiative.items.filter(x=>leads.some(y=>y.id===x.saleId&&['new','talk','offer'].includes(y.stage))).length:0;
 const confirmed=leads.filter(x=>x.stage==='won').length;
 const plans=Array.isArray(projects.projects)?projects.projects.filter(p=>leads.some(x=>x.id===p.id&&x.stage==='won')).length:0;
 const welcome=document.querySelector('.day-intro .polish-hello');
 if(welcome)welcome.textContent='Доброе утро, Роман';
 const greeting=document.getElementById('dayGreeting');
 if(!greeting)return;
 greeting.textContent='Студия «Цифровой бизнес» · короткий доклад управляющего';
 const summary=document.createElement('p');
 summary.id='dmRomanDayBrief';
 summary.style.cssText='font-size:13px;line-height:1.6;margin:9px 0 0;color:#d9e4ef';
 const priority=newLeads[0]||working[0];
 const what=priority?'Главное сегодня — '+(newLeads.length?'ответить ':'продолжить переговоры с ')+priority.person+' по проекту «'+priority.title+'».':'Срочных обращений в записанных сделках сейчас нет.';
 summary.textContent='Проверил дела: новых обращений — '+newLeads.length+', переговоров — '+working.length+
  ', подготовленных ответов — '+prepared+', подтверждённых заказов — '+confirmed+
  ', учебных планов — '+plans+'. '+what+
  ' Письма и платежи без отдельного разрешения не отправлял. ☕';
 greeting.insertAdjacentElement('afterend',summary);
})();
