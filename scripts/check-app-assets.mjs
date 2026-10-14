// Run with: node scripts/check-app-assets.mjs
// Verifies that the two PWA entry points use matching revisions of shared assets.
import { readFileSync } from 'node:fs';
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
