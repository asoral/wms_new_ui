
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface Document {
  name: string;
  title?: string;
  customer?: string;
  supplier?: string;
  item?: string;
  item_name?: string;
  transaction_date?: string;
  material_request_type?: string;
  status?: string;
}

interface DocumentSelectorProps {
  doctype: string;
  stockEntryType?: string;
  onDocumentSelected: (document: Document) => void;
  isLoading: boolean;
}

const DocumentSelector = ({ doctype, stockEntryType, onDocumentSelected, isLoading }: DocumentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async (search: string = "") => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not available');
        return;
      }

      const company = await getUserDefaultCompany();
      let result;

      console.log(`Fetching ${doctype} for stock entry type: ${stockEntryType}`);
      console.log(`Company: ${company}`);

      switch (doctype) {
        case "Material Request":
          // Always fetch all material requests for debugging
          console.log('Fetching all Material Requests first...');
          const allMRs = await erpnextAPI.getMaterialRequests(undefined, company || undefined, 50);
          console.log('All Material Requests:', allMRs);
          
          // Now fetch filtered ones
          result = await erpnextAPI.searchMaterialRequestsForStockEntry(stockEntryType || "", company || undefined);
          break;
        case "Purchase Order":
          result = await erpnextAPI.searchPurchaseOrdersForStockEntry(company || undefined);
          break;
        case "Sales Order":
          result = await erpnextAPI.searchSalesOrdersForStockEntry(company || undefined);
          break;
        case "BOM":
          result = await erpnextAPI.searchBOMs(company || undefined);
          break;
        default:
          result = { data: [] };
      }

      console.log(`${doctype} search result:`, result);

      if (result && result.data) {
        let filteredData = result.data;
        if (search) {
          filteredData = result.data.filter((doc: Document) => 
            doc.name.toLowerCase().includes(search.toLowerCase()) ||
            (doc.title && doc.title.toLowerCase().includes(search.toLowerCase())) ||
            (doc.customer && doc.customer.toLowerCase().includes(search.toLowerCase())) ||
            (doc.supplier && doc.supplier.toLowerCase().includes(search.toLowerCase())) ||
            (doc.item && doc.item.toLowerCase().includes(search.toLowerCase()))
          );
        }
        setDocuments(filteredData);
        console.log(`Found ${filteredData.length} ${doctype}(s)`);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error(`Error fetching ${doctype}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${doctype}`,
        variant: "destructive"
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDocuments(searchTerm);
    }
  }, [open, doctype, stockEntryType]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (open && searchTerm !== "") {
        fetchDocuments(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (document: Document) => {
    setSelectedDocument(document);
    onDocumentSelected(document);
    setOpen(false);
  };

  const getDisplayText = (doc: Document) => {
    switch (doctype) {
      case "Material Request":
        return `${doc.name} - ${doc.title || 'N/A'} (${doc.material_request_type})`;
      case "Purchase Order":
        return `${doc.name} - ${doc.supplier} (${doc.status})`;
      case "Sales Order":
        return `${doc.name} - ${doc.customer} (${doc.status})`;
      case "BOM":
        return `${doc.name} - ${doc.item_name || doc.item}`;
      default:
        return doc.name;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedDocument ? getDisplayText(selectedDocument) : `Select ${doctype}...`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput 
            placeholder={`Search ${doctype}...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? `Loading ${doctype}...` : `No ${doctype} found.`}
            </CommandEmpty>
            <CommandGroup>
              {documents.map((doc) => (
                <CommandItem
                  key={doc.name}
                  value={doc.name}
                  onSelect={() => handleSelect(doc)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedDocument?.name === doc.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-sm text-gray-500">
                      {doctype === "Material Request" && `${doc.title} - ${doc.material_request_type}`}
                      {doctype === "Purchase Order" && `${doc.supplier} - ${doc.status}`}
                      {doctype === "Sales Order" && `${doc.customer} - ${doc.status}`}
                      {doctype === "BOM" && `${doc.item_name || doc.item}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DocumentSelector;
