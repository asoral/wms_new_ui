
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextSupportAPI extends ERPNextBaseAPI {
  async getIssues(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Issue', filters);
  }
}
