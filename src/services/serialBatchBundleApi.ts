import { createERPNextAPI } from './erpnextApi';

interface BatchInfo {
  batch_no: string;
  qty: number;
}

interface SerialInfo {
  serial_no: string;
}

interface SerialBatchBundleData {
  item_code: string;
  warehouse: string;
  serial_nos?: string[];
  batch_nos?: string[];
}

export interface SerialBatchBundleEntry {
  serial_no?: string;
  batch_no?: string;
  qty: number;
  warehouse: string;
  delivered_qty: number;
  incoming_rate: number;
  outgoing_rate: number;
  stock_value_difference: number;
  is_outward: number;
}

export const getAvailableSerialBatch = async (itemCode: string, warehouse: string, hasSerial: boolean, hasBatch: boolean): Promise<{serial_nos?: string[], batch_nos?: BatchInfo[]}> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return {};

    const result: {serial_nos?: string[], batch_nos?: BatchInfo[]} = {};

    if (hasSerial) {
      const serialResponse = await fetchAvailableSerials(itemCode, warehouse);
      result.serial_nos = serialResponse.map(s => s.serial_no);
    }

    if (hasBatch) {
      result.batch_nos = await fetchAvailableBatches(itemCode, warehouse);
    }

    return result;
  } catch (error) {
    console.error('Error fetching serial/batch data:', error);
    return {};
  }
};

export const fetchAvailableBatches = async (itemCode: string, warehouse: string): Promise<BatchInfo[]> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    const url = `${api.getBaseURL}/api/method/erpnext.stock.doctype.batch.batch.get_batch_qty`;
    
    const params = new URLSearchParams({
      item_code: itemCode,
      warehouse: warehouse
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch batches:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    if (data && data.message) {
      return data.message as BatchInfo[];
    } else {
      console.warn('No batches found or invalid response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
};

export const fetchAvailableSerials = async (itemCode: string, warehouse: string): Promise<SerialInfo[]> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    const url = `${api.getBaseURL}/api/method/erpnext.stock.doctype.serial_no.serial_no.get_serial_nos`;
    
    const params = new URLSearchParams({
      item_code: itemCode,
      warehouse: warehouse
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch serials:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    if (data && data.message) {
      return data.message as SerialInfo[];
    } else {
      console.warn('No serials found or invalid response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching serials:', error);
    return [];
  }
};

export const createSerialBatchBundle = async (bundleData: any): Promise<{data: {name: string}} | null> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return null;

    const url = `${api.getBaseURL}/api/resource/Serial and Batch Bundle`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bundleData)
    });

    if (!response.ok) {
      console.error('Failed to create serial and batch bundle:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.data && data.data.name) {
      return {data: {name: data.data.name}};
    } else {
      console.warn('Failed to create serial and batch bundle or invalid response');
      return null;
    }
  } catch (error) {
    console.error('Error creating serial and batch bundle:', error);
    return null;
  }
};

export const createSerialAndBatchBundle = createSerialBatchBundle;

export const checkBatchExists = async (batchNo: string, itemCode: string): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    const url = `${api.getBaseURL}/api/resource/Batch/${batchNo}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking batch existence:', error);
    return false;
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
    const api = await createERPNextAPI();
    if (!api) return null;

    const entries: SerialBatchBundleEntry[] = [{
      qty: qty,
      warehouse: warehouse,
      delivered_qty: 0,
      incoming_rate: 0,
      outgoing_rate: 0,
      stock_value_difference: 0,
      is_outward: 0,
      ...(batchNo && { batch_no: batchNo }),
      ...(serialNo && { serial_no: serialNo })
    }];

    const bundleData = {
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
      voucher_type: 'Stock Reconciliation',
      entries: entries
    };

    const result = await createSerialBatchBundle(bundleData);
    return result?.data?.name || null;
  } catch (error) {
    console.error('Error creating bundle from traditional entry:', error);
    return null;
  }
};

export const getSerialAndBatchBundle = async (bundleName: string): Promise<SerialBatchBundleEntry[]> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    // Use the public getters instead of private properties
    const url = `${api.getBaseURL}/api/resource/Serial and Batch Bundle/${bundleName}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to get serial and batch bundle:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    if (data && data.data && data.data.entries) {
      return data.data.entries as SerialBatchBundleEntry[];
    } else {
      console.warn('Failed to get serial and batch bundle or invalid response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching serial and batch bundle:', error);
    return [];
  }
};

export const updateSerialAndBatchBundle = async (bundleName: string, entries: SerialBatchBundleEntry[]): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    // Use the public getters instead of private properties
    const url = `${api.getBaseURL}/api/resource/Serial and Batch Bundle/${bundleName}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entries })
    });

    if (!response.ok) {
      console.error('Failed to update serial and batch bundle:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();

    if (data && data.data) {
      return true;
    } else {
      console.warn('Failed to update serial and batch bundle or invalid response');
      return false;
    }
  } catch (error) {
    console.error('Error updating serial and batch bundle:', error);
    return false;
  }
};

export const submitSerialAndBatchBundle = async (bundleName: string): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    // Use the public getters instead of private properties
    const submitUrl = `${api.getBaseURL}/api/method/frappe.client.submit`;
    
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doc: JSON.stringify({
          doctype: 'Serial and Batch Bundle',
          name: bundleName
        })
      })
    });

    if (!response.ok) {
      console.error('Failed to submit serial and batch bundle:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error submitting serial and batch bundle:', error);
    return false; 
  }
};

export const cancelSerialAndBatchBundle = async (bundleName: string): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    // Use the public getters instead of private properties
    const cancelUrl = `${api.getBaseURL}/api/method/frappe.client.cancel`;

    const response = await fetch(cancelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doc: JSON.stringify({
          doctype: 'Serial and Batch Bundle',
          name: bundleName
        })
      })
    });

    if (!response.ok) {
      console.error('Failed to cancel serial and batch bundle:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error cancelling serial and batch bundle:', error);
    return false;
  }
};

export const deleteSerialAndBatchBundle = async (bundleName: string): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    // Use the public getters instead of private properties
    const deleteUrl = `${api.getBaseURL}/api/resource/Serial and Batch Bundle/${bundleName}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to delete serial and batch bundle:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting serial and batch bundle:', error);
    return false;
  }
};
