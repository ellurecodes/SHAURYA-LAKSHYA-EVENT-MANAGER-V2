# 🎯 SHAURYA-LAKSHYA V2 — Feature Documentation & User Guide

Welcome to the **SHAURYA-LAKSHYA Event Manager V2** comprehensive guide. This document outlines all the new features, architecture improvements, and operational workflows implemented in this release.

---

## 📑 Table of Contents
1. [Cinematic Hero & Ballistic Bullet Animation](#1-cinematic-hero--ballistic-bullet-animation)
2. [Shooting Categories (Air Rifle & Pistol)](#2-shooting-categories-air-rifle--pistol)
3. [Atomic Booking & Concurrency Protection](#3-atomic-booking--concurrency-protection)
4. [Digital Event Pass & Live Rank Retrieval](#4-digital-event-pass--live-rank-retrieval)
5. [QR Code Check-In & Scanner Station](#5-qr-code-check-in--scanner-station)
6. [Live Leaderboard & Tie-Breaker Scoring](#6-live-leaderboard--tie-breaker-scoring)
7. [Admin Panel & Range Operations](#7-admin-panel--range-operations)
8. [Firestore Security & Access Control](#8-firestore-security--access-control)

---

## 1. Cinematic Hero & Ballistic Bullet Animation

### How it works:
- **On Page Load**: A bright glowing projectile tracer sweeps horizontally (`0% → 100%`) across the hero title, smoothly revealing the full gold title **`SHAURYA-LAKSHYA`** via hardware-accelerated CSS keyframes (`clip-path: inset(0 0% 0 0)`).
- **On Scroll-Up**: Whenever a visitor scrolls upward through the page, a throttled single-shot listener (with a 1.6s cooldown) fires the tracer sweep across the title once cleanly.
- **Interactive Click**: Clicking or tapping directly on the title also triggers a crisp ballistic shot across the text.
- **Responsive Typography**: Uses fluid typography (`text-2xl` to `text-7xl`) so that all 15 characters (from `"S"` to the final `"A"`) are 100% visible on mobile, tablet, and 4K desktop screens without any clipping.

---

## 2. Shooting Categories (Air Rifle & Pistol)

### How it works:
- **Dual Discipline Separation**: Participants register specifically for either **Air Rifle** or **Pistol**.
- **Category-Specific Slots**: Time slots are partitioned by discipline so that rifle and pistol range lanes are managed independently.
- **Dedicated Leaderboards**: Live standings can be toggled between Air Rifle and Pistol with gender filters (Male / Female).
- **Event Pass Metadata**: Every candidate's digital pass displays their official category badge with discipline color coding.

---

## 3. Atomic Booking & Concurrency Protection

### How it works:
- **Firestore `runTransaction`**: Booking operations execute inside atomic transactions to eliminate race conditions and overselling when hundreds of candidates book simultaneously.
- **Deterministic Document IDs**: The participant record is keyed by the normalized email (`doc(participants, sanitizedEmail)`), strictly preventing concurrent duplicate registrations.
- **Real-Time Capacity Check**: Slot availability is validated inside the transaction read before incrementing the booked count.
- **Security-Compliant Token Generation**: Generates unique alphanumeric ticket IDs (`TKT-XXXXXX`) and cryptographically secure QR tokens.

---

## 4. Digital Event Pass & Live Rank Retrieval

### How it works:
- **Pass Retrieval**: Participants can look up their pass at any time by entering their **Registered Email** or **Ticket ID** in the *Event Pass* tab.
- **Live Leaderboard Integration**: Displays the candidate's real-time rank and total score within their discipline and gender category.
- **QR Code for Check-In**: Embeds an SVG QR code containing the unique participant verification token.
- **Print & PDF Ready**: Formatted with dedicated print media styles (`@media print`) for 1-click printing on standard pass cards.

---

## 5. QR Code Check-In & Scanner Station

### How it works:
- **Range Officer Scanner**: Admin panel includes a live camera QR scanner powered by `html5-qrcode` to scan passes at the range entry gate.
- **Instant Candidate Verification**: Scans decode the token and display the candidate's name, category, slot time, and current check-in status.
- **One-Click Check-In**: Range officers click **Confirm Check-In** to stamp the participant record with `serverTimestamp()` and the officer's email.
- **Duplicate Prevention**: If a scanned pass was already checked in, the system alerts the officer with the exact timestamp of earlier admission.
- **Manual Ticket Lookup**: Range officers can also search candidates by Ticket ID or Email if camera scanning is unavailable.

---

## 6. Live Leaderboard & Tie-Breaker Scoring

### How it works:
- **Real-Time Synchronisation**: Scores update dynamically as range marshals input shot values.
- **10-Shot Scorecard System**: Supports shot entries (1–10), penalty deductions, and disqualification (DQ) tracking.
- **Automated Tie-Breaking Algorithm**: When multiple shooters achieve identical total scores, ties are automatically resolved using high-score frequency:
  1. Count of **10s**
  2. Count of **9s**
  3. Count of **8s**, down to **1s**
- **CSV Data Export**: Full championship report exportable to `.csv` with all shot details, check-in timestamps, and rank breakdowns.

---

## 7. Admin Panel & Range Operations

### How it works:
- **Google OAuth Admin Authentication**: Secure login restricted to authorized Google accounts.
- **Standard Schedule Generator**: 1-click generation of the standard 8-slot daily schedule for both competition days and both disciplines.
- **Bulk Email Whitelist Import**: Add approved participant emails individually or in bulk via comma/newline-separated lists.
- **Live Scoring Interface**: Expandable cards for rapid score entry with automatic total recalculation.

---

## 8. Firestore Security & Access Control

### How it works:
- **Time-Based Open Rules Removed**: Replaced open wildcard access with strict path-based security rules.
- **Role-Based Permissions**: Only authorized admin emails have write access to slots, allowlists, and scoring records.
- **Public Booking Validation**: Anonymous users can only create their own participant document with strict schema validation.
- **Immutable Historical Logs**: Score adjustments and check-in stamps are tamper-proof against unauthorized client writes.

---

<p align="center">
  <strong>🎯 SHAURYA-LAKSHYA 2026 🎯</strong><br>
  <em>Precision Shooting Event Management & Scoring Architecture</em>
</p>
