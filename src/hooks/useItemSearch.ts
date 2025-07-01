
import { useState, useCallback } from 'react';
import { useItemAPI } from './useERPNextAPI';
import { Item } from '@/types';

export const useItemSearch = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { searchItems, getItemDetails, searchItemsByBarcode, loading } = useItemAPI();

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setItems([]);
      return;
    }

    try {
      const response = await searchItems(searchTerm);
      if (response?.data && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setItems([]);
    }
  }, [searchItems]);

  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    try {
      const response = await searchItemsByBarcode(barcode);
      if (response?.data && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Barcode search failed:', error);
      setItems([]);
    }
  }, [searchItemsByBarcode]);

  const handleItemSelect = useCallback(async (item: Item) => {
    try {
      const response = await getItemDetails(item.item_code);
      if (response?.data) {
        setSelectedItem(response.data);
      } else {
        setSelectedItem(item);
      }
    } catch (error) {
      console.error('Failed to get item details:', error);
      setSelectedItem(item);
    }
  }, [getItemDetails]);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setItems([]);
  }, []);

  return {
    items,
    selectedItem,
    loading,
    handleSearch,
    handleBarcodeSearch,
    handleItemSelect,
    clearSelection
  };
};
