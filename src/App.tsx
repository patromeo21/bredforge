import React from 'react';
import { DualScreenWorkspace } from './DualScreenWorkspace';

export function App() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-neutral-950 font-mono text-emerald-400">
      <DualScreenWorkspace 
        projectName="BREDFORGE_M8_PROJ" 
        tempo={120} 
      />
    </main>
  );
}

export default App;
