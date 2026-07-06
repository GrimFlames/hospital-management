// Lifeline Medicare Centre HMS - Application Logic

// Global State
let patients = [];
let logs = [];
let activeConsultationPatient = null;
let activePharmacyPatient = null;
let activeRadiologyPatient = null;
let activeBillingPatient = null;
let currentPrescriptionMeds = []; // Temp storage for meds currently being added in prescription form
let matchedPatientForIntake = null; // Stored matched patient for receptionist check-in
let currentUser = null; // Staff authentication state

// Helper to get formatted check-in/exam date strings
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

// Privacy helper: first 3 characters of phone number, mask the rest with x
function maskPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length <= 3) return cleaned;
  return cleaned.substring(0, 3) + "xxxxxxx";
}

// Safety helper to fetch current active visit of a patient
function getCurrentVisit(p) {
  if (!p.visits || p.visits.length === 0) {
    p.visits = [{
      date: getFormattedDateTime(),
      examDate: "",
      vitals: { temp: 98.6, weight: 70, bp: "120/80", pulse: 72 },
      symptoms: "",
      prevHistory: "",
      physicalExam: "",
      diagnosis: "",
      medicines: [],
      reports: [],
      status: "WAITING_FOR_DOCTOR",
      needsPharmacy: false,
      needsRadiology: false,
      pharmacyDispensed: false,
      radiologyCompleted: false
    }];
  }
  return p.visits[p.visits.length - 1];
}

// Schema upgrade logic for backward-compatibility with older simple patient structures
function upgradeDatabaseSchema() {
  patients.forEach(p => {
    if (!p.visits) {
      // Build a default visits array using legacy attributes
      p.visits = [{
        date: "02-Jul-2026 10:00",
        examDate: p.status === "completed" ? "02-Jul-2026 10:30" : "",
        vitals: p.vitals || { temp: 98.6, weight: 70, bp: "120/80", pulse: 72 },
        symptoms: p.symptoms || "",
        prevHistory: p.prevHistory || "",
        physicalExam: p.physicalExam || "",
        diagnosis: p.diagnosis || "",
        medicines: p.medicines || [],
        reports: p.reports || [],
        status: p.status || "waiting",
        needsPharmacy: p.needsPharmacy || false,
        needsRadiology: p.needsRadiology || false,
        pharmacyDispensed: p.pharmacyDispensed || false,
        radiologyCompleted: p.radiologyCompleted || false
      }];
      
      // Clear deprecated top level properties
      delete p.vitals;
      delete p.symptoms;
      delete p.prevHistory;
      delete p.physicalExam;
      delete p.diagnosis;
      delete p.medicines;
      delete p.reports;
      delete p.status;
      delete p.needsPharmacy;
      delete p.needsRadiology;
      delete p.pharmacyDispensed;
      delete p.radiologyCompleted;
    } else {
      // Ensure physicalExam, consultationPaid, and medicinesBillPaid are initialized on all visit objects
      p.visits.forEach(v => {
        if (v.physicalExam === undefined) {
          v.physicalExam = "";
        }
        if (v.consultationPaid === undefined) {
          v.consultationPaid = false;
        }
        if (v.medicinesBillPaid === undefined) {
          v.medicinesBillPaid = false;
        }
        if (v.medicinesBillAmount === undefined) {
          v.medicinesBillAmount = 0;
        }
      });
    }
  });
}

// Mock Data to initialize system if empty
const mockPatients = [
  {
    id: "PAT-1001",
    name: "Aarav Sharma",
    age: 29,
    gender: "Male",
    phone: "9876543210",
    bloodGroup: "O+",
    visits: [
      {
        date: "28-Jun-2026 10:15",
        examDate: "28-Jun-2026 10:40",
        vitals: { temp: 98.4, weight: 75, bp: "120/80", pulse: 70 },
        symptoms: "Mild seasonal allergies and sneezing.",
        prevHistory: "None",
        diagnosis: "Allergic Rhinitis",
        medicines: [{ name: "Cetirizine", dose: "10mg", freq: "0-0-1", dur: "5 Days", dispensed: true }],
        reports: [],
        status: "completed",
        needsPharmacy: true,
        needsRadiology: false,
        pharmacyDispensed: true,
        radiologyCompleted: false
      },
      {
        date: "02-Jul-2026 09:30",
        examDate: "",
        vitals: { temp: 98.6, weight: 75, bp: "122/82", pulse: 72 },
        symptoms: "",
        prevHistory: "Allergic Rhinitis",
        diagnosis: "",
        medicines: [],
        reports: [],
        status: "waiting",
        needsPharmacy: false,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false
      }
    ],
    logs: [
      "Registered at Reception with mild allergies history.",
      "First check-in completed. Diagnosed with Allergic Rhinitis.",
      "New check-in registered for second visit on 02-Jul-2026."
    ]
  },
  {
    id: "PAT-1002",
    name: "Priya Patel",
    age: 44,
    gender: "Female",
    phone: "9988776655",
    bloodGroup: "A-",
    visits: [
      {
        date: "15-May-2026 14:00",
        examDate: "15-May-2026 14:30",
        vitals: { temp: 98.6, weight: 63, bp: "120/80", pulse: 72 },
        symptoms: "Routine health checkup.",
        prevHistory: "Seasonal asthma.",
        diagnosis: "Healthy. Advised diet control and moderate exercise.",
        medicines: [],
        reports: [],
        status: "completed",
        needsPharmacy: false,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false
      },
      {
        date: "02-Jul-2026 10:45",
        examDate: "02-Jul-2026 11:15",
        vitals: { temp: 101.2, weight: 62, bp: "135/85", pulse: 94 },
        symptoms: "Persistent fever for 3 days, body ache and dry cough.",
        prevHistory: "Known case of seasonal asthma, no major surgeries.",
        diagnosis: "Acute Bronchitis and Upper Respiratory Tract Infection (URTI).",
        medicines: [
          { name: "Paracetamol", dose: "650mg", freq: "1-1-1", dur: "5 Days", dispensed: false },
          { name: "Amoxicillin", dose: "500mg", freq: "1-0-1", dur: "7 Days", dispensed: false }
        ],
        reports: [
          { name: "Chest X-Ray", status: "pending", findings: "" },
          { name: "CBC & Blood Profile", status: "pending", findings: "" }
        ],
        status: "pending_pharmacy_radiology",
        needsPharmacy: true,
        needsRadiology: true,
        pharmacyDispensed: false,
        radiologyCompleted: false
      }
    ],
    logs: [
      "Registered first check-up. Advised health monitoring.",
      "Returning check-in on 02-Jul-2026 with high fever.",
      "Consultation completed by Doctor. Ordered medication check sheet and Chest X-ray."
    ]
  },
  {
    id: "PAT-1003",
    name: "Rajesh Kumar",
    age: 61,
    gender: "Male",
    phone: "9123456789",
    bloodGroup: "B+",
    visits: [
      {
        date: "02-Jul-2026 11:20",
        examDate: "02-Jul-2026 11:55",
        vitals: { temp: 97.9, weight: 88, bp: "145/95", pulse: 82 },
        symptoms: "Mild chest tightness and chronic high blood pressure history.",
        prevHistory: "Hypertension diagnosed 5 years ago, family history of CHD.",
        diagnosis: "Essential Hypertension (Stage 2).",
        medicines: [
          { name: "Amlodipine", dose: "5mg", freq: "0-0-1", dur: "30 Days", dispensed: false },
          { name: "Aspirin", dose: "75mg", freq: "1-0-0", dur: "30 Days", dispensed: false }
        ],
        reports: [],
        status: "pending_pharmacy",
        needsPharmacy: true,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false
      }
    ],
    logs: [
      "First check-in registered. BP noted high (145/95 mmHg).",
      "Consultation finished by Doctor. Prescribed long-term antihypertensives."
    ]
  }
];

const mockLogs = [
  { text: "System initialized with baseline clinic database.", type: "info", time: "10:00:00" },
  { text: "Patient Aarav Sharma checked in at Reception.", type: "success", time: "10:05:12" },
  { text: "Patient Priya Patel checked in with fever (101.2°F).", type: "warning", time: "10:12:45" },
  { text: "Dr. completed prescription for Priya Patel; sent to Pharmacy & Labs.", type: "info", time: "10:22:30" }
];

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  setupAuth();
  setupNavigation();
  setupEventListeners();
  setupReceptionSearch();
  setupBillingEvents();
  
  // Check if user session exists in localStorage
  const storedUser = localStorage.getItem("lifeline_hms_user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    document.getElementById("auth-screen").style.display = "none";
    document.querySelector(".app-container").style.display = "flex";
    document.getElementById("header-user-name").textContent = currentUser.name;
    document.getElementById("header-user-role").textContent = currentUser.role;
    applyRoleBasedAccess(currentUser.role);
    await initDatabase();
  } else {
    document.getElementById("auth-screen").style.display = "flex";
    document.querySelector(".app-container").style.display = "none";
  }
  
  // Refresh Lucide icons initially
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  startPollingUpdates();
});

function getRoleForView(viewName) {
  if (viewName === "receptionist") return "receptionist";
  if (viewName === "billing-consult") return "receptionist";
  if (viewName === "billing-meds") return "receptionist";
  if (['doc-queue', 'doc-complaints', 'doc-history', 'doc-diagnosis', 'doc-meds', 'doc-tests'].includes(viewName)) return "doctor";
  if (viewName === "pharmacy") return "pharmacist";
  if (viewName === "radiology") return "radiologist";
  if (viewName === "registry") return "doctor";
  if (viewName === "staff-mgmt") return "doctor";
  return "";
}

function applyRoleBasedAccess(role) {
  const staffNav = document.getElementById("staff-nav-menu");
  const docNav = document.getElementById("doctor-nav-menu");
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  let defaultView = "receptionist";

  if (role === "doctor") {
    if (staffNav) staffNav.style.display = "none";
    if (docNav) docNav.style.display = "block";
    defaultView = "doc-queue";
  } else {
    if (staffNav) staffNav.style.display = "block";
    if (docNav) docNav.style.display = "none";
    
    // Filter staff nav links so receptionist only sees receptionist, pharmacist only pharmacy, etc.
    navItems.forEach(item => {
      const viewName = item.getAttribute("data-view");
      if (viewName && !viewName.startsWith("doc-") && viewName !== "registry") {
        if (role === "receptionist" && (viewName === "receptionist" || viewName === "billing-consult" || viewName === "billing-meds")) {
          item.style.display = "block";
          defaultView = "receptionist";
        } else if (role === "pharmacist" && viewName === "pharmacy") {
          item.style.display = "block";
          defaultView = "pharmacy";
        } else if (role === "radiologist" && viewName === "radiology") {
          item.style.display = "block";
          defaultView = "radiology";
        } else {
          item.style.display = "none";
        }
      }
    });
  }

  // Toggle Doctor Phase Navigator (Disabled for strict RBAC control)
  const phaseNav = document.getElementById("doctor-phase-navigator");
  if (phaseNav) {
    phaseNav.style.display = "none";
  }

  // Toggle clear database visibility (doctor master handler only)
  const btnClearDb = document.getElementById("btn-clear-db");
  if (btnClearDb) {
    if (role === "doctor") {
      btnClearDb.style.display = "inline-flex";
    } else {
      btnClearDb.style.display = "none";
    }
  }

  // Toggle Doctor Staff Directory visibility (only visible to doctor)
  const navDocStaff = document.getElementById("nav-doc-staff");
  if (navDocStaff) {
    if (role === "doctor") {
      navDocStaff.style.display = "block";
    } else {
      navDocStaff.style.display = "none";
    }
  }

  // Switch to default view
  const targetNav = Array.from(navItems).find(item => item.getAttribute("data-view") === defaultView);
  if (targetNav) {
    targetNav.click();
  }
}

function setupAuth() {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("auth-login-form");
  const formRegister = document.getElementById("auth-register-form");
  const loginErrorMsg = document.getElementById("login-error-msg");
  const registerErrorMsg = document.getElementById("register-error-msg");

  // Tab switching
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.add("active");
    formRegister.classList.remove("active");
    loginErrorMsg.style.display = "none";
    registerErrorMsg.style.display = "none";
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.classList.add("active");
    formLogin.classList.remove("active");
    loginErrorMsg.style.display = "none";
    registerErrorMsg.style.display = "none";
  });

  // Login submit
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorMsg.style.display = "none";
    
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      currentUser = data.user;
      localStorage.setItem("lifeline_hms_user", JSON.stringify(currentUser));
      
      // Update UI & load DB
      document.getElementById("auth-screen").style.display = "none";
      document.querySelector(".app-container").style.display = "flex";
      document.getElementById("header-user-name").textContent = currentUser.name;
      document.getElementById("header-user-role").textContent = currentUser.role;
      
      applyRoleBasedAccess(currentUser.role);
      await initDatabase();
      formLogin.reset();
      
      addLog(`${currentUser.name} (${currentUser.role}) logged in.`, "info");
    } catch (err) {
      loginErrorMsg.textContent = err.message;
      loginErrorMsg.style.display = "block";
    }
  });

  // Register submit
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerErrorMsg.style.display = "none";
    
    const name = document.getElementById("register-name").value.trim();
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Log in automatically after registration
      currentUser = data.user;
      localStorage.setItem("lifeline_hms_user", JSON.stringify(currentUser));
      
      // Update UI & load DB
      document.getElementById("auth-screen").style.display = "none";
      document.querySelector(".app-container").style.display = "flex";
      document.getElementById("header-user-name").textContent = currentUser.name;
      document.getElementById("header-user-role").textContent = currentUser.role;
      
      applyRoleBasedAccess(currentUser.role);
      await initDatabase();
      formRegister.reset();
      
      addLog(`New staff user registered and logged in: ${currentUser.name} (${currentUser.role}).`, "success");
    } catch (err) {
      registerErrorMsg.textContent = err.message;
      registerErrorMsg.style.display = "block";
    }
  });

  // Log out button
  document.getElementById("btn-logout").addEventListener("click", () => {
    if (currentUser) {
      addLog(`${currentUser.name} logged out.`, "info");
    }
    currentUser = null;
    localStorage.removeItem("lifeline_hms_user");
    
    document.getElementById("auth-screen").style.display = "flex";
    document.querySelector(".app-container").style.display = "none";
    
    loginErrorMsg.style.display = "none";
    registerErrorMsg.style.display = "none";
    formLogin.reset();
    formRegister.reset();
  });
}

