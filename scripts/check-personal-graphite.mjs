import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/app/';
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const path of ['myday.html','world.html','myday.html?view=cycle','health.html']){
   const response=await page.goto(base+path,{waitUntil:'networkidle',timeout:40000});
   if(!response?.ok())throw Error(path+': unavailable');
   if(path.includes('view=cycle'))await page.waitForFunction(()=>!!document.querySelector('#cycleFrame')?.contentDocument?.querySelector('.care-shell'),null,{timeout:20000});
   const value=await page.evaluate(()=>{
    const shell=document.querySelector('body > .day-shell');
    if(!shell)throw Error('personal shell missing');
    const bodyBefore=getComputedStyle(document.body,'::before');
    const shellBefore=getComputedStyle(shell,'::before');
    const shellStyle=getComputedStyle(shell);
    const layers=[bodyBefore.backgroundImage,shellBefore.backgroundImage,shellStyle.backgroundImage];
    return {layers,overflow:document.documentElement.scrollWidth>innerWidth+3};
   });
   if(value.overflow)throw Error(path+' at '+width+': overflow');
   if(value.layers.some(layer=>/url\(/i.test(layer)))throw Error(path+' at '+width+': image in personal backdrop '+JSON.stringify(value.layers));
   if(!value.layers.some(layer=>layer.includes('linear-gradient')))throw Error(path+': graphite gradient missing');
   console.log('PASS '+path+' at '+width+'px photo-free graphite');
  }
  await context.close();
 }
}finally{await browser.close();}
