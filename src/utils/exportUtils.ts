import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string): string => {
  const currencyMap: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$'
  };
  
  return currencyMap[currencyCode] || currencyCode;
};

// Helper function to format currency
const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is not supported
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
};

export interface ExportData {
  [key: string]: any;
}

export const exportToExcel = (
  data: ExportData[], 
  filename: string, 
  sheetName: string = 'Sheet1', 
  currencyCode: string = 'INR'
) => {
  try {
    // Format currency values before creating worksheet
    const formattedData = data.map(row => {
      const newRow: any = {};
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'number' && (key.toLowerCase().includes('value') || key.toLowerCase().includes('valuation'))) {
          newRow[key] = formatCurrency(value, currencyCode);
        } else {
          newRow[key] = value;
        }
      });
      return newRow;
    });
    
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const exportToPDF = (
  data: ExportData[], 
  filename: string, 
  title: string,
  columns: { header: string; dataKey: string }[],
  currencyCode: string = 'INR'
) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map(item => 
      columns.map(col => {
        const value = item[col.dataKey];
        // Format numbers and currency values
        if (typeof value === 'number') {
          return col.dataKey.toLowerCase().includes('valuation') || col.dataKey.toLowerCase().includes('value')
            ? formatCurrency(value, currencyCode)
            : value.toString();
        }
        return value?.toString() || '';
      })
    );
    
    // Create table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        // Right align numeric columns
        ...Object.fromEntries(
          columns.map((col, index) => [
            index,
            ['qty', 'quantity', 'valuation', 'value', 'age'].some(keyword => 
              col.dataKey.toLowerCase().includes(keyword)
            ) ? { halign: 'right' } : {}
          ])
        )
      }
    });
    
    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

// Item Enquiry specific export functions
export const exportItemEnquiryToExcel = (stockItems: any[], itemCode: string, currencyCode: string = 'INR') => {
  const exportData = stockItems.map(item => ({
    'Item Code': item.itemCode,
    'Item Name': item.itemName,
    'Warehouse': item.warehouse,
    'Quantity': item.qty,
    'UOM': item.uom,
    'Age (Days)': item.age,
    'Valuation': item.valuation
  }));
  
  return exportToExcel(exportData, `item-enquiry-${itemCode}-${new Date().toISOString().split('T')[0]}`, 'Item Stock', currencyCode);
};

export const exportItemEnquiryToPDF = (stockItems: any[], itemCode: string, itemName: string, currencyCode: string = 'INR') => {
  const exportData = stockItems.map(item => ({
    itemCode: item.itemCode,
    itemName: item.itemName,
    warehouse: item.warehouse,
    qty: item.qty,
    uom: item.uom,
    age: item.age,
    valuation: item.valuation
  }));
  
  const columns = [
    { header: 'Item Code', dataKey: 'itemCode' },
    { header: 'Item Name', dataKey: 'itemName' },
    { header: 'Warehouse', dataKey: 'warehouse' },
    { header: 'Quantity', dataKey: 'qty' },
    { header: 'UOM', dataKey: 'uom' },
    { header: 'Age (Days)', dataKey: 'age' },
    { header: 'Valuation', dataKey: 'valuation' }
  ];
  
  return exportToPDF(
    exportData, 
    `item-enquiry-${itemCode}-${new Date().toISOString().split('T')[0]}`,
    `Item Enquiry Report - ${itemCode} (${itemName})`,
    columns,
    currencyCode
  );
};

// Bin Enquiry specific export functions
export const exportBinEnquiryToExcel = (binItems: any[], binCode: string, currencyCode: string = 'INR') => {
  const exportData = binItems.map(item => ({
    'Item Code': item.item_code,
    'Item Name': item.item_name,
    'Quantity': item.qty || item.actual_qty,
    'UOM': item.uom || 'Nos',
    'Age (Days)': item.age,
    'Valuation': item.valuation,
    'Bin/Warehouse': item.bin || item.warehouse
  }));
  
  return exportToExcel(exportData, `bin-enquiry-${binCode}-${new Date().toISOString().split('T')[0]}`, 'Bin Items', currencyCode);
};

export const exportBinEnquiryToPDF = (binItems: any[], binCode: string, currencyCode: string = 'INR') => {
  const exportData = binItems.map(item => ({
    itemCode: item.item_code,
    itemName: item.item_name,
    qty: item.qty || item.actual_qty,
    uom: item.uom || 'Nos',
    age: item.age,
    valuation: item.valuation,
    bin: item.bin || item.warehouse
  }));
  
  const columns = [
    { header: 'Item Code', dataKey: 'itemCode' },
    { header: 'Item Name', dataKey: 'itemName' },
    { header: 'Quantity', dataKey: 'qty' },
    { header: 'UOM', dataKey: 'uom' },
    { header: 'Age (Days)', dataKey: 'age' },
    { header: 'Valuation', dataKey: 'valuation' },
    { header: 'Bin/Warehouse', dataKey: 'bin' }
  ];
  
  return exportToPDF(
    exportData, 
    `bin-enquiry-${binCode}-${new Date().toISOString().split('T')[0]}`,
    `Bin Enquiry Report - ${binCode}`,
    columns,
    currencyCode
  );
};