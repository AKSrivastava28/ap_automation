import json
import asyncio
import logging
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io

from services.parser import parse_invoice_file
from services.matcher import match_invoice_to_po

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(title="Zamp AP Automation API", version="1.0.0")

# Enable CORS for the decoupled frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory databases for demo persistence
PO_DATABASE = []
PROCESSED_INVOICES = []

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "pos_loaded": len(PO_DATABASE), "invoices_processed": len(PROCESSED_INVOICES)}

@app.post("/api/upload-po")
async def upload_po(file: UploadFile = File(...)):
    """
    Ingests a CSV or Excel Purchase Order sheet.
    Expected columns: po_number, vendor_name, order_date, approved_amount, items_ordered, currency
    """
    global PO_DATABASE
    contents = await file.read()
    filename = file.filename
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
        
        # Clean and normalize column names
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
        
        # Validate required columns
        required_cols = ["po_number", "vendor_name", "order_date", "approved_amount", "items_ordered", "currency"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_cols)}. Found: {', '.join(df.columns)}"
            )
            
        # Parse records
        records = df.to_dict(orient="records")
        
        # Ensure correct data types
        for record in records:
            record["po_number"] = str(record["po_number"])
            record["vendor_name"] = str(record["vendor_name"])
            record["approved_amount"] = float(record["approved_amount"])
            record["items_ordered"] = str(record["items_ordered"])
            record["currency"] = str(record["currency"])
            
        PO_DATABASE = records
        logger.info(f"Loaded {len(PO_DATABASE)} Purchase Orders.")
        return {"status": "success", "message": f"Successfully imported {len(PO_DATABASE)} POs.", "data": PO_DATABASE}
        
    except Exception as e:
        logger.error(f"Error parsing PO sheet: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to parse PO sheet: {str(e)}")

@app.get("/api/pos")
async def get_pos():
    """Returns all loaded POs."""
    return PO_DATABASE

@app.post("/api/upload-invoices")
async def upload_invoices(files: List[UploadFile] = File(...)):
    """
    Ingests multiple invoice files (PDFs/Images).
    Streams processing logs and matching verdicts back to the client in real-time.
    """
    if not PO_DATABASE:
        raise HTTPException(
            status_code=400, 
            detail="No Purchase Order database loaded. Please upload PO sheet first."
        )

    # We extract known vendor names to aid in parser matching
    known_vendors = list(set([po["vendor_name"] for po in PO_DATABASE]))

    async def stream_processing():
        global PROCESSED_INVOICES
        
        for idx, file in enumerate(files):
            filename = file.filename
            file_bytes = await file.read()
            
            # Step 1: Initializing
            yield json.dumps({
                "index": idx,
                "filename": filename,
                "status": "processing",
                "step": "Queueing file...",
                "progress": 10
            }) + "\n"
            await asyncio.sleep(0.3)
            
            # Step 2: Running text extractor
            yield json.dumps({
                "index": idx,
                "filename": filename,
                "status": "processing",
                "step": "Extracting content (Native PDF check)...",
                "progress": 30
            }) + "\n"
            await asyncio.sleep(0.4)
            
            # Step 3: Run OCR if needed, else parse text
            # We'll run the actual parser
            try:
                parsed_invoice = parse_invoice_file(file_bytes, filename, known_vendors)
                
                yield json.dumps({
                    "index": idx,
                    "filename": filename,
                    "status": "processing",
                    "step": f"Parsed invoice details using {parsed_invoice['parser_used']}.",
                    "progress": 60
                }) + "\n"
                await asyncio.sleep(0.3)
                
                # Step 4: Running variance matching
                yield json.dumps({
                    "index": idx,
                    "filename": filename,
                    "status": "processing",
                    "step": "Comparing against approved POs...",
                    "progress": 80
                }) + "\n"
                await asyncio.sleep(0.4)
                
                # Run the matching engine
                verdict = match_invoice_to_po(parsed_invoice, PO_DATABASE, PROCESSED_INVOICES)
                
                # Save result in global state for references
                result = {
                    "id": f"INV-{idx}-{filename.replace('.', '_')}",
                    "filename": filename,
                    "invoice_number": parsed_invoice["invoice_number"],
                    "vendor_name": parsed_invoice["vendor_name"],
                    "invoice_date": parsed_invoice["invoice_date"],
                    "total_amount": parsed_invoice["total_amount"],
                    "currency": parsed_invoice["currency"],
                    "items": parsed_invoice["items"],
                    "parser_used": parsed_invoice["parser_used"],
                    "verdict": verdict
                }
                
                PROCESSED_INVOICES.append(result)
                
                # Step 5: Completed
                yield json.dumps({
                    "index": idx,
                    "filename": filename,
                    "status": "completed",
                    "step": f"Verdict complete: {verdict['status']}",
                    "progress": 100,
                    "data": result
                }) + "\n"
                
            except Exception as e:
                logger.error(f"Error processing {filename}: {str(e)}")
                yield json.dumps({
                    "index": idx,
                    "filename": filename,
                    "status": "failed",
                    "step": f"Error: {str(e)}",
                    "progress": 100
                }) + "\n"
                
    return StreamingResponse(stream_processing(), media_type="application/x-ndjson")

@app.get("/api/invoices")
async def get_invoices():
    """Returns all processed invoices."""
    return PROCESSED_INVOICES

@app.post("/api/reset")
async def reset_database():
    """Resets the PO database and processed invoices."""
    global PO_DATABASE, PROCESSED_INVOICES
    PO_DATABASE = []
    PROCESSED_INVOICES = []
    return {"status": "success", "message": "Backend database reset."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
