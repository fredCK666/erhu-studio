(function () {
  let authInitPromise = null;

  function getAuth() {
    return window.ErhuFirebase && window.ErhuFirebase.auth ? window.ErhuFirebase.auth : null;
  }

  function getDb() {
    return window.ErhuFirebase && window.ErhuFirebase.db ? window.ErhuFirebase.db : null;
  }

  function hasAuthClient() {
    const auth = getAuth();
    return !!(auth && typeof auth.onAuthStateChanged === "function");
  }

  function nextUrl() {
    return window.location.pathname.split("/").pop() + window.location.search;
  }

  function getCurrentDisplayName() {
    const user = getCurrentUser();
    return user ? user.displayName : "學生";
  }

  function getCurrentPageName() {
    const page = window.location.pathname.split("/").pop();
    if (!page) return "index.html";
    try {
      return decodeURIComponent(page);
    } catch (error) {
      return page;
    }
  }

  function isPublicPage(pageName) {
    return pageName === "index.html"
      || pageName === "二胡小教室.html"
      || pageName === "二胡小教室-登入.html"
      || pageName === "二胡小教室-調音器.html"
      || pageName === "二胡小教室-AI體驗.html"
      || pageName === "二胡小教室-AI使用與隱私.html";
  }

  function sanitizeNextUrl(next, fallbackUrl) {
    const fallback = fallbackUrl || "./二胡小教室.html";
    if (!next) return fallback;
    try {
      const target = new URL(next, window.location.href);
      if (target.origin !== window.location.origin) {
        return fallback;
      }
      return target.pathname + target.search + target.hash;
    } catch (error) {
      return fallback;
    }
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
    if (!getDb()) return;
    await getDb().collection("students").doc(user.uid).set({
      displayName: displayName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function readStudentProfile(user) {
    if (!getDb()) return null;
    const snapshot = await getDb().collection("students").doc(user.uid).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  function authErrorMessage(error, fallback) {
    if (error.code === "auth/email-already-in-use") {
      return "這個帳號已經註冊過，請直接登入或使用忘記密碼。";
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

  async function register(name, password, email) {
    if (!hasAuthClient()) {
      return { ok: false, message: "登入系統尚未載入，請重新整理後再試。" };
    }
    try {
      const credential = await getAuth().createUserWithEmailAndPassword(email || encodeNameToEmail(name), password);
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
    if (!hasAuthClient()) {
      return { ok: false, message: "登入系統尚未載入，請重新整理後再試。" };
    }
    try {
      const credential = await getAuth().signInWithEmailAndPassword(name.includes("@") ? name.trim() : encodeNameToEmail(name), password);
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
    if (!hasAuthClient()) return null;
    const user = getAuth().currentUser;
    if (!user) return null;
    return {
      uid: user.uid,
      displayName: user.displayName || decodeNameFromEmail(user.email) || "學生"
    };
  }

  async function logout() {
    if (!hasAuthClient()) {
      window.location.replace("./二胡小教室-登入.html");
      return;
    }
    await getAuth().signOut();
    const currentPage = getCurrentPageName();
    if (isPublicPage(currentPage) && currentPage !== "二胡小教室-登入.html") {
      window.location.replace(window.location.pathname + window.location.search + window.location.hash);
      return;
    }
    window.location.replace("./二胡小教室-登入.html");
  }

  function getScopedStorageKey(baseKey) {
    const user = getCurrentUser();
    return user ? baseKey + "-" + user.uid : baseKey;
  }

  function waitForInitialAuthState() {
    if (authInitPromise) {
      return authInitPromise;
    }
    authInitPromise = new Promise(function (resolve) {
      if (!hasAuthClient()) {
        resolve(null);
        return;
      }
      let resolved = false;
      let unsubscribe = function () {};
      const finish = function (user) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        try {
          unsubscribe();
        } catch (error) {
          console.warn("unsubscribe(auth) failed", error);
        }
        resolve(user || null);
      };
      const timer = setTimeout(function () {
        console.warn("auth state check timed out");
        finish(getAuth() ? getAuth().currentUser : null);
      }, 3000);
      try {
        unsubscribe = getAuth().onAuthStateChanged(function (user) {
          finish(user);
        }, function (error) {
          console.error("onAuthStateChanged failed", error);
          finish(null);
        });
      } catch (error) {
        console.error("auth init failed", error);
        finish(null);
      }
    });
    return authInitPromise;
  }

  function setAuthGuardPending(isPending) {
    if (!document.body) return;
    document.body.style.visibility = isPending ? "hidden" : "";
  }

  async function requireAuth() {
    setAuthGuardPending(true);
    if (!hasAuthClient()) {
      console.warn("auth client unavailable; showing page without auth guard");
      setAuthGuardPending(false);
      return;
    }
    try {
      const user = await waitForInitialAuthState();
      if (user) {
        setAuthGuardPending(false);
        return;
      }
      const loginUrl = "./二胡小教室-登入.html?next=" + encodeURIComponent(nextUrl());
      if (window.location.pathname.indexOf("二胡小教室-登入.html") === -1) {
        window.location.replace(loginUrl);
        return;
      }
      setAuthGuardPending(false);
    } catch (error) {
      console.error("requireAuth failed", error);
      setAuthGuardPending(false);
      return;
    }
  }

  async function redirectIfAuthenticated(defaultUrl) {
    if (!hasAuthClient()) {
      return;
    }
    try {
      const user = await waitForInitialAuthState();
      if (user) {
        const params = new URLSearchParams(window.location.search);
        const next = sanitizeNextUrl(params.get("next"), defaultUrl || "./二胡小教室.html");
        window.location.replace(next);
      }
    } catch (error) {
      console.error("redirectIfAuthenticated failed", error);
    }
  }

  function onReady(callback) {
    if (!hasAuthClient()) return;
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

  function attachAuthUI(options) {
    const settings = options || {};
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    let authArea = document.getElementById("authArea");
    if (!authArea) {
      authArea = document.createElement("div");
      authArea.id = "authArea";
      topbar.appendChild(authArea);
    }
    authArea.style.display = "flex";
    authArea.style.alignItems = "center";
    authArea.style.justifyContent = "flex-end";
    authArea.style.gap = "10px";
    authArea.style.flexWrap = "nowrap";
    authArea.style.minWidth = "max-content";
    authArea.style.width = "max-content";
    authArea.style.whiteSpace = "nowrap";
    authArea.style.gridColumn = "4";
    authArea.style.gridRow = "1";
    if (!hasAuthClient()) {
      authArea.innerHTML = "";
      if (!settings.showGuestActions) return;
      const loginLink = document.createElement("a");
      loginLink.href = settings.guestHref || "./二胡小教室-登入.html";
      loginLink.style.display = "inline-flex";
      loginLink.style.alignItems = "center";
      loginLink.style.justifyContent = "center";
      loginLink.style.padding = "9px 12px";
      loginLink.style.borderRadius = "999px";
      loginLink.style.border = "1px solid rgba(123,77,45,0.18)";
      loginLink.style.background = "rgba(255,248,241,0.92)";
      loginLink.style.color = "#6b4328";
      loginLink.style.fontWeight = "800";
      loginLink.textContent = settings.guestLabel || "登入";
      authArea.appendChild(loginLink);
      return;
    }
    getAuth().onAuthStateChanged(async function (user) {
      authArea.innerHTML = "";
      if (!user) {
        if (!settings.showGuestActions) return;
        const loginLink = document.createElement("a");
        loginLink.href = settings.guestHref || "./二胡小教室-登入.html";
        loginLink.style.display = "inline-flex";
        loginLink.style.alignItems = "center";
        loginLink.style.justifyContent = "center";
        loginLink.style.padding = "9px 12px";
        loginLink.style.borderRadius = "999px";
        loginLink.style.border = "1px solid rgba(123,77,45,0.18)";
        loginLink.style.background = "rgba(255,248,241,0.92)";
        loginLink.style.color = "#6b4328";
        loginLink.style.fontWeight = "800";
        loginLink.textContent = settings.guestLabel || "登入";
        authArea.appendChild(loginLink);
        return;
      }
      let displayName = user.displayName || decodeNameFromEmail(user.email) || "學生";
      try {
        const profile = await readStudentProfile(user);
        if (profile && profile.displayName) {
          displayName = profile.displayName;
        }
      } catch (error) {
        console.error("readStudentProfile(attachAuthUI) failed", error);
      }
      const label = document.createElement("span");
      label.style.color = "#4f3829";
      label.style.fontWeight = "800";
      label.style.fontSize = "15px";
      label.style.whiteSpace = "nowrap";
      label.textContent = "目前登入：" + displayName;
      const logoutButton = document.createElement("button");
      logoutButton.type = "button";
      logoutButton.id = "logoutButton";
      logoutButton.style.border = "1px solid rgba(123,77,45,0.18)";
      logoutButton.style.background = "rgba(255,248,241,0.92)";
      logoutButton.style.color = "#6b4328";
      logoutButton.style.borderRadius = "999px";
      logoutButton.style.padding = "9px 12px";
      logoutButton.style.fontWeight = "800";
      logoutButton.style.cursor = "pointer";
      logoutButton.textContent = "登出";
      authArea.appendChild(label);
      authArea.appendChild(logoutButton);
      logoutButton.addEventListener("click", function () {
        logout();
      });
    });
  }

  window.ErhuAuth = {
    getCurrentUser,
    getCurrentDisplayName,
    getScopedStorageKey,
    register,
    async resetPassword(email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@erhu-auth.local")) return {ok:false,message:"舊姓名帳號沒有可收信信箱，請聯絡授課老師核對身分後協助復原。新帳號請填寫註冊信箱。"};
      try { await getAuth().sendPasswordResetEmail(email); return {ok:true,message:"若此信箱有可復原的帳號，將收到重設郵件。請檢查垃圾郵件。"}; }
      catch(error) { return {ok:false,message:authErrorMessage(error,"重設郵件暫時無法送出，請稍後再試。")}; }
    },
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    sanitizeNextUrl,
    onReady,
    attachAuthUI
  };
})();
