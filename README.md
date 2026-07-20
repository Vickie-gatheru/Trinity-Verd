# 🌿 Trinity Verd Limited — Castor Seed Farmer & Buyer Portal

An elegant, production-ready full-stack dashboard system designed for **Trinity Verd Limited**, dealers of premium castor oil in **Kitui County, Kenya**. This application streamlines the recruitment, seed distribution, harvest purchasing, payment processing, and SMS communication workflows with local farmers.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Database Schema (Cloud Firestore)](#-database-schema-cloud-firestore)
- [Local Setup & Run Instructions](#-local-setup--run-instructions)
- [Environment Configurations](#-environment-configurations)
- [Exporting and Deploying (Production-Ready)](#-exporting-and-deploying-production-ready)

---

## 🔍 Project Overview

In Kitui County, smallholder farmers grow castor plants to produce seeds for high-quality castor oil. Trinity Verd Limited operates as a primary distributor and buyer. This software serves as an administrative workspace to:
1. **Register and recruit** new castor farmers using localized county/ward structures.
2. **Distribute starting seeds** in sacks, computing target kilogram weights.
3. **Log harvests** and automatically compute payouts based on seed condition (Clean Seeds vs. Husks) using dynamic pricing.
4. **Track M-Pesa payouts** to keep financial records transparent.
5. **Send simulated Bulk SMS notifications** in English and Swahili to farmers regarding seed collections and payments.

<<<<<<< HEAD
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set the Taifa Mobile API key in `.env.local`:
   `TAIFA_API_KEY=your_h_api_key`
4. Run the SMS proxy server in one terminal:
   `npm run sms-server`
5. Start the app in another terminal:
   `npm run dev`
=======
---

## ✨ Key Features

### 1. Farmer Registration & Directory
* Captures National ID number, Full Name, Phone, Village, Ward, Sub-County, and County.
* Implements a robust selector mapping exact Kitui County administrative sub-counties (e.g., Kitui Central, Kitui East, Mwingi West) and their respective Wards.
* Full CRUD capabilities connected to Cloud Firestore.

### 2. Seed Distribution Management
* Log seed packages distributed to registered farmers.
* Automatically records date offered, sacks given, and equivalent seed weight.
* Synchronizes instantly with the Firestore backend database.

### 3. Smart Buyer Dashboard (Calculators & Payments)
* Real-time calculation engine separating harvest into:
  * **Clean Seeds** (higher pricing tier, e.g., KSh 130/Kg)
  * **Husk Seeds** (lower pricing tier, e.g., KSh 75/Kg)
* Auto-computes overall payouts to minimize manual accounting errors.
* Marks transaction records as **Paid** (with transaction code input) or **Pending**.
* Simulates instant M-Pesa payment records.

### 4. Bulk SMS Broadcast Center
* Dynamic text generator for individual or bulk messaging.
* Pre-designed multilingual SMS templates (e.g., collection notifications, payment receipts, seasonal updates).
* Live status tracker showing whether messages are delivered.

### 5. Configurable Pricing Rates
* Secure settings drawer allowing admins to update global per-kilogram rates for clean and husk seeds dynamically. Changes apply to all pending or new computations immediately.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React (v18)](https://react.dev/) + [Vite](https://vite.dev/) for extremely fast hot-reloading and modular file compiling.
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) for modern, responsive, and tactile layouts suited for mobile, tablet, and desktop monitors.
* **Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore) providing durable cloud persistence, transactional writes, and real-time synchronization.
* **Interactive Data & Visuals**: [Recharts](https://recharts.org/) for rendering financial and seed weight analytics.
* **Icons**: [Lucide React](https://lucide-react.dev/) for unified vector icon styling.

---

## 🗄️ Database Schema (Cloud Firestore)

The application uses standard Firestore document models:
* `farmers`: Collection of registered farmers.
* `distributions`: Collection tracking seed sack allocations.
* `harvests`: Collection tracking purchase receipts and payment logs.
* `smsLogs`: Historical logs of broadcast communications.
* `config/rates`: Singleton document defining active price metrics (`cleanSeedPerKg` and `husksSeedPerKg`).

---

## 🚀 Local Setup & Run Instructions

To run this project on your local machine, ensure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 1. Clone or Download the Repository
If you exported this repository from GitHub:
```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Build for Production
To generate optimized HTML, CSS, and JS output files in the `dist/` directory:
```bash
npm run build
```

---

## 🔑 Environment Configurations

For security, the application uses **Vite Environment Variables**. You do not need to hardcode secret API keys. 

1. Copy the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-app-domain.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_DATABASE_ID="your-custom-database-id"
   ```

---

## ☁️ Exporting and Deploying (Production-Ready)

This repository is optimized to be deployed on several popular hosting platforms.

### A. Vercel (Recommended for React SPAs)
1. Push your code to your GitHub repository.
2. Sign in to your [Vercel Console](https://vercel.com).
3. Import your GitHub repository.
4. In the **Environment Variables** section of the Vercel dashboard, copy-paste the values from your `.env` file.
5. Click **Deploy**. Vercel will build and host your app automatically.

### B. Netlify
1. Go to [Netlify](https://www.netlify.com/) and link your GitHub profile.
2. Select your repository.
3. Under Site Settings -> Environment Variables, input your Firebase variables.
4. Set Build Command to `npm run build` and Publish Directory to `dist`.
5. Click **Deploy**.

### C. Firebase Hosting
Since you are already using Firebase Firestore, you can host the application on Firebase for free:
1. Install Firebase CLI globally: `npm install -g firebase-tools`
2. Login to your Firebase account: `firebase login`
3. Initialize hosting in your directory: `firebase init hosting`
   * Select your Firebase project.
   * Specify `dist` as your public directory.
   * Configure as a single-page app (enter `y`).
4. Build the site: `npm run build`
5. Deploy: `firebase deploy --only hosting`

---

*Handcrafted for **Trinity Verd Limited** to support sustainable farming communities in Kitui County.*
>>>>>>> 8eb4ba6014016f10ee3818b5af338eb645fa1f7a
