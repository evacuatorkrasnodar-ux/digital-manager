/* Personalized Home layout v1 — no alteration to the approved initial geometry.
 * Moves the actual interactive DOM cards, preserving event listeners and saved data.
 * The Clients clip and its independent outline always travel as one unit.
 */
(() => {
  'use strict';
  const dashboard=document.querySelector('#homeScreen .dashboard');
  const originalGrid=document.querySelector('#homeScreen .dashboard>.metric-grid');
  const widgetHost=document.getElementById('dmHomeWidgets');
  const managementCards='digital-manager-black-velvet-v2';
  const KEY='dm-personal-home-layout-v1';
  if(!dashboard||!originalGrid||!widgetHost)return;

  const parts={
    revenue:dashboard.querySelector('.revenue-card'),
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
  const defaultOrder=['revenue','signature','orders','profit','day','steps','breathe','calendar'];
  const names={
    revenue:'Выручка',signature:'Клиенты + Рекомендация',clients:'Клиенты',orders:'Продажи',
    profit:'Прибыль',advice:'Рекомендация',day:'Мой день',
    steps:'Шаги',breathe:'Дыхание',calendar:'Календарь'
  };
  const available={day:'dayWidget',steps:'healthSteps',breathe:'breathing',calendar:'calendarWidget',clients:'clients',orders:'sales',profit:'money'};
  const fixedWide=new Set(['revenue','signature','calendar']);

  const toolbar=document.createElement('section');
  toolbar.className='dm-layout-toolbar';
  toolbar.hidden=true;
  toolbar.setAttribute('aria-label','Конструктор главной');
  toolbar.innerHTML='<div class="dm-layout-heading"><span class="dm-layout-title">✦ Моя главная</span>'+
    '<span class="dm-layout-caption" id="dmLayoutCaption">Мой порядок карточек</span></div>'+
    '<div class="dm-layout-actions">'+
    '<button type="button" data-dm-layout-action="edit" id="dmLayoutEdit" aria-label="Изменить расположение карточек">✎ Изменить</button>'+
    '<button type="button" data-dm-layout-action="link" id="dmLayoutLink" hidden></button>'+
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

  function defaults(){return {enabled:false,linked:true,order:defaultOrder.slice(),sizes:{},hidden:[]};}
  function load(){
    let saved;
    try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(_){saved={};}
    if(!saved||typeof saved!=='object')saved={};
    const o={...defaults(),...saved};
    o.linked=o.linked!==false;
    o.sizes=(o.sizes&&typeof o.sizes==='object'&&!Array.isArray(o.sizes))?o.sizes:{};
    o.hidden=Array.isArray(o.hidden)?o.hidden.filter(x=>typeof x==='string'):[];
    o.order=normalize(o.order,o.linked);
    return o;
  }
  function normalize(items,linked){
    const allowed=linked?defaultOrder:['revenue','clients','orders','profit','advice','day','steps','breathe','calendar'];
    const listed=Array.isArray(items)?items:[];
    const expanded=[];
    for(const id of listed){
      if(linked&&id==='clients'){expanded.push('signature');continue;}
      if(linked&&id==='advice')continue;
      if(!linked&&id==='signature'){expanded.push('clients','advice');continue;}
      expanded.push(id);
    }
    return [...new Set([...expanded,...allowed])].filter(x=>allowed.includes(x));
  }
  let preferences=load(),editing=false;
  function save(){
    preferences.order=normalize(preferences.order,preferences.linked);
    try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch(_){}
  }
  function visibleByManagement(id){
    if(!available[id])return true;
    let cards={};
    try{cards=JSON.parse(localStorage.getItem(managementCards)||'{}')?.management?.cards||{};}catch(_){}
    const flag=available[id];
    return ['day','steps','breathe','calendar'].includes(id)?cards[flag]===true:cards[flag]!==false;
  }
  function isHidden(id){
    const ids=id==='signature'?['clients','advice']:[id];
    return ids.every(key=>preferences.hidden.includes(key)) ||
      (id==='signature'?!visibleByManagement('clients'):!visibleByManagement(id));
  }
  function node(name,html){
    const b=document.createElement('button');b.type='button';b.className='dm-layout-control';b.dataset.dmUnitAction=name;b.innerHTML=html;return b;
  }
  function unitControls(id){
    const controls=document.createElement('div');controls.className='dm-unit-controls';
    const grab=node('drag','<span aria-hidden="true">⠿</span><span class="dm-drag-caption">Переместить</span>');
    grab.classList.add('dm-unit-grab');
    grab.setAttribute('aria-label','Переместить '+names[id]+'; можно также использовать Alt и стрелки');
    grab.title='Удерживайте и перетащите карточку';
    controls.append(grab);
    for(const [kind,html,label] of [['previous','←','Сдвинуть раньше'],['next','→','Сдвинуть позже']]){
      const b=node(kind,html);b.setAttribute('aria-label',label+': '+names[id]);b.title=label;controls.append(b);
    }
    if(!fixedWide.has(id)){
      const b=node('size','↔');
      b.setAttribute('aria-label','Изменить размер: '+names[id]);
      b.title='Узкая / широкая';controls.append(b);
    }
    const hide=node('hide','×');hide.setAttribute('aria-label','Убрать карточку '+names[id]);hide.title='Скрыть с главной';controls.append(hide);
    return controls;
  }
  function appendClientWithEdge(host){
    // Management may have previously hidden Clients while they were detached.
    // Re-show the real clipped card and its matching independent contour together.
    parts.clients.hidden=false;
    parts.clientEdge.hidden=false;
    const wrap=document.createElement('div');wrap.className='dm-client-sculpt';
    wrap.append(parts.clients,parts.clientEdge);host.append(wrap);
  }
  function makeUnit(id){
    const outer=document.createElement('div');
    outer.className='dm-layout-unit';outer.dataset.cardId=id;
    const size=fixedWide.has(id)?'wide':preferences.sizes[id]==='wide'?'wide':'compact';
    outer.dataset.size=size;
    if(editing)outer.append(unitControls(id));
    const content=document.createElement('div');content.className='dm-layout-content';outer.append(content);
    if(id==='signature'){
      const pair=document.createElement('div');pair.className='dm-signature-combo';
      const left=document.createElement('div');left.className='dm-combo-clients';appendClientWithEdge(left);
      const right=document.createElement('div');right.className='dm-combo-gold';right.append(parts.advice);
      pair.append(left,right);content.append(pair);
    }else if(id==='clients')appendClientWithEdge(content);
    else{
      const map={revenue:parts.revenue,orders:parts.orders,profit:parts.profit,advice:parts.advice,
        day:parts.day,steps:parts.steps,breathe:parts.breathe,calendar:parts.calendar};
      if(map[id]){map[id].hidden=false;content.append(map[id]);}
    }
    return outer;
  }
  function holdCards(){
    const detached=document.createDocumentFragment();
    Object.values(parts).forEach(el=>detached.append(el));
    return detached;
  }
  function restoreOriginal(){
    originalGrid.replaceChildren(parts.clients,parts.clientEdge,parts.orders,parts.profit,parts.advice);
    widgetHost.replaceChildren(parts.day,parts.steps,parts.breathe,parts.calendar);
    dashboard.insertBefore(parts.revenue,widgetHost);
    originalGrid.hidden=false;
    // Existing widget module owns its own visibility and data refresh.
    window.dispatchEvent(new Event('dm:cards-changed'));
    board.replaceChildren();
    board.hidden=true;toolbar.hidden=true;
    document.documentElement.classList.remove('dm-custom-home-layout','dm-layout-editing');
    window.dispatchEvent(new Event('dm:layout-reset'));
  }
  function renderLibrary(){
    const library=document.getElementById('dmLayoutLibrary');
    library.replaceChildren();
    if(!editing){library.hidden=true;return;}
    const ids=preferences.linked?defaultOrder:['revenue','clients','orders','profit','advice','day','steps','breathe','calendar'];
    const hidden=ids.filter(id=>preferences.hidden.includes(id)||id==='signature'&&preferences.hidden.includes('clients'));
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
    // Move existing cards: never clone their event handlers or generate mock data.
    holdCards();
    board.replaceChildren();
    preferences.order=normalize(preferences.order,preferences.linked);
    for(const id of preferences.order){
      if(!isHidden(id))board.append(makeUnit(id));
    }
    board.hidden=false;
    originalGrid.hidden=true;
    widgetHost.hidden=true;
    // The editor toolbar is only shown while customizing. After "Done", the
    // user's cards remain in place without a permanent settings block.
    toolbar.hidden=!editing;
    document.documentElement.classList.add('dm-custom-home-layout');
    document.documentElement.classList.toggle('dm-layout-editing',editing);
    document.getElementById('dmLayoutCaption').textContent=editing?
      'Карточки ожили ✦ Перемещайте за ⠿ или стрелками':'Расположение сохранено';
    for(const b of toolbar.querySelectorAll('[data-dm-layout-action]')){
      const action=b.dataset.dmLayoutAction;
      b.hidden=(editing?action==='edit':action!=='edit');
    }
    const link=document.getElementById('dmLayoutLink');
    link.textContent=preferences.linked?'⛓ Разъединить пару':'⛓ Соединить пару';
    link.setAttribute('aria-label',preferences.linked?'Разъединить Клиентов и Рекомендацию':'Соединить Клиентов и Рекомендацию');
    renderLibrary();
    // Notify any other dashboard listeners without changing the card contours.
    window.dispatchEvent(new CustomEvent('dm:layout-rendered',{detail:{linked:preferences.linked,editing}}));
    // Update the original optics only in this independent layout.
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  function edit(source='settings'){
    if(editing)return;
    preferences.enabled=true;editing=true;
    save();render();
    // Direct long-press editing should not jump the screen away from the card.
    if(source!=='hold'){
      window.scrollTo({top:0,behavior:'instant'});
      document.getElementById('dmLayoutDone').focus();
    }
  }
  function done(){
    editing=false;save();render();
  }
  function reset(){
    preferences=defaults();editing=false;
    try{localStorage.removeItem(KEY);}catch(_){}
    restoreOriginal();
  }
  function linkPair(){
    preferences.linked=!preferences.linked;
    preferences.order=normalize(preferences.order,preferences.linked);
    preferences.hidden=preferences.hidden.filter(x=>x!=='signature');
    save();render();
  }
  function shift(id,by){
    const list=preferences.order;
    const i=list.indexOf(id);
    if(i<0)return;
    let next=i+by;
    while(next>=0&&next<list.length&&isHidden(list[next]))next+=by;
    if(next<0||next>=list.length)return;
    [list[i],list[next]]=[list[next],list[i]];
    save();render();
  }
  function resize(id){
    if(fixedWide.has(id))return;
    preferences.sizes[id]=preferences.sizes[id]==='wide'?'compact':'wide';
    save();render();
  }
  function hide(id){
    const keys=id==='signature'?['clients','advice']:[id];
    for(const key of keys)if(!preferences.hidden.includes(key))preferences.hidden.push(key);
    save();render();
  }
  function restore(id){
    preferences.hidden=preferences.hidden.filter(x=>id==='signature'?!['clients','advice'].includes(x):x!==id);
    save();render();
  }
  function moveTo(id,target){
    if(!target||target===id)return;
    if(!preferences.linked&&['clients','advice'].includes(id)&&['clients','advice'].includes(target)){
      // A real magnetic connection: dropping one shaped card onto the other links them.
      preferences.linked=true;
      preferences.order=normalize(preferences.order,true);
      save();render();return;
    }
    const arr=preferences.order.filter(x=>x!==id);
    const at=arr.indexOf(target);
    if(at<0)return;
    arr.splice(at,0,id);
    preferences.order=normalize(arr,preferences.linked);
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
    if(act==='link')linkPair();
  });
  board.addEventListener('click',e=>{
    if(!editing)return;
    const b=e.target.closest('[data-dm-unit-action]');
    if(b){
      const id=b.closest('[data-card-id]')?.dataset.cardId,act=b.dataset.dmUnitAction;
      if(!id)return;
      if(act==='previous')shift(id,-1);
      if(act==='next')shift(id,1);
      if(act==='size')resize(id);
      if(act==='hide')hide(id);
      return;
    }
  });
  // Block opening the underlying revenue/client/advice buttons while editing.
  board.addEventListener('click',e=>{
    if(editing&&!e.target.closest('[data-dm-unit-action]')){
      e.preventDefault();e.stopImmediatePropagation();
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
    // In edit mode the entire card acts as a grab surface, not just ⠿.
    // Keep the arrow, resize, and hide buttons independently tappable.
    const control=e.target.closest('.dm-layout-control');
    if(control&&!control.classList.contains('dm-unit-grab'))return;
    const tile=e.target.closest('.dm-layout-unit');
    if(!tile)return;
    const id=tile.dataset.cardId;
    if(!id)return;
    const handle=control||tile;
    dragging={id,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,active:false,target:null,handle};
    handle.setPointerCapture?.(e.pointerId);
  });
  board.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==dragging.pointerId)return;
    const dx=e.clientX-dragging.startX,dy=e.clientY-dragging.startY;
    if(!dragging.active&&Math.hypot(dx,dy)<9)return;
    dragging.active=true;
    const active=board.querySelector('[data-card-id="'+dragging.id+'"]');
    active?.classList.add('dm-unit-dragging');
    if(e.clientY>innerHeight-65)window.scrollBy(0,13);
    if(e.clientY<65)window.scrollBy(0,-13);
    let closest=null,best=Infinity;
    for(const tile of board.querySelectorAll('.dm-layout-unit:not(.dm-unit-dragging)')){
      const rect=tile.getBoundingClientRect();
      const x=Math.max(rect.left,Math.min(e.clientX,rect.right));
      const y=Math.max(rect.top,Math.min(e.clientY,rect.bottom));
      const dist=Math.hypot(x-e.clientX,y-e.clientY);
      if(dist<best){best=dist;closest=tile;}
    }
    board.querySelectorAll('.dm-unit-drop-target').forEach(x=>x.classList.remove('dm-unit-drop-target'));
    closest?.classList.add('dm-unit-drop-target');
    dragging.target=closest?.dataset.cardId||null;
  });
  function finishDrag(e){
    if(!dragging||e.pointerId!==dragging.pointerId)return;
    const {id,target,active}=dragging;
    dragging=null;
    board.querySelectorAll('.dm-unit-dragging,.dm-unit-drop-target').forEach(x=>x.classList.remove('dm-unit-dragging','dm-unit-drop-target'));
    if(active&&target)moveTo(id,target);
  }
  board.addEventListener('pointerup',finishDrag);
  board.addEventListener('pointercancel',e=>{
    if(dragging?.pointerId===e.pointerId){dragging=null;board.querySelectorAll('.dm-unit-dragging,.dm-unit-drop-target').forEach(x=>x.classList.remove('dm-unit-dragging','dm-unit-drop-target'));}
  });
  // Hold a card (or empty dashboard background) to enter iOS-style edit mode.
  // A short tap keeps every original card action intact. A scroll cancels holding.
  const homeScreen=document.getElementById('homeScreen');
  const HOLD_MS=630,TRAVEL_LIMIT=12;
  let hold=null,blockTapUntil=0;
  function cancelHold(){
    if(hold){clearTimeout(hold.timer);hold=null;}
  }
  function holdCandidate(target){
    if(!(target instanceof Element)||!dashboard.contains(target))return false;
    if(target.closest('.dm-layout-toolbar,.dm-unit-controls,.shortcut,dialog,input,textarea,select,[contenteditable="true"]'))return false;
    if(target.closest('.metric-card,.dm-home-widget,.dm-layout-unit'))return true;
    // Blank dashboard space is eligible, but never hijack other action buttons.
    if(target.closest('button,a,[role="button"]'))return false;
    return Boolean(target.closest('.dashboard'));
  }
  homeScreen.addEventListener('pointerdown',event=>{
    if(editing||event.button!==0||event.isPrimary===false||!holdCandidate(event.target))return;
    cancelHold();
    const current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,
      timer:null,activated:false};
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
  // After the long press, swallow the synthetic click which could otherwise
  // open a card/modal under the finger. Toolbar buttons remain usable.
  document.addEventListener('click',event=>{
    if(Date.now()>=blockTapUntil)return;
    if(!homeScreen.contains(event.target))return;
    if(event.target.closest('.dm-layout-toolbar,.dm-unit-controls'))return;
    blockTapUntil=0;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
  window.addEventListener('dm:cards-changed',()=>{if(preferences.enabled)render();});
  window.addEventListener('storage',e=>{
    if(e.key===KEY){preferences=load();editing=false;render();}
    if(e.key===managementCards&&preferences.enabled)render();
  });
  window.DMHomeLayout={edit,done,reset};
  if(preferences.enabled)render();
})();