// Database Handling
async function initDatabase() {
  try {
    const pResponse = await fetch('/api/patients');
    patients = await pResponse.json();
    upgradeDatabaseSchema();
    
    const lResponse = await fetch('/api/logs');
    logs = await lResponse.json();
    
    renderActivityLog();
    renderAllQueues();
    if (document.querySelector(".nav-item.active") && document.querySelector(".nav-item.active").getAttribute("data-view") === "registry") {
      renderRegistryTable();
    }
  } catch (err) {
    console.warn("API database connection failed, falling back to LocalStorage...", err);
    let storedPatients = localStorage.getItem("lifeline_hms_patients");
    let storedLogs = localStorage.getItem("lifeline_hms_logs");
    
    // Migration path: if new keys don't exist, check for old keys
    if (!storedPatients && !storedLogs) {
      const oldPatients = localStorage.getItem("apex_hms_patients");
      const oldLogs = localStorage.getItem("apex_hms_logs");
      if (oldPatients || oldLogs) {
        if (oldPatients) {
          localStorage.setItem("lifeline_hms_patients", oldPatients);
          storedPatients = oldPatients;
          localStorage.removeItem("apex_hms_patients");
        }
        if (oldLogs) {
          localStorage.setItem("lifeline_hms_logs", oldLogs);
          storedLogs = oldLogs;
          localStorage.removeItem("apex_hms_logs");
        }
      }
    }
    
    if (storedPatients) {
      patients = JSON.parse(storedPatients);
      upgradeDatabaseSchema();
    } else {
      patients = [...mockPatients];
      localStorage.setItem("lifeline_hms_patients", JSON.stringify(patients));
    }
    
    if (storedLogs) {
      logs = JSON.parse(storedLogs);
    } else {
      logs = [...mockLogs];
      localStorage.setItem("lifeline_hms_logs", JSON.stringify(logs));
    }
    
    renderActivityLog();
  }
}

function saveDatabase() {
  localStorage.setItem("lifeline_hms_patients", JSON.stringify(patients));
  localStorage.setItem("lifeline_hms_logs", JSON.stringify(logs));
}

async function updatePatientRecord(p) {
  try {
    const res = await fetch(`/api/patients/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    if (!res.ok) throw new Error("Update failed");
    // Refresh memory cache
    const pResponse = await fetch('/api/patients');
    patients = await pResponse.json();
    return true;
  } catch (err) {
    console.warn("Failed to sync patient with server, falling back to local storage:", err);
    saveDatabase();
    return false;
  }
}

// Navigation View Controller
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view-panel");
  const viewTitle = document.getElementById("view-title");
  const viewSubtitle = document.getElementById("view-subtitle");
  
  const viewDetails = {
    receptionist: {
      title: "Reception Desk",
      subtitle: "Phase 1: Patient registration, check-in and vitals collection."
    },
    'billing-consult': {
      title: "Consultation Billing Desk",
      subtitle: "Phase 1: Review and collect consultation/visiting fees for registered patients."
    },
    'billing-meds': {
      title: "Pharmacy Billing Desk",
      subtitle: "Phase 3: Review and collect prescription medication payments."
    },
    'doc-queue': {
      title: "Doctor's Patient Queue",
      subtitle: "Waiting Patients: Select a patient from the queue or search patient records."
    },
    'doc-complaints': {
      title: "Patient Complaints",
      subtitle: "Consultation Step 1: Vitals review and present complaints (symptoms)."
    },
    'doc-history': {
      title: "Patient Past History",
      subtitle: "Consultation Step 2: Patient's past medical history and family history."
    },
    'doc-diagnosis': {
      title: "Patient Diagnosis",
      subtitle: "Consultation Step 3: Physical & chest examination and primary diagnosis."
    },
    'doc-meds': {
      title: "Medications & Remedies",
      subtitle: "Consultation Step 4: Add medications and formulate prescription."
    },
    'doc-tests': {
      title: "Scans & Diagnostic Tests",
      subtitle: "Consultation Step 5: Select radiology/laboratory investigations and finalize visit."
    },
    pharmacy: {
      title: "Medical Dispensary",
      subtitle: "Phase 3: Verify prescriptions, dispense medicines, and close pharmacy orders."
    },
    radiology: {
      title: "Radiology & Diagnostics",
      subtitle: "Phase 3: Conduct ordered scans/tests and log diagnostic findings."
    },
    registry: {
      title: "Central Patient Registry",
      subtitle: "Archival Record: Complete access to electronic health records (EHR) of all patients."
    },
    'staff-mgmt': {
      title: "Staff Management Console",
      subtitle: "Admin Panel: View clinic personnel details and manage registered credentials."
    }
  };
  
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      if (item.classList.contains("disabled-nav")) {
        return;
      }
      
      const viewName = item.getAttribute("data-view");
      
      // Enforce role-based permission
      if (currentUser) {
        const expectedRole = getRoleForView(viewName);
        if (currentUser.role !== expectedRole) {
          console.warn(`Access denied for role ${currentUser.role} to view ${viewName}`);
          return;
        }
      }
      
      // Toggle nav active classes
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      
      // Toggle view panel active classes
      views.forEach(view => view.classList.remove("active"));
      document.getElementById(`view-${viewName}`).classList.add("active");
      
      // Update top bar text
      if (viewDetails[viewName]) {
        viewTitle.textContent = viewDetails[viewName].title;
        viewSubtitle.textContent = viewDetails[viewName].subtitle;
      }
      
      // Determine if we are changing main panels or just doctor workflow sub-tabs
      const isDoctorSubTab = ['doc-queue', 'doc-complaints', 'doc-history', 'doc-diagnosis', 'doc-meds', 'doc-tests'].includes(viewName);
      
      if (!isDoctorSubTab && viewName !== "registry" && viewName !== "staff-mgmt") {
        deselectAllViews();
        renderAllQueues();
      } else if (viewName === "registry") {
        deselectAllViews();
        renderRegistryTable();
      } else if (viewName === "staff-mgmt") {
        deselectAllViews();
        renderStaffMgmtTable();
      } else {
        // Switching between doctor subtabs
        if (viewName === "doc-meds") {
          renderDoctorPrescriptionMeds();
        }
      }
    });
  });
}

function deselectAllViews() {
  activeConsultationPatient = null;
  activePharmacyPatient = null;
  activeRadiologyPatient = null;
  activeBillingPatient = null;
  currentPrescriptionMeds = [];
  
  // Hide all patient banners
  document.querySelectorAll(".active-patient-banner").forEach(el => {
    el.style.display = "none";
    el.innerHTML = "";
  });
  
  // Reset all consultation inputs
  const symptomsInput = document.getElementById("doc-symptoms");
  if (symptomsInput) symptomsInput.value = "";
  const prevHistoryInput = document.getElementById("doc-prev-history");
  if (prevHistoryInput) prevHistoryInput.value = "";
  const familyHistoryInput = document.getElementById("doc-family-history");
  if (familyHistoryInput) familyHistoryInput.value = "";
  const examInput = document.getElementById("doc-exam");
  if (examInput) examInput.value = "";
  const diagnosisInput = document.getElementById("doc-diagnosis");
  if (diagnosisInput) diagnosisInput.value = "";

  // Reset medicine inputs
  const medName = document.getElementById("med-name-input");
  if (medName) medName.value = "";
  const medDose = document.getElementById("med-dose-input");
  if (medDose) medDose.value = "";
  const medFreq = document.getElementById("med-freq-input");
  if (medFreq) medFreq.value = "";
  const medDur = document.getElementById("med-dur-input");
  if (medDur) medDur.value = "";
  
  // Clear lab report checkboxes
  document.querySelectorAll('input[name="lab-report"]').forEach(cb => cb.checked = false);

  // Disable consultation tabs on doctor menu
  document.querySelectorAll("#doctor-nav-menu .nav-item[data-view^='doc-']").forEach(item => {
    if (item.getAttribute("data-view") !== "doc-queue") {
      item.classList.add("disabled-nav");
    }
  });

  // Billing Desk reset
  const billConsultCard = document.getElementById("billing-details-consult-card");
  if (billConsultCard) billConsultCard.style.display = "none";
  const billConsultPlaceholder = document.getElementById("billing-placeholder-consult-card");
  if (billConsultPlaceholder) billConsultPlaceholder.style.display = "block";

  const billMedsCard = document.getElementById("billing-details-meds-card");
  if (billMedsCard) billMedsCard.style.display = "none";
  const billMedsPlaceholder = document.getElementById("billing-placeholder-meds-card");
  if (billMedsPlaceholder) billMedsPlaceholder.style.display = "block";

  // Pharmacy & Radiology views reset
  const phCard = document.getElementById("pharmacy-dispense-card");
  if (phCard) phCard.style.display = "none";
  const phPlaceholder = document.getElementById("pharmacy-placeholder-card");
  if (phPlaceholder) phPlaceholder.style.display = "block";
  
  const radCard = document.getElementById("radiology-report-card");
  if (radCard) radCard.style.display = "none";
  const radPlaceholder = document.getElementById("radiology-placeholder-card");
  if (radPlaceholder) radPlaceholder.style.display = "block";
  
  const regCard = document.getElementById("registry-detail-card");
  if (regCard) regCard.classList.remove("active");

  document.querySelectorAll(".pharmacy-tab").forEach((btn, idx) => {
    if (idx === 0) {
      btn.classList.add("btn-primary", "active");
      btn.classList.remove("btn-secondary");
    } else {
      btn.classList.remove("btn-primary", "active");
      btn.classList.add("btn-secondary");
    }
  });
  const phActivePane = document.getElementById("ph-active-pane");
  if (phActivePane) phActivePane.style.display = "block";
  const phRefillPane = document.getElementById("ph-refill-pane");
  if (phRefillPane) phRefillPane.style.display = "none";
  const phCustomPane = document.getElementById("ph-custom-pane");
  if (phCustomPane) phCustomPane.style.display = "none";
}

// Event Listeners setup
function setupEventListeners() {
  // Doctor Redirect Buttons
  document.querySelectorAll(".btn-redirect").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const navItem = document.querySelector(`.nav-item[data-view="${target}"]`);
      if (navItem) {
        navItem.click();
      }
    });
  });

  // Clinical Workflow Next Tab Buttons
  document.querySelectorAll(".btn-next-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextView = btn.getAttribute("data-next");
      const targetNav = document.getElementById(`nav-${nextView}`);
      if (targetNav) {
        targetNav.click();
      } else {
        // Find by data-view attribute
        const subNav = document.querySelector(`#doctor-nav-menu .nav-item[data-view='${nextView}']`);
        if (subNav) subNav.click();
      }
    });
  });

  // Clinical Visit History Modal Close Button
  const btnClosePastModal = document.getElementById("btn-close-past-modal");
  if (btnClosePastModal) {
    btnClosePastModal.addEventListener("click", () => {
      const modal = document.getElementById("past-visits-modal");
      if (modal) modal.style.display = "none";
    });
  }

  // Clear DB Button
  document.getElementById("btn-clear-db").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset the database? All custom inputs will be lost.")) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (!res.ok) throw new Error("Reset failed");
        await initDatabase();
        deselectAllViews();
        alert("Database reset completed successfully!");
      } catch (err) {
        console.warn("Server reset failed, falling back to LocalStorage:", err);
        localStorage.removeItem("lifeline_hms_patients");
        localStorage.removeItem("lifeline_hms_logs");
        localStorage.removeItem("apex_hms_patients");
        localStorage.removeItem("apex_hms_logs");
        patients = [...mockPatients];
        logs = [...mockLogs];
        saveDatabase();
        deselectAllViews();
        renderAllQueues();
        renderRegistryTable();
        renderActivityLog();
        addLog("Database reset to factory settings.", "danger");
        alert("Database reset completed successfully!");
      }
    }
  });

  // Receptionist Tab switching
  document.querySelectorAll(".reception-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".reception-tab").forEach(b => {
        b.classList.remove("btn-primary", "active");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active");
      
      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".reception-tab-pane").forEach(pane => {
        pane.style.display = pane.id === `${tab}-tab-pane` ? "block" : "none";
      });
      
      const viewTitle = document.getElementById("view-title");
      const viewSubtitle = document.getElementById("view-subtitle");
      if (tab === "intake") {
        viewTitle.textContent = "Reception Desk";
        viewSubtitle.textContent = "Phase 1: Patient registration, check-in and vitals collection.";
      } else {
        viewTitle.textContent = "Reception Billing Desk";
        viewSubtitle.textContent = "Phase 1 / 3: Collect consultation fees and process pharmacy prescription payments.";
      }
    });
  });

  // Pharmacy Tab switching
  document.querySelectorAll(".pharmacy-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pharmacy-tab").forEach(b => {
        b.classList.remove("btn-primary", "active");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active");
      
      const tab = btn.getAttribute("data-tab");
      const paneIds = {
        "active-queue": "ph-active-pane",
        "refill-desk": "ph-refill-pane",
        "custom-rx": "ph-custom-pane"
      };
      
      document.querySelectorAll(".pharmacy-tab-pane").forEach(pane => {
        pane.style.display = pane.id === paneIds[tab] ? "block" : "none";
      });

      const viewTitle = document.getElementById("view-title");
      const viewSubtitle = document.getElementById("view-subtitle");
      if (tab === "active-queue") {
        viewTitle.textContent = "Medical Dispensary";
        viewSubtitle.textContent = "Phase 3: Verify prescriptions, dispense medicines, and close pharmacy orders.";
        renderPharmacyQueue();
      } else if (tab === "refill-desk") {
        viewTitle.textContent = "Medical Dispensary - Refill & Re-issue";
        viewSubtitle.textContent = "Reload past patient visit records to re-issue prescriptions and skip consultation queue.";
      } else {
        viewTitle.textContent = "Medical Dispensary - Custom Prescription";
        viewSubtitle.textContent = "Formulate a custom prescription sheet directly from the pharmacy medicines directory.";
        renderCustomMedsDirectory();
      }
    });
  });

  // Initialize Pharmacy Refill Registry Events
  setupPharmacyRefillEvents();

  // Phase 1: Receptionist Intake Form Submission
  const intakeForm = document.getElementById("reception-intake-form");
  intakeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("p-name").value;
    const age = parseInt(document.getElementById("p-age").value);
    const gender = document.getElementById("p-gender").value;
    const phone = document.getElementById("p-phone").value;
    const blood = document.getElementById("p-blood").value;
    
    const temp = parseFloat(document.getElementById("v-temp").value);
    const weight = parseFloat(document.getElementById("v-weight").value);
    const bp = document.getElementById("v-bp").value;
    const pulse = parseInt(document.getElementById("v-pulse").value);
    
    const currentDateTime = getFormattedDateTime();
    const vitals = { temp, weight, bp, pulse };

    // Reset matched state UI
    matchedPatientForIntake = null;
    document.getElementById("reception-match-alert").style.display = "none";

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, phone, bloodGroup: blood, vitals })
      });
      
      if (!response.ok) throw new Error('Server intake failed');
      
      await initDatabase();
      intakeForm.reset();
    } catch (err) {
      console.warn("Server intake failed, falling back to local storage...", err);
      const newVisit = {
        date: currentDateTime,
        examDate: "",
        vitals,
        symptoms: "",
        prevHistory: "",
        diagnosis: "",
        medicines: [],
        reports: [],
        status: "waiting",
        needsPharmacy: false,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: false,
        medicinesBillPaid: false,
        medicinesBillAmount: 0
      };

      let p = patients.find(pat => pat.phone === phone || pat.name.toLowerCase() === name.toLowerCase());
      if (p) {
        p.age = age;
        p.phone = phone;
        p.bloodGroup = blood;
        const lastVisit = getCurrentVisit(p);
        if (lastVisit) {
          newVisit.prevHistory = lastVisit.prevHistory || lastVisit.diagnosis || "";
        }
        p.visits.push(newVisit);
        p.logs.push(`New check-in on ${currentDateTime} with vitals: Temp ${temp}°F, BP ${bp}, Pulse ${pulse}bpm.`);
        addLog(`Returning patient ${p.name} (${p.id}) checked in.`, "success");
      } else {
        const newId = `PAT-${1000 + patients.length + 1}`;
        p = {
          id: newId,
          name,
          age,
          gender,
          phone,
          bloodGroup: blood,
          visits: [newVisit],
          logs: [`Registered at reception on ${currentDateTime} with vitals: Temp ${temp}°F, BP ${bp}.`]
        };
        patients.push(p);
        addLog(`New patient registered: ${name} (${newId}).`, "success");
      }
      saveDatabase();
      intakeForm.reset();
      renderAllQueues();
    }
  });

  // Phase 2: Doctor Search Input
  const docSearch = document.getElementById("doctor-search-input");
  docSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const searchResultsDiv = document.getElementById("doctor-search-results");
    
    if (query === "") {
      searchResultsDiv.style.display = "none";
      searchResultsDiv.innerHTML = "";
      return;
    }
    
    const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    );
    
    searchResultsDiv.innerHTML = "";
    searchResultsDiv.style.display = "flex";
    
    if (filtered.length === 0) {
      searchResultsDiv.innerHTML = `<div class="no-data" style="padding:1rem;">No matching patients found.</div>`;
      return;
    }
    
    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "patient-card";
      card.style.padding = "0.75rem 1rem";
      card.style.borderColor = "rgba(6, 182, 212, 0.2)";
      card.innerHTML = `
        <div class="patient-info">
          <div class="patient-header">
            <span class="patient-name">${p.name}</span>
            <span class="patient-id">${p.id}</span>
            ${getStatusBadge(p)}
          </div>
          <div class="patient-meta">${p.gender}, ${p.age} years | Contact: ${maskPhone(p.phone)}</div>
        </div>
        <button class="btn btn-primary btn-sm btn-select-search-patient" data-id="${p.id}">Select</button>
      `;
      searchResultsDiv.appendChild(card);
    });
    
    // Add selectors
    document.querySelectorAll(".btn-select-search-patient").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        selectPatientForConsultation(id);
        docSearch.value = "";
        searchResultsDiv.style.display = "none";
      });
    });
  });

  // Doctor: Deselect button
  const btnCloseConsultation = document.getElementById("btn-close-consultation");
  if (btnCloseConsultation) {
    btnCloseConsultation.addEventListener("click", () => {
      deselectAllViews();
    });
  }

  // Doctor: Add Medicine to prescription
  document.getElementById("btn-add-med").addEventListener("click", () => {
    const name = document.getElementById("med-name-input").value.trim();
    const dose = document.getElementById("med-dose-input").value.trim();
    const freq = document.getElementById("med-freq-input").value.trim();
    const dur = document.getElementById("med-dur-input").value.trim();
    
    if (!name) {
      alert("Please enter medicine name.");
      return;
    }
    
    currentPrescriptionMeds.push({
      name,
      dose: dose || "N/A",
      freq: freq || "1-0-1",
      dur: dur || "5 Days",
      dispensed: false
    });
    
    // Clear inputs
    document.getElementById("med-name-input").value = "";
    document.getElementById("med-dose-input").value = "";
    document.getElementById("med-freq-input").value = "";
    document.getElementById("med-dur-input").value = "";
    
    renderDoctorPrescriptionMeds();
  });

  // Doctor: Submit Consultation Form (Phase 2 -> Phase 3 transition)
  const btnSubmitConsultation = document.getElementById("btn-submit-consultation");
  if (btnSubmitConsultation) {
    btnSubmitConsultation.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!activeConsultationPatient) return;
      
      const symptoms = document.getElementById("doc-symptoms").value.trim();
      const prevHistory = document.getElementById("doc-prev-history").value.trim();
      const familyHistory = document.getElementById("doc-family-history").value.trim();
      const physicalExam = document.getElementById("doc-exam").value.trim();
      const diagnosis = document.getElementById("doc-diagnosis").value.trim();
      
      if (!symptoms) {
        alert("Please enter patient symptoms / complaints first!");
        const tab = document.getElementById("nav-doc-complaints");
        if (tab) tab.click();
        return;
      }
      
      if (!diagnosis) {
        alert("Please enter diagnosis notes first!");
        const tab = document.getElementById("nav-doc-diagnosis");
        if (tab) tab.click();
        return;
      }
      
      // Gather ordered reports
      const reportCheckboxes = document.querySelectorAll("input[name='lab-report']:checked");
      const orderedReportsList = [];
      reportCheckboxes.forEach(cb => {
        orderedReportsList.push({
          name: cb.value,
          status: "pending",
          findings: ""
        });
      });
      
      // Update Patient Active Visit Object
      const p = patients.find(pat => pat.id === activeConsultationPatient.id);
      const cv = getCurrentVisit(p);
      
      cv.symptoms = symptoms;
      cv.prevHistory = prevHistory;
      cv.familyHistory = familyHistory;
      cv.physicalExam = physicalExam;
      cv.diagnosis = diagnosis;
      cv.medicines = [...currentPrescriptionMeds];
      cv.reports = orderedReportsList;
      cv.examDate = getFormattedDateTime();
      
      // State machine logic for Phase 3 redirection
      cv.needsPharmacy = cv.medicines.length > 0;
      cv.needsRadiology = cv.reports.length > 0;
      cv.pharmacyDispensed = false;
      cv.radiologyCompleted = false;
      
      p.logs.push(`Doctor completed consultation. Diagnosis: ${diagnosis.slice(0,40)}...`);
      
      if (cv.needsPharmacy && cv.needsRadiology) {
        cv.status = "pending_pharmacy_radiology";
        p.logs.push("Sent to Pharmacy & Radiology Lab.");
        await addLog(`Dr. finished consulting ${p.name}. Sent to Pharmacy & Radiology.`, "info");
      } else if (cv.needsPharmacy) {
        cv.status = "pending_pharmacy";
        p.logs.push("Sent to Medical Pharmacy.");
        await addLog(`Dr. finished consulting ${p.name}. Sent to Pharmacy.`, "info");
      } else if (cv.needsRadiology) {
        cv.status = "pending_radiology";
        p.logs.push("Sent to Radiology Lab.");
        await addLog(`Dr. finished consulting ${p.name}. Sent to Radiology.`, "info");
      } else {
        cv.status = "completed";
        p.logs.push("Treatment finalized. Discharged.");
        await addLog(`Dr. finalized patient ${p.name}. Discharged directly.`, "success");
      }
      
      await updatePatientRecord(p);
      deselectAllViews();
      renderAllQueues();
      
      // Switch back to patient queue tab
      const queueNav = document.querySelector("#doctor-nav-menu .nav-item[data-view='doc-queue']");
      if (queueNav) queueNav.click();
    });
  }

  // Phase 3: Pharmacy deselect
  document.getElementById("btn-close-pharmacy").addEventListener("click", () => {
    deselectAllViews();
  });

  // Phase 3: Pharmacy dispense submit
  document.getElementById("btn-dispense-submit").addEventListener("click", async () => {
    if (!activePharmacyPatient) return;
    
    const checkBoxes = document.querySelectorAll(".pharmacy-med-cb");
    const p = patients.find(pat => pat.id === activePharmacyPatient.id);
    const cv = getCurrentVisit(p);
    
    let allChecked = true;
    checkBoxes.forEach((cb, index) => {
      const isDispensed = cb.checked;
      cv.medicines[index].dispensed = isDispensed;
      if (!isDispensed) allChecked = false;
    });
    
    if (!allChecked) {
      if (!confirm("Some medicines are not checked. Dispense selected only?")) {
        return;
      }
    }
    
    cv.pharmacyDispensed = true;
    p.logs.push("Prescribed medicines successfully dispensed by pharmacist.");
    
    // Evaluate transition
    if (cv.needsRadiology && !cv.radiologyCompleted) {
      cv.status = "pending_radiology";
      await addLog(`Pharmacy dispensed medicines for ${p.name}. Radiology scan still pending.`, "warning");
    } else {
      cv.status = "completed";
      await addLog(`Pharmacy complete for ${p.name}. Cycle completed successfully.`, "success");
    }
    
    await updatePatientRecord(p);
    deselectAllViews();
    renderAllQueues();
  });

  // Phase 3: Radiology deselect
  document.getElementById("btn-close-radiology").addEventListener("click", () => {
    deselectAllViews();
  });

  // Phase 3: Radiology findings submit
  const radForm = document.getElementById("radiology-reports-form");
  radForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeRadiologyPatient) return;
    
    const p = patients.find(pat => pat.id === activeRadiologyPatient.id);
    const cv = getCurrentVisit(p);
    
    // Read textarea findings
    cv.reports.forEach((rep, index) => {
      const findingsTextarea = document.getElementById(`rad-findings-${index}`);
      rep.findings = findingsTextarea.value.trim() || "No significant abnormalities detected.";
      rep.status = "completed";
    });
    
    cv.radiologyCompleted = true;
    p.logs.push("Diagnostic reports generated and signed by Radiologist.");
    
    // Evaluate transition
    if (cv.needsPharmacy && !cv.pharmacyDispensed) {
      cv.status = "pending_pharmacy";
      await addLog(`Radiologist submitted reports for ${p.name}. Pharmacy meds still pending.`, "warning");
    } else {
      cv.status = "completed";
      await addLog(`Radiology findings uploaded for ${p.name}. Cycle completed successfully.`, "success");
    }
    
    await updatePatientRecord(p);
    deselectAllViews();
    renderAllQueues();
  });

  // Print Prescription Button in Pharmacy
  document.getElementById("btn-print-prescription").addEventListener("click", () => {
    if (!activePharmacyPatient) return;
    const cv = getCurrentVisit(activePharmacyPatient);
    triggerPrescriptionPrint(activePharmacyPatient, cv);
  });

  // Print Visit Details Button in Central Registry
  document.getElementById("btn-print-registry-prescription").addEventListener("click", () => {
    const patientId = document.getElementById("reg-patient-id").textContent;
    const p = patients.find(pat => pat.id === patientId);
    if (!p) return;
    
    const selector = document.getElementById("reg-visit-selector");
    const visitIndex = parseInt(selector.value);
    const visit = p.visits[visitIndex];
    if (!visit) return;
    
    triggerPrescriptionPrint(p, visit);
  });

  // Central Registry Search Input
  const regSearch = document.getElementById("registry-search-input");
  regSearch.addEventListener("input", () => {
    renderRegistryTable();
  });

  // Central Registry Detail Card Close
  document.getElementById("btn-close-registry-detail").addEventListener("click", () => {
    document.getElementById("registry-detail-card").classList.remove("active");
  });
}

// Reception returning-patient search setup
function setupReceptionSearch() {
  const recSearch = document.getElementById("reception-search-input");
  const recSearchResults = document.getElementById("reception-search-results");
  const matchAlert = document.getElementById("reception-match-alert");
  const matchDisplay = document.getElementById("matched-patient-display");
  const btnCancelMatch = document.getElementById("btn-cancel-match");

  recSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === "") {
      recSearchResults.style.display = "none";
      recSearchResults.innerHTML = "";
      return;
    }

    const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.id.toLowerCase().includes(query) || 
      p.phone.includes(query)
    );

    recSearchResults.innerHTML = "";
    recSearchResults.style.display = "flex";

    if (filtered.length === 0) {
      recSearchResults.innerHTML = `<div class="no-data" style="padding:1rem;">No matching registered patients.</div>`;
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "patient-card";
      card.style.padding = "0.75rem 1rem";
      card.style.borderColor = "rgba(6, 182, 212, 0.2)";
      card.innerHTML = `
        <div class="patient-info">
          <div class="patient-header">
            <span class="patient-name">${p.name}</span>
            <span class="patient-id">${p.id}</span>
          </div>
          <div class="patient-meta">${p.gender}, ${p.age} years | Phone: ${maskPhone(p.phone)}</div>
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-match-select" data-id="${p.id}">Match & Fill</button>
      `;
      recSearchResults.appendChild(card);
    });

    document.querySelectorAll(".btn-match-select").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const p = patients.find(pat => pat.id === id);
        if (p) {
          matchedPatientForIntake = p;
          
          // Pre-fill fields
          document.getElementById("p-name").value = p.name;
          document.getElementById("p-age").value = p.age;
          document.getElementById("p-gender").value = p.gender;
          document.getElementById("p-phone").value = p.phone;
          document.getElementById("p-blood").value = p.bloodGroup;
          
          // Show alert banner
          matchDisplay.textContent = `${p.name} (${p.id})`;
          matchAlert.style.display = "flex";
          
          // Clear and collapse search
          recSearch.value = "";
          recSearchResults.style.display = "none";
          
          addLog(`Selected and loaded returning patient ${p.name} record.`, "info");
        }
      });
    });
  });

  btnCancelMatch.addEventListener("click", () => {
    matchedPatientForIntake = null;
    matchAlert.style.display = "none";
    document.getElementById("reception-intake-form").reset();
    addLog("Patient matching cleared.", "info");
  });
}

// Global Log System
async function addLog(text, type = "info") {
  const time = new Date().toLocaleTimeString();
  const logItem = { text, type, time };
  logs.unshift(logItem); // Insert at beginning
  
  if (logs.length > 50) {
    logs.pop();
  }
  
  saveDatabase();
  renderActivityLog();
  
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type })
    });
  } catch (err) {
    console.warn("Failed to sync log with server:", err);
  }
}

