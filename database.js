const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper to hash password
function hashPassword(password) {
  if (!password) return password;
  if (password.startsWith('$2a$') || password.startsWith('$2b$')) return password;
  return bcrypt.hashSync(password, 10);
}

// Helper to verify password
function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return bcrypt.compareSync(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}

// Mock Patients Data
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
        familyHistory: "None",
        physicalExam: "Nasal mucosal erythema",
        diagnosis: "Allergic Rhinitis",
        medicines: [{ name: "Cetirizine", dose: "10mg", freq: "0-0-1", dur: "5 Days", dispensed: true }],
        reports: [],
        status: "COMPLETED",
        needsPharmacy: true,
        needsRadiology: false,
        pharmacyDispensed: true,
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        medicinesBillPaid: true,
        medicinesBillAmount: 150
      }
    ],
    logs: ["Registered at reception on 28-Jun-2026 10:15 with vitals: Temp 98.4°F, BP 120/80."]
  },
  {
    id: "PAT-1002",
    name: "Pooja Verma",
    age: 42,
    gender: "Female",
    phone: "9812345678",
    bloodGroup: "B+",
    visits: [
      {
        date: "02-Jul-2026 09:30",
        examDate: "",
        vitals: { temp: 99.1, weight: 62, bp: "130/85", pulse: 78 },
        symptoms: "Persistent dry cough and mild fever.",
        prevHistory: "Hypertension",
        familyHistory: "Diabetes",
        physicalExam: "",
        diagnosis: "",
        medicines: [],
        reports: [],
        status: "WAITING_FOR_DOCTOR",
        needsPharmacy: false,
        needsRadiology: false,
        pharmacyDispensed: false,
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: false,
        medicinesBillPaid: false,
        medicinesBillAmount: 0
      }
    ],
    logs: ["Registered at reception on 02-Jul-2026 09:30 with vitals: Temp 99.1°F, BP 130/85."]
  }
];

// Master Scans Catalog (Predefined 10 standard scans with current prices)
const masterScansList = [
  { id: "SCAN-01", name: "Chest X-Ray (PA View)", modality: "X-Ray", price: 500, description: "Standard pulmonary and thoracic imaging." },
  { id: "SCAN-02", name: "Ultrasound Abdomen & Pelvis (USG)", modality: "Ultrasound", price: 1200, description: "Complete abdominal sonography for liver, kidneys & spleen." },
  { id: "SCAN-03", name: "CT Scan Brain (Plain)", modality: "CT Scan", price: 2500, description: "High-resolution non-contrast cranial axial imaging." },
  { id: "SCAN-04", name: "HRCT Chest (Lungs)", modality: "CT Scan", price: 3500, description: "High-resolution lung parenchymal scan for infection/fibrosis." },
  { id: "SCAN-05", name: "MRI Lumbar Spine", modality: "MRI", price: 5000, description: "Spinal cord and lumbar disc herniation imaging." },
  { id: "SCAN-06", name: "2D Echocardiography (Echo)", modality: "Cardiology", price: 1800, description: "Cardiac Doppler and left ventricular ejection fraction study." },
  { id: "SCAN-07", name: "Complete Blood Count (CBC) & ESR", modality: "Pathology", price: 350, description: "Automated hemogram with erythrocyte sedimentation rate." },
  { id: "SCAN-08", name: "Liver Function Test (LFT)", modality: "Pathology", price: 650, description: "Serum bilirubin, SGOT, SGPT, ALP & total protein profile." },
  { id: "SCAN-09", name: "Kidney Function Test (KFT)", modality: "Pathology", price: 600, description: "Serum creatinine, BUN, uric acid & electrolyte levels." },
  { id: "SCAN-10", name: "HbA1c & Fasting Blood Sugar", modality: "Pathology", price: 450, description: "Glycated hemoglobin 3-month glycemic control assessment." }
];

