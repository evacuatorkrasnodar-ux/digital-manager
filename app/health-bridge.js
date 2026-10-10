/* v286 · Health provider boundary. NO native health access from the web PWA.
 * Future iOS / Android wrappers may register a trusted, platform-specific adapter.
 * Every data read requires an explicit user tap and platform health permissions.
 * Data are normalized locally. No upload, network calls, background collection,
 * automatic watch pairing, medical interpretation, or mock measurements here.
 *
 * Native adapter contract:
 *   DMHealthBridge.register('apple-health'|'health-connect', {
 *     requestReadAuthorization(types: ['pressure','pulse','steps']): Promise<boolean>,
 *     readDailyMeasurements({from,to,types}): Promise<Array<{
 *       id: stable native sample ID, type: 'pressure'|'pulse'|'steps',
 *       date: 'YYYY-MM-DD', time?: 'HH:mm',
 *       systolic?: number, diastolic?: number, bpm?: number, steps?: number
 *     }>>
 *   });
 * Steps MUST be daily totals, not raw overlapping step intervals.
 */
(() => {
  'use strict';
  const names=Object.freeze(['apple-health','health-connect']);
  const registered=new Map();
  const types=Object.freeze(['pressure','pulse','steps']);
  const validDay=str=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(str))return false;
    const d=new Date(str+'T12:00:00');
    return Number.isFinite(d.getTime())&&[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')===str;
  };
  const within=(n,min,max)=>Number.isFinite(Number(n))&&Number(n)>=min&&Number(n)<=max;
  function normalize(source,raw){
    if(!names.includes(source)||!raw||typeof raw!=='object'||!types.includes(raw.type))throw new Error('Unsupported health metric');
    const date=String(raw.date||''),time=String(raw.time||'12:00');
    if(!validDay(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Invalid metric date or time');
    const sourceId=String(raw.id||'').trim();
    if(raw.type!=='steps'&&(!sourceId||sourceId.length>150))throw new Error('A stable source record ID is required');
    const metric={id:'import:'+source+':'+raw.type+':'+(raw.type==='steps'?date:sourceId),
      type:raw.type,date,time,source,sourceId:sourceId.slice(0,150),updatedAt:Date.now()};
    if(raw.type==='pressure'){
      if(!within(raw.systolic,50,300)||!within(raw.diastolic,30,200)||Number(raw.systolic)<=Number(raw.diastolic))throw new Error('Invalid blood-pressure measurement');
      metric.systolic=Number(raw.systolic);metric.diastolic=Number(raw.diastolic);
    }
    if(raw.type==='pulse'){
      if(!within(raw.bpm,25,250))throw new Error('Invalid heart-rate measurement');
      metric.bpm=Math.round(Number(raw.bpm));
    }
    if(raw.type==='steps'){
      if(!Number.isInteger(Number(raw.steps))||!within(raw.steps,0,200000))throw new Error('Invalid daily step total');
      metric.steps=Number(raw.steps);
    }
    return metric;
  }
  const api=Object.freeze({
    providers:()=>names.map(name=>({name,available:registered.has(name),connected:false})),
    register(name,adapter){
      if(!names.includes(name)||registered.has(name)||!adapter||
         typeof adapter.requestReadAuthorization!=='function'||
         typeof adapter.readDailyMeasurements!=='function')throw new Error('Invalid or already registered provider');
      registered.set(name,adapter);
    },
    async readOnUserAction(name,from,to){
      const adapter=registered.get(name);
      if(!adapter)throw new Error('Нужна нативная интеграция '+name+'. Веб-приложение не может читать данные часов.');
      if(!validDay(from)||!validDay(to)||from>to)throw new Error('Invalid date range');
      const allowed=await adapter.requestReadAuthorization([...types]);
      if(allowed!==true)throw new Error('Нет разрешения на чтение показателей');
      const records=await adapter.readDailyMeasurements({from,to,types:[...types]});
      if(!Array.isArray(records)||records.length>2000)throw new Error('Invalid health-provider response');
      return records.map(row=>normalize(name,row));
    },
    normalize
  });
  Object.defineProperty(window,'DMHealthBridge',{value:api,writable:false,configurable:false});
})();
