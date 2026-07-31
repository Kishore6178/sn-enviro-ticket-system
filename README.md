# 🌍 SN Enviro Ticket Raising System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A modern, high-performance, dual-interface issue tracking and telemetry management system designed specifically for field operations and centralized administration. 

This ecosystem bridges the gap between on-site field engineers (who report issues) and backend administrators (who triage, assign, and resolve anomalies), featuring real-time socket connections, offline capabilities, and automated email dispatching.

---

## 🚀 Key Features

* **Dual Interface Architecture**: Two entirely separate, purpose-built interfaces served from a single frontend:
  * **🎛️ Admin Dashboard**: A sleek, glassmorphic React/Tailwind web app for administrators to view live event feeds, manage SLA timers, and analyze ticket status overview charts.
  * **📱 Field Portal (PWA)**: A highly-responsive, mobile-first Progressive Web App tailored for field workers to instantly report issues, capture GPS locations, and upload photo evidence.
* **🔌 Offline PWA Support (IndexedDB)**: Field engineers can submit tickets completely offline. Tickets are securely queued in local storage and silently background-synced the moment cellular/WiFi connection is restored.
* **🌙 Global Dark Mode**: Persistent, toggleable dark and light themes integrated across all dashboards to reduce eye strain in industrial environments.
* **⚡ Real-Time Live Chat**: Instantly pushes new tickets, status updates, and internal chat messages via WebSocket (Socket.io) without requiring a page refresh.
* **📊 Advanced Analytics**: Real-time visual pie charts and bar charts for issue distribution and resolution efficiency powered by Recharts.
* **📜 Automated Audit Trail**: A tamper-proof visual timeline tracking every status change, comment, and assignment made to a ticket for compliance and accountability.
* **🏆 Technician Leaderboard**: An automated aggregation pipeline that calculates average resolution times and awards Gold, Silver, and Bronze badges to gamify field performance.
* **⏱️ Dynamic SLA Monitoring & Email Alerts**: A background Cron Job continuously scans for aging tickets and automatically dispatches high-priority HTML warning emails to assigned technicians to prevent SLA breaches.

---

## 🛠️ Technology Stack

* **Frontend**: React, Vite, TypeScript, Tailwind CSS v3, Recharts, Framer Motion, Dexie (IndexedDB), vite-plugin-pwa
* **Backend**: Node.js, Express, TypeScript
* **Database**: MongoDB (Mongoose ODM)
* **Real-time Engine**: Socket.io
* **Email Service**: Nodemailer (SMTP Integration)
* **Automation**: Node-Cron

---

## 🏗️ System Architecture

### 1. Admin Web Dashboard
The centralized command center for operations. Designed with a premium glassmorphic aesthetic, dark-mode elements, and real-time data visualization.
* Secure JWT Authentication
* Interactive Charts & Telemetry Data
* Automated Audit Trails & Leaderboards
* Live internal discussions on tickets
* 1-Click Technician Assignment

### 2. Client Field Portal (PWA)
A lightning-fast progressive web application meant for on-the-go engineers.
* Frictionless reporting (No login required)
* Offline-first architecture with background cloud sync
* Image attachment capabilities
* Form validation & instant submission animations

### 3. Backend API
The brain of the operation, handling all business logic, routing, and database transactions.
* RESTful API endpoints
* Real-time Socket.io event broadcasting
* Aggregation pipelines for analytics
* Automated SMTP Email triggers

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* MongoDB Instance (Local or Atlas)
* SMTP Credentials (for Email Dispatching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kishore6178/sn-enviro-ticket-system.git
   cd sn-enviro-ticket-system
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start the Frontend Application**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
<div align="center">
  <h3>✨ Built and Deployed by Kishore ✨</h3>
</div>
