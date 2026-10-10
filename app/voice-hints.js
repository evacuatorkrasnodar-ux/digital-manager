/* v290 — contextual voice-dictation hints for existing, honest app workflows.
   The keyboard's dictation feature belongs to iOS/Android, not this PWA.
   No getUserMedia, Web Speech API, microphone permissions, recording, or
   automatic AI saving. Notes/memory still need deliberate user confirmation.
   One dismissible card per relevant screen, never in the pinned calendar. */
(() => {
  'use strict';
  const hints=[
    {
      id:'notebook',
      before:'#notesView .notebook-tools',
      kicker:'✦ МАЛЕНЬКИЙ ЛАЙФХАК',
      title:'Клавиатуру можно отправить в отпуск 😉',
      description:'Открой запись, нажми микрофон на клавиатуре телефона и продиктуй мысль. Проверь текст, сохрани — и он останется в твоём блокноте.',
      button:'Записать мысль',
      click:'#addNote'
    },
    {
      id:'memory',
      before:'[data-world-view="memory"] .search-wrap',
      kicker:'✦ УМНАЯ ПАМЯТЬ',
      title:'Голова — для идей. Память — для меня 😄',
      description:'Открой запись и надиктуй её через микрофон клавиатуры. После сохранения локальный помощник сможет найти эту мысль.',
      button:'Запомнить',
      click:'#addMemory'
    },
    {
      id:'world-chat',
      before:'[data-world-view="assistant"] #worldAskForm',
      kicker:'✦ РАЗГОВОР БЕЗ ПЕЧАТИ',
      title:'Шеф, пальцы тоже заслужили выходной 🎙️',
      description:'Нажми на вопрос и используй диктовку клавиатуры. Сейчас я отвечаю по локальным правилам — полноценный голосовой ИИ ещё впереди.',
      button:'Спросить помощника',
      focus:'#worldQuestion'
    },
    {
      id:'home-assistant',
      before:'#assistantScreen #chatForm',
      kicker:'✦ ПОДСКАЗКА ОТ УПРАВЛЯЮЩЕГО',
      title:'Серьёзные планы. Несерьёзно много печатать 😉',
      description:'Коснись поля вопроса и микрофона на клавиатуре телефона. Здесь ответы пока демонстрационные; голосовой помощник с автозаписью ещё не подключён.',
      button:'Задать вопрос',
      focus:'#chatInput'
    }
  ];
  const ns='http://www.w3.org/2000/svg';
  function micSvg(){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('class','dm-voice-tip__mic');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    for(const d of ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z','M5 11a7 7 0 0 0 14 0','M12 18v4','M8 22h8']){
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',d);
      svg.append(path);
    }
    return svg;
  }
  function arrowSvg(){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d','m9 5 7 7-7 7');
    svg.append(path);
    return svg;
  }
  function el(tag,className,text){
    const item=document.createElement(tag);
    if(className)item.className=className;
    if(text!==undefined)item.textContent=text;
    return item;
  }
  function present(tip){
    const mount=document.querySelector(tip.before);
    if(!mount)return;
    try{if(sessionStorage.getItem('dm-voice-hint-hidden:'+tip.id)==='1')return;}catch(_){}
    const card=el('aside','dm-voice-tip');
    card.setAttribute('aria-label','Подсказка о голосовом вводе');
    const icon=el('div','dm-voice-tip__orb');
    icon.setAttribute('aria-hidden','true');
    icon.append(micSvg());
    const wave=el('span','dm-voice-tip__wave');
    for(let i=0;i<5;i++)wave.append(el('i'));
    icon.append(wave);
    const content=el('div','dm-voice-tip__content');
    const heading=el('span','dm-voice-tip__kicker',tip.kicker);
    const title=el('strong','dm-voice-tip__title',tip.title);
    const body=el('p','dm-voice-tip__description',tip.description);
    const actions=el('div','dm-voice-tip__actions');
    const go=el('button','dm-voice-tip__go');
    go.type='button';
    go.append(document.createTextNode(tip.button));
    const lens=el('span','dm-voice-tip__chevron');
    lens.setAttribute('aria-hidden','true');
    lens.append(arrowSvg());
    go.append(lens);
    go.addEventListener('click',()=>{
      const button=tip.click&&document.querySelector(tip.click);
      const input=tip.focus&&document.querySelector(tip.focus);
      if(button)button.click();
      else if(input){
        input.focus();
        if(typeof input.scrollIntoView==='function')input.scrollIntoView({block:'nearest',behavior:'auto'});
      }
    });
    const dismiss=el('button','dm-voice-tip__dismiss','Не сейчас');
    dismiss.type='button';
    dismiss.setAttribute('aria-label','Скрыть подсказку о диктовке');
    dismiss.addEventListener('click',()=>{
      card.remove();
      try{sessionStorage.setItem('dm-voice-hint-hidden:'+tip.id,'1');}catch(_){}
    });
    actions.append(go,dismiss);
    const meta=el('small','dm-voice-tip__meta','Диктовка через клавиатуру телефона. Сохранение — только после твоего подтверждения.');
    content.append(heading,title,body,actions,meta);
    card.append(icon,content);
    mount.parentNode.insertBefore(card,mount);
  }
  function init(){for(const tip of hints)present(tip);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
