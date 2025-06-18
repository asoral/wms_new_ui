
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
}

export interface FinancialMetrics {
  grossProfit: number;
  grossProfitMargin: number;
  outstandingAmount: number;
  averageCollectionPeriod: number;
}

export interface RecentActivity {
  id: string;
  type: 'sales_order' | 'purchase_order' | 'delivery' | 'receipt' | 'payment';
  reference: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

export function useEnhancedDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchase: 0,
    totalItems: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    inventoryValue: 0,
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
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    grossProfit: 0,
    grossProfitMargin: 0,
    outstandingAmount: 0,
    averageCollectionPeriod: 0,
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const api = await createERPNextAPI();
        if (!api) {
          setError('ERPNext API not configured');
          setIsLoading(false);
          return;
        }

        const company = await getUserDefaultCompany();

        // Mock data for dashboard stats - these would normally come from API calls
        // In a real implementation, replace these with actual API calls
        const dashboardResult = {
          data: {
            totalSales: 5678900,
            totalPurchase: 4523400,
            totalItems: 1245,
            totalCustomers: 487,
            revenueGrowth: 8.7,
            inventoryValue: 3245600
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
            openPurchases: 14
          }
        };
        
        const financialResult = {
          data: {
            grossProfit: 1998600,
            grossProfitMargin: 35.2,
            outstandingAmount: 876500,
            averageCollectionPeriod: 28.4
          }
        };

        // In a real implementation, these would be API calls
        // For now, we're just using mock data
        // api.getDashboardMetrics()
        // api.getOperationalMetrics()
        // api.getFinancialMetrics()
        
        setDashboardStats(dashboardResult.data as DashboardStats);
        setOperationalMetrics(operationalResult.data as OperationalMetrics);
        setFinancialMetrics(financialResult.data as FinancialMetrics);

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
            status: 'To Deliver'
          },
          {
            id: 'act2',
            type: 'delivery',
            reference: 'DN-2023-0067',
            description: 'Delivery to XYZ Ltd.',
            amount: 8760,
            date: '2023-05-13',
            status: 'Completed'
          },
          {
            id: 'act3',
            type: 'purchase_order',
            reference: 'PO-2023-0054',
            description: 'Office supplies from Vendor Inc',
            amount: 3200,
            date: '2023-05-12',
            status: 'To Receive'
          },
          {
            id: 'act4',
            type: 'payment',
            reference: 'PAY-2023-0097',
            description: 'Payment received from DEF Industries',
            amount: 24700,
            date: '2023-05-11',
            status: 'Completed'
          },
          {
            id: 'act5',
            type: 'receipt',
            reference: 'PREC-2023-0042',
            description: 'Inventory received from Supplier Co',
            amount: 15600,
            date: '2023-05-10',
            status: 'Completed'
          }
        ]
      };

      // In a real implementation, this would be an API call
      // const activitiesResult = await api.getRecentActivities();
      
      setActivities(activitiesResult.data as RecentActivity[]);
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  return {
    dashboardStats,
    operationalMetrics,
    financialMetrics,
    activities,
    isLoading,
    error,
    loadRecentActivities,
  };
}