// Master Doctor Profiles for Admin Directory
const defaultDoctors = [
  { id: "DOC-01", name: "Dr. Aditi Chaudhary", username: "doctor", gender: "Female", specialty: "General Physician & Pulmonologist", rating: "5.0", reviews: 142, status: "Available", room: "Room 101", image: "/assets/avatars/female_doctor_1.png" },
  { id: "DOC-02", name: "Dr. Jaylon Stanton", username: "doc_jaylon", gender: "Male", specialty: "Dentist & Dental Surgeon", rating: "4.9", reviews: 98, status: "In Consultation", room: "Room 104", image: "/assets/avatars/male_doctor_1.png" },
  { id: "DOC-03", name: "Dr. Carla Schleifer", username: "doc_carla", gender: "Female", specialty: "Ophthalmologist / Eye Specialist", rating: "4.8", reviews: 84, status: "Available", room: "Room 108", image: "/assets/avatars/female_doctor_3.png" },
  { id: "DOC-04", name: "Dr. Hanna Geidt", username: "doc_hanna", gender: "Female", specialty: "Consultant Surgeon", rating: "5.0", reviews: 120, status: "In Surgery", room: "OT-2", image: "/assets/avatars/female_doctor_2.png" },
  { id: "DOC-05", name: "Dr. Roger George", username: "doc_roger", gender: "Male", specialty: "Senior Cardiologist", rating: "4.9", reviews: 110, status: "Available", room: "Room 112", image: "/assets/avatars/male_doctor_2.png" }
];

