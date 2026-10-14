/* Private single-owner HTTPS API. Deploy separately; GitHub Pages cannot run Node.
   Required: OPENAI_API_KEY, OPENAI_MODEL, DM_OWNER_TOKEN, DM_ALLOWED_ORIGIN.
   Bind to loopback behind an HTTPS reverse proxy by default. */
import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {askManagerOnServer} from './manager-model.mjs';

const origin=process.env.DM_ALLOWED_ORIGIN||'';
const secret=process.env.DM_OWNER_TOKEN||'';
const port=Number(process.env.PORT)||8787;
const host=process.env.HOST||'127.0.0.1';
if(!origin.startsWith('https://')||secret.length<32||!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL){
 throw new Error('Missing secure server configuration. Set HTTPS origin, owner token (32+ chars), OpenAI key and model.');
}
const equal=(a,b)=>{
 const left=Buffer.from(String(a)),right=Buffer.from(String(b));
 return left.length===right.length&&timingSafeEqual(left,right);
};
const hits=new Map();
function throttle(key){
 const now=Date.now(),state=hits.get(key)||{until:now+60000,count:0};
 if(now>=state.until){state.until=now+60000;state.count=0;}
 hits.set(key,state);
 if(hits.size>300)for(const [id,entry] of hits)if(entry.until<now)hits.delete(id);
 return ++state.count<=12;
}
function reply(res,status,data,extra={}){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});
 res.end(JSON.stringify(data));
}
http.createServer(async(req,res)=>{
 const same=req.headers.origin===origin;
 const cors=same?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
 if(req.url!=='/api/manager/ask')return reply(res,404,{error:'not_found'});
 if(req.method==='OPTIONS'){
  if(!same)return reply(res,403,{error:'forbidden'});
  res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Max-Age':'600'});return res.end();
 }
 if(req.method!=='POST')return reply(res,405,{error:'method_not_allowed'},cors);
 if(!same)return reply(res,403,{error:'origin_not_allowed'});
 if(!equal(req.headers.authorization?.replace(/^Bearer\s+/i,'')||'',secret))return reply(res,401,{error:'unauthorized'},cors);
 if(!throttle(req.socket.remoteAddress||'unknown'))return reply(res,429,{error:'rate_limited'},cors);
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(res,415,{error:'json_required'},cors);
 try{
  let body='',bytes=0;
  for await(const part of req){bytes+=part.length;if(bytes>12000)throw new Error('request_too_large');body+=part;}
  const input=JSON.parse(body);
  if(input?.consent?.aiAnalysis!==true)return reply(res,403,{error:'consent_required'},cors);
  const result=await askManagerOnServer({question:input.question,snapshot:input.snapshot,consent:{aiAnalysis:true}});
  return reply(res,200,result,cors);
 }catch(error){
  const userError=['request_too_large','Invalid question length','Unverified facts'].includes(error.message);
  return reply(res,userError?400:502,{error:userError?'invalid_input':'ai_unavailable'},cors);
 }
}).listen(port,host,()=>process.stdout.write('Manager API listening on '+host+':'+port+'\n'));
