
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon, Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  info?: string;
}

export const MetricCard = ({ title, value, icon: Icon, info }: MetricCardProps) => {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center p-4 md:p-6 relative">
        {info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors">
                  <Info className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex items-center space-x-3 md:space-x-4 w-full min-w-0">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <h3 className="text-lg md:text-2xl font-bold truncate">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
