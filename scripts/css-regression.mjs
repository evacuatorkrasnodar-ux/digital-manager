// Compare actual computed styling from main and this branch in Chromium.
// Both copies are served on localhost on ports 8766 (main) and 8765 (candidate).
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const dashboardSelectors=[
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
const personalSelectors=[
 'body > .day-shell.day-shell',
 'body.dm-calendar-photo > .day-shell.day-shell',
 'body.dm-calendar-photo::before',
 '.calendar-legend',
 '.day-header',
 '.day-heading h1',
 '.world-tab',
 '.world-spotlight',
 '.day-panel',
 '.care-panel',
 '.month-arrow',
 '.care-shell .care-calendar-panel .calendar-toolbar h2',
 '.care-shell .care-calendar-panel .month-arrow',
 '.care-shell .care-grid .calendar-day.selected',
 '.care-shell .care-health-entry',
 '.care-shell .care-health-entry-arrow',
 '.day-section-heading h2',
 '.day-section-heading:not(.notebook-title) h2',
 '.world-head h2'
];
const pages=[
 {path:'index.html',selectors:dashboardSelectors},
 {path:'world.html',selectors:personalSelectors},
 {path:'myday.html',selectors:personalSelectors},
 {path:'care.html',selectors:personalSelectors}
];
const props=['display','position','gridTemplateColumns','gridColumn','gridRow','width','height',
 'minWidth','minHeight','maxHeight','margin','padding','backgroundColor','backgroundImage',
 'borderColor','borderWidth','borderRadius','boxShadow','color','fontSize','fontWeight',
 'lineHeight','letterSpacing','opacity','transform','filter','backdropFilter',
 'justifyContent','alignItems','flexDirection','gap','zIndex','outlineColor','textAlign'];
async function snapshot(port,width,height,path,selectors){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('dm-business-journey-existing-v1','1'));
 const response=await page.goto(`http://127.0.0.1:${port}/app/${path}`,{waitUntil:'networkidle',timeout:35000});
 if(!response?.ok())throw new Error(`Cannot load CSS comparison on port ${port}`);
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
 const values=await page.evaluate(({selectors,props})=>{
  const result={};
  for(const selector of selectors){
   const pseudo=selector.endsWith('::before')?'::before':null;
   const baseSelector=pseudo?selector.slice(0,-pseudo.length):selector;
   const els=[...document.querySelectorAll(baseSelector)].slice(0,3);
   result[selector]=els.map(el=>{
    const style=getComputedStyle(el,pseudo),o={__text:(el.textContent||'').trim().slice(0,80),__section:el.closest('.day-section-heading')?.className||''};
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
  for(const {path,selectors} of pages){
   const original=await snapshot(8766,width,844,path,selectors);
   const candidate=await snapshot(8765,width,844,path,selectors);
   const diffs=[];
   for(const selector of selectors){
    const old=original[selector],updated=candidate[selector];
    if(old.length!==updated.length){
     diffs.push(`${selector}: node count ${old.length} => ${updated.length}`);
     continue;
    }
    for(let i=0;i<old.length;i++)for(const prop of props){
     // My Day formerly imposed a redundant 54px minimum beneath a fixed 60px header.
     // The actual header height and all geometry remain compared below.
     if(['myday.html','care.html'].includes(path)&&selector==='.day-header'&&prop==='minHeight')continue;
     // Section titles intentionally receive the newly unified type scale.
     if(['.day-section-heading h2','.day-section-heading:not(.notebook-title) h2','.world-head h2'].includes(selector)&&['fontSize','fontWeight','letterSpacing','lineHeight','width','height'].includes(prop))continue;
     if(old[i][prop]!==updated[i][prop]){
      diffs.push(`${selector}[${i}].${prop}: ${old[i][prop]} => ${updated[i][prop]}`);
     }
    }
   }
   if(path!=='index.html'){
    const sectionSelector=path==='world.html'?'.world-head h2':'.day-section-heading:not(.notebook-title) h2';
    const headings=candidate[sectionSelector]||[];
    if(!headings.length)throw new Error(`Missing unified section titles on ${path}`);
    // Calendar-fixed is intentionally more compact on portrait phones.
    const compactCalendar=path==='myday.html'&&width<=700;
    const expectedSize=compactCalendar?Math.max(15,Math.min(17,width*.04)):Math.max(18,Math.min(19,width*.048));
    for(const heading of headings){
     if(Math.abs(Number.parseFloat(heading.fontSize)-expectedSize)>.13)
      throw new Error(`Section typography mismatch on ${path} (${heading.__text}; ${heading.__section}): ${heading.fontSize} vs ${expectedSize}px`);
     if(heading.fontWeight!=='460')
      throw new Error(`Section weight mismatch on ${path}: ${heading.fontWeight}`);
    }
   }
   if(diffs.length)throw new Error(`CSS regressions on ${path} at ${width}px:\\n`+diffs.slice(0,35).join('\\n'));
   console.log(`PASS: ${path} computed styles match approved version at ${width}px`);
  }
 }
}finally{await browser.close();}
