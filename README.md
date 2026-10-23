# Oblivion — Centralized IT Infrastructure Management Platform

**Oblivion** is an enterprise-grade IT infrastructure monitoring, server inventory management, and incident response platform built on the **MERN** stack (MongoDB, Express.js, React 18, Node.js). Designed to eliminate administrative blind spots, delayed troubleshooting, and unmonitored system assets, Oblivion provides real-time telemetry streaming, role-based governance, structured incident lifecycles, and security-aware audit logging.

---

## 🏛️ System Architecture

Oblivion adopts a 3-tier architectural model separating client presentation, business rules, and state persistence:

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, DaisyUI, Recharts, Axios
- **Backend**: Node.js, Express.js, Mongoose ODM, JWT, bcryptjs, Nodemailer
- **Database**: MongoDB Atlas / Local MongoDB
- **DevOps & Testing**: GitHub Actions CI/CD, ESLint, Biome, Vitest, Jest

---

## ✨ Key Functional Modules

### 1. 📊 Real-Time Infrastructure Dashboard & Telemetry
* **Live Telemetry Stream:** Continuous metrics polling/streaming delivering hardware performance indicators for CPU, Memory, and Disk utilization across active server nodes.
* **Interactive Visualizations:** Time-series charts displaying historical performance trends and dynamic threshold monitoring.

### 2. 🖥️ Server Inventory Management
* **Infrastructure Nodes:** Complete CRUD interface for registering hardware nodes with unique server identifiers, static/dynamic IP addresses, operational status (Active/Inactive), and creator tracking.
* **Node Telemetry Coupling:** Seamlessly maps incoming streaming telemetry to registered database servers.

### 3. 🚨 Incident Lifecycle & Ticket Management
* **Structured Incident Tracking:** Complete lifecycle tracking for operational issues (open -> in-progress -> resolved) with assigned engineers, priority levels (High, Medium, Low), and resolution timestamps.
* **Role Enforcement:** All user roles can raise tickets; status changes and resolution workflows are reserved for Operator and Admin users.

### 4. 🔒 Role-Based Access Control (RBAC) & Security
* **Granular Roles:**
  * **Admin**: Full system governance, audit log inspection, server management, and privileged user creation.
  * **Operator**: Active IT support — server inventory CRUD, incident assignment, status updates, and trend analysis.
  * **Viewer**: Read-only monitoring dashboard access, live metrics inspection, and public incident submission.
* **JWT & bcrypt Security:** Password security using bcrypt and signed JSON Web Tokens attached via Axios interceptors.

### 5. 📑 Audit Logs & Compliance Governance
* **Request Interception:** Express middleware captures all incoming HTTP requests, recording user IDs, IP addresses, HTTP methods, route paths, status codes, user-agent details, and response latency.
* **Payload Masking:** Sanitizes sensitive parameters prior to MongoDB log persistence.

---

## 📁 Repository Structure

```text
.
├── .github/
│   ├── CODEOWNERS                      # Repository path ownership
│   └── workflows/
│       └── ci-cd.yml                   # Automated GitHub Actions build & test pipeline
├── backend/
│   ├── src/
│   │   ├── config/                     # Mongoose database connection setup
│   │   ├── controllers/                # Auth, Server, Incident, Metric, Audit controllers
│   │   ├── middlewares/                # Token verification, RBAC, and Audit Logger
│   │   ├── models/                     # User, Server, Incident, Metric, AuditLog models
│   │   ├── routes/                     # Protected & public REST API endpoints
│   │   └── utils/                      # Alert notification services
│   ├── tests/                          # Integration and unit test suites
│   ├── server.js                       # Express application bootstrap
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                 # Navbar, StatsCard, MetricChart, RoleRoute guards
│   │   ├── pages/                      # Dashboard, Servers, Incidents, Audit Logs, Trends
│   │   ├── services/                   # Axios client configuration & API wrappers
│   │   ├── App.jsx                     # Root application component
│   │   └── main.jsx                    # React entrypoint & router definitions
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── docker-compose.yml
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.x or higher
* **npm**: v9.x or higher
* **MongoDB**: Active MongoDB Atlas connection URI or local MongoDB instance

---

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd PESU_RR_CSE_I_P03_IT_infrastructure_management_software_Oblivion
```

---

### Step 2: Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/`:
   ```env
   PORT=5000
   CONNECTION_URI=your_mongodb_atlas_uri
   JWT_SECRET_KEY=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   ```

3. Start the Express server:
   ```bash
   node server.js
   ```

---

### Step 3: Frontend Setup

1. Open a new terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📜 Academic Identity & Acknowledgments

* **Course:** UE23CS341A (5th Semester)
* **Campus:** PES University (RR Campus)
* **Branch:** Computer Science Engineering
* **Section / Team:** Section I — Team Oblivion

### Development Team
* **Scrum Master:** SdAasim
* **Developer Team:** Shreejith-19
* **Developer Team:** Shihab31333
* **Developer Team:** shivukc-04
