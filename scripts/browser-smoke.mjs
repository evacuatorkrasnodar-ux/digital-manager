import { chromium } from 'playwright';
const origin='http://127.0.0.1:8765/app/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const page=await browser.newPage({viewport:{width:390,height:844}});
page.on('pageerror',err=>errors.push(err.message));
async function open(path){
 const response=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:30000});
 if(!response?.ok())throw new Error(`HTTP ${response?.status()} at ${path}`);
 await page.waitForTimeout(900);
}
try{
 await open('index.html');
 if(!await page.locator('#homeScreen').count())throw new Error('Main dashboard missing');
 const mainPlasma=await page.locator('#tabAssistant, .dm-plasma, .dm-shared-plasma').count();
 if(!mainPlasma)throw new Error('Assistant plasma/launcher missing from dashboard');
 await open('world.html');
 if(!await page.locator('#tabAssistant, .dm-world-socket, .dm-shared-plasma').count())throw new Error('My World assistant launcher missing');
 if(!await page.locator('[data-world="memory"]').count())throw new Error('My World memory tab missing');
 await page.locator('[data-world="memory"]').first().click();
 if(!await page.locator('[data-world-view="memory"]').isVisible())throw new Error('Memory tab did not open');
 await page.evaluate(()=>localStorage.setItem('dm-smoke-sentinel','keep-user-data'));
 await page.reload({waitUntil:'domcontentloaded'});
 if(await page.evaluate(()=>localStorage.getItem('dm-smoke-sentinel'))!=='keep-user-data')throw new Error('User storage lost after reload');
 await open('index.html?jump=clients');
 await page.waitForTimeout(700);
 if(!await page.locator('#dmSalesBody').count())throw new Error('Clients destination did not initialize');
 await open('index.html?jump=finance');
 await page.waitForTimeout(700);
 if(!await page.locator('#dmBusinessPicture').count())throw new Error('Finance destination did not initialize');
 if(errors.length)throw new Error('Uncaught page errors: '+errors.slice(0,8).join(' | '));
 console.log('PASS: main page, My World tabs, reload persistence, client and finance routes.');
}finally{await browser.close();}
