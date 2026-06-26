# RoutePilot 🚀

RoutePilot is a production-quality, Android-first Progressive Web App (PWA) designed for delivery riders (specifically for Flipkart/Ekart jobsheets). It automates the process of reading shipment details from screenshots, extracting key information, and optimizing the delivery route.

## Features

- **OCR Engine**: Powered by `tesseract.js` to read shipment screenshots (supports long scrolling screenshots).
- **Extraction Engine**: Automatically identifies customer name, full address, landmark, and priority status.
- **Assam Smart Address Engine**: Recognizes and normalizes key localities in Assam (Doboka, Nagaon, Hojai, etc.) using fuzzy matching.
- **Route Optimization**: Orders deliveries by Priority status first, then clusters by Area/Locality to minimize travel time.
- **Google Maps Integration**: One-tap navigation for individual stops or the entire optimized route.
- **Local Intelligence**: Automatically learns frequent locations and stores them locally in the browser.
- **Privacy First**: No login, no cloud database, and no API keys required. Everything stays on your device.

## Technology Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Tesseract.js
- **Storage**: Browser LocalStorage
- **Maps**: Google Maps URL Launcher

## Getting Started

1. **Upload**: Take screenshots of your jobsheet and upload them in the 'Capture' tab.
2. **Review**: Check the extracted details in the 'Route' tab.
3. **Optimize**: Tap 'Optimize' to sort your deliveries efficiently.
4. **Navigate**: Use the 'Start Entire Route' button to launch Google Maps with all stops.

Built for riders, by engineering.
