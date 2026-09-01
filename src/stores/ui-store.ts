'use client';

import { create } from 'zustand';

interface UiState {
  /** Currently open modal id (e.g. 'rate-ride', 'cancel-ride'). */
  openModal: string | null;
  /** Modal payload — arbitrary data passed when opening. */
  modalData: unknown;
  /** Mobile sidebar drawer open state. */
  sidebarOpen: boolean;
  /** Toast queue — Sonner manages rendering, this is just for the API surface. */
  toasts: number;

  openModalById: (id: string, data?: unknown) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  bumpToasts: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  openModal: null,
  modalData: null,
  sidebarOpen: false,
  toasts: 0,

  openModalById: (id, data) => set({ openModal: id, modalData: data }),
  closeModal: () => set({ openModal: null, modalData: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  bumpToasts: () => set((s) => ({ toasts: s.toasts + 1 })),
}));
