/* ЦИФРОВОЙ БИЗНЕС · app.js
   Логика текущей версии вынесена из HTML. */

(function(){
  const pageIds=['tasksPage','clientsPage','salesPage','financePage','promoPage'];

  function hideFullPagesOnHome(){
    if(document.body.dataset.currentSection!=='home') return;

    pageIds.forEach(id=>{
      const el=document.getElementById(id);

      if(el){
        el.classList.remove('show','home-embedded-section');
        el.style.setProperty('display','none','important');
      }
    });
  }

  const oldShow=window.showSection;

  if(typeof oldShow==='function'){
    window.showSection=function(section){
      oldShow.apply(this,arguments);

      if(section==='home'){
        setTimeout(hideFullPagesOnHome,0);
      }
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    hideFullPagesOnHome();
    setTimeout(hideFullPagesOnHome,120);
  });

  window.__hideFullPagesOnHome=hideFullPagesOnHome;
})();

function openMore(){
  document.getElementById('moreSheet').classList.add('show');
}

function closeMore(){
  document.getElementById('moreSheet').classList.remove('show');
}

function openControl(html){
  document.getElementById('controlContent').innerHTML=html;
  document.getElementById('controlOverlay').classList.add('show');
}

function closeControl(){
  document.getElementById('controlOverlay').classList.remove('show');
}

function openBusinessMemory(){
  closeMore();

  openControl(`
    <div class="control-kicker">Память бизнеса</div>

    <div class="control-title">
      Я знаю ваш бизнес.
    </div>

    <div class="control-sub">
      Не нужно каждый раз объяснять одно и то же.
      Здесь живёт контекст, который помогает мне принимать решения вместе с вами.
    </div>

    <div class="memory-list">

      <div class="memory-row">
        <span class="memory-icon">₽</span>
        <div>
          <b>Цель</b>
          <small>Расти по прибыли, а не просто по обороту.</small>
        </div>
      </div>

      <div class="memory-row">
        <span class="memory-icon">⌂</span>
        <div>
          <b>Основной канал</b>
          <small>
            Сайт приводит заявки, Telegram даёт заметную долю продаж.
          </small>
        </div>
      </div>

      <div class="memory-row">
        <span class="memory-icon">◯</span>
        <div>
          <b>Клиенты</b>
          <small>
            Важны быстрый ответ и повторный контакт после предложения.
          </small>
        </div>
      </div>

      <div class="memory-row">
        <span class="memory-icon">◇</span>
        <div>
          <b>Ваш стиль управления</b>
          <small>
            Сначала показать причину. Потом предложить действие.
            Деньги — только после подтверждения.
          </small>
        </div>
      </div>

    </div>

    <button
      class="control-action"
      onclick="closeControl();openBusinessRules()">
      Открыть правила
    </button>
  `);
}

function openBusinessRules(){
  closeMore();

  openControl(`
    <div class="control-kicker">Автоматизация</div>

    <div class="control-title">
      Я знаю, когда действовать.
    </div>

    <div class="control-sub">
      Вы задаёте границы. Я слежу за бизнесом внутри них
      и не делаю важные шаги молча.
    </div>

    <div class="rule-list">

      <div class="rule-row">
        <div>
          <b>Если клиент ждёт больше 30 минут</b>
          <small>Подготовить напоминание владельцу.</small>
        </div>
        <span class="rule-toggle">
          <i></i>
        </span>
      </div>

      <div class="rule-row">
        <div>
          <b>Если стоимость заявки выросла на 20%</b>
          <small>
            Сообщить и показать, какой канал изменился.
          </small>
        </div>
        <span class="rule-toggle">
          <i></i>
        </span>
      </div>

      <div class="rule-row">
        <div>
          <b>Если клиент готов купить</b>
          <small>Создать задачу и поднять её наверх.</small>
        </div>
        <span class="rule-toggle">
          <i></i>
        </span>
      </div>

      <div class="rule-row">
        <div>
          <b>Если действие влияет на деньги</b>
          <small>Сначала спросить вас.</small>
        </div>
        <span class="rule-toggle">
          <i></i>
        </span>
      </div>

    </div>

    <button
      class="control-action"
      onclick="closeControl();openBusinessPulse()">
      Открыть бизнес целиком
    </button>
  `);
}

