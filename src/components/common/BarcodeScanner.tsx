import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Zap, ZapOff } from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onBarcodeScanned: (code: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
  isModal?: boolean;
}

const BarcodeScanner = ({ 
  onBarcodeScanned, 
  onClose, 
  title = "Scan Barcode",
  description = "Point your camera at a barcode to scan automatically",
  isModal = true
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeCamera = async () => {
      if (mounted && !isCleaningUp) {
        await startCamera();
      }
    };
    
    initializeCamera();
    
    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  const startCamera = async () => {
    if (isCleaningUp) return;
    
    try {
      setError(null);
      console.log('Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (isCleaningUp) {
        // If cleanup started while we were getting camera access, stop immediately
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      
      if (videoRef.current && !isCleaningUp) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready before starting barcode scanning
        videoRef.current.onloadedmetadata = () => {
          if (!isCleaningUp && videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
            });
          }
        };
      }

      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setFlashSupported('torch' in capabilities);

      setIsScanning(true);
      
      if (!isCleaningUp) {
        codeReader.current = new BrowserMultiFormatReader();
        startBarcodeScanning();
      }

    } catch (err) {
      if (!isCleaningUp) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    }
  };

  const startBarcodeScanning = async () => {
    if (!codeReader.current || !videoRef.current || isCleaningUp) return;

    try {
      await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (isCleaningUp) return;
          
          if (result) {
            console.log('Barcode detected:', result.getText());
            handleBarcodeFound(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Barcode scanning error:', err);
          }
        }
      );
    } catch (err) {
      if (!isCleaningUp) {
        console.error('Error starting barcode scanning:', err);
      }
    }
  };

  const cleanup = () => {
    if (isCleaningUp) return;
    setIsCleaningUp(true);
    
    console.log('Starting comprehensive camera cleanup...');
    
    // Stop the barcode reader first
    if (codeReader.current) {
      try {
        codeReader.current.reset();
        console.log('Barcode reader reset successfully');
      } catch (err) {
        console.error('Error resetting barcode reader:', err);
      }
      codeReader.current = null;
    }

    // Stop all media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('Camera track stopped:', track.kind, track.readyState);
        } catch (err) {
          console.error('Error stopping track:', err);
        }
      });
      streamRef.current = null;
    }

    // Clear and stop video element
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset the video element
        console.log('Video element cleared and reset');
      } catch (err) {
        console.error('Error clearing video element:', err);
      }
    }

    setIsScanning(false);
    setFlashOn(false);
    console.log('Camera cleanup completed successfully');
  };

  const toggleFlash = async () => {
    if (!streamRef.current || !flashSupported || isCleaningUp) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };

  const handleBarcodeFound = (code: string) => {
    if (isCleaningUp) return;
    
    console.log('Barcode detected:', code);
    cleanup();
    onBarcodeScanned(code);
    onClose();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && barcode.trim()) {
      cleanup();
      onBarcodeScanned(barcode.trim());
      onClose();
    }
  };

  const ScannerContent = () => (
    <>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
          {flashSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFlash}
              className="flex items-center space-x-1"
            >
              {flashOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              <span className="hidden sm:inline">{flashOn ? 'Flash Off' : 'Flash On'}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-center p-8">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleManualInput} className="w-full">
              Enter Manually
            </Button>
          </div>
        ) : (
          <>
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
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
                  
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-32 border-2 border-green-400 rounded-lg bg-transparent">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                      
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm text-center">
                      Position barcode within the frame
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleManualInput} variant="outline" className="flex-1">
                Enter Manually
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              {description}
            </div>
          </>
        )}
      </CardContent>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <ScannerContent />
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <ScannerContent />
    </Card>
  );
};

export default BarcodeScanner;