const fs=require('node:fs'),vm=require('node:vm');let count=0;
for(const file of fs.readdirSync('.')){
 if(file.startsWith('計程車'))continue;
 if(file.endsWith('.js')) {new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});count++;}
 if(file.endsWith('.html'))for(const match of fs.readFileSync(file,'utf8').matchAll(/<script\b(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(match[1],{filename:file});count++;}
}
console.log(count+' scripts parsed successfully');
