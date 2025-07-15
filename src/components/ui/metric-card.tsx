
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export const MetricCard = ({ title, value, icon: Icon }: MetricCardProps) => {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center p-4 md:p-6">
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
