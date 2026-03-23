# Firebase Functions AI 助教部署

## 1. 安裝 Firebase CLI

```bash
npm install -g firebase-tools
```

## 2. 登入 Firebase

```bash
firebase login
```

## 3. 在專案根目錄設定 Firebase 專案

把 `.firebaserc.example` 複製成 `.firebaserc`，內容維持：

```json
{
  "projects": {
    "default": "erhu-auth"
  }
}
```

## 4. 安裝 Functions 依賴

```bash
cd functions
npm install
cd ..
```

## 5. 設定 OpenAI API Key

不要把 API key 寫進前端，也不要 commit 到 repo。

在目前專案根目錄執行：

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

輸入新的 API key。

## 6. 部署 Functions

```bash
firebase deploy --only functions
```

部署成功後，前端會呼叫：

```txt
https://asia-east1-erhu-auth.cloudfunctions.net/askErhuTutor
```

## 7. 驗證

1. 登入網站
2. 打開 `二胡小教室-AI助教.html`
3. 問一題課程問題
4. 回答來源應該會變成 OpenAI 後端回覆

## 補充

- 前端目前保留站內知識版備援；如果 Functions 尚未部署，會先用本地課程知識回答。
- 如果要更強的回答，可以之後把 `gpt-4o-mini` 換成其他模型。
- Firebase 官方文件說明 `onRequest` 函式要透過 `secrets: ["OPENAI_API_KEY"]` 綁定 secret，函式內再讀 `process.env.OPENAI_API_KEY`。
