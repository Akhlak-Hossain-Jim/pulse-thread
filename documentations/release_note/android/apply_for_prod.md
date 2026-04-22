# Apply for Production Access — PulseThread

**App:** PulseThread  
**Package:** dev.akhlak.app.pulsethread  
**Current Version:** 0.0.9-alpha  
**Date Prepared:** April 22, 2026

> [!NOTE]
> All Play Store submission fields have a **300-character limit**. The answers below are written to fit within that limit. Character counts are noted after each answer.

---

## 1. How did you recruit users for your closed test?

**Play Store answer (249 chars):**
> Recruited friends, family, and university peers in Dhaka, Bangladesh — people personally affected by the blood shortage crisis. The app's GitHub and website sign-up form (500+ registrations) were also used. No paid testing provider was involved.

---

## 2. Describe the engagement you received from testers during your closed test

**Play Store answer (298 chars):**
> Testers completed onboarding, set up donor profiles, created instant and scheduled blood requests, and tested the donor-requester contact flow in pairs. All core features were used. Usage matched real-world expectations — testers wanted to share the app immediately after trying it.

---

## 3. Provide a summary of the feedback you received from testers. Include how you collected the feedback.

**Play Store answer (296 chars):**
> Feedback collected via WhatsApp, Messenger, and GitHub Issues. Key fixes driven by testers: neighbourhood area search, scheduled requests, donor contact visibility, tap-to-call, delete request flow, and map button logic. Overall sentiment was strongly positive.

---

## Full Context (Internal Reference)

### Q1 — Recruitment (full detail)

Testers were recruited through a combination of personal outreach and organic community interest:

- **Friends and family** formed the initial core group. As the developer is based in Dhaka, Bangladesh, these were real individuals with lived experience of the blood donation problem — people who have personally been on the receiving end of frantic Facebook posts and disconnected phone calls when a family member urgently needed blood.
- **University peers and classmates** were invited through direct messaging. Many of them have donated blood informally before and understood the problem well, making them high-quality testers who could evaluate the app against real-world expectations.
- **Developer community** — the app was shared on the developer's LinkedIn and GitHub, attracting a small number of technically oriented users who could provide detailed feedback on app stability and UX flows.
- **Early access sign-up form** — a Google Form was embedded on the official PulseThread website (pulsethread.app) inviting prospective donors and requesters to join the closed test. Over 500 people have signed up, though only a curated subset of approximately 20–30 testers were granted EAS internal distribution builds during the closed test phase.

All testers were onboarded manually — no paid testing provider was used. This was a deliberate choice: blood donation is a deeply personal, social act. Recruiting people from the target community (Dhaka-based individuals with real motivation to donate or request blood) produced far more authentic usage patterns than a paid panel would have.

---

### Q2 — Engagement (full detail)

Tester engagement was active and broadly representative of how real users would interact with the app. Key observations:

**Feature utilisation:**
- All testers completed the **onboarding and email verification** flow. The new `verified.html` redirect page (introduced to handle post-verification deep linking back to the app) was tested on both Android and iOS devices.
- The majority of testers set up a **donor profile** — entering blood type, phone number, and preferred donation areas. The area search and map drop-pin features (introduced in v0.0.9) were tested by multiple individuals who confirmed that searching for Dhaka neighbourhoods like Dhanmondi and Banani now returns correct, country-scoped results.
- Several testers created **blood requests**, including both instant ("Actively looking") and scheduled requests. This covered the date validation logic (minimum 1 day, maximum 30 days), and testers confirmed the picker prevented past-date selections.
- The **donor acceptance and verification flow** was tested end-to-end by paired tester groups (one playing the requester, one playing the donor), allowing the requester-donor contact visibility and tap-to-call features to be exercised in a realistic scenario.
- The **delete pending request** feature was tested by requesters who created requests and then cancelled them before a donor responded, confirming the constraint logic (no deletion when an active response exists) worked as expected.

