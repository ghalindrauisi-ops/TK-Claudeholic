/**
 * ============================================================================
 * FILE: script.js
 * DESKRIPSI: Pengendali Interaksi, Routing Hash URL, & State Frontend SINFO.
 * CATATAN: Halaman ClaudeHolic kini terpisah di claudeholic.html.
 * ============================================================================
 */

const STORAGE_KEY = "sinfo_kolab_state_v2";
const VALID_VIEWS = ["beranda", "lomba", "workshop", "event", "tersimpan", "teman", "profil"];

let state = {
  currentUser: null,
  students: [],
  posts: [],
  applicants: [],
  friendRequests: [],
  activeView: "beranda",
  viewingProfileId: "u-me",
  activeNotifTab: "all"
};

let hoverHideTimer = null;
let rollingWordIndex = 0;

// ============================================================================
// 01. UTILITAS KEAMANAN TEKS, TOAST & COUNTDOWN
// ============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message) {
  const toast = document.getElementById("toast-banner");
  const textEl = document.getElementById("toast-message");
  if (!toast || !textEl) return;
  textEl.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

function getCountdownInfo(post) {
  if (post && post.countdownInfo && post.countdownInfo.label) {
    return post.countdownInfo;
  }
  const isoDeadline = typeof post === "string" ? post : post.deadline;
  const target = new Date(isoDeadline).getTime();
  const diffMs = target - Date.now();
  if (isNaN(target)) return { label: "Segera", urgent: false };
  if (diffMs <= 0) return { label: "Tenggat Terlewat", urgent: true };

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return {
    label: days > 0 ? `${days} hari ${hours} jam lagi` : `${hours} jam lagi (Mendesak!)`,
    urgent: totalHours <= 72
  };
}

function getUserById(userId) {
  if (state.currentUser && state.currentUser.id === userId) return state.currentUser;
  if (userId === DEFAULT_CURRENT_USER.id) return state.currentUser || DEFAULT_CURRENT_USER;
  return state.students.find((s) => s.id === userId) || null;
}

function t(key, fallback) {
  if (window.SITE_TEXTS && typeof window.SITE_TEXTS[key] === "string") {
    return window.SITE_TEXTS[key];
  }
  return fallback;
}

// ============================================================================
// 02. MANAJEMEN STATE FRONTEND & PENYIMPANAN LOCALSTORAGE
// ============================================================================
function applySnapshot(snapshot) {
  if (!snapshot) return;
  state.currentUser = snapshot.currentUser || null;
  state.students = Array.isArray(snapshot.students) ? snapshot.students : JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  state.posts = Array.isArray(snapshot.posts) ? snapshot.posts : JSON.parse(JSON.stringify(INITIAL_POSTS));
  state.applicants = Array.isArray(snapshot.applicants) ? snapshot.applicants : JSON.parse(JSON.stringify(INITIAL_APPLICANTS));
  state.friendRequests = Array.isArray(snapshot.friendRequests) ? snapshot.friendRequests : JSON.parse(JSON.stringify(INITIAL_FRIEND_REQUESTS));
  saveLocalFallback();
}

function saveLocalFallback() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser: state.currentUser,
        students: state.students,
        posts: state.posts,
        applicants: state.applicants,
        friendRequests: state.friendRequests
      })
    );
  } catch (err) {
    console.warn("Penyimpanan localStorage dilewati:", err);
  }
}

function loadLocalFallback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      applySnapshot(JSON.parse(raw));
      return;
    }
  } catch (err) {
    console.warn("Memuat data awal:", err);
  }
  state.currentUser = null;
  state.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  state.posts = JSON.parse(JSON.stringify(INITIAL_POSTS));
  state.applicants = JSON.parse(JSON.stringify(INITIAL_APPLICANTS));
  state.friendRequests = JSON.parse(JSON.stringify(INITIAL_FRIEND_REQUESTS));
}

async function apiRequest(endpoint, method = "GET", body = null) {
  // Pure Front-End Mode: seluruh operasi ditangani langsung oleh state lokal & localStorage
  return null;
}

function bootstrapApplication() {
  loadLocalFallback();
  refreshAllUI();

  // Sinkronkan view awal dari URL hash (mis. index.html#lomba)
  const initialHash = window.location.hash.replace("#", "").trim().toLowerCase();
  if (initialHash && VALID_VIEWS.includes(initialHash) && initialHash !== "beranda") {
    navigateTo(initialHash, false);
  }
}

// ============================================================================
// 03. ANIMASI KATA BERGULIR DI HERO BERANDA
// ============================================================================
function startHeroWordRoll() {
  const wordEl = document.getElementById("rolling-word");
  if (!wordEl || !Array.isArray(SINFO_CONFIG.heroRollingWords)) return;

  setInterval(() => {
    rollingWordIndex = (rollingWordIndex + 1) % SINFO_CONFIG.heroRollingWords.length;
    wordEl.classList.remove("animate-roll-word");
    void wordEl.offsetWidth;
    wordEl.textContent = SINFO_CONFIG.heroRollingWords[rollingWordIndex];
    wordEl.classList.add("animate-roll-word");
  }, 2400);
}

// ============================================================================
// 04. AUTENTIKASI CAS SSO & MANAJEMEN MODAL AKSESIBEL
// ============================================================================
function openSsoModal() {
  const modal = document.getElementById("modal-sso");
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add("hidden");
}

function closeAllModals() {
  document.querySelectorAll(".app-modal").forEach((modal) => {
    modal.classList.add("hidden");
  });
}

function setupAccessibleModals() {
  document.querySelectorAll(".app-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
      hideHoverPopover();
    }
  });
}

async function loginDemoSso() {
  const res = await apiRequest("/api/auth/sso", "POST", { mode: "demo" });
  if (!res) {
    state.currentUser = JSON.parse(JSON.stringify(DEFAULT_CURRENT_USER));
    saveLocalFallback();
  }
  closeModal("modal-sso");
  refreshAllUI();
  showToast(`Selamat datang, ${state.currentUser.name}! Akun SSO terverifikasi.`);
}

async function submitCustomSso(event) {
  event.preventDefault();
  const name = document.getElementById("sso-input-name").value.trim();
  const nim = document.getElementById("sso-input-nim").value.trim();
  const faculty = document.getElementById("sso-input-faculty").value.trim();
  if (!name || !nim) return;

  const res = await apiRequest("/api/auth/sso", "POST", {
    mode: "custom",
    name,
    nim,
    faculty
  });

  if (!res) {
    const customUser = JSON.parse(JSON.stringify(DEFAULT_CURRENT_USER));
    customUser.name = name;
    customUser.nim = nim;
    customUser.faculty = faculty || "Universitas Indonesia";
    customUser.email = `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@ui.ac.id`;
    state.currentUser = customUser;
    saveLocalFallback();
  }

  closeModal("modal-sso");
  refreshAllUI();
  showToast(`Berhasil masuk sebagai ${state.currentUser.name} (Terverifikasi SSO).`);
}

