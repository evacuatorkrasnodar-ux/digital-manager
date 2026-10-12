/* Digital Manager | Evidence-linked opportunities.
 * Derives one reversible market experiment only from explicitly marked
 * owner observations; does not fabricate market research or forecast returns.
 */
(()=>{
'use strict';
const plays={
 booking:{
  headline:'Попробуем сделать запись удобнее',
  reason:'Ты отметил трудности с записью у одной из просмотренных организаций.',
  action:'Уточним, каким способом люди хотят записываться: через сообщение, звонок или форму. Подготовим простой вариант и проверим его на нескольких людях.',
  question:'Если бы появилась новая услуга рядом с вами, как было бы удобнее записаться: в сообщении, по телефону или через короткую форму?',
  caution:'Это не доказывает, что другие компании работают без записи. Нельзя подключать клиентские данные без согласия.'
 },
 hours:{
  headline:'Проверим, нужны ли клиентам другие часы',
  reason:'Ты отметил неудобное время работы у просмотренной организации.',
  action:'Спросим потенциальных клиентов, в какие дни и часы им действительно удобно обращаться. Не обещаем расширенный график до проверки затрат и ресурсов.',
  question:'В какие часы вам чаще всего неудобно получить такую услугу? Были бы полезны вечерние или выходные часы?',
  caution:'Нельзя считать, что вечерний график обязательно принесёт клиентов: нужно проверить спрос, персонал, безопасность и расходы.'
 },
 prices:{
  headline:'Попробуем объяснять цены понятнее',
  reason:'Ты отметил, что цены у просмотренной организации выглядят непонятными.',
  action:'Подготовим предварительный перечень услуг и объясним, от чего зависит цена. Покажем черновик клиентам и посмотрим, что им непонятно.',
  question:'Когда выбираете такую услугу, что в стоимости вам хочется узнать заранее? Достаточно диапазона или нужен подробный расчёт?',
  caution:'Не назначаем рыночные цены наугад, пока не подсчитаны себестоимость и расходы.'
 },
 offer:{
  headline:'Проверим, можно ли яснее объяснить пользу',
  reason:'Ты отметил, что у просмотренной организации сложно понять предложение.',
  action:'Сформулируем одну конкретную услугу простым языком и попросим потенциальных клиентов пересказать, что они поняли.',
  question:'Понятно ли из этой фразы, какую проблему мы решаем и почему это может быть вам полезно?',
  caution:'Ясный текст сам по себе не доказывает спрос или качество исполнения.'
 },
 delivery:{
  headline:'Проверим удобство получения заказа',
  reason:'Ты отметил неудобное получение или доставку у просмотренной организации.',
  action:'Выясним, нужно ли людям получать заказ по другому адресу или в другое время и можно ли организовать это без чрезмерных расходов.',
  question:'Что вам удобнее: забрать заказ в определённое время или заказать доставку? Какой срок для вас приемлем?',
  caution:'Не обещаем доставку, пока не проверили маршруты, сроки, стоимость и возможность исполнения.'
 }
};
const clean=(v,n=140)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
function suggest(plan){
 const scouting=window.DMMarketScout?.summary?.(plan);
 if(!scouting?.hasLocation)return null;
 const marked=(scouting.entries||[]).filter(x=>plays[x.issue]);
 const grouped=new Map();
 for(const item of marked){
  if(!grouped.has(item.issue))grouped.set(item.issue,[]);
  grouped.get(item.issue).push(item);
 }
 const primary=[...grouped.entries()].sort((a,b)=>b[1].length-a[1].length)[0];
 const feedback=plan?.mode==='start'?window.DMDemandTest?.summary?.(plan):null;
 const tally=feedback?.source==='owner-reported-local-feedback'?
  'Записанных владельцем откликов на идею: '+feedback.total+'. Это ещё не подтверждённые заказы.':'';
 if(!primary){
  const question='Что люди считают неудобным у местных компаний: запись, часы работы, условия, получение заказа или другое?';
  return Object.freeze({source:'owner-market-observation-analysis',hasSpecificEvidence:false,
   headline:'Сначала найдём конкретную проблему клиентов',
   reason:scouting.count?'Ты сохранил карточки компаний, но пока не отметил конкретного неудобства для клиентов.':
    'Карточек конкурентов пока нет. Не буду придумывать, что у них работает плохо.',
   action:'Проверь несколько организаций в выбранном районе. Отмечай только то, что действительно увидел, и перепроверяй важные сведения. Затем спроси людей, мешает ли им это.',
   testQuestion:question,evidence:[],supportCount:0,
   next:'Сначала нужны наблюдения. Никаких расходов или публикаций для этого не требуется.',
   demandNote:tally,marketVerified:false});
 }
 const [issue,items]=primary,play=plays[issue];
 const seen=items.slice(0,3).map(x=>({name:clean(x.name,100),url:x.url,note:clean(x.note,200)}));
 const position=plan?.locationFixed?'Ты выбрал это место; будем проверять идеи именно здесь.':'Место можно ещё сравнить с другими районами.';
 return Object.freeze({source:'owner-market-observation-analysis',
  hasSpecificEvidence:true,headline:play.headline,
  reason:play.reason+' Отметки владельца: '+items.length+'. Это не означает, что вся отрасль или район устроены одинаково.',
  action:play.action,testQuestion:play.question,evidence:seen,supportCount:items.length,
  next:position+' '+play.caution,
  demandNote:tally,marketVerified:false});
}
function report(){
 const p=window.DMBusinessJourney?.getPlan?.(),result=suggest(p);
 if(!result)return null;
 return 'Первая возможность для проверки: '+result.headline+'. '+result.reason+
  ' '+result.action+' '+result.next+' '+result.demandNote+
  ' Это лишь гипотеза на основе записей владельца, а не результат автоматического исследования рынка.';
}
window.DMMarketOpportunities=Object.freeze({suggest,report});
})();