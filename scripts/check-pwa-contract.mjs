// Static PWA smoke checks. Browser interactions require a separate manual pass.
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const app=read('app/app.js');
const dock=read('app/world-modern-dock.js');
const world=read('app/world.html');
const index=read('app/index.html');
const updater=read('app/pwa-updates.js');
const sw=read('app/sw.js');
function assert(test,message){if(!test)throw new Error(message);}
for(const route of ['clients','finance','documents','management']){
  assert(dock.includes('jump='+route),`Missing My World navigation target: ${route}`);
  assert(app.includes("jump==='"+route+"'")|| (route==='management'&&app.includes("['assistant','management'].includes(jump)")),`Unresolved app route: ${route}`);
}
for(const html of [index,world]){
  assert(html.includes('./pwa-updates.js?v=1'),'Shared PWA updater not attached');
  assert(html.includes('name="dm-app-build"'),'Missing build marker');
}
assert(!/localStorage\.clear\(|indexedDB\.deleteDatabase\(/.test(updater),'Updater must not erase user records');
assert(!/localStorage\.clear\(|indexedDB\.deleteDatabase\(/.test(sw),'Worker must not erase user records');
assert(sw.includes("request.destination==='document'"),'Expected document refresh handling');
console.log('OK: navigation contract, shared updater, and non-destructive storage checks.');
