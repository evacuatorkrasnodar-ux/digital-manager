/* Digital Trace — genuine locally confirmed events only. No fake analytics. */
(()=>{'use strict';
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const screen=()=>document.getElementById('digitalTraceScreen');
let returnTab='management';
function render(){
 const box=document.getElementById('dmTraceFindings');if(!box)return;
 let entries=[];try{const raw=JSON.parse(localStorage.getItem('dm-attention-events-v1')||'[]');if(Array.isArray(raw))entries=raw.filter(x=>x&&typeof x.title==='string'&&x.verified===true&&typeof x.source==='string'&&x.source.trim()&&typeof x.timestamp==='number').slice(0,20);}catch(_){}
 box.innerHTML=entries.length?entries.map(x=>'<article class="dm-trace-finding"><strong>'+esc(x.title)+'</strong><p>'+esc(x.description||'Событие зарегистрировано приложением')+'</p><small>'+esc(x.source)+' · '+esc(new Date(x.timestamp).toLocaleString('ru-RU'))+'</small></article>').join(''):'<div class="dm-trace-empty">Пока нет подтверждённых событий из подключённых источников.<br>Когда они появятся, управляющий покажет здесь то, что действительно важно.</div>';
}
function open(from='management'){
 const el=screen();if(!el)return;
 const home=document.getElementById('homeScreen'),assistant=document.getElementById('assistantScreen'),management=document.getElementById('managementScreen');
 returnTab=from==='home'?'home':'management';
 [home,assistant,management].forEach(x=>{if(x)x.hidden=true;});
 el.hidden=false;render();window.scrollTo(0,0);
}
function close(){
 const el=screen();if(el)el.hidden=true;
 const button=document.getElementById('tab'+(returnTab==='home'?'Home':'Management'));
 if(button)button.click();
 else {const fallback=document.getElementById('managementScreen');if(fallback)fallback.hidden=false;}
}
function init(){
 document.getElementById('dmTraceBack')?.addEventListener('click',close);
 document.getElementById('dmTraceConnections')?.addEventListener('click',()=>{
  const el=screen();if(el)el.hidden=true;
  document.getElementById('tabManagement')?.click();
  document.querySelector('[data-mg-open="connections"]')?.click();
 });
 window.addEventListener('dm:assistant-event',()=>{if(screen()&&!screen().hidden)render();});
 window.DMDigitalTrace=Object.freeze({open,close});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
