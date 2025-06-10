
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextAccountsAPI extends ERPNextBaseAPI {
  async getAccounts(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Account', filters);
  }
}
