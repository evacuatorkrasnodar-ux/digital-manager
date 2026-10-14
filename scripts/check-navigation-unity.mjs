// Back navigation is a shared Black Velvet control on My Day, My World and
// embedded Care. Verify placement, dimensions, SVG and link contracts in Chromium.
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/app/';
const cases=[
 {file:'myday.html',selector:'.day-shell:not(.care-shell,.world-shell) .day-back',target:'index.html'},
 {file:'world.html',selector:'.world-shell .day-back',target:'myday.html'},
 {file:'care.html',selector:'.day-shell:not(.care-shell,.world-shell) .day-back',target:'index.html',embedded:true}
];
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const test of cases){
   const response=await page.goto(base+(test.embedded?'myday.html?view=cycle':test.file),{waitUntil:'networkidle',timeout:30000});
   if(!response?.ok())throw Error('Unable to open '+test.file);
   if(test.embedded){
    await page.waitForFunction(()=>!!document.querySelector('#cycleFrame')?.contentDocument?.querySelector('.care-shell'),null,{timeout:20000});
    const care=page.frames().find(f=>f.url().includes('care.html?embedded=1'));
    if(!care)throw Error('Care embedded page not loaded through parent router');
    const hidden=await care.evaluate(()=>{
     const back=document.querySelector('.care-shell header.day-header .day-back');
     if(!back)throw Error('Embedded Care source Back anchor missing');
     return getComputedStyle(back.closest('header')).display==='none';
    });
    if(!hidden)throw Error('Duplicate Back control visible inside embedded Care');
   }
   const result=await page.evaluate(selector=>{
    const a=document.querySelector(selector);
    if(!a)throw Error('Back control missing for '+selector);
    const header=a.closest('header.day-header');
    if(!header)throw Error('Back control outside page header');
    const b=a.getBoundingClientRect(),h=header.getBoundingClientRect();
    const st=getComputedStyle(a),svg=a.querySelector('svg');
    if(!svg)throw Error('Missing stroked-chevron SVG');
    const icon=getComputedStyle(svg);
    return {
     size:[b.width,b.height],centerY:b.top+b.height/2-(h.top+h.height/2),
     insetRight:h.right-b.right,borderRadius:st.borderRadius,
     bg:st.backgroundImage,border:st.borderStyle,svgSize:[icon.width,icon.height],
     stroke:icon.stroke,href:a.getAttribute('href'),label:a.getAttribute('aria-label')
    };
   },test.selector);
   const expected=width<=350?31:34;
   if(result.size.some(n=>Math.abs(n-expected)>.6))
    throw Error(test.file+' '+width+': Back '+result.size+' instead of '+expected+'px');
   if(Math.abs(result.centerY)>1)
    throw Error(test.file+' '+width+': Back not vertically centered, delta '+result.centerY);
   if(Math.abs(result.insetRight)>2)
    throw Error(test.file+' '+width+': Back not right-aligned, gap '+result.insetRight);
   if(result.borderRadius!=='50%'||result.border!=='solid'||!result.bg.includes('gradient'))
    throw Error(test.file+' '+width+': shared chrome appearance missing');
   if(result.svgSize.some(n=>Math.abs(parseFloat(n)-16)>.6))
    throw Error(test.file+' '+width+': SVG chevron size unexpected '+result.svgSize);
   if(!result.href?.endsWith(test.target)||!result.label?.trim())
    throw Error(test.file+' '+width+': Back destination/accessible label incorrect');
   console.log('PASS '+test.file+' at '+width+'px — circular Back centered, original link preserved');
   if(width===390&&test.file==='world.html'){
    await page.locator('.world-shell .day-back').click();
    await page.waitForURL(/\/myday\.html(?:\?|$)/,{timeout:10000});
    console.log('PASS My World -> My Day Back click navigates');
   }
  }
  await context.close();
 }
}finally{await browser.close();}
