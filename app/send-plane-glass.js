/* Original glass Send button: enable image artwork only when loaded.
   Otherwise retain the functional SVG and CSS glass fallback. */
(() => {
  'use strict';
  function init(){
    const button=document.querySelector('body > .world-shell #worldAskForm > button[type="submit"]');
    if(!button)return;
    const img=new Image();
    img.onload=()=>button.classList.add('plane-art-ready');
    img.onerror=()=>button.classList.remove('plane-art-ready');
    img.src='./assets/send-plane-glass.webp';
    if(img.complete&&img.naturalWidth>0)button.classList.add('plane-art-ready');
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
