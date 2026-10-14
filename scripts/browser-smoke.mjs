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
 await page.addInitScript(()=>{
   window.__dmVoiceStarts=0;
   window.SpeechRecognition=class {
     start(){window.__dmVoiceStarts++;this.onstart?.();}
     stop(){this.onend?.();}
     abort(){this.onend?.();}
   };
 });
 await open('index.html');
 if(!await page.locator('#homeScreen').count())throw new Error('Main dashboard missing');
 const composer=page.locator('#plasmaChatForm');
 if(!await composer.count())throw new Error('Assistant text composer missing');
 if(!await page.locator('#plasmaChatInput').count())throw new Error('Assistant text input missing');
 if(!await page.locator('#plasmaOpenChat').count())throw new Error('Assistant text-open action missing');
 const mainPlasma=await page.locator('#tabAssistant, .dm-plasma, .dm-shared-plasma').count();
 if(!mainPlasma)throw new Error('Assistant plasma/launcher missing from dashboard');
 const orb=page.locator('#tabAssistant');
 if(!await orb.isVisible())throw new Error('Center plasma launcher not visible');
 const box=await orb.boundingBox();
 if(!box)throw new Error('Center plasma has no hitbox');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();
 await page.waitForTimeout(760);
 const voiceStarts=await page.evaluate(()=>window.__dmVoiceStarts);
 await page.mouse.up();
 if(voiceStarts!==1)throw new Error('Mouse long press did not activate voice exactly once: '+voiceStarts);
 await open('world.html');
 if(!await page.locator('#tabAssistant, .dm-world-socket, .dm-shared-plasma').count())throw new Error('My World assistant launcher missing');
 if(!await page.locator('[data-world="memory"]').count())throw new Error('My World memory tab missing');
 await page.locator('[data-world="memory"]').first().click();
 if(!await page.locator('[data-world-view="memory"]').isVisible())throw new Error('Memory tab did not open');
 await page.evaluate(()=>localStorage.setItem('dm-smoke-sentinel','keep-user-data'));
 await page.reload({waitUntil:'domcontentloaded'});
 if(await page.evaluate(()=>localStorage.getItem('dm-smoke-sentinel'))!=='keep-user-data')throw new Error('User storage lost after reload');
 // Verify that IndexedDB survives a real page reload, without touching app stores.
 await page.evaluate(async()=>{
   await new Promise((resolve,reject)=>{
     const request=indexedDB.open('dm-ci-isolated-sentinel',1);
     request.onupgradeneeded=()=>request.result.createObjectStore('records');
     request.onerror=()=>reject(request.error);
     request.onsuccess=()=>{
       const db=request.result;
       const tx=db.transaction('records','readwrite');
       tx.objectStore('records').put('preserved','key');
       tx.oncomplete=()=>{db.close();resolve();};
       tx.onerror=()=>reject(tx.error);
     };
   });
 });
 await page.reload({waitUntil:'domcontentloaded'});
 const indexedDbValue=await page.evaluate(async()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('dm-ci-isolated-sentinel');
   request.onerror=()=>reject(request.error);
   request.onsuccess=()=>{
     const db=request.result;
     const tx=db.transaction('records','readonly');
     const get=tx.objectStore('records').get('key');
     get.onsuccess=()=>resolve(get.result);
     get.onerror=()=>reject(get.error);
     tx.oncomplete=()=>db.close();
   };
 }));
 if(indexedDbValue!=='preserved')throw new Error('IndexedDB test record did not persist after reload');
 await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:12000});
 await open('index.html?jump=clients');
 await page.waitForTimeout(700);
 if(!await page.locator('#dmSalesBody').count())throw new Error('Clients destination did not initialize');
 await open('index.html?jump=finance');
 await page.waitForTimeout(700);
 if(!await page.locator('#dmBusinessPicture').count())throw new Error('Finance destination did not initialize');
 if(errors.length)throw new Error('Uncaught page errors: '+errors.slice(0,8).join(' | '));
 console.log('PASS: main page, My World tabs, reload persistence, client and finance routes.');
}finally{await browser.close();}
