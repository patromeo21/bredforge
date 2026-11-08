// ============================================================================
// BREDFORGE v1.0 — PROJECT SERIALIZATION & STATE PERSISTENCE [REF: M45]
// ============================================================================

export interface BredForgeProject {
  version: string;
  projectName: string;
  bpm: number;
  patternData: {
    step: number;
    note: number;
    sampleId: string | number;
    velocity: number;
    active: boolean;
  }[];
  timestamp: number;
}

export class ProjectSerializationService {
  private static STORAGE_KEY = 'bredforge_active_project_v1';

  public static createDefaultProject(name: string = 'Untitled Phrase'): BredForgeProject {
    return {
      version: '1.0.0',
      projectName: name,
      bpm: 125,
      patternData: Array.from({ length: 64 }, (_, i) => ({
        step: i,
        note: 60, // C4
        sampleId: 'channel-1',
        velocity: 100,
        active: false,
      })),
      timestamp: Date.now(),
    };
  }

  public static saveToLocal(project: BredForgeProject): void {
    try {
      const serialized = JSON.stringify(project);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      console.log('[ProjectSerializationService] Project saved to local storage.');
    } catch (error) {
      console.error('[ProjectSerializationService] Failed to save project locally:', error);
    }
  }

  public static loadFromLocal(): BredForgeProject {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) {
        return this.createDefaultProject();
      }
      console.log('[ProjectSerializationService] Project loaded from local storage.');
      return JSON.parse(serialized) as BredForgeProject;
    } catch (error) {
      console.error('[ProjectSerializationService] Failed to load local project, returning default:', error);
      return this.createDefaultProject();
    }
  }

  public static exportToJsonFile(project: BredForgeProject): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.projectName.toLowerCase().replace(/\s+/g, '_')}.bredforge.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    console.log('[ProjectSerializationService] Project exported to JSON file.');
  }

  public static async importFromJsonFile(file: File): Promise<BredForgeProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const project = JSON.parse(content) as BredForgeProject;
          resolve(project);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}

export const projectSerializationService = ProjectSerializationService;