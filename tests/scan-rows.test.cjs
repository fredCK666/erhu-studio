const test=require('node:test');const assert=require('node:assert/strict');
const {transcribeRows}=require('../quality-functions/scan-rows');
const layout={header:{title:'多行原譜',left:['1=G'],right:''},rows:Array.from({length:9},()=>({measureCount:1}))};
const reply=i=>({rowIndex:i+1,row:{prefix:'',measures:[{cells:[{label:String(i%7+1),units:4}]}]},warnings:[],complete:true});
test('scan transcribes every inventoried row and preserves order despite out-of-order replies',async()=>{
 let active=0,peak=0;const seen=[];
 const result=await transcribeRows(layout,async i=>{seen.push(i);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,(3-i%3)*2));active--;return reply(i);});
 assert.equal(result.rows.length,9);assert.equal(seen.length,9);assert.equal(peak,3);
 assert.deepEqual(result.rows.map(r=>r.sourceRow),[1,2,3,4,5,6,7,8,9]);assert.equal(result.complete,true);
});
test('scan refuses a first-row response returned for a later row',async()=>{
 await assert.rejects(transcribeRows(layout,async()=>reply(0)),/scan-row-missing/);
});
test('uncertain row remains incomplete while other rows are retained',async()=>{
 const result=await transcribeRows(layout,async i=>({...reply(i),complete:i!==4,warnings:i===4?['音符不清楚']:[]}));
 assert.equal(result.rows.length,9);assert.equal(result.complete,false);assert.match(result.warnings[0],/第 5 行/);
});
