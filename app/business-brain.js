/* Digital Manager · local read-only business brain.
   Business facts come solely from owner-entered records. This is NOT an LLM
   or a server process. It never sends messages, spends money or updates stages. */
(()=>{
'use strict';
const money=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n)||0);
const number=n=>Number(n)||0;
function facts(){
 const raw=window.DMSalesScreen?.getBusinessSnapshot?.();
 if(!raw||raw.source!=='user-entered-local-records')return null;
 return raw;
}
function business(){
 return window.DMBusinessContext?.getContext?.()||{description:'',configured:false,hints:[],areas:[]};
}
function contextNote(){
 const c=business();
 if(!c.configured)return 'Если расскажешь, чем занимается бизнес, я смогу учитывать не только продажи, но и другие процессы.';
 return 'Учитываю твоё описание бизнеса: «'+c.description+'». Направления внимания: '+c.areas.slice(0,4).join(', ')+'. Показатели по этим направлениям ещё нужно подключать отдельно.';
}
function processAnswer(q){
 const c=business();
 const asksProcess=/(услуг|производ|завод|склад|остатк|поставщик|доставк|логист|график|запис|брон|сотрудник|персонал|смены|магазин|цвет|цех|филиал|управлят|специфик|бизнес.модел)/.test(q);
 if(!asksProcess)return null;
 // "Как дела в цветочном магазине?" asks for the overall business report,
 // not a made-up warehouse or industry diagnostic.
 if(/как дела|что происходит|как идут|отч[её]т/.test(q)&&
   !/запас|производ|постав|достав|график|персонал|сотрудник|смен|филиал|запис|брон/.test(q))return null;
 if(!c.configured)return 'Могу учитывать товары, услуги, запасы, производство, сроки, команды и филиалы. Опиши свой бизнес одной фразой в «Мой управляющий», и я выделю главные процессы. Без их данных я не буду изображать контроль.';
 return contextNote()+' Сейчас из фактических записей мне доступны только обращения, покупки и вручную указанные рекламные расходы — состояние запасов, графиков и выполнения работ я пока не вижу.';
}
const counted=(n,one,few,many)=>{const x=Math.abs(number(n)),last=x%10,last100=x%100;return String(n)+' '+(last100>=11&&last100<=14?many:last===1?one:last>=2&&last<=4?few:many)};
function workflow(){
 const report=window.DMWorkflowCore?.snapshot?.();
 return report&&report.origin==='local-user-entered-records'?report:null;
}
function workSignals(){
 const flow=workflow();
 return flow?window.DMWorkflowCore?.signals?.(flow)||[]:[];
}
function workLine(){
 const x=workflow();if(!x)return '';
 const pieces=[];
 if(x.ownerTasks)pieces.push('у тебя '+counted(x.ownerTasks,'дело','дела','дел'));
 if(x.assistantQueue)pieces.push('у управляющего в очереди '+counted(x.assistantQueue,'поручение','поручения','поручений')+(x.draftsPrepared?' ('+counted(x.draftsPrepared,'черновик подготовлен','черновика подготовлены','черновиков подготовлено')+')':''));
 if(x.tasksOverdue)pieces.push(counted(x.tasksOverdue,'дело просрочено','дела просрочены','дел просрочено'));
 return pieces.length?'По «Моим делам»: '+pieces.join('; ')+'. Очередь не равна выполнению.':'';
}
function taskAnswer(){
 const x=workflow();
 if(!x)return 'Пока не могу прочитать текущие дела. Ничего придумывать не стану.';
 const due=!x.tasksOverdue&&x.tasksDueToday?' Сегодня требуют внимания '+counted(x.tasksDueToday,'дело','дела','дел')+'.':'';
 if(!x.ownerTasks&&!x.assistantQueue)return 'По сохранённому журналу незавершённых дел и поручений сейчас нет. '+progressSentence();
 return workLine()+due+' '+progressSentence();
}
function combinedSignals(data){
 const sales=observations(data);
 const operations=workSignals().map(x=>({priority:x.priority,type:'work-'+x.id,title:x.title,text:x.body,next:x.next}));
 return [...sales,...operations].sort((a,b)=>a.priority-b.priority);
}
function observations(data){
 if(!data||!data.total)return [];
 const notes=[];
 if(data.waitingDay>0)notes.push({
  priority:1,type:'late',title:'Клиенты долго ждут',
  text:'В записях больше суток не менялся этап у '+counted(data.waitingDay,'нового обращения','новых обращений','новых обращений')+'. Это не доказывает, что ответа не было, но стоит проверить.',
  next:'Я подготовлю черновики для этих клиентов, если ты разрешил инициативу.'});
 if(data.newLeads>0)notes.push({
  priority:2,type:'new',title:'Есть новые обращения',
  text:'Новых обращений без отмеченного ответа: '+data.newLeads+'.',
  next:'Могу подготовить личные ответы по записям, не отправляя их без разрешения.'});
 const spendWithoutPurchase=(data.bySource||[]).filter(x=>x.promotion>0&&x.leads>=2&&x.purchases===0)
   .sort((a,b)=>b.promotion-a.promotion)[0];
 if(spendWithoutPurchase)notes.push({
  priority:3,type:'spend',title:'Проверим путь от рекламы к покупке',
  text:'По '+spendWithoutPurchase.source+' внесены расходы '+money(spendWithoutPurchase.promotion)+
   ', '+spendWithoutPurchase.leads+' обращения и ни одной отмеченной покупки. Это ещё не значит, что канал убыточен.',
  next:'Нужно сверить реальные ответы и результат, прежде чем менять бюджет.'});
 const goodSource=(data.bySource||[]).filter(x=>x.purchases>=2).sort((a,b)=>b.purchases-a.purchases)[0];
 if(goodSource)notes.push({
  priority:4,type:'growth',title:'Есть направление для роста',
  text:'Из '+goodSource.source+' уже '+goodSource.purchases+' отмеченных покупки по твоим записям.',
  next:'Я бы проверил, что помогло этим клиентам купить, прежде чем масштабировать канал.'});
 if(data.unknownAmounts>0)notes.push({
  priority:5,type:'missing',title:'Есть незаполненные суммы',
  text:'Для '+counted(data.unknownAmounts,'отмеченной покупки','отмеченных покупок','отмеченных покупок')+' сумма пока не указана. Денежную картину нельзя считать полной.',
  next:'Когда появятся суммы, я пересчитаю картину.'});
 return notes.sort((a,b)=>a.priority-b.priority);
}
function journey(){
 const plan=window.DMBusinessJourney?.getPlan?.();
 return plan?.source==='owner-entered-local-plan'?plan:null;
}
function startingPath(){
 const p=journey();if(!p)return '';
 const detail=p.mode==='start'?(p.unknownIdea||!p.description?'Направление пока не выбрано. ':'Тебе интересно: '+p.description+'. '):
  (p.description?'Твой бизнес: '+p.description+'. ':'');
 const first=p.steps?.[0];
 return (p.mode==='start'?'Мы создаём твоё дело с нуля. ':'Мы развиваем действующий бизнес. ')+detail+
  (first?'Первый шаг — '+first.title.toLowerCase()+'. '+first.note:'')+
  ' Пока это сохранённый маршрут, а не выполненная работа.';
}
function startupMaterials(){
 return window.DMFirstResult?.describe?.()||'Пока нет подготовленных материалов.';
}
function demandProgress(){
 return window.DMDemandTest?.report?.()||'Пока нет сохранённого плана проверки спроса.';
}
function selectedPlaceAnswer(){
 const advice=window.DMBusinessJourney?.getLocationAdvice?.();
 if(!advice?.knownLocation)return 'Место пока не выбрано. Расскажи, в каком городе или районе планируешь работать — затем проверим конкурентов, спрос и условия.';
 return advice.observation+' Первые проверки: '+advice.evidence.slice(0,3).join('; ')+
  '. Что можно сделать после проверки: '+advice.plan.slice(0,2).join('; ')+
  '. Пока это план, а не исследование рынка или выполненная работа.';
}
function work(){
 const result=window.DMInitiative?.getSummary?.();
 return result&&typeof result.enabled==='boolean'?result:{enabled:false,prepared:0,awaitingReview:0,reviewed:0};
}
function progressSentence(){
 const w=work();
 if(w.enabled&&w.prepared>0)
  return 'Я уже подготовил '+counted(w.prepared,'черновик','черновика','черновиков')+' по активным обращениям. '+
   (w.awaitingReview?'Из них '+counted(w.awaitingReview,'черновик','черновика','черновиков')+' ждут просмотра.':'Все эти черновики просмотрены.')+
   ' Ничего клиентам не отправлено.';
 if(w.enabled)return 'Самостоятельная подготовка разрешена. Новых черновиков по активным обращениям сейчас нет.';
 if(w.prepared>0)return 'Ранее сохранено '+counted(w.prepared,'черновик','черновика','черновиков')+'; самостоятельная подготовка сейчас выключена.';
 return 'Самостоятельная подготовка пока выключена. Могу включиться после твоего согласия.';
}
function brief(){
 const d=facts(),path=journey();
 if(path?.mode==='start'&&!d?.total){
  const priority=workSignals()[0]||null;
  return {headline:priority?.title||'Создадим твоё дело вместе',
    message:startingPath()+' '+startupMaterials()+' '+demandProgress()+' '+(priority?priority.body+' ':'')+workLine(),
    priority};
 }
 if(!d){const important=workSignals()[0]||null;
  return {headline:important?.title||'Готов разобраться с бизнесом',
   message:contextNote()+' '+(important?important.body+' ':'')+workLine()+' Данных о продажах пока нет.',
   priority:important};
 }
 if(!d.total){
  const priority=combinedSignals(d)[0]||null;
  return {headline:priority?.title||(business().configured?'Я изучаю устройство твоего бизнеса':'Жду реальные обращения'),
   message:contextNote()+' '+(priority?priority.text+' '+priority.next+' ':'')+workLine()+
    ' В «Продажах» пока нет записей, а другие внешние источники не подключены. Я не стану придумывать прибыль или выполненную работу. '+progressSentence(),
   priority};
 }
 const priority=combinedSignals(d)[0]||null;
 const first=(business().configured?'В твоём бизнесе по доступным записям: ':'По твоим записям: ')+counted(d.total,'обращение','обращения','обращений')+', '+counted(d.purchases,'покупка','покупки','покупок')+', в работе: '+d.active+'.';
 return {headline:priority?.title||'Дела под контролем по доступным записям',
  message:first+' '+(priority?priority.text+' '+priority.next:'Пока срочных сигналов из записей нет.')+' '+workLine()+' '+progressSentence()+(business().configured?' '+contextNote():'') ,
  priority};
}
function spendingAnswer(d){
 const lines=['По твоим ручным записям расходы на продвижение: '+money(d.promotionSpend)+'.'];
 if(!d.bySource.some(x=>x.promotion>0))lines.push('Расходов по каналам пока нет — выводы о рекламе делать рано.');
 const concern=observations(d).find(x=>x.type==='spend');
 if(concern)lines.push(concern.text+' '+concern.next);
 else if(d.bySource.some(x=>x.promotion>0))lines.push('Я сравнил записанные расходы и покупки, но это ещё не окупаемость: неизвестны все расходы, даты платежей и полные данные рекламных кабинетов.');
 return lines.join(' ');
}
function moneyAnswer(d){
 return 'По твоим записям '+d.purchases+' покупок на '+money(d.knownRevenue)+
  '. Расходы на продвижение, внесённые вручную: '+money(d.promotionSpend)+
  '. Это не прибыль и не деньги на счёте: других затрат и подтверждений оплаты у меня нет.'+
  (d.unknownAmounts?' У '+d.unknownAmounts+' покупок сумма пока не указана.':'');
}
function salesAnswer(d){
 if(!d.total)return 'В «Продажах» пока нет ни одного записанного обращения. Не буду выдумывать клиентов или результаты.';
 return 'Я вижу '+counted(d.total,'обращение','обращения','обращений')+'. Новых: '+d.newLeads+', обсуждаются: '+d.inTalk+', с предложением: '+
  d.inOffer+', покупки: '+d.purchases+', не сложилось: '+d.lost+'. '+
  (d.newLeads?'Мой первый приоритет — новые клиенты. ':'')+progressSentence();
}
function answer(question){
 const q=String(question||'').trim().toLowerCase();
 if(!q)return null;
 const path=journey();
 if(path?.mode==='start'&&/(что со спросом|проверили спрос|проверка спроса|есть спрос|первые отклики|есть отклики|реакци|что говорят люди|что думают люди|заинтересовал)/.test(q))
  return demandProgress()+' Это первые сигналы; перед значительными расходами стоит проверить реальные потребности и возможность оплачивать предложение.';
 if(path?.mode==='start'&&/(что.{0,18}подготовил|что успел|первые материалы|черновик сайта|текст сайта|проверить спрос)/.test(q))return startupMaterials()+' '+startingPath();
 if(/(?:район|улиц|локаци|помещен|конкурент|где открыть|открыват.{0,18}где|соседн.{0,16}бизнес)/.test(q)&&path)return selectedPlaceAnswer();
 if(path&&/(с нуля|сво[её] дел[оа]|начать бизнес|откр[ыо].{0,18}бизнес|первые клиенты|с чего нач|что сначала|план развития|путь развития|иде[яю]|чем заняться)/i.test(q))
  return startingPath()+' Продолжить знакомство и изменить планы можно в «Управлении» → «Мой управляющий» → «Мой путь с управляющим».';
 const recognized=/(бизнес|как дела|что происходит|как идут|что нового|что успел|успел|сделал|делал|занимаешься|занимал|работаешь|поручен|мои дела|отчет|отчёт|итог|ситуаци|ошибк|проблем|что дальше|что делать|помоги|продаж|клиент|покупк|заявк|выручк|денег|деньг|доход|прибыл|финанс|расход|трат|бюджет|реклам|продвижен|задач|поручени|мои дела|дела на сегодня|какие.{0,14}дела|что по делам|что у меня|сроки|просроч|автопилот|самостоятельн|услуг|производ|склад|остатк|поставщик|доставк|график|брон|сотрудник|персонал|смены|магазин|цвет|цех|филиал|бизнес.модел)/i.test(q);
 if(!recognized)return null;
 if(/задач|поручени|мои дела|дела на сегодня|какие.{0,14}дела|что по делам|сроки|просроч/.test(q))return taskAnswer();
 const d=facts();
 if(!d)return processAnswer(q)||contextNote()+' Записи «Продаж» пока недоступны. Ничего не стану придумывать.';
 const w=work();
 if(/автопилот|самостоятельн|успел|сделал|делал|занимаешься|чем занимал|работаешь/.test(q))return progressSentence()+' '+workLine()+
  (d.newLeads?' Сейчас новых обращений: '+d.newLeads+'.':'');
 if(/расход|трат|бюджет|реклам|продвижен/.test(q))return spendingAnswer(d);
 if(/денег|деньг|доход|прибыл|выручк|финанс/.test(q))return moneyAnswer(d);
 if(/продаж|клиент|покупк|заявк/.test(q))return salesAnswer(d);
 const process=processAnswer(q);
 if(process)return process;
 if(!d.total)return brief().message;
 const rec=brief();
 return 'Я посмотрел текущие записи. '+rec.message;
}
window.DMBusinessBrain=Object.freeze({answer,brief,observations:()=>combinedSignals(facts()),getSnapshot:facts,getProgress:progressSentence,getWorkSummary:workLine,getPlaceAdvice:selectedPlaceAnswer});
})();