// Master Medicines & Drug Formulary Database (Free Access with Generic & Brand Suggestion Engine)
const masterMedicinesList = [
  { id: "MED-01", name: "Dolo 650", genericName: "Paracetamol", composition: "Paracetamol 650mg", category: "Analgesic / Antipyretic", defaultDose: "650mg", defaultFreq: "1-0-1", defaultDur: "5 Days", price: 35, alternativeBrands: ["Calpol 650 (₹32)", "Pacimol 650 (₹30)", "Crocin 650 (₹36)"] },
  { id: "MED-02", name: "Augmentin 625", genericName: "Amoxicillin + Clavulanic Acid", composition: "Amoxicillin 500mg + Potassium Clavulanate 125mg", category: "Antibiotic", defaultDose: "625mg", defaultFreq: "1-0-1", defaultDur: "5 Days", price: 210, alternativeBrands: ["Moxikind-CV 625 (₹175)", "Clavam 625 (₹198)", "Advent 625 (₹190)"] },
  { id: "MED-03", name: "Pan 40", genericName: "Pantoprazole", composition: "Pantoprazole Sodium 40mg", category: "Antacid / PPI", defaultDose: "40mg", defaultFreq: "1-0-0", defaultDur: "10 Days", price: 145, alternativeBrands: ["Pantocid 40 (₹138)", "Pantodac 40 (₹140)", "Pantosec 40 (₹130)"] },
  { id: "MED-04", name: "Azithral 500", genericName: "Azithromycin", composition: "Azithromycin 500mg", category: "Macrolide Antibiotic", defaultDose: "500mg", defaultFreq: "1-0-0", defaultDur: "3 Days", price: 120, alternativeBrands: ["Azee 500 (₹118)", "Zady 500 (₹112)", "Azimax 500 (₹105)"] },
  { id: "MED-05", name: "Montair-LC", genericName: "Montelukast + Levocetirizine", composition: "Montelukast 10mg + Levocetirizine Hydrochloride 5mg", category: "Antiallergic", defaultDose: "10mg/5mg", defaultFreq: "0-0-1", defaultDur: "7 Days", price: 180, alternativeBrands: ["Telekast-L (₹165)", "Montek-LC (₹170)", "Levocet-M (₹140)"] },
  { id: "MED-06", name: "Glycomet-GP 1", genericName: "Metformin + Glimepiride", composition: "Glimepiride 1mg + Metformin 500mg", category: "Anti-Diabetic", defaultDose: "1mg/500mg", defaultFreq: "1-0-0", defaultDur: "30 Days", price: 130, alternativeBrands: ["Amaryl-M 1 (₹145)", "Zoryl-M 1 (₹125)", "Gluconorm-G 1 (₹115)"] },
  { id: "MED-07", name: "Telma 40", genericName: "Telmisartan", composition: "Telmisartan 40mg", category: "Antihypertensive (BP)", defaultDose: "40mg", defaultFreq: "1-0-0", defaultDur: "30 Days", price: 165, alternativeBrands: ["Telmikind 40 (₹110)", "Telsar 40 (₹120)", "Creser 40 (₹95)"] },
  { id: "MED-08", name: "Atorva 10", genericName: "Atorvastatin", composition: "Atorvastatin Calcium 10mg", category: "Lipid Lowering / Statin", defaultDose: "10mg", defaultFreq: "0-0-1", defaultDur: "30 Days", price: 110, alternativeBrands: ["Lipitor 10 (₹150)", "Storvas 10 (₹105)", "Tonact 10 (₹98)"] },
  { id: "MED-09", name: "Emset 4", genericName: "Ondansetron", composition: "Ondansetron 4mg", category: "Antiemetic (Nausea/Vomiting)", defaultDose: "4mg", defaultFreq: "1-0-1", defaultDur: "3 Days", price: 65, alternativeBrands: ["Vomistop 4 (₹45)", "Ondem 4 (₹58)", "Zofran 4 (₹75)"] },
  { id: "MED-10", name: "Combiflam", genericName: "Ibuprofen + Paracetamol", composition: "Ibuprofen 400mg + Paracetamol 325mg", category: "Pain Relief / NSAID", defaultDose: "400mg/325mg", defaultFreq: "1-0-1", defaultDur: "3 Days", price: 48, alternativeBrands: ["Ibugesic Plus (₹42)", "Brufen Plus (₹50)", "Flexon (₹38)"] },
  { id: "MED-11", name: "Taxim-O 200", genericName: "Cefixime", composition: "Cefixime 200mg", category: "Cephalosporin Antibiotic", defaultDose: "200mg", defaultFreq: "1-0-1", defaultDur: "5 Days", price: 175, alternativeBrands: ["Zifi 200 (₹168)", "Mahacef 200 (₹155)", "Cefolac 200 (₹160)"] },
  { id: "MED-12", name: "Ascoril-D Plus", genericName: "Dextromethorphan + Phenylephrine + CPM", composition: "Cough Syrup 100ml", category: "Cough & Cold", defaultDose: "10ml", defaultFreq: "1-1-1", defaultDur: "5 Days", price: 135, alternativeBrands: ["Benadryl DR (₹140)", "Alex Syrup (₹130)", "Chericof (₹115)"] },
  { id: "MED-13", name: "Omez 20", genericName: "Omeprazole", composition: "Omeprazole Magnesium 20mg", category: "Antacid / PPI", defaultDose: "20mg", defaultFreq: "1-0-0", defaultDur: "14 Days", price: 60, alternativeBrands: ["Ocid 20 (₹55)", "Omecip 20 (₹48)", "Proceptin 20 (₹52)"] },
  { id: "MED-14", name: "Shelcal 500", genericName: "Calcium + Vitamin D3", composition: "Calcium Carbonate 500mg + Vitamin D3 250IU", category: "Nutritional Supplement", defaultDose: "500mg", defaultFreq: "0-0-1", defaultDur: "30 Days", price: 120, alternativeBrands: ["Cipcal 500 (₹110)", "Calcimax 500 (₹115)", "Gemcal (₹140)"] },
  { id: "MED-15", name: "Becosules Z", genericName: "B-Complex + Vitamin C + Zinc", composition: "Vitamin B-Complex + Ascorbic Acid + Zinc Sulphate", category: "Multivitamin", defaultDose: "1 Cap", defaultFreq: "0-1-0", defaultDur: "30 Days", price: 55, alternativeBrands: ["Cobadex CZS (₹60)", "Neurobion Forte (₹42)", "Polybion (₹48)"] },
  { id: "MED-16", name: "Ciplox 500", genericName: "Ciprofloxacin", composition: "Ciprofloxacin Hydrochloride 500mg", category: "Fluoroquinolone Antibiotic", defaultDose: "500mg", defaultFreq: "1-0-1", defaultDur: "5 Days", price: 45, alternativeBrands: ["Cifran 500 (₹48)", "Ceepro 500 (₹40)", "Alcipro 500 (₹42)"] },
  { id: "MED-17", name: "Allegra 120", genericName: "Fexofenadine", composition: "Fexofenadine Hydrochloride 120mg", category: "Non-sedating Antihistamine", defaultDose: "120mg", defaultFreq: "1-0-0", defaultDur: "10 Days", price: 195, alternativeBrands: ["Fexova 120 (₹140)", "Histafree 120 (₹135)", "Allegix 120 (₹150)"] },
  { id: "MED-18", name: "Rantac 150", genericName: "Ranitidine", composition: "Ranitidine Hydrochloride 150mg", category: "H2 Blocker / Antacid", defaultDose: "150mg", defaultFreq: "1-0-1", defaultDur: "7 Days", price: 40, alternativeBrands: ["Zinetac 150 (₹38)", "Aciloc 150 (₹42)", "Histac 150 (₹35)"] },
  { id: "MED-19", name: "Duolin Respules", genericName: "Levosalbutamol + Ipratropium", composition: "Levosalbutamol 1.25mg + Ipratropium 500mcg Respules (Pack of 5)", category: "Bronchodilator / Respiratory", defaultDose: "1 Respule", defaultFreq: "1-0-1", defaultDur: "3 Days", price: 220, alternativeBrands: ["Combimist L (₹195)", "Foracort (₹260)", "Aerocort (₹210)"] },
  { id: "MED-20", name: "Candid B Cream", genericName: "Clotrimazole + Beclomethasone", composition: "Clotrimazole 1% + Beclomethasone 0.025% Cream 20g", category: "Topical Antifungal / Steroid", defaultDose: "Apply 2x", defaultFreq: "1-0-1", defaultDur: "7 Days", price: 145, alternativeBrands: ["Canesten Plus (₹135)", "Cloderm-B (₹110)", "Triben-B (₹98)"] },
  { id: "MED-21", name: "Moxikind 500", genericName: "Amoxicillin", composition: "Amoxicillin Trihydrate 500mg", category: "Penicillin Antibiotic", defaultDose: "500mg", defaultFreq: "1-1-1", defaultDur: "5 Days", price: 85, alternativeBrands: ["Novamox 500 (₹82)", "Almox 500 (₹78)", "Amoxil 500 (₹90)"] },
  { id: "MED-22", name: "Meftal-Spas", genericName: "Mefenamic Acid + Dicyclomine", composition: "Mefenamic Acid 250mg + Dicyclomine HCl 10mg", category: "Antispasmodic & Analgesic", defaultDose: "1 Tab", defaultFreq: "1-0-1", defaultDur: "3 Days", price: 55, alternativeBrands: ["Colimex (₹45)", "Spasmo-Proxyvon (₹60)", "Dysmen (₹40)"] },
  { id: "MED-23", name: "Refresh Tears", genericName: "Carboxymethylcellulose", composition: "Carboxymethylcellulose Sodium 0.5% Eye Drops 10ml", category: "Ophthalmic Lubricant", defaultDose: "1 Drop", defaultFreq: "1-1-1", defaultDur: "15 Days", price: 165, alternativeBrands: ["Tears Naturale (₹180)", "EcoTears (₹130)", "Lubistar (₹125)"] },
  { id: "MED-24", name: "Volini Gel", genericName: "Diclofenac Gel", composition: "Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate 30g", category: "Topical Pain Relief", defaultDose: "Apply 3x", defaultFreq: "1-1-1", defaultDur: "7 Days", price: 130, alternativeBrands: ["Moov (₹115)", "OmniGel (₹120)", "Fast Relief (₹100)"] },
  { id: "MED-25", name: "Kenacort 0.1%", genericName: "Triamcinolone Acetonide", composition: "Triamcinolone Acetonide Oral Paste 5g", category: "Oral Anti-Inflammatory", defaultDose: "Apply bed-time", defaultFreq: "0-0-1", defaultDur: "5 Days", price: 125, alternativeBrands: ["Tess Oral Paste (₹115)", "Orasore Gel (₹75)", "Mucopain (₹85)"] }
];