function setThemeMode(mode){
  const b=document.body;

  if(mode==='dark'){
    b.classList.add('dark');
  }else{
    b.classList.remove('dark');
  }

  try{
    localStorage.setItem('db-theme',mode);
  }catch(e){}

  themeLabel();

  document.querySelectorAll('.theme-mode-btn').forEach(x=>{
    x.classList.toggle(
      'active',
      x.dataset.mode===mode
    );
  });
}

const MANAGER_COMM_KEY='db-manager-communication-v1';
const MANAGER_RULES_KEY='db-manager-rules-v1';

function getManagerCommunicationMode(){
  try{
    return localStorage.getItem(MANAGER_COMM_KEY)||'both';
  }catch(e){
    return 'both';
  }
}

function setManagerCommunicationMode(mode){
  const next=['voice','text','both'].includes(mode)
    ? mode
    : 'both';

  try{
    localStorage.setItem(MANAGER_COMM_KEY,next);
  }catch(e){}

  document
    .querySelectorAll('[data-communication-mode]')
    .forEach(b=>{
      const on=b.dataset.communicationMode===next;

      b.classList.toggle('is-active',on);
      b.setAttribute(
        'aria-pressed',
        String(on)
      );
    });
}

function getManagerRules(){
  const defaults={
    independence:true,
    money:true,
    communication:true,
    autopilot:false
  };

  try{
    const x=JSON.parse(
      localStorage.getItem(MANAGER_RULES_KEY)||'null'
    );

    return {
      ...defaults,
      ...(x&&typeof x==='object'?x:{})
    };
  }catch(e){
    return {...defaults};
  }
}

function syncManagerRuleSwitches(){
  const rules=getManagerRules();

  document
    .querySelectorAll(
      '.settings-rule-toggle[data-rule-id]'
    )
    .forEach(btn=>{
      const on=!!rules[btn.dataset.ruleId];

      btn.classList.toggle('is-on',on);

      btn.setAttribute(
        'aria-checked',
        String(on)
      );
    });
}

function toggleManagerRule(id,btn){
  const rules=getManagerRules();

  rules[id]=!rules[id];

  try{
    localStorage.setItem(
      MANAGER_RULES_KEY,
      JSON.stringify(rules)
    );
  }catch(e){}

  btn.classList.toggle(
    'is-on',
    rules[id]
  );

  btn.setAttribute(
    'aria-checked',
    String(rules[id])
  );
}

function syncManagerSettings(){
  setManagerCommunicationMode(
    getManagerCommunicationMode()
  );

  syncManagerRuleSwitches();
}

