/* One bounded request; never automatically retry a potentially billable AI call. */
(function(root){
 async function request(url,options,timeoutMs=120000){
  const controller=new AbortController();let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();const e=new Error('等待 AI 回覆逾時，請稍後再試。');e.userMessage=e.message;reject(e);},timeoutMs);});
  try{return await Promise.race([timeout,(async()=>{
   const response=await fetch(url,{...options,signal:controller.signal});
   let data;try{data=await response.json();}catch{const e=new Error('服務回覆格式異常，請稍後再試。');e.userMessage=e.message;throw e;}
   if(!response.ok){const fallback=response.status===401?'登入已過期，請重新登入。':response.status===429?'目前使用次數較多，請稍後再試。':'AI 服務暫時無法使用，請稍後再試。';const e=new Error(typeof data.message==='string'?data.message.slice(0,300):fallback);e.userMessage=e.message;throw e;}
   return data;
  })()]);}finally{clearTimeout(timer);}
 }
 root.ErhuAI={request,message:error=>error?.userMessage||'AI 暫時無法連線，請稍後重試。'};
})(window);
