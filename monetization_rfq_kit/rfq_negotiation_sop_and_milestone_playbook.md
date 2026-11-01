# STANDARD OPERATING PROCEDURE (SOP) & NEGOTIATION PLAYBOOK: PRIVATE-LABEL SUPPLIER VALIDATION & RFQ AUTOMATION

**Document Code:** SOP-RFQ-AUTO-2026  
**Audience:** Sourcing Directors, Brand Operations Leads, Procurement Engineers  
**Target:** 100% Zero-Defect Manufacturing, Minimum 20% Cost Reduction, Full Regulatory Compliance  

---

## 1. PHASE 1: SPECIFICATION & PARAMETRIC BOM DRAFTING
1. **Define Core Geometry & Tolerances:** Apply ISO 2768-m (+/- 0.1mm) for standard injection-molded polymers, and ISO 2768-f (+/- 0.05mm) for precision machined metals.
2. **Clinical & Biocompatibility Endpoints:** Verify all skin/mucosal contact materials meet USP Class VI and ISO 10993 cytotoxicity standards before issuing RFQ.
3. **Establish Realistic Target FOB Price:** Utilize reverse engineering based on raw material mass, estimated cycle time, and standard 30% factory gross margin.

---

## 2. PHASE 2: AUTOMATED RFQ DISPATCH & DISCOVERY
1. **Distribute to Minimum 10 Factories:** Query verified industrial directories (e.g., ISO-certified OEMs, FDA establishment-registered plants).
2. **Standardized Webhook Ingestion:** Require suppliers to submit bids via API endpoint (`https://rfq.example.com/api/v1/bids/submit`) or standardized tabular CSV.
3. **Automatic Currency Normalization:** Convert all quotes (EUR, GBP, CNY, INR) to USD using live or 30-day trailing FX benchmarks.

---

## 3. PHASE 3: SUPPLIER CREDENTIAL & COUNTERFEIT VETTING
1. **Regulatory Sanction Checks:** Verify Foreign Establishment Identifier (FEI) in FDA database. Verify Notified Body number for CE MDR.
2. **Tooling Security Protocol:** Generate tamper-evident tooling identifier (`TOOL-SEC-[HASH]`). Mandate physical engraving on tooling mold bases before cavity sign-off.
3. **Audit History Review:** Reject suppliers lacking accredited ISO 9001/13485 certifications or those with SMETA audit scores below 75%.

---

## 4. PHASE 4: ALGORITHMIC COUNTER-OFFER STRATEGY
1. **Initial Bid Evaluation:** Identify top 3 competitive bids balancing FOB unit cost and lead time.
2. **Concession Ladder Execution:**
   - Round 1: Issue formal counter-offer at target budget (typically 10-15% below initial quoted price) referencing higher volume tiers (e.g., 10,000 unit commitment).
   - Round 2: Offer faster milestone cash releases (e.g., Net 30 down from Net 60) in exchange for 5% unit price reduction.
   - Round 3: Request free tooling or sample fee reimbursement against the first production run PO.
3. **Firm Delivery Deadlines:** Lock agreed lead times into contract with 1.5% weekly late liquidated damages.

---

## 5. PHASE 5: QUALITY CONTROL & ESCROW RELEASE PLAYBOOK
1. **Golden Sample Approval:** Client physically inspects and approves 3 golden samples. Sample A remains with Client, Sample B at factory, Sample C at 3rd-party inspection lab.
2. **Pre-Shipment Inspection (PSI):** Book SGS / TUV inspection at 100% completed and 80% packed stage.
3. **Tranche Release Authorization:**
   - 30% Advance released only upon verified raw material arrival at factory.
   - 40% PSI tranche released strictly upon clean Inspection Certificate.
   - 30% Final tranche released upon ocean Bill of Lading (B/L) telex release confirmation.

---
*Authorized by Nexus Sourcing Operations. Strict adherence mandatory.*
