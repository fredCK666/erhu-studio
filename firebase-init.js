(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyClwRdoKTY35bqHP1OHAHsSBo50jWwqy98",
    authDomain: "erhu-auth.firebaseapp.com",
    projectId: "erhu-auth",
    storageBucket: "erhu-auth.firebasestorage.app",
    messagingSenderId: "319906716187",
    appId: "1:319906716187:web:29175cfb7a404509e0b6be",
    measurementId: "G-RYNY92VQ51"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  function readStoredScoreData(data) {
    const source = data || {};
    if (typeof source.scoreDataJson === "string" && source.scoreDataJson.trim()) {
      try {
        const parsed = JSON.parse(source.scoreDataJson);
        return parsed && Array.isArray(parsed.rows) ? parsed : null;
      } catch (error) {
        console.warn("read stored scoreDataJson failed", error);
      }
    }
    if (source.scoreData && Array.isArray(source.scoreData.rows)) {
      return source.scoreData;
    }
    return null;
  }

  function writeStoredScoreData(score) {
    return JSON.stringify(score || {});
  }

  window.ErhuScoreStorage = {
    read: readStoredScoreData,
    write: writeStoredScoreData
  };

  window.ErhuFirebase = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.firestore(),
    projectId: firebaseConfig.projectId,
    functionsRegion: "asia-east1",
    functionsBaseUrl: "https://asia-east1-" + firebaseConfig.projectId + ".cloudfunctions.net",
    askTutorUrl: "https://asia-east1-" + firebaseConfig.projectId + ".cloudfunctions.net/askErhuTutorLive",
    scanScoreUrl: "https://asia-east1-" + firebaseConfig.projectId + ".cloudfunctions.net/scanErhuScoreV2"
  };
})();
