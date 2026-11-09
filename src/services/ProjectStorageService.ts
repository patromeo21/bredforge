// ============================================================================
// BREDFORGE v1.0 — PROJECT STATE STORAGE & JSON EXPORT/IMPORT [REF: STORE-01]
// ============================================================================

export interface BredforgeProjectState {
  version: string;
  projectName: string;
  tempo: number;
  timestamp: number;
  phraseSteps: any[];
  chainSlots: any[];
  songRows: any[];
  mixerChannels: any[];
  fxConfig: any;
}

const STORAGE_KEY = 'bredforge_active_project_v1';

export class ProjectStorageService {
  /**
   * Save project state to browser localStorage
   */
  public static saveToLocalStorage(state: BredforgeProjectState): void {
    try {
      const serialized = JSON.stringify({ ...state, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY, serialized);
      console.log('[StorageService] Project saved to localStorage successfully.');
    } catch (err) {
      console.error('[StorageService] Failed to save to localStorage:', err);
    }
  }

  /**
   * Load project state from browser localStorage
   */
  public static loadFromLocalStorage(): BredforgeProjectState | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      return JSON.parse(serialized) as BredforgeProjectState;
    } catch (err) {
      console.error('[StorageService] Failed to load from localStorage:', err);
      return null;
    }
  }

  /**
   * Export project state as a downloadable JSON file (.bred / .json)
   */
  public static exportToJsonFile(state: BredforgeProjectState): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${state.projectName.toLowerCase()}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    console.log('[StorageService] JSON export triggered successfully.');
  }

  /**
   * Parse an uploaded JSON project file
   */
  public static async importFromJsonFile(file: File): Promise<BredforgeProjectState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as BredforgeProjectState;
          if (!parsed.projectName || !parsed.tempo) {
            throw new Error('Invalid project file structure.');
          }
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}
