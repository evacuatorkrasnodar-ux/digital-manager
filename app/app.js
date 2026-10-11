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
      content="<div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-grid\"/></svg></span><span class=\"mg-copy\"><strong>Показывать док</strong><small>Постоянная панель внизу экрана</small></span><label class=\"voice-switch\"><input id=\"voiceDock\" type=\"checkbox\" aria-label=\"Показывать док\"><i></i></label></div><div class=\"voice-mock voice-mock-dock-scene\" role=\"img\" aria-label=\"Предпросмотр стеклянной док-станции с центральным кольцом\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><div class=\"voice-mock-dock\"><svg class=\"voice-dock-shape\" viewBox=\"0 0 430 116\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"vDockGlass\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#1a354f\" stop-opacity=\".96\"/><stop offset=\".48\" stop-color=\"#0b1a2d\" stop-opacity=\".98\"/><stop offset=\"1\" stop-color=\"#02070e\" stop-opacity=\".98\"/></linearGradient></defs><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50V116H0Z\" fill=\"url(#vDockGlass)\"/><path d=\"M0 50C0 30 36 16 94 16H133C170 16 183 8 198 -1C209 -8 221 -8 232 -1C247 8 260 16 297 16H336C394 16 430 30 430 50\" fill=\"none\" stroke=\"#b4d9f0\" stroke-opacity=\".75\" stroke-width=\"1.3\" vector-effect=\"non-scaling-stroke\"/></svg><div class=\"voice-dock-items\"><span>⌂<small>Главная</small></span><span>▢<small>Чат</small></span><span class=\"voice-dock-center\"><span class=\"dm-voice-orb\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i></span></span><span>▦<small>Разделы</small></span><span>▤<small>Файлы</small></span></div></div></div></div><p class=\"voice-caption\">Док обеспечивает быстрый доступ к приложению. При выключении останется только маленькая кнопка вызова навигации.</p></div><div class=\"voice-pref\"><div class=\"voice-setting-top\"><span class=\"mg-icon mg-purple\"><span class=\"voice-ring-icon\"></span></span><span class=\"mg-copy\"><strong>Во время разговора</strong><small>Нежное кольцо без логотипа</small></span></div><div class=\"voice-mock voice-mock-conversation\" role=\"img\" aria-label=\"Предпросмотр светящегося кольца без логотипа\"><div class=\"voice-scene\"></div><div class=\"voice-phone-frame\"><svg class=\"dm-voice-waves dm-voice-waves-electric\" viewBox=\"0 0 400 125\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectric0\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#4ca4ff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#4ca4ff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#8577ef\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#8577ef\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric2\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#5eacff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#5eacff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmPreviewElectric3\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#7055d9\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#7055d9\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/></linearGradient></defs><g class=\"dm-laser-track dm-electric-wave-0\"><path class=\"dm-laser-bloom\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-halo\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/><path class=\"dm-laser-core\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmPreviewElectric0)\"/></g><g class=\"dm-laser-track dm-electric-wave-1\"><path class=\"dm-laser-bloom\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-halo\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/><path class=\"dm-laser-core\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmPreviewElectric1)\"/></g><g class=\"dm-laser-track dm-electric-wave-2\"><path class=\"dm-laser-bloom\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-halo\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/><path class=\"dm-laser-core\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmPreviewElectric2)\"/></g><g class=\"dm-laser-track dm-electric-wave-3\"><path class=\"dm-laser-bloom\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-halo\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/><path class=\"dm-laser-core\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmPreviewElectric3)\"/></g></svg><span class=\"dm-voice-orb dm-voice-orb-electric\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmPreviewElectricOuter\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4b93ee\"/><stop offset=\".29\" stop-color=\"#b1e1ff\"/><stop offset=\".58\" stop-color=\"#5277dc\"/><stop offset=\".82\" stop-color=\"#aa7af3\"/><stop offset=\"1\" stop-color=\"#647bff\"/></linearGradient><linearGradient id=\"dmPreviewElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmPreviewElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4f91e8\"/><stop offset=\".28\" stop-color=\"#89ceff\"/><stop offset=\".59\" stop-color=\"#2d53be\"/><stop offset=\".83\" stop-color=\"#aa88f7\"/><stop offset=\"1\" stop-color=\"#6273ee\"/></linearGradient></defs><path class=\"dm-spectral-wave dm-spectral-outer\" d=\"M113.35 60.00C113.59 64.60 113.26 69.47 112.19 73.98C111.11 78.49 109.25 83.07 106.88 87.07C104.51 91.06 101.38 94.87 97.96 97.96C94.53 101.05 90.41 103.56 86.33 105.60C82.24 107.64 77.84 109.05 73.45 110.21C69.07 111.37 64.55 112.33 60.00 112.56C55.45 112.79 50.63 112.63 46.18 111.57C41.74 110.51 37.29 108.52 33.33 106.19C29.37 103.86 25.69 100.83 22.41 97.59C19.14 94.35 16.02 90.71 13.67 86.75C11.32 82.79 9.40 78.31 8.31 73.85C7.23 69.39 6.96 64.57 7.14 60.00C7.33 55.43 8.17 50.81 9.41 46.45C10.66 42.08 12.42 37.78 14.62 33.80C16.82 29.82 19.52 26.00 22.59 22.59C25.67 19.18 29.17 15.87 33.06 13.34C36.95 10.82 41.43 8.61 45.92 7.45C50.41 6.28 55.38 6.07 60.00 6.36C64.62 6.65 69.24 7.82 73.62 9.18C77.99 10.54 82.33 12.25 86.26 14.51C90.20 16.77 94.06 19.55 97.24 22.76C100.42 25.98 103.11 29.87 105.35 33.82C107.60 37.76 109.38 42.05 110.71 46.41C112.05 50.78 113.10 55.40 113.35 60.00Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricOuter)\"><animate attributeName=\"d\" dur=\"10.4s\" values=\"M113.35 60.00C113.59 64.60 113.26 69.47 112.19 73.98C111.11 78.49 109.25 83.07 106.88 87.07C104.51 91.06 101.38 94.87 97.96 97.96C94.53 101.05 90.41 103.56 86.33 105.60C82.24 107.64 77.84 109.05 73.45 110.21C69.07 111.37 64.55 112.33 60.00 112.56C55.45 112.79 50.63 112.63 46.18 111.57C41.74 110.51 37.29 108.52 33.33 106.19C29.37 103.86 25.69 100.83 22.41 97.59C19.14 94.35 16.02 90.71 13.67 86.75C11.32 82.79 9.40 78.31 8.31 73.85C7.23 69.39 6.96 64.57 7.14 60.00C7.33 55.43 8.17 50.81 9.41 46.45C10.66 42.08 12.42 37.78 14.62 33.80C16.82 29.82 19.52 26.00 22.59 22.59C25.67 19.18 29.17 15.87 33.06 13.34C36.95 10.82 41.43 8.61 45.92 7.45C50.41 6.28 55.38 6.07 60.00 6.36C64.62 6.65 69.24 7.82 73.62 9.18C77.99 10.54 82.33 12.25 86.26 14.51C90.20 16.77 94.06 19.55 97.24 22.76C100.42 25.98 103.11 29.87 105.35 33.82C107.60 37.76 109.38 42.05 110.71 46.41C112.05 50.78 113.10 55.40 113.35 60.00Z;M113.70 60.00C113.76 64.62 113.08 69.43 111.87 73.90C110.66 78.37 108.80 82.84 106.43 86.81C104.07 90.77 101.05 94.59 97.68 97.68C94.31 100.78 90.23 103.29 86.20 105.37C82.16 107.45 77.81 108.93 73.45 110.18C69.08 111.43 64.57 112.56 60.00 112.88C55.43 113.20 50.53 113.14 46.04 112.09C41.56 111.04 37.04 109.00 33.10 106.59C29.16 104.18 25.54 100.97 22.38 97.62C19.22 94.26 16.37 90.46 14.16 86.47C11.94 82.47 10.20 78.06 9.07 73.65C7.95 69.23 7.42 64.55 7.42 60.00C7.41 55.45 7.92 50.76 9.04 46.34C10.16 41.93 11.93 37.53 14.14 33.52C16.36 29.52 19.19 25.72 22.32 22.32C25.46 18.93 29.02 15.63 32.95 13.15C36.89 10.68 41.42 8.55 45.93 7.49C50.44 6.42 55.41 6.38 60.00 6.76C64.59 7.14 69.13 8.40 73.46 9.76C77.80 11.12 82.06 12.76 86.02 14.94C89.98 17.11 93.90 19.69 97.21 22.79C100.52 25.88 103.49 29.61 105.88 33.51C108.27 37.41 110.24 41.77 111.54 46.19C112.85 50.60 113.65 55.38 113.70 60.00Z;M113.71 60.00C113.58 64.62 112.61 69.33 111.31 73.75C110.02 78.17 108.21 82.54 105.91 86.51C103.61 90.47 100.80 94.36 97.52 97.52C94.25 100.69 90.27 103.34 86.28 105.51C82.28 107.68 77.92 109.26 73.54 110.55C69.17 111.84 64.59 112.96 60.00 113.25C55.41 113.53 50.48 113.38 46.00 112.27C41.51 111.16 37.01 109.06 33.10 106.59C29.19 104.13 25.62 100.86 22.53 97.47C19.45 94.07 16.76 90.20 14.60 86.21C12.44 82.22 10.76 77.88 9.56 73.52C8.35 69.15 7.54 64.56 7.36 60.00C7.17 55.44 7.40 50.65 8.44 46.18C9.48 41.72 11.32 37.22 13.61 33.22C15.90 29.22 18.94 25.49 22.18 22.18C25.42 18.87 29.08 15.71 33.06 13.34C37.04 10.96 41.55 8.94 46.05 7.92C50.54 6.90 55.44 6.85 60.00 7.20C64.56 7.54 69.07 8.69 73.40 9.98C77.74 11.27 82.01 12.84 86.01 14.95C90.00 17.06 93.98 19.58 97.38 22.62C100.77 25.67 103.92 29.32 106.37 33.23C108.82 37.13 110.87 41.58 112.09 46.04C113.31 50.50 113.84 55.38 113.71 60.00Z;M113.35 60.00C113.59 64.60 113.26 69.47 112.19 73.98C111.11 78.49 109.25 83.07 106.88 87.07C104.51 91.06 101.38 94.87 97.96 97.96C94.53 101.05 90.41 103.56 86.33 105.60C82.24 107.64 77.84 109.05 73.45 110.21C69.07 111.37 64.55 112.33 60.00 112.56C55.45 112.79 50.63 112.63 46.18 111.57C41.74 110.51 37.29 108.52 33.33 106.19C29.37 103.86 25.69 100.83 22.41 97.59C19.14 94.35 16.02 90.71 13.67 86.75C11.32 82.79 9.40 78.31 8.31 73.85C7.23 69.39 6.96 64.57 7.14 60.00C7.33 55.43 8.17 50.81 9.41 46.45C10.66 42.08 12.42 37.78 14.62 33.80C16.82 29.82 19.52 26.00 22.59 22.59C25.67 19.18 29.17 15.87 33.06 13.34C36.95 10.82 41.43 8.61 45.92 7.45C50.41 6.28 55.38 6.07 60.00 6.36C64.62 6.65 69.24 7.82 73.62 9.18C77.99 10.54 82.33 12.25 86.26 14.51C90.20 16.77 94.06 19.55 97.24 22.76C100.42 25.98 103.11 29.87 105.35 33.82C107.60 37.76 109.38 42.05 110.71 46.41C112.05 50.78 113.10 55.40 113.35 60.00Z\" keyTimes=\"0;.333;.667;1\" calcMode=\"spline\" keySplines=\".42 0 .58 1;.42 0 .58 1;.42 0 .58 1\" repeatCount=\"indefinite\"/></path><path class=\"dm-spectral-wave dm-spectral-main\" d=\"M111.04 60.00C111.32 64.39 111.04 69.08 110.01 73.40C108.98 77.72 107.17 82.11 104.87 85.90C102.56 89.70 99.50 93.30 96.18 96.18C92.86 99.06 88.84 101.31 84.92 103.16C81.00 105.02 76.84 106.23 72.68 107.33C68.53 108.43 64.31 109.45 60.00 109.75C55.69 110.05 51.08 110.07 46.84 109.12C42.60 108.17 38.35 106.26 34.57 104.05C30.79 101.84 27.29 98.93 24.15 95.85C21.01 92.77 17.98 89.34 15.72 85.57C13.46 81.80 11.61 77.50 10.59 73.24C9.58 68.98 9.41 64.35 9.63 60.00C9.85 55.65 10.71 51.26 11.92 47.12C13.14 42.97 14.83 38.90 16.92 35.13C19.00 31.35 21.55 27.72 24.45 24.45C27.35 21.18 30.62 17.93 34.30 15.49C37.98 13.04 42.26 10.86 46.54 9.77C50.83 8.69 55.61 8.62 60.00 8.97C64.39 9.32 68.74 10.57 72.89 11.90C77.04 13.22 81.14 14.77 84.89 16.89C88.64 19.01 92.35 21.57 95.40 24.60C98.44 27.63 100.99 31.35 103.15 35.09C105.31 38.83 107.03 42.89 108.35 47.05C109.66 51.20 110.77 55.61 111.04 60.00Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricStroke)\"><animate attributeName=\"d\" dur=\"9.5s\" values=\"M111.04 60.00C111.32 64.39 111.04 69.08 110.01 73.40C108.98 77.72 107.17 82.11 104.87 85.90C102.56 89.70 99.50 93.30 96.18 96.18C92.86 99.06 88.84 101.31 84.92 103.16C81.00 105.02 76.84 106.23 72.68 107.33C68.53 108.43 64.31 109.45 60.00 109.75C55.69 110.05 51.08 110.07 46.84 109.12C42.60 108.17 38.35 106.26 34.57 104.05C30.79 101.84 27.29 98.93 24.15 95.85C21.01 92.77 17.98 89.34 15.72 85.57C13.46 81.80 11.61 77.50 10.59 73.24C9.58 68.98 9.41 64.35 9.63 60.00C9.85 55.65 10.71 51.26 11.92 47.12C13.14 42.97 14.83 38.90 16.92 35.13C19.00 31.35 21.55 27.72 24.45 24.45C27.35 21.18 30.62 17.93 34.30 15.49C37.98 13.04 42.26 10.86 46.54 9.77C50.83 8.69 55.61 8.62 60.00 8.97C64.39 9.32 68.74 10.57 72.89 11.90C77.04 13.22 81.14 14.77 84.89 16.89C88.64 19.01 92.35 21.57 95.40 24.60C98.44 27.63 100.99 31.35 103.15 35.09C105.31 38.83 107.03 42.89 108.35 47.05C109.66 51.20 110.77 55.61 111.04 60.00Z;M111.43 60.00C111.47 64.42 110.76 69.02 109.56 73.28C108.37 77.54 106.56 81.80 104.27 85.56C101.98 89.31 99.07 92.93 95.82 95.82C92.57 98.71 88.62 100.98 84.77 102.90C80.91 104.82 76.81 106.12 72.68 107.33C68.55 108.55 64.34 109.77 60.00 110.18C55.66 110.58 50.95 110.70 46.67 109.76C42.38 108.82 38.05 106.85 34.29 104.54C30.53 102.23 27.11 99.11 24.11 95.89C21.12 92.67 18.41 89.04 16.31 85.22C14.21 81.41 12.57 77.20 11.51 72.99C10.45 68.79 9.96 64.33 9.95 60.00C9.94 55.67 10.39 51.19 11.46 46.99C12.52 42.79 14.23 38.60 16.34 34.79C18.46 30.99 21.17 27.39 24.14 24.14C27.12 20.89 30.46 17.69 34.20 15.31C37.93 12.93 42.27 10.84 46.57 9.87C50.87 8.89 55.64 9.01 60.00 9.46C64.36 9.90 68.61 11.24 72.71 12.55C76.82 13.87 80.84 15.35 84.62 17.35C88.41 19.36 92.21 21.70 95.41 24.59C98.61 27.48 101.50 31.00 103.83 34.70C106.15 38.39 108.08 42.56 109.35 46.78C110.62 50.99 111.40 55.58 111.43 60.00Z;M111.39 60.00C111.20 64.41 110.14 68.89 108.84 73.09C107.55 77.28 105.81 81.42 103.61 85.18C101.41 88.93 98.75 92.64 95.63 95.63C92.51 98.61 88.68 101.06 84.88 103.09C81.07 105.12 76.96 106.55 72.81 107.81C68.67 109.07 64.37 110.28 60.00 110.64C55.63 111.00 50.90 110.99 46.61 109.97C42.32 108.95 38.01 106.91 34.29 104.54C30.57 102.16 27.20 98.98 24.29 95.71C21.38 92.44 18.87 88.73 16.83 84.92C14.80 81.11 13.24 76.99 12.08 72.84C10.92 68.69 10.09 64.34 9.87 60.00C9.65 55.66 9.76 51.06 10.74 46.80C11.71 42.54 13.51 38.24 15.72 34.43C17.93 30.63 20.89 27.14 24.00 24.00C27.10 20.85 30.56 17.83 34.35 15.57C38.13 13.30 42.44 11.35 46.71 10.42C50.99 9.48 55.68 9.57 60.00 9.97C64.32 10.36 68.55 11.54 72.66 12.77C76.76 13.99 80.81 15.38 84.64 17.31C88.47 19.25 92.34 21.52 95.64 24.36C98.93 27.20 102.03 30.65 104.42 34.35C106.81 38.06 108.83 42.33 109.99 46.60C111.15 50.88 111.58 55.59 111.39 60.00Z;M111.04 60.00C111.32 64.39 111.04 69.08 110.01 73.40C108.98 77.72 107.17 82.11 104.87 85.90C102.56 89.70 99.50 93.30 96.18 96.18C92.86 99.06 88.84 101.31 84.92 103.16C81.00 105.02 76.84 106.23 72.68 107.33C68.53 108.43 64.31 109.45 60.00 109.75C55.69 110.05 51.08 110.07 46.84 109.12C42.60 108.17 38.35 106.26 34.57 104.05C30.79 101.84 27.29 98.93 24.15 95.85C21.01 92.77 17.98 89.34 15.72 85.57C13.46 81.80 11.61 77.50 10.59 73.24C9.58 68.98 9.41 64.35 9.63 60.00C9.85 55.65 10.71 51.26 11.92 47.12C13.14 42.97 14.83 38.90 16.92 35.13C19.00 31.35 21.55 27.72 24.45 24.45C27.35 21.18 30.62 17.93 34.30 15.49C37.98 13.04 42.26 10.86 46.54 9.77C50.83 8.69 55.61 8.62 60.00 8.97C64.39 9.32 68.74 10.57 72.89 11.90C77.04 13.22 81.14 14.77 84.89 16.89C88.64 19.01 92.35 21.57 95.40 24.60C98.44 27.63 100.99 31.35 103.15 35.09C105.31 38.83 107.03 42.89 108.35 47.05C109.66 51.20 110.77 55.61 111.04 60.00Z\" keyTimes=\"0;.333;.667;1\" calcMode=\"spline\" keySplines=\".42 0 .58 1;.42 0 .58 1;.42 0 .58 1\" repeatCount=\"indefinite\"/></path><path class=\"dm-spectral-wave dm-spectral-inner\" d=\"M108.50 60.00C108.68 64.17 108.30 68.59 107.27 72.67C106.24 76.74 104.52 80.86 102.34 84.44C100.16 88.03 97.31 91.44 94.20 94.20C91.09 96.97 87.37 99.19 83.68 101.02C80.00 102.85 76.05 104.12 72.11 105.18C68.16 106.25 64.10 107.17 60.00 107.42C55.90 107.67 51.53 107.60 47.49 106.68C43.46 105.76 39.41 104.00 35.80 101.91C32.19 99.82 28.84 97.08 25.86 94.14C22.88 91.20 20.06 87.88 17.93 84.29C15.81 80.69 14.09 76.61 13.11 72.56C12.13 68.52 11.88 64.14 12.06 60.00C12.23 55.86 12.99 51.66 14.14 47.71C15.29 43.76 16.93 39.88 18.94 36.29C20.96 32.71 23.43 29.29 26.23 26.23C29.02 23.17 32.19 20.19 35.71 17.93C39.22 15.66 43.26 13.68 47.31 12.63C51.36 11.59 55.84 11.41 60.00 11.66C64.16 11.92 68.32 12.96 72.28 14.16C76.24 15.36 80.17 16.85 83.75 18.86C87.33 20.87 90.87 23.33 93.79 26.21C96.71 29.09 99.21 32.60 101.28 36.16C103.35 39.73 105.01 43.65 106.21 47.62C107.41 51.59 108.33 55.83 108.50 60.00Z\" fill=\"none\" stroke=\"url(#dmPreviewElectricInner)\"><animate attributeName=\"d\" dur=\"11.2s\" values=\"M108.50 60.00C108.68 64.17 108.30 68.59 107.27 72.67C106.24 76.74 104.52 80.86 102.34 84.44C100.16 88.03 97.31 91.44 94.20 94.20C91.09 96.97 87.37 99.19 83.68 101.02C80.00 102.85 76.05 104.12 72.11 105.18C68.16 106.25 64.10 107.17 60.00 107.42C55.90 107.67 51.53 107.60 47.49 106.68C43.46 105.76 39.41 104.00 35.80 101.91C32.19 99.82 28.84 97.08 25.86 94.14C22.88 91.20 20.06 87.88 17.93 84.29C15.81 80.69 14.09 76.61 13.11 72.56C12.13 68.52 11.88 64.14 12.06 60.00C12.23 55.86 12.99 51.66 14.14 47.71C15.29 43.76 16.93 39.88 18.94 36.29C20.96 32.71 23.43 29.29 26.23 26.23C29.02 23.17 32.19 20.19 35.71 17.93C39.22 15.66 43.26 13.68 47.31 12.63C51.36 11.59 55.84 11.41 60.00 11.66C64.16 11.92 68.32 12.96 72.28 14.16C76.24 15.36 80.17 16.85 83.75 18.86C87.33 20.87 90.87 23.33 93.79 26.21C96.71 29.09 99.21 32.60 101.28 36.16C103.35 39.73 105.01 43.65 106.21 47.62C107.41 51.59 108.33 55.83 108.50 60.00Z;M108.74 60.00C108.74 64.19 108.03 68.54 106.89 72.56C105.74 76.59 104.02 80.60 101.86 84.17C99.70 87.73 96.98 91.15 93.93 93.93C90.89 96.72 87.22 98.97 83.59 100.86C79.95 102.74 76.05 104.09 72.12 105.24C68.19 106.39 64.13 107.45 60.00 107.77C55.87 108.09 51.43 108.08 47.36 107.16C43.30 106.25 39.18 104.43 35.60 102.27C32.01 100.10 28.71 97.20 25.84 94.16C22.97 91.12 20.39 87.66 18.39 84.03C16.38 80.39 14.82 76.38 13.80 72.38C12.79 68.37 12.30 64.13 12.30 60.00C12.30 55.87 12.76 51.61 13.79 47.62C14.83 43.63 16.48 39.65 18.51 36.05C20.55 32.45 23.15 29.05 26.01 26.01C28.86 22.97 32.09 20.03 35.64 17.81C39.20 15.60 43.27 13.69 47.33 12.72C51.39 11.76 55.86 11.70 60.00 12.02C64.14 12.33 68.23 13.42 72.16 14.61C76.09 15.80 79.97 17.23 83.58 19.16C87.19 21.09 90.79 23.39 93.82 26.18C96.86 28.96 99.61 32.33 101.79 35.87C103.98 39.41 105.78 43.40 106.94 47.42C108.10 51.44 108.75 55.81 108.74 60.00Z;M108.67 60.00C108.49 64.18 107.54 68.43 106.32 72.41C105.10 76.39 103.45 80.31 101.36 83.88C99.27 87.44 96.74 90.94 93.80 93.80C90.85 96.66 87.28 99.06 83.69 101.03C80.09 103.00 76.18 104.45 72.23 105.64C68.28 106.82 64.15 107.86 60.00 108.14C55.85 108.42 51.39 108.30 47.32 107.31C43.26 106.33 39.16 104.47 35.61 102.25C32.05 100.04 28.78 97.10 25.98 94.02C23.17 90.95 20.73 87.43 18.77 83.80C16.81 80.18 15.31 76.23 14.22 72.27C13.13 68.30 12.40 64.13 12.24 60.00C12.08 55.87 12.29 51.51 13.27 47.48C14.24 43.44 15.96 39.38 18.06 35.79C20.17 32.19 22.97 28.88 25.92 25.92C28.87 22.96 32.18 20.15 35.77 18.02C39.35 15.89 43.40 14.08 47.44 13.14C51.48 12.19 55.88 12.11 60.00 12.37C64.12 12.63 68.20 13.60 72.13 14.72C76.07 15.84 79.97 17.21 83.62 19.09C87.26 20.97 90.90 23.24 94.00 26.00C97.10 28.75 99.99 32.07 102.22 35.62C104.45 39.18 106.30 43.24 107.37 47.31C108.45 51.37 108.85 55.82 108.67 60.00Z;M108.50 60.00C108.68 64.17 108.30 68.59 107.27 72.67C106.24 76.74 104.52 80.86 102.34 84.44C100.16 88.03 97.31 91.44 94.20 94.20C91.09 96.97 87.37 99.19 83.68 101.02C80.00 102.85 76.05 104.12 72.11 105.18C68.16 106.25 64.10 107.17 60.00 107.42C55.90 107.67 51.53 107.60 47.49 106.68C43.46 105.76 39.41 104.00 35.80 101.91C32.19 99.82 28.84 97.08 25.86 94.14C22.88 91.20 20.06 87.88 17.93 84.29C15.81 80.69 14.09 76.61 13.11 72.56C12.13 68.52 11.88 64.14 12.06 60.00C12.23 55.86 12.99 51.66 14.14 47.71C15.29 43.76 16.93 39.88 18.94 36.29C20.96 32.71 23.43 29.29 26.23 26.23C29.02 23.17 32.19 20.19 35.71 17.93C39.22 15.66 43.26 13.68 47.31 12.63C51.36 11.59 55.84 11.41 60.00 11.66C64.16 11.92 68.32 12.96 72.28 14.16C76.24 15.36 80.17 16.85 83.75 18.86C87.33 20.87 90.87 23.33 93.79 26.21C96.71 29.09 99.21 32.60 101.28 36.16C103.35 39.73 105.01 43.65 106.21 47.62C107.41 51.59 108.33 55.83 108.50 60.00Z\" keyTimes=\"0;.333;.667;1\" calcMode=\"spline\" keySplines=\".42 0 .58 1;.42 0 .58 1;.42 0 .58 1\" repeatCount=\"indefinite\"/></path></svg></span></div></div><p class=\"voice-caption\">Помощник появляется в виде светового кольца и плавно исчезает после разговора.</p><button type=\"button\" id=\"voicePreview\" class=\"voice-preview-button\">Посмотреть живое кольцо ↗</button></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-blue\"><svg class=\"ico\"><use href=\"#ic-bars\"/></svg></span><span class=\"mg-copy\"><strong>Голосовая активация</strong><small>Распознавание фразы — в разработке</small></span><span class=\"voice-coming\">Скоро</span></div><div class=\"voice-setting-top voice-simple\"><span class=\"mg-icon mg-purple\"><svg class=\"ico\"><use href=\"#ic-spark\"/></svg></span><span class=\"mg-copy\"><strong>Голосовые ответы</strong><small>Озвучивание после подключения голоса</small></span><span class=\"voice-coming\">Скоро</span></div><p class=\"mg-disclaimer\">Микрофон не включается автоматически. Голосовая активация потребует разрешения на доступ и работающего распознавания.</p>";
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
