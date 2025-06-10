
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Scan, Package, Wifi, WifiOff } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { offlineStorage } from '@/services/offlineStorage';
import CameraScanner from './CameraScanner';

export interface Item {
  item_code: string;
  item_name: string;
  stock_uom: string;
}

interface ItemScannerProps {
  onItemSelect: (itemCode: string) => void;
}

const ItemScanner = ({ onItemSelect }: ItemScannerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchItems("", true);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchItems(searchQuery, true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch items with search and pagination
  const fetchItems = async (search: string = "", isNewSearch: boolean = false) => {
    setIsLoadingItems(true);
    try {
      console.log('Fetching items, search:', search, 'isNewSearch:', isNewSearch);
      
      // Try to get cached items first if offline
      if (!isOnline) {
        const cachedItems = await offlineStorage.getCachedData('items_list');
        if (cachedItems) {
          let filteredItems = cachedItems;
          if (search.trim()) {
            filteredItems = cachedItems.filter((item: Item) => 
              item.item_code.toLowerCase().includes(search.toLowerCase()) ||
              item.item_name.toLowerCase().includes(search.toLowerCase())
            );
          }
          setItems(filteredItems.slice(0, 20));
          setHasMore(filteredItems.length > 20);
          return;
        }
      }

      const erpnextAPI = await createERPNextAPI();
      if (erpnextAPI) {
        const defaultCompany = await getUserDefaultCompany();
        const pageToFetch = isNewSearch ? 1 : currentPage;
        
        let result;
        if (search.trim()) {
          console.log('Searching items with term:', search);
          // Use the fixed searchItems method
          result = await erpnextAPI.searchItems(search, defaultCompany || undefined, 20);
        } else {
          console.log('Fetching paginated items, page:', pageToFetch);
          // Use the fixed getItemsPaginated method
          result = await erpnextAPI.getItemsPaginated(
            [['disabled', '=', '0']],
            ['item_code', 'item_name', 'stock_uom'],
            defaultCompany || undefined,
            20,
            pageToFetch
          );
        }
        
        console.log('API result:', result);
        
        if (result.data) {
          if (isNewSearch) {
            setItems(result.data);
            setCurrentPage(1);
            
            if (!search.trim()) {
              await offlineStorage.cacheData('items_list', result.data, 3600000);
            }
          } else {
            setItems(prev => [...prev, ...result.data]);
          }
          
          setHasMore(result.data.length === 20);
          
          if (!isNewSearch) {
            setCurrentPage(prev => prev + 1);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      try {
        const cachedItems = await offlineStorage.getCachedData('items_list');
        if (cachedItems) {
          let filteredItems = cachedItems;
          if (search.trim()) {
            filteredItems = cachedItems.filter((item: Item) => 
              item.item_code.toLowerCase().includes(search.toLowerCase()) ||
              item.item_name.toLowerCase().includes(search.toLowerCase())
            );
          }
          setItems(filteredItems.slice(0, 20));
          setHasMore(filteredItems.length > 20);
        }
      } catch (cacheError) {
        console.error('Cache access failed:', cacheError);
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
    onItemSelect(barcode);
  };

  const loadMore = () => {
    if (!isLoadingItems && hasMore) {
      fetchItems(searchQuery, false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Select Item</span>
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by item code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowScanner(true)}
              className="flex items-center space-x-2"
            >
              <Scan className="w-4 h-4" />
              <span>Scan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {isLoadingItems && items.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading items...</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center p-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No items found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={`${item.item_code}-${index}`}
                    onClick={() => onItemSelect(item.item_code)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.item_code}</p>
                        <p className="text-gray-600 text-xs mt-1">{item.item_name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.stock_uom}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={isLoadingItems}
                      className="w-full"
                    >
                      {isLoadingItems ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraScanner
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ItemScanner;
