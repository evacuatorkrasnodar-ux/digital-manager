// Safeguard shared visual foundations across the four core PWA pages.
// Run: node scripts/check-style-unity.mjs
import {readFileSync,existsSync} from 'node:fs';
const pages=['app/index.html','app/world.html','app/myday.html','app/care.html'];
const foundations=['dock.css','unified-quiet-glass.css','quick-actions-velvet.css','black-velvet-premium.css','card-outline-theme.css','shared-plasma.css','app-design-system.css','personal-home-tone.css','top-tabs-position.css'];
const refs=new Map();
const required=['dock.css','black-velvet-premium.css','unified-quiet-glass.css','card-outline-theme.css','shared-plasma.css','app-design-system.css'];
for(const page of pages){
 const html=readFileSync(page,'utf8');
 const links=[...html.matchAll(/<link\b[^>]*href=["']\.\/([^"'?]+\.css)(\?[^"']*)?["']/g)];
 const seen=new Set();
 for(const m of links){
  const file=m[1],revision=m[2]||'';
  if(seen.has(file))throw new Error(`${page}: duplicate CSS ${file}`);
  seen.add(file);
  if(!existsSync('app/'+file))throw new Error(`${page}: missing ${file}`);
  if(!foundations.includes(file))continue;
  if(!refs.has(file))refs.set(file,{revision,page});
  else if(refs.get(file).revision!==revision)throw new Error(`${file}: ${page} uses ${revision}, but ${refs.get(file).page} uses ${refs.get(file).revision}`);
 }
 for(const file of required)if(!seen.has(file))throw new Error(`${page}: missing shared visual foundation ${file}`);
}
console.log('OK: no missing/duplicate CSS; core Black Velvet foundations use consistent revisions.');
