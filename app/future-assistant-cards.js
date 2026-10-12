/* Future V5 assistant cards; self-contained, no changes to approved tile geometry. */
(()=>{'use strict';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 const home=document.getElementById('homeScreen'), shortcuts=home?.querySelector('.shortcuts');
 if(!shortcuts||document.getElementById('dmFutureAssistant'))return;
 const section=document.createElement('section'); section.id='dmFutureAssistant';section.className='dm-future-assistant'; section.setAttribute('aria-label','Сигналы цифрового управляющего');
 section.innerHTML='<div class="dm-future-title"><span>УПРАВЛЯЮЩИЙ РЯДОМ</span><small>Примеры · Future V5</small></div>'+
 '<article class="dm-future-card"><div class="dm-future-card-head"><span>Я УЖЕ СДЕЛАЛ</span><button type="button" data-future-detail="done" aria-label="Подробнее о выполненных действиях">↗</button></div><strong>Всё под контролем</strong><p>Подтверждённых самостоятельных действий пока нет. Когда появятся подключения и правила, здесь будут только реальные результаты.</p><small class="dm-future-caption">Журнал действий без выдуманных успехов</small></article>'+
 '<article class="dm-future-card"><div class="dm-future-card-head"><span>ВОЗМОЖНОСТЬ · ДЕМО</span><button type="button" data-future-detail="opportunity" aria-label="Подробнее о возможности">↗</button></div><strong>Новый канал продаж?</strong><p>Управляющий сможет оценить Avito, Ozon или Яндекс Маркет и предложить вариант роста на основе ваших данных.</p><small class="dm-future-caption">Пример будущего анализа, не реальный вывод</small></article>';
 shortcuts.after(section);
 const dialog=document.createElement('dialog');dialog.id='dmFutureDetails';dialog.className='dm-future-dialog';dialog.innerHTML='<div class="dm-future-dialog-inner"><header><span id="dmFutureLabel">ЦИФРОВОЙ УПРАВЛЯЮЩИЙ</span><button type="button" data-future-close aria-label="Закрыть">×</button></header><h2 id="dmFutureHeading"></h2><div id="dmFutureDescription"></div></div>';document.body.append(dialog);
 section.addEventListener('click',e=>{const b=e.target.closest('[data-future-detail]');if(!b)return;const opportunity=b.dataset.futureDetail==='opportunity';dialog.querySelector('#dmFutureHeading').textContent=opportunity?'Новая возможность':'Что я уже сделал';dialog.querySelector('#dmFutureDescription').innerHTML=opportunity?'<p>Пример: сравнить спрос, комиссии, доставку и ожидаемую прибыль перед выходом на торговую площадку.</p><p>После подключения источников здесь появятся подтверждённые данные, расчёт и предложение решения. Никаких публикаций или расходов без разрешения.</p>':'<p>Здесь будут только действительно совершённые управляющим действия: что изменено, на каком основании, по какому разрешению и с каким результатом.</p><p>Пока внешние сервисы не подключены, самостоятельных действий не было.</p>'; if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');});
 dialog.querySelector('[data-future-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();