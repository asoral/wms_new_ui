
import { useState, useEffect } from 'react';
import { useItemAPI } from './useERPNextAPI';
import { Item } from '@/types';

export const useItemSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const { searchItems, searchItemsByBarcode, loading: searching } = useItemAPI();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    // Check if it's a barcode search (numeric)
    if (/^\d+$/.test(searchQuery)) {
      const barcodeResult = await searchItemsByBarcode(searchQuery);
      if (barcodeResult?.data && barcodeResult.data.length > 0) {
        setSearchResults(barcodeResult.data);
        return;
      }
    }

    // Regular search by name/code
    const searchResult = await searchItems(searchQuery);
    if (searchResult?.data) {
      setSearchResults(searchResult.data);
    }
  };

  const searchByBarcode = async (barcode: string) => {
    if (!barcode) return;
    
    setSearchQuery(barcode);
    const result = await searchItemsByBarcode(barcode);
    if (result?.data && result.data.length > 0) {
      setSearchResults(result.data);
    } else {
      // Fallback to regular search
      const searchResult = await searchItems(barcode);
      if (searchResult?.data) {
        setSearchResults(searchResult.data);
      }
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
