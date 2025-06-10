
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextCRMAPI extends ERPNextBaseAPI {
  async getLeads(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Lead', filters);
  }
}
