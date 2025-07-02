
import { useState, useCallback } from 'react';
import { useItemAPI } from './useERPNextAPI';
import { Item } from '@/types';

export interface UseItemSearchReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Item[];
  setSearchResults: (results: Item[]) => void;
  searching: boolean;
  
  // Selected item state
  items: Item[];
  selectedItem: Item | null;
  loading: boolean;
  
  // Actions
  handleSearch: (searchTerm: string) => Promise<void>;
  handleBarcodeSearch: (barcode: string) => Promise<void>;
  searchByBarcode: (barcode: string) => Promise<void>;
  handleItemSelect: (item: Item) => Promise<void>;
  clearSelection: () => void;
}

export const useItemSearch = (): UseItemSearchReturn => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searching, setSearching] = useState(false);
  
  const { searchItems, getItemDetails, searchItemsByBarcode, loading } = useItemAPI();

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setItems([]);
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await searchItems(searchTerm);
      const results = (response?.data || []) as Item[];
      setItems(results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setItems([]);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchItems]);

  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    try {
      setSearching(true);
      const response = await searchItemsByBarcode(barcode);
      const results = (response?.data || []) as Item[];
      setItems(results);
      setSearchResults(results);
    } catch (error) {
      console.error('Barcode search failed:', error);
      setItems([]);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchItemsByBarcode]);

  const searchByBarcode = useCallback(async (barcode: string) => {
    await handleBarcodeSearch(barcode);
  }, [handleBarcodeSearch]);

  const handleItemSelect = useCallback(async (item: Item) => {
    try {
      const response = await getItemDetails(item.item_code);
      setSelectedItem((response?.data || item) as Item);
    } catch (error) {
      console.error('Failed to get item details:', error);
      setSelectedItem(item);
    }
  }, [getItemDetails]);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setItems([]);
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searching,
    
    // Selected item state
    items,
    selectedItem,
    loading,
    
    // Actions
    handleSearch,
    handleBarcodeSearch,
    searchByBarcode,
    handleItemSelect,
    clearSelection
  };
};