function renderActivityLog() {
  const container = document.getElementById("activity-scroll-area");
  if (!container) return;
  container.innerHTML = "";
  
  if (logs.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">No recent activity.</div>`;
    return;
  }
  
  logs.forEach(log => {
    let markerClass = "marker-info";
    if (log.type === "success") markerClass = "marker-success";
    if (log.type === "warning") markerClass = "marker-warning";
    if (log.type === "danger") markerClass = "marker-danger";
    
    const div = document.createElement("div");
    div.className = "activity-item";
    div.innerHTML = `
      <span class="activity-marker ${markerClass}"></span>
      <div style="flex-grow:1;">
        <p style="color:var(--text-primary); margin-bottom: 0.1rem;">${log.text}</p>
        <span class="activity-time">${log.time}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// Helper to check for high/abnormal vitals
function getVitalAlertClass(type, val) {
  if (type === "temp") {
    return val > 99.5 || val < 96.0 ? "border-color: var(--color-danger); box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);" : "";
  }
  if (type === "pulse") {
    return val > 100 || val < 60 ? "border-color: var(--color-warning); box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);" : "";
  }
  if (type === "bp") {
    const sys = parseInt(val.split("/")[0]);
    const dia = parseInt(val.split("/")[1]);
    return sys > 135 || dia > 88 || sys < 90 || dia < 55 ? "border-color: var(--color-brand); box-shadow: 0 0 10px rgba(79, 70, 229, 0.15);" : "";
  }
  return "";
}

// Queue Rendering for all departments
function renderAllQueues() {
  renderReceptionQueue();
  renderDoctorQueue();
  renderPharmacyQueue();
  renderRadiologyQueue();
  renderBillingQueue();
  updateDashboardStats();
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// 1. Reception Desk Queue
function renderReceptionQueue() {
  const container = document.getElementById("reception-queue");
  container.innerHTML = "";
  
  const activeWaiting = patients.filter(p => getCurrentVisit(p).status === "WAITING_FOR_DOCTOR");
  
  if (activeWaiting.length === 0) {
    container.innerHTML = `<div class="no-data">Queue is currently empty.</div>`;
    return;
  }
  
  activeWaiting.forEach(p => {
    const cv = getCurrentVisit(p);
    const card = document.createElement("div");
    card.className = "patient-card";
    card.innerHTML = `
      <div class="patient-info">
        <div class="patient-header">
          <span class="patient-name">${p.name}</span>
          <span class="patient-id">${p.id}</span>
        </div>
        <div class="patient-meta">${p.gender}, ${p.age}y | BP: ${cv.vitals.bp}</div>
      </div>
      <div class="patient-actions">
        <span class="badge badge-waiting">Waiting</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// 2. Doctor Consultation Queue
function renderDoctorQueue() {
  const container = document.getElementById("doctor-queue");
  container.innerHTML = "";
  
  const doctorWaiting = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.status === "WAITING_FOR_DOCTOR" && cv.consultationPaid === true;
  });
  
  if (doctorWaiting.length === 0) {
    container.innerHTML = `<div class="no-data">No patients waiting.</div>`;
    return;
  }
  
  doctorWaiting.forEach(p => {
    const cv = getCurrentVisit(p);
    const card = document.createElement("div");
    card.className = "patient-card";
    
    if (activeConsultationPatient && activeConsultationPatient.id === p.id) {
      card.style.borderColor = "var(--color-brand)";
      card.style.backgroundColor = "rgba(79, 70, 229, 0.05)";
    }
    
    card.innerHTML = `
      <div class="patient-info">
        <div class="patient-header">
          <span class="patient-name">${p.name}</span>
          <span class="patient-id">${p.id}</span>
        </div>
        <div class="patient-meta">BP: ${cv.vitals.bp} | Pulse: ${cv.vitals.pulse} bpm</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-primary btn-sm btn-doctor-select" data-id="${p.id}">Examine</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  document.querySelectorAll(".btn-doctor-select").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      selectPatientForConsultation(id);
    });
  });
}

function selectPatientForConsultation(id) {
  const p = patients.find(pat => pat.id === id);
  if (!p) return;
  
  activeConsultationPatient = p;
  currentPrescriptionMeds = [];
  const cv = getCurrentVisit(p);
  
  // Update active patient banners across all panels
  updateActivePatientBanners(p);

  // Enable all consultation tabs on doctor menu
  document.querySelectorAll("#doctor-nav-menu .nav-item[data-view^='doc-']").forEach(item => {
    item.classList.remove("disabled-nav");
  });

  // Load vitals into complaints panel
  const tCard = document.getElementById("doc-vital-temp");
  if (tCard) {
    tCard.textContent = `${cv.vitals.temp} °F`;
    tCard.parentElement.setAttribute("style", getVitalAlertClass("temp", cv.vitals.temp));
  }
  const wCard = document.getElementById("doc-vital-weight");
  if (wCard) {
    wCard.textContent = `${cv.vitals.weight} kg`;
  }
  const bpCard = document.getElementById("doc-vital-bp");
  if (bpCard) {
    bpCard.textContent = cv.vitals.bp;
    bpCard.parentElement.setAttribute("style", getVitalAlertClass("bp", cv.vitals.bp));
  }
  const pCard = document.getElementById("doc-vital-pulse");
  if (pCard) {
    pCard.textContent = `${cv.vitals.pulse} bpm`;
    pCard.parentElement.setAttribute("style", getVitalAlertClass("pulse", cv.vitals.pulse));
  }
  
  // Load input notes
  const symptomsInput = document.getElementById("doc-symptoms");
  if (symptomsInput) symptomsInput.value = cv.symptoms || "";
  const prevHistoryInput = document.getElementById("doc-prev-history");
  if (prevHistoryInput) prevHistoryInput.value = cv.prevHistory || "";
  const familyHistoryInput = document.getElementById("doc-family-history");
  if (familyHistoryInput) familyHistoryInput.value = cv.familyHistory || "";
  const examInput = document.getElementById("doc-exam");
  if (examInput) examInput.value = cv.physicalExam || "";
  const diagnosisInput = document.getElementById("doc-diagnosis");
  if (diagnosisInput) diagnosisInput.value = cv.diagnosis || "";
  
  // Reset medicine inputs
  const medName = document.getElementById("med-name-input");
  if (medName) medName.value = "";
  const medDose = document.getElementById("med-dose-input");
  if (medDose) medDose.value = "";
  const medFreq = document.getElementById("med-freq-input");
  if (medFreq) medFreq.value = "";
  const medDur = document.getElementById("med-dur-input");
  if (medDur) medDur.value = "";

  // Reset check list
  document.querySelectorAll("input[name='lab-report']").forEach(cb => {
    cb.checked = false;
  });

  renderDoctorPrescriptionMeds();
  renderDoctorQueue();

  // Switch to complaints tab automatically to begin consultation
  const complaintsNav = document.getElementById("nav-doc-complaints");
  if (complaintsNav) {
    complaintsNav.click();
  }
}

function updateActivePatientBanners(p) {
  const banners = document.querySelectorAll(".active-patient-banner");
  if (banners.length === 0) return;

  if (!p) {
    banners.forEach(b => {
      b.style.display = "none";
      b.innerHTML = "";
    });
    return;
  }

  const bannerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; width: 100%;">
      <div>
        <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-cyan); font-weight: 700; letter-spacing: 0.5px;">Active Consultation Patient</span>
        <h3 style="margin: 0.1rem 0; font-family: var(--font-display); font-size: 1.3rem; color: #fff;">${p.name}</h3>
        <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-secondary);">
          <span>ID: ${p.id}</span>
          <span>|</span>
          <span>${p.gender}, ${p.age} Years</span>
          <span>|</span>
          <span>Blood Group: ${p.bloodGroup || 'N/A'}</span>
          <span>|</span>
          <span>Contact: ${maskPhone(p.phone)}</span>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <button type="button" class="btn btn-secondary btn-sm btn-show-past-history" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.25); color: #fff;"><i data-lucide="history" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Review Past Visits</button>
        <button type="button" class="btn btn-danger btn-sm btn-deselect-patient" style="padding: 0.4rem 0.75rem;"><i data-lucide="x" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Deselect</button>
      </div>
    </div>
  `;

  banners.forEach(b => {
    b.style.display = "block";
    b.innerHTML = bannerHTML;
  });

  // Attach button click events inside banner
  document.querySelectorAll(".btn-show-past-history").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      openPastVisitsModal(p);
    };
  });

  document.querySelectorAll(".btn-deselect-patient").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      deselectAllViews();
      // Switch back to patient queue
      const queueNav = document.querySelector("#doctor-nav-menu .nav-item[data-view='doc-queue']");
      if (queueNav) queueNav.click();
    };
  });

  // Render icons
  lucide.createIcons();
}

