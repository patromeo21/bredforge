// ============================================================================
// STAGE D - PHASE 25: HYBRID LOCALSTORAGE & INDEXEDDB MEMORY VAULT (LocalVault.ts)
// ============================================================================

import { ProjectStateSchema, isValidProjectState } from '../tracker/TrackerState';

export class LocalVault {
  private static readonly DB_NAME = 'BredForgeVault';
  private static readonly STORE_NAME = 'sampleBlocks';
  private static readonly DB_VERSION = 1;

  // ============================================================================
  // LOCALSTORAGE TEXT PROJECT SEQUENCE SERIALIZER
  // ============================================================================
  public static saveProjectSequence(id: string, data: ProjectStateSchema): boolean {
    if (!isValidProjectState(data)) {
      console.error("LocalVault: Aborting save. Project state failed validation guards.");
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(`bredforge_project_${id}`, serialized);
      localStorage.setItem('bredforge_last_active_id', id);
      return true;
    } catch (error) {
      console.error("LocalVault: Failed to write project sequence to localStorage:", error);
      return false;
    }
  }

  public static loadProjectSequence(id: string): ProjectStateSchema | null {
    try {
      const serialized = localStorage.getItem(`bredforge_project_${id}`);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      if (isValidProjectState(parsed)) {
        return parsed;
      } else {
        console.warn("LocalVault: Loaded project failed schema validation guards.");
        return null;
      }
    } catch (error) {
      console.error("LocalVault: Failed to read project sequence from localStorage:", error);
      return null;
    }
  }
  // ============================================================================

  // ============================================================================
  // INDEXEDDB ASYNCHRONOUS OFF-HEAP AUDIO BUFFER BLOB VAULT
  // ============================================================================
  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error("IndexedDB is not supported in this environment."));
        return;
      }

      const request = indexedDB.open(LocalVault.DB_NAME, LocalVault.DB_VERSION);

      request.onerror = () => {
        reject(request.error || new Error("Failed to open IndexedDB database."));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(LocalVault.STORE_NAME)) {
          db.createObjectStore(LocalVault.STORE_NAME);
        }
      };
    });
  }

  public static async saveSampleBuffer(id: string, buffer: AudioBuffer): Promise<boolean> {
    try {
      const db = await LocalVault.openDatabase();
      
      const channelData: Float32Array[] = [];
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        channelData.push(buffer.getChannelData(i));
      }

      const payload = {
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        length: buffer.length,
        channelData: channelData,
        timestamp: Date.now()
      };

      return await new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(LocalVault.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(LocalVault.STORE_NAME);
        const request = store.put(payload, id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error("IndexedDB put transaction failed."));
      });
    } catch (error) {
      console.error("LocalVault: Failed to save sample buffer into IndexedDB:", error);
      return false;
    }
  }

  public static async loadSampleBuffer(id: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    try {
      const db = await LocalVault.openDatabase();

      const payload: any = await new Promise((resolve, reject) => {
        const transaction = db.transaction(LocalVault.STORE_NAME, 'readonly');
        const store = transaction.objectStore(LocalVault.STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB get transaction failed."));
      });

      if (!payload || !payload.channelData || !payload.sampleRate) {
        return null;
      }

      const audioBuffer = ctx.createBuffer(
        payload.numberOfChannels,
        payload.length,
        payload.sampleRate
      );

      for (let i = 0; i < payload.numberOfChannels; i++) {
        audioBuffer.copyToChannel(payload.channelData[i], i);
      }

      return audioBuffer;
    } catch (error) {
      console.error("LocalVault: Failed to load sample buffer from IndexedDB:", error);
      return null;
    }
  }
  // ============================================================================
}