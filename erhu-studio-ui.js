/* Shared navigation and workspace composition; existing data and event handlers are preserved. */
(function(){
 function mount(){
  let page;try{page=decodeURIComponent(location.pathname.split('/').pop()||'index.html')}catch{page='index.html'}
  if(page&&!page.includes('.'))page+='.html';
  const routes=[['課程與紀錄',[['01','練習首頁','index.html'],['02','十級課程','二胡小教室.html'],['03','練習打卡','二胡小教室-練習打卡.html'],['04','級數測驗','二胡小教室-小測驗.html']]],['AI 練習工具',[['問','問答助教','二胡小教室-AI助教.html'],['練','練習規劃','二胡小教室-AI練習規劃師.html'],['譜','掃描樂譜','二胡小教室-AI掃描譜.html'],['聽','音準跟譜','二胡小教室-AI音準評分.html'],['記','學習回報','二胡小教室-AI錯音複習師.html']]],['譜面與調音',[['編','譜面編輯','二胡小教室-譜面編輯器.html'],['調','二胡調音器','二胡小教室-調音器.html']]]];
  const labels=routes.flatMap(x=>x[1]);const current=labels.find(x=>x[2]===page)?.[1]||'二胡課程';
  document.body.classList.add('studio-redesign');
  const kind=page.includes('掃描譜')?'scan':page.includes('練習規劃師')?'planner':page.includes('AI助教')?'tutor':page.includes('音準評分')?'pitch':page.includes('錯音複習師')?'report':page.includes('編輯器')?'editor':page==='二胡小教室.html'?'courses':'other';
  document.body.dataset.studioPage=kind;
  const rail=document.createElement('aside');rail.className='studio-rail';
  rail.innerHTML='<a class="studio-logo" href="./index.html"><span class="studio-seal">弦</span><span>二胡小教室<small>ERHU LEARNING STUDIO</small></span></a><details class="studio-menu"><summary>工具與課程 <span>＋</span></summary><nav aria-label="主要導覽">'+routes.map(([heading,items])=>'<div class="studio-nav-group"><p>'+heading+'</p>'+items.map(([num,label,url])=>'<a href="./'+url+'"'+(page===url?' aria-current="page"':'')+'><span class="studio-nav-number">'+num+'</span>'+label+'</a>').join('')+'</div>').join('')+'</nav></details><a class="studio-rail-foot" href="./二胡小教室-AI使用與隱私.html">AI 使用與隱私說明</a>';
  document.body.prepend(rail);
  const menu=rail.querySelector("details"),wide=window.matchMedia("(min-width:761px)");menu.open=wide.matches;wide.addEventListener("change",event=>{menu.open=event.matches;});
  const top=document.querySelector('.topbar');if(top){top.querySelector('.brand')?.remove();const crumb=document.createElement('div');crumb.className='studio-breadcrumb';crumb.textContent='二胡考級 ／ '+current;top.prepend(crumb);}
  const shell=document.querySelector('main.shell');if(!shell)return;
  if(kind==='scan'){
   const grid=shell.querySelector(':scope > .grid');const preview=shell.querySelector(':scope > .panel');
   if(grid&&preview){const library=grid.querySelector('aside.panel');const results=document.createElement('div');results.className='studio-scan-results';results.append(preview);if(library)results.append(library);grid.append(results);}
   const hero=shell.querySelector(':scope > .hero');if(hero){const steps=document.createElement('ol');steps.className='studio-process';steps.innerHTML='<li><b>01</b> 上傳原譜</li><li><b>02</b> 對照與校訂</li><li><b>03</b> 保存並練習</li>';hero.append(steps);}
  }
  if(kind==='planner'){const stack=document.querySelector('.summary-stack'),plan=document.querySelector('.plan-card');if(stack&&plan)stack.prepend(plan);}
  if(kind==='courses'){
   const hero=shell.querySelector(':scope > .hero'),grid=shell.querySelector(':scope > .grid'),heading=document.getElementById('course-levels');
   if(hero&&grid&&heading){hero.after(heading,grid);}
   shell.querySelectorAll('.featured-ai').forEach((card,i)=>{const tag=document.createElement('span');tag.className='studio-tool-index';tag.textContent=['壹','貳','參','肆','伍'][i]||'';card.prepend(tag);});
  }
  if(kind==='editor'){
   const blocks=Array.from(shell.querySelectorAll(':scope > .panel'));if(blocks.length>=4){const workspace=document.createElement('div');workspace.className='studio-editor-workspace';blocks[1].before(workspace);workspace.append(blocks[1],blocks[2]);}
  }
  const exportPanel=shell.querySelector('.output-box');
  if(kind==='editor'&&exportPanel){const details=document.createElement('details');details.className='export-detail';const summary=document.createElement('summary');summary.textContent='譜面資料';exportPanel.before(details);details.append(summary,exportPanel);exportPanel.querySelector('h2')?.remove();}
  installMotion(shell,rail,kind);
 }
 function installMotion(shell,rail,kind){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const active=new WeakMap();
  function transition(el,frames,options={}){
   if(!el||reduced.matches||typeof el.animate!=='function'||el.hidden)return;
   active.get(el)?.cancel();
   const a=el.animate(frames,{duration:200,easing:'cubic-bezier(.2,.7,.25,1)',...options});active.set(el,a);
  }
  const enter=el=>transition(el,[{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}]);
  shell.querySelectorAll(':scope > .studio-welcome,:scope > .hero,.studio-tool-tile').forEach((el,i)=>transition(el,[{opacity:.7,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,delay:Math.min(i*28,140)}));
  rail.querySelector('details').addEventListener('toggle',event=>{
   if(event.target.open&&!window.matchMedia('(min-width:761px)').matches)enter(event.target.querySelector('nav'));
  });
  document.addEventListener('click',event=>{
   const control=event.target.closest('button,.studio-tool-tile,.studio-level-card');
   if(control&&!control.disabled&&!control.closest('#scoreSheet'))transition(control,[{scale:'.985'},{scale:'1'}],{duration:150});
  });
  const ids=['messages','planOutput','previewBox','reportBody','libraryList'];
  if(typeof MutationObserver==='function')ids.forEach(id=>{
   const el=document.getElementById(id);if(!el)return;let scheduled=false;
   const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(id==='messages')enter(el.lastElementChild);else enter(el);});});
   observer.observe(el,{childList:true});
  });
  ['plannerStatus','sourceStatus','statusBox'].forEach(id=>{const el=document.getElementById(id);if(el&&kind!=='pitch'){el.setAttribute('role','status');el.setAttribute('aria-live','polite');}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
