# FairGig - Gig Worker Income & Rights Platform

A microservice-based platform empowering gig workers to log earnings, verify income, detect unfair deductions, and file grievances. Built for SOFTEC 2026 24-hour hackathon.

## 🚀 Live Demo

~~fairgig.sulamanshahzad492.workers.dev~~ (Currently paused - free tier limit reached)

**Demo Credentials:**
- **Worker:** demo@gmail.com / demo123
- **Advocate:** advocate@gmail.com / advocate123

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Microservices Architecture](#microservices-architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Hackathon Context](#hackathon-context)
- [Team](#team)
- [License](#license)

## 🎯 Problem Statement

Pakistan has millions of gig workers (ride-hailing drivers, food delivery riders, freelancers) who:
- Cannot prove income to landlords or banks
- Have no visibility into unfair commission changes
- Get deactivated without explanation
- Have no platform to file collective grievances

**FairGig solves this** by giving workers a way to log, verify, and understand their earnings across platforms, while giving advocates tools to spot systemic unfairness.

## ✨ Features

### For Gig Workers
- Log shifts with platform, hours, earnings, and deductions
- Bulk CSV import for tech-savvy users
- Upload screenshot proof for verification
- View income analytics (weekly/monthly trends, hourly rate)
- Compare earnings against city-wide median
- Generate printable income certificate for landlords/banks
- File grievances on the community board

### For Advocates
- Monitor commission rate changes across platforms
- View income distribution by city zone
- Identify workers with 20%+ month-on-month income drops
- Tag and cluster similar complaints
- Escalate and resolve grievances

### Technical Features
- Anomaly detection flags unusual deductions or income drops
- Screenshot verification workflow (approve/flag/unverifiable)
- Role-based access (Worker / Advocate)

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, FastAPI (Python) |
| **Databases** | MongoDB |
| **Authentication** | JWT |
| **Deployment** | Render, Cloudflare Workers (legacy) |
| **Containerization** | Docker |

## 🏗 Microservices Architecture

| Service | Technology | Responsibilities |
|---------|------------|------------------|
| **API Gateway** | Node.js/Express | Route requests to appropriate services |
| **Auth Service** | Node.js/Express | JWT login, role management, token refresh |
| **Earnings Service** | Node.js/Express | CRUD for shift logs, CSV import, screenshot verification |
| **Anomaly Service** | FastAPI (Python) | Detect unusual deductions/income drops with plain-language explanation |
| **Grievance Service** | Node.js/Express | Complaint CRUD, tagging, clustering |
| **Analytics Service** | Node.js/Express | Aggregate KPIs, commission trends, vulnerability flags |
| **Certificate Renderer** | Node.js/Express | Generate printable HTML income certificates |

## 📁 Project Structure
fairgig-platform/
├── client/ # React frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Login, Signup, Dashboard
│ │ └── lib/ # API client
│ └── public/images/ # Static assets
│
└── server/
├── api-gateway/ # Entry point (Node.js)
├── authService/ # Authentication (Node.js)
├── earningService/ # Earnings CRUD (Node.js)
├── anomalyService/ # Anomaly detection (FastAPI/Python)
├── grievanceService/ # Complaint system (Node.js)
├── analyticsService/ # Analytics (Node.js)
└── certificateService/ # PDF generator (Node.js)


## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python 3.12+
- MongoDB

### Backend Setup

1. **Clone & install dependencies**
```bash
git clone https://github.com/sulaman492/fairgig-platform.git
cd fairgig-platform/server

# Install each service
cd api-gateway && npm install
cd ../authService && npm install
cd ../earningService && npm install
cd ../grievanceService && npm install
cd ../analyticsService && npm install

2.Set up Python anomaly service

cd anomalyService
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

3.Configure environment variables
Create .env in each service with:
PORT=5000
DATABASE_URL=your_db_connection_string
JWT_SECRET=your_jwt_secret

4.Start all services
# Start each service in separate terminals
cd api-gateway && npm start
cd authService && npm start
cd earningService && npm start
cd anomalyService && python app.py
cd grievanceService && npm start
cd analyticsService && npm start


Frontend Setup
cd client
npm install
npm run dev

Event: SOFTEC 2026 - National University of Computer & Emerging Sciences (FAST), Lahore

Duration: 24 hours

Theme: Revealed 30 minutes before start

Constraints: Microservices architecture, mandatory FastAPI service + Node.js service, Docker containerization

Result: Working MVP with 6 services

Author
Sulaman Shahzad

GitHub: https://github.com/sulaman492

LinkedIn:https://www.linkedin.com/in/sulaman-shahzad-149820324/

Email: sulamanshahzad492@gmail.com

License
This project was built for educational/hackathon purposes