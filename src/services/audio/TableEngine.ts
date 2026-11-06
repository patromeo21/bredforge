// ============================================================================
// BREDFORGE v1.0 — TABLE MICRO-MODULATION ENGINE (TableEngine.ts)
// ============================================================================

export interface TableStep {
  command: string; // e.g., "P02" (Pitch), "F40" (Filter Cutoff), "V20" (Volume)
  value: number;   // Parsed numeric value (e.g., 2, 64, 32)
}

export interface TableData {
  id: number;
  steps: TableStep[];
}

export interface TablePlaybackState {
  tableId: number;
  currentStepIndex: number;
  active: boolean;
}

export class TableEngine {
  private tables: Map<number, TableStep[]> = new Map();
  private activeInstances: Map<string, TablePlaybackState> = new Map(); // key: voiceKey (e.g. "track-1")

  public registerTable(tableId: number, rawSteps: { command: string; valStr: string }[]): void {
    const parsedSteps: TableStep[] = rawSteps.map(s => ({
      command: s.command.toUpperCase(),
      value: parseInt(s.valStr, 16) || 0
    }));
    this.tables.set(tableId, parsedSteps);
  }

  public triggerTable(voiceKey: string, tableId: number): void {
    if (!this.tables.has(tableId)) return;
    this.activeInstances.set(voiceKey, {
      tableId,
      currentStepIndex: 0,
      active: true
    });
  }

  public tickTables(onModulation: (voiceKey: string, command: string, value: number) => void): void {
    this.activeInstances.forEach((state, voiceKey) => {
      if (!state.active) return;

      const table = this.tables.get(state.tableId);
      if (!table || table.length === 0) {
        state.active = false;
        return;
      }

      // Execute current table row command
      const currentStep = table[state.currentStepIndex];
      if (currentStep && currentStep.command !== '---') {
        onModulation(voiceKey, currentStep.command, currentStep.value);
      }

      // Advance table cursor (loop cyclically through table steps)
      state.currentStepIndex = (state.currentStepIndex + 1) % table.length;
    });
  }

  public stopVoice(voiceKey: string): void {
    this.activeInstances.delete(voiceKey);
  }
}