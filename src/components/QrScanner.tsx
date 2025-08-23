"use client";

import { useEffect, useRef, useState } from 'react';
import { feedback } from '@/utils/haptic';

interface QrScannerProps {
  onScan: (result: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export default function QrScanner({ onScan, isActive, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stopScanner = () => {
    try {
      // Stop the ZXing reader safely
      if (readerRef.current) {
        if (typeof readerRef.current.reset === 'function') {
          readerRef.current.reset();
        } else if (typeof readerRef.current.stopStreaming === 'function') {
          readerRef.current.stopStreaming();
        } else if (typeof readerRef.current.stopAsyncDecode === 'function') {
          readerRef.current.stopAsyncDecode();
        }
        readerRef.current = null;
      }
    } catch (error) {
      console.warn('Error stopping ZXing reader:', error);
    }
    
    try {
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Error stopping track:', error);
          }
        });
        streamRef.current = null;
      }
    } catch (error) {
      console.warn('Error stopping stream:', error);
    }
    
    try {
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.warn('Error clearing video source:', error);
    }
    
    setIsScanning(false);
  };

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }

      // Dynamic import to avoid SSR issues
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      // Get camera access
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => resolve();
        });
        
        await videoRef.current.play();

        // Start decoding from video
        let hasScanned = false; // Prevent multiple scans
        try {
          await readerRef.current.decodeFromVideoDevice(
            undefined, // Let browser choose best device
            videoRef.current,
            (result: any, error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              if (result && !hasScanned) {
                hasScanned = true; // Mark as scanned to prevent multiple triggers
                const scannedText = result.getText();
                console.log('QR scanned:', scannedText); // Debug log
                
                // Trigger success haptic feedback
                feedback.success();
                
                onScan(scannedText);
                // Use timeout to ensure callback completes before stopping
                setTimeout(() => stopScanner(), 100);
              }
              // Ignore NotFoundException as it's expected when no QR code is found
              if (error && error.name !== 'NotFoundException') {
                console.error('Scanner decode error:', error);
              }
            }
          );
        } catch (decodeError) {
          console.error('Error starting decode:', decodeError);
          setError('Gagal memulai scanning. Coba lagi.');
          setIsScanning(false);
        }
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      let errorMessage = 'Gagal memulai scanner';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Akses kamera ditolak. Silakan izinkan akses kamera.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Kamera tidak ditemukan di perangkat ini.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsScanning(false);
      
      // Trigger error haptic feedback
      feedback.error();
    }
  };

  useEffect(() => {
    if (isMounted && isActive && !isScanning) {
      startScanner();
    } else if (!isActive && isScanning) {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, isMounted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isActive || !isMounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Scan QR Code</h3>
          <p className="text-gray-600 text-sm">Arahkan kamera ke QR code peserta</p>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-200 rounded-lg object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500 border-dashed rounded-lg"></div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              feedback.tap();
              onClose();
            }}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Tutup
          </button>
          {error && (
            <button
              onClick={() => {
                feedback.tap();
                setError('');
                startScanner();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}