const mockLogs = [
  { text: "System database initialized with modernized decentralized billing & smart drug suggestion engine.", type: "info", time: "10:00 AM" }
];

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

// Animated Character Avatar Generator based on Name & Gender
function generateAnimatedAvatar(name, gender) {
  const seed = (name || 'staff').toLowerCase().trim();
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

const defaultUsers = [
  { username: "doctor", password: "doctor123", name: "Dr. Aditi Chaudhary", role: "doctor", gender: "Female", specialty: "General Physician & Pulmonologist", room: "Room 101", phone: "9876500001", image: "/assets/avatars/female_doctor_1.png" },
  { username: "receptionist", password: "receptionist123", name: "Pooja Sharma", role: "receptionist", gender: "Female", specialty: "Front Desk & Patient Triage Lead", room: "Reception Desk", phone: "9876500002", image: "/assets/avatars/female_doctor_3.png" },
  { username: "pharmacist", password: "pharmacist123", name: "Rahul Verma", role: "pharmacist", gender: "Male", specialty: "Chief Clinical Pharmacist", room: "Pharmacy POS Counter", phone: "9876500003", image: "/assets/avatars/male_doctor_1.png" },
  { username: "radiologist", password: "radiologist123", name: "Vikram Malhotra", role: "radiologist", gender: "Male", specialty: "Senior Diagnostic Radiologist", room: "Radiology Lab 1", phone: "9876500004", image: "/assets/avatars/male_doctor_2.png" },
  { username: "admin", password: "admin123", name: "System Administrator", role: "admin", gender: "Female", specialty: "Hospital Operations & IT Director", room: "Executive Suite", phone: "9876500000", image: "/assets/avatars/female_doctor_2.png" }
];

// Define Schemas

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  gender: { type: String, default: 'Female' },
  specialty: { type: String, default: 'General Staff' },
  room: { type: String, default: 'Main Clinic' },
  phone: { type: String, default: '' },
  image: { type: String, default: '' }
});

const systemLogSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, default: 'info' },
  time: { type: String, required: true }
}, { timestamps: true });

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dose: { type: String, default: 'N/A' },
  freq: { type: String, default: '1-0-1' },
  dur: { type: String, default: '5 Days' },
  price: { type: Number, default: 0 },
  dispensed: { type: Boolean, default: false }
});

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  modality: { type: String, default: 'General' },
  price: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  findings: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' }
});

const visitSchema = new mongoose.Schema({
  date: { type: String, required: true },
  examDate: { type: String, default: '' },
  vitals: {
    temp: { type: Number, default: 98.6 },
    weight: { type: Number, default: 70 },
    bp: { type: String, default: '120/80' },
    pulse: { type: Number, default: 72 }
  },
  symptoms: { type: String, default: '' },
  prevHistory: { type: String, default: '' },
  familyHistory: { type: String, default: '' },
  physicalExam: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  medicines: [medicineSchema],
  reports: [reportSchema],
  status: { type: String, default: 'WAITING_FOR_DOCTOR' },
  
  // Reception Consultation Billing
  consultationFee: { type: Number, default: 1000 },
  consultationDiscount: { type: Number, default: 0 },
  consultationPaid: { type: Boolean, default: false },
  consultationPaymentMode: { type: String, default: 'Cash' },
  
  // Pharmacy Direct In-Department Billing & Dispensation
  needsPharmacy: { type: Boolean, default: false },
  pharmacyDispensed: { type: Boolean, default: false },
  medicinesBillAmount: { type: Number, default: 0 },
  medicinesBillPaid: { type: Boolean, default: false },
  pharmacyPaymentMode: { type: String, default: 'Cash' },
  
  // Radiology Direct In-Department Billing & Reporting
  needsRadiology: { type: Boolean, default: false },
  radiologyCompleted: { type: Boolean, default: false },
  radiologyBillAmount: { type: Number, default: 0 },
  radiologyBillPaid: { type: Boolean, default: false },
  radiologyPaymentMode: { type: String, default: 'Cash' }
});

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  visits: [visitSchema],
  logs: [{ type: String }]
});

