# Firebase Setup

這個網站目前已完成前端多學生切換，並且把打卡與測驗資料依登入學生分開保存。

若要升級成真正可跨裝置同步的 Firebase 版本，請先完成下面設定。

## 1. 建立 Firebase 專案

1. 到 Firebase Console 建立一個新專案。
2. 新增一個 Web App。
3. 取得 Web config。

## 2. 建立本機設定檔

1. 複製 `firebase-config.example.js`
2. 另存成 `firebase-config.js`
3. 把你的 Firebase Web config 貼進去

`firebase-config.js` 已加入 `.gitignore`，不會被誤提交。

## 3. 需要啟用的 Firebase 服務

- Authentication
  - 建議先開 `Email/Password`
  - 如果你要沿用現在的「姓名 + 密碼」UI，之後要改成把姓名轉成 email 或另外做帳號對照表
- Cloud Firestore
  - 用來存學生打卡與測驗分數

## 4. 建議的 Firestore 結構

### `students/{uid}`

- `displayName`
- `createdAt`

### `students/{uid}/trackers/{level}`

- `week_1` ~ `week_10`
- `updatedAt`

### `students/{uid}/quizScores/{level_week}`

- `level`
- `week`
- `lastScore`
- `bestScore`
- `total`
- `updatedAt`

## 5. Firestore 規則建議

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /students/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. Authentication 規則提醒

如果要讓學生真正跨裝置登入，不能只靠現在的 localStorage。

下一步建議改法：

1. 登入頁改接 Firebase Authentication
2. 用 Firestore 儲存 `displayName`
3. 打卡頁與測驗頁改寫成讀寫 Firestore

## 7. 目前還差什麼

真正切成 Firebase 版，還需要你提供：

- Firebase Web config
- 你想用哪種登入方式
  - `Email/Password`
  - 或維持目前的「姓名 + 密碼」外觀，再由我幫你包成 Firebase 流程

等你把 `firebase-config.js` 準備好，我就可以直接接下一步。
