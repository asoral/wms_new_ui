
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextAssetsAPI extends ERPNextBaseAPI {
  async getAssets(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    return this.getDocumentList('Asset', filters);
  }
}
