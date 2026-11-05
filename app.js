/* ==========================================================================
   حُجرية بريس (Hujariya Press) — المحرك البرمجي الشامل لغرفة التحكم العليا (app.js)
   النسخة القيادية الكاملة (Control Room v5.0):
   1. مصادقة إدارية محكمة + ربط رمز الدخول السريع (PIN) بالجهاز الموثق حصراً
   2. مركز المراجعات الرباعي: (المنشورات المعلقة، التوقيعات الثلاثية، توثيق الهويات KYC، وطلبات الحذف)
   3. إدارة شاملة للأخبار: فلاتر ذكية + أزرار فورية لتبديل (العاجل / الواجهة الكبرى / النبض) + محرر تعديل كامل
   4. السيطرة الكاملة على الكادر (God Mode Dossier):
      - توليد الهوية الصحفية الثابتة (HP##### بدون شرطة)
      - تعديل كلمة المرور، اسم المستخدم، الـ PIN، الصورة الشخصية، المسمى، والصلاحيات في أي وقت
      - تخصيص الأقسام المسموحة لكل صحفي (قسم واحد إجباري، عدة أقسام، أو الكل)
      - تجميد/تفعيل الحساب، منح/سحب الشارة الزرقاء، النشر المباشر، ومراسلة فورية عبر واتساب والبريد
   5. إدارة الأقسام الرئيسية والفرعية + إدارة الإعلانات الممولة مع إحصائيات المشاهدات والنقرات
   6. إعدادات الهوية الكاملة: الشعارات الثلاثة، اللون الديناميكي العام، ترقية إصدار ميثاق الشرف، والتواصل
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================== 1. إعدادات الاتصال بقاعدة بيانات Firebase ====================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAd4Df_Fpp2GlGkRPyvmKuFW68LbL_a4yU",
  authDomain: "rawi-01.firebaseapp.com",
  databaseURL: "https://rawi-01-default-rtdb.firebaseio.com",
  projectId: "rawi-01",
  storageBucket: "rawi-01.firebasestorage.app",
  messagingSenderId: "91203142966",
  appId: "1:91203142966:web:a44f7c06c98529a57a9f97",
  measurementId: "G-2VNWNSZLBJ"
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// مفاتيح الجلسة وربط الجهاز والكاش السريع لغرفة التحكم
const CR_SESSION_KEY = "hujariya_cr_admin_session_v5";
const CR_DEVICE_BOUND_KEY = "hujariya_cr_device_bound_v5";
const CR_FAST_CACHE_KEY = "hujariya_cr_fast_cache_v5";

const DEFAULT_BRAND_COLOR = "#b80d38";

const DEFAULT_COMPASSES = [
  {
    id: "yemen-politics",
    name: "السياسة اليمنية",
    subcategories: ["الشرعية ومؤسسات الدولة", "التحليلات الاستراتيجية", "الشأن المحلي والمحافظات", "كشف زيف الميليشيات"],
    visible: true,
    order: 1
  },
  {
    id: "saudi-politics",
    name: "السياسة السعودية",
    subcategories: ["الأمن القومي المشترك", "الدبلوماسية الإقليمية", "رؤية المملكة 2030", "المشاريع التنموية"],
    visible: true,
    order: 2
  },
  {
    id: "regional-international",
    name: "إقليمي ودولي",
    subcategories: ["الشرق الأوسط", "السياسة الدولية", "أمن البحر الأحمر والممرات"],
    visible: true,
    order: 3
  },
  {
    id: "economy-dev",
    name: "اقتصاد وأسواق",
    subcategories: ["أسواق وعملات", "طاقة ونفط", "إعمار وتنمية", "بورصات عالمية"],
    visible: true,
    order: 4
  },
  {
    id: "sports",
    name: "الرياضة",
    subcategories: ["الكرة اليمنية", "الدوري السعودي", "الكرة العالمية", "بطولات دولية"],
    visible: true,
    order: 5
  },
  {
    id: "health-science",
    name: "صحة وعلوم وفضاء",
    subcategories: ["طب وصحة", "أبحاث الفضاء والفلك", "اكتشافات علمية", "بيئة ومناخ"],
    visible: true,
    order: 6
  },
  {
    id: "tech-future",
    name: "تقنية ومستقبل",
    subcategories: ["الذكاء الاصطناعي", "الأمن السيبراني", "تطبيقات ومنصات", "ابتكارات"],
    visible: true,
    order: 7
  },
  {
    id: "culture-thought",
    name: "ثقافة وفكر",
    subcategories: ["أدب وفكر", "تاريخ وهوية", "قراءات وكتب", "مقالات الرأي"],
    visible: true,
    order: 8
  },
  {
    id: "art-media",
    name: "فن وإعلام",
    subcategories: ["فن ودراما", "إعلام رقمي", "تراث وفنون"],
    visible: true,
    order: 9
  }
];

const DEFAULT_CHARTER_HTML = `
  <h3>أولاً: الالتزام المهني والمصداقية الصحفية</h3>
  <p>يلتزم الصحفي والكاتب في منصة <strong>حُجرية بريس (Hujariya Press)</strong> بتحري الدقة والموضوعية، والتثبت من صحة الأخبار والمصادر قبل صياغتها أو إرسالها للنشر.</p>
  <h3>ثانياً: الثوابت الوطنية والمسؤولية القانونية</h3>
  <p>يلتزم العضو باحترام الثوابت الوطنية والمهنية، والامتناع التام عن نشر الشائعات أو المواد المنتهكة للحقوق، ويتحمل المسؤولية القانونية الكاملة عن صحة بياناته ووثائقه الرسمية المرفقة في ملف هويته الصحفية.</p>
  <h3>ثالثاً: أمان غرفة الأخبار والهوية الصحفية</h3>
  <p>تُعد الهوية الصحفية (HP) وبيانات الدخول عهدة شخصية، ويُعد التوقيع الرقمي الحي إقراراً رسمياً ملزماً بكافة بنود هذا الميثاق وتحديثاته.</p>
`;

const MASTER_ADMIN_DEFAULT = {
  id: "master-admin",
  pressId: "HP10001",
  name: "رئيس التحرير — الإدارة العليا",
  username: "admin",
  role: "admin",
  isMasterAdmin: true,
  verified: true
};

// ==================== 2. الحالة المركزية لغرفة التحكم (State) ====================
const state = {
  currentAdmin: null,
  settings: {
    siteName: "حُجرية بريس",
    siteDescription: "منصة إخبارية وتحليلية شاملة تندرج تحت مظلة مؤسسة RAWI-YE.COM الإعلامية الرقمية.",
    accentColor: DEFAULT_BRAND_COLOR,
    hideSiteName: false,
    logoUrl: "",
    headerLogoUrl: "",
    sidebarLogoUrl: "",
    authLogoUrl: "",
    footerLogoUrl: "",
    defaultPostImageUrl: "",
    faviconUrl: "",
    appIconUrl: "",
    charterHtml: DEFAULT_CHARTER_HTML,
    charterVersion: 1,
    aboutHtml: "",
    privacyHtml: "",
    socials: {},
    masterUsername: "admin",
    masterPassword: "admin",
    masterPin: "0000"
  },
  compasses: structuredClone(DEFAULT_COMPASSES),
  posts: [],
  staff: [],
  ads: [],
  activeView: "view-reviews",
  activeReviewSubtab: "rev-pane-posts",
  postsFilterType: "all",
  postsFilterCategory: "all",
  postsSearchQuery: "",
  staffSearchQuery: "",
  activeDossierStaffId: null,
  dossierAvatarTempData: "",
  editPostImageTempData: "",
  adImageTempData: ""
};

// ==================== 3. الدوال المساعدة، الهوية اللونية الديناميكية، وحساب العمر ====================
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanCategoryName(name = "") {
  return (
    String(name)
      .replace(/^بوصلة\s+/i, "")
      .replace(/^البوصلة\s+/i, "")
      .trim() || name
  );
}

function normalizePressId(raw = "") {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function generateUniquePressId(staffList = []) {
  const used = new Set(
    staffList.map((s) => normalizePressId(s.pressId || "")).filter(Boolean)
  );
  used.add("HP10001");
  let num = 10015 + staffList.length * 9;
  while (used.has(`HP${num}`)) {
    num += Math.floor(Math.random() * 7) + 1;
  }
  return `HP${String(num).slice(0, 5).padStart(5, "1")}`;
}

function showToast(msg) {
  const toast = document.getElementById("cr-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(window.__crToastTimer);
  window.__crToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3400);
}

function getTimestampMs(item) {
  if (!item) return 0;
  const t =
    item.createdAt ||
    item.updatedAt ||
    item.signedAt ||
    item.kycSubmittedAt ||
    item.createdTimestamp;
  if (!t) return 0;
  if (typeof t.toMillis === "function") return t.toMillis();
  if (typeof t.seconds === "number") return t.seconds * 1000;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function formatArabicDate(msOrItem) {
  const ms = typeof msOrItem === "number" ? msOrItem : getTimestampMs(msOrItem);
  if (!ms) return "منذ قليل";
  return new Date(ms).toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function calculateAutoAge(dobStr) {
  if (!dobStr) return null;
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

function hexToRgbTuple(hex = DEFAULT_BRAND_COLOR) {
  const clean = String(hex).replace("#", "").trim();
  if (clean.length !== 6) return "184, 13, 56";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "184, 13, 56";
  return `${r}, ${g}, ${b}`;
}

function darkenHexColor(hex = DEFAULT_BRAND_COLOR, factor = 0.76) {
  const clean = String(hex).replace("#", "").trim();
  if (clean.length !== 6) return "#8e0729";
  const r = Math.max(0, Math.floor(parseInt(clean.slice(0, 2), 16) * factor));
  const g = Math.max(0, Math.floor(parseInt(clean.slice(2, 4), 16) * factor));
  const b = Math.max(0, Math.floor(parseInt(clean.slice(4, 6), 16) * factor));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function applyDynamicThemeAndBranding(overrideColor = "") {
  const s = state.settings;
  const rawColor = (overrideColor || s.accentColor || "").trim();
  const primaryColor =
    !rawColor || rawColor.toLowerCase() === "#ef3327"
      ? DEFAULT_BRAND_COLOR
      : rawColor;
  const rgb = hexToRgbTuple(primaryColor);
  const darkColor = darkenHexColor(primaryColor, 0.76);

  const root = document.documentElement;
  root.style.setProperty("--brand-primary", primaryColor);
  root.style.setProperty("--brand-dark", darkColor);
  root.style.setProperty("--brand-soft", `rgba(${rgb}, 0.08)`);
  root.style.setProperty("--brand-border", `rgba(${rgb}, 0.24)`);
  root.style.setProperty("--brand-shadow", `0 8px 26px rgba(${rgb}, 0.14)`);

  document.getElementById("cr-theme-color")?.setAttribute("content", primaryColor);

  const siteName =
    s.siteName && s.siteName !== "شبكة البوصلة" && s.siteName !== "نبض اليمن"
      ? s.siteName
      : "حُجرية بريس";

  document.title = `غرفة التحكم العليا | ${siteName}`;
  const authSite = document.getElementById("auth-site-name");
  if (authSite) authSite.textContent = `غرفة التحكم العليا — ${siteName}`;

  const subTitle = document.getElementById("header-platform-subtitle");
  if (subTitle) subTitle.textContent = siteName;

  const footerSite = document.getElementById("footer-site-name");
  if (footerSite) footerSite.textContent = siteName;

  const mainLogo = (s.headerLogoUrl || s.logoUrl || "").trim();
  const authLogo = (s.sidebarLogoUrl || s.authLogoUrl || s.logoUrl || "").trim();
  const footerLogo = (s.footerLogoUrl || s.logoUrl || "").trim();

  const setLogoDom = (imgId, capId, url) => {
    const img = document.getElementById(imgId);
    const cap = capId ? document.getElementById(capId) : null;
    if (!img) return;
    if (url) {
      img.src = url;
      img.classList.remove("hidden");
      cap?.classList.remove("hidden");
    } else {
      img.classList.add("hidden");
      cap?.classList.add("hidden");
    }
  };

  setLogoDom("auth-logo-img", "auth-logo-capsule", authLogo);
  setLogoDom("header-logo-img", "header-logo-capsule", mainLogo);
  setLogoDom("footer-logo-img", null, footerLogo);

  const fav = (s.faviconUrl || s.appIconUrl || mainLogo || "").trim();
  if (fav) {
    document.getElementById("cr-dynamic-favicon")?.setAttribute("href", fav);
    document.getElementById("cr-dynamic-apple-icon")?.setAttribute("href", fav);
  }
}

function compressImageToWebp(file, maxWidth = 1100, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / (img.width || maxWidth));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round((img.width || maxWidth) * scale);
        canvas.height = Math.round((img.height || maxWidth) * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error("فشل تحميل الملف"));
    reader.readAsDataURL(file);
  });
}

function openImageInLightbox(imgSrc) {
  if (!imgSrc) return;
  const modal = document.getElementById("cr-image-lightbox");
  const img = document.getElementById("lightbox-preview-img");
  if (!modal || !img) return;
  img.src = imgSrc;
  modal.classList.remove("hidden");
}

// ==================== 4. الكاش السريع (0ms Instant Cache) ====================
function saveFastCache() {
  try {
    const payload = {
      savedAt: Date.now(),
      settings: state.settings,
      compasses: state.compasses,
      staff: state.staff,
      posts: state.posts.slice(0, 80),
      ads: state.ads
    };
    localStorage.setItem(CR_FAST_CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function restoreFastCache() {
  try {
    const raw = localStorage.getItem(CR_FAST_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed) return false;

    if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
    if (Array.isArray(parsed.compasses) && parsed.compasses.length) {
      state.compasses = parsed.compasses;
    }
    if (Array.isArray(parsed.staff)) state.staff = parsed.staff;
    if (Array.isArray(parsed.posts)) state.posts = parsed.posts;
    if (Array.isArray(parsed.ads)) state.ads = parsed.ads;

    applyDynamicThemeAndBranding();
    return true;
  } catch (_) {
    return false;
  }
}

// ==================== 5. نظام الدخول الإداري المحكم والـ PIN المرتبط بالجهاز ====================
function getDeviceBoundAdmin() {
  try {
    const raw = localStorage.getItem(CR_DEVICE_BOUND_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.adminId || !parsed.deviceToken) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function bindAdminToCurrentDevice(adminObj) {
  if (!adminObj || !adminObj.id) return;
  try {
    const existing = getDeviceBoundAdmin();
    const token =
      existing?.deviceToken ||
      `CRDEV_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      adminId: adminObj.id,
      pressId: normalizePressId(adminObj.pressId || "HP10001"),
      name: adminObj.name || "رئيس التحرير",
      deviceToken: token,
      boundAt: Date.now()
    };
    localStorage.setItem(CR_DEVICE_BOUND_KEY, JSON.stringify(payload));
    refreshPinLoginUi();
  } catch (_) {}
}

function clearDeviceBoundAdmin() {
  localStorage.removeItem(CR_DEVICE_BOUND_KEY);
  refreshPinLoginUi();
}

function refreshPinLoginUi() {
  const bound = getDeviceBoundAdmin();
  const unboundNotice = document.getElementById("pin-unbound-notice");
  const pinForm = document.getElementById("cr-login-pin-form");

  if (!bound) {
    unboundNotice?.classList.remove("hidden");
    pinForm?.classList.add("hidden");
    return;
  }

  unboundNotice?.classList.add("hidden");
  pinForm?.classList.remove("hidden");

  const nameEl = document.getElementById("pin-bound-name");
  if (nameEl) nameEl.textContent = bound.name || "المدير العام";

  const pidEl = document.getElementById("pin-bound-press-id");
  if (pidEl) pidEl.textContent = bound.pressId || "HP10001";
}

function verifyAdminCredentials(identifierRaw, passwordRaw) {
  const idClean = String(identifierRaw || "").trim().toLowerCase();
  const pressIdClean = normalizePressId(identifierRaw);
  const passClean = String(passwordRaw || "").trim();

  // 1. التحقق من حساب المدير العام (Master Admin)
  const masterUser = String(state.settings.masterUsername || "admin").trim().toLowerCase();
  const masterPass = String(state.settings.masterPassword || "admin").trim();

  if (
    (idClean === masterUser || idClean === "admin" || pressIdClean === "HP10001") &&
    (passClean === masterPass || (!state.settings.masterPassword && passClean === "admin"))
  ) {
    return {
      ...MASTER_ADMIN_DEFAULT,
      username: state.settings.masterUsername || "admin"
    };
  }

  // 2. التحقق من مديري التحرير المخولين في الكادر (role === "admin" أو isMasterAdmin)
  const matchedAdmin = state.staff.find((s) => {
    const isAdminRole = Boolean(
      s.isMasterAdmin || s.role === "admin" || s.role === "editor_in_chief"
    );
    if (!isAdminRole || s.accountStatus === "frozen") return false;

    const sUser = String(s.username || "").trim().toLowerCase();
    const sEmail = String(s.email || s.contactEmail || "").trim().toLowerCase();
    const sPid = normalizePressId(s.pressId || "");

    const idMatch =
      (idClean && (sUser === idClean || sEmail === idClean)) ||
      (pressIdClean && sPid === pressIdClean);

    return idMatch && String(s.password || "").trim() === passClean;
  });

  return matchedAdmin || null;
}

function verifyDeviceBoundAdminPin(pinRaw) {
  const pinClean = String(pinRaw || "").trim();
  if (!pinClean) return { error: "يرجى إدخال رمز الدخول السريع (PIN)" };

  const bound = getDeviceBoundAdmin();
  if (!bound || !bound.adminId) {
    return {
      error: "هذا الجهاز غير موثق بعد. سجل دخولك أولاً بمعرف المدير وكلمة المرور."
    };
  }

  if (bound.adminId === "master-admin" || bound.pressId === "HP10001") {
    const masterPin = String(state.settings.masterPin || "0000").trim();
    if (pinClean === masterPin) {
      return { user: { ...MASTER_ADMIN_DEFAULT } };
    }
    return { error: "رمز الدخول السريع (PIN) غير صحيح" };
  }

  const staffAdmin = state.staff.find(
    (s) => s.id === bound.adminId || normalizePressId(s.pressId) === bound.pressId
  );

  if (!staffAdmin || staffAdmin.accountStatus === "frozen") {
    return { error: "الحساب غير متاح، يرجى الدخول بكلمة المرور" };
  }

  const savedPin = String(staffAdmin.pinCode || staffAdmin.pin || "").trim();
  if (!savedPin || savedPin !== pinClean) {
    return { error: "رمز الدخول السريع (PIN) غير مطابق" };
  }

  return { user: staffAdmin };
}

function activateAdminSession(adminObj, cameFromPassword = false) {
  state.currentAdmin = adminObj;
  localStorage.setItem(
    CR_SESSION_KEY,
    JSON.stringify({ id: adminObj.id, pressId: adminObj.pressId || "HP10001" })
  );

  if (cameFromPassword) {
    bindAdminToCurrentDevice(adminObj);
  }

  document.getElementById("cr-auth-gate")?.classList.add("hidden");
  const adminNameEl = document.getElementById("header-admin-name");
  if (adminNameEl) adminNameEl.textContent = adminObj.name || "رئيس التحرير";

  renderAllControlRoomViews();
}

function handleAdminLogout() {
  state.currentAdmin = null;
  localStorage.removeItem(CR_SESSION_KEY);
  refreshPinLoginUi();
  document.getElementById("cr-auth-gate")?.classList.remove("hidden");
  showToast("تم تسجيل الخروج من غرفة التحكم العليا");
}

// ==================== 6. الإحصائيات العليا ومركز المراجعات الرباعي (View 1) ====================
function renderTopPlatformStats() {
  const pendingPosts = state.posts.filter((p) => p.status === "pending").length;
  const pendingSigs = state.staff.filter((s) => s.signatureStatus === "pending").length;
  const pendingKyc = state.staff.filter((s) => s.kycStatus === "pending").length;
  const deleteReqs = state.posts.filter((p) => p.status === "delete_request").length;

  const totalPendingTasks = pendingPosts + pendingSigs + pendingKyc + deleteReqs;
  const publishedPosts = state.posts.filter((p) => !p.status || p.status === "published").length;
  const totalViews = state.posts.reduce((sum, p) => sum + Number(p.views || 0), 0);

  const setNum = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = Number(val || 0).toLocaleString("en-US");
  };

  setNum("stat-total-pending", totalPendingTasks);
  setNum("stat-total-published", publishedPosts);
  setNum("stat-total-staff", state.staff.length);
  setNum("stat-total-views", totalViews);

  const navBadge = document.getElementById("nav-reviews-badge");
  if (navBadge) {
    navBadge.textContent = String(totalPendingTasks);
    navBadge.classList.toggle("hidden", totalPendingTasks === 0);
  }

  setNum("badge-rev-posts", pendingPosts);
  setNum("badge-rev-sigs", pendingSigs);
  setNum("badge-rev-kyc", pendingKyc);
  setNum("badge-rev-deletes", deleteReqs);
}

function renderReviewsCenterView() {
  renderTopPlatformStats();

  // 1. المنشورات المعلقة بانتظار الاعتماد
  const postsPane = document.getElementById("rev-pane-posts");
  const pendingPosts = state.posts.filter((p) => p.status === "pending");

  if (postsPane) {
    if (!pendingPosts.length) {
      postsPane.innerHTML = `<div class="cr-empty-box"><p>لا توجد منشورات معلقة بانتظار المراجعة حالياً.</p></div>`;
    } else {
      postsPane.innerHTML = `<div class="cr-list-stack">${pendingPosts
        .map((p) => {
          const cat = cleanCategoryName(
            (Array.isArray(p.categories) && p.categories[0]) || p.category || "عام"
          );
          return `
            <article class="cr-row-card">
              <div style="flex:1;min-width:240px;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">
                  <span class="cr-status-badge st-pending">بانتظار الاعتماد</span>
                  <span style="font-size:0.75rem;font-weight:800;color:var(--brand-primary);background:var(--brand-soft);padding:2px 8px;border-radius:5px;">
                    ${escapeHtml(cat)}
                  </span>
                  <span style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">
                    ${formatArabicDate(p)}
                  </span>
                </div>
                <h3 style="font-size:1.02rem;font-weight:900;margin-bottom:4px;">${escapeHtml(
                  p.title
                )}</h3>
                <p style="font-size:0.82rem;color:var(--text-muted);font-weight:700;">
                  الكاتب: <strong>${escapeHtml(p.author || "صحفي")}</strong>
                  ${p.authorPressId ? `(<span dir="ltr">${escapeHtml(p.authorPressId)}</span>)` : ""}
                </p>
              </div>

              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <button type="button" class="cr-btn cr-btn-primary cr-btn-sm" data-approve-post="${escapeHtml(
                  p.id
                )}">
                  <span class="material-symbols-rounded" style="font-size:17px;" translate="no">check_circle</span>
                  <span>اعتماد ونشر فوري</span>
                </button>
                <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-open-edit-post="${escapeHtml(
                  p.id
                )}">
                  <span class="material-symbols-rounded" style="font-size:17px;" translate="no">edit_document</span>
                  <span>معاينة وتعديل</span>
                </button>
                <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-reject-post="${escapeHtml(
                  p.id
                )}">
                  <span>إعادة للمحرر</span>
                </button>
              </div>
            </article>
          `;
        })
        .join("")}</div>`;

      postsPane.querySelectorAll("[data-approve-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-approve-post");
          await updateDoc(doc(db, "posts", id), {
            status: "published",
            approvedAt: Date.now()
          });
          showToast("تم اعتماد الخبر ونشره على الموقع العام فوراً");
        });
      });

      postsPane.querySelectorAll("[data-open-edit-post]").forEach((btn) => {
        btn.addEventListener("click", () => {
          openMasterPostEditorModal(btn.getAttribute("data-open-edit-post"));
        });
      });

      postsPane.querySelectorAll("[data-reject-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-reject-post");
          await updateDoc(doc(db, "posts", id), { status: "rejected" });
          showToast("تمت إعادة المادة للمحرر لمراجعتها");
        });
      });
    }
  }

  // 2. مراجعة توقيعات ميثاق الشرف الصحفي
  const sigsPane = document.getElementById("rev-pane-sigs");
  const pendingSigs = state.staff.filter((s) => s.signatureStatus === "pending");

  if (sigsPane) {
    if (!pendingSigs.length) {
      sigsPane.innerHTML = `<div class="cr-empty-box"><p>لا توجد توقيعات ميثاق معلقة حالياً.</p></div>`;
    } else {
      sigsPane.innerHTML = `<div class="cr-list-stack">${pendingSigs
        .map((s) => {
          const sigList = Array.isArray(s.signatures)
            ? s.signatures
            : s.primarySignature
            ? [s.primarySignature]
            : [];
          return `
            <div class="cr-row-card" style="flex-direction:column;align-items:stretch;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                  <strong style="font-size:1rem;">${escapeHtml(s.name)}</strong>
                  <span class="cr-press-id-tag" dir="ltr" style="margin:0 8px;">${escapeHtml(
                    normalizePressId(s.pressId || "HP")
                  )}</span>
                  <span style="font-size:0.8rem;color:var(--text-muted);font-weight:800;">
                    (${
                      s.signatureType === "update"
                        ? "توقيع تحديث الميثاق"
                        : "3 توقيعات مطابقة لأول مرة"
                    } — الإصدار ${s.signedCharterVersion || 1})
                  </span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="cr-btn cr-btn-primary cr-btn-sm" data-approve-sig="${escapeHtml(
                    s.id
                  )}">
                    <span class="material-symbols-rounded" style="font-size:17px;" translate="no">verified</span>
                    <span>اعتماد التوقيع وتفعيل النشر</span>
                  </button>
                  <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-reject-sig="${escapeHtml(
                    s.id
                  )}">
                    <span>رفض وطلب إعادة التوقيع</span>
                  </button>
                  <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-open-dossier="${escapeHtml(
                    s.id
                  )}">
                    <span>الملف الكامل</span>
                  </button>
                </div>
              </div>
              <div class="cr-sig-grid">
                ${sigList
                  .map(
                    (imgUrl, idx) => `
                  <div class="cr-sig-box">
                    <small style="font-weight:800;color:var(--text-muted);">التوقيع (${
                      idx + 1
                    }) — اضغط للتكبير</small>
                    <img src="${escapeHtml(imgUrl)}" alt="توقيع" data-zoom-img="${escapeHtml(
                      imgUrl
                    )}">
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
        })
        .join("")}</div>`;

      sigsPane.querySelectorAll("[data-approve-sig]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-approve-sig");
          await updateDoc(doc(db, "staff", sid), {
            signatureStatus: "approved",
            everApprovedCharter: true,
            signatureApprovedAt: Date.now()
          });
          showToast("تم اعتماد توقيع ميثاق الشرف وتفعيل النشر للصحفي");
        });
      });

      sigsPane.querySelectorAll("[data-reject-sig]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-reject-sig");
          await updateDoc(doc(db, "staff", sid), { signatureStatus: "rejected" });
          showToast("تم رفض التوقيع وإشعار الصحفي بإعادة التوقيع الثلاثي");
        });
      });

      sigsPane.querySelectorAll("[data-open-dossier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          openStaffDossierModal(btn.getAttribute("data-open-dossier"));
        });
      });

      sigsPane.querySelectorAll("[data-zoom-img]").forEach((img) => {
        img.addEventListener("click", () => {
          openImageInLightbox(img.getAttribute("data-zoom-img"));
        });
      });
    }
  }

  // 3. مراجعة طلبات توثيق الهوية الرسمية والشارة الزرقاء (KYC)
  const kycPane = document.getElementById("rev-pane-kyc");
  const pendingKyc = state.staff.filter((s) => s.kycStatus === "pending");

  if (kycPane) {
    if (!pendingKyc.length) {
      kycPane.innerHTML = `<div class="cr-empty-box"><p>لا توجد طلبات توثيق هوية معلقة حالياً.</p></div>`;
    } else {
      kycPane.innerHTML = `<div class="cr-list-stack">${pendingKyc
        .map((s) => {
          const age = calculateAutoAge(s.dob);
          return `
            <div class="cr-row-card" style="flex-direction:column;align-items:stretch;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                  <strong style="font-size:1rem;">${escapeHtml(s.name)}</strong> — الاسم بالوثيقة: <strong>${escapeHtml(
                    s.legalName || "-"
                  )}</strong>
                  <span class="cr-press-id-tag" dir="ltr" style="margin:0 8px;">${escapeHtml(
                    normalizePressId(s.pressId || "HP")
                  )}</span>
                  <p style="font-size:0.82rem;color:var(--text-muted);font-weight:700;margin-top:4px;">
                    نوع الوثيقة: ${s.docType === "passport" ? "جواز سفر" : "بطاقة شخصية"} |
                    رقمها: <strong>${escapeHtml(s.docNumber || "-")}</strong> |
                    تاريخ الإصدار: ${escapeHtml(s.docIssueDate || "-")} |
                    العمر التلقائي: <strong style="color:var(--brand-primary);">${
                      age !== null ? `${age} سنة` : "-"
                    }</strong>
                  </p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="cr-btn cr-btn-primary cr-btn-sm" data-approve-kyc="${escapeHtml(
                    s.id
                  )}">
                    <span class="material-symbols-rounded" style="font-size:17px;" translate="no">verified</span>
                    <span>توثيق الهوية ومنح الشارة الزرقاء</span>
                  </button>
                  <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-reject-kyc="${escapeHtml(
                    s.id
                  )}">
                    <span>رفض الطلب</span>
                  </button>
                  <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-open-dossier="${escapeHtml(
                    s.id
                  )}">
                    <span>فتح الملف الشامل</span>
                  </button>
                </div>
              </div>
              <div class="cr-sig-grid">
                ${
                  s.docFrontImg
                    ? `<div class="cr-sig-box"><small>وجه الوثيقة (اضغط للتكبير)</small><img src="${escapeHtml(
                        s.docFrontImg
                      )}" data-zoom-img="${escapeHtml(s.docFrontImg)}"></div>`
                    : ""
                }
                ${
                  s.docBackImg
                    ? `<div class="cr-sig-box"><small>ظهر الوثيقة (اضغط للتكبير)</small><img src="${escapeHtml(
                        s.docBackImg
                      )}" data-zoom-img="${escapeHtml(s.docBackImg)}"></div>`
                    : ""
                }
                ${
                  s.selfieImg
                    ? `<div class="cr-sig-box"><small>صورة التحقق السيلفي</small><img src="${escapeHtml(
                        s.selfieImg
                      )}" data-zoom-img="${escapeHtml(s.selfieImg)}"></div>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}</div>`;

      kycPane.querySelectorAll("[data-approve-kyc]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-approve-kyc");
          await updateDoc(doc(db, "staff", sid), {
            kycStatus: "approved",
            verified: true,
            signatureStatus: "approved",
            everApprovedCharter: true
          });
          showToast("تم توثيق هوية الصحفي ومنحه الشارة الزرقاء المعتمدة");
        });
      });

      kycPane.querySelectorAll("[data-reject-kyc]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-reject-kyc");
          await updateDoc(doc(db, "staff", sid), { kycStatus: "rejected" });
          showToast("تم رفض طلب التوثيق");
        });
      });

      kycPane.querySelectorAll("[data-open-dossier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          openStaffDossierModal(btn.getAttribute("data-open-dossier"));
        });
      });

      kycPane.querySelectorAll("[data-zoom-img]").forEach((img) => {
        img.addEventListener("click", () => {
          openImageInLightbox(img.getAttribute("data-zoom-img"));
        });
      });
    }
  }

  // 4. مراجعة طلبات الحذف المرفوعة من الكتّاب
  const deletesPane = document.getElementById("rev-pane-deletes");
  const deleteReqs = state.posts.filter((p) => p.status === "delete_request");

  if (deletesPane) {
    if (!deleteReqs.length) {
      deletesPane.innerHTML = `<div class="cr-empty-box"><p>لا توجد طلبات حذف معلقة حالياً.</p></div>`;
    } else {
      deletesPane.innerHTML = `<div class="cr-list-stack">${deleteReqs
        .map(
          (p) => `
          <div class="cr-row-card">
            <div>
              <span class="cr-status-badge st-rejected">طلب حذف من الكاتب</span>
              <h3 style="font-size:1rem;font-weight:900;margin-top:5px;">${escapeHtml(p.title)}</h3>
              <p style="font-size:0.82rem;color:var(--text-muted);">الكاتب: ${escapeHtml(
                p.author || "-"
              )}</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-restore-post="${escapeHtml(
                p.id
              )}">
                <span>رفض الحذف وإعادة النشر</span>
              </button>
              <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-confirm-delete-post="${escapeHtml(
                p.id
              )}">
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        `
        )
        .join("")}</div>`;

      deletesPane.querySelectorAll("[data-restore-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-restore-post");
          await updateDoc(doc(db, "posts", id), { status: "published" });
          showToast("تم رفض الحذف وإعادة المنشور للموقع العام");
        });
      });

      deletesPane.querySelectorAll("[data-confirm-delete-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-confirm-delete-post");
          await deleteDoc(doc(db, "posts", id));
          showToast("تم حذف المنشور نهائياً");
        });
      });
    }
  }
}

// ==================== 7. إدارة كافة الأخبار والتحكم الفوري بالأولويات (View 2) ====================
function populatePostsCategoryFilterDropdown() {
  const sel = document.getElementById("all-posts-category-filter");
  const modalCatSel = document.getElementById("admin-post-category");
  const sortedCats = [...state.compasses].sort((a, b) => (a.order || 99) - (b.order || 99));

  if (sel) {
    const prev = sel.value || "all";
    sel.innerHTML = [
      `<option value="all">جميع الأقسام الإخبارية</option>`,
      ...sortedCats.map((c) => {
        const clean = cleanCategoryName(c.name);
        return `<option value="${escapeHtml(clean)}">${escapeHtml(clean)}</option>`;
      })
    ].join("");
    sel.value = prev;
  }

  if (modalCatSel) {
    modalCatSel.innerHTML = sortedCats
      .map((c) => {
        const clean = cleanCategoryName(c.name);
        return `<option value="${escapeHtml(clean)}">${escapeHtml(clean)}</option>`;
      })
      .join("");
  }
}

function getStatusBadgeHtml(status) {
  const st = status || "published";
  if (st === "published") return `<span class="cr-status-badge st-published">منشور</span>`;
  if (st === "pending") return `<span class="cr-status-badge st-pending">معلق للمراجعة</span>`;
  if (st === "rejected") return `<span class="cr-status-badge st-rejected">معاد للمحرر</span>`;
  if (st === "delete_request") return `<span class="cr-status-badge st-rejected">طلب حذف</span>`;
  return `<span class="cr-status-badge st-draft">مسودة</span>`;
}

function renderAllPostsManagementView() {
  populatePostsCategoryFilterDropdown();
  const container = document.getElementById("admin-all-posts-list");
  if (!container) return;

  let list = [...state.posts];

  if (state.postsFilterType === "published") {
    list = list.filter((p) => !p.status || p.status === "published");
  } else if (state.postsFilterType === "breaking") {
    list = list.filter((p) => Boolean(p.isBreaking));
  } else if (state.postsFilterType === "featured") {
    list = list.filter((p) => Boolean(p.isFeatured));
  } else if (state.postsFilterType === "quick") {
    list = list.filter((p) => Boolean(p.isQuickNews));
  } else if (state.postsFilterType === "draft") {
    list = list.filter((p) => p.status && p.status !== "published");
  }

  if (state.postsFilterCategory !== "all") {
    list = list.filter((p) => {
      const cat = cleanCategoryName(
        (Array.isArray(p.categories) && p.categories[0]) || p.category || ""
      );
      return cat === state.postsFilterCategory;
    });
  }

  if (state.postsSearchQuery) {
    const q = state.postsSearchQuery.toLowerCase();
    list = list.filter((p) =>
      `${p.title || ""} ${p.summary || ""} ${p.author || ""} ${p.authorPressId || ""}`
        .toLowerCase()
        .includes(q)
    );
  }

  if (!list.length) {
    container.innerHTML = `<div class="cr-empty-box"><p>لا توجد أخبار مطابقة لمعايير التصفية الحالية.</p></div>`;
    return;
  }

  container.innerHTML = list
    .slice(0, 60)
    .map((p) => {
      const cat = cleanCategoryName(
        (Array.isArray(p.categories) && p.categories[0]) || p.category || "عام"
      );
      const views = Number(p.views || 0).toLocaleString("en-US");

      return `
        <article class="cr-row-card">
          <div style="flex:1;min-width:250px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">
              ${getStatusBadgeHtml(p.status)}
              <span style="font-size:0.75rem;font-weight:800;color:var(--brand-primary);background:var(--brand-soft);padding:2px 8px;border-radius:5px;">
                ${escapeHtml(cat)}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">
                الكاتب: <strong>${escapeHtml(p.author || "هيئة التحرير")}</strong>
                ${p.authorPressId ? `(<span dir="ltr">${escapeHtml(p.authorPressId)}</span>)` : ""}
                • ${formatArabicDate(p)} • ${views} قراءة
              </span>
            </div>
            <h3 style="font-size:1rem;font-weight:900;color:var(--text-main);">
              ${escapeHtml(p.title || "بدون عنوان")}
            </h3>
          </div>

          <!-- أزرار التحكم الفوري بأولوية الظهور بنقرة واحدة + زر التعديل الشامل -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="cr-priority-toggles">
              <button
                type="button"
                class="cr-prio-chip ${p.isBreaking ? "active" : ""}"
                data-toggle-prio="isBreaking"
                data-post-id="${escapeHtml(p.id)}"
                title="إضافة أو سحب الخبر فوراً من شريط الأخبار العاجلة"
              >
                <span class="material-symbols-rounded" style="font-size:15px;" translate="no">campaign</span>
                <span>عاجل</span>
              </button>

              <button
                type="button"
                class="cr-prio-chip ${p.isFeatured ? "active" : ""}"
                data-toggle-prio="isFeatured"
                data-post-id="${escapeHtml(p.id)}"
                title="إضافة أو سحب الخبر من التغطية الرئيسية الكبرى"
              >
                <span class="material-symbols-rounded" style="font-size:15px;" translate="no">star</span>
                <span>واجهة كبرى</span>
              </button>

              <button
                type="button"
                class="cr-prio-chip ${p.isQuickNews ? "active" : ""}"
                data-toggle-prio="isQuickNews"
                data-post-id="${escapeHtml(p.id)}"
                title="إضافة أو سحب الخبر من شريط موجز النبض"
              >
                <span class="material-symbols-rounded" style="font-size:15px;" translate="no">bolt</span>
                <span>النبض</span>
              </button>
            </div>

            <button
              type="button"
              class="cr-btn cr-btn-secondary cr-btn-sm"
              data-open-edit-post="${escapeHtml(p.id)}"
            >
              <span class="material-symbols-rounded" style="font-size:17px;" translate="no">edit</span>
              <span>تعديل شامل</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  // تبديل أولوية الخبر (عاجل / رئيسية / نبض) بنقرة واحدة
  container.querySelectorAll("[data-toggle-prio]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.getAttribute("data-post-id");
      const field = btn.getAttribute("data-toggle-prio");
      const post = state.posts.find((x) => x.id === postId);
      if (!post || !field) return;

      const nextVal = !Boolean(post[field]);
      const updateObj = { [field]: nextVal };
      if (field === "isBreaking") {
        updateObj.breakingExpiresAt = nextVal ? Date.now() + 6 * 3600 * 1000 : null;
      }

      try {
        await updateDoc(doc(db, "posts", postId), updateObj);
        showToast(
          nextVal
            ? "تم تفعيل أولوية الظهور للخبر فوراً"
            : "تم سحب الخبر من أولوية الظهور فوراً"
        );
      } catch (_) {
        showToast("تعذر تحديث أولوية الخبر");
      }
    });
  });

  container.querySelectorAll("[data-open-edit-post]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openMasterPostEditorModal(btn.getAttribute("data-open-edit-post"));
    });
  });
}

function openMasterPostEditorModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  populatePostsCategoryFilterDropdown();
  state.editPostImageTempData = post.imageUrl || "";

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("admin-edit-post-id", post.id);
  setVal("admin-post-title", post.title || "");
  setVal("admin-post-summary", post.summary || "");

  const mainCat = cleanCategoryName(
    (Array.isArray(post.categories) && post.categories[0]) || post.category || ""
  );
  setVal("admin-post-category", mainCat);
  setVal("admin-post-subcategory", post.subcategory || "");
  setVal("admin-post-status", post.status || "published");
  setVal("admin-post-image-url", post.imageUrl && !post.imageUrl.startsWith("data:") ? post.imageUrl : "");
  setVal(
    "admin-post-tags",
    Array.isArray(post.tags)
      ? post.tags.map((t) => `#${String(t).replace(/^#+/, "")}`).join(" ")
      : ""
  );
  setVal("admin-post-video-url", post.videoUrl || "");

  const brk = document.getElementById("admin-post-breaking");
  const feat = document.getElementById("admin-post-featured");
  const qck = document.getElementById("admin-post-quick");
  if (brk) brk.checked = Boolean(post.isBreaking);
  if (feat) feat.checked = Boolean(post.isFeatured);
  if (qck) qck.checked = Boolean(post.isQuickNews);

  const editor = document.getElementById("admin-post-rich-editor");
  if (editor) editor.innerHTML = post.content || "";

  document.getElementById("edit-post-modal")?.classList.remove("hidden");
}

async function handleSaveMasterPostEdits(e) {
  e.preventDefault();
  const postId = document.getElementById("admin-edit-post-id")?.value;
  if (!postId) return;

  const title = (document.getElementById("admin-post-title")?.value || "").trim();
  const summary = (document.getElementById("admin-post-summary")?.value || "").trim();
  const category = cleanCategoryName(
    (document.getElementById("admin-post-category")?.value || "").trim()
  );
  const subcategory = (document.getElementById("admin-post-subcategory")?.value || "").trim();
  const status = document.getElementById("admin-post-status")?.value || "published";
  const urlInput = (document.getElementById("admin-post-image-url")?.value || "").trim();
  const rawTags = (document.getElementById("admin-post-tags")?.value || "").trim();
  const videoUrl = (document.getElementById("admin-post-video-url")?.value || "").trim();
  const content = (document.getElementById("admin-post-rich-editor")?.innerHTML || "").trim();

  const isBreaking = Boolean(document.getElementById("admin-post-breaking")?.checked);
  const isFeatured = Boolean(document.getElementById("admin-post-featured")?.checked);
  const isQuickNews = Boolean(document.getElementById("admin-post-quick")?.checked);

  const tags = rawTags
    .split(/[\s,،]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const payload = {
    title,
    summary,
    category,
    categories: [category],
    subcategory,
    status,
    imageUrl: urlInput || state.editPostImageTempData || "",
    tags,
    videoUrl,
    videoType: videoUrl
      ? videoUrl.includes("/shorts/")
        ? "short_vertical"
        : "standard"
      : "none",
    isBreaking,
    breakingExpiresAt: isBreaking ? Date.now() + 6 * 3600 * 1000 : null,
    isFeatured,
    isQuickNews,
    content,
    updatedAt: Date.now()
  };

  try {
    await updateDoc(doc(db, "posts", postId), payload);
    document.getElementById("edit-post-modal")?.classList.add("hidden");
    showToast("تم حفظ التعديلات وتحديث حالة الخبر بنجاح");
  } catch (err) {
    console.error(err);
    showToast("تعذر حفظ التعديلات");
  }
}

// ==================== 8. إدارة الكادر الصحفي والملف الشخصي الشامل (God Mode Dossier — View 3) ====================
function renderAllowedCategoriesCheckboxes(containerId, selectedArray = ["all"]) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const sortedCats = [...state.compasses].sort((a, b) => (a.order || 99) - (b.order || 99));
  const normalizedSelected = (selectedArray || []).map((x) => cleanCategoryName(x));

  box.innerHTML = sortedCats
    .map((c) => {
      const clean = cleanCategoryName(c.name);
      const isChecked =
        normalizedSelected.includes("all") ||
        normalizedSelected.includes(clean) ||
        normalizedSelected.includes(c.id);
      return `
        <label class="cr-chip-checkbox">
          <input type="checkbox" value="${escapeHtml(clean)}" class="specific-cat-chk" ${
        isChecked ? "checked" : ""
      }>
          <span>${escapeHtml(clean)}</span>
        </label>
      `;
    })
    .join("");
}

function renderStaffDirectoryView() {
  const grid = document.getElementById("admin-staff-grid");
  if (!grid) return;

  const q = state.staffSearchQuery.toLowerCase();
  const qPid = normalizePressId(state.staffSearchQuery);

  const filtered = state.staff.filter((s) => {
    if (!q) return true;
    const sPid = normalizePressId(s.pressId || "");
    const hay = `${s.name || ""} ${s.legalName || ""} ${s.username || ""} ${
      s.jobTitle || ""
    } ${s.whatsapp || ""} ${s.contactEmail || ""}`.toLowerCase();
    return hay.includes(q) || (qPid && sPid.includes(qPid));
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="cr-empty-box" style="grid-column:1/-1;"><p>لا يوجد صحفي مطابق لبحثك.</p></div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((s) => {
      const pid = normalizePressId(s.pressId || "HP");
      const age = calculateAutoAge(s.dob);
      const isFrozen = s.accountStatus === "frozen" || s.suspended === true;
      const avatar =
        s.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          s.name || "HP"
        )}&background=b80d38&color=fff`;

      const postCount = state.posts.filter(
        (p) => p.authorId === s.id || p.author === s.name
      ).length;

      const allowedCatsLabel =
        !Array.isArray(s.allowedCategories) ||
        !s.allowedCategories.length ||
        s.allowedCategories.includes("all")
          ? "جميع الأقسام"
          : `${s.allowedCategories.length} قسم مخصص`;

      return `
        <article class="cr-staff-card ${isFrozen ? "frozen-card" : ""}" data-open-staff="${escapeHtml(
          s.id
        )}">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <img src="${escapeHtml(avatar)}" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--brand-primary);flex-shrink:0;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:4px;">
                <h3 style="font-size:0.96rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(
                  s.name
                )}</h3>
                ${
                  s.verified
                    ? `<span class="material-symbols-rounded" style="color:var(--verified-blue);font-size:18px;" translate="no">verified</span>`
                    : ""
                }
              </div>
              <span style="font-size:0.76rem;color:var(--text-muted);font-weight:700;display:block;">
                ${escapeHtml(s.jobTitle || "صحفي")} • ${
        isFrozen ? `<strong style="color:var(--danger-red);">مجمد</strong>` : "نشط"
      }
              </span>
            </div>
            <span class="cr-press-id-tag" dir="ltr">${escapeHtml(pid)}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;font-weight:800;color:var(--text-body);padding-top:10px;border-top:1px solid var(--border-light);">
            <span>الأقسام: ${escapeHtml(allowedCatsLabel)}</span>
            <span>${age !== null ? `العمر: ${age} سنة` : `مقالات: ${postCount}`}</span>
            <span style="color:var(--brand-primary);">التحكم الكامل ←</span>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-open-staff]").forEach((card) => {
    card.addEventListener("click", () => {
      openStaffDossierModal(card.getAttribute("data-open-staff"));
    });
  });
}

// فتح نافذة الملف الشخصي الشامل والتحكم المطلق ببيانات الصحفي (God Mode Dossier)
function openStaffDossierModal(staffId) {
  const member = state.staff.find((s) => s.id === staffId);
  if (!member) return;

  state.activeDossierStaffId = member.id;
  state.dossierAvatarTempData = member.avatar || "";

  const modal = document.getElementById("staff-dossier-modal");
  const content = document.getElementById("dossier-modal-content");
  if (!modal || !content) return;

  const pid = normalizePressId(member.pressId || "HP");
  const age = calculateAutoAge(member.dob);
  const isFrozen = member.accountStatus === "frozen" || member.suspended === true;
  const avatar =
    member.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      member.name || "HP"
    )}&background=b80d38&color=fff`;

  const memberPosts = state.posts.filter(
    (p) => p.authorId === member.id || p.author === member.name
  );
  const pubCount = memberPosts.filter((p) => !p.status || p.status === "published").length;
  const totalViews = memberPosts.reduce((sum, p) => sum + Number(p.views || 0), 0);

  const waDigits = String(member.whatsapp || "").replace(/[^\d]/g, "");
  const emailAddr = (member.contactEmail || member.email || "").trim();

  const isAllCats =
    !Array.isArray(member.allowedCategories) ||
    !member.allowedCategories.length ||
    member.allowedCategories.includes("all");

  const sigList = Array.isArray(member.signatures)
    ? member.signatures
    : member.primarySignature
    ? [member.primarySignature]
    : [];

  content.innerHTML = `
    <!-- 1. الشريط العلوي للهوية الصحفية والعمر التلقائي وأزرار التواصل المباشر -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;background:var(--bg-page);padding:16px;border-radius:12px;border:1px solid var(--border-light);margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img id="dossier-avatar-preview" src="${escapeHtml(
          avatar
        )}" alt="" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid var(--brand-primary);">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <h3 style="font-size:1.2rem;font-weight:900;">${escapeHtml(member.name)}</h3>
            <span class="cr-press-id-tag" dir="ltr">${escapeHtml(pid)}</span>
            <button type="button" id="dossier-copy-pid-btn" class="cr-btn cr-btn-secondary cr-btn-sm">نسخ الهوية</button>
          </div>
          <p style="font-size:0.83rem;color:var(--text-muted);font-weight:800;margin-top:4px;">
            العمر المحسوب تلقائياً: <strong style="color:var(--brand-primary);">${
              age !== null ? `${age} سنة` : "غير محدد"
            }</strong>
            • المنشورات: <strong>${pubCount}</strong> • المشاهدات: <strong>${totalViews.toLocaleString(
              "en-US"
            )}</strong>
          </p>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${
          waDigits.length >= 7
            ? `<a href="https://wa.me/${waDigits}" target="_blank" rel="noopener" class="cr-btn cr-btn-secondary cr-btn-sm" style="background:#dcfce7;color:#15803d;border-color:#86efac;text-decoration:none;">
                <span class="material-symbols-rounded" style="font-size:18px;" translate="no">chat</span>
                <span>مراسلة واتساب (${escapeHtml(member.whatsapp)})</span>
              </a>`
            : ""
        }
        ${
          emailAddr
            ? `<a href="mailto:${encodeURIComponent(
                emailAddr
              )}" class="cr-btn cr-btn-secondary cr-btn-sm" style="text-decoration:none;">
                <span class="material-symbols-rounded" style="font-size:18px;" translate="no">mail</span>
                <span>مراسلة بريد (${escapeHtml(emailAddr)})</span>
              </a>`
            : ""
        }
      </div>
    </div>

    <!-- 2. أزرار القرارات السيادية الفورية (تجميد الحساب، الشارة الزرقاء، النشر المباشر، اعتماد الميثاق) -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border-light);">
      <button type="button" id="dossier-toggle-freeze-btn" class="cr-btn ${
        isFrozen ? "cr-btn-primary" : "cr-btn-danger"
      } cr-btn-sm">
        <span class="material-symbols-rounded" style="font-size:17px;" translate="no">${
          isFrozen ? "lock_open" : "block"
        }</span>
        <span>${isFrozen ? "إلغاء التجميد وتفعيل الحساب" : "تجميد وإيقاف الحساب فوراً"}</span>
      </button>

      <button type="button" id="dossier-toggle-verified-btn" class="cr-btn cr-btn-secondary cr-btn-sm">
        <span class="material-symbols-rounded" style="font-size:17px;color:var(--verified-blue);" translate="no">verified</span>
        <span>${member.verified ? "سحب الشارة الزرقاء" : "منح الشارة الزرقاء فوراً"}</span>
      </button>

      <button type="button" id="dossier-toggle-direct-btn" class="cr-btn cr-btn-secondary cr-btn-sm">
        <span class="material-symbols-rounded" style="font-size:17px;" translate="no">bolt</span>
        <span>${
          member.directPublish ? "تحويل إلى (يخضع للمراجعة)" : "منح صلاحية النشر المباشر"
        }</span>
      </button>

      <button type="button" id="dossier-approve-charter-btn" class="cr-btn cr-btn-secondary cr-btn-sm">
        <span class="material-symbols-rounded" style="font-size:17px;" translate="no">gavel</span>
        <span>اعتماد توقيع الميثاق</span>
      </button>

      <button type="button" id="dossier-reject-charter-btn" class="cr-btn cr-btn-danger cr-btn-sm">
        <span>طلب إعادة توقيع الميثاق</span>
      </button>
    </div>

    <!-- 3. استمارة التحكم الشامل ببيانات الصحفي وكلمة مروره وأقسامه المسموحة -->
    <form id="cr-dossier-edit-form" style="background:var(--bg-page);padding:18px;border-radius:12px;border:1px solid var(--border-light);margin-bottom:20px;">
      <h4 style="font-weight:900;margin-bottom:14px;color:var(--brand-primary);">
        تعديل بيانات الصحفي، كلمة المرور، الصورة، وتخصيص الأقسام المسموحة
      </h4>

      <div class="cr-grid-3">
        <div class="cr-field">
          <label>الاسم الصحفي الظاهر</label>
          <input type="text" id="dos-name" class="cr-input" required value="${escapeHtml(
            member.name || ""
          )}">
        </div>
        <div class="cr-field">
          <label>المسمى الوظيفي</label>
          <input type="text" id="dos-job" class="cr-input" value="${escapeHtml(
            member.jobTitle || ""
          )}">
        </div>
        <div class="cr-field">
          <label>مستوى الصلاحية</label>
          <select id="dos-role" class="cr-select">
            <option value="writer" ${member.role === "writer" ? "selected" : ""}>صحفي (يخضع للمراجعة)</option>
            <option value="trusted_writer" ${
              member.role === "trusted_writer" ? "selected" : ""
            }>صحفي معتمد (نشر مباشر)</option>
            <option value="admin" ${member.role === "admin" ? "selected" : ""}>مدير تحرير / أدمن</option>
          </select>
        </div>
      </div>

      <div class="cr-grid-3">
        <div class="cr-field">
          <label>اسم المستخدم للدخول</label>
          <input type="text" id="dos-username" class="cr-input" dir="ltr" required value="${escapeHtml(
            member.username || ""
          )}">
        </div>
        <div class="cr-field">
          <label>كلمة المرور (يمكنك تغييرها له في أي وقت)</label>
          <input type="text" id="dos-password" class="cr-input" dir="ltr" required value="${escapeHtml(
            member.password || ""
          )}">
        </div>
        <div class="cr-field">
          <label>الرمز السريع (PIN)</label>
          <input type="text" id="dos-pin" class="cr-input" dir="ltr" maxlength="8" value="${escapeHtml(
            member.pinCode || member.pin || ""
          )}">
        </div>
      </div>

      <div class="cr-grid-3">
        <div class="cr-field">
          <label>رقم الواتساب</label>
          <input type="tel" id="dos-whatsapp" class="cr-input" dir="ltr" value="${escapeHtml(
            member.whatsapp || ""
          )}">
        </div>
        <div class="cr-field">
          <label>البريد الإلكتروني للتواصل</label>
          <input type="email" id="dos-email" class="cr-input" dir="ltr" value="${escapeHtml(
            emailAddr
          )}">
        </div>
        <div class="cr-field">
          <label>تغيير الصورة الشخصية للصحفي</label>
          <input type="file" id="dos-avatar-file" accept="image/*" class="cr-input">
        </div>
      </div>

      <!-- التحكم الدقيق بالأقسام المسموح للصحفي بالنشر فيها -->
      <div class="cr-field">
        <label>الأقسام المسموح لهذا الصحفي بالنشر فيها (تظهر له وحده في غرفة الأخبار)</label>
        <label class="cr-chip-checkbox" style="margin-bottom:10px;background:#fff;border-color:var(--brand-border);">
          <input type="checkbox" id="dos-all-cats-chk" ${isAllCats ? "checked" : ""}>
          <strong>السماح بالنشر في جميع أقسام المنصة</strong>
        </label>
        <div id="dos-specific-cats-grid" class="cr-cats-checkbox-grid ${
          isAllCats ? "hidden" : ""
        }"></div>
      </div>

      <div class="cr-pane-footer cr-footer-split" style="margin-top:12px;">
        <button type="button" id="dossier-delete-staff-btn" class="cr-btn cr-btn-danger cr-btn-sm">
          <span class="material-symbols-rounded" style="font-size:17px;" translate="no">person_remove</span>
          <span>حذف حساب الصحفي نهائياً</span>
        </button>

        <button type="submit" class="cr-btn cr-btn-primary">
          <span class="material-symbols-rounded" translate="no">save</span>
          <span>حفظ كافة تعديلات الحساب والصلاحيات والأقسام</span>
        </button>
      </div>
    </form>

    <!-- 4. استعراض وثائق الهوية الرسمية (KYC) والتوقيعات الثلاثة المحفوظة -->
    <div class="cr-grid-2">
      <div style="background:#fff;padding:14px;border-radius:10px;border:1px solid var(--border-light);">
        <h4 style="font-weight:900;margin-bottom:8px;">وثائق الهوية الرسمية المرفقة (KYC)</h4>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">
          الاسم القانوني: <strong>${escapeHtml(member.legalName || "-")}</strong> |
          رقم الوثيقة: <strong>${escapeHtml(member.docNumber || "-")}</strong> |
          إصدار: ${escapeHtml(member.docIssueDate || "-")} |
          ميلاد: ${escapeHtml(member.dob || "-")}
        </p>
        <div class="cr-sig-grid">
          ${
            member.docFrontImg
              ? `<div class="cr-sig-box"><small>وجه الوثيقة</small><img src="${escapeHtml(
                  member.docFrontImg
                )}" data-zoom-img="${escapeHtml(member.docFrontImg)}"></div>`
              : ""
          }
          ${
            member.docBackImg
              ? `<div class="cr-sig-box"><small>ظهر الوثيقة</small><img src="${escapeHtml(
                  member.docBackImg
                )}" data-zoom-img="${escapeHtml(member.docBackImg)}"></div>`
              : ""
          }
          ${
            member.selfieImg
              ? `<div class="cr-sig-box"><small>صورة السيلفي</small><img src="${escapeHtml(
                  member.selfieImg
                )}" data-zoom-img="${escapeHtml(member.selfieImg)}"></div>`
              : ""
          }
        </div>
      </div>

      <div style="background:#fff;padding:14px;border-radius:10px;border:1px solid var(--border-light);">
        <h4 style="font-weight:900;margin-bottom:8px;">
          توقيعات ميثاق الشرف الصحفي (الحالة: ${escapeHtml(
            member.signatureStatus || "لم يوقع"
          )} — الإصدار: ${member.signedCharterVersion || 0})
        </h4>
        <div class="cr-sig-grid">
          ${
            sigList.length
              ? sigList
                  .map(
                    (imgUrl, i) => `
                  <div class="cr-sig-box">
                    <small>نموذج التوقيع (${i + 1})</small>
                    <img src="${escapeHtml(imgUrl)}" data-zoom-img="${escapeHtml(imgUrl)}">
                  </div>
                `
                  )
                  .join("")
              : `<p style="font-size:0.82rem;color:var(--text-muted);">لا توجد توقيعات محفوظة بعد.</p>`
          }
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");

  // تعبئة مربعات اختيار الأقسام المخصصة داخل الدوسيه
  renderAllowedCategoriesCheckboxes(
    "dos-specific-cats-grid",
    member.allowedCategories || ["all"]
  );

  const allCatsChk = document.getElementById("dos-all-cats-chk");
  const specGrid = document.getElementById("dos-specific-cats-grid");
  allCatsChk?.addEventListener("change", () => {
    specGrid?.classList.toggle("hidden", allCatsChk.checked);
  });

  // نسخ رقم الهوية الصحفية
  document.getElementById("dossier-copy-pid-btn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pid);
      showToast(`تم نسخ رقم الهوية الصحفية: ${pid}`);
    } catch (_) {}
  });

  // رفع صورة شخصية جديدة للصحفي من الدوسيه
  document.getElementById("dos-avatar-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await compressImageToWebp(file, 500, 0.82);
      state.dossierAvatarTempData = webp;
      document.getElementById("dossier-avatar-preview")?.setAttribute("src", webp);
      showToast("تم تجهيز الصورة الجديدة — اضغط حفظ لتثبيتها");
    } catch (_) {}
  });

  // أزرار القرارات الفورية في الدوسيه
  document.getElementById("dossier-toggle-freeze-btn")?.addEventListener("click", async () => {
    const nextStatus = isFrozen ? "active" : "frozen";
    await updateDoc(doc(db, "staff", member.id), {
      accountStatus: nextStatus,
      suspended: !isFrozen
    });
    showToast(
      nextStatus === "frozen"
        ? "تم تجميد حساب الصحفي ومنعه من الدخول فوراً"
        : "تم إلغاء التجميد وتفعيل حساب الصحفي"
    );
    openStaffDossierModal(member.id);
  });

  document.getElementById("dossier-toggle-verified-btn")?.addEventListener("click", async () => {
    const nextVer = !Boolean(member.verified);
    await updateDoc(doc(db, "staff", member.id), {
      verified: nextVer,
      kycStatus: nextVer ? "approved" : member.kycStatus || "none"
    });
    showToast(nextVer ? "تم منح الشارة الزرقاء للصحفي" : "تم سحب الشارة الزرقاء");
    openStaffDossierModal(member.id);
  });

  document.getElementById("dossier-toggle-direct-btn")?.addEventListener("click", async () => {
    const nextDirect = !Boolean(member.directPublish);
    await updateDoc(doc(db, "staff", member.id), { directPublish: nextDirect });
    showToast(
      nextDirect
        ? "تم منح الصحفي صلاحية النشر المباشر"
        : "تم تحويل منشورات الصحفي إلى نظام المراجعة المسبقة"
    );
    openStaffDossierModal(member.id);
  });

  document.getElementById("dossier-approve-charter-btn")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "staff", member.id), {
      signatureStatus: "approved",
      everApprovedCharter: true
    });
    showToast("تم اعتماد توقيع ميثاق الشرف للصحفي");
    openStaffDossierModal(member.id);
  });

  document.getElementById("dossier-reject-charter-btn")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "staff", member.id), { signatureStatus: "rejected" });
    showToast("تم إرسال أمر إعادة التوقيع للصحفي");
    openStaffDossierModal(member.id);
  });

  document.getElementById("dossier-delete-staff-btn")?.addEventListener("click", async () => {
    if (!confirm(`هل أنت متأكد من حذف حساب الصحفي (${member.name}) نهائياً؟`)) return;
    await deleteDoc(doc(db, "staff", member.id));
    modal.classList.add("hidden");
    showToast("تم حذف حساب الصحفي نهائياً");
  });

  // حفظ تعديلات بيانات الصحفي وكلمة مروره وأقسامه المسموحة
  document.getElementById("cr-dossier-edit-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (document.getElementById("dos-name")?.value || "").trim();
    const jobTitle = (document.getElementById("dos-job")?.value || "").trim();
    const role = document.getElementById("dos-role")?.value || "writer";
    const username = (document.getElementById("dos-username")?.value || "").trim();
    const password = (document.getElementById("dos-password")?.value || "").trim();
    const pinCode = (document.getElementById("dos-pin")?.value || "").trim();
    const whatsapp = (document.getElementById("dos-whatsapp")?.value || "").trim();
    const contactEmail = (document.getElementById("dos-email")?.value || "").trim();

    let allowedCategories = ["all"];
    if (!allCatsChk?.checked) {
      const checkedCats = Array.from(
        specGrid.querySelectorAll(".specific-cat-chk:checked")
      ).map((c) => c.value);
      if (!checkedCats.length) {
        showToast("يرجى اختيار قسم واحد على الأقل للصحفي أو تفعيل خيار (جميع الأقسام)");
        return;
      }
      allowedCategories = checkedCats;
    }

    const updatePayload = {
      name,
      jobTitle,
      role,
      username,
      password,
      pinCode,
      whatsapp,
      contactEmail,
      email: contactEmail,
      avatar: state.dossierAvatarTempData || member.avatar || "",
      allowedCategories,
      directPublish:
        role === "trusted_writer" || role === "admin" ? true : Boolean(member.directPublish),
      updatedAt: Date.now()
    };

    try {
      await updateDoc(doc(db, "staff", member.id), updatePayload);
      showToast("تم حفظ كافة بيانات الصحفي وكلمة مروره وأقسامه المسموحة بنجاح");
      openStaffDossierModal(member.id);
    } catch (err) {
      console.error(err);
      showToast("تعذر حفظ تعديلات الحساب");
    }
  });

  // تكبير الوثائق والتوقيعات عند النقر
  content.querySelectorAll("[data-zoom-img]").forEach((img) => {
    img.addEventListener("click", () => {
      openImageInLightbox(img.getAttribute("data-zoom-img"));
    });
  });
}

// ==================== 9. إدارة الأقسام والتصنيفات الفرعية (View 4) ====================
function renderCategoriesManagementView() {
  const listEl = document.getElementById("admin-categories-list");
  if (!listEl) return;

  const sorted = [...state.compasses].sort((a, b) => (a.order || 99) - (b.order || 99));

  listEl.innerHTML = sorted
    .map((c) => {
      const clean = cleanCategoryName(c.name);
      const subs = Array.isArray(c.subcategories) ? c.subcategories : [];
      return `
        <div class="cr-row-card">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <strong style="font-size:1rem;">${escapeHtml(clean)}</strong>
              <span class="cr-status-badge ${c.visible !== false ? "st-published" : "st-draft"}">
                ${c.visible !== false ? "ظاهر في الموقع" : "مخفي"}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);">الترتيب: ${
                c.order || 1
              }</span>
            </div>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
              الفرعيات: ${subs.length ? escapeHtml(subs.join(" ، ")) : "بدون فرعيات"}
            </p>
          </div>

          <div style="display:flex;gap:6px;">
            <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-edit-cat="${escapeHtml(
              c.id
            )}">تعديل</button>
            <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-del-cat="${escapeHtml(
              c.id
            )}">حذف</button>
          </div>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-edit-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = state.compasses.find((x) => x.id === btn.getAttribute("data-edit-cat"));
      if (!cat) return;
      document.getElementById("edit-cat-id").value = cat.id;
      document.getElementById("cat-name-input").value = cleanCategoryName(cat.name);
      document.getElementById("cat-slug-input").value = cat.id || "";
      document.getElementById("cat-subs-input").value = (cat.subcategories || []).join("، ");
      document.getElementById("cat-order-input").value = cat.order || 1;
      document.getElementById("cat-visible-chk").checked = cat.visible !== false;
      document.getElementById("cat-form-heading").textContent = `تعديل القسم: ${cleanCategoryName(
        cat.name
      )}`;
    });
  });

  listEl.querySelectorAll("[data-del-cat]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del-cat");
      if (!id || !confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
      try {
        await deleteDoc(doc(db, "categories", id));
        state.compasses = state.compasses.filter((x) => x.id !== id);
        renderCategoriesManagementView();
        showToast("تم حذف القسم بنجاح");
      } catch (_) {
        showToast("تعذر حذف القسم");
      }
    });
  });
}

// ==================== 10. إدارة الإعلانات الممولة (View 5) ====================
function renderAdsManagementView() {
  const listEl = document.getElementById("admin-ads-list");
  if (!listEl) return;

  if (!state.ads.length) {
    listEl.innerHTML = `<div class="cr-empty-box"><p>لا توجد حملات إعلانية مضافة حالياً.</p></div>`;
    return;
  }

  listEl.innerHTML = state.ads
    .map((ad) => {
      const isActive = ad.active !== false && ad.status !== "paused";
      return `
        <div class="cr-row-card">
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:220px;">
            ${
              ad.imageUrl
                ? `<img src="${escapeHtml(
                    ad.imageUrl
                  )}" alt="" style="width:74px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border-light);">`
                : ""
            }
            <div>
              <div style="display:flex;align-items:center;gap:6px;">
                <strong>${escapeHtml(ad.title)}</strong>
                <span class="cr-status-badge ${isActive ? "st-published" : "st-draft"}">
                  ${isActive ? "نشط" : "متوقف"}
                </span>
              </div>
              <p style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;">
                الراعي: ${escapeHtml(ad.sponsorName || "-")} • المشاهدات: <strong>${Number(
        ad.views || 0
      ).toLocaleString("en-US")}</strong> • النقرات: <strong>${Number(
        ad.clicks || 0
      ).toLocaleString("en-US")}</strong>
              </p>
            </div>
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-toggle-ad="${escapeHtml(
              ad.id
            )}">
              ${isActive ? "إيقاف مؤقت" : "تفعيل"}
            </button>
            <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-edit-ad="${escapeHtml(
              ad.id
            )}">تعديل</button>
            <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-del-ad="${escapeHtml(
              ad.id
            )}">حذف</button>
          </div>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-toggle-ad]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ad = state.ads.find((x) => x.id === btn.getAttribute("data-toggle-ad"));
      if (!ad) return;
      const nextActive = !(ad.active !== false && ad.status !== "paused");
      await updateDoc(doc(db, "ads", ad.id), {
        active: nextActive,
        status: nextActive ? "active" : "paused"
      });
      showToast(nextActive ? "تم تفعيل الحملة الإعلانية" : "تم إيقاف الحملة الإعلانية مؤقتاً");
    });
  });

  listEl.querySelectorAll("[data-edit-ad]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ad = state.ads.find((x) => x.id === btn.getAttribute("data-edit-ad"));
      if (!ad) return;
      document.getElementById("edit-ad-id").value = ad.id;
      document.getElementById("ad-title-input").value = ad.title || "";
      document.getElementById("ad-sponsor-input").value = ad.sponsorName || "";
      document.getElementById("ad-target-url").value = ad.targetUrl || "";
      document.getElementById("ad-image-url").value =
        ad.imageUrl && !ad.imageUrl.startsWith("data:") ? ad.imageUrl : "";
      document.getElementById("ad-active-chk").checked = ad.active !== false;
      state.adImageTempData = ad.imageUrl || "";
      renderSmallImagePreview("ad-img-preview-box", state.adImageTempData);
      document.getElementById("ad-form-heading").textContent = `تعديل الإعلان: ${ad.title}`;
    });
  });

  listEl.querySelectorAll("[data-del-ad]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del-ad");
      if (!id || !confirm("هل تريد حذف هذا الإعلان نهائياً؟")) return;
      await deleteDoc(doc(db, "ads", id));
      showToast("تم حذف الحملة الإعلانية");
    });
  });
}

// ==================== 11. إعدادات الهوية، الشعارات الثلاثة، اللون، والميثاق (View 6) ====================
function renderSmallImagePreview(boxId, imgSrc) {
  const box = document.getElementById(boxId);
  if (!box) return;
  if (!imgSrc) {
    box.innerHTML = "";
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  box.innerHTML = `<img src="${escapeHtml(imgSrc)}" alt="معاينة"><span>جاهز للحفظ</span>`;
}

function populateMasterSettingsView() {
  const s = state.settings;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("set-site-name", s.siteName || "حُجرية بريس");
  const color = s.accentColor || DEFAULT_BRAND_COLOR;
  setVal("set-accent-color-picker", color);
  setVal("set-accent-color-hex", color);
  setVal("set-site-desc", s.siteDescription || "");

  const hideChk = document.getElementById("set-hide-site-name");
  if (hideChk) hideChk.checked = Boolean(s.hideSiteName);

  const mainLogo = s.headerLogoUrl || s.logoUrl || "";
  const sideLogo = s.sidebarLogoUrl || s.authLogoUrl || s.logoUrl || "";
  const footLogo = s.footerLogoUrl || s.logoUrl || "";
  const defPostImg = s.defaultPostImageUrl || s.coverImageUrl || "";
  const favImg = s.faviconUrl || s.appIconUrl || "";

  setVal("set-logo-main", mainLogo.startsWith("data:") ? "" : mainLogo);
  setVal("set-logo-sidebar", sideLogo.startsWith("data:") ? "" : sideLogo);
  setVal("set-logo-footer", footLogo.startsWith("data:") ? "" : footLogo);
  setVal("set-default-post-img", defPostImg.startsWith("data:") ? "" : defPostImg);
  setVal("set-favicon-img", favImg.startsWith("data:") ? "" : favImg);

  renderSmallImagePreview("preview-logo-main", mainLogo);
  renderSmallImagePreview("preview-logo-sidebar", sideLogo);
  renderSmallImagePreview("preview-logo-footer", footLogo);
  renderSmallImagePreview("preview-default-post-img", defPostImg);
  renderSmallImagePreview("preview-favicon-img", favImg);

  const soc = s.socials || {};
  setVal("soc-whatsapp", soc.whatsapp || "");
  setVal("soc-telegram", soc.telegram || "");
  setVal("soc-x", soc.x || "");
  setVal("soc-facebook", soc.facebook || "");
  setVal("soc-youtube", soc.youtube || "");
  setVal("soc-tiktok", soc.tiktok || "");

  const verBadge = document.getElementById("current-charter-version-badge");
  if (verBadge) verBadge.textContent = String(s.charterVersion || 1);

  setVal("set-charter-html", s.charterHtml || DEFAULT_CHARTER_HTML);
  setVal("set-about-html", s.aboutHtml || "");
  setVal("set-privacy-html", s.privacyHtml || "");

  setVal("set-master-username", s.masterUsername || "admin");
  setVal("set-master-password", s.masterPassword || "admin");
  setVal("set-master-pin", s.masterPin || "0000");
}

// ==================== 12. إدارة التنقل وربط جميع الأحداث ====================
function switchControlRoomView(viewId) {
  state.activeView = viewId;

  [
    "view-reviews",
    "view-posts",
    "view-staff",
    "view-categories",
    "view-ads",
    "view-settings"
  ].forEach((id) => {
    document.getElementById(id)?.classList.toggle("hidden", id !== viewId);
  });

  document.querySelectorAll("#cr-main-nav .cr-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
  });

  renderAllControlRoomViews();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAllControlRoomViews() {
  if (!state.currentAdmin) return;
  renderTopPlatformStats();

  if (state.activeView === "view-reviews") {
    renderReviewsCenterView();
  } else if (state.activeView === "view-posts") {
    renderAllPostsManagementView();
  } else if (state.activeView === "view-staff") {
    renderStaffDirectoryView();
  } else if (state.activeView === "view-categories") {
    renderCategoriesManagementView();
  } else if (state.activeView === "view-ads") {
    renderAdsManagementView();
  } else if (state.activeView === "view-settings") {
    populateMasterSettingsView();
  }
}

function bindAllControlRoomEvents() {
  // 1. بوابة الدخول الإدارية
  const tabCred = document.getElementById("auth-tab-credentials");
  const tabPin = document.getElementById("auth-tab-pin");
  const formCred = document.getElementById("cr-login-credentials-form");
  const boxPin = document.getElementById("cr-login-pin-container");

  tabCred?.addEventListener("click", () => {
    tabCred.classList.add("active");
    tabPin?.classList.remove("active");
    formCred?.classList.remove("hidden");
    boxPin?.classList.add("hidden");
  });

  tabPin?.addEventListener("click", () => {
    tabPin.classList.add("active");
    tabCred?.classList.remove("active");
    boxPin?.classList.remove("hidden");
    formCred?.classList.add("hidden");
    refreshPinLoginUi();
    document.getElementById("login-pin-code")?.focus();
  });

  document.getElementById("toggle-login-pass-btn")?.addEventListener("click", () => {
    const inp = document.getElementById("login-password");
    if (inp) inp.type = inp.type === "password" ? "text" : "password";
  });

  document.getElementById("unbind-device-btn")?.addEventListener("click", () => {
    clearDeviceBoundAdmin();
    tabCred?.click();
    showToast("تم إلغاء ربط الجهاز بنجاح");
  });

  formCred?.addEventListener("submit", (e) => {
    e.preventDefault();
    const idVal = document.getElementById("login-identifier")?.value || "";
    const passVal = document.getElementById("login-password")?.value || "";
    const admin = verifyAdminCredentials(idVal, passVal);
    if (!admin) {
      showToast("بيانات الدخول غير صحيحة أو الحساب لا يملك صلاحية الإدارة العليا");
      return;
    }
    activateAdminSession(admin, true);
    showToast(`مرحباً بك في غرفة التحكم العليا: ${admin.name}`);
  });

  document.getElementById("cr-login-pin-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pinVal = document.getElementById("login-pin-code")?.value || "";
    const res = verifyDeviceBoundAdminPin(pinVal);
    if (res.error) {
      showToast(res.error);
      return;
    }
    activateAdminSession(res.user, false);
    const pinInp = document.getElementById("login-pin-code");
    if (pinInp) pinInp.value = "";
    showToast(`مرحباً بعودتك: ${res.user.name}`);
  });

  // 2. التنقل الرئيسي والخروج
  document.querySelectorAll("#cr-main-nav .cr-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchControlRoomView(btn.getAttribute("data-view") || "view-reviews");
    });
  });

  document.getElementById("header-logout-btn")?.addEventListener("click", handleAdminLogout);

  // 3. التبويبات الأربعة داخل مركز المراجعات
  document.querySelectorAll(".cr-subtab[data-rev-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPane = btn.getAttribute("data-rev-tab");
      state.activeReviewSubtab = targetPane;
      document
        .querySelectorAll(".cr-subtab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      document
        .querySelectorAll(".cr-rev-pane")
        .forEach((p) => p.classList.toggle("hidden", p.id !== targetPane));
    });
  });

  // 4. فلاتر وبحث الأخبار + نافذة التعديل الشامل للخبر
  document.querySelectorAll("#posts-filter-bar .cr-filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.postsFilterType = pill.getAttribute("data-post-filter") || "all";
      document
        .querySelectorAll("#posts-filter-bar .cr-filter-pill")
        .forEach((p) => p.classList.toggle("active", p === pill));
      renderAllPostsManagementView();
    });
  });

  document.getElementById("all-posts-search-input")?.addEventListener("input", (e) => {
    state.postsSearchQuery = (e.target.value || "").trim();
    renderAllPostsManagementView();
  });

  document.getElementById("all-posts-category-filter")?.addEventListener("change", (e) => {
    state.postsFilterCategory = e.target.value || "all";
    renderAllPostsManagementView();
  });

  document.getElementById("close-edit-post-modal-btn")?.addEventListener("click", () => {
    document.getElementById("edit-post-modal")?.classList.add("hidden");
  });

  document.getElementById("admin-post-image-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await compressImageToWebp(file, 1150, 0.8);
      state.editPostImageTempData = webp;
      showToast("تم تجهيز الصورة الجديدة للخبر");
    } catch (_) {}
  });

  document
    .getElementById("cr-edit-post-form")
    ?.addEventListener("submit", handleSaveMasterPostEdits);

  document
    .getElementById("admin-delete-post-permanently-btn")
    ?.addEventListener("click", async () => {
      const postId = document.getElementById("admin-edit-post-id")?.value;
      if (!postId || !confirm("هل أنت متأكد من حذف هذا الخبر نهائياً من قاعدة البيانات؟")) {
        return;
      }
      await deleteDoc(doc(db, "posts", postId));
      document.getElementById("edit-post-modal")?.classList.add("hidden");
      showToast("تم حذف الخبر نهائياً");
    });

  // 5. بحث الكادر وإضافة صحفي جديد وتحديد أقسامه المسموحة
  document.getElementById("staff-smart-search")?.addEventListener("input", (e) => {
    state.staffSearchQuery = (e.target.value || "").trim();
    renderStaffDirectoryView();
  });

  document.getElementById("open-create-staff-modal-btn")?.addEventListener("click", () => {
    renderAllowedCategoriesCheckboxes("new-staff-specific-cats-grid", ["all"]);
    document.getElementById("new-staff-all-cats-chk").checked = true;
    document.getElementById("new-staff-specific-cats-grid")?.classList.add("hidden");
    document.getElementById("create-staff-modal")?.classList.remove("hidden");
  });

  document.getElementById("close-create-staff-modal-btn")?.addEventListener("click", () => {
    document.getElementById("create-staff-modal")?.classList.add("hidden");
  });

  document.getElementById("new-staff-all-cats-chk")?.addEventListener("change", (e) => {
    document
      .getElementById("new-staff-specific-cats-grid")
      ?.classList.toggle("hidden", e.target.checked);
  });

  document.getElementById("cr-create-staff-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (document.getElementById("new-staff-name")?.value || "").trim();
    const jobTitle = (document.getElementById("new-staff-job")?.value || "").trim() || "صحفي";
    const username = (document.getElementById("new-staff-username")?.value || "").trim();
    const password = (document.getElementById("new-staff-password")?.value || "").trim();
    const pinCode = (document.getElementById("new-staff-pin")?.value || "").trim();
    const whatsapp = (document.getElementById("new-staff-whatsapp")?.value || "").trim();
    const role = document.getElementById("new-staff-role")?.value || "writer";
    const verified = Boolean(document.getElementById("new-staff-verified-chk")?.checked);
    const allCats = Boolean(document.getElementById("new-staff-all-cats-chk")?.checked);

    let allowedCategories = ["all"];
    if (!allCats) {
      const checked = Array.from(
        document.querySelectorAll("#new-staff-specific-cats-grid .specific-cat-chk:checked")
      ).map((c) => c.value);
      if (!checked.length) {
        showToast("يرجى اختيار قسم واحد على الأقل للصحفي");
        return;
      }
      allowedCategories = checked;
    }

    const newPressId = generateUniquePressId(state.staff);
    const payload = {
      pressId: newPressId,
      name,
      jobTitle,
      username,
      password,
      pinCode,
      whatsapp,
      role,
      verified,
      directPublish: role === "trusted_writer" || role === "admin",
      allowedCategories,
      accountStatus: "active",
      signatureStatus: "none",
      signedCharterVersion: 0,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "staff"), payload);
      document.getElementById("cr-create-staff-form")?.reset();
      document.getElementById("create-staff-modal")?.classList.add("hidden");
      showToast(`تم إنشاء حساب الصحفي وتوليد الهوية الصحفية: ${newPressId}`);
    } catch (_) {
      showToast("تعذر إنشاء الحساب");
    }
  });

  document.getElementById("close-dossier-modal-btn")?.addEventListener("click", () => {
    document.getElementById("staff-dossier-modal")?.classList.add("hidden");
  });

  // 6. نموذج إدارة الأقسام
  document.getElementById("reset-cat-form-btn")?.addEventListener("click", () => {
    document.getElementById("edit-cat-id").value = "";
    document.getElementById("cr-category-form")?.reset();
    document.getElementById("cat-form-heading").textContent = "إضافة أو تعديل قسم إخباري";
  });

  document.getElementById("cr-category-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = (document.getElementById("edit-cat-id")?.value || "").trim();
    const name = cleanCategoryName(document.getElementById("cat-name-input")?.value || "");
    const slug =
      (document.getElementById("cat-slug-input")?.value || "").trim() ||
      editId ||
      `cat-${Date.now()}`;
    const subsRaw = document.getElementById("cat-subs-input")?.value || "";
    const order = Number(document.getElementById("cat-order-input")?.value || 1);
    const visible = Boolean(document.getElementById("cat-visible-chk")?.checked);

    const subcategories = subsRaw
      .split(/[،,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const catPayload = { name, subcategories, order, visible, updatedAt: Date.now() };

    try {
      await setDoc(doc(db, "categories", slug), catPayload, { merge: true });
      document.getElementById("reset-cat-form-btn")?.click();
      showToast("تم حفظ القسم وتحديث شريط الأقسام في المنصة");
    } catch (_) {
      showToast("تعذر حفظ القسم");
    }
  });

  // 7. نموذج إدارة الإعلانات الممولة
  document.getElementById("reset-ad-form-btn")?.addEventListener("click", () => {
    document.getElementById("edit-ad-id").value = "";
    state.adImageTempData = "";
    document.getElementById("cr-ad-form")?.reset();
    renderSmallImagePreview("ad-img-preview-box", "");
    document.getElementById("ad-form-heading").textContent = "إضافة أو تعديل إعلان ممول";
  });

  document.getElementById("ad-image-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await compressImageToWebp(file, 950, 0.8);
      state.adImageTempData = webp;
      renderSmallImagePreview("ad-img-preview-box", webp);
    } catch (_) {}
  });

  document.getElementById("cr-ad-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = (document.getElementById("edit-ad-id")?.value || "").trim();
    const title = (document.getElementById("ad-title-input")?.value || "").trim();
    const sponsorName = (document.getElementById("ad-sponsor-input")?.value || "").trim();
    const targetUrl = (document.getElementById("ad-target-url")?.value || "").trim();
    const urlInput = (document.getElementById("ad-image-url")?.value || "").trim();
    const active = Boolean(document.getElementById("ad-active-chk")?.checked);

    const payload = {
      title,
      sponsorName,
      targetUrl,
      imageUrl: urlInput || state.adImageTempData || "",
      active,
      status: active ? "active" : "paused",
      updatedAt: Date.now()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "ads", editId), payload);
      } else {
        await addDoc(collection(db, "ads"), {
          ...payload,
          views: 0,
          clicks: 0,
          createdAt: Date.now()
        });
      }
      document.getElementById("reset-ad-form-btn")?.click();
      showToast("تم حفظ ونشر الحملة الإعلانية بنجاح");
    } catch (_) {
      showToast("تعذر حفظ الإعلان");
    }
  });

  // 8. إعدادات الهوية، الألوان، الشعارات الثلاثة، والميثاق
  const colorPicker = document.getElementById("set-accent-color-picker");
  const colorHex = document.getElementById("set-accent-color-hex");

  colorPicker?.addEventListener("input", (e) => {
    if (colorHex) colorHex.value = e.target.value;
    applyDynamicThemeAndBranding(e.target.value);
  });

  colorHex?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      if (colorPicker) colorPicker.value = val;
      applyDynamicThemeAndBranding(val);
    }
  });

  document.querySelectorAll(".cr-color-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.getAttribute("data-color") || DEFAULT_BRAND_COLOR;
      if (colorPicker) colorPicker.value = col;
      if (colorHex) colorHex.value = col;
      applyDynamicThemeAndBranding(col);
    });
  });

  // رفع الشعارات الثلاثة والصور الافتراضية من الجهاز مباشرة
  const bindSettingImageUpload = (fileInputId, settingKey, previewId, maxW = 700) => {
    document.getElementById(fileInputId)?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const webp = await compressImageToWebp(file, maxW, 0.85);
        state.settings[settingKey] = webp;
        renderSmallImagePreview(previewId, webp);
        showToast("تم تجهيز الصورة — اضغط حفظ الإعدادات بالأسفل لتعميمها");
      } catch (_) {}
    });
  };

  bindSettingImageUpload("file-logo-main", "headerLogoUrl", "preview-logo-main", 600);
  bindSettingImageUpload("file-logo-sidebar", "sidebarLogoUrl", "preview-logo-sidebar", 600);
  bindSettingImageUpload("file-logo-footer", "footerLogoUrl", "preview-logo-footer", 600);
  bindSettingImageUpload(
    "file-default-post-img",
    "defaultPostImageUrl",
    "preview-default-post-img",
    1100
  );
  bindSettingImageUpload("file-favicon-img", "faviconUrl", "preview-favicon-img", 256);

  document
    .getElementById("cr-master-settings-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const siteName =
        (document.getElementById("set-site-name")?.value || "").trim() || "حُجرية بريس";
      const accentColor =
        (document.getElementById("set-accent-color-hex")?.value || "").trim() ||
        DEFAULT_BRAND_COLOR;
      const siteDescription = (document.getElementById("set-site-desc")?.value || "").trim();
      const hideSiteName = Boolean(document.getElementById("set-hide-site-name")?.checked);

      const urlMainLogo = (document.getElementById("set-logo-main")?.value || "").trim();
      const urlSideLogo = (document.getElementById("set-logo-sidebar")?.value || "").trim();
      const urlFootLogo = (document.getElementById("set-logo-footer")?.value || "").trim();
      const urlDefImg = (document.getElementById("set-default-post-img")?.value || "").trim();
      const urlFavImg = (document.getElementById("set-favicon-img")?.value || "").trim();

      const finalHeaderLogo =
        urlMainLogo || state.settings.headerLogoUrl || state.settings.logoUrl || "";
      const finalSidebarLogo =
        urlSideLogo || state.settings.sidebarLogoUrl || finalHeaderLogo;
      const finalFooterLogo =
        urlFootLogo || state.settings.footerLogoUrl || finalHeaderLogo;
      const finalDefImg = urlDefImg || state.settings.defaultPostImageUrl || "";
      const finalFav = urlFavImg || state.settings.faviconUrl || "";

      const socials = {
        whatsapp: (document.getElementById("soc-whatsapp")?.value || "").trim(),
        telegram: (document.getElementById("soc-telegram")?.value || "").trim(),
        x: (document.getElementById("soc-x")?.value || "").trim(),
        facebook: (document.getElementById("soc-facebook")?.value || "").trim(),
        youtube: (document.getElementById("soc-youtube")?.value || "").trim(),
        tiktok: (document.getElementById("soc-tiktok")?.value || "").trim()
      };

      const charterHtml =
        (document.getElementById("set-charter-html")?.value || "").trim() ||
        DEFAULT_CHARTER_HTML;
      const bumpCharter = Boolean(
        document.getElementById("set-bump-charter-version")?.checked
      );
      const nextCharterVersion = bumpCharter
        ? Number(state.settings.charterVersion || 1) + 1
        : Number(state.settings.charterVersion || 1);

      const aboutHtml = (document.getElementById("set-about-html")?.value || "").trim();
      const privacyHtml = (document.getElementById("set-privacy-html")?.value || "").trim();

      const masterUsername =
        (document.getElementById("set-master-username")?.value || "").trim() || "admin";
      const masterPassword =
        (document.getElementById("set-master-password")?.value || "").trim() || "admin";
      const masterPin =
        (document.getElementById("set-master-pin")?.value || "").trim() || "0000";

      const settingsPayload = {
        siteName,
        accentColor,
        siteDescription,
        hideSiteName,
        logoUrl: finalHeaderLogo,
        headerLogoUrl: finalHeaderLogo,
        sidebarLogoUrl: finalSidebarLogo,
        authLogoUrl: finalSidebarLogo,
        footerLogoUrl: finalFooterLogo,
        defaultPostImageUrl: finalDefImg,
        faviconUrl: finalFav,
        appIconUrl: finalFav,
        socials,
        charterHtml,
        charterVersion: nextCharterVersion,
        aboutHtml,
        privacyHtml,
        masterUsername,
        masterPassword,
        masterPin,
        updatedAt: Date.now()
      };

      try {
        await setDoc(doc(db, "settings", "general"), settingsPayload, { merge: true });
        state.settings = { ...state.settings, ...settingsPayload };
        const bumpChk = document.getElementById("set-bump-charter-version");
        if (bumpChk) bumpChk.checked = false;
        applyDynamicThemeAndBranding();
        populateMasterSettingsView();
        showToast(
          bumpCharter
            ? `تم حفظ الإعدادات وترقية ميثاق الشرف إلى الإصدار (${nextCharterVersion}) وإشعار كافة الصحفيين`
            : "تم حفظ وتعميم كافة إعدادات المنصة والشعارات واللون بنجاح"
        );
      } catch (err) {
        console.error(err);
        showToast("تعذر حفظ الإعدادات");
      }
    });

  // 9. إغلاق عارض الصور المكبر (Lightbox)
  document.getElementById("close-lightbox-btn")?.addEventListener("click", () => {
    document.getElementById("cr-image-lightbox")?.classList.add("hidden");
  });
}

// ==================== 13. استعادة الجلسة والمزامنة الحية مع Firestore ====================
function tryRestoreAdminSession() {
  try {
    const raw = localStorage.getItem(CR_SESSION_KEY);
    if (!raw) {
      document.getElementById("cr-auth-gate")?.classList.remove("hidden");
      return;
    }
    const saved = JSON.parse(raw);
    if (saved?.id === "master-admin" || saved?.pressId === "HP10001") {
      activateAdminSession({ ...MASTER_ADMIN_DEFAULT }, false);
      return;
    }
    const found = state.staff.find(
      (s) =>
        (s.id === saved?.id || normalizePressId(s.pressId) === normalizePressId(saved?.pressId)) &&
        (s.isMasterAdmin || s.role === "admin") &&
        s.accountStatus !== "frozen"
    );
    if (found) {
      activateAdminSession(found, false);
    } else if (state.staff.length > 0) {
      document.getElementById("cr-auth-gate")?.classList.remove("hidden");
    }
  } catch (_) {
    document.getElementById("cr-auth-gate")?.classList.remove("hidden");
  }
}

function startControlRoomFirestoreSync() {
  onSnapshot(doc(db, "settings", "general"), (snap) => {
    if (snap.exists()) {
      state.settings = { ...state.settings, ...snap.data() };
      applyDynamicThemeAndBranding();
      saveFastCache();
      if (state.activeView === "view-settings") {
        populateMasterSettingsView();
      }
    }
  });

  onSnapshot(collection(db, "categories"), (snap) => {
    if (!snap.empty) {
      const dbCats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const merged = [...DEFAULT_COMPASSES];
      dbCats.forEach((cat) => {
        const idx = merged.findIndex(
          (m) =>
            m.id === cat.id ||
            cleanCategoryName(m.name) === cleanCategoryName(cat.name)
        );
        if (idx >= 0) merged[idx] = { ...merged[idx], ...cat };
        else merged.push(cat);
      });
      state.compasses = merged;
      saveFastCache();
      renderAllControlRoomViews();
    }
  });

  onSnapshot(collection(db, "staff"), (snap) => {
    state.staff = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ضمان امتلاك كل عضو هوية صحفية ثابتة (HP#####)
    state.staff.forEach((member) => {
      const pid = normalizePressId(member.pressId || "");
      if (!pid.startsWith("HP") || pid.length < 6) {
        const newPid = generateUniquePressId(state.staff);
        member.pressId = newPid;
        updateDoc(doc(db, "staff", member.id), { pressId: newPid }).catch(() => {});
      }
    });

    saveFastCache();
    if (!state.currentAdmin) {
      tryRestoreAdminSession();
    } else {
      renderAllControlRoomViews();
    }
  });

  onSnapshot(collection(db, "posts"), (snap) => {
    state.posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => getTimestampMs(b) - getTimestampMs(a));
    saveFastCache();
    renderAllControlRoomViews();
  });

  onSnapshot(collection(db, "ads"), (snap) => {
    state.ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    saveFastCache();
    if (state.activeView === "view-ads") {
      renderAdsManagementView();
    }
  });
}

// ==================== 14. نقطة الانطلاق الفورية لغرفة التحكم ====================
document.addEventListener("DOMContentLoaded", () => {
  restoreFastCache();
  applyDynamicThemeAndBranding();
  refreshPinLoginUi();
  bindAllControlRoomEvents();
  tryRestoreAdminSession();
  startControlRoomFirestoreSync();
});
