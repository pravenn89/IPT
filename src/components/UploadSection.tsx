import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle, Camera } from 'lucide-react';
import { InvoiceData } from '../types';
import { cn } from '../lib/utils';
import { DropzoneOptions } from 'react-dropzone';
import CameraCapture from './CameraCapture';

interface UploadSectionProps {
  onFilesSelected: (files: File[]) => void;
  processingInvoices: InvoiceData[];
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFilesSelected, processingInvoices }) => {
  const [showCamera, setShowCamera] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const dropzoneOptions: any = {
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleCameraCapture = (file: File) => {
    onFilesSelected([file]);
    setShowCamera(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      <div className="card p-6 flex flex-col items-center">
        {showCamera ? (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Camera Scan</h2>
              <button 
                onClick={() => setShowCamera(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                Back to Upload
              </button>
            </div>
            <CameraCapture 
              onCapture={handleCameraCapture} 
              onCancel={() => setShowCamera(false)} 
            />
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Invoice Submission</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Batch process PDF or JPG/PNG invoices for automated extraction</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full">
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-lg p-10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center h-64",
                  isDragActive ? "border-brand bg-blue-50/50 scale-[1.01]" : "border-blue-200 bg-blue-50/30 hover:border-brand hover:bg-blue-50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-blue-400 mb-3" />
                <p className="text-xs font-bold text-slate-700 mb-1">
                  {isDragActive ? "Drop the files here" : "Drag & Drop Files"}
                </p>
                <p className="text-[10px] text-slate-400 mb-4 px-4 overflow-hidden text-ellipsis whitespace-nowrap w-full">Supports PDF, JPG, PNG</p>
                <button className="bg-white border border-blue-200 px-4 py-1.5 rounded text-[10px] font-bold text-brand shadow-sm hover:bg-blue-50 transition-colors">
                  BROWSE FILES
                </button>
              </div>

              <div 
                onClick={() => setShowCamera(true)}
                className="border-2 border-slate-200 bg-slate-50/50 hover:border-brand hover:bg-blue-50 rounded-lg p-10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center h-64 group"
              >
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand mb-3 transition-colors" />
                <p className="text-xs font-bold text-slate-700 mb-1">Capture via Camera</p>
                <p className="text-[10px] text-slate-400 mb-4">Use your webcam or mobile camera</p>
                <button className="bg-white border border-slate-200 px-4 py-1.5 rounded text-[10px] font-bold text-slate-500 group-hover:text-brand group-hover:border-blue-200 shadow-sm transition-all">
                  OPEN CAMERA
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {processingInvoices.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <File className="w-3 h-3 text-brand" />
              Live Extraction Queue ({processingInvoices.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
            {processingInvoices.map((inv) => (
              <div key={inv.id} className="p-3 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center",
                    inv.status === 'completed' ? "bg-green-50" : 
                    inv.status === 'error' ? "bg-red-50" : "bg-blue-50"
                  )}>
                    {inv.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                     inv.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                     <Loader2 className="w-4 h-4 text-brand animate-spin" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{inv.fileName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{inv.status}</span>
                      {inv.status === 'processing' && <span className="w-1 h-1 bg-brand rounded-full animate-pulse" />}
                    </div>
                  </div>
                </div>

                {inv.status === 'completed' && (
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-900 font-mono">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                )}

                {inv.status === 'error' && (
                  <p className="text-[9px] text-red-500 font-bold italic max-w-[150px] text-right truncate">{inv.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
