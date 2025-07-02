
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

interface Company {
  name: string;
  company_name: string;
}

interface CompanyDropdownProps {
  onCompanySelect: (company: Company) => void;
  selectedCompany?: Company | null;
  disabled?: boolean;
  className?: string;
}

const CompanyDropdown = ({ 
  onCompanySelect, 
  selectedCompany,
  disabled = false,
  className = ""
}: CompanyDropdownProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings first.",
          variant: "destructive"
        });
        return;
      }

      const response = await erpnextAPI.getCompanies();
      
      if (response?.data && Array.isArray(response.data)) {
        setCompanies(response.data);
        setShowResults(true);
      } else {
        setCompanies([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    console.log('Company selected:', company);
    onCompanySelect(company);
    setShowResults(false);
  };

  const handleDropdownToggle = () => {
    if (!disabled && !loading) {
      if (!showResults) {
        fetchCompanies();
      } else {
        setShowResults(false);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={handleDropdownToggle}
        disabled={disabled || loading}
      >
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4" />
          <span className="truncate">
            {selectedCompany?.company_name || "Select Company"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showResults && companies.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {companies.map((company) => (
            <div
              key={company.name}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
              onClick={() => handleCompanySelect(company)}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-sm dark:text-gray-100">{company.company_name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{company.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading companies...</div>
        </div>
      )}

      {showResults && companies.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">No companies found</div>
        </div>
      )}
    </div>
  );
};

export default CompanyDropdown;