// Compile Models
const User = mongoose.model('User', userSchema);
const SystemLog = mongoose.model('SystemLog', systemLogSchema);
const Patient = mongoose.model('Patient', patientSchema);

// DB Handlers

let mongod = null;

async function loadDatabase() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri || uri.startsWith("mongodb://127.0.0.1") || uri.startsWith("mongodb://localhost")) {
    try {
      console.log("Checking for active local MongoDB instance...");
      const targetUri = uri || "mongodb://127.0.0.1:27017/lifeline_hms";
      await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`Connected successfully to local MongoDB instance: ${targetUri}`);
    } catch {
      console.log("Local MongoDB instance not found. Starting in-memory MongoDB server...");
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`In-memory MongoDB started at: ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log("Connected successfully to in-memory MongoDB.");
    }
  } else {
    console.log(`Connecting to MongoDB Atlas: ${uri.includes('@') ? uri.split('@')[1] : uri}...`);
    await mongoose.connect(uri);
    console.log("Connected successfully to MongoDB.");
  }

  // Seeding Logic
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("No staff users found in MongoDB. Seeding default users...");
    const hashedDefaultUsers = defaultUsers.map(u => ({
      ...u,
      password: hashPassword(u.password)
    }));
    await User.insertMany(hashedDefaultUsers);
  }

  const patientCount = await Patient.countDocuments();
  if (patientCount === 0) {
    console.log("No patients found in MongoDB. Seeding mock patients...");
    await Patient.insertMany(mockPatients);
  }

  const logCount = await SystemLog.countDocuments();
  if (logCount === 0) {
    console.log("No system logs found in MongoDB. Seeding mock logs...");
    await SystemLog.insertMany(mockLogs);
  }
}

async function getPatients() {
  const list = await Patient.find({}).lean();
  // Sort patients by ID numerically
  list.sort((a, b) => {
    const numA = parseInt((a.id || '').split('-')[1]) || 0;
    const numB = parseInt((b.id || '').split('-')[1]) || 0;
    return numA - numB;
  });
  return list;
}

async function getPatient(id) {
  return await Patient.findOne({ id }).lean();
}

async function savePatient(patient) {
  const cleanPatient = JSON.parse(JSON.stringify(patient));
  delete cleanPatient._id; // Ensure we don't try to overwrite immutable _id if present
  
  return await Patient.findOneAndUpdate(
    { id: patient.id },
    cleanPatient,
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
}

async function getLogs() {
  const list = await SystemLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
  return list;
}

async function addLog(text, type = "info") {
  const now = new Date();
  const time = now.toLocaleTimeString();
  const logItem = new SystemLog({ text, type, time });
  await logItem.save();
}

async function getUsers() {
  return await User.find({}).lean();
}

async function saveUser(user) {
  const userToSave = { ...user };
  if (userToSave.password) {
    userToSave.password = hashPassword(userToSave.password);
  }
  return await User.findOneAndUpdate(
    { username: userToSave.username.toLowerCase() },
    userToSave,
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
}

async function resetDatabase() {
  await Patient.deleteMany({});
  await User.deleteMany({});
  await SystemLog.deleteMany({});
  
  const hashedDefaultUsers = defaultUsers.map(u => ({
    ...u,
    password: hashPassword(u.password)
  }));
  await User.insertMany(hashedDefaultUsers);
  await Patient.insertMany(mockPatients);
  await SystemLog.insertMany(mockLogs);
  console.log("Database reset and re-seeded in MongoDB.");
}

async function deletePatient(id) {
  return await Patient.findOneAndDelete({ id });
}

module.exports = {
  loadDatabase,
  getPatients,
  getPatient,
  savePatient,
  deletePatient,
  getLogs,
  addLog,
  getUsers,
  saveUser,
  verifyPassword,
  hashPassword,
  resetDatabase,
  generateAnimatedAvatar,
  masterScansList,
  masterMedicinesList,
  defaultDoctors,
  defaultUsers,
  Patient,
  User,
  SystemLog
};
