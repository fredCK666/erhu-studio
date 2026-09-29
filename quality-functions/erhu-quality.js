/* Shared deterministic validation. Never infer missing evidence. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ErhuQuality = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function markdown(value) {
    return escape(value).replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function date(value) {
    if (!value) return '日期未記錄';
    const d = value.toDate ? value.toDate() : new Date(value.seconds ? value.seconds * 1000 : value);
    return Number.isFinite(d.getTime()) ? d.toLocaleString('zh-TW', {timeZone:'Asia/Taipei',hour12:false}) : '日期未記錄';
  }
  function quiz(data) {
    const valid = !!data && Number.isFinite(data.lastScore) && Number.isFinite(data.bestScore) && Number.isFinite(data.total) && data.total > 0;
    return {available:valid, lastScore:valid ? data.lastScore : null, bestScore:valid ? data.bestScore : null, total:valid ? data.total : null};
  }
  function report(summary) {
    const q=summary.quiz || {}, t=summary.tracker || {}, p=summary.pitch || {};
    return ['本級紀錄（依目前可讀取的資料）',
      '打卡：'+(t.completed ? '本級已完成。' : '本級尚未記錄完成。')+'打卡無法證明每日練習頻率。',
      q.available ? `測驗：最近 ${q.lastScore} / ${q.total}，最佳 ${q.bestScore} / ${q.total}。` : '測驗：尚無成績，無法判斷程度或是否進步。',
      p.sessionCount ? `跟譜：最近可讀取 ${p.sessionCount} 次，分數平均 ${p.averageScore}。不同曲目、調號、速度的分數不可直接比較。` : '跟譜：尚無紀錄，無法判斷音準。',
      '進步趨勢：目前摘要不足以判斷。系統未提供錄影表現或每日練習證據。', '',
      '下一步建議（不是已完成的成果）',
      q.available ? '複習本次答錯題目；不以單次分數代表演奏能力。' : '先完成一次本級測驗，建立比較基準。',
      p.topWrongNotes && p.topWrongNotes.length ? '慢練紀錄中的音：'+p.topWrongNotes.map(n=>n.label).join('、')+'。下次使用相同曲目、調號和速度再比較。' : '選一段熟悉樂句，以舒適速度練習並建立第一筆跟譜紀錄。'].join('\n');
  }
  function schedule(minutes, tasks) {
    const total=Math.max(3,Math.min(120,Math.round(Number(minutes)||15)));
    const list=(Array.isArray(tasks) && tasks.length ? tasks : [{title:'暖身與長弓',instruction:'放鬆肩膀，保持弓速平均。'},{title:'本級重點',instruction:'選兩小節慢練，記錄不穩的音。'},{title:'整合與回顧',instruction:'連續拉一次，再寫下一個明天要修的地方。'}]).slice(0, Math.min(8,total));
    const weights=list.map(t=>Math.max(1,Number(t.minutes)||1)); const sum=weights.reduce((a,b)=>a+b,0);
    const alloc=weights.map(w=>1+Math.floor((total-list.length)*w/sum));
    let remain=total-alloc.reduce((a,b)=>a+b,0); for(let i=0;remain>0;i++,remain--) alloc[i%alloc.length]++;
    return list.map((t,i)=>({title:String(t.title||'練習'), instruction:String(t.instruction||''), minutes:alloc[i]}));
  }
  function planText(minutes,tasks) {
    const list=schedule(minutes,tasks);
    return `今日練習｜共 ${list.reduce((s,t)=>s+t.minutes,0)} 分鐘\n\n`+list.map((t,i)=>`${i+1}. ${t.title}（${t.minutes} 分鐘）\n${t.instruction}`).join('\n\n');
  }
  function shuffled(question, random=Math.random) {
    const entries=question.options.map((text,i)=>({text,correct:i===question.answer}));
    for(let i=entries.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}
    return {...question,options:entries.map(e=>e.text),answer:entries.findIndex(e=>e.correct)};
  }
  function gradeNeighbor(level,grade,direction) {
    const groups=['beginner','intermediate','advanced'], sizes=[3,4,3];
    const idx=groups.indexOf(level); let absolute=sizes.slice(0,idx).reduce((a,b)=>a+b,0)+Number(grade)+direction;
    if(absolute<1||absolute>10)return null;
    for(let i=0;i<3;i++){if(absolute<=sizes[i])return {level:groups[i],grade:absolute};absolute-=sizes[i];}
  }
  function micError(error) {
    return ({NotFoundError:'找不到麥克風。請接上麥克風後按「開始」重試。',NotAllowedError:'麥克風權限未開啟。請在瀏覽器允許收音後重試。',NotReadableError:'麥克風正被其他程式使用，請關閉其他收音程式再重試。',SecurityError:'此頁無法啟用麥克風，請使用安全連線開啟。'})[error && error.name] || '無法啟用麥克風，請檢查裝置和瀏覽器權限後重試。';
  }
  function validateScore(score) {
    if(!score || !Array.isArray(score.rows) || !score.rows.length) throw Error('未辨識出譜行，請重新拍攝清晰原譜。');
    const warnings=[]; let cells=0, measures=0;
    const beatUnits=Number(score.beatUnits)||4;
    const meter=String((score.header?.left||[]).join(' ')).match(/\b(\d+)\s*\/\s*(\d+)\b/);
    const expected=meter ? Number(meter[1])*4/Number(meter[2])*beatUnits : null;
    score.rows.forEach((row,r)=>{
      if(!Array.isArray(row.measures)||!row.measures.length) throw Error(`第 ${r+1} 行沒有小節。`);
      row.measures.forEach((m,j)=>{
        measures++; if(!Array.isArray(m.cells)||!m.cells.length)throw Error(`第 ${r+1} 行第 ${j+1} 小節沒有音符。`);
        let units=0;
        m.cells.forEach((c,k)=>{
          cells++; if(typeof c.label!=='string'|| !Number.isFinite(c.units)||c.units<=0||c.units>128)throw Error('音符格式或時值不正確，請重新辨識。');
          if(!/^(?:[#b♯♭]?[0-7][',]*\.*|[-—–]|\?)$/.test(c.label))warnings.push(`第 ${r+1} 行第 ${j+1} 小節第 ${k+1} 音：記號「${c.label}」需確認。`);
          if(c.label==='?' || c.uncertain)warnings.push(`第 ${r+1} 行第 ${j+1} 小節第 ${k+1} 音：辨識不確定，請對照原圖。`);
          units+=c.units;
        });
        for(const key of ['underlines','slurs','bows','fingerings','upperNotes']) (m[key]||[]).forEach(span=>{
          if(!Array.isArray(span)||!Number.isInteger(span[0])||!Number.isInteger(span[1])||span[0]<0||span[1]<span[0]||span[1]>=m.cells.length)throw Error('譜面記號範圍不正確，請重新辨識。');
        });
        if(expected && Math.abs(units-expected)>0.01)warnings.push(`第 ${r+1} 行第 ${j+1} 小節：${units/beatUnits} 拍，請確認弱起、延長或漏音（拍號 ${meter[0]}）。`);
      });
    });
    if(cells>6000)throw Error('譜面過長，請分頁掃描。');
    return {warnings,cells,measures,rows:score.rows.length};
  }
  return {escape,markdown,date,quiz,report,schedule,planText,shuffled,gradeNeighbor,micError,validateScore};
});
