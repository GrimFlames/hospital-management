# 🏥 LifeLine (LHMS) — Hospital Management & Clinical POS Suite

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-In--Memory%20%26%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Jest Tests](https://img.shields.io/badge/Jest%20Tests-16%2F16%20Passing%20(100%25)-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![ESLint](https://img.shields.io/badge/ESLint-0%20Errors%20%7C%20Clean-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **LifeLine (LHMS)** is an enterprise-grade Hospital Information System (HIS) and Electronic Medical Records (EMR) platform featuring a **Decentralized Departmental Point-of-Sale (POS) Direct Billing Architecture**, a connected **Pharmaceutical Drug Suggestion Engine**, and an interactive **Anime Character Staff Avatar System** built with modern **Lavender & Violet Clinical Aesthetics**.

---

## 🌟 Live Public Demo & Instant Access

- 🌐 **Instant Live Link**: [https://76e3c5b2644689.lhr.life](https://hospital-managementhospital-management.onrender.com) *(Accessible on any mobile or desktop browser worldwide)*

### 🔑 Demo Credentials

| Role | Username | Password | Dedicated Access Portal |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin` | `admin123` | Executive Analytics, Revenue Breakdown, Duty Roster & Staff Directory |
| **🩺 Consulting Doctor** | `doctor` | `doctor123` | Doctor EMR Desk, Longitudinal Patient Timeline, Rx Prescription Builder |
| **📋 Front Desk / Reception** | `receptionist` | `receptionist123` | Patient Intake, Vitals Triage & Consultation POS Direct Fee Collection |
| **💊 Chief Pharmacist** | `pharmacist` | `pharmacist123` | In-Pharmacy Medicine POS Direct Billing, Generic Brand Suggestions, Tax Invoice |
| **🩻 Diagnostic Radiologist** | `radiologist` | `radiologist123` | In-Radiology Scan Fee Settlement, 10 Scans Catalog, Findings & Reports |

---

## 🏛️ System Architecture: Decentralized Departmental POS Billing

Unlike legacy centralized hospital management systems where patients must queue at a single front desk for every transaction, LifeLine LHMS implements **Decentralized Autonomous Departmental POS Billing**:

```
+--------------------------------------------------------------------------------------------------+
|                                    LIFELINE HMS ECOSYSTEM                                        |
+--------------------------------------------------------------------------------------------------+
                                                 |
         +---------------------------------------+---------------------------------------+
         |                                       |                                       |
         v                                       v                                       v
+------------------+                    +------------------+                    +------------------+
|  RECEPTION DESK  |                    |  PHARMACY (POS)  |                    | RADIOLOGY (POS)  |
| - Patient Intake |                    | - Auto-Billing   |                    | - 10 Scans Menu  |
| - Consultation   |                    | - 25+ Formulations|                    | - Dynamic Pricing|
|   POS Settlement |                    | - Alternative Rx |                    | - Report Signing |
|   (Cash/UPI/Card)|                    | - Tax Invoicing  |                    | - POS Settlement |
+------------------+                    +------------------+                    +------------------+
         |                                       ^                                       ^
         |                                       |                                       |
         +---------------------------------> [DOCTOR EMR] -------------------------------+
                                             - Longitudinal History
                                             - Rx Drug Builder
                                             - Diagnostic Orders
```

---

## 🚀 Key Feature Highlights

### 1. 📋 Reception Desk & Patient Triage
- Seamless patient intake registration supporting returning patient history matching.
- Real-time vitals tracking: Blood Pressure, Temperature (°F), Pulse Rate, and Weight.
- **Consultation Fee Direct Settlement**: Standard ₹1,000 fee with instant discount authorization and multi-mode payment collection (Cash / UPI / Credit Card).

### 2. 🩺 Doctor EMR Clinical Desk
- Live queue of waiting patients with 1-click encounter selection.
- **Longitudinal Medical History Timeline**: View all previous hospital visits, prior diagnoses, past medications, and lab reports.
- **Smart Rx Medicine Builder & Diagnostic Scan Ordering**: Add medications and request diagnostic imaging directly during patient consultation.
- **Printable Prescription Slip (Rx)**: Professional medical format ready for physical printing.

### 3. 💊 Pharmacy Point-of-Sale (POS) & Open Drug Formulary
- Direct in-pharmacy billing eliminating front-desk queues.
- **Connected 25+ Drug Formulary Database**: Instant generic drug lookup (Analgesics, Antibiotics, Antacids, Antidiabetics, Antihypertensives, Respiratory).
- **Smart Alternative Brand Suggestions**: Typing active generic molecules (e.g., *Paracetamol*, *Amoxicillin*) suggests commercial brands (e.g., *Dolo 650*, *Calpol 650*, *Augmentin 625*, *Moxikind-CV*) with price comparison tags.
- **Official Printable Tax Invoices** with line-item totals and GST breakdown.

### 4. 🩻 Radiology & Laboratory POS
- **10 Pre-configured Diagnostic Scans**: Chest X-Ray, Abdominal USG, Brain CT Scan, HRCT Chest, Lumbar Spine MRI, 2D Echo, CBC/ESR, LFT, KFT, HbA1c.
- Autonomous in-department scan fee collection.
- Impression findings editor and **Official Diagnostic Report Signing & Printing**.

### 5. 👤 Staff Management & Dynamic Character Avatars
- Registration for all clinical roles with department specialties, room assignments, and contact details.
- **Gender-Tailored Anime Character Avatar Engine**: Generates high-definition vector avatars matching staff gender (*Auburn-haired female doctor* and *Silver-haired male doctor with glasses*).
- Real-time reactive preview before account creation.

### 6. 📊 Admin Executive Analytics & Doctors on Duty Roster
- Consolidated departmental financial breakdown: `Consultation Revenue + Pharmacy Revenue + Radiology Revenue = Total Turnover`.
- Live **Doctors on Duty** roster widget with active consultation indicators and ratings.
- One-click **Reset Demo Data** fixture restore for clean demonstration runs.

---

## 🛠️ Technology Stack

- **Backend Runtime**: Node.js & Express.js
- **Database Layer**: MongoDB (Mongoose ORM with automatic zero-config in-memory fallback for local/test environments)
- **Security & Auth**: Bcrypt.js password hashing, static file isolation middleware
- **Frontend Architecture**: Vanilla HTML5, Modern CSS3 (Custom Design System tokens, CSS Grid, Flexbox), JavaScript (ES6+), Lucide Icons
- **Testing & Quality**: Jest (Automated API Integration Suite), ESLint (Strict Code Quality Standard)
- **Deployment & Cloud**: Docker (Multi-stage runner), Render.com (`render.yaml`), Procfile

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/GrimFlames/hospital-management.git
cd hospital-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
node server.js
```
The application will start on:
- **Local URL**: `http://localhost:8080`
- *(Zero configuration needed — in-memory MongoDB starts automatically with sample patients and catalog fixtures).*

### 4. Run Automated Tests
```bash
npm test
```

### 5. Run Code Linting
```bash
npx eslint .
```

---

## 🐳 Docker & Cloud Deployment

### Run with Docker:
```bash
docker build -t lifeline-hms .
docker run -p 8080:8080 lifeline-hms
```

### 1-Click Deploy on Render.com:
1. Push your repository to GitHub.
2. Link your repository in **[Render.com](https://render.com)**.
3. Render will automatically detect [`render.yaml`](render.yaml) and launch the application on the Free Tier ($0/month).

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, customize, and commercialize.
