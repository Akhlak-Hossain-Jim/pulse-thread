# Pulse Thread App Testing Scenarios

This document focuses on manual testing of the Pulse Thread application from an end-user perspective. Use this checklist to verify that all features work as intended.

## 1. Authentication Flow

### Sign Up
- [ ] **Valid Sign Up:** Enter valid email, password, and name. Verify successful account creation and redirection to the Home screen.
- [ ] **Existing Email:** Try to sign up with an email that is already registered. Verify appropriate error message.
- [ ] **Weak Password:** Enter a short password. Verify validation error.
- [ ] **Email Confirmation:** Check if the confirmation email is received (if enabled).

### Sign In
- [ ] **Valid Login:** Enter correct credentials. Verify successful login.
- [ ] **Invalid Credentials:** Enter incorrect password. Verify error message.
- [ ] **Forgot Password:** Click "Forgot Password", enter email, and verify reset link reception.

### Sign Out
- [ ] **Logout:** seamless logout from the Profile settings. Verify redirection to the Login screen.

## 2. Map & Location Services

### User Location
- [ ] **Permission Grant:** Verify app asks for location permissions on first launch.
- [ ] **Location Display:** Ensure the "blood droplet" icon represents the user's current location accurately.
- [ ] **Updates:** Move around (or simulate location change) and verify the icon updates.

### Map Interaction
- [ ] **Panning & Zooming:** Ensure the map moves smoothly.
- [ ] **Markers:** Verify blood request markers appear on the map.
- [ ] **Marker Details:** Tap a marker to see the request summary.

### Search
- [ ] **Place Search:** Use the search bar to find a specific hospital or area.
- [ ] **Selection:** Select a result and verify the map centers on that location.

## 3. Blood Request Management

### Creating a Request
- [ ] **Form Input:** Fill out the blood request form (blood type, hospital, urgency).
- [ ] **Location Selection:** verification that the location is correctly picked from the map or search.
- [ ] **Submission:** Submit the form and verify the new request appears on the map and list.

### Viewing Requests
- [ ] **List View:** Check the list of active requests.
- [ ] **Detail View:** Tap a request to see full details (patient name, hospital, contact info).

### Managing My Requests
- [ ] **Edit Request:** Modify details of an active request.
- [ ] **Delete/Close Request:** Mark a request as fulfilled or delete it. Verify it disappears from the public map.

## 4. Donation Flow

### Responding to a Request
- [ ] **Contact Donor:** Use the "Contact" or "I can donate" feature on a request.
- [ ] **Verification:** (If applicable) Verify the process of connecting the donor with the requester.

### Donor Status
- [ ] **Track Status:** Check if the donation status updates (e.g., Pending, Completed).

## 5. User Profile

### Profile Management
- [ ] **View Info:** Verify name, blood type, and contact info are displayed correctly.
- [ ] **Edit Profile:** Update phone number or bio. Verify changes persist.
- [ ] **Avatar:** Upload or change the profile picture.

## 6. Navigation & UI

### Tab Navigation
- [ ] **Switching Tabs:** Navigate between Home, Map, Requests, and Profile tabs. Ensure state is preserved where appropriate.

### Responsiveness
- [ ] **Screen Sizes:** Test on different device sizes (small phone vs. large phone).
- [ ] **Orientation:** (If supported) Test in landscape mode.

## 7. Edge Cases & Error Handling

- [ ] **No Internet:** Turn off data/WiFi. Verify app handles offline state gracefully (e.g., "No connection" message).
- [ ] **Slow Network:** Simulate slow network. Verify loading states (spinners/skeletons) are visible.
- [ ] **App Backgrounding:** Background the app and reopen it. Verify it resumes correctly.
