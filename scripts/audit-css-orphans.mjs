// Report possible unreferenced legacy CSS. Conservative: a candidate is NOT auto-deleted.
// Usage: node scripts/audit-css-orphans.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const root=process.cwd();
const skip=new Set(['.git','.github','node_modules','dist','coverage','.cache']);
const readExt=new Set(['.html','.js','.mjs','.css','.json','.md','.txt','.xml','.webmanifest','.yml','.yaml','.svg']);
function walk(dir,out=[]){
  for(const e of readdirSync(dir,{withFileTypes:true})){
    if(skip.has(e.name)||e.name.startsWith('.DS_Store'))continue;
    const full=join(dir,e.name);
    if(e.isDirectory())walk(full,out);
    else if(e.isFile())out.push(full);
  }
  return out;
}
const all=walk(root),css=all.filter(p=>p.endsWith('.css')&&relative(root,p).startsWith('app/'));
const texts=all.filter(p=>readExt.has(p.slice(p.lastIndexOf('.')))&&!p.endsWith('audit-css-orphans.mjs')).map(p=>({path:relative(root,p),body:readFileSync(p,'utf8')}));
const unused=[];
for(const file of css){
  const path=relative(root,file).replaceAll('\\','/');
  const name=path.split('/').pop();
  // Both complete path and basename are checked; JS sometimes assembles URLs with a prefix.
  const references=texts.filter(t=>t.path!==path&&(t.body.includes(name)||t.body.includes(path)));
  if(!references.length)unused.push(path);
}
console.log(`CSS AUDIT: ${css.length} app CSS files, ${unused.length} without literal references elsewhere.`);
for(const p of unused)console.log('POSSIBLE_ORPHAN '+p);
console.log('Review dynamic loading and Git history before deletion. No files changed by this audit.');
