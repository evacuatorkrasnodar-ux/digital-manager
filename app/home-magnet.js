/* Black Velvet / Magnetic Geometry — opt-in Home constructor only.
   SVG objectBoundingBox clips + matching vector contours. Existing approved Home
   clips and the Clients/Gold composition are never changed.
*/
(() => {
  'use strict';
  const board=document.getElementById('dmLayoutBoard');
  const svgRoot=document.querySelector('svg.icon-defs');
  if(!board||!svgRoot)return;
  const NS='http://www.w3.org/2000/svg';
  const protectedShapes=new Set(['signature','clients','advice']);
  const signatures={
    revenue:{tl:21,tr:16,br:28,bl:10,top:3,bottom:1},
    orders:{tl:11,tr:27,br:12,bl:24,top:0,bottom:3},
    profit:{tl:28,tr:12,br:31,bl:12,top:2,bottom:0},
    day:{tl:10,tr:22,br:10,bl:29,top:3,bottom:2},
    steps:{tl:19,tr:9,br:29,bl:13,top:2,bottom:1},
    breathe:{tl:31,tr:25,br:14,bl:12,top:1,bottom:3},
    calendar:{tl:13,tr:29,br:22,bl:34,top:0,bottom:2}
  };
  const def=document.createElementNS(NS,'defs');
  def.id='dmMagneticClipDefs';
  svgRoot.append(def);
  let queued=false;
  let lastMap='';
  const clips=new Map();
  const shapeMap=new Map();

  function ensureClip(id){
    let clip=clips.get(id);
    if(clip)return clip;
    clip=document.createElementNS(NS,'clipPath');
    clip.id='dmMagneticClip-'+id;
    clip.setAttribute('clipPathUnits','objectBoundingBox');
    const path=document.createElementNS(NS,'path');
    clip.append(path);
    def.append(clip);
    clips.set(id,clip);
    return clip;
  }
  const length=n=>Number(n.toFixed(2));
  // Match the SVG objectBoundingBox coordinate model already used by the
  // approved Clients/Gold clips. This is more portable on iOS than a scaled path.
  function clipCoordinates(d,w,h){
    return d.replace(/([MLQCZ])([^MLQCZ]*)/g,(_,command,values)=>{
      if(command==='Z')return 'Z';
      const numbers=values.trim().split(/\s+/).map(Number);
      return command+numbers.map((number,i)=>(number/(i%2?h:w)).toFixed(6)).join(' ');
    });
  }
  function sculpt(id,w,h,contact){
    const s=signatures[id]||signatures.day;
    const scale=Math.min(1,w/165,h/130);
    const r=n=>Math.max(7,length(n*scale));
    const tl=r(s.tl),tr=r(s.tr),br=r(s.br),bl=r(s.bl);
    const depth=Math.min(12,length(Math.min(w,h)*.09));
    const half=Math.min(19,length(h*.135));
    const sideY=Math.max(35,Math.min(h-35,h*.52));
    const topX=w*.52,topHalf=Math.min(29,w*.15);
    const bottomX=w*.50,bottomHalf=Math.min(29,w*.16);
    const fmt=arr=>arr.map(length).join(' ');
    const out=[];
    const M=(x,y)=>out.push('M'+fmt([x,y]));
    const L=(x,y)=>out.push('L'+fmt([x,y]));
    const Q=(x,y,tx,ty)=>out.push('Q'+fmt([x,y,tx,ty]));
    const C=(x1,y1,x2,y2,x,y)=>out.push('C'+fmt([x1,y1,x2,y2,x,y]));
    M(tl,0);
    // Each card's upper silhouette differs even before magnetic docking.
    if(contact.top){
      L(topX-topHalf,0);
      C(topX-topHalf*.60,0,topX-topHalf*.65,depth,topX,depth);
      C(topX+topHalf*.65,depth,topX+topHalf*.60,0,topX+topHalf,0);
    }else if(s.top===1){
      L(w*.32,0);C(w*.47,3,w*.52,4,w*.65,0);
    }else if(s.top===2){
      L(w*.27,0);C(w*.42,0,w*.46,5,w*.59,5);C(w*.7,5,w*.73,0,w*.78,0);
    }else if(s.top===3){
      L(w*.32,0);C(w*.43,0,w*.48,7,w*.55,7);C(w*.64,7,w*.7,0,w*.76,0);
    }
    L(w-tr,0);Q(w,0,w,tr);
    if(contact.right){
      L(w,sideY-half);
      C(w,sideY-half*.64,w-depth,sideY-half*.58,w-depth,sideY);
      C(w-depth,sideY+half*.58,w,sideY+half*.64,w,sideY+half);
    }else{
      L(w,sideY-half);
      // One smooth outward shoulder, rather than a straight box edge.
      C(w-2,sideY-half*.40,w-2,sideY+half*.45,w,sideY+half);
    }
    L(w,h-br);Q(w,h,w-br,h);
    if(contact.bottom){
      L(bottomX+bottomHalf,h);
      C(bottomX+bottomHalf*.6,h,bottomX+bottomHalf*.6,h-depth,bottomX,h-depth);
      C(bottomX-bottomHalf*.6,h-depth,bottomX-bottomHalf*.6,h,bottomX-bottomHalf,h);
    }else if(s.bottom===1){
      L(w*.68,h);C(w*.57,h,w*.5,h-5,w*.42,h-5);C(w*.35,h-5,w*.32,h,w*.25,h);
    }else if(s.bottom===2){
      L(w*.70,h);C(w*.58,h,w*.53,h-7,w*.48,h-7);C(w*.42,h-7,w*.37,h,w*.29,h);
    }else if(s.bottom===3){
      L(w*.70,h);C(w*.64,h-5,w*.58,h-6,w*.51,h-4);C(w*.43,h-2,w*.35,h,w*.27,h);
    }
    L(bl,h);Q(0,h,0,h-bl);
    if(contact.left){
      L(0,sideY+half);
      // Complementary convex shoulder across from the neighbour's concave cove.
      C(0,sideY+half*.63,3,sideY+half*.55,3,sideY);
      C(3,sideY-half*.55,0,sideY-half*.63,0,sideY-half);
    }else{
      L(0,sideY+half);
      C(3,sideY+half*.4,3,sideY-half*.40,0,sideY-half);
    }
    L(0,tl);Q(0,0,tl,0);out.push('Z');
    return out.join(' ');
  }
  function clearOutline(tile){
    const content=tile.querySelector(':scope > .dm-layout-content');
    if(content){
      content.classList.remove('dm-morph-active');
      content.style.removeProperty('clip-path');
      content.style.removeProperty('-webkit-clip-path');
      content.style.removeProperty('--dm-morph-fill');
    }
    tile.classList.remove('dm-has-magnet','dm-magnetic-signature');
    tile.removeAttribute('data-dm-docked');
    tile.querySelector(':scope > .dm-morph-outline')?.remove();
  }
  function bounds(el){return el.getBoundingClientRect();}
  function neighbours(units){
    const contacts=new Map(units.map(tile=>[tile.dataset.cardId,{top:false,right:false,bottom:false,left:false}]));
    const linked=[];
    const seen=new Set();
    const limit=17;
    for(let i=0;i<units.length;i++){
      for(let j=i+1;j<units.length;j++){
        const a=units[i],b=units[j],ra=bounds(a),rb=bounds(b);
        const va=Math.max(0,Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top));
        const ha=Math.max(0,Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left));
        const hSpace=rb.left-ra.right,vSpace=rb.top-ra.bottom;
        const bBefore=ra.left-rb.right,aAbove=rb.top-ra.bottom,bAbove=ra.top-rb.bottom;
        const sideOverlap=Math.min(ra.height,rb.height)*.42;
        const topOverlap=Math.min(ra.width,rb.width)*.42;
        let edgeA,edgeB;
        if(va>=sideOverlap && hSpace>=-3 && hSpace<=limit){edgeA='right';edgeB='left';}
        else if(va>=sideOverlap && bBefore>=-3 && bBefore<=limit){edgeA='left';edgeB='right';}
        else if(ha>=topOverlap && aAbove>=-3 && aAbove<=limit){edgeA='bottom';edgeB='top';}
        else if(ha>=topOverlap && bAbove>=-3 && bAbove<=limit){edgeA='top';edgeB='bottom';}
        if(!edgeA)continue;
        const idA=a.dataset.cardId,idB=b.dataset.cardId,unique=[idA,idB].sort().join('~');
        if(seen.has(unique))continue;
        seen.add(unique);
        contacts.get(idA)[edgeA]=true;
        contacts.get(idB)[edgeB]=true;
        linked.push({a:idA,b:idB,edgeA,edgeB});
      }
    }
    return {contacts,linked};
  }
  function apply(tile,contact){
    const id=tile.dataset.cardId;
    const content=tile.querySelector(':scope > .dm-layout-content');
    if(!content)return;
    clearOutline(tile);
    const touching=Object.keys(contact).filter(k=>contact[k]);
    if(touching.length){
      tile.classList.add('dm-has-magnet');
      tile.dataset.dmDocked=touching.join(' ');
    }
    if(protectedShapes.has(id)){
      // The hand-tuned Clients silhouette, its external SVG outline and the
      // golden Recommendation outline stay exactly as previously approved.
      if(id==='signature')tile.classList.add('dm-magnetic-signature');
      return;
    }
    const box=content.getBoundingClientRect();
    if(box.width<60||box.height<70)return;
    const w=box.width,h=box.height;
    const d=sculpt(id,w,h,contact);
    const clip=ensureClip(id);
    const path=clip.firstElementChild;
    path.setAttribute('d',clipCoordinates(d,w,h));
    path.removeAttribute('transform');
    const url='url(#'+clip.id+')';
    content.classList.add('dm-morph-active');
    content.style.setProperty('clip-path',url);
    content.style.setProperty('-webkit-clip-path',url);
    const outline=document.createElementNS(NS,'svg');
    outline.classList.add('dm-morph-outline');
    outline.setAttribute('viewBox','0 0 '+length(w)+' '+length(h));
    outline.setAttribute('preserveAspectRatio','none');
    outline.setAttribute('aria-hidden','true');
    outline.style.top=length(content.offsetTop)+'px';
    outline.style.height=length(h)+'px';
    const line=document.createElementNS(NS,'path');
    line.setAttribute('d',d);
    outline.append(line);
    tile.append(outline);
  }
  function refresh(){
    queued=false;
    if(board.hidden||!document.documentElement.classList.contains('dm-custom-home-layout'))return;
    const units=[...board.querySelectorAll(':scope > .dm-layout-unit')];
    if(!units.length)return;
    const {contacts,linked}=neighbours(units);
    const signature=units.map(t=>t.dataset.cardId+':'+Math.round(t.getBoundingClientRect().width)+'x'+Math.round(t.getBoundingClientRect().height)).join('|');
    const relation=linked.map(v=>v.a+'-'+v.b+'-'+v.edgeA).sort().join('|');
    const nextMap=signature+' / '+relation;
    if(nextMap===lastMap&&units.every(t=>protectedShapes.has(t.dataset.cardId)||t.querySelector(':scope > .dm-morph-outline')))return;
    lastMap=nextMap;
    for(const unit of units)apply(unit,contacts.get(unit.dataset.cardId)||{});
    board.dataset.dmMagnetCount=String(linked.length);
    board.classList.toggle('dm-magnets-present',linked.length>0);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh);}
  window.addEventListener('dm:layout-rendered',()=>{
    lastMap='';
    schedule();
  });
  window.addEventListener('dm:layout-reset',()=>{
    lastMap='';board.classList.remove('dm-magnets-present');board.removeAttribute('data-dm-magnet-count');
  });
  window.addEventListener('resize',schedule,{passive:true});
  const ro=('ResizeObserver' in window)?new ResizeObserver(schedule):null;
  ro?.observe(board);
  // Detect the constructor already in use when this separate module loads.
  schedule();
})();