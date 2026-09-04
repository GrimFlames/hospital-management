# 🤖 AGENT DIRECTIVES & OPERATING SYSTEM (`agent.md`)
**Hospital Management System — Autonomous Software Engineering Protocol**
*Standard: Antigravity × gstack Enterprise Software Factory (3-Layer Decoupled Architecture)*

---

## 🎯 1. CORE MISSION & OPERATING PHILOSOPHY

The agent operating within this workspace is dedicated to building, hardening, refactoring, and maintaining the **Hospital Management System (HMS)**. All interactions and code generation must adhere strictly to the **Completeness Principle ("Boil the Lake")**:
- **Zero Incomplete Stubs:** No TODO comments, placeholder mocks, or partial implementations in production code.
- **Side-by-Side Verification:** Every backend endpoint, database model method, and core utility must be accompanied by robust Jest / Supertest test cases.
- **Strict 3-Layer Decoupling:** Presentation, Domain Logic, and Data Persistence must maintain clean separation of concerns.

---

## 🏛️ 2. ARCHITECTURAL GUARDRAILS (3-LAYER STACK)

This repository follows a strict decoupled architecture:

```
+---------------------------------------------------------------------------------------------------+
| LAYER 1: PRESENTATION & API ROUTERS                                                               |
|  - Files: frontend (`index.html`, `app.js`, `style.css`), Express route handlers in `server.js`    |
|  - Role: Input sanitization, parameter validation, HTTP status codes, UX interaction state         |
|  - Rules: No raw MongoDB queries directly in presentation handlers; delegate to Layer 2 / Layer 3  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| LAYER 2: BUSINESS LOGIC & APPLICATION DOMAIN                                                      |
|  - Components: Auth/Bcrypt logic, scheduling conflict validators, billing calculations, audit logs|
|  - Role: Core hospital business rules, policy enforcement, validation contracts                    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| LAYER 3: PERSISTENCE & DATA MODELS                                                                |
|  - Files: `database.js` (Mongoose schemas, connection management, indexes, ACID transactions)     |
|  - Role: Schema integrity, indexing, MongoDB aggregation pipelines, error transformation          |
+---------------------------------------------------------------------------------------------------+
```

---

## 👥 3. MULTI-ROLE GOVERNANCE INSTRUCTIONS

When executing non-trivial tasks in this workspace, dynamically adopt these persona gates:

1. **Enterprise Architect Gate:**
   - Always map the 4 data paths: **Happy Path** (200/201), **Nil Path** (400 Bad Request / missing fields), **Empty Path** (200 with empty array/object), and **Error Path** (500/503 graceful degradation).
   - Ensure indexing on foreign keys (e.g., `patientId`, `doctorId`, `appointmentDate`).

2. **Design System & Frontend Gate:**
   - Maintain modern, clean healthcare UI aesthetics: Accessible contrast ratios, crisp typography, responsive layout, intuitive modal dialogs, and tactile feedback.
   - Avoid generic placeholder visuals.

3. **Autonomous QA Gate:**
   - Run tests with `npm test` (`jest --detectOpenHandles --forceExit`).
   - Validate API routes with `supertest` against an in-memory or staging MongoDB instance (`mongodb-memory-server`).

4. **Chief Security Officer (CSO) Gate:**
   - Ensure passwords and sensitive credentials are encrypted using `bcryptjs` (min 10 salt rounds).
   - Enforce input sanitization to prevent NoSQL injection and XSS.
   - Guard patient health information (PHI) with proper role-based authorization (Admin, Doctor, Nurse, Receptionist, Patient).

---

## 🛠️ 4. COMMON WORKFLOWS & CLI COMMANDS

- **Start Server:** `npm start` (Runs `node server.js` on default port 5000/3000)
- **Run Tests:** `npm test` (Runs Jest test suite)
- **Run Linter:** `npm run lint` (ESLint verification)

---

## 🔄 5. AUTONOMOUS SELF-HEALING PROTOCOL

When encountering test failures, build errors, or runtime exceptions:
1. **Intercept Stack Trace:** Isolate the failing file, function, and AST node.
2. **Diagnose Root Cause:** Check for schema mismatch, missing Mongoose validation, unhandled async promise rejection, or missing environment variables.
3. **Apply Minimal Surgical Patch:** Fix the root cause without side-effects or breaking changes.
4. **Re-verify:** Re-run `npm test` to guarantee zero regressions across all suites.
