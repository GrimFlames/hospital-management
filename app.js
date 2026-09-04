// LifeLine (LHMS) — Hospital Management & Clinical Suite (v2.0)
// Standard: Antigravity × gstack Enterprise Software Factory

let currentUser = null;
let patients = [];
let masterScans = [];
let masterMedicines = [];
let masterDoctors = [];

let activeDocPatient = null;
let activePharmaPatient = null;
let activeRadioPatient = null;
let currentDocMeds = [];
let currentDocScans = [];

let selectedPharmaPayMode = "Cash";
let selectedRadioPayMode = "Cash";

// Initialize Lucide Icons
function refreshIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Utility: Format Date Time
function getFormattedDateTime() {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Anime Character Avatar Assets inspired by user reference image
const femaleAnimeAvatars = [
  "/assets/avatars/female_doctor_1.png",
  "/assets/avatars/female_doctor_2.png",
  "/assets/avatars/female_doctor_3.png",
  "/assets/avatars/anime_female_head_1.png"
];

const maleAnimeAvatars = [
  "/assets/avatars/male_doctor_1.png",
  "/assets/avatars/male_doctor_2.png",
  "/assets/avatars/anime_male_head_1.png"
];

function getClientAnimatedAvatar(name, gender) {
  const seed = (name || 'Staff').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  if (gender === 'Female') {
    return femaleAnimeAvatars[positiveHash % femaleAnimeAvatars.length];
  } else if (gender === 'Male') {
    return maleAnimeAvatars[positiveHash % maleAnimeAvatars.length];
  } else {
    const all = [...femaleAnimeAvatars, ...maleAnimeAvatars];
    return all[positiveHash % all.length];
  }
}

// Modern Floating Toast Notification System
function showToast(title, message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) {
    alert(`${title}: ${message}`);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;

  const iconName = type === "success" ? "check-circle-2" : type === "error" ? "alert-triangle" : "info";

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// Safety helper to fetch current active visit of a patient
function getCurrentVisit(p) {
  if (!p || !p.visits || p.visits.length === 0) {
    if (p) {
      p.visits = [{
        date: getFormattedDateTime(),
        examDate: "",
        vitals: { temp: 98.6, weight: 70, bp: "120/80", pulse: 72 },
        symptoms: "",
        prevHistory: "",
        familyHistory: "",
        physicalExam: "",
        diagnosis: "",
        medicines: [],
        reports: [],
        status: "WAITING_FOR_DOCTOR",
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        consultationPaymentMode: "Cash",
        needsPharmacy: false,
        pharmacyDispensed: false,
        medicinesBillAmount: 0,
        medicinesBillPaid: false,
        needsRadiology: false,
        radiologyCompleted: false,
        radiologyBillAmount: 0,
        radiologyBillPaid: false
      }];
    }
  }
  return p.visits[p.visits.length - 1];
}

// =========================================================================
// 1. AUTHENTICATION & ROLE MANAGEMENT
// =========================================================================

function setupAuth() {
  const overlay = document.getElementById("auth-modal-overlay");
  const mainApp = document.getElementById("main-app");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("auth-login-form");
  const formRegister = document.getElementById("auth-register-form");
  const loginErr = document.getElementById("login-error-msg");
  const regErr = document.getElementById("register-error-msg");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabLogin.style.background = "#fff";
    tabLogin.style.color = "var(--primary-purple)";
    tabRegister.classList.remove("active");
    tabRegister.style.background = "transparent";
    tabRegister.style.color = "var(--text-secondary)";
    formLogin.style.display = "block";
    formRegister.style.display = "none";
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabRegister.style.background = "#fff";
    tabRegister.style.color = "var(--primary-purple)";
    tabLogin.classList.remove("active");
    tabLogin.style.background = "transparent";
    tabLogin.style.color = "var(--text-secondary)";
    formRegister.style.display = "block";
    formLogin.style.display = "none";
  });

  // Live Animated Character Avatar Preview Handler
  const regNameInput = document.getElementById("reg-name");
  const regGenderSelect = document.getElementById("reg-gender");
  const regPhotoInput = document.getElementById("reg-photo");
  const avatarPreview = document.getElementById("reg-avatar-preview");

  function updateAvatarPreview() {
    if (!avatarPreview) return;
    const customUrl = regPhotoInput ? regPhotoInput.value.trim() : "";
    if (customUrl) {
      avatarPreview.src = customUrl;
    } else {
      const name = regNameInput ? regNameInput.value.trim() : "Staff";
      const gender = regGenderSelect ? regGenderSelect.value : "Female";
      avatarPreview.src = getClientAnimatedAvatar(name, gender);
    }
  }

  if (regNameInput) regNameInput.addEventListener("input", updateAvatarPreview);
  if (regGenderSelect) regGenderSelect.addEventListener("change", updateAvatarPreview);
  if (regPhotoInput) regPhotoInput.addEventListener("input", updateAvatarPreview);

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErr.style.display = "none";
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      currentUser = data.user;
      localStorage.setItem("lifeline_user", JSON.stringify(currentUser));
      initUserSession();
      showToast("Welcome Back", `Logged in as ${currentUser.name} (${currentUser.role.toUpperCase()})`, "success");
    } catch (err) {
      loginErr.textContent = err.message;
      loginErr.style.display = "block";
    }
  });

  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    regErr.style.display = "none";
    const name = document.getElementById("reg-name").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const role = document.getElementById("reg-role").value;
    const gender = document.getElementById("reg-gender").value;
    const specialty = document.getElementById("reg-specialty").value.trim();
    const room = document.getElementById("reg-room").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const image = document.getElementById("reg-photo").value.trim();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          role,
          gender,
          specialty,
          room,
          phone,
          image
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      currentUser = data.user;
      localStorage.setItem("lifeline_user", JSON.stringify(currentUser));
      initUserSession();
      showToast("Staff Account Created", `Welcome, ${currentUser.name}! Dynamic character avatar assigned.`, "success");
    } catch (err) {
      regErr.textContent = err.message;
      regErr.style.display = "block";
    }
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("lifeline_user");
    currentUser = null;
    overlay.classList.add("active");
    mainApp.style.display = "none";
    showToast("Logged Out", "You have been logged out securely.", "info");
  });
}

function initUserSession() {
  const overlay = document.getElementById("auth-modal-overlay");
  const mainApp = document.getElementById("main-app");
  overlay.classList.remove("active");
  mainApp.style.display = "grid";

  document.getElementById("user-display-name").textContent = currentUser.name || currentUser.username;
  document.getElementById("user-display-role").textContent = (currentUser.role || 'Staff').toUpperCase();
  document.getElementById("view-greeting").textContent = `Hello, ${currentUser.name || currentUser.username}`;

  const avatarImg = document.getElementById("user-avatar-img");
  if (avatarImg && currentUser.image) {
    avatarImg.src = currentUser.image;
  }

  applyRolePermissions(currentUser.role);
  loadInitialData();
}

function applyRolePermissions(role) {
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  let defaultView = "receptionist";

  navItems.forEach(item => {
    const view = item.getAttribute("data-view");
    if (role === "admin") {
      item.style.display = "block";
      defaultView = "admin";
    } else if (role === "doctor") {
      item.style.display = (view === "doc-queue" || view === "registry") ? "block" : "none";
      defaultView = "doc-queue";
    } else if (role === "receptionist") {
      item.style.display = (view === "receptionist" || view === "registry") ? "block" : "none";
      defaultView = "receptionist";
    } else if (role === "pharmacist") {
      item.style.display = (view === "pharmacy" || view === "registry") ? "block" : "none";
      defaultView = "pharmacy";
    } else if (role === "radiologist") {
      item.style.display = (view === "radiology" || view === "registry") ? "block" : "none";
      defaultView = "radiology";
    }
  });

  switchView(defaultView);
}

function switchView(viewName) {
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");

  navItems.forEach(n => {
    if (n.getAttribute("data-view") === viewName) n.classList.add("active");
    else n.classList.remove("active");
  });

  viewPanels.forEach(p => {
    if (p.id === `view-${viewName}`) p.classList.add("active");
    else p.classList.remove("active");
  });

  if (viewName === "receptionist") renderReceptionDesk();
  else if (viewName === "doc-queue") renderDoctorDesk();
  else if (viewName === "pharmacy") renderPharmacyDesk();
  else if (viewName === "radiology") renderRadiologyDesk();
  else if (viewName === "registry") renderRegistryDesk();
  else if (viewName === "admin") renderAdminDesk();

  refreshIcons();
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.getAttribute("data-view");
      if (view) switchView(view);
    });
  });
}

// =========================================================================
// 2. DATA LOADING & REAL-TIME SYNC
// =========================================================================

async function loadInitialData() {
  try {
    const [pRes, sRes, mRes, dRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/scans"),
      fetch("/api/medicines"),
      fetch("/api/doctors")
    ]);

    if (pRes.ok) patients = await pRes.json();
    if (sRes.ok) masterScans = await sRes.json();
    if (mRes.ok) masterMedicines = await mRes.json();
    if (dRes.ok) masterDoctors = await dRes.json();

    populateScansDropdown();
    setupSmartDrugAutocomplete();
    setupDrugCatalogModal();
    refreshCurrentView();
    startPolling();
  } catch (err) {
    console.error("Initial data load failed:", err);
  }
}

function refreshCurrentView() {
  const activeNav = document.querySelector(".nav-menu .nav-item.active");
  if (activeNav) {
    const view = activeNav.getAttribute("data-view");
    if (view) switchView(view);
  }
}

let pollTimer = null;
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!currentUser) return;
    const isTyping = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (isTyping) return;

    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const fresh = await res.json();
        if (JSON.stringify(fresh) !== JSON.stringify(patients)) {
          patients = fresh;
          refreshCurrentView();
        }
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }
  }, 5000);
}

// =========================================================================
// 2.5. SMART DRUG FORMULARY & BRAND SUGGESTION ENGINE
// =========================================================================

let selectedCatalogCategory = "ALL";

function setupDrugCatalogModal() {
  const modal = document.getElementById("drug-catalog-modal");
  const btnClose = document.getElementById("btn-close-drug-catalog");
  const openBtns = document.querySelectorAll(".btn-open-drug-catalog");
  const searchInput = document.getElementById("modal-drug-search-input");
  const catFilterBtns = document.querySelectorAll("#modal-drug-cat-filters .drug-cat-filter-btn");

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.add("active");
      renderDrugCatalogCards();
      refreshIcons();
    });
  });

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderDrugCatalogCards();
    });
  }

  catFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catFilterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCatalogCategory = btn.getAttribute("data-cat");
      renderDrugCatalogCards();
    });
  });
}

function renderDrugCatalogCards() {
  const container = document.getElementById("drug-catalog-cards-container");
  const searchInput = document.getElementById("modal-drug-search-input");
  if (!container) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const filtered = masterMedicines.filter(m => {
    const matchesCat = selectedCatalogCategory === "ALL" || (m.category && m.category.toLowerCase().includes(selectedCatalogCategory.toLowerCase()));
    if (!matchesCat) return false;
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.genericName.toLowerCase().includes(query) ||
      m.composition.toLowerCase().includes(query) ||
      (m.alternativeBrands && m.alternativeBrands.some(b => b.toLowerCase().includes(query)))
    );
  });

  container.innerHTML = "";
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-secondary);">No pharmaceutical items match your search filter.</div>`;
    return;
  }

  filtered.forEach(med => {
    const card = document.createElement("div");
    card.className = "drug-catalog-card";
    
    let altHtml = "";
    if (med.alternativeBrands && med.alternativeBrands.length > 0) {
      altHtml = `
        <div class="drug-card-alternatives">
          <strong style="color:var(--primary-purple-dark); font-size:0.75rem;">Alternative Brands & Market Prices:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
            ${med.alternativeBrands.map(b => `<span class="badge" style="background:#fff; border:1px solid #cbd5e1; font-size:0.7rem; color:var(--text-main); font-weight:600;">${b}</span>`).join("")}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="drug-card-top">
          <div>
            <div class="drug-card-title">${med.name}</div>
            <span class="badge badge-purple" style="font-size:0.68rem; margin-top:2px;">${med.category}</span>
          </div>
          <div class="drug-card-price">₹${med.price}</div>
        </div>

        <div class="drug-card-molecule" style="margin-top:0.5rem;">
          <div><strong>Active Molecule:</strong> ${med.genericName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${med.composition}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;"><strong>Std Dosage:</strong> ${med.defaultDose} | ${med.defaultFreq} (${med.defaultDur})</div>
        </div>
      </div>

      ${altHtml}

      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-primary btn-sm btn-quick-add-drug" style="flex:1; font-size:0.78rem;">
          <i data-lucide="plus" style="width:12px; height:12px;"></i> Add to Cart / Rx
        </button>
      </div>
    `;

    card.querySelector(".btn-quick-add-drug").addEventListener("click", () => {
      if (activeDocPatient) {
        currentDocMeds.push({
          name: med.name,
          dose: med.defaultDose || "500mg",
          freq: med.defaultFreq || "1-0-1",
          dur: med.defaultDur || "5 Days",
          price: med.price || 0,
          dispensed: false
        });
        renderDocMedsRows();
        alert(`✓ Added ${med.name} to Dr. Consultation Prescription.`);
      } else if (activePharmaPatient) {
        const cv = getCurrentVisit(activePharmaPatient);
        cv.medicines.push({
          name: med.name,
          dose: med.defaultDose || "500mg",
          freq: med.defaultFreq || "1-0-1",
          dur: med.defaultDur || "5 Days",
          price: med.price || 50,
          dispensed: false
        });
        selectPatientForPharmacy(activePharmaPatient.id);
        alert(`✓ Added ${med.name} to Pharmacy POS Bill (₹${med.price}).`);
      } else {
        alert(`ℹ ${med.name} (₹${med.price}) selected.\nActive Molecule: ${med.genericName}\nTo add to a live bill, open a patient in Doctor or Pharmacy desk.`);
      }
    });

    container.appendChild(card);
  });

  refreshIcons();
}

