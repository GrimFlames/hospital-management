require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const db = require('./database');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files directly from this directory
app.use(express.static(__dirname));

// Helper to generate formatted date string
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

// 1. Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const list = await db.getPatients();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get specific patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await db.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create or check-in patient
app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, gender, phone, bloodGroup, vitals } = req.body;
    
    if (!name || !age || !gender || !phone || !bloodGroup || !vitals) {
      return res.status(400).json({ error: 'Missing required patient intake fields' });
    }
    
    const patients = await db.getPatients();
    const currentDateTime = getFormattedDateTime();
    
    const newVisit = {
      date: currentDateTime,
      examDate: "",
      vitals: {
        temp: parseFloat(vitals.temp),
        weight: parseFloat(vitals.weight),
        bp: vitals.bp,
        pulse: parseInt(vitals.pulse)
      },
      symptoms: "",
      prevHistory: "",
      familyHistory: "",
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
    };

    // Check if patient already exists (returning patient match by Name or Phone)
    let p = patients.find(pat => pat.phone === phone || pat.name.toLowerCase() === name.toLowerCase());
    
    if (p) {
      // Returning patient
      p.age = parseInt(age);
      p.phone = phone;
      p.bloodGroup = bloodGroup;
      
      // Auto-prefill previous history from the latest visit if any
      const lastVisit = p.visits[p.visits.length - 1];
      if (lastVisit) {
        newVisit.prevHistory = lastVisit.prevHistory || lastVisit.diagnosis || "";
        newVisit.familyHistory = lastVisit.familyHistory || "";
        newVisit.physicalExam = lastVisit.physicalExam || "";
      }
      
      p.visits.push(newVisit);
      p.logs.push(`New check-in on ${currentDateTime} with vitals: Temp ${vitals.temp}°F, BP ${vitals.bp}, Pulse ${vitals.pulse}bpm.`);
      
      await db.savePatient(p);
      await db.addLog(`Returning patient ${p.name} (${p.id}) checked in.`, "success");
      res.status(200).json({ message: 'Patient checked in successfully', patient: p });
    } else {
      // Create new patient ID
      // Find max ID in current database to increment securely
      let maxNum = 1000;
      patients.forEach(pat => {
        const num = parseInt(pat.id.split('-')[1]);
        if (num > maxNum) maxNum = num;
      });
      const newId = `PAT-${maxNum + 1}`;
      
      const newPatient = {
        id: newId,
        name,
        age: parseInt(age),
        gender,
        phone,
        bloodGroup,
        visits: [newVisit],
        logs: [`Registered at reception on ${currentDateTime} with vitals: Temp ${vitals.temp}°F, BP ${vitals.bp}.`]
      };
      
      await db.savePatient(newPatient);
      await db.addLog(`New patient registered: ${name} (${newId}).`, "success");
      res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update existing patient details (prescriptions, findings, dispense status)
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPatient = req.body;
    
    const existing = await db.getPatient(id);
    if (!existing) {
      return res.status(404).json({ error: 'Patient record not found' });
    }
    
    // Ensure ID isn't modified
    updatedPatient.id = id;
    
    await db.savePatient(updatedPatient);
    res.json({ message: 'Patient updated successfully', patient: updatedPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get system logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Post system logs
app.post('/api/logs', async (req, res) => {
  try {
    const { text, type } = req.body;
    await db.addLog(text, type || 'info');
    res.json({ message: 'Log added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Reset DB to Mock Data
app.post('/api/reset', async (req, res) => {
  try {
    await db.resetDatabase();
    res.json({ message: 'Database reset completed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const users = await db.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields (username, password, name, role) are required' });
    }
    const users = await db.getUsers();
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const newUser = { username, password, name, role };
    await db.saveUser(newUser);
    await db.addLog(`New staff user registered: ${name} (${username}) with role ${role}.`, "info");
    res.status(201).json({
      message: 'Registration successful',
      user: { username, name, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9.5. Get all users (sanitized, omitting password)
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    const sanitized = users.map(u => ({
      username: u.username,
      name: u.name,
      role: u.role
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. User Deletion
app.delete('/api/auth/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username parameter is required' });
    }
    const User = db.User;
    const result = await User.findOneAndDelete({ username: username.toLowerCase() });
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    await db.addLog(`Staff user deleted: ${result.name} (${result.username})`, "info");
    res.json({ message: 'User deleted successfully', username: result.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
async function start() {
  try {
    await db.loadDatabase();
    app.listen(PORT, () => {
      const localIp = getLocalIpAddress();
      console.log(`====================================================`);
      console.log(`   Lifeline Medicare Centre HMS Server is running   `);
      console.log(`   Local Host URL:  http://localhost:${PORT}        `);
      console.log(`   Local Network URL: http://${localIp}:${PORT}     `);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error("Failed to start hospital backend server:", err);
    process.exit(1);
  }
}

start();