function openSettingsPanel(){
  closeMore();

  const sections=[
    {
      id:'sales',
      icon:'↗',
      title:'Продажи',
      desc:'Клиенты, заявки, сделки',
      action:"window.showSection?.('sales')"
    },
    {
      id:'finance',
      icon:'₽',
      title:'Деньги',
      desc:'Выручка, расходы, запас',
      action:"window.showSection?.('finance')"
    },
    {
      id:'clients',
      icon:'○',
      title:'Клиенты',
      desc:'Контакты и отношения',
      action:"window.showSection?.('clients')"
    },
    {
      id:'promo',
      icon:'⌁',
      title:'Продвижение',
      desc:'Реклама и каналы',
      action:"window.showSection?.('promo')"
    },
    {
      id:'evolution',
      icon:'✦',
      title:'Эволюция',
      desc:'Что управляющий уже улучшил',
      action:'openEvolution()'
    },
    {
      id:'memory',
      icon:'◉',
      title:'Память бизнеса',
      desc:'Что управляющий помнит',
      action:'openBusinessMemory()'
    },
    {
      id:'rules',
      icon:'⌁',
      title:'Правила',
      desc:'Границы самостоятельности',
      action:'openBusinessRules()'
    }
  ];

  const html=sections.map(s=>`
    <div
      class="settings-clean-row"
      data-setting-section="${s.id}">

      <button
        type="button"
        class="settings-clean-open"
        onclick="closeControl();${s.action}">

        <span class="settings-clean-icon">
          ${s.icon}
        </span>

        <span class="settings-clean-copy">
          <b>${s.title}</b>
          <small>${s.desc}</small>
        </span>

      </button>

      <button
        type="button"
        class="rule-toggle settings-rule-toggle settings-home-switch"
        data-section-id="${s.id}"
        aria-label="Показывать ${s.title} на Главной"
        aria-pressed="false">

        <i></i>

      </button>

    </div>
  `).join('');

  openControl(`
    <div class="control-kicker">
      Настройки управляющего
    </div>

    <div class="control-title">
      Настройки без путаницы.
    </div>

    <div class="control-sub">
      Здесь только то, как я работаю
      и что показываю на Главной.
    </div>

    <div class="settings-theme-box">
      <div>
        <b>Экран</b>
        <small>Светлая или тёмная тема.</small>
      </div>

      <div class="theme-mode-row">

        <button
          class="theme-mode-btn"
          data-mode="light"
          onclick="setThemeMode(&quot;light&quot;)">
          ☀ Светлая
        </button>

        <button
          class="theme-mode-btn"
          data-mode="dark"
          onclick="setThemeMode(&quot;dark&quot;)">
          ◐ Тёмная
        </button>

      </div>
    </div>

    <div class="settings-section-title">
      1 · Как работает управляющий
    </div>

    <div class="settings-section-note">
      Здесь задаются мои границы,
      стиль общения и уровень самостоятельности.
    </div>

    <div class="rule-list settings-rules-list">

      <div class="rule-row settings-rule-row">
        <div>
          <b>Самостоятельность</b>
          <small>
            Советую → вы подтверждаете важные действия.
          </small>
        </div>

        <button
          type="button"
          class="rule-toggle settings-rule-toggle"
          data-rule-id="independence"
          role="switch"
          aria-checked="true"
          aria-label="Самостоятельность">

          <i></i>

        </button>
      </div>

      <div class="rule-row settings-rule-row">
        <div>
          <b>Деньги</b>
          <small>
            Расходы и изменения бюджета —
            сначала спросить вас.
          </small>
        </div>

        <button
          type="button"
          class="rule-toggle settings-rule-toggle"
          data-rule-id="money"
          role="switch"
          aria-checked="true"
          aria-label="Деньги">

          <i></i>

        </button>
      </div>

      <div class="rule-row settings-rule-row">
        <div>
          <b>Общение</b>
          <small>
            Коротко, спокойно и по делу.
            Юмор — когда всё спокойно.
          </small>
        </div>

        <button
          type="button"
          class="rule-toggle settings-rule-toggle"
          data-rule-id="communication"
          role="switch"
          aria-checked="true"
          aria-label="Общение">

          <i></i>

        </button>
      </div>

      <div class="rule-row settings-rule-row">
        <div>
          <b>Автопилот</b>
          <small>
            Расширяет границы, когда вы готовы
            доверить мне больше.
          </small>
        </div>

        <button
          type="button"
          class="rule-toggle settings-rule-toggle"
          data-rule-id="autopilot"
          role="switch"
          aria-checked="false"
          aria-label="Автопилот">

          <i></i>

        </button>
      </div>

    </div>

    <button
      class="control-action settings-autopilot-action"
      onclick="closeControl();openAutopilot()">
      Настроить автопилот →
    </button>

    <div class="settings-section-title">
      2 · Что держать перед глазами
    </div>

    <div class="settings-section-note">
      Выбери темы, которые хочешь видеть каждый день.
      Управляющий всё равно продолжит следить
      за остальным бизнесом и поднимет важную проблему сам.
    </div>

    <div class="settings-clean-list">
      ${html}
    </div>

    <div class="settings-daily-note">
      <span>✦</span>

      <div>
        <b>Главное — под тебя</b>

        <small>
          Например: Деньги + Продажи.
          Остальное управляющий покажет сам,
          если там что-то действительно происходит.
        </small>
      </div>
    </div>

    <div class="settings-create-card">

      <div>
        <span>ДОПОЛНИТЕЛЬНО</span>
        <b>Создать новый инструмент</b>

        <small>
          Не раздел и не настройка.
          Просто скажи, чего не хватает бизнесу.
        </small>
      </div>

      <button
        type="button"
        onclick="closeControl();openBuildModal()">
        Создать →
      </button>

    </div>

    <div class="settings-section-title">
      3 · Помощь и обучение
    </div>

    <div class="rule-list settings-rules-list">

      <div class="rule-row settings-rule-row settings-hints-row">

        <div>
          <b>Подсказки</b>

          <small>
            Показывать маленькие подсказки
            по ходу работы.
          </small>
        </div>

        <button
          type="button"
          class="rule-toggle settings-rule-toggle"
          id="managerHintsToggle"
          role="switch"
          aria-checked="true"
          aria-label="Подсказки"
          onclick="event.preventDefault();event.stopPropagation();window.toggleManagerHints&&window.toggleManagerHints(this)">

          <i></i>

        </button>

      </div>

    </div>

    <div class="dm-learning-card">

      <div class="dm-learning-copy">

        <div class="dm-learning-kicker">
          Лёгкое обучение
        </div>

        <b>
          Покажу, что здесь куда.
        </b>

        <small>
          За минуту объясню Главную,
          разделы и управляющего —
          без длинной лекции.
        </small>

      </div>

      <button
        type="button"
        class="control-action dm-learning-button"
        onclick="openLightTutorial()">
        Пройти обучение →
      </button>

    </div>

    <div class="settings-company-footer settings-company-footer-v2">

      <button
        type="button"
        class="settings-company-brand settings-company-brand-button"
        onclick="openCompanySheet()"
        aria-label="Открыть информацию о компании Цифровой бизнес">

        <span class="mark dm-company-mark settings-company-logo">
          ЦБ
        </span>

        <span class="settings-company-copy">
          <b>Цифровой бизнес</b>
          <small>IT · AI · AUTOMATION</small>
        </span>

        <span class="settings-company-arrow">
          →
        </span>

      </button>

      <button
        type="button"
        class="settings-developer-link"
        onclick="openDeveloperContact()">

        <span class="settings-developer-dot"></span>

        <span>
          <b>Нашли баг или есть идея?</b>
          <small>Пожаловаться разработчикам</small>
        </span>

        <span class="settings-developer-arrow">
          →
        </span>

      </button>

    </div>
  `);

  syncSettingsHomeSwitches();
  syncManagerSettings();
}

