// ============================================================================
// BREDFORGE v1.0 — ZUSTAND UI STATE STORE (useUIStore.ts)
// ============================================================================

import { create } from 'zustand';

interface UIState {
  activeView: 'tracker' | 'groove' | 'mixer';
  setActiveView: (view: 'tracker' | 'groove' | 'mixer') => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
  modalContent: string | null;
  setModalContent: (content: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'tracker',
  setActiveView: (view) => set({ activeView: view }),
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  modalContent: null,
  setModalContent: (content) => set({ modalContent: content }),
}));