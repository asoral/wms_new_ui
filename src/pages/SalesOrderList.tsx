import React, { useState, useEffect } from 'react';
import { useERPNextAPI } from '@/hooks/useERPNextAPI';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Calendar, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  status: string;
  grand_total: number;
  delivery_date: string;
  transaction_date: string;
  per_delivered: number;
  total_qty: number;
}

const SalesOrderList = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const erpnextAPI = useERPNextAPI();
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const filters = [
        ['docstatus', '=', 1], // Only submitted orders
        ['status', '!=', 'Closed'], // Exclude closed orders
        ['per_delivered', '<', 100] // Orders with pending delivery
      ];

      const response = await erpnextAPI.callAPI(
        (api) => api.sales.getSalesOrders(filters, undefined, 100)
      );
      
      if (response?.data && Array.isArray((response.data as any)?.data)) {
        setSalesOrders((response.data as any).data);
      } else {
        setSalesOrders([]);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSalesOrders();
      return;
    }

    try {
      setLoading(true);
      const response = await erpnextAPI.callAPI(
        (api) => api.sales.searchSalesOrders(searchTerm)
      );
      
      if (response?.data && Array.isArray((response.data as any)?.data)) {
        setSalesOrders((response.data as any).data);
      } else {
        setSalesOrders([]);
      }
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to search sales orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'To Deliver and Bill': 'bg-yellow-100 text-yellow-800',
      'To Deliver': 'bg-blue-100 text-blue-800',
      'To Bill': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Closed': 'bg-red-100 text-red-800'
    };

    return (
      <Badge 
        variant="secondary" 
        className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
      >
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Orders</h1>
        <Button onClick={fetchSalesOrders} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Sales Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by SO number, customer, or PO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search</Button>
            <Button variant="outline" onClick={() => { setSearchTerm(''); fetchSalesOrders(); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {salesOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No sales orders found</p>
            </CardContent>
          </Card>
        ) : (
          salesOrders.map((so) => (
            <Card key={so.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{so.name}</h3>
                    <p className="text-muted-foreground">{so.customer_name || so.customer}</p>
                  </div>
                  {getStatusBadge(so.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Qty:</span>
                    <span className="font-medium">{so.total_qty}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{formatCurrency(so.grand_total)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="font-medium">{formatDate(so.transaction_date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Delivery:</span>
                    <span className="font-medium">{formatDate(so.delivery_date)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Delivered: {so.per_delivered}%
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${so.per_delivered}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesOrderList;