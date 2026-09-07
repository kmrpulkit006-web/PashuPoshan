import { useState, useRef } from 'react';
import { FeedSample, FeedCategory, VisualAnalysisResult, OfflineMoldHeuristicResult } from '../lib/types';
import {
  PRESET_FEED_SCENARIOS,
  analyzeCanvasImageData,
  createFeedSampleFromVisualAnalysis,
  sampleStripModePatches,
  detectColorClusterMoldHeuristic,
} from '../lib/feedAnalysisEngine';
import {
  saveLocalScan,
  queuePendingOfflineScan,
  createOfflinePlaceholderSample,
} from '../lib/storage';
import { compressImage } from '../lib/imageStorage';
import { classifyFeedTypeOnDevice } from '../lib/onDeviceVision';
import confetti from 'canvas-confetti';

let isFirstOnDeviceClassification = true;

export function resetFirstOnDeviceClassification() {
  isFirstOnDeviceClassification = true;
}

export function getIsFirstOnDeviceClassification(): boolean {
  return isFirstOnDeviceClassification;
}

export function getOnDeviceClassificationMessage(): string {
  if (isFirstOnDeviceClassification) {
    isFirstOnDeviceClassification = false;
    return 'Loading AI assistant (one-time download, ~15-20 seconds on slow networks)...';
  }
  return 'Checking image on device (डिवाइस पर छवि जांच हो रही है)...';
}

interface UseScanEngineProps {
  onScanComplete: (sample: FeedSample) => void;
}

