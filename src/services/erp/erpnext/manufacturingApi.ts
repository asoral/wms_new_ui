
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextManufacturingAPI extends ERPNextBaseAPI {
  async getWorkOrders(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Work Order', filters);
  }
}
