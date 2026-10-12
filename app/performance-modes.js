/* Global, user-chosen performance profile. No UI or orb duplication. */
(()=>{
'use strict';
const KEY='digital-manager-black-velvet-v2';
const ALLOWED=new Set(['beautiful','eco','simple']);
const root=document.documentElement;
function read(){
 try{
  const state=JSON.parse(localStorage.getItem(KEY)||'{}');
  const mode=state?.management?.voice?.performanceMode;
  return ALLOWED.has(mode)?mode:'beautiful';
 }catch(_){return 'beautiful';}
}
function apply(mode){
 const valid=ALLOWED.has(mode)?mode:'beautiful';
 root.setAttribute('data-dm-performance',valid);
 return valid;
}
function sync(){apply(read());}
apply(read()); // Synchronous in <head>, so no flicker from a previous mode.
function visibility(){
 root.classList.toggle('dm-decorations-paused',document.hidden);
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',visibility,{once:true});
}else visibility();
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pageshow',sync);
window.addEventListener('storage',event=>{
 if(event.key===KEY||event.key===null)sync();
});
window.DMPerformance=Object.freeze({apply,getMode:()=>root.getAttribute('data-dm-performance')||'beautiful'});
})();
