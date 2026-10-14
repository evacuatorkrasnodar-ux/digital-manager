// Capture representative Black Velvet screens for human visual review.
// Also guard against horizontal overflow and detached interactive cards.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/app/';
const dest='visual-audit';
mkdirSync(dest,{recursive:true});
const results=[];
const viewports=[{name:'phone',width:390,height:844},{name:'desktop',width:1280,height:900}];
const screens=[
 {name:'home',path:'index.html'},
 {name:'management',path:'index.html',open:async page=>{
   await page.locator('#dockOpenManage').evaluate(el=>el.click());
   await page.locator('#managementScreen').waitFor({state:'visible'});
 }},
 {name:'myday',path:'myday.html'},
 {name:'world',path:'world.html'},
 {name:'care',path:'myday.html?view=cycle',open:async page=>{
   await page.waitForFunction(()=>!!document.querySelector('#cycleFrame')?.contentDocument?.querySelector('.care-shell'),null,{timeout:20000});
 }}
];
try{
 for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('dm-business-journey-existing-v1','1'));
  const page=await context.newPage();
  for(const screen of screens){
   const issues=[];
   const onError=error=>issues.push(String(error.message).slice(0,160));
   page.on('pageerror',onError);
   const response=await page.goto(base+screen.path,{waitUntil:'networkidle',timeout:40000});
   if(!response?.ok())throw Error(screen.name+': cannot load page');
   const welcome=page.locator('#dmBusinessJourneyScreen');
   if(await welcome.count()&&await welcome.isVisible())await welcome.locator('[data-journey-close]').click();
   if(screen.open)await screen.open(page);
   await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   const metrics=await page.evaluate(()=>{
    const doc=document.documentElement;
    const visible=[...document.querySelectorAll('a,button,.day-panel,.care-panel,.world-spotlight,.mg-row,.metric-card')]
     .filter(el=>{const st=getComputedStyle(el);return st.display!=='none'&&st.visibility!=='hidden'&&el.getBoundingClientRect().height>0;});
    return {viewport:innerWidth,documentWidth:doc.scrollWidth,interactive:visible.length,
      outOfBounds:visible.filter(el=>{const r=el.getBoundingClientRect();return r.left<-3||r.right>innerWidth+3;})
       .slice(0,8).map(el=>({tag:el.tagName,id:el.id,cls:String(el.className).slice(0,85)}))};
   });
   if(metrics.documentWidth>vp.width+3)issues.push('Horizontal document overflow: '+metrics.documentWidth+'px');
   if(metrics.outOfBounds.length)issues.push('Cards or controls outside viewport: '+JSON.stringify(metrics.outOfBounds));
   if(screen.name==='care'){
    const care=page.frames().find(frame=>frame.url().includes('care.html?embedded=1'));
    if(!care)issues.push('Care embedded view not mounted');
   }
   const filename=`${screen.name}-${vp.name}.png`;
   await page.screenshot({path:dest+'/'+filename,fullPage:true,animations:'disabled'});
   results.push({screen:screen.name,viewport:vp.name,filename,...metrics,issues});
   page.off('pageerror',onError);
   console.log(filename,issues.length?'ISSUES '+issues.join('; '):'OK');
  }
  await context.close();
 }
}finally{
 await browser.close();
 writeFileSync(dest+'/report.json',JSON.stringify(results,null,2));
}
if(results.some(r=>r.issues.length))throw Error('Visual screen audit found issues; review visual-audit/report.json and screenshots');
