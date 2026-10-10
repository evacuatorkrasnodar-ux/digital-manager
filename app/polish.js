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
const items=[["index.html","Главная","<path d=\"m3 10 9-7 9 7v10h-6v-7H9v7H3z\"/>"],["index.html?analyticsDate=1","Аналитика","<path d=\"M4 20V12M9 20V9M14 20V5M19 20V2\"/>"],["index.html?jump=assistant","Помощник",""],["index.html?jump=management","Управление","<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/>"],["index.html?jump=profile","Профиль","<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 22v-2a8 8 0 0 1 16 0v2\"/>"]];
function addDock(shell){
 if(shell.querySelector('.polish-dock'))return;
 const dock=el('nav','polish-dock');dock.setAttribute('aria-label','Навигация по личным разделам');
 for(const [href,label,source] of items){
  const a=el('a','polish-dock-link');a.href='./'+href;const section=href.split('?')[0];
  const active=label==='Главная';
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