export function useScanEngine({ onScanComplete }: UseScanEngineProps) {
  const [scanMode, setScanMode] = useState<'vision' | 'strip'>('vision');
  const [category, setCategory] = useState<FeedCategory>('silage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stripColor, setStripColor] = useState<'yellow' | 'magenta' | 'green'>('yellow');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrVerifiedData, setQrVerifiedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (scenario: FeedSample) => {
    setIsProcessing(true);
    setProcessingMessage('Loading reference lab control dataset...');
    setTimeout(() => {
      setIsProcessing(false);
      saveLocalScan(scenario);
      if (scenario.overallGrade.includes('Tier A')) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      onScanComplete(scenario);
    }, 800);
  };

  /**
   * Process a captured image:
   * 1. If in vision mode: POST to /api/analyze-visual (Google Gemini 1.5 Flash Vision triage).
   *    If offline or network fails, queue to local offline storage queue with pending status.
   * 2. If in strip mode: Calibrated colorimetric strip reading using reference card & CIEDE2000.
   */
  const processLiveImage = async (imgUri: string) => {
    setIsProcessing(true);

    if (scanMode === 'vision') {
      setProcessingMessage(getOnDeviceClassificationMessage());

      // Client-Side Feed-Type Sanity Check (MobileNetV1, ~1.8MB weights)
      // Checks for unmistakable non-feed objects (laptop, vehicle, pet, etc.) with >60% confidence
      // Organic feed matter or ambiguous results proceed silently to Gemini without prompting
      try {
        const sanityCheck = await classifyFeedTypeOnDevice(imgUri);
        if (sanityCheck.shouldWarnUser && sanityCheck.warningMessage) {
          const proceed =
            typeof window !== 'undefined' && window.confirm
              ? window.confirm(sanityCheck.warningMessage)
              : true;
          if (!proceed) {
            setIsProcessing(false);
            return;
          }
        }
      } catch (e) {
        // Safe fail-open: any error in on-device vision must never block scan
        console.warn('On-device feed check bypassed due to error:', e);
      }

      setProcessingMessage('Analyzing image with AI (AI द्वारा छवि का विश्लेषण हो रहा है)...');

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('Device is currently offline');
        }

        const res = await fetch('/api/analyze-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imgUri,
            category,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'AI visual triage service unavailable' }));
          throw new Error(errData.error || `Server responded with ${res.status}`);
        }

        const visualResult: VisualAnalysisResult = await res.json();
        const sample = createFeedSampleFromVisualAnalysis(category, visualResult, imgUri);
        saveLocalScan(sample);

        if (sample.overallGrade.includes('Tier A')) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        }
        setIsProcessing(false);
        onScanComplete(sample);
      } catch (err: any) {
        console.warn('Online AI analysis unavailable or offline. Falling back to offline sync queue:', err);

        // Run lightweight client-side relative color-cluster heuristic on actual feed photo
        let offlineHeuristic: OfflineMoldHeuristicResult | undefined;
        try {
          if (typeof document !== 'undefined') {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = 160;
            offCanvas.height = 160;
            const ctx = offCanvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Image decode failed'));
                img.src = imgUri;
              });
              ctx.drawImage(img, 0, 0, 160, 160);
              const imgData = ctx.getImageData(0, 0, 160, 160);
              offlineHeuristic = detectColorClusterMoldHeuristic(imgData);
            }
          }
        } catch (heuristicErr) {
          console.warn('Offline color-cluster heuristic analysis bypassed or failed open:', heuristicErr);
        }

        // Save photo to pending sync queue
        const pending = queuePendingOfflineScan({
          category,
          photoBase64: imgUri,
          timestamp: new Date().toISOString(),
          scanMode: 'vision',
        });

        const fallbackSample = createOfflinePlaceholderSample(category, imgUri, pending.id, offlineHeuristic);
        saveLocalScan(fallbackSample);

        setIsProcessing(false);
        alert(
          'Notice (सूचना): You are currently offline or the AI server is unavailable. Your scan photo has been securely saved to the Offline Sync Queue and will analyze automatically when online.'
        );
        onScanComplete(fallbackSample);
      }
    } else {
      // Strip Mode: Calibrated Colorimetric Reading
      setProcessingMessage('Calibrating strip with reference card (CIEDE2000)...');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUri;

      img.onerror = () => {
        setIsProcessing(false);
        alert('Failed to decode image data. Please ensure the file is not corrupt.');
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          alert('Canvas context unavailable on this device.');
          return;
        }

        ctx.drawImage(img, 0, 0, 120, 120);
        const imageData = ctx.getImageData(0, 0, 120, 120);

        // Sample dual patches: left box = reference card, right box = test strip
        const { referenceCardPatch, testStripPatch } = sampleStripModePatches(imageData, 30, 30);

        // Independent lighting guard for reference card
        if (!referenceCardPatch.isLightingValid) {
          setIsProcessing(false);
          const errorMsg =
            referenceCardPatch.guardWarning === 'too_dark'
              ? 'Lighting Too Dark on Reference Card (संदर्भ कार्ड पर कम रोशनी): Reference card area is underexposed or in deep shadow. Please position the white reference card in clear, indirect light and retake photo.'
              : 'Glare/Overexposed on Reference Card (संदर्भ कार्ड पर अत्यधिक चमक): Reference card area is washed out or reflecting direct glare. Avoid harsh reflections on the card and retake photo.';
          alert(errorMsg);
          return;
        }

        // Independent lighting guard for test strip
        if (!testStripPatch.isLightingValid) {
          setIsProcessing(false);
          const errorMsg =
            testStripPatch.guardWarning === 'too_dark'
              ? 'Lighting Too Dark on Test Strip (स्ट्रिप पर कम रोशनी): Test strip patch is underexposed or in deep shadow. Please center the test strip in clear, indirect light and retake photo.'
              : 'Glare/Overexposed on Test Strip (स्ट्रिप पर अत्यधिक चमक): Test strip patch is washed out or reflective. Avoid direct flash or harsh reflection and retake photo.';
          alert(errorMsg);
          return;
        }

        setTimeout(() => {
          setIsProcessing(false);
          const analyzed = analyzeCanvasImageData(
            category,
            imageData,
            true,
            testStripPatch.rgb,
            referenceCardPatch.rgb,
            stripColor
          );
          analyzed.imageUrl = imgUri;
          saveLocalScan(analyzed);

          if (analyzed.overallGrade.includes('Tier A')) {
            confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
          }
          onScanComplete(analyzed);
        }, 1200);
      };
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawUri = reader.result as string;
      try {
        const compressedUri = await compressImage(rawUri, 500, 375, 0.7);
        setSelectedImage(compressedUri);
        processLiveImage(compressedUri);
      } catch (err) {
        console.error('Image compression failure:', err);
        setSelectedImage(rawUri);
        processLiveImage(rawUri);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Unable to read selected file. Please select a valid JPEG or PNG file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateQrScan = () => {
    setShowQrScanner(true);
    setTimeout(() => {
      setQrVerifiedData(
        'DEMO SIMULATION: Sample BIS License Verified (BIS/CM/L-8819202). In production, this queries the official BIS Manakonline database.'
      );
    }, 1200);
  };

  const closeQrScanner = () => {
    setShowQrScanner(false);
    setQrVerifiedData(null);
  };

  return {
    scanMode,
    setScanMode,
    category,
    setCategory,
    isProcessing,
    processingMessage,
    selectedImage,
    stripColor,
    setStripColor,
    showQrScanner,
    qrVerifiedData,
    fileInputRef,
    handleSelectPreset,
    handleFileUpload,
    handleSimulateQrScan,
    closeQrScanner,
  };
}

