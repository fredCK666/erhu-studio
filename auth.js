(function () {
  const ACCOUNT_KEY = "erhu-auth-account";
  const ACCOUNTS_KEY = "erhu-auth-accounts";
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

  function migrateAccounts() {
    const legacy = readJson(ACCOUNT_KEY);
    const accounts = readJson(ACCOUNTS_KEY);
    if (!accounts && legacy) {
      writeJson(ACCOUNTS_KEY, [legacy]);
    }
  }

  function getAccounts() {
    migrateAccounts();
    return readJson(ACCOUNTS_KEY) || [];
  }

  function getAccount() {
    const accounts = getAccounts();
    return accounts[0] || null;
  }

  function findAccount(name) {
    return getAccounts().find(function (account) {
      return account.name === name;
    }) || null;
  }

  function getSession() {
    return readJson(SESSION_KEY);
  }

  function register(name, password) {
    if (findAccount(name)) {
      return { ok: false, message: "這個姓名已經註冊過，請直接登入或換一個姓名。" };
    }
    const accounts = getAccounts();
    accounts.push({ name: name, password: password });
    writeJson(ACCOUNTS_KEY, accounts);
    writeJson(SESSION_KEY, { name: name });
    return { ok: true };
  }

  function login(name, password) {
    const account = findAccount(name);
    if (!getAccounts().length) {
      return { ok: false, message: "目前還沒有帳號，請先註冊。" };
    }
    if (!account || account.password !== password) {
      return { ok: false, message: "姓名或密碼不正確。" };
    }
    writeJson(SESSION_KEY, { name: name });
    return { ok: true };
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const account = findAccount(session.name);
    if (!account) return null;
    return account.name;
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
    getAccounts,
    getCurrentUser,
    register,
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    attachAuthUI
  };
})();
