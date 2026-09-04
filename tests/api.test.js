const request = require('supertest');
const db = require('../database');
const { app } = require('../server');

describe('Hospital Management System API Tests (v2.0)', () => {
  beforeAll(async () => {
    await db.loadDatabase();
  }, 180000);

  afterAll(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
  });

  describe('1. Security & Static Serving Isolation', () => {
    test('GET /.env - should not serve sensitive environment file', async () => {
      const response = await request(app).get('/.env');
      expect(response.status).toBe(404);
    });

    test('GET / - should serve main index.html', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('2. Authentication & User Management', () => {
    test('POST /api/auth/login - should authenticate seeded doctor with bcrypt', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'doctor', password: 'doctor123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('doctor');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('POST /api/auth/login - should reject invalid credentials (401)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'doctor', password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    test('POST /api/auth/register - should register a new staff account', async () => {
      const newUser = {
        username: 'new_pharmacist',
        password: 'securePassword123',
        name: 'Pharma Phil',
        role: 'pharmacist'
      };
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.username).toBe('new_pharmacist');
    });

    test('GET /api/auth/users - should return sanitized user list', async () => {
      const response = await request(app).get('/api/auth/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(u => expect(u).not.toHaveProperty('password'));
    });

    test('DELETE /api/auth/users/:username - should delete staff account', async () => {
      const response = await request(app).delete('/api/auth/users/new_pharmacist');
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('new_pharmacist');
    });
  });

  describe('3. Master Catalogs & Doctors Directory', () => {
    test('GET /api/scans - should return 10 predefined diagnostic scans with prices', async () => {
      const response = await request(app).get('/api/scans');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(10);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('modality');
    });

    test('GET /api/doctors - should return default doctors directory', async () => {
      const response = await request(app).get('/api/doctors');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('specialty');
      expect(response.body[0]).toHaveProperty('rating');
    });
  });

  describe('4. Decentralized Departmental POS Direct Billing', () => {
    let testPatientId = '';

    test('POST /api/patients - create patient intake with consultation fee', async () => {
      const newPatientData = {
        name: 'Decentralized Billing Patient',
        age: 45,
        gender: 'Male',
        phone: '9888111222',
        bloodGroup: 'B+',
        vitals: {
          temp: 99.0,
          weight: 72,
          bp: '130/85',
          pulse: 76
        }
      };

      const response = await request(app)
        .post('/api/patients')
        .send(newPatientData);

      expect(response.status).toBe(201);
      testPatientId = response.body.patient.id;
    });

    test('POST /api/billing/consultation-settle/:id - settle reception consultation fee', async () => {
      const response = await request(app)
        .post(`/api/billing/consultation-settle/${testPatientId}`)
        .send({
          paymentMode: 'UPI',
          discount: 100,
          fee: 1000
        });

      expect(response.status).toBe(200);
      expect(response.body.netAmount).toBe(900);
      expect(response.body.patient.visits[0].consultationPaid).toBe(true);
    });

    test('PUT /api/patients/:id - Doctor prescribes medicine & orders scans', async () => {
      const fetchRes = await request(app).get(`/api/patients/${testPatientId}`);
      const patient = fetchRes.body;
      const cv = patient.visits[0];

      cv.diagnosis = 'Acute Pharyngitis';
      cv.needsPharmacy = true;
      cv.needsRadiology = true;
      cv.medicines = [
        { name: 'Azithromycin', dose: '500mg', freq: '1-0-0', dur: '3 Days', price: 150, dispensed: false },
        { name: 'Paracetamol', dose: '650mg', freq: '1-1-1', dur: '5 Days', price: 50, dispensed: false }
      ];
      cv.reports = [
        { name: 'Chest X-Ray (PA View)', modality: 'X-Ray', price: 500, status: 'pending', findings: '' }
      ];

      const updateRes = await request(app)
        .put(`/api/patients/${testPatientId}`)
        .send(patient);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.patient.visits[0].medicines.length).toBe(2);
    });

    test('POST /api/billing/pharmacy-settle/:id - Direct Pharmacy POS Billing & Dispensation', async () => {
      const response = await request(app)
        .post(`/api/billing/pharmacy-settle/${testPatientId}`)
        .send({
          paymentMode: 'Cash',
          medicines: [
            { name: 'Azithromycin', dose: '500mg', freq: '1-0-0', dur: '3 Days', price: 150 },
            { name: 'Paracetamol', dose: '650mg', freq: '1-1-1', dur: '5 Days', price: 50 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.totalSettled).toBe(200);
      expect(response.body.patient.visits[0].medicinesBillPaid).toBe(true);
      expect(response.body.patient.visits[0].pharmacyDispensed).toBe(true);
    });

    test('POST /api/billing/radiology-settle/:id - Direct Radiology POS Billing & Report Signing', async () => {
      const response = await request(app)
        .post(`/api/billing/radiology-settle/${testPatientId}`)
        .send({
          paymentMode: 'Card',
          reports: [
            { name: 'Chest X-Ray (PA View)', modality: 'X-Ray', price: 500, findings: 'Lungs normal, no consolidation.' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.totalSettled).toBe(500);
      expect(response.body.patient.visits[0].radiologyBillPaid).toBe(true);
      expect(response.body.patient.visits[0].radiologyCompleted).toBe(true);
    });
  });

  describe('5. Admin Executive Analytics & Reporting', () => {
    test('GET /api/admin/analytics - should return consolidated revenue breakdown', async () => {
      const response = await request(app).get('/api/admin/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('revenue');
      expect(response.body.revenue).toHaveProperty('consultation');
      expect(response.body.revenue).toHaveProperty('pharmacy');
      expect(response.body.revenue).toHaveProperty('radiology');
      expect(response.body.revenue).toHaveProperty('total');
      expect(response.body).toHaveProperty('demographics');
      expect(response.body).toHaveProperty('recentPatients');
      expect(response.body).toHaveProperty('doctors');
    });

    test('POST /api/reset-db - should reset fixtures cleanly', async () => {
      const response = await request(app).post('/api/reset-db');
      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/reset completed/i);
    });
  });
});
