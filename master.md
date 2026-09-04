# 🏥 LIFELINE HOSPITAL MANAGEMENT SYSTEM — MASTER SPECIFICATION (`master.md`)
**Version:** 2.0.0 Enterprise Standard — Modernized Healthcare Suite  
**Architecture, UI/UX Design System & Decentralized Billing Blueprint**

---

## 📌 1. SYSTEM OVERVIEW & ARCHITECTURAL PHILOSOPHY

The **Lifeline Hospital Management System (HMS)** is an enterprise clinical operations platform. Version 2.0 introduces a **Decentralized Departmental Billing Architecture** paired with a **Modern Soft-Lavender & Violet Clinical Design System** inspired by state-of-the-art medical dashboard aesthetics.

---

## 🎨 2. UI/UX DESIGN SYSTEM SPECIFICATION (PURPLE/LAVENDER AESTHETICS)

Inspired by modern clinical UI standards:
```
+---------------------------------------------------------------------------------------------------+
| DESIGN TOKEN        | VALUE / SPECIFICATION                                                      |
+---------------------+-----------------------------------------------------------------------------+
| Primary Brand Color | Royal Iris / Electric Purple: #7c3aed / #6d28d9                             |
| Secondary Accent    | Soft Lavender & Violet Glow: #8b5cf6 / #a78bfa / #c4b5fd                    |
| Background Canvas   | Soft Pastel Lilac Gradient: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)|
| Card Surface        | Pure White Glassmorphism: #ffffff with subtle box-shadow: 0 10px 30px rgba(0,0,0,0.04) |
| Border Radius       | Extra-Smooth Curves: 18px – 24px (Cards & Modals), 9999px (Pills & Badges) |
| Typography          | Outfit / Plus Jakarta Sans / Inter (Clean, modern geometric sans-serif)    |
| Micro-Interactions  | Smooth hover scaling (1.02x), soft glow rings, and seamless tab transitions |
+---------------------------------------------------------------------------------------------------+
```

### Layout Hierarchy:
- **Left Modern Dock / Sidebar:** Icon-driven navigation dock with curved active indicators and soft violet backdrops.
- **Top Welcome Header:** Personalized greeting (`"Hello, Dr. ..."` / `"Hello, Admin"`), quick search bar with rounded pill design, and active staff profile badge.
- **KPI Stat Cards:** Clean 3D-styled soft backdrop cards showing Total Patients, Consultations, Staff Count, and Departmental Load.
- **Clinical Action Grids:** Split workspace panels for seamless triage, consultation, diagnosis, direct billing, and report generation.

---

## 🏛️ 3. DECENTRALIZED DEPARTMENT BILLING & REVENUE MODEL

To eliminate bottleneck queues at the reception counter, each clinical department operates with **Autonomous Point-of-Sale (POS) Billing**:

```
                                  [ PATIENT INTAKE ]
                                          |
                                          v
                 +--------------------------------------------------+
                 | 1. RECEPTION DESK                                |
                 | - Patient Registration & Triage Vitals           |
                 | - Direct Consultation Billing (₹1,000 baseline)  |
                 | - Collects & Receipts Consultation Fee           |
                 +--------------------------------------------------+
                                          |
                                          v
                 +--------------------------------------------------+
                 | 2. DOCTOR CONSULTATION (EMR)                     |
                 | - Examination, Diagnosis & Clinical History      |
                 | - Prescribes Medicines (Triggers Pharmacy Order) |
                 | - Orders Radiology Scans (Triggers Imaging Order)|
                 +--------------------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
+------------------------------------+  +------------------------------------+
| 3. PHARMACY DESK (DIRECT BILLING)  |  | 4. RADIOLOGY DESK (DIRECT BILLING) |
| - Itemized Medicine Pricing (POS)  |  | - Modality & Investigation Pricing |
| - Collects Medicine Payment (Cash/ |  | - Collects Radiology Fee Directly  |
|   UPI/Card) at Pharmacy Counter    |  |   at Radiology Counter             |
| - Marks 'Paid' & Dispenses Meds    |  | - Uploads Scan & Signs Findings    |
+------------------------------------+  +------------------------------------+
                        \                                   /
                         \                                 /
                          v                               v
                 +--------------------------------------------------+
                 | 5. ADMIN PORTAL & EXECUTIVE ANALYTICS            |
                 | - Central Revenue Breakdown (Consult + Pharma +  |
                 |   Radiology)                                     |
                 | - Staff Management & Role Credential Provisioning|
                 | - System Audit Trails & Activity Logs            |
                 +--------------------------------------------------+
```