function openPastVisitsModal(p) {
  const modal = document.getElementById("past-visits-modal");
  const container = document.getElementById("past-visits-modal-content");
  if (!modal || !container) return;

  modal.style.display = "flex";
  container.innerHTML = "";

  // All visits except the current one (which is the last one in p.visits)
  const pastVisits = p.visits.slice(0, -1);

  if (pastVisits.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
        <i data-lucide="info" style="width: 32px; height: 32px; margin-bottom: 0.5rem; color: var(--text-muted);"></i>
        <p>No previous visit records found for this patient.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Display from newest to oldest
  [...pastVisits].reverse().forEach((visit) => {
    const card = document.createElement("div");
    card.style.background = "rgba(255, 255, 255, 0.02)";
    card.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    card.style.borderRadius = "var(--radius-md)";
    card.style.padding = "1rem";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "0.5rem";

    const medsText = visit.medicines && visit.medicines.length > 0 
      ? visit.medicines.map(m => `${m.name} (${m.dose} - ${m.frequency})`).join(", ")
      : "None prescribed";

    const reportsText = visit.reports && visit.reports.length > 0
      ? visit.reports.map(r => `${r.name} (${r.status || 'Ordered'})`).join(", ")
      : "None ordered";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
        <span style="font-weight: 700; color: var(--color-cyan); font-size: 0.85rem;">Date: ${visit.date}</span>
        <span style="font-size: 0.75rem; background: rgba(6, 182, 212, 0.15); color: var(--color-cyan); padding: 0.1rem 0.4rem; border-radius: 4px;">Visit Record</span>
      </div>
      <div style="font-size: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
        <div><strong>Vitals:</strong> T: ${visit.vitals ? (visit.vitals.temp || '-') : '-'}°F | BP: ${visit.vitals ? (visit.vitals.bp || '-') : '-'} | P: ${visit.vitals ? (visit.vitals.pulse || '-') : '-'}bpm</div>
        <div><strong>Complaints:</strong> ${visit.symptoms || 'None'}</div>
        <div><strong>Past Medical History:</strong> ${visit.prevHistory || 'None'}</div>
        <div><strong>Family History:</strong> ${visit.familyHistory || 'None'}</div>
        <div><strong>Chest Exam:</strong> ${visit.physicalExam || 'None'}</div>
        <div><strong>Diagnosis:</strong> ${visit.diagnosis || 'None'}</div>
      </div>
      <div style="font-size: 0.8rem; margin-top: 0.25rem; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 0.5rem;">
        <div><strong>Medicines:</strong> <span style="color: var(--color-brand);">${medsText}</span></div>
        <div><strong>Radiology Reports:</strong> <span style="color: var(--color-danger);">${reportsText}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
  lucide.createIcons();
}

function renderDoctorPastVisits(p) {
  const section = document.getElementById("doc-past-visits-section");
  const countSpan = document.getElementById("doc-past-visits-count");
  const listContainer = document.getElementById("doc-past-visits-list");
  
  // Slice out the current active visit (which is the last one)
  const pastVisits = p.visits.slice(0, -1);
  
  if (pastVisits.length === 0) {
    section.style.display = "none";
    return;
  }
  
  section.style.display = "block";
  countSpan.textContent = pastVisits.length;
  listContainer.innerHTML = "";
  
  // Display from newest to oldest
  [...pastVisits].reverse().forEach((visit, index) => {
    const visitCard = document.createElement("div");
    visitCard.className = "visit-record-card";
    visitCard.style.background = "rgba(255,255,255,0.02)";
    visitCard.style.border = "1px solid var(--glass-border)";
    visitCard.style.borderRadius = "var(--radius-sm)";
    visitCard.style.padding = "0.75rem";
    visitCard.style.marginBottom = "0.5rem";
    
    const medsText = visit.medicines.length > 0 
      ? visit.medicines.map(m => `${m.name} (${m.dose})`).join(", ")
      : "None prescribed";
      
    const reportsText = visit.reports.length > 0
      ? visit.reports.map(r => `${r.name}: ${r.findings || 'Pending'}`).join("; ")
      : "None ordered";

    visitCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" class="visit-record-header">
        <span style="font-weight:600; color:var(--color-cyan); font-size:0.85rem;"><i data-lucide="calendar" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>${visit.date}</span>
        <span style="font-size:0.8rem; color:#fff; font-weight: 500;">Diag: <span style="color: var(--color-warning);">${visit.diagnosis || 'N/A'}</span></span>
      </div>
      <div class="visit-record-body" style="margin-top:0.6rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem; font-size:0.8rem; display:none; flex-direction:column; gap:0.45rem;">
        <div><strong style="color:var(--text-secondary);">Vitals:</strong> Temp: ${visit.vitals.temp}°F | BP: ${visit.vitals.bp} | Pulse: ${visit.vitals.pulse} bpm | Weight: ${visit.vitals.weight} kg</div>
        <div><strong style="color:var(--text-secondary);">Complaints:</strong> ${visit.symptoms || 'None recorded'}</div>
        <div><strong style="color:var(--text-secondary);">Past History:</strong> ${visit.prevHistory || 'None recorded'}</div>
        <div><strong style="color:var(--text-secondary);">Diagnosis Notes:</strong> ${visit.diagnosis || 'None'}</div>
        <div><strong style="color:var(--text-secondary);">Prescribed:</strong> ${medsText}</div>
        <div><strong style="color:var(--text-secondary);">Scan Findings:</strong> ${reportsText}</div>
      </div>
    `;
    
    listContainer.appendChild(visitCard);
    
    const header = visitCard.querySelector(".visit-record-header");
    const body = visitCard.querySelector(".visit-record-body");
    header.addEventListener("click", () => {
      if (body.style.display === "none") {
        body.style.display = "flex";
      } else {
        body.style.display = "none";
      }
    });
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function renderDoctorPrescriptionMeds() {
  const container = document.getElementById("doctor-meds-list");
  container.innerHTML = "";
  
  if (currentPrescriptionMeds.length === 0) {
    container.innerHTML = `<p class="no-data" style="padding: 1.5rem; font-size: 0.85rem;">No medicines added to prescription yet.</p>`;
    return;
  }
  
  currentPrescriptionMeds.forEach((med, index) => {
    const div = document.createElement("div");
    div.className = "med-item";
    div.innerHTML = `
      <div class="med-details">
        <span class="med-name">${med.name}</span> <span style="color:var(--color-cyan); font-size:0.75rem; font-weight:600;">(${med.dose})</span>
        <div class="med-schedule">${med.freq} | Duration: ${med.dur}</div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" style="padding: 0.2rem 0.4rem;" onclick="removePrescriptionMed(${index})">
        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
      </button>
    `;
    container.appendChild(div);
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

window.removePrescriptionMed = function(index) {
  currentPrescriptionMeds.splice(index, 1);
  renderDoctorPrescriptionMeds();
};

// 3. Pharmacy Queue
function renderPharmacyQueue() {
  const container = document.getElementById("pharmacy-queue");
  container.innerHTML = "";
  
  const pharmacyPatients = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv.needsPharmacy && !cv.pharmacyDispensed && cv.status !== "WAITING_FOR_DOCTOR";
  });
  
  if (pharmacyPatients.length === 0) {
    container.innerHTML = `<div class="no-data">No pharmacy orders.</div>`;
    return;
  }
  
  pharmacyPatients.forEach(p => {
    const cv = getCurrentVisit(p);
    const card = document.createElement("div");
    card.className = "patient-card";
    
    if (activePharmacyPatient && activePharmacyPatient.id === p.id) {
      card.style.borderColor = "var(--color-cyan)";
      card.style.backgroundColor = "rgba(6, 182, 212, 0.05)";
    }
    
    card.innerHTML = `
      <div class="patient-info">
        <div class="patient-header">
          <span class="patient-name">${p.name}</span>
          <span class="patient-id">${p.id}</span>
        </div>
        <div class="patient-meta">Meds ordered: ${cv.medicines.length} items</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-secondary btn-sm btn-pharmacy-select" data-id="${p.id}" style="border-color:var(--color-cyan); color:#e0f7fa;">Dispense</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  document.querySelectorAll(".btn-pharmacy-select").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      selectPatientForPharmacy(id);
    });
  });
}

function selectPatientForPharmacy(id) {
  const p = patients.find(pat => pat.id === id);
  if (!p) return;
  
  activePharmacyPatient = p;
  const cv = getCurrentVisit(p);
  
  document.getElementById("pharmacy-placeholder-card").style.display = "none";
  const dispenseCard = document.getElementById("pharmacy-dispense-card");
  dispenseCard.style.display = "block";
  
  document.getElementById("ph-patient-name").textContent = p.name;
  document.getElementById("ph-patient-id").textContent = p.id;
  document.getElementById("ph-patient-meta").textContent = `Prescribed by Doctor | ${p.gender}, ${p.age} years`;
  
  // Build meds checklist
  const checklist = document.getElementById("pharmacy-meds-checklist");
  checklist.innerHTML = "";
  
  cv.medicines.forEach((med, index) => {
    const label = document.createElement("label");
    label.className = "checkbox-container";
    label.style.background = "rgba(255,255,255,0.01)";
    label.style.padding = "0.75rem 1rem";
    label.style.border = "1px solid var(--glass-border)";
    label.style.borderRadius = "var(--radius-sm)";
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.justifyContent = "space-between";
    label.style.width = "100%";
    
    label.innerHTML = `
      <div style="display:flex; align-items:center; gap: 0.75rem; flex: 1;">
        <input type="checkbox" class="pharmacy-med-cb" ${med.dispensed ? 'checked' : ''}>
        <span class="checkmark"></span>
        <div>
          <strong style="color:#fff; font-size:0.95rem;">${med.name}</strong> - <span>${med.dose}</span>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.15rem;">Schedule: ${med.freq} | Duration: ${med.dur}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:0.8rem; color:var(--text-secondary);">Price (₹):</span>
        <input type="number" class="pharmacy-med-price" value="${med.price !== undefined ? med.price : ''}" placeholder="0.00" min="0" style="width: 80px; background: rgba(15,23,42,0.6); color:#fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.25rem; font-size: 0.85rem; text-align: right;">
      </div>
    `;
    checklist.appendChild(label);
  });

  // Set billing status badge & dispense button disabled/enabled state
  const phBillingStatus = document.getElementById("ph-billing-status");
  const phBillingNotes = document.getElementById("ph-billing-notes");
  const btnDispenseSubmit = document.getElementById("btn-dispense-submit");
  
  const medsPaid = !!cv.medicinesBillPaid;
  if (medsPaid) {
    phBillingStatus.className = "badge badge-success";
    phBillingStatus.textContent = "Paid";
    phBillingNotes.textContent = "Payment confirmed. You may dispense medications.";
    btnDispenseSubmit.removeAttribute("disabled");
  } else {
    phBillingStatus.className = "badge badge-waiting";
    phBillingStatus.textContent = "Unpaid";
    phBillingNotes.textContent = "Meds must be paid at reception desk before dispensing.";
    btnDispenseSubmit.setAttribute("disabled", "true");
  }
  
  renderPharmacyQueue();
}

// 4. Radiology Queue
function renderRadiologyQueue() {
  const container = document.getElementById("radiology-queue");
  container.innerHTML = "";
  
  const radiologyPatients = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv.needsRadiology && !cv.radiologyCompleted && cv.status !== "WAITING_FOR_DOCTOR";
  });
  
  if (radiologyPatients.length === 0) {
    container.innerHTML = `<div class="no-data">No radiology scans.</div>`;
    return;
  }
  
  radiologyPatients.forEach(p => {
    const cv = getCurrentVisit(p);
    const card = document.createElement("div");
    card.className = "patient-card";
    
    if (activeRadiologyPatient && activeRadiologyPatient.id === p.id) {
      card.style.borderColor = "var(--color-danger)";
      card.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
    }
    
    card.innerHTML = `
      <div class="patient-info">
        <div class="patient-header">
          <span class="patient-name">${p.name}</span>
          <span class="patient-id">${p.id}</span>
        </div>
        <div class="patient-meta">Scans ordered: ${cv.reports.length} reports</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-secondary btn-sm btn-radiology-select" data-id="${p.id}" style="border-color:var(--color-danger); color:#ffebee;">Upload scan</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  document.querySelectorAll(".btn-radiology-select").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      selectPatientForRadiology(id);
    });
  });
}

function selectPatientForRadiology(id) {
  const p = patients.find(pat => pat.id === id);
  if (!p) return;
  
  activeRadiologyPatient = p;
  const cv = getCurrentVisit(p);
  
  document.getElementById("radiology-placeholder-card").style.display = "none";
  const reportCard = document.getElementById("radiology-report-card");
  reportCard.style.display = "block";
  
  document.getElementById("rad-patient-name").textContent = p.name;
  document.getElementById("rad-patient-id").textContent = p.id;
  document.getElementById("rad-patient-meta").textContent = `Ordered by Doctor | ${p.gender}, ${p.age} years`;
  
  // Build report inputs
  const inputsContainer = document.getElementById("radiology-inputs-container");
  inputsContainer.innerHTML = "";
  
  cv.reports.forEach((rep, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "form-group";
    itemDiv.style.background = "rgba(255, 255, 255, 0.01)";
    itemDiv.style.border = "1px solid var(--glass-border)";
    itemDiv.style.borderRadius = "var(--radius-md)";
    itemDiv.style.padding = "1rem";
    
    itemDiv.innerHTML = `
      <label for="rad-findings-${index}" style="font-weight:600; color:#fff; font-size:0.95rem; margin-bottom:0.5rem; display:block;">
        <i data-lucide="file-digit" style="width:14px; color:var(--color-danger); vertical-align:middle; margin-right:4px;"></i> Ordered Scan: ${rep.name}
      </label>
      <textarea id="rad-findings-${index}" rows="2" placeholder="Write clinical diagnostic findings for ${rep.name} here..." required>${rep.findings || ""}</textarea>
    `;
    inputsContainer.appendChild(itemDiv);
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  renderRadiologyQueue();
}

// 5. Central Patient Registry Rendering
function renderRegistryTable() {
  const tbody = document.getElementById("registry-table-body");
  const query = document.getElementById("registry-search-input").value.toLowerCase().trim();
  
  tbody.innerHTML = "";
  
  let filtered = patients;
  if (query !== "") {
    filtered = patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.id.toLowerCase().includes(query) || 
      p.phone.includes(query)
    );
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data" style="text-align:center; padding: 2rem;">No matching patient records found in registry database.</td>
      </tr>
    `;
    return;
  }
  
  sorted.forEach(p => {
    const cv = getCurrentVisit(p);
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--glass-border)";
    tr.style.color = "var(--text-secondary)";
    
    tr.innerHTML = `
      <td style="padding: 1rem; font-family: monospace; font-weight:600; color:var(--color-cyan);">${p.id}</td>
      <td style="padding: 1rem; font-weight:600; color:#fff;">${p.name}</td>
      <td style="padding: 1rem;">${p.age}y / ${p.gender}</td>
      <td style="padding: 1rem;">${maskPhone(p.phone)}</td>
      <td style="padding: 1rem; font-size: 0.8rem;">
        Temp: ${cv.vitals.temp}°F | BP: ${cv.vitals.bp}
      </td>
      <td style="padding: 1rem;">${getStatusBadge(p)}</td>
      <td style="padding: 1rem; text-align: right;">
        <button class="btn btn-secondary btn-sm btn-view-history" data-id="${p.id}"><i data-lucide="eye" style="width:12px; height:12px;"></i> View EHR</button>
        <button class="btn btn-danger btn-sm btn-delete-patient" data-id="${p.id}" style="margin-left: 0.5rem;"><i data-lucide="trash-2" style="width:12px; height:12px;"></i> Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  document.querySelectorAll(".btn-view-history").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openRegistryDetail(id);
    });
  });

  document.querySelectorAll(".btn-delete-patient").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm(`Are you sure you want to delete patient '${id}'? This action cannot be undone.`)) {
        try {
          const deleteRes = await fetch(`/api/patients/${id}`, {
            method: "DELETE"
          });
          const data = await deleteRes.json();
          if (!deleteRes.ok) {
            throw new Error(data.error || "Failed to delete patient");
          }
          alert(`Patient '${id}' removed successfully.`);
          
          // Remove from local patients array
          patients = patients.filter(pat => pat.id !== id);
          
          // Re-render and update UI
          renderRegistryTable();
          renderAllQueues();
          updateDashboardStats();
        } catch (err) {
          alert(`Error: ${err.message}`);
        }
      }
    });
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Generate styled badges based on internal state
function getStatusBadge(p) {
  const cv = getCurrentVisit(p);
  if (cv.status === "WAITING_FOR_DOCTOR") {
    return `<span class="badge badge-waiting">Reception Check-in</span>`;
  }
  if (cv.status === "pending_pharmacy_radiology") {
    return `<span class="badge badge-pharmacy" style="margin-right:2px;">Meds</span><span class="badge badge-radiology">Scans</span>`;
  }
  if (cv.status === "pending_pharmacy") {
    return `<span class="badge badge-pharmacy">Meds Dispense</span>`;
  }
  if (cv.status === "pending_radiology") {
    return `<span class="badge badge-radiology">Diagnostic Labs</span>`;
  }
  if (cv.status === "completed") {
    return `<span class="badge badge-completed">Discharged</span>`;
  }
  return `<span class="badge">${cv.status}</span>`;
}

function openRegistryDetail(id) {
  const p = patients.find(pat => pat.id === id);
  if (!p) return;
  
  const detailCard = document.getElementById("registry-detail-card");
  detailCard.classList.add("active");
  
  detailCard.scrollIntoView({ behavior: "smooth", block: "start" });
  
  document.getElementById("reg-patient-name").textContent = p.name;
  document.getElementById("reg-patient-id").textContent = p.id;
  document.getElementById("reg-patient-meta").textContent = `${p.gender}, ${p.age} Years | Blood Group: ${p.bloodGroup}`;
  document.getElementById("reg-phone").textContent = maskPhone(p.phone);
  
  // Populate Visit Selector dropdown
  const selector = document.getElementById("reg-visit-selector");
  selector.innerHTML = "";
  
  p.visits.forEach((v, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    const statusText = v.status === "completed" ? "Discharged" : "Active";
    opt.textContent = `Visit ${index + 1}: ${v.date.split(' ')[0]} (${statusText})`;
    selector.appendChild(opt);
  });
  
  // Default load latest visit details
  const latestVisitIndex = p.visits.length - 1;
  selector.value = latestVisitIndex;
  loadRegistryVisitDetails(p, latestVisitIndex);
  
  // Bind change handler
  const newSelector = selector.cloneNode(true);
  selector.parentNode.replaceChild(newSelector, selector);
  newSelector.addEventListener("change", (e) => {
    loadRegistryVisitDetails(p, parseInt(e.target.value));
  });
}

function loadRegistryVisitDetails(p, visitIndex) {
  const v = p.visits[visitIndex];
  if (!v) return;
  
  // Timestamps
  document.getElementById("reg-checkin-date").textContent = v.date || "-";
  document.getElementById("reg-exam-date").textContent = v.examDate || "Awaiting doctor consultation";
  
  // Vitals
  document.getElementById("reg-vital-temp").textContent = `${v.vitals.temp} °F`;
  document.getElementById("reg-vital-weight").textContent = `${v.vitals.weight} kg`;
  document.getElementById("reg-vital-bp").textContent = v.vitals.bp;
  document.getElementById("reg-vital-pulse").textContent = `${v.vitals.pulse} bpm`;
  
  // Complaints, history, diagnosis
  document.getElementById("reg-symptoms").textContent = v.symptoms || "No symptoms recorded.";
  document.getElementById("reg-prev-history").textContent = v.prevHistory || "No previous history recorded.";
  document.getElementById("reg-family-history").textContent = v.familyHistory || "No family medical history recorded.";
  document.getElementById("reg-exam").textContent = v.physicalExam || "No physical/chest exam findings recorded.";
  document.getElementById("reg-diagnosis").textContent = v.diagnosis || "No clinical diagnosis notes provided yet.";
  
  // Prescriptions list
  const medsList = document.getElementById("reg-meds-list");
  medsList.innerHTML = "";
  
  if (v.medicines.length === 0) {
    medsList.innerHTML = `<div class="no-data" style="padding: 1rem; font-size:0.8rem;">No medicines prescribed.</div>`;
  } else {
    v.medicines.forEach(med => {
      const div = document.createElement("div");
      div.className = "med-item";
      div.innerHTML = `
        <div class="med-details">
          <span class="med-name">${med.name}</span> <span style="font-size:0.75rem; color:var(--text-secondary);">(${med.dose})</span>
          <div class="med-schedule">${med.freq} | Duration: ${med.dur}</div>
        </div>
        <span style="font-size:0.8rem; font-weight:600; color:${med.dispensed ? 'var(--color-success)' : 'var(--color-warning)'}">
          ${med.dispensed ? '✓ Dispensed' : '⟳ Pending'}
        </span>
      `;
      medsList.appendChild(div);
    });
  }
  
  // Diagnostics list
  const reportsList = document.getElementById("reg-reports-list");
  reportsList.innerHTML = "";
  
  if (v.reports.length === 0) {
    reportsList.innerHTML = `<div class="no-data" style="padding: 1rem; font-size:0.8rem;">No laboratory/radiology orders.</div>`;
  } else {
    v.reports.forEach(rep => {
      const div = document.createElement("div");
      div.className = "med-item";
      div.style.flexDirection = "column";
      div.style.alignItems = "flex-start";
      div.style.gap = "0.25rem";
      
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <strong style="color:#fff; font-size:0.85rem;">${rep.name}</strong>
          <span style="font-size:0.75rem; font-weight:600; color:${rep.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'}">
            ${rep.status === 'completed' ? 'Completed' : 'Pending Lab'}
          </span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem; font-style:italic; background:rgba(0,0,0,0.1); padding:0.4rem; border-radius:4px; width:100%;">
          Findings: ${rep.findings || "Awaiting scan findings input."}
        </p>
      `;
      reportsList.appendChild(div);
    });
  }
}