function openDeveloperContact(){
  openControl(`
    <div class="developer-contact-shell">

      <div class="control-kicker">
        Цифровой бизнес · IT · AI · AUTOMATION
      </div>

      <div class="control-title">
        Нашли баг или есть идея?
      </div>

      <div class="control-sub">
        Пожаловаться разработчикам →
      </div>

      <div class="developer-contact-note">

        <b>Что-то пошло не так?</b>

        <span>
          Расскажи — это место именно для связи
          с командой, которая развивает
          «Цифровой управляющий».
        </span>

      </div>

      <button
        class="control-action"
        onclick="closeControl()">
        Понятно
      </button>

    </div>
  `);
}

function openBusinessPulse(){
  closeMore();
  document.getElementById('businessPulse').classList.add('show');
}

function closeBusinessPulse(){
  document.getElementById('businessPulse').classList.remove('show');
}

function closeControlAndMore(){
  closeControl();
  closeMore();
}

const body=document.body;
const theme=document.getElementById('theme');
const label=document.getElementById('themeText');

let savedTheme='light';

try{
  savedTheme=localStorage.getItem('db-theme')||'light';
}catch(e){}

if(savedTheme==='dark'){
  body.classList.add('dark');
}

const mobileThemeText=document.getElementById('mobileThemeText');
const mobileThemeToggle=document.getElementById('mobileThemeToggle');

function themeLabel(){

  const next=body.classList.contains('dark')
    ? 'Светлая'
    : 'Тёмная';

  if(label){
    label.textContent=next;
  }

  if(mobileThemeText){
    mobileThemeText.textContent=next;
  }

  if(mobileThemeToggle){
    mobileThemeToggle.setAttribute(
      'aria-label',
      'Включить '+next.toLowerCase()+' тему'
    );
  }
}

function toggleAppTheme(){

  body.classList.toggle('dark');

  try{
    localStorage.setItem(
      'db-theme',
      body.classList.contains('dark')
        ? 'dark'
        : 'light'
    );
  }catch(e){}

  themeLabel();
}

