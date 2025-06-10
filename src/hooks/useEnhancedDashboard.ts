
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  totalWarehouses: number;
  totalStockValue: number;
  recentActivitiesCount: number;
}

interface RecentActivity {
  id: string;
  type: 'receipt' | 'delivery' | 'stock_entry' | 'material_request';
  title: string;
  subtitle: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
  reference: string;
}

interface OperationalMetrics {
  pickAccuracy: number;
  putawaySpeed: number;
  cycleCountAccuracy: number;
  orderFulfillmentRate: number;
  warehouseUtilization: number;
  averageProcessingTime: number;
}

interface FinancialMetrics {
  stockTurnoverRatio: number;
  carryingCostPercentage: number;
  deadStockValue: number;
  abcAnalysis: {
    classA: number;
    classB: number;
    classC: number;
  };
}

interface StockAgingData {
  total_value: number;
  items_count: number;
  aged_30_days: number;
  aged_60_days: number;
  aged_90_days: number;
}

export const useEnhancedDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    totalWarehouses: 0,
    totalStockValue: 0,
    recentActivitiesCount: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>({
    pickAccuracy: 0,
    putawaySpeed: 0,
    cycleCountAccuracy: 0,
    orderFulfillmentRate: 0,
    warehouseUtilization: 0,
    averageProcessingTime: 0
  });
  
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    stockTurnoverRatio: 0,
    carryingCostPercentage: 0,
    deadStockValue: 0,
    abcAnalysis: {
      classA: 0,
      classB: 0,
      classC: 0
    }
  });
  
  const [stockAgingData, setStockAgingData] = useState<StockAgingData>({
    total_value: 0,
    items_count: 0,
    aged_30_days: 0,
    aged_60_days: 0,
    aged_90_days: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        setError('ERPNext API not configured');
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      
      // Fetch dashboard data without stock aging report (due to permission issues)
      const [dashboardStats, operationalData, financialData] = await Promise.all([
        erpnextAPI.getDashboardMetrics(defaultCompany || undefined),
        erpnextAPI.getOperationalMetrics(defaultCompany || undefined),
        erpnextAPI.getFinancialMetrics(defaultCompany || undefined)
      ]);

      setStats(dashboardStats);
      setOperationalMetrics(operationalData);
      setFinancialMetrics(financialData);

      // Set default stock aging data since the report is not accessible
      setStockAgingData({
        total_value: 0,
        items_count: 0,
        aged_30_days: 0,
        aged_60_days: 0,
        aged_90_days: 0
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        setRecentActivities([]);
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      const activities = await erpnextAPI.getRecentActivities(defaultCompany || undefined, 10);
      setRecentActivities(activities);
      
      // Update activities count in stats
      setStats(prev => ({ ...prev, recentActivitiesCount: activities.length }));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchDashboardData(), fetchRecentActivities()]);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  return {
    stats,
    recentActivities,
    operationalMetrics,
    financialMetrics,
    stockAgingData,
    isLoading,
    isLoadingActivities,
    error,
    refreshData,
    fetchDashboardData,
    fetchRecentActivities
  };
};
