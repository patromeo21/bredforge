// ============================================================================
// BREDFORGE v1.0 — LIGHTWEIGHT ZERO-DEPENDENCY UI STORE (useUIStore.ts)
// ============================================================================

import { useState, useEffect } from 'react';

type ViewMode = 'tracker' | 'groove' | 'mixer';

interface UIState {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
  modalContent: string | null;
  setModalContent: (content: string | null) => void;
}

class UIStoreManager {
  private state: UIState = {
    activeView: 'tracker',
    setActiveView: (view: ViewMode) => this.setState({ activeView: view }),
    isMenuOpen: false,
    toggleMenu: () => this.setState({ isMenuOpen: !this.state.isMenuOpen }),
    modalContent: null,
    setModalContent: (content: string | null) => this.setState({ modalContent: content }),
  };

  private listeners: Set<(state: UIState) => void> = new Set();

  public getState(): UIState {
    return this.state;
  }

  public setState(partial: Partial<UIState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: (state: UIState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const store = new UIStoreManager();

export function useUIStore(): UIState {
  const [state, setState] = useState<UIState>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}

export const uiStore = store;