function triggerPrescriptionPrint(patient, visit) {
  // Populate details
  document.getElementById("print-p-id").textContent = patient.id || "-";
  document.getElementById("print-p-name").textContent = patient.name || "-";
  document.getElementById("print-p-age-gender").textContent = `${patient.age || "-"}y, ${patient.gender || "-"}`;
  document.getElementById("print-visit-date").textContent = visit.date || visit.examDate || "-";
  
  // Vitals
  document.getElementById("print-vitals-bp").textContent = (visit.vitals && visit.vitals.bp) ? visit.vitals.bp : "-";
  document.getElementById("print-vitals-pulse").textContent = (visit.vitals && visit.vitals.pulse) ? visit.vitals.pulse : "-";
  document.getElementById("print-vitals-weight").textContent = (visit.vitals && visit.vitals.weight) ? visit.vitals.weight : "-";
  document.getElementById("print-vitals-temp").textContent = (visit.vitals && visit.vitals.temp) ? visit.vitals.temp : "-";
  
  // Clinical
  document.getElementById("print-complaints").textContent = visit.symptoms || "No significant complaints.";
  document.getElementById("print-history").textContent = (visit.prevHistory || "None") + " | Family History: " + (visit.familyHistory || "None");
  document.getElementById("print-exam").textContent = visit.physicalExam || "No abnormalities detected on physical exam.";
  document.getElementById("print-diagnosis").textContent = visit.diagnosis || "No primary clinical diagnosis recorded.";
  
  // Prescribed medicines table
  const tbody = document.getElementById("print-meds-body");
  tbody.innerHTML = "";
  if (!visit.medicines || visit.medicines.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 1.5rem; font-style:italic;">No medications prescribed.</td></tr>`;
  } else {
    visit.medicines.forEach((med, index) => {
      const tr = document.createElement("tr");
      // Add compositions based on the name if possible, or leave clean
      let compositionText = "";
      const medNameUpper = med.name.toUpperCase();
      if (medNameUpper.includes("RCINEX")) {
        compositionText = `<p class="print-med-composition">Composition: Isoniazid (INH 300 MG + Rifampicin 600 MG)</p>`;
      } else if (medNameUpper.includes("COMBUTOL")) {
        compositionText = `<p class="print-med-composition">Composition: Ethambutol 600 MG</p>`;
      } else if (medNameUpper.includes("PYZINA")) {
        compositionText = `<p class="print-med-composition">Composition: Pyrazinamide 1000 MG</p>`;
      } else if (medNameUpper.includes("ALLEGRA")) {
        compositionText = `<p class="print-med-composition">Composition: Fexofenadine 120 MG + Montelukast 10 MG</p>`;
      } else if (medNameUpper.includes("ATARAX")) {
        compositionText = `<p class="print-med-composition">Composition: Hydroxyzine 10 MG</p>`;
      } else if (medNameUpper.includes("PANLYCO")) {
        compositionText = `<p class="print-med-composition">Composition: Lycopene + Multivitamins + Minerals</p>`;
      }
      
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <strong>${med.name.toUpperCase()}</strong>
          ${compositionText}
        </td>
        <td style="text-align: center; font-weight: 600;">${med.freq}</td>
        <td style="text-align: right;">${med.dose} - Take for ${med.dur}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // Advice / investigations
  const adviceDiv = document.getElementById("print-advice-investigations");
  adviceDiv.innerHTML = "";
  let adviceItems = [];
  if (visit.reports && visit.reports.length > 0) {
    const reportNames = visit.reports.map(r => r.name).join(", ");
    adviceItems.push(`<strong>Investigations Ordered:</strong> ${reportNames}`);
  }
  adviceItems.push(`<strong>General Advice:</strong> Rest well, keep hydrated, take medicines on time as prescribed.`);
  
  adviceDiv.innerHTML = adviceItems.map(item => `<p style="margin: 4px 0;">${item}</p>`).join("");
  
  // Next visit
  document.getElementById("print-next-visit").textContent = "As advised / Review after 7 days";
  
  // Set body print class
  document.body.className = "print-prescription-mode";
  
  // Print
  window.print();
  
  // Clear body print class
  document.body.className = "";
}

// ==========================================
// BILLING DESK OPERATIONS
// ==========================================

function renderBillingQueue() {
  const renderQueueFor = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    
    let billingPatients = [];
    if (containerId === "billing-queue-consult") {
      billingPatients = patients.filter(p => {
        const cv = getCurrentVisit(p);
        return cv && cv.status === "WAITING_FOR_DOCTOR" && !cv.consultationPaid;
      });
    } else if (containerId === "billing-queue-meds") {
      billingPatients = patients.filter(p => {
        const cv = getCurrentVisit(p);
        return cv && cv.needsPharmacy && !cv.medicinesBillPaid;
      });
    } else {
      billingPatients = patients.filter(p => {
        const cv = getCurrentVisit(p);
        return cv && cv.status !== "completed";
      });
    }
    
    if (billingPatients.length === 0) {
      container.innerHTML = `<div class="no-data">No patients in billing queue.</div>`;
      return;
    }
    
    billingPatients.forEach(p => {
      const cv = getCurrentVisit(p);
      const card = document.createElement("div");
      card.className = "patient-card";
      
      if (activeBillingPatient && activeBillingPatient.id === p.id) {
        card.style.borderColor = "var(--color-cyan)";
        card.style.backgroundColor = "rgba(6, 182, 212, 0.05)";
      }
      
      const consultPaid = !!cv.consultationPaid;
      const medsPaid = !!cv.medicinesBillPaid;
      const hasMeds = cv.medicines && cv.medicines.length > 0;
      
      const consultBadge = consultPaid 
        ? `<span class="badge badge-success" style="font-size:0.7rem; padding: 0.1rem 0.3rem;">Consult Paid</span>` 
        : `<span class="badge badge-waiting" style="font-size:0.7rem; padding: 0.1rem 0.3rem;">Consult Unpaid</span>`;
        
      let medsBadge = "";
      if (hasMeds) {
        medsBadge = medsPaid 
          ? `<span class="badge badge-success" style="font-size:0.7rem; padding: 0.1rem 0.3rem; margin-left: 0.25rem;">Meds Paid</span>` 
          : `<span class="badge badge-waiting" style="font-size:0.7rem; padding: 0.1rem 0.3rem; margin-left: 0.25rem; background-color: #ef4444; color: #fff;">Meds Unpaid</span>`;
      } else {
        medsBadge = `<span class="badge" style="font-size:0.7rem; padding: 0.1rem 0.3rem; margin-left: 0.25rem; background: rgba(255,255,255,0.08); color: #aaa;">No Meds</span>`;
      }
      
      card.innerHTML = `
        <div class="patient-info">
          <div class="patient-header">
            <span class="patient-name">${p.name}</span>
            <span class="patient-id">${p.id}</span>
          </div>
          <div style="margin-top: 0.4rem; display: flex; gap: 0.25rem;">
            ${consultBadge}
            ${medsBadge}
          </div>
        </div>
        <div class="patient-actions">
          <button class="btn btn-secondary btn-sm btn-billing-select" data-id="${p.id}" style="border-color:var(--color-cyan); color:#e0f7fa;">Bill</button>
        </div>
      `;
      container.appendChild(card);
    });
  };

  renderQueueFor("billing-queue-consult");
  renderQueueFor("billing-queue-meds");

  document.querySelectorAll(".btn-billing-select").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      selectPatientForBilling(id);
    });
  });
}

function selectPatientForBilling(id) {
  const p = patients.find(pat => pat.id === id);
  if (!p) return;
  
  activeBillingPatient = p;
  const cv = getCurrentVisit(p);
  
  // Show details panel, hide placeholder
  const consultDetails = document.getElementById("billing-details-consult-card");
  if (consultDetails) consultDetails.style.display = "block";
  const consultPlaceholder = document.getElementById("billing-placeholder-consult-card");
  if (consultPlaceholder) consultPlaceholder.style.display = "none";

  const medsDetails = document.getElementById("billing-details-meds-card");
  if (medsDetails) medsDetails.style.display = "block";
  const medsPlaceholder = document.getElementById("billing-placeholder-meds-card");
  if (medsPlaceholder) medsPlaceholder.style.display = "none";
  
  // Populate Active Patient Banners
  const bannerConsult = document.getElementById("billing-patient-banner-consult");
  const bannerContent = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div>
        <span style="font-size: 0.78rem; color: var(--color-cyan); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Active Billing Profile</span>
        <strong style="font-size: 1.15rem; color: #fff; font-family: var(--font-display);">${p.name}</strong>
        <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 10px;">ID: ${p.id} | ${p.gender}, ${p.age} years | Contact: ${maskPhone(p.phone)}</span>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Check-in Date</span>
        <strong style="font-size: 0.85rem; color: #fff;">${cv.date}</strong>
      </div>
    </div>
  `;
  if (bannerConsult) bannerConsult.innerHTML = bannerContent;

  const bannerMeds = document.getElementById("billing-patient-banner-meds");
  if (bannerMeds) bannerMeds.innerHTML = bannerContent;
  
  // Populate Consultation Billing Section
  const consultFeeInput = document.getElementById("bill-consult-fee");
  const consultPaid = !!cv.consultationPaid;
  
  // Set default if not set
  if (cv.consultationFee === undefined) cv.consultationFee = 1000;
  if (cv.consultationDiscount === undefined) cv.consultationDiscount = 0;
  
  if (consultFeeInput) consultFeeInput.value = cv.consultationFee;
  
  // Calculate and update consultation totals UI
  updateConsultationTotals(cv);
  
  // Consultation Status badge
  const consultBadge = document.getElementById("billing-consult-status-badge");
  const btnPayConsult = document.getElementById("btn-pay-consult");
  if (consultPaid) {
    if (consultBadge) {
      consultBadge.className = "badge badge-success";
      consultBadge.textContent = "Paid";
    }
    if (btnPayConsult) {
      btnPayConsult.className = "btn btn-success";
      btnPayConsult.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Paid`;
      btnPayConsult.disabled = true;
    }
    if (consultFeeInput) consultFeeInput.disabled = true;
  } else {
    if (consultBadge) {
      consultBadge.className = "badge badge-waiting";
      consultBadge.textContent = "Unpaid";
    }
    if (btnPayConsult) {
      btnPayConsult.className = "btn btn-primary";
      btnPayConsult.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Pay`;
      btnPayConsult.disabled = false;
    }
    if (consultFeeInput) consultFeeInput.disabled = false;
  }
  
  // Populate Medicine Billing Section
  const medsPaid = !!cv.medicinesBillPaid;
  const hasMeds = cv.medicines && cv.medicines.length > 0;
  const medsAwaiting = document.getElementById("billing-meds-awaiting");
  const medsTableWrapper = document.getElementById("billing-meds-table-wrapper");
  const medsSummaryBox = document.getElementById("billing-meds-summary-box");
  const btnPayMeds = document.getElementById("btn-pay-meds");
  const medsBadge = document.getElementById("billing-meds-status-badge");
  
  let medsTotal = cv.medicinesBillAmount || 0;
  let allMedsPriced = true;
  
  if (hasMeds) {
    cv.medicines.forEach(m => {
      if (m.price === undefined || m.price === null || m.price === "") {
        allMedsPriced = false;
      }
    });
  }
  
  if (!hasMeds) {
    if (medsAwaiting) {
      medsAwaiting.style.display = "block";
      medsAwaiting.innerHTML = `
        <i data-lucide="info" style="width: 32px; height: 32px; color: var(--text-secondary); margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.9rem; margin: 0; color: var(--text-secondary);">No medicines prescribed for this visit yet.</p>
      `;
    }
    if (medsTableWrapper) medsTableWrapper.style.display = "none";
    if (medsSummaryBox) medsSummaryBox.style.display = "none";
    if (btnPayMeds) btnPayMeds.style.display = "none";
    if (medsBadge) {
      medsBadge.className = "badge";
      medsBadge.textContent = "N/A";
      medsBadge.style.background = "rgba(255,255,255,0.08)";
      medsBadge.style.color = "#aaa";
    }
  } else if (!allMedsPriced && medsTotal === 0) {
    if (medsAwaiting) {
      medsAwaiting.style.display = "block";
      medsAwaiting.innerHTML = `
        <i data-lucide="clock" style="width: 32px; height: 32px; color: var(--color-warning); margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.9rem; margin: 0; color: var(--text-secondary);">Awaiting medicine pricing input from the pharmacy desk.</p>
      `;
    }
    if (medsTableWrapper) medsTableWrapper.style.display = "none";
    if (medsSummaryBox) medsSummaryBox.style.display = "none";
    if (btnPayMeds) btnPayMeds.style.display = "none";
    if (medsBadge) {
      medsBadge.className = "badge badge-waiting";
      medsBadge.textContent = "Awaiting Price";
    }
  } else {
    if (medsAwaiting) medsAwaiting.style.display = "none";
    if (medsTableWrapper) medsTableWrapper.style.display = "block";
    if (medsSummaryBox) medsSummaryBox.style.display = "block";
    if (btnPayMeds) btnPayMeds.style.display = "block";
    
    let calculatedMedsTotal = 0;
    const tbody = document.getElementById("billing-meds-tbody");
    if (tbody) {
      tbody.innerHTML = "";
      cv.medicines.forEach(m => {
        const price = parseFloat(m.price) || 0;
        calculatedMedsTotal += price;
        
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        tr.innerHTML = `
          <td style="padding: 0.6rem 0.25rem;">
            <strong style="color: #fff; font-size: 0.85rem;">${m.name}</strong> - <span style="font-size: 0.78rem; color: var(--text-secondary);">${m.dose} (${m.dur})</span>
          </td>
          <td style="padding: 0.6rem 0.25rem; text-align: right; color: #fff; font-weight: 600;">₹${price.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      cv.medicines.forEach(m => {
        const price = parseFloat(m.price) || 0;
        calculatedMedsTotal += price;
      });
    }
    
    cv.medicinesBillAmount = calculatedMedsTotal;
    const billMedsTotalEl = document.getElementById("bill-meds-total");
    if (billMedsTotalEl) billMedsTotalEl.textContent = `₹${calculatedMedsTotal.toFixed(2)}`;
    
    if (medsPaid) {
      if (medsBadge) {
        medsBadge.className = "badge badge-success";
        medsBadge.textContent = "Paid";
      }
      if (btnPayMeds) {
        btnPayMeds.className = "btn btn-success";
        btnPayMeds.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Paid`;
        btnPayMeds.disabled = true;
      }
    } else {
      if (medsBadge) {
        medsBadge.className = "badge badge-waiting";
        medsBadge.textContent = "Unpaid";
      }
      if (btnPayMeds) {
        btnPayMeds.className = "btn btn-primary";
        btnPayMeds.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Pay`;
        btnPayMeds.disabled = false;
      }
    }
  }
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  renderAllQueues();
}

function updateConsultationTotals(cv) {
  const grossInput = document.getElementById("bill-consult-fee");
  const grossVal = parseFloat(grossInput.value) || 0;
  cv.consultationFee = grossVal;
  
  const discountVal = parseFloat(cv.consultationDiscount) || 0;
  const payable = Math.max(0, grossVal - discountVal);
  
  document.getElementById("bill-consult-gross").textContent = `₹${grossVal.toFixed(2)}`;
  document.getElementById("bill-consult-disc-val").textContent = `-₹${discountVal.toFixed(2)}`;
  document.getElementById("bill-consult-payable").textContent = `₹${payable.toFixed(2)}`;
}

