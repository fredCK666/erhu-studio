'use strict';
const {legacyScore}=require('./schema');
function reviewScan(raw,layout) {
  const warnings=[...(layout.warnings||[]),...(raw.warnings||[])];
  const rowMismatch=raw.rows.length!==layout.rows.length;
  if(rowMismatch){
    warnings.push(`版面核對不一致：原圖盤點 ${layout.rows.length} 行，轉錄 ${raw.rows.length} 行。請勿視為完整譜面，建議逐行掃描。`);
    raw.complete=false;
  }
  const signature=header=>(header?.left||[]).join(' ').replace(/\s/g,'');
  if(signature(layout.header)!==signature(raw.header)){
    warnings.push('兩次辨識的調號、拍號或速度不一致，請依原圖手動確認；系統未自動補正。');
    raw.complete=false;
  }
  raw.rows.forEach((row,ri)=>{
    const expected=layout.rows[ri]?.measureCount;
    const mismatch=rowMismatch || (expected>0 && expected!==row.measures.length);
    if(!rowMismatch && mismatch){
      warnings.push(`第 ${ri+1} 行：原圖盤點 ${expected} 小節，轉錄 ${row.measures.length} 小節；此行標為待確認。`);
      raw.complete=false;
    }
    row.measures.forEach((m,mi)=>{
      if(mismatch)m.cells.forEach(c=>{c.uncertain=true;});
      m.slurs.forEach(a=>{
        if(!a.confirmed || a.end<=a.start)warnings.push(`第 ${ri+1} 行第 ${mi+1} 小節：連弓端點未確認，暫不繪製，請對照原圖補上。`);
      });
    });
  });
  return {score:legacyScore(raw),warnings:[...new Set(warnings)]};
}
module.exports={reviewScan};
