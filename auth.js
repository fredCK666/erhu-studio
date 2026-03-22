(function () {
  function getAuth() {
    return window.ErhuFirebase.auth;
  }

  function getDb() {
    return window.ErhuFirebase.db;
  }

  function nextUrl() {
    return window.location.pathname.split("/").pop() + window.location.search;
  }

  function encodeNameToEmail(name) {
    const bytes = new TextEncoder().encode(name.trim());
    const hex = Array.from(bytes).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
    return "u_" + hex + "@erhu-auth.local";
  }

  function decodeNameFromEmail(email) {
    if (!email || email.indexOf("u_") !== 0 || email.indexOf("@erhu-auth.local") === -1) {
      return null;
    }
    try {
      const hex = email.slice(2, email.indexOf("@"));
      const bytes = [];
      for (let index = 0; index < hex.length; index += 2) {
        bytes.push(parseInt(hex.slice(index, index + 2), 16));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (error) {
      return null;
    }
  }

  async function saveStudentProfile(user, displayName) {
    await getDb().collection("students").doc(user.uid).set({
      displayName: displayName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function readStudentProfile(user) {
    const snapshot = await getDb().collection("students").doc(user.uid).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  function authErrorMessage(error, fallback) {
    if (error.code === "auth/email-already-in-use") {
      return "這個姓名已經註冊過，請直接登入或換一個姓名。";
    }
    if (error.code === "auth/weak-password") {
      return "密碼至少需要 6 個字元。";
    }
    if (error.code === "auth/operation-not-allowed") {
      return "Firebase 的電子郵件/密碼登入尚未啟用。";
    }
    if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      return "姓名或密碼不正確。";
    }
    if (error.code === "auth/network-request-failed") {
      return "網路連線失敗，請確認網路後再試。";
    }
    if (error.code === "permission-denied" || error.code === "firestore/permission-denied") {
      return "Firestore 權限被拒絕，請檢查規則是否已發布。";
    }
    return fallback + (error && error.code ? "（" + error.code + "）" : "");
  }

  async function register(name, password) {
    try {
      const credential = await getAuth().createUserWithEmailAndPassword(encodeNameToEmail(name), password);
      try {
        await credential.user.updateProfile({ displayName: name });
      } catch (profileUpdateError) {
        console.error("updateProfile(register) failed", profileUpdateError);
      }
      try {
        await saveStudentProfile(credential.user, name);
      } catch (profileError) {
        console.error("saveStudentProfile(register) failed", profileError);
      }
      return { ok: true };
    } catch (error) {
      console.error("register failed", error);
      return { ok: false, message: authErrorMessage(error, "註冊失敗，請稍後再試。") };
    }
  }

  async function login(name, password) {
    try {
      const credential = await getAuth().signInWithEmailAndPassword(encodeNameToEmail(name), password);
      if (!credential.user.displayName) {
        try {
          await credential.user.updateProfile({ displayName: name });
        } catch (profileUpdateError) {
          console.error("updateProfile(login) failed", profileUpdateError);
        }
      }
      try {
        await saveStudentProfile(credential.user, name);
      } catch (profileError) {
        console.error("saveStudentProfile(login) failed", profileError);
      }
      return { ok: true };
    } catch (error) {
      console.error("login failed", error);
      return { ok: false, message: authErrorMessage(error, "登入失敗，請稍後再試。") };
    }
  }

  function getCurrentUser() {
    const user = getAuth().currentUser;
    if (!user) return null;
    return {
      uid: user.uid,
      displayName: user.displayName || decodeNameFromEmail(user.email) || "學生"
    };
  }

  async function logout() {
    await getAuth().signOut();
    window.location.href = "./二胡小教室-登入.html";
  }

  function getScopedStorageKey(baseKey) {
    const user = getCurrentUser();
    return user ? baseKey + "-" + user.uid : baseKey;
  }

  function requireAuth() {
    getAuth().onAuthStateChanged(function (user) {
      if (user) return;
      const loginUrl = "./二胡小教室-登入.html?next=" + encodeURIComponent(nextUrl());
      if (window.location.pathname.indexOf("二胡小教室-登入.html") === -1) {
        window.location.replace(loginUrl);
      }
    });
  }

  function redirectIfAuthenticated(defaultUrl) {
    getAuth().onAuthStateChanged(function (user) {
      if (!user) return;
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      window.location.replace(next || defaultUrl || "./二胡小教室.html");
    });
  }

  function onReady(callback) {
    getAuth().onAuthStateChanged(async function (user) {
      if (!user) return;
      let displayName = user.displayName || decodeNameFromEmail(user.email) || "學生";
      try {
        const profile = await readStudentProfile(user);
        if (profile && profile.displayName) {
          displayName = profile.displayName;
        }
      } catch (error) {
        console.error("readStudentProfile(onReady) failed", error);
      }
      callback({
        uid: user.uid,
        displayName: displayName
      });
    });
  }

  function attachAuthUI() {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    getAuth().onAuthStateChanged(async function (user) {
      const existing = document.getElementById("authArea");
      if (existing) existing.remove();
      if (!user) return;
      let displayName = user.displayName || decodeNameFromEmail(user.email) || "學生";
      try {
        const profile = await readStudentProfile(user);
        if (profile && profile.displayName) {
          displayName = profile.displayName;
        }
      } catch (error) {
        console.error("readStudentProfile(attachAuthUI) failed", error);
      }
      const authArea = document.createElement("div");
      authArea.id = "authArea";
      authArea.style.display = "flex";
      authArea.style.alignItems = "center";
      authArea.style.gap = "10px";
      authArea.style.flexWrap = "wrap";
      authArea.innerHTML =
        "<span style=\"color:#69584d;font-weight:700;\">目前登入：" + displayName + "</span>" +
        "<button type=\"button\" id=\"logoutButton\" style=\"border:1px solid rgba(123,77,45,0.18);background:rgba(123,77,45,0.08);color:#7b4d2d;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer;\">登出</button>";
      topbar.appendChild(authArea);
      document.getElementById("logoutButton").addEventListener("click", function () {
        logout();
      });
    });
  }

  window.ErhuAuth = {
    getCurrentUser,
    getScopedStorageKey,
    register,
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    onReady,
    attachAuthUI
  };
})();
