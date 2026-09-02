'use client';

import type { PaymentProvider } from '@/types/ride';
import { create } from 'zustand';

interface PaymentState {
  selectedProvider: PaymentProvider;
  selectedMethod: 'CARD' | 'UPI' | 'WALLET' | 'CASH';
  isProcessing: boolean;
  lastError: string | null;
  providerOrderId: string | null;

  setProvider: (p: PaymentProvider) => void;
  setMethod: (m: 'CARD' | 'UPI' | 'WALLET' | 'CASH') => void;
  setProcessing: (v: boolean) => void;
  setError: (e: string | null) => void;
  setProviderOrderId: (id: string | null) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  selectedProvider: 'RAZORPAY',
  selectedMethod: 'UPI',
  isProcessing: false,
  lastError: null,
  providerOrderId: null,

  setProvider: (selectedProvider) => set({ selectedProvider }),
  setMethod: (selectedMethod) => set({ selectedMethod }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (lastError) => set({ lastError }),
  setProviderOrderId: (providerOrderId) => set({ providerOrderId }),
  reset: () => set({ isProcessing: false, lastError: null, providerOrderId: null }),
}));
