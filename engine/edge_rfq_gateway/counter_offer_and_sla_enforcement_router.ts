/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/edge_rfq_gateway/counter_offer_and_sla_enforcement_router.ts
 *
 * Automated counter-offer generator, milestone escrow conditions enforcer,
 * and SLA defect penalty calculator for private-label manufacturing negotiations.
 */

import { NormalizedBidResult } from './supplier_bid_ingestion_and_normalization_router';

export interface CounterOfferSpec {
  counterOfferId: string;
  bidId: string;
  rfqId: string;
  supplierId: string;
  targetMoq: number;
  originalQuotedPriceUsd: number;
  counterProposedPriceUsd: number;
  priceDiscountRequestedPercent: number;
  requiredLeadDays: number;
  escrowMilestones: {
    advanceDepositPercent: number; // 30%
    preShipmentInspectionPassPercent: number; // 40%
    billOfLadingBalancePercent: number; // 30%
  };
  defectPenaltySLA: {
    criticalDefectsTolerance: string; // Zero tolerance (100% refund/remake)
    majorDefectsAQL: number; // 1.0%
    lateDeliveryPenaltyWeeklyPercent: number; // 1.5%
    remedyPeriodDays: number; // 14 days
  };
  counterOfferValidUntilIso: string;
  generatedIso: string;
}

export class CounterOfferAndSLAEnforcementRouter {
  /**
   * Evaluates normalized bid and synthesizes aggressive yet realistic commercial counter-offer.
   */
  public static generateCounterOffer(
    bid: NormalizedBidResult,
    targetBudgetUsd: number = 3.80,
    targetLeadDays: number = 45
  ): CounterOfferSpec {
    const primaryTier = bid.normalizedQuotes[0] || { usdFobPrice: 4.80, moq: 5000, leadTimeDays: 60 };
    const originalPrice = primaryTier.usdFobPrice;

    // Counter proposed price: split the difference between target and quote, or target if lower
    let counterPrice = Number(((originalPrice * 0.4) + (targetBudgetUsd * 0.6)).toFixed(2));
    if (counterPrice >= originalPrice) {
      counterPrice = Number((originalPrice * 0.92).toFixed(2)); // Default 8% discount request
    }

    const discountPercent = Number((((originalPrice - counterPrice) / originalPrice) * 100).toFixed(1));
    const counterId = `CTR-${bid.rfqId.slice(-6)}-${bid.supplierId.slice(-4)}-${Date.now().toString(36).toUpperCase()}`;

    return {
      counterOfferId: counterId,
      bidId: bid.bidId,
      rfqId: bid.rfqId,
      supplierId: bid.supplierId,
      targetMoq: primaryTier.moq,
      originalQuotedPriceUsd: originalPrice,
      counterProposedPriceUsd: counterPrice,
      priceDiscountRequestedPercent: discountPercent,
      requiredLeadDays: Math.min(primaryTier.leadTimeDays, targetLeadDays),
      escrowMilestones: {
        advanceDepositPercent: 30,
        preShipmentInspectionPassPercent: 40,
        billOfLadingBalancePercent: 30
      },
      defectPenaltySLA: {
        criticalDefectsTolerance: 'Zero tolerance (100% batch rejection and supplier remanufacture)',
        majorDefectsAQL: 1.0,
        lateDeliveryPenaltyWeeklyPercent: 1.5,
        remedyPeriodDays: 14
      },
      counterOfferValidUntilIso: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      generatedIso: new Date().toISOString()
    };
  }

  /**
   * Formats counter offer as contractual counter-proposal letter.
   */
  public static generateContractualLetter(counter: CounterOfferSpec): string {
    return `FORMAL COMMERCIAL COUNTER-OFFER
Reference: ${counter.counterOfferId}
In Response to Bid: ${counter.bidId} (RFQ #${counter.rfqId})
Supplier Account: ${counter.supplierId}
Date: ${counter.generatedIso.split('T')[0]}

Dear Vendor Procurement Management,

Thank you for submitting your manufacturing quotation for RFQ #${counter.rfqId}. Following preliminary technical evaluation of your facility credentials and capabilities, we are pleased to confirm your eligibility for our private-label production run.

However, based on our target landed cost matrix and committed volume tier (${counter.targetMoq.toLocaleString()} units), we respectfully issue the following binding counter-proposal:

1. UNIT PRICE COUNTER-OFFER:
   - Your Quoted FOB Price: $${counter.originalQuotedPriceUsd.toFixed(2)} USD
   - Our Counter-Proposed FOB Price: $${counter.counterProposedPriceUsd.toFixed(2)} USD (-${counter.priceDiscountRequestedPercent}%)
   - Target Production Lead Time: ${counter.requiredLeadDays} calendar days from sample sign-off

2. ESCROW MILESTONE PAYMENT SCHEDULE:
   - 30% Advance Deposit upon Purchase Order (PO) and Golden Sample sign-off.
   - 40% Milestone Release upon verified PASS of 3rd-Party Pre-Shipment Inspection (ISO 2859-1 Level II).
   - 30% Balance Release upon receipt of original Bill of Lading (B/L) and customs packing list.

3. QUALITY ASSURANCE & DEFECT PENALTIES:
   - Critical Defects: 0.0% (Immediate rework or credit note at supplier expense).
   - Major Functional Defects: Maximum AQL 1.0%.
   - Late Delivery Penalty: ${counter.defectPenaltySLA.lateDeliveryPenaltyWeeklyPercent}% per week of unexcused manufacturing delay, capped at 10% of PO value.

This counter-offer remains valid until ${counter.counterOfferValidUntilIso.split('T')[0]}.

Authorized Private-Label Brand Procurement Operations`;
  }
}
