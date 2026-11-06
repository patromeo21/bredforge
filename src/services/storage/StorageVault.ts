// ============================================================================
// STAGE D - PHASE 25: HYBRID LOCALSTORAGE & INDEXEDDB MEMORY VAULT (StorageVault.ts)
// ============================================================================

import { ProjectStateSchema, isValidProjectState, TrackerState } from '../tracker/TrackerState';

export class StorageVault {
  private static readonly DB_NAME = 'SPM8_Asset_Vault';
  private static readonly STORE_NAME = 'sample_blobs';
  private static readonly DB_VERSION = 1;
  private static readonly LOCALSTORAGE_KEY = 'spm8_active_project_state';

  // ============================================================================
  // LOCALSTORAGE TEXT PROJECT SEQUENCE SERIALIZER
  // ============================================================================
  public static async saveProject(state: ProjectStateSchema): Promise<void> {
    if (!isValidProjectState(state)) {
      console.error("StorageVault: Aborting save. Project state failed validation guards.");
      throw new Error("Invalid project state schema.");
    }

    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(StorageVault.LOCALSTORAGE_KEY, serialized);
      localStorage.setItem('spm8_last_saved_timestamp', String(Date.now()));
    } catch (error) {
      console.error("StorageVault: Failed to write project sequence to localStorage:", error);
      throw error;
    }
  }

  public static async loadProject(): Promise<ProjectStateSchema | null> {
    try {
      const serialized = localStorage.getItem(StorageVault.LOCALSTORAGE_KEY);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      const sanitized = TrackerState.sanitizeProjectState(parsed);
      
      if (!isValidProjectState(sanitized)) {
        console.warn("StorageVault: Sanitized project state failed validation. Falling back to null.");
        return null;
      }

      return sanitized;
    } catch (error) {
      console.error("StorageVault: Failed to read project sequence from localStorage:", error);
      return null;
    }
  }
  // ============================================================================

  // ============================================================================
  // INDEXEDDB ASYNCHRONOUS OFF-HEAP AUDIO BUFFER BLOB VAULT (SAFARI HARDENED)
  // ============================================================================
  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof indexedDB === 'undefined') {
          reject(new Error("IndexedDB is not supported in this environment."));
          return;
        }

        const request = indexedDB.open(StorageVault.DB_NAME, StorageVault.DB_VERSION);

        request.onerror = () => {
          reject(request.error || new Error("Failed to open IndexedDB database."));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(StorageVault.STORE_NAME)) {
            db.createObjectStore(StorageVault.STORE_NAME);
          }
        };
      } catch (syncError) {
        // Catches synchronous Safari SecurityErrors / Quota errors in private mode
        reject(syncError instanceof Error ? syncError : new Error("Synchronous IndexedDB open failure."));
      }
    });
  }

  public static async saveSampleBlob(padHexId: string, audioData: ArrayBuffer): Promise<void> {
    try {
      const db = await StorageVault.openDatabase();

      return await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(StorageVault.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(StorageVault.STORE_NAME);
        const request = store.put(audioData, padHexId.toUpperCase());

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
        request.onerror = () => reject(request.error || new Error("IndexedDB put request failed."));
      });
    } catch (error) {
      console.error(`StorageVault: Failed to save sample blob for pad ${padHexId}:`, error);
      throw error;
    }
  }

  public static async loadSampleBlob(padHexId: string): Promise<ArrayBuffer | null> {
    try {
      const db = await StorageVault.openDatabase();

      return await new Promise<ArrayBuffer | null>((resolve, reject) => {
        const transaction = db.transaction(StorageVault.STORE_NAME, 'readonly');
        const store = transaction.objectStore(StorageVault.STORE_NAME);
        const request = store.get(padHexId.toUpperCase());

        request.onsuccess = () => {
          const result = request.result;
          resolve(result instanceof ArrayBuffer ? result : null);
        };
        request.onerror = () => reject(request.error || new Error("IndexedDB get request failed."));
      });
    } catch (error) {
      console.error(`StorageVault: Failed to load sample blob for pad ${padHexId}:`, error);
      return null;
    }
  }
  // ============================================================================
}
