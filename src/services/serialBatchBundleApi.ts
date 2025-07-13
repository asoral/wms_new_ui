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
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    console.log(`Fetching batches for item: ${itemCode}, warehouse: ${warehouse}`);

    // Use the proper ERPNext method that's used in the frontend for batch selection
    // This method returns batches with qty available in specific warehouse and filters expired batches
    const url = `${api.getBaseURL}/api/method/erpnext.stock.doctype.batch.batch.get_batch_qty`;
    
    const params = new URLSearchParams({
      item_code: itemCode,
      warehouse: warehouse,
      posting_date: new Date().toISOString().split('T')[0], // Today's date for expiry filtering
      posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8) // Current time
    });

    console.log('Calling get_batch_qty with params:', Object.fromEntries(params));

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch batch quantities:', response.status, response.statusText);
      
      // Fallback to manual filtering if the direct method fails
      return await fetchBatchesManualFilter(itemCode, warehouse);
    }

    const data = await response.json();
    console.log('get_batch_qty response:', data);

    if (data?.message && typeof data.message === 'object') {
      // The response contains batch_no as keys and qty as values
      const batches = Object.entries(data.message)
        .filter(([batchNo, qty]) => parseFloat(qty as string) > 0)
        .map(([batchNo, qty]) => ({
          batch_no: batchNo,
          qty: parseFloat(qty as string)
        }));

      // Get expiry dates for the batches
      const batchesWithExpiry = await Promise.all(
        batches.map(async (batch) => {
          try {
            const batchDetailUrl = `${api.getBaseURL}/api/resource/Batch/${batch.batch_no}`;
            const batchResponse = await fetch(batchDetailUrl, {
              headers: {
                'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
                'Content-Type': 'application/json'
              }
            });

            if (batchResponse.ok) {
              const batchData = await batchResponse.json();
              return {
                ...batch,
                expiry_date: batchData.data?.expiry_date || null
              };
            }
            return batch;
          } catch (error) {
            console.error(`Error fetching expiry for batch ${batch.batch_no}:`, error);
            return batch;
          }
        })
      );

      console.log('Final batches with expiry dates:', batchesWithExpiry);
      return batchesWithExpiry;
    }

    console.warn('No batch quantities found or invalid response format');
    return [];

  } catch (error) {
    console.error('Error in get_batch_qty, falling back to manual filter:', error);
    // Fallback to manual filtering
    return await fetchBatchesManualFilter(itemCode, warehouse);
  }
};

// Fallback method using manual filtering
const fetchBatchesManualFilter = async (itemCode: string, warehouse: string): Promise<BatchInfo[]> => {
  try {
    const api = await createERPNextAPI();
    if (!api) return [];

    console.log('Using manual batch filtering fallback');

    // Get current date for filtering expired batches
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date for expiry filtering:', today);

    // First get all batches for the item that are not expired and not disabled
    const batchUrl = `${api.getBaseURL}/api/method/frappe.client.get_list`;
    
    const batchFilters = [
      ['item', '=', itemCode],
      ['disabled', '=', 0]
    ];

    // Add expiry date filter to exclude expired batches
    batchFilters.push(['ifnull(expiry_date, "2099-12-31")', '>', today]);

    const batchBody = {
      doctype: 'Batch',
      fields: ['name', 'expiry_date'],
      filters: batchFilters,
      limit_page_length: 1000
    };

    console.log('Fetching non-expired batches:', batchBody);

    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchBody)
    });

    if (!batchResponse.ok) {
      console.error('Failed to fetch batches:', batchResponse.status, batchResponse.statusText);
      return [];
    }

    const batchData = await batchResponse.json();
    console.log('Non-expired batches response:', batchData);

    if (!batchData?.message || !Array.isArray(batchData.message)) {
      console.warn('No valid batches found');
      return [];
    }

    // Now check stock balance for each batch in the specific warehouse
    const stockPromises = batchData.message.map(async (batch: any) => {
      try {
        const stockUrl = `${api.getBaseURL}/api/method/erpnext.stock.utils.get_stock_balance`;
        const stockParams = new URLSearchParams({
          item_code: itemCode,
          warehouse: warehouse,
          batch_no: batch.name
        });

        const stockResponse = await fetch(`${stockUrl}?${stockParams}`, {
          headers: {
            'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
            'Content-Type': 'application/json'
          }
        });

        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          const qty = parseFloat(stockData.message) || 0;
          
          console.log(`Batch ${batch.name}: qty=${qty}, expiry=${batch.expiry_date}, warehouse=${warehouse}`);
          
          if (qty > 0) {
            return {
              batch_no: batch.name,
              qty: qty,
              expiry_date: batch.expiry_date
            };
          }
        } else {
          console.error(`Failed to get stock for batch ${batch.name}:`, stockResponse.status);
        }
        return null;
      } catch (error) {
        console.error(`Error checking stock for batch ${batch.name}:`, error);
        return null;
      }
    });

    const stockResults = await Promise.all(stockPromises);
    const validBatches = stockResults.filter(batch => batch !== null);

    console.log(`Manual filter result: ${validBatches.length} valid batches in warehouse ${warehouse}:`, validBatches);
    return validBatches;

  } catch (error) {
    console.error('Error in manual batch filtering:', error);
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
