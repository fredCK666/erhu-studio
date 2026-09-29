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
