
import { supabase } from '@/integrations/supabase/client';

export interface OfflineRecord {
  id: string;
  type: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  synced: boolean;
  retry_count: number;
}

class OfflineStorageService {
  private dbName = 'WMSOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('pendingRecords')) {
          const store = db.createObjectStore('pendingRecords', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeOfflineRecord(record: Omit<OfflineRecord, 'id' | 'timestamp' | 'synced' | 'retry_count'>): Promise<void> {
    if (!this.db) await this.initDB();

    const fullRecord: OfflineRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      synced: false,
      retry_count: 0,
      ...record
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
      const store = transaction.objectStore('pendingRecords');
      const request = store.add(fullRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingRecords(): Promise<OfflineRecord[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRecords'], 'readonly');
      const store = transaction.objectStore('pendingRecords');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markRecordSynced(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
      const store = transaction.objectStore('pendingRecords');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
      const store = transaction.objectStore('pendingRecords');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.retry_count += 1;
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.initDB();

    const cacheRecord = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.put(cacheRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp) < result.ttl) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const index = store.index('timestamp');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value;
          if ((Date.now() - record.timestamp) >= record.ttl) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorageService();
