/* Digital Manager OS · shared-geometry personal dock; no stored data changes. */
(() => {
'use strict';
const page=location.pathname.split('/').pop()||'index.html';
if(!['myday.html','care.html','world.html','health.html'].includes(page))return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function greeting(shell){
 const intro=shell.querySelector('.day-intro');if(!intro)return;
 let name='Алексей';
 try{const data=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}');const n=String(data.name||'').trim().split(/\s+/)[0];if(n&&n.length<=24)name=n;}catch(_){}
 const hour=new Date().getHours();
 const heading=intro.querySelector('.polish-hello')||el('h2','polish-hello');
 heading.textContent=(hour<12?'Доброе утро':hour<18?'Добрый день':'Добрый вечер')+',\n'+name;
 if(!heading.parentNode)intro.prepend(heading);
 // Each tab supplies its own greeting; don't overwrite it here.
}
const shellSvg="<svg class=\"nav-shell\" viewBox=\"0 0 430 116\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n      <defs>\n        <linearGradient id=\"navSurface\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n          <stop offset=\"0\" stop-color=\"#14202d\" stop-opacity=\".94\"/>\n          <stop offset=\".42\" stop-color=\"#07111a\" stop-opacity=\".92\"/>\n          <stop offset=\"1\" stop-color=\"#010204\" stop-opacity=\".98\"/>\n        </linearGradient>\n        <radialGradient id=\"navAmbient\" gradientUnits=\"userSpaceOnUse\" cx=\"215\" cy=\"12\" r=\"142\" gradientTransform=\"translate(0,-4) scale(1,.52)\">\n          <stop offset=\"0\" class=\"nav-glow-stop\" stop-opacity=\".19\"/>\n          <stop offset=\".52\" class=\"nav-glow-stop\" stop-opacity=\".045\"/>\n          <stop offset=\"1\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n        </radialGradient>\n        <linearGradient id=\"navTopRim\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n          <stop offset=\"0\" stop-color=\"#d5e9fa\" stop-opacity=\".52\"/>\n          <stop offset=\"1\" stop-color=\"#8aa8c4\" stop-opacity=\".10\"/>\n        </linearGradient>\n        <linearGradient id=\"navLightTrace\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\">\n          <stop offset=\"0\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n          <stop offset=\".3\" class=\"nav-glow-stop\" stop-opacity=\".10\"/>\n          <stop offset=\".5\" class=\"nav-glow-stop\" stop-opacity=\".62\"/>\n          <stop offset=\".7\" class=\"nav-glow-stop\" stop-opacity=\".10\"/>\n          <stop offset=\"1\" class=\"nav-glow-stop\" stop-opacity=\"0\"/>\n        </linearGradient>\n        <filter id=\"navDiffusedRim\" x=\"-10%\" y=\"-300%\" width=\"120%\" height=\"700%\">\n          <feGaussianBlur stdDeviation=\"3\"/>\n        </filter>\n      </defs>\n      <!-- Balanced, gently taller crest with mirrored left/right geometry. -->\n      <path id=\"navCrest\" d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50 V116 H0 Z\" fill=\"url(#navSurface)\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50 V116 H0 Z\" fill=\"url(#navAmbient)\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navLightTrace)\" stroke-width=\"6\" opacity=\".33\" filter=\"url(#navDiffusedRim)\" vector-effect=\"non-scaling-stroke\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navTopRim)\" stroke-width=\"1.05\" vector-effect=\"non-scaling-stroke\"/>\n      <path d=\"M0 50 C0 30 36 16 94 16 H133 C170 16 183 8 198 -1 C209 -8 221 -8 232 -1 C247 8 260 16 297 16 H336 C394 16 430 30 430 50\" fill=\"none\" stroke=\"url(#navLightTrace)\" stroke-width=\".8\" vector-effect=\"non-scaling-stroke\"/>\n    </svg>";
const destinations={
 clients:{label:'Клиенты',url:'./index.html?jump=clients',svg:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4"/>'},
 day:{label:'Мой день',url:'./myday.html',svg:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/>'},
 docs:{label:'Документы',url:'./index.html?jump=management',svg:'<path d="M5 3h11l3 3v15H5zM16 3v4h3M8 12h8M8 16h5"/>'},
 finance:{label:'Финансы',url:'./index.html?jump=finance',svg:'<circle cx="12" cy="12" r="9"/><path d="M8 9h6a3 3 0 0 1 0 6H8M10 6v12"/>'},
 home:{label:'Главная',url:'./index.html',svg:'<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/>'},
 management:{label:'Управление',url:'./index.html?jump=management',svg:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'}
};
function iconFor(markup){
 const t=document.createElement('template');
 t.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+markup+'</svg>';
 const svg=t.content.firstElementChild;svg.classList.add('ico','nav-ico');svg.setAttribute('aria-hidden','true');return svg;
}
function addDock(shell){
 if(document.querySelector('body > .bottom-nav'))return;
 let saved=[];try{saved=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}')?.management?.voice?.dockItems||[]}catch(_){}
 const defaults=['clients','day','docs','finance'];
 const selections=defaults.map((fallback,i)=>destinations[saved[i]]?saved[i]:fallback);
 const dock=el('nav','bottom-nav');dock.dataset.layout='five';dock.dataset.mode='idle';dock.setAttribute('aria-label','Главная навигация');
 const t=document.createElement('template');t.innerHTML=shellSvg;dock.append(t.content.firstElementChild);
 for(let i=0;i<5;i++){
  const middle=i===2,key=middle?'assistant':selections[i<2?i:i-1];
  const info=destinations[key];
  const a=el('a','nav-item'+(middle?' assistant-tab':' nav-quick'));
  a.href=middle?'./index.html?jump=assistant':info.url;
  a.id=middle?'tabAssistant':'tabPersonalDock'+i;
  if(middle){
   a.dataset.mode='idle';a.setAttribute('aria-label','Открыть помощника');
   const socket=el('span','assistant-socket'),ring=el('span','assistant-ring'),core=el('span','assistant-core');
   socket.setAttribute('aria-hidden','true');
   const img=el('img','nav-mark');img.src='./assets/logo-air.png';img.alt='';img.setAttribute('aria-hidden','true');
   core.append(img);ring.append(core);socket.append(ring);a.append(socket);
  }else{a.setAttribute('aria-label','Открыть '+info.label);a.append(iconFor(info.svg));}
  a.append(el('span','nav-label',middle?'Помощник':info.label));
  if(!middle)a.append(el('i','nav-underline'));
  dock.append(a);
 }
 document.body.append(dock);
}
function init(){const shell=document.querySelector('.day-shell');if(!shell)return;shell.classList.add('dm-polished');if(page!=='world.html'){greeting(shell);addDock(shell);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();