async function logoutSso() {
  const res = await apiRequest("/api/auth/logout", "POST");
  if (!res) {
    state.currentUser = null;
    saveLocalFallback();
  }
  navigateTo("beranda");
  refreshAllUI();
  showToast("Kamu telah keluar dari sesi SSO.");
}

function handleAddInfoClick() {
  if (!state.currentUser || !state.currentUser.verified) {
    openSsoModal();
    showToast("Silakan masuk & verifikasi SSO kampus terlebih dahulu untuk menambah info.");
    return;
  }
  document.getElementById("modal-add-info").classList.remove("hidden");
}

// ============================================================================
// 05. RENDER NAVBAR ATAS, PRATINJAU GUEST, & NAVIGASI VIEW (URL HASH SYNC)
// ============================================================================
function renderGuestPreviewCards() {
  const grid = document.getElementById("guest-preview-grid");
  if (!grid) return;

  const samplePosts = state.posts.slice(0, 3);
  grid.innerHTML = samplePosts
    .map((post) => {
      const countdown = getCountdownInfo(post);
      const badgeClass =
        post.type === "Lomba"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : post.type === "Workshop"
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      return `
        <article class="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4">
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}">${escapeHtml(post.type)}</span>
              <span class="text-xs font-semibold text-slate-400">${escapeHtml(post.category)}</span>
            </div>
            <h3 class="font-display font-bold text-base text-slate-900 line-clamp-2">${escapeHtml(post.title)}</h3>
            <p class="text-xs text-slate-500">${escapeHtml(t("prefixPenyelenggara", "Oleh"))} ${escapeHtml(post.organizer)}</p>
            <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${escapeHtml(post.description)}</p>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold text-slate-600">⏰ ${escapeHtml(countdown.label)}</span>
            <button type="button" onclick="openSsoModal()" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition">
              ${escapeHtml(t("kartuGuestMasukGabung", "Masuk untuk Gabung →"))}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTopAuthArea() {
  const addInfoBtn = document.getElementById("btn-add-info");
  const notifBtn = document.getElementById("btn-notifications");
  const authArea = document.getElementById("top-auth-area");
  const heroGuestCta = document.getElementById("hero-cta-guest");
  const heroAuthCta = document.getElementById("hero-cta-auth");
  const guestPreview = document.getElementById("beranda-guest-preview");
  const berandaDashboard = document.getElementById("beranda-auth-dashboard");
  const desktopNav = document.getElementById("desktop-navbar");
  const bottomNav = document.getElementById("bottom-navbar");

  const isVerified = Boolean(state.currentUser && state.currentUser.verified);

  if (isVerified) {
    addInfoBtn.className = "inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition cursor-pointer";
    addInfoBtn.innerHTML = `<span class="sm:hidden">${escapeHtml(t("tombolTambahInfoMobile", "+ Info"))}</span><span class="hidden sm:inline">${escapeHtml(t("tombolTambahInfo", "+ Tambah Info"))}</span>`;
  } else {
    addInfoBtn.className = "inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer";
    addInfoBtn.innerHTML = `<span class="sm:hidden">${escapeHtml(t("tombolTambahInfoTerkunciMobile", "🔒 + Info"))}</span><span class="hidden sm:inline">${escapeHtml(t("tombolTambahInfoTerkunci", "🔒 + Tambah Info"))}</span>`;
  }

  if (state.currentUser) {
    notifBtn.classList.remove("hidden");
    heroGuestCta.classList.add("hidden");
    heroAuthCta.classList.remove("hidden");
    if (guestPreview) guestPreview.classList.add("hidden");
    berandaDashboard.classList.remove("hidden");
    if (desktopNav) {
      desktopNav.classList.remove("hidden");
      desktopNav.classList.add("xl:flex");
    }
    bottomNav.classList.remove("hidden");

    authArea.innerHTML = `
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <button type="button" onclick="openMyProfile()" title="${escapeHtml(state.currentUser.name)}" class="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 transition shrink-0">
          <img src="${escapeHtml(state.currentUser.avatar)}" alt="${escapeHtml(state.currentUser.name)}" class="w-7 h-7 rounded-full object-cover shrink-0" />
          <span class="hidden sm:inline text-xs font-bold text-slate-800 max-w-[110px] truncate">${escapeHtml(state.currentUser.name)}</span>
          <span class="hidden sm:inline text-blue-600 text-xs font-bold" title="Terverifikasi SSO">✓</span>
        </button>
        <button type="button" onclick="logoutSso()" title="${escapeHtml(t("tombolKeluar", "Keluar"))}" aria-label="${escapeHtml(t("tombolKeluar", "Keluar"))}" class="p-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition shrink-0">
          <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hidden sm:inline">${escapeHtml(t("tombolKeluar", "Keluar"))}</span>
        </button>
      </div>
    `;
  } else {
    notifBtn.classList.add("hidden");
    heroGuestCta.classList.remove("hidden");
    heroAuthCta.classList.add("hidden");
    if (guestPreview) guestPreview.classList.remove("hidden");
    berandaDashboard.classList.add("hidden");
    if (desktopNav) {
      desktopNav.classList.add("hidden");
      desktopNav.classList.remove("xl:flex");
    }
    bottomNav.classList.add("hidden");
    renderGuestPreviewCards();

    authArea.innerHTML = `
      <button type="button" onclick="openSsoModal()" class="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 shadow-2xs transition">
        ${escapeHtml(t("tombolMasukSso", "Masuk SSO"))}
      </button>
    `;
  }
}

function syncActiveNavStyles(viewName) {
  document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
    const navKey = btn.getAttribute("data-nav");
    if (navKey === viewName) {
      btn.classList.remove("text-slate-500");
      btn.classList.add("text-blue-600", "bg-blue-50/80");
    } else {
      btn.classList.remove("text-blue-600", "bg-blue-50/80");
      btn.classList.add("text-slate-500");
    }
  });

  document.querySelectorAll(".desktop-nav-btn").forEach((btn) => {
    const navKey = btn.getAttribute("data-nav");
    if (navKey === viewName) {
      btn.classList.add("bg-white", "text-blue-600", "shadow-2xs");
      btn.classList.remove("text-slate-600", "hover:text-slate-900");
    } else {
      btn.classList.remove("bg-white", "text-blue-600", "shadow-2xs");
      btn.classList.add("text-slate-600", "hover:text-slate-900");
    }
  });
}

function navigateTo(viewName, updateHash = true) {
  if (!VALID_VIEWS.includes(viewName)) viewName = "beranda";

  if (!state.currentUser && viewName !== "beranda") {
    openSsoModal();
    showToast("Masuk dengan SSO kampus terlebih dahulu untuk mengakses fitur ini.");
    return;
  }

  state.activeView = viewName;

  if (updateHash && window.location.hash !== `#${viewName}`) {
    history.pushState(null, "", `#${viewName}`);
  }

  document.querySelectorAll(".app-view").forEach((sec) => {
    sec.classList.add("hidden");
  });

  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove("hidden");
  }

  syncActiveNavStyles(viewName);

  if (viewName === "lomba") renderPosts("Lomba");
  if (viewName === "workshop") renderPosts("Workshop");
  if (viewName === "event") renderPosts("Event");
  if (viewName === "tersimpan") renderSavedView();
  if (viewName === "teman") renderFriendsView();
  if (viewName === "profil") renderLinkedInProfile(state.viewingProfileId || "u-me");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================================
// 06. RENDER KARTU LOMBA, WORKSHOP, EVENT & SMART TEAM SLOTS
// ============================================================================
function createPostCardHtml(post) {
  const isLomba = post.type === "Lomba";
  const currentUserId = state.currentUser ? state.currentUser.id : null;
  const isAlreadyJoined = Boolean(currentUserId && post.memberIds.includes(currentUserId));
  const emptySlotsCount = Math.max(0, post.maxSlots - post.memberIds.length);
  const countdown = getCountdownInfo(post);

  const typeBadgeClass =
    post.type === "Lomba"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : post.type === "Workshop"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const membersHtml = post.memberIds
    .map((mId) => {
      const member = getUserById(mId);
      if (!member) return "";
      const isMe = mId === currentUserId;
      return `
        <button
          type="button"
          onmouseenter="showHoverPopover('${escapeHtml(member.id)}', event)"
          onmouseleave="hideHoverPopover()"
          onclick="openUserProfile('${escapeHtml(member.id)}')"
          class="flex items-center gap-2 pr-2.5 pl-1 py-1 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition group">
          <img src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.name)}" class="w-6 h-6 rounded-full object-cover" />
          <span class="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
            ${escapeHtml(member.name)}${isMe ? " (Kamu)" : ""}
          </span>
        </button>
      `;
    })
    .join("");

  let emptySlotsHtml = "";
  if (isLomba && emptySlotsCount > 0) {
    for (let i = 0; i < emptySlotsCount; i++) {
      if (isAlreadyJoined) {
        emptySlotsHtml += `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-dashed border-slate-300 text-[11px] font-medium text-slate-400">
            ${escapeHtml(t("labelSlotTerbuka", "Slot Terbuka"))} (${escapeHtml(post.neededRoles[i] || "Anggota")})
          </span>
        `;
      } else {
        emptySlotsHtml += `
          <button
            type="button"
            onclick="openJoinTeamModal('${escapeHtml(post.id)}')"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-dashed border-blue-400 text-xs font-bold transition">
            <span>${escapeHtml(t("tombolGabungSlot", "+ Gabung"))}</span>
          </button>
        `;
      }
    }
  }

  let footerActionHtml = "";
  if (isLomba) {
    if (isAlreadyJoined) {
      footerActionHtml = `
        <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <span>${escapeHtml(t("statusTergabungTim", "✓ Tergabung di Tim"))}</span>
        </span>
      `;
    } else if (emptySlotsCount > 0) {
      footerActionHtml = `
        <button
          onclick="openJoinTeamModal('${escapeHtml(post.id)}')"
          class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition">
          ${escapeHtml(t("tombolAjukanGabungTim", "Ajukan Gabung Tim"))} (${emptySlotsCount} Slot)
        </button>
      `;
    } else {
      footerActionHtml = `
        <span class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
          ${escapeHtml(t("statusSlotPenuh", "Slot Tim Penuh"))}
        </span>
      `;
    }
  } else {
    footerActionHtml = `
      <button
        onclick="toggleSavePost('${escapeHtml(post.id)}')"
        class="px-4 py-2 rounded-xl ${post.saved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-900 hover:bg-slate-800 text-white"} text-xs font-bold transition">
        ${escapeHtml(post.saved ? t("statusTerdaftarTersimpan", "✓ Terdaftar & Tersimpan") : t("tombolDaftarSimpanJadwal", "Daftar / Simpan Jadwal"))}
      </button>
    `;
  }

  return `
    <article class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4">
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeClass}">
              ${escapeHtml(post.type)}
            </span>
            <span class="text-xs font-semibold text-slate-500">${escapeHtml(post.category)}</span>
          </div>
          <button
            onclick="toggleSavePost('${escapeHtml(post.id)}')"
            title="${post.saved ? "Hapus dari Tersimpan" : "Simpan & Pantau Deadline"}"
            class="p-2 rounded-xl border ${post.saved ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700"} transition">
            <svg class="w-4 h-4" fill="${post.saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </button>
        </div>

        <div>
          <h3 class="font-display font-bold text-lg text-slate-900 leading-snug">${escapeHtml(post.title)}</h3>
          <p class="text-xs font-semibold text-slate-500 mt-0.5">Oleh ${escapeHtml(post.organizer)} • ${escapeHtml(post.location)}</p>
        </div>

        <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(post.description)}</p>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="px-2.5 py-1 rounded-lg ${countdown.urgent ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold" : "bg-slate-100 text-slate-700 font-semibold"}">
            ⏰ ${escapeHtml(post.deadlineLabel)} (${escapeHtml(countdown.label)})
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold">
            🏆 ${escapeHtml(post.prize)}
          </span>
        </div>

        <div class="pt-2 border-t border-slate-100">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            ${isLomba ? `${escapeHtml(t("judulAnggotaSkuad", "Anggota Skuad"))} (${post.memberIds.length}/${post.maxSlots})` : escapeHtml(t("judulKoordinatorPembicara", "Koordinator / Pembicara"))}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${membersHtml}
            ${emptySlotsHtml}
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span class="text-xs text-slate-400 font-medium">
          ${escapeHtml(post.saved ? t("statusPengingatAktif", "🔔 Pengingat deadline aktif") : t("statusSimpanPengingat", "Simpan untuk pengingat otomatis"))}
        </span>
        ${footerActionHtml}
      </div>
    </article>
  `;
}

function resetPostFilter(type) {
  const searchInput = document.getElementById(`search-${type.toLowerCase()}`);
  const sortSelect = document.getElementById(`sort-${type.toLowerCase()}`);
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "default";
  renderPosts(type);
}

function renderPosts(type) {
  const gridId = `grid-${type.toLowerCase()}`;
  const searchInput = document.getElementById(`search-${type.toLowerCase()}`);
  const sortSelect = document.getElementById(`sort-${type.toLowerCase()}`);
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const sortMode = sortSelect ? sortSelect.value : "default";

  const filtered = state.posts.filter((p) => {
    if (p.type !== type) return false;
    if (!query) return true;
    const rolesText = (p.neededRoles || []).join(" ").toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.organizer.toLowerCase().includes(query) ||
      rolesText.includes(query)
    );
  });

  if (sortMode === "deadline") {
    filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (sortMode === "slots") {
    filtered.sort((a, b) => (b.maxSlots - b.memberIds.length) - (a.maxSlots - a.memberIds.length));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-10 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
        <p class="text-slate-600 text-sm font-medium">${escapeHtml(t("pesanPencarianKosong", "Belum ada kegiatan yang cocok dengan pencarianmu."))}</p>
        <button type="button" onclick="resetPostFilter('${escapeHtml(type)}')" class="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition">
          ${escapeHtml(t("tombolResetPencarian", "Reset Pencarian"))}
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(createPostCardHtml).join("");
}

function renderSavedView() {
  const grid = document.getElementById("grid-tersimpan");
  if (!grid) return;

  const savedPosts = state.posts.filter((p) => p.saved);
  if (savedPosts.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm">${escapeHtml(t("pesanTersimpanKosong", "Belum ada lomba atau kegiatan yang disimpan. Klik ikon bookmark pada kartu kegiatan untuk memantau deadline-nya di sini."))}</div>`;
    return;
  }

  grid.innerHTML = savedPosts.map(createPostCardHtml).join("");
}

async function toggleSavePost(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const res = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/bookmark`, "POST");
  if (!res) {
    post.saved = !post.saved;
    saveLocalFallback();
  }
  const updated = state.posts.find((p) => p.id === postId);
  refreshAllUI();
  showToast(updated && updated.saved ? `"${post.title}" disimpan ke pengingat deadline.` : `"${post.title}" dihapus dari tersimpan.`);
}

// ============================================================================
// 07. TAMBAH INFO BARU & GABUNG TIM LOMBA
// ============================================================================
async function submitNewPost(event) {
  event.preventDefault();
  if (!state.currentUser || !state.currentUser.verified) {
    openSsoModal();
    return;
  }

  const payload = {
    type: document.getElementById("new-post-type").value,
    category: document.getElementById("new-post-category").value.trim(),
    title: document.getElementById("new-post-title").value.trim(),
    organizer: document.getElementById("new-post-organizer").value.trim(),
    deadline: document.getElementById("new-post-deadline").value,
    location: document.getElementById("new-post-location").value.trim(),
    maxSlots: parseInt(document.getElementById("new-post-slots").value, 10) || 4,
    prize: document.getElementById("new-post-prize").value.trim(),
    roles: document.getElementById("new-post-roles").value.trim(),
    description: document.getElementById("new-post-desc").value.trim()
  };

  const res = await apiRequest("/api/posts", "POST", payload);
  if (res && res.error) return;

  if (!res) {
    const dt = new Date(payload.deadline);
    const deadlineLabel = isNaN(dt.getTime())
      ? payload.deadline
      : dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
        " • " +
        dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
        " WIB";

    state.posts.unshift({
      id: "post-" + Date.now(),
      type: payload.type,
      category: payload.category,
      title: payload.title,
      organizer: payload.organizer,
      deadline: payload.deadline,
      deadlineLabel,
      location: payload.location,
      prize: payload.prize,
      description: payload.description,
      maxSlots: payload.type === "Lomba" ? payload.maxSlots : 1,
      memberIds: [state.currentUser.id],
      neededRoles: payload.roles ? payload.roles.split(",").map((r) => r.trim()).filter(Boolean) : ["Anggota Tim"],
      saved: true
    });
    saveLocalFallback();
  }

  closeModal("modal-add-info");
  event.target.reset();
  refreshAllUI();
  navigateTo(payload.type.toLowerCase());
  showToast(`${payload.type} "${payload.title}" berhasil dipublikasikan!`);
}

function openJoinTeamModal(postId) {
  if (!state.currentUser) {
    openSsoModal();
    return;
  }
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  if (post.memberIds.includes(state.currentUser.id)) {
    showToast("Kamu sudah tergabung di dalam tim ini.");
    return;
  }

  document.getElementById("join-post-id").value = post.id;
  document.getElementById("join-modal-title").textContent = post.title;
  const roleSelect = document.getElementById("join-role-select");
  roleSelect.innerHTML = post.neededRoles
    .map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`)
    .join("");

  document.getElementById("modal-join-team").classList.remove("hidden");
}

async function submitJoinTeam(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const postId = document.getElementById("join-post-id").value;
  const role = document.getElementById("join-role-select").value;
  const pitch = document.getElementById("join-pitch-input").value.trim();
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const res = await apiRequest(`/api/posts/${encodeURIComponent(postId)}/join`, "POST", { role, pitch });
  if (res && res.error) return;

  if (!res) {
    if (!post.memberIds.includes(state.currentUser.id)) {
      post.memberIds.push(state.currentUser.id);
      post.saved = true;
    }
    saveLocalFallback();
  }

  closeModal("modal-join-team");
  document.getElementById("join-pitch-input").value = "";
  refreshAllUI();
  showToast(`Berhasil bergabung ke tim "${post.title}"!`);
}

// ============================================================================
// 08. HOVER MINI-PROFILE POPOVER & PROFIL LENGKAP ALA LINKEDIN
// ============================================================================
function showHoverPopover(userId, event) {
  clearTimeout(hoverHideTimer);
  const user = getUserById(userId);
  const popover = document.getElementById("hover-profile-popover");
  if (!user || !popover) return;

  const isMe = state.currentUser && user.id === state.currentUser.id;
  const topSkills = (user.skills || [])
    .slice(0, 3)
    .map((s) => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">${escapeHtml(s.name)}</span>`)
    .join("");

  let friendBtnHtml = "";
  if (!isMe) {
    if (user.friendStatus === "connected") {
      friendBtnHtml = `<span class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">✓ Teman</span>`;
    } else if (user.friendStatus === "pending") {
      friendBtnHtml = `<span class="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold">Menunggu</span>`;
    } else {
      friendBtnHtml = `<button onclick="sendFriendRequest('${escapeHtml(user.id)}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition">+ Tambah Teman</button>`;
    }
  }

  popover.innerHTML = `
    <div class="flex items-start gap-3">
      <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" class="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
      <div class="min-w-0">
        <div class="flex items-center gap-1">
          <h4 class="font-bold text-sm text-slate-900 truncate">${escapeHtml(user.name)}</h4>
          ${user.verified ? `<span class="text-blue-600 text-xs font-bold" title="SSO Terverifikasi">✓</span>` : ""}
        </div>
        <p class="text-[11px] font-semibold text-blue-600 truncate">${escapeHtml(user.major || "")}</p>
        <p class="text-xs text-slate-600 line-clamp-2 mt-1">${escapeHtml(user.headline || "")}</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-1.5 mt-3">${topSkills}</div>
    <div class="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-100">
      ${friendBtnHtml || `<span class="text-[11px] text-slate-400 font-semibold">Profil Anda</span>`}
      <button onclick="openUserProfile('${escapeHtml(user.id)}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition">
        Lihat Profil →
      </button>
    </div>
  `;

  const rect = event.currentTarget.getBoundingClientRect();
  const popWidth = 288;
  let left = rect.left;
  if (left + popWidth > window.innerWidth - 16) {
    left = window.innerWidth - popWidth - 16;
  }
  if (left < 16) left = 16;

  let top = rect.bottom + 8;
  if (top + 210 > window.innerHeight) {
    top = Math.max(16, rect.top - 210);
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.classList.remove("hidden");
}

function keepHoverPopover() {
  clearTimeout(hoverHideTimer);
}

function hideHoverPopover() {
  hoverHideTimer = setTimeout(() => {
    const popover = document.getElementById("hover-profile-popover");
    if (popover) popover.classList.add("hidden");
  }, 180);
}

function openMyProfile() {
  if (!state.currentUser) {
    openSsoModal();
    return;
  }
  state.viewingProfileId = state.currentUser.id;
  navigateTo("profil");
}

function openUserProfile(userId) {
  hideHoverPopover();
  state.viewingProfileId = userId;
  navigateTo("profil");
}

function renderLinkedInProfile(userId) {
  const container = document.getElementById("linkedin-profile-container");
  if (!container) return;

  const user = getUserById(userId) || state.currentUser;
  if (!user) return;

  const isMe = state.currentUser && user.id === state.currentUser.id;
  const userTeams = state.posts.filter((p) => p.memberIds.includes(user.id));

  let headerActionsHtml = "";
  if (isMe) {
    headerActionsHtml = `
      <div class="flex flex-wrap gap-2">
        <label class="cursor-pointer px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition">
          ${escapeHtml(t("tombolGantiFoto", "📷 Ganti Foto Profil"))}
          <input type="file" accept="image/*" onchange="handleProfilePhotoUpload(event)" class="hidden" />
        </label>
        <button onclick="openEditProfileModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition">
          ${escapeHtml(t("tombolEditProfil", "✎ Edit Profil LinkedIn"))}
        </button>
      </div>
    `;
  } else {
    let friendActionBtn = "";
    if (user.friendStatus === "connected") {
      friendActionBtn = `<button onclick="openInviteFriendModal('${escapeHtml(user.id)}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition">+ Ajak Tim Lomba</button>`;
    } else if (user.friendStatus === "pending") {
      friendActionBtn = `<span class="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">⏳ Permintaan Terkirim</span>`;
    } else {
      friendActionBtn = `<button onclick="sendFriendRequest('${escapeHtml(user.id)}')" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition">+ Tambah Teman</button>`;
    }

    headerActionsHtml = `
      <div class="flex flex-wrap gap-2">
        <button onclick="openMyProfile()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
          ← Profil Saya
        </button>
        ${friendActionBtn}
      </div>
    `;
  }

  const skillsHtml = (user.skills || [])
    .map(
      (sk, idx) => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
        <div>
          <span class="font-bold text-sm text-slate-800">${escapeHtml(sk.name)}</span>
          <span class="block text-xs text-slate-500">${sk.endorsements} ${escapeHtml(t("labelDukunganRekan", "dukungan rekan kampus"))}</span>
        </div>
        <button
          onclick="toggleEndorseSkill('${escapeHtml(user.id)}', ${idx})"
          class="px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            sk.endorsedByMe
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
          }">
          ${escapeHtml(sk.endorsedByMe ? t("tombolDidukung", "✓ Didukung") : t("tombolEndorse", "+ Endorse"))}
        </button>
      </div>
    `
    )
    .join("");

  const suggestionsHtml = state.students
    .filter((s) => s.id !== user.id)
    .slice(0, 4)
    .map(
      (s) => `
      <div class="flex items-center justify-between gap-2.5 py-2.5 border-b border-slate-100 last:border-none">
        <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="flex items-center gap-2.5 text-left min-w-0">
          <img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name)}" class="w-10 h-10 rounded-full object-cover shrink-0" />
          <div class="min-w-0">
            <div class="font-bold text-xs text-slate-900 truncate hover:text-blue-600">${escapeHtml(s.name)}</div>
            <div class="text-[11px] text-slate-500 truncate">${escapeHtml(s.major)}</div>
          </div>
        </button>
        <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold shrink-0">
          Profil
        </button>
      </div>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-5">
        <div class="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div class="h-32 sm:h-40 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500"></div>
          <div class="px-6 pb-6">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" class="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white" />
              ${headerActionsHtml}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-display font-bold text-2xl text-slate-900">${escapeHtml(user.name)}</h2>
                ${
                  user.verified
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">${escapeHtml(t("badgeTerverifikasiSso", "✓ Mahasiswa Terverifikasi SSO"))}</span>`
                    : ""
                }
              </div>
              <p class="text-sm sm:text-base font-semibold text-slate-700">${escapeHtml(user.headline)}</p>
              <p class="text-xs sm:text-sm text-slate-500">${escapeHtml(user.faculty)} • ${escapeHtml(user.major)} • Depok, Jawa Barat</p>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(t("judulBagianTentang", "Tentang"))}</h3>
          <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(user.bio)}</p>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(t("judulBagianTimAktif", "Tim Lomba & Kegiatan Aktif"))} (${userTeams.length})</h3>
          ${
            userTeams.length === 0
              ? `<p class="text-sm text-slate-500">${escapeHtml(t("pesanBelumAdaTim", "Belum tergabung dalam tim aktif."))}</p>`
              : userTeams
                  .map(
                    (t) => `
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div>
                        <span class="text-[11px] font-bold uppercase text-blue-600">${escapeHtml(t.type)}</span>
                        <div class="font-bold text-sm text-slate-900">${escapeHtml(t.title)}</div>
                        <div class="text-xs text-slate-500">${escapeHtml(t.organizer)}</div>
                      </div>
                      <button onclick="navigateTo('${escapeHtml(t.type.toLowerCase())}')" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-blue-400">
                        Buka
                      </button>
                    </div>
                  `
                  )
                  .join("")
          }
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(t("judulBagianPengalaman", "Pengalaman & Proyek"))}</h3>
          ${(user.experiences || [])
            .map(
              (exp) => `
              <div class="border-l-2 border-blue-500 pl-4 space-y-1">
                <div class="font-bold text-sm text-slate-900">${escapeHtml(exp.role)}</div>
                <div class="text-xs font-semibold text-blue-600">${escapeHtml(exp.org)} • ${escapeHtml(exp.period)}</div>
                <p class="text-xs sm:text-sm text-slate-600">${escapeHtml(exp.desc)}</p>
              </div>
            `
            )
            .join("")}
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(t("judulBagianKeahlian", "Keahlian & Endorsement"))}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${skillsHtml}</div>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(t("judulBagianPrestasi", "Prestasi & Sertifikasi"))}</h3>
          <ul class="space-y-2">
            ${(user.achievements || [])
              .map(
                (ach) => `
                <li class="flex items-center gap-2.5 text-sm text-slate-700">
                  <span class="text-amber-500">🏆</span>
                  <span>${escapeHtml(ach)}</span>
                </li>
              `
              )
              .join("")}
          </ul>
        </div>
      </div>

      <aside class="space-y-5">
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h4 class="font-display font-bold text-base text-slate-900 mb-3">${escapeHtml(t("judulRekomendasiSidebar", "Mahasiswa yang Mungkin Kamu Kenal"))}</h4>
          <div>${suggestionsHtml}</div>
        </div>
      </aside>
    </div>
  `;
}

function handleProfilePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !state.currentUser) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const dataUrl = e.target.result;
    const res = await apiRequest("/api/profile/me", "PUT", { avatar: dataUrl });
    if (!res) {
      state.currentUser.avatar = dataUrl;
      saveLocalFallback();
    }
    refreshAllUI();
    showToast("Foto profil berhasil diperbarui!");
  };
  reader.readAsDataURL(file);
}

function openEditProfileModal() {
  if (!state.currentUser) return;
  document.getElementById("edit-prof-name").value = state.currentUser.name;
  document.getElementById("edit-prof-headline").value = state.currentUser.headline;
  document.getElementById("edit-prof-faculty").value = state.currentUser.faculty;
  document.getElementById("edit-prof-major").value = state.currentUser.major;
  document.getElementById("edit-prof-bio").value = state.currentUser.bio;
  document.getElementById("edit-prof-new-skill").value = "";
  document.getElementById("modal-edit-profile").classList.remove("hidden");
}

async function submitEditProfile(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const payload = {
    name: document.getElementById("edit-prof-name").value.trim(),
    headline: document.getElementById("edit-prof-headline").value.trim(),
    faculty: document.getElementById("edit-prof-faculty").value.trim(),
    major: document.getElementById("edit-prof-major").value.trim(),
    bio: document.getElementById("edit-prof-bio").value.trim(),
    newSkill: document.getElementById("edit-prof-new-skill").value.trim()
  };

  const res = await apiRequest("/api/profile/me", "PUT", payload);
  if (!res) {
    state.currentUser.name = payload.name;
    state.currentUser.headline = payload.headline;
    state.currentUser.faculty = payload.faculty;
    state.currentUser.major = payload.major;
    state.currentUser.bio = payload.bio;
    if (payload.newSkill) {
      state.currentUser.skills.push({ name: payload.newSkill, endorsements: 1, endorsedByMe: true });
    }
    saveLocalFallback();
  }

  closeModal("modal-edit-profile");
  refreshAllUI();
  showToast("Profil LinkedIn berhasil diperbarui.");
}

async function toggleEndorseSkill(userId, skillIndex) {
  const res = await apiRequest(`/api/profile/${encodeURIComponent(userId)}/endorse`, "POST", { skillIndex });
  if (!res) {
    const user = getUserById(userId);
    if (!user || !user.skills || !user.skills[skillIndex]) return;
    const sk = user.skills[skillIndex];
    if (sk.endorsedByMe) {
      sk.endorsedByMe = false;
      sk.endorsements = Math.max(0, sk.endorsements - 1);
    } else {
      sk.endorsedByMe = true;
      sk.endorsements += 1;
    }
    saveLocalFallback();
  }
  renderLinkedInProfile(userId);
}

// ============================================================================
// 09. ADD FRIENDS, MATCHMAKING SCORE & AJAK TIM LOMBA
// ============================================================================
function renderFriendsView() {
  const query = (document.getElementById("search-teman")?.value || "").trim().toLowerCase();
  const reqListEl = document.getElementById("teman-requests-list");
  const reqCountEl = document.getElementById("teman-req-count");
  const connectedListEl = document.getElementById("teman-connected-list");
  const connectedCountEl = document.getElementById("teman-connected-count");
  const discoverListEl = document.getElementById("teman-discover-list");

  if (!reqListEl || !connectedListEl || !discoverListEl) return;

  reqCountEl.textContent = state.friendRequests.length;
  if (state.friendRequests.length === 0) {
    reqListEl.innerHTML = `<div class="col-span-full p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">${escapeHtml(t("pesanTidakAdaPermintaanTeman", "Tidak ada permintaan pertemanan baru saat ini."))}</div>`;
  } else {
    reqListEl.innerHTML = state.friendRequests
      .map((req) => {
        const sender = getUserById(req.fromUserId);
        if (!sender) return "";
        return `
          <div class="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${escapeHtml(sender.avatar)}" alt="${escapeHtml(sender.name)}" class="w-12 h-12 rounded-full object-cover shrink-0" />
              <div class="min-w-0">
                <button onclick="openUserProfile('${escapeHtml(sender.id)}')" class="font-bold text-sm text-slate-900 hover:text-blue-600 truncate block">${escapeHtml(sender.name)}</button>
                <p class="text-xs text-slate-500 truncate">${escapeHtml(sender.major)}</p>
                <p class="text-xs text-slate-600 mt-1 line-clamp-1">"${escapeHtml(req.note)}"</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="acceptFriendRequest('${escapeHtml(req.id)}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Terima</button>
              <button onclick="ignoreFriendRequest('${escapeHtml(req.id)}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold">Abaikan</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const matchesQuery = (s) => {
    if (!query) return true;
    const skillText = (s.skills || []).map((sk) => sk.name).join(" ").toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.faculty.toLowerCase().includes(query) ||
      s.major.toLowerCase().includes(query) ||
      skillText.includes(query)
    );
  };

  const connected = state.students.filter((s) => s.friendStatus === "connected" && matchesQuery(s));
  connectedCountEl.textContent = connected.length;
  connectedListEl.innerHTML =
    connected.length === 0
      ? `<div class="col-span-full p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">${escapeHtml(t("pesanBelumAdaTemanCocok", "Belum ada teman terhubung yang cocok."))}</div>`
      : connected
          .map(
            (s) => `
            <div class="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-4">
              <div class="flex items-start gap-3">
                <img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name)}" class="w-12 h-12 rounded-full object-cover shrink-0" />
                <div class="min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="font-bold text-sm text-slate-900 hover:text-blue-600 truncate">${escapeHtml(s.name)}</button>
                    <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold shrink-0">${s.matchScore || 88}% Cocok</span>
                  </div>
                  <p class="text-xs font-semibold text-blue-600 truncate">${escapeHtml(s.major)}</p>
                  <p class="text-xs text-slate-500 line-clamp-2 mt-1">${escapeHtml(s.headline)}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button onclick="openInviteFriendModal('${escapeHtml(s.id)}')" class="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition">
                  + Ajak Tim Lomba
                </button>
                <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
                  Profil
                </button>
              </div>
            </div>
          `
          )
          .join("");

  const discover = state.students.filter((s) => s.friendStatus !== "connected" && matchesQuery(s));
  discoverListEl.innerHTML = discover
    .map(
      (s) => `
      <div class="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-4">
        <div class="flex items-start gap-3">
          <img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name)}" class="w-12 h-12 rounded-full object-cover shrink-0" />
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1">
              <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="font-bold text-sm text-slate-900 hover:text-blue-600 truncate">${escapeHtml(s.name)}</button>
              <span class="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold shrink-0">${s.matchScore || 90}% Cocok</span>
            </div>
            <p class="text-xs font-semibold text-slate-500 truncate">${escapeHtml(s.faculty)}</p>
            <p class="text-xs text-slate-600 line-clamp-2 mt-1">${escapeHtml(s.headline)}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          ${
            s.friendStatus === "pending"
              ? `<span class="flex-1 text-center py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold">⏳ Menunggu Konfirmasi</span>`
              : `<button onclick="sendFriendRequest('${escapeHtml(s.id)}')" class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition">+ Tambah Teman</button>`
          }
          <button onclick="openUserProfile('${escapeHtml(s.id)}')" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
            Profil
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

