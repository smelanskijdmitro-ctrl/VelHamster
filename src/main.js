import './style.css';
import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup,
  signInWithRedirect, getRedirectResult, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  updateProfile
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, doc, setDoc, getCountFromServer
} from "firebase/firestore";

/*
  1) Firebase Console → Project settings → Your apps → Web app.
  2) Copy your Firebase config into the object below.
  3) Enable Authentication providers: Google, Apple, Email/Password.
  4) Create Firestore Database.
*/
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

const configured = !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));
let auth, db;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const categories = [
  ["Новости проекта","Обновления, события и важные объявления.","📢"],
  ["Общение игроков","Знакомства, обсуждения и разговоры сообщества.","💬"],
  ["Игровой процесс","Вопросы, советы и обсуждение VelHamster.","🐹"],
  ["Идеи и предложения","Предлагайте новые функции и улучшения.","💡"],
  ["Техническая поддержка","Помощь с проблемами и ошибками.","🛠️"],
  ["Жалобы","Сообщения о нарушениях правил.","⚠️"],
  ["Конкурсы и события","Мероприятия и активности сообщества.","🎉"]
];

const $ = (id) => document.getElementById(id);
let authMode = "login";
let currentUser = null;

$("year").textContent = new Date().getFullYear();

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);
}
function showStatus(id, message, error=false) {
  const el = $(id); el.textContent = message; el.className = `status ${error ? "error-text" : ""}`;
}
function openAuth(mode="login") {
  authMode = mode; updateAuthMode();
  $("auth-modal").classList.remove("hidden");
  $("auth-status").textContent = "";
}
function closeAuth() { $("auth-modal").classList.add("hidden"); }
function updateAuthMode() {
  const register = authMode === "register";
  $("auth-title").textContent = register ? "Создать аккаунт" : "Добро пожаловать!";
  $("auth-description").textContent = register ? "Присоединяйся к игровому сообществу." : "Войдите, чтобы продолжить общение.";
  $("email-submit").textContent = register ? "Создать аккаунт" : "Войти по почте";
  $("switch-text").textContent = register ? "Уже есть аккаунт?" : "Нет аккаунта?";
  $("switch-mode").textContent = register ? "Войти" : "Зарегистрироваться";
  $("password").autocomplete = register ? "new-password" : "current-password";
}

$("open-auth").addEventListener("click", () => openAuth("login"));
$("open-register").addEventListener("click", () => openAuth("register"));
$("hero-register").addEventListener("click", () => openAuth("register"));
$("close-auth").addEventListener("click", closeAuth);
$("auth-modal").addEventListener("click", e => { if (e.target.dataset.close) closeAuth(); });
$("switch-mode").addEventListener("click", () => { authMode = authMode === "login" ? "register" : "login"; updateAuthMode(); });
$("new-topic").addEventListener("click", () => {
  if (!currentUser) return openAuth("login");
  $("topic-modal").classList.remove("hidden");
});
$("close-topic").addEventListener("click", () => $("topic-modal").classList.add("hidden"));
$("topic-modal").addEventListener("click", e => { if (e.target.dataset.topicClose) $("topic-modal").classList.add("hidden"); });

function requireFirebase() {
  if (!configured) {
    showStatus("auth-status", "Сначала добавьте настройки Firebase в src/main.js.", true);
    return false;
  }
  return true;
}

async function saveUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName || (user.email ? user.email.split("@")[0] : "Игрок"),
    email: user.email || null,
    photoURL: user.photoURL || null,
    provider: user.providerData?.[0]?.providerId || "unknown",
    lastLoginAt: serverTimestamp()
  }, { merge: true });
}

async function finishLogin(user) {
  currentUser = user;
  await saveUserProfile(user);
  renderAccount();
  closeAuth();
  await loadForum();
}
function renderAccount() {
  const area = $("account-area");
  if (!currentUser) {
    area.innerHTML = '<button class="btn btn-ghost" id="open-auth">Войти</button><button class="btn" id="open-register">Регистрация</button>';
    $("open-auth").onclick = () => openAuth("login");
    $("open-register").onclick = () => openAuth("register");
    return;
  }
  const name = escapeHtml(currentUser.displayName || currentUser.email || "Игрок");
  area.innerHTML = `<span class="user-link">👤 ${name}</span><button class="btn btn-ghost" id="logout">Выйти</button>`;
  $("logout").onclick = async () => { await signOut(auth); currentUser = null; renderAccount(); };
}

async function providerLogin(provider, label) {
  if (!requireFirebase()) return;
  showStatus("auth-status", `Подключаем ${label}…`);
  try {
    const result = await signInWithPopup(auth, provider);
    await finishLogin(result.user);
  } catch (error) {
    // Some mobile browsers block popups. Redirect is a fallback for popup-blocked errors.
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error.code)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    showStatus("auth-status", firebaseError(error), true);
  }
}

