
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextAuthAPI extends ERPNextBaseAPI {
  async testConnection(): Promise<boolean> {
    return super.testConnection();
  }

  async getLoggedInUserDetails(): Promise<ERPNextResponse<any>> {
    return super.getLoggedInUserDetails();
  }
}
