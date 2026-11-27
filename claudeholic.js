// Untuk pengendali ClaudeHolic Page

function escapeHtmlSafe(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showCreatorToast(message) {
  const toast = document.getElementById("claudeholic-toast");
  const msgEl = document.getElementById("claudeholic-toast-msg");
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.__creatorToastTimer);
  window.__creatorToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

function renderCreatorsGrid() {
  const grid = document.getElementById("claudeholic-creators-grid");
  const creatorsList = window.CLAUDEHOLIC_CREATORS || (typeof CLAUDEHOLIC_CREATORS !== "undefined" ? CLAUDEHOLIC_CREATORS : []);
  if (!grid || !creatorsList.length) return;

  grid.innerHTML = creatorsList.map(
    (creator) => `
      <article class="creator-card rounded-3xl bg-gradient-to-b from-slate-800/85 to-slate-950/95 border border-white/15 p-5 sm:p-6 flex flex-col items-center justify-between text-center">
        <div class="w-full">
          <div class="w-full aspect-[4/4.2] rounded-2xl p-0.5 bg-gradient-to-br from-sky-400 to-amber-300 mb-4 overflow-hidden shadow-lg">
            <img
              src="${escapeHtmlSafe(creator.photo)}"
              onerror="this.onerror=null;this.src='${escapeHtmlSafe(creator.fallback)}';"
              alt="Foto ${escapeHtmlSafe(creator.name)}"
              loading="lazy"
              class="w-full h-full object-cover object-top rounded-[14px]" />
          </div>
          <h3 class="font-display font-bold text-xl sm:text-2xl text-white mb-1.5">
            ${escapeHtmlSafe(creator.name)}
          </h3>
          <span class="inline-block px-3.5 py-1 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-300 text-xs font-bold mb-5">
            ${escapeHtmlSafe(creator.role)}
          </span>
        </div>

        <a
          href="${escapeHtmlSafe(creator.instagramUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-slate-100 hover:text-white text-xs sm:text-sm font-bold border border-white/10 transition">
          <span aria-hidden="true">📷</span>
          <span class="truncate">${escapeHtmlSafe(creator.instagram)}</span>
        </a>
      </article>
    `
  ).join("");

  // Efek sorotan cahaya mengikuti posisi kursor pada tiap kartu kreator
  grid.querySelectorAll(".creator-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
}

function openFeedbackModal() {
  const modal = document.getElementById("modal-feedback");
  const extLink = document.getElementById("external-form-link");
  if (extLink && typeof SINFO_CONFIG !== "undefined" && SINFO_CONFIG.saranFormUrl && !SINFO_CONFIG.saranFormUrl.includes("LINK-GOOGLE-FORM-ANDA")) {
    extLink.href = SINFO_CONFIG.saranFormUrl;
    extLink.classList.remove("hidden");
  }
  if (modal) modal.classList.remove("hidden");
}

function closeFeedbackModal() {
  const modal = document.getElementById("modal-feedback");
  if (modal) modal.classList.add("hidden");
}

function submitFeedbackForm(event) {
  event.preventDefault();
  const name = document.getElementById("fb-name")?.value.trim() || "Mahasiswa";
  const message = document.getElementById("fb-message")?.value.trim();
  if (!message) return;

  try {
    const existing = JSON.parse(localStorage.getItem("sinfo_feedback_list") || "[]");
    existing.unshift({ name, message, createdAt: new Date().toISOString() });
    localStorage.setItem("sinfo_feedback_list", JSON.stringify(existing));
  } catch (err) {
    console.warn("Gagal menyimpan feedback lokal:", err);
  }

  event.target.reset();
  closeFeedbackModal();
  showCreatorToast(`Terima kasih ${name}, saranmu sudah dicatat tim ClaudeHolic!`);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCreatorsGrid();

  const modal = document.getElementById("modal-feedback");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeFeedbackModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFeedbackModal();
  });
});
