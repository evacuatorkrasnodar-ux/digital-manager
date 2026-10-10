/* UI-only polish; no medical, finance or journal storage access. */
(() => {
'use strict';
const page=location.pathname.split('/').pop()||'index.html';
if(!['myday.html','care.html','world.html','health.html'].includes(page))return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function greeting(shell){
 const intro=shell.querySelector('.day-intro');if(!intro||intro.querySelector('.polish-hello'))return;
 let name='Алексей';
 try{const data=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}');const n=String(data.name||'').trim().split(/\s+/)[0];if(n&&n.length<=24)name=n;}catch(_){}
 const hour=new Date().getHours();intro.prepend(el('h2','polish-hello',(hour<12?'Доброе утро':hour<18?'Добрый день':'Добрый вечер')+',\n'+name));
 const desc=intro.querySelector('#dayGreeting');if(desc)desc.textContent='Планы на день есть. Главное — не забыть про себя.';
}
const items=[
['index.html','Главная','<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>'],
['myday.html','Мой день','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/>'],
['world.html?tab=assistant','Помощник',''],
['world.html','Мой мир','<path d="M12 2l2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z"/>'],
['care.html','Забота','<path d="M20.8 5a5.5 5.5 0 0 0-7.8 0L12 6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.2A5.5 5.5 0 0 0 20.8 5z"/>']];
function addDock(shell){
 if(shell.querySelector('.polish-dock'))return;
 const dock=el('nav','polish-dock');dock.setAttribute('aria-label','Навигация по личным разделам');
 for(const [href,label,source] of items){
  const a=el('a','polish-dock-link');a.href='./'+href;const section=href.split('?')[0];
  const active=page==='health.html'?section==='care.html':page==='world.html'?(new URLSearchParams(location.search).get('tab')==='assistant'?href==='world.html?tab=assistant':href==='world.html'):page===section;
  if(active){a.classList.add('is-active');a.setAttribute('aria-current','page');}
  if(label==='Помощник'){a.classList.add('polish-assistant');a.append(el('span','polish-assistant-orb'));}
  else{
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
   for(const match of source.matchAll(/<(path|rect)\b([^>]*)\/>/g)){
    const shape=document.createElementNS('http://www.w3.org/2000/svg',match[1]);
    for(const attr of match[2].matchAll(/([a-z]+)="([^"]*)"/g))shape.setAttribute(attr[1],attr[2]);
    svg.append(shape);
   }
   a.append(svg);
  }
  a.append(el('small','',label));dock.append(a);
 }
 const footer=shell.querySelector(':scope > .day-footer');if(footer)footer.before(dock);else shell.append(dock);
}
function init(){const shell=document.querySelector('.day-shell');if(!shell)return;shell.classList.add('dm-polished');if(page==='myday.html')greeting(shell);addDock(shell);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();