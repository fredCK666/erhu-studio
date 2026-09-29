'use strict';
async function transcribeRows(layout,transcribe,{concurrency=3}={}){
 if(!Array.isArray(layout.rows)||!layout.rows.length||layout.rows.length>24)throw Error('scan-layout');
 const output=new Array(layout.rows.length);let cursor=0;let stopped=false;
 async function worker(){
  while(!stopped && cursor<layout.rows.length){
   const index=cursor++;
   let result;
   try{result=await transcribe(index,layout.rows[index]);}catch(error){stopped=true;throw error;}
   if(result.rowIndex!==index+1 || !result.row || !Array.isArray(result.row.measures) || !result.row.measures.length){stopped=true;throw Error('scan-row-missing');}
   output[index]=result;
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,layout.rows.length)},worker));
 return {title:layout.header.title,header:layout.header,beatUnits:4,
  rows:output.map((r,i)=>({...r.row,sourceRow:i+1})),
  warnings:output.flatMap((r,i)=>(r.warnings||[]).map(w=>`第 ${i+1} 行：${w}`)),
  complete:output.every(r=>r.complete===true)};
}
module.exports={transcribeRows};