---

## 📊 4. SYSTEM DATA SCHEMAS & ENTITY RELATIONSHIPS

```
+-----------------------------------------------------------------------+
| User Schema (Staff Accounts)                                          |
| - username, password (bcrypt), name, role (admin|doctor|receptionist| |
|   pharmacist|radiologist)                                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| Patient Schema                                                        |
| - id: "PAT-xxxx" (Atomic Sequential ID)                               |
| - name, age, gender, phone, bloodGroup, logs: [String]                |
| - visits: [VisitSchema]                                               |
+-----------------------------------------------------------------------+
     |
     +--> Visit Schema:
          - date, examDate, status
          - vitals: { temp, weight, bp, pulse }
          - symptoms, prevHistory, familyHistory, physicalExam, diagnosis
          
          [ RECEPTION CONSULTATION BILLING ]
          - consultationFee: Number (default 1000)
          - consultationDiscount: Number
          - consultationPaid: Boolean
          - consultationPaymentMode: String ("Cash" | "UPI" | "Card")
          
          [ PHARMACY DIRECT BILLING & DISPENSATION ]
          - needsPharmacy: Boolean
          - pharmacyDispensed: Boolean
          - medicinesBillAmount: Number
          - medicinesBillPaid: Boolean
          - pharmacyPaymentMode: String ("Cash" | "UPI" | "Card")
          - medicines: [{ name, dose, freq, dur, price, dispensed: Boolean }]
          
          [ RADIOLOGY DIRECT BILLING & REPORTING ]
          - needsRadiology: Boolean
          - radiologyCompleted: Boolean
          - radiologyBillAmount: Number
          - radiologyBillPaid: Boolean
          - radiologyPaymentMode: String ("Cash" | "UPI" | "Card")
          - reports: [{ name, modality, price, status, findings, attachmentUrl }]
```

---

## 👥 5. ROLE-BASED ACCESS & PERMISSIONS MATRIX

| Role | Permitted Workspaces & Capabilities | Direct Billing Capability |
| :--- | :--- | :--- |
| **Admin** | Full Admin Console, Staff Credential Management, Hospital Revenue Analytics, Audit Logs, Master Pricing, DB Reset. | Full revenue oversight & reporting |
| **Doctor** | EMR Consultation, Vitals Review, Diagnosis, Prescription Builder, Radiology Ordering, Central Patient Registry. | View clinical charges |
| **Receptionist** | Patient Intake, Returning Patient Check-in, Vitals Recording, Queue Allocation, Consultation Fee Collection. | **Consultation Fee Billing** |
| **Pharmacist** | Pharmacy Order Queue, Medicine Item Pricing, Direct Counter Payment Collection, Dispensation & Refills. | **Pharmacy Direct Billing** |
| **Radiologist** | Imaging Queue, Test Pricing, Direct Counter Payment Collection, Structured Diagnostic Findings & Scan Attachments. | **Radiology Direct Billing** |

---

## 🌐 6. REST API CONTRACT SPECIFICATION

### Authentication & Staff Management
- `POST /api/auth/login` — Staff login (returns sanitized user & role)
- `POST /api/auth/register` — Provision new staff account (Admin only)
- `GET /api/auth/users` — Fetch active staff directory
- `DELETE /api/auth/users/:username` — Remove staff credentials

### Patient Records & Clinical Queues
- `GET /api/patients` — List all active patients with visit summaries
- `GET /api/patients/:id` — Fetch full patient record with longitudinal history
- `POST /api/patients` — Register new intake or returning patient check-in
- `PUT /api/patients/:id` — Update clinical visit (Doctor notes, Pharmacy dispensation, Radiology reports)
- `DELETE /api/patients/:id` — Delete patient record (Admin only)

### Direct Department Billing
- `POST /api/billing/consultation/:id` — Settle consultation fee at Reception
- `POST /api/billing/pharmacy/:id` — Settle medicine bill & dispense at Pharmacy
- `POST /api/billing/radiology/:id` — Settle radiology bill & finalize scan at Radiology

### Analytics & Audit
- `GET /api/analytics/dashboard` — Departmental revenue breakdown, active queues, staff metrics
- `GET /api/logs` — Fetch audit trail entries
- `POST /api/reset-db` — Reseed system fixtures (Admin only)
