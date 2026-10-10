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
  let current='',initialized=false,fromHistory=false,pendingHealthView='',healthSection='metrics';
  const route=(view)=>window.dispatchEvent(new CustomEvent('dm-personal-route',{detail:{view}}));
  const safeView=view=>valid.has(view)?view:'calendar';
  const getView=()=>safeView(new URLSearchParams(location.search).get('view'));
  function sizeFrames(){
    for(const kind of ['health','cycle']){
      const frame=frames[kind],panel=panels[kind];
      if(!frame||!panel||panel.hidden)continue;
      const main=panel.closest('main');
      if(!main)continue;
      // The main panel scrolls; the header and both docks never do.
      const available=main.clientHeight-(frame.getBoundingClientRect().top-main.getBoundingClientRect().top);
      frame.style.height=Math.max(220,Math.floor(available))+'px';
    }
  }
  function showHealthSubsection(view){
    if(!['metrics','meds','sleep','files'].includes(view))return;
    pendingHealthView=view;
    healthSection=view;
    updateMedicalDock();
    const frame=frames.health;
    try{
      const button=frame?.contentDocument?.querySelector('[data-health="'+view+'"]');
      if(button){button.click();pendingHealthView='';}
    }catch(_){}
  }
  function updateMedicalDock(){
    const intro=document.getElementById('personalHealthIntro');
    const dock=document.getElementById('personalHealthTabs');
    if(!intro||!dock)return;
    const medicalOpen=medical.has(current);
    intro.hidden=!medicalOpen;
    dock.hidden=!medicalOpen;
    const cycle=current==='cycle';
    const eyebrow=document.getElementById('personalHealthEyebrow');
    const title=document.getElementById('personalHealthTitle');
    const description=document.getElementById('personalHealthDescription');
    if(eyebrow)eyebrow.textContent=cycle?'ЖЕНСКОЕ ЗДОРОВЬЕ ♡':'МОЁ ЗДОРОВЬЕ ♡';
    if(title)title.textContent=cycle?'Цикл под контролем. Ну, насколько он согласен.':'Здоровье любит внимание. И выходные.';
    if(description)description.textContent=cycle?'Даты и самочувствие — здесь. Память может взять выходной.':'Пульс, сон и записи — всё под рукой. Без очереди в регистратуру.';
    const selected=cycle?'cycle':healthSection;
    dock.querySelectorAll('[data-personal-health]').forEach(button=>{
      const active=button.dataset.personalHealth===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
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
    updateMedicalDock();
    if(changed&&!fromHistory){
      const url=new URL(location.href);
      if(view==='calendar')url.searchParams.delete('view');
      else url.searchParams.set('view',view);
      if(url.href!==location.href)history.pushState({personalView:view},'',url);
    }
    if(changed){
      // Reset only the content scroller. Never scroll the page or move the dock.
      const main=shell?.querySelector('main');
      if(main)main.scrollTop=0;
    }
    requestAnimationFrame(sizeFrames);
  }
  function init(){
    const shell=document.querySelector('body > .day-shell');
    if(!shell||!document.getElementById('calendarView'))return;
    for(const kind of ['health','cycle']){
      panels[kind]=document.getElementById(kind==='health'?'healthEmbedded':'cycleEmbedded');
      frames[kind]=document.getElementById(kind==='health'?'healthFrame':'cycleFrame');
      if(!panels[kind]||!frames[kind])return;
      frames[kind].addEventListener('load',()=>{
        // Ignore the iframe's initial about:blank event.
        try{
          const url=new URL(frames[kind].contentWindow.location.href);
          if(url.searchParams.get('embedded')!=='1')return;
        }catch(_){return;}
        connectFrame(kind);
        frames[kind].dataset.ready='true';
        panels[kind].classList.add('loaded');
        requestAnimationFrame(sizeFrames);
      });
    }
    initialized=true;
    pendingHealthView=new URLSearchParams(location.search).get('healthView')||'';
    if(['metrics','meds','sleep','files'].includes(pendingHealthView))healthSection=pendingHealthView;
    document.getElementById('personalHealthTabs')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-personal-health]');
      if(!button)return;
      const section=button.dataset.personalHealth;
      if(section==='cycle'){route('cycle');return;}
      if(current!=='health')route('health');
      showHealthSubsection(section);
    });
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