function setupSmartDrugAutocomplete() {
  const docSearchInput = document.getElementById("doc-quick-drug-search");
  const docDropdown = document.getElementById("doc-drug-suggestions-dropdown");

  const phSearchInput = document.getElementById("ph-quick-drug-search");
  const phDropdown = document.getElementById("ph-drug-suggestions-dropdown");

  // Doctor Autocomplete
  if (docSearchInput && docDropdown) {
    docSearchInput.addEventListener("input", () => {
      const q = docSearchInput.value.toLowerCase().trim();
      renderDrugSuggestions(q, docDropdown, (selectedBrand, med) => {
        currentDocMeds.push({
          name: selectedBrand,
          dose: med.defaultDose || "500mg",
          freq: med.defaultFreq || "1-0-1",
          dur: med.defaultDur || "5 Days",
          price: med.price || 0,
          dispensed: false
        });
        renderDocMedsRows();
        docSearchInput.value = "";
        docDropdown.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!docSearchInput.contains(e.target) && !docDropdown.contains(e.target)) {
        docDropdown.classList.remove("active");
      }
    });
  }

  // Pharmacy Autocomplete
  if (phSearchInput && phDropdown) {
    phSearchInput.addEventListener("input", () => {
      const q = phSearchInput.value.toLowerCase().trim();
      renderDrugSuggestions(q, phDropdown, (selectedBrand, med) => {
        if (!activePharmaPatient) {
          alert("Please select a patient from the queue first to add medicines.");
          return;
        }
        const cv = getCurrentVisit(activePharmaPatient);
        cv.medicines.push({
          name: selectedBrand,
          dose: med.defaultDose || "500mg",
          freq: med.defaultFreq || "1-0-1",
          dur: med.defaultDur || "5 Days",
          price: med.price || 50,
          dispensed: false
        });
        selectPatientForPharmacy(activePharmaPatient.id);
        phSearchInput.value = "";
        phDropdown.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!phSearchInput.contains(e.target) && !phDropdown.contains(e.target)) {
        phDropdown.classList.remove("active");
      }
    });
  }
}

function renderDrugSuggestions(query, dropdownEl, onSelectCallback) {
  if (!query) {
    dropdownEl.innerHTML = "";
    dropdownEl.classList.remove("active");
    return;
  }

  const matches = masterMedicines.filter(m => 
    m.name.toLowerCase().includes(query) ||
    m.genericName.toLowerCase().includes(query) ||
    m.composition.toLowerCase().includes(query) ||
    (m.alternativeBrands && m.alternativeBrands.some(b => b.toLowerCase().includes(query)))
  );

  dropdownEl.innerHTML = "";
  if (matches.length === 0) {
    dropdownEl.innerHTML = `<div style="padding:0.85rem 1rem; font-size:0.85rem; color:var(--text-secondary);">No matching drugs or brands found.</div>`;
    dropdownEl.classList.add("active");
    return;
  }

  matches.forEach(med => {
    const item = document.createElement("div");
    item.className = "drug-suggestion-item";

    // Alternative brand chips
    let altChipsHtml = "";
    if (med.alternativeBrands && med.alternativeBrands.length > 0) {
      altChipsHtml = `
        <div class="drug-alt-brands">
          <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">Equivalent Brands:</span>
          ${med.alternativeBrands.map(b => `<span class="alt-brand-chip" data-brand="${b}">+ ${b}</span>`).join("")}
        </div>
      `;
    }

    item.innerHTML = `
      <div class="drug-item-header">
        <div>
          <span class="drug-brand-title">${med.name}</span>
          <span class="badge badge-purple" style="font-size:0.68rem; margin-left:6px;">${med.category}</span>
        </div>
        <span style="font-weight:800; color:var(--primary-purple-dark); font-size:0.9rem;">₹${med.price}</span>
      </div>
      <div class="drug-generic-sub">
        <strong>Active Drug:</strong> ${med.genericName} (${med.composition}) • Std Dose: ${med.defaultDose}
      </div>
      ${altChipsHtml}
    `;

    // Main item click selects primary brand
    item.addEventListener("click", (e) => {
      const chip = e.target.closest(".alt-brand-chip");
      if (chip) {
        const brandName = chip.getAttribute("data-brand");
        onSelectCallback(brandName, med);
      } else {
        onSelectCallback(med.name, med);
      }
    });

    dropdownEl.appendChild(item);
  });

  dropdownEl.classList.add("active");
}

// =========================================================================
// 3. RECEPTION DESK (INTAKE & CONSULTATION DIRECT BILLING)
// =========================================================================

function renderReceptionDesk() {
  const totalEl = document.getElementById("reception-stat-total");
  const waitEl = document.getElementById("reception-stat-waiting");
  const consultsEl = document.getElementById("reception-stat-consultations");
  const revEl = document.getElementById("reception-stat-revenue");
  const queueList = document.getElementById("reception-queue-list");
  const countBadge = document.getElementById("reception-queue-count");

  let totalWaiting = 0;
  let totalConsults = 0;
  let totalRev = 0;

  patients.forEach(p => {
    if (p.visits) {
      p.visits.forEach(v => {
        totalConsults++;
        if (v.status === "WAITING_FOR_DOCTOR") totalWaiting++;
        if (v.consultationPaid) totalRev += Math.max(0, (v.consultationFee || 1000) - (v.consultationDiscount || 0));
      });
    }
  });

  if (totalEl) totalEl.textContent = patients.length;
  if (waitEl) waitEl.textContent = totalWaiting;
  if (consultsEl) consultsEl.textContent = totalConsults;
  if (revEl) revEl.textContent = `₹${totalRev.toLocaleString()}`;
  if (countBadge) countBadge.textContent = `${patients.length} Registered`;

  if (queueList) {
    queueList.innerHTML = "";
    if (patients.length === 0) {
      queueList.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No patients registered yet.</div>`;
      return;
    }

    patients.slice().reverse().forEach(p => {
      const cv = getCurrentVisit(p);
      const card = document.createElement("div");
      card.className = "patient-card";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="color:var(--text-main); font-size:0.95rem;">${p.name}</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
              ${p.id} • ${p.age}y / ${p.gender} • ${p.phone}
            </div>
          </div>
          <span class="badge ${cv.status === 'WAITING_FOR_DOCTOR' ? 'badge-waiting' : 'badge-success'}">
            ${cv.status === 'WAITING_FOR_DOCTOR' ? 'Waiting' : 'Attended'}
          </span>
        </div>
        <div style="font-size:0.75rem; color:var(--primary-purple-dark); margin-top:0.4rem; font-weight:600;">
          Consult Fee: ₹${(cv.consultationFee || 1000) - (cv.consultationDiscount || 0)} (${cv.consultationPaid ? 'Paid via ' + cv.consultationPaymentMode : 'Unpaid'})
        </div>
      `;
      queueList.appendChild(card);
    });
  }
}

function setupReceptionEvents() {
  const form = document.getElementById("patient-intake-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("intake-name").value.trim();
    const phone = document.getElementById("intake-phone").value.trim();
    const age = parseInt(document.getElementById("intake-age").value);
    const gender = document.getElementById("intake-gender").value;
    const bloodGroup = document.getElementById("intake-blood").value;

    const temp = parseFloat(document.getElementById("intake-temp").value);
    const bp = document.getElementById("intake-bp").value.trim();
    const pulse = parseInt(document.getElementById("intake-pulse").value);
    const weight = parseFloat(document.getElementById("intake-weight").value);

    const discount = parseFloat(document.getElementById("intake-consult-discount").value) || 0;
    const payMode = document.getElementById("intake-consult-paymode").value;

    const newPatient = {
      name,
      phone,
      age,
      gender,
      bloodGroup,
      vitals: { temp, bp, pulse, weight }
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Intake registration failed");

      // Settle Consultation Fee
      const savedPatient = data.patient;
      await fetch(`/api/billing/consultation-settle/${savedPatient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: payMode,
          discount: discount,
          fee: 1000
        })
      });

      showToast("Intake Successful", `Patient ${name} registered with ID: ${savedPatient.id}! Sent to Doctor queue.`, "success");
      form.reset();
      loadInitialData();
    } catch (err) {
      showToast("Registration Error", err.message, "error");
    }
  });
}

// =========================================================================
// 4. DOCTOR DESK (CLINICAL EMR & LONGITUDINAL HISTORY)
// =========================================================================

function populateScansDropdown() {
  const select = document.getElementById("doc-scan-select");
  const preview = document.getElementById("doc-scan-price-preview");
  if (!select) return;

  select.innerHTML = "";
  masterScans.forEach((scan) => {
    const opt = document.createElement("option");
    opt.value = scan.name;
    opt.textContent = `${scan.name} (${scan.modality}) — ₹${scan.price}`;
    opt.setAttribute("data-price", scan.price);
    opt.setAttribute("data-modality", scan.modality);
    select.appendChild(opt);
  });

  if (masterScans.length > 0 && preview) {
    preview.value = `₹${masterScans[0].price}`;
  }

  select.addEventListener("change", () => {
    const chosen = select.options[select.selectedIndex];
    if (chosen && preview) {
      preview.value = `₹${chosen.getAttribute("data-price")}`;
    }
  });
}

function renderDoctorDesk() {
  const queueList = document.getElementById("doc-queue-list");
  const countBadge = document.getElementById("doc-queue-count");
  const waitingPatients = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.status === "WAITING_FOR_DOCTOR";
  });

  if (countBadge) countBadge.textContent = `${waitingPatients.length} Waiting`;

  if (queueList) {
    queueList.innerHTML = "";
    if (waitingPatients.length === 0) {
      queueList.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No patients currently waiting.</div>`;
      return;
    }

    waitingPatients.forEach(p => {
      const isSelected = activeDocPatient && activeDocPatient.id === p.id;
      const card = document.createElement("div");
      card.className = `patient-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--text-main); font-size:0.95rem;">${p.name}</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
              ${p.id} • ${p.age}y / ${p.gender}
            </div>
          </div>
          <button class="btn btn-primary btn-sm">Examine</button>
        </div>
      `;
      card.addEventListener("click", () => selectPatientForDoctor(p.id));
      queueList.appendChild(card);
    });
  }
}

function selectPatientForDoctor(patientId) {
  activeDocPatient = patients.find(p => p.id === patientId);
  if (!activeDocPatient) return;

  const cv = getCurrentVisit(activeDocPatient);
  document.getElementById("doc-empty-state").style.display = "none";
  document.getElementById("doc-consultation-form").style.display = "block";
  document.getElementById("btn-doc-view-history").style.display = "inline-flex";

  document.getElementById("doc-patient-name").textContent = activeDocPatient.name;
  document.getElementById("doc-patient-id").textContent = activeDocPatient.id;
  document.getElementById("doc-p-age-gender").textContent = `${activeDocPatient.age}y / ${activeDocPatient.gender}`;
  document.getElementById("doc-p-blood").textContent = activeDocPatient.bloodGroup || "O+";

  document.getElementById("doc-p-temp").textContent = `${cv.vitals.temp || 98.6}°F`;
  document.getElementById("doc-p-bp").textContent = cv.vitals.bp || "120/80";
  document.getElementById("doc-p-pulse").textContent = `${cv.vitals.pulse || 72}bpm`;

  document.getElementById("doc-symptoms").value = cv.symptoms || "";
  document.getElementById("doc-physical-exam").value = cv.physicalExam || "";
  document.getElementById("doc-diagnosis").value = cv.diagnosis || "";

  currentDocMeds = cv.medicines ? [...cv.medicines] : [];
  currentDocScans = cv.reports ? [...cv.reports] : [];

  renderDocMedsRows();
  renderDocOrderedScans();
  renderDoctorDesk();
}

function renderDocMedsRows() {
  const container = document.getElementById("doc-meds-container");
  if (!container) return;
  container.innerHTML = "";

  if (currentDocMeds.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">No medications prescribed yet. Search any drug or brand above.</div>`;
    return;
  }

  currentDocMeds.forEach((med, index) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "2fr 1fr 1fr 1fr auto";
    row.style.gap = "0.5rem";
    row.style.marginBottom = "0.5rem";
    row.style.alignItems = "center";

    row.innerHTML = `
      <input type="text" value="${med.name || ''}" placeholder="Medicine Name" class="doc-med-name" data-idx="${index}">
      <input type="text" value="${med.dose || '500mg'}" placeholder="Dose (500mg)" class="doc-med-dose" data-idx="${index}">
      <input type="text" value="${med.freq || '1-0-1'}" placeholder="Frequency (1-0-1)" class="doc-med-freq" data-idx="${index}">
      <input type="text" value="${med.dur || '5 Days'}" placeholder="Duration (5 Days)" class="doc-med-dur" data-idx="${index}">
      <button type="button" class="btn btn-danger btn-sm btn-remove-med" data-idx="${index}"><i data-lucide="trash-2"></i></button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".btn-remove-med").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"));
      currentDocMeds.splice(idx, 1);
      renderDocMedsRows();
      refreshIcons();
    });
  });

  refreshIcons();
}

function renderDocOrderedScans() {
  const list = document.getElementById("doc-ordered-scans-list");
  if (!list) return;
  list.innerHTML = "";

  if (currentDocScans.length === 0) {
    list.innerHTML = `<div style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">No diagnostic tests ordered for this consultation.</div>`;
    return;
  }

  currentDocScans.forEach((scan, index) => {
    const pill = document.createElement("span");
    pill.className = "badge badge-purple";
    pill.style.padding = "0.4rem 0.8rem";
    pill.style.marginRight = "0.5rem";
    pill.style.marginBottom = "0.4rem";
    pill.innerHTML = `
      ${scan.name} (₹${scan.price})
      <i data-lucide="x" class="btn-remove-scan" data-idx="${index}" style="width:12px; height:12px; cursor:pointer; margin-left:4px;"></i>
    `;
    list.appendChild(pill);
  });

  list.querySelectorAll(".btn-remove-scan").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"));
      currentDocScans.splice(idx, 1);
      renderDocOrderedScans();
      refreshIcons();
    });
  });

  refreshIcons();
}

