# INTuition Platform Expansion
## From Clinical Decision Support to a Modular Hospital Operating System

**Author:** Abhayankar Bellur (23MIS0003)
**Department:** Integrated M.Tech (Software Engineering), School of Computer Science Engineering and Information Systems, VIT Vellore
**Guide:** Dr. A. Anitha
**Date:** May 2026

---

## 1. Executive Summary

INTuition today is a physician-facing clinical decision support tool (CDSS). The same authentication spine, doctor-profile hierarchy, token-based patient intake, and Lovable Cloud (Supabase) backend that power the diagnostic workflow can be extended into a full **modular Hospital Operating System (H-OS)**.

The expansion is designed as an **opt-in plugin architecture**: every hospital starts with the diagnostic core and activates additional modules — EMR, CRM, Inventory, ERP, Pharmacy, Lab, Billing — as needed. Each module is independently priced, independently deployable, and shares one identity, one audit log, and one patient record.

The commercial thesis: sell the diagnostic tool as the wedge, expand account revenue 5–15x per hospital through modules, and reach institutional lock-in at the ERP layer.

---

## 2. Tenancy and Access Model

A four-tier role hierarchy governs the entire platform. Each tier is enforced through the existing `user_roles` table pattern (separate table, `has_role()` security-definer function, RLS on every table).

| Tier | Role | Scope | Typical User |
|---|---|---|---|
| 0 | **Super Admin** (Platform Owner) | All organizations | INTuition operator |
| 1 | **Organization Admin** | One hospital / clinic group | Hospital IT head, COO |
| 2 | **Department Admin** (optional) | One department within an org | HOD, ward manager |
| 3 | **End User** | Own records + assigned scope | Doctor, nurse, receptionist, pharmacist, lab tech, accountant |

### 2.1 Super Admin capabilities
- Provision new **Organizations** (tenants).
- Assign the first Organization Admin per tenant.
- Enable / disable modules per organization (feature flags).
- Set per-org billing plan, seat limits, rate limits, storage caps.
- View platform-wide audit and usage analytics.
- Suspend or offboard an organization.

### 2.2 Organization Admin capabilities
- Create and manage all sub-accounts within their organization: doctors, nurses, receptionists, pharmacists, lab technicians, accountants, ward staff.
- Assign per-user module access (a doctor may get EMR + Diagnostics; a receptionist gets CRM + Billing only).
- Configure organization branding, letterhead, print templates, disclaimer text.
- Manage departments, wards, clinics, and physical locations.
- View organization-wide audit logs, usage dashboards, and billing.
- Purchase additional module licenses or seat packs.

### 2.3 End User capabilities
Scoped strictly by role and by module entitlements set by the Org Admin. A doctor with only the Diagnostics + EMR entitlement cannot see inventory or accounting.

### 2.4 Data isolation
Every row in every module table carries an `organization_id` column. RLS policies enforce `organization_id = current_user's_org` before any read or write. Cross-tenant access is impossible even through the API.

---

## 3. Module Catalogue

The platform is composed of the current Diagnostic Core plus nine expansion modules. Each is independently sellable.

### M0. Diagnostic Core (existing — INTuition)
**Purpose:** AI-assisted differential diagnosis, investigation planning, medication guidance, selective patient reports.
**Users:** Doctors.
**Included in every plan.** Baseline pricing anchor.

---

### M1. Electronic Medical Records (EMR)
**Purpose:** Longitudinal patient record replacing paper charts and disconnected diagnostic exports.

