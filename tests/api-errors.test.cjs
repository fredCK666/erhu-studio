const test=require('node:test');const assert=require('node:assert/strict');
const {apiError,describe}=require('../quality-functions/errors');
test('API authentication, quota, schema and rate failures remain distinguishable',()=>{
 for(const [status,code,expected] of [[401,null,'api-auth'],[429,'insufficient_quota','api-quota'],[429,null,'api-rate'],[400,'invalid_json_schema','api-schema'],[404,'model_not_found','api-model']]){
 const error=apiError(status,{code,message:'private provider response'});error.stage='erhu_layout';const info=describe(error);assert.equal(info.code,expected);assert.equal(info.stage,'erhu_layout');assert.ok(!info.message.includes('private provider'));
 }
});
test('scan timeout, truncated output and invalid notation report the failing stage',()=>{
 for(const code of ['model-timeout','model-length','score-validation']){const error=Error(code);error.stage='erhu_score';const info=describe(error);assert.equal(info.code,code);assert.match(info.message,/音符與連弓辨識/);}
 const error=Error('sensitive raw text');assert.ok(!describe(error).message.includes('sensitive'));
});