function setupDoctorEvents() {
  const btnAddMed = document.getElementById("btn-doc-add-med-row");
  const btnAddScan = document.getElementById("btn-doc-add-scan");
  const form = document.getElementById("doc-consultation-form");
  const btnHistory = document.getElementById("btn-doc-view-history");
  const btnCloseHistory = document.getElementById("btn-close-history");

  if (btnAddMed) {
    btnAddMed.addEventListener("click", () => {
      currentDocMeds.push({ name: "", dose: "500mg", freq: "1-0-1", dur: "5 Days", price: 0, dispensed: false });
      renderDocMedsRows();
    });
  }

  if (btnAddScan) {
    btnAddScan.addEventListener("click", () => {
      const select = document.getElementById("doc-scan-select");
      const chosen = select.options[select.selectedIndex];
      if (!chosen) return;

      const name = chosen.value;
      const price = parseFloat(chosen.getAttribute("data-price")) || 0;
      const modality = chosen.getAttribute("data-modality") || "General";

      currentDocScans.push({
        name,
        price,
        modality,
        status: "pending",
        findings: "",
        attachmentUrl: ""
      });
      renderDocOrderedScans();
    });
  }

  if (btnHistory) {
    btnHistory.addEventListener("click", () => {
      if (!activeDocPatient) return;
      renderLongitudinalHistory(activeDocPatient);
      document.getElementById("history-modal").classList.add("active");
    });
  }

  if (btnCloseHistory) {
    btnCloseHistory.addEventListener("click", () => {
      document.getElementById("history-modal").classList.remove("active");
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeDocPatient) return;

      // Sync Med inputs
      const names = document.querySelectorAll(".doc-med-name");
      const doses = document.querySelectorAll(".doc-med-dose");
      const freqs = document.querySelectorAll(".doc-med-freq");
      const durs = document.querySelectorAll(".doc-med-dur");

      const finalMeds = [];
      names.forEach((nInput, i) => {
        const val = nInput.value.trim();
        if (val) {
          finalMeds.push({
            name: val,
            dose: doses[i] ? doses[i].value : "500mg",
            freq: freqs[i] ? freqs[i].value : "1-0-1",
            dur: durs[i] ? durs[i].value : "5 Days",
            price: 0,
            dispensed: false
          });
        }
      });

      const cv = getCurrentVisit(activeDocPatient);
      cv.symptoms = document.getElementById("doc-symptoms").value.trim();
      cv.physicalExam = document.getElementById("doc-physical-exam").value.trim();
      cv.diagnosis = document.getElementById("doc-diagnosis").value.trim();
      cv.medicines = finalMeds;
      cv.reports = currentDocScans;
      cv.examDate = getFormattedDateTime();

      cv.needsPharmacy = finalMeds.length > 0;
      cv.needsRadiology = currentDocScans.length > 0;

      if (cv.needsPharmacy) {
        cv.status = "WAITING_FOR_PHARMACY";
      } else if (cv.needsRadiology) {
        cv.status = "WAITING_FOR_RADIOLOGY";
      } else {
        cv.status = "COMPLETED";
      }

      activeDocPatient.logs.push(`Consultation completed by doctor. Diagnosis: ${cv.diagnosis}.`);

      try {
        const res = await fetch(`/api/patients/${activeDocPatient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeDocPatient)
        });
        if (!res.ok) throw new Error("Failed to save consultation");

        showToast("Consultation Saved", `Consultation completed for ${activeDocPatient.name}! Orders routed to pharmacy & radiology.`, "success");
        activeDocPatient = null;
        document.getElementById("doc-empty-state").style.display = "block";
        document.getElementById("doc-consultation-form").style.display = "none";
        loadInitialData();
      } catch (err) {
        showToast("Error Saving Consultation", err.message, "error");
      }
    });
  }

  const btnPrintRx = document.getElementById("btn-doc-print-rx");
  if (btnPrintRx) {
    btnPrintRx.addEventListener("click", () => {
      if (!activeDocPatient) {
        showToast("No Patient Selected", "Please select a patient to print Rx slip.", "info");
        return;
      }
      const cv = getCurrentVisit(activeDocPatient);
      cv.symptoms = document.getElementById("doc-symptoms").value.trim();
      cv.physicalExam = document.getElementById("doc-physical-exam").value.trim();
      cv.diagnosis = document.getElementById("doc-diagnosis").value.trim();
      printDoctorPrescription(activeDocPatient, cv, currentDocMeds, currentDocScans);
    });
  }
}

function renderLongitudinalHistory(patient) {
  const container = document.getElementById("history-timeline-container");
  if (!container) return;
  container.innerHTML = "";

  if (!patient.visits || patient.visits.length === 0) {
    container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-secondary);">No previous treatment history available.</div>`;
    return;
  }

  patient.visits.forEach((v, index) => {
    const item = document.createElement("div");
    item.className = "timeline-item";

    const medsList = v.medicines && v.medicines.length > 0
      ? v.medicines.map(m => `• ${m.name} (${m.dose}, ${m.freq}, ${m.dur})`).join("<br>")
      : "No medicines prescribed.";

    const reportsList = v.reports && v.reports.length > 0
      ? v.reports.map(r => `• ${r.name} [${r.status}]: ${r.findings || 'Pending'}`).join("<br>")
      : "No diagnostics ordered.";

    item.innerHTML = `
      <div style="font-size:0.85rem; font-weight:700; color:var(--primary-purple-dark); margin-bottom:0.25rem;">
        Visit #${index + 1} — ${v.date} ${v.examDate ? '• Examined: ' + v.examDate : ''}
      </div>
      <div style="background:#f8fafc; padding:0.85rem; border-radius:var(--radius-sm); font-size:0.85rem;">
        <div><strong>Diagnosis:</strong> <span style="color:var(--color-rose); font-weight:700;">${v.diagnosis || 'General Triage'}</span></div>
        <div style="margin-top:4px;"><strong>Symptoms:</strong> ${v.symptoms || 'None recorded'}</div>
        <div style="margin-top:4px;"><strong>Physical Exam:</strong> ${v.physicalExam || 'None'}</div>
        <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #cbd5e1;">
          <strong>Prescribed Medicines:</strong><br>${medsList}
        </div>
        <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #cbd5e1;">
          <strong>Diagnostic Reports:</strong><br>${reportsList}
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

// =========================================================================
// 5. PHARMACY DESK (DIRECT POS BILLING & DISPENSE)
// =========================================================================

function renderPharmacyDesk() {
  const queueList = document.getElementById("pharmacy-queue-list");
  const countBadge = document.getElementById("ph-queue-count");
  const pharmaPatients = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.needsPharmacy && !cv.pharmacyDispensed;
  });

  if (countBadge) countBadge.textContent = `${pharmaPatients.length} Orders`;

  if (queueList) {
    queueList.innerHTML = "";
    if (pharmaPatients.length === 0) {
      queueList.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No pending pharmacy orders.</div>`;
      return;
    }

    pharmaPatients.forEach(p => {
      const isSelected = activePharmaPatient && activePharmaPatient.id === p.id;
      const cv = getCurrentVisit(p);
      const card = document.createElement("div");
      card.className = `patient-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--text-main); font-size:0.95rem;">${p.name}</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
              ${p.id} • ${cv.medicines ? cv.medicines.length : 0} Medicines
            </div>
          </div>
          <button class="btn btn-primary btn-sm">Dispense POS</button>
        </div>
      `;
      card.addEventListener("click", () => selectPatientForPharmacy(p.id));
      queueList.appendChild(card);
    });
  }
}

function selectPatientForPharmacy(patientId) {
  activePharmaPatient = patients.find(p => p.id === patientId);
  if (!activePharmaPatient) return;

  const cv = getCurrentVisit(activePharmaPatient);
  document.getElementById("ph-empty-state").style.display = "none";
  document.getElementById("ph-active-container").style.display = "block";

  document.getElementById("ph-patient-name").textContent = activePharmaPatient.name;
  document.getElementById("ph-patient-id").textContent = activePharmaPatient.id;

  const tableContainer = document.getElementById("ph-meds-table-container");
  tableContainer.innerHTML = "";

  let total = 0;
  cv.medicines.forEach((med, i) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "2fr 1fr 1fr 1fr auto";
    row.style.gap = "0.75rem";
    row.style.alignItems = "center";
    row.style.padding = "0.6rem 0";
    row.style.borderBottom = "1px solid #f1f5f9";

    // Auto-lookup standard price from master database if 0
    let itemPrice = med.price;
    if (!itemPrice || itemPrice === 0) {
      const matched = masterMedicines.find(m => m.name.toLowerCase() === (med.name || '').toLowerCase());
      itemPrice = matched ? matched.price : 50;
      med.price = itemPrice;
    }
    total += itemPrice;

    row.innerHTML = `
      <div><strong>${med.name}</strong> <span style="font-size:0.75rem; color:var(--text-secondary);">(${med.dose})</span></div>
      <div>${med.freq}</div>
      <div>${med.dur}</div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span>₹</span>
        <input type="number" class="ph-med-price-input" value="${itemPrice}" data-idx="${i}" style="width:80px; font-weight:700;">
      </div>
      <button type="button" class="btn btn-danger btn-sm btn-ph-remove-med" data-idx="${i}" style="padding:0.25rem 0.5rem;"><i data-lucide="trash-2" style="width:12px; height:12px;"></i></button>
    `;
    tableContainer.appendChild(row);
  });

  tableContainer.querySelectorAll(".btn-ph-remove-med").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"));
      cv.medicines.splice(idx, 1);
      selectPatientForPharmacy(activePharmaPatient.id);
    });
  });

  document.getElementById("ph-bill-total").textContent = `₹${total.toFixed(2)}`;

  tableContainer.querySelectorAll(".ph-med-price-input").forEach(input => {
    input.addEventListener("input", recalculatePharmacyTotal);
  });

  refreshIcons();
  renderPharmacyDesk();
}

