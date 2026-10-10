/* Digital Manager OS — shared back navigation and touch paging v1.
   Swipe only across page content, never inputs, dialogs, charts or navigation docks. */
(() => {
  'use strict';
  const file=location.pathname.split('/').pop()||'index.html';
  const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
  const personal=['calendar','notes','health','cycle'];
  const world=['morning','family','memory','finance','assistant'];
  const dashboard=['home','assistant','management'];
  const svg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/></svg>';
  function fallback(){
    if(file==='world.html')return './myday.html';
    if(file==='health.html')return './myday.html?view=health';
    if(file==='care.html')return './myday.html?view=cycle';
    return './index.html';
  }
  function goBack(){
    // Native history preserves the user's actual path through tabs and pages.
    if(history.length>1){history.back();return;}
    if(file!=='index.html')location.assign(fallback());
  }
  function insertBack(){
    if(embedded)return;
    const header=document.querySelector('body > .day-shell > .day-header');
    const holder=header||document.body;
    if(holder.querySelector('.dm-back-circle'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='dm-back-circle';
    button.setAttribute('aria-label','Назад');
    button.setAttribute('title','Вернуться назад');
    button.innerHTML=svg;
    button.addEventListener('click',goBack);
    holder.append(button);
  }
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
    if(element.closest('input,textarea,select,button,a,[role="button"],[contenteditable="true"],dialog,nav,canvas,video,audio,[data-no-swipe],.month-grid,.calendar-panel,.timebar,.chart-wrap'))return true;
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
    insertBack();
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
