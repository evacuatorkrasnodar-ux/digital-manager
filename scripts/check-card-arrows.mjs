// Verify shared chrome circular chevrons in the Management menu and My World card.
// Real clicks are required; cards retain their original navigation handlers.
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/app/';
const EPS=.9;
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  const response=await page.goto(base+'index.html',{waitUntil:'networkidle',timeout:35000});
  if(!response?.ok())throw Error('Main screen unavailable');
  const welcome=page.locator('#dmBusinessJourneyScreen');
  if(await welcome.isVisible())await welcome.locator('[data-journey-close]').click();
  const tab=page.locator('#dockOpenManage');
  if(!await tab.count())throw Error('Management action missing');
  // The assistant quick menu is deliberately hidden in the default tap-to-compose mode.
  // Trigger the unchanged button handler without changing the user's voice preferences.
  await tab.evaluate(el=>el.click());
  await page.locator('#managementScreen').waitFor({state:'visible',timeout:10000});
  const circles=await page.locator('#mgMenu .mg-menu-row > .mg-menu-chevron.dm-circle-arrow').evaluateAll(nodes=>nodes.map(el=>{
   const rect=el.getBoundingClientRect(),s=getComputedStyle(el);
   const svg=el.querySelector('svg'),ico=svg&&getComputedStyle(svg);
   const button=el.closest('button');
   const row=button?.getBoundingClientRect();
   return {size:[rect.width,rect.height],round:s.borderRadius,hasSvg:!!svg,
    icon:ico?[parseFloat(ico.width),parseFloat(ico.height)]:[],
    inside:!!row&&rect.left>=row.left&&rect.right<=row.right+1,
    bareSymbol:el.textContent?.trim()||'',label:button?.getAttribute('data-mg-open')};
  }));
  if(circles.length!==5)throw Error('Expected 5 Management circle chevrons, found '+circles.length);
  for(const c of circles){
   if(!c.hasSvg||c.bareSymbol)throw Error('Legacy text chevron remains: '+JSON.stringify(c));
   if(c.size.some(x=>Math.abs(x-22)>EPS)||c.icon.some(x=>Math.abs(x-13)>EPS))
    throw Error('Management icon geometry differs: '+JSON.stringify(c));
   if(c.round!=='50%'||!c.inside)throw Error('Chevron not inside its card: '+JSON.stringify(c));
  }
  await page.locator('#mgMenu [data-mg-open="manager"]').click();
  if(!await page.locator('#mgDetail').isVisible())throw Error('Management card click no longer opens detail');
  if((await page.locator('#mgTitle').textContent())?.trim()!=='Мой помощник')
   throw Error('Management assistant heading differs from menu label');
  const assistantSettings=page.locator('#mgDetail [data-mg-open="voice"]');
  if(!await assistantSettings.count())throw Error('Assistant communication settings link missing');
  if((await assistantSettings.locator('strong').textContent())?.trim()!=='Внешний вид и общение')
   throw Error('Assistant subcategory name not clear');
  await assistantSettings.click();
  if((await page.locator('#mgTitle').textContent())?.trim()!=='Внешний вид и общение')
   throw Error('Assistant communication settings title mismatch');
  if(!await page.locator('#voiceDock').count()||!await page.locator('.dm-dock-customize').count())
   throw Error('Dock settings were lost while simplifying assistant navigation');
  console.log('PASS Assistant navigation at '+width+'px: label, voice/dock settings intact');
  console.log('PASS Management at '+width+'px: 5 matching chrome circles and working menu click');
  const day=await page.goto(base+'myday.html',{waitUntil:'networkidle',timeout:35000});
  if(!day?.ok())throw Error('My Day unavailable');

  const tasks=await page.locator('a.dm-day-work-link').evaluate(el=>{
   const arrow=el.querySelector(':scope > .dm-circle-arrow');
   if(!arrow)throw Error('Tasks card has no shared circle arrow');
   const card=el.getBoundingClientRect(),r=arrow.getBoundingClientRect();
   const label=el.children[1]?.getBoundingClientRect();
   const st=getComputedStyle(arrow),svg=arrow.querySelector('svg');
   const icon=svg?getComputedStyle(svg):null;
   return {href:el.getAttribute('href'),size:[r.width,r.height],icon:icon?[parseFloat(icon.width),parseFloat(icon.height)]:[],
    round:st.borderRadius,display:st.display,svg:!!svg,
    inside:r.left>=card.left-1&&r.right<=card.right+1,
    textClear:!!label&&label.right<=r.left+1,
    cardWidth:card.width};
  });
  if(!tasks.svg||tasks.display==='none'||!tasks.inside||!tasks.textClear||tasks.round!=='50%')
   throw Error('Tasks arrow display/overlap problem at '+width+': '+JSON.stringify(tasks));
  if(tasks.size.some(n=>Math.abs(n-22)>EPS)||tasks.icon.some(n=>Math.abs(n-13)>EPS))
   throw Error('Tasks card lacks approved 22px/13px chrome arrow at '+width+': '+JSON.stringify(tasks));
  if(!tasks.href?.includes('journal=mine'))throw Error('Tasks card navigation destination changed');
  await page.locator('a.dm-day-work-link').click();
  await page.waitForURL(/\/index\.html\?journal=mine(?:&|$)/,{timeout:12000});
  console.log('PASS Tasks at '+width+'px: round arrow visible and whole-card link opens');
  await page.goto(base+'myday.html',{waitUntil:'networkidle',timeout:35000});

  const arrow=await page.locator('a.world-entry').evaluate(el=>{
   const arrow=el.querySelector('.world-entry-arrow.dm-circle-arrow');
   if(!arrow)throw Error('Shared My World circle missing');
   const b=el.getBoundingClientRect(),a=arrow.getBoundingClientRect();
   const text=el.querySelector('span:nth-child(2)')?.getBoundingClientRect();
   const style=getComputedStyle(arrow),ico=getComputedStyle(arrow.querySelector('svg'));
   return {href:el.getAttribute('href'),cardHeight:b.height,
    shown:style.display!=='none'&&a.width>0&&a.height>0,
    size:[a.width,a.height],icon:[parseFloat(ico.width),parseFloat(ico.height)],
    borderRadius:style.borderRadius,
    inside:a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1,
    textClear:!!text&&text.right<=a.left+1,
    title:el.querySelector('strong')?.textContent?.trim()};
  });
  if(!arrow.shown||!arrow.inside||!arrow.textClear)throw Error('My World arrow hidden/overlaps text at '+width+': '+JSON.stringify(arrow));
  if(arrow.size.some(n=>Math.abs(n-22)>EPS)||arrow.icon.some(n=>Math.abs(n-12)>EPS))
   throw Error('My World does not use 22px round chrome arrow at '+width+': '+JSON.stringify(arrow));
  if(arrow.borderRadius!=='50%')throw Error('My World arrow lost round material');
  if(Math.abs(arrow.cardHeight-48)>EPS)throw Error('My World card height changed: '+arrow.cardHeight);
  if(!arrow.href?.includes('world.html'))throw Error('My World card destination lost');
  await page.locator('a.world-entry').click();
  await page.waitForURL(/\/world\.html(?:\?|$)/,{timeout:12000});
  console.log('PASS My World at '+width+'px: chrome arrow visible, card unchanged, link opens');
  await context.close();
 }
}finally{await browser.close();}