function recalculatePharmacyTotal() {
  const inputs = document.querySelectorAll(".ph-med-price-input");
  let sum = 0;
  inputs.forEach(inp => {
    sum += parseFloat(inp.value) || 0;
  });
  document.getElementById("ph-bill-total").textContent = `₹${sum.toFixed(2)}`;
}

function setupPharmacyEvents() {
  const pills = document.querySelectorAll("#view-pharmacy .payment-mode-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      selectedPharmaPayMode = pill.getAttribute("data-mode");
    });
  });

  const btnPrint = document.getElementById("btn-ph-print-receipt");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      if (!activePharmaPatient) {
        alert("Please select a patient to print invoice.");
        return;
      }
      const cv = getCurrentVisit(activePharmaPatient);
      const inputs = document.querySelectorAll(".ph-med-price-input");
      const currentMeds = cv.medicines.map((m, i) => ({
        ...m,
        price: parseFloat(inputs[i] ? inputs[i].value : 0) || m.price || 0
      }));
      let total = 0;
      currentMeds.forEach(m => { total += (m.price || 0); });
      printPharmacyReceipt(activePharmaPatient, cv, currentMeds, total, selectedPharmaPayMode);
    });
  }

  const btnSettle = document.getElementById("btn-ph-settle-dispense");
  if (btnSettle) {
    btnSettle.addEventListener("click", async () => {
      if (!activePharmaPatient) return;
      const cv = getCurrentVisit(activePharmaPatient);

      const inputs = document.querySelectorAll(".ph-med-price-input");
      const updatedMeds = cv.medicines.map((m, i) => ({
        ...m,
        price: parseFloat(inputs[i] ? inputs[i].value : 0) || 0,
        dispensed: true
      }));

      try {
        const res = await fetch(`/api/billing/pharmacy-settle/${activePharmaPatient.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMode: selectedPharmaPayMode,
            medicines: updatedMeds
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Pharmacy settlement failed");

        alert(`✓ Pharmacy Payment Collected (₹${data.totalSettled}) via ${selectedPharmaPayMode}. Medicines Dispensed!`);
        activePharmaPatient = null;
        document.getElementById("ph-empty-state").style.display = "block";
        document.getElementById("ph-active-container").style.display = "none";
        loadInitialData();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  }
}

function printPharmacyReceipt(patient, visit, meds, total, payMode) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LifeLine (LHMS) — Pharmacy Tax Invoice</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; color: #1e1b4b; margin: 0; background: #fff; }
        .receipt-box { max-width: 620px; margin: auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; }
        .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 15px; }
        .header h1 { margin: 0; color: #7c3aed; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 3px 0 0; font-size: 12px; color: #64748b; }
        .meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 15px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
        th { background: #ede9fe; color: #6d28d9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        .total-row { font-size: 16px; font-weight: 800; text-align: right; margin-top: 10px; color: #7c3aed; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="receipt-box">
        <div class="header">
          <h1>LifeLine (LHMS) Hospital</h1>
          <p>Decentralized Pharmacy & Medical Dispensary Counter</p>
          <p>GSTIN: 07AAAAA0000A1Z5 • 24x7 Smart Clinical Care</p>
        </div>
        <div class="meta">
          <div>
            <strong>Patient Name:</strong> ${patient.name}<br>
            <strong>Patient ID:</strong> ${patient.id} (${patient.age}y / ${patient.gender})<br>
            <strong>Prescribing Doctor:</strong> Dr. Aditi Chaudhary
          </div>
          <div style="text-align: right;">
            <strong>Invoice No:</strong> PH-${Date.now().toString().slice(-6)}<br>
            <strong>Date & Time:</strong> ${getFormattedDateTime()}<br>
            <strong>Payment Mode:</strong> ${payMode} (Settled)
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medication Name</th>
              <th>Dosage & Frequency</th>
              <th>Duration</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${meds.map((m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${m.name}</strong></td>
                <td>${m.dose || '-'} (${m.freq || '-'})</td>
                <td>${m.dur || '-'}</td>
                <td style="text-align: right;">₹${(m.price || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-row">
          Total Amount Settled: ₹${total.toFixed(2)}
        </div>
        <div class="footer">
          ✓ Official Computer Generated Tax Invoice. Medicines once dispensed cannot be returned without original receipt.<br>
          Thank you for choosing LifeLine Hospital Management System!
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// =========================================================================
// 6. RADIOLOGY DESK (DIRECT POS BILLING & FINDINGS)
// =========================================================================

function renderRadiologyDesk() {
  const queueList = document.getElementById("radiology-queue-list");
  const countBadge = document.getElementById("rad-queue-count");
  const radioPatients = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.needsRadiology && !cv.radiologyCompleted;
  });

  if (countBadge) countBadge.textContent = `${radioPatients.length} Scans`;

  if (queueList) {
    queueList.innerHTML = "";
    if (radioPatients.length === 0) {
      queueList.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No pending radiology scans.</div>`;
      return;
    }

    radioPatients.forEach(p => {
      const isSelected = activeRadioPatient && activeRadioPatient.id === p.id;
      const cv = getCurrentVisit(p);
      const card = document.createElement("div");
      card.className = `patient-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--text-main); font-size:0.95rem;">${p.name}</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
              ${p.id} • ${cv.reports ? cv.reports.length : 0} Scans Ordered
            </div>
          </div>
          <button class="btn btn-primary btn-sm">Scan POS</button>
        </div>
      `;
      card.addEventListener("click", () => selectPatientForRadiology(p.id));
      queueList.appendChild(card);
    });
  }
}

function selectPatientForRadiology(patientId) {
  activeRadioPatient = patients.find(p => p.id === patientId);
  if (!activeRadioPatient) return;

  const cv = getCurrentVisit(activeRadioPatient);
  document.getElementById("rad-empty-state").style.display = "none";
  document.getElementById("rad-active-container").style.display = "block";

  document.getElementById("rad-patient-name").textContent = activeRadioPatient.name;
  document.getElementById("rad-patient-id").textContent = activeRadioPatient.id;

  const container = document.getElementById("rad-tests-table-container");
  container.innerHTML = "";

  let total = 0;
  cv.reports.forEach((rep, i) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "0.75rem 0";
    row.style.borderBottom = "1px solid #f1f5f9";

    const price = rep.price > 0 ? rep.price : 500;
    total += price;

    row.innerHTML = `
      <div>
        <strong>${rep.name}</strong>
        <span class="badge badge-purple" style="margin-left:8px;">${rep.modality || 'Diagnostic'}</span>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span>₹</span>
        <input type="number" class="rad-test-price-input" value="${price}" data-idx="${i}" style="width:90px; font-weight:700;">
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById("rad-bill-total").textContent = `₹${total.toFixed(2)}`;

  container.querySelectorAll(".rad-test-price-input").forEach(input => {
    input.addEventListener("input", recalculateRadiologyTotal);
  });

  renderRadiologyDesk();
}

function recalculateRadiologyTotal() {
  const inputs = document.querySelectorAll(".rad-test-price-input");
  let sum = 0;
  inputs.forEach(inp => {
    sum += parseFloat(inp.value) || 0;
  });
  document.getElementById("rad-bill-total").textContent = `₹${sum.toFixed(2)}`;
}

function setupRadiologyEvents() {
  const pills = document.querySelectorAll("#view-radiology .payment-mode-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      selectedRadioPayMode = pill.getAttribute("data-mode");
    });
  });

  const btnPrintRad = document.getElementById("btn-rad-print-report");
  if (btnPrintRad) {
    btnPrintRad.addEventListener("click", () => {
      if (!activeRadioPatient) {
        showToast("No Patient Selected", "Please select a patient to print diagnostic report.", "info");
        return;
      }
      const cv = getCurrentVisit(activeRadioPatient);
      const findings = document.getElementById("rad-findings-text").value.trim() || "Normal study. Visualized anatomical structures intact within normal limits.";
      const inputs = document.querySelectorAll(".rad-test-price-input");
      const currentReports = cv.reports.map((r, i) => ({
        ...r,
        price: parseFloat(inputs[i] ? inputs[i].value : 0) || r.price || 500,
        findings: findings
      }));
      let total = 0;
      currentReports.forEach(r => { total += (r.price || 0); });
      printRadiologyReport(activeRadioPatient, cv, currentReports, total, selectedRadioPayMode);
    });
  }

  const btnSettle = document.getElementById("btn-rad-settle-complete");
  if (btnSettle) {
    btnSettle.addEventListener("click", async () => {
      if (!activeRadioPatient) return;
      const cv = getCurrentVisit(activeRadioPatient);
      const findings = document.getElementById("rad-findings-text").value.trim() || "Normal radiological study. No acute abnormalities observed.";

      const inputs = document.querySelectorAll(".rad-test-price-input");
      const updatedReports = cv.reports.map((r, i) => ({
        ...r,
        price: parseFloat(inputs[i] ? inputs[i].value : 0) || 0,
        findings: findings,
        status: "completed"
      }));

      try {
        const res = await fetch(`/api/billing/radiology-settle/${activeRadioPatient.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMode: selectedRadioPayMode,
            reports: updatedReports
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Radiology settlement failed");

        showToast("Diagnostic Fee Settled", `Fee of ₹${data.totalSettled} collected via ${selectedRadioPayMode}. Report signed!`, "success");
        activeRadioPatient = null;
        document.getElementById("rad-empty-state").style.display = "block";
        document.getElementById("rad-active-container").style.display = "none";
        loadInitialData();
      } catch (err) {
        showToast("Settlement Error", err.message, "error");
      }
    });
  }
}

