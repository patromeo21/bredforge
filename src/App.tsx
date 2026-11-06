// ============================================================================
// STAGE E - PHASE 33: ROOT APPLICATION ENTRY WIRE (App.tsx)
// ============================================================================

import React from 'react';
import { TrackerLayout } from './components/tracker/TrackerLayout';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 text-emerald-500 font-mono select-none flex flex-col box-border">
      {/* Mounts our master hardware-coupled tracker environment workspace */}
      <TrackerLayout />
    </div>
  );
}