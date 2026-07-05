import React, { useState } from "react";
import { 
  DollarSign, 
  FileCheck, 
  AlertCircle, 
  TrendingUp,
  Database,
  Search,
  Eye,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";

export default function Dashboard({ 
  poRecords, 
  invoices, 
  onViewVerdict 
}) {
  const [activeTab, setActiveTab] = useState("ledger");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate KPI values
  const totalPoBudget = poRecords.reduce((sum, po) => sum + (po.approved_amount || 0), 0);
  
  const totalInvoices = invoices.length;
  
  const matchedCount = invoices.filter(inv => inv.verdict?.status === "APPROVED").length;
  const flaggedCount = invoices.filter(inv => inv.verdict?.status === "FLAGGED" || inv.verdict?.status === "SYSTEM AUDIT FLAGGED").length;
  const rejectedCount = invoices.filter(inv => inv.verdict?.status === "REJECTED").length;

  // Average variance for linked POs (exclude unlinked/rejected which have default 0 or 100%)
  const linkedInvoices = invoices.filter(inv => inv.verdict?.matched_po !== null);
  const avgVariance = linkedInvoices.length > 0
    ? linkedInvoices.reduce((sum, inv) => sum + (inv.verdict?.variance_percentage || 0), 0) / linkedInvoices.length
    : 0;

  // Filter records based on search
  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.verdict?.matched_po?.po_number || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPos = poRecords.filter(po => 
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#08090d] p-6 space-y-6 text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">
            AP Operations Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated invoice audits and Purchase Order reconciliation.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={activeTab === "ledger" ? "Search invoices, vendors..." : "Search POs, vendors..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: PO Approved Value */}
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Approved PO Value</p>
            <h3 className="text-lg font-bold font-display text-white">
              ${totalPoBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[9px] text-slate-500">Across {poRecords.length} records</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center text-slate-400">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Processed Invoices */}
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Audited Invoices</p>
            <h3 className="text-lg font-bold font-display text-white">{totalInvoices}</h3>
            <p className="text-[9px] text-slate-500">{rejectedCount} rejected unlinked</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center text-indigo-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Exact Matches */}
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Exact Matches</p>
            <h3 className="text-lg font-bold font-display text-emerald-400">{matchedCount}</h3>
            <p className="text-[9px] text-emerald-500/80">Within 1% threshold</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Flagged Discrepancies */}
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Flagged Alerts</p>
            <h3 className="text-lg font-bold font-display text-amber-400">{flaggedCount}</h3>
            <p className="text-[9px] text-amber-500/80">Variance or item mismatch</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-950/20 border border-amber-900/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Average Variance */}
        <div className="glass-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Avg Variance</p>
            <h3 className={`text-lg font-bold font-display ${avgVariance > 1.0 ? 'text-amber-400' : avgVariance < 0 ? 'text-blue-400' : 'text-slate-200'}`}>
              {avgVariance > 0 ? `+${avgVariance.toFixed(1)}%` : `${avgVariance.toFixed(1)}%`}
            </h3>
            <p className="text-[9px] text-slate-500">Across linked orders</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl border border-slate-800/60 overflow-hidden">
        
        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("ledger"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "ledger" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              Audited Invoice Ledger
            </button>
            <button
              onClick={() => { setActiveTab("po"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "po" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              PO Reference List
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              Showing {activeTab === "ledger" ? filteredInvoices.length : filteredPos.length} records
            </span>
          </div>
        </div>

        {/* Tab Panel Content */}
        <div className="flex-1 overflow-x-auto min-h-[350px]">
          
          {activeTab === "ledger" ? (
            /* TAB 1: INVOICE LEDGER TABLE */
            filteredInvoices.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/10 text-slate-400 font-medium">
                    <th className="py-3 px-6">Invoice #</th>
                    <th className="py-3 px-6">Vendor Name</th>
                    <th className="py-3 px-6">Total Amount</th>
                    <th className="py-3 px-6">Order Date</th>
                    <th className="py-3 px-6">PO Reference</th>
                    <th className="py-3 px-6">Variance</th>
                    <th className="py-3 px-6">Verification Verdict</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredInvoices.map((inv) => {
                    const status = inv.verdict?.status;
                    const color = inv.verdict?.color_code;
                    const po_num = inv.verdict?.matched_po?.po_number;
                    const variance = inv.verdict?.variance_percentage;
                    
                    return (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-slate-900/20 transition-colors group"
                      >
                        <td className="py-3 px-6 font-semibold text-slate-200">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-6 text-slate-300 font-medium">
                          {inv.vendor_name}
                        </td>
                        <td className="py-3 px-6 font-mono text-slate-100">
                          ${inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-6 text-slate-400">
                          {inv.invoice_date || "—"}
                        </td>
                        <td className="py-3 px-6">
                          {po_num ? (
                            <span className="font-mono text-indigo-400 font-semibold bg-indigo-950/20 border border-indigo-900/30 px-2 py-0.5 rounded">
                              PO-{po_num}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">Unlinked</span>
                          )}
                        </td>
                        <td className="py-3 px-6 font-mono">
                          {po_num ? (
                            <span className={`font-semibold ${
                              variance > 1.0 
                                ? "text-rose-400" 
                                : variance < 0 
                                  ? "text-blue-400" 
                                  : "text-emerald-400"
                            }`}>
                              {variance > 0 ? `+${variance}%` : `${variance}%`}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          {status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-900 px-2.5 py-0.5 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                              Approved
                            </span>
                          )}
                          {(status === "FLAGGED" || status === "SYSTEM AUDIT FLAGGED") && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800 px-2.5 py-0.5 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                              {status === "SYSTEM AUDIT FLAGGED" ? "PO Mismatch" : "Flagged Discrepancy"}
                            </span>
                          )}
                          {status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-900 px-2.5 py-0.5 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-md shadow-rose-400/50" />
                              Rejected Audit
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => onViewVerdict(inv)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all font-semibold"
                          >
                            <Eye className="h-3 w-3" /> Verdict
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-950 flex items-center justify-center text-slate-600 mb-3">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h4 className="text-slate-300 font-bold">No Invoices Uploaded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                  Unlock the sidebar by uploading a Purchase Order sheet, then drag and drop invoices to begin.
                </p>
              </div>
            )
          ) : (
            /* TAB 2: PO REFERENCE DATABASE */
            filteredPos.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/10 text-slate-400 font-medium">
                    <th className="py-3 px-6">PO Number</th>
                    <th className="py-3 px-6">Vendor Name</th>
                    <th className="py-3 px-6">Approved Amount</th>
                    <th className="py-3 px-6">Currency</th>
                    <th className="py-3 px-6">Items Approved</th>
                    <th className="py-3 px-6">Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredPos.map((po, index) => (
                    <tr key={index} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 px-6 font-semibold font-mono text-indigo-400">
                        PO-{po.po_number}
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-300">
                        {po.vendor_name}
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-200">
                        ${po.approved_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-6 text-slate-400 font-mono">
                        {po.currency}
                      </td>
                      <td className="py-3 px-6 text-slate-300 truncate max-w-xs" title={po.items_ordered}>
                        {po.items_ordered}
                      </td>
                      <td className="py-3 px-6 text-slate-400">
                        {po.order_date || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-900/40 flex items-center justify-center text-slate-600 mb-3">
                  <Database className="h-6 w-6" />
                </div>
                <h4 className="text-slate-300 font-bold">No Purchase Orders Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                  Upload a PO spreadsheet file (CSV, XLS, XLSX) using the sidebar file browser to populate references.
                </p>
              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}
