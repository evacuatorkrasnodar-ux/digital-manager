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
      button.classList.toggle('active',x===next);
      if(x===next)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
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
  function adviceModal(){setRingMode('attention',3600);modal('План роста',`<p class="modal-note">Пример рекомендации. Прогноз +35% не рассчитан по вашим данным и не является гарантией результата.</p><div class="plan-step"><b>01</b> · Проверьте окупаемость текущих рекламных каналов.</div><div class="plan-step"><b>02</b> · Отберите кампании с положительной маржинальностью.</div><div class="plan-step"><b>03</b> · Тестируйте увеличение бюджета на 10–20%, контролируя стоимость лида.</div><div class="plan-step"><b>04</b> · Через 7 дней сравните конверсии и реальные продажи.</div><div class="dialog-actions"><button class="primary-button" type="button" id="savePlan">${state.savedPlan?'План сохранён':'Сохранить план'}</button></div>`,()=>byId('savePlan').addEventListener('click',()=>{state.savedPlan=true;save();closeModal();notify('План сохранён на этом устройстве');}));}
  function generalModal(type){if(type==='strategy')return adviceModal();if(type==='finance')return detailModal('finance');const title=type==='automation'?'Автоматизация процессов':'Информация';modal(title,`<p class="modal-note">Здесь будут сценарии автоматизации задач компании: уведомления, напоминания и действия по событиям. На текущем этапе этот раздел ещё не подключён к внешним сервисам.</p><button class="primary-button" type="button" id="genericDone">Понятно</button>`,()=>byId('genericDone').addEventListener('click',closeModal));}
  function datesModal(){modal('Выбрать дату',`<form id="dateForm" class="form-fields"><label>Дата для просмотра<input name="date" type="date" required value="${safe(chosenDate||new Date().toLocaleDateString('en-CA'))}"></label><p class="modal-note">Выбор даты меняет заголовок, но историческая аналитика пока не подключена: график остаётся демонстрационным.</p><button class="primary-button" type="submit">Показать дату</button></form>`,()=>byId('dateForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const selectedDate=String(d.get('date')||'');updatePeriod('day');chosenDate=selectedDate;if(chosenDate){byId('revenueLabel').textContent='Выручка · '+chosenDate.split('-').reverse().join('.');}closeModal();notify('Для этой даты показаны демонстрационные данные');}));}
  function demoAnswer(q){const lower=q.toLowerCase();if(/расход|затрат|прибыл/.test(lower))return 'Начните с категорий расходов: постоянные, переменные и маркетинг. Сравните их с выручкой за одинаковые периоды. Это общий совет, не анализ ваших счетов.';if(/клиент|продаж/.test(lower))return 'Разделите клиентов на новых, активных и вернувшихся. Проверьте время ответа на заявки и внедрите повторные касания. Данные этой панели пока демонстрационные.';if(/реклам|выруч|рост/.test(lower))return 'Сначала измерьте рентабельность каждого канала. Увеличивайте бюджет небольшими шагами только там, где подтверждена окупаемость. Конкретный прогноз потребует реальных данных.';return 'Я пока работаю в демонстрационном режиме. Могу подсказать общие действия по выручке, клиентам и расходам. Реальное ИИ-подключение появится позже.';}
  function chat(q){
    const log=byId('chatLog');
    const user=document.createElement('div'); user.className='chat-bubble user'; user.textContent=q;
    const reply=document.createElement('div'); reply.className='chat-bubble'; reply.textContent='Готовлю демонстрационный ответ…';
    log.append(user,reply); reply.scrollIntoView({behavior:'smooth',block:'nearest'});
    setRingMode('thinking');
    setTimeout(()=>{
      reply.textContent=demoAnswer(q);
      // Text-only demo response: no "speaking" light until actual voice playback exists.
      setRingMode('idle');
    },520);
  }

  // Единственный экран Управления. Удалено старое тестовое меню CRM.
  const mgDefaults={managerName:'Цифровой управляющий',tone:'human',autonomy:0,
    cards:{promotion:true,sales:true,clients:true,money:true,inside:true,picture:true,tasks:true},
    skills:{market:true,opportunities:true,rules:true,documents:true},
    rules:{advertising:false,tools:false,prices:false,spending:false}};
  const mgSaved=state.management&&typeof state.management==='object'?state.management:{};
  const mgData={...mgDefaults,...mgSaved,cards:{...mgDefaults.cards,...(mgSaved.cards||{})},
    skills:{...mgDefaults.skills,...(mgSaved.skills||{})},
    rules:{...mgDefaults.rules,...(mgSaved.rules||{})}};
  state.management=mgData;

  // Explicit opt-in preference: no hidden mic use; this is an animated UI prototype.
  const voicePrefs={dock:mgSaved.voice&&typeof mgSaved.voice==='object'?mgSaved.voice.dock!==false:true};
  mgData.voice=voicePrefs;
  // The animated ring temporarily replaces navigation only while the assistant is active.
  // The settings preview stays INSIDE its card, never over page content.
  const liveRing=byId('assistantLive');
  const voiceDock=document.querySelector('.bottom-nav');
  const hiddenDock=byId('dockHiddenControls');
  let liveTimer=null,liveFadeTimer=null,voicePreviewTimer=null;
  function updateDock(){
    voiceDock.hidden=!voicePrefs.dock;
    hiddenDock.hidden=voicePrefs.dock;
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
  const mgNames={manager:'Управляющий',autopilot:'Автопилот',connections:'Связи',documents:'Документы',
    payments:'Платежи',learning:'Обучение',voice:'Помощник'};
  const mgInfo={
    connections:'Связи объединят ваш сайт, почту, календарь, банки, продажи, маркетплейсы и ЭДО. Реальные подключения пока не настроены.',
    documents:'Здесь будут договоры, счета, акты, накладные и шаблоны. Важные документы не будут отправляться или подписываться без разрешения.',
    payments:'Здесь будут счета, аренда, коммунальные и регулярные платежи. Банковские функции пока не подключены.',
    learning:'Начните с компании, затем выберите навыки управляющего и настройте самостоятельность Автопилота.'
  };
  function mgEsc(value){return safe(value);}
  function mgSettingsPage(page){
    mgCurrent=page;
    byId('mgHome').hidden=page!=='home';
    byId('mgDetail').hidden=page==='home';
    byId('mgTitle').textContent=mgNames[page]||'Управление';
    byId('mgSubtitle').textContent=({home:'Настройки приложения',manager:'Имя · навыки · общение',autopilot:'Границы самостоятельности',connections:'Сервисы и источники данных',documents:'Файлы и шаблоны',payments:'Счета и регулярные расходы',learning:'Возможности приложения',voice:'Док · Кольцо · Голос'})[page]||'Настройки приложения';
    clearTimeout(voicePreviewTimer);
    if(page==='home'){byId('mgDetail').innerHTML='';window.scrollTo(0,0);return;}
    let content='';
    if(page==='manager'){
      const choices=[['market','Следить за рынком'],['opportunities','Замечать проблемы и возможности'],['rules','Следить за правилами'],['documents','Помогать с документами']];
      content='<p class="mg-explain">Выберите, как зовут вашего управляющего, как он общается и на что обращает внимание.</p>'+
        '<label class="mg-field">Имя управляющего<input id="mgManagerName" maxlength="42" value="'+mgEsc(mgData.managerName)+'"></label>'+
        '<label class="mg-field">Стиль общения<select id="mgTone"><option value="human">По-человечески</option><option value="brief">Кратко и по делу</option><option value="business">Деловой</option></select></label>'+
        '<h2>Навыки</h2>'+choices.map(([key,label])=>'<label class="mg-choice">'+label+'<input type="checkbox" data-mg-skill="'+key+'" '+(mgData.skills[key]?'checked':'')+'></label>').join('')+
        '<h2>Самостоятельность</h2>'+ '<button type="button" class="mg-row mg-auto mg-autopilot-link" data-mg-open="autopilot" aria-label="Открыть настройки Автопилота"> <span class="mg-icon mg-gold mg-zap">ϟ</span><span class="mg-copy"><strong>Автопилот</strong><small>Насколько самостоятельно мне работать?</small><small>Задайте границы, в которых я могу действовать сам.</small></span> <svg class="mg-gold-waves" viewBox="0 0 170 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mgWaves" x1="0" x2="1" y1=".4" y2="1"><stop stop-color="#cc8541" stop-opacity="0"/><stop offset=".6" stop-color="#f4b96c" stop-opacity=".48"/><stop offset=".92" stop-color="#ffe2a5" stop-opacity=".9"/><stop offset="1" stop-color="#c88937" stop-opacity=".1"/></linearGradient></defs><path d="M0 110 C56 10 106 8 180 94M3 118C56 38 102 25 174 78M0 96C67 18 113 40 175 53" fill="none" stroke="url(#mgWaves)" stroke-width="2"/><path d="M10 95C70 12 110 25 172 72" fill="none" stroke="#e9a95b" stroke-width="11" opacity=".1"/></svg><span class="mg-chevron" aria-hidden="true"><svg class="ico" aria-hidden="true"><use href="#ic-chevron"/></svg></span> </button>'+
        '<p class="mg-disclaimer">Предпочтения сохраняются на устройстве. Для реального наблюдения потребуется подключить сервисы и ИИ.</p>';
    }else if(page==='voice'){
      content="<div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-grid\"/></svg></span><span class=\"mg-copy\"><strong>Показывать док</strong><small>Постоянная панель внизу экрана</small></span><label class=\"voice-switch\"><input id=\"voiceDock\" type=\"checkbox\" aria-label=\"Показывать док\"><i></i></label></div><div class=\"voice-mock voice-mock-dock-scene\" role=\"img\" aria-label=\"Предпросмотр стеклянной док-станции с центральным кольцом\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><div class=\"voice-mock-dock\"><svg class=\"voice-dock-shape\" viewBox=\"0 0 430 116\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"vDockGlass\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#1a354f\" stop-opacity=\".96\"/><stop offset=\".48\" stop-color=\"#0b1a2d\" stop-opacity=\".98\"/><stop offset=\"1\" stop-color=\"#02070e\" stop-opacity=\".98\"/></linearGradient></defs><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50V116H0Z\" fill=\"url(#vDockGlass)\"/><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50\" fill=\"none\" stroke=\"#b4d9f0\" stroke-opacity=\".75\" stroke-width=\"1.3\" vector-effect=\"non-scaling-stroke\"/></svg><div class=\"voice-dock-items\"><span>⌂<small>Главная</small></span><span>▢<small>Чат</small></span><span class=\"voice-dock-center\"><span class=\"dm-voice-orb\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i></span></span><span>▦<small>Разделы</small></span><span>▤<small>Файлы</small></span></div></div></div></div><p class=\"voice-caption\">Док обеспечивает быстрый доступ к приложению. При выключении останется только маленькая кнопка вызова навигации.</p></div><div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-purple\"><span class=\"voice-ring-icon\"></span></span><span class=\"mg-copy\"><strong>Во время разговора</strong><small>Нежное кольцо без логотипа</small></span></div><div class=\"voice-mock voice-mock-conversation\" role=\"img\" aria-label=\"Предпросмотр светящегося кольца без логотипа\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><svg class=\"dm-voice-waves dm-voice-waves-electric\" viewBox=\"0 0 400 125\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectric0\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#4ca4ff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#4ca4ff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#8577ef\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#8577ef\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric2\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#5eacff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#5eacff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric3\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#7055d9\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#7055d9\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/></linearGradient></defs><g class=\"dm-laser-track dm-electric-wave-0\"><path class=\"dm-laser-bloom\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-halo\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-core\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/></g><g class=\"dm-laser-track dm-electric-wave-1\"><path class=\"dm-laser-bloom\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-halo\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-core\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/></g><g class=\"dm-laser-track dm-electric-wave-2\"><path class=\"dm-laser-bloom\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-halo\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-core\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/></g><g class=\"dm-laser-track dm-electric-wave-3\"><path class=\"dm-laser-bloom\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-halo\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-core\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/></g></svg><span class=\"dm-voice-orb dm-voice-orb-electric\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectricOuter\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4b93ee\"/><stop offset=\".29\" stop-color=\"#b1e1ff\"/><stop offset=\".58\" stop-color=\"#5277dc\"/><stop offset=\".82\" stop-color=\"#aa7af3\"/><stop offset=\"1\" stop-color=\"#647bff\"/></linearGradient><linearGradient id=\"dmPreviewElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmPreviewElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4f91e8\"/><stop offset=\".28\" stop-color=\"#89ceff\"/><stop offset=\".59\" stop-color=\"#2d53be\"/><stop offset=\".83\" stop-color=\"#aa88f7\"/><stop offset=\"1\" stop-color=\"#6273ee\"/></linearGradient></defs><path class=\"dm-spectral-wave dm-spectral-outer\" d=\"M113.67 60C113.84 62.33 113.87 64.72 113.66 67.06C113.45 69.41 113.02 71.77 112.41 74.04C111.79 76.31 110.93 78.55 109.95 80.69C108.97 82.83 107.79 84.89 106.52 86.86C105.26 88.83 103.85 90.72 102.36 92.5C100.87 94.29 99.27 95.99 97.58 97.58C95.9 99.18 94.12 100.67 92.27 102.05C90.42 103.44 88.48 104.71 86.49 105.89C84.51 107.07 82.45 108.14 80.34 109.11C78.24 110.08 76.07 110.97 73.85 111.7C71.64 112.43 69.35 113.08 67.04 113.5C64.73 113.92 62.35 114.21 60 114.23C57.65 114.26 55.25 114.07 52.93 113.67C50.62 113.28 48.32 112.62 46.1 111.86C43.89 111.1 41.75 110.12 39.66 109.1C37.58 108.08 35.57 106.93 33.59 105.74C31.62 104.54 29.69 103.29 27.82 101.94C25.95 100.59 24.1 99.18 22.36 97.64C20.63 96.09 18.95 94.44 17.43 92.67C15.91 90.89 14.5 88.98 13.27 86.98C12.03 84.99 10.95 82.86 10.04 80.69C9.14 78.53 8.39 76.26 7.82 73.98C7.25 71.7 6.84 69.36 6.61 67.03C6.38 64.7 6.32 62.33 6.43 60C6.54 57.67 6.83 55.34 7.25 53.06C7.67 50.77 8.26 48.52 8.93 46.31C9.59 44.11 10.39 41.94 11.24 39.8C12.1 37.67 13.03 35.56 14.08 33.49C15.12 31.42 16.23 29.35 17.51 27.4C18.79 25.44 20.18 23.5 21.75 21.75C23.32 20 25.07 18.34 26.93 16.9C28.79 15.46 30.84 14.2 32.93 13.11C35.02 12.03 37.24 11.16 39.46 10.41C41.67 9.65 43.95 9.08 46.23 8.59C48.5 8.1 50.79 7.73 53.08 7.47C55.38 7.2 57.69 7.03 60 6.99C62.31 6.96 64.64 7.03 66.94 7.26C69.25 7.49 71.56 7.86 73.83 8.38C76.1 8.9 78.36 9.57 80.55 10.39C82.74 11.21 84.91 12.17 86.97 13.29C89.03 14.41 91.05 15.67 92.93 17.09C94.8 18.51 96.59 20.1 98.2 21.8C99.81 23.51 101.27 25.39 102.58 27.33C103.89 29.26 105.01 31.34 106.04 33.42C107.07 35.5 107.93 37.65 108.75 39.81C109.56 41.96 110.28 44.14 110.93 46.35C111.58 48.56 112.19 50.79 112.65 53.07C113.1 55.34 113.5 57.67 113.67 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricOuter)\"></path><path class=\"dm-spectral-wave dm-spectral-main\" d=\"M110.63 60C110.82 62.2 110.88 64.46 110.71 66.68C110.53 68.89 110.14 71.13 109.56 73.28C108.98 75.43 108.16 77.55 107.23 79.56C106.29 81.58 105.16 83.52 103.95 85.38C102.74 87.23 101.39 89 99.98 90.67C98.56 92.35 97.03 93.94 95.44 95.44C93.84 96.93 92.15 98.33 90.4 99.62C88.66 100.92 86.83 102.11 84.95 103.22C83.08 104.33 81.15 105.34 79.16 106.26C77.18 107.19 75.15 108.04 73.06 108.75C70.98 109.46 68.83 110.11 66.65 110.53C64.47 110.95 62.22 111.24 60 111.28C57.78 111.32 55.51 111.14 53.32 110.76C51.13 110.38 48.95 109.74 46.87 108.99C44.79 108.25 42.78 107.29 40.82 106.3C38.87 105.31 36.99 104.2 35.13 103.07C33.28 101.93 31.47 100.75 29.71 99.48C27.94 98.21 26.19 96.9 24.54 95.46C22.9 94.01 21.29 92.48 19.84 90.82C18.39 89.16 17.03 87.36 15.86 85.48C14.68 83.61 13.65 81.6 12.79 79.56C11.92 77.51 11.22 75.37 10.68 73.21C10.14 71.06 9.76 68.84 9.55 66.64C9.34 64.44 9.3 62.2 9.41 60C9.53 57.8 9.83 55.6 10.25 53.45C10.66 51.3 11.25 49.19 11.89 47.11C12.54 45.03 13.3 43 14.11 40.99C14.92 38.98 15.79 36.99 16.76 35.04C17.74 33.08 18.75 31.12 19.94 29.26C21.12 27.4 22.4 25.54 23.87 23.87C25.33 22.2 26.97 20.6 28.72 19.24C30.48 17.87 32.42 16.67 34.4 15.65C36.38 14.64 38.49 13.84 40.59 13.15C42.7 12.46 44.86 11.95 47.01 11.51C49.16 11.07 51.32 10.74 53.48 10.5C55.65 10.26 57.82 10.1 60 10.07C62.18 10.03 64.37 10.09 66.54 10.3C68.72 10.51 70.9 10.85 73.04 11.33C75.18 11.81 77.32 12.43 79.39 13.19C81.46 13.95 83.52 14.84 85.47 15.88C87.43 16.92 89.35 18.11 91.12 19.44C92.9 20.78 94.59 22.27 96.11 23.89C97.63 25.5 99.01 27.29 100.22 29.13C101.44 30.97 102.48 32.95 103.43 34.93C104.37 36.9 105.15 38.95 105.9 40.99C106.65 43.02 107.31 45.08 107.93 47.16C108.54 49.24 109.12 51.33 109.57 53.47C110.03 55.61 110.44 57.8 110.63 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricStroke)\"></path><path class=\"dm-spectral-wave dm-spectral-inner\" d=\"M107.55 60C107.72 62.07 107.78 64.19 107.61 66.27C107.44 68.35 107.09 70.45 106.55 72.47C106.02 74.49 105.26 76.49 104.39 78.39C103.52 80.29 102.47 82.12 101.34 83.87C100.21 85.61 98.95 87.28 97.61 88.86C96.28 90.44 94.85 91.94 93.35 93.35C91.85 94.75 90.25 96.07 88.61 97.28C86.96 98.5 85.24 99.62 83.47 100.65C81.71 101.69 79.88 102.63 78.02 103.49C76.15 104.35 74.23 105.14 72.27 105.8C70.31 106.46 68.29 107.06 66.25 107.45C64.2 107.84 62.09 108.12 60 108.17C57.91 108.21 55.78 108.06 53.72 107.71C51.66 107.37 49.61 106.78 47.65 106.1C45.69 105.41 43.79 104.51 41.95 103.59C40.1 102.66 38.33 101.62 36.59 100.54C34.85 99.47 33.16 98.34 31.5 97.14C29.85 95.94 28.21 94.69 26.67 93.33C25.14 91.96 23.63 90.51 22.27 88.95C20.92 87.38 19.65 85.7 18.54 83.94C17.44 82.17 16.46 80.29 15.65 78.37C14.83 76.45 14.16 74.44 13.65 72.42C13.14 70.4 12.77 68.32 12.56 66.25C12.36 64.18 12.31 62.07 12.41 60C12.51 57.93 12.79 55.86 13.17 53.84C13.56 51.81 14.11 49.82 14.72 47.87C15.32 45.91 16.05 44 16.82 42.12C17.6 40.23 18.43 38.37 19.35 36.53C20.28 34.7 21.25 32.87 22.37 31.13C23.49 29.38 24.7 27.64 26.08 26.08C27.45 24.51 28.98 23.01 30.62 21.71C32.27 20.42 34.08 19.28 35.93 18.32C37.79 17.35 39.77 16.58 41.74 15.92C43.72 15.26 45.75 14.78 47.77 14.36C49.79 13.94 51.83 13.64 53.87 13.42C55.91 13.2 57.95 13.05 60 13.03C62.05 13.01 64.11 13.07 66.15 13.28C68.19 13.48 70.25 13.8 72.26 14.26C74.27 14.72 76.27 15.3 78.22 16.02C80.16 16.74 82.09 17.58 83.93 18.56C85.76 19.54 87.57 20.64 89.24 21.89C90.91 23.14 92.51 24.54 93.95 26.05C95.38 27.57 96.69 29.24 97.84 30.96C99 32.69 99.98 34.54 100.88 36.4C101.78 38.25 102.51 40.18 103.22 42.1C103.92 44.02 104.53 45.96 105.09 47.92C105.66 49.88 106.19 51.85 106.6 53.87C107.01 55.88 107.38 57.93 107.55 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricInner)\"></path><path class=\"dm-spectral-wave dm-spectral-echo dm-echo-one\" d=\"M103.92 60C104.07 61.92 104.2 63.87 104.14 65.81C104.07 67.76 103.91 69.74 103.54 71.67C103.16 73.59 102.61 75.52 101.89 77.35C101.17 79.18 100.25 80.97 99.23 82.65C98.21 84.33 97.01 85.93 95.75 87.43C94.48 88.93 93.09 90.34 91.64 91.64C90.18 92.94 88.63 94.14 87.03 95.23C85.43 96.31 83.74 97.28 82.04 98.17C80.33 99.05 78.56 99.81 76.79 100.52C75.01 101.24 73.2 101.87 71.37 102.44C69.54 103.02 67.69 103.56 65.79 103.98C63.89 104.4 61.95 104.79 60 104.96C58.05 105.14 56.03 105.21 54.07 105.03C52.11 104.86 50.12 104.47 48.24 103.9C46.35 103.33 44.51 102.5 42.77 101.59C41.04 100.68 39.39 99.56 37.81 98.43C36.23 97.31 34.74 96.08 33.27 94.84C31.8 93.6 30.38 92.32 29.01 90.99C27.63 89.66 26.27 88.3 25.02 86.84C23.76 85.39 22.54 83.86 21.46 82.25C20.38 80.64 19.39 78.93 18.55 77.17C17.71 75.41 16.99 73.55 16.42 71.68C15.85 69.8 15.42 67.85 15.14 65.91C14.87 63.96 14.74 61.96 14.79 60C14.84 58.04 15.06 56.05 15.44 54.13C15.81 52.22 16.39 50.32 17.05 48.49C17.72 46.67 18.56 44.91 19.42 43.19C20.28 41.47 21.24 39.83 22.21 38.18C23.18 36.54 24.18 34.93 25.25 33.33C26.31 31.74 27.39 30.13 28.61 28.61C29.83 27.1 31.12 25.58 32.56 24.25C34.01 22.91 35.59 21.66 37.27 20.63C38.94 19.59 40.78 18.73 42.62 18.05C44.47 17.37 46.43 16.9 48.35 16.54C50.28 16.18 52.25 15.99 54.19 15.87C56.13 15.75 58.07 15.75 60 15.83C61.93 15.91 63.85 16.07 65.75 16.33C67.65 16.59 69.55 16.95 71.41 17.41C73.28 17.88 75.12 18.45 76.94 19.11C78.75 19.78 80.54 20.55 82.28 21.42C84.02 22.29 85.74 23.24 87.37 24.34C88.99 25.43 90.59 26.63 92.03 27.97C93.47 29.31 94.84 30.79 96 32.38C97.16 33.97 98.16 35.71 99 37.48C99.84 39.26 100.47 41.15 101.02 43.01C101.57 44.87 101.95 46.78 102.32 48.66C102.69 50.54 102.98 52.42 103.25 54.31C103.51 56.2 103.77 58.08 103.92 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricInner)\"></path><path class=\"dm-spectral-wave dm-spectral-echo dm-echo-two\" d=\"M100.81 60C100.7 61.79 100.56 63.54 100.38 65.32C100.19 67.09 100 68.86 99.68 70.63C99.36 72.4 98.99 74.19 98.45 75.93C97.91 77.66 97.25 79.4 96.44 81.04C95.63 82.68 94.67 84.29 93.6 85.78C92.52 87.27 91.3 88.7 90 90C88.7 91.3 87.27 92.52 85.77 93.59C84.28 94.66 82.67 95.61 81.02 96.41C79.38 97.22 77.64 97.86 75.9 98.4C74.17 98.93 72.38 99.3 70.62 99.63C68.85 99.96 67.09 100.17 65.32 100.38C63.55 100.59 61.79 100.77 60 100.9C58.21 101.03 56.4 101.17 54.58 101.15C52.76 101.13 50.89 101.08 49.07 100.78C47.25 100.49 45.41 100.05 43.68 99.4C41.96 98.74 40.28 97.85 38.73 96.84C37.19 95.83 35.75 94.6 34.41 93.34C33.08 92.09 31.86 90.69 30.7 89.3C29.53 87.91 28.45 86.47 27.42 85C26.38 83.53 25.4 82.04 24.49 80.5C23.58 78.96 22.72 77.38 21.96 75.76C21.21 74.13 20.53 72.45 19.96 70.73C19.39 69.01 18.91 67.25 18.55 65.46C18.19 63.67 17.91 61.83 17.8 60C17.68 58.17 17.66 56.29 17.85 54.45C18.03 52.61 18.37 50.75 18.9 48.99C19.43 47.22 20.18 45.48 21.04 43.86C21.9 42.24 22.98 40.71 24.08 39.26C25.17 37.81 26.41 36.48 27.61 35.15C28.82 33.82 30.06 32.57 31.3 31.3C32.55 30.04 33.78 28.77 35.1 27.55C36.42 26.33 37.75 25.08 39.21 23.99C40.67 22.89 42.21 21.83 43.84 20.99C45.47 20.14 47.22 19.43 48.99 18.92C50.76 18.41 52.63 18.1 54.46 17.93C56.3 17.75 58.17 17.77 60 17.89C61.83 18.01 63.66 18.27 65.45 18.62C67.23 18.97 69 19.44 70.72 20C72.43 20.56 74.11 21.24 75.75 21.98C77.38 22.73 78.96 23.58 80.51 24.48C82.06 25.37 83.56 26.34 85.04 27.36C86.53 28.38 87.99 29.44 89.39 30.61C90.8 31.77 92.21 32.98 93.46 34.33C94.71 35.67 95.93 37.13 96.91 38.69C97.9 40.25 98.75 41.96 99.37 43.69C100 45.43 100.4 47.28 100.67 49.1C100.94 50.92 100.98 52.79 101.01 54.6C101.03 56.42 100.91 58.21 100.81 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricStroke)\"></path><path class=\"dm-spectral-wave dm-spectral-echo dm-echo-three\" d=\"M99.19 60C99.01 61.7 98.64 63.39 98.26 65.04C97.88 66.69 97.41 68.29 96.91 69.89C96.41 71.48 95.87 73.05 95.26 74.6C94.64 76.15 93.99 77.69 93.23 79.19C92.47 80.68 91.64 82.15 90.7 83.55C89.76 84.96 88.72 86.32 87.6 87.6C86.48 88.88 85.26 90.11 83.96 91.23C82.66 92.35 81.27 93.41 79.81 94.31C78.34 95.21 76.78 96.01 75.17 96.63C73.57 97.25 71.87 97.71 70.19 98.01C68.5 98.31 66.76 98.42 65.06 98.45C63.36 98.48 61.67 98.34 60 98.2C58.33 98.07 56.69 97.85 55.05 97.63C53.4 97.41 51.76 97.2 50.11 96.9C48.46 96.6 46.79 96.31 45.15 95.84C43.52 95.37 41.86 94.84 40.31 94.11C38.76 93.38 37.24 92.49 35.86 91.46C34.48 90.44 33.2 89.22 32.04 87.96C30.89 86.69 29.86 85.28 28.92 83.85C27.98 82.42 27.15 80.92 26.4 79.4C25.65 77.88 24.99 76.32 24.42 74.74C23.84 73.16 23.35 71.55 22.95 69.93C22.54 68.31 22.24 66.66 22 65C21.76 63.35 21.6 61.68 21.52 60C21.43 58.32 21.4 56.63 21.47 54.93C21.55 53.23 21.67 51.5 21.97 49.81C22.27 48.12 22.67 46.4 23.26 44.78C23.86 43.17 24.63 41.57 25.55 40.11C26.48 38.66 27.61 37.3 28.8 36.06C29.99 34.82 31.34 33.72 32.68 32.68C34.01 31.63 35.42 30.71 36.81 29.78C38.2 28.86 39.6 27.98 41.02 27.12C42.44 26.27 43.86 25.4 45.35 24.64C46.84 23.87 48.37 23.12 49.96 22.53C51.55 21.94 53.2 21.43 54.88 21.09C56.55 20.76 58.29 20.57 60 20.53C61.71 20.49 63.46 20.6 65.16 20.84C66.85 21.08 68.56 21.46 70.19 21.96C71.83 22.46 73.44 23.1 74.98 23.85C76.51 24.59 77.99 25.48 79.38 26.43C80.78 27.38 82.09 28.46 83.36 29.56C84.62 30.66 85.8 31.84 86.97 33.03C88.14 34.22 89.26 35.44 90.37 36.7C91.47 37.96 92.58 39.24 93.59 40.61C94.59 41.98 95.6 43.4 96.41 44.92C97.22 46.43 97.94 48.05 98.43 49.7C98.92 51.35 99.23 53.1 99.35 54.82C99.48 56.54 99.37 58.3 99.19 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricOuter)\"></path></svg></span></div></div><p class=\"voice-caption\">Помощник появляется в виде светового кольца и плавно исчезает после разговора.</p><button type=\"button\" id=\"voicePreview\" class=\"voice-preview-button\">Посмотреть живое кольцо ↗</button></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-bars\"/></svg></span><span class=\"mg-copy\"><strong>Голосовая активация</strong><small>Распознавание фразы — в разработке</small></span><span class=\"voice-coming\">Скоро</span></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-purple\"><svg class=\"ico\"><use href=\"#ic-spark\"/></svg></span><span class=\"mg-copy\"><strong>Голосовые ответы</strong><small>Озвучивание после подключения голоса</small></span><span class=\"voice-coming\">Скоро</span></div><p class=\"mg-disclaimer\">Микрофон не включается автоматически. Голосовая активация потребует разрешения на доступ и работающего распознавания.</p>";
    }else if(page==='autopilot'){
      const choices=[['advertising','Реклама до 5 000 ₽'],['tools','Создание рабочих инструментов'],['prices','Изменение цен'],['spending','Новые расходы']];
      content='<div class="mg-auto-intro">✦ &nbsp; Насколько самостоятельно мне работать?</div>'+
        '<p class="mg-explain">Ты не отдаёшь контроль. Ты задаёшь границы, внутри которых я могу действовать сам.</p>'+
        '<label class="mg-field">Уровень самостоятельности<input id="mgAutonomy" type="range" min="0" max="2" step="1" value="'+Number(mgData.autonomy)+'"><span id="mgAutonomyLabel"></span></label>'+
        '<h2>Правила</h2>'+choices.map(([key,label])=>'<label class="mg-choice">'+label+'<input type="checkbox" data-mg-rule="'+key+'" '+(mgData.rules[key]?'checked':'')+'></label>').join('')+
        '<p class="mg-disclaimer">Настройки — прототип. Они пока не разрешают реальных платежей, отправки сообщений или других действий.</p>';
    }else{content='<p class="mg-explain">'+mgInfo[page]+'</p><p class="mg-disclaimer">Этот раздел готовится. Подключённые данные и действия не имитируются.</p>';}
    byId('mgDetail').innerHTML=content;
    if(page==='manager')byId('mgTone').value=mgData.tone;
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
  byId('mgBack').addEventListener('click',()=>mgCurrent==='autopilot'?mgSettingsPage('manager'):(mgCurrent==='home'?setTab('home'):mgSettingsPage('home')));
  document.querySelectorAll('[data-mg-card]').forEach(el=>el.addEventListener('change',()=>{
    mgData.cards[el.dataset.mgCard]=el.checked;save();mgApplyCards();
    if(!['clients','sales','money'].includes(el.dataset.mgCard))notify('Выбор сохранён. Эта постоянная карточка появится на Главной после подключения раздела.');
  }));
  byId('mgDetail').addEventListener('click',event=>{const link=event.target.closest('[data-mg-open="autopilot"]');if(link)mgSettingsPage('autopilot');});
  byId('mgDetail').addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='voiceDock'){voicePrefs.dock=el.checked;save();updateDock();}
    else if(el.id==='mgManagerName'){mgData.managerName=el.value.trim()||'Цифровой управляющий';el.value=mgData.managerName;}
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
  function closeDockQuickActions(){byId('dockQuickActions').hidden=true;byId('dockLauncher').setAttribute('aria-expanded','false');}
  byId('dockLauncher').addEventListener('click',()=>{const el=byId('dockQuickActions');el.hidden=!el.hidden;byId('dockLauncher').setAttribute('aria-expanded',String(!el.hidden));});
  document.addEventListener('click',e=>{if(!e.target.closest('#dockHiddenControls'))closeDockQuickActions();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDockQuickActions();});
  updateDock();
  byId('dockOpenHome').addEventListener('click',()=>{closeDockQuickActions();setTab('home');});
  byId('dockOpenAssistant').addEventListener('click',()=>{closeDockQuickActions();setTab('assistant');});
  byId('dockOpenManage').addEventListener('click',()=>{closeDockQuickActions();setTab('management');});
  byId('mgDetail').addEventListener('click',event=>{if(event.target.closest('#voicePreview'))previewVoiceRing();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hideLiveRing(true);});
  window.addEventListener('pagehide',()=>hideLiveRing(true));


  // Three crisp filaments share the same traveling ripple; motion is state-aware.
  const dmRingContours = [
    { radius:53.52, amplitude:.98, offset:-.045, speed:1 },
    { radius:50.50, amplitude:1.08, offset:0, speed:1 },
    { radius:47.48, amplitude:.96, offset:.06, speed:1 },
    { radius:44.60, amplitude:1.16, offset:.95, speed:.87, echo:true },
    { radius:41.70, amplitude:1.28, offset:2.30, speed:1.09, echo:true },
    { radius:38.90, amplitude:1.15, offset:3.70, speed:.95, echo:true }
  ];
  function dmTravelingRingPath(radius, amplitude, phase, energy){
    const count=48, points=[];
    const round=x=>Math.round(x*100)/100;
    for(let i=0;i<count;i++){
      const a=Math.PI*2*i/count;
      const wave=.79*Math.sin(5*a-phase)+.18*Math.sin(8*a-phase*.94+.7)+.06*Math.sin(3*a-phase*.63+.4);
      const r=radius+amplitude*energy*wave;
      points.push({x:60+r*Math.cos(a),y:60+r*Math.sin(a)});
    }
    const p=i=>points[(i+count)%count];
    let d='M'+round(p(0).x)+' '+round(p(0).y);
    for(let i=0;i<count;i++){
      const a=p(i-1),b=p(i),c=p(i+1),n=p(i+2);
      d+='C'+round(b.x+(c.x-a.x)/6)+' '+round(b.y+(c.y-a.y)/6)
        +' '+round(c.x-(n.x-b.x)/6)+' '+round(c.y-(n.y-b.y)/6)
        +' '+round(c.x)+' '+round(c.y);
    }
    return d+'Z';
  }
  const dmMotionReduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let dmLastRingFrame=0, dmRingPhase=0;
  function dmTickRing(now){
    requestAnimationFrame(dmTickRing);
    if(document.hidden || (dmMotionReduced && dmMotionReduced.matches))return;
    if(liveRing.hidden && (tab!=='management'||mgCurrent!=='voice')){dmLastRingFrame=now;return;}
    if(now-dmLastRingFrame<33)return;
    const delta=Math.min((now-dmLastRingFrame)/1000,.07);
    dmLastRingFrame=now;
    const preview=document.querySelector('#managementScreen .voice-mock-conversation');
    const activePreview=tab==='management' && mgCurrent==='voice' && preview && preview.classList.contains('is-previewing');
    const talking=!liveRing.hidden && liveRing.dataset.mode==='speaking';
    const listening=!liveRing.hidden && liveRing.dataset.mode==='listening';
    const energy=talking||activePreview?2.7:listening?1.65:.85;
    const speed=talking||activePreview?3.4:listening?2.15:1.25;
    dmRingPhase+=delta*speed;
    document.querySelectorAll('.dm-voice-orb-electric .dm-orb-spectral').forEach(svg=>{
      if(svg.closest('#assistantLive') && liveRing.hidden)return;
      if(svg.closest('#managementScreen') && (tab!=='management'||mgCurrent!=='voice'))return;
      const contours=svg.querySelectorAll('.dm-spectral-wave');
      if(contours.length!==dmRingContours.length)return;
      dmRingContours.forEach((strand,i)=>{
        const localEnergy=strand.echo?Math.min(energy,2.25):energy;
        contours[i].setAttribute('d',dmTravelingRingPath(strand.radius,strand.amplitude,dmRingPhase*strand.speed+strand.offset,localEnergy));
      });
    });
  }
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(dmTickRing);

  // Explicitly wire every visual action; unused marketing routes remain untouched.
  document.querySelectorAll('[data-ring-preview]').forEach(b=>b.addEventListener('click',()=>setRingMode(b.dataset.ringPreview,b.dataset.ringPreview==='idle'?0:4200)));
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
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
  document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>b.dataset.detail==='advice'?adviceModal():detailModal(b.dataset.detail)));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='clients')clientsModal();else generalModal(a);}));

  byId('closeDialog').addEventListener('click',closeModal);
  byId('modal').addEventListener('click',e=>{if(e.target===byId('modal'))closeModal();});
  document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>chat(b.dataset.question)));
  byId('chatForm').addEventListener('submit',e=>{e.preventDefault();const i=byId('chatInput');const q=i.value.trim();if(!q)return;chat(q);i.value='';});
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