themeLabel();

document.addEventListener('click',e=>{

  if(e.target.closest('.theme-mode-btn')){

    const m=
      e.target
        .closest('.theme-mode-btn')
        .dataset.mode;

    setThemeMode(m);
  }

});

if(theme){
  theme.onclick=toggleAppTheme;
}

if(mobileThemeToggle){
  mobileThemeToggle.onclick=toggleAppTheme;
}

document
  .getElementById('askForm')
  ?.addEventListener('submit',e=>{

    e.preventDefault();

    const input=document.getElementById('askInput');

    if(input?.value.trim()){
      document
        .getElementById('reply')
        ?.classList.add('show');
    }

  });

const tasksPage=document.getElementById('tasksPage');
const clientsPage=document.getElementById('clientsPage');
const salesPage=document.getElementById('salesPage');
const financePage=document.getElementById('financePage');
const promoPage=document.getElementById('promoPage');

const homeMain=document.querySelector('main.content');

const homeSections=
  homeMain
    ? Array.from(homeMain.children)
      .filter(el=>![
        'tasksPage',
        'clientsPage',
        'salesPage',
        'financePage',
        'promoPage'
      ].includes(el.id))
    : [];

function showSection(section){

  document.body.dataset.currentSection=section;

  const pages={
    home:null,
    tasks:tasksPage,
    clients:clientsPage,
    sales:salesPage,
    finance:financePage,
    promo:promoPage
  };

  if(section==='more'){
    openMore();
    return;
  }

  const isKnown=
    Object.prototype.hasOwnProperty.call(
      pages,
      section
    );

  if(!isKnown){
    return;
  }

  const prefs=(()=>{
    try{

      const x=JSON.parse(
        localStorage.getItem(
          'db-home-section-switches-v3'
        )||'null'
      );

      return {
        sales:false,
        finance:false,
        clients:false,
        promo:false,
        ...(x&&typeof x==='object'?x:{})
      };

    }catch(e){

      return {
        sales:false,
        finance:false,
        clients:false,
        promo:false
      };

    }
  })();

  homeSections.forEach(el=>{
    el.style.display=
      section==='home'
        ? ''
        : 'none';
  });

  Object.keys(pages).forEach(key=>{

    const page=pages[key];

    if(!page){
      return;
    }

    const embedded=false;

    page.classList.toggle(
      'show',
      key===section||embedded
    );

    page.style.display=
      (key===section||embedded)
        ? 'block'
        : 'none';

    page.classList.toggle(
      'home-embedded-section',
      embedded
    );

  });

  document
    .querySelectorAll('[data-section]')
    .forEach(btn=>{

      btn.classList.toggle(
        'active',
        btn.dataset.section===section
      );

      if(
        btn.getAttribute('aria-current')!==null
      ){

        if(btn.dataset.section===section){

          btn.setAttribute(
            'aria-current',
            'page'
          );

        }else{

          btn.removeAttribute(
            'aria-current'
          );

        }

      }

    });

  document.documentElement.scrollTop=0;
  document.body.scrollTop=0;

  window.scrollTo(0,0);
}

document
  .querySelectorAll('[data-section]')
  .forEach(btn=>{

    btn.addEventListener(
      'click',
      function(e){

        e.preventDefault();
        e.stopPropagation();

        showSection(
          this.dataset.section
        );

      },
      {passive:false}
    );

  });

document
  .getElementById('tasksBack')
  ?.addEventListener(
    'click',
    ()=>showSection('home')
  );

document
  .getElementById('clientsBack')
  ?.addEventListener(
    'click',
    ()=>showSection('home')
  );

const salesAnalyze=
  document.getElementById('salesAnalyze');

const salesResult=
  document.getElementById('salesResult');

