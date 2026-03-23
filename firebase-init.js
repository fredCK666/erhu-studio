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

  window.ErhuFirebase = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.firestore(),
    projectId: firebaseConfig.projectId,
    functionsRegion: "asia-east1",
    functionsBaseUrl: "https://asia-east1-" + firebaseConfig.projectId + ".cloudfunctions.net",
    askTutorUrl: "https://asia-east1-" + firebaseConfig.projectId + ".cloudfunctions.net/askErhuTutor",
    askTutorFallbackUrl: "https://askerhututor-jbvhjct63a-de.a.run.app"
  };
})();
