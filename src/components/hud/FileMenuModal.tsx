// ============================================================================
// BREDFORGE v1.0 — HARDWARE FILE MENU & PROJECT IO MODAL [REF: M46]
// ============================================================================

import React, { useRef, useState } from 'react';
import { ProjectSerializationService, BredForgeProject } from '../../services/storage/ProjectSerializationService';

interface FileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectLoaded?: (project: BredForgeProject) => void;
}

export function FileMenuModal({ isOpen, onClose, onProjectLoaded }: FileMenuModalProps) {
  const [projectName, setProjectName] = useState<string>('My Dirtywave Session');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleQuickSave = () => {
    const project = ProjectSerializationService.createDefaultProject(projectName);
    ProjectSerializationService.saveToLocal(project);
    setStatusMsg('SAVED TO LOCAL STORAGE');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleQuickLoad = () => {
    const project = ProjectSerializationService.loadFromLocal();
    setProjectName(project.projectName);
    if (onProjectLoaded) onProjectLoaded(project);
    setStatusMsg('LOADED FROM LOCAL STORAGE');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleExportJson = () => {
    const project = ProjectSerializationService.createDefaultProject(projectName);
    ProjectSerializationService.exportToJsonFile(project);
    setStatusMsg('EXPORTED .BREDFORGE.JSON');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await ProjectSerializationService.importFromJsonFile(file);
      setProjectName(project.projectName);
      if (onProjectLoaded) onProjectLoaded(project);
      setStatusMsg(`IMPORTED: ${project.projectName}`);
    } catch {
      setStatusMsg('ERROR: INVALID PROJECT FILE');
    }
    setTimeout(() => setStatusMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl relative">
        {/* Header Bezel */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs text-amber-500 font-bold tracking-wider">PROJECT // SYSTEM I/O</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-sm font-bold px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* Project Meta Input */}
        <div className="mb-5 space-y-1">
          <label className="text-[10px] text-zinc-500">PROJECT TITLE</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* IO Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleQuickSave}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-lg text-zinc-200 text-xs font-bold transition-all"
          >
            <span>💾 QUICK SAVE</span>
            <span className="text-[9px] text-zinc-500 font-normal mt-1">Browser Cache</span>
          </button>

          <button
            onClick={handleQuickLoad}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-lg text-zinc-200 text-xs font-bold transition-all"
          >
            <span>📂 QUICK LOAD</span>
            <span className="text-[9px] text-zinc-500 font-normal mt-1">Last Saved Session</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex flex-col items-center justify-center p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold transition-all"
          >
            <span>⬇ EXPORT FILE</span>
            <span className="text-[9px] text-amber-500/60 font-normal mt-1">.bredforge.json</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-200 text-xs font-bold transition-all"
          >
            <span>⬆ IMPORT FILE</span>
            <span className="text-[9px] text-zinc-500 font-normal mt-1">Load local JSON</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFileChange}
          className="hidden"
        />

        {/* Status Display Bar */}
        <div className="h-6 flex items-center justify-center text-[10px] text-amber-400/90 font-mono tracking-widest bg-zinc-900/50 rounded border border-zinc-900">
          {statusMsg || 'READY'}
        </div>
      </div>
    </div>
  );
}

export default FileMenuModal;