salesAnalyze?.addEventListener(
  'click',
  ()=>{

    salesAnalyze.disabled=true;

    salesAnalyze.innerHTML=
      'Проверяю клиентов…';

    setTimeout(()=>{

      salesAnalyze.innerHTML=
        'Готово ✓';

      const command=
        document.querySelector(
          '.sales-command h3'
        );

      if(command){
        command.textContent=
          'Нашёл 8 клиентов, которых можно вернуть в работу.';
      }

      const p=
        document.querySelector(
          '.sales-command p'
        );

      if(p){
        p.textContent=
          'Три клиента уже горячие. Я подготовил следующий шаг для каждого и не буду отправлять ничего без твоего подтверждения.';
      }

      const response=
        document.getElementById(
          'salesActionResponse'
        );

      if(response){

        response.innerHTML=
          '<b>Я подготовил список.</b>' +
          '<div>3 горячих клиента → ответить сегодня. ' +
          'Ещё 5 → мягкое напоминание после предложения.</div>';

      }

      document
        .getElementById('salesRecoveryBtn')
        ?.scrollIntoView({
          behavior:'smooth',
          block:'center'
        });

    },850);

  }
);

document
  .querySelectorAll('[data-funnel]')
  .forEach(btn=>{

    btn.addEventListener(
      'click',
      ()=>{

        const text=btn.dataset.funnel;

        const response=
          document.getElementById(
            'salesActionResponse'
          );

        if(response){

          response.innerHTML=
            '<b>Простыми словами.</b>' +
            '<div>Сейчас здесь <strong>'+
            text+
            '</strong>. Если хочешь, я разберу этот этап и покажу, где теряются люди.</div>';

          response.scrollIntoView({
            behavior:'smooth',
            block:'nearest'
          });

        }

      }
    );

  });

document
  .querySelectorAll('[data-sales-client]')
  .forEach(btn=>{

    btn.addEventListener(
      'click',
      ()=>{

        const type=
          btn.dataset.salesClient;

        const data={

          reply:
            'Я подготовил короткий ответ по заявке и учёл предыдущий разговор. Ничего не отправляю без твоего подтверждения.',

          remind:
            'Я подготовил мягкое напоминание без давления. Оно связано с этой сделкой и историей общения.',

          offer:
            'Я соберу предложение из запроса клиента, суммы и условий. Перед отправкой покажу тебе готовый вариант.'

        };

        btn.textContent='Готово ✓';
        btn.disabled=true;

        const response=
          document.getElementById(
            'salesActionResponse'
          );

        if(response){

          response.innerHTML=
            '<b>Цифровой управляющий</b>' +
            '<div>'+
            data[type]+
            '</div>';

        }

      }
    );

  });

document
  .getElementById('salesRecoveryBtn')
  ?.addEventListener(
    'click',
    ()=>{

      const response=
        document.getElementById(
          'salesActionResponse'
        );

      if(response){

        response.innerHTML=
          '<b>Я разобрал 8 клиентов.</b>' +
          '<div>3 — ответить сейчас, 2 — напомнить сегодня, ' +
          '3 — проверить завтра. Список готов.</div>';

      }

    }
  );

document
  .querySelectorAll('[data-sales-action]')
  .forEach(btn=>{

    btn.addEventListener(
      'click',
      ()=>{

        const response=
          document.getElementById(
            'salesActionResponse'
          );

        const type=
          btn.dataset.salesAction;

        const data={

          remind:
            'Я нашёл клиентов, которым нужен следующий контакт. Могу подготовить персональные сообщения с учётом истории общения.',

          task:
            'Создам задачи на сегодня и добавлю в каждую задачу имя клиента, сумму и последний контакт.',

          offer:
            'Подготовлю предложение для горячего клиента на основе его запроса и текущих условий продажи.'

        };

        if(response){

          response.innerHTML=
            '<b>Я подготовил действие.</b>' +
            '<div>'+
            data[type]+
            '</div>';

        }

      }
    );

  });

document
  .getElementById('salesManagerAction')
  ?.addEventListener(
    'click',
    ()=>{

      const response=
        document.getElementById(
          'salesActionResponse'
        );

      if(response){

        response.innerHTML=
          '<b>Первый шаг готов.</b>' +
          '<div>Я собрал 3 горячих клиента. ' +
          'Нажми на клиента выше — сначала подготовлю сообщение, ' +
          'затем покажу его перед отправкой.</div>';

      }

      document
        .querySelector('.sales-recovery-card')
        ?.scrollIntoView({
          behavior:'smooth',
          block:'center'
        });

    }
  );
