/* Local reference images stay in memory; never added to score records. */
(function(){
 function mount(){
  const editor=document.getElementById('editorGrid');if(!editor)return;
  const panel=document.createElement('section');panel.className='score-reference panel';panel.setAttribute('aria-label','原譜對照');
  panel.innerHTML='<div class="reference-toolbar"><h2>原譜對照</h2><label class="reference-file">選擇原始圖片<input id="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple></label><label>頁面 <select id="referencePage" disabled aria-label="原譜頁面"></select></label><label><input id="referencePin" type="checkbox" checked> 編輯時固定顯示</label><button class="button secondary" id="referenceClear" type="button" disabled>移除圖片</button></div><p id="referenceStatus" role="status">選取原譜，在下方修改音符時對照。支援 PNG、JPEG、WebP；圖片只留在目前頁面，重新整理後需重新選取。</p><details id="referenceView" hidden open><summary>顯示原譜</summary><a id="referenceOriginal" target="_blank" rel="noopener" aria-label="在新分頁查看原圖"><img id="referenceImage" alt="" /></a><span class="reference-hint">點圖片可在新分頁查看原尺寸。</span></details>';
  editor.closest('section').before(panel);
  const files=panel.querySelector('#referenceFiles'),pages=panel.querySelector('#referencePage'),pin=panel.querySelector('#referencePin'),clear=panel.querySelector('#referenceClear'),status=panel.querySelector('#referenceStatus'),view=panel.querySelector('#referenceView'),img=panel.querySelector('img'),original=panel.querySelector('a');
  let refs=[];
  function release(){refs.forEach(r=>URL.revokeObjectURL(r.url));refs=[];img.removeAttribute('src');original.removeAttribute('href');pages.replaceChildren();}
  function sticky(){panel.classList.toggle('is-pinned',pin.checked&&refs.length>0);}
  function show(){const r=refs[Number(pages.value)];if(!r)return;img.alt='原譜第 '+(Number(pages.value)+1)+' 頁：'+r.name;img.src=r.url;original.href=r.url;}
  files.addEventListener('change',()=>{
   const chosen=Array.from(files.files||[]);if(!chosen.length)return;
   if(chosen.length>8||chosen.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>20*1024*1024)){status.textContent='請選擇最多 8 張 PNG、JPEG 或 WebP 圖片，每張不超過 20 MB。';files.value='';return;}
   release();refs=chosen.map(f=>({name:f.name,url:URL.createObjectURL(f)}));
   refs.forEach((r,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent='第 '+(i+1)+' 頁 · '+r.name;pages.append(o);});
   pages.disabled=false;clear.disabled=false;view.hidden=false;view.open=true;status.textContent='已載入 '+refs.length+' 張原譜，僅供目前頁面對照，不隨譜面儲存。';show();sticky();
  });
  pages.addEventListener('change',show);pin.addEventListener('change',sticky);
  clear.addEventListener('click',()=>{release();files.value='';pages.disabled=true;clear.disabled=true;view.hidden=true;status.textContent='已移除對照圖片，編輯中的音符不受影響。';sticky();});
  img.addEventListener('error',()=>{status.textContent='這張圖片無法顯示，請改選有效的 PNG、JPEG 或 WebP。';});
  window.addEventListener('pagehide',e=>{if(!e.persisted)release();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
