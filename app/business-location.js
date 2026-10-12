/* Digital Manager — location strategy, not fabricated market intelligence.
 * A local advisory layer for Business Builder. Confirmed competitor counts and
 * demand need external verified data and explicit owner permission. */
(()=>{
'use strict';
const compact=s=>String(s??'').replace(/\s+/g,' ').trim().slice(0,180);
const caseFor=description=>{
 const s=String(description||'');
 if(/парикмах|барбер|салон красот|стриж|колорист|маникюр|ногт/i.test(s))return {
  kind:'beauty',title:'Салон и услуги красоты',
  niche:'выбрать конкретные услуги и людей, ради которых будут записываться именно к тебе',
  evidence:['Парикмахерские и салоны в пешей доступности','Цены и отзывы рядом','Доступность пешком, на машине и на транспорте','Поток потенциальных клиентов и свободное время записи','Аренда и обязательные затраты'],
  counter:['Отстроить предложение: специализация, качество, удобство записи','Подготовить сайт или страницу услуг с реальными фотографиями и ценами','Настроить карты и запись только после получения доступа и разрешения','Проверить спрос маленьким тестом до больших затрат','Продумать повторы, рекомендации и удержание клиентов']
 };
 if(/цвет|букет|флорист/i.test(s))return {kind:'flowers',title:'Цветы и букеты',
  niche:'создать понятное отличие: свежесть, необычные букеты, удобная доставка или работа с событиями',
  evidence:['Соседние цветочные точки и их ассортимент','Пешеходный поток и сезонные события','Доступность доставки','Аренда и расходы на свежий товар','Спрос в ближайших жилых кварталах'],
  counter:['Подобрать ассортимент под покупателя в этой точке','Подготовить удобную страницу заказов','Продумать доставку и хранение, чтобы снизить списания','Сделать первые пробные предложения без больших закупок','Работать с повторными клиентами и событиями']
 };
 if(/кафе|кофейн|ресторан|пекарн|общепит/i.test(s))return {kind:'food',title:'Кафе и питание',
  niche:'найти понятную причину прийти именно сюда: продукт, сервис, удобство или время работы',
  evidence:['Ближайшие заведения, меню и отзывы','Пешеходный трафик в нужные часы','Ограничения помещения и требования безопасности','Затраты на аренду, оборудование и персонал','Спрос по времени суток и дням недели'],
  counter:['Выбрать сильное предложение под местный спрос','Начать с небольшого ассортимента и проверить интерес','Продумать карты, меню, сайт и доставку по необходимости','Проверить экономику каждого популярного товара','Следить за качеством и возвращаемостью гостей']
 };
 if(/магазин|торгов|товар|продаж/i.test(s))return {kind:'retail',title:'Магазин и торговля',
  niche:'определить товары, ради которых будут выбирать именно твою точку',
  evidence:['Ассортимент, цены и отзывы ближайших магазинов','Поток людей и удобство входа','Ожидаемый спрос и сезонность','Закупочные цены и остатки','Аренда, комиссии и другие расходы'],
  counter:['Собрать небольшой ассортимент для проверки спроса','Подготовить предложения для повторных клиентов','Сделать страницу магазина и подходящие объявления','Проверить поставщиков и риск неликвидных остатков','Измерять реальные покупки, а не только просмотры']
 };
 return {kind:'generic',title:'Твоё дело',
  niche:'найти конкретное отличие, ради которого клиенты выберут тебя',
  evidence:['Конкуренты и альтернативы для клиентов в выбранной местности','Потребности людей и организаций рядом','Доступность и условия помещения','Стоимость запуска и регулярные расходы','Правила и ограничения для выбранного вида деятельности'],
  counter:['Выделить понятную специализацию и ценность для клиента','Проверить интерес на небольшом безопасном тесте','Подготовить сайт или страницу предложения, если это полезно','Выбрать подходящие площадки после проверки спроса','Отслеживать реальные результаты и корректировать план']
 };
};
function evaluate({description='',location='',fixed=false,competitorEvidence=null}={}){
 const area=compact(location),sector=caseFor(description);
 if(!area)return Object.freeze({knownLocation:false,location:'',sector:sector.kind,
  headline:'Выберем место, когда появится подходящий вариант',
  observation:'Без адреса или района я не буду придумывать конкуренцию.',
  evidence:sector.evidence.slice(),plan:sector.counter.slice(),
  checked:false,level:'unknown',fixed:false,source:'no-location'});
 // Competitor evidence is only acknowledged if accompanied by an explicit,
 // externally verifiable source from a future trusted adapter, not from free text.
 const validEvidence=competitorEvidence&&competitorEvidence.verified===true&&
   typeof competitorEvidence.sourceUrl==='string'&&/^https:\/\//i.test(competitorEvidence.sourceUrl)&&
   Number.isFinite(competitorEvidence.checkedAt);
 const high=Boolean(validEvidence&&competitorEvidence.result==='high');
 const low=Boolean(validEvidence&&competitorEvidence.result==='low');
 const intro=high?'По проверенным данным здесь сильная конкуренция. Я бы внимательно проверил экономику и отличие.':
  low?'По проверенным данным конкуренция здесь умеренная или невысокая. Это ещё не гарантия спроса.':
  'Я записал выбранное место. Конкурентов и спрос здесь ещё не проверял, поэтому не буду называть район плохим или хорошим.';
 const commitment=fixed?'Ты решил открываться именно здесь. Уважаю твой выбор: будем искать сильное предложение и проверять риски до больших трат.':
  'Сначала сравним место и варианты. А если решишь открываться именно здесь, построим план вокруг твоего выбора.';
 return Object.freeze({knownLocation:true,location:area,sector:sector.kind,sectorTitle:sector.title,
  headline:fixed?'Работаем с выбранным местом':'Изучим место до больших трат',
  observation:'Место: '+area+'. '+intro+' '+commitment,
  evidence:sector.evidence.slice(),plan:sector.counter.slice(),
  niche:sector.niche,checked:Boolean(validEvidence),level:high?'high':low?'low':'unknown',
  fixed:Boolean(fixed),source:validEvidence?'verified-external-evidence':'owner-location-no-market-check'});
}
window.DMBusinessLocation=Object.freeze({evaluate,caseFor});
})();