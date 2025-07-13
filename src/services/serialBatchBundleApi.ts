import { createERPNextAPI } from './erpnextApi';

interface BatchInfo {
  batch_no: string;
  qty: number;
  expiry_date?: string;
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
  console.log('🚨🚨🚨 fetchAvailableBatches CALLED!!! itemCode:', itemCode, 'warehouse:', warehouse);
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    console.log(`🔥 DEBUGGING: Fetching batches for item: ${itemCode}, warehouse: ${warehouse}`);
    console.log(`🔥 DEBUGGING: Using simple Batch resource query (reverting to working approach)`);

    // Simple approach: Get all batches for the item, then check stock for each
    const batchUrl = `${api.getBaseURL}/api/resource/Batch`;
    const batchParams = new URLSearchParams({
      fields: JSON.stringify(['name', 'batch_id', 'item', 'expiry_date']),
      filters: JSON.stringify([
        ['item', '=', itemCode]
      ]),
      limit_page_length: '0'
    });

    console.log('🔥 DEBUGGING: Batch resource URL:', batchUrl + '?' + batchParams.toString());

    const batchResponse = await fetch(`${batchUrl}?${batchParams.toString()}`, {
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!batchResponse.ok) {
      console.error('🔥 DEBUGGING: Failed to fetch batches:', batchResponse.status, batchResponse.statusText);
      return [];
    }

    const batchData = await batchResponse.json();
    console.log('🔥 DEBUGGING: Batch resource response:', batchData);

    if (!batchData?.data || !Array.isArray(batchData.data)) {
      console.warn('🔥 DEBUGGING: No batch data found');
      return [];
    }

    const validBatches: BatchInfo[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For each batch, check stock in the specific warehouse using Bin resource
    for (const batch of batchData.data) {
      const batchNo = batch.name || batch.batch_id;
      const expiry_date = batch.expiry_date;

      console.log(`🔥 DEBUGGING: Checking batch ${batchNo} stock in warehouse ${warehouse}`);

      // Check if batch is expired
      if (expiry_date) {
        const expiryDate = new Date(expiry_date);
        expiryDate.setHours(23, 59, 59, 999);
        
        if (expiryDate < today) {
          console.log(`🔥 DEBUGGING: Filtering expired batch ${batchNo} - expiry: ${expiry_date}`);
          continue;
        }
      }

      // Check stock in warehouse using Bin resource
      try {
        const binUrl = `${api.getBaseURL}/api/resource/Bin`;
        const binParams = new URLSearchParams({
          fields: JSON.stringify(['actual_qty', 'reserved_qty']),
          filters: JSON.stringify([
            ['item_code', '=', itemCode],
            ['warehouse', '=', warehouse],
            ['batch_no', '=', batchNo]
          ])
        });

        console.log(`🔥 DEBUGGING: Checking bin stock for batch ${batchNo}:`, binUrl + '?' + binParams.toString());

        const binResponse = await fetch(`${binUrl}?${binParams.toString()}`, {
          headers: {
            'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
            'Content-Type': 'application/json'
          }
        });

        if (binResponse.ok) {
          const binData = await binResponse.json();
          console.log(`🔥 DEBUGGING: Bin response for batch ${batchNo}:`, binData);
          
          if (binData.data && binData.data.length > 0) {
            const binInfo = binData.data[0];
            const actualQty = parseFloat(binInfo.actual_qty) || 0;
            const reservedQty = parseFloat(binInfo.reserved_qty) || 0;
            const availableQty = actualQty - reservedQty;

            console.log(`🔥 DEBUGGING: Batch ${batchNo} - actual: ${actualQty}, reserved: ${reservedQty}, available: ${availableQty}`);

            if (availableQty > 0) {
              validBatches.push({
                batch_no: batchNo,
                qty: availableQty,
                expiry_date: expiry_date
              });
              console.log(`🔥 DEBUGGING: ✅ Including batch ${batchNo}: qty=${availableQty}, expiry=${expiry_date || 'No expiry'}`);
            } else {
              console.log(`🔥 DEBUGGING: ❌ Filtering batch ${batchNo} - no available stock (${availableQty})`);
            }
          } else {
            console.log(`🔥 DEBUGGING: ❌ No bin record found for batch ${batchNo} in warehouse ${warehouse}`);
          }
        } else {
          console.warn(`🔥 DEBUGGING: Failed to fetch bin data for batch ${batchNo}:`, binResponse.status);
        }
      } catch (error) {
        console.error(`🔥 DEBUGGING: Error checking bin stock for batch ${batchNo}:`, error);
      }
    }

    // Sort by expiry date (earliest first)
    validBatches.sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });

    console.log(`🔥 DEBUGGING: FINAL RESULT - Found ${validBatches.length} valid batches:`, validBatches);
    return validBatches;

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
    if (!api) {
      console.error('ERPNext API not available');
      return null;
    }

    console.log('Creating serial batch bundle with data:', bundleData);
    const url = `${api.getBaseURL}/api/resource/Serial and Batch Bundle`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bundleData)
    });

    const responseText = await response.text();
    console.log('Serial batch bundle response:', response.status, responseText);

    if (!response.ok) {
      console.error('Failed to create serial and batch bundle:', response.status, responseText);
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    if (data && data.data && data.data.name) {
      console.log('Successfully created bundle:', data.data.name);
      return {data: {name: data.data.name}};
    } else {
      console.warn('Invalid response structure:', data);
      throw new Error('Invalid response structure from ERPNext API');
    }
  } catch (error) {
    console.error('Error creating serial and batch bundle:', error);
    throw error;
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

export const createBatch = async (batchNo: string, itemCode: string): Promise<boolean> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return false;

    const batchData = {
      batch_id: batchNo,
      item: itemCode,
      manufacturing_date: new Date().toISOString().split('T')[0]
    };

    const url = `${api.getBaseURL}/api/resource/Batch`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create batch:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating batch:', error);
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
