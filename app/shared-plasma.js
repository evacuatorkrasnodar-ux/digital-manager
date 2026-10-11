/* Canonical, isolated waiting plasma. No old nav/ring CSS classes. */
(()=>{
'use strict';
const orbMarkup="<span class=\"dm-shared-plasma\" aria-hidden=\"true\"><i class=\"dm-shared-halo\"></i><i class=\"dm-shared-rim\"></i><i class=\"dm-shared-edge\"></i><svg class=\"dm-shared-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmDockElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmDockElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#89ceff\"/><stop offset=\".34\" stop-color=\"#1b6af7\"/><stop offset=\".62\" stop-color=\"#0b26a7\"/><stop offset=\".87\" stop-color=\"#b394ff\"/><stop offset=\"1\" stop-color=\"#376eff\"/></linearGradient></defs><circle cx=\"60\" cy=\"60\" r=\"53\" fill=\"none\" stroke=\"#3564ec\" stroke-width=\".65\" opacity=\".42\"/><circle cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"url(#dmDockElectricStroke)\" stroke-width=\"2.1\" opacity=\".9\"/><circle cx=\"60\" cy=\"60\" r=\"47\" fill=\"none\" stroke=\"url(#dmDockElectricInner)\" stroke-width=\"1.1\" opacity=\".83\"/><circle class=\"dm-shared-arc dm-shared-ice\" cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"#c5efff\" stroke-width=\"2.05\" stroke-linecap=\"round\" stroke-dasharray=\"80 238\"/><circle class=\"dm-shared-arc dm-shared-violet\" cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"#d2aaff\" stroke-width=\"2.15\" stroke-linecap=\"round\" stroke-dasharray=\"53 261\"/></svg></span>";
let serial=0;
function create(key='orb'){
 const t=document.createElement('template');t.innerHTML=orbMarkup;
 const orb=t.content.firstElementChild;
 const prefix='dm-plasma-'+String(key).replace(/[^a-z0-9_-]/gi,'')+'-'+(++serial);
 const ids=new Map();
 for(const n of orb.querySelectorAll('[id]')){ids.set(n.id,prefix+'-'+n.id);n.id=ids.get(n.id);}
 for(const n of orb.querySelectorAll('*'))for(const a of [...n.attributes]){
  if(a.name==='id')continue;
  let value=a.value;
  for(const [old,next] of ids){
   value=value.replaceAll('url(#'+old+')','url(#'+next+')');
   if((a.name==='href'||a.name==='xlink:href')&&value==='#'+old)value='#'+next;
  }
  if(value!==a.value)n.setAttribute(a.name,value);
 }
 const brand=document.createElement('span');brand.className='dm-shared-brand';brand.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.src='./assets/plasma-glass-mark.webp';img.alt='';img.decoding='async';
 brand.append(img);orb.append(brand);orb.dataset.mode='idle';
 return orb;
}
window.DMSharedPlasma=Object.freeze({create});
function sync(){
 const file=location.pathname.split('/').pop()||'index.html';
 if(file==='world.html')return; // World now owns ONE static dock and calls create once.
 if(file==='index.html'){
  const head=document.querySelector('#dmAttentionPanel .dm-attention-head');
  if(head&&!head.querySelector('.dm-attention-approved-plasma')){
   const orb=create('attention');orb.classList.add('dm-attention-approved-plasma');head.append(orb);
  }
  return;
 }
 document.querySelectorAll('body > .bottom-nav .assistant-ring').forEach((old,i)=>{
  const socket=old.closest('.assistant-socket');if(!socket)return;
  socket.replaceChildren(create('nav-'+i));socket.classList.add('dm-shared-socket');
 });
 document.querySelectorAll('body > .bottom-nav .dm-dock-plasma:not(.dm-shared-plasma)').forEach((old,i)=>old.replaceWith(create('dock-'+i)));
 document.querySelectorAll('.dm-myday-plasma-stage .dm-launcher-plasma:not(.dm-shared-plasma)').forEach((old,i)=>old.replaceWith(create('calendar-'+i)));
 for(const orb of document.querySelectorAll('.dm-shared-plasma')){
  const parent=orb.parentElement?.closest('[data-mode]');
  orb.dataset.mode=parent?.dataset.mode||'idle';
 }
}
function init(){
 const file=location.pathname.split('/').pop()||'index.html';
 if(file==='world.html')return;
 sync();
 const observer=new MutationObserver(()=>{observer.disconnect();sync();observer.observe(document.body,{childList:true,subtree:true});});
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
