# RoutePilot Testing Guide 🧪

This document outlines the procedures for verifying RoutePilot's functionality using real-world delivery jobsheets.

## Automated Verification

We have implemented an E2E test suite using Playwright. To run the tests:

```bash
npm install
npx playwright install chromium
npm run build
# Start the app
npm run preview &
# Run tests
npx playwright test
```

The automated tests verify:
- Initial load and UI responsiveness.
- Navigation between Scan, Route, and Settings.
- Mock OCR processing and shipment list rendering.
- Statistics calculation.

## Manual Verification (Rider Workflow)

To verify with real Flipkart/Ekart screenshots:

1. **Scan Phase**:
   - Navigate to the **Scan** tab.
   - Upload a tall/scrolling screenshot of a jobsheet.
   - Verify that the "Scanning..." progress bar appears and completes within 20 seconds.
   - Confirm that the number of detected shipments matches the number of customer cards in the screenshot.

2. **Route Phase**:
   - Verify that each card displays the **Customer Name**, **Area**, and **Phone Number** (if visible).
   - Check if **Express** or **Priority** shipments have a red "PRIORITY" badge.
   - Tap **Optimize** and verify that priority shipments move to the top of the list.
   - Drag and drop a card to manually reorder and verify the sequence persists.

3. **Navigation Phase**:
   - Tap **Navigate** on any card to launch Google Maps for that specific stop.
   - Tap **Start Remaining Route** at the bottom to launch a multi-stop Google Maps route.

4. **Settings Phase**:
   - Go to the **Config** tab and verify the "Address Engine v2" shows known Assam localities.
   - Add a custom locality and verify it correctly labels future scans.

## Troubleshooting

- **OCR Accuracy**: If names are missing, ensure the screenshot has high contrast and the text is not blurry.
- **PWA Installation**: On Android Chrome, tap the three dots and select "Install app" to test offline capabilities.
- **Maps Error**: Ensure the Google Maps app is installed on your Android device for the best experience.