// =========================================================================
// 7. CENTRAL PATIENT REGISTRY (EHR)
// =========================================================================

function renderRegistryDesk() {
  const tbody = document.getElementById("registry-table-body");
  const countBadge = document.getElementById("registry-total-count");
  const searchInput = document.getElementById("registry-search-input");
  if (!tbody) return;

  const filterQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filteredPatients = patients.filter(p => {
    if (!filterQuery) return true;
    const cv = getCurrentVisit(p);
    return (
      p.name.toLowerCase().includes(filterQuery) ||
      p.id.toLowerCase().includes(filterQuery) ||
      (p.phone && p.phone.includes(filterQuery)) ||
      (cv && cv.diagnosis && cv.diagnosis.toLowerCase().includes(filterQuery))
    );
  });

  tbody.innerHTML = "";
  if (countBadge) countBadge.textContent = `${filteredPatients.length} of ${patients.length} Registered Patients`;

  if (filteredPatients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;">No matching patient records found.</td></tr>`;
    return;
  }

  filteredPatients.forEach(p => {
    const cv = getCurrentVisit(p);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--primary-purple);">${p.id}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.age}y / ${p.gender}</td>
      <td>${p.phone}</td>
      <td><span class="badge badge-purple">${cv.diagnosis || 'General Triage'}</span></td>
      <td>${p.visits ? p.visits.length : 1} Visits</td>
      <td style="text-align:right; display:flex; gap:0.4rem; justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm btn-reg-history" data-id="${p.id}" title="View Medical History Timeline"><i data-lucide="history"></i> History</button>
        <button class="btn btn-primary btn-sm btn-reg-print-summary" data-id="${p.id}" title="Print Complete Health Summary"><i data-lucide="printer"></i> EHR Summary</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".btn-reg-history").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = patients.find(pat => pat.id === btn.getAttribute("data-id"));
      if (p) {
        renderLongitudinalHistory(p);
        document.getElementById("history-modal").classList.add("active");
        refreshIcons();
      }
    });
  });

  tbody.querySelectorAll(".btn-reg-print-summary").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = patients.find(pat => pat.id === btn.getAttribute("data-id"));
      if (p) {
        printPatientMedicalSummary(p);
      }
    });
  });

  if (searchInput && !searchInput.dataset.hasListener) {
    searchInput.dataset.hasListener = "true";
    searchInput.addEventListener("input", () => {
      renderRegistryDesk();
    });
  }

  refreshIcons();
}

