/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/edge_rfq_gateway/supplier_bid_ingestion_and_normalization_router.ts
 *
 * Webhook ingestion, multi-currency normalization, and automated lead-time scoring
 * for incoming supplier proposals and bids.
 */

import { SupplierBidQuote, CurrencyCode } from '../rfq_engine/types';

export interface RawSupplierPayload {
  rfqId: string;
  vendorCode: string;
  vendorName: string;
  currency: string;
  pricingMatrix: {
    quantity: number;
    price: number;
    leadDays: number;
    toolingUsd?: number;
    sampleFeeUsd?: number;
  }[];
  paymentTermsNotes?: string;
  portOfLoading?: string;
  warrantyMonths?: number;
}

export interface NormalizedBidResult {
  bidId: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  currency: CurrencyCode;
  exchangeRateToUsd: number;
  normalizedQuotes: {
    moq: number;
    rawPrice: number;
    usdFobPrice: number;
    leadTimeDays: number;
    toolingFeeUsd: number;
    leadTimeScore: number; // 0-100 score (shorter is higher)
  }[];
  weightedCompetitivenessScore: number;
  isEligibleForShortlist: boolean;
  ingestedIso: string;
}

export class SupplierBidIngestionAndNormalizationRouter {
  private static readonly FX_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 1.08,
    GBP: 1.28,
    INR: 0.012,
    CAD: 0.74,
    AUD: 0.65,
    SGD: 0.75,
    CNY: 0.14
  };

  /**
   * Normalizes inbound supplier bids into standardized USD economics and scores lead time.
   */
  public static ingestAndNormalize(payload: RawSupplierPayload): NormalizedBidResult {
    const rawCurrency = (payload.currency || 'USD').toUpperCase();
    const currency = (['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD'].includes(rawCurrency)
      ? rawCurrency
      : 'USD') as CurrencyCode;

    const rate = this.FX_RATES[rawCurrency] || 1.0;
    const bidId = `BID-${payload.rfqId.slice(-6)}-${payload.vendorCode.slice(-4)}-${Date.now().toString(36).toUpperCase()}`;

    const normalizedQuotes = payload.pricingMatrix.map(tier => {
      const usdFob = tier.price * rate;
      // Lead time scoring: 30 days = 100 pts, 60 days = 70 pts, >90 days = 40 pts
      let leadScore = 100 - (tier.leadDays - 30) * 1.0;
      if (leadScore > 100) leadScore = 100;
      if (leadScore < 30) leadScore = 30;

      return {
        moq: tier.quantity,
        rawPrice: tier.price,
        usdFobPrice: Number(usdFob.toFixed(2)),
        leadTimeDays: tier.leadDays,
        toolingFeeUsd: tier.toolingUsd || 0,
        leadTimeScore: Math.round(leadScore)
      };
    });

    // Calculate composite competitiveness (50% price vs $4.50 benchmark, 50% lead time)
    const baseTier = normalizedQuotes[0] || { usdFobPrice: 5.0, leadTimeScore: 70 };
    const priceScore = Math.max(0, 100 - ((baseTier.usdFobPrice - 3.50) / 3.50) * 100);
    const weightedScore = Math.round(priceScore * 0.5 + baseTier.leadTimeScore * 0.5);

    return {
      bidId,
      rfqId: payload.rfqId,
      supplierId: payload.vendorCode,
      supplierName: payload.vendorName,
      currency,
      exchangeRateToUsd: rate,
      normalizedQuotes,
      weightedCompetitivenessScore: Math.min(100, Math.max(10, weightedScore)),
      isEligibleForShortlist: weightedScore >= 60,
      ingestedIso: new Date().toISOString()
    };
  }

  /**
   * Evaluates HTTP Request for webhook endpoint /api/v1/bids/submit
   */
  public static handleWebhook(rawBody: string): Response {
    try {
      const data = JSON.parse(rawBody) as RawSupplierPayload;
      if (!data.rfqId || !data.vendorCode || !data.pricingMatrix) {
        return new Response(JSON.stringify({ error: 'Missing required RFQ bid fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const normalized = this.ingestAndNormalize(data);
      return new Response(JSON.stringify({ status: 'SUCCESS', bid: normalized }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload', details: err.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