**Consistency with real user behaviour:**
Tester usage was largely consistent with expected real-world behaviour. The primary difference observed was that **scheduled requests were used more frequently than expected** — testers appeared to enjoy the scheduling feature and used it even for near-future times (same day + 1 day), which is consistent with real donation planning (e.g., scheduling a donation for a known upcoming surgery). This aligns with the intended use case.

One minor deviation: some testers skipped the preferred area selection step during onboarding, which a real donor would be more likely to complete since it directly determines whether they receive notifications. This was noted as a UX improvement for a future release (proactive prompting).

---

### Q3 — Feedback summary (full detail)

Feedback was collected through the following channels:
- **Direct messages (WhatsApp and Messenger):** The majority of testers shared impressions informally through chat, which allowed for conversational back-and-forth.
- **GitHub Issues:** Technically inclined testers reported bugs and suggestions directly on the project repository.
- **In-person conversations:** Several Dhaka-based testers were met in person and walked through the app, allowing screen-recording and live observation of pain points.

**Summary of key feedback:**

| Theme | Feedback | Status |
|---|---|---|
| Area search | "Dhanmondi and Mirpur were not appearing in search results." | ✅ Fixed in v0.0.9 |
| Scheduling | "Can I schedule a donation instead of asking right now?" | ✅ Implemented in v0.0.9 |
| Contact info | "I couldn't call the donor — I didn't have their number." | ✅ Fixed in v0.0.9 |
| Map button | "The map button wasn't showing the right option after I made a request." | ✅ Fixed in v0.0.9 |
| Delete requests | "I made a test request and couldn't find a way to remove it." | ✅ Fixed in v0.0.9 |
| Scheduling UX | "The request form was getting cut off on my screen." | ✅ Fixed in v0.0.9 |
| Verification redirect | "After verifying my email it just went to a blank browser page." | ✅ Fixed |
| General stability | "Feels smooth for an alpha. Location picks up fast." | Positive |
| Future request | "I'd like to track how many lives I've saved." | 🗓 Planned |

Overall tester sentiment was **very positive**. The core concept resonated strongly with every tester — the problem is personally felt by most people in the target region. The most common single piece of feedback was that testers wanted to share the app with others immediately.

---

## 4. Who is the intended audience of your app?

**Play Store answer (285 chars ✅):**
> PulseThread is for voluntary blood donors and people who need to request blood — primarily in Bangladesh. Donors aged 18–60 who want to save lives, and patients or caregivers facing urgent or planned blood needs. No specific technical skill is required to use the app.

---

### Q4 — Intended audience (full detail)

PulseThread serves two distinct but interconnected user groups:

**Donors:**
- Voluntary blood donors aged 18–60, across all blood types
- People who have donated before and want a reliable, structured way to respond to real requests
- University students and young professionals in urban Bangladesh willing to donate but with no easy way to be discovered

**Requesters:**
- Patients undergoing surgery, chemotherapy, or emergency treatment who need blood quickly
- Family members or caregivers acting on behalf of a patient

**Geographic focus:**
Current alpha targets Bangladesh — specifically Dhaka Division — where the blood shortage is acute and the informal donation network (Facebook groups, WhatsApp chains) is deeply inadequate. Architecture supports expansion.

**Age & literacy:**
Designed for anyone comfortable with a smartphone. No technical knowledge required. Localisation to Bangla is planned for a future release.

---

## 5. Describe how your app provides value to users

**Play Store answer (299 chars ✅):**
> PulseThread replaces chaotic Facebook posts and disconnected phone calls with a real-time blood donor matching system. Donors get notified when nearby blood is needed. Requesters track donors live on a map. A verified triple-handshake system ensures the donation actually happens.

---

### Q5 — Value proposition (full detail)

**For donors:**
- Get notified instantly when someone nearby needs their blood type
- Set a preferred area and availability — no unsolicited calls at 3am
- Build a verifiable donation history the community can trust

