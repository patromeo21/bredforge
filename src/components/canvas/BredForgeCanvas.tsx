import React, { useEffect, useRef, useState } from 'react';
import { PatternState } from '../../services/tracker/TrackerEngine';

interface BredForgeCanvasProps {
  patternState: PatternState;
  currentRow: number;
  activeTab: 1 | 2;
  onTabChange: (tab: 1 | 2) => void;
  masterRmsLevel?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onStop?: () => void;
}

export const BredForgeCanvas: React.FC<BredForgeCanvasProps> = ({
  patternState,
  currentRow,
  activeTab,
  onTabChange,
  masterRmsLevel = 0.2,
  isPlaying = false,
  onTogglePlay,
  onStop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localTab, setLocalTab] = useState<1 | 2>(activeTab);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Retina High-DPI Scaling (1440x900 fixed logical resolution)
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 1440;
    const logicalHeight = 900;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // ==========================================
    // 1. LEFT COLUMN VIEWPORT (Width: 640px) - Tracker & SP-303 Rack
    // ==========================================
    ctx.fillStyle = '#1a1a1e';
    ctx.fillRect(0, 0, 640, 740); // Tracker area

    // Render Scrolling Tracker Rows with Culling
    const rowHeight = 24;
    const visibleRows = Math.floor(740 / rowHeight);
    const startRow = Math.max(0, currentRow - Math.floor(visibleRows / 2));
    const endRow = Math.min(patternState.totalRows, startRow + visibleRows + 2);

    ctx.font = '11px monospace';
    for (let r = startRow; r < endRow; r++) {
      const yPos = (r - startRow) * rowHeight + 10;
      if (yPos < -rowHeight || yPos > 740) continue;

      if (r === currentRow) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
        ctx.fillRect(10, yPos - 14, 620, rowHeight);
      }

      ctx.fillStyle = r === currentRow ? '#fbbf24' : '#6b7280';
      ctx.fillText(`R${r.toString().padStart(2, '0')}`, 20, yPos);

      const rowData = patternState.rows[r];
      if (rowData && rowData.columns) {
        rowData.columns.forEach((step, c) => {
          const xPos = 80 + c * 130;
          const noteText = step.note ? step.note : '---';
          ctx.fillStyle = step.note ? '#38bdf8' : '#374151';
          ctx.fillText(`${noteText} [Inst:${step.instrumentId}]`, xPos, yPos);
        });
      }
    }

    // Bottom-Left SP-303 Mastering Rack Faceplate (Height: 160px, y: 740 to 900)
    ctx.fillStyle = '#26262b';
    ctx.fillRect(0, 740, 640, 160);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 740, 640, 160);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SP-303 MASTERING RACK', 20, 770);

    // Render Play Button
    ctx.fillStyle = isPlaying ? '#22c55e' : '#27272a';
    ctx.fillRect(230, 775, 75, 34);
    ctx.strokeStyle = isPlaying ? '#4ade80' : '#52525b';
    ctx.strokeRect(230, 775, 75, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isPlaying ? 'PLAYING' : 'PLAY', 267, 793);

    // Render Stop Button
    ctx.fillStyle = '#27272a';
    ctx.fillRect(315, 775, 75, 34);
    ctx.strokeStyle = '#52525b';
    ctx.strokeRect(315, 775, 75, 34);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('STOP', 352, 793);

    // Vertical LED Signal Ladder
    const meterHeight = 100;
    const meterWidth = 12;
    const meterX = 600;
    const meterY = 760;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    const activeLEDs = Math.floor(masterRmsLevel * 10);
    for (let i = 0; i < 10; i++) {
      const ledY = meterY + meterHeight - (i + 1) * 10;
      if (i < activeLEDs) {
        ctx.fillStyle = i > 7 ? '#ef4444' : i > 5 ? '#f59e0b' : '#22c55e';
      } else {
        ctx.fillStyle = '#27272a';
      }
      ctx.fillRect(meterX + 2, ledY + 1, meterWidth - 4, 8);
    }

    // ==========================================
    // 2. RIGHT COLUMN VIEWPORT (Width: 800px, x: 640) - Tabbed Workspace
    // ==========================================
    ctx.fillStyle = '#18181b';
    ctx.fillRect(640, 0, 800, 900);
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(640, 0, 800, 900);

    // Tab Header Bar
    ctx.fillStyle = '#27272a';
    ctx.fillRect(640, 0, 800, 40);

    ctx.fillStyle = localTab === 1 ? '#f59e0b' : '#71717a';
    ctx.fillRect(660, 10, 180, 30);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TAB 1: SP-404 PUNCH', 680, 30);

    ctx.fillStyle = localTab === 2 ? '#f59e0b' : '#71717a';
    ctx.fillRect(860, 10, 180, 30);
    ctx.fillStyle = '#09090b';
    ctx.fillText('TAB 2: SAMPLER WORKSPACE', 875, 30);

    if (localTab === 1) {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '14px sans-serif';
      ctx.fillText('SP-404SX Performance Punch Buttons & Roll Register Active', 680, 100);
    } else {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '14px sans-serif';
      ctx.fillText('Consolidated Waveform Canvas & 4x4 Soft Touch Pad Matrix', 680, 100);
    }

  }, [patternState, currentRow, localTab, masterRmsLevel, isPlaying]);

  // Handle Canvas Touch/Click Hit Testing for Transport Buttons
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Play button bounds: x: 230-305, y: 775-809
    if (x >= 230 && x <= 305 && y >= 775 && y <= 809) {
      if (onTogglePlay) onTogglePlay();
    }
    // Stop button bounds: x: 315-390, y: 775-809
    if (x >= 315 && x <= 390 && y >= 775 && y <= 809) {
      if (onStop) onStop();
    }

    // Tab 1 bounds: x: 660-840, y: 10-40
    if (x >= 660 && x <= 840 && y >= 10 && y <= 40) {
      setLocalTab(1);
      onTabChange(1);
    }
    // Tab 2 bounds: x: 860-1040, y: 10-40
    if (x >= 860 && x <= 1040 && y >= 10 && y <= 40) {
      setLocalTab(2);
      onTabChange(2);
    }
  };

  return (
    <div style={{ width: '1440px', height: '900px', overflow: 'hidden', touchAction: 'none' }}>
      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ cursor: 'pointer' }} />
    </div>
  );
};