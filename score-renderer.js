/* Deterministic engraving of score data, never an AI-generated replacement picture. */
(function(root) {
  function render(score, target) {
    const esc=ErhuQuality.escape;
    const check=ErhuQuality.validateScore(score);
    target.replaceChildren(); target.className='engraved-score';
    const title=document.createElement('h3');title.textContent=score.header?.title||score.title||'掃描譜';target.append(title);
    const meta=document.createElement('div');meta.className='score-metadata';
    const left=document.createElement('span');left.textContent=(score.header?.left||[]).join('　');
    const right=document.createElement('span');right.textContent=score.header?.right||'';meta.append(left,right);target.append(meta);
    score.rows.forEach((row,ri)=>{
      let x=34; const marks=[];
      if(row.prefix)marks.push(`<text x="8" y="18" font-size="13">${esc(row.prefix)}</text>`);
      row.measures.forEach((measure,mi)=>{
        const widths=measure.cells.map(c=>Math.max(37, Math.min(90,c.units*8)));
        const positions=[];const begin=x;
        measure.cells.forEach((cell,ci)=>{
          positions.push(x+widths[ci]/2); const cx=positions[ci];
          const m=cell.label.match(/^([#b♯♭]?)([0-7])([',]*)(\.*)$/);
          const uncertain=cell.uncertain||cell.label==='?';
          if(uncertain) marks.push(`<rect x="${x}" y="44" width="${widths[ci]}" height="64" rx="6" fill="#fff0c2"/><title>第${ri+1}行第${mi+1}小節第${ci+1}音需確認</title>`);
          if(m){
            marks.push(`<text x="${cx}" y="81" text-anchor="middle" font-size="27" font-weight="600">${esc(m[2])}</text>`);
            if(m[1]) marks.push(`<text x="${cx-18}" y="73" font-size="17">${esc(m[1])}</text>`);
            [...m[3]].filter(c=>c==="'").forEach((_,i)=>marks.push(`<circle cx="${cx}" cy="${53-i*6}" r="1.7"/>`));
            [...m[3]].filter(c=>c===',').forEach((_,i)=>marks.push(`<circle cx="${cx}" cy="${104+i*6}" r="1.7"/>`));
            [...m[4]].forEach((_,i)=>marks.push(`<circle cx="${cx+14+i*6}" cy="73" r="2"/>`));
          }else marks.push(`<text x="${cx}" y="81" text-anchor="middle" font-size="25">${esc(cell.label)}</text>`);
          x+=widths[ci];
        });
        const span=(a)=>[positions[a[0]],positions[a[1]]];
        (measure.underlines||[]).forEach(a=>{const [start,end]=span(a);for(let n=0;n<Math.min(4,a[2]||1);n++)marks.push(`<path d="M${start-13} ${88+n*5} H${end+13}" stroke="currentColor" fill="none" stroke-width="1.5"/>`);});
        (measure.slurs||[]).forEach(a=>{const[start,end]=span(a);marks.push(`<path d="M${start} 42 Q${(start+end)/2} 19 ${end} 42" fill="none" stroke="currentColor" stroke-width="1.3"/>`);});
        [['bows',14],['fingerings',29],['upperNotes',121]].forEach(([key,y])=>(measure[key]||[]).forEach(a=>{const[start,end]=span(a);marks.push(`<text x="${(start+end)/2}" y="${y}" text-anchor="middle" font-size="12">${esc(a[2])}</text>`);}));
        if(measure.marker) marks.push(`<text x="${begin}" y="137" font-size="11">${esc(measure.marker)}</text>`);
        marks.push(`<path d="M${x+6} 55 V100" stroke="currentColor" stroke-width="1"/>`);x+=20;
      });
      const wrap=document.createElement('div');wrap.className='engraved-row';
      wrap.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="第 ${ri+1} 行簡譜" viewBox="0 0 ${x+10} 149" style="min-width:${Math.min(x+10,1200)}px;width:100%;max-height:200px">${marks.join('')}</svg>`;
      target.append(wrap);
    });
    return check;
  }
  root.ErhuScoreRenderer={render};
})(window);