$("google-login").addEventListener("click", () => providerLogin(new GoogleAuthProvider(), "Google"));
$("apple-login").addEventListener("click", () => {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  providerLogin(provider, "Apple");
});

$("email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!requireFirebase()) return;
  const email = $("email").value.trim();
  const password = $("password").value;
  try {
    let credential;
    if (authMode === "register") credential = await createUserWithEmailAndPassword(auth, email, password);
    else credential = await signInWithEmailAndPassword(auth, email, password);
    await finishLogin(credential.user);
  } catch (error) { showStatus("auth-status", firebaseError(error), true); }
});

function firebaseError(error) {
  const map = {
    "auth/email-already-in-use":"Этот адрес почты уже зарегистрирован.",
    "auth/invalid-email":"Проверьте адрес электронной почты.",
    "auth/weak-password":"Пароль слишком простой. Используйте минимум 6 символов.",
    "auth/user-not-found":"Аккаунт с такой почтой не найден.",
    "auth/wrong-password":"Неверный пароль.",
    "auth/invalid-credential":"Неверная почта или пароль.",
    "auth/popup-closed-by-user":"Окно входа было закрыто.",
    "auth/account-exists-with-different-credential":"Этот адрес уже используется другим способом входа.",
    "auth/unauthorized-domain":"Домен сайта не добавлен в разрешённые домены Firebase.",
    "auth/operation-not-allowed":"Этот способ входа не включён в Firebase Authentication.",
    "auth/invalid-oauth-client-id":"Проверьте настройки Apple Sign In в Firebase."
  };
  return map[error.code] || `Не удалось выполнить вход: ${error.message || error.code}`;
}

async function loadForum() {
  renderCategories();
  if (!configured) {
    $("topics-list").innerHTML = '<div class="empty">Добавьте конфигурацию Firebase, чтобы подключить форум.</div>';
    $("users-count").textContent = "—"; $("topics-count").textContent = "0"; $("posts-count").textContent = "0";
    return;
  }
  try {
    const topicQuery = query(collection(db, "topics"), orderBy("createdAt", "desc"), limit(12));
    const snapshot = await getDocs(topicQuery);
    $("topics-count").textContent = snapshot.size;
    if (!snapshot.empty) {
      $("topics-list").innerHTML = snapshot.docs.map(d => {
        const t = d.data();
        return `<a class="topic-row" href="#"><div class="topic-avatar">🐹</div><div class="topic-main"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.categoryName || "Обсуждение")} · ${escapeHtml(t.authorName || "Игрок")}</small></div></a>`;
      }).join("");
    } else $("topics-list").innerHTML = '<div class="empty">Пока нет тем. Создай первую!</div>';

    const usersCount = await getCountFromServer(collection(db, "users"));
    $("users-count").textContent = usersCount.data().count;
    $("posts-count").textContent = "—";
  } catch (error) {
    console.error(error);
    $("topics-list").innerHTML = '<div class="empty">Не удалось загрузить темы. Проверьте правила Firestore.</div>';
  }
}

function renderCategories() {
  $("categories").innerHTML = categories.map(([name,desc,icon], index) =>
    `<article class="category card"><div class="cat-icon">${icon}</div><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(desc)}</p><small>Раздел ${index+1}</small></div><span class="chevron">›</span></article>`
  ).join("");
  $("topic-category").innerHTML = categories.map(([name]) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

$("topic-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return openAuth("login");
  if (!configured) return showStatus("topic-status", "Сначала настройте Firebase.", true);
  const title = $("topic-heading").value.trim();
  const body = $("topic-body").value.trim();
  const categoryName = $("topic-category").value;
  if (title.length < 5 || body.length < 10) return showStatus("topic-status", "Заполните заголовок и сообщение.", true);
  try {
    await addDoc(collection(db, "topics"), {
      title, body, categoryName, authorUid: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email || "Игрок",
      createdAt: serverTimestamp()
    });
    $("topic-form").reset();
    $("topic-modal").classList.add("hidden");
    await loadForum();
  } catch (error) {
    console.error(error);
    showStatus("topic-status", "Не удалось опубликовать тему. Проверьте правила Firestore.", true);
  }
});

renderCategories();
renderAccount();
if (configured) {
  getRedirectResult(auth).then(async result => {
    if (result?.user) await finishLogin(result.user);
  }).catch(error => showStatus("auth-status", firebaseError(error), true));
  onAuthStateChanged(auth, async user => {
    currentUser = user;
    renderAccount();
    if (user) {
      try { await saveUserProfile(user); } catch (e) { console.warn("Profile sync:", e); }
    }
  });
}
loadForum();