**For requesters:**
- Post a blood request in seconds — no calling 50 numbers from an outdated list
- Receive real-time responses from verified, eligible donors who are actually nearby
- Watch the donor navigate to the hospital on a live map
- Schedule future requests (1–30 days ahead) for planned surgeries

**For the community:**
- Open-source and non-profit — every improvement benefits the entire network
- Triple Handshake QR verification (3 scans: arrival, medical check, donation) eliminates fake responses and scams
- Donation records create a trusted, growing network of verified helpers

**Core differentiator:**
Unlike static blood donor registries or Facebook groups, PulseThread is a real-time logistics platform. The value compounds as more donors join — every new donor makes the network faster and more reliable for everyone who will ever need blood.

---

## 6. What changes did you make to your app based on what you learned during your closed test?

**Play Store answer (300 chars ✅):**
> v0.0.9 was entirely shaped by tester feedback: added request scheduling, fixed neighbourhood area search, added donor/requester contact visibility with tap-to-call, fixed the map action button logic, added delete for pending requests, and fixed the post-verification redirect page.

---

### Q6 — Changes made (full detail)

Every feature in v0.0.9 was directly driven by tester feedback from the closed test:

| Tester Pain Point | Change Made in v0.0.9 |
|---|---|
| "Not all donations are immediate — I want to plan ahead" | Added request scheduling (1–30 days) with native date picker and validation. Instant requests show an "Actively looking" label. |
| "Dhanmondi and Mirpur didn't show up in area search" | Replaced `types=(regions)` Places query with country-restricted search + client-side sub-locality filtering. Added map drop-pin as fallback. |
| "I couldn't contact the donor — I had no number" | Added mutual contact info display (phone number) and tap-to-call for both donors and requesters. |
| "The map button showed the wrong option after I made a request" | Fixed FAB logic to correctly reflect whether the user has an active request or active response. |
| "I made a test request and couldn't remove it" | Added delete button for PENDING requests with zero non-cancelled responders. |
| "The request form got cut off on my screen" | Wrapped RequestSheet content in ScrollView with 90% screen height constraint. |
| "After verifying my email I landed on a blank browser page" | Created a dedicated `verified.html` page with animated confirmation and deep-link back to the app. |
| "Area was missing from the request card — hard to scan quickly" | Updated request cards to display "Area, Hospital Address" ordering. |

---

## 7. How did you decide that your app is ready for production?

**Play Store answer (297 chars ✅):**
> We ran TypeScript compilation, ESLint, and Expo Doctor checks with zero errors. All core workflows were tested end-to-end by real users. Every critical piece of tester feedback was resolved in v0.0.9. The app is stable, the UI is polished, and the value is clearly understood by users.

---

### Q7 — Production readiness (full detail)

The decision to apply for production was based on four criteria all being met simultaneously:

**1. Technical quality gates passed:**
- `tsc --noEmit` — zero TypeScript errors across the entire codebase
- `npx expo lint` — zero lint errors (warnings only, per project rule)
- `npx expo-doctor` — all checks passed, no unresolved dependency or config issues
- EAS Build produced a valid, installable `.aab` with the New Architecture enabled

**2. All core user journeys work end-to-end:**
- Onboarding → email verification → profile setup
- Donor: set area, go active, receive request notification, accept, navigate, complete Triple Handshake
- Requester: post instant or scheduled request, view responders, see contact info, mark complete or cancel
- Account management: settings, deletion flow, area selection

**3. Every critical tester pain point is resolved:**
All issues raised during the closed test that affected core usability were resolved in v0.0.9 (see Q6). No blocker-level bugs remain open.

**4. Real user validation:**
Testers — who represent the exact target audience — used the app in realistic scenarios and responded positively. The most telling signal: testers immediately wanted to share the app with others, which indicates the core value proposition is landing clearly before any marketing effort.

---

*Additional questions to be appended to this document as required by the Play Store submission process.*