**Core features**
- Unified patient profile (demographics, allergies, chronic conditions, immunizations, family history).
- Encounter timeline: every visit, every diagnosis, every prescription, every uploaded image, every lab result.
- Structured problem list, medication list, allergy list (SNOMED / ICD-11 / RxNorm coded).
- Progress notes with SOAP templates and voice dictation (native OS dictation, per the project's existing constraint).
- Attachment vault: imaging (DICOM-lite viewer), lab PDFs, referral letters, discharge summaries.
- Consent management, medico-legal audit trail (who read what, when).
- Direct hand-off from the Diagnostic Core: any saved diagnosis auto-attaches to the patient's EMR encounter.

**Integration with M0**
The Diagnostic Core's token-based intake becomes the EMR's front door. A token resolves to a patient record; the AI diagnosis is stored as a signed encounter note, not just a transient result.

**Persona:** Doctor (read/write), Nurse (read + vitals write), Receptionist (demographics only).

---

### M2. Customer Relationship Management (CRM)
**Purpose:** Patient acquisition, retention, follow-ups, institutional relationships.

**Core features**
- **Patient CRM:** appointment reminders, post-visit follow-up sequences, satisfaction surveys, birthday / vaccination-due nudges, WhatsApp + SMS + email channels.
- **Inbound request queue:** website form leads, phone-log entries, referring-physician requests, insurance pre-auth inquiries.
- **Referral network:** track referring doctors, referral volumes, kickback-free acknowledgement flows.
- **MOU & B2B pipeline:** contracts with corporates, insurance TPAs, diagnostic labs, pharma reps — with renewal alerts, document vault, meeting notes.
- **Marketing campaigns:** segment patients (chronic diabetics due for HbA1c, post-op patients due for review) and trigger outreach.
- Reporting: acquisition cost, retention rate, referral yield, NPS.

**Integration with M1**
Reads patient status from EMR to trigger clinically-relevant follow-ups ("post-cardiac-event day 30 review").

**Persona:** Receptionist, marketing staff, business development, Org Admin.

---

### M3. Inventory Management System (IMS)
**Purpose:** Track every consumable, drug, and disposable from purchase order to point of use.

**Core features**
- Master item catalogue (drugs, syringes, gloves, cannulas, sutures, reagents, PPE).
- Batch and expiry tracking, FEFO (first-expiry-first-out) issue logic.
- Multi-location stock (central store, ward stock, OT stock, pharmacy shelf).
- Purchase orders, GRNs, vendor management, price history.
- Reorder-level alerts, auto-PO suggestions, stock-out risk dashboard.
- Consumption analytics per ward, per procedure, per doctor.
- Barcode / QR scanning at issue and receive.
- Wastage and expiry write-off workflows with approval chain.

**Integration**
- Consumption debited automatically by ERP (ward-issue) and Pharmacy (dispense).
- Feeds cost lines into Billing.

**Persona:** Store keeper, pharmacist, ward nurse, Org Admin.

---

### M4. Enterprise Resource Planning (ERP) — Hospital Operations Core
**Purpose:** Run the physical hospital — beds, wards, staff rosters, OT scheduling, housekeeping, asset management.

**Sub-components**

**M4a. Bed & Ward Management**
- Live bed map per ward (occupied, vacant, cleaning, reserved, isolation).
- Admission / transfer / discharge (ADT) workflow tied to EMR.
- ICU / HDU / general / private / day-care bed classes with differential billing.
- Bed turnaround time and occupancy analytics.

**M4b. Staff & Roster Management**
- Employee master (doctors, nurses, technicians, housekeeping, security).
- Shift rostering with skill and department constraints.
- Leave, attendance (biometric / geofence for field staff), overtime.
- On-call schedules and paging.
- Credentialing: license expiry, training records, competency matrix.

**M4c. Operation Theatre & Procedure Scheduling**
- OT booking with surgeon, anaesthetist, and team dependencies.
- Pre-op checklist, consent capture, timeout logging.
- Turnover-time tracking, cancellation reasons, first-case on-time metric.

**M4d. Asset & Equipment Management**
- Equipment register (ventilators, monitors, imaging machines).
- Preventive maintenance schedules, AMC contracts, breakdown tickets.
- Calibration due-date alerts (NABH / JCI requirement).

**M4e. Housekeeping & Facility**
- Bed-cleaning tickets triggered on discharge.
- Biomedical waste tracking, laundry cycles, food-service orders.

**Persona:** Ward manager, matron, OT coordinator, biomedical engineer, HR, Org Admin.

---

### M5. Pharmacy Module
**Purpose:** In-house pharmacy operations, both outpatient (OPD) and inpatient (IPD).

**Core features**
- e-Prescription intake from EMR / Diagnostic Core.
- Dispense workflow with drug-interaction and allergy check (reuses the Diagnostic Core's safety data model).
- Narcotics register with statutory audit trail.
- Substitution suggestions (generic ↔ brand) with pharmacist override log.
- POS for OPD dispense, IPD auto-charge to patient bill.
- Ties into IMS for stock decrement.

**Persona:** Pharmacist, doctor (view-only), Org Admin.

---

### M6. Laboratory Information System (LIS)
**Purpose:** Order-to-result loop for pathology, biochemistry, microbiology, radiology reporting.

**Core features**
- Test order from EMR or Diagnostic Core's "Investigative Tests" section.
- Sample collection barcoding, chain of custody.
- Analyzer integration (ASTM / HL7) for auto-result capture where hardware exists; manual entry otherwise.
- Reference-range engine (age / sex / pregnancy adjusted), abnormal-value flagging, critical-value alerts.
- Report authorization workflow (technician → pathologist sign-off).
- Result auto-attached back to the EMR encounter and, if applicable, the originating AI diagnosis.

**Persona:** Lab technician, pathologist, radiologist, doctor.

---

### M7. Billing, Payments & Insurance
**Purpose:** Charge capture, insurance claim lifecycle, patient payments.

**Core features**
- Tariff master with plan-based pricing (self-pay, corporate, TPA, government scheme).
- Automatic charge capture from EMR (procedures), Pharmacy (dispenses), LIS (tests), ERP (bed-day, OT-time), IMS (consumables).
- Estimate / pre-authorization workflow.
- Insurance claim generation (cashless + reimbursement), TPA follow-up queue.
- Patient invoicing, part-payments, refunds, receipts.
- GST / statutory tax handling.
- Revenue analytics: per department, per doctor, per procedure, per payer.

**Persona:** Billing clerk, insurance desk, accountant, Org Admin.

---

### M8. Patient Portal & Mobile App
**Purpose:** Patient-facing surface for the ecosystem.

**Core features**
- Book / reschedule appointments.
- View reports, prescriptions, discharge summaries.
- Pay bills, download insurance documents.
- Refill requests, teleconsult booking.
- Symptom check-in that feeds the doctor's Diagnostic Core intake before the appointment.

**Persona:** Patients (external users).

---

### M9. Analytics & Governance Suite
**Purpose:** Institutional dashboards and regulatory reporting.

**Core features**
- Executive dashboard: occupancy, revenue, ALOS, readmission rate, mortality, infection rate.
- Clinical audit packs (NABH, JCI, HIPAA-equivalent).
- Doctor-level performance (with privacy safeguards).
- AI usage analytics: which diagnoses the AI supported, override rate, outcome correlation — closes the loop back to M0.
- Custom report builder.

**Persona:** Org Admin, Medical Superintendent, Quality officer, Board.

---

## 4. Plugin Architecture

Modules are not a monolith. They plug into a shared platform kernel.

### 4.1 Platform kernel (always on)
- **Identity & tenancy:** users, roles, organizations, audit log.
- **Patient master:** the single canonical patient record every module reads/writes against.
- **Notification bus:** email, SMS, WhatsApp, in-app.
- **File vault:** encrypted object storage for reports, images, attachments.
- **Billing meter:** captures usage events from every module for downstream invoicing.
- **Feature-flag service:** the Super Admin toggle that decides which modules an org sees.

### 4.2 Module contract
Every module ships with:
1. A **manifest** declaring its routes, roles it introduces, tables it owns, and events it publishes/consumes.
2. **Isolated schema:** each module owns a Postgres schema (`emr.*`, `crm.*`, `ims.*` …) with its own RLS policies.
3. **Event hooks:** modules communicate via a lightweight event bus (`patient.admitted`, `prescription.signed`, `stock.low`) rather than direct table joins across modules. This keeps modules loosely coupled and independently upgradable.
4. **Feature-flag gate:** if the org has not licensed the module, its routes 404 and its DB objects are unreadable regardless of role.

### 4.3 Deployment topology
- **Shared multi-tenant** for SMB clinics and small hospitals — one Lovable Cloud project, org-scoped RLS.
- **Dedicated tenant** for enterprise hospitals — isolated database, same codebase, private domain.
- **On-prem / hybrid** (long-term) — the same modules packaged as containers for hospitals with data-residency requirements.

### 4.4 Extensibility
Third-party modules (e.g., a specialty-specific chemotherapy dosing plugin, a dental practice plugin) can be authored against the same contract and listed in a **Module Marketplace** — a future revenue lane through revenue-share with independent developers.

---

## 5. Pricing Model

Modules are priced à la carte on top of the existing Diagnostic Core plan. All prices below are indicative reference points, in INR per month, to be tuned by the go-to-market phase.

### 5.1 Diagnostic Core (existing — anchor)
Retained as-is (per current three-tier plan for individual doctors).

### 5.2 Module price sheet (per hospital / organization)

| Module | Small (≤10 doctors) | Mid (11–50) | Large (51+) | Pricing basis |
|---|---|---|---|---|
| M1 EMR | 15,000 | 40,000 | 1,10,000 | Per active clinician seat, tiered |
| M2 CRM | 8,000 | 22,000 | 55,000 | Per contact + seat bundle |
| M3 Inventory | 6,000 | 18,000 | 45,000 | Per store location |
| M4 ERP (bed + roster + OT + assets + housekeeping) | 25,000 | 70,000 | 1,80,000 | Per bed licensed |
| M5 Pharmacy | 5,000 | 14,000 | 35,000 | Per counter |
| M6 LIS | 7,000 | 20,000 | 50,000 | Per analyzer / bench |
| M7 Billing & Insurance | 10,000 | 28,000 | 70,000 | % of processed value optional |
| M8 Patient Portal | 4,000 | 10,000 | 25,000 | Per 1,000 MAU |
| M9 Analytics & Governance | 6,000 | 15,000 | 40,000 | Flat per org |

### 5.3 Bundled plans

| Plan | Modules included | Positioning |
|---|---|---|
| **Clinic Starter** | M0 + M1 + M7 | Solo / small clinic that needs records + billing |
| **Practice Plus** | M0 + M1 + M2 + M5 + M7 | Multi-doctor clinic with pharmacy |
| **Hospital Standard** | M0 + M1 + M3 + M4 + M5 + M6 + M7 | Full mid-size hospital |
| **Hospital Enterprise** | All modules + dedicated tenant + SLA | 100+ bed hospitals, chains |

Bundled plans carry a 20–30 % discount vs. summed à la carte pricing to encourage full-stack adoption and increase switching cost.

### 5.4 One-time and variable charges
- **Implementation & data migration:** one-time, scoped per module.
- **Training:** per-session, tiered.
- **Custom integrations** (HL7 to a specific analyzer, PACS bridge, government scheme portal): scoped project fee.
- **Transaction fees** on Billing module for insurance claim processing (optional revenue lane).
- **AI usage overages** on Diagnostic Core beyond the plan's daily quota.

### 5.5 Commercial rationale
- Diagnostic Core is the low-friction wedge: cheap enough for a single doctor to self-serve.
- Every additional module raises **ARPU per hospital** by a multiple of the Core price.
- ERP + Billing are the **stickiness anchors** — once bed management and claim processing run on the platform, switching cost is institutional, not personal.
- Marketplace revenue share (future) creates a long-tail lane without proportional R&D cost.

---

## 6. Integration Story — How the Modules Reinforce Each Other

The strategic value is not any single module; it is the closed loop.

```
Patient books via M8 Portal
        │
        ▼
Receptionist confirms in M2 CRM, token issued
        │
        ▼
Doctor opens patient in M0 Diagnostic Core
        │
        ├─► AI suggests investigations ──► M6 LIS order
        ├─► AI suggests medication  ────► M5 Pharmacy dispense
        └─► Full note filed into  ──────► M1 EMR encounter
        │
        ▼
If admitted: M4 ERP assigns bed, roster nurse
        │
        ▼
M3 IMS decrements consumables as used
        │
        ▼
M7 Billing aggregates all charges → invoice / insurance claim
        │
        ▼
M2 CRM triggers post-discharge follow-up
        │
        ▼
M9 Analytics closes the loop: outcome vs. AI recommendation,
   revenue per encounter, occupancy, quality metrics
```

Each module is useful alone. Together they become the operating system the hospital cannot leave.

---

## 7. Rollout Sequence

Modules are built and released in an order that maximises revenue-per-engineering-hour and preserves clinical trust.

| Phase | Modules | Rationale |
|---|---|---|
| Phase 1 (existing) | M0 Diagnostic Core | Wedge product, doctor-led adoption |
| Phase 2 (0–6 months) | M1 EMR, M7 Billing (lite) | Convert individual doctors into clinic accounts |
| Phase 3 (6–12 months) | M2 CRM, M5 Pharmacy, M8 Portal | Complete the outpatient loop |
| Phase 4 (12–18 months) | M3 Inventory, M6 LIS | Enable multi-department clinics and small hospitals |
| Phase 5 (18–30 months) | M4 ERP (bed, roster, OT, assets, housekeeping) | Move upmarket to full hospitals |
| Phase 6 (30+ months) | M9 Analytics, Marketplace, On-prem packaging | Enterprise and ecosystem |

---

## 8. Compliance and Security Posture (platform-wide)

- Role-based access via a separate `user_roles` table and `has_role()` security-definer function (existing pattern, extended per module).
- RLS on every table in every module schema, keyed on `organization_id` and, where applicable, `patient_id` consent.
- Full audit log of every read and write on patient data (module M9 exposes it).
- Data retention policies per module (e.g., the existing 15-day diagnostic purge continues; EMR follows the statutory retention of the deploying jurisdiction).
- Encryption at rest (storage vault) and in transit (TLS).
- Consent capture in EMR before any cross-module data flow.
- Standards alignment roadmap: HL7 FHIR for interoperability, ICD-11 / SNOMED-CT / LOINC / RxNorm for coding, ABDM (India) and equivalent national health-stack integrations where the hospital opts in.

---

## 9. Summary

INTuition's Diagnostic Core is the entry point. The same identity model, tenancy model, and Lovable Cloud backend extend cleanly into nine additional modules that together constitute a full hospital operating system. Each module is independently licensable, priced per its natural unit (seats, beds, counters, locations), and integrated through a shared kernel and event bus rather than a monolith. The commercial arc moves the product from per-doctor subscriptions to per-hospital contracts and, eventually, to a marketplace platform.

---

**Prepared by:** Abhayankar Bellur (23MIS0003), Department of Integrated M.Tech (Software Engineering), School of Computer Science Engineering and Information Systems, VIT Vellore — May 2026. Under the guidance of Dr. A. Anitha.
