# 🚀 Project: PulseThread (Initial Version)

**Core Concept:** "Uber for Blood Donation"
**Platform:** Mobile (Android & iOS) via React Native Expo

## 1. Product Requirements Document (PRD)

### 1.1 Product Vision

To replace the chaotic, noise-filled process of finding blood donors on social media with a precise, location-based logistics engine. The app minimizes friction for donors and provides real-time certainty for patients.

### 1.2 User Personas

1. **The Requester:** Usually a patient's family member or hospital staff. Stressed, time-sensitive, needs immediate confirmation. And getting responses without being spammed.
2. **The Donor:** A registered user willing to donate. Needs to know *where*, *when*, and *how urgency* the need is without being spammed.

### 1.3 Core Features (MVP)

#### **A. Onboarding & Profiling**

* **Phone Auth:** Simple email, password and email otp(if available) (Supabase Auth).
* **Profile Setup:** Name, Blood Type (Critical), Date of Birth (to calculate eligibility), and Location permission.
* **Donor Switch:** A global toggle: `Available for Donation` (On/Off).

#### **B. The Request Flow (Requester)**

* **"Ride(Blood Donation)" Request:** A 2 step form.
    * **Step 1:** Select Blood Group, Type of blood (Whole Blood/PRBC, etc.), Urgency Level (Critical/Planned), and Units (1-4 bags).
    * **Step 2:** Set a pickup location (Hospital) on a map.
* **Broadcast:** The request is notified *only* to eligible donors within a dynamic radius (starts at 3km, expands if no response). And others can see the request on the map and in a dedicated tab in the app.
* **History Tab:** A tab to see all the requests made by the user and the status of each request.
* **Request Details Page:** A page to see the details of a request and the status of each request. The page will show the donor's location on the map and the estimated time of arrival. The page will also show the donor's name, blood group, and contact information. The page will also have a button to cancel the request. Also the buttons for QR handshaking will be here.
    

#### **C. The Donation Flow (Donor)**

* **"Donor" Acceptance:** Donors receive a push notification. They view distance and urgency.
* **Accept:** One tap to accept. This "locks" the donor to the request.
* **Navigation:** In-app Google Maps navigation to the hospital.
* **Donation Details Page:** A page to see the details of a donation and the status of the donation. The page will show the requester's location on the map and the estimated time of arrival. The page will also show the requester's name, blood group, and contact information. The page will also have a button to cancel the donation. Also the buttons for QR handshaking will be here.

#### **D. The Verification Loop (Trust Protocol)**

To prevent scams and ensure safety, the physical meeting follows a **Triple-Handshake** via QR Codes:

1. **Arrival Verification:** Donor scans Requester's phone upon reaching the hospital.
2. **Medical Match Verification:** Donor scans Requester's phone after blood screening is approved.
3. **Donation Confirmation:** Donor scans Requester's phone after the bag is filled.

---

## 2. Software Requirements Specification (SRS)

### 2.1 Technical Architecture

* **Frontend Framework:** React Native (Expo SDK 54+).
* **Routing:** Expo Router (Stack/Tabs).
* **Maps Provider:** Google Maps SDK (via `react-native-maps`).
* **Backend:** Supabase (PostgreSQL).
* **Geospatial Engine:** PostGIS (enabled on Supabase).
* **State Management:** TanStack Query (Server State) + Zustand (Client State).

### 2.2 Database Schema (PostgreSQL)

Three primary tables. Initial thought (not final) expanded or modified based on need:

**1. `profiles` Table**

* `id` (UUID, PK) - Links to Supabase Auth.
* `full_name` (Text).
* `blood_type` (Enum: 'A+', 'O-', etc.).
* `is_available` (Boolean) - The "Online/Offline" switch.
* `last_donation_date` (Timestamp) - Used to filter eligibility.
* `current_location` (Geography Point) - Updated periodically or when app opens.
* `fcm_token` (Text) - For push notifications.

**2. `requests` Table**

* `id` (UUID, PK).
* `requester_id` (UUID, FK).
* `hospital_name` (Text).
* `location` (Geography Point).
* `blood_type_needed` (Enum).
* `units_requested` (Int).
* `status` (Enum: 'SEARCHING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').
* `created_at` (Timestamp).

**3. `donations` Table (The Transaction)**

* `id` (UUID, PK).
* `request_id` (UUID, FK).
* `donor_id` (UUID, FK).
* `status` (Enum: 'ACCEPTED', 'ARRIVED', 'MATCHED', 'DONATED').
* `arrival_time` (Timestamp).
* `donation_time` (Timestamp).

### 2.3 API & Logic Requirements

#### **Geospatial Query (The "Uber" Logic)**

You must implement a PostgreSQL function in Supabase to find donors.

* *Input:* `request_lat`, `request_long`, `blood_type`, `radius_meters`.
* *Logic:*
```sql
SELECT * FROM profiles
WHERE blood_type = input_blood_type
AND is_available = TRUE
AND last_donation_date < (NOW() - INTERVAL '3 months')
AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(request_long, request_lat), 4326), radius_meters);

```



#### **Real-time Subscriptions**

* **Requester's Map:** Subscribe to the `profiles` table for the specific `donor_id` who accepted the request to update their marker position live.
* **Request Status:** Both users subscribe to the `donations` table to listen for status changes (e.g., when a QR code is scanned, the status updates instantly on both screens).

### 2.4 User Interface (UI) Guidelines

* **Map View:** Full-screen map is the default.
* **Bottom Sheet:** Use a draggable bottom sheet (like `react-native-bottom-sheet`) for request details. Do not use full-screen modals for simple interactions.
* **Alerts:** Use high-contrast colors (Red/White) for incoming requests to distinguish them from regular app notifications.

### 2.5 Security & Constraints

* **Row Level Security (RLS):**
* *Profiles:* Publicly readable for name/stats, but `location` should only be visible if a request is active between two users.
* *Requests:* Visible to authenticated users.


* **API Keys:** Google Maps API keys must be restricted to your Android/iOS bundle IDs.