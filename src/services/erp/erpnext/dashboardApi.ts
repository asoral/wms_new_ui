
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextDashboardAPI extends ERPNextBaseAPI {
  /**
   * Get dashboard data for various modules
   */
  async getDashboardData(moduleName?: string): Promise<ERPNextResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (moduleName) {
        params.append('module', moduleName);
      }

      const response = await fetch(
        `${this.baseURL}/api/method/frappe.desk.desktop.get_desktop_page?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      return { data: null };
    }
  }

  /**
   * Get stock summary for dashboard
   */
  async getStockSummary(): Promise<ERPNextResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.stock.dashboard.stock_dashboard.get_data`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stock summary: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Stock summary fetch error:', error);
      return { data: null };
    }
  }

  /**
   * Get buying dashboard data
   */
  async getBuyingDashboard(): Promise<ERPNextResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.buying.dashboard.buying_dashboard.get_data`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch buying dashboard: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Buying dashboard fetch error:', error);
      return { data: null };
    }
  }

  /**
   * Get selling dashboard data
   */
  async getSellingDashboard(): Promise<ERPNextResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.selling.dashboard.selling_dashboard.get_data`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch selling dashboard: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Selling dashboard fetch error:', error);
      return { data: null };
    }
  }

  /**
   * Get accounts dashboard data
   */
  async getAccountsDashboard(): Promise<ERPNextResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.accounts.dashboard.accounts_dashboard.get_data`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts dashboard: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Accounts dashboard fetch error:', error);
      return { data: null };
    }
  }

  /**
   * Get manufacturing dashboard data
   */
  async getManufacturingDashboard(): Promise<ERPNextResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.manufacturing.dashboard.manufacturing_dashboard.get_data`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch manufacturing dashboard: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Manufacturing dashboard fetch error:', error);
      return { data: null };
    }
  }
}
