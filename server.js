require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
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

// Whitelist and serve frontend client assets securely (prevents exposing .env, package.json, and backend source files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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

// 4.5. Master Scans Catalog
app.get('/api/scans', (req, res) => {
  res.json(db.masterScansList);
});

// 4.55. Master Medicines & Drug Formulary Catalog
app.get('/api/medicines', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query) {
    return res.json(db.masterMedicinesList);
  }
  const filtered = db.masterMedicinesList.filter(m => 
    m.name.toLowerCase().includes(query) ||
    m.genericName.toLowerCase().includes(query) ||
    m.composition.toLowerCase().includes(query) ||
    (m.alternativeBrands && m.alternativeBrands.some(b => b.toLowerCase().includes(query)))
  );
  res.json(filtered);
});

// 4.6. Master Doctors List
app.get('/api/doctors', (req, res) => {
  res.json(db.defaultDoctors);
});

// 4.7. Direct Pharmacy Settlement & Dispensation (In-Department Billing)
app.post('/api/billing/pharmacy-settle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, medicines } = req.body;
    
    const p = await db.getPatient(id);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    
    const cv = p.visits && p.visits.length > 0 ? p.visits[p.visits.length - 1] : null;
    if (!cv) return res.status(400).json({ error: 'No active visit found' });
    
    let total = 0;
    if (Array.isArray(medicines)) {
      cv.medicines = medicines.map(m => {
        const pr = parseFloat(m.price) || 0;
        total += pr;
        return {
          ...m,
          price: pr,
          dispensed: true
        };
      });
    }
    
    cv.medicinesBillAmount = total;
    cv.medicinesBillPaid = true;
    cv.pharmacyDispensed = true;
    cv.pharmacyPaymentMode = paymentMode || 'Cash';
    
    if (cv.needsRadiology && !cv.radiologyCompleted) {
      cv.status = "pending_radiology";
    } else {
      cv.status = "COMPLETED";
    }
    
    p.logs.push(`Pharmacy bill of ₹${total.toFixed(2)} settled via ${cv.pharmacyPaymentMode}. Medicines dispensed at pharmacy counter.`);
    await db.savePatient(p);
    await db.addLog(`Pharmacy bill settled & dispensed for ${p.name} (₹${total.toFixed(2)} via ${cv.pharmacyPaymentMode}).`, "success");
    
    res.json({ message: 'Pharmacy billing settled and medicines dispensed', patient: p, totalSettled: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.8. Direct Radiology Settlement & Findings Upload (In-Department Billing)
app.post('/api/billing/radiology-settle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, reports } = req.body;
    
    const p = await db.getPatient(id);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    
    const cv = p.visits && p.visits.length > 0 ? p.visits[p.visits.length - 1] : null;
    if (!cv) return res.status(400).json({ error: 'No active visit found' });
    
    let total = 0;
    if (Array.isArray(reports)) {
      cv.reports = reports.map(r => {
        const pr = parseFloat(r.price) || 0;
        total += pr;
        return {
          ...r,
          price: pr,
          status: 'completed'
        };
      });
    }
    
    cv.radiologyBillAmount = total;
    cv.radiologyBillPaid = true;
    cv.radiologyCompleted = true;
    cv.radiologyPaymentMode = paymentMode || 'Cash';
    
    if (cv.needsPharmacy && !cv.pharmacyDispensed) {
      cv.status = "pending_pharmacy";
    } else {
      cv.status = "COMPLETED";
    }
    
    p.logs.push(`Radiology scan fee of ₹${total.toFixed(2)} settled via ${cv.radiologyPaymentMode}. Diagnostic report completed.`);
    await db.savePatient(p);
    await db.addLog(`Radiology scan settled & signed for ${p.name} (₹${total.toFixed(2)} via ${cv.radiologyPaymentMode}).`, "success");
    
    res.json({ message: 'Radiology bill settled and report completed', patient: p, totalSettled: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.9. Direct Reception Consultation Settlement
app.post('/api/billing/consultation-settle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, discount, fee } = req.body;
    
    const p = await db.getPatient(id);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    
    const cv = p.visits && p.visits.length > 0 ? p.visits[p.visits.length - 1] : null;
    if (!cv) return res.status(400).json({ error: 'No active visit found' });
    
    cv.consultationFee = parseFloat(fee) || 1000;
    cv.consultationDiscount = parseFloat(discount) || 0;
    cv.consultationPaid = true;
    cv.consultationPaymentMode = paymentMode || 'Cash';
    
    const netConsult = Math.max(0, cv.consultationFee - cv.consultationDiscount);
    p.logs.push(`Consultation fee of ₹${netConsult.toFixed(2)} paid via ${cv.consultationPaymentMode} at reception.`);
    await db.savePatient(p);
    await db.addLog(`Consultation fee settled for ${p.name} (₹${netConsult.toFixed(2)} via ${cv.consultationPaymentMode}).`, "success");
    
    res.json({ message: 'Consultation fee settled successfully', patient: p, netAmount: netConsult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.10. Admin Executive Analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const patients = await db.getPatients();
    const users = await db.getUsers();
    
    let totalPatients = patients.length;
    let totalConsultations = 0;
    let maleCount = 0;
    let femaleCount = 0;
    
    let consultRevenue = 0;
    let pharmaRevenue = 0;
    let radioRevenue = 0;
    
    patients.forEach(p => {
      if ((p.gender || '').toLowerCase() === 'female') femaleCount++;
      else maleCount++;
      
      if (Array.isArray(p.visits)) {
        p.visits.forEach(v => {
          totalConsultations++;
          if (v.consultationPaid) {
            consultRevenue += Math.max(0, (v.consultationFee || 1000) - (v.consultationDiscount || 0));
          }
          if (v.medicinesBillPaid) {
            pharmaRevenue += (v.medicinesBillAmount || 0);
          }
          if (v.radiologyBillPaid) {
            radioRevenue += (v.radiologyBillAmount || 0);
          }
        });
      }
    });
    
    const totalRevenue = consultRevenue + pharmaRevenue + radioRevenue;
    
    // Recent patients table
    const recentPatients = patients.slice(0, 5).map(p => {
      const cv = p.visits && p.visits.length > 0 ? p.visits[p.visits.length - 1] : {};
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        date: cv.date || 'N/A',
        diagnosis: cv.diagnosis || 'Under Examination',
        room: 'Room 101',
        status: cv.status || 'WAITING_FOR_DOCTOR'
      };
    });
    
    // Combine registered doctors and default doctors for Doctors on Duty
    const registeredDoctors = users
      .filter(u => u.role === 'doctor')
      .map((u, idx) => ({
        id: `DOC-REG-${idx + 1}`,
        name: u.name,
        username: u.username,
        gender: u.gender || 'Female',
        specialty: u.specialty || 'General Medicine',
        rating: '5.0',
        reviews: 24 + (idx * 8),
        status: 'Available',
        room: u.room || 'Room 101',
        image: u.image && u.image.trim() !== '' ? u.image : db.generateAnimatedAvatar(u.name, u.gender || 'Female')
      }));

    const combinedDoctors = [...registeredDoctors];
    db.defaultDoctors.forEach(dd => {
      if (!combinedDoctors.some(cd => cd.username.toLowerCase() === dd.username.toLowerCase())) {
        combinedDoctors.push({
          ...dd,
          image: dd.image && dd.image.trim() !== '' ? dd.image : db.generateAnimatedAvatar(dd.name, dd.gender || 'Female')
        });
      }
    });

    res.json({
      totalPatients,
      totalConsultations,
      totalStaff: users.length,
      rooms: 24,
      demographics: {
        male: maleCount,
        female: femaleCount
      },
      revenue: {
        total: totalRevenue,
        consultation: consultRevenue,
        pharmacy: pharmaRevenue,
        radiology: radioRevenue
      },
      doctors: combinedDoctors,
      recentPatients
    });
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
app.post(['/api/reset', '/api/reset-db'], async (req, res) => {
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
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && db.verifyPassword(password, u.password));
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const userImage = user.image && user.image.trim() !== '' 
      ? user.image 
      : db.generateAnimatedAvatar(user.name, user.gender || 'Female');

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        gender: user.gender || 'Female',
        specialty: user.specialty || 'General Staff',
        room: user.room || 'Main Clinic',
        phone: user.phone || '',
        image: userImage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. User Registration (with Photo Upload & Gender-Based Animated Avatar Generator)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, role, gender, specialty, room, phone, image } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields (username, password, name, role) are required' });
    }
    const users = await db.getUsers();
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const staffGender = gender || 'Female';
    const finalImage = image && image.trim() !== '' 
      ? image.trim() 
      : db.generateAnimatedAvatar(name, staffGender);

    const newUser = {
      username: username.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: role.toLowerCase().trim(),
      gender: staffGender,
      specialty: specialty ? specialty.trim() : 'Clinical Staff',
      room: room ? room.trim() : 'Consultation Wing',
      phone: phone ? phone.trim() : '',
      image: finalImage
    };

    await db.saveUser(newUser);
    await db.addLog(`New staff user registered: ${name} (${username}) with role ${role}.`, "info");
    res.status(201).json({
      message: 'Registration successful',
      user: {
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        gender: newUser.gender,
        specialty: newUser.specialty,
        room: newUser.room,
        phone: newUser.phone,
        image: newUser.image
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9.5. Get all users (sanitized, with gender, specialty, and avatar)
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    const sanitized = users.map(u => ({
      username: u.username,
      name: u.name,
      role: u.role,
      gender: u.gender || 'Female',
      specialty: u.specialty || 'General Staff',
      room: u.room || 'Main Clinic',
      phone: u.phone || '',
      image: u.image && u.image.trim() !== '' ? u.image : db.generateAnimatedAvatar(u.name, u.gender || 'Female')
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

// 10.5. Patient Deletion
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getPatient(id);
    if (!existing) {
      return res.status(404).json({ error: 'Patient record not found' });
    }
    await db.deletePatient(id);
    await db.addLog(`Patient record deleted: ${existing.name} (${id})`, "warning");
    res.json({ message: 'Patient record deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
async function start() {
  try {
    await db.loadDatabase();
    if (require.main === module) {
      app.listen(PORT, () => {
        const localIp = getLocalIpAddress();
        console.log(`====================================================`);
        console.log(`   Lifeline Medicare Centre HMS Server is running   `);
        console.log(`   Local Host URL:  http://localhost:${PORT}        `);
        console.log(`   Local Network URL: http://${localIp}:${PORT}     `);
        console.log(`====================================================`);
      });
    }
  } catch (err) {
    console.error("Failed to start hospital backend server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
