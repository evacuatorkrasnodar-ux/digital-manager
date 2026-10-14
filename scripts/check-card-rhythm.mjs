// Check the shared rhythm of ordinary cards on actual loaded personal pages.
// No production records are created: test cards live only in temporary DOM fixtures.
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const pages=[
 {file:'world.html',root:'.world-shell',fixture:`<div class="world-list"><div class="world-item"><span class="world-item-icon">✦</span><div class="world-item-text"><strong>Проверка карточки</strong><p>Достаточно длинная строка содержимого для проверки узкого экрана</p></div></div><div class="world-item"><span class="world-item-icon">✦</span><div class="world-item-text"><strong>Вторая карточка</strong></div></div></div>`,items:'.world-item',container:'.world-list'},
 {file:'care.html',root:'.care-shell',fixture:`<div class="care-day-item">Проверка записи личного раздела</div><div class="care-history-item">Проверка карточки истории</div>`,items:'.care-day-item,.care-history-item'}
];
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:840},reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const cfg of pages){
   const response=await page.goto('http://127.0.0.1:8765/app/'+cfg.file,{waitUntil:'networkidle'});
   if(!response?.ok())throw Error(cfg.file+': page did not load');
   const stats=await page.evaluate(cfg=>{
    const root=document.querySelector(cfg.root);
    if(!root)throw Error('Missing shell '+cfg.root);
    const host=document.createElement('section');
    host.setAttribute('data-visual-rhythm-test','');
    host.style.cssText='display:block;width:100%;box-sizing:border-box;max-width:100%;';
    host.innerHTML=cfg.fixture;
    root.appendChild(host);
    const elements=[...host.querySelectorAll(cfg.items)];
    if(!elements.length)throw Error('No rhythm test cards');
    const values=elements.map(el=>{
     const st=getComputedStyle(el),rect=el.getBoundingClientRect(),h=host.getBoundingClientRect();
     return {padding:st.paddingTop,paddingRight:st.paddingRight,paddingBottom:st.paddingBottom,paddingLeft:st.paddingLeft,marginBottom:st.marginBottom,overflow:rect.left<h.left-1||rect.right>h.right+1};
    });
    let gap=null;
    if(cfg.container)gap=getComputedStyle(host.querySelector(cfg.container)).gap;
    host.remove();
    return {values,gap};
   },cfg);
   for(const item of stats.values){
    for(const key of ['padding','paddingRight','paddingBottom','paddingLeft'])
     if(item[key]!=='10px')throw Error(cfg.file+' '+width+'px unexpected '+key+': '+item[key]);
    if(item.overflow)throw Error(cfg.file+' '+width+'px card spills beyond shell');
    if(cfg.file==='care.html'&&item.marginBottom!=='8px')
     throw Error('Care margin mismatch: '+item.marginBottom);
   }
   if(cfg.container&&stats.gap!=='8px')throw Error('World list gap mismatch: '+stats.gap);
   console.log('PASS: '+cfg.file+' at '+width+'px — shared 8px gap and 10px card padding');
  }
  await context.close();
 }
}finally{await browser.close();}
