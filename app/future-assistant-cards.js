/* Future V5: event-driven assistant cards. No permanent demo recommendations. */
(()=>{'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signals=new Map();
const allowed=new Set(['decision','opportunity','completed']);
let section=null, dialog=null;
function normalise(item){
 if(!item||typeof item!=='object'||!allowed.has(item.type)||item.verified!==true)return null;
 if(typeof item.id!=='string'||!item.id.trim()||typeof item.source!=='string'||!item.source.trim()||typeof item.title!=='string'||!item.title.trim()||typeof item.summary!=='string'||!item.summary.trim())return null;
 if(!Number.isFinite(item.timestamp)||item.timestamp>Date.now()+60000)return null;
 // A completed action needs an explicit result; a plan or a read receipt is not execution.
 if(item.type==='completed'&&(item.completed!==true||typeof item.result!=='string'||!item.result.trim()))return null;
 return {id:item.id.slice(0,80),type:item.type,source:item.source.slice(0,80),title:item.title.slice(0,120),summary:item.summary.slice(0,350),result:String(item.result||'').slice(0,350),timestamp:item.timestamp};
}
function render(){
 if(!section)return;
 const entries=[...signals.values()].sort((a,b)=>b.timestamp-a.timestamp).slice(0,3);
 if(!entries.length){section.remove();section=null;return}
 const titles={decision:'ТРЕБУЕТ РЕШЕНИЯ',opportunity:'ВОЗМОЖНОСТЬ',completed:'Я УЖЕ СДЕЛАЛ'};
 section.innerHTML='<div class="dm-future-title"><span>УПРАВЛЯЮЩИЙ РЯДОМ</span><small>Новые события</small></div>'+entries.map(x=>'<article class="dm-future-card"><div class="dm-future-card-head"><span>'+titles[x.type]+'</span><button type="button" data-future-detail="'+esc(x.id)+'" aria-label="Подробнее: '+esc(x.title)+'">↗</button></div><strong>'+esc(x.title)+'</strong><p>'+esc(x.summary)+'</p><small class="dm-future-caption">Источник: '+esc(x.source)+'</small></article>').join('');
}
function ensure(){
 if(section)return;
 const shortcuts=document.querySelector('#homeScreen .shortcuts');if(!shortcuts)return;
 section=document.createElement('section');section.id='dmFutureAssistant';section.className='dm-future-assistant';section.setAttribute('aria-label','События цифрового управляющего');shortcuts.after(section);
 section.addEventListener('click',e=>{
  const b=e.target.closest('[data-future-detail]');if(!b)return;
  const item=signals.get(b.dataset.futureDetail);if(!item)return;
  const dlg=getDialog();
  dlg.querySelector('#dmFutureHeading').textContent=item.title;
  dlg.querySelector('#dmFutureDescription').innerHTML='<p>'+esc(item.summary)+'</p>'+(item.type==='completed'?'<p>Результат: '+esc(item.result)+'</p>':'<p>Это наблюдение, а не автоматически выполненное действие.</p>')+'<p>Источник: '+esc(item.source)+'</p>';
  dlg.showModal();
 });
}
function getDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='dmFutureDetails';dialog.className='dm-future-dialog';
 dialog.innerHTML='<div class="dm-future-dialog-inner"><header><span>ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</span><button type="button" data-future-close aria-label="Закрыть">×</button></header><h2 id="dmFutureHeading"></h2><div id="dmFutureDescription"></div></div>';
 document.body.append(dialog);
 dialog.querySelector('[data-future-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 return dialog;
}
function publish(raw){
 const item=normalise(raw);if(!item)return false;
 signals.set(item.id,item);ensure();render();return true;
}
function dismiss(id){
 if(!signals.delete(id))return;
 if(section)render();
}
// Events are an in-app display channel, not proof of external API execution.
// Integrations must verify sources and permissions before publishing here.
function init(){
 window.addEventListener('dm:assistant-signal',e=>publish(e.detail));
 window.addEventListener('dm:assistant-dismiss',e=>dismiss(e.detail?.id));
 window.DMAssistantSignals=Object.freeze({publish,dismiss});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();