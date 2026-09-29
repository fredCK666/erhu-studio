'use strict';
const {setTimeout:delay}=require('node:timers/promises');
const {apiError}=require('./errors');
function retryDelay(header,attempt,random=Math.random){
 let ms=NaN;
 if(header && header.trim())ms=/^\d+(\.\d+)?$/.test(header)?Number(header)*1000:Date.parse(header)-Date.now();
 if(!Number.isFinite(ms)||ms<0)ms=15000*2**attempt;
 return Math.ceil(ms+250+random()*750);
}
async function requestCompletion(body,signal,{fetchImpl=fetch,sleepImpl=(ms,s)=>delay(ms,undefined,{signal:s}),random=Math.random}={}){
 for(let attempt=0;attempt<3;attempt++){
  signal.throwIfAborted();
  const response=await fetchImpl('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal});
  if(response.ok)return response.json();
  let detail={};try{detail=(await response.json()).error||{};}catch{}
  const error=apiError(response.status,detail);
  if(error.message!=='api-rate'||attempt===2)throw error;
  const wait=retryDelay(response.headers?.get('retry-after'),attempt,random);
  if(wait>60000)throw error;
  await sleepImpl(wait,signal);
 }
}
module.exports={requestCompletion,retryDelay};
