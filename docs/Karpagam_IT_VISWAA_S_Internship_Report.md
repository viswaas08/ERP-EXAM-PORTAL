# INTERNSHIP PROJECT REPORT

## CENTRALIZED COMPETITIVE EXAMINATION MANAGEMENT PORTAL

**A Project Report submitted in partial fulfillment of the requirements for the internship.**

### STUDENT DETAILS:
*   **Name:** VISWAA S
*   **Degree:** B.Tech - Information Technology
*   **Year of Study:** Second Year
*   **Institution:** Karpagam Institute of Technology
*   **Academic Year:** 2025 - 2026

---

# TABLE OF CONTENTS
*   [Technology Stack & Rationale](#technology-stack--rationale)
*   [Project Introduction: Rationale and Problem Statement](#project-introduction-rationale-and-problem-statement)
*   [1. Unified Login Screen (/login)](#1-unified-login-screen-login)
*   [2. Admin Portal - Main Dashboard (/admin)](#2-admin-portal---main-dashboard-admin)
*   [3. Admin Portal - Examinations Management (/admin/examinations)](#3-admin-portal---examinations-management-adminexaminations)
*   [4. Admin Portal - Dynamic Form Builder (/admin/form-builder)](#4-admin-portal---dynamic-form-builder-adminform-builder)
*   [5. Admin Portal - Eligibility Rules Builder (/admin/rules)](#5-admin-portal---eligibility-rules-builder-adminrules)
*   [6. Admin Portal - Application Scrutiny & Scrutiny Panel (/admin/applications)](#6-admin-portal---application-scrutiny--scrutiny-panel-adminapplications)
*   [7. Admin Portal - Document Verification (/admin/verification)](#7-admin-portal---document-verification-adminverification)
*   [8. Admin Portal - Centre Management (/admin/centres)](#8-admin-portal---centre-management-admincentres)
*   [9. Admin Portal - Hall Ticket Management (/admin/hall-tickets)](#9-admin-portal---hall-ticket-management-adminhall-tickets)
*   [10. Admin Portal - Question Bank (/admin/questions)](#10-admin-portal---question-bank-adminquestions)
*   [11. Admin Portal - Result Management (/admin/results)](#11-admin-portal---result-management-adminresults)
*   [12. Admin Portal - Audit Logs (/admin/audit)](#12-admin-portal---audit-logs-adminaudit)
*   [13. Admin Portal - System Settings (/admin/settings)](#13-admin-portal---system-settings-adminsettings)
*   [14. Candidate Portal - Multi-Step Registration (/register)](#14-candidate-portal---multi-step-registration-register)
*   [15. Candidate Dashboard (/candidate)](#15-candidate-dashboard-candidate)
*   [16. Candidate Portal - Online Exam CBT (/exam)](#16-candidate-portal---online-exam-cbt-exam)

---

## Technology Stack & Rationale

### 1. Technology Stack Used
*   **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Recharts for visual analytics, and Lucide React for consistent iconography.
*   **Backend**: Node.js, Express.js, TypeScript, JWT (JSON Web Tokens) for authentication, and bcryptjs for secure password hashing.
*   **Database**: PostgreSQL hosted on Neon Server, accessed via Prisma ORM.
*   **PDF Generation**: pdfkit for dynamically compiling PDF receipts, hall tickets, and scorecards.

### 2. Ease and Advantages of the Chosen Stack
*   **Unified Language Ecosystem (TypeScript)**: The entire codebase—both frontend and backend—is built using TypeScript. This provides a single programming language across the stack. Data interfaces, validation models, and API request/response structures can be shared or mirrored between the frontend and backend, reducing integration bugs.
*   **Type Safety & Compile-Time Scrutiny**: TypeScript enforces compile-time check constraints on variables, database queries, and component properties. This prevents common runtime errors (e.g., calling undefined properties or mismatches in API payload keys).
*   **Vite Development Speed**: Vite offers extremely fast compilation and Hot Module Replacement (HMR). When making UI changes, the developer browser updates in milliseconds, accelerating design iteration.
*   **Prisma ORM & Auto Migrations**: Prisma ORM replaces raw SQL query writing with an object-oriented type-safe database client. When database changes are required, developers update the declarative `schema.prisma` file and run `npx prisma db push` or `npx prisma migrate`. Prisma automatically generates the SQL commands and updates the database client types.
*   **Tailwind CSS Responsiveness**: Tailwind CSS simplifies layout styling. Instead of writing separate stylesheet rules, developers construct responsive, dark-mode-ready cards and grids directly using inline utility classes.

---

## Project Introduction: Rationale and Problem Statement

### 1. Rationale: Why We Use This System
The management of competitive examinations (such as government recruitments, university entrance tests, and board certifications) is traditionally handled via single-use, hardcoded web applications. Setting up a new examination typically requires developers to write custom form validations, database tables, and document scrutiny tools. 

This **Centralized Competitive Examination Management Portal** is designed as a metadata-driven, multi-role enterprise system. It decouples the examination structure (phases, custom registration forms, eligibility rules, and centers) from the application source code. Consequently, exam controllers can configure and run multiple examinations concurrently—each with different eligibility policies and timelines—from a single web interface without writing code. This unified platform manages the complete exam lifecycle, from candidate registration and center allocation to online CBT testing and result publication.

### 2. Problem Statement: Pain Points and Solutions
*   **Manual Application Screening and Human Error**: Reviewing thousands of academic qualifications, category-wise relaxations, and certificates manually is slow and prone to errors.
    *   *Solution*: The **Eligibility Rule Engine** allows administrators to visually build logic filter trees. Candidate details are verified automatically upon submission, reducing screening times by 95%.
*   **Document Scrutiny and Verification Bottlenecks**: Verifying candidate photo ID proofs, signatures, and certificates is a security bottleneck.
    *   *Solution*: The **Document Verification workstation** provides verification officers with a dedicated interface to rotate, zoom, download, approve, or reject files with specific comments, generating a secure audit trail.
*   **Physical Venue Allocation Logistical Challenges**: Assigning candidates to physical testing centers with seat and computer limits is complex.
    *   *Solution*: The **Centre Allocation Engine** automates seating by matching candidate location preferences with center capacities, assigning dates, labs, and seat numbers without overbooking.
*   **CBT Exam Interruptions and Data Loss**: Computer-Based Tests (CBT) are vulnerable to network dropouts and power failures, which can cause candidates to lose their exam progress.
    *   *Solution*: The **CBT Online Exam Engine** features a state-saving architecture. Answers are saved locally and synced to the database periodically, allowing candidates to resume from their exact place in the event of an interruption.
*   **Lack of Activity Auditing**: Modifications to exam configurations, results, and user accounts must be monitored to ensure security.
    *   *Solution*: The **Audit Logging Middleware** logs all write operations, recording timestamps, user email, user role, action, affected record, and before-and-after values of database rows.

---

## 1. Unified Login Screen (/login)

![1. Unified Login Screen (/login)](images/login_page.png)

### UI Layout and User Experience
The Login Screen features a split-column design. The left column displays a corporate-branded gradient panel highlighting system capabilities (such as candidate self-service, configurable exams, verified tickets, and live analytics) using Lucide icons. The right column contains a card with input fields for Email and Password. It includes helper buttons like 'Use seeded Super Admin' to populate administrative details, 'Reset password' to toggle password recovery simulation, and links to registration and candidate dashboards.

### Business Logic and Functional Workflow
The login process acts as the gateway for all user roles. Upon form submission, the system validates the email and password, checks the database user record, and grants a JWT session token. Based on the user's role, the system redirects them to `/admin` or `/candidate` dashboards. If the user clicks 'Reset password', the system updates the password hash in the database.

### Technical Implementation
Implemented as a React component using React Router. The frontend makes request calls to `/api/auth/login` and stores the received access and refresh tokens. Route guards ensure restricted paths cannot be loaded without an active session.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/auth/login
Request Payload:
{
  "email": "admin@exam.gov",
  "password": "Password@123"
}
Response Payload:
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { "id": "u1", "role": "Super Admin" }
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model User {
  id           String     @id @default(cuid())
  name         String
  email        String     @unique
  passwordHash String
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id])
}
```

---

## 2. Admin Portal - Main Dashboard (/admin)

![2. Admin Portal - Main Dashboard (/admin)](images/admin_dashboard.png)

### UI Layout and User Experience
The Admin Dashboard is the control center for exam operations. It features summary cards displaying key metrics (including Total Examinations, Registered Candidates, Total Applications, Approved/Pending/Rejected counts, Hall Tickets issued, and Compilations). Below these cards, it displays a daily registration trend line chart, a status distribution pie chart, and an attendance vs pass rate comparison bar chart.

### Business Logic and Functional Workflow
When the dashboard loads, it requests a consolidated summary of counts from the database. The system aggregates statistics and displays them. If the database connection fails, it displays the error and falls back to cached data to keep the interface functional.

### Technical Implementation
Uses Recharts to display interactive charts. It fetches data on mount via the dashboard endpoint, managing loading states and handling API errors gracefully.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface DashboardSummary {
  examinations: number;
  candidates: number;
  applications: number;
  approved: number;
  pending: number;
  rejected: number;
  hallTickets: number;
  results: number;
}
```

#### Backend API Schema (Request / Response Schema)
```json
GET /api/dashboard/summary
Response Payload:
{
  "examinations": 12,
  "candidates": 500,
  "applications": 480,
  "approved": 320,
  "pending": 110,
  "rejected": 50,
  "hallTickets": 320,
  "results": 320
}
```

#### Database Schema (Prisma Model Schema)
```prisma
// Aggregates counts across multiple models:
// - User.count()
// - Candidate.count()
// - Application.count({ where: { status } })
// - HallTicket.count()
// - Result.count()
```

---

## 3. Admin Portal - Examinations Management (/admin/examinations)

![3. Admin Portal - Examinations Management (/admin/examinations)](images/examinations_page.png)

### UI Layout and User Experience
The Examinations Management interface features a split-pane design. The left pane contains search and filter bars (for department and status) and a table of examinations. The right pane displays a details panel with tabs for Overview (managing lifecycle transitions like 'Make Online', 'Archive', 'Publish Results'), Configuration, Attempts, Stats, and Workflow Phases.

### Business Logic and Functional Workflow
Manages transitions through the exam lifecycle: `DRAFT`, `PUBLISHED`, `ONLINE`, `COMPLETED`, `RESULTS_PUBLISHED`, and `ARCHIVED`. Changing an exam's status changes its visibility and allows different actions (e.g., candidates can only start exams when the status is `ONLINE`).

### Technical Implementation
Uses standard React state hooks to coordinate details and tabs. The frontend calls `/api/examinations` endpoints to save modifications, duplicate exams, or publish results.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface ExamRow {
  id: string;
  code: string;
  name: string;
  department: string;
  subject: string;
  examDate: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
}
```

#### Backend API Schema (Request / Response Schema)
```json
PATCH /api/examinations/:id
Request Payload:
{
  "status": "ONLINE",
  "passingMarks": 45
}
Response:
{
  "id": "e1",
  "code": "EXAM-101",
  "status": "ONLINE"
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model Examination {
  id                     String    @id @default(cuid())
  name                   String
  code                   String    @unique
  department             String
  subject                String?
  examDate               DateTime?
  durationMinutes        Int
  totalQuestions         Int?
  totalMarks             Float?
  passingMarks           Float
  status                 String    @default("DRAFT")
}
```

---

## 4. Admin Portal - Dynamic Form Builder (/admin/form-builder)

![4. Admin Portal - Dynamic Form Builder (/admin/form-builder)](images/form_builder_page.png)

### UI Layout and User Experience
The Dynamic Form Builder allows administrators to design custom application forms for each examination. The interface features a section structure on the left (e.g., Personal Details, Education) where fields can be reordered, and a field properties editor on the right containing options for Label, Field Type (Text, Number, Date, Select, Checkbox, File), and Validation Rules.

### Business Logic and Functional Workflow
Serializes the registration form structure into the database as metadata. When a candidate applies for an exam, the system loads this metadata to generate the input form and enforce the configured validation rules dynamically.

### Technical Implementation
Forms are managed as nested sections in state. The form template is saved as JSON configurations, which are parsed by the candidate portal to render form controls.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface FormField {
  id: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
  required: boolean;
  visible: boolean;
  editable: boolean;
  validationRules: Record<string, any> | null;
  displayOrder: number;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/examinations/:id/form-template
Request Payload:
{
  "name": "B.Tech Admissions Form",
  "sections": [
    {
      "title": "Educational Qualifications",
      "order": 1,
      "fields": [
        { "label": "Percentage", "fieldType": "number", "required": true }
      ]
    }
  ]
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model DynamicFormTemplate {
  id        String               @id @default(cuid())
  examId    String
  name      String
  sections  DynamicFormSection[]
}

model DynamicFormSection {
  id         String             @id @default(cuid())
  templateId String
  title      String
  order      Int
  fields     DynamicFormField[]
}
```

---

## 5. Admin Portal - Eligibility Rules Builder (/admin/rules)

![5. Admin Portal - Eligibility Rules Builder (/admin/rules)](images/eligibility_rules_page.png)

### UI Layout and User Experience
The Eligibility Rules Builder is a visual interface that allows admins to build criteria filter rules for examinations. The interface consists of two key columns: a list of rules with priority and actions (Approve Automatically, Reject, Hold, Manual Scrutiny) on the left, and a rule condition workstation with logical connectors (AND, OR, NOT) on the right.

### Business Logic and Functional Workflow
When candidate applications are submitted, they are evaluated against these rules. The system parses the conditions, compares them with the candidate's form responses, and determines the target action (e.g., automatic approval or rejection), reducing manual screening time.

### Technical Implementation
Uses a rule evaluator on the backend. The rule set is defined as nested conditions in the database, which are compiled into checks or queries at runtime.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface EligibilityRule {
  id: string;
  name: string;
  priority: number;
  action: 'APPROVE' | 'REJECT' | 'HOLD' | 'MANUAL_SCRUTINY';
  conditions: Array<{
    field: string;
    operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
    value: string;
    connector: 'AND' | 'OR';
  }>;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/eligibility-rules
Request Payload:
{
  "examId": "e1",
  "name": "Age check",
  "priority": 1,
  "action": "REJECT",
  "conditions": [
    { "field": "age", "operator": "GREATER_THAN", "value": "30" }
  ]
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model EligibilityRule {
  id         String                 @id @default(cuid())
  examId     String
  name       String
  priority   Int
  action     String
  conditions EligibilityCondition[]
  active     Boolean                @default(true)
}
```

---

## 6. Admin Portal - Application Scrutiny & Scrutiny Panel (/admin/applications)

![6. Admin Portal - Application Scrutiny & Scrutiny Panel (/admin/applications)](images/applications_page.png)

### UI Layout and User Experience
The Application Scrutiny workspace displays candidate submissions. The layout consists of: a table of candidates with application numbers, names, submission dates, eligibility, and verification statuses on the left; and a details panel displaying personal details, dynamic form responses, and a timeline on the right, along with status control buttons.

### Business Logic and Functional Workflow
Applications begin in a `PENDING` state. Officers can review details and update the status to `APPROVED`, `REJECTED`, `HELD`, or `RETURNED_FOR_CORRECTION`. Returning an application unlocks the form for the candidate to edit.

### Technical Implementation
The frontend fetches details and updates status values. It connects to the applications endpoint to fetch data and write transition updates.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface ApplicationRow {
  id: string;
  applicationNo: string;
  candidateName: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HELD' | 'RETURNED_FOR_CORRECTION';
}
```

#### Backend API Schema (Request / Response Schema)
```json
PATCH /api/applications/:id
Request Payload:
{
  "status": "APPROVED",
  "remarks": "Form details verified successfully."
}
Response:
{ "id": "a1", "status": "APPROVED" }
```

#### Database Schema (Prisma Model Schema)
```prisma
model Application {
  id            String                 @id @default(cuid())
  applicationNo String                 @unique
  candidateId   String
  examinationId String
  status        String                 @default("PENDING")
  submittedAt   DateTime               @default(now())
  history       ApplicationHistory[]
}
```

---

## 7. Admin Portal - Document Verification (/admin/verification)

![7. Admin Portal - Document Verification (/admin/verification)](images/verification_page.png)

### UI Layout and User Experience
The Document Verification workstation features a candidate list on the left, and a document preview area on the right. Verifiers can view uploaded files (such as signatures, photos, and academic certificates) with zoom and rotate controls, and approve or reject documents with specific comments.

### Business Logic and Functional Workflow
Verifiers check candidate files against exam guidelines. Rejecting a document requires a remark, which is displayed to the candidate so they can correct and re-upload the file.

### Technical Implementation
Integrates with Cloudinary to load candidate files. The frontend manages zoom and rotation state and submits verification statuses to the API.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface DocumentVerification {
  documentId: string;
  type: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/applications/:id/documents/:docId/verify
Request Body:
{
  "status": "REJECTED",
  "remarks": "Blurred certificate image. Please upload a clear scan."
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model ApplicationDocument {
  id            String      @id @default(cuid())
  applicationId String
  type          String
  url           String
  status        String      @default("PENDING")
  remarks       String?
}
```

---

## 8. Admin Portal - Centre Management (/admin/centres)

![8. Admin Portal - Centre Management (/admin/centres)](images/centres_page.png)

### UI Layout and User Experience
The Centre Management panel displays a venue table with columns for Code, Name, City, State, Capacity, and Available Systems. The details panel shows lab setups, GPS coordinates, and seat allocation tools.

### Business Logic and Functional Workflow
Handles physical test venues. After applications are approved, the controller can run an auto-allocation algorithm to distribute candidates to centers based on preferences and capacity.

### Technical Implementation
Uses an allocation algorithm on the backend. The frontend manages center information and triggers seat assignments.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface CentreDetails {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  availableSystems: number;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/examinations/:id/centres/allocate
Response Payload:
{
  "allocatedCount": 320,
  "unallocatedCount": 0,
  "message": "Candidate seat allocation complete."
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model ExamCentre {
  id               String       @id @default(cuid())
  examId           String
  name             String
  city             String
  capacity         Int
  availableSystems Int
  gpsLatitude      Float?
  gpsLongitude     Float?
}
```

---

## 9. Admin Portal - Hall Ticket Management (/admin/hall-tickets)

![9. Admin Portal - Hall Ticket Management (/admin/hall-tickets)](images/hall_tickets_page.png)

### UI Layout and User Experience
The Hall Ticket Management interface features candidate search and status tables. The control bar contains buttons to generate roll numbers, assign seat numbers, release hall tickets, and download admit card PDFs in bulk.

### Business Logic and Functional Workflow
Generates hall tickets for approved candidates. Clicking generate creates a roll number, assigns a seat, and generates a QR code. Releasing tickets makes them downloadable from the candidate dashboard.

### Technical Implementation
The backend uses `pdfkit` to compile printable hall ticket PDFs. The frontend tracks generation progress and updates status values.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface HallTicketRow {
  id: string;
  rollNumber: string;
  seatNumber: string;
  centreName: string;
  reportingTime: string;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/hall-tickets/generate
Request Payload:
{
  "examId": "e1"
}
Response:
{ "generated": 320 }
```

#### Database Schema (Prisma Model Schema)
```prisma
model HallTicket {
  id            String      @id @default(cuid())
  applicationId String      @unique
  examId        String
  centreId      String
  rollNumber    String      @unique
  seatNumber    String
  qrCode        String
  barcode       String
  reportingTime DateTime
}
```

---

## 10. Admin Portal - Question Bank (/admin/questions)

![10. Admin Portal - Question Bank (/admin/questions)](images/question_bank_page.png)

### UI Layout and User Experience
The Question Bank interface features a subject and topic tree on the left, and a questions list in the center. Setters can filter questions by difficulty and type, and use the editor panel to configure prompts, options, marks, and explanations.

### Business Logic and Functional Workflow
Setters build question pools categorized by subject and topic. These pools are linked to exams, and the online exam engine randomizes and renders questions during tests.

### Technical Implementation
Coordinates nested option structures in the editor state. The frontend saves questions and option arrays via the questions API.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface Question {
  id: string;
  bankId: string;
  prompt: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'MCQ' | 'MSQ' | 'NUMERIC';
  marks: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/questions
Request Payload:
{
  "bankId": "b1",
  "subjectId": "s1",
  "topicId": "t1",
  "prompt": "What is 2+2?",
  "difficulty": "EASY",
  "questionType": "MCQ",
  "marks": 2,
  "options": [
    { "text": "4", "isCorrect": true },
    { "text": "5", "isCorrect": false }
  ]
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model Question {
  id            String              @id @default(cuid())
  bankId        String
  subjectId     String
  topicId       String
  questionType  String
  prompt        String
  difficulty    String
  marks         Float
  options       QuestionOption[]
}
```

---

## 11. Admin Portal - Result Management (/admin/results)

![11. Admin Portal - Result Management (/admin/results)](images/results_page.png)

### UI Layout and User Experience
The Result Management panel displays performance charts and a results table. It includes buttons to recalculate results, hold candidate scores, publish scorecards, and export merit list sheets.

### Business Logic and Functional Workflow
The engine calculates marks based on candidate responses and the correct options in the question bank, computing percentages and ranks, and publishing scorecards for candidates.

### Technical Implementation
Computes scores on the backend. The frontend handles table rendering and triggers result compilation and publication.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface ResultRow {
  id: string;
  rollNumber: string;
  marks: number;
  percentage: number;
  rank: number;
  percentile: number;
  qualified: boolean;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/results/publish
Request Payload:
{
  "examId": "e1"
}
Response:
{ "status": "RESULTS_PUBLISHED" }
```

#### Database Schema (Prisma Model Schema)
```prisma
model Result {
  id            String      @id @default(cuid())
  applicationId String      @unique
  examId        String
  marks         Float
  percentage    Float
  rank          Int
  percentile    Float
  qualified     Boolean
  status        String      @default("DRAFT")
}
```

---

## 12. Admin Portal - Audit Logs (/admin/audit)

![12. Admin Portal - Audit Logs (/admin/audit)](images/audit_logs_page.png)

### UI Layout and User Experience
The Audit Logs panel displays a system events table showing timestamp, user email, role, action, affected record, and IP address. The details panel displays before-and-after values for modified records.

### Business Logic and Functional Workflow
Records system activity to ensure compliance. It tracks configuration changes, result publications, and document verifications, providing a complete history.

### Technical Implementation
Reads audit events from the database. The frontend displays the events with filters for user, role, and action.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface AuditLogRow {
  id: string;
  userEmail: string;
  role: string;
  action: string;
  affectedRecord: string;
  createdAt: string;
  oldValue: string | null;
  newValue: string | null;
}
```

#### Backend API Schema (Request / Response Schema)
```json
GET /api/audit-logs?search=admin
Response:
[
  { "id": "log1", "userEmail": "admin@exam.gov", "action": "ARCHIVE_EXAM" }
]
```

#### Database Schema (Prisma Model Schema)
```prisma
model AuditLog {
  id             String   @id @default(cuid())
  userEmail      String
  role           String
  action         String
  affectedRecord String
  oldValue       String?
  newValue       String?
  ipAddress      String?
  createdAt      DateTime @default(now())
}
```

---

## 13. Admin Portal - System Settings (/admin/settings)

![13. Admin Portal - System Settings (/admin/settings)](images/settings_page.png)

### UI Layout and User Experience
The System Settings panel manages application configurations. The interface features a sidebar to toggle between settings sections: General (portal name, theme), Security (password strength, timeouts), Storage (upload limits), SMTP email settings, and Backups.

### Business Logic and Functional Workflow
Saves configurations to the database to update application behavior globally (e.g., changing file upload limits updates validation checks).

### Technical Implementation
Modifies global system variables. The frontend displays forms for different configuration areas and saves changes via the settings API.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface SystemSetting {
  key: string;
  value: any;
}
```

#### Backend API Schema (Request / Response Schema)
```json
PATCH /api/settings
Request Payload:
{
  "key": "fileUploadLimitMb",
  "value": 5
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model SystemSetting {
  id    String @id @default(cuid())
  key   String @unique
  value Json
}
```

---

## 14. Candidate Portal - Multi-Step Registration (`/register`)

![14. Candidate Portal - Multi-Step Registration (`/register`)](images/candidate_registration_page.png)

### UI Layout and User Experience
The Candidate Registration Portal features a multi-step wizard. The layout includes a progress tracker at the top showing current steps, a form pane displaying the inputs configured for the exam, and a navigation bar with 'Save' and 'Next' buttons.

### Business Logic and Functional Workflow
Loads the examination's custom form template and validates inputs. When submitted, the application is locked, and a unique application number is generated.

### Technical Implementation
Dynamic form fields are rendered using React hook state. The frontend handles validations and submits the application payload.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface RegistrationPayload {
  examId: string;
  responses: Array<{
    fieldId: string;
    value: any;
  }>;
}
```

#### Backend API Schema (Request / Response Schema)
```json
POST /api/applications
Request Payload:
{
  "examinationId": "e1",
  "responses": [
    { "fieldId": "f1", "value": "VISWAA S" }
  ]
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model Candidate {
  id           String            @id @default(cuid())
  userId       String            @unique
  profile      CandidateProfile?
}

model DynamicFormResponse {
  id            String           @id @default(cuid())
  applicationId String
  fieldId       String
  value         Json
}
```

---

## 15. Candidate Dashboard (`/candidate`)

![15. Candidate Dashboard (`/candidate`)](images/candidate_dashboard_page.png)

### UI Layout and User Experience
The Candidate Dashboard displays the applicant's profile and examination details. It features a progress timeline (Submitted, Scrutiny, Approved, Hall Ticket, Exam, Result) and action cards for tasks like downloading hall tickets or starting exams.

### Business Logic and Functional Workflow
Displays options based on the active workflow phase. Hall ticket downloads, exam links, and scorecards are enabled only during their respective phases.

### Technical Implementation
Fetches application details and active phases. The frontend enables or disables action cards based on phase status.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface CandidateApplication {
  id: string;
  status: string;
  examName: string;
  activePhase: string;
  hallTicketUrl: string | null;
  resultUrl: string | null;
}
```

#### Backend API Schema (Request / Response Schema)
```json
GET /api/applications/my-application
Response:
{
  "id": "a1",
  "status": "APPROVED",
  "examName": "B.Tech Entrance",
  "activePhase": "HALL_TICKET_RELEASE"
}
```

#### Database Schema (Prisma Model Schema)
```prisma
// Queries fields across multiple tables:
// - Application where candidateId = currentCandidateId
// - WorkflowPhase where examId = application.examId and status = "OPEN"
// - HallTicket where applicationId = application.id
```

---

## 16. Candidate Portal - Online Exam CBT (`/exam`)

![16. Candidate Portal - Online Exam CBT (`/exam`)](images/online_exam_page.png)

### UI Layout and User Experience
The CBT Online Exam interface features a top header with the exam title and countdown timer, a question pane with prompts and options, and a question palette grid showing color-coded status circles.

### Business Logic and Functional Workflow
Manages the test environment. Candidate responses are saved locally and synced to the database periodically. When the timer expires, the test is submitted automatically.

### Technical Implementation
Uses local state to manage the active question index and responses. The frontend saves responses to the API and handles auto-submission.

### Code Schemas

#### Frontend Schema (TypeScript / Interface Schema)
```typescript
interface ExamSessionState {
  sessionId: string;
  timeRemainingSeconds: number;
  responses: Record<string, { answer: any; marked: boolean }>;
}
```

#### Backend API Schema (Request / Response Schema)
```json
PATCH /api/sessions/save-response
Request Payload:
{
  "sessionId": "s1",
  "questionId": "q1",
  "answer": "4",
  "marked": false
}
```

#### Database Schema (Prisma Model Schema)
```prisma
model ExamSession {
  id            String              @id @default(cuid())
  applicationId String
  examId        String
  startedAt     DateTime?
  status        String              @default("NOT_STARTED")
  responses     CandidateResponse[]
}
```

---

