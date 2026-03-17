# PulseThread - Release Notes v0.0.6 (Full Web Version)

## Introduction

We are excited to announce PulseThread v0.0.6! This milestone focus on enhancing the "Hero Journey"—making it easier for new users to join, learn, and be recognized for their life-saving contributions.

---

## 🚀 Key Features

### 1. Visual Welcome & Onboarding

We've replaced the static landing page with a dynamic, swipeable **Welcome Slider**.

- **Mission First**: High-resolution slides explaining how PulseThread connects donors and recipients.
- **Secure Registration**: New account creation now requires email verification to maintain the highest standard of community trust.

### 2. Comprehensive Profile & Eligibility

To improve donor matching and safety, we've expanded user profiles:

- **Health Metrics**: Users can now record their Age and Weight.
- **Eligibility Engine**: A new 'Last Donated' date tracker helps heroes know exactly when they are next eligible to save a life.
- **Donor Privacy**: Preferred areas remain text-based and non-precise to protect user location.

### 3. Gamification: The Achievement System

Recognizing heroes is core to PulseThread. We have implemented a fully dynamic **Badge System**:

- **Real-time Awards**: Badges are awarded instantly via database triggers.
- **Badge Types & Triggers**:
  - `Verified Hero`: Granted upon initial profile setup and email verification.
  - `Hero Donor`: Awarded when you become an active donor.
  - `Life Saver`: Earned after your first successful blood donation.
  - `Community Scholar`: Awarded for completing the new learning modules!
  - `Onboarding Master`: Granted for completing the entire application walkthrough.
- **Shareable Glory**: Your badges are beautifully rendered on your Profile Card and fully integrated into the Instagram Social Share feature. Showcase your contributions to the world!

### 4. Educational Learning Modules

New to blood donation? Our interactive **Learning Modal** guides you through:

- **Requesting Blood**: Step-by-step guide to broadcasting a need.
- **Donation Process**: What to expect and how to prepare.
- **Policies & Liability**: Transparent info on app operations and community standards.
- **Video Support**: Seamlessly launch YouTube video tutorials directly from the slides.

### 5. Advanced Infrastructure & Info Hub

- **Dynamic Policy Engine**: One central hub for Privacy, Conduct, About, and Contributor information.
- **Map Accuracy**: Circular markers now feature a 'tail' for precise coordinate location.
- **Hospital Verification**: Proximity checks against official hospital locations when making requests.

---

## 🛠️ Technical Implementation

- **Frontend**: Built with React Native & Expo Router.
- **Backend**: Supabase (PostgreSQL) with event-driven SQL triggers.
- **State Management**: AsyncStorage for onboarding persistence.
- **Code Health**: 100% pass rate on `expo lint` and TypeScript `noEmit` checks.

---

---

# PulseThread - Release Notes v0.0.8 (Full Web Version)

## Introduction

PulseThread v0.0.8 introduces significant enhancements to location intelligence, social connectivity, and overall system reliability. This update focuses on ensuring a seamless experience even when connectivity is limited and giving users more control over their donor profiles with strict data integrity.

---

## 🚀 Key Features

### 1. Persistent Location Fallback

We've implemented a smarter location engine to ensure the app stays useful even when GPS or permissions are unavailable.

- **Location Memory**: The app now locally persists your last known active location using secure `AsyncStorage`.
- **Intelligent Fallback**: If a fresh GPS lock fails, the app automatically restores your last active position, ensuring local donor data remains relevant.
- **Global Default**: As a final fallback, the app uses a standard global coordinate to ensure core features remain functional.

### 2. Enhanced Request Visibility & Validation

Broadcasting a need for blood is now safer, more intuitive, and strictly validated.

- **Instant Street Address**: When selecting "Current Location," the app now performs real-time reverse geocoding via Google Maps API to provide street-level confirmation (e.g., "Road 10, Banani").
- **Strict Validation**: The blood request flow now blocks free-text hospital names. Requesters must select a verified medical facility from search suggestions or verify their presence via GPS.
- **Automatic Area Extraction**: Geographic areas are now automatically detected and categorized for better matching with local donors.

### 3. Universal Social Sharing

Showcasing your donor status is now platform-agnostic.

- **Cross-Platform Support**: Generalised the sharing feature from Instagram-only to support all social apps (Facebook, Twitter, WhatsApp, Signal, etc.).
- **Premium Design**: Replaced platform-specific branding with a sleek, app-themed red gradient design.
- **Social Metadata**: Optimized sharing metadata to ensure your donor card looks professional and high-fidelity on any platform.

### 4. Optimized Sharing UX

We've significantly improved the visual stability of the sharing process.

- **Premium Loader Overlay**: Introduced a dedicated, dark-themed sharing overlay with a smooth ActivityIndicator.
- **Stability Improvement**: The main profile content now remains fully rendered and stable beneath the loader, preventing the "vanishing UI" issue during card generation.

### 5. Streamlined Profile Management

- **Preferred Areas Relocation**: Moved the "Manage Preferred Areas" settings from the request flow to the central Profile page for better organizational logic.
- **Unified Settings**: Manage your notification zones directly alongside your health metrics and personal information.

### 6. Strictly Validated Locations

We've introduced strict data integrity for all location-based interactions.

- **Verified Areas**: preferred donation zones must now be selected from official Google Places predictions, ensuring your profile only contains valid, searchable locations.
- **Secure Requesting**: The blood request flow now blocks free-text hospital names. Requesters must select a verified medical facility from search suggestions or verify their presence at an actual hospital via GPS.

### 7. Reliable Hospital Verification

Smarter logic to ensure requests are sent from legitimate medical facilities.

- **Increased Detection Radius**: The proximity check for hospitals now searches within a **1km radius**, accounting for large hospital campuses and GPS variance.
- **Broader Recognition**: Verification now recognizes clinics, medical centers, and specialized hospitals, reducing "False Negatives" for users at valid facilities.

### 8. Universal Social Sharing

Showcasing your donor status is now platform-agnostic with improved stability.

- **Cross-Platform Support**: Generalised the sharing feature from Instagram-only to support all social apps (Facebook, Twitter, WhatsApp, Signal, etc.).
- **Premium Design**: Replaced platform-specific branding with a sleek, app-themed red gradient design.
- **Optimized UX**: Introduced a dedicated, dark-themed sharing overlay that prevents UI flickering during high-fidelity card generation.

### 9. Strictly Validated Donor Profiles

- **Verified Areas**: Preferred donation zones must now be selected from official Google Places predictions, ensuring your profile only contains valid, searchable locations.
- **Streamlined Management**: Moved area settings to the central Profile page for better organizational logic with a clean list-based display.

### 10. Focused Request Flow

- **UX Refinement**: Removed the "Preferred Donation Areas" from the request broadcast sheet to eliminate confusion between donating and requesting blood.
- **Dedicated Workflow**: The request sheet is now 100% focused on the destination where blood is needed.

---

## 🛠️ Technical Implementation

- **Data Architecture**: Fully consolidated database migrations into a robust, idempotent `schema.sql` for 100% reliable deployment and re-execution.
- **Security**: Refined RLS (Row Level Security) policies for the Badge system and User Badges to prevent unauthorized modifications.
- **Persistence**: Enhanced `AsyncStorage` integration in `locationStore` for local state persistence.
- **API Integration**: Advanced use of Google Maps Geocoding and Place Details APIs for real-time address resolution and location validation.
- **UX Refinement**: Comprehensive cleanup of the request flow to focus on core functionality and reduce user friction.

---

_Join us on GitHub to contribute or report issues. PulseThread is and will always be Open Source._
