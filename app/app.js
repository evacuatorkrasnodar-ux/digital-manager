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
      content="<div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-grid\"/></svg></span><span class=\"mg-copy\"><strong>Показывать док</strong><small>Постоянная панель внизу экрана</small></span><label class=\"voice-switch\"><input id=\"voiceDock\" type=\"checkbox\" aria-label=\"Показывать док\"><i></i></label></div><div class=\"voice-mock voice-mock-dock-scene\" role=\"img\" aria-label=\"Предпросмотр стеклянной док-станции с центральным кольцом\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><div class=\"voice-mock-dock\"><svg class=\"voice-dock-shape\" viewBox=\"0 0 430 116\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"vDockGlass\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#1a354f\" stop-opacity=\".96\"/><stop offset=\".48\" stop-color=\"#0b1a2d\" stop-opacity=\".98\"/><stop offset=\"1\" stop-color=\"#02070e\" stop-opacity=\".98\"/></linearGradient></defs><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50V116H0Z\" fill=\"url(#vDockGlass)\"/><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50\" fill=\"none\" stroke=\"#b4d9f0\" stroke-opacity=\".75\" stroke-width=\"1.3\" vector-effect=\"non-scaling-stroke\"/></svg><div class=\"voice-dock-items\"><span>⌂<small>Главная</small></span><span>▢<small>Чат</small></span><span class=\"voice-dock-center\"><span class=\"dm-voice-orb\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i></span></span><span>▦<small>Разделы</small></span><span>▤<small>Файлы</small></span></div></div></div></div><p class=\"voice-caption\">Док обеспечивает быстрый доступ к приложению. При выключении останется только маленькая кнопка вызова навигации.</p></div><div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-purple\"><span class=\"voice-ring-icon\"></span></span><span class=\"mg-copy\"><strong>Во время разговора</strong><small>Нежное кольцо без логотипа</small></span></div><div class=\"voice-mock voice-mock-conversation\" role=\"img\" aria-label=\"Предпросмотр светящегося кольца без логотипа\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><svg class=\"dm-voice-waves dm-voice-waves-electric\" viewBox=\"0 0 400 125\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectric0\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#4ca4ff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#4ca4ff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#8577ef\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#8577ef\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric2\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#5eacff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#5eacff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric3\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#7055d9\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#7055d9\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/></linearGradient></defs><g class=\"dm-laser-track dm-electric-wave-0\"><path class=\"dm-laser-bloom\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-halo\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-core\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/></g><g class=\"dm-laser-track dm-electric-wave-1\"><path class=\"dm-laser-bloom\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-halo\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-core\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/></g><g class=\"dm-laser-track dm-electric-wave-2\"><path class=\"dm-laser-bloom\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-halo\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-core\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/></g><g class=\"dm-laser-track dm-electric-wave-3\"><path class=\"dm-laser-bloom\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-halo\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-core\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/></g></svg><span class=\"dm-voice-orb dm-voice-orb-electric\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectricOuter\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4b93ee\"/><stop offset=\".29\" stop-color=\"#b1e1ff\"/><stop offset=\".58\" stop-color=\"#5277dc\"/><stop offset=\".82\" stop-color=\"#aa7af3\"/><stop offset=\"1\" stop-color=\"#647bff\"/></linearGradient><linearGradient id=\"dmPreviewElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmPreviewElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4f91e8\"/><stop offset=\".28\" stop-color=\"#89ceff\"/><stop offset=\".59\" stop-color=\"#2d53be\"/><stop offset=\".83\" stop-color=\"#aa88f7\"/><stop offset=\"1\" stop-color=\"#6273ee\"/></linearGradient></defs><path class=\"dm-spectral-wave dm-spectral-outer\" d=\"M112.06 60C112.26 63.38 112.15 66.91 111.56 70.26C110.97 73.61 109.89 76.98 108.53 80.1C107.17 83.22 105.37 86.23 103.4 89C101.43 91.77 99.16 94.38 96.71 96.71C94.27 99.04 91.56 101.18 88.72 102.98C85.88 104.77 82.79 106.26 79.67 107.49C76.55 108.71 73.29 109.61 70.01 110.32C66.73 111.02 63.37 111.53 60 111.7C56.63 111.88 53.14 111.87 49.78 111.36C46.42 110.85 42.99 109.96 39.85 108.64C36.71 107.33 33.69 105.48 30.96 103.46C28.23 101.44 25.76 99.01 23.48 96.52C21.2 94.03 19.13 91.34 17.29 88.54C15.46 85.73 13.79 82.77 12.47 79.69C11.15 76.61 10.09 73.35 9.38 70.07C8.67 66.79 8.28 63.38 8.19 60C8.09 56.62 8.27 53.17 8.8 49.82C9.33 46.46 10.14 43.03 11.38 39.86C12.62 36.69 14.29 33.55 16.27 30.78C18.24 28.01 20.71 25.48 23.24 23.24C25.78 21 28.63 19.1 31.5 17.34C34.36 15.58 37.34 14.03 40.41 12.71C43.48 11.38 46.67 10.18 49.93 9.39C53.2 8.6 56.62 8.07 60 7.97C63.38 7.88 66.85 8.18 70.18 8.81C73.52 9.43 76.85 10.43 80 11.72C83.14 13.01 86.25 14.61 89.05 16.53C91.85 18.44 94.51 20.72 96.8 23.2C99.1 25.67 101.09 28.51 102.82 31.39C104.55 34.26 105.95 37.35 107.21 40.45C108.47 43.54 109.55 46.72 110.35 49.98C111.16 53.24 111.85 56.62 112.06 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricOuter)\"></path><path class=\"dm-spectral-wave dm-spectral-main\" d=\"M110.78 60C111.03 63.3 111.01 66.76 110.48 70.04C109.94 73.32 108.9 76.64 107.57 79.7C106.24 82.76 104.45 85.7 102.5 88.4C100.56 91.1 98.32 93.65 95.91 95.91C93.5 98.18 90.84 100.26 88.05 101.99C85.26 103.72 82.23 105.13 79.18 106.3C76.12 107.46 72.94 108.29 69.74 108.96C66.54 109.64 63.29 110.14 60 110.35C56.71 110.56 53.31 110.64 50.01 110.2C46.72 109.76 43.33 108.96 40.25 107.69C37.17 106.43 34.19 104.6 31.53 102.6C28.88 100.6 26.5 98.16 24.3 95.7C22.1 93.24 20.12 90.58 18.36 87.83C16.59 85.07 14.96 82.19 13.68 79.19C12.4 76.18 11.36 73.01 10.66 69.81C9.96 66.62 9.58 63.29 9.47 60C9.36 56.71 9.5 53.34 9.98 50.05C10.47 46.76 11.18 43.39 12.37 40.27C13.55 37.15 15.14 34.04 17.08 31.32C19.02 28.61 21.48 26.15 24 24C26.52 21.84 29.37 20.06 32.19 18.39C35.02 16.72 37.94 15.26 40.94 13.98C43.94 12.7 47.02 11.51 50.2 10.71C53.37 9.92 56.71 9.35 60 9.22C63.29 9.1 66.69 9.37 69.95 9.96C73.21 10.55 76.48 11.52 79.57 12.76C82.65 14.01 85.7 15.56 88.45 17.42C91.19 19.29 93.81 21.52 96.04 23.96C98.27 26.4 100.17 29.22 101.83 32.05C103.48 34.89 104.76 37.93 105.95 40.97C107.15 44 108.17 47.09 108.98 50.26C109.78 53.43 110.53 56.7 110.78 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricStroke)\"></path><path class=\"dm-spectral-wave dm-spectral-inner\" d=\"M109.5 60C109.71 63.22 109.66 66.57 109.14 69.77C108.61 72.97 107.63 76.21 106.35 79.2C105.07 82.19 103.36 85.07 101.48 87.71C99.6 90.36 97.42 92.86 95.08 95.08C92.74 97.3 90.15 99.34 87.43 101.05C84.71 102.75 81.75 104.16 78.76 105.3C75.78 106.44 72.65 107.25 69.53 107.89C66.4 108.53 63.21 108.98 60 109.14C56.79 109.31 53.48 109.33 50.28 108.88C47.07 108.43 43.78 107.65 40.77 106.43C37.76 105.22 34.84 103.49 32.22 101.57C29.61 99.65 27.24 97.31 25.08 94.92C22.91 92.53 20.97 89.93 19.24 87.23C17.51 84.54 15.94 81.7 14.7 78.76C13.46 75.82 12.46 72.72 11.79 69.59C11.12 66.46 10.77 63.21 10.68 60C10.59 56.79 10.77 53.51 11.26 50.3C11.75 47.1 12.48 43.83 13.63 40.79C14.78 37.75 16.32 34.72 18.18 32.06C20.05 29.4 22.39 26.96 24.82 24.82C27.25 22.69 30.02 20.89 32.77 19.25C35.53 17.61 38.4 16.19 41.34 14.96C44.29 13.73 47.32 12.61 50.43 11.86C53.53 11.12 56.79 10.59 60 10.48C63.21 10.38 66.52 10.64 69.7 11.22C72.88 11.8 76.07 12.74 79.08 13.95C82.08 15.16 85.06 16.67 87.74 18.48C90.43 20.29 93 22.44 95.2 24.8C97.4 27.16 99.3 29.89 100.93 32.65C102.57 35.41 103.86 38.38 105.01 41.35C106.17 44.33 107.14 47.37 107.88 50.48C108.63 53.58 109.29 56.78 109.5 60Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricInner)\"></path></svg></span></div></div><p class=\"voice-caption\">Помощник появляется в виде светового кольца и плавно исчезает после разговора.</p><button type=\"button\" id=\"voicePreview\" class=\"voice-preview-button\">Посмотреть живое кольцо ↗</button></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-bars\"/></svg></span><span class=\"mg-copy\"><strong>Голосовая активация</strong><small>Распознавание фразы — в разработке</small></span><span class=\"voice-coming\">Скоро</span></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-purple\"><svg class=\"ico\"><use href=\"#ic-spark\"/></svg></span><span class=\"mg-copy\"><strong>Голосовые ответы</strong><small>Озвучивание после подключения голоса</small></span><span class=\"voice-coming\">Скоро</span></div><p class=\"mg-disclaimer\">Микрофон не включается автоматически. Голосовая активация потребует разрешения на доступ и работающего распознавания.</p>";
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


  // A real traveling ripple along one unified three-filament ring.
  // SVG SMIL path morphing is not reliable in dynamically injected settings HTML.
  const dmRingContours = [
    { radius:51.9, amplitude:.88, phase:0 },
    { radius:50.7, amplitude:1.08, phase:.12 },
    { radius:49.5, amplitude:.90, phase:.21 }
  ];
  function dmTravelingRingPath(radius, amplitude, phase){
    const count=32, tau=Math.PI*2, points=[];
    const round=x=>Math.round(x*100)/100;
    for(let i=0;i<count;i++){
      const angle=tau*i/count;
      const wave=.70*Math.sin(4*angle-phase)+.23*Math.sin(7*angle-phase*.92+.64)+.07*Math.sin(2*angle+phase*.31+.6);
      const r=radius+amplitude*wave;
      points.push({x:60+r*Math.cos(angle),y:60+r*Math.sin(angle)});
    }
    const p=i=>points[(i+count)%count];
    let d='M'+round(p(0).x)+' '+round(p(0).y);
    for(let i=0;i<count;i++){
      const a=p(i-1),b=p(i),c=p(i+1),next=p(i+2);
      d+='C'+round(b.x+(c.x-a.x)/6)+' '+round(b.y+(c.y-a.y)/6)
          +' '+round(c.x-(next.x-b.x)/6)+' '+round(c.y-(next.y-b.y)/6)
          +' '+round(c.x)+' '+round(c.y);
    }
    return d+'Z';
  }
  const dmMotionReduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let dmLastRingFrame=0;
  function dmTickRing(now){
    requestAnimationFrame(dmTickRing);
    if(document.hidden || (dmMotionReduced && dmMotionReduced.matches) || now-dmLastRingFrame<33)return;
    if(liveRing.hidden && (tab!=='management'||mgCurrent!=='voice'))return;
    dmLastRingFrame=now;
    const phase=now*.001*1.85;
    document.querySelectorAll('.dm-voice-orb-electric .dm-orb-spectral').forEach(svg=>{
      if(svg.closest('#assistantLive') && liveRing.hidden)return;
      if(svg.closest('#managementScreen') && (tab!=='management'||mgCurrent!=='voice'))return;
      const three=svg.querySelectorAll('.dm-spectral-wave');
      if(three.length!==3)return;
      dmRingContours.forEach((layer,i)=>{
        three[i].setAttribute('d',dmTravelingRingPath(layer.radius,layer.amplitude,phase+layer.phase));
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
