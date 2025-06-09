import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { CalendarRange, CreditCard, PackageOpen, ShoppingCart } from "lucide-react";
import { createERPNextAPI } from '@/services/erpnextApi';

interface StockAgingData {
  total_value: number;
  items_count: number;
  aged_30_days: number;
  aged_60_days: number;
  aged_90_days: number;
}

const Home = () => {
  const [stockAgingData, setStockAgingData] = useState<StockAgingData>({
    total_value: 0,
    items_count: 0,
    aged_30_days: 0,
    aged_60_days: 0,
    aged_90_days: 0
  });

  useEffect(() => {
    fetchStockAgingData();
  }, []);

  const fetchStockAgingData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        return;
      }

      const result = await erpnextAPI.getStockAgingReport();
      
      if (result && result.data && Array.isArray(result.data)) {
        // Process the data to extract meaningful metrics
        const processedData: StockAgingData = {
          total_value: result.data.reduce((sum: number, item: any) => sum + (item.value || 0), 0),
          items_count: result.data.length,
          aged_30_days: result.data.filter((item: any) => item.age > 30).length,
          aged_60_days: result.data.filter((item: any) => item.age > 60).length,
          aged_90_days: result.data.filter((item: any) => item.age > 90).length
        };
        setStockAgingData(processedData);
      } else {
        // Set default values if no data
        setStockAgingData({
          total_value: 0,
          items_count: 0,
          aged_30_days: 0,
          aged_60_days: 0,
          aged_90_days: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stock aging data:', error);
      // Set default values on error
      setStockAgingData({
        total_value: 0,
        items_count: 0,
        aged_30_days: 0,
        aged_60_days: 0,
        aged_90_days: 0
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Stock Value"
          value={`$${stockAgingData.total_value.toFixed(2)}`}
          icon={PackageOpen}
        />
        <MetricCard
          title="Total Items in Stock"
          value={stockAgingData.items_count.toString()}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Items Aged > 30 Days"
          value={stockAgingData.aged_30_days.toString()}
          icon={CalendarRange}
        />
        <MetricCard
          title="Potential Revenue"
          value="$12,750"
          icon={CreditCard}
        />
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Stock Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Here's a breakdown of your stock aging:
            </p>
            <ul className="list-disc pl-5 mt-4">
              <li>{stockAgingData.aged_30_days} items aged over 30 days</li>
              <li>{stockAgingData.aged_60_days} items aged over 60 days</li>
              <li>{stockAgingData.aged_90_days} items aged over 90 days</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button>Generate Report</Button>
      </div>
    </div>
  );
};

export default Home;
