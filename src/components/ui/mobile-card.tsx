import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface MobileCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const MobileCard = ({ title, children, className = "" }: MobileCardProps) => {
  return (
    <Card className={`mb-4 ${className}`}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

interface MobileCardFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export const MobileCardField = ({ label, value, className = "" }: MobileCardFieldProps) => {
  return (
    <div className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 ${className}`}>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
};