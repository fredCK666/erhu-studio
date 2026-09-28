// Compare teacher-corrected JSON with an OCR result. No network, no training upload.
const fs=require('node:fs');
const [expectedPath,actualPath]=process.argv.slice(2);
if(!expectedPath||!actualPath){console.error('Usage: node tools/score-eval.cjs expected.json actual.json');process.exit(1);}
const load=p=>{const x=JSON.parse(fs.readFileSync(p,'utf8'));return x.score||x;};
const e=load(expectedPath),a=load(actualPath);
const cells=s=>s.rows.flatMap(r=>r.measures.flatMap(m=>m.cells.map(c=>[c.label,c.units])));
const x=cells(e),y=cells(a);
function distance(x,y,equal){let row=Array.from({length:y.length+1},(_,j)=>j);for(let i=0;i<x.length;i++){const next=[i+1];for(let j=0;j<y.length;j++)next[j+1]=Math.min(next[j]+1,row[j+1]+1,row[j]+(equal(x[i],y[j])?0:1));row=next;}return row[y.length];}
const notes=distance(x,y,(u,v)=>u[0]===v[0]);const rhythm=distance(x,y,(u,v)=>u[0]===v[0]&&u[1]===v[1]);
const count=s=>({rows:s.rows.length,measures:s.rows.reduce((n,r)=>n+r.measures.length,0),notes:cells(s).length});
console.log(JSON.stringify({expected:count(e),actual:count(a),noteEditDistance:notes,noteAndDurationEditDistance:rhythm,noteErrorRate:x.length?notes/x.length:null,noteAndDurationErrorRate:x.length?rhythm/x.length:null,warning:'記號位置、弓法、指法及版面仍需人工逐項評分；這不是模型準確率宣稱。'},null,2));
