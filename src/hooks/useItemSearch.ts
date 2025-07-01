
import { useState, useEffect } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types';

export const useItemSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchItems();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchItems = async () => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Check if it's a barcode search (numeric)
      if (/^\d+$/.test(searchQuery)) {
        const barcodeResult = await erpnextAPI.searchItemsByBarcode(searchQuery);
        if (barcodeResult.data && barcodeResult.data.length > 0) {
          setSearchResults(barcodeResult.data);
          return;
        }
      }

      // Regular search by name/code
      const searchResult = await erpnextAPI.searchItems(searchQuery);
      if (searchResult.data) {
        setSearchResults(searchResult.data);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      toast({
        title: "Search Error",
        description: "Failed to search items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const searchByBarcode = async (barcode: string) => {
    if (!barcode) return;
    
    setSearchQuery(barcode);
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.searchItemsByBarcode(barcode);
      if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        // Fallback to regular search
        const searchResult = await erpnextAPI.searchItems(barcode);
        if (searchResult.data) {
          setSearchResults(searchResult.data);
        }
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      toast({
        title: "Search Error",
        description: "Failed to search by barcode.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searching,
    searchByBarcode
  };
};
