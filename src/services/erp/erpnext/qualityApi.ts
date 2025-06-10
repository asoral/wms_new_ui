
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextQualityAPI extends ERPNextBaseAPI {
  async getQualityInspections(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Quality Inspection', filters);
  }

  async getQualityInspectionsPending(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['status', '=', 'Submitted']];
    if (company) {
      filters.push(['company', '=', company]);
    }
    return this.getDocumentList('Quality Inspection', filters);
  }
}
