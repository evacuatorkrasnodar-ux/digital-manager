// Run with: node scripts/check-app-assets.mjs
// Verifies that the two PWA entry points use matching revisions of shared assets.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const entries=['app/index.html','app/world.html'];
const assetPattern=/<(?:link|script)\b[^>]*(?:href|src)=["'](\.\/[^"']+\.(?:css|js)(?:\?[^"']*)?)["'][^>]*>/g;
const sources=entries.map(file=>{
  const html=readFileSync(file,'utf8');
  const assets=new Map();
  for(const match of html.matchAll(assetPattern)){
    const [path,revision='']=match[1].split('?');
    if(assets.has(path))throw new Error(`${file}: duplicate asset ${path}`);
    assets.set(path,revision);
  }
  return assets;
});
let shared=0;
for(const [path,revision] of sources[0]){
  if(!sources[1].has(path))continue;
  shared++;
  if(revision!==sources[1].get(path)){
    throw new Error(`Shared asset version mismatch: ${path}: ${entries[0]} (${revision}), ${entries[1]} (${sources[1].get(path)})`);
  }
}
console.log(`OK: ${shared} shared assets have matching versions; no duplicate imports in either page.`);

const htmlSources=entries.map(file=>readFileSync(file,'utf8'));
for(let i=0;i<entries.length;i++){
  const file=entries[i],html=htmlSources[i],assets=sources[i];
  const build=html.match(/<meta\s+name="dm-app-build"\s+content="([^"]+)"/);
  if(!build)throw new Error(`${file}: missing build version meta`);
  if(!assets.has('./pwa-updates.js'))throw new Error(`${file}: shared PWA update controller not loaded`);
  if(/navigator\.serviceWorker\.register\(/.test(html))throw new Error(`${file}: inline duplicate Service Worker registration`);
  for(const asset of assets.keys()){
    if(!existsSync(join('app',asset.slice(2))))throw new Error(`${file}: missing local asset ${asset}`);
  }
}
if(htmlSources[0].match(/<meta\s+name="dm-app-build"\s+content="([^"]+)"/)[1]!==htmlSources[1].match(/<meta\s+name="dm-app-build"\s+content="([^"]+)"/)[1])throw new Error('Business and personal builds must match');
for(const file of ['app/pwa-updates.js','app/sw.js']){
  const js=readFileSync(file,'utf8');
  if(/localStorage\.clear\(|indexedDB\.deleteDatabase\(|caches\.delete\(\s*['"]?(?!digital-manager)/.test(js))throw new Error(`${file}: suspicious data/cache deletion requires review`);
}
console.log('OK: both entry pages share one update controller, consistent build labels and existing assets.');
