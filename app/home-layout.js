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
      const arrows=document.createElement('span');arrows.className='dm-home-section-arrows';
      const visible=visibleSectionIds(),index=visible.indexOf(id);
      for(const [direction,symbol,label] of [[-1,'↑','Поднять'],[1,'↓','Опустить']]){
        const btn=document.createElement('button');btn.type='button';
        btn.dataset.dmSectionShift=String(direction);btn.dataset.sectionId=id;
        btn.setAttribute('aria-label',label+' раздел «'+sections[id].title+'»');
        btn.title=label+' раздел';btn.textContent=symbol;
        btn.disabled=direction<0?index<=0:index>=visible.length-1;
        arrows.append(btn);
      }
      el.append(arrows);
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

  const toolbar=document.createElement('section');
  toolbar.className='dm-layout-toolbar';
  toolbar.hidden=true;
  toolbar.setAttribute('aria-label','Конструктор главной');
  toolbar.innerHTML='<div class="dm-layout-heading"><span class="dm-layout-title">✦ Моя главная</span>'+
    '<span class="dm-layout-caption" id="dmLayoutCaption">За ⠿ — перетащить, либо нажмите две карточки</span></div>'+
    '<div class="dm-layout-actions">'+
    '<button type="button" data-dm-layout-action="edit" id="dmLayoutEdit" aria-label="Изменить расположение карточек">✎ Изменить</button>'+

    '<button type="button" data-dm-layout-action="reset" id="dmLayoutReset" hidden>↶ Исходный вид</button>'+
    '<button type="button" data-dm-layout-action="done" id="dmLayoutDone" hidden>✓ Готово</button></div>'+
    '<div class="dm-layout-library" id="dmLayoutLibrary" hidden aria-label="Скрытые карточки"></div>';
  const board=document.createElement('section');
  board.className='dm-layout-board';
  board.id='dmLayoutBoard';
  board.hidden=true;
  board.setAttribute('aria-label','Настраиваемые карточки главной');
  dashboard.insertBefore(toolbar,parts.revenue);
  dashboard.insertBefore(board,dashboard.querySelector('.shortcuts'));
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
    const controls=document.createElement('div');controls.className='dm-unit-controls';
    const grab=node('drag','<span aria-hidden="true">⠿</span><span class="dm-drag-caption">Перетащить</span>');
    grab.classList.add('dm-unit-grab');
    grab.setAttribute('aria-label','Переместить '+names[id]+'; можно также использовать Alt и стрелки');
    grab.title='Удерживайте и перетащите карточку';
    controls.append(grab);
    if(!fixedWide.has(id)){
      const b=node('size','↔');b.classList.add('dm-layout-circle');
      b.setAttribute('aria-label','Изменить ширину: '+names[id]);
      b.title='Изменить ширину';controls.append(b);
    }
    if(fixedBlocks.has(id)){
      const lock=document.createElement('span');lock.className='dm-fixed-business-label';
      lock.textContent=id==='business'?'4 карточки · защищены':'Блок защищён';
      controls.append(lock);
    }else{
      const hide=node('hide','×');hide.classList.add('dm-layout-circle');
      hide.setAttribute('aria-label','Скрыть дополнительную карточку «'+names[id]+'»');
      hide.title='Скрыть карточку';controls.append(hide);
    }
    return controls;
  }
  function makeUnit(id){
    const outer=document.createElement('div');
    outer.className='dm-layout-unit';outer.dataset.cardId=id;
    const size=fixedWide.has(id)?'wide':preferences.sizes[id]==='wide'?'wide':'compact';
    outer.dataset.size=size;
    if(editing)outer.append(unitControls(id));
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
    board.hidden=true;toolbar.hidden=true;pickedId=null;
    document.documentElement.classList.remove('dm-custom-home-layout','dm-layout-editing');
    syncDefaultSectionLabels();
    window.dispatchEvent(new Event('dm:layout-reset'));
  }
  function renderLibrary(){
    const library=document.getElementById('dmLayoutLibrary');
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
    board.querySelectorAll('.dm-layout-unit').forEach(tile=>{
      const chosen=tile.dataset.cardId===pickedId;
      tile.classList.toggle('dm-unit-picked',chosen);
      if(editing)tile.setAttribute('aria-label',names[tile.dataset.cardId]+(chosen?' — выбрана для перемещения':' — нажмите для перемещения'));
    });
    board.hidden=false;
    // Original metric-grid is now inside its unified movable wrapper.
    widgetHost.hidden=true;
    // The editor toolbar is only shown while customizing. After "Done", the
    // user's cards remain in place without a permanent settings block.
    toolbar.hidden=!editing;
    document.documentElement.classList.add('dm-custom-home-layout');
    document.documentElement.classList.toggle('dm-layout-editing',editing);
    document.getElementById('dmLayoutCaption').textContent=editing?
      'За ⠿ — перетащить. Две карточки — поменять порядок. ↑↓ — разделы.':'Расположение сохранено';
    for(const b of toolbar.querySelectorAll('[data-dm-layout-action]')){
      const action=b.dataset.dmLayoutAction;
      b.hidden=(editing?action==='edit':action!=='edit');
    }
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
    // Direct long-press editing should not jump the screen away from the card.
    if(source!=='hold'){
      window.scrollTo({top:0,behavior:'instant'});
      document.getElementById('dmLayoutDone').focus();
    }
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
  toolbar.addEventListener('click',e=>{
    const restoreButton=e.target.closest('[data-dm-restore-id]');
    if(restoreButton){restore(restoreButton.dataset.dmRestoreId);return;}
    const b=e.target.closest('[data-dm-layout-action]');if(!b)return;
    const act=b.dataset.dmLayoutAction;
    if(act==='edit')edit();
    if(act==='done')done();
    if(act==='reset')reset();
  });
  board.addEventListener('click',e=>{
    if(!editing)return;
    const sectionArrow=e.target.closest('[data-dm-section-shift]');
    if(sectionArrow){
      sectionShift(sectionArrow.dataset.sectionId,Number(sectionArrow.dataset.dmSectionShift));
      return;
    }
    const b=e.target.closest('[data-dm-unit-action]');
    if(b){
      const id=b.closest('[data-card-id]')?.dataset.cardId,act=b.dataset.dmUnitAction;
      if(!id)return;
      if(act==='size')resize(id);
      if(act==='hide')hide(id);
      return;
    }
  });
  // Tap-to-place is reliable on phones: a tap selects the card, the user
  // scrolls naturally, and a second tap chooses its destination.
  board.addEventListener('click',e=>{
    if(!editing||e.target.closest('[data-dm-unit-action],[data-dm-section-shift]'))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(Date.now()<skipTileTapUntil)return;
    const tile=e.target.closest('.dm-layout-unit');
    if(!tile)return;
    const id=tile.dataset.cardId;
    if(pickedId===id){
      pickedId=null;render();
    }else if(pickedId){
      const moving=pickedId;
      pickedId=null;
      moveTo(moving,id);
    }else{
      pickedId=id;
      board.querySelectorAll('.dm-layout-unit').forEach(el=>el.classList.toggle('dm-unit-picked',el.dataset.cardId===id));
      document.getElementById('dmLayoutCaption').textContent='Выбрана «'+names[id]+'». Листайте и нажмите другую карточку — переместим.';
    }
  },true);
  board.addEventListener('keydown',e=>{
    const handle=e.target.closest('.dm-unit-grab');
    if(!editing||!handle||!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    const id=handle.closest('[data-card-id]')?.dataset.cardId;
    shift(id,['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);
    board.querySelector('[data-card-id="'+id+'"] .dm-unit-grab')?.focus();
  });
  let dragging=null;
  board.addEventListener('pointerdown',e=>{
    if(!editing||e.button>0)return;
    // Never capture a card touch: the screen must scroll normally over cards.
    // Only the ⠿ grip captures a pointer for actual drag-and-drop.
    const handle=e.target.closest('.dm-unit-grab');
    if(!handle)return;
    const tile=handle.closest('.dm-layout-unit');
    const id=tile?.dataset.cardId;
    if(!id)return;
    pickedId=null;
    dragging={id,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,
      x:e.clientX,y:e.clientY,active:false,target:null,handle};
    handle.setPointerCapture?.(e.pointerId);
  });
  // Auto-scroll continuously while the grip is held near the top/bottom;
  // iOS otherwise stops scrolling as soon as the finger pauses at the edge.
  let edgeFrame=0;
  function chooseDropTarget(x,y){
    if(!dragging||!dragging.active)return;
    let closest=null,best=Infinity;
    for(const tile of board.querySelectorAll('.dm-layout-unit:not(.dm-unit-dragging)')){
      const rect=tile.getBoundingClientRect();
      const px=Math.max(rect.left,Math.min(x,rect.right));
      const py=Math.max(rect.top,Math.min(y,rect.bottom));
      const distance=Math.hypot(px-x,py-y);
      if(distance<best){best=distance;closest=tile;}
    }
    board.querySelectorAll('.dm-unit-drop-target').forEach(el=>el.classList.remove('dm-unit-drop-target'));
    closest?.classList.add('dm-unit-drop-target');
    dragging.target=closest?.dataset.cardId||null;
  }
  function tickEdgeScroll(){
    edgeFrame=0;
    if(!dragging?.active)return;
    const y=dragging.y,top=70,bottom=window.innerHeight-105;
    let speed=0;
    if(y<top)speed=-Math.min(17,Math.max(3,(top-y)*.25));
    else if(y>bottom)speed=Math.min(17,Math.max(3,(y-bottom)*.25));
    if(speed){
      window.scrollBy(0,speed);
      chooseDropTarget(dragging.x,y);
    }
    edgeFrame=requestAnimationFrame(tickEdgeScroll);
  }
  function clearDrag(){
    if(edgeFrame){cancelAnimationFrame(edgeFrame);edgeFrame=0;}
    dragging=null;
    board.querySelectorAll('.dm-unit-dragging,.dm-unit-drop-target').forEach(el=>{
      el.classList.remove('dm-unit-dragging','dm-unit-drop-target');
    });
  }
  board.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==dragging.pointerId)return;
    dragging.x=e.clientX;dragging.y=e.clientY;
    const dx=e.clientX-dragging.startX,dy=e.clientY-dragging.startY;
    if(!dragging.active&&Math.hypot(dx,dy)<7)return;
    if(!dragging.active){
      dragging.active=true;
      board.querySelector('[data-card-id="'+dragging.id+'"]')?.classList.add('dm-unit-dragging');
      edgeFrame=requestAnimationFrame(tickEdgeScroll);
    }
    chooseDropTarget(e.clientX,e.clientY);
  });
  function finishDrag(e){
    if(!dragging||e.pointerId!==dragging.pointerId)return;
    const {id,target,active}=dragging;
    clearDrag();
    if(active){
      skipTileTapUntil=Date.now()+420;
      if(target)moveTo(id,target);
    }
  }
  board.addEventListener('pointerup',finishDrag);
  board.addEventListener('pointercancel',e=>{
    if(dragging?.pointerId===e.pointerId)clearDrag();
  });
  window.addEventListener('blur',clearDrag);
  // Hold a card or free dashboard space to enter jiggle mode. Ordinary taps,
  // vertical scrolling and multi-touch must never accidentally start editing.
  const homeScreen=document.getElementById('homeScreen');
  const HOLD_MS=630,TRAVEL_LIMIT=12;
  let hold=null,blockTapUntil=0;
  function cancelHold(){
    if(hold){clearTimeout(hold.timer);hold=null;}
  }
  function holdCandidate(target){
    if(!(target instanceof Element)||!dashboard.contains(target))return false;
    if(target.closest('.dm-layout-toolbar,.dm-unit-controls,dialog,input,textarea,select,[contenteditable="true"]'))return false;
    // Long-press on a quick-action button enters edit mode as well. A normal
    // short tap still invokes its existing action.
    if(target.closest('.metric-card,.dm-home-widget,.dm-layout-unit,.shortcuts,.shortcut,.dm-workspace-card'))return true;
    if(target.closest('button,a,[role="button"]'))return false;
    return Boolean(target.closest('.dashboard'));
  }
  homeScreen.addEventListener('pointerdown',event=>{
    if(editing||event.button!==0||event.isPrimary===false||!holdCandidate(event.target))return;
    cancelHold();
    const current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,timer:null};
    hold=current;
    current.timer=setTimeout(()=>{
      if(hold!==current||editing||document.hidden)return;
      hold=null;
      blockTapUntil=Date.now()+850;
      try{navigator.vibrate?.(15);}catch(_){}
      edit('hold');
    },HOLD_MS);
  },{passive:true});
  homeScreen.addEventListener('pointermove',event=>{
    if(!hold||event.pointerId!==hold.pointerId)return;
    if(Math.hypot(event.clientX-hold.x,event.clientY-hold.y)>TRAVEL_LIMIT)cancelHold();
  },{passive:true});
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    homeScreen.addEventListener(type,event=>{
      if(hold&&event.pointerId===hold.pointerId)cancelHold();
    },{passive:true});
  }
  homeScreen.addEventListener('touchstart',event=>{
    if(event.touches.length>1)cancelHold();
  },{passive:true});
  homeScreen.addEventListener('scroll',cancelHold,{capture:true,passive:true});
  window.addEventListener('blur',cancelHold);
  homeScreen.addEventListener('contextmenu',event=>{
    if(Date.now()<blockTapUntil&&dashboard.contains(event.target))event.preventDefault();
  },true);
  // Ignore the synthetic click emitted after a long press that remounts cards.
  document.addEventListener('click',event=>{
    if(Date.now()>=blockTapUntil||!homeScreen.contains(event.target))return;
    if(event.target.closest('.dm-layout-toolbar,.dm-unit-controls'))return;
    blockTapUntil=0;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
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
