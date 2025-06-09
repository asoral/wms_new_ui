
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Zap, ZapOff } from "lucide-react";

interface CameraScannerProps {
  onBarcodeDetected: (code: string) => void;
  isActive: boolean;
  onClose: () => void;
}

const CameraScanner = ({ onBarcodeDetected, isActive, onClose }: CameraScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Check if flash is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setFlashSupported(!!capabilities.torch);

      setIsScanning(true);
      
      // Start scanning loop
      setTimeout(() => {
        scanForBarcode();
      }, 1000);

    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!stream || !flashSupported) return;

    try {
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };

  const scanForBarcode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) {
      setTimeout(scanForBarcode, 100);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate barcode detection (in a real implementation, you'd use a barcode library)
    // For now, we'll simulate finding a barcode after a delay
    simulateBarcodeDetection();

    // Continue scanning
    setTimeout(scanForBarcode, 100);
  };

  const simulateBarcodeDetection = () => {
    // Simulate barcode detection with a random chance
    if (Math.random() < 0.002) { // 0.2% chance per frame
      const simulatedBarcode = `WH-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      handleBarcodeFound(simulatedBarcode);
    }
  };

  const handleBarcodeFound = (code: string) => {
    console.log('Barcode detected:', code);
    onBarcodeDetected(code);
    stopCamera();
    onClose();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scan Barcode
          </h3>
          <div className="flex items-center space-x-2">
            {flashSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFlash}
                className="flex items-center space-x-1"
              >
                {flashOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{flashOn ? 'Flash Off' : 'Flash On'}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full">
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
              
              {/* Scanning rectangle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-32 border-2 border-green-400 rounded-lg bg-transparent">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm text-center">
                  Position barcode within the frame
                </div>
              </div>
            </div>
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Point your camera at a barcode to scan automatically
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraScanner;
