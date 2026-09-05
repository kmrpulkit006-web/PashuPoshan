# PashuPoshan AI (पशु-पोषण AI)
### Smart AI-Enabled Rapid Feed and Silage Quality Testing System for Dairy Farmers

> **Smart India Hackathon (SIH 2026) — Problem Statement 26111**  
> **Ministry**: Ministry of Fisheries, Animal Husbandry & Dairying (DAHD)  
> **Theme**: Agriculture, FoodTech & Rural Development  
> **Platform**: Mobile-First Progressive Web Application (PWA / Android Ready)

---

## 🚀 Key Features

1. **AI Rapid Quality Scanner (`/scan`)**:
   - **Physical Examination**: Analyzes feed texture, particle granularity, and fungal mold (*Aspergillus / Penicillium*) using computer vision.
   - **Colorimetric Test Strip Analysis**: Scans chemical paper strip reaction (e.g. $p$-DMAB for urea adulteration detection and pH paper for silage leachate).
   - **1-Tap Evaluator Demos**: Preloaded with real-world scenarios (Grade A Maize Silage, 4.2% Spiked Urea Pellets, Waterlogged Sorghum Silage, Cottonseed Cake).

2. **Official Feed Quality Certificate (`/scorecard`)**:
   - Traffic-light quality tier: **Tier A (Premium)**, **Tier B (Sub-standard)**, **Tier C (Hazardous / Reject)**.
   - Strict benchmark comparison against **Bureau of Indian Standards (BIS IS:2052 Specification for Compounded Cattle Feed)**.
   - **Flieg's Silage Quality Score** (0-100 index based on pH and Dry Matter).
   - **Vernacular Audio Guidance**: Integrated Speech Synthesis reading advisories aloud in **Hindi, Marathi, Gujarati, Punjabi, and English**.
   - **WhatsApp & PDF Export**: Instant 1-tap report sharing for dispute resolution with feed merchants.

3. **Precision Ration Balancer - TMR (`/ration`)**:
   - Scientific feed formulation matching **ICAR & NDDB standards**.
   - Select cattle breed (*Gir, Sahiwal, HF Crossbred, Murrah Buffalo*), body weight, and daily milk yield.
   - Dynamically calculates daily portions: **Green Fodder (kg)**, **Dry Bhusa (kg)**, **Concentrate (kg)**, and **Mineral Mixture (g)**.
   - Alerts on protein deficits detected from tested feeds and suggests corrective oilseed cake doses.

4. **Silage Bunker Pit Health Monitor (`/silage`)**:
   - Tracks fermentation days, compaction density, and core internal temperature.
   - Early warning for aerobic heating and butyric spoilage before mycotoxins infect herd milk.

5. **Regional Feed Adulteration Radar (`/alerts`)**:
   - Taluka-level crowd-sourced bulletin for spiked feed batches and seasonal fodder deficits.
   - Farmer grievance filing and BIS QR code manufacturer verification.

---

## 💻 Quick Start & Run

Navigate to this folder on your desktop:

```bash
cd "C:\Users\PULKIT KUMAR\OneDrive\Desktop\pashuposhan-mobile"
npm install
npm run dev
```

The application will launch on `http://localhost:5174/` (or network IP for testing directly on your smartphone).

---

## 🔬 AI & Sensor Architecture: Prototype vs Production Roadmap

> **Important Evaluation Notice**: In this SIH prototype demonstration, feed safety screening is performed client-side using **HTML5 Canvas optical heuristics & colorimetric strip delta-E mapping**. This delivers immediate on-farm triage without requiring continuous cloud connectivity or specialized hardware.

| Capability | Current Prototype Phase | Production Deployment Phase |
| :--- | :--- | :--- |
| **Colorimetric Strip Analysis** | RGB color distance mapping for $p$-DMAB urea detection & pH | Calibrated reflectance spectrometry with standardized reference card |
| **Mold & Spoilage Detection** | Pixel luminance clustering & dark ratio heuristic | Edge-quantized MobileNetV3 / YOLOv8-Nano running in WebAssembly / TFLite |
| **Nutritional Profiling (CP, DM)** | BIS IS:2052 benchmark lookup & proxy estimation | Handheld Bluetooth Micro-NIR (Near-Infrared) sensor integration |
| **Data Synchronization** | Offline-first IndexedDB / LocalStorage queue | End-to-end sync with DAHD / NDDB National Dairy Portal API |

---

## 🛠️ Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Mobile-responsive UI shell)
- **Icons**: Lucide React
- **Audio Guidance**: Web Speech Synthesis API (Multilingual: HI, EN, MR, GU, PA)
- **Animation**: Canvas-Confetti
- **Testing**: Vitest (Comprehensive safety & compliance suites)
- **CI/CD**: GitHub Actions Automated Build & Test Pipeline
