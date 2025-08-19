
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        
        // Call the ERPNext dashboard edge function
        const { data: erpMetrics, error: erpError } = await supabase.functions.invoke('erpnext-dashboard');
        
        if (erpError) {
          console.error('ERPNext dashboard error:', erpError);
          setError(erpError.message || 'Failed to fetch ERPNext data');
          
          // Fallback to mock data on error
          setDashboardStats({
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
          setOperationalMetrics({
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
          setFinancialMetrics({
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
          setStockAgingData({
            items_count: 0,
            aged_30_days: 0,
            aged_90_days: 0,
          });
        } else if (erpMetrics?.data) {
          // Use real ERPNext data
          const metrics = erpMetrics.data;
          
          setDashboardStats({
            totalSales: 0, // Not calculated in current implementation
            totalPurchase: 0, // Not calculated in current implementation
            totalItems: metrics.totalItems,
            totalCustomers: 0, // Not calculated in current implementation
            revenueGrowth: 0, // Not calculated in current implementation
            inventoryValue: metrics.totalStockValue,
            lowStockItems: metrics.lowStockItems,
            pendingOrders: metrics.pendingOrders,
            totalWarehouses: metrics.totalWarehouses,
            totalStockValue: metrics.totalStockValue,
          });
          
          setOperationalMetrics({
            salesThisMonth: 0, // Not calculated in current implementation
            salesLastMonth: 0, // Not calculated in current implementation
            ordersThisMonth: 0, // Not calculated in current implementation
            ordersLastMonth: 0, // Not calculated in current implementation
            deliveriesThisMonth: 0, // Not calculated in current implementation
            openDeliveries: 0, // Not calculated in current implementation
            purchasesThisMonth: 0, // Not calculated in current implementation
            openPurchases: metrics.pendingOrders,
            pickAccuracy: metrics.operationalMetrics.pickAccuracy,
            putawaySpeed: metrics.operationalMetrics.putawaySpeed,
            cycleCountAccuracy: metrics.operationalMetrics.cycleCountAccuracy,
            orderFulfillmentRate: metrics.operationalMetrics.orderFulfillmentRate,
            warehouseUtilization: metrics.operationalMetrics.warehouseUtilization,
            averageProcessingTime: metrics.operationalMetrics.averageProcessingTime,
          });
          
          setFinancialMetrics({
            grossProfit: 0, // Not calculated in current implementation
            grossProfitMargin: 0, // Not calculated in current implementation
            outstandingAmount: 0, // Not calculated in current implementation
            averageCollectionPeriod: 0, // Not calculated in current implementation
            stockTurnoverRatio: metrics.stockTurnoverRatio,
            carryingCostPercentage: metrics.carryingCostPercentage,
            deadStockValue: metrics.deadStockValue,
            abcAnalysis: {
              classA: 80, // Placeholder values
              classB: 15,
              classC: 5,
            },
          });
          
          setStockAgingData(metrics.stockAgingData);
        }

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
      
      // For now, use mock data for recent activities
      // In future, this could be enhanced to fetch real transaction data from ERPNext
      const activitiesResult = {
        data: [
          {
            id: 'act1',
            type: 'sales_order',
            reference: 'Loading...',
            description: 'Fetching recent activities from ERPNext',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            title: 'Recent activities loading...',
            subtitle: 'Please wait while we fetch your latest transactions',
            time: 'Just now'
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
    // Re-fetch dashboard data
    setIsLoading(true);
    try {
      const { data: erpMetrics, error: erpError } = await supabase.functions.invoke('erpnext-dashboard');
      
      if (!erpError && erpMetrics?.data) {
        const metrics = erpMetrics.data;
        
        setDashboardStats({
          totalSales: 0,
          totalPurchase: 0,
          totalItems: metrics.totalItems,
          totalCustomers: 0,
          revenueGrowth: 0,
          inventoryValue: metrics.totalStockValue,
          lowStockItems: metrics.lowStockItems,
          pendingOrders: metrics.pendingOrders,
          totalWarehouses: metrics.totalWarehouses,
          totalStockValue: metrics.totalStockValue,
        });
        
        setOperationalMetrics({
          salesThisMonth: 0,
          salesLastMonth: 0,
          ordersThisMonth: 0,
          ordersLastMonth: 0,
          deliveriesThisMonth: 0,
          openDeliveries: 0,
          purchasesThisMonth: 0,
          openPurchases: metrics.pendingOrders,
          pickAccuracy: metrics.operationalMetrics.pickAccuracy,
          putawaySpeed: metrics.operationalMetrics.putawaySpeed,
          cycleCountAccuracy: metrics.operationalMetrics.cycleCountAccuracy,
          orderFulfillmentRate: metrics.operationalMetrics.orderFulfillmentRate,
          warehouseUtilization: metrics.operationalMetrics.warehouseUtilization,
          averageProcessingTime: metrics.operationalMetrics.averageProcessingTime,
        });
        
        setFinancialMetrics({
          grossProfit: 0,
          grossProfitMargin: 0,
          outstandingAmount: 0,
          averageCollectionPeriod: 0,
          stockTurnoverRatio: metrics.stockTurnoverRatio,
          carryingCostPercentage: metrics.carryingCostPercentage,
          deadStockValue: metrics.deadStockValue,
          abcAnalysis: {
            classA: 80,
            classB: 15,
            classC: 5,
          },
        });
        
        setStockAgingData(metrics.stockAgingData);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