// =========================================================================
// 8. ADMIN EXECUTIVE PORTAL & STAFF GOVERNANCE
// =========================================================================

async function renderAdminDesk() {
  try {
    const res = await fetch("/api/admin/analytics");
    if (!res.ok) throw new Error("Failed to fetch admin analytics");
    const data = await res.json();

    document.getElementById("admin-stat-patients").textContent = (data.totalPatients || 0).toLocaleString();
    document.getElementById("admin-stat-consultations").textContent = (data.totalConsultations || 0).toLocaleString();
    document.getElementById("admin-stat-staff").textContent = data.totalStaff || 5;
    document.getElementById("admin-stat-rooms").textContent = data.rooms || 24;

    document.getElementById("admin-rev-consult").textContent = `₹${(data.revenue.consultation || 0).toLocaleString()}`;
    document.getElementById("admin-rev-pharma").textContent = `₹${(data.revenue.pharmacy || 0).toLocaleString()}`;
    document.getElementById("admin-rev-radio").textContent = `₹${(data.revenue.radiology || 0).toLocaleString()}`;
    document.getElementById("admin-total-revenue").textContent = `₹${(data.revenue.total || 0).toLocaleString()}`;

    // Render Doctor List Widget
    const docListContainer = document.getElementById("admin-doctor-list");
    if (docListContainer) {
      docListContainer.innerHTML = "";
      const doctorsList = data.doctors || masterDoctors || [];
      doctorsList.forEach(doc => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "0.85rem";
        item.style.padding = "0.65rem 0.5rem";
        item.style.borderRadius = "var(--radius-sm)";
        item.style.borderBottom = "1px solid rgba(0,0,0,0.04)";

        const docAvatar = doc.image && doc.image.trim() !== '' 
          ? doc.image 
          : getClientAnimatedAvatar(doc.name, doc.gender || (doc.name.toLowerCase().includes('aditi') || doc.name.toLowerCase().includes('carla') || doc.name.toLowerCase().includes('hanna') ? 'Female' : 'Male'));

        const isAvail = (doc.status || 'Available').toLowerCase() === 'available';

        item.innerHTML = `
          <img src="${docAvatar}" alt="${doc.name}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-purple-soft); background:#fff; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <strong style="color:var(--text-main); font-size:0.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${doc.name}</strong>
              <span class="badge" style="font-size:0.65rem; padding:1px 6px; background:${isAvail ? '#ecfdf5' : '#fff1f2'}; color:${isAvail ? '#059669' : '#e11d48'};">${doc.status || 'On Duty'}</span>
            </div>
            <span style="font-size:0.75rem; color:var(--text-secondary); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${doc.specialty} • ${doc.room || 'Room 101'}</span>
          </div>
          <span class="badge badge-purple" style="font-size:0.7rem; flex-shrink:0;">⭐ ${doc.rating || '5.0'}</span>
        `;
        docListContainer.appendChild(item);
      });
    }

    // Render Recent Patients Table
    const recentTbody = document.getElementById("admin-recent-patients-tbody");
    if (recentTbody) {
      recentTbody.innerHTML = "";
      (data.recentPatients || []).forEach(rp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${rp.date}</td>
          <td><strong>${rp.name}</strong></td>
          <td>${rp.age}</td>
          <td><span class="badge badge-purple">${rp.diagnosis}</span></td>
          <td style="text-align:right;"><span class="badge badge-success">${rp.room}</span></td>
        `;
        recentTbody.appendChild(tr);
      });
    }

    // Render Staff Table
    renderAdminStaffTable();
  } catch (err) {
    console.error("Admin render failed:", err);
  }
}

async function renderAdminStaffTable() {
  const tbody = document.getElementById("admin-staff-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const res = await fetch("/api/auth/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();

    users.forEach(u => {
      const tr = document.createElement("tr");
      const isPrimaryDoctor = u.username.toLowerCase() === "doctor";
      const isSelf = currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase();

      let actionHtml = "";
      if (isSelf) {
        actionHtml = `<span style="font-size:0.75rem; color:var(--color-emerald); font-weight:700;">✓ Current Session</span>`;
      } else if (isPrimaryDoctor) {
        actionHtml = `<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">System Admin</span>`;
      } else {
        actionHtml = `<button class="btn btn-danger btn-sm btn-delete-staff" data-username="${u.username}"><i data-lucide="trash-2"></i> Remove</button>`;
      }

      const avatarSrc = u.image || getClientAnimatedAvatar(u.name, u.gender);

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${avatarSrc}" alt="${u.name}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-purple-soft); background:#fff;">
            <div>
              <strong style="color:var(--text-main); font-size:0.9rem; display:block;">${u.name}</strong>
              <span style="font-size:0.75rem; color:var(--text-secondary);">${u.phone || 'No phone recorded'}</span>
            </div>
          </div>
        </td>
        <td><code style="color:var(--primary-purple); font-weight:700;">${u.username}</code></td>
        <td><span class="badge badge-purple">${u.role.toUpperCase()}</span></td>
        <td><span class="badge" style="background:#f1f5f9; color:var(--text-main); font-weight:600;">${u.gender || 'Female'}</span></td>
        <td>
          <div style="font-size:0.82rem; font-weight:600; color:var(--text-main);">${u.specialty || 'General Staff'}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${u.room || 'Main Clinic'}</div>
        </td>
        <td style="text-align:right;">${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-delete-staff").forEach(btn => {
      btn.addEventListener("click", async () => {
        const username = btn.getAttribute("data-username");
        if (confirm(`Are you sure you want to remove staff account '${username}'?`)) {
          try {
            await fetch(`/api/auth/users/${username}`, { method: "DELETE" });
            showToast("Staff Removed", `Account '${username}' deleted successfully.`, "info");
            renderAdminStaffTable();
          } catch (e) {
            showToast("Deletion Error", e.message, "error");
          }
        }
      });
    });

    refreshIcons();
  } catch (err) {
    console.error("Staff table render failed:", err);
  }
}

function setupAdminEvents() {
  const btnAdd = document.getElementById("btn-admin-add-staff");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const tabRegister = document.getElementById("tab-register");
      const overlay = document.getElementById("auth-modal-overlay");
      if (tabRegister && overlay) {
        tabRegister.click();
        overlay.classList.add("active");
      }
    });
  }

  const btnResetDb = document.getElementById("btn-admin-reset-db");
  if (btnResetDb) {
    btnResetDb.addEventListener("click", async () => {
      if (confirm("Reset database to demo fixtures and baseline accounts?")) {
        try {
          const res = await fetch("/api/reset-db", { method: "POST" });
          if (!res.ok) throw new Error("Reset failed");
          showToast("Database Reset", "System database restored to demo fixtures successfully.", "success");
          loadInitialData();
        } catch (e) {
          showToast("Reset Failed", e.message, "error");
        }
      }
    });
  }
}

