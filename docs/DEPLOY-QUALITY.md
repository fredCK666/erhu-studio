# 部署二胡品質修正版

專案只能選 `erhu-auth`。不要使用美髮專案。不要直接部署舊 `functions/index.js`，也不要執行會刪除未知正式函式的全專案部署。

1. 安裝依賴、檢查與建置：

```sh
npm ci
npm run check
npm test
npm run build:quality
cd quality-functions
npm install
cd ..
```

2. 使用已授權的 Firebase CLI 登入，確認 project erhu-auth。既有 `OPENAI_API_KEY` Secret需可供此codebase的執行服務帳號讀取；不把金鑰寫進前端或提交Git。

3. 僅部署獨立codebase的三個新函式（不刪舊函式）：

```sh
firebase deploy --project erhu-auth --config firebase.quality.json --only functions:erhu-quality
```

4. 建立7天預覽頻道，完成登入、掃描、保存、跟譜、測驗及手機驗收後，再發布正式Hosting：

```sh
firebase hosting:channel:deploy quality-review --expires 7d --project erhu-auth --config firebase.quality.json
firebase deploy --only hosting --project erhu-auth --config firebase.quality.json
```

預覽網域若需要登入或呼叫V2，須由專案管理者在Firebase Auth與函式CORS設定加入**實際頻道網域**；不要放寬為任意網域。未加入時可先看免登入示範和首頁。

標準 `npm run build` 保留現有後端端點，可先驗收前端修復。V2會新增模型費用，掃譜限制每日24次、問答100次、規劃60次／帳號；需使用實際帳單監控預算，程式限額不是帳單上限。

Hosting發布前記錄目前版本；若有回歸，從Firebase Hosting部署歷史回復原版本。V2為新名稱，不需刪除既有函式即可退回舊前端。

目前本地無Firebase CLI憑證。瀏覽器可開啟erhu-auth專案，但嵌入Cloud Shell顯示 Site Unavailable；因此本分支不代表已發布正式站。


## 咖啡色首頁及前端介面發布（2026-09-28）

這次外觀更新使用現有正式後端，不必部署 V2 函式。只發布 Hosting：

```sh
npm ci
npm run check
npm test
npm run build
npx firebase-tools login
npx firebase-tools deploy --project erhu-auth --config firebase.hosting.json --only hosting
```

`firebase.hosting.json` 僅包含 erhu-auth Hosting，不會部署或刪除 Functions。正式版不包含示範帳號、固定 AI 回覆或本機模擬資料庫。發布後檢查首頁、登入、分級課程與掃譜；必要時可從 Firebase Hosting 部署歷史回復上一版。
