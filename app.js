/* ==========================================================================
   حُجرية بريس (Hujariya Press) — المحرك البرمجي لغرفة التحكم العليا (app.js v6.0)
   [الجزء الأول من 2]:
   - التهيئة السحابية (Firebase Firestore) + الرفع السحابي للصور عبر (ImgBB API)
   - الأزرار التفاعلية الذكية (Loading States) + نافذة التأكيد الزجاجية الآمنة
   - الهوية اللونية الديناميكية + الشعارات الثلاثة + أمان الدخول وربط الـ PIN بالجهاز
   - مركز المراجعات الرباعي + المعاينة الحية للخبر + مراجعة طلبات الحذف مع السبب
   - إدارة كافة الأخبار + الترقيم الذكي (Pagination) + المحرر الشامل للأخبار
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

// ==================== 1. إعدادات Firebase ومفتاح السحابة المصورة (ImgBB API) ====================
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

const DEFAULT_IMGBB_API_KEY = "6d207e02198a847aa98d0a2a901485a5";

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const CR_SESSION_KEY = "hujariya_cr_admin_session_v6";
const CR_DEVICE_BOUND_KEY = "hujariya_cr_device_bound_v6";
const CR_FAST_CACHE_KEY = "hujariya_cr_fast_cache_v6";

const DEFAULT_BRAND_COLOR = "#b80d38";
const POSTS_PER_PAGE = 12;

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
    imgbbApiKey: DEFAULT_IMGBB_API_KEY,
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
  postsCurrentPage: 1,
  staffSearchQuery: "",
  activeDossierStaffId: null,
  dossierAvatarTempUrl: "",
  editPostImageTempUrl: "",
  adImageTempUrl: "",
  previewingPostId: null
};

// ==================== 3. الدوال التفاعلية، نافذة التأكيد، ورفع الصور إلى ImgBB ====================
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

function setButtonLoading(btnOrId, isLoading, loadingText = "جاري التنفيذ...") {
  const btn =
    typeof btnOrId === "string" ? document.getElementById(btnOrId) : btnOrId;
  if (!btn) return;

  const labelEl = btn.querySelector(".cr-btn-label") || btn.querySelector("span:last-child");

  if (isLoading) {
    if (!btn.dataset.originalLabel && labelEl) {
      btn.dataset.originalLabel = labelEl.textContent;
    }
    btn.disabled = true;
    btn.classList.add("is-loading");
    if (labelEl) labelEl.textContent = loadingText;
  } else {
    btn.disabled = false;
    btn.classList.remove("is-loading");
    if (btn.dataset.originalLabel && labelEl) {
      labelEl.textContent = btn.dataset.originalLabel;
    }
  }
}

function askAdminConfirmation({
  title = "تأكيد القرار الإداري",
  message = "هل أنت متأكد من تنفيذ هذا الإجراء؟",
  confirmText = "نعم، تأكيد",
  icon = "help",
  danger = false
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("cr-confirm-modal");
    const titleEl = document.getElementById("cr-confirm-title");
    const msgEl = document.getElementById("cr-confirm-message");
    const iconEl = document.getElementById("cr-confirm-icon");
    const iconBox = document.getElementById("cr-confirm-icon-box");
    const acceptBtn = document.getElementById("cr-confirm-accept-btn");
    const acceptLabel = document.getElementById("cr-confirm-accept-label");
    const cancelBtn = document.getElementById("cr-confirm-cancel-btn");

    if (!modal || !acceptBtn || !cancelBtn) {
      resolve(window.confirm(message));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;
    if (acceptLabel) acceptLabel.textContent = confirmText;

    if (iconBox) {
      iconBox.style.backgroundColor = danger ? "#fef2f2" : "var(--brand-soft)";
      iconBox.style.color = danger ? "var(--danger-red)" : "var(--brand-primary)";
    }

    acceptBtn.className = danger
      ? "cr-btn cr-btn-danger"
      : "cr-btn cr-btn-primary";

    modal.classList.remove("hidden");

    const cleanup = () => {
      modal.classList.add("hidden");
      acceptBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    acceptBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
  });
}

function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
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

function compressImageToDataUrl(file, maxWidth = 1150, quality = 0.82) {
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

async function uploadImageToImgBB(fileOrDataUrl, maxWidth = 1150, quality = 0.82) {
  let dataUrl = "";
  if (typeof fileOrDataUrl === "string" && fileOrDataUrl.startsWith("data:")) {
    dataUrl = fileOrDataUrl;
  } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
    dataUrl = await compressImageToDataUrl(fileOrDataUrl, maxWidth, quality);
  } else {
    throw new Error("ملف غير صالح");
  }

  const base64String = dataUrl.split(",")[1];
  const apiKey = (state.settings.imgbbApiKey || DEFAULT_IMGBB_API_KEY).trim();

  try {
    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("image", base64String);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      const json = await response.json();
      const directUrl =
        json?.data?.display_url || json?.data?.url || json?.data?.image?.url;
      if (directUrl) {
        return { url: directUrl, host: "imgbb" };
      }
    }
  } catch (err) {
    console.warn("ImgBB fallback triggered:", err);
  }

  if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
    const compact = await compressImageToDataUrl(fileOrDataUrl, 680, 0.68);
    return { url: compact, host: "compact" };
  }
  return { url: dataUrl, host: "compact" };
}

function openImageInLightbox(imgSrc) {
  if (!imgSrc) return;
  const modal = document.getElementById("cr-image-lightbox");
  const img = document.getElementById("lightbox-preview-img");
  if (!modal || !img) return;
  img.src = imgSrc;
  modal.classList.remove("hidden");
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
  root.style.setProperty("--brand-border", `rgba(${rgb}, 0.22)`);
  root.style.setProperty("--brand-shadow", `0 12px 32px -8px rgba(${rgb}, 0.16)`);

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

// ==================== 4. الكاش السريع (0ms Cache) + نظام الدخول وربط الجهاز ====================
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

  const masterUser = String(state.settings.masterUsername || "admin").trim().toLowerCase();
  const masterPass = String(state.settings.masterPassword || "admin").trim();

  if (
    (idClean === masterUser || idClean === "admin" || pressIdClean === "HP10001") &&
    (passClean === masterPass || (!state.settings.masterPassword && passClean === "admin"))
  ) {
    const savedMaster = state.staff.find((s) => s.id === "master-admin");
    return {
      ...MASTER_ADMIN_DEFAULT,
      ...(savedMaster || {}),
      username: state.settings.masterUsername || "admin"
    };
  }

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

  const staffAdmin = state.staff.find(
    (s) => s.id === bound.adminId || normalizePressId(s.pressId) === bound.pressId
  );

  if (bound.adminId === "master-admin" || bound.pressId === "HP10001") {
    const masterPin = String(
      staffAdmin?.pinCode || state.settings.masterPin || "0000"
    ).trim();
    if (pinClean === masterPin) {
      return { user: { ...MASTER_ADMIN_DEFAULT, ...(staffAdmin || {}) } };
    }
    return { error: "رمز الدخول السريع (PIN) غير صحيح" };
  }

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

  if (typeof renderAllControlRoomViews === "function") {
    renderAllControlRoomViews();
  }
}

async function requestSafeAdminLogout() {
  const confirmed = await askAdminConfirmation({
    title: "تسجيل الخروج من غرفة التحكم",
    message: "هل تود إغلاق جلسة القيادة الحالية وتسجيل الخروج؟",
    confirmText: "نعم، تسجيل الخروج",
    icon: "logout",
    danger: false
  });
  if (!confirmed) return;

  state.currentAdmin = null;
  localStorage.removeItem(CR_SESSION_KEY);
  refreshPinLoginUi();
  document.getElementById("cr-auth-gate")?.classList.remove("hidden");
  showToast("تم تسجيل الخروج الآمن من غرفة التحكم العليا");
}

// ==================== 5. الإحصائيات العليا ومركز المراجعات الرباعي + المعاينة الحية ====================
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

  ["desktop-reviews-badge", "mobile-reviews-badge"].forEach((id) => {
    const badge = document.getElementById(id);
    if (badge) {
      badge.textContent = String(totalPendingTasks);
      badge.classList.toggle("hidden", totalPendingTasks === 0);
    }
  });

  setNum("badge-rev-posts", pendingPosts);
  setNum("badge-rev-sigs", pendingSigs);
  setNum("badge-rev-kyc", pendingKyc);
  setNum("badge-rev-deletes", deleteReqs);
}

function openAdminPostPreviewModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  state.previewingPostId = post.id;
  const modal = document.getElementById("cr-preview-modal");
  const body = document.getElementById("cr-preview-article-body");
  if (!modal || !body) return;

  const cat = cleanCategoryName(
    (Array.isArray(post.categories) && post.categories[0]) || post.category || "عام"
  );

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      <span class="cr-counter-pill">${escapeHtml(cat)}</span>
      <span style="font-size:0.78rem;color:var(--text-muted);font-weight:800;">
        الكاتب: <strong>${escapeHtml(post.author || "صحفي")}</strong>
        ${post.authorPressId ? `(<span dir="ltr">${escapeHtml(post.authorPressId)}</span>)` : ""}
        • ${formatArabicDate(post)}
      </span>
    </div>
    <h1>${escapeHtml(post.title || "بدون عنوان")}</h1>
    ${
      post.summary
        ? `<div style="padding:12px 14px;background:#fff;border-right:4px solid var(--brand-primary);border-radius:6px;font-weight:700;margin-bottom:16px;">${escapeHtml(
            post.summary
          )}</div>`
        : ""
    }
    ${
      post.imageUrl
        ? `<img src="${escapeHtml(
            post.imageUrl
          )}" alt="" style="width:100%;max-height:420px;object-fit:cover;border-radius:10px;margin-bottom:16px;">`
        : ""
    }
    <div style="font-size:1.05rem;line-height:1.9;">${post.content || ""}</div>
  `;

  modal.classList.remove("hidden");
}

function renderReviewsCenterView() {
  renderTopPlatformStats();

  // 1. مراجعة المنشورات المعلقة
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
                <h3 style="font-size:1rem;font-weight:900;margin-bottom:4px;">${escapeHtml(
                  p.title
                )}</h3>
                <p style="font-size:0.81rem;color:var(--text-muted);font-weight:700;">
                  الكاتب: <strong>${escapeHtml(p.author || "صحفي")}</strong>
                  ${p.authorPressId ? `(<span dir="ltr">${escapeHtml(p.authorPressId)}</span>)` : ""}
                </p>
              </div>

              <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                <button type="button" class="cr-btn cr-btn-primary cr-btn-sm" data-approve-post="${escapeHtml(
                  p.id
                )}">
                  <span class="material-symbols-rounded" style="font-size:17px;" translate="no">check_circle</span>
                  <span>اعتماد ونشر فوري</span>
                </button>
                <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-preview-post="${escapeHtml(
                  p.id
                )}">
                  <span class="material-symbols-rounded" style="font-size:17px;" translate="no">visibility</span>
                  <span>معاينة</span>
                </button>
                <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-open-edit-post="${escapeHtml(
                  p.id
                )}">
                  <span class="material-symbols-rounded" style="font-size:17px;" translate="no">edit_document</span>
                  <span>تعديل</span>
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
          setButtonLoading(btn, true, "جاري النشر...");
          try {
            await updateDoc(doc(db, "posts", id), {
              status: "published",
              approvedAt: Date.now()
            });
            showToast("تم اعتماد الخبر ونشره على الموقع العام فوراً ✓");
          } catch (_) {
            setButtonLoading(btn, false);
          }
        });
      });

      postsPane.querySelectorAll("[data-preview-post]").forEach((btn) => {
        btn.addEventListener("click", () => {
          openAdminPostPreviewModal(btn.getAttribute("data-preview-post"));
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
          const ok = await askAdminConfirmation({
            title: "إعادة الخبر للمحرر",
            message: "هل تود إعادة هذه المادة الصحفية إلى المحرر لمراجعتها وتعديلها؟",
            confirmText: "نعم، إعادة للمحرر",
            icon: "undo",
            danger: true
          });
          if (!ok) return;
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
                    <span>اعتماد التوقيع وتفعيل الحساب</span>
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
          setButtonLoading(btn, true, "جاري الاعتماد...");
          await updateDoc(doc(db, "staff", sid), {
            signatureStatus: "approved",
            everApprovedCharter: true,
            signatureApprovedAt: Date.now()
          });
          showToast("تم اعتماد توقيع ميثاق الشرف وتفعيل النشر للصحفي ✓");
        });
      });

      sigsPane.querySelectorAll("[data-reject-sig]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-reject-sig");
          const ok = await askAdminConfirmation({
            title: "رفض التوقيع وطلب إعادته",
            message: "هل تود رفض هذا التوقيع ومطالبة الصحفي برسم 3 توقيعات متطابقة من جديد؟",
            confirmText: "نعم، رفض التوقيع",
            icon: "draw",
            danger: true
          });
          if (!ok) return;
          await updateDoc(doc(db, "staff", sid), { signatureStatus: "rejected" });
          showToast("تم رفض التوقيع وإشعار الصحفي بإعادة التوقيع الثلاثي");
        });
      });

      sigsPane.querySelectorAll("[data-open-dossier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (typeof openStaffDossierModal === "function") {
            openStaffDossierModal(btn.getAttribute("data-open-dossier"));
          }
        });
      });

      sigsPane.querySelectorAll("[data-zoom-img]").forEach((img) => {
        img.addEventListener("click", () => {
          openImageInLightbox(img.getAttribute("data-zoom-img"));
        });
      });
    }
  }

  // 3. مراجعة طلبات توثيق الهويات الرسمية (KYC)
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
                    الوثيقة: ${s.docType === "passport" ? "جواز سفر" : "بطاقة شخصية"} |
                    رقمها: <strong>${escapeHtml(s.docNumber || "-")}</strong> |
                    إصدار: ${escapeHtml(s.docIssueDate || "-")} |
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
                    <span>الملف الشامل</span>
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
          setButtonLoading(btn, true, "جاري التوثيق...");
          await updateDoc(doc(db, "staff", sid), {
            kycStatus: "approved",
            verified: true,
            signatureStatus: "approved",
            everApprovedCharter: true
          });
          showToast("تم توثيق هوية الصحفي ومنحه الشارة الزرقاء المعتمدة ✓");
        });
      });

      kycPane.querySelectorAll("[data-reject-kyc]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sid = btn.getAttribute("data-reject-kyc");
          const ok = await askAdminConfirmation({
            title: "رفض طلب توثيق الهوية",
            message: "هل تود رفض الوثائق المرفوعة ومطالبة الصحفي بإعادة رفع صور واضحة؟",
            confirmText: "نعم، رفض الطلب",
            icon: "cancel",
            danger: true
          });
          if (!ok) return;
          await updateDoc(doc(db, "staff", sid), { kycStatus: "rejected" });
          showToast("تم رفض طلب التوثيق");
        });
      });

      kycPane.querySelectorAll("[data-open-dossier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (typeof openStaffDossierModal === "function") {
            openStaffDossierModal(btn.getAttribute("data-open-dossier"));
          }
        });
      });

      kycPane.querySelectorAll("[data-zoom-img]").forEach((img) => {
        img.addEventListener("click", () => {
          openImageInLightbox(img.getAttribute("data-zoom-img"));
        });
      });
    }
  }

  // 4. مراجعة طلبات الحذف (Soft Delete Requests) مع عرض سبب الحذف المكتوب من الصحفي
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
            <div style="flex:1;min-width:240px;">
              <span class="cr-status-badge st-rejected">طلب حذف (مخفي حالياً من الموقع العام)</span>
              <h3 style="font-size:1rem;font-weight:900;margin-top:6px;">${escapeHtml(p.title)}</h3>
              <p style="font-size:0.82rem;color:var(--text-muted);font-weight:700;margin-top:3px;">
                الكاتب: <strong>${escapeHtml(p.author || "-")}</strong>
                ${p.authorPressId ? `(<span dir="ltr">${escapeHtml(p.authorPressId)}</span>)` : ""}
              </p>
              <div style="margin-top:6px;padding:7px 11px;background:#fef2f2;border-right:3px solid var(--danger-red);border-radius:6px;font-size:0.8rem;font-weight:800;color:var(--danger-red);">
                سبب طلب الحذف: ${escapeHtml(p.deleteReason || "لم يذكر الكاتب سبباً محدداً")}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-preview-post="${escapeHtml(
                p.id
              )}">
                <span class="material-symbols-rounded" style="font-size:17px;" translate="no">visibility</span>
                <span>معاينة</span>
              </button>
              <button type="button" class="cr-btn cr-btn-secondary cr-btn-sm" data-restore-post="${escapeHtml(
                p.id
              )}">
                <span class="material-symbols-rounded" style="font-size:17px;" translate="no">restore</span>
                <span>رفض الحذف وإعادة النشر</span>
              </button>
              <button type="button" class="cr-btn cr-btn-danger cr-btn-sm" data-confirm-delete-post="${escapeHtml(
                p.id
              )}">
                <span class="material-symbols-rounded" style="font-size:17px;" translate="no">delete_forever</span>
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        `
        )
        .join("")}</div>`;

      deletesPane.querySelectorAll("[data-preview-post]").forEach((btn) => {
        btn.addEventListener("click", () => {
          openAdminPostPreviewModal(btn.getAttribute("data-preview-post"));
        });
      });

      deletesPane.querySelectorAll("[data-restore-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-restore-post");
          await updateDoc(doc(db, "posts", id), {
            status: "published",
            deleteReason: ""
          });
          showToast("تم رفض الحذف وإعادة نشر الخبر على الموقع العام ✓");
        });
      });

      deletesPane.querySelectorAll("[data-confirm-delete-post]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-confirm-delete-post");
          const ok = await askAdminConfirmation({
            title: "تأكيد الحذف النهائي",
            message: "سيتم مسح هذا الخبر نهائياً من قاعدة البيانات ولا يمكن استعادته. هل أنت متأكد؟",
            confirmText: "نعم، حذف نهائي",
            icon: "delete_forever",
            danger: true
          });
          if (!ok) return;
          await deleteDoc(doc(db, "posts", id));
          showToast("تم حذف الخبر نهائياً من المنصة");
        });
      });
    }
  }
}

// ==================== 6. إدارة كافة الأخبار + الترقيم الذكي + المحرر الشامل ====================
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

// فحص آلي لإلغاء شارة (عاجل) عن الأخبار التي انتهت صلاحية الـ 6 ساعات الخاصة بها
function checkAndExpireOldBreakingPosts() {
  const now = Date.now();
  state.posts.forEach((p) => {
    if (p.isBreaking && p.breakingExpiresAt && Number(p.breakingExpiresAt) < now) {
      p.isBreaking = false;
      updateDoc(doc(db, "posts", p.id), { isBreaking: false }).catch(() => {});
    }
  });
}

function renderAllPostsManagementView() {
  populatePostsCategoryFilterDropdown();
  const container = document.getElementById("admin-all-posts-list");
  const paginationBar = document.getElementById("admin-posts-pagination");
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
    const terms = state.postsSearchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    list = list.filter((p) => {
      const hay = `${p.title || ""} ${p.summary || ""} ${p.author || ""} ${
        p.authorPressId || ""
      } ${p.category || ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  if (!list.length) {
    container.innerHTML = `<div class="cr-empty-box"><p>لا توجد أخبار مطابقة لمعايير التصفية الحالية.</p></div>`;
    paginationBar?.classList.add("hidden");
    return;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
  if (state.postsCurrentPage > totalPages) state.postsCurrentPage = totalPages;
  if (state.postsCurrentPage < 1) state.postsCurrentPage = 1;

  const startIdx = (state.postsCurrentPage - 1) * POSTS_PER_PAGE;
  const pageItems = list.slice(startIdx, startIdx + POSTS_PER_PAGE);

  if (paginationBar) {
    paginationBar.classList.toggle("hidden", totalPages <= 1);
    const infoEl = document.getElementById("posts-page-info-label");
    const prevBtn = document.getElementById("posts-page-prev-btn");
    const nextBtn = document.getElementById("posts-page-next-btn");

    if (infoEl) {
      infoEl.textContent = `صفحة ${state.postsCurrentPage} من ${totalPages} (إجمالي ${list.length} خبر)`;
    }
    if (prevBtn) prevBtn.disabled = state.postsCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = state.postsCurrentPage >= totalPages;
  }

  container.innerHTML = pageItems
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
              <span style="font-size:0.74rem;font-weight:800;color:var(--brand-primary);background:var(--brand-soft);padding:2px 8px;border-radius:5px;">
                ${escapeHtml(cat)}
              </span>
              <span style="font-size:0.74rem;color:var(--text-muted);font-weight:700;">
                الكاتب: <strong>${escapeHtml(p.author || "هيئة التحرير")}</strong>
                ${p.authorPressId ? `(<span dir="ltr">${escapeHtml(p.authorPressId)}</span>)` : ""}
                • ${formatArabicDate(p)} • ${views} قراءة
              </span>
            </div>
            <h3 style="font-size:0.98rem;font-weight:900;color:var(--text-main);">
              ${escapeHtml(p.title || "بدون عنوان")}
            </h3>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="cr-priority-toggles">
              <button
                type="button"
                class="cr-prio-chip ${p.isBreaking ? "active" : ""}"
                data-toggle-prio="isBreaking"
                data-post-id="${escapeHtml(p.id)}"
                title="تفعيل أو سحب الخبر فوراً من شريط الأخبار العاجلة"
              >
                <span class="material-symbols-rounded" style="font-size:15px;" translate="no">campaign</span>
                <span>عاجل</span>
              </button>

              <button
                type="button"
                class="cr-prio-chip ${p.isFeatured ? "active" : ""}"
                data-toggle-prio="isFeatured"
                data-post-id="${escapeHtml(p.id)}"
                title="تفعيل أو سحب الخبر من الواجهة الرئيسية الكبرى"
              >
                <span class="material-symbols-rounded" style="font-size:15px;" translate="no">star</span>
                <span>واجهة كبرى</span>
              </button>

              <button
                type="button"
                class="cr-prio-chip ${p.isQuickNews ? "active" : ""}"
                data-toggle-prio="isQuickNews"
                data-post-id="${escapeHtml(p.id)}"
                title="تفعيل أو سحب الخبر من موجز النبض"
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
            ? "تم تفعيل أولوية الظهور للخبر فوراً ✓"
            : "تم سحب الخبر من أولوية الظهور فوراً ✓"
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
  state.editPostImageTempUrl = post.imageUrl || "";

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
  // الحفاظ الصارم على حالة الخبر الحالية تلقائياً لمنع نشر خبر معلق بالخطأ
  setVal("admin-post-status", post.status || "published");
  setVal(
    "admin-post-image-url",
    post.imageUrl && !post.imageUrl.startsWith("data:") ? post.imageUrl : ""
  );
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

async function handleSaveMasterPostEdits(e, forcePublishNow = false) {
  if (e) e.preventDefault();
  const postId = document.getElementById("admin-edit-post-id")?.value;
  if (!postId) return;

  const title = (document.getElementById("admin-post-title")?.value || "").trim();
  const summary = (document.getElementById("admin-post-summary")?.value || "").trim();
  const category = cleanCategoryName(
    (document.getElementById("admin-post-category")?.value || "").trim()
  );
  const subcategory = (document.getElementById("admin-post-subcategory")?.value || "").trim();
  const status = forcePublishNow
    ? "published"
    : document.getElementById("admin-post-status")?.value || "published";
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
    imageUrl: urlInput || state.editPostImageTempUrl || "",
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

  setButtonLoading("admin-save-post-btn", true, "جاري حفظ التعديلات...");

  try {
    await updateDoc(doc(db, "posts", postId), payload);
    document.getElementById("edit-post-modal")?.classList.add("hidden");
    showToast(
      forcePublishNow
        ? "تم حفظ التعديلات واعتماد نشر الخبر فوراً ✓"
        : "تم حفظ تعديلات الخبر بنجاح ✓"
    );
  } catch (err) {
    console.error(err);
    showToast("تعذر حفظ التعديلات");
  } finally {
    setButtonLoading("admin-save-post-btn", false);
  }
}

/* === نهاية الجزء الأول من app.js لغرفة التحكم — يُلصق الجزء الثاني تحته مباشرة === */
