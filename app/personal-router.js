/* My Day single-shell router v1.
   Calendar, Notebook, Health and Cycle keep one header, wallpaper and top rail.
   Medical journals run in persistent same-origin content frames so their
   existing IndexedDB, consent, dialogs and event handlers remain untouched. */
(() => {
  'use strict';
  const valid=new Set(['calendar','notes','health','cycle']);
  const medical=new Set(['health','cycle']);
  const frames={};
  const panels={};
  let current='',initialized=false,fromHistory=false,pendingHealthView='';
  const route=(view)=>window.dispatchEvent(new CustomEvent('dm-personal-route',{detail:{view}}));
  const safeView=view=>valid.has(view)?view:'calendar';
  const getView=()=>safeView(new URLSearchParams(location.search).get('view'));
  function sizeFrames(){
    for(const kind of ['health','cycle']){
      const frame=frames[kind],panel=panels[kind];
      if(!frame||!panel||panel.hidden)continue;
      const available=window.innerHeight-frame.getBoundingClientRect().top-90;
      frame.style.height=Math.max(220,Math.floor(available))+'px';
    }
  }
  function showHealthSubsection(view){
    if(!['metrics','meds','sleep','files'].includes(view))return;
    pendingHealthView=view;
    const frame=frames.health;
    try{
      const button=frame?.contentDocument?.querySelector('[data-health="'+view+'"]');
      if(button){button.click();pendingHealthView='';}
    }catch(_){}
  }
  function connectFrame(view){
    const frame=frames[view];
    const doc=frame?.contentDocument;
    if(!doc)return;
    // Intercept only the links between our own personal sections.
    // All medical form actions, export buttons and private records stay in frame.
    doc.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');
      if(!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      let url;
      try{url=new URL(link.href);}catch(_){return;}
      if(url.origin!==location.origin)return;
      const page=url.pathname.split('/').pop();
      if(!['myday.html','health.html','care.html'].includes(page))return;
      event.preventDefault();
      if(page==='myday.html'){
        route(url.searchParams.get('view')==='notes'?'notes':'calendar');
      }else if(page==='care.html'){
        route('cycle');
      }else{
        route('health');
        showHealthSubsection(url.searchParams.get('view')||'metrics');
      }
    },true);
    if(view==='health'&&pendingHealthView)showHealthSubsection(pendingHealthView);
  }
  function activate(view){
    view=safeView(view);
    if(!initialized)return;
    const changed=current!==view;
    current=view;
    for(const kind of ['health','cycle']){
      const panel=panels[kind];
      panel.hidden=view!==kind;
      panel.setAttribute('aria-hidden',String(view!==kind));
      if(view===kind&&!frames[kind].getAttribute('src')){
        frames[kind].src='./'+(kind==='health'?'health':'care')+'.html?embedded=1';
      }
    }
    const shell=document.querySelector('body > .day-shell');
    shell?.classList.toggle('personal-medical-open',medical.has(view));
    if(changed&&!fromHistory){
      const url=new URL(location.href);
      if(view==='calendar')url.searchParams.delete('view');
      else url.searchParams.set('view',view);
      if(url.href!==location.href)history.pushState({personalView:view},'',url);
    }
    requestAnimationFrame(sizeFrames);
    if(changed&&medical.has(view)){
      // Switching views does not replace the document or move the upper dock.
      window.scrollTo({top:0,behavior:'instant'});
    }
  }
  function init(){
    const shell=document.querySelector('body > .day-shell');
    if(!shell||!document.getElementById('calendarView'))return;
    for(const kind of ['health','cycle']){
      panels[kind]=document.getElementById(kind==='health'?'healthEmbedded':'cycleEmbedded');
      frames[kind]=document.getElementById(kind==='health'?'healthFrame':'cycleFrame');
      if(!panels[kind]||!frames[kind])return;
      frames[kind].addEventListener('load',()=>{
        connectFrame(kind);
        frames[kind].dataset.ready='true';
        panels[kind].classList.add('loaded');
        requestAnimationFrame(sizeFrames);
      });
    }
    initialized=true;
    pendingHealthView=new URLSearchParams(location.search).get('healthView')||'';
    window.addEventListener('resize',sizeFrames);
    current='';
    activate(shell.dataset.personalView||getView());
    window.addEventListener('dm-personal-view',event=>activate(event.detail?.view));
    window.addEventListener('popstate',()=>{
      fromHistory=true;
      route(getView());
      fromHistory=false;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
