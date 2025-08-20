
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any): Promise<ERPNextResponse<any[]>> {
    const params = this.buildQueryParams(filters);
    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stock Balance API Error:', response.status, errorText);
      throw new Error(`Failed to fetch stock balance: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string): Promise<ERPNextResponse<any>> {
    const filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];
    
    // Use only basic fields that are typically accessible
    const fields = [
      'name',
      'item_code', 
      'warehouse',
      'actual_qty',
      'reserved_qty',
      'planned_qty',
      'ordered_qty',
      'projected_qty'
    ];
    
    const params = this.buildQueryParams(filters, fields);
    
    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Current Stock API Error:', response.status, errorText);
      throw new Error(`Failed to fetch current stock: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getBinStockForCompany(itemCode: string, company: string): Promise<ERPNextResponse<any[]>> {
    try {
      console.log('=== Getting bin stock for company ===');
      console.log('Item code:', itemCode);
      console.log('Company:', company);
      
      // Strategy 1: Try to get warehouses for company first (more reliable)
      let companyWarehouses: string[] = [];
      try {
        console.log('Trying to fetch warehouses for company...');
        const warehouseFilters = [['company', '=', company]];
        const warehouseParams = this.buildQueryParams(warehouseFilters, ['name'], 999);
        const warehouseUrl = `${this.baseURL}/api/resource/Warehouse?${warehouseParams}`;
        
        console.log('Warehouse URL:', warehouseUrl);
        const warehouseResponse = await fetch(warehouseUrl, {
          headers: this.getHeaders(),
        });

        if (warehouseResponse.ok) {
          const warehouseData = await warehouseResponse.json();
          companyWarehouses = warehouseData.data?.map((w: any) => w.name) || [];
          console.log(`Found ${companyWarehouses.length} warehouses for company:`, companyWarehouses);
        } else {
          console.log('Warehouse API failed, will try alternative approach');
        }
      } catch (warehouseError) {
        console.log('Warehouse fetch failed:', warehouseError);
      }

      // Strategy 2: Query bins with warehouse filter if we have warehouses
      if (companyWarehouses.length > 0 && companyWarehouses.length < 50) {
        console.log('Using warehouse-filtered approach');
        const binFilters = [
          ['item_code', '=', itemCode],
          ['warehouse', 'in', companyWarehouses]
        ];

        const binFields = [
          'name',
          'item_code',
          'warehouse', 
          'actual_qty',
          'reserved_qty',
          'planned_qty',
          'ordered_qty',
          'projected_qty',
          'creation',
          'modified'
        ];

        const binParams = this.buildQueryParams(binFilters, binFields, 999);
        const fullUrl = `${this.baseURL}/api/resource/Bin?${binParams}`;
        console.log('Warehouse-filtered URL:', fullUrl);
        
        const binResponse = await fetch(fullUrl, {
          headers: this.getHeaders(),
        });

        if (binResponse.ok) {
          const binResult = await binResponse.json();
          console.log(`Warehouse-filtered approach returned ${binResult.data?.length || 0} bins`);
          return binResult;
        } else {
          console.log('Warehouse-filtered approach failed, falling back...');
        }
      }

      // Strategy 3: Get all bins for item and filter client-side
      console.log('Using fallback approach - get all bins and filter client-side');
      const binFilters = [['item_code', '=', itemCode]];
      const binFields = [
        'name',
        'item_code',
        'warehouse', 
        'actual_qty',
        'reserved_qty',
        'planned_qty',
        'ordered_qty',
        'projected_qty',
        'creation',
        'modified'
      ];

      const binParams = this.buildQueryParams(binFilters, binFields, 999);
      const fullUrl = `${this.baseURL}/api/resource/Bin?${binParams}`;
      console.log('Fallback URL:', fullUrl);
      
      const binResponse = await fetch(fullUrl, {
        headers: this.getHeaders(),
      });

      if (!binResponse.ok) {
        const errorText = await binResponse.text();
        console.error('All bin approaches failed:', {
          status: binResponse.status,
          statusText: binResponse.statusText,
          errorText
        });
        throw new Error(`Failed to fetch bin stock: ${binResponse.status} ${binResponse.statusText} - ${errorText}`);
      }

      const binResult = await binResponse.json();
      console.log(`All bins approach returned ${binResult.data?.length || 0} bins`);
      
      // If we have company warehouses, filter by them
      if (companyWarehouses.length > 0 && binResult?.data) {
        console.log('Company warehouses to match against:', companyWarehouses.slice(0, 10)); // Show first 10
        console.log('Bin warehouses found:', binResult.data.map((bin: any) => bin.warehouse));
        
        const filteredData = binResult.data.filter((bin: any) => {
          const isMatch = companyWarehouses.includes(bin.warehouse);
          console.log(`Warehouse "${bin.warehouse}" match: ${isMatch}`);
          return isMatch;
        });
        console.log(`Filtered to ${filteredData.length} bins using known warehouses`);
        
        // If filtering removes everything, return unfiltered data with a warning
        if (filteredData.length === 0 && binResult.data.length > 0) {
          console.warn('Warehouse filtering removed all bins. Returning unfiltered data.');
          return binResult;
        }
        
        return { ...binResult, data: filteredData };
      }
      
      // If no warehouse filtering possible, return all bins 
      // (let the frontend show all locations and let user decide)
      console.log('No company filtering applied - returning all bins for this item');
      return binResult;

    } catch (error) {
      console.error('Error in getBinStockForCompany:', error);
      throw error;
    }
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stock Entry API Error:', response.status, errorText);
      throw new Error(`Failed to fetch stock entries: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStockLedgerEntries(itemCode: string, warehouses: string[]): Promise<ERPNextResponse<any[]>> {
    try {
      const filters = [
        ['item_code', '=', itemCode],
        ['warehouse', 'in', warehouses]
      ];

      const fields = [
        'name',
        'item_code',
        'warehouse',
        'valuation_rate',
        'stock_value',
        'qty_after_transaction',
        'posting_date',
        'posting_time'
      ];

      const params = this.buildQueryParams(filters, fields, 20);
      
      console.log('Fetching stock ledger with URL:', `${this.baseURL}/api/resource/Stock Ledger Entry?${params}`);
      
      const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stock Ledger API Error:', response.status, errorText);
        // Don't throw error, just return empty data
        return { data: [] };
      }

      const result = await response.json();
      console.log('Stock ledger data received:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getStockLedgerEntries:', error);
      return { data: [] };
    }
  }

  async getPickLists(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    // Include important fields including status
    const fields = [
      'name',
      'purpose',
      'company',
      'docstatus',
      'status',
      'creation',
      'owner',
      'material_request',
      'work_order'
    ];
    
    const params = this.buildQueryParams(finalFilters, fields, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to fetch pick lists: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPickList(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pick List Detail API Error:', response.status, errorText);
      throw new Error(`Failed to fetch pick list: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createPickList(data: any): Promise<ERPNextResponse<any>> {
    console.log('Creating Pick List with data:', data);
    
    const response = await fetch(`${this.baseURL}/api/resource/Pick List`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to create pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Pick List created successfully:', result);
    return result;
  }

  async updatePickList(name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to update pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getItemLocations(pickListName: string): Promise<ERPNextResponse<any>> {
    console.log('Calling get_item_locations for pick list:', pickListName);
    
    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.pick_list.pick_list.get_item_locations`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pick_list: pickListName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get Item Locations API Error:', response.status, errorText);
      throw new Error(`Failed to get item locations: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Get item locations result:', result);
    return result;
  }

  async submitPickList(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docstatus: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Submit Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to submit pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Call ERPNext server method
  async callMethod(doctype: string, docname: string, method: string, args: any = {}): Promise<ERPNextResponse<any>> {
    let apiEndpoint;
    
    // Handle different method endpoints
    if (method === 'get_item_locations') {
      apiEndpoint = `${this.baseURL}/api/method/erpnext.stock.doctype.pick_list.pick_list.get_item_locations`;
    } else {
      apiEndpoint = `${this.baseURL}/api/method/erpnext.stock.doctype.pick_list.pick_list.${method}`;
    }
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doc: docname,
        doctype: doctype,
        ...args
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Call Method API Error (${method}):`, response.status, errorText);
      throw new Error(`Failed to call method ${method}: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Delete Pick List
  async deletePickList(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to delete pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}
