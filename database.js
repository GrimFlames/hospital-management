const mongoose = require('mongoose');

// Mock Patients Data
const mockPatients = [];

const mockLogs = [];

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
  resetDatabase,
  Patient,
  User,
  SystemLog
};
