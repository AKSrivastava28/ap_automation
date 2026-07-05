import logging
import re

logger = logging.getLogger("invoice_matcher")

def clean_desc(desc: str) -> str:
    """Standardizes string by lowering it, stripping generic terms, numbers, and punctuation."""
    if not desc:
        return ""
    d = desc.lower()
    # Remove words containing numbers/digits (like Model codes, quantities: w-100, g-200, 10x, 5x)
    d = re.sub(r"\b\w*\d\w*\b", "", d)
    # Remove generic keywords
    d = re.sub(r"\b(model|type|version|brand|services|software|license|hosting|maintenance|reactor)\b", "", d)
    # Remove punctuation
    d = re.sub(r"[^\w\s]", " ", d)
    # Normalize spacing
    return re.sub(r"\s+", " ", d).strip()

def calculate_variance(invoice_amount: float, approved_amount: float) -> float:
    """Calculates the percentage variance between the invoice amount and the approved PO amount."""
    if approved_amount <= 0:
        return 100.0
    return ((invoice_amount - approved_amount) / approved_amount) * 100

def match_invoice_to_po(invoice_data: dict, po_records: list, processed_invoices: list = None) -> dict:
    """
    Matches invoice details against PO records.
    Returns a verdict dict containing status, variance, matched PO info, and explanations.
    """
    verdict = {
        "status": "REJECTED",  # Default to Rejected
        "color_code": "red",
        "variance_percentage": 0.0,
        "matched_po": None,
        "reasons": [],
        "explanation": ""
    }

    # Extract invoice fields
    vendor = invoice_data.get("vendor_name", "").strip()
    total_amount = invoice_data.get("total_amount", 0.0)
    inv_num = invoice_data.get("invoice_number", "")
    currency = invoice_data.get("currency", "USD")
    items = invoice_data.get("items", [])
    inv_po_num = str(invoice_data.get("po_number", "")).strip()

    # 1. Strictly verify PO existence first if a PO number is specified on the invoice
    matched_po = None
    if inv_po_num:
        # Normalize the PO number (remove "PO-" prefix if present)
        norm_inv_po = re.sub(r"(?i)^po-", "", inv_po_num).strip().lower()
        
        # Look up against the database
        for po in po_records:
            db_po_num = str(po.get("po_number", "")).strip()
            norm_db_po = re.sub(r"(?i)^po-", "", db_po_num).strip().lower()
            if norm_inv_po == norm_db_po or norm_inv_po.endswith(norm_db_po) or norm_db_po.endswith(norm_inv_po):
                matched_po = po
                break
                
        if not matched_po:
            # PO specified on invoice does NOT exist in spreadsheet database
            verdict["status"] = "SYSTEM AUDIT FLAGGED"
            verdict["color_code"] = "yellow"
            verdict["reasons"].append("PO Reference Mismatch: The purchase order number specified on the invoice does not exist in the database.")
            verdict["explanation"] = f"The invoice specified Purchase Order '{inv_po_num}', which does not match any approved PO record in the database."
            return verdict
    else:
        # Check if there is an explicit PO number pattern we can match in vendor, inv_num, etc.
        # Alternatively, we lookup POs by Vendor Name first.
        matching_pos_by_vendor = [po for po in po_records if po.get("vendor_name", "").lower() in vendor.lower() or vendor.lower() in po.get("vendor_name", "").lower()]
        
        if matching_pos_by_vendor:
            # If there are POs matching the vendor, let's check if we can match by amount or take the first one
            matched_po = matching_pos_by_vendor[0]
        else:
            # Check all POs to see if any PO number is mentioned in the invoice data (e.g., in items description or invoice number)
            for po in po_records:
                po_num = str(po.get("po_number", ""))
                if po_num.lower() in inv_num.lower():
                    matched_po = po
                    break

        # If still no PO, check if any PO approved amount matches the invoice amount exactly for a similar vendor
        if not matched_po:
            # Try to find a PO with exact amount matching
            for po in po_records:
                if abs(po.get("approved_amount", 0.0) - total_amount) < 0.01:
                    matched_po = po
                    break

    if not matched_po:
        verdict["status"] = "REJECTED"
        verdict["color_code"] = "red"
        verdict["reasons"].append(f"Unlinked transaction: No Purchase Order found matching vendor '{vendor}' or amount ${total_amount:,.2f}.")
        verdict["explanation"] = f"This invoice from '{vendor}' was rejected because it could not be linked to any approved Purchase Order in the database. Please verify the vendor name or check if a PO was issued."
        return verdict

    # Found a matching PO
    verdict["matched_po"] = matched_po
    po_amount = float(matched_po.get("approved_amount", 0.0))
    po_number = matched_po.get("po_number", "")
    po_vendor = matched_po.get("vendor_name", "")
    po_currency = matched_po.get("currency", "USD")

    # Check currency mismatch
    if currency != po_currency:
        verdict["reasons"].append(f"Currency mismatch: Invoice is in {currency} but PO #{po_number} is in {po_currency}.")

    # Calculate variance
    variance = calculate_variance(total_amount, po_amount)
    verdict["variance_percentage"] = round(variance, 2)

    # Check item descriptions & mismatches
    item_mismatch = False
    po_items_str = str(matched_po.get("items_ordered", ""))
    clean_po_items = clean_desc(po_items_str)
    for item in items:
        item_desc = item.get("item_name", "")
        if not item_desc:
            continue
            
        # Skip description validation if it is the general fallback billing item
        if item_desc.startswith("General Invoice Billing"):
            continue
            
        clean_invoice_item = clean_desc(item_desc)
        invoice_words = [w for w in clean_invoice_item.split() if len(w) > 2]
        
        match_found = False
        if invoice_words:
            # Check if any core word from the invoice item exists in the PO items
            if any(word in clean_po_items for word in invoice_words):
                match_found = True
        else:
            # Fallback if cleaning removed all words (e.g. entirely numbers/codes)
            if item_desc.lower() in po_items_str.lower() or po_items_str.lower() in item_desc.lower():
                match_found = True
                
        if not match_found:
            item_mismatch = True
            verdict["reasons"].append(f"Item mismatch: Invoice item '{item_desc}' does not match PO items list.")

    # Determine final verdict based on variance and item alignment
    # Green: Approved / Exact match or within 1% threshold
    # Yellow: Flagged / Cost too high, item mismatch
    # Red: Rejected / Missing details or unlinked
    
    # If there is critical currency mismatch or amount is 0, reject
    if total_amount <= 0:
        verdict["status"] = "REJECTED"
        verdict["color_code"] = "red"
        verdict["reasons"].append("Missing or invalid total billing amount on invoice.")
        verdict["explanation"] = f"Invoice #{inv_num} is rejected because the extracted total amount is 0 or could not be found."
    elif variance > 1.0:
        verdict["status"] = "FLAGGED"
        verdict["color_code"] = "yellow"
        verdict["reasons"].append(f"Cost variance exceeded: Invoice total (${total_amount:,.2f}) is {variance:.2f}% higher than approved PO limit (${po_amount:,.2f}).")
        
        explanation_items = f"Flagged due to a {variance:.2f}% pricing discrepancy. The invoice total of ${total_amount:,.2f} exceeds the approved PO limit of ${po_amount:,.2f}."
        if item_mismatch:
            explanation_items += " Additionally, some line item descriptions do not match the original purchase order."
        verdict["explanation"] = explanation_items
    elif item_mismatch:
        verdict["status"] = "FLAGGED"
        verdict["color_code"] = "yellow"
        verdict["reasons"].append("Line item mismatch detected: some invoiced items were not explicitly in the approved PO.")
        verdict["explanation"] = f"Approved with warning (Flagged). Although the amount of ${total_amount:,.2f} is within threshold (variance: {variance:.2f}%), the invoice contains line items that do not match PO #{po_number} descriptions."
    else:
        # Within threshold (variance <= 1%)
        verdict["status"] = "APPROVED"
        verdict["color_code"] = "green"
        verdict["explanation"] = f"Invoice matches PO #{po_number} perfectly. The variance is {variance:.2f}%, which is within the acceptable 1% threshold limit. Recommended for immediate payment processing."

    # 3. Override verdict if duplicate submission is detected
    if processed_invoices:
        inv_vendor = str(vendor).strip().lower()
        inv_po = re.sub(r"(?i)^po-", "", inv_po_num).strip().lower()
        inv_amount = float(total_amount)
        inv_number_clean = str(inv_num).strip().lower()
        
        for prev in processed_invoices:
            prev_vendor = str(prev.get("vendor_name", "")).strip().lower()
            
            # Safe extraction of previous PO number
            prev_po_raw = ""
            prev_verdict = prev.get("verdict", {})
            if prev_verdict and isinstance(prev_verdict, dict):
                prev_matched_po = prev_verdict.get("matched_po")
                if prev_matched_po and isinstance(prev_matched_po, dict):
                    prev_po_raw = prev_matched_po.get("po_number", "")
            if not prev_po_raw:
                prev_po_raw = prev.get("po_number", "")
            prev_po = re.sub(r"(?i)^po-", "", str(prev_po_raw)).strip().lower()
            
            prev_amount = float(prev.get("total_amount", 0.0))
            prev_number_clean = str(prev.get("invoice_number", "")).strip().lower()
            
            # Check 1: Invoice number & vendor match (most reliable unique key)
            is_dup_by_invoice_num = (
                inv_number_clean != "" and 
                inv_number_clean != "inv-unknown" and 
                inv_number_clean == prev_number_clean and 
                (inv_vendor in prev_vendor or prev_vendor in inv_vendor)
            )
            
            # Check 2: Flexible PO reference (ends with match), vendor, and amount match
            po_matched_flexibly = (
                inv_po != "" and 
                prev_po != "" and 
                (inv_po.endswith(prev_po) or prev_po.endswith(inv_po))
            )
            is_dup_by_po_details = (
                (inv_vendor in prev_vendor or prev_vendor in inv_vendor) and 
                po_matched_flexibly and 
                abs(inv_amount - prev_amount) < 0.01
            )
            
            if is_dup_by_invoice_num or is_dup_by_po_details:
                verdict["status"] = "FLAGGED"
                verdict["color_code"] = "yellow"
                # Clear standard reasons to prioritize duplicate warning
                verdict["reasons"] = ["Duplicate Submission: This invoice matches a previously submitted invoice (same vendor, amount, and PO reference)."]
                verdict["explanation"] = f"Warning: Double-submission detected. This invoice matches the details of a previously submitted file: '{prev.get('filename')}'."
                break

    return verdict
