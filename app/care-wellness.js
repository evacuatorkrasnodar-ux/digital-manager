/* SEYVEO · Gentle care tools for Care; shares storage with Health.
   No system notifications, sensors, medical advice or network requests. */
(() => {
  'use strict';
  const DB = 'digital-manager-private-health-v1';
  const VERSION = 3;
  const $ = id => document.getElementById(id);
  const dateKey = () => {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
  };
  const clock = seconds => {
    const s = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const eyeSteps = [
    { duration: 20, title: 'Посмотри вдаль', hint: 'Оторвись от экрана. Найди предмет примерно в шести метрах или дальше.' },
    { duration: 15, title: 'Поморгай спокойно', hint: 'Несколько мягких морганий. Не жмурься и не напрягай глаза.' },
    { duration: 25, title: 'Близко и далеко', hint: 'Без усилий переводи взгляд с близкого предмета на далёкий.' }
  ];
  let db = null, connecting = false, busy = false, tab = '', lastWaterAdded = 0, today = dateKey();
  let water = 0, goal = 0, breathingDone = 0, eyesDone = 0, stepsRecords = [];
  let session = null, interval = null;

  function message(text) {
    const el = $('wellnessNotice');
    if (el) el.textContent = text;
  }
  function transact(mode, fn, store = 'wellness') {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error('Local health storage is not ready'));
      let t, request;
      try { t = db.transaction(store, mode); request = fn(t.objectStore(store)); }
      catch (e) { return reject(e); }
      let value;
      if (request) { request.onsuccess = () => { value = request.result; }; }
      t.oncomplete = () => resolve(value);
      t.onerror = () => reject(t.error || new Error('Storage error'));
      t.onabort = () => reject(t.error || new Error('Storage aborted'));
    });
  }
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, VERSION);
      request.onupgradeneeded = () => {
        for (const store of ['settings','meds','logs','sleep','docs','metrics','wellness']) {
          if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store,{keyPath:'id'});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Storage unavailable'));
      request.onblocked = () => reject(new Error('Storage upgrade blocked'));
    });
  }
  async function load() {
    if (!db) return;
    today = dateKey();
    const ids = ['water-' + today, 'water-goal', 'sessions-' + today];
    const rows = await Promise.all(ids.map(id => transact('readonly', s => s.get(id))));
    water = Math.max(0, Number(rows[0]?.ml) || 0);
    goal = Math.max(0, Number(rows[1]?.ml) || 0);
    breathingDone = Math.max(0, Number(rows[2]?.breathing) || 0);
    eyesDone = Math.max(0, Number(rows[2]?.eyes) || 0);
    stepsRecords = (await transact('readonly', s => s.getAll(), 'metrics')).filter(r => r.type === 'steps');
    render();
  }
  function render() {
    $('wellnessWaterValue').textContent = new Intl.NumberFormat('ru-RU').format(water) + ' мл';
    $('wellnessWaterGoal').textContent = goal ? 'Цель: ' + goal + ' мл' : 'Личная цель не задана';
    $('wellnessWaterBar').style.width = (goal ? Math.min(100, water / goal * 100) : 0) + '%';
    $('wellnessWaterBar').parentElement.setAttribute('aria-valuenow', String(goal ? Math.min(100, Math.round(water / goal * 100)) : 0));
    $('wellnessGoalInput').value = goal || '';
    $('wellnessWaterUndo').disabled = !lastWaterAdded;
    $('wellnessWaterCardMeta').textContent = water ? water + ' мл сегодня' : 'Начни с первого стакана';
    $('wellnessBreathCardMeta').textContent = breathingDone ? 'Сегодня: ' + breathingDone : '1–5 минут';
    $('wellnessEyesCardMeta').textContent = eyesDone ? 'Сегодня: ' + eyesDone : '1 минута отдыха';
    renderSteps();
  }
  async function saveWater(amount) {
    if (busy || !db || !Number.isSafeInteger(amount)) return;
    busy = true;
    try {
      if (today !== dateKey()) { lastWaterAdded = 0; await load(); }
      const current = Math.max(0, Number((await transact('readonly', s => s.get('water-' + today)))?.ml) || 0);
      const next = Math.max(0, Math.min(20000, current + amount));
      await transact('readwrite', s => s.put({ id: 'water-' + today, date: today, ml: next, updatedAt: Date.now() }));
      water = next;
      if (amount > 0) lastWaterAdded = next - current;
      else lastWaterAdded = 0;
      render();
      message(amount > 0 ? 'Вода добавлена в дневник.' : 'Последнее добавление отменено.');
    } catch (err) { console.error('Health wellness:', err); message('Не удалось сохранить воду. Проверь настройки браузера.'); }
    finally { busy = false; }
  }
  async function saveGoal() {
    const raw = $('wellnessGoalInput').value.trim();
    const amount = raw === '' ? 0 : Number(raw);
    if (busy || !db) return;
    if (!Number.isInteger(amount) || amount < 0 || (amount !== 0 && amount < 250) || amount > 6000) {
      message('Укажи личную цель от 250 до 6000 мл или оставь поле пустым.');
      return;
    }
    busy = true;
    try {
      await transact('readwrite', s => s.put({ id: 'water-goal', ml: amount, updatedAt: Date.now() }));
      goal = amount;
      render();
      message(amount ? 'Личная цель сохранена.' : 'Цель убрана. Записи воды сохранены.');
    } catch (err) { console.error('Health wellness:', err); message('Не удалось сохранить цель.'); }
    finally { busy = false; }
  }
  async function recordSession(kind) {
    try {
      if (today !== dateKey()) await load();
      const id = 'sessions-' + today;
      const prev = await transact('readonly', s => s.get(id));
      const row = {
        id, date: today, breathing: Number(prev?.breathing) || 0,
        eyes: Number(prev?.eyes) || 0, updatedAt: Date.now()
      };
      row[kind] = Math.min(999, row[kind] + 1);
      await transact('readwrite', s => s.put(row));
      breathingDone = row.breathing; eyesDone = row.eyes;
      render();
    } catch (err) { console.error('Health wellness:', err); message('Сеанс завершён, но отметку сохранить не удалось.'); }
  }
  function toggle(name) {
    if (session) stop(false);
    tab = tab === name ? '' : name;
    document.querySelectorAll('[data-wellness-open]').forEach(b => {
      const active = b.dataset.wellnessOpen === tab;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-expanded', String(active));
    });
    const detail = $('healthWellnessDetail');
    detail.hidden = !tab;
    document.querySelectorAll('[data-wellness-panel]').forEach(p => { p.hidden = p.dataset.wellnessPanel !== tab; });
    message('');
  }
  function stop(completed) {
    clearInterval(interval);
    interval = null;
    const old = session; session = null;
    if (old?.kind === 'breathing') {
      $('wellnessBreathVisual').classList.remove('is-running', 'is-inhale', 'is-exhale');
      $('wellnessBreathStart').textContent = 'Начать';
      $('wellnessBreathStop').hidden = true;
      $('wellnessBreathDuration').disabled = false;
      $('wellnessBreathStage').textContent = completed ? 'Готово. Побудь ещё немного в спокойствии.' : 'Вдох — 4 сек · выдох — 6 сек';
      $('wellnessBreathTime').textContent = completed ? '00:00' : clock(Number($('wellnessBreathDuration').value) * 60);
    }
    if (old?.kind === 'eyes') {
      $('wellnessEyeStart').textContent = 'Начать';
      $('wellnessEyeStop').hidden = true;
      $('wellnessEyeTitle').textContent = completed ? 'Готово. Глазам пора отдохнуть от экрана.' : eyeSteps[0].title;
      $('wellnessEyeHint').textContent = completed ? 'Ты завершил короткую паузу.' : eyeSteps[0].hint;
      $('wellnessEyeTime').textContent = completed ? '00:00' : '01:00';
      $('wellnessEyeProgress').style.width = completed ? '100%' : '0%';
    }
    if (completed && old) {
      message(old.kind === 'breathing' ? 'Дыхательная пауза завершена.' : 'Отдых для глаз завершён.');
      void recordSession(old.kind === 'breathing' ? 'breathing' : 'eyes');
    }
  }
  function start(kind) {
    if (session && session.kind !== kind) stop(false);
    const button = $(kind === 'breathing' ? 'wellnessBreathStart' : 'wellnessEyeStart');
    if (session?.kind === kind) {
      if (session.paused) {
        session.paused = false;
        session.last = performance.now();
        button.textContent = 'Пауза';
      } else {
        session.paused = true;
        button.textContent = 'Продолжить';
        if (kind === 'breathing') $('wellnessBreathVisual').classList.remove('is-running');
      }
      return;
    }
    const duration = kind === 'breathing' ? Number($('wellnessBreathDuration').value) * 60 : 60;
    session = { kind, total: duration, elapsed: 0, paused: false, last: performance.now() };
    button.textContent = 'Пауза';
    $(kind === 'breathing' ? 'wellnessBreathStop' : 'wellnessEyeStop').hidden = false;
    if (kind === 'breathing') $('wellnessBreathDuration').disabled = true;
    tick();
    interval = setInterval(tick, 150);
  }
  function tick() {
    if (!session || session.paused) return;
    const now = performance.now();
    session.elapsed += Math.max(0, Math.min(1, (now - session.last) / 1000));
    session.last = now;
    const remaining = session.total - session.elapsed;
    if (remaining <= 0) { stop(true); return; }
    if (session.kind === 'breathing') {
      const inhale = session.elapsed % 10 < 4;
      const visual = $('wellnessBreathVisual');
      visual.classList.add('is-running');
      visual.classList.toggle('is-inhale', inhale);
      visual.classList.toggle('is-exhale', !inhale);
      visual.style.setProperty('--breath-phase-progress', String((session.elapsed % 10) / 10));
      $('wellnessBreathStage').textContent = inhale ? 'Вдохни плавно' : 'Выдохни спокойно';
      $('wellnessBreathTime').textContent = clock(remaining);
    } else {
      let passed = session.elapsed, step = 0;
      while (step < eyeSteps.length - 1 && passed >= eyeSteps[step].duration) {
        passed -= eyeSteps[step].duration; step++;
      }
      $('wellnessEyeTitle').textContent = eyeSteps[step].title;
      $('wellnessEyeHint').textContent = eyeSteps[step].hint;
      $('wellnessEyeTime').textContent = clock(remaining);
      $('wellnessEyeProgress').style.width = Math.min(100, session.elapsed / 60 * 100) + '%';
    }
  }

  const stepsFor = day => {
    const rows = stepsRecords.filter(r => r.date === day && Number.isInteger(Number(r.steps)));
    return rows.find(r => r.source === 'manual') ||
      rows.sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0))[0] || null;
  };
  function renderSteps() {
    const record=stepsFor(today);
    $('wellnessStepsValue').textContent=record?new Intl.NumberFormat('ru-RU').format(record.steps):'—';
    $('wellnessStepsSource').textContent=record?(record.source==='manual'?'Ручная запись сегодня':'Импортированное значение'):'Нет записи на сегодня';
    $('wellnessStepsCardMeta').textContent=record?record.steps.toLocaleString('ru-RU')+' сегодня':'Сегодня: нет записи';
    const day=$('wellnessStepsDate');day.max=dateKey();
    if(!day.value||day.value>dateKey())day.value=dateKey();
    const manual=stepsRecords.find(r=>r.id==='manual:steps:'+day.value);
    if(document.activeElement!==$('wellnessStepsInput'))$('wellnessStepsInput').value=manual?.steps??'';
    $('wellnessStepsDelete').hidden=!manual;
    const host=$('wellnessStepsWeek'); host.replaceChildren();
    for(let offset=6;offset>=0;offset--){
      const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-offset);
      const key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      const row=stepsFor(key),cell=document.createElement('div'),qty=document.createElement('span'),label=document.createElement('small');
      cell.className='wellness-steps-day';cell.dataset.empty=String(!row);
      qty.textContent=row?(row.steps>=1000?(row.steps/1000).toFixed(1).replace('.',',')+'к':String(row.steps)):'—';
      label.textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'short'}).format(d);
      cell.title=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(d)+': '+(row?row.steps+' шагов':'нет записи');
      cell.append(qty,label);host.append(cell);
    }
  }
  async function saveSteps(remove=false) {
    if(!db||busy)return;
    const date=$('wellnessStepsDate').value,raw=$('wellnessStepsInput').value.trim(),n=Number(raw);
    const parsed=new Date(date+'T12:00:00');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||
       [parsed.getFullYear(),String(parsed.getMonth()+1).padStart(2,'0'),String(parsed.getDate()).padStart(2,'0')].join('-')!==date||
       date>dateKey()){message('Проверь дату.');return;}
    if(!remove&&(!/^\d{1,6}$/.test(raw)||!Number.isInteger(n)||n>200000)){message('Укажи число шагов от 0 до 200 000.');return;}
    busy=true;
    try {
      const id='manual:steps:'+date;
      const prev=await transact('readonly',s=>s.get(id),'metrics');
      if(remove){
        if(!prev)return;
        await transact('readwrite',s=>s.delete(id),'metrics');
      }else{
        const d=new Date(),time=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
        await transact('readwrite',s=>s.put({id,type:'steps',date,time,source:'manual',
          steps:n,note:prev?.note||'',updatedAt:Date.now(),createdAt:prev?.createdAt||Date.now()}),'metrics');
      }
      await load();
      message(remove?'Ручная запись шагов удалена.':'Шаги сохранены в общем журнале.');
    }catch(err){console.error('Care steps:',err);message('Не удалось сохранить шаги.');}
    finally{busy=false;}
  }

  async function exportCare() {
    if(!db)return;
    try {
      const wellness=await transact('readonly',store=>store.getAll());
      const metrics=(await transact('readonly',store=>store.getAll(),'metrics')).filter(row=>row.type==='steps');
      const backup={format:'seyveo-care-journal',version:1,exportedAt:new Date().toISOString(),wellness,steps:metrics,cycleExcluded:true};
      const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='seyveo-zabota-'+dateKey()+'.json';
      document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
      message('Копия воды, шагов и пауз создана. Женский цикл хранится отдельно.');
    }catch(err){console.error('Care export:',err);message('Не удалось создать копию.');}
  }
  async function eraseCare() {
    if(!db||busy)return;
    if(!confirm('Удалить воду, шаги и записи пауз? Женский цикл и медицинские данные останутся.'))return;
    if(!confirm('Удалить записи «Заботы» из этого браузера без возможности восстановления?'))return;
    busy=true;
    try {
      if(session)stop(false);
      await new Promise((resolve,reject)=>{
        const transaction=db.transaction(['wellness','metrics'],'readwrite');
        transaction.objectStore('wellness').clear();
        const query=transaction.objectStore('metrics').openCursor();
        query.onsuccess=()=>{
          const cur=query.result;if(!cur)return;
          if(cur.value.type==='steps')cur.delete();
          cur.continue();
        };
        transaction.oncomplete=resolve;
        transaction.onerror=()=>reject(transaction.error||new Error('Deletion failed'));
        transaction.onabort=()=>reject(transaction.error||new Error('Deletion aborted'));
      });
      lastWaterAdded=0;stepsRecords=[];
      await load();
      message('Записи «Заботы» удалены. Женский цикл не затронут.');
    }catch(err){console.error('Care erase:',err);message('Не удалось удалить записи.');}
    finally{busy=false;}
  }

  function toggleCycle() {
    const content=$('careCycleContent'),opening=content.hidden;
    content.hidden=!opening;
    $('healthWellness').hidden=opening;
    const button=$('careToggleCycle');button.setAttribute('aria-expanded',String(opening));
    button.querySelector('strong').textContent=opening?'Вернуться к заботе':'Женский цикл';
    button.querySelector('small').textContent=opening?'Вода, дыхание, шаги и глаза':'Личный календарь · только по желанию';
    if(opening&&session)stop(false);
  }

  function initStorage() {
    if(db||connecting)return;
    connecting=true;
    open().then(async opened=>{
      db=opened;
      db.onversionchange=()=>{db.close();db=null;if(session)stop(false);message('Хранилище обновлено. Перезагрузи страницу.');};
      await load();
    }).catch(err=>{
      console.error('Care storage:',err);message('Данные недоступны. Проверь настройки браузера.');
    }).finally(()=>{connecting=false;});
  }
  function init() {
    if (!$('healthWellnessDetail')) return;
    document.querySelectorAll('[data-wellness-open]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.wellnessOpen)));
    window.addEventListener('dm-care-leave',()=>{if(session)stop(false);});
    window.addEventListener('dm-care-show',()=>{if(db)void load();});
    document.querySelectorAll('[data-water-add]').forEach(b => b.addEventListener('click', () => void saveWater(Number(b.dataset.waterAdd))));
    $('wellnessWaterUndo').addEventListener('click', () => { if (lastWaterAdded) void saveWater(-lastWaterAdded); });
    $('wellnessGoalSave').addEventListener('click', () => void saveGoal());
    $('wellnessGoalInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); void saveGoal(); } });
    $('wellnessBreathStart').addEventListener('click', () => start('breathing'));
    $('wellnessEyeStart').addEventListener('click', () => start('eyes'));
    $('wellnessBreathStop').addEventListener('click', () => stop(false));
    $('wellnessEyeStop').addEventListener('click', () => stop(false));
    $('wellnessBreathDuration').addEventListener('change', () => {
      if (!session) $('wellnessBreathTime').textContent = clock(Number($('wellnessBreathDuration').value) * 60);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && session && !session.paused) {
        session.paused = true;
        $(session.kind === 'breathing' ? 'wellnessBreathStart' : 'wellnessEyeStart').textContent = 'Продолжить';
        $('wellnessBreathVisual').classList.remove('is-running');
      }
      if (!document.hidden && db) { lastWaterAdded = 0; void load(); }
    });
    window.addEventListener('pagehide', () => { stop(false); if (db) db.close(); db = null; });
    $('wellnessStepsDate').value=dateKey();
    $('wellnessStepsDate').addEventListener('change',renderSteps);
    $('wellnessStepsSave').addEventListener('click',()=>void saveSteps());
    $('wellnessStepsDelete').addEventListener('click',()=>void saveSteps(true));
    $('careToggleCycle').addEventListener('click',toggleCycle);
    $('careWellnessExport').addEventListener('click',()=>void exportCare());
    $('careWellnessErase').addEventListener('click',()=>void eraseCare());
    if(new URLSearchParams(location.search).get('view')==='cycle')toggleCycle();
    initStorage();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
