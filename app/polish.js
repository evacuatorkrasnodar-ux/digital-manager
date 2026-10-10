/* Digital Manager OS · shared-geometry personal dock; no stored data changes. */
(() => {
'use strict';
const page=location.pathname.split('/').pop()||'index.html';
if(!['myday.html','care.html','world.html','health.html'].includes(page))return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function greeting(shell){
 const intro=shell.querySelector('.day-intro');if(!intro||intro.querySelector('.polish-hello'))return;
 let name='Алексей';
 try{const data=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}');const n=String(data.name||'').trim().split(/\s+/)[0];if(n&&n.length<=24)name=n;}catch(_){}
 const hour=new Date().getHours();
 intro.prepend(el('h2','polish-hello',(hour<12?'Доброе утро':hour<18?'Добрый день':'Добрый вечер')+',\n'+name));
 const desc=intro.querySelector('#dayGreeting');if(desc)desc.textContent='Планы на день есть. Главное — не забыть про себя.';
}
const shellSvg="<svg class=\"nav-shell\" viewBox=\"0 0 430 116\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n      <defs>\n        <linearGradient id=\"navSurface\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n          <stop offset=\"0\" stop-color=\"#14202d\" stop-opacity=\".94\"/>\n          <stop offset=\".42\" stop-color=\"#07111a\" stop-opacity=\".92\"/>\n          <stop offset=\"1\" stop-color=\"#010204\" stop-opacity=\".98\"/>\n        </linearGradient>\n        <radialGradient id=\"navAmbient\" gradientUnits=\"userSpaceOnUse\" cx=\"215\" cy=\"12\" r=\"142\" gradientTransform=\"translate(0,-4) scale(1,.52)\">\n          <stop offset=\"0\" class=\"nav-glow-stop\" stop-opacity=\".19\"/>\n          <stop offset=\".52\" class=\"nav-glow-stop\" stop-opacity=\".045\"/>\n          <stop offset=\"1\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n        </radialGradient>\n        <linearGradient id=\"navTopRim\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n          <stop offset=\"0\" stop-color=\"#d5e9fa\" stop-opacity=\".52\"/>\n          <stop offset=\"1\" stop-color=\"#8aa8c4\" stop-opacity=\".10\"/>\n        </linearGradient>\n        <linearGradient id=\"navLightTrace\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\">\n          <stop offset=\"0\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n          <stop offset=\".3\" class=\"nav-glow-stop\" stop-opacity=\".10\"/>\n          <stop offset=\".5\" class=\"nav-glow-stop\" stop-opacity=\".62\"/>\n          <stop offset=\".7\" class=\"nav-glow-stop\" stop-opacity=\".10\"/>\n          <stop offset=\"1\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n        </linearGradient>\n        <filter id=\"navDiffusedRim\" x=\"-10%\" y=\"-300%\" width=\"120%\" height=\"700%\">\n          <feGaussianBlur stdDeviation=\"3\"/>\n        </filter>\n      </defs>\n      <!-- Balanced, gently taller crest with mirrored left/right geometry. -->\n      <path id=\"navCrest\" d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50 V116 H0 Z\" fill=\"url(#navSurface)\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50 V116 H0 Z\" fill=\"url(#navAmbient)\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navLightTrace)\" stroke-width=\"6\" opacity=\".33\" filter=\"url(#navDiffusedRim)\" vector-effect=\"non-scaling-stroke\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navTopRim)\" stroke-width=\"1.05\" vector-effect=\"non-scaling-stroke\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navLightTrace)\" stroke-width=\".8\" vector-effect=\"non-scaling-stroke\"/>\n    </svg>";
const icons={"home":"<path d=\"m2.8 10 9.2-7.3 9.2 7.3v10.6H14v-7h-4v7H2.8z\"/>","day":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 2v6M17 2v6M3 10h18\"/>","notes":"<path d=\"M5 3h11l3 3v15H5z\"/><path d=\"M16 3v4h3M8 12h8M8 16h6\"/>","care":"<path d=\"M20.8 5a5.5 5.5 0 0 0-7.8 0L12 6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.2A5.5 5.5 0 0 0 20.8 5z\"/>","management":"<rect x=\"2.7\" y=\"2.7\" width=\"7.3\" height=\"7.3\" rx=\"1.35\"/><rect x=\"14\" y=\"2.7\" width=\"7.3\" height=\"7.3\" rx=\"1.35\"/><rect x=\"2.7\" y=\"14\" width=\"7.3\" height=\"7.3\" rx=\"1.35\"/><rect x=\"14\" y=\"14\" width=\"7.3\" height=\"7.3\" rx=\"1.35\"/>"};
const common=[
 {id:'tabHome',label:'Главная',icon:'home',url:'./index.html'},
 {id:'tabAssistant',label:'Помощник',center:true,url:'./index.html?jump=assistant'},
 {id:'tabManagement',label:'Управление',icon:'management',url:'./index.html?jump=management'}
];
const myDay=[
 {id:'tabHome',label:'Главная',icon:'home',url:'./index.html'},
 {id:'tabMyDay',label:'Мой день',icon:'day',url:'./myday.html'},
 {id:'tabAssistant',label:'Помощник',center:true,url:'./index.html?jump=assistant'},
 {id:'tabNotes',label:'Блокнот',icon:'notes',url:'./myday.html?view=notes'},
 {id:'tabCare',label:'Забота',icon:'care',url:'./care.html'}
];
function svgFrom(markup){
 const template=document.createElement('template');
 template.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'+markup+'</svg>';
 const svg=template.content.firstElementChild;
 svg.classList.add('ico','nav-ico');svg.setAttribute('aria-hidden','true');return svg;
}
function addDock(shell){
 if(document.querySelector('body > .bottom-nav'))return;
 const five=page==='myday.html',dock=el('nav','bottom-nav');
 dock.dataset.layout=five?'five':'three';dock.dataset.mode='idle';dock.setAttribute('aria-label',five?'Навигация «Мой день»':'Главная навигация');
 const template=document.createElement('template');
 template.innerHTML=shellSvg;
 dock.append(template.content.firstElementChild);
 const list=five?myDay:common;
 for(const item of list){
  const a=el('a','nav-item'+(item.center?' assistant-tab':''));a.id=item.id;a.href=item.url;
  if(item.center){
   a.dataset.mode='idle';a.setAttribute('aria-label','Открыть Помощника');
   const socket=el('span','assistant-socket'),ring=el('span','assistant-ring'),core=el('span','assistant-core');
   socket.setAttribute('aria-hidden','true');
   const img=el('img','nav-mark');img.src='./assets/logo-air.png';img.alt='';img.setAttribute('aria-hidden','true');
   core.append(img);ring.append(core);socket.append(ring);a.append(socket);
  }else a.append(svgFrom(icons[item.icon]));
  a.append(el('span','nav-label',item.label));
  if(!item.center){const line=el('i','nav-underline');line.setAttribute('aria-hidden','true');a.append(line);}
  dock.append(a);
 }
 document.body.append(dock);
 if(five){
  const sync=()=>{
   const notesVisible=!document.getElementById('notesView')?.hidden;
   for(const id of ['tabMyDay','tabNotes']){
    const a=document.getElementById(id);if(!a)continue;
    const active=(id==='tabNotes')===notesVisible;a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
   }
  };
  dock.querySelector('#tabMyDay')?.addEventListener('click',e=>{
   e.preventDefault();
   document.querySelector('[data-view="calendar"]')?.click();
   sync();window.scrollTo({top:0,behavior:'smooth'});
  });
  dock.querySelector('#tabNotes')?.addEventListener('click',e=>{
   e.preventDefault();
   document.querySelector('[data-view="notes"]')?.click();
   sync();window.scrollTo({top:0,behavior:'smooth'});
  });
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',sync));
  sync();
 }
}
function init(){const shell=document.querySelector('.day-shell');if(!shell)return;shell.classList.add('dm-polished');if(page==='myday.html')greeting(shell);addDock(shell);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();