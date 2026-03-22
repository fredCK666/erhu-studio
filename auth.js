(function () {
  const ACCOUNT_KEY = "erhu-auth-account";
  const SESSION_KEY = "erhu-auth-session";

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getAccount() {
    return readJson(ACCOUNT_KEY);
  }

  function getSession() {
    return readJson(SESSION_KEY);
  }

  function getCurrentUser() {
    const account = getAccount();
    const session = getSession();
    if (!account || !session) return null;
    if (account.name !== session.name) return null;
    return account.name;
  }

  function register(name, password) {
    if (getAccount()) {
      return { ok: false, message: "這個網站已經註冊過帳號，請直接登入。" };
    }
    writeJson(ACCOUNT_KEY, { name: name, password: password });
    writeJson(SESSION_KEY, { name: name });
    return { ok: true };
  }

  function login(name, password) {
    const account = getAccount();
    if (!account) {
      return { ok: false, message: "目前還沒有帳號，請先註冊。" };
    }
    if (account.name !== name || account.password !== password) {
      return { ok: false, message: "姓名或密碼不正確。" };
    }
    writeJson(SESSION_KEY, { name: name });
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "./二胡小教室-登入.html";
  }

  function nextUrl() {
    return window.location.pathname.split("/").pop() + window.location.search;
  }

  function requireAuth() {
    if (getCurrentUser()) return true;
    const loginUrl = "./二胡小教室-登入.html?next=" + encodeURIComponent(nextUrl());
    window.location.replace(loginUrl);
    return false;
  }

  function redirectIfAuthenticated(defaultUrl) {
    if (!getCurrentUser()) return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    window.location.replace(next || defaultUrl || "./二胡小教室.html");
  }

  function attachAuthUI() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("authArea")) return;
    const user = getCurrentUser();
    if (!user) return;
    const authArea = document.createElement("div");
    authArea.id = "authArea";
    authArea.style.display = "flex";
    authArea.style.alignItems = "center";
    authArea.style.gap = "10px";
    authArea.style.flexWrap = "wrap";
    authArea.innerHTML =
      "<span style=\"color:#69584d;font-weight:700;\">目前登入：" + user + "</span>" +
      "<button type=\"button\" id=\"logoutButton\" style=\"border:1px solid rgba(123,77,45,0.18);background:rgba(123,77,45,0.08);color:#7b4d2d;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer;\">登出</button>";
    topbar.appendChild(authArea);
    document.getElementById("logoutButton").addEventListener("click", logout);
  }

  window.ErhuAuth = {
    getAccount,
    getCurrentUser,
    register,
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    attachAuthUI
  };
})();
