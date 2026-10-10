/* Digital Manager OS — touch paging v5.
   Back arrows are explicit page links: Calendar -> Home; World/Health/Cycle -> Calendar.
   Never inject another arrow beside Profile or into dashboard subheads. */
(() => {
  'use strict';
  const file=location.pathname.split('/').pop()||'index.html';
  const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
  const personal=['calendar','notes','health','cycle'];
  const world=['morning','family','memory','finance','assistant'];
  const dashboard=['home','assistant','management'];
  function nextTab(direction){
    let names,selected,activate;
    if(file==='myday.html'){
      names=personal;
      selected=document.querySelector('body > .day-shell')?.dataset.personalView||'calendar';
      activate=value=>window.dispatchEvent(new CustomEvent('dm-personal-route',{detail:{view:value}}));
    }else if(file==='world.html'){
      names=world;
      selected=document.querySelector('.world-tabs [data-world].active')?.dataset.world||'morning';
      activate=value=>document.querySelector('.world-tabs [data-world="'+value+'"]')?.click();
    }else if(file==='index.html'){
      names=dashboard;
      selected=document.querySelector('.bottom-nav [data-tab].active')?.dataset.tab||'home';
      activate=value=>document.querySelector('.bottom-nav [data-tab="'+value+'"]')?.click();
    }else return;
    const index=names.indexOf(selected);
    const next=names[index+direction];
    if(next)activate(next);
  }
  function isBlocked(element){
    if(!(element instanceof Element))return true;
    // Calendar day cells are the main touch surface: allow a deliberate
    // horizontal page swipe over them, but preserve ordinary taps.
    if(element.closest('.calendar-day'))return !!document.querySelector('dialog[open]');
    if(element.closest('input,textarea,select,button,a,[role="button"],[contenteditable="true"],dialog,nav,canvas,video,audio,[data-no-swipe],.timebar,.chart-wrap'))return true;
    if(document.querySelector('dialog[open]'))return true;
    return false;
  }
  let start=null;
  function touchStart(event){
    if(event.touches.length!==1||isBlocked(event.target)){start=null;return;}
    const touch=event.touches[0];
    if(touch.clientX<22||touch.clientX>innerWidth-22){start=null;return;}
    start={x:touch.clientX,y:touch.clientY,time:Date.now()};
  }
  function touchEnd(event){
    if(!start||event.changedTouches.length!==1){start=null;return;}
    const first=start;start=null;
    if(isBlocked(event.target)||Date.now()-first.time>900)return;
    const touch=event.changedTouches[0];
    const dx=touch.clientX-first.x,dy=touch.clientY-first.y;
    if(Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.5)return;
    // Swipe left -> next section, swipe right -> previous section.
    const direction=dx<0?1:-1;
    if(embedded){
      try{window.parent.postMessage({type:'dm-personal-swipe',direction},location.origin);}catch(_){}
    }else nextTab(direction);
  }
  function init(){
    document.addEventListener('touchstart',touchStart,{passive:true});
    document.addEventListener('touchend',touchEnd,{passive:true});
    document.addEventListener('touchcancel',()=>{start=null},{passive:true});
    if(file==='myday.html'){
      window.addEventListener('message',event=>{
        if(event.origin!==location.origin||event.data?.type!=='dm-personal-swipe')return;
        const health=document.getElementById('healthFrame')?.contentWindow;
        const cycle=document.getElementById('cycleFrame')?.contentWindow;
        if(event.source!==health&&event.source!==cycle)return;
        if(event.data.direction!==1&&event.data.direction!==-1)return;
        nextTab(event.data.direction);
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