async function sendFriendRequest(userId) {
  if (!state.currentUser) {
    openSsoModal();
    return;
  }
  const student = state.students.find((s) => s.id === userId);
  if (!student) return;

  const res = await apiRequest("/api/friends/request", "POST", { userId });
  if (!res) {
    student.friendStatus = "pending";
    saveLocalFallback();
  }
  hideHoverPopover();
  refreshAllUI();
  showToast(`Permintaan pertemanan dikirim ke ${student.name}.`);
}

async function acceptFriendRequest(reqId) {
  const req = state.friendRequests.find((r) => r.id === reqId);
  const sender = req ? getUserById(req.fromUserId) : null;

  const res = await apiRequest("/api/friends/respond", "POST", { reqId, action: "accept" });
  if (!res && req) {
    if (sender) sender.friendStatus = "connected";
    state.friendRequests = state.friendRequests.filter((r) => r.id !== reqId);
    saveLocalFallback();
  }
  refreshAllUI();
  showToast(`Kamu sekarang berteman dengan ${sender ? sender.name : "rekan baru"}!`);
}

async function ignoreFriendRequest(reqId) {
  const res = await apiRequest("/api/friends/respond", "POST", { reqId, action: "ignore" });
  if (!res) {
    state.friendRequests = state.friendRequests.filter((r) => r.id !== reqId);
    saveLocalFallback();
  }
  refreshAllUI();
}

