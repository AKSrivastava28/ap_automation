import React, { useRef, useState } from "react";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Lock, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  RefreshCw,
  Info
} from "lucide-react";

export default function Sidebar({ 
  poLoaded, 
  poCount,
  onUploadPO, 
  onUploadInvoices,
  uploading,
  progressLogs,
  onReset
}) {
  const [poDragActive, setPoDragActive] = useState(false);
  const [invDragActive, setInvDragActive] = useState(false);
  
  const poInputRef = useRef(null);
  const invInputRef = useRef(null);

  // Drag handlers for PO
  const handlePoDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setPoDragActive(true);
    } else if (e.type === "dragleave") {
      setPoDragActive(false);
    }
  };

  const handlePoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPoDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onUploadPO(file);
    }
  };

  // Drag handlers for Invoices
  const handleInvDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!poLoaded) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setInvDragActive(true);
    } else if (e.type === "dragleave") {
      setInvDragActive(false);
    }
  };

  const handleInvDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInvDragActive(false);
    
    if (!poLoaded) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadInvoices(Array.from(e.dataTransfer.files));
    }
  };

  const selectPoFile = () => poInputRef.current.click();
  const selectInvFiles = () => {
    if (poLoaded) invInputRef.current.click();
  };

  return (
    <aside className="w-80 glass-panel border-r border-slate-800 flex flex-col h-screen shrink-0 text-slate-100 font-sans">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-display font-bold text-white shadow-md shadow-indigo-600/30">
            Z
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ZAMP AP
            </h1>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">
              Automation Engine
            </p>
          </div>
        </div>
        
        {poLoaded && (
          <button 
            onClick={onReset}
            title="Reset Database"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Step 1: Purchase Order Sheet Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-slate-800 text-[10px] text-slate-300 flex items-center justify-center font-bold">1</span>
              PO Database Source
            </h2>
            {poLoaded && (
              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full font-medium">
                Active ({poCount} POs)
              </span>
            )}
          </div>

          <div
            onDragEnter={handlePoDrag}
            onDragOver={handlePoDrag}
            onDragLeave={handlePoDrag}
            onDrop={handlePoDrop}
            onClick={selectPoFile}
            className={`cursor-pointer rounded-xl border border-dashed p-5 transition-all duration-300 flex flex-col items-center justify-center text-center ${
              poDragActive 
                ? "border-indigo-500 bg-indigo-950/20" 
                : poLoaded 
                  ? "border-emerald-800/40 bg-slate-900/20 hover:bg-slate-900/40" 
                  : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700"
            }`}
          >
            <input
              ref={poInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files[0] && onUploadPO(e.target.files[0])}
              className="hidden"
            />
            {poLoaded ? (
              <>
                <div className="h-10 w-10 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-200">PO Dataset Loaded</p>
                <p className="text-[10px] text-slate-500 mt-1">Click or drag to update PO sheet</p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-center text-indigo-400 mb-2">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">Upload Approved POs</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports CSV, XLS, XLSX</p>
              </>
            )}
          </div>
        </div>

        {/* Step 2: Invoice Upload (Locked until PO uploaded) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-slate-800 text-[10px] text-slate-300 flex items-center justify-center font-bold">2</span>
              Bulk Invoices
            </h2>
            {!poLoaded && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded-full font-medium">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>

          <div
            onDragEnter={handleInvDrag}
            onDragOver={handleInvDrag}
            onDragLeave={handleInvDrag}
            onDrop={handleInvDrop}
            onClick={selectInvFiles}
            className={`relative rounded-xl border border-dashed p-6 transition-all duration-300 flex flex-col items-center justify-center text-center ${
              !poLoaded 
                ? "border-slate-800/40 bg-slate-950/20 cursor-not-allowed opacity-50"
                : invDragActive
                  ? "border-indigo-500 bg-indigo-950/20 cursor-pointer"
                  : uploading
                    ? "border-indigo-800/50 bg-slate-900/30 cursor-wait pulse-border"
                    : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 cursor-pointer"
            }`}
          >
            <input
              ref={invInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files.length > 0 && onUploadInvoices(Array.from(e.target.files))}
              className="hidden"
              disabled={!poLoaded}
            />

            {!poLoaded ? (
              <>
                <div className="h-10 w-10 rounded-lg bg-slate-950/80 flex items-center justify-center text-slate-600 mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Invoices locked</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[180px]">Upload a PO database sheet above first to unlock</p>
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-7 w-7 text-indigo-400 animate-spin mb-2" />
                <p className="text-xs font-semibold text-slate-300">Processing Stream...</p>
                <p className="text-[10px] text-slate-500 mt-1">Reading document coordinates...</p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-lg bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center text-indigo-400 mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">Drop Invoices Here</p>
                <p className="text-[10px] text-slate-500 mt-1">Click to browse. PDF, PNG, JPG</p>
              </>
            )}
          </div>
        </div>

        {/* Live Step Logging Status Panel */}
        {progressLogs.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info className="h-3 w-3" /> Live Operations Log
            </h3>
            
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {progressLogs.map((log, index) => (
                <div 
                  key={index} 
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900/80 text-[11px] space-y-1.5 transition-all duration-200 hover:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-300 truncate max-w-[150px]" title={log.filename}>
                      {log.filename}
                    </span>
                    {log.status === "completed" ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/50">Done</span>
                    ) : log.status === "failed" ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-900/50">Error</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-indigo-400">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Active
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-400 text-[10px] italic leading-tight">
                    {log.step}
                  </p>

                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        log.status === "completed" 
                          ? "bg-emerald-500" 
                          : log.status === "failed" 
                            ? "bg-rose-500" 
                            : "bg-indigo-500"
                      }`}
                      style={{ width: `${log.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
        <p className="text-[10px] text-slate-500">
          Powered by pypdf & paddleocr
        </p>
      </div>
    </aside>
  );
}
