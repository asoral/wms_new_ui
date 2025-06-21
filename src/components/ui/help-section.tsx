
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface HelpSectionProps {
  icon: ReactNode;
  title: string;
  description: string;
  steps?: string[];
  show: boolean;
}

const HelpSection = ({ icon, title, description, steps, show }: HelpSectionProps) => {
  if (!show) return null;

  return (
    <Card className="bg-gray-50 border-dashed border-gray-300">
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-4 text-gray-400">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {steps && (
          <ul className="text-sm text-gray-600 space-y-1">
            {steps.map((step, index) => (
              <li key={index}>• {step}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default HelpSection;
