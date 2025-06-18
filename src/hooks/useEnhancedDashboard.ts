
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useToast } from './use-toast';

// Define proper types for dashboard metrics
export interface DashboardStats {
  totalSales: number;
  totalPurchase: number;
  totalItems: number;
  totalCustomers: number;
  revenueGrowth: number;
  inventoryValue: number;
  lowStockItems: number;
  pendingOrders: number;
  totalWarehouses: number;
  totalStockValue: number;
}

export interface OperationalMetrics {
  salesThisMonth: number;
  salesLastMonth: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  deliveriesThisMonth: number;
  openDeliveries: number;
  purchasesThisMonth: number;
  openPurchases: number;
  pickAccuracy: number;
  putawaySpeed: number;
  cycleCountAccuracy: number;
  orderFulfillmentRate: number;
  warehouseUtilization: number;
  averageProcessingTime: number;
}

export interface FinancialMetrics {
  grossProfit: number;
  grossProfitMargin: number;
  outstandingAmount: number;
  averageCollectionPeriod: number;
  stockTurnoverRatio: number;
  carryingCostPercentage: number;
  deadStockValue: number;
  abcAnalysis: {
    classA: number;
    classB: number;
    classC: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'sales_order' | 'purchase_order' | 'delivery' | 'receipt' | 'payment';
  reference: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  title: string;
  subtitle: string;
  time: string;
}

export interface StockAgingData {
  items_count: number;
  aged_30_days: number;
  aged_90_days: number;
}

export function useEnhancedDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchase: 0,
    totalItems: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    inventoryValue: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    totalWarehouses: 0,
    totalStockValue: 0,
  });

  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>({
    salesThisMonth: 0,
    salesLastMonth: 0,
    ordersThisMonth: 0,
    ordersLastMonth: 0,
    deliveriesThisMonth: 0,
    openDeliveries: 0,
    purchasesThisMonth: 0,
    openPurchases: 0,
    pickAccuracy: 0,
    putawaySpeed: 0,
    cycleCountAccuracy: 0,
    orderFulfillmentRate: 0,
    warehouseUtilization: 0,
    averageProcessingTime: 0,
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    grossProfit: 0,
    grossProfitMargin: 0,
    outstandingAmount: 0,
    averageCollectionPeriod: 0,
    stockTurnoverRatio: 0,
    carryingCostPercentage: 0,
    deadStockValue: 0,
    abcAnalysis: {
      classA: 0,
      classB: 0,
      classC: 0,
    },
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [stockAgingData, setStockAgingData] = useState<StockAgingData>({
    items_count: 0,
    aged_30_days: 0,
    aged_90_days: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError('');
        
        const api = await createERPNextAPI();
        if (!api) {
          setError('ERPNext API not configured');
          setIsLoading(false);
          return;
        }

        const company = await getUserDefaultCompany();

        // Mock data for dashboard stats - these would normally come from API calls
        const dashboardResult = {
          data: {
            totalSales: 5678900,
            totalPurchase: 4523400,
            totalItems: 1245,
            totalCustomers: 487,
            revenueGrowth: 8.7,
            inventoryValue: 3245600,
            lowStockItems: 45,
            pendingOrders: 12,
            totalWarehouses: 8,
            totalStockValue: 3245600
          }
        };
        
        const operationalResult = {
          data: {
            salesThisMonth: 875400,
            salesLastMonth: 812300,
            ordersThisMonth: 124,
            ordersLastMonth: 103,
            deliveriesThisMonth: 98,
            openDeliveries: 26,
            purchasesThisMonth: 654200,
            openPurchases: 14,
            pickAccuracy: 98.5,
            putawaySpeed: 45.2,
            cycleCountAccuracy: 99.1,
            orderFulfillmentRate: 96.8,
            warehouseUtilization: 78.3,
            averageProcessingTime: 24.5
          }
        };
        
        const financialResult = {
          data: {
            grossProfit: 1998600,
            grossProfitMargin: 35.2,
            outstandingAmount: 876500,
            averageCollectionPeriod: 28.4,
            stockTurnoverRatio: 4.2,
            carryingCostPercentage: 12.5,
            deadStockValue: 145600,
            abcAnalysis: {
              classA: 65,
              classB: 25,
              classC: 10
            }
          }
        };

        setDashboardStats(dashboardResult.data as DashboardStats);
        setOperationalMetrics(operationalResult.data as OperationalMetrics);
        setFinancialMetrics(financialResult.data as FinancialMetrics);
        setStockAgingData({
          items_count: 1245,
          aged_30_days: 123,
          aged_90_days: 45
        });

        // Load recent activities
        await loadRecentActivities();

      } catch (error) {
        console.error('Error fetching enhanced dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        toast({
          title: 'Error',
          description: 'Failed to load enhanced dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  const loadRecentActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const api = await createERPNextAPI();
      if (!api) return;

      // Mock data for recent activities
      const activitiesResult = {
        data: [
          {
            id: 'act1',
            type: 'sales_order',
            reference: 'SO-2023-0034',
            description: 'New order from ABC Corp',
            amount: 12450,
            date: '2023-05-14',
            status: 'To Deliver',
            title: 'Sales Order SO-2023-0034',
            subtitle: 'New order from ABC Corp',
            time: '2 hours ago'
          },
          {
            id: 'act2',
            type: 'delivery',
            reference: 'DN-2023-0067',
            description: 'Delivery to XYZ Ltd.',
            amount: 8760,
            date: '2023-05-13',
            status: 'completed',
            title: 'Delivery Note DN-2023-0067',
            subtitle: 'Delivery to XYZ Ltd.',
            time: '4 hours ago'
          },
          {
            id: 'act3',
            type: 'purchase_order',
            reference: 'PO-2023-0054',
            description: 'Office supplies from Vendor Inc',
            amount: 3200,
            date: '2023-05-12',
            status: 'pending',
            title: 'Purchase Order PO-2023-0054',
            subtitle: 'Office supplies from Vendor Inc',
            time: '1 day ago'
          }
        ]
      };

      setActivities(activitiesResult.data as RecentActivity[]);
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const refreshData = async () => {
    // Refresh all data
    window.location.reload();
  };

  return {
    dashboardStats,
    operationalMetrics,
    financialMetrics,
    activities,
    stockAgingData,
    isLoading,
    isLoadingActivities,
    error,
    loadRecentActivities,
    refreshData,
    // Backward compatibility aliases
    stats: dashboardStats,
    recentActivities: activities,
  };
}
