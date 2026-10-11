/* Digital Manager | Black Velvet v2.4. Independent functional ring states. */
(() => {
  'use strict';
  const VERSION = '1.0.0';
  const STORAGE_KEY = 'digital-manager-black-velvet-v2';
  const byId = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('ru-RU', {style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n) || 0);
  const defaultState = { name:'Алексей', company:'Моя компания', industry:'Услуги', city:'Москва', clients:[], orders:[], savedPlan:false };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch(_) {}
  const state = {...defaultState,...stored, clients:Array.isArray(stored.clients)?stored.clients:[], orders:Array.isArray(stored.orders)?stored.orders:[]};
  let tab='home', period='day', chosenDate='';
  const demo = {
    day:   {revenue:12600000,profit:4890000,orders:1284,revChange:'+12%',profitChange:'+7%',label:'Выручка сегодня',compare:'к вчера',axis:['00:00','04:00','08:00','12:00','16:00','20:00']},
    week:  {revenue:48700000,profit:15700000,orders:3962,revChange:'+9%',profitChange:'+6%',label:'Выручка за неделю',compare:'к прошлой неделе',axis:['Пн','Вт','Ср','Чт','Пт','Сб']},
    month: {revenue:192400000,profit:61200000,orders:13921,revChange:'+18%',profitChange:'+11%',label:'Выручка за месяц',compare:'к прошлому месяцу',axis:['1','6','12','18','24','30']},
    year:  {revenue:2148000000,profit:682000000,orders:147826,revChange:'+24%',profitChange:'+16%',label:'Выручка за год',compare:'к прошлому году',axis:['Янв','Мар','Май','Июл','Сен','Ноя']}
  };
  const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){notify('Сохранение в браузере недоступно');}};
  let toastTimer;
  function notify(message){if(/добавлен|сохранён|изменен|изменено/.test(message))setRingMode('success',2100);const t=byId('toast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},3600);}
  // The assistant's ring always reflects a real local action, or an explicitly selected preview.
  // Future AI/voice engine can call setRingMode when an actual background event arrives.
  let ringResetTimer = null;
  const ringDescriptions = {
    idle: 'Белое кольцо: помощник готов к работе.',
    thinking: 'Голубое кольцо: обрабатывает запрос.',
    speaking: 'Лиловое кольцо: демонстрация голосового ответа (голос пока не подключён).',
    attention: 'Янтарное кольцо: есть рекомендация, требующая внимания.',
    success: 'Мятное кольцо: действие завершено.',
    error: 'Красноватое кольцо: операция не удалась.'
  };
  function setRingMode(mode, resetAfter = 0) {
    if (!Object.hasOwn(ringDescriptions,mode)) return;
    clearTimeout(ringResetTimer);
    const button = byId('tabAssistant');
    if(['thinking','speaking'].includes(mode))showLiveRing(mode,resetAfter||2500);
    else if(mode==='idle')hideLiveRing();
    button.dataset.mode = mode;
    document.querySelector('.bottom-nav').dataset.mode = mode;
    byId('dockLauncher').dataset.mode = mode;
    button.setAttribute('aria-label', 'Помощник. '+ringDescriptions[mode]);
    const description=byId('ringStateDescription');
    if (description) description.textContent=ringDescriptions[mode];
    document.querySelectorAll('[data-ring-preview]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.ringPreview===mode)));
    if(resetAfter>0) ringResetTimer=setTimeout(()=>setRingMode('idle'),resetAfter);
  }
  function setTab(next){
    hideBrandCard();hideProfileCard();tab=next;
    if(next==='management')mgSettingsPage('home');
    ['home','assistant','management'].forEach(x=>{
      byId(x+'Screen').hidden=x!==next;
      const button=byId('tab'+x[0].toUpperCase()+x.slice(1));
      if(button){
        button.classList.toggle('active',x===next);
        if(x===next)button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
      }
    });
    window.scrollTo({top:0,behavior:'instant'});
  }
  function applyUser(){byId('greetingName').textContent=state.name;byId('profilePreviewCompany').textContent=state.company||'Моя компания';byId('profilePreviewOwner').textContent=state.name||'Не указано';byId('profilePreviewIndustry').textContent=state.industry||'Направление не указано';}
  function renderChart(){
    // Independent, resolution-independent SVG lines generated from numeric data.
    const data={day:[8,12,16,13,19,18,33,21,25,38,34,57,52,68,83,57,74,79],week:[13,22,19,32,35,30,40,49,46,55,44,61,57,71,68,83,76,91],month:[13,21,28,23,38,36,53,43,61,53,68,62,75,69,82,73,86,96],year:[9,16,21,25,36,29,43,39,56,51,61,67,62,75,72,87,80,99]}[period];
    const values=data.map((val,i)=>[+(i*650/(data.length-1)).toFixed(1),+(119-val*1.01).toFixed(1)]);
    // Cubic Hermite-like smooth joining; never rasterizes the chart as an image.
    let d=`M${values[0][0]} ${values[0][1]}`;
    for(let i=1;i<values.length;i++){
      const p=values[i-1],q=values[i];const mx=(q[0]-p[0])*.53;
      d+=` C${(p[0]+mx).toFixed(1)} ${p[1]} ${(q[0]-mx).toFixed(1)} ${q[1]} ${q[0]} ${q[1]}`;
    }
    byId('revLine').setAttribute('d',d);byId('revArea').setAttribute('d',d+' L650 124 L0 124 Z');
    const fp=values[Math.floor(values.length*.72)];
    byId('revFocus').setAttribute('d',`M${fp[0]} ${fp[1]}V124`);
    byId('revDot').setAttribute('cx',fp[0]);byId('revDot').setAttribute('cy',fp[1]);
    byId('revDotGlow').setAttribute('cx',fp[0]);byId('revDotGlow').setAttribute('cy',fp[1]);
  }
  function updatePeriod(next){period=next;chosenDate='';document.querySelectorAll('.period').forEach(b=>{const is=b.dataset.period===next;b.classList.toggle('selected',is);b.setAttribute('aria-pressed',String(is));});const d=demo[next];byId('revenueLabel').textContent=d.label;byId('revenueValue').textContent=money(d.revenue);byId('profitValue').textContent=money(d.profit);byId('ordersValue').textContent=new Intl.NumberFormat('ru-RU').format(d.orders);document.querySelector('.revenue-card .delta span').textContent='▲ '+d.revChange;byId('revenueCompare').textContent=d.compare;document.querySelector('.profit-card .delta').innerHTML=`▲ ${d.profitChange} <small>${safe(d.compare)}</small>`;byId('chartTooltip').textContent=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(d.revenue/1000000)+' млн ₽';byId('chartAxis').replaceChildren(...d.axis.map(s=>{const el=document.createElement('span');el.textContent=s;return el;}));renderChart();}
  function hideBrandCard(){byId('openBrandCard').hidden=true;byId('openBrand').setAttribute('aria-expanded','false');}
  function toggleBrandCard(){const card=byId('openBrandCard');const isOpening=card.hidden;if(isOpening)hideProfileCard();card.hidden=!isOpening;byId('openBrand').setAttribute('aria-expanded',String(isOpening));}
  function hideProfileCard(){byId('openProfileCard').hidden=true;byId('openProfile').setAttribute('aria-expanded','false');}
  function toggleProfileCard(){const card=byId('openProfileCard');const isOpening=card.hidden;if(isOpening)hideBrandCard();card.hidden=!isOpening;byId('openProfile').setAttribute('aria-expanded',String(isOpening));}
  function closeModal(){const el=byId('modal');if(el.open)el.close();}
  function modal(title,html,init){byId('dialogTitle').textContent=title;byId('dialogContent').innerHTML=html;if(!byId('modal').open)byId('modal').showModal();if(init)init();}
  function brandModal(){modal('О продукте и лицензии',`
    <div class="modal-brand"><img src="./assets/logo-air.png" alt=""><div><strong>Цифровой бизнес</strong><small>Компания-разработчик приложения «Цифровой управляющий»</small></div></div>
    <div class="modal-rows"><div class="modal-row"><span>Приложение</span><strong>Цифровой управляющий</strong></div><div class="modal-row"><span>Установленная версия</span><strong>${VERSION}</strong></div><div class="modal-row"><span>Тип лицензии</span><span class="demo-tag">Демонстрация</span></div><div class="modal-row"><span>Покупка</span><strong>Не подтверждена</strong></div><div class="modal-row"><span>Подписка</span><strong>Не подключена</strong></div></div>
    <p class="modal-note">В этой локальной сборке нет сервера лицензирования. Мы не показываем выдуманную оплаченную подписку: после подключения системы оплаты здесь появится реальный тип лицензии, срок действия и статус.</p>
    <div class="mg-brand-feedback"><strong>Нашли баг или есть идея?</strong><a target="_blank" rel="noopener noreferrer" href="https://github.com/evacuatorkrasnodar-ux/digital-manager/issues/new">Написать разработчикам →</a><small>Обращения открываются на GitHub.</small></div><div class="dialog-actions"><button class="primary-button" type="button" id="brandDone">Понятно</button></div>`,()=>byId('brandDone').addEventListener('click',closeModal));}
  function profileModal(){modal('Мой профиль',`<form id="profileForm" class="form-fields"><label>Как к вам обращаться?<input name="name" maxlength="42" required value="${safe(state.name)}" placeholder="Имя"></label><button class="primary-button" type="submit">Сохранить имя</button></form>`,()=>byId('profileForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const name=String(form.get('name')||'').trim();if(!name)return;state.name=name;save();applyUser();closeModal();notify('Имя сохранено на этом устройстве');}));}
  function companyModal(){modal('Карточка бизнеса',`<form id="companyForm" class="form-fields"><label>Название компании<input name="company" maxlength="70" required value="${safe(state.company)}"></label><label>Направление деятельности<input name="industry" maxlength="65" value="${safe(state.industry)}"></label><label>Город<input name="city" maxlength="45" value="${safe(state.city)}"></label><button class="primary-button" type="submit">Сохранить компанию</button></form><p class="modal-note">Данные карточки сохраняются только в браузере. В будущем они будут синхронизироваться с аккаунтом.</p>`,()=>byId('companyForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);state.company=String(data.get('company')||'').trim()||'Моя компания';state.industry=String(data.get('industry')||'').trim();state.city=String(data.get('city')||'').trim();save();applyUser();closeModal();notify('Карточка бизнеса сохранена');}));}
  function clientsModal(){const list=state.clients.length?`<ul class="modal-list">${state.clients.map(x=>`<li><span>${safe(x.name)}</span><small>${safe(x.phone||'Без телефона')}</small></li>`).join('')}</ul>`:'<p class="empty-hint">Вы пока не добавили тестовых клиентов.</p>';modal('Работа с клиентами',`<p class="modal-note">На главной показаны примерные 248 клиентов. Ниже — ваши собственные записи, сохранённые на этом устройстве.</p>${list}<form id="clientForm" class="form-fields"><label>Имя клиента<input name="name" required maxlength="80" placeholder="Например, Мария"></label><label>Контакт<input name="phone" maxlength="70" placeholder="Телефон или e-mail"></label><button class="primary-button" type="submit">Добавить клиента</button></form>`,()=>byId('clientForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const name=String(d.get('name')||'').trim();if(!name)return;state.clients.unshift({name,phone:String(d.get('phone')||'').trim()});save();clientsModal();notify('Клиент добавлен');}));}
  function ordersModal(){const list=state.orders.length?`<ul class="modal-list">${state.orders.map(x=>`<li><span>${safe(x.title)}</span><small>${money(x.amount)}</small></li>`).join('')}</ul>`:'<p class="empty-hint">Вы пока не добавили тестовых заказов.</p>';modal('Заказы',`<p class="modal-note">На главной — демонстрационная аналитика. Ваши записи заказов хранятся локально и не влияют на образцовые графики.</p>${list}<form id="orderForm" class="form-fields"><label>Название заказа<input name="title" maxlength="80" required placeholder="Например, Консультация"></label><label>Сумма в рублях<input name="amount" type="number" min="0" max="999999999" required placeholder="5000"></label><button class="primary-button" type="submit">Добавить заказ</button></form>`,()=>byId('orderForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const title=String(d.get('title')||'').trim(),amount=Number(d.get('amount'));if(!title||!Number.isFinite(amount)||amount<0)return;state.orders.unshift({title,amount});save();ordersModal();notify('Заказ добавлен');}));}
  function detailModal(which){const d=demo[period];const entries={revenue:{title:'Аналитика выручки',figure:money(d.revenue),note:`Показатели за выбранный период — демонстрационные. Рост ${d.revChange} ${d.compare}.`},profit:{title:'Аналитика прибыли',figure:money(d.profit),note:`Прибыль в примере за выбранный период. Рост ${d.profitChange} ${d.compare}.`},finance:{title:'Финансовый анализ',figure:money(d.profit),note:'В рабочей версии эта страница будет собирать расходы, доходы и рентабельность из подключённых источников.'}};const item=entries[which];if(!item)return;modal(item.title,`<div class="modal-brand"><svg class="ico" style="width:38px;height:38px;color:#86caff"><use href="#ic-bars"/></svg><div><strong>${item.figure}</strong><small>Демонстрационные данные</small></div></div><p class="modal-note">${item.note}</p><div class="modal-actions"><button class="secondary-button" id="closeMetric" type="button">Вернуться на главную</button></div>`,()=>byId('closeMetric').addEventListener('click',closeModal));}
  function adviceModal(){modal('План роста',`<p class="modal-note">Пример рекомендации. Прогноз +35% не рассчитан по вашим данным и не является гарантией результата.</p><div class="plan-step"><b>01</b> · Проверьте окупаемость текущих рекламных каналов.</div><div class="plan-step"><b>02</b> · Отберите кампании с положительной маржинальностью.</div><div class="plan-step"><b>03</b> · Тестируйте увеличение бюджета на 10–20%, контролируя стоимость лида.</div><div class="plan-step"><b>04</b> · Через 7 дней сравните конверсии и реальные продажи.</div><div class="dialog-actions"><button class="primary-button" type="button" id="savePlan">${state.savedPlan?'План сохранён':'Сохранить план'}</button></div>`,()=>byId('savePlan').addEventListener('click',()=>{state.savedPlan=true;save();closeModal();notify('План сохранён на этом устройстве');}));}
  function generalModal(type){if(type==='strategy')return adviceModal();if(type==='finance')return detailModal('finance');const title=type==='automation'?'Автоматизация процессов':'Информация';modal(title,`<p class="modal-note">Здесь будут сценарии автоматизации задач компании: уведомления, напоминания и действия по событиям. На текущем этапе этот раздел ещё не подключён к внешним сервисам.</p><button class="primary-button" type="button" id="genericDone">Понятно</button>`,()=>byId('genericDone').addEventListener('click',closeModal));}
  function datesModal(){modal('Выбрать дату',`<form id="dateForm" class="form-fields"><label>Дата для просмотра<input name="date" type="date" required value="${safe(chosenDate||new Date().toLocaleDateString('en-CA'))}"></label><p class="modal-note">Выбор даты меняет заголовок, но историческая аналитика пока не подключена: график остаётся демонстрационным.</p><button class="primary-button" type="submit">Показать дату</button></form>`,()=>byId('dateForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const selectedDate=String(d.get('date')||'');updatePeriod('day');chosenDate=selectedDate;if(chosenDate){byId('revenueLabel').textContent='Выручка · '+chosenDate.split('-').reverse().join('.');}closeModal();notify('Для этой даты показаны демонстрационные данные');}));}
  function demoAnswer(q){const lower=q.toLowerCase();if(/расход|затрат|прибыл/.test(lower))return 'Начните с категорий расходов: постоянные, переменные и маркетинг. Сравните их с выручкой за одинаковые периоды. Это общий совет, не анализ ваших счетов.';if(/клиент|продаж/.test(lower))return 'Разделите клиентов на новых, активных и вернувшихся. Проверьте время ответа на заявки и внедрите повторные касания. Данные этой панели пока демонстрационные.';if(/реклам|выруч|рост/.test(lower))return 'Сначала измерьте рентабельность каждого канала. Увеличивайте бюджет небольшими шагами только там, где подтверждена окупаемость. Конкретный прогноз потребует реальных данных.';return 'Я пока работаю в демонстрационном режиме. Могу подсказать общие действия по выручке, клиентам и расходам. Реальное ИИ-подключение появится позже.';}
  function chat(q){
    const log=byId('chatLog');
    const user=document.createElement('div'); user.className='chat-bubble user'; user.textContent=q;
    const reply=document.createElement('div'); reply.className='chat-bubble'; reply.textContent='Готовлю демонстрационный ответ…';
    log.append(user,reply);
    if(byId('assistantScreen').hidden===false)reply.scrollIntoView({behavior:'smooth',block:'nearest'});
    // The compact panel and full assistant share the same demo conversation.
    const miniLog=byId('plasmaChatLog');
    const miniUser=document.createElement('div');miniUser.className='dm-chat-message user';miniUser.textContent=q;
    const miniReply=document.createElement('div');miniReply.className='dm-chat-message assistant';miniReply.textContent='Готовлю демонстрационный ответ…';
    miniLog.hidden=false;miniLog.append(miniUser,miniReply);miniLog.scrollTop=miniLog.scrollHeight;
    setRingMode('thinking');
    setTimeout(()=>{
      const answer=demoAnswer(q);reply.textContent=answer;miniReply.textContent=answer;
      miniLog.scrollTop=miniLog.scrollHeight;
      // Text-only demo: never imply that speech or a real AI service is connected.
      setRingMode('idle');
    },520);
  }

  // Единственный экран Управления. Удалено старое тестовое меню CRM.
  const mgDefaults={managerName:'Цифровой управляющий',tone:'auto',autonomy:0,
    cards:{promotion:true,sales:true,clients:true,money:true,inside:true,picture:true,tasks:true},
    skills:{market:true,opportunities:true,rules:true,documents:true},
    rules:{advertising:false,tools:false,prices:false,spending:false}};
  const mgSaved=state.management&&typeof state.management==='object'?state.management:{};
  const mgData={...mgDefaults,...mgSaved,cards:{...mgDefaults.cards,...(mgSaved.cards||{})},
    skills:{...mgDefaults.skills,...(mgSaved.skills||{})},
    rules:{...mgDefaults.rules,...(mgSaved.rules||{})}};
  state.management=mgData;

  // Explicit opt-in preference: no hidden mic use; this is an animated UI prototype.
  const savedVoice=mgSaved.voice&&typeof mgSaved.voice==='object'?mgSaved.voice:{};
  const allowedPlasmaActions=['panel','voice','text'];
  const voicePrefs={dock:savedVoice.dock!==false,tapAction:allowedPlasmaActions.includes(savedVoice.tapAction)?savedVoice.tapAction:'panel'};
  const dockTargets={
    clients:{label:'Клиенты',icon:'ic-users'},
    day:{label:'Мой день',icon:'ic-calendar'},
    docs:{label:'Документы',icon:'ic-file'},
    finance:{label:'Финансы',icon:'ic-coins'},
    home:{label:'Главная',icon:'ic-grid'},
    management:{label:'Управление',icon:'ic-settings'}
  };
  const dockDefaults=['clients','day','docs','finance'];
  const savedDockItems=Array.isArray(savedVoice.dockItems)?savedVoice.dockItems:[];
  voicePrefs.dockItems=dockDefaults.map((key,index)=>
    dockTargets[savedDockItems[index]]?savedDockItems[index]:key);
  // Four positions belong to the user; the center plasma stays fixed.
  mgData.voice=voicePrefs;
  // The animated ring temporarily replaces navigation only while the assistant is active.
  // The settings preview stays INSIDE its card, never over page content.
  const liveRing=byId('assistantLive');
  const voiceDock=document.querySelector('.bottom-nav');
  const hiddenDock=byId('dockHiddenControls');
  const dockButtonIds=['tabClients','tabDay','tabDocs','tabFinance'];
  function dmSyncDockItems(){
    dockButtonIds.forEach((id,index)=>{
      const item=byId(id);
      const key=voicePrefs.dockItems[index];
      const choice=dockTargets[key];
      item.dataset.dockTarget=key;
      item.setAttribute('aria-label','Открыть '+choice.label);
      item.querySelector('.nav-ico use').setAttribute('href','#'+choice.icon);
      item.querySelector('.nav-label').textContent=choice.label;
    });
  }
  function dmOpenDockTarget(key){
    closeDockQuickActions();
    closePlasmaPanel();
    if(key==='day'){window.location.assign('./myday.html');return;}
    if(key==='home'){setTab('home');return;}
    if(key==='management'){setTab('management');return;}
    if(key==='clients'){setTab('home');clientsModal();return;}
    if(key==='docs'){setTab('management');mgSettingsPage('documents');return;}
    if(key==='finance'){setTab('home');detailModal('finance');}
  }
  dmSyncDockItems();


  // EVENT GLYPHS: a separate, weightless layer inside the approved black plasma.
  // Only verified connected events may show event pictograms. Ambient animation
  // uses an abstract geometric mark and is NEVER a fake notification.
  const dmGlyphDrawings=Object.freeze({
    mail:'<rect x="3.5" y="6.6" width="17" height="11" rx="2"/><path d="m4.5 8 7.5 6 7.5-6"/>',
    health:'<path d="M12 20s-8.3-4.9-8.3-10.4c0-4.2 5.1-6 8.3-2.1 3.2-3.9 8.3-2.1 8.3 2.1 0 5.5-8.3 10.4-8.3 10.4Z"/><path d="M4.8 12h4l1.7-3.1 2.4 6.2 1.8-3.1h4.5"/>',
    task:'<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8 9.5l1.7 1.7 3-3.2M8 15.4h8"/>',
    mic:'<rect x="9.2" y="3.5" width="5.6" height="11.5" rx="2.8"/><path d="M5.8 11.1a6.2 6.2 0 0 0 12.4 0M12 17.3v3.1M8.5 20.4h7"/>',
    send:'<path d="M20.7 3.6 3.7 10.2c-.9.35-.87 1.57.07 1.84l6.28 1.9 2.05 6.06c.27.84 1.39.89 1.75.08L20.7 3.6ZM20.7 3.6 10.1 13.95M12.1 20l2.77-5.59"/>',
    done:'<path d="M4.7 12.7 10 18l9.3-10.2"/>',
    calendar:'<rect x="3.3" y="5.3" width="17.4" height="15" rx="2.1"/><path d="M7.5 3.6v3.7M16.5 3.6v3.7M3.8 9.4h16.4"/><circle cx="14.7" cy="15" r="3.3"/><path d="M14.7 13.2v1.9l1.3.9"/>',
    attention:'<path d="M12 3.2 21 19H3L12 3.2Z"/><path d="M12 9v4.8M12 17.1h.01"/>',
    ambient:'<circle cx="12" cy="12" r="6.2" stroke-dasharray="7.3 4.5 3.1 6.2 9.4 4.1"/><path d="M12 3.2v3.1M12 17.7v3.1M3.2 12h3.1M17.7 12h3.1"/><circle cx="12" cy="12" r="1.1"/>'
  });
  const dmGlyphTypes=['mail','health','task','calendar','attention'];
  const dmGlyphLayers=[
    ...document.querySelectorAll('#dockLauncher .dm-launcher-plasma,#tabAssistant .dm-dock-plasma,#assistantLive>.dm-voice-orb')
  ].map(orb=>{
    const layer=document.createElement('span');
    layer.className='dm-core-glyph';
    layer.setAttribute('aria-hidden','true');
    const picture=document.createElementNS('http://www.w3.org/2000/svg','svg');
    picture.setAttribute('viewBox','0 0 24 24');
    picture.setAttribute('focusable','false');
    picture.setAttribute('aria-hidden','true');
    layer.append(picture);
    orb.append(layer);
    return layer;
  });
  let dmGlyphHideTimer=null;
  let dmGlyphAmbientTimer=null;
  function dmRevealGlyph(kind){
    if(!Object.hasOwn(dmGlyphDrawings,kind))return;
    if(kind==='ambient'&&dmGlyphHideTimer!==null)return;
    if(dmGlyphHideTimer!==null)clearTimeout(dmGlyphHideTimer);
    dmGlyphLayers.forEach(layer=>{
      layer.dataset.kind=kind;
      layer.firstElementChild.innerHTML=dmGlyphDrawings[kind];
      layer.classList.remove('is-visible');
      // Reflow restarts only the inner sign, never ring/wave animations.
      void layer.offsetWidth;
      layer.classList.add('is-visible');
    });
    dmGlyphHideTimer=setTimeout(()=>{
      dmGlyphLayers.forEach(layer=>layer.classList.remove('is-visible'));
      dmGlyphHideTimer=null;
      if(!byId('plasmaChatPanel').hidden)dmSetComposerGlyph(byId('plasmaChatInput').value.trim()?'send':'mic');
    },kind==='attention'?3100:2400);
  }
  function dmPreviewGlyph(kind){
    if(!dmGlyphTypes.includes(kind))return;
    dmRevealGlyph(kind);
    dmShowGlyphInSettings(kind);
    if(kind==='attention')setRingMode('attention',3300);
    const caption=byId('dmGlyphPreviewStatus');
    if(caption)caption.textContent='Демонстрация: '+({
      mail:'важное письмо',health:'напоминание о здоровье',
      task:'важная задача',calendar:'событие из календаря',attention:'предупреждение'
    })[kind]+'. Реального события сейчас нет.';
  }
  // Integration contract for the future event hub: the verified flag must
  // come from a connected event processor, not from a timer or demo data.
  document.addEventListener('dm:assistant-event',event=>{
    const detail=event.detail;
    if(!detail||detail.verified!==true||!dmGlyphTypes.includes(detail.kind))return;
    if(detail.kind==='health'&&detail.healthOptIn!==true)return;
    dmRevealGlyph(detail.kind);
    if(detail.kind==='attention')setRingMode('attention',3400);
  });
  function dmScheduleAmbientGlyph(first=false){
    if(dmGlyphAmbientTimer!==null)clearTimeout(dmGlyphAmbientTimer);
    const delay=first?55000+Math.random()*35000:170000+Math.random()*160000;
    dmGlyphAmbientTimer=setTimeout(()=>{
      dmGlyphAmbientTimer=null;
      const quiet=document.visibilityState==='visible'
        &&byId('tabAssistant').dataset.mode==='idle'
        &&byId('plasmaChatPanel').hidden
        &&byId('dockQuickActions').hidden
        &&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(quiet)dmRevealGlyph('ambient');
      dmScheduleAmbientGlyph();
    },delay);
  }
  dmScheduleAmbientGlyph(true);
  window.addEventListener('pagehide',()=>{clearTimeout(dmGlyphHideTimer);clearTimeout(dmGlyphAmbientTimer);});
  let liveTimer=null,liveFadeTimer=null,voicePreviewTimer=null;
  function updateDock(){
    const composing=!byId('plasmaChatPanel').hidden;
    voiceDock.hidden=!voicePrefs.dock||composing;
    hiddenDock.hidden=voicePrefs.dock&&!composing;
    document.documentElement.classList.toggle('dock-is-hidden',!voicePrefs.dock);
    if(voicePrefs.dock)closeDockQuickActions();
  }
  function hideLiveRing(immediate=false){
    clearTimeout(liveTimer);
    clearTimeout(liveFadeTimer);
    if(liveRing.hidden) {
      document.documentElement.classList.remove('assistant-conversation-active');
      return;
    }
    const finish=()=>{
      liveRing.hidden=true;
      liveRing.classList.remove('is-ending');
      document.documentElement.classList.remove('assistant-conversation-active');
    };
    if(immediate){finish();return;}
    liveRing.classList.add('is-ending');
    liveFadeTimer=setTimeout(finish,330);
  }
  function showLiveRing(mode='listening',duration=3500){
    clearTimeout(liveTimer);
    clearTimeout(liveFadeTimer);
    liveRing.hidden=false;
    liveRing.classList.remove('is-ending');
    liveRing.dataset.mode=mode;
    closeDockQuickActions();
    document.documentElement.classList.add('assistant-conversation-active');
    if(duration>0)liveTimer=setTimeout(()=>hideLiveRing(),duration);
  }
  function previewVoiceRing(){
    const preview=byId('mgDetail').querySelector('.voice-mock-conversation');
    const trigger=byId('mgDetail').querySelector('#voicePreview');
    if(!preview||!trigger)return;
    clearTimeout(voicePreviewTimer);
    preview.classList.remove('is-previewing');
    void preview.offsetWidth; // Restart the local preview animation only, without opening a global overlay.
    preview.classList.add('is-previewing');
    trigger.textContent='Кольцо оживает…';
    trigger.setAttribute('aria-pressed','true');
    voicePreviewTimer=setTimeout(()=>{
      preview.classList.remove('is-previewing');
      trigger.textContent='Посмотреть живое кольцо ↗';
      trigger.setAttribute('aria-pressed','false');
    },3600);
  }
  let mgCurrent='home';
  const mgNames={manager:'Мой управляющий',communication:'Общение',capabilities:'Возможности',
    voice:'Внешний вид',autopilot:'Автопилот',connections:'Связи',documents:'Документы',
    payments:'Платежи',learning:'Обучение'};
  const mgInfo={
    connections:'Связи объединят ваш сайт, почту, календарь, банки, продажи, маркетплейсы и ЭДО. Реальные подключения пока не настроены.',
    documents:'Здесь будут договоры, счета, акты, накладные и шаблоны. Важные документы не будут отправляться или подписываться без разрешения.',
    payments:'Здесь будут счета, аренда, коммунальные и регулярные платежи. Банковские функции пока не подключены.',
    learning:'Начните с компании, затем выберите навыки управляющего и настройте самостоятельность Автопилота.'
  };
  function mgEsc(value){return safe(value);}
  // The settings illustration is a live DOM copy of the approved Home dock.
  // This avoids a second, outdated hand-drawn dock and never changes real navigation.
  function dmMountRealDockPreview(){
    const mount=byId('mgDockPreviewMount');
    const source=document.querySelector('nav.bottom-nav[data-layout="five"]');
    if(!mount||!source)return;
    const dock=source.cloneNode(true);
    dock.classList.add('mg-dock-preview');
    dock.removeAttribute('hidden');
    dock.setAttribute('aria-hidden','true');
    dock.removeAttribute('aria-label');
    dock.dataset.mode='idle';
    // Prevent the cloned SVG gradient IDs from colliding with the real dock.
    const map=new Map();
    dock.querySelectorAll('[id]').forEach((element,index)=>{
      const old=element.id;
      const unique='mg-preview-'+index+'-'+old;
      map.set(old,unique);
      element.id=unique;
    });
    dock.querySelectorAll('*').forEach(element=>{
      for(const attr of [...element.attributes]){
        if(attr.name==='id')continue;
        let value=attr.value;
        for(const [oldId,newId] of map){
          value=value.replaceAll('url(#'+oldId+')','url(#'+newId+')');
          if((attr.name==='href'||attr.name==='xlink:href'||attr.name==='aria-controls')&&value==='#'+oldId)value='#'+newId;
        }
        if(value!==attr.value)element.setAttribute(attr.name,value);
      }
    });
    dock.querySelectorAll('button,a').forEach(element=>{
      element.tabIndex=-1;
      element.removeAttribute('href');
    });
    mount.replaceChildren(dock);
  }
  // The five settings controls demonstrate signs in a nearby real-orb preview,
  // and in the existing iPhone conversation example. These are not notifications.
  let dmSettingsGlyphTimer=null;
  function dmMountGlyphShowcase(){
    const stage=byId('dmGlyphStageOrb');
    const source=byId('mgDetail').querySelector('.voice-mock-conversation .dm-voice-orb');
    if(!stage||!source)return;
    const clone=source.cloneNode(true);
    // Unique SVG gradient IDs: the real conversation ring stays visually intact.
    const ids=new Map();
    clone.querySelectorAll('[id]').forEach((node,i)=>{
      const prior=node.id,next='dm-glyph-showcase-'+i+'-'+prior;
      ids.set(prior,next);node.id=next;
    });
    clone.querySelectorAll('*').forEach(node=>{
      for(const attr of [...node.attributes]){
        if(attr.name==='id')continue;
        let value=attr.value;
        for(const [prior,next] of ids){
          value=value.replaceAll('url(#'+prior+')','url(#'+next+')');
          if((attr.name==='href'||attr.name==='xlink:href')&&value==='#'+prior)value='#'+next;
        }
        if(value!==attr.value)node.setAttribute(attr.name,value);
      }
    });
    stage.replaceChildren(clone);
    for(const orb of [source,clone]){
      const glyph=document.createElement('span');
      glyph.className='dm-core-glyph dm-settings-demo-glyph';
      glyph.setAttribute('aria-hidden','true');
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');
      icon.setAttribute('aria-hidden','true');
      glyph.append(icon);orb.append(glyph);
    }
  }
  function dmShowGlyphInSettings(kind){
    const scene=byId('dmGlyphStage');
    if(!scene)return;
    if(dmSettingsGlyphTimer!==null)clearTimeout(dmSettingsGlyphTimer);
    const label=({
      mail:'Почта',health:'Здоровье',task:'Задача',
      calendar:'Календарь',attention:'Внимание'
    })[kind];
    const caption=byId('dmGlyphStageLabel');
    if(caption)caption.textContent=label+' · демонстрация';
    scene.setAttribute('aria-label','Демонстрация символа: '+label);
    byId('mgDetail').querySelectorAll('[data-dm-glyph-preview]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.dmGlyphPreview===kind));
    });
    const layers=byId('mgDetail').querySelectorAll('.dm-settings-demo-glyph');
    layers.forEach(layer=>{
      layer.dataset.kind=kind;
      layer.firstElementChild.innerHTML=dmGlyphDrawings[kind];
      layer.classList.remove('is-visible');
      void layer.offsetWidth;
      layer.classList.add('is-visible');
    });
    scene.classList.remove('is-playing');
    void scene.offsetWidth;
    scene.classList.add('is-playing');
    dmSettingsGlyphTimer=setTimeout(()=>{
      layers.forEach(layer=>layer.classList.remove('is-visible'));
      scene.classList.remove('is-playing');
      byId('mgDetail').querySelectorAll('[data-dm-glyph-preview]').forEach(button=>button.setAttribute('aria-pressed','false'));
      if(caption)caption.textContent='Выберите знак ✦';
      scene.setAttribute('aria-label','Плазма ждёт выбранный знак');
      dmSettingsGlyphTimer=null;
    },4200);
  }
  function mgSettingsPage(page){
    mgCurrent=page;
    byId('mgHome').hidden=page!=='home';
    byId('mgDetail').hidden=page==='home';
    byId('mgTitle').textContent=mgNames[page]||'Управление';
    byId('mgSubtitle').textContent=({home:'Настройки приложения',manager:'Все настройки одного помощника',communication:'Как звать помощника и как он общается',capabilities:'Навыки и помощь в работе',autopilot:'Границы самостоятельности',connections:'Сервисы и источники данных',documents:'Файлы и шаблоны',payments:'Счета и регулярные расходы',learning:'Возможности приложения',voice:'Плазма · Док · Знаки · Голос'})[page]||'Настройки приложения';
    clearTimeout(voicePreviewTimer);
    if(dmSettingsGlyphTimer!==null){clearTimeout(dmSettingsGlyphTimer);dmSettingsGlyphTimer=null;}
    if(page==='home'){byId('mgDetail').innerHTML='';window.scrollTo(0,0);requestAnimationFrame(mgSyncCarouselNav);return;}
    let content='';
    if(page==='manager'){
      const parts=[
        ['communication','ic-chat','Общение','Имя · Стиль · Голос'],
        ['capabilities','ic-spark','Возможности','Навыки и помощь в работе'],
        ['voice','ic-settings','Внешний вид','Плазма · Док · Знаки'],
        ['autopilot','ic-shield','Автопилот','Самостоятельность и разрешения']
      ];
      content='<div class="mg-unified-hub">'+parts.map(([key,icon,label,description])=>
        '<button type="button" class="mg-unified-item mg-unified-'+key+'" data-mg-open="'+key+'">'+
          '<span class="mg-unified-icon"><svg class="ico" aria-hidden="true"><use href="#'+icon+'"/></svg></span>'+
          '<span class="mg-copy"><strong>'+label+'</strong><small>'+description+'</small></span>'+
          '<span class="mg-chevron" aria-hidden="true"><svg class="ico"><use href="#ic-chevron"/></svg></span>'+
        '</button>').join('')+'</div>';
    }else if(page==='communication'){
      // Existing stored managerName remains untouched; only the input display
      // uses an empty hint for the long product name.
      const wakeName=mgData.managerName==='Цифровой управляющий'?'':mgData.managerName;
      content='<section class="mg-unified-panel"><h2>Как звать помощника?</h2>'+
        '<label class="mg-field mg-wake-name">Короткое имя для обращения<input id="mgManagerName" maxlength="42" autocomplete="off" placeholder="Например, Вася" value="'+mgEsc(wakeName)+'"></label>'+
        '<p class="mg-unified-note">Название приложения остаётся «Цифровой управляющий». Обращение по имени заработает после подключения распознавания речи и разрешения на микрофон.</p>'+
        '</section>'+
        '<section class="mg-unified-panel"><h2>Стиль общения</h2>'+
        '<label class="mg-field">Как отвечать<select id="mgTone">'+
          '<option value="auto">Подстраивается под меня</option>'+
          '<option value="human">Как друг</option>'+
          '<option value="brief">По делу</option>'+
          '<option value="business">Спокойно и официально</option>'+
        '</select></label>'+
        '<p class="mg-unified-note">Необязательная настройка манеры общения. На самостоятельные действия и права доступа не влияет; полноценная персонализация появится с подключением ИИ.</p>'+
        '</section>';
    }else if(page==='capabilities'){
      const choices=[['market','Следить за рынком'],['opportunities','Замечать проблемы и возможности'],['rules','Следить за правилами'],['documents','Помогать с документами']];
      content='<section class="mg-unified-panel mg-unified-skills"><h2>Навыки управляющего</h2>'+
        choices.map(([key,label])=>'<label class="mg-choice">'+label+'<input type="checkbox" data-mg-skill="'+key+'" '+(mgData.skills[key]?'checked':'')+'></label>').join('')+
        '</section>'+
        '<p class="mg-unified-note mg-unified-footnote">Выбор навыков сохраняется. Реальное наблюдение за рынком и документами начнётся только после подключения источников и соответствующих возможностей.</p>';
    }else if(page==='voice'){
      content="<div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-grid\"/></svg></span><span class=\"mg-copy\"><strong>Показывать док</strong><small>Постоянная панель внизу экрана</small></span><label class=\"voice-switch\"><input id=\"voiceDock\" type=\"checkbox\" aria-label=\"Показывать док\"><i></i></label></div><div class=\"voice-mock voice-mock-dock-scene\" role=\"img\" aria-label=\"Айфон с настоящим доком главного экрана\"><div class=\"voice-iphone-device\"><div class=\"voice-iphone-screen\"><div class=\"voice-iphone-status\" aria-hidden=\"true\">9:41</div><div class=\"voice-iphone-island\" aria-hidden=\"true\"></div><div class=\"voice-iphone-title\" aria-hidden=\"true\">ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</div><div class=\"voice-iphone-dock-mount\" id=\"mgDockPreviewMount\"></div></div></div></div><p class=\"voice-caption\">Док обеспечивает быстрый доступ к приложению. При выключении останется плазма помощника с быстрыми действиями.</p></div><div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-purple\"><span class=\"voice-ring-icon\"></span></span><span class=\"mg-copy\"><strong>Во время разговора</strong><small>Нежное кольцо без логотипа</small></span></div><div class=\"voice-mock voice-mock-conversation\" role=\"img\" aria-label=\"Предпросмотр светящегося кольца без логотипа\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><svg class=\"dm-voice-waves dm-voice-waves-electric\" viewBox=\"0 0 400 125\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectric0\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#4ca4ff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#4ca4ff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#8577ef\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#8577ef\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric2\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#5eacff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#5eacff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric3\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#7055d9\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#7055d9\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric4\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#357fe6\" stop-opacity=\".08\"/><stop offset=\"14%\" stop-color=\"#488bea\" stop-opacity=\".29\"/><stop offset=\"22%\" stop-color=\"#63a9ff\" stop-opacity=\".59\"/><stop offset=\"25%\" stop-color=\"#b9eaff\" stop-opacity=\".95\"/><stop offset=\"28%\" stop-color=\"#68bfff\" stop-opacity=\".64\"/><stop offset=\"36%\" stop-color=\"#5389fa\" stop-opacity=\".47\"/><stop offset=\"48%\" stop-color=\"#628dfb\" stop-opacity=\".36\"/><stop offset=\"60%\" stop-color=\"#705ff0\" stop-opacity=\".44\"/><stop offset=\"69%\" stop-color=\"#917bfa\" stop-opacity=\".62\"/><stop offset=\"74%\" stop-color=\"#dfdcff\" stop-opacity=\".97\"/><stop offset=\"78%\" stop-color=\"#8bafff\" stop-opacity=\".66\"/><stop offset=\"87%\" stop-color=\"#5888ec\" stop-opacity=\".28\"/><stop offset=\"100%\" stop-color=\"#4772d8\" stop-opacity=\".06\"/></linearGradient></defs><g class=\"dm-laser-track dm-electric-wave-0\"><path class=\"dm-laser-bloom\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-halo\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-core\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/></g><g class=\"dm-laser-track dm-electric-wave-1\"><path class=\"dm-laser-bloom\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-halo\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-core\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/></g><g class=\"dm-laser-track dm-electric-wave-2\"><path class=\"dm-laser-bloom\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-halo\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-core\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/></g><g class=\"dm-laser-track dm-electric-wave-3\"><path class=\"dm-laser-bloom\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-halo\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-core\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/></g><g class=\"dm-laser-track dm-electric-wave-4\"><path class=\"dm-laser-bloom\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmPreviewElectric4)\"/><path class=\"dm-laser-halo\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmPreviewElectric4)\"/><path class=\"dm-laser-core\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmPreviewElectric4)\"/></g></svg><span class=\"dm-voice-orb dm-voice-orb-electric\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmPreviewElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#89ceff\"/><stop offset=\".34\" stop-color=\"#1b6af7\"/><stop offset=\".62\" stop-color=\"#0b26a7\"/><stop offset=\".87\" stop-color=\"#b394ff\"/><stop offset=\"1\" stop-color=\"#376eff\"/></linearGradient></defs><circle cx=\"60\" cy=\"60\" r=\"53\" fill=\"none\" stroke=\"#3564ec\" stroke-width=\".65\" opacity=\".42\"/><circle cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"url(#dmPreviewElectricStroke)\" stroke-width=\"2.1\" opacity=\".9\"/><circle cx=\"60\" cy=\"60\" r=\"47\" fill=\"none\" stroke=\"url(#dmPreviewElectricInner)\" stroke-width=\"1.1\" opacity=\".83\"/><circle class=\"dm-orb-arc dm-arc-ice\" cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"#c5efff\" stroke-width=\"2.05\" stroke-linecap=\"round\" stroke-dasharray=\"80 238\"/><circle class=\"dm-orb-arc dm-arc-violet\" cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"#d2aaff\" stroke-width=\"2.15\" stroke-linecap=\"round\" stroke-dasharray=\"53 261\"/></svg></span></div></div><p class=\"voice-caption\">Помощник появляется в виде светового кольца и плавно исчезает после разговора.</p><button type=\"button\" id=\"voicePreview\" class=\"voice-preview-button\">Посмотреть живое кольцо ↗</button></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-bars\"/></svg></span><span class=\"mg-copy\"><strong>Голосовая активация</strong><small>Распознавание фразы — в разработке</small></span><span class=\"voice-coming\">Скоро</span></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-purple\"><svg class=\"ico\"><use href=\"#ic-spark\"/></svg></span><span class=\"mg-copy\"><strong>Голосовые ответы</strong><small>Озвучивание после подключения голоса</small></span><span class=\"voice-coming\">Скоро</span></div><p class=\"mg-disclaimer\">Микрофон не включается автоматически. Голосовая активация потребует разрешения на доступ и работающего распознавания.</p>";
    }else if(page==='autopilot'){
      const choices=[['advertising','Реклама до 5 000 ₽'],['tools','Создание рабочих инструментов'],['prices','Изменение цен'],['spending','Новые расходы']];
      content='<div class="mg-auto-intro">✦ &nbsp; Насколько самостоятельно мне работать?</div>'+
        '<p class="mg-explain">Ты не отдаёшь контроль. Ты задаёшь границы, внутри которых я могу действовать сам.</p>'+
        '<label class="mg-field">Уровень самостоятельности<input id="mgAutonomy" type="range" min="0" max="2" step="1" value="'+Number(mgData.autonomy)+'"><span id="mgAutonomyLabel"></span></label>'+
        '<h2>Правила</h2>'+choices.map(([key,label])=>'<label class="mg-choice">'+label+'<input type="checkbox" data-mg-rule="'+key+'" '+(mgData.rules[key]?'checked':'')+'></label>').join('')+
        '<p class="mg-disclaimer">Настройки — прототип. Они пока не разрешают реальных платежей, отправки сообщений или других действий.</p>';
    }else{content='<p class="mg-explain">'+mgInfo[page]+'</p><p class="mg-disclaimer">Этот раздел готовится. Подключённые данные и действия не имитируются.</p>';}
    byId('mgDetail').innerHTML=content;
    if(page==='voice'){
      dmSyncDockItems();
      dmMountRealDockPreview();
      // Dedicated action preference; voice activation by name needs a real recognition
      // engine and microphone permission, so its status is explicitly informational.
      const settings=document.createElement('section');
      settings.className='dm-chat-settings voice-pref';
      settings.innerHTML='<div class="dm-chat-settings-title"><svg class="ico" aria-hidden="true"><use href="#ic-grid"/></svg><div><strong>Нажатие на плазму</strong><small>Что открывать при касании помощника</small></div></div>'+
        '<label class="dm-chat-settings-label" for="plasmaTapMode">Действие при нажатии</label>'+
        '<select id="plasmaTapMode" class="dm-chat-settings-select" aria-label="Действие при нажатии на плазму">'+
          '<option value="panel">Три действия: Главная · Чат · Управление</option>'+
          '<option value="voice">Голосовое общение</option>'+
          '<option value="text">Сразу написать сообщение</option>'+
        '</select>'+
        
        
        '<div class="dm-glyph-settings"><strong>Знаки внутри плазмы</strong><small>Тонкие белые символы появляются при значимых событиях. Нажмите на знак, чтобы посмотреть анимацию.</small>'+
        '<div class="dm-glyph-showcase"><div class="dm-glyph-preview-actions">'+[
          ['mail','Почта'],['health','Здоровье'],['task','Задача'],['calendar','Календарь'],['attention','Внимание']
        ].map(([kind,label])=>'<button type="button" data-dm-glyph-preview="'+kind+'" aria-pressed="false" aria-label="Показать символ: '+label+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+dmGlyphDrawings[kind]+'</svg><span>'+label+'</span></button>').join('')+'</div><div class="dm-glyph-stage" id="dmGlyphStage" role="img" aria-label="Плазма ждёт выбранный знак"><span class="dm-glyph-stage-demo">ДЕМО</span><div class="dm-glyph-stage-orb" id="dmGlyphStageOrb"></div><span class="dm-glyph-stage-label" id="dmGlyphStageLabel">Выберите знак ✦</span></div></div>'+
        '<p class="dm-glyph-preview-status" id="dmGlyphPreviewStatus" aria-live="polite">Это предпросмотр. Реальные сигналы появятся после подключения источников событий.</p>'+
        '</div>';
      const dockConfig=document.createElement('section');
      dockConfig.className='dm-dock-customize voice-pref';
      dockConfig.innerHTML='<div class="dm-dock-customize-title"><strong>Мой док</strong><small>Выберите четыре раздела. Плазма всегда в центре.</small></div>'+
        '<div class="dm-dock-customize-grid">'+voicePrefs.dockItems.map((selected,index)=>
          '<label class="dm-dock-customize-slot"><span>Место '+(index+1)+'</span>'+
          '<select data-dock-slot="'+index+'" aria-label="Раздел в доке, место '+(index+1)+'">'+
          Object.entries(dockTargets).map(([key,item])=>'<option value="'+key+'" '+(key===selected?'selected':'')+'>'+item.label+'</option>').join('')+
          '</select></label>').join('')+'</div>'+
        '<p class="dm-dock-customize-hint">Значки на настоящем доке и в предпросмотре меняются сразу. Выбор сохраняется.</p>';
      byId('mgDetail').prepend(dockConfig);
            byId('mgDetail').prepend(settings);
      dmMountGlyphShowcase();
      byId('plasmaTapMode').value=voicePrefs.tapAction;
    }

    if(page==='communication')byId('mgTone').value=mgData.tone||'human';
    if(page==='autopilot')mgAutoLabel();
    if(page==='voice')byId('mgDetail').querySelector('#voiceDock').checked=voicePrefs.dock;
    window.scrollTo(0,0);
  }
  function mgAutoLabel(){
    const el=byId('mgAutonomyLabel');
    if(el)el.textContent=['Спрашивать обо всём','Показать план и спросить','Действовать в рамках правил'][mgData.autonomy]||'Спрашивать обо всём';
  }
  function mgApplyCards(){
    document.querySelectorAll('[data-mg-card]').forEach(el=>{el.checked=mgData.cards[el.dataset.mgCard]!==false;});
    const mapping={clients:['#clientsCard','.bv-clients-edge'],sales:['#ordersCard'],money:['.profit-card']};
    Object.entries(mapping).forEach(([key,targets])=>targets.forEach(sel=>{
      const el=document.querySelector('#homeScreen '+sel);
      if(el)el.hidden=mgData.cards[key]===false;
    }));
  }
  document.querySelectorAll('[data-mg-open]').forEach(el=>el.addEventListener('click',()=>{
    mgSettingsPage(el.dataset.mgOpen);
  }));
  byId('mgBack').addEventListener('click',()=>{if(mgCurrent==='home')setTab('home');else if(mgCurrent==='manager')mgSettingsPage('home');else if(['communication','capabilities','voice','autopilot'].includes(mgCurrent))mgSettingsPage('manager');else mgSettingsPage('home');});
  document.querySelectorAll('[data-mg-card]').forEach(el=>el.addEventListener('change',()=>{
    mgData.cards[el.dataset.mgCard]=el.checked;save();mgApplyCards();
    // Recolor the laser tracks immediately to match cards actually shown on Home.
    requestAnimationFrame(updateCardLaserPalette);
    if(!['clients','sales','money'].includes(el.dataset.mgCard))notify('Выбор сохранён. Эта постоянная карточка появится на Главной после подключения раздела.');
  }));
  byId('mgDetail').addEventListener('click',event=>{const link=event.target.closest('[data-mg-open]');if(link)mgSettingsPage(link.dataset.mgOpen);});
  byId('mgDetail').addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.dockSlot!==undefined){
      const index=Number(el.dataset.dockSlot);
      if(Number.isInteger(index)&&index>=0&&index<4&&dockTargets[el.value]){
        voicePrefs.dockItems[index]=el.value;
        dmSyncDockItems();
        dmMountRealDockPreview();
        save();
      }
      return;
    }
    if(el.id==='voiceDock'){voicePrefs.dock=el.checked;save();updateDock();}
    else if(el.id==='plasmaTapMode'){voicePrefs.tapAction=el.value;save();}
    else if(el.id==='mgManagerName'){mgData.managerName=el.value.trim()||'Цифровой управляющий';el.value=mgData.managerName==='Цифровой управляющий'?'':mgData.managerName;}
    else if(el.id==='mgTone')mgData.tone=el.value;
    else if(el.id==='mgAutonomy'){mgData.autonomy=Number(el.value);mgAutoLabel();}
    else if(el.dataset.mgSkill)mgData.skills[el.dataset.mgSkill]=el.checked;
    else if(el.dataset.mgRule)mgData.rules[el.dataset.mgRule]=el.checked;
    save();
  });
  byId('mgDetail').addEventListener('input',event=>{
    if(event.target.id==='mgAutonomy'){mgData.autonomy=Number(event.target.value);mgAutoLabel();save();}
  });
  mgApplyCards();
  // Main-screen card options: preserve native touch scrolling while giving
  // the visible heading arrow a real, accessible navigation action.
  const mgCarousel=byId('mgSwitchGrid');
  const mgCarouselNav=byId('mgCarouselNext');
  function mgSyncCarouselNav(){
    const remaining=Math.max(0,mgCarousel.scrollWidth-mgCarousel.clientWidth);
    mgCarouselNav.hidden=remaining<=4;
    const atEnd=mgCarousel.scrollLeft>=remaining-4;
    mgCarouselNav.dataset.direction=atEnd?'back':'forward';
    mgCarouselNav.setAttribute('aria-label',atEnd?'Вернуться к первым карточкам':'Показать следующие карточки');
    mgCarouselNav.title=atEnd?'К началу карточек':'Следующие карточки';
  }
  mgCarouselNav.addEventListener('click',()=>{
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(mgCarouselNav.dataset.direction==='back'){
      mgCarousel.scrollTo({left:0,behavior:reduceMotion?'auto':'smooth'});
    }else{
      const remaining=Math.max(0,mgCarousel.scrollWidth-mgCarousel.clientWidth-mgCarousel.scrollLeft);
      mgCarousel.scrollBy({left:Math.min(remaining,Math.round(mgCarousel.clientWidth*.78)),behavior:reduceMotion?'auto':'smooth'});
    }
  });
  mgCarousel.addEventListener('scroll',mgSyncCarouselNav,{passive:true});
  window.addEventListener('resize',mgSyncCarouselNav);
  window.addEventListener('pageshow',mgSyncCarouselNav);
  requestAnimationFrame(mgSyncCarouselNav);
  function closeDockQuickActions(){
    byId('dockQuickActions').hidden=true;
    const stillChatOpen=!byId('plasmaChatPanel').hidden;
    byId('dockLauncher').setAttribute('aria-expanded',String(stillChatOpen));
    byId('tabAssistant').setAttribute('aria-expanded',String(stillChatOpen));
  }
  const plasmaPanel=byId('plasmaChatPanel');
  const plasmaInput=byId('plasmaChatInput');
  const plasmaHint=byId('plasmaChatHint');
  const plasmaTriggers=[byId('dockLauncher'),byId('tabAssistant')];
  const plasmaExpand=byId('plasmaExpandDraft');
  const plasmaDraftInfo=byId('plasmaDraftInfo');
  const DM_DRAFT_KEY='digital-manager-plasma-draft-v1';
  let dmDraftAutoExpanded=false,dmActionGlyphKind='',dmAckTimer=null;
  const DM_COMPOSER_IDLE_MS=15000;
  let dmComposerIdleTimer=null;

  // ONE notebook: the IndexedDB notes store already used by myday.js.
  // The earlier stand-alone localStorage draft notes are migrated once, never
  // treated as a separate notebook again. All records stay on this device.
  const DM_NOTES_KEY='digital-manager-plasma-notes-v1';
  const DM_MYDAY_DB='digital-manager-my-day-v1';
  const dmNotesContainer=byId('plasmaSavedNotes');
  const dmNotesToggle=byId('plasmaSavedNotesToggle');
  const dmNotebookMenu=byId('plasmaNotebookMenu');
  const dmNotebookTile=document.querySelector('[data-draft-action="notebook"]');
  const dmActionStatus=byId('plasmaActionStatus');
  let dmNotes=[],dmNotebookDbPromise=null;
  function dmActionMessage(message){dmActionStatus.textContent=message;dmActionStatus.hidden=false;}
  function dmNoteTitle(value){return value.split('\n').find(line=>line.trim())?.trim().slice(0,46)||'Запись без названия';}
  function dmDayDate(t=new Date()){
    return [t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');
  }
  function dmOpenNotebookDb(){
    if(!dmNotebookDbPromise){
      dmNotebookDbPromise=new Promise((resolve,reject)=>{
        if(!('indexedDB' in window)){reject(new Error('No IndexedDB'));return;}
        const req=indexedDB.open(DM_MYDAY_DB,1);
        req.onupgradeneeded=()=>{
          const db=req.result;
          for(const name of ['events','notes']){
            if(!db.objectStoreNames.contains(name)){
              const store=db.createObjectStore(name,{keyPath:'id'});
              store.createIndex('date','date',{unique:false});
            }
          }
        };
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error||new Error('Notebook unavailable'));
        req.onblocked=()=>reject(new Error('Notebook update blocked'));
      });
      dmNotebookDbPromise.catch(()=>{dmNotebookDbPromise=null;});
    }
    return dmNotebookDbPromise;
  }
  async function dmNotebookTx(mode,work){
    const db=await dmOpenNotebookDb();
    return new Promise((resolve,reject)=>{
      let tx,request,result;
      try{tx=db.transaction('notes',mode);request=work(tx.objectStore('notes'));}
      catch(error){reject(error);return;}
      if(request){
        request.onsuccess=()=>{result=request.result;};
        request.onerror=()=>reject(request.error||new Error('Notebook request failed'));
      }
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error||new Error('Notebook transaction failed'));
      tx.onabort=()=>reject(tx.error||new Error('Notebook write aborted'));
    });
  }
  async function dmMigratePreviousNotes(){
    let previous=[];
    try{
      const value=JSON.parse(localStorage.getItem(DM_NOTES_KEY)||'[]');
      if(Array.isArray(value))previous=value.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string'&&x.text.trim());
    }catch(_){}
    if(!previous.length)return;
    // An existing calendar note with the stable migration id wins, including
    // any edits the user made after a previous partial migration.
    const db=await dmOpenNotebookDb();
    await new Promise((resolve,reject)=>{
      let tx;
      try{
        tx=db.transaction('notes','readwrite');
        const store=tx.objectStore('notes');
        previous.forEach(item=>{
          const id='plasma-migrated-'+item.id;
          const check=store.get(id);
          check.onsuccess=()=>{
            if(check.result)return;
            const stamp=Number(item.created)||Date.now();
            const date=dmDayDate(new Date(stamp));
            store.put({id,title:dmNoteTitle(item.text),date,kind:'business',
              text:item.text,createdAt:stamp,updatedAt:stamp});
          };
        });
      }catch(error){reject(error);return;}
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error('Import failed'));
      tx.onabort=()=>reject(tx.error||new Error('Import cancelled'));
    });
    try{localStorage.removeItem(DM_NOTES_KEY);}catch(_){}
  }
  async function dmRefreshNotes(){
    try{
      const rows=await dmNotebookTx('readonly',store=>store.getAll());
      dmNotes=(rows||[]).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      dmRenderNotes();return true;
    }catch(error){
      console.warn('Calendar notebook unavailable:',error);
      dmActionMessage('Не могу открыть блокнот. Черновик не тронут; можно скачать файл.');
      return false;
    }
  }
  function dmRenderNotes(){
    byId('plasmaSavedNotesCount').textContent=dmNotes.length?'('+dmNotes.length+')':'';
    dmNotesContainer.replaceChildren();
    if(!dmNotes.length){
      const p=document.createElement('p');p.className='dm-notes-empty';
      p.textContent='Здесь появятся записи из «Моего дня».';
      dmNotesContainer.append(p);return;
    }
    for(const note of dmNotes.slice(0,18)){
      const row=document.createElement('div');row.className='dm-saved-note';
      const open=document.createElement('button');open.type='button';open.className='dm-saved-note-open';open.dataset.noteOpen=note.id;
      const title=document.createElement('strong');title.textContent=note.title||dmNoteTitle(note.text||'');
      const date=document.createElement('small');date.textContent=note.date||'';
      open.append(title,date);
      const del=document.createElement('button');del.type='button';del.className='dm-saved-note-delete';del.dataset.noteDelete=note.id;
      del.setAttribute('aria-label','Удалить запись «'+(note.title||'')+'»');del.textContent='×';
      row.append(open,del);dmNotesContainer.append(row);
    }
  }
  async function dmSaveAsNote(){
    const content=plasmaInput.value.trim();
    if(!content){dmActionMessage('Сначала напиши мысль. Блокнот подождёт.');return;}
    if(content.length>30000){dmActionMessage('Для блокнота слишком большой текст. Скачай файл без сокращений.');return;}
    const now=Date.now();
    const note={id:window.crypto?.randomUUID?.()||'md-'+now+'-'+Math.random().toString(36).slice(2),
      title:dmNoteTitle(content),date:dmDayDate(),kind:'business',text:content,createdAt:now,updatedAt:now};
    try{
      await dmNotebookTx('readwrite',store=>store.put(note));
      await dmRefreshNotes();
      dmActionMessage('Записал в «Мой день». Память теперь официально не обязана всё помнить ✦');
    }catch(error){
      console.warn('Notebook save failed:',error);
      dmActionMessage('Блокнот не сохранил запись. Черновик на месте — сохрани файлом.');
    }
  }
  function dmMakeTextFile(content){
    const name=(dmNoteTitle(content).replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,45)||'Текст')+'.txt';
    return new File([content],name,{type:'text/plain;charset=utf-8'});
  }
  function dmDownloadText(content){
    const file=dmMakeTextFile(content),link=document.createElement('a'),uri=URL.createObjectURL(file);
    link.href=uri;link.download=file.name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(uri),30000);
  }
  async function dmCopyText(content){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      try{await navigator.clipboard.writeText(content);return true;}catch(_){}
    }
    const helper=document.createElement('textarea');
    helper.value=content;helper.setAttribute('readonly','');helper.style.position='fixed';helper.style.opacity='0';
    document.body.append(helper);helper.select();
    let ok=false;try{ok=document.execCommand('copy');}catch(_){}
    helper.remove();return ok;
  }
  function dmToggleNotebookMenu(force){
    const show=typeof force==='boolean'?force:dmNotebookMenu.hidden;
    dmNotebookMenu.hidden=!show;
    dmNotebookTile.setAttribute('aria-expanded',String(show));
    if(!show){
      dmNotesContainer.hidden=true;
      dmNotesToggle.setAttribute('aria-expanded','false');
    }
  }
  async function dmDraftDestination(kind){
    if(kind==='notebook'){dmToggleNotebookMenu();return;}
    const content=plasmaInput.value.trim();
    if(!content){dmActionMessage('Сначала напишите текст, чтобы выбрать действие.');return;}
    if(kind==='documents'){closePlasmaPanel();setTab('management');mgSettingsPage('documents');return;}
    if(kind==='ask'){dmSendComposerText();return;}
    if(kind==='note'){await dmSaveAsNote();return;}
    if(kind==='download'){
      try{dmDownloadText(content);dmActionMessage('Файл готов. Бумажная версия подождёт до печати ✦');}
      catch(_){dmActionMessage('Не удалось скачать файл. Попробуйте скопировать текст.');}
      return;
    }
    if(kind==='copy'){dmActionMessage(await dmCopyText(content)?'Скопировано. Голова отдыхает — буфер работает.':'Не удалось скопировать — выдели текст вручную.');return;}
    if(kind==='print'){
      const paper=window.open('','_blank');
      if(!paper){dmActionMessage('Браузер остановил окно печати. Разреши всплывающие окна или скачай файл.');return;}
      try{
        paper.document.open();
        paper.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Печать текста</title><style>@page{size:auto;margin:18mm}body{font:12pt/1.55 Arial,sans-serif;color:#111;background:#fff;padding:0;margin:0}h1{font-size:16pt;margin:0 0 12mm}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;margin:0}<\/style></head><body><h1>Текст из «Цифрового управляющего»</h1></body></html>');
        paper.document.close();
        const pre=paper.document.createElement('pre');
        pre.textContent=content;
        paper.document.body.append(pre);
        paper.focus();paper.print();
        dmActionMessage('Открыл печать. Бумага, держись! Сам текст не изменён.');
      }catch(error){
        console.warn('Print failed:',error);
        try{paper.close();}catch(_){}
        dmActionMessage('Не удалось открыть печать. Можно скачать текст и распечатать из файла.');
      }
      return;
    }
    if(kind==='email'){
      const subject=encodeURIComponent(dmNoteTitle(content));
      let body=content;
      if(content.length>1700){
        try{dmDownloadText(content);}catch(_){}
        body='Большой текст подготовлен отдельным файлом. Прикрепите скачанный .txt к письму вручную.';
        dmActionMessage('Откроется черновик письма. Прикрепите файл вручную — письмо не отправлено.');
      }else{
        dmActionMessage('Почта откроет черновик. Кнопку «Отправить» оставляю тебе ✦');
      }
      window.location.href='mailto:?subject='+subject+'&body='+encodeURIComponent(body);
      return;
    }
    if(kind==='share'){
      if(typeof navigator.share==='function'){
        try{
          const file=dmMakeTextFile(content);
          if(content.length>1800&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]}))
            await navigator.share({title:dmNoteTitle(content),files:[file]});
          else await navigator.share({title:dmNoteTitle(content),text:content});
          dmActionMessage('Вы вернулись из меню обмена. Черновик сохранён.');
        }catch(err){if(err.name!=='AbortError')dmActionMessage('Обмен недоступен. Можно скопировать или скачать текст.');}
      }else{
        const copied=await dmCopyText(content);
        dmActionMessage(copied?'Системное меню обмена недоступно. Текст скопирован — вставьте его в нужное приложение.':'Обмен недоступен — можно скачать текст.');
      }
    }
  }
  byId('plasmaChatForm').addEventListener('click',event=>{
    const btn=event.target.closest('[data-draft-action]');
    if(btn)dmDraftDestination(btn.dataset.draftAction);
  });
  byId('plasmaSaveNote').addEventListener('click',()=>{dmSaveAsNote();});
  dmNotesToggle.addEventListener('click',async()=>{
    const show=dmNotesContainer.hidden;
    dmNotesContainer.hidden=!show;dmNotesToggle.setAttribute('aria-expanded',String(show));
    if(show)await dmRefreshNotes();
  });
  dmNotesContainer.addEventListener('click',async event=>{
    const del=event.target.closest('[data-note-delete]');
    if(del){
      const record=dmNotes.find(n=>n.id===del.dataset.noteDelete);
      if(!record||!window.confirm('Удалить «'+(record.title||'запись')+'» из общего блокнота?'))return;
      try{
        await dmNotebookTx('readwrite',store=>store.delete(record.id));
        await dmRefreshNotes();
        dmActionMessage('Запись удалена из блокнота «Мой день».');
      }catch(error){console.warn(error);dmActionMessage('Не удалось удалить запись. Попробуй ещё раз.');}
      return;
    }
    const open=event.target.closest('[data-note-open]');
    if(!open)return;
    const note=dmNotes.find(item=>item.id===open.dataset.noteOpen);
    if(!note)return;
    if(plasmaInput.value.trim()&&plasmaInput.value!==note.text&&!window.confirm('Заменить текущий черновик выбранной записью?'))return;
    if(note.text.length>plasmaInput.maxLength){
      dmActionMessage('Запись длиннее окна ввода. Открой её в блокноте «Мой день».');return;
    }
    plasmaInput.value=note.text;dmSaveDraft();dmSyncComposer();
    dmActionMessage('Загрузил запись из «Моего дня». Продолжай творить ✦');
  });
  dmMigratePreviousNotes().then(dmRefreshNotes).catch(error=>{
    console.warn('Notebook migration:',error);
    dmActionMessage('Не удалось перенести старые записи. Они сохранены, черновик не тронут.');
  });
  try {plasmaInput.value=localStorage.getItem(DM_DRAFT_KEY)||'';}catch(_){}
  function dmSaveDraft(){
    try{
      if(plasmaInput.value)localStorage.setItem(DM_DRAFT_KEY,plasmaInput.value);
      else localStorage.removeItem(DM_DRAFT_KEY);
    }catch(_){}
  }
  function dmSetComposerGlyph(kind){
    if(plasmaPanel.hidden||!Object.hasOwn(dmGlyphDrawings,kind))return;
    if(dmActionGlyphKind===kind&&dmGlyphLayers.every(layer=>layer.classList.contains('is-composer-glyph')&&layer.dataset.kind===kind))return;
    clearTimeout(dmGlyphHideTimer);dmGlyphHideTimer=null;
    dmActionGlyphKind=kind;
    dmGlyphLayers.forEach(layer=>{
      layer.dataset.kind=kind;
      layer.firstElementChild.innerHTML=dmGlyphDrawings[kind];
      layer.classList.add('is-visible','is-composer-glyph');
    });
    byId('dockLauncher').setAttribute('aria-label',kind==='send'?'Отправить сообщение':kind==='done'?'Сообщение отправлено':'Голосовая функция — информация');
    byId('dockLauncher').title=kind==='send'?'Отправить сообщение':kind==='done'?'Сообщение отправлено':'Голосовое общение пока недоступно';
  }
  // A lightweight local hint, never a claim that an AI classified the message.
  // The user can always override it using «Спросить помощника».
  function dmComposerIntent(value){
    const t=value.trim();
    if(!t)return 'empty';
    if(/[?？]\s*$/.test(t)||/^(как|почему|зачем|когда|где|куда|кто|что|сколько|можно ли|подскажи|объясни|расскажи|помоги|посоветуй|проверь|найди|ответь|составь|придумай|напиши мне)\b/i.test(t))return 'question';
    return 'draft';
  }
  function dmSyncComposer(){
    const text=plasmaInput.value;
    const lineHeight=parseFloat(getComputedStyle(plasmaInput).lineHeight)||22;
    plasmaInput.style.height='auto';
    const desired=Math.max(38,Math.min(plasmaInput.scrollHeight,5*lineHeight+16));
    // The collapsed one-line bar is deliberately slender. Its content stays
    // scrollable; opening the editor restores the full multiline input.
    plasmaInput.style.height=(plasmaPanel.classList.contains('dm-chat-editor')?desired:30)+'px';
    if(!plasmaPanel.classList.contains('dm-chat-editor')&&!dmDraftAutoExpanded&&(text.length>850||text.split('\n').length>8)){
      dmDraftAutoExpanded=true;dmToggleDraftEditor(true);
    }
    const intent=dmComposerIntent(text);
    plasmaPanel.dataset.intent=intent;
    const heading=byId('plasmaComposerTitle');
    if(heading)heading.textContent=intent==='question'?'Вопрос помощнику':intent==='draft'?'Ваш текст':'Сообщение или текст';
    plasmaDraftInfo.textContent=text.length
      ?text.length.toLocaleString('ru-RU')+' зн. · '+(intent==='question'?'Нажмите на плазму, чтобы спросить помощника':'Выберите действие ниже или спросите помощника')
      :'Черновик сохраняется только на этом устройстве';
    if(!plasmaPanel.hidden){
      clearTimeout(dmAckTimer);
      dmSetComposerGlyph(text.trim()?'send':'mic');
      if(intent==='draft'){
        byId('dockLauncher').setAttribute('aria-label','Выбрать действие с текстом');
        byId('dockLauncher').title='Выберите действие с текстом или спросите помощника';
      }
    }
  }
  // Quietly return to the original plasma after 15 s with no activity.
  // Never dismiss an expanded editor, written draft, or an open mobile keyboard.
  function dmCancelComposerIdle(){
    if(dmComposerIdleTimer!==null)clearTimeout(dmComposerIdleTimer);
    dmComposerIdleTimer=null;
  }
  function dmScheduleComposerIdle(){
    dmCancelComposerIdle();
    if(plasmaPanel.hidden||plasmaPanel.classList.contains('dm-chat-editor')||plasmaInput.value.trim())return;
    dmComposerIdleTimer=setTimeout(()=>{
      dmComposerIdleTimer=null;
      if(document.visibilityState==='hidden')return;
      if(plasmaPanel.hidden||plasmaPanel.classList.contains('dm-chat-editor')||plasmaInput.value.trim())return;
      if(plasmaPanel.classList.contains('dm-chat-keyboard-open')){
        dmScheduleComposerIdle();
        return;
      }
      closePlasmaPanel(); // Restores the approved standalone plasma / chosen dock.
    },DM_COMPOSER_IDLE_MS);
  }
  function dmToggleDraftEditor(expand){
    if(!expand)dmToggleNotebookMenu(false);
    plasmaPanel.classList.toggle('dm-chat-editor',expand);
    document.documentElement.classList.toggle('dm-compose-editor',expand&&!plasmaPanel.hidden);
    plasmaExpand.setAttribute('aria-expanded',String(expand));
    plasmaExpand.setAttribute('aria-label',expand?'Свернуть чат':'Развернуть чат');
    plasmaExpand.title=expand?'Свернуть чат':'Развернуть чат';
    if(expand){
      plasmaInput.style.height='';
    }else{
      dmDraftAutoExpanded=false;
      dmSyncComposer();
    }
    positionPlasmaPanelForKeyboard();
    dmScheduleComposerIdle();
  }
  // The visualViewport moves the composer's glass and its original plasma
  // together. This avoids a floating send button behind a mobile keyboard.
  function positionPlasmaPanelForKeyboard(){
    const viewport=window.visualViewport;
    const occluded=viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
    const keyboardOpen=!plasmaPanel.hidden&&document.activeElement===plasmaInput&&occluded>120;
    plasmaPanel.classList.toggle('dm-chat-keyboard-open',keyboardOpen);
    const value=keyboardOpen?Math.round(occluded)+'px':'0px';
    plasmaPanel.style.setProperty('--dm-chat-kb',value);
    document.documentElement.style.setProperty('--dm-chat-kb',value);
  }
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',positionPlasmaPanelForKeyboard);
    window.visualViewport.addEventListener('scroll',positionPlasmaPanelForKeyboard);
  }
  plasmaInput.addEventListener('focus',positionPlasmaPanelForKeyboard);
  plasmaInput.addEventListener('blur',()=>{
    plasmaPanel.classList.remove('dm-chat-keyboard-open');
    plasmaPanel.style.setProperty('--dm-chat-kb','0px');
    document.documentElement.style.setProperty('--dm-chat-kb','0px');
  });
  plasmaInput.addEventListener('input',()=>{dmSaveDraft();dmSyncComposer();dmScheduleComposerIdle();});
  plasmaPanel.addEventListener('pointerdown',dmScheduleComposerIdle);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)dmCancelComposerIdle();else dmScheduleComposerIdle();});
  plasmaInput.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
      event.preventDefault();byId('plasmaChatForm').requestSubmit();
    }
  });
  plasmaExpand.addEventListener('click',()=>{dmToggleDraftEditor(!plasmaPanel.classList.contains('dm-chat-editor'));plasmaInput.focus();});
  byId('plasmaClearDraft').addEventListener('click',()=>{
    if(plasmaInput.value&&!window.confirm('Очистить сохранённый черновик?'))return;
    plasmaInput.value='';dmSaveDraft();dmSyncComposer();plasmaInput.focus();
  });
  function closePlasmaPanel(){
    dmCancelComposerIdle();
    dmToggleNotebookMenu(false);
    plasmaPanel.hidden=true;
    plasmaPanel.setAttribute('aria-hidden','true');
    plasmaTriggers.forEach(button=>button.setAttribute('aria-expanded','false'));
    plasmaHint.hidden=true;
    document.documentElement.classList.remove('dm-plasma-panel-open','dm-compose-editor');
    plasmaPanel.classList.remove('dm-chat-keyboard-open');
    plasmaPanel.style.setProperty('--dm-chat-kb','0px');
    document.documentElement.style.setProperty('--dm-chat-kb','0px');
    clearTimeout(dmAckTimer);dmAckTimer=null;dmActionGlyphKind='';
    dmGlyphLayers.forEach(layer=>layer.classList.remove('is-visible','is-composer-glyph'));
    byId('dockLauncher').setAttribute('aria-label','Открыть действия помощника');
    byId('dockLauncher').removeAttribute('title');
    if(document.activeElement===plasmaInput)plasmaInput.blur();
    updateDock();
  }
  function openPlasmaPanel(forceText=false){
    closeDockQuickActions();
    if(!plasmaPanel.hidden){
      if(forceText){plasmaInput.focus();return;}
      closePlasmaPanel();return;
    }
    plasmaPanel.hidden=false;plasmaPanel.setAttribute('aria-hidden','false');
    plasmaTriggers.forEach(button=>button.setAttribute('aria-expanded','true'));
    // Make the existing full plasma available in both dock modes.
    updateDock();
    void byId('dockLauncher').offsetWidth;
    document.documentElement.classList.add('dm-plasma-panel-open');
    document.documentElement.classList.toggle('dm-compose-editor',plasmaPanel.classList.contains('dm-chat-editor'));
    positionPlasmaPanelForKeyboard();
    plasmaHint.hidden=true;
    dmSyncComposer();
    if(!forceText&&voicePrefs.tapAction==='voice'){
      dmExplainUnavailableVoice();
    }else{
      plasmaInput.focus();
    }
    dmScheduleComposerIdle();
  }
  function dmExplainUnavailableVoice(){
    plasmaHint.textContent='Пока диктовка не подключена: микрофон не включается. Напишите сообщение или откройте полную переписку.';
    plasmaHint.hidden=false;
    dmSetComposerGlyph('mic');
  }
  function dmSendComposerText(){
    const question=plasmaInput.value.trim();if(!question)return false;
    // Long documents must not be sent by one accidental tap.
    if(question.length>750){
      const approved=window.confirm('Отправить большой текст ('+question.length.toLocaleString('ru-RU')+' знаков) помощнику?');
      if(!approved)return false;
    }
    chat(question);
    plasmaInput.value='';dmSaveDraft();plasmaHint.hidden=true;dmDraftAutoExpanded=false;
    dmToggleDraftEditor(false);dmSyncComposer();
    dmSetComposerGlyph('done');
    dmAckTimer=setTimeout(()=>{dmAckTimer=null;if(!plasmaPanel.hidden)dmSetComposerGlyph(plasmaInput.value.trim()?'send':'mic');},1300);
    return true;
  }
  function dmComposerOrbClick(){
    if(plasmaPanel.hidden){togglePlasmaQuickMenu();return;}
    if(plasmaInput.value.trim()){
      if(dmComposerIntent(plasmaInput.value)==='question'){dmSendComposerText();return;}
      dmActionMessage('Текст готов ✦ Выберите действие ниже или нажмите «Спросить помощника».');
      return;
    }
    dmExplainUnavailableVoice();
  }
  function togglePlasmaQuickMenu(){
    if(!plasmaPanel.hidden){dmComposerOrbClick();return;}
    // The approved compact three-action launcher remains the default idle tap.
    if(voicePrefs.tapAction!=='panel'){
      closeDockQuickActions();openPlasmaPanel();return;
    }
    const menu=byId('dockQuickActions');
    const shouldOpen=menu.hidden;
    closePlasmaPanel();closeDockQuickActions();
    if(shouldOpen){
      menu.hidden=false;
      plasmaTriggers.forEach(button=>button.setAttribute('aria-expanded','true'));
    }
  }
  byId('dockLauncher').addEventListener('click',dmComposerOrbClick);
  byId('plasmaClose').addEventListener('click',closePlasmaPanel);
  byId('plasmaChatForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(dmComposerIntent(plasmaInput.value)==='question')dmSendComposerText();
    else if(plasmaInput.value.trim())dmActionMessage('Текст готов ✦ Выберите действие или «Спросить помощника».');
  });
  dmSyncComposer();
  byId('plasmaOpenChat').addEventListener('click',()=>{closePlasmaPanel();setTab('assistant');});
  document.addEventListener('pointerdown',event=>{
    if(!plasmaPanel.hidden&&!event.target.closest('#plasmaChatPanel,#tabAssistant,#dockLauncher'))closePlasmaPanel();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!plasmaPanel.hidden){closePlasmaPanel();byId(voicePrefs.dock?'tabAssistant':'dockLauncher').focus();}
  });

  document.addEventListener('pointerdown',event=>{
    if(!byId('dockQuickActions').hidden&&!event.target.closest('#dockQuickActions,#tabAssistant,#dockLauncher'))closeDockQuickActions();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDockQuickActions();});
  updateDock();
  byId('dockOpenHome').addEventListener('click',()=>{closeDockQuickActions();closePlasmaPanel();setTab('home');});
  byId('dockOpenChat').addEventListener('click',()=>{closeDockQuickActions();openPlasmaPanel(true);});
  byId('dockOpenManage').addEventListener('click',()=>{closeDockQuickActions();closePlasmaPanel();setTab('management');});
  byId('mgDetail').addEventListener('click',event=>{
    if(event.target.closest('#voicePreview'))previewVoiceRing();
    const preview=event.target.closest('[data-dm-glyph-preview]');
    if(preview)dmPreviewGlyph(preview.dataset.dmGlyphPreview);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hideLiveRing(true);});
  window.addEventListener('pagehide',()=>hideLiveRing(true));



  // Explicitly wire every visual action; unused marketing routes remain untouched.
  document.querySelectorAll('[data-ring-preview]').forEach(b=>b.addEventListener('click',()=>setRingMode(b.dataset.ringPreview,b.dataset.ringPreview==='idle'?0:4200)));
  byId('tabClients').addEventListener('click',()=>dmOpenDockTarget(voicePrefs.dockItems[0]));
  byId('assistantReturnHome').addEventListener('click',()=>setTab('home'));
  byId('tabDay').addEventListener('click',()=>dmOpenDockTarget(voicePrefs.dockItems[1]));
  byId('tabDocs').addEventListener('click',()=>dmOpenDockTarget(voicePrefs.dockItems[2]));
  byId('tabFinance').addEventListener('click',()=>dmOpenDockTarget(voicePrefs.dockItems[3]));
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='assistant')togglePlasmaQuickMenu();else{closeDockQuickActions();closePlasmaPanel();setTab(b.dataset.tab);}}));
  document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>updatePeriod(b.dataset.period)));
  byId('openDates').addEventListener('click',()=>window.location.assign('./myday.html'));
  byId('openBrand').addEventListener('click',toggleBrandCard);
  byId('openBrandCard').addEventListener('click',()=>{hideBrandCard();brandModal();});
  document.addEventListener('click',event=>{if(!byId('openBrandCard').hidden && !event.target.closest('#openBrand, #openBrandCard'))hideBrandCard();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !byId('openBrandCard').hidden)hideBrandCard();});
  byId('openProfile').addEventListener('click',toggleProfileCard);
  byId('openProfileCard').addEventListener('click',()=>{hideProfileCard();companyModal();});
  document.addEventListener('click',event=>{if(!byId('openProfileCard').hidden && !event.target.closest('#openProfile, #openProfileCard'))hideProfileCard();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !byId('openProfileCard').hidden)hideProfileCard();});
  byId('clientsCard').addEventListener('click',clientsModal);
  byId('ordersCard').addEventListener('click',ordersModal);
  byId('openAdvice').addEventListener('click',adviceModal);
  // A warning is a behavior, not a permanent color theme. The gold ring
  // activates only when an action inside an attention-type card is opened.
  // Future cards like «Обрати внимание» can reuse data-card-signal="attention".
  byId('homeScreen').addEventListener('click',event=>{
    const action=event.target.closest('button,a,[role="button"]');
    const card=action&&action.closest('[data-card-signal="attention"]');
    if(card&&!card.hidden)setRingMode('attention',3600);
  });

  document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>b.dataset.detail==='advice'?adviceModal():detailModal(b.dataset.detail)));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='clients')clientsModal();else generalModal(a);}));

  byId('closeDialog').addEventListener('click',closeModal);
  byId('modal').addEventListener('click',e=>{if(e.target===byId('modal'))closeModal();});
  document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>chat(b.dataset.question)));
  byId('chatForm').addEventListener('submit',e=>{e.preventDefault();const i=byId('chatInput');const q=i.value.trim();if(!q)return;chat(q);i.value='';});
  // Card-to-laser palette. Every present/future dashboard card can provide
  // data-laser-accent or --dm-card-laser-accent; a visible SVG line also works.
  // This updates only the five side-laser gradients, never the approved orb.
  const laserCardRoot=document.querySelector('#homeScreen .dashboard');
  const laserSource=(raw)=>{
    const value=String(raw||'').trim();
    if(/^#[\da-f]{3}$/i.test(value))return [...value.slice(1)].map(x=>parseInt(x+x,16));
    if(/^#[\da-f]{6}$/i.test(value))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
    const m=value.match(/^rgba?\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})/i);
    return m?[m[1],m[2],m[3]].map(Number):null;
  };
  const laserColorHex=(color)=>'#'+color.map(n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join('');
  const laserMix=(a,b,t)=>a.map((value,i)=>value*(1-t)+b[i]*t);
  function cardLaserColor(card){
    const style=getComputedStyle(card);
    const explicit=style.getPropertyValue('--dm-card-laser-accent').trim()||card.getAttribute('data-laser-accent');
    const marked=laserSource(explicit);
    if(marked)return marked;
    // Automatically detect an accent on new cards that draw their own line.
    const strokes=card.querySelectorAll('svg path,svg polyline,svg line');
    for(const line of strokes){
      if(line.closest('defs'))continue;
      const lineStroke=line.getAttribute('stroke')||getComputedStyle(line).stroke;
      let stroke=laserSource(lineStroke);
      if(!stroke){
        const ref=String(lineStroke||'').match(/^url\(["']?#([^"')]+)["']?\)$/);
        const gradient=ref&&card.querySelector('[id="'+ref[1]+'"]');
        if(gradient){
          const stops=[...gradient.querySelectorAll('stop')];
          const vivid=stops.find(stop=>Number.parseFloat(stop.getAttribute('stop-opacity')||'1')>.48&&laserSource(stop.getAttribute('stop-color')));
          stroke=vivid&&laserSource(vivid.getAttribute('stop-color'));
        }
      }
      if(stroke&&Math.max(...stroke)-Math.min(...stroke)>32)return stroke;
    }
    return null;
  }
  function updateCardLaserPalette(){
    const cards=[...laserCardRoot.querySelectorAll('.metric-card,[data-laser-accent]')].filter(card=>
      !card.hidden&&getComputedStyle(card).display!=='none'&&(!card.closest('.metric-card')||card.classList.contains('metric-card')));
    const uniqueCards=[...new Set(cards)];
    const accents=uniqueCards.map(cardLaserColor).filter(Boolean);
    if(!accents.length)accents.push([86,182,255]); // neutral blue until a card is chosen
    const glowIce=[137,204,255],glowViolet=[151,124,255];
    const groups=['dmLiveElectric','dmLauncherWaveElectric','dmPreviewElectric'];
    groups.forEach(prefix=>{
      for(let wave=0;wave<5;wave++){
        const gradient=document.getElementById(prefix+wave);
        if(!gradient)continue; // management preview is mounted only when opened
        // Each visible card owns one track. If there are over five cards,
        // the extra colors flow through the same five fine tracks instead
        // of creating more layers or changing the approved plasma.
        const trackAccents=accents.filter((_,i)=>i%5===wave);
        if(!trackAccents.length)trackAccents.push(accents[wave%accents.length]);
        gradient.querySelectorAll('stop').forEach(stop=>{
          const x=Math.max(0,Math.min(1,Number.parseFloat(stop.getAttribute('offset')||'0')/100));
          const point=x*(trackAccents.length-1);
          const i=Math.floor(point);
          const base=laserMix(trackAccents[i],trackAccents[Math.min(i+1,trackAccents.length-1)],point-i);
          // Keep the cyan/violet glow at the plasma junction subtly present,
          // without changing the recognizable accent of the selected card.
          const towardViolet=x>.40&&x<.64;
          const color=laserMix(base,towardViolet?glowViolet:glowIce,towardViolet?.12:.06);
          stop.setAttribute('stop-color',laserColorHex(color));
        });
      }
    });
  }
  if(laserCardRoot){
    let laserRefreshQueued=false;
    const queueLaserRefresh=()=>{
      if(laserRefreshQueued)return;
      laserRefreshQueued=true;
      requestAnimationFrame(()=>{laserRefreshQueued=false;updateCardLaserPalette();});
    };
    const watchLaserCards=new MutationObserver(changes=>{
      if(changes.some(change=>change.type==='childList'||change.type==='attributes'))queueLaserRefresh();
    });
    watchLaserCards.observe(laserCardRoot,{subtree:true,childList:true,attributes:true,
      attributeFilter:['data-laser-accent','hidden','class','style']});
    const previewContainer=byId('mgDetail');
    if(previewContainer)new MutationObserver(queueLaserRefresh).observe(previewContainer,{childList:true});
    queueLaserRefresh();
  }
  applyUser();updatePeriod('day');setTab('home');setRingMode('idle');
  // Internal deep links from the unified personal OS dock.
  const jump=new URLSearchParams(window.location.search).get('jump');
  if(['assistant','management'].includes(jump))setTab(jump);
  else if(jump==='profile'){setTab('management');profileModal();}
  if(jump)window.history.replaceState(null,'',window.location.pathname);
  // Preserve the original analytics date picker through My Day's report link.
  if(new URLSearchParams(window.location.search).has('analyticsDate')){
    window.history.replaceState(null,'',window.location.pathname);
    datesModal();
  }
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('PWA offline unavailable:',err)));
})();
