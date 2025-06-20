import { createERPNextAPI, getUserDefaultCompany } from './erpnextApi';


export interface SerialBatchBundleEntry {
  batch_no?: string;
  serial_no?: string;
  qty: number;
  warehouse: string;
  delivered_qty?: number;
  incoming_rate?: number;
  outgoing_rate?: number;
  stock_value_difference?: number;
  is_outward?: number;
}

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
  company: string;
  item_code: string;
  item_name: string;
  item_group?: string;
  has_serial_no: number;
  has_batch_no: number;
  warehouse: string;
  type_of_transaction: 'Inward' | 'Outward';
  total_qty: number;
  avg_rate?: number;
  total_amount?: number;
  voucher_type?: string;
  voucher_no?: string;
  voucher_detail_no?: string;
  posting_date: string;
  posting_time?: string;
  entries: SerialBatchBundleEntry[];
}

export interface SerialBatchBundleResponse {
  data: {
    name: string;
    entries: SerialBatchBundleEntry[];
  };
}

export const createBatch = async (batchNo: string, itemCode: string): Promise<boolean> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      throw new Error('ERPNext API not configured');
    }

    const batchData = {
      batch_id: batchNo,
      item: itemCode,
      batch_qty: 0,
      disabled: 0
    };

    console.log('Creating batch:', batchData);
    
    const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Batch`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create batch:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('Batch created successfully:', result);
    return true;
  } catch (error) {
    console.error('Error creating batch:', error);
    return false;
  }
};

export const checkBatchExists = async (batchNo: string, itemCode: string): Promise<boolean> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      return false;
    }

    const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Batch?${new URLSearchParams({
      filters: JSON.stringify([['batch_id', '=', batchNo], ['item', '=', itemCode]]),
      fields: JSON.stringify(['name'])
    })}`, {
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.data && result.data.length > 0;
  } catch (error) {
    console.error('Error checking batch existence:', error);
    return false;
  }
};

export const createSerialBatchBundle = async (bundleData: SerialBatchBundle): Promise<SerialBatchBundleResponse | null> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      throw new Error('ERPNext API not configured');
    }

    // Create batches first if they don't exist
    if (bundleData.has_batch_no && bundleData.entries) {
      for (const entry of bundleData.entries) {
        if (entry.batch_no) {
          const batchExists = await checkBatchExists(entry.batch_no, bundleData.item_code);
          if (!batchExists) {
            console.log(`Creating new batch: ${entry.batch_no} for item: ${bundleData.item_code}`);
            const batchCreated = await createBatch(entry.batch_no, bundleData.item_code);
            if (!batchCreated) {
              console.warn(`Failed to create batch ${entry.batch_no}, but continuing with bundle creation`);
            }
          }
        }
      }
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
  itemName: string,
  itemGroup: string,
  hasSerial: number,
  hasBatch: number,
  warehouse: string,
  qty: number,
  uom: string,
  batchNo?: string,
  serialNo?: string
): Promise<string | null> => {
  try {
    const company = await getUserDefaultCompany();
    console.log("company found:----->",company)
    
    const bundleEntry: SerialBatchBundleEntry = {
      qty: qty,
      warehouse: warehouse,
      delivered_qty: 0,
      incoming_rate: 0,
      outgoing_rate: 0,
      stock_value_difference: 0,
      is_outward: 0,
      ...(batchNo && { batch_no: batchNo }),
      ...(serialNo && { serial_no: serialNo })
    };

    const bundleData: SerialBatchBundle = {
      company: company || '',
      item_code: itemCode,
      item_name: itemName,
      item_group: itemGroup,
      has_serial_no: hasSerial,
      has_batch_no: hasBatch,
      warehouse: warehouse,
      type_of_transaction: 'Inward',
      total_qty: qty,
      avg_rate: 0,
      total_amount: 0,
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
      entries: [bundleEntry],
      voucher_type:"Stock Reconciliation"
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
