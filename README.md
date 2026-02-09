# PulseThread 🩸
**Real-Time Blood Donation Logistics Platform (The "Uber for Blood")**

![License: Source Available](https://img.shields.io/badge/License-Source_Available-red)
![Tech: React Native](https://img.shields.io/badge/Tech-React_Native_Expo-blue)
![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase_PostGIS-green)

## 📖 The Story
Last year, my mother battled cancer. During her treatment, I experienced the chaos of the blood donation system firsthand. I was scammed by fake donors asking for travel money, ghosted by volunteers, and lost in the noise of social media posts.

**PulseThread** was built to solve this. It replaces the chaos with **logistics**. It uses real-time geolocation to match donors with patients, offering a "Triple Handshake" verification system to ensure safety, trust, and transparency.

## 🚀 Features
* **Live Geolocation:** Matches donors within a dynamic radius (Supabase PostGIS).
* **Real-Time Tracking:** Requesters can track the donor's path to the hospital (Google Maps API).
* **Triple Handshake Protocol:** A 3-step QR verification flow (Arrival -> Cross-Match -> Donation) to prevent scams.
* **Trust Score:** Automatic vetting of donors based on donation history.

## 🛠 Tech Stack
* **Mobile:** React Native (Expo SDK 50+)
* **Maps:** Google Maps SDK (`react-native-maps`)
* **Backend:** Supabase (PostgreSQL + Realtime)
* **State:** TanStack Query + Zustand

## ⚠️ License & Usage
This project is **Source Available** for educational use and community improvement.
* ✅ You **CAN** view the code, fork it, and submit improvements (PRs).
* ✅ You **CAN** use it to run a free donation network in your community.
* ❌ You **CANNOT** use this for commercial purposes.
* ❌ You **CANNOT** remove the "Support the Developer" links.

See [LICENSE.md](LICENSE.md) for full legal details.

## 🤝 Support the Development
If this app helps you or you want to support the server costs, please consider donating:
[Buy Me A Coffee](https://buymeacoffee.com/ahjim)