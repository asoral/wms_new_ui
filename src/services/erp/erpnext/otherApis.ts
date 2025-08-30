
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, PickList, PackingSlip, QualityInspection, ProductBundle } from './types';

export class ERPNextOtherAPIs extends ERPNextBaseAPI {
  async getPickLists(filters?: any, company?: string, limitPageLength?: number, orderBy?: string): Promise<ERPNextResponse<PickList[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    // Default to last 5 records ordered by creation date for performance
    const limit = limitPageLength || 5;
    const order = orderBy || 'creation desc';
    
    const params = this.buildQueryParams(finalFilters, undefined, limit, order);

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async getPackingSlips(filters?: any, company?: string, limitPageLength?: number, orderBy?: string): Promise<ERPNextResponse<PackingSlip[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    // Default to last 5 records ordered by creation date for performance
    const limit = limitPageLength || 5;
    const order = orderBy || 'creation desc';
    
    const params = this.buildQueryParams(finalFilters, undefined, limit, order);

    const response = await fetch(`${this.baseURL}/api/resource/Packing Slip?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packing slips: ${response.statusText}`);
    }

    return response.json();
  }

  async getQualityInspections(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<QualityInspection[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quality inspections: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductBundles(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<ProductBundle[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Product Bundle?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product bundles: ${response.statusText}`);
    }

    return response.json();
  }

  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    try {
      const params = this.buildQueryParams([['name', '=', batchNo], ['item', '=', itemCode]]);

      const response = await fetch(`${this.baseURL}/api/resource/Batch?${params}`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          return true;
        }
      }

      const createResponse = await fetch(`${this.baseURL}/api/resource/Batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          batch_id: batchNo,
          item: itemCode
        })
      });

      return createResponse.ok;
    } catch (error) {
      console.error('Error validating batch:', error);
      return false;
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse: string): Promise<boolean> {
    try {
      const params = this.buildQueryParams([['name', '=', serialNo], ['item_code', '=', itemCode]]);

      const response = await fetch(`${this.baseURL}/api/resource/Serial No?${params}`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          return true;
        }
      }

      const createResponse = await fetch(`${this.baseURL}/api/resource/Serial No`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        })
      });

      return createResponse.ok;
    } catch (error) {
      console.error('Error validating serial:', error);
      return false;
    }
  }
}
