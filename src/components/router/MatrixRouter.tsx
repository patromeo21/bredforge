// ============================================================================
// BREDFORGE v1.0 — 2D SPATIAL VIEWPORT ROUTER (MatrixRouter.tsx)
// ============================================================================

import React from 'react';
import { MatrixCoordinate, HardwareMode } from '../../types/matrix';
import { LiveView } from '../views/LiveView';
import { SongView } from '../views/SongView';
import { ChainView } from '../views/ChainView';
import { PhraseGrid } from '../tracker/PhraseGrid';
import { InstrumentView } from '../instrument/InstrumentView';
import { MixerView } from '../views/MixerView';
import { GlobalFxView } from '../views/GlobalFxView';
import { ProjectView } from '../views/ProjectView';

interface MatrixRouterProps {
  coord: MatrixCoordinate;
  mode: HardwareMode;
}

export const MatrixRouter: React.FC<MatrixRouterProps> = ({ coord }) => {
  // Map 2D Coordinates (x, y) to M8 Screen Views
  const renderActiveView = () => {
    switch (`${coord.x},${coord.y}`) {
      case '1,0':
        return <ProjectView />;
      case '3,0':
        return <div className="flex items-center justify-center h-full text-slate-500">GROOVE VIEW (3,0) [PENDING]</div>;
      case '0,1':
        return <LiveView />;
      case '1,1':
        return <SongView />;
      case '2,1':
        return <ChainView />;
      case '3,1':
        return <PhraseGrid />;
      case '4,1':
        return <InstrumentView />;
      case '5,1':
        return <div className="flex items-center justify-center h-full text-slate-500">TABLE VIEW (5,1) [PENDING]</div>;
      default:
        // Handle Mixer (Row 2, Cols 1-5) and Global FX (Row 3, Cols 1-5)
        if (coord.y === 2) return <MixerView />;
        if (coord.y === 3) return <GlobalFxView />;
        
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <span className="font-bold text-slate-400">UNMAPPED COORDINATE</span>
            <span>X: {coord.x}, Y: {coord.y}</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {renderActiveView()}
    </div>
  );
};