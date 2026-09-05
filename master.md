# 🏥 LIFELINE HOSPITAL MANAGEMENT SYSTEM (LHMS) — MASTER SPECIFICATION (`master.md`)

**Version:** 2.0.0 Enterprise Standard — Modernized Healthcare Operations Suite  
**Standard:** Enterprise 3-Layer Architecture, Decentralized Departmental POS Billing, Drug Formulary Engine & Clinical Design System

---

## 📌 1. EXECUTIVE SUMMARY & ARCHITECTURAL PHILOSOPHY

The **LifeLine Hospital Management System (LHMS)** is a full-stack, enterprise-grade Hospital Information System (HIS) and Electronic Medical Records (EMR) platform. Designed for high clinical throughput and zero patient administrative bottlenecks, LHMS replaces traditional centralized billing queues with a **Decentralized Departmental Point-of-Sale (POS) Direct Billing Architecture**.

### Key Architectural Pillars:
1. **Decentralized Autonomous Billing:** Clinical departments (Reception, Pharmacy, Radiology) collect and receipt payments at the point of care with multi-mode payment support (Cash, UPI, Credit Card).
2. **Longitudinal Clinical History:** Doctor EMR provides instant chronological visibility into all past visits, prior vitals, previous diagnoses, prescriptions, and imaging reports.
3. **Open Pharmaceutical Formulary & Suggestion Engine:** Integrated formulary featuring 25+ essential active molecules with instant commercial brand suggestions (e.g., *Paracetamol* $\rightarrow$ *Dolo 650*, *Calpol 650*).
4. **Resilient Data Layer:** Dual-mode persistence combining production MongoDB (Atlas/Local) with automatic zero-configuration In-Memory MongoDB (`mongodb-memory-server`) fallback.
5. **Modern Lavender & Violet Clinical Design System:** Soft-lavender glassmorphism, clean micro-interactions, responsive grids, and an interactive gender-tailored anime character staff avatar engine.

---

## 🏛️ 2. SYSTEM ARCHITECTURE & 3-LAYER BOUNDARIES

```
====================================================================================================
                                    LIFELINE HMS 3-LAYER ARCHITECTURE
====================================================================================================

+--------------------------------------------------------------------------------------------------+
| LAYER 1: PRESENTATION & CLIENT LAYER (Single Page Application / Vanilla ES6+ & CSS3)             |
|  - Modern Lavender Glassmorphism Dashboard (index.html, style.css, app.js)                        |
|  - Role Portals: Reception Desk, Doctor EMR Desk, Pharmacy POS, Radiology Desk, Admin Dashboard  |
|  - Modal Managers: Patient Intake, Vitals Triage, Rx Builder, Scan Ordering, Tax Invoicing       |
|  - Dynamic Vector Avatar Generation Engine & Live Toast Notification System                      |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                         REST API (HTTP/JSON)
                                                 v
+--------------------------------------------------------------------------------------------------+
| LAYER 2: APPLICATION & API GATEWAY LAYER (Node.js & Express.js 5.x)                              |
|  - Route Dispatchers & Input Sanitizers (server.js)                                              |
|  - Security Middleware: Bcrypt.js Credential Verification, Static File Whitelisting              |
|  - Transactional Business Logic: Visit Queuing, Fee Calculation, Discount Authorization          |
|  - Longitudinal History Assembler & Printable Document Generators (Rx Slips, GST Invoices)       |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                        Mongoose ORM Queries
                                                 v
+--------------------------------------------------------------------------------------------------+
| LAYER 3: PERSISTENCE & DATA INFRASTRUCTURE (database.js)                                         |
|  - Mongoose Schemas: Patients, Visits, Medicines, Scans, Users, Audit Logs, Master Catalogs      |
|  - Dual Mode Engine: Production MongoDB URI + Automatic In-Memory MongoDB Fallback               |
|  - Master Data Fixtures: 25+ Drug Formulary, 10 Standard Diagnostic Scans, Default Staff Accounts|
+--------------------------------------------------------------------------------------------------+
```

---

## 🎨 3. UI/UX DESIGN SYSTEM SPECIFICATION (PURPLE / LAVENDER AESTHETICS)

The interface follows a tailored, high-contrast, accessible clinical design system:

```
+---------------------------------------------------------------------------------------------------+
| DESIGN TOKEN        | VALUE / SPECIFICATION                                                      |
+---------------------+-----------------------------------------------------------------------------+
| Primary Brand Color | Royal Iris / Electric Purple: #7c3aed / #6d28d9                             |
| Secondary Accent    | Soft Lavender & Violet Glow: #8b5cf6 / #a78bfa / #c4b5fd                    |
| Background Canvas   | Soft Pastel Lilac Gradient: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)|
| Card Surface        | Pure White Glassmorphism: #ffffff with box-shadow: 0 10px 30px rgba(0,0,0,0.04)|
| Border Radius       | Extra-Smooth Curves: 18px – 24px (Cards & Modals), 9999px (Pills & Badges) |
| Typography          | Outfit / Plus Jakarta Sans / Inter (Clean geometric sans-serif)            |
| Micro-Interactions  | Smooth hover scaling (1.02x), soft glow rings, active tab transitions      |
+---------------------------------------------------------------------------------------------------+
```

### Layout Components:
- **Left Navigation Dock:** Role-filtered navigation dock with active glow indicators.
- **Top Welcome Header:** Personalized staff greeting (`"Hello, Dr. ..."` / `"Hello, Admin"`), system status indicator, search bar, and active avatar profile badge.
- **KPI Stat Cards:** Modern 3D elevation cards with key operational metrics (Total Patients, Today's Consultations, Active Staff, Gross Turnover).
- **Split Clinical Action Grids:** Workspaces for intake triage, doctor queue management, pharmacy POS line items, radiology scan review, and financial reporting.

---

## 🏛️ 4. DECENTRALIZED DEPARTMENTAL POS BILLING WORKFLOW

```
                                  [ 1. PATIENT ARRIVAL ]
                                            |
                                            v
                 +------------------------------------------------------+
                 | RECEPTION DESK                                       |
                 | - Patient Registration & Triage Vitals Check         |
                 | - Direct Consultation POS Billing (Standard ₹1,000)  |
                 | - Multi-mode Payment Collection (Cash / UPI / Card)  |
                 | - Status $\rightarrow$ WAITING_FOR_DOCTOR            |
                 +------------------------------------------------------+
                                            |
                                            v
                 +------------------------------------------------------+
                 | DOCTOR CLINICAL EMR DESK                             |
                 | - Longitudinal History Timeline & Symptom Review     |
                 | - Physical Examination & Final Clinical Diagnosis    |
                 | - Smart Rx Builder (Generates Pharmacy POS Queue)    |
                 | - Diagnostic Scan Ordering (Generates Radiology Queue)|
                 | - Print Official Rx Prescription Slip                |
                 +------------------------------------------------------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
+------------------------------------+  +------------------------------------+
| PHARMACY DESK (POS BILLING)        |  | RADIOLOGY DESK (POS BILLING)       |
| - Connected 25+ Drug Formulary     |  | - 10 Standard Diagnostic Scans     |
| - Commercial Brand Alternatives    |  | - Direct Counter Fee Settlement    |
| - Direct Counter Medicine Billing  |  | - Modality Image Attachment        |
| - Settle Payment (Cash / UPI / Card|  | - Diagnostic Findings & Impression |
| - Print Itemized GST Tax Invoice   |  | - Sign & Print Official Scan Report|
+------------------------------------+  +------------------------------------+
                         \                                     /
                          \                                   /
                           v                                 v
                 +------------------------------------------------------+
                 | ADMIN EXECUTIVE DASHBOARD                            |
                 | - Real-time Departmental Revenue Breakdown:          |
                 |   Consultation + Pharmacy + Radiology = Total Turnover|
                 | - Live Doctors on Duty Roster & Workload Distribution|
                 | - Staff Account Provisioning & System Audit Trail    |
                 +------------------------------------------------------+
```

---

## 📊 5. SYSTEM DATA SCHEMAS & ENTITY RELATIONSHIPS

```
+--------------------------------------------------------------------------------------------------+
| Patient Schema                                                                                   |
| - id: String (PK, e.g. "PAT-1001", Sequential Atomic ID)                                         |
| - name: String (Required)                                                                        |
| - age: Number (Required)                                                                         |
| - gender: String ("Male" | "Female" | "Other")                                                   |
| - phone: String (10 Digits)                                                                      |
| - bloodGroup: String ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")                          |
| - logs: [String] (System Audit & Event Trail)                                                    |
| - visits: [VisitSchema] (Array of Longitudinal Clinical Encounters)                             |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | 1:N Subdocument Embed
                                                 v
+--------------------------------------------------------------------------------------------------+
| Visit Subdocument Schema                                                                         |
| - date: String ("DD-MMM-YYYY HH:mm", Intake Timestamp)                                          |
| - examDate: String (Doctor Completion Timestamp)                                                 |
| - status: String ("WAITING_FOR_DOCTOR" | "IN_CONSULTATION" | "COMPLETED")                        |
| - vitals: { temp: Number, weight: Number, bp: String, pulse: Number }                            |
| - symptoms: String                                                                               |
| - prevHistory: String                                                                            |
| - familyHistory: String                                                                          |
| - physicalExam: String                                                                           |
| - diagnosis: String                                                                              |
|                                                                                                  |
| [ RECEPTION CONSULTATION POS BILLING ]                                                           |
| - consultationFee: Number (Default: 1000)                                                        |
| - consultationDiscount: Number (Default: 0)                                                      |
| - consultationPaid: Boolean (Default: false)                                                     |
| - consultationPaymentMode: String ("Cash" | "UPI" | "Card")                                      |
|                                                                                                  |
| [ PHARMACY DIRECT POS BILLING & DISPENSATION ]                                                   |
| - needsPharmacy: Boolean                                                                         |
| - pharmacyDispensed: Boolean                                                                     |
| - medicinesBillAmount: Number                                                                    |
| - medicinesBillPaid: Boolean                                                                     |
| - pharmacyPaymentMode: String ("Cash" | "UPI" | "Card")                                          |
| - medicines: [MedicineItemSchema]                                                                |
|                                                                                                  |
| [ RADIOLOGY DIRECT POS BILLING & REPORTING ]                                                     |
| - needsRadiology: Boolean                                                                        |
| - radiologyCompleted: Boolean                                                                    |
| - radiologyBillAmount: Number                                                                    |
| - radiologyBillPaid: Boolean                                                                     |
| - radiologyPaymentMode: String ("Cash" | "UPI" | "Card")                                          |
| - reports: [RadiologyReportSchema]                                                               |
+--------------------------------------------------------------------------------------------------+
```

### Supporting Schemas:

```
+---------------------------------------+      +---------------------------------------+
| MedicineItem Schema                   |      | RadiologyReport Schema                |
+---------------------------------------+      +---------------------------------------+
| - name: String (Molecule/Brand)       |      | - name: String (Scan Name)            |
| - dose: String (e.g. "650mg")         |      | - modality: String (X-Ray/CT/MRI/Lab) |
| - freq: String (e.g. "1-0-1")         |      | - price: Number                       |
| - dur: String (e.g. "5 Days")         |      | - status: String ("Pending"|"Done")   |
| - price: Number                       |      | - findings: String                    |
| - dispensed: Boolean                  |      | - attachmentUrl: String               |
+---------------------------------------+      +---------------------------------------+

+---------------------------------------+      +---------------------------------------+
| User Schema (Staff Accounts)          |      | Master Scan Schema                    |
+---------------------------------------+      +---------------------------------------+
| - username: String (PK, Unique)       |      | - id: String (PK, e.g. "SCAN-01")     |
| - password: String (Bcrypt Hash)      |      | - name: String                        |
| - name: String (Staff Full Name)      |      | - modality: String                    |
| - role: String (admin | doctor |      |      | - price: Number                       |
|   receptionist | pharmacist |         |      | - description: String                 |
|   radiologist)                        |      +---------------------------------------+
+---------------------------------------+
```

---

## 👥 6. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS

| Role | Default Username | Permitted Views & Operations | Direct POS Billing Capability |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin` | Executive Analytics Dashboard, Total Revenue Breakdown, Staff Credential Management, System Audit Logs, DB Fixture Reset. | Complete financial oversight across all departments |
| **🩺 Consulting Doctor** | `doctor` | EMR Consultation Queue, Longitudinal Visit History, Vitals Assessment, Smart Rx Builder, Scan Ordering, Prescription Printing. | Reviews fees & orders clinical items |
| **📋 Receptionist** | `receptionist` | Patient Intake Registration, Returning Patient Lookup, Triage Vitals Capture, Queue Dispatch, Consultation Fee Collection. | **Consultation POS Direct Settlement** (Cash/UPI/Card) |
| **💊 Chief Pharmacist** | `pharmacist` | Pharmacy Order Queue, Drug Formulary Lookup, Commercial Alternative Matching, Itemized Tax Invoice Generation, Drug Dispensation. | **Pharmacy POS Direct Settlement** (Cash/UPI/Card) |
| **🩻 Radiologist** | `radiologist` | Radiology Worklist, 10 Scans Catalog Pricing, Direct Fee Settlement, Findings Editor, Scan Attachment, Report Signing & Printing. | **Radiology POS Direct Settlement** (Cash/UPI/Card) |

---

## 🌐 7. REST API SPECIFICATION

### 🔐 1. Authentication & Staff Operations
- `POST /api/auth/login`: Authenticate staff credentials (`{ username, password }`).
- `POST /api/auth/register`: Provision new staff member account (Admin only).
- `GET /api/auth/users`: Retrieve directory of all registered hospital staff.
- `DELETE /api/auth/users/:username`: Revoke staff account credentials (Admin only).

### 🏥 2. Patient Intake & EMR Operations
- `GET /api/patients`: Fetch all registered patients with summaries and active visit statuses.
- `GET /api/patients/:id`: Fetch complete patient profile including longitudinal visit history.
- `POST /api/patients`: Register new patient intake or perform returning patient visit check-in.
- `PUT /api/patients/:id`: Update active clinical visit encounter (Doctor notes, Rx, Scan orders).
- `DELETE /api/patients/:id`: Remove patient record from system (Admin only).

### 💳 3. Decentralized Departmental POS Billing
- `POST /api/billing/consultation/:id`: Process consultation fee settlement at Reception (`{ discount, paymentMode }`).
- `POST /api/billing/pharmacy/:id`: Process pharmacy itemized billing & dispensation (`{ paymentMode }`).
- `POST /api/billing/radiology/:id`: Process radiology scan fee settlement & findings (`{ paymentMode, findings }`).

### 📦 4. Catalogs, Analytics & System Management
- `GET /api/scans`: Fetch pre-configured 10 master diagnostic scans with current pricing.
- `GET /api/analytics/dashboard`: Retrieve departmental revenue breakdown, queue counts, and staff metrics.
- `GET /api/logs`: Fetch system-wide chronological audit logs.
- `POST /api/reset-db`: Reset database to factory demo seed state (Admin only).

---

## 💊 8. PHARMACEUTICAL FORMULARY & SUGGESTION ENGINE

The system incorporates an internal formulary database covering primary therapeutic categories:
- **Analgesics / Antipyretics:** Paracetamol (Dolo 650, Calpol), Ibuprofen (Brufen), Tramadol
- **Antibiotics:** Amoxicillin + Clavulanic Acid (Augmentin 625, Moxikind-CV), Azithromycin (Azithral), Ciprofloxacin (Cifran)
- **Gastrointestinal:** Pantoprazole (Pan 40), Omeprazole (Omez), Ondansetron (Emeset)
- **Antihypertensives & Cardiac:** Amlodipine (Amlong), Telmisartan (Telma 40), Atorvastatin (Atorva)
- **Antidiabetics:** Metformin (Glycomet), Glimepiride (Amaryl)
- **Respiratory & Antiallergic:** Montelukast + Levocetirizine (Montair-LC), Cetirizine (Cetzine), Salbutamol (Asthalin)

**Interactive Suggestion Mechanism:**
When a doctor or pharmacist types an active generic molecule into the medication field, the frontend auto-completes available strengths and suggests equivalent branded commercial formulations with estimated market pricing.

---

## 🧪 9. AUTOMATED VERIFICATION & QUALITY GATES

```bash
# Execute Jest Integration Test Suite (16/16 Test Assertions)
npm test

# Run ESLint Static Analysis Engine (Zero Warning / Zero Error Policy)
npm run lint
```

### Test Coverage Highlights:
- **Auth Contract Testing:** Validates credential hashing, invalid password rejection, and role authorization.
- **Patient Intake & Check-in:** Tests ID generation (`PAT-xxxx`), duplicate detection, and vitals recording.
- **POS Billing Lifecycle:** Verifies state transitions and revenue calculation across Reception, Pharmacy, and Radiology.
- **Data Integrity:** Ensures subdocument updates preserve prior medical history and audit logs.

---

## 🚀 10. DEPLOYMENT & PRODUCTION RUNTIME

### Environment Variables (`.env`)
```ini
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/lifeline-hms
NODE_ENV=production
```
*(If `MONGODB_URI` is omitted, the application automatically launches an in-memory MongoDB instance).*

### Deployment Commands:

#### Local Development
```bash
npm install
node server.js
```

#### Multi-Stage Docker Container
```bash
docker build -t lifeline-hms .
docker run -d -p 8080:8080 --name lifeline-app lifeline-hms
```

#### 1-Click Cloud PaaS (Render.com / Procfile)
- **Procfile:** `web: node server.js`
- **Render Manifest:** Auto-configured via `render.yaml` with free tier Web Service definition.

---

*LifeLine HMS Master Specification — Maintained by Enterprise Architecture & Clinical Systems Team.*
