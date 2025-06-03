
import { createERPNextAPI } from './erpnextApi';
import { offlineStorage, OfflineRecord } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingRecords();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initialize offline storage
    offlineStorage.initDB();
  }

  async syncPendingRecords(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const pendingRecords = await offlineStorage.getPendingRecords();
      
      for (const record of pendingRecords) {
        try {
          await this.syncRecord(erpnextAPI, record);
          await offlineStorage.markRecordSynced(record.id);
          console.log(`Synced record: ${record.id}`);
        } catch (error) {
          console.error(`Failed to sync record ${record.id}:`, error);
          await offlineStorage.incrementRetryCount(record.id);
          
          // Stop retrying after 3 attempts
          if (record.retry_count >= 3) {
            console.error(`Max retries reached for record ${record.id}`);
            await offlineStorage.markRecordSynced(record.id); // Mark as synced to prevent further attempts
          }
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncRecord(erpnextAPI: any, record: OfflineRecord): Promise<void> {
    const { type, action, data } = record;

    switch (action) {
      case 'create':
        return this.createRecord(erpnextAPI, type, data);
      case 'update':
        return this.updateRecord(erpnextAPI, type, data);
      case 'delete':
        return this.deleteRecord(erpnextAPI, type, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createRecord(erpnextAPI: any, type: string, data: any): Promise<void> {
    switch (type) {
      case 'Stock Reconciliation':
        return erpnextAPI.createStockReconciliation(data);
      case 'Delivery Note':
        return erpnextAPI.createDeliveryNote(data);
      case 'Purchase Receipt':
        return erpnextAPI.createPurchaseReceipt(data);
      case 'Material Request':
        return erpnextAPI.createMaterialRequest(data);
      case 'Stock Entry':
        return erpnextAPI.createStockEntry(data);
      case 'Pick List':
        return erpnextAPI.createPickList(data);
      case 'Packing Slip':
        return erpnextAPI.createPackingSlip(data);
      case 'Quality Inspection':
        return erpnextAPI.createQualityInspection(data);
      case 'Product Bundle':
        return erpnextAPI.createProductBundle(data);
      default:
        throw new Error(`Unknown record type for creation: ${type}`);
    }
  }

  private async updateRecord(erpnextAPI: any, type: string, data: any): Promise<void> {
    // Implementation for updating records
    // This would involve PUT requests to ERPNext API
    throw new Error('Update operations not yet implemented');
  }

  private async deleteRecord(erpnextAPI: any, type: string, data: any): Promise<void> {
    // Implementation for deleting records
    // This would involve DELETE requests to ERPNext API
    throw new Error('Delete operations not yet implemented');
  }

  async storeOfflineAction(type: string, action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    if (this.isOnline) {
      // If online, try to sync immediately
      try {
        const erpnextAPI = await createERPNextAPI();
        if (erpnextAPI) {
          await this.syncRecord(erpnextAPI, {
            id: '',
            type,
            action,
            data,
            timestamp: '',
            synced: false,
            retry_count: 0
          });
          return;
        }
      } catch (error) {
        console.warn('Immediate sync failed, storing offline:', error);
      }
    }

    // Store for later sync
    await offlineStorage.storeOfflineRecord({
      type,
      action,
      data
    });
  }

  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }
}

export const syncService = new SyncService();
