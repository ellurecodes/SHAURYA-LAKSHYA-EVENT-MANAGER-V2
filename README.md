# 🎯 SHAURYA-LAKSHYA Event Manager V2

**🌐 Live Website:** [https://shaurya-lakshya-event-manager.vercel.app/](https://shaurya-lakshya-event-manager.vercel.app/)  
**📖 Complete V2 Features Guide:** See [NEW_FEATURES_GUIDE.md](./NEW_FEATURES_GUIDE.md) for full operational documentation.  
**🗄️ Database Schema & Architecture:** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for data model specifications.

> **Official Slot Booking & Live Scoring System for the NCC Air Rifle & Pistol Shooting Event**  
> Powered by Precihole Sports | 8th Mile Fest, RVCE

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=flat&logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## 📋 Overview

**SHAURYA-LAKSHYA** is a real-time event management system built for the NCC Air Rifle Shooting Competition. It serves as the **primary key for event participants to select their firing slots** and features a **dynamically updated leaderboard** with live score entry.

The system was designed to handle high-volume participant registration, slot capacity management, and real-time score tracking during the 2-day shooting event (26th & 27th September).

---

## ✨ Key Features

### 🎫 Slot Booking System
- **Email-Based Verification**: Only pre-approved emails can register
- **Time Slot Selection**: Participants choose from 8 hourly slots per day (08:00 - 16:00 HRS)
- **Capacity Management**: Each slot supports up to 60 participants with real-time availability tracking
- **Auto-Generated Tickets**: Unique ticket IDs assigned upon successful booking
- **Duplicate Prevention**: One booking per email enforced at system level

### 📊 Live Leaderboard
- **Real-Time Updates**: Scores sync instantly via Firebase listeners
- **Gender-Based Filtering**: Separate leaderboards for Male and Female participants
- **Tie-Breaker Logic**: When scores are tied, participants are ranked by count of 10s, then 9s, etc.
- **Search Functionality**: Quick lookup of participants by name

### 🏆 Score Management
- **Multiple Scorecards**: Support for multiple rounds/re-entries per participant
- **10-Shot Scoring**: Standard 10-shot scorecard format
- **Penalty Tracking**: Deductions applied per scorecard
- **Disqualification Handling**: Mark individual scorecards as DQ without affecting other rounds

### 🔐 Admin Panel
- **Google OAuth Authentication**: Restricted to authorized admin emails
- **Slot Management**: Create, delete, and load standard schedules
- **Email Allowlist**: Bulk import of approved participant emails
- **Score Entry Interface**: Expandable participant cards for score input
- **Data Export**: CSV download of all participant data and scores

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Frontend UI Framework |
| **Vite 7** | Build Tool & Dev Server |
| **Firebase Auth** | Anonymous + Google OAuth Authentication |
| **Cloud Firestore** | Real-time NoSQL Database |
| **TailwindCSS 4** | Utility-first CSS Framework |
| **Lucide React** | Icon Library |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lokaksha25/SHAURYA-LAKSHYA-EVENT-MANAGER.git
   cd SHAURYA-LAKSHYA-EVENT-MANAGER
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
shaurya-lakshya/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Custom styles
│   ├── main.jsx         # React entry point
│   └── assets/          # Static assets
├── public/              # Weapon images & logos
├── firestore.rules      # Firestore security rules
├── firebase.json        # Firebase configuration
└── package.json         # Dependencies & scripts
```

---

## 📅 Event Schedule

| Date | Time Slots | Capacity per Slot |
|------|------------|-------------------|
| 26th September | 08:00 - 16:00 HRS (8 slots) | 60 participants |
| 27th September | 08:00 - 16:00 HRS (8 slots) | 60 participants |

---

## 🔧 Firebase Configuration

The app uses the following Firestore collections:
- `participants` - Registered participants with booking details and scorecards
- `slots` - Available time slots with capacity tracking
- `allowed_emails` - Pre-approved email whitelist

### Security Rules
Firestore rules are time-limited. Update `firestore.rules` and deploy to Firebase Console when expired.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 👥 Admin Access

Authorized admin emails:
- `nccrvce2025@gmail.com`
- `nccrvceshaurya@gmail.com`
- `lokakshas.cs24@rvce.edu.in`

---

## 📸 Featured Arsenal

The event showcases precision air rifles and pistols from **Precihole Sports**:
- Achilles X3 - Precision PCP Rifle
- PX120 Minotaur - Tactical Bullpup Design
- Benchrest Special - Competition Grade Accuracy
- PP75 Champion - Elite Air Pistol
- PP55 Match Pro Junior - Junior Competition Pistol
- PX100 Match - Standard Match Rifle

---

## 📄 License

This project was developed for **NCC RVCE** as part of the **8th Mile Fest**.

---

<p align="center">
  <strong>🎯 AIM. FOCUS. FIRE. 🎯</strong><br>
  <em>SHAURYA-LAKSHYA Event Management System</em>
</p>
