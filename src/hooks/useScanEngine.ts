import { useState, useRef } from 'react';
import { FeedSample, FeedCategory } from '../lib/types';
import { PRESET_FEED_SCENARIOS, analyzeCanvasImageData } from '../lib/feedAnalysisEngine';
import { saveLocalScan } from '../lib/storage';
import { compressImage } from '../lib/imageStorage';
import confetti from 'canvas-confetti';

interface UseScanEngineProps {
  onScanComplete: (sample: FeedSample) => void;
}

export function useScanEngine({ onScanComplete }: UseScanEngineProps) {
  const [scanMode, setScanMode] = useState<'vision' | 'strip'>('vision');
  const [category, setCategory] = useState<FeedCategory>('silage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stripColor, setStripColor] = useState<'yellow' | 'magenta' | 'green'>('yellow');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrVerifiedData, setQrVerifiedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (scenario: FeedSample) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      saveLocalScan(scenario);
      if (scenario.overallGrade.includes('Tier A')) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      onScanComplete(scenario);
    }, 900);
  };

  const processLiveImageWithCanvas = (imgUri: string) => {
    setIsProcessing(true);

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

      let colorRgb = undefined;
      if (scanMode === 'strip') {
        if (stripColor === 'magenta') colorRgb = { r: 190, g: 30, b: 130 }; // Adulterated Urea
        else if (stripColor === 'green') colorRgb = { r: 40, g: 180, b: 160 }; // High pH
        else colorRgb = { r: 240, g: 210, b: 50 }; // Pure Yellow
      }

      setTimeout(() => {
        setIsProcessing(false);
        const analyzed = analyzeCanvasImageData(category, imageData, scanMode === 'strip', colorRgb);
        analyzed.imageUrl = imgUri;
        saveLocalScan(analyzed);

        if (analyzed.overallGrade.includes('Tier A')) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        }
        onScanComplete(analyzed);
      }, 1500);
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawUri = reader.result as string;
      try {
        const compressedUri = await compressImage(rawUri, 400, 300, 0.65);
        setSelectedImage(compressedUri);
        processLiveImageWithCanvas(compressedUri);
      } catch (err) {
        console.error('Image compression failure:', err);
        setSelectedImage(rawUri);
        processLiveImageWithCanvas(rawUri);
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
