'use strict';
const known={
 'daily-limit':['今天的使用次數已達上限，請明天再試。',429],
 'api-auth':['AI 服務的 API 金鑰無效或已失效，需要更新後端金鑰。',502],
 'api-permission':['AI 服務帳號沒有使用此模型的權限，請檢查模型存取設定。',502],
 'api-quota':['AI 服務的 API 額度不足，請檢查 API 帳戶的餘額與使用上限。',502],
 'api-rate':['AI 服務暫時限流，請稍候再試。',429],
 'api-schema':['掃描服務的輸出格式設定被 API 拒絕，需要修正後端設定。',502],
 'api-model':['目前設定的 AI 模型無法使用，需要檢查後端模型設定。',502],
 'api-request':['AI 服務拒絕此次請求，請提供此錯誤代碼供排查。',502],
 'api-unavailable':['AI 服務暫時無法使用，請稍後重試。',502],
 'model-timeout':['AI 處理逾時，這次沒有完成辨識。可先選取一行譜面再試。',504],
 'model-length':['AI 回傳的譜面超過單次長度限制，請改掃半頁或單行。',502],
 'model-refusal':['AI 未提供辨識結果，請換一張清楚的譜面圖片再試。',502],
 'model-format':['AI 回傳的資料格式不完整，這次沒有可用的結果。',502],
 'invalid-images':['收到的圖片資料格式不正確，請重新選取 PNG、JPEG 或 WebP 圖片。',400],
 'invalid-beat-units':['AI 回傳的節奏單位不符合譜面格式，請重新辨識。',502],
 'score-validation':['AI 回傳的音符或記號範圍不合法，尚無法生成安全可編輯的譜面。',502],
 'usage-store':['目前無法讀取 AI 使用紀錄，請檢查後端資料庫服務。',503],
 'request-failed':['服務發生未分類錯誤，請提供此錯誤代碼供排查。',502]
};
function apiError(status,detail={}) {
 let code=status===401?'api-auth':status===403?'api-permission':status===429?'api-rate':status>=500?'api-unavailable':'api-request';
 if(detail.code==='insufficient_quota')code='api-quota';
 if(detail.code==='invalid_json_schema')code='api-schema';
 if(detail.code==='model_not_found')code='api-model';
 const e=Error(code);e.upstreamStatus=status;return e;
}
function describe(error){
 const code=error.name==='AbortError'?'model-timeout':known[error.message]?error.message:'request-failed';
 const [message,status]=known[code];
 const stage=['erhu_layout','erhu_score','tutor','practice_plan','validation','usage'].includes(error.stage)?error.stage:'request';
 const stageLabel={erhu_layout:'譜行與小節盤點',erhu_score:'音符與連弓辨識',validation:'譜面格式檢查',usage:'使用紀錄檢查'}[stage];
 return {code,stage,status,message:(stageLabel?stageLabel+'：':'')+message+'（'+code+' / '+stage+'）'};
}
module.exports={apiError,describe};
