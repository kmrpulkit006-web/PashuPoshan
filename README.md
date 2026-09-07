# PashuPoshan AI (पशु-पोषण AI)
### Smart AI-Enabled Rapid Feed and Silage Quality Testing System for Dairy Farmers

> **Smart India Hackathon (SIH 2026) — Problem Statement 26111**  
> **Ministry**: Ministry of Fisheries, Animal Husbandry & Dairying (DAHD)  
> **Theme**: Agriculture, FoodTech & Rural Development  
> **Platform**: Mobile-First Progressive Web Application (PWA / Android Ready)

---

## 🚀 Key Features

1. **AI Rapid Quality Scanner (`/scan`)**:
   - **On-Device Feed-Type Sanity Pre-Filter**: Client-side MobileNetV1 ($\alpha=0.25$, ~1.8MB model weights) pre-screens camera and uploaded images before network requests. Discards unmistakable non-feed items (laptops, vehicles, pets, screens) when confidence exceeds 60%, prompting farmers to retake or confirm and saving cellular bandwidth. Organic agricultural matter (corn, hay, straw, forage) and ambiguous frames proceed silently.
   - **Physical Examination & Spoilage Triage**: Cloud-assisted visual analysis (Google Gemini 1.5 Flash Vision) paired with optical luminance & dark-ratio heuristics for texture, granularity, and fungal mold (*Aspergillus / Penicillium*) screening.
   - **Colorimetric Test Strip Analysis**: Scans chemical paper strip reaction using CIEDE2000 color calibration with standardized reference white card (e.g. $p$-DMAB for urea adulteration detection and pH paper for silage leachate).
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

6. **Pashu Seva AI - Conversational Veterinary & Clinical Advisory (`/api/veterinary-expert`)**:
   - **NVIDIA Nemotron-3-Ultra-550B-A55B Reasoning Engine**: Ultra-large parameter reasoning model delivering real-time dairy pathology consults, emergency first-aid protocols (e.g. acute urea toxicity, mycotoxicosis, acidosis), and vernacular advisories in 5 Indic languages with speech synthesis.
   - **Deep Scorecard Clinical Review**: Produces clinical-grade rumen biome impact assessments and feed pathology risk matrices directly inside the Feed Scorecard.
   - **Precision Rumen Balancer Optimization**: Analyzes Total Mixed Rations (TMR) for Subacute Ruminal Acidosis (SARA) and Milk Urea Nitrogen (MUN) risks, suggesting economical local agro-byproduct substitutions.
   - **Pluggable Multi-Cloud Vision AI**: Seamlessly routes visual screening between Google Gemini 1.5 Flash Vision and NVIDIA NIM Vision (`meta/llama-3.2-11b-vision-instruct`).

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

## ⚙️ Environment Variables

PashuPoshan AI runs out-of-the-box in local development with zero mandatory configuration. All cloud dependencies implement automatic, graceful in-memory fallbacks when environment variables are absent or network-unreachable.

For production cloud deployment (e.g., Vercel Serverless Functions), configure the following environment variables:

| Variable | Scope / Endpoint | Purpose | Fallback Behavior When Unset or Unreachable |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | `/api/analyze-visual` | Google Gemini 1.5 Flash Vision API key for cloud-based multimodal visual analysis, feed texture recognition, and veterinary advisories. | If unset or invalid, the API endpoint returns an error. The client PWA automatically falls back to **100% offline triage** (on-device relative color-cluster mold heuristic + CIEDE2000 pH reading) and saves the scan photo to the IndexedDB offline queue for background sync upon network reconnection. |
| `NVIDIA_API_KEY` | `/api/veterinary-expert`<br/>`/api/analyze-visual` | NVIDIA NIM API key for ultra-large reasoning models (`nvidia/nemotron-3-ultra-550b-a55b`) and pluggable NIM Vision models (`meta/llama-3.2-11b-vision-instruct`). | **Deterministic ICAR-NDRI Fallback**: If unset or network-unreachable, `/api/veterinary-expert` automatically generates scientific rule-based veterinary advisories, TMR nutritional assessments, and emergency protocols without failing. `/api/analyze-visual` falls back to Gemini or client-side heuristics. |
| `NVIDIA_MODEL_ID` | `/api/veterinary-expert` | Custom model ID override for NVIDIA NIM reasoning (defaults to `nvidia/nemotron-3-ultra-550b-a55b`). | Defaults to `nvidia/nemotron-3-ultra-550b-a55b`. |
| `VISION_PROVIDER` | `/api/analyze-visual` | Select active cloud vision inference provider: `gemini` (default) or `nvidia`. | Defaults to `gemini`. If unset but `NVIDIA_API_KEY` is present and `GEMINI_API_KEY` is absent, automatically selects `nvidia`. |
| `KV_REST_API_URL`<br/>*(or `UPSTASH_REDIS_REST_URL`)* | `/api/alerts`<br/>`/api/analyze-visual`<br/>`/api/veterinary-expert` | REST endpoint URL for Upstash Redis / Vercel KV distributed database. Used for persistent crowd-sourced alerts and distributed per-IP rate limiting. | **In-Memory Fallback**: Reads and writes succeed per serverless instance using an in-memory cache/map, but state does not persist across serverless cold starts or synchronize across multiple users/distributed instances. |
| `KV_REST_API_TOKEN`<br/>*(or `UPSTASH_REDIS_REST_TOKEN`)* | `/api/alerts`<br/>`/api/analyze-visual`<br/>`/api/veterinary-expert` | Bearer authentication token for Upstash Redis / Vercel KV REST API. | Falls back to in-memory storage and in-memory rate limiting alongside the URL. |

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
- **On-Device Machine Learning (Edge AI)**: TensorFlow.js (`@tensorflow/tfjs` + `@tensorflow-models/mobilenet`)
  - **Pre-trained Model**: MobileNetV1 ($\alpha=0.25$, ~1.8MB weight files) loaded client-side for rapid feed-type pre-filtering.
  - **Lazy-Loaded Code-Split Bundles**: Total dynamically imported runtime is ~1.96 MB raw (~329.5 kB gzipped) across three split chunks: `mobilenet.esm` (33.3 kB), `graph_model` (651.3 kB), and `tfjs runtime` (1,281.3 kB).
  - **Instant Initial Load**: Initial PWA application bundle remains lightweight at 362 kB (108 kB gzipped).
  - **Zero-Network PWA Offline Caching**: `public/sw.js` implements a Cache-First runtime strategy for cross-origin TFJS model assets (`storage.googleapis.com/tfjs-models/` and `tfhub.dev`), ensuring on-device inference functions in remote cattle sheds even without internet access.
- **Icons**: Lucide React
- **Audio Guidance**: Web Speech Synthesis API (Multilingual: HI, EN, MR, GU, PA)
- **Animation**: Canvas-Confetti
- **Testing**: Vitest (Comprehensive safety, compliance, & ML threshold suites)
- **CI/CD**: GitHub Actions Automated Build & Test Pipeline (Clean `ubuntu-latest` verification)
