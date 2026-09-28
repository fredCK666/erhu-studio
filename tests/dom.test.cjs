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