function openInviteFriendModal(userId) {
  const friend = getUserById(userId);
  if (!friend) return;
  const availableLomba = state.posts.filter((p) => p.type === "Lomba" && p.memberIds.length < p.maxSlots);

  if (availableLomba.length === 0) {
    showToast("Belum ada tim lomba dengan slot kosong. Buat info lomba baru terlebih dahulu.");
    return;
  }

  document.getElementById("invite-target-user-id").value = friend.id;
  document.getElementById("invite-friend-title").textContent = `Ajak ${friend.name} ke Tim Lomba`;
  document.getElementById("invite-post-select").innerHTML = availableLomba
    .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)} (Sisa ${p.maxSlots - p.memberIds.length} slot)</option>`)
    .join("");

  document.getElementById("modal-invite-friend").classList.remove("hidden");
}

async function submitInviteFriend(event) {
  event.preventDefault();
  const userId = document.getElementById("invite-target-user-id").value;
  const postId = document.getElementById("invite-post-select").value;
  const friend = getUserById(userId);
  const post = state.posts.find((p) => p.id === postId);

  const res = await apiRequest("/api/teams/invite", "POST", { userId, postId });
  if (res && res.error) return;

  if (!res && friend && post && !post.memberIds.includes(friend.id)) {
    post.memberIds.push(friend.id);
    saveLocalFallback();
  }

  closeModal("modal-invite-friend");
  refreshAllUI();
  showToast(`${friend ? friend.name : "Teman"} berhasil ditambahkan ke tim "${post ? post.title : ""}"!`);
}

// ============================================================================
// 10. PUSAT NOTIFIKASI TERPADU (Pelamar Tim, Deadline Tersimpan, Pertemanan)
// ============================================================================
function openNotificationsModal(initialTab = "all") {
  state.activeNotifTab = initialTab;
  document.getElementById("modal-notifications").classList.remove("hidden");
  switchNotifTab(initialTab);
}

function switchNotifTab(tab) {
  state.activeNotifTab = tab;
  document.querySelectorAll(".notif-tab-btn").forEach((btn) => {
    const key = btn.getAttribute("data-notif-tab");
    if (key === tab) {
      btn.className = "notif-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white";
    } else {
      btn.className = "notif-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  });
  renderNotificationsContent();
}

function renderNotificationsContent() {
  const container = document.getElementById("notifications-content");
  if (!container) return;

  const tab = state.activeNotifTab;
  const pendingApplicants = state.applicants.filter((a) => a.status === "pending");
  const savedDeadlines = state.posts
    .filter((p) => p.saved)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  let html = "";

  if (tab === "all" || tab === "applicants") {
    html += `
      <div class="space-y-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-blue-600">${escapeHtml(t("judulNotifPelamar", "Pelamar Tim Masuk"))} (${pendingApplicants.length})</h4>
        ${
          pendingApplicants.length === 0
            ? `<div class="p-4 rounded-2xl bg-slate-50 text-xs text-slate-500">${escapeHtml(t("pesanNotifPelamarKosong", "Belum ada pelamar baru yang menunggu persetujuan."))}</div>`
            : pendingApplicants
                .map((app) => {
                  const applicant = getUserById(app.applicantId);
                  const post = state.posts.find((p) => p.id === app.postId);
                  if (!applicant || !post) return "";
                  return `
                    <div class="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <img src="${escapeHtml(applicant.avatar)}" alt="${escapeHtml(applicant.name)}" class="w-11 h-11 rounded-full object-cover" />
                          <div>
                            <button onclick="closeModal('modal-notifications'); openUserProfile('${escapeHtml(applicant.id)}')" class="font-bold text-sm text-slate-900 hover:text-blue-600">
                              ${escapeHtml(applicant.name)}
                            </button>
                            <p class="text-xs text-slate-500">${escapeHtml(applicant.major)} • ${escapeHtml(app.timeAgo)}</p>
                            <p class="text-xs font-bold text-blue-700 mt-0.5">Melamar peran: ${escapeHtml(app.roleApplied)} — ${escapeHtml(post.title)}</p>
                          </div>
                        </div>
                      </div>
                      <p class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80">"${escapeHtml(app.pitch)}"</p>
                      <div class="flex justify-end gap-2">
                        <button onclick="handleApplicantDecision('${escapeHtml(app.id)}', 'rejected')" class="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold">
                          Tolak
                        </button>
                        <button onclick="handleApplicantDecision('${escapeHtml(app.id)}', 'accepted')" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm">
                          ${escapeHtml(t("tombolTerimaPelamar", "✓ Terima ke Tim"))}
                        </button>
                      </div>
                    </div>
                  `;
                })
                .join("")
        }
      </div>
    `;
  }

  if (tab === "all" || tab === "deadlines") {
    html += `
      <div class="space-y-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-600">${escapeHtml(t("judulNotifDeadline", "Pengingat Deadline Tersimpan"))} (${savedDeadlines.length})</h4>
        ${
          savedDeadlines.length === 0
            ? `<div class="p-4 rounded-2xl bg-slate-50 text-xs text-slate-500">${escapeHtml(t("pesanNotifDeadlineKosong", "Belum ada kegiatan tersimpan untuk dipantau tenggat waktunya."))}</div>`
            : savedDeadlines
                .map((p) => {
                  const cd = getCountdownInfo(p);
                  return `
                    <div class="p-3.5 rounded-2xl bg-white border ${cd.urgent ? "border-rose-200 bg-rose-50/30" : "border-slate-200"} flex items-center justify-between gap-3">
                      <div>
                        <span class="text-[11px] font-bold uppercase text-slate-400">${escapeHtml(p.type)} • ${escapeHtml(p.deadlineLabel)}</span>
                        <div class="font-bold text-sm text-slate-900">${escapeHtml(p.title)}</div>
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs font-bold shrink-0 ${cd.urgent ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}">
                        ⏰ ${escapeHtml(cd.label)}
                      </span>
                    </div>
                  `;
                })
                .join("")
        }
      </div>
    `;
  }

  if (tab === "all" || tab === "friends") {
    html += `
      <div class="space-y-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-600">${escapeHtml(t("judulNotifPertemanan", "Permintaan Pertemanan"))} (${state.friendRequests.length})</h4>
        ${
          state.friendRequests.length === 0
            ? `<div class="p-4 rounded-2xl bg-slate-50 text-xs text-slate-500">${escapeHtml(t("pesanNotifPertemananKosong", "Semua permintaan pertemanan sudah ditinjau."))}</div>`
            : state.friendRequests
                .map((req) => {
                  const sender = getUserById(req.fromUserId);
                  if (!sender) return "";
                  return `
                    <div class="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <img src="${escapeHtml(sender.avatar)}" alt="${escapeHtml(sender.name)}" class="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div class="font-bold text-sm text-slate-900">${escapeHtml(sender.name)}</div>
                          <div class="text-xs text-slate-500">${escapeHtml(sender.major)} • ${escapeHtml(req.timeAgo)}</div>
                        </div>
                      </div>
                      <div class="flex gap-1.5">
                        <button onclick="acceptFriendRequest('${escapeHtml(req.id)}'); renderNotificationsContent();" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Terima</button>
                        <button onclick="ignoreFriendRequest('${escapeHtml(req.id)}'); renderNotificationsContent();" class="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">Abaikan</button>
                      </div>
                    </div>
                  `;
                })
                .join("")
        }
      </div>
    `;
  }

  container.innerHTML = html;
}

async function handleApplicantDecision(appId, decision) {
  const app = state.applicants.find((a) => a.id === appId);
  if (!app) return;
  const applicant = getUserById(app.applicantId);

  const res = await apiRequest(`/api/applicants/${encodeURIComponent(appId)}/decide`, "POST", { decision });
  if (!res) {
    app.status = decision;
    if (decision === "accepted") {
      const post = state.posts.find((p) => p.id === app.postId);
      if (post && !post.memberIds.includes(app.applicantId)) {
        post.memberIds.push(app.applicantId);
      }
    }
    saveLocalFallback();
  }

  showToast(
    decision === "accepted"
      ? `${applicant ? applicant.name : "Pelamar"} diterima masuk ke tim!`
      : "Lamaran anggota tim ditolak."
  );
  refreshAllUI();
  renderNotificationsContent();
}


// ============================================================================
// 11. PEMBARUAN BADGE & INISIALISASI APLIKASI
// ============================================================================
function updateBadgesAndStats() {
  const pendingApplicantsCount = state.applicants.filter((a) => a.status === "pending").length;
  const savedPostsCount = state.posts.filter((p) => p.saved).length;
  const friendReqCount = state.friendRequests.length;
  const totalNotifCount = pendingApplicantsCount + savedPostsCount + friendReqCount;

  const notifBadge = document.getElementById("notif-badge");
  if (notifBadge) {
    notifBadge.textContent = totalNotifCount;
    notifBadge.classList.toggle("hidden", totalNotifCount === 0);
  }

  ["badge-teman", "desktop-badge-teman"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = friendReqCount;
      el.classList.toggle("hidden", friendReqCount === 0);
    }
  });

  ["badge-tersimpan", "desktop-badge-tersimpan"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = savedPostsCount;
      el.classList.toggle("hidden", savedPostsCount === 0);
    }
  });

  const statTotalPosts = document.getElementById("stat-total-posts");
  if (statTotalPosts) {
    statTotalPosts.textContent = state.posts.length;
  }
}

function refreshAllUI() {
  renderTopAuthArea();
  updateBadgesAndStats();
  syncActiveNavStyles(state.activeView);

  if (state.activeView === "lomba") renderPosts("Lomba");
  if (state.activeView === "workshop") renderPosts("Workshop");
  if (state.activeView === "event") renderPosts("Event");
  if (state.activeView === "tersimpan") renderSavedView();
  if (state.activeView === "teman") renderFriendsView();
  if (state.activeView === "profil") renderLinkedInProfile(state.viewingProfileId || "u-me");
}

window.addEventListener("hashchange", () => {
  const hashView = window.location.hash.replace("#", "").trim().toLowerCase();
  if (hashView && VALID_VIEWS.includes(hashView) && hashView !== state.activeView) {
    navigateTo(hashView, false);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setupAccessibleModals();
  startHeroWordRoll();
  bootstrapApplication();
});
