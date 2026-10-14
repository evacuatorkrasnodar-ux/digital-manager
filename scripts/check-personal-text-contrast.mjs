import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const scenes=[
 {path:'world.html',root:'.world-shell',html:'<div class="world-item-text"><small>Дополнительная информация</small></div>',selector:'.world-item-text small'},
 {path:'myday.html?view=cycle',root:'.care-shell',html:'<div class="care-history-item"><small>История</small></div>',selector:'.care-history-item small',embedded:true}
];
try{
 for(const width of [320,390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  for(const c of scenes){
   const response=await page.goto('http://127.0.0.1:8765/app/'+c.path,{waitUntil:'networkidle'});
   if(!response?.ok())throw Error(c.path+' unavailable');
   let target=page;
   if(c.embedded){
    await page.waitForFunction(()=>!!document.querySelector('#cycleFrame')?.contentDocument?.querySelector('.care-shell'),null,{timeout:20000});
    target=page.frames().find(f=>f.url().includes('care.html?embedded=1'));
    if(!target)throw Error('Embedded Care unavailable');
   }
   const data=await target.evaluate(c=>{
    const root=document.querySelector(c.root);
    if(!root)throw Error('Missing personal shell '+c.root);
    const node=document.createElement('section');
    node.innerHTML=c.html;
    root.appendChild(node);
    const el=node.querySelector(c.selector);
    const styles=getComputedStyle(el);
    const result={color:styles.color,fontSize:styles.fontSize,display:styles.display};
    node.remove();
    return result;
   },c);
   if(data.color!=='rgb(184, 204, 221)')throw Error(c.path+' wrong muted color '+data.color);
   if(data.display==='none')throw Error(c.path+' text hidden');
   console.log('PASS '+c.path+' at '+width+'px: readable secondary text '+data.color);
  }
  await ctx.close();
 }
}finally{await browser.close();}
