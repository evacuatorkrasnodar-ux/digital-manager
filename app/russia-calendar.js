/* Federal Russian holidays / workweek 2026; decree of RF Government No. 1466, Sep 24 2025. Other years provisional. */
(()=>{
'use strict';
const pad=n=>String(n).padStart(2,'0');
const key=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3],12);return key(d)===s?d:null;};
const holidays={
'01-01':'Новогодние каникулы','01-02':'Новогодние каникулы','01-03':'Новогодние каникулы',
'01-04':'Новогодние каникулы','01-05':'Новогодние каникулы','01-06':'Новогодние каникулы',
'01-07':'Рождество Христово','01-08':'Новогодние каникулы',
'02-23':'День защитника Отечества','03-08':'Международный женский день',
'05-01':'Праздник Весны и Труда','05-09':'День Победы',
'06-12':'День России','11-04':'День народного единства'};
const rest2026={
'2026-01-09':'Перенос выходного с 3 января',
'2026-03-09':'Выходной за 8 марта',
'2026-05-11':'Выходной за 9 мая',
'2026-12-31':'Перенос выходного с 4 января'};
function getDay(input){
const d=input instanceof Date?new Date(input.getFullYear(),input.getMonth(),input.getDate(),12):parse(input);
if(!d||!Number.isFinite(d.getTime()))return {valid:false,off:false,holiday:false,confirmed:false,label:''};
const date=key(d),year=d.getFullYear(),fixed=holidays[date.slice(5)],moved=year===2026?rest2026[date]:undefined;
const weekend=d.getDay()===0||d.getDay()===6,holiday=!!fixed,off=weekend||holiday||!!moved;
return {valid:true,date,year,weekend,holiday,transferred:!!moved,off,label:fixed||moved||(weekend?(d.getDay()===6?'Суббота':'Воскресенье'):'Рабочий день'),confirmed:year===2026};
}
function nextWorkingDay(s,limit=45){const d=parse(s);if(!d)return null;for(let i=0;i<limit;i++){d.setDate(d.getDate()+1);if(!getDay(d).off)return key(d);}return null;}
function formatDate(s){const d=parse(s);return d?new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d):'';}
Object.defineProperty(window,'DMRuCalendar',{configurable:false,writable:false,value:Object.freeze({getDay,nextWorkingDay,formatDate})});
})();