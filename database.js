const mongoose = require('mongoose');

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
        diagnosis: "Allergic Rhinitis",
        medicines: [{ name: "Cetirizine", dose: "10mg", freq: "0-0-1", dur: "5 Days", dispensed: true }],
        reports: [],
        status: "completed",
        needsPharmacy: true,
        needsRadiology: false,
        pharmacyDispensed: true,
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        medicinesBillPaid: true,
        medicinesBillAmount: 150
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
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        medicinesBillPaid: false,
        medicinesBillAmount: 0
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
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        medicinesBillPaid: false,
        medicinesBillAmount: 250
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
        radiologyCompleted: false,
        consultationFee: 1000,
        consultationDiscount: 0,
        consultationPaid: true,
        medicinesBillPaid: false,
        medicinesBillAmount: 480
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

const defaultUsers = [
  { username: "doctor", password: "doctor123", name: "Dr. Aditi Chaudhary", role: "doctor" },
  { username: "receptionist", password: "receptionist123", name: "Reception Staff", role: "receptionist" },
  { username: "pharmacist", password: "pharmacist123", name: "Pharmacy Staff", role: "pharmacist" },
  { username: "radiologist", password: "radiologist123", name: "Radiology Staff", role: "radiologist" },
  { username: "nurse_joy", password: "password123", name: "Nurse Joy", role: "receptionist" },
  { username: "Dr. Aditi", password: "2402", name: "Aditi Chaudhary", role: "doctor" },
  { username: "receptionist_sarah", password: "password123", name: "Sarah Miller", role: "receptionist" },
  { username: "pharma123", password: "pharma123", name: "pharma", role: "pharmacist" },
  { username: "Adi", password: "pharma123", name: "pharma", role: "pharmacist" }
];

// Define Schemas

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true }
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
  dispensed: { type: Boolean, default: false }
});

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'pending' },
  findings: { type: String, default: '' }
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
  needsPharmacy: { type: Boolean, default: false },
  needsRadiology: { type: Boolean, default: false },
  pharmacyDispensed: { type: Boolean, default: false },
  radiologyCompleted: { type: Boolean, default: false },
  consultationFee: { type: Number, default: 1000 },
  consultationDiscount: { type: Number, default: 0 },
  consultationPaid: { type: Boolean, default: false },
  medicinesBillPaid: { type: Boolean, default: false },
  medicinesBillAmount: { type: Number, default: 0 }
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
    } catch (err) {
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
    await User.insertMany(defaultUsers);
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
    const idA = parseInt(a.id.split('-')[1]);
    const idB = parseInt(b.id.split('-')[1]);
    return idA - idB;
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
    { upsert: true, new: true, runValidators: true }
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
  return await User.findOneAndUpdate(
    { username: user.username.toLowerCase() },
    user,
    { upsert: true, new: true, runValidators: true }
  );
}

async function resetDatabase() {
  await Patient.deleteMany({});
  await User.deleteMany({});
  await SystemLog.deleteMany({});
  
  await User.insertMany(defaultUsers);
  await Patient.insertMany(mockPatients);
  await SystemLog.insertMany(mockLogs);
  console.log("Database reset and re-seeded in MongoDB.");
}

module.exports = {
  loadDatabase,
  getPatients,
  getPatient,
  savePatient,
  getLogs,
  addLog,
  getUsers,
  saveUser,
  resetDatabase,
  Patient,
  User,
  SystemLog
};
