# Zamp AP Automation: Intelligent Invoice Auditing Engine

An automated Accounts Payable (AP) invoice verification system that parses invoices (digital and scanned), matches them against active Purchase Orders (POs), detects cost variances/currency mismatches, and flags duplicate double-billing entries in real-time.

---

## 📌 Problem Statement

In manual Accounts Payable workflows, auditing incoming invoices against approved Purchase Orders is slow, error-prone, and vulnerable to financial risk:
1. **Manual Discrepancies**: Verifying line items, quantities, and prices manually leads to human error.
2. **Scanned Receipts**: Scanned PDFs and mobile photo receipts often bypass standard digital text readers, requiring slow manual data entry.
3. **Double-Billing Risk**: Submitting the same invoice twice in different formats (e.g., a nicely formatted PDF vs. a print screen scan) is difficult to flag manually.
4. **Currency Complexity**: Invoices billing in foreign currencies (like Euros, Yen, or Rupees) complicate rate limits and audit limits.

**This Solution**: Builds a dual-parser pipeline (High-speed Native PDF Reader + Offline Deep-Learning OCR Engine) to automatically link invoices to POs, run variance audits, and flag double-submissions.

---

## ✨ Key Features

* **Dual-Parser Pipeline**: 
  * **Digital PDFs**: High-speed text extraction using `pypdf`.
  * **Scanned PDFs & Images**: Automatic fallback to offline CPU-stable **PaddleOCR** paired with **pypdfium2** high-resolution page rendering (no external `poppler` binaries required).
* **Intelligent PO Verification & Matching**:
  * Auto-associates invoices to PO records in the database.
  * Supports flexible PO matches (handles suffix/year truncations, e.g., linking `26-028` to `PO-2026-028`).
* **Multi-Currency Amount Parser**: Handles symbols and formatting variations for USD (`$`), EUR (`€`), GBP (`£`), INR (`₹`), and JPY (`¥`).
* **Double-Submission Prevention**: Flags duplicate uploads based on identical Invoice Number + Vendor combinations, or matching PO + Vendor + Amount values.
* **Audit Dashboard**: Interactive React frontend showing real-time streaming status logs, color-coded verdicts (Approved, Flagged, Rejected), and detailed audit logs.

---

## 📂 Project Structure

```
zamp-ap-automation/
├── backend/
│   ├── main.py                 # FastAPI Application (Endpoints & Server)
│   ├── sample_pos.csv          # Local Purchase Order Database
│   ├── requirements.txt        # Backend dependencies
│   └── services/
│       ├── parser.py           # Text extractors (pypdf, pypdfium2, PaddleOCR)
│       └── matcher.py          # PO linkage, variance, and duplicate audit logic
└── frontend/
    ├── src/                    # React + Vite components & dashboard
    ├── package.json            # Node dependencies
    └── vite.config.js          # Vite config (proxies backend to Port 8000)
```

---

## 🚀 Setup & Local Execution

### Prerequisites
* **Python 3.10+** (64-bit recommended)
* **Node.js 18+**

---

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install the CPU-stable deep learning dependencies for PaddleOCR:
   ```bash
   # 1. Install stable CPU PaddlePaddle framework
   pip install paddlepaddle==2.6.2
   
   # 2. Install stable PaddleOCR
   pip install paddleocr==2.8.1
   
   # 3. Install remaining dependencies
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   python main.py
   ```
   The backend will start running locally at `http://localhost:8000`.

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` to access the interactive audit panel.

---

## 🧪 Testing the Pipelines

To run diagnostic checks and verify parsing/auditing rules locally:
```bash
# Verify PaddleOCR environment compatibility
python ../.gemini/antigravity/brain/09567867-a533-4988-a0ce-0b5d6c28a208/scratch/test_paddle_env.py

# Verify duplicate submission flagging rules
python ../.gemini/antigravity/brain/09567867-a533-4988-a0ce-0b5d6c28a208/scratch/test_duplicate_flagging.py
```

---

## ☁️ Deployment Guidelines

* **Frontend**: Deploy the `frontend/` directory to **Vercel** or **Netlify** (automatically connects to GitHub).
* **Backend**: Deploy the `backend/` directory to **Render** or **Railway**:
  * *Note on Free Tiers*: PaddleOCR models require ~1GB of RAM to load CPU weights. On Render's 512MB Free Tier, running OCR will cause an Out-Of-Memory (OOM) crash. For a free production URL, it is recommended to upgrade to a basic instance with 2GB RAM, or swap PaddleOCR calls to a lightweight cloud API like *OCR.space*.
