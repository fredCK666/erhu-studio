const {JSDOM}=require('jsdom');const fs=require('node:fs');const test=require('node:test');const assert=require('node:assert/strict');
async function page(name,query='',extra={}) {
 const html=fs.readFileSync(name,'utf8');const dom=new JSDOM(html,{url:'https://erhu-auth.web.app/'+encodeURIComponent(name)+query,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const writes=[];
 const empty={exists:false,empty:true,docs:[],forEach(){},data(){return {};}};
 const store={collection(){return this},doc(){return this},orderBy(){return this},limit(){return this},async get(){return empty},async set(v){writes.push(v)},async add(v){writes.push(v);return {id:'test'};}};
 const ready=[];
 w.ErhuAuth={requireAuth(){},attachAuthUI(){},onReady(cb){ready.push(cb)},getCurrentUser(){return {uid:'unit-test',displayName:'測試'}},getCurrentDisplayName(){return '測試'},getScopedStorageKey(k){return k+'-unit-test'}};
 w.ErhuFirebase={db:store,auth:{currentUser:{async getIdToken(){return 'offline-test';}}}};
 w.firebase={firestore:{FieldValue:{serverTimestamp(){return 'test-date'}}}};
 w.matchMedia=q=>({matches:q.includes('min-width'),media:q,addEventListener(){},removeEventListener(){}});
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.assign(w,extra);
 for(const script of w.document.querySelectorAll('script')){
  const src=script.getAttribute('src');
  if(src && (/^https:/.test(src)||/\/(auth|firebase-init)\.js/.test(src)))continue;
  w.eval(src?fs.readFileSync(src.split('?')[0],'utf8'):script.textContent);
 }
 await Promise.all(ready.map(cb=>cb({uid:'unit-test',displayName:'測試'})));await new Promise(resolve=>setImmediate(resolve));
 return {dom,w,d:w.document,writes};
}
test('quiz high-to-beginner updates heading, tabs, selection and all 10 questions',async()=>{
 const {w,d}=await page('二胡小教室-小測驗.html','?level=advanced&grade=3');
 [...d.querySelectorAll('#levelTabs button')].find(b=>b.textContent==='初級').click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(d.querySelectorAll('#weekTabs button').length,3);assert.ok(d.querySelector('#weekTabs').textContent.includes('第一級'));assert.ok(!d.querySelector('#weekTabs').textContent.includes('第八級'));
 assert.match(d.querySelector('#pageTitle').textContent,/第一級/);assert.equal(d.querySelectorAll('.question').length,10);assert.equal(d.querySelectorAll('#weekTabs [aria-pressed="true"]').length,1);w.close();
});
test('course first grade keeps tasks and quiz/next navigation; third grade crosses to intermediate',async()=>{
 let p=await page('二胡小教室-週課程.html','?level=beginner&grade=1');assert.equal(p.d.querySelector('#practiceDetailPanel').hidden,false);assert.ok(p.d.querySelector('#quizLink').href.includes('小測驗')||decodeURI(p.d.querySelector('#quizLink').href).includes('小測驗'));p.w.close();
 p=await page('二胡小教室-週課程.html','?level=beginner&grade=3');assert.match(p.d.querySelector('#nextWeekLink').href,/level=intermediate&grade=1/);p.w.close();
});
test('missing piece never substitutes scale; upload action provided',async()=>{
 const {w,d}=await page('二胡小教室-AI音準評分.html','?practice=piece&piece='+encodeURIComponent('中把練習'));
 assert.match(d.querySelector('#sheetTitle').textContent,/尚無|無法|中把/);assert.equal(d.querySelector('#startButton').disabled,true);assert.ok([...d.querySelectorAll('#scoreSheet a')].some(a=>a.textContent==='上傳原譜'));w.close();
});
test('microphone rejection clears overlay and allows retry',async()=>{
 const {w,d}=await page('二胡小教室-AI音準評分.html');
 // Offline dependency stub, never calls an actual microphone or production API.
 w.ensureAudio=async()=>{const e=new Error('missing');e.name='NotFoundError';throw e;};
 await w.startSession();assert.equal(d.querySelector('#countdownOverlay').hidden,true);assert.equal(d.querySelector('#startButton').disabled,false);assert.match(d.querySelector('#resultSummary').textContent,/找不到麥克風/);w.close();
});
test('rest and sustain occupy score time and preserve cell alignment',async()=>{
 const {w}=await page('二胡小教室-AI音準評分.html');const t=w.parsePieceTimeline({beatUnits:4,rows:[{measures:[{cells:[{label:'1',units:4},{label:'-',units:4},{label:'0',units:4},{label:'2',units:4}]}]}]});assert.equal(t.events.length,4);assert.equal(t.totalBeats,4);assert.equal(t.events[2].rest,true);assert.equal(t.events[1].midi,t.events[0].midi);assert.equal(t.events[3].startBeat,3);w.close();
});
test('no-data report never creates progress or zero quiz score',async()=>{
 const {w,d}=await page('二胡小教室-AI錯音複習師.html');const s=w.buildWeeklySummary({},null,[]);assert.equal(s.quiz.available,false);assert.equal(s.quiz.bestScore,null);assert.ok(!w.buildFallbackReport(s).includes('成績尚未提升'));assert.ok(!w.buildFallbackReport(s).includes('有持續回到'));w.close();
});
test('demo engraves underlines, slurs, octave and rhythm dots without AI calls',async()=>{
 const {w,d}=await page('二胡小教室-AI體驗.html');assert.ok(d.querySelectorAll('#demoScore svg path').length>=5);assert.ok(d.querySelectorAll('#demoScore svg circle').length>=3);assert.match(d.querySelector('#demoPlan').textContent,/共 15 分鐘/);w.close();
});
test('tutor shows new questions and replies even when cloud history cannot save',async()=>{
 let finishReply;let requests=0;
 const {w,d}=await page('二胡小教室-AI助教.html','',{fetch:async()=>{requests++;return new Promise(resolve=>{finishReply=()=>resolve({ok:true,json:async()=>({answer:'先慢速練習換弦。'})});});}});
 w.ErhuFirebase.askTutorUrl='https://offline.invalid/tutor';
 w.ErhuFirebase.db.set=async()=>{throw Error('offline-test');};
 w.console.error=()=>{};
 d.querySelector('#questionInput').value='換弦怎麼練？';
 const pending=w.submitQuestion();
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(d.querySelector('#messages').textContent,/換弦怎麼練/);
 assert.equal(requests,1);assert.equal(d.querySelector('#askButton').disabled,true);
 assert.equal(d.querySelector('#chatSyncStatus').hidden,false);
 d.querySelector('#questionInput').value='下一個問題';
 await w.submitQuestion();assert.equal(requests,1);
 finishReply();await pending;await new Promise(resolve=>setImmediate(resolve));
 assert.match(d.querySelector('#messages').textContent,/先慢速練習換弦/);
 assert.equal(d.querySelector('#askButton').disabled,false);
 assert.equal(d.querySelector('#questionInput').value,'下一個問題');
 w.close();
});
test('tutor request does not wait for a stalled cloud history write',async()=>{
 let requests=0;let completeSave;
 const {w,d}=await page('二胡小教室-AI助教.html','',{fetch:async()=>{requests++;return {ok:true,json:async()=>({answer:'收到你的新問題。'})};}});
 w.ErhuFirebase.askTutorUrl='https://offline.invalid/tutor';
 w.ErhuFirebase.db.set=()=>new Promise(resolve=>{completeSave=resolve;});
 d.querySelector('#questionInput').value='如何持弓？';
 await w.submitQuestion();
 assert.equal(requests,1);assert.match(d.querySelector('#messages').textContent,/收到你的新問題/);
 w.ErhuFirebase.db.set=async()=>{};completeSave();await new Promise(resolve=>setImmediate(resolve));w.close();
});

test('short engraved rows keep the same note scale and retain all rows', async()=>{
 const {w,d}=await page('二胡小教室-AI體驗.html');
 const measure=labels=>({cells:labels.map(label=>({label,units:4}))});
 const score={header:{title:'排版測試',left:[],right:''},rows:[{measures:[measure(['1','2','3','1']),measure(['1','2','3','1'])]},{measures:[measure(['3','4','5'])]}]};
 const before=JSON.stringify(score);
 w.ErhuScoreRenderer.render(score,d.querySelector('#demoScore'));
 const rows=[...d.querySelectorAll('#demoScore svg')];
 assert.equal(rows.length,2);
 assert.equal(rows[0].getAttribute('viewBox'),rows[1].getAttribute('viewBox'));
 assert.equal(rows[0].style.width,rows[1].style.width);
 assert.equal(rows[1].querySelector('text').getAttribute('font-size'),'27');
 assert.equal(JSON.stringify(score),before);
 w.close();
});
test('preview quick editor writes through to original controls and supports note actions',async()=>{
 const {w,d}=await page('二胡小教室-譜面編輯器.html');
 const measure=d.querySelector('#previewSheet [data-source-row]');assert.ok(measure);measure.click();
 const panel=d.querySelector('#directEdit');assert.equal(panel.hidden,false);
 const input=panel.querySelector('[data-note-field="pitch"]');input.value='7';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(d.querySelector('#editorGrid [data-note-field="pitch"]').value,'7');
 const before=panel.querySelectorAll('.note-row[data-note-index]').length;
 panel.querySelector('[data-action="add-note"]').click();
 assert.equal(panel.querySelectorAll('.note-row[data-note-index]').length,before+1);
 assert.equal(d.querySelector('#editorGrid .measure-card').querySelectorAll('.note-row[data-note-index]').length,before+1);
 panel.querySelector('[data-nav="close"]').click();assert.equal(panel.hidden,true);w.close();
});
test('pitch cents preserve octave errors and detector rejects silence and noise',async()=>{
 const {w}=await page('二胡小教室-AI音準評分.html');
 assert.ok(Math.abs(w.getClosestTargetAlignment(440,69).signedCents)<0.001);
 assert.ok(Math.abs(w.getClosestTargetAlignment(880,69).signedCents-1200)<0.001);
 assert.ok(Math.abs(w.getClosestTargetAlignment(440*Math.pow(2,-25/1200),69).signedCents+25)<0.001);
 for(const rate of [44100,48000])for(const hz of [196,293.665,440,880]){
 const buffer=Float32Array.from({length:2048},(_,i)=>0.3*Math.sin(2*Math.PI*hz*i/rate));
 const detected=w.autoCorrelate(buffer,rate);assert.ok(detected);assert.ok(Math.abs(1200*Math.log2(detected/hz))<8,`${hz}: ${detected}`);
 }
 assert.equal(w.autoCorrelate(new Float32Array(2048),48000),null);
 let seed=42;const noise=Float32Array.from({length:2048},()=>{seed=(1664525*seed+1013904223)>>>0;return (seed/4294967296-.5)*.4;});
 assert.equal(w.autoCorrelate(noise,48000),null);w.close();
});
test('AI requests surface service errors and time out without retrying',async()=>{
 const {w}=await page('二胡小教室-AI助教.html');let calls=0;
 w.fetch=async()=>{calls++;return {ok:false,status:429,json:async()=>({message:'今天的使用次數已達上限。'})};};
 await assert.rejects(w.ErhuAI.request('/offline',{}),/使用次數已達上限/);assert.equal(calls,1);
 let signal;w.fetch=async(u,o)=>{signal=o.signal;return new Promise(()=>{});};
 await assert.rejects(w.ErhuAI.request('/offline',{},5),/逾時/);assert.equal(signal.aborted,true);w.close();
});
test('planner keeps generated content when cloud save fails',async()=>{
 const {w,d}=await page('二胡小教室-AI練習規劃師.html','',{fetch:async()=>({ok:true,json:async()=>({answer:'完成',tasks:[{title:'長弓',instruction:'放鬆肩膀',minutes:15}]})})});
 w.ErhuFirebase.db.set=async()=>{throw Error('offline');};
 await w.generatePlan();await new Promise(r=>setImmediate(r));
 assert.equal(d.querySelector('#planOutput').hidden,false);assert.match(d.querySelector('#planOutput').textContent,/長弓/);assert.equal(d.querySelector('#generateButton').disabled,false);w.close();
});
test('Zizhu source has all 13 rows and 88 bars, with exact half-unit timing and playable notes',async()=>{
 const {w,d}=await page('二胡小教室-AI音準評分.html','?practice=piece&piece='+encodeURIComponent('紫竹調'));
 const score=w.ErhuPieceScores.getBaseScore('紫竹調');assert.equal(score.rows.length,13);
 const bars=score.rows.flatMap(r=>r.measures);assert.equal(bars.length,88);
 bars.forEach(m=>assert.equal(m.cells.reduce((s,c)=>s+c.units,0),8));
 const timeline=w.parsePieceTimeline(score);assert.equal(timeline.totalBeats,176);assert.ok(timeline.events.every(e=>!e.unknown));
 assert.ok(timeline.events.some(e=>e.durationUnits===0.5));
 assert.equal(d.querySelector('#startButton').disabled,false);
 assert.equal(d.querySelectorAll('#scoreSheet .score-follow-measure').length,88);
 w.close();
});
test('Zizhu editor preserves dotted sixteenths and thirty-second notes',async()=>{
 const {w,d}=await page('二胡小教室-譜面編輯器.html','?piece='+encodeURIComponent('紫竹調'));
 w.loadPiece('紫竹調');const score=w.collectScoreFromEditor();
 assert.equal(score.rows[0].measures[5].cells[0].units,1.5);
 assert.equal(score.rows[0].measures[5].cells[0].label,'2.');
 assert.equal(score.rows[0].measures[5].cells[1].units,0.5);
 assert.ok(d.querySelector('.score-follow-underline.triple'));w.close();
});
