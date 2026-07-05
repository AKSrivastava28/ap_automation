import React from "react";
import { 
  X, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function AIVerdict({ invoice, onClose }) {
  if (!invoice) return null;

  const verdict = invoice.verdict;
  const status = verdict?.status;
  const color = verdict?.color_code;
  const matchedPo = verdict?.matched_po;
  const reasons = verdict?.reasons || [];
  const explanation = verdict?.explanation || "";
  const parser = invoice.parser_used || "Native Text (pypdf)";

  // Color mapping utilities
  const statusConfig = {
    APPROVED: {
      border: "border-emerald-500/30",
      glow: "shadow-emerald-950/20 border-emerald-900/40",
      badge: "bg-emerald-950 text-emerald-400 border border-emerald-800",
      bg: "bg-emerald-950/25",
      text: "text-emerald-400",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />
    },
    FLAGGED: {
      border: "border-amber-500/30",
      glow: "shadow-amber-950/20 border-amber-900/40",
      badge: "bg-amber-950 text-amber-400 border border-amber-800",
      bg: "bg-amber-950/25",
      text: "text-amber-400",
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />
    },
    "SYSTEM AUDIT FLAGGED": {
      border: "border-amber-500/30",
      glow: "shadow-amber-950/20 border-amber-900/40",
      badge: "bg-amber-950 text-amber-400 border border-amber-800",
      bg: "bg-amber-950/25",
      text: "text-amber-400",
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />
    },
    REJECTED: {
      border: "border-rose-500/30",
      glow: "shadow-rose-950/20 border-rose-900/40",
      badge: "bg-rose-950 text-rose-400 border border-rose-800",
      bg: "bg-rose-950/25",
      text: "text-rose-400",
      icon: <XCircle className="h-6 w-6 text-rose-400" />
    }
  }[status] || {
    border: "border-slate-800",
    glow: "shadow-slate-950/20 border-slate-800",
    badge: "bg-slate-900 text-slate-400 border border-slate-800",
    bg: "bg-slate-900/20",
    text: "text-slate-400",
    icon: <HelpCircle className="h-6 w-6 text-slate-400" />
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-300 font-sans">
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl glass-panel flex flex-col shadow-2xl ${statusConfig.border}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-900/50">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Audit Verification Verdict</h2>
              <p className="text-[10px] text-slate-400 font-medium">Invoice Audited: {invoice.filename}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Verdict Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-4 ${statusConfig.glow} ${statusConfig.bg}`}>
            <div className="mt-0.5">{statusConfig.icon}</div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${statusConfig.text}`}>
                  SYSTEM AUDIT {status}
                </h3>
                {matchedPo && (
                  <span className="text-[10px] font-mono font-semibold bg-indigo-950 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded">
                    Linked Variance: {verdict.variance_percentage > 0 ? `+${verdict.variance_percentage}%` : `${verdict.variance_percentage}%`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {explanation}
              </p>
              
              {reasons.length > 0 && (
                <div className="pt-2 border-t border-slate-800/40 mt-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Audit Warnings & Notes</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="text-[11px] text-slate-400">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Side-by-Side Comparison Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Parsed Invoice */}
            <div className="glass-card rounded-xl p-5 border border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                1. Extracted Invoice Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Invoice Number</p>
                  <p className="text-xs font-bold text-slate-200">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Invoice Date</p>
                  <p className="text-xs font-semibold text-slate-300">{invoice.invoice_date || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Vendor Name</p>
                  <p className="text-xs font-semibold text-slate-200">{invoice.vendor_name}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Extracted Total</p>
                  <p className="text-xs font-bold font-mono text-indigo-300">
                    ${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({invoice.currency})
                  </p>
                </div>
              </div>

              {/* Invoice Line Items */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Line Items Detail ({invoice.items.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {invoice.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-2 bg-slate-950/20 border border-slate-900 rounded-lg flex items-center justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-300 leading-snug">{item.item_name}</p>
                        <p className="text-slate-500 font-medium">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold font-mono text-slate-200">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 bg-slate-950/20 p-2 rounded border border-slate-900">
                <span className="font-bold uppercase">Parser Engine:</span>
                <span className="italic">{parser}</span>
              </div>
            </div>

            {/* Right Column: Matched PO */}
            <div className="glass-card rounded-xl p-5 border border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                2. Linked Purchase Order
              </h3>
              
              {matchedPo ? (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">PO Ref Number</p>
                      <p className="text-xs font-bold text-slate-200">PO-{matchedPo.po_number}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Order Date</p>
                      <p className="text-xs font-semibold text-slate-300">{matchedPo.order_date || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Vendor Approved</p>
                      <p className="text-xs font-semibold text-slate-200">{matchedPo.vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Approved Limit</p>
                      <p className="text-xs font-bold font-mono text-indigo-300">
                        ${matchedPo.approved_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({matchedPo.currency})
                      </p>
                    </div>
                  </div>

                  {/* PO Line Items list description */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved Purchase Items</p>
                    <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg text-xs leading-relaxed text-slate-300 font-medium">
                      {matchedPo.items_ordered}
                    </div>
                  </div>

                  {/* Summary Comparison bar */}
                  <div className="p-3 rounded-lg border border-slate-900 bg-slate-950/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Approved Amount:</span>
                      <span className="font-mono text-slate-200 font-bold">${matchedPo.approved_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Invoice Amount:</span>
                      <span className="font-mono text-slate-200 font-bold">${invoice.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">Variance Difference:</span>
                      <span className={`font-mono font-bold flex items-center gap-1 ${
                        verdict.variance_percentage > 1.0 ? 'text-rose-400' : verdict.variance_percentage < 0 ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        <ArrowRight className="h-3 w-3" />
                        {verdict.variance_percentage > 0 ? `+${verdict.variance_percentage}%` : `${verdict.variance_percentage}%`}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-2 bg-rose-950/10 border border-rose-950/20 rounded-xl">
                  <XCircle className="h-8 w-8 text-rose-500" />
                  <p className="text-xs font-bold text-slate-300">Unlinked Transaction</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal">
                    This invoice does not map to any active Purchase Order in the database.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-900 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Close View
          </button>
          {status === "APPROVED" && (
            <button
              onClick={() => { alert(`Invoice ${invoice.invoice_number} approved for payout.`); onClose(); }}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              Export to ERP / Pay
            </button>
          )}
          {status === "FLAGGED" && (
            <button
              onClick={() => { alert(`Discrepancy report sent to vendor ${invoice.vendor_name}.`); onClose(); }}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              Raise Vendor Dispute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
