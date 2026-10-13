/* Personalized Home layout v4 — intelligent business/day/health sections.
 * Preserve the approved four-card sculpture, Quick Actions and original contours. */
(() => {
  'use strict';
  const dashboard=document.querySelector('#homeScreen .dashboard');
  const originalGrid=document.querySelector('#homeScreen .dashboard>.metric-grid');
  const widgetHost=document.getElementById('dmHomeWidgets');
  const managementCards='digital-manager-black-velvet-v2';
  // New layout profile resets the earlier constructor experiment to the
  // approved Home composition on all devices. The old profile remains stored,
  // but is no longer applied. Other settings, widget switches and data stay.
  const KEY='dm-personal-home-layout-v2';
  if(!dashboard||!originalGrid||!widgetHost)return;

  const parts={
    revenue:dashboard.querySelector('.revenue-card'),
    shortcuts:dashboard.querySelector('.shortcuts'),
    inbox:document.getElementById('dmWorkspaceInboxCard'),
    briefing:document.getElementById('dmWorkspaceBriefCard'),
    tax:document.getElementById('dmTaxCard'),
    clients:document.getElementById('clientsCard'),
    clientEdge:originalGrid.querySelector('.bv-clients-edge'),
    orders:document.getElementById('ordersCard'),
    profit:originalGrid.querySelector('.profit-card'),
    advice:originalGrid.querySelector('.recommendation-card'),
    day:document.getElementById('dmWidgetDay'),
    steps:document.getElementById('dmWidgetSteps'),
    breathe:document.getElementById('dmWidgetBreath'),
    calendar:document.getElementById('dmWidgetCalendar')
  };
  if(Object.values(parts).some(x=>!x))return;
  // Match the untouched Home: revenue, optional personal widgets, the
  // four-card business sculpture, and finally the Quick Actions block.
  const defaultOrder=['revenue','day','steps','breathe','calendar','business','quick','inbox','briefing','tax'];
  const names={revenue:'Выручка',business:'Бизнес · 4 карточки',quick:'Отделы управляющего',
    inbox:'Входящие',briefing:'Штаб директора',tax:'Налоговый контроль',
    day:'Мой день',steps:'Шаги',breathe:'Дыхание',calendar:'Календарь'};
  const available={day:'dayWidget',steps:'healthSteps',breathe:'breathing',calendar:'calendarWidget',inbox:'inboxWidget',briefing:'briefingWidget',tax:'taxWidget'};
  const fixedWide=new Set(['revenue','business','quick','calendar']);
  const fixedBlocks=new Set(['business','quick']);
  const legacyBusiness=new Set(['business','signature','clients','advice','orders','profit']);
  // Categories belong to the card's purpose, not its position. Widgets never
  // float into a wrong section, while complete sections may be reordered.
  const sections={
    business:{title:'Картина бизнеса',subtitle:'Главное о компании',ids:['revenue','business']},
    departments:{title:'Отделы управляющего',subtitle:'Стратегия · клиенты · финансы · процессы',ids:['quick']},
    director:{title:'Инструменты управляющего',subtitle:'Связь · планёрки · контроль',ids:['inbox','briefing','tax']},
    day:{title:'Мой день',subtitle:'Личные задачи и планы',ids:['day','calendar']},
    health:{title:'Моё здоровье',subtitle:'Забота о себе',ids:['steps','breathe']}
  };
  const defaultSections=Object.keys(sections);
  const sectionFor=id=>defaultSections.find(s=>sections[s].ids.includes(id));
  const defaultLabels=new Map();
  function sectionLabel(id,inEditor=false){
    const el=document.createElement('div');
    el.className='dm-home-section-title';
    el.dataset.homeSection=id;
    el.setAttribute('role','heading');
    el.setAttribute('aria-level','2');
    const words=document.createElement('span');words.className='dm-home-section-words';
    const title=document.createElement('strong');title.textContent=sections[id].title;
    const sub=document.createElement('small');sub.textContent=sections[id].subtitle;
    words.append(title,sub);el.append(words);
    if(inEditor){
      el.tabIndex=0;
      el.setAttribute('aria-label','Удерживайте, чтобы переместить раздел «'+sections[id].title+'»');
    }
    return el;
  }
  const visibleSectionIds=()=>preferences.sectionOrder.filter(s=>sections[s].ids.some(id=>!isHidden(id)));
  function normalizeSections(items){
    const chosen=Array.isArray(items)?items.map(s=>s==='communication'||s==='control'?'director':s).filter(s=>defaultSections.includes(s)):[];
    return [...new Set([...chosen,...defaultSections])];
  }
  function sectionShift(sectionId,by){
    const visible=visibleSectionIds();
    const from=visible.indexOf(sectionId),target=visible[from+by];
    if(from<0||!target)return;
    moveSection(sectionId,target,by>0);
  }
  function moveSection(source,target,after=false){
    if(source===target||!defaultSections.includes(source)||!defaultSections.includes(target))return;
    const rest=preferences.sectionOrder.filter(s=>s!==source);
    const at=rest.indexOf(target);
    rest.splice(at+(after?1:0),0,source);
    preferences.sectionOrder=normalizeSections(rest);
    pickedId=null;
    save();render();
  }
  function syncDefaultSectionLabels(){
    if(preferences.enabled)return;
    const directorIds=sections.director.ids;
    const hasDirector=directorIds.some(id=>!isHidden(id));
    const hasDay=sections.day.ids.some(id=>!isHidden(id));
    const hasHealth=sections.health.ids.some(id=>!isHidden(id));
    directorShelf.hidden=!hasDirector;
    for(const id of directorIds)parts[id].hidden=isHidden(id);
    if(hasDirector){
      if(!defaultLabels.get('director').isConnected)dashboard.insertBefore(defaultLabels.get('director'),directorShelf);
      defaultLabels.get('director').hidden=false;
    }else defaultLabels.get('director').remove();
    // Personal widgets use their existing grid; labels span its two columns.
    if(hasDay){
      if(!defaultLabels.get('day').isConnected)widgetHost.prepend(defaultLabels.get('day'));
      for(const id of sections.day.ids)widgetHost.append(parts[id]);
    }else defaultLabels.get('day').remove();
    if(hasHealth){
      widgetHost.append(defaultLabels.get('health'));
      for(const id of sections.health.ids)widgetHost.append(parts[id]);
    }else defaultLabels.get('health').remove();
  }

  const board=document.createElement('section');
  board.className='dm-layout-board';
  board.id='dmLayoutBoard';
  board.hidden=true;
  board.setAttribute('aria-label','Настраиваемые карточки главной');
  dashboard.insertBefore(board,dashboard.querySelector('.shortcuts'));
  // Restore chips only appear after an optional widget is hidden; no editor bar.
  const library=document.createElement('div');
  library.id='dmLayoutLibrary';
  library.className='dm-layout-library';
  library.setAttribute('aria-label','Вернуть скрытые карточки');
  // All optional director tools share one compact two-column shelf in default
  // mode. Business and Quick Actions remain separate, untouched DOM blocks.
  const directorShelf=document.createElement('div');
  directorShelf.className='dm-director-shelf';directorShelf.id='dmDirectorShelf';
  directorShelf.hidden=true;
  dashboard.insertBefore(directorShelf,board);
  function defaults(){return {enabled:false,order:defaultOrder.slice(),sectionOrder:defaultSections.slice(),sizes:{},hidden:[]};}
  function load(){
    let saved;
    try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(_){saved={};}
    if(!saved||typeof saved!=='object')saved={};
    const o={...defaults(),...saved};
    o.sizes=(o.sizes&&typeof o.sizes==='object'&&!Array.isArray(o.sizes))?o.sizes:{};
    o.hidden=Array.isArray(o.hidden)?o.hidden.filter(x=>typeof x==='string'&&!legacyBusiness.has(x)):[];
    o.order=normalize(o.order);
    o.sectionOrder=normalizeSections(o.sectionOrder);
    return o;
  }
  function normalize(items){
    // Preserve the user's optional widget order while collapsing all former
    // individual business cards into one permanent four-card block.
    const listed=Array.isArray(items)?items:defaultOrder;
    const collapsed=listed.map(id=>legacyBusiness.has(id)?'business':id);
    return [...new Set([...collapsed,...defaultOrder])].filter(id=>defaultOrder.includes(id));
  }
  let preferences=load(),editing=false,pickedId=null,skipTileTapUntil=0;
  let startedFromOriginal=false,madeLayoutChange=false;
  function save(){
    // A real card change promotes the preview into a saved custom layout.
    if(editing)madeLayoutChange=true;
    preferences.order=normalize(preferences.order);
    preferences.sectionOrder=normalizeSections(preferences.sectionOrder);
    try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch(_){}
  }
  function visibleByManagement(id){
    if(!available[id])return true;
    let cards={};
    try{cards=JSON.parse(localStorage.getItem(managementCards)||'{}')?.management?.cards||{};}catch(_){}
    const flag=available[id];
    return ['day','steps','breathe','calendar','inbox','briefing','tax'].includes(id)?cards[flag]===true:cards[flag]!==false;
  }
  function isHidden(id){
    if(fixedBlocks.has(id))return false;
    return preferences.hidden.includes(id)||!visibleByManagement(id);
  }
  function node(name,html){
    const b=document.createElement('button');b.type='button';b.className='dm-layout-control';b.dataset.dmUnitAction=name;b.innerHTML=html;return b;
  }
  function unitControls(id){
    // The main business sculpture, manager departments and revenue cannot be
    // hidden or resized; optional cards alone receive two quiet circle controls.
    if(fixedBlocks.has(id)||id==='revenue')return null;
    const controls=document.createElement('div');
    controls.className='dm-unit-controls';
    if(!fixedWide.has(id)){
      const size=node('size','↔');
      size.classList.add('dm-layout-circle');
      size.setAttribute('aria-label','Изменить ширину: '+names[id]);
      size.title='Изменить ширину';controls.append(size);
    }
    const remove=node('hide','×');
    remove.classList.add('dm-layout-circle');
    remove.setAttribute('aria-label','Убрать дополнительную карточку «'+names[id]+'»');
    remove.title='Скрыть карточку';controls.append(remove);
    return controls;
  }
  function makeUnit(id){
    const outer=document.createElement('div');
    outer.className='dm-layout-unit';outer.dataset.cardId=id;
    const size=fixedWide.has(id)?'wide':preferences.sizes[id]==='wide'?'wide':'compact';
    outer.dataset.size=size;
    if(editing){
      const controls=unitControls(id);
      if(controls)outer.append(controls);
      outer.tabIndex=0;
      outer.setAttribute('role','group');
      outer.setAttribute('aria-label',names[id]+' — удерживайте и перетащите; Alt+стрелки для клавиатуры');
    }
    const content=document.createElement('div');content.className='dm-layout-content';outer.append(content);
    if(id==='business'){
      // Move the actual five-element grid (four cards + Clients outline).
      // It retains every approved CSS column, height, SVG clip and border.
      originalGrid.hidden=false;
      content.append(originalGrid);
    }else{
      const map={revenue:parts.revenue,quick:parts.shortcuts,inbox:parts.inbox,briefing:parts.briefing,tax:parts.tax,
        day:parts.day,steps:parts.steps,breathe:parts.breathe,calendar:parts.calendar};
      if(map[id]){map[id].hidden=false;content.append(map[id]);}
    }
    return outer;
  }
  function holdCards(){
    const detached=document.createDocumentFragment();
    detached.append(parts.revenue,originalGrid,parts.shortcuts,parts.inbox,parts.tax,parts.briefing,
      parts.day,parts.steps,parts.breathe,parts.calendar);
    return detached;
  }
  function restoreOriginal(){
    // Approved original card geometry stays untouched: only DOM placement and
    // small separate section headings are used to organize the Home.
    widgetHost.replaceChildren(parts.day,parts.calendar,parts.steps,parts.breathe);
    directorShelf.replaceChildren(parts.inbox,parts.briefing,parts.tax);
    dashboard.insertBefore(parts.revenue,board);
    dashboard.insertBefore(originalGrid,board);
    dashboard.insertBefore(parts.shortcuts,board);
    dashboard.insertBefore(directorShelf,board);
    dashboard.insertBefore(widgetHost,board);
    for(const [id,element] of defaultLabels){
      if(id==='business')dashboard.insertBefore(element,parts.revenue);
      if(id==='departments')dashboard.insertBefore(element,parts.shortcuts);
      if(id==='director'&&!directorShelf.hidden)dashboard.insertBefore(element,directorShelf);
    }
    originalGrid.hidden=false;
    // Existing widget module owns its own visibility and data refresh.
    window.dispatchEvent(new Event('dm:cards-changed'));
    board.replaceChildren();
    board.hidden=true;pickedId=null;
    document.documentElement.classList.remove('dm-custom-home-layout','dm-layout-editing');
    syncDefaultSectionLabels();
    window.dispatchEvent(new Event('dm:layout-reset'));
  }
  function renderLibrary(){
    library.replaceChildren();
    if(!editing){library.hidden=true;return;}
    const hidden=defaultOrder.filter(id=>!fixedBlocks.has(id)&&preferences.hidden.includes(id));
    for(const id of hidden){
      const b=document.createElement('button');
      b.type='button';b.dataset.dmRestoreId=id;
      b.textContent='+ '+names[id];b.title='Вернуть на главную';
      library.append(b);
    }
    library.hidden=hidden.length===0;
    if(!library.hidden)board.append(library);
  }
  function render(){
    if(!preferences.enabled){restoreOriginal();return;}
    // Keep the user's vertical position while the DOM cards are rearranged.
    // Otherwise Safari scroll anchoring can jump to the top during a move.
    const previousScrollY=window.scrollY;
    // Move existing cards: never clone their event handlers or generate mock data.
    holdCards();
    directorShelf.hidden=true;
    // Default-mode headings must never duplicate the grouped editor headings.
    for(const label of defaultLabels.values())label.remove();
    board.replaceChildren();
    preferences.order=normalize(preferences.order);
    preferences.sectionOrder=normalizeSections(preferences.sectionOrder);
    const editorSections=[];
    for(const sectionId of preferences.sectionOrder){
      const ids=preferences.order.filter(id=>sectionFor(id)===sectionId&&!isHidden(id));
      // Empty groups have no heading or wasted vertical space.
      if(!ids.length)continue;
      editorSections.push(sectionId);
      board.append(sectionLabel(sectionId,editing));
      for(const id of ids){
        // A card may have been hidden on the default Home before switching
        // into the editor; clear native hidden when it is enabled here.
        if(['inbox','briefing','tax'].includes(id))parts[id].hidden=false;
        board.append(makeUnit(id));
      }
    }
    board.hidden=false;
    // Original metric-grid is now inside its unified movable wrapper.
    widgetHost.hidden=true;
    document.documentElement.classList.add('dm-custom-home-layout');
    document.documentElement.classList.toggle('dm-layout-editing',editing);
    renderLibrary();
    // Notify any other dashboard listeners without changing the card contours.
    window.dispatchEvent(new CustomEvent('dm:layout-rendered',{detail:{businessGrouped:true,editing}}));
    // Keep the lower cards in view after a resize, reorder or change of size.
    requestAnimationFrame(()=>{
      if(editing)window.scrollTo({top:previousScrollY,behavior:'instant'});
      window.dispatchEvent(new Event('resize'));
    });
  }
  function edit(source='settings'){
    if(editing)return;
    pickedId=null;
    startedFromOriginal=!preferences.enabled;
    madeLayoutChange=false;
    preferences.enabled=true;editing=true;
    // Preview only: entering edit mode is not itself a layout change.
    render();
    // No "Done" button or jump to top. Each change saves immediately.
    // The user exits by tapping the free background or pressing Escape.
  }
  function done(){
    pickedId=null;
    const noChangesToOriginal=startedFromOriginal&&!madeLayoutChange;
    startedFromOriginal=false;
    editing=false;
    if(noChangesToOriginal){
      preferences=defaults();
      restoreOriginal();
      return;
    }
    save();render();
  }
  function reset(){
    pickedId=null;
    startedFromOriginal=false;
    madeLayoutChange=false;
    preferences=defaults();editing=false;
    try{localStorage.removeItem(KEY);}catch(_){}
    restoreOriginal();
  }
  function shift(id,by){
    pickedId=null;
    const sectionId=sectionFor(id);
    const visible=preferences.order.filter(x=>sectionFor(x)===sectionId&&!isHidden(x));
    const index=visible.indexOf(id),target=visible[index+by];
    if(index<0)return;
    if(!target){sectionShift(sectionId,by);return;}
    const arr=preferences.order.filter(x=>x!==id);
    const targetIndex=arr.indexOf(target);
    arr.splice(by>0?targetIndex+1:targetIndex,0,id);
    preferences.order=normalize(arr);
    save();render();
  }
  function resize(id){
    pickedId=null;
    if(fixedWide.has(id))return;
    preferences.sizes[id]=preferences.sizes[id]==='wide'?'compact':'wide';
    save();render();
  }
  function hide(id){
    pickedId=null;
    if(fixedBlocks.has(id))return;
    if(!preferences.hidden.includes(id))preferences.hidden.push(id);
    save();render();
  }
  function restore(id){
    pickedId=null;
    preferences.hidden=preferences.hidden.filter(x=>x!==id);
    save();render();
  }
  function moveTo(id,target){
    pickedId=null;
    if(!target||target===id)return;
    if(sectionFor(id)!==sectionFor(target)){
      const from=sectionFor(id),to=sectionFor(target);
      moveSection(from,to,preferences.sectionOrder.indexOf(from)<preferences.sectionOrder.indexOf(to));
      return;
    }
    const arr=preferences.order.filter(x=>x!==id);
    const at=arr.indexOf(target);
    if(at<0)return;
    arr.splice(at,0,id);
    preferences.order=normalize(arr);
    save();render();
  }
  // Mobile-native editing: a stationary long-press starts the drag. A normal
  // swipe is left to the browser to scroll; no giant grab bars or arrows.
  const homeScreen=document.getElementById('homeScreen');
  const HOLD_MS=560,TRAVEL_LIMIT=12;
  let pressed=null,dragging=null,edgeFrame=0,blockTapUntil=0;

  function targetInfo(el){
    if(!(el instanceof Element)||!dashboard.contains(el))return null;
    if(el.closest('.dm-unit-controls,.dm-layout-library,input,textarea,select,[contenteditable="true"],dialog'))return null;
    const group=el.closest('.dm-home-section-title[data-home-section]');
    if(group)return {kind:'section',id:group.dataset.homeSection};
    const unit=el.closest('.dm-layout-unit[data-card-id]');
    if(unit)return {kind:'card',id:unit.dataset.cardId};
    if(editing)return null;
    if(originalGrid.contains(el))return {kind:'card',id:'business'};
    if(parts.shortcuts.contains(el))return {kind:'card',id:'quick'};
    const map={revenue:parts.revenue,inbox:parts.inbox,briefing:parts.briefing,tax:parts.tax,
      day:parts.day,steps:parts.steps,breathe:parts.breathe,calendar:parts.calendar};
    for(const [id,node] of Object.entries(map)){
      if(node?.contains(el))return {kind:'card',id};
    }
    return null;
  }
  function clearPressed(){
    if(pressed){clearTimeout(pressed.timer);pressed=null;}
  }
  function clearDrag(){
    if(edgeFrame){cancelAnimationFrame(edgeFrame);edgeFrame=0;}
    dragging=null;
    board.querySelectorAll('.dm-unit-dragging,.dm-unit-drop-target,.dm-section-dragging,.dm-section-drop-target')
      .forEach(el=>el.classList.remove('dm-unit-dragging','dm-unit-drop-target','dm-section-dragging','dm-section-drop-target'));
  }
  function chooseDropTarget(x,y){
    if(!dragging)return;
    const selector=dragging.kind==='section'
      ?'.dm-home-section-title[data-home-section]':'.dm-layout-unit[data-card-id]';
    let closest=null,best=Infinity;
    for(const el of board.querySelectorAll(selector)){
      const id=dragging.kind==='section'?el.dataset.homeSection:el.dataset.cardId;
      if(id===dragging.id)continue;
      const rect=el.getBoundingClientRect();
      const px=Math.max(rect.left,Math.min(x,rect.right));
      const py=Math.max(rect.top,Math.min(y,rect.bottom));
      const distance=Math.hypot(px-x,py-y);
      if(distance<best){best=distance;closest=el;}
    }
    board.querySelectorAll('.dm-unit-drop-target,.dm-section-drop-target')
      .forEach(el=>el.classList.remove('dm-unit-drop-target','dm-section-drop-target'));
    if(closest)closest.classList.add(dragging.kind==='section'?'dm-section-drop-target':'dm-unit-drop-target');
    dragging.target=closest?(dragging.kind==='section'?closest.dataset.homeSection:closest.dataset.cardId):null;
    dragging.after=closest?y>closest.getBoundingClientRect().top+closest.getBoundingClientRect().height/2:false;
  }
  function edgeScroll(){
    edgeFrame=0;
    if(!dragging?.moved)return;
    const y=dragging.y,top=65,bottom=window.innerHeight-90;
    const speed=y<top?-Math.min(16,Math.max(3,(top-y)*.22)):
      y>bottom?Math.min(16,Math.max(3,(y-bottom)*.22)):0;
    if(speed){window.scrollBy(0,speed);chooseDropTarget(dragging.x,y);}
    edgeFrame=requestAnimationFrame(edgeScroll);
  }
  function activateHold(info,current){
    if(pressed!==current||document.hidden)return;
    clearPressed();
    if(!editing)edit('hold');
    if(!editing)return;
    pickedId=null;
    dragging={...info,pointerId:current.pointerId,pointerType:current.pointerType,
      x:current.x,y:current.y,startX:current.startX,startY:current.startY,
      touchId:current.touchId,active:true,moved:false,target:null,after:false};
    const selected=info.kind==='section'
      ?board.querySelector('[data-home-section="'+info.id+'"]')
      :board.querySelector('[data-card-id="'+info.id+'"]');
    selected?.classList.add(info.kind==='section'?'dm-section-dragging':'dm-unit-dragging');
    try{navigator.vibrate?.(13);}catch(_){}
    blockTapUntil=Date.now()+750;
    // Capture desktop mouse events. Touch movement is handled by nonpassive
    // touchmove below so iOS can prevent scrolling only AFTER long-press.
    if(current.pointerType!=='touch'){
      try{homeScreen.setPointerCapture(current.pointerId);}catch(_){}
    }
    // Edge scrolling starts only once the finger actually moves.
  }
  function updateDrag(x,y){
    if(!dragging)return;
    dragging.x=x;dragging.y=y;
    if(!dragging.moved){
      if(Math.hypot(x-dragging.startX,y-dragging.startY)<16)return;
      dragging.moved=true;
      if(!edgeFrame)edgeFrame=requestAnimationFrame(edgeScroll);
    }
    chooseDropTarget(x,y);
  }
  function releaseDrag(){
    if(!dragging)return;
    const {kind,id,target,after,moved}=dragging;
    clearDrag();
    blockTapUntil=Date.now()+450;
    if(!moved||!target||target===id)return;
    if(kind==='section')moveSection(id,target,after);
    else moveTo(id,target);
  }

  homeScreen.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.isPrimary===false)return;
    const info=targetInfo(e.target);
    if(!info)return;
    clearPressed();
    const current={pointerId:e.pointerId,pointerType:e.pointerType,
      x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,timer:0};
    pressed=current;
    current.timer=setTimeout(()=>activateHold(info,current),HOLD_MS);
  },{passive:true});
  homeScreen.addEventListener('pointermove',e=>{
    if(dragging&&e.pointerId===dragging.pointerId&&dragging.pointerType!=='touch'){
      updateDrag(e.clientX,e.clientY);
      if(e.cancelable)e.preventDefault();
      return;
    }
    if(pressed&&e.pointerId===pressed.pointerId){
      pressed.x=e.clientX;pressed.y=e.clientY;
      if(Math.hypot(e.clientX-pressed.startX,e.clientY-pressed.startY)>TRAVEL_LIMIT)clearPressed();
    }
  });
  homeScreen.addEventListener('touchmove',e=>{
    if(!dragging||dragging.pointerType!=='touch')return;
    const touch=[...e.changedTouches].find(t=>t.identifier===dragging.touchId)
      ||(e.touches.length===1?e.touches[0]:null);
    if(!touch)return;
    if(e.cancelable)e.preventDefault();
    updateDrag(touch.clientX,touch.clientY);
  },{passive:false});
  homeScreen.addEventListener('touchstart',e=>{
    if(e.touches.length>1){clearPressed();clearDrag();return;}
    // Touch identifiers remain stable if the browser re-targets after rendering.
    if(pressed&&pressed.pointerType==='touch'&&e.changedTouches[0])
      pressed.touchId=e.changedTouches[0].identifier;
  },{passive:true});
  homeScreen.addEventListener('touchcancel',e=>{
    clearPressed();if(dragging?.pointerType==='touch')clearDrag();
  },{passive:true});
  homeScreen.addEventListener('touchend',e=>{
    if(dragging?.pointerType!=='touch')return;
    const matched=[...e.changedTouches].some(t=>t.identifier===dragging.touchId);
    if(matched||e.touches.length===0)releaseDrag();
  },{passive:true});
  homeScreen.addEventListener('pointerup',e=>{
    if(pressed?.pointerId===e.pointerId)clearPressed();
    if(dragging?.pointerId===e.pointerId&&dragging.pointerType!=='touch')releaseDrag();
  });
  homeScreen.addEventListener('pointercancel',e=>{
    if(pressed?.pointerId===e.pointerId)clearPressed();
    if(dragging?.pointerId===e.pointerId&&dragging.pointerType!=='touch')clearDrag();
  });
  homeScreen.addEventListener('contextmenu',e=>{
    if((dragging||Date.now()<blockTapUntil)&&dashboard.contains(e.target))e.preventDefault();
  });
  homeScreen.addEventListener('scroll',()=>{
    if(!dragging)clearPressed();
  },{capture:true,passive:true});
  window.addEventListener('blur',()=>{clearPressed();clearDrag();if(editing)done();});
  // Ignore the click synthesized after a long press, without disabling the
  // normal click behavior of cards when not customizing.
  document.addEventListener('click',e=>{
    if(Date.now()>=blockTapUntil||!homeScreen.contains(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();blockTapUntil=0;
  },true);
  board.addEventListener('click',e=>{
    if(!editing)return;
    const restoreButton=e.target.closest('[data-dm-restore-id]');
    if(restoreButton){restore(restoreButton.dataset.dmRestoreId);return;}
    const control=e.target.closest('[data-dm-unit-action]');
    if(!control)return;
    const id=control.closest('[data-card-id]')?.dataset.cardId;
    if(!id)return;
    if(control.dataset.dmUnitAction==='size')resize(id);
    if(control.dataset.dmUnitAction==='hide')hide(id);
  });
  // Full keyboard accessibility: Alt+arrows moves focused cards/sections,
  // and Escape closes customization; direct touch does not require buttons.
  board.addEventListener('keydown',e=>{
    const unit=e.target.closest('.dm-layout-unit[data-card-id]');
    const group=e.target.closest('.dm-home-section-title[data-home-section]');
    if(!editing||!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    const by=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;
    e.preventDefault();
    if(unit)shift(unit.dataset.cardId,by);
    else if(group)sectionShift(group.dataset.homeSection,by);
  });
  document.addEventListener('keydown',e=>{
    if(editing&&e.key==='Escape'){e.preventDefault();done();}
  });
  homeScreen.addEventListener('click',e=>{
    if(!editing)return;
    if(e.target.closest('.dm-layout-unit,.dm-home-section-title,.dm-layout-library'))return;
    done();
  });
  window.addEventListener('dm:cards-changed',event=>{
    // A switch explicitly turned on in Management must also restore the card
    // from the custom-layout hidden library. The director remains in control.
    if(event?.detail?.enabled===true){
      const changed=Object.keys(available).find(id=>available[id]===event.detail.key);
      if(changed&&preferences.hidden.includes(changed)){
        preferences.hidden=preferences.hidden.filter(id=>id!==changed);save();
      }
    }
    if(preferences.enabled)render();else syncDefaultSectionLabels();
  });
  window.addEventListener('storage',e=>{
    if(e.key===KEY){preferences=load();editing=false;render();}
    if(e.key===managementCards&&preferences.enabled)render();
  });
  // The original default Home is sectioned too; labels are tiny standalone
  // elements, never wrappers around the protected business/Quick Actions cards.
  for(const id of defaultSections)defaultLabels.set(id,sectionLabel(id));
  if(!preferences.enabled)restoreOriginal();
  window.DMHomeLayout={edit,done,reset};
  if(preferences.enabled)render();
})();
