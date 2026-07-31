# 🌍 SN Enviro Ticket Raising System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A modern, high-performance, dual-interface issue tracking and telemetry management system designed specifically for field operations and centralized administration. 

This ecosystem bridges the gap between on-site field engineers (who report issues) and backend administrators (who triage, assign, and resolve anomalies), featuring real-time socket connections and automated email dispatching.

---

## 🚀 Key Features

* **Dual Interface Architecture**: Two entirely separate, purpose-built frontends:
  * **🎛️ Admin Dashboard**: A sleek, glassmorphic React/Tailwind web app for administrators to view live event feeds, manage SLA timers, and analyze ticket status overview charts.
  * **📱 Field Portal**: A highly-responsive, clean, and bordered mobile-first web portal tailored for field workers to instantly report issues, capture GPS locations, and upload photo evidence.
* **⚡ Real-Time Socket Updates**: Instantly pushes new tickets and status updates to the Admin Dashboard without requiring a page refresh.
* **📧 Automated Email Dispatching**: Built-in HTML email automation that instantly notifies assigned technicians when a ticket is delegated to them, and emails resolution logs upon ticket closure.
* **📸 High-Resolution Evidence Tracking**: Secure, clickable high-resolution image attachments for remote diagnostics.
* **⏱️ Dynamic SLA Monitoring**: Automated countdown timers and badge warnings for critical outages and SLA breaches.

---

## 🛠️ Technology Stack & Languages

This project leverages a robust, multi-language tech stack optimized for performance, scalability, and cross-platform compatibility.

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,dart,cpp,cmake,css,js,react,tailwind,vite,nodejs,express,mongodb,flutter" alt="Tech Stack Images" />
</p>

### Language Breakdown
* **TypeScript:** `48.7%`
* **Dart:** `20.3%`
* **C++:** `12.7%`
* **CMake:** `9.5%`
* **CSS:** `3.7%`
* **JavaScript:** `1.9%`
* **Other:** `3.2%`

### Core Technologies
* **Frontend (Admin Dashboard)**: React, Vite, TypeScript, Tailwind CSS v3, Recharts, Framer Motion
* **Frontend (Field Client)**: React, Vite, TypeScript, Tailwind CSS v3 (Custom Flat Theme)
* **Mobile / Core Apps**: Flutter / Dart
* **Backend API**: Node.js, Express, TypeScript
* **Database**: MongoDB (Mongoose ODM)
* **Real-time Engine**: Socket.io
* **Email Service**: Nodemailer (SMTP Integration)

---

## 🏗️ System Architecture

### 1. Admin Web Dashboard (`/frontend`)
The centralized command center for operations. Designed with a premium glassmorphic aesthetic, dark-mode elements, and real-time data visualization.
* Secure JWT Authentication
* Profile & System Configurations (Instantly synced across UI)
* Interactive Bar Charts & Telemetry Data
* Click-to-view high-resolution image Lightboxes
* 1-Click Technician Assignment & Email Forwarding

### 2. Client Field Portal (`/frontend-client-ticket`)
A lightweight, lightning-fast application meant for on-the-go engineers. Designed with a clean, flat, high-contrast theme for visibility in outdoor environments.
* Requires no login (frictionless reporting)
* Automatic Network connectivity detection
* Image attachment capabilities
* Form validation & instant submission animations

### 3. Backend API (`/backend`)
The brain of the operation, handling all business logic, routing, and database transactions.
* RESTful API endpoints
* Real-time Socket.io event broadcasting
* Automated SMTP Email triggers
* CORS & Environment configuration

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* MongoDB Instance (Local or Atlas)
* SMTP Credentials (for Email Dispatching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jaswanth1904/SN-Enviro-Ticket-Raising-System.git
   cd SN-Enviro-Ticket-Raising-System
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start the Admin Dashboard**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Start the Field Client Portal**
   ```bash
   cd frontend-client-ticket
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
