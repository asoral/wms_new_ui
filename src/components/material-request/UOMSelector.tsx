
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UOMSelectorProps {
  value?: string;
  onValueChange: (uom: string) => void;
  disabled?: boolean;
}

const commonUOMs = [
  "Nos", "Kg", "Liters", "Meters", "Bags", "Box", "Set", "Pieces", "Grams", 
  "Tonnes", "Feet", "Inches", "Yards", "Dozen", "Pair", "Roll", "Sheet"
];

const UOMSelector = ({ value, onValueChange, disabled }: UOMSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredUOMs = commonUOMs.filter(uom =>
    uom.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Select UOM"}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search UOMs..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No UOM found.</CommandEmpty>
            <CommandGroup>
              {filteredUOMs.map((uom) => (
                <CommandItem
                  key={uom}
                  onSelect={() => {
                    onValueChange(uom);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === uom ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {uom}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UOMSelector;
