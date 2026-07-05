import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AIVerdict from "./components/AIVerdict";

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [poRecords, setPoRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressLogs, setProgressLogs] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Sync POs and Invoices on load in case backend already has data
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(health => {
        if (health.pos_loaded > 0) {
          fetch(`${API_BASE}/pos`)
            .then(res => res.json())
            .then(data => setPoRecords(data));
        }
        if (health.invoices_processed > 0) {
          fetch(`${API_BASE}/invoices`)
            .then(res => res.json())
            .then(data => setInvoices(data));
        }
      })
      .catch(err => console.warn("Failed to fetch initial health states:", err));
  }, []);

  // Upload Purchase Order (CSV/Excel)
  const handleUploadPO = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/upload-po`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload PO sheet");
      }

      const result = await response.json();
      setPoRecords(result.data);
      alert(`PO Sheet uploaded successfully. Loaded ${result.data.length} POs.`);
    } catch (error) {
      console.error(error);
      alert(`PO Upload Error: ${error.message}`);
    }
  };

  // Upload Invoices (PDF/Image) with NDJSON Streaming
  const handleUploadInvoices = async (files) => {
    setUploading(true);
    
    // Initialize progress logs for each file in the batch
    const initialLogs = files.map(file => ({
      filename: file.name,
      status: "processing",
      step: "Uploading...",
      progress: 0
    }));
    setProgressLogs(initialLogs);

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_BASE}/upload-invoices`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invoice upload failed");
      }

      // Read response body as an NDJSON stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Save the last incomplete chunk back to the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const frame = JSON.parse(line);
              
              // Update individual file log state in the sidebar
              setProgressLogs(prev => {
                const copy = [...prev];
                if (frame.index !== undefined && copy[frame.index]) {
                  copy[frame.index] = {
                    filename: frame.filename,
                    status: frame.status,
                    step: frame.step,
                    progress: frame.progress
                  };
                }
                return copy;
              });

              // If a file finishes processing, append its data to the ledger grid in real-time
              if (frame.status === "completed" && frame.data) {
                setInvoices(prev => {
                  // Prevent duplicates if already uploaded
                  if (prev.some(inv => inv.id === frame.data.id)) {
                    return prev;
                  }
                  return [frame.data, ...prev];
                });
              }
            } catch (err) {
              console.error("Error parsing NDJSON stream frame:", err);
            }
          }
        }
      }

      setUploading(false);
    } catch (error) {
      console.error(error);
      alert(`Invoice Audit Error: ${error.message}`);
      setUploading(false);
    }
  };

  // Reset database state
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all PO databases and invoice ledger records?")) {
      return;
    }
    try {
      await fetch(`${API_BASE}/reset`, { method: "POST" });
      setPoRecords([]);
      setInvoices([]);
      setProgressLogs([]);
      setSelectedInvoice(null);
    } catch (error) {
      console.error(error);
      alert("Failed to reset database");
    }
  };

  const poLoaded = poRecords.length > 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080a]">
      {/* Sidebar - Lock state handles invoice upload */}
      <Sidebar 
        poLoaded={poLoaded}
        poCount={poRecords.length}
        onUploadPO={handleUploadPO}
        onUploadInvoices={handleUploadInvoices}
        uploading={uploading}
        progressLogs={progressLogs}
        onReset={handleReset}
      />

      {/* Main Workspace Dashboard */}
      <Dashboard 
        poRecords={poRecords}
        invoices={invoices}
        onViewVerdict={(invoice) => setSelectedInvoice(invoice)}
      />

      {/* Audit Detail Modal overlay */}
      {selectedInvoice && (
        <AIVerdict 
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
