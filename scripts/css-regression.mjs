// Compare actual computed styling from main and this branch in Chromium.
// Both copies are served on localhost on ports 8766 (main) and 8765 (candidate).
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const selectors=[
 '#homeScreen .metric-grid .clients-card',
 '#homeScreen .metric-grid .orders-card',
 '#homeScreen .metric-grid .profit-card',
 '#homeScreen .metric-grid .recommendation-card',
 '#homeScreen .clients-card .donut',
 '#homeScreen .orders-card .bargraph',
 '#tabAssistant',
 '.dm-chat-panel',
 '.dm-chat-compose',
 '.dm-chat-compose textarea',
 '.dm-chat-edit-buttons button',
 '.dm-draft-actions-grid button',
 '.dm-draft-actions-grid button svg',
 '.dm-draft-actions-grid button span',
 '.dm-saved-note'
];
const props=['display','position','gridTemplateColumns','gridColumn','gridRow','width','height',
 'minWidth','minHeight','maxHeight','margin','padding','backgroundColor','backgroundImage',
 'borderColor','borderWidth','borderRadius','boxShadow','color','fontSize','fontWeight',
 'lineHeight','letterSpacing','opacity','transform','filter','backdropFilter',
 'justifyContent','alignItems','flexDirection','gap','zIndex','outlineColor','textAlign'];
async function snapshot(port,width,height){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('dm-business-journey-existing-v1','1'));
 const response=await page.goto(`http://127.0.0.1:${port}/app/index.html`,{waitUntil:'networkidle',timeout:35000});
 if(!response?.ok())throw new Error(`Cannot load CSS comparison on port ${port}`);
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
 const values=await page.evaluate(({selectors,props})=>{
  const result={};
  for(const selector of selectors){
   const els=[...document.querySelectorAll(selector)].slice(0,3);
   result[selector]=els.map(el=>{
    const style=getComputedStyle(el),o={};
    for(const prop of props)o[prop]=String(style[prop]??'').replaceAll(location.origin,'<origin>');
    return o;
   });
  }
  return result;
 },{selectors,props});
 await context.close();
 return values;
}
try{
 for(const width of [390,1280]){
  const original=await snapshot(8766,width,844),candidate=await snapshot(8765,width,844);
  const diffs=[];
  for(const selector of selectors){
   const old=original[selector],updated=candidate[selector];
   if(old.length!==updated.length){diffs.push(`${selector}: node count ${old.length} => ${updated.length}`);continue;}
   for(let i=0;i<old.length;i++)for(const prop of props){
    if(old[i][prop]!==updated[i][prop])diffs.push(`${selector}[${i}].${prop}: ${old[i][prop]} => ${updated[i][prop]}`);
   }
  }
  if(diffs.length)throw new Error(`CSS regressions at ${width}px:\n`+diffs.slice(0,35).join('\n'));
  console.log(`PASS: main/candidate computed CSS matches at ${width}px (selected cards and assistant controls)`);
 }
}finally{await browser.close();}
