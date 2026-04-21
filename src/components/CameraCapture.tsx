import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Please allow camera access to take photos of invoices.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (capturedImage) {
      // Convert base64 to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-invoice-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        });
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white bg-slate-900/80">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
              <button 
                onClick={onCancel}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-900" />
              </button>
              <div className="w-12 h-12" /> {/* Spacer */}
            </div>
          </>
        ) : (
          <>
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <button 
                onClick={retake}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all shadow-xl"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button 
                onClick={confirmCapture}
                className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-dark transition-all shadow-xl"
              >
                <CheckCircle className="w-4 h-4" /> Use Photo
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        Place the invoice on a flat surface in good lighting
      </p>
    </div>
  );
};

export default CameraCapture;
