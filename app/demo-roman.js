/* Roman's linked demonstration business: presentation-only. No changes to real records. */
(()=>{
 'use strict';
 const scenario=Object.freeze({
  owner:'Роман',city:'Краснодар',industry:'Выездной сервис',dateLabel:'Сегодня',
  clients:[
   {name:'Ирина',service:'Выезд мастера',status:'Ждёт ответа',next:'Подготовить ответ и уточнить удобное время'},
   {name:'Максим',service:'Срочный ремонт',status:'Ожидает подтверждения',next:'Предложить время приезда'},
   {name:'Анна',service:'Плановое обслуживание',status:'Согласовано',next:'Проверить запись в расписании'}
  ],
  revenue:48600,orders:5,requests:8,promoSpend:9200,
  recommendations:[
   {label:'Клиенты',title:'Ирина ждёт ответа',reason:'Обращение осталось без следующего шага.',action:'Я подготовил бы вежливый ответ и предложил время.'},
   {label:'Планирование',title:'Максиму нужно подтвердить выезд',reason:'Заказ ещё не согласован окончательно.',action:'Предложил бы два доступных временных окна.'},
   {label:'Финансы',title:'Проверить рекламу',reason:'В демонстрационном сценарии расходы на продвижение — 9 200 ₽.',action:'Сравнил бы стоимость обращений и подтверждённых заказов.'}
  ]
 });
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>new Intl.NumberFormat('ru-RU').format(n);
 function mount(){
  const dashboard=document.querySelector('#homeScreen .dashboard');
  if(!dashboard||document.getElementById('dmRomanBrief'))return;
  const card=document.createElement('section');
  card.id='dmRomanBrief';card.className='dm-roman-brief';
  card.setAttribute('aria-label','Демонстрационный утренний обзор управляющего');
  card.innerHTML='<div class="dm-roman-top"><span>ПРИМЕР РАБОТЫ · РОМАН, КРАСНОДАР</span><span class="dm-roman-mark" aria-hidden="true">✦</span></div>'+
  '<h2>Роман, доброе утро!</h2>'+
  '<p>Я посмотрел на дела в нашей демонстрационной компании. Есть хорошие новости и три вопроса, с которыми я уже разобрался. Кофе можешь пока не откладывать. ☕</p>'+
  '<div class="dm-roman-facts"><span><b>'+scenario.requests+'</b> обращений</span><span><b>'+scenario.orders+'</b> заказов</span><span><b>'+fmt(scenario.revenue)+' ₽</b> выручка</span></div>'+
  '<button type="button" class="dm-roman-action" aria-expanded="false" aria-controls="dmRomanDetails">Посмотреть мои предложения <span aria-hidden="true">↗</span></button>'+
  '<div id="dmRomanDetails" class="dm-roman-details" hidden>'+scenario.recommendations.map((r,i)=>
   '<article><small>'+esc(r.label)+' · '+(i+1)+'</small><h3>'+esc(r.title)+'</h3><p>'+esc(r.reason)+'</p><p class="dm-roman-action-text">'+esc(r.action)+'</p></article>'
  ).join('')+'<p class="dm-roman-disclaimer">Это единая учебная история Романа. Здесь нет реальных клиентов, банковских операций или отправленных сообщений.</p></div>';
  const reference=dashboard.querySelector('.recommendation-card');
  if(reference)reference.after(card);else dashboard.append(card);
  const button=card.querySelector('.dm-roman-action'),details=card.querySelector('#dmRomanDetails');
  button.addEventListener('click',()=>{details.hidden=!details.hidden;button.setAttribute('aria-expanded',String(!details.hidden));button.firstChild.textContent=details.hidden?'Посмотреть мои предложения ':'Свернуть предложения ';});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.DMRomanDemo=Object.freeze({getScenario:()=>scenario});
})();