function printDoctorPrescription(patient, visit, meds, scans) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LifeLine (LHMS) — Doctor Prescription Slip (Rx)</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1e1b4b; margin: 0; background: #fff; }
        .rx-box { max-width: 680px; margin: auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; }
        .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #7c3aed; font-size: 24px; font-weight: 800; }
        .header p { margin: 3px 0 0; font-size: 12px; color: #64748b; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
        .vitals-row { font-size: 12px; color: #475569; margin-bottom: 15px; padding: 8px 12px; background: #ede9fe; border-radius: 6px; }
        .section-title { font-size: 14px; font-weight: 700; color: #7c3aed; margin-bottom: 8px; margin-top: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
        th { background: #ede9fe; color: #6d28d9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        .sign-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="rx-box">
        <div class="header">
          <h1>LifeLine (LHMS) Medical Hospital</h1>
          <p>Department of Internal Medicine & Clinical Consultations</p>
          <p>Consulting Physician: Dr. Aditi Chaudhary, MBBS, MD</p>
        </div>
        <div class="meta-grid">
          <div>
            <strong>Patient Name:</strong> ${patient.name}<br>
            <strong>Patient ID:</strong> ${patient.id} (${patient.age}y / ${patient.gender})<br>
            <strong>Blood Group:</strong> ${patient.bloodGroup || 'O+'} | <strong>Contact:</strong> ${patient.phone}
          </div>
          <div style="text-align: right;">
            <strong>Prescription Date:</strong> ${getFormattedDateTime()}<br>
            <strong>Clinical Diagnosis:</strong> <span style="color:#e11d48; font-weight:bold;">${visit.diagnosis || 'General Triage'}</span>
          </div>
        </div>

        <div class="vitals-row">
          <strong>Vitals:</strong> Temp: ${visit.vitals ? visit.vitals.temp : 98.6}°F | BP: ${visit.vitals ? visit.vitals.bp : '120/80'} | Pulse: ${visit.vitals ? visit.vitals.pulse : 72}bpm | Weight: ${visit.vitals ? visit.vitals.weight : 68}kg
        </div>

        <div>
          <strong>Chief Complaints:</strong> ${visit.symptoms || 'None recorded'}<br>
          <strong>Physical Examination:</strong> ${visit.physicalExam || 'Within normal clinical limits'}
        </div>

        <div class="section-title">℞ Prescribed Medications (Direct to Pharmacy Desk)</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medication Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${meds && meds.length > 0 ? meds.map((m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${m.name}</strong></td>
                <td>${m.dose || '-'}</td>
                <td>${m.freq || '-'}</td>
                <td>${m.dur || '-'}</td>
              </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No medications prescribed.</td></tr>`}
          </tbody>
        </table>

        ${scans && scans.length > 0 ? `
          <div class="section-title">🔬 Ordered Diagnostic Investigations</div>
          <ul>
            ${scans.map(s => `<li><strong>${s.name}</strong> (${s.modality || 'Diagnostic'})</li>`).join('')}
          </ul>
        ` : ''}

        <div class="sign-area">
          <div>
            <em>Follow up in 5 days or if symptoms persist.</em>
          </div>
          <div style="text-align: right;">
            <strong>Dr. Aditi Chaudhary</strong><br>
            Reg. No: MED-884920<br>
            <em>LifeLine Medical Centre</em>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

function printRadiologyReport(patient, visit, reports, total, payMode) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LifeLine (LHMS) — Diagnostic Imaging & Pathology Report</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1e1b4b; margin: 0; background: #fff; }
        .report-box { max-width: 680px; margin: auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; }
        .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #7c3aed; font-size: 24px; font-weight: 800; }
        .header p { margin: 3px 0 0; font-size: 12px; color: #64748b; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #7c3aed; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .findings-box { background: #faf5ff; border: 1px solid #ede9fe; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
        th { background: #ede9fe; color: #6d28d9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        .sign-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="report-box">
        <div class="header">
          <h1>LifeLine (LHMS) Hospital</h1>
          <p>Department of Radiodiagnosis, Imaging & Clinical Pathology</p>
          <p>NABH Accredited Tertiary Medical Centre • 24x7 Diagnostics</p>
        </div>
        <div class="meta-grid">
          <div>
            <strong>Patient Name:</strong> ${patient.name}<br>
            <strong>Patient ID:</strong> ${patient.id} (${patient.age}y / ${patient.gender})<br>
            <strong>Contact:</strong> ${patient.phone} | <strong>Blood Group:</strong> ${patient.bloodGroup || 'O+'}
          </div>
          <div style="text-align: right;">
            <strong>Report ID:</strong> RAD-${Date.now().toString().slice(-6)}<br>
            <strong>Date:</strong> ${getFormattedDateTime()}<br>
            <strong>Payment Mode:</strong> ${payMode} (Settled Fee: ₹${total.toFixed(2)})
          </div>
        </div>

        <div class="section-title">Investigations Conducted</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Test / Investigation Name</th>
              <th>Modality</th>
              <th style="text-align: right;">Fee (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.name}</strong></td>
                <td>${r.modality || 'Diagnostic'}</td>
                <td style="text-align: right;">₹${(r.price || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Radiologist Clinical Impression & Findings</div>
        <div class="findings-box">
          ${reports[0] && reports[0].findings ? reports[0].findings : "Normal radiological study. Heart size within normal physiological limits. Lung fields clear bilaterally. Visualized bony thorax intact. No acute focal lesion observed."}
        </div>

        <div class="sign-area">
          <div>
            <strong>Radiology Tech:</strong> Verified<br>
            <strong>Department:</strong> Radiodiagnosis
          </div>
          <div style="text-align: right;">
            <strong>Reporting Radiologist:</strong> Dr. R. K. Saxena, MD (Radiodiagnosis)<br>
            <em>LifeLine Medicare Diagnostic Centre</em>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

function printPatientMedicalSummary(patient) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LifeLine (LHMS) — Complete Patient Health Record</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1e1b4b; margin: 0; background: #fff; }
        .summary-box { max-width: 720px; margin: auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; }
        .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #7c3aed; font-size: 24px; font-weight: 800; }
        .header p { margin: 3px 0 0; font-size: 12px; color: #64748b; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
        .visit-block { background: #faf5ff; border: 1px solid #ede9fe; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="summary-box">
        <div class="header">
          <h1>LifeLine (LHMS) Hospital</h1>
          <p>Central Electronic Health Records (EHR) & Longitudinal Medical Summary</p>
        </div>
        <div class="meta-grid">
          <div>
            <strong>Patient Name:</strong> ${patient.name}<br>
            <strong>Patient ID:</strong> ${patient.id} (${patient.age}y / ${patient.gender})<br>
            <strong>Contact:</strong> ${patient.phone} | <strong>Blood Group:</strong> ${patient.bloodGroup || 'O+'}
          </div>
          <div style="text-align: right;">
            <strong>Generated Date:</strong> ${getFormattedDateTime()}<br>
            <strong>Total Lifetime Visits:</strong> ${patient.visits ? patient.visits.length : 1}
          </div>
        </div>

        <h3 style="color:#7c3aed; font-size:15px; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">Longitudinal Clinical Encounters</h3>
        ${patient.visits && patient.visits.length > 0 ? patient.visits.map((v, i) => `
          <div class="visit-block">
            <div style="display:flex; justify-content:space-between; font-weight:bold; color:#6d28d9; margin-bottom:6px;">
              <span>Encounter #${i + 1} — ${v.date}</span>
              <span style="color:#e11d48;">${v.diagnosis || 'Triage'}</span>
            </div>
            <div><strong>Symptoms:</strong> ${v.symptoms || 'None'} | <strong>Exam:</strong> ${v.physicalExam || 'Normal'}</div>
            <div style="margin-top:4px;"><strong>Vitals:</strong> Temp: ${v.vitals ? v.vitals.temp : 98.6}°F, BP: ${v.vitals ? v.vitals.bp : '120/80'}, Pulse: ${v.vitals ? v.vitals.pulse : 72}bpm</div>
            <div style="margin-top:6px; border-top:1px dashed #cbd5e1; padding-top:6px;">
              <strong>Prescribed Meds:</strong> ${v.medicines && v.medicines.length > 0 ? v.medicines.map(m => `${m.name} (${m.dose}, ${m.dur})`).join(', ') : 'None'}<br>
              <strong>Investigations:</strong> ${v.reports && v.reports.length > 0 ? v.reports.map(r => `${r.name} [${r.status}]`).join(', ') : 'None'}
            </div>
          </div>
        `).join('') : '<p>No recorded visits.</p>'}

        <div style="text-align:center; font-size:11px; color:#94a3b8; margin-top:25px; border-top:1px dashed #cbd5e1; padding-top:10px;">
          Certified True Record from LifeLine Hospital Management System EHR Repository.
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// =========================================================================
// 9. APP ENTRY POINT
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  setupNavigation();
  setupReceptionEvents();
  setupDoctorEvents();
  setupPharmacyEvents();
  setupRadiologyEvents();
  setupAdminEvents();
  setupDrugCatalogModal();

  const globalSearch = document.getElementById("global-patient-search");
  if (globalSearch) {
    globalSearch.addEventListener("input", () => {
      const q = globalSearch.value.toLowerCase().trim();
      if (q.length > 0) {
        switchView("registry");
        const regInput = document.getElementById("registry-search-input");
        if (regInput) {
          regInput.value = q;
          renderRegistryDesk();
        }
      }
    });
  }

  const savedUser = localStorage.getItem("lifeline_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      initUserSession();
    } catch {
      localStorage.removeItem("lifeline_user");
    }
  }

  refreshIcons();
});
