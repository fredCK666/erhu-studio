import {mkdir,cp,copyFile,readdir,rm,readFile,writeFile} from 'node:fs/promises';
await mkdir('quality-functions',{recursive:true});await copyFile('erhu-quality.js','quality-functions/erhu-quality.js');
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of await readdir('.'))if((file.endsWith('.html')&&!file.startsWith('計程車'))||/^(erhu-.*\.(css|js)|score-renderer.js|exam-.*\.js|firebase-init.js|auth.js|favicon.svg|site.webmanifest)$/.test(file))await copyFile(file,'dist/'+file);
await cp('assets','dist/assets',{recursive:true});
if(process.argv.includes('--quality-ai')){
 const p='dist/firebase-init.js';let s=await readFile(p,'utf8');s=s.replace('/askErhuTutorLive','/askErhuTutorV2').replace('/scanErhuScore"','/scanErhuScoreV2"');s=s.replace('functionsRegion: "asia-east1",','functionsRegion: "asia-east1",\n    qualityAi: true,');await writeFile(p,s);
}
console.log('Built dist. AI endpoints: '+(process.argv.includes('--quality-ai')?'V2 (deploy quality functions first)':'existing production backend'));
