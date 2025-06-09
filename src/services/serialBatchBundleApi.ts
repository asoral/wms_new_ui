import { createERPNextAPI, getUserDefaultCompany } from './erpnextApi';

export interface SerialBatchBundleItem {
  item_code: string;
  warehouse: string;
  qty: number;
  uom: string;
  batch_no?: string;
  serial_no?: string;
}

export interface SerialBatchBundle {
  name?: string;
  items: SerialBatchBundleItem[];
  posting_date: string;
  company: string;
}

export interface SerialBatchBundleResponse {
  data: {
    name: string;
    items: SerialBatchBundleItem[];
  };
}

export const createSerialBatchBundle = async (bundleData: SerialBatchBundle): Promise<SerialBatchBundleResponse | null> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      throw new Error('ERPNext API not configured');
    }

    console.log('Creating Serial and Batch Bundle with ERPNext structure:', bundleData);
    
    const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Serial and Batch Bundle`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bundleData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Serial and Batch Bundle:', errorText);
      throw new Error(`Failed to create bundle: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Serial and Batch Bundle created:', result);
    return result;
  } catch (error) {
    console.error('Error creating Serial and Batch Bundle:', error);
    throw error;
  }
};

export const createSerialBatchBundleFromTraditionalEntry = async (
  itemCode: string,
  warehouse: string,
  qty: number,
  uom: string,
  batchNo?: string,
  serialNo?: string
): Promise<string | null> => {
  try {
    const company = await getUserDefaultCompany();
    
    const bundleData: SerialBatchBundle = {
      items: [{
        item_code: itemCode,
        warehouse: warehouse,
        qty: qty,
        uom: uom,
        ...(batchNo && { batch_no: batchNo }),
        ...(serialNo && { serial_no: serialNo })
      }],
      posting_date: new Date().toISOString().split('T')[0],
      company: company || ''
    };

    const result = await createSerialBatchBundle(bundleData);
    return result?.data?.name || null;
  } catch (error) {
    console.error('Error creating bundle from traditional entry:', error);
    throw error;
  }
};

export const getSerialBatchBundle = async (bundleName: string): Promise<SerialBatchBundleResponse | null> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      throw new Error('ERPNext API not configured');
    }

    const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Serial and Batch Bundle/${bundleName}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get bundle: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting Serial and Batch Bundle:', error);
    throw error;
  }
};

export const getAvailableSerialBatch = async (
  itemCode: string, 
  warehouse: string, 
  hasSerial: boolean, 
  hasBatch: boolean
): Promise<{ serial_nos?: string[], batch_nos?: Array<{batch_no: string, qty: number}> }> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      throw new Error('ERPNext API not configured');
    }

    const params = new URLSearchParams({
      item_code: itemCode,
      warehouse: warehouse,
      has_serial_no: hasSerial ? '1' : '0',
      has_batch_no: hasBatch ? '1' : '0'
    });

    const response = await fetch(`${erpnextAPI.baseURL}/api/method/erpnext.stock.serial_batch_bundle.get_serial_or_batch_nos?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get available serial/batch: ${response.statusText}`);
    }

    const result = await response.json();
    return result.message || {};
  } catch (error) {
    console.error('Error getting available serial/batch:', error);
    return {};
  }
};
