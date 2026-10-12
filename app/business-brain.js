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
const counted=(n,one,few,many)=>{const x=Math.abs(number(n)),last=x%10,last100=x%100;return String(n)+' '+(last100>=11&&last100<=14?many:last===1?one:last>=2&&last<=4?few:many)};
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
 const d=facts();
 if(!d)return {headline:'Готов разобраться с бизнесом',message:'В этой части приложения ещё нет доступа к данным «Продаж». Ничего придумывать не стану.',priority:null};
 if(!d.total)return {headline:'Жду реальные обращения',message:'Пока в «Продажах» нет твоих записей. Поэтому я не буду изображать занятость и придумывать прибыль. '+progressSentence(),priority:null};
 const priority=observations(d)[0]||null;
 const first='По твоим записям: '+counted(d.total,'обращение','обращения','обращений')+', '+counted(d.purchases,'покупка','покупки','покупок')+', в работе: '+d.active+'.';
 return {headline:priority?.title||'Дела под контролем по доступным записям',
  message:first+' '+(priority?priority.text+' '+priority.next:'Пока срочных сигналов из записей нет.')+' '+progressSentence(),
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
 const recognized=/(бизнес|как дела|что происходит|как идут|что нового|что успел|успел|сделал|делал|занимаешься|занимал|работаешь|поручен|мои дела|отчет|отчёт|итог|ситуаци|ошибк|проблем|что дальше|что делать|помоги|продаж|клиент|покупк|заявк|выручк|денег|деньг|доход|прибыл|финанс|расход|трат|бюджет|реклам|продвижен|автопилот|самостоятельн)/i.test(q);
 if(!recognized)return null;
 const d=facts();
 if(!d)return 'Я пока не вижу записи «Продаж». Не стану выдавать общий совет за проверку твоего бизнеса.';
 const w=work();
 if(/автопилот|самостоятельн|успел|сделал|делал|занимаешься|чем занимал|работаешь|поручен/.test(q))return progressSentence()+
  (d.newLeads?' Сейчас новых обращений: '+d.newLeads+'.':'');
 if(/расход|трат|бюджет|реклам|продвижен/.test(q))return spendingAnswer(d);
 if(/денег|деньг|доход|прибыл|выручк|финанс/.test(q))return moneyAnswer(d);
 if(/продаж|клиент|покупк|заявк/.test(q))return salesAnswer(d);
 if(!d.total)return brief().message;
 const rec=brief();
 return 'Я посмотрел текущие записи. '+rec.message;
}
window.DMBusinessBrain=Object.freeze({answer,brief,observations:()=>observations(facts()),getSnapshot:facts,getProgress:progressSentence});
})();