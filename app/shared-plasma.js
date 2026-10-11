/* Shared white waiting plasma across all app pages; the Home art is canonical. */
(()=>{
'use strict';
const orbMarkup="<span class=\"dm-voice-orb dm-voice-orb-electric dm-dock-plasma\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmDockElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmDockElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#89ceff\"/><stop offset=\".34\" stop-color=\"#1b6af7\"/><stop offset=\".62\" stop-color=\"#0b26a7\"/><stop offset=\".87\" stop-color=\"#b394ff\"/><stop offset=\"1\" stop-color=\"#376eff\"/></linearGradient></defs><circle cx=\"60\" cy=\"60\" r=\"53\" fill=\"none\" stroke=\"#3564ec\" stroke-width=\".65\" opacity=\".42\"/><circle cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"url(#dmDockElectricStroke)\" stroke-width=\"2.1\" opacity=\".9\"/><circle cx=\"60\" cy=\"60\" r=\"47\" fill=\"none\" stroke=\"url(#dmDockElectricInner)\" stroke-width=\"1.1\" opacity=\".83\"/><circle class=\"dm-orb-arc dm-arc-ice\" cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"#c5efff\" stroke-width=\"2.05\" stroke-linecap=\"round\" stroke-dasharray=\"80 238\"/><circle class=\"dm-orb-arc dm-arc-violet\" cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"#d2aaff\" stroke-width=\"2.15\" stroke-linecap=\"round\" stroke-dasharray=\"53 261\"/></svg></span>";
function build(id){
 const t=document.createElement('template');t.innerHTML=orbMarkup.trim();
 const orb=t.content.firstElementChild;
 orb.classList.add('dm-shared-plasma');
 for(const n of orb.querySelectorAll('[id]')){const old=n.id;const next='dm-shared-'+id+'-'+old;n.id=next;
  for(const node of orb.querySelectorAll('*'))for(const at of [...node.attributes]){const val=at.value.replaceAll('url(#'+old+')','url(#'+next+')');if(val!==at.value)node.setAttribute(at.name,val);}
 }
 const brand=document.createElement('span');brand.className='dm-shared-brand';
 const img=document.createElement('img');img.src='./assets/plasma-glass-mark.webp';img.alt='';img.decoding='async';
 brand.append(img);orb.append(brand);
 return orb;
}
function sync(){
 // The main page already uses this exact source with the full event renderer.
 if((location.pathname.split('/').pop()||'index.html')==='index.html')return;
 // Other personal sections used a separate antiquated logo and ring.
 document.querySelectorAll('body > .bottom-nav .assistant-ring').forEach((old,i)=>{
   const socket=old.closest('.assistant-socket');if(!socket)return;
   socket.replaceChildren(build('nav-'+i));
   socket.classList.add('dm-shared-socket');
 });
 // My World copied the Home ring, but did not have its event/core state renderer.
 document.querySelectorAll('body > .bottom-nav .dm-dock-plasma:not(.dm-shared-plasma)').forEach((old,i)=>{
   old.replaceWith(build('world-'+i));
 });
 // Calendar's dock-free launcher keeps its five original laser tracks.
 document.querySelectorAll('.dm-myday-plasma-stage .dm-launcher-plasma:not(.dm-shared-plasma)').forEach((old,i)=>{
   old.replaceWith(build('day-'+i));
 });
 document.querySelectorAll('.dm-world-standalone .dm-dock-plasma:not(.dm-shared-plasma)').forEach((old,i)=>{
   old.replaceWith(build('solo-'+i));
 });
 document.querySelectorAll('.dm-shared-plasma').forEach(orb=>{
   const parent=orb.closest('[data-mode]');const mode=parent?.dataset.mode||'idle';
   orb.dataset.mode=mode;
 });
}
function init(){sync();const observer=new MutationObserver(()=>{observer.disconnect();sync();observer.observe(document.body,{childList:true,subtree:true});});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();