function printConsultationBill(p, cv) {
  document.getElementById("print-consult-p-name").textContent = p.name;
  document.getElementById("print-consult-p-id").textContent = p.id;
  document.getElementById("print-consult-p-age-gender").textContent = `${p.age}y / ${p.gender}`;
  document.getElementById("print-consult-date").textContent = getFormattedDateTime();
  document.getElementById("print-consult-phone").textContent = maskPhone(p.phone);
  document.getElementById("print-consult-status").textContent = cv.consultationPaid ? "PAID" : "UNPAID";
  document.getElementById("print-consult-status").style.color = cv.consultationPaid ? "#2a9d8f" : "#e63946";
  
  const gross = parseFloat(cv.consultationFee) || 1000;
  const disc = parseFloat(cv.consultationDiscount) || 0;
  const net = Math.max(0, gross - disc);
  
  document.getElementById("print-consult-gross-fee").textContent = `₹${gross.toFixed(2)}`;
  document.getElementById("print-consult-discount").textContent = `-₹${disc.toFixed(2)}`;
  document.getElementById("print-consult-net-fee").textContent = `₹${net.toFixed(2)}`;
  
  document.body.className = "print-consultation-mode";
  window.print();
  document.body.className = "";
}

function printMedicineBill(p, cv) {
  document.getElementById("print-meds-p-name").textContent = p.name;
  document.getElementById("print-meds-p-id").textContent = p.id;
  document.getElementById("print-meds-p-age-gender").textContent = `${p.age}y / ${p.gender}`;
  document.getElementById("print-meds-date").textContent = getFormattedDateTime();
  document.getElementById("print-meds-phone").textContent = maskPhone(p.phone);
  document.getElementById("print-meds-status").textContent = cv.medicinesBillPaid ? "PAID" : "UNPAID";
  document.getElementById("print-meds-status").style.color = cv.medicinesBillPaid ? "#2a9d8f" : "#e63946";
  
  const tbody = document.getElementById("print-meds-bill-body");
  tbody.innerHTML = "";
  
  let medsTotal = 0;
  cv.medicines.forEach((med, index) => {
    const price = parseFloat(med.price) || 0;
    medsTotal += price;
    
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #eee";
    tr.innerHTML = `
      <td style="padding: 12px 10px; text-align: left;">${index + 1}</td>
      <td style="padding: 12px 10px; text-align: left;">
        <strong>${med.name.toUpperCase()}</strong>
        <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">Schedule: ${med.freq}</div>
      </td>
      <td style="padding: 12px 10px; text-align: center;">${med.dose} (${med.dur})</td>
      <td style="padding: 12px 10px; text-align: right; font-weight: 600;">₹${price.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Total Row
  const totalTr = document.createElement("tr");
  totalTr.style.fontWeight = "700";
  totalTr.style.borderBottom = "2px solid #2a9d8f";
  totalTr.style.background = "#fdfefe";
  totalTr.innerHTML = `
    <td colspan="3" style="padding: 15px 10px; text-align: left; font-size: 1.05rem;">Total Paid Amount</td>
    <td style="padding: 15px 10px; text-align: right; font-size: 1.05rem; color: #2a9d8f;">₹${medsTotal.toFixed(2)}</td>
  `;
  tbody.appendChild(totalTr);
  
  document.body.className = "print-medicine-mode";
  window.print();
  document.body.className = "";
}

function setupBillingEvents() {
  const consultFeeInput = document.getElementById("bill-consult-fee");
  if (consultFeeInput) {
    consultFeeInput.addEventListener("input", () => {
      if (!activeBillingPatient) return;
      const cv = getCurrentVisit(activeBillingPatient);
      if (cv.consultationPaid) return;
      
      cv.consultationFee = parseFloat(consultFeeInput.value) || 0;
      updateConsultationTotals(cv);
    });
  }

  document.querySelectorAll(".btn-discount-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!activeBillingPatient) return;
      const cv = getCurrentVisit(activeBillingPatient);
      if (cv.consultationPaid) return;
      
      document.querySelectorAll(".btn-discount-preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const pct = btn.getAttribute("data-pct");
      const customWrapper = document.getElementById("custom-discount-wrapper");
      
      if (pct === "custom") {
        customWrapper.style.display = "block";
        const customInput = document.getElementById("bill-discount-custom");
        customInput.value = cv.consultationDiscount || "";
        customInput.focus();
      } else {
        customWrapper.style.display = "none";
        const percentage = parseFloat(pct) || 0;
        const grossFee = parseFloat(document.getElementById("bill-consult-fee").value) || 0;
        cv.consultationDiscount = Math.round((grossFee * percentage) / 100);
        updateConsultationTotals(cv);
      }
    });
  });
  
  const customDiscInput = document.getElementById("bill-discount-custom");
  if (customDiscInput) {
    customDiscInput.addEventListener("input", () => {
      if (!activeBillingPatient) return;
      const cv = getCurrentVisit(activeBillingPatient);
      if (cv.consultationPaid) return;
      
      const val = parseFloat(customDiscInput.value) || 0;
      cv.consultationDiscount = val;
      updateConsultationTotals(cv);
    });
  }

  const btnPayConsult = document.getElementById("btn-pay-consult");
  if (btnPayConsult) {
    btnPayConsult.addEventListener("click", async () => {
      if (!activeBillingPatient) return;
      const p = patients.find(pat => pat.id === activeBillingPatient.id);
      const cv = getCurrentVisit(p);
      
      cv.consultationPaid = true;
      p.logs.push(`Consultation payment of ₹${Math.max(0, (cv.consultationFee || 1000) - (cv.consultationDiscount || 0)).toFixed(2)} collected.`);
      await addLog(`Consultation payment collected for ${p.name}.`, "success");
      
      await updatePatientRecord(p);
      selectPatientForBilling(p.id);
      
      if (activeBillingPatient) {
        const updatedCv = getCurrentVisit(activeBillingPatient);
        printConsultationBill(activeBillingPatient, updatedCv);
      }
    });
  }

  const btnPayMeds = document.getElementById("btn-pay-meds");
  if (btnPayMeds) {
    btnPayMeds.addEventListener("click", async () => {
      if (!activeBillingPatient) return;
      const p = patients.find(pat => pat.id === activeBillingPatient.id);
      const cv = getCurrentVisit(p);
      
      cv.medicinesBillPaid = true;
      p.logs.push(`Medicine payment of ₹${(cv.medicinesBillAmount || 0).toFixed(2)} collected.`);
      await addLog(`Medicine bill payment collected for ${p.name}.`, "success");
      
      await updatePatientRecord(p);
      selectPatientForBilling(p.id);
      
      if (activeBillingPatient) {
        const updatedCv = getCurrentVisit(activeBillingPatient);
        printMedicineBill(activeBillingPatient, updatedCv);
      }
    });
  }

  const btnPrintConsult = document.getElementById("btn-print-consult");
  if (btnPrintConsult) {
    btnPrintConsult.addEventListener("click", () => {
      if (!activeBillingPatient) return;
      const cv = getCurrentVisit(activeBillingPatient);
      printConsultationBill(activeBillingPatient, cv);
    });
  }

  const btnPrintMeds = document.getElementById("btn-print-meds");
  if (btnPrintMeds) {
    btnPrintMeds.addEventListener("click", () => {
      if (!activeBillingPatient) return;
      const cv = getCurrentVisit(activeBillingPatient);
      printMedicineBill(activeBillingPatient, cv);
    });
  }

  const btnSubmitPricing = document.getElementById("btn-submit-pricing");
  if (btnSubmitPricing) {
    btnSubmitPricing.addEventListener("click", async () => {
      if (!activePharmacyPatient) return;
      const p = patients.find(pat => pat.id === activePharmacyPatient.id);
      const cv = getCurrentVisit(p);
      
      const priceInputs = document.querySelectorAll(".pharmacy-med-price");
      let totalMedsPrice = 0;
      
      priceInputs.forEach((input, index) => {
        const val = parseFloat(input.value) || 0;
        cv.medicines[index].price = val;
        totalMedsPrice += val;
      });
      
      cv.medicinesBillAmount = totalMedsPrice;
      p.logs.push(`Pharmacist submitted medicine bill total of ₹${totalMedsPrice.toFixed(2)}.`);
      await addLog(`Medicine prices submitted for ${p.name}. Total: ₹${totalMedsPrice.toFixed(2)}.`, "info");
      
      await updatePatientRecord(p);
      alert(`Pricing submitted successfully! Total medicine bill: ₹${totalMedsPrice.toFixed(2)}.`);
      selectPatientForPharmacy(p.id);
    });
  }
}

// ==========================================
// PHARMACY REFILL & CUSTOM PRESCRIPTION DESK
// ==========================================
let activeRefillPatient = null;
let activeRefillVisit = null;

function setupPharmacyRefillEvents() {
  const refillSearchInput = document.getElementById("pharmacy-refill-search");
  const refillResultsDiv = document.getElementById("pharmacy-refill-results");

  if (refillSearchInput) {
    refillSearchInput.addEventListener("input", () => {
      const query = refillSearchInput.value.toLowerCase().trim();
      if (!query) {
        refillResultsDiv.innerHTML = "";
        return;
      }

      const filtered = patients.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.id.toLowerCase().includes(query) || 
        p.phone.includes(query)
      );

      refillResultsDiv.innerHTML = "";
      if (filtered.length === 0) {
        refillResultsDiv.innerHTML = `<div class="no-data" style="padding:1rem;">No matching patients found.</div>`;
        return;
      }

      filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "patient-card";
        card.style.padding = "0.6rem 0.8rem";
        card.style.borderColor = "rgba(6, 182, 212, 0.2)";
        card.innerHTML = `
          <div class="patient-info">
            <div class="patient-header">
              <span class="patient-name" style="font-size:0.9rem;">${p.name}</span>
              <span class="patient-id" style="font-size:0.75rem;">${p.id}</span>
            </div>
            <div class="patient-meta" style="font-size:0.75rem;">${p.gender}, ${p.age}y | Phone: ${maskPhone(p.phone)}</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm btn-select-refill-patient" data-id="${p.id}" style="font-size:0.75rem; padding:0.25rem 0.5rem;">Select</button>
        `;
        refillResultsDiv.appendChild(card);
      });

      document.querySelectorAll(".btn-select-refill-patient").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          selectPatientForRefill(id);
        });
      });
    });
  }

  function selectPatientForRefill(id) {
    const p = patients.find(pat => pat.id === id);
    if (!p) return;

    activeRefillPatient = p;
    document.getElementById("pharmacy-refill-placeholder").style.display = "none";
    document.getElementById("pharmacy-refill-card").style.display = "block";

    document.getElementById("ph-refill-patient-name").textContent = p.name;
    document.getElementById("ph-refill-patient-id").textContent = p.id;
    document.getElementById("ph-refill-patient-meta").textContent = `${p.gender}, ${p.age} Years | Phone: ${maskPhone(p.phone)}`;

    // Populate Previous Visit Selector dropdown
    const selector = document.getElementById("ph-refill-visit-selector");
    selector.innerHTML = "";

    p.visits.forEach((v, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = `Visit ${index + 1}: ${v.date.split(' ')[0]} - Diag: ${v.diagnosis || 'N/A'}`;
      selector.appendChild(opt);
    });

    // Default load latest visit
    const latestIndex = p.visits.length - 1;
    selector.value = latestIndex;
    loadRefillVisitDetails(p, latestIndex);

    // Bind change handler
    const newSelector = selector.cloneNode(true);
    selector.parentNode.replaceChild(newSelector, selector);
    newSelector.addEventListener("change", (e) => {
      loadRefillVisitDetails(p, parseInt(e.target.value));
    });
  }

  function loadRefillVisitDetails(p, index) {
    const v = p.visits[index];
    if (!v) return;

    activeRefillVisit = v;

    document.getElementById("ph-refill-visit-date").textContent = v.date || "-";
    document.getElementById("ph-refill-diagnosis").textContent = v.diagnosis || "No diagnosis notes.";
    document.getElementById("ph-refill-vitals").textContent = `Temp: ${v.vitals.temp}°F, BP: ${v.vitals.bp}, Pulse: ${v.vitals.pulse} bpm, Weight: ${v.vitals.weight} kg`;
    document.getElementById("ph-refill-symptoms").textContent = v.symptoms || "None.";

    const medsPreview = document.getElementById("ph-refill-meds-preview");
    medsPreview.innerHTML = "";
    if (v.medicines.length === 0) {
      medsPreview.innerHTML = `<div class="no-data" style="padding:0.5rem; font-size:0.8rem;">No medicines prescribed.</div>`;
    } else {
      v.medicines.forEach(m => {
        const item = document.createElement("div");
        item.style.padding = "0.4rem 0.6rem";
        item.style.background = "rgba(255,255,255,0.02)";
        item.style.border = "1px solid rgba(255,255,255,0.05)";
        item.style.borderRadius = "4px";
        item.innerHTML = `
          <strong style="color:#fff;">${m.name}</strong> - <span>${m.dose}</span>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.1rem;">Schedule: ${m.freq} | Duration: ${m.dur}</div>
        `;
        medsPreview.appendChild(item);
      });
    }
  }

  // Refill Close Button
  const btnClosePhRefill = document.getElementById("btn-close-ph-refill");
  if (btnClosePhRefill) {
    btnClosePhRefill.addEventListener("click", () => {
      activeRefillPatient = null;
      activeRefillVisit = null;
      document.getElementById("pharmacy-refill-card").style.display = "none";
      document.getElementById("pharmacy-refill-placeholder").style.display = "block";
      refillSearchInput.value = "";
      refillResultsDiv.innerHTML = "";
    });
  }

  // Re-issue Prescription & Add to Pharmacy Queue
  const btnReissueSubmit = document.getElementById("btn-reissue-submit");
  if (btnReissueSubmit) {
    btnReissueSubmit.addEventListener("click", async () => {
      if (!activeRefillPatient || !activeRefillVisit) return;

      if (activeRefillVisit.medicines.length === 0) {
        alert("Selected visit has no prescribed medicines to re-issue.");
        return;
      }

      // Add new visit by duplication of selected prescription and vitals
      const currentDateTime = getFormattedDateTime();
      const newVisit = {
        date: currentDateTime,
        examDate: currentDateTime, // directly examined
        vitals: { ...activeRefillVisit.vitals },
        symptoms: `Medicine refill requested. Previous symptoms: ${activeRefillVisit.symptoms}`,
        prevHistory: activeRefillVisit.diagnosis || "",
        physicalExam: activeRefillVisit.physicalExam || "",
        diagnosis: activeRefillVisit.diagnosis || "Refill / Re-issue",
        medicines: activeRefillVisit.medicines.map(m => ({
          name: m.name,
          dose: m.dose,
          freq: m.freq,
          dur: m.dur,
          dispensed: false,
          price: m.price
        })),
        reports: [],
        status: "pending_pharmacy", // Go straight to pharmacy queue
        needsPharmacy: true,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false,
        consultationPaid: true, // Auto-marked as paid for refill check-ins
        consultationFee: 500, // Reduced refill desk consultation fee
        consultationDiscount: 0,
        medicinesBillPaid: false
      };

      activeRefillPatient.visits.push(newVisit);
      activeRefillPatient.logs.push(`Re-issued prescription from visit on ${activeRefillVisit.date} as a new pharmacy order.`);
      await addLog(`Re-issued medications for patient ${activeRefillPatient.name} (${activeRefillPatient.id}).`, "success");

      await updatePatientRecord(activeRefillPatient);
      alert(`Prescription successfully re-issued! Patient ${activeRefillPatient.name} has been added back to the Active Pharmacy queue.`);
      
      // Switch to active queue tab
      const activeTab = document.querySelector(".pharmacy-tab[data-tab='active-queue']");
      if (activeTab) activeTab.click();

      // Close/Reset Refill details
      document.getElementById("btn-close-ph-refill").click();
      renderAllQueues();
    });
  }

  // Print Refill Prescription
  const btnPrintRefillRx = document.getElementById("btn-print-refill-rx");
  if (btnPrintRefillRx) {
    btnPrintRefillRx.addEventListener("click", () => {
      if (!activeRefillPatient || !activeRefillVisit) return;
      triggerPrescriptionPrint(activeRefillPatient, activeRefillVisit);
    });
  }
}

const customMedsDirectory = [
  { name: "Rcinex 600", dose: "1 Cap", freq: "1-0-1", dur: "5 Days" },
  { name: "Combutol 600", dose: "1 Tab", freq: "1-0-0", dur: "7 Days" },
  { name: "Pyzina 1000", dose: "1 Tab", freq: "1-0-0", dur: "7 Days" },
  { name: "Allegra-M", dose: "1 Tab", freq: "0-0-1", dur: "5 Days" },
  { name: "Atarax 10mg", dose: "1 Tab", freq: "0-0-1", dur: "3 Days" },
  { name: "Panlyco", dose: "1 Cap", freq: "1-0-0", dur: "10 Days" },
  { name: "Paracetamol 650mg", dose: "1 Tab", freq: "1-1-1", dur: "3 Days" },
  { name: "Amoxicillin 500mg", dose: "1 Cap", freq: "1-0-1", dur: "5 Days" },
  { name: "Amlodipine 5mg", dose: "1 Tab", freq: "0-0-1", dur: "30 Days" },
  { name: "Aspirin 75mg", dose: "1 Tab", freq: "1-0-0", dur: "30 Days" },
  { name: "Metformin 500mg", dose: "1 Tab", freq: "1-0-1", dur: "30 Days" },
  { name: "Pantoprazole 40mg", dose: "1 Tab", freq: "1-0-0", dur: "10 Days" },
  { name: "Azithromycin 500mg", dose: "1 Tab", freq: "1-0-0", dur: "3 Days" },
  { name: "Cetirizine 10mg", dose: "1 Tab", freq: "0-0-1", dur: "5 Days" }
];

let customSelectedMeds = [];

function renderCustomMedsDirectory() {
  const list = document.getElementById("pharmacy-med-directory-list");
  if (!list) return;
  const searchInput = document.getElementById("pharmacy-med-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  list.innerHTML = "";

  const filtered = customMedsDirectory.filter(m => m.name.toLowerCase().includes(query));

  filtered.forEach(m => {
    const div = document.createElement("div");
    div.className = "med-item";
    div.style.cursor = "pointer";
    div.style.padding = "0.5rem";
    div.style.background = "rgba(255,255,255,0.02)";
    div.style.border = "1px solid rgba(255,255,255,0.05)";
    div.style.borderRadius = "4px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "space-between";
    div.innerHTML = `
      <div style="flex:1;">
        <strong style="color:#fff; font-size:0.85rem;">${m.name}</strong>
        <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Default: ${m.dose} | ${m.freq} (${m.dur})</span>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.7rem; padding: 0.15rem 0.35rem;"><i data-lucide="plus" style="width:10px; height:10px; vertical-align:middle; margin-right:2px;"></i> Add</button>
    `;
    div.addEventListener("click", () => {
      addCustomPrescriptionMed(m);
    });
    list.appendChild(div);
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function addCustomPrescriptionMed(m) {
  customSelectedMeds.push({
    name: m.name,
    dose: m.dose,
    freq: m.freq,
    dur: m.dur
  });
  renderCustomSelectedMeds();
}

function renderCustomSelectedMeds() {
  const container = document.getElementById("custom-rx-meds-list");
  if (!container) return;
  container.innerHTML = "";

  if (customSelectedMeds.length === 0) {
    container.innerHTML = `<p class="no-data" style="padding: 1rem; font-size: 0.8rem;">Click medicines from the directory on the right to add them here.</p>`;
    return;
  }

  customSelectedMeds.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "med-item";
    div.style.padding = "0.5rem";
    div.style.background = "rgba(255,255,255,0.03)";
    div.style.border = "1px solid rgba(255,255,255,0.08)";
    div.style.borderRadius = "4px";
    div.style.marginBottom = "0.5rem";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "space-between";
    div.style.gap = "0.5rem";

    div.innerHTML = `
      <div style="flex:2;">
        <input type="text" value="${m.name}" style="background:transparent; border:none; color:#fff; font-weight:600; font-size:0.85rem; width:100%;" onchange="updateCustomMedDetail(${index}, 'name', this.value)">
      </div>
      <div style="flex:1;">
        <input type="text" value="${m.dose}" placeholder="Dose" style="background:rgba(15,23,42,0.6); border:1px solid var(--glass-border); border-radius:3px; padding:0.15rem; color:#fff; font-size:0.75rem; width:100%;" onchange="updateCustomMedDetail(${index}, 'dose', this.value)">
      </div>
      <div style="flex:1;">
        <input type="text" value="${m.freq}" placeholder="Freq" style="background:rgba(15,23,42,0.6); border:1px solid var(--glass-border); border-radius:3px; padding:0.15rem; color:#fff; font-size:0.75rem; width:100%;" onchange="updateCustomMedDetail(${index}, 'freq', this.value)">
      </div>
      <div style="flex:1;">
        <input type="text" value="${m.dur}" placeholder="Dur" style="background:rgba(15,23,42,0.6); border:1px solid var(--glass-border); border-radius:3px; padding:0.15rem; color:#fff; font-size:0.75rem; width:100%;" onchange="updateCustomMedDetail(${index}, 'dur', this.value)">
      </div>
      <button type="button" class="btn btn-danger btn-sm" style="padding: 0.15rem 0.35rem;" onclick="removeCustomMed(${index})">
        <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
      </button>
    `;
    container.appendChild(div);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

window.updateCustomMedDetail = function(index, field, val) {
  if (customSelectedMeds[index]) {
    customSelectedMeds[index][field] = val;
  }
};

window.removeCustomMed = function(index) {
  customSelectedMeds.splice(index, 1);
  renderCustomSelectedMeds();
};

// Bind custom prescription input, submit, and reset events
document.addEventListener("DOMContentLoaded", () => {
  const medSearch = document.getElementById("pharmacy-med-search");
  if (medSearch) {
    medSearch.addEventListener("input", renderCustomMedsDirectory);
  }

  const customForm = document.getElementById("pharmacy-custom-rx-form");
  if (customForm) {
    customForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (customSelectedMeds.length === 0) {
        alert("Please add at least one medicine to the prescription.");
        return;
      }

      const name = document.getElementById("custom-rx-name").value;
      const age = document.getElementById("custom-rx-age").value;
      const gender = document.getElementById("custom-rx-gender").value;
      const bp = document.getElementById("custom-rx-bp").value || "-";
      const pulse = document.getElementById("custom-rx-pulse").value || "-";
      const temp = document.getElementById("custom-rx-temp").value || "-";
      const weight = document.getElementById("custom-rx-weight").value || "-";
      const diagnosis = document.getElementById("custom-rx-diagnosis").value;

      const patientObj = {
        id: "CUSTOM-RX",
        name,
        age,
        gender,
        phone: "-",
        bloodGroup: "-"
      };

      const visitObj = {
        date: getFormattedDateTime(),
        vitals: { temp, weight, bp, pulse },
        symptoms: "Walk-in custom pharmacy prescription.",
        prevHistory: "-",
        familyHistory: "-",
        physicalExam: "-",
        diagnosis,
        medicines: customSelectedMeds,
        reports: []
      };

      triggerPrescriptionPrint(patientObj, visitObj);
    });
  }

  const btnCustomRxReset = document.getElementById("btn-custom-rx-reset");
  if (btnCustomRxReset) {
    btnCustomRxReset.addEventListener("click", () => {
      const customForm = document.getElementById("pharmacy-custom-rx-form");
      if (customForm) customForm.reset();
      customSelectedMeds = [];
      renderCustomSelectedMeds();
    });
  }
});

// ==========================================
// DASHBOARD ANALYTICS & STAFF MANAGEMENT
// ==========================================

function updateDashboardStats() {
  const todayPrefix = getFormattedDateTime().split(' ')[0];
  const registeredCount = patients.filter(p => p.visits && p.visits[0] && p.visits[0].date.startsWith(todayPrefix)).length;

  const activeCount = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.status === "WAITING_FOR_DOCTOR";
  }).length;

  const dischargedCount = patients.filter(p => {
    const cv = getCurrentVisit(p);
    return cv && cv.status === "completed";
  }).length;

  // Receptionist stats elements
  const registeredEl = document.getElementById("stats-registered");
  if (registeredEl) registeredEl.textContent = registeredCount;

  const activePatientsEl = document.getElementById("stats-active-patients");
  if (activePatientsEl) activePatientsEl.textContent = activeCount;
  
  const dischargedEl = document.getElementById("stats-discharged");
  if (dischargedEl) dischargedEl.textContent = dischargedCount;

  // Doctor stats elements
  const docRegisteredEl = document.getElementById("doc-stats-registered");
  if (docRegisteredEl) docRegisteredEl.textContent = registeredCount;

  const docActivePatientsEl = document.getElementById("doc-stats-active-patients");
  if (docActivePatientsEl) docActivePatientsEl.textContent = activeCount;
  
  const docDischargedEl = document.getElementById("doc-stats-discharged");
  if (docDischargedEl) docDischargedEl.textContent = dischargedCount;
}

async function renderStaffMgmtTable() {
  const tbody = document.getElementById("staff-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const res = await fetch("/api/auth/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="no-data" style="text-align:center; padding: 2rem;">No staff users registered.</td>
        </tr>
      `;
      return;
    }

    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--glass-border)";
      tr.style.color = "var(--text-secondary)";

      // Format role nicely
      let roleDisplay = u.role.charAt(0).toUpperCase() + u.role.slice(1);
      if (u.role === "doctor") roleDisplay = "Doctor / Medical Specialist";
      else if (u.role === "receptionist") roleDisplay = "Reception Desk Staff";
      else if (u.role === "pharmacist") roleDisplay = "Pharmacist / Chemist";
      else if (u.role === "radiologist") roleDisplay = "Radiology Lab Tech";

      // Hide delete button for self or default doctor account
      const isSelf = currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase();
      const isPrimaryDoctor = u.username.toLowerCase() === "doctor";
      
      let actionHtml = "";
      if (isSelf) {
        actionHtml = `<span style="font-size:0.8rem; color:var(--color-success); font-weight:600; padding:0.4rem 0.85rem; display:inline-block;">✓ You (Current Session)</span>`;
      } else if (isPrimaryDoctor) {
        actionHtml = `<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic; padding:0.4rem 0.85rem; display:inline-block;">System Owner</span>`;
      } else {
        actionHtml = `<button class="btn btn-danger btn-sm btn-delete-staff" data-username="${u.username}"><i data-lucide="trash-2" style="width:12px; height:12px;"></i> Remove Staff</button>`;
      }

      tr.innerHTML = `
        <td style="padding: 1rem; font-weight:600; color:#fff;">${u.name}</td>
        <td style="padding: 1rem; font-family: monospace; font-weight:600; color:var(--color-cyan);">${u.username}</td>
        <td style="padding: 1rem;">${roleDisplay}</td>
        <td style="padding: 1rem; text-align: right;">${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    // Attach click listeners to delete buttons
    document.querySelectorAll(".btn-delete-staff").forEach(btn => {
      btn.addEventListener("click", async () => {
        const username = btn.getAttribute("data-username");
        if (confirm(`Are you sure you want to remove staff user '${username}'? This action cannot be undone.`)) {
          try {
            const deleteRes = await fetch(`/api/auth/users/${username}`, {
              method: "DELETE"
            });
            const data = await deleteRes.json();
            if (!deleteRes.ok) {
              throw new Error(data.error || "Failed to delete user");
            }
            alert(`Staff user '${username}' removed successfully.`);
            await addLog(`Staff user removed by Doctor: ${username}`, "warning");
            renderStaffMgmtTable();
          } catch (err) {
            alert(`Error: ${err.message}`);
          }
        }
      });
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  } catch (err) {
    console.error("Error rendering staff registry:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="no-data" style="text-align:center; padding: 2rem; color: var(--color-danger);">Failed to load staff list.</td>
      </tr>
    `;
  }
}

let pollIntervalId = null;

function startPollingUpdates() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
  }
  // Poll every 5 seconds
  pollIntervalId = setInterval(async () => {
    // Only poll if a user is logged in
    if (!currentUser) return;
    
    // Prevent polling if we are currently editing/typing in active inputs on forms!
    const activeElement = document.activeElement;
    const isEditing = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT'
    );
    if (isEditing) {
      // Skip rendering if user is actively typing, but we can still fetch patients in memory
      try {
        const pResponse = await fetch('/api/patients');
        if (pResponse.ok) {
          patients = await pResponse.json();
          upgradeDatabaseSchema();
        }
      } catch (e) {
        console.warn("Silent polling sync failed:", e);
      }
      return;
    }

    try {
      const pResponse = await fetch('/api/patients');
      if (pResponse.ok) {
        const newPatients = await pResponse.json();
        
        // Simple optimization: only render if the data has actually changed!
        const patientsChanged = JSON.stringify(newPatients) !== JSON.stringify(patients);
        if (patientsChanged) {
          patients = newPatients;
          upgradeDatabaseSchema();
          renderAllQueues();
          
          const activeNav = document.querySelector(".nav-item.active");
          if (activeNav) {
            const currentView = activeNav.getAttribute("data-view");
            if (currentView === "registry") {
              renderRegistryTable();
            } else if (currentView === "staff-mgmt") {
              renderStaffMgmtTable();
            }
          }
          console.log("Real-time queues updated via polling.");
        }
      }
    } catch (err) {
      console.warn("Polling updates failed:", err);
    }
  }, 5000);
}
