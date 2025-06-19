
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Send, 
  ShoppingCart, 
  Package, 
  CheckCircle,
  ArrowRight,
  Clock
} from "lucide-react";

interface MaterialRequestWorkflowProps {
  status: string;
  purpose: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  onStop?: () => void;
}

const MaterialRequestWorkflow = ({ 
  status, 
  purpose, 
  onSubmit, 
  onCancel, 
  onStop 
}: MaterialRequestWorkflowProps) => {
  
  const getWorkflowSteps = () => {
    const baseSteps = [
      { key: "draft", label: "Draft", icon: FileText, description: "Material Request created" },
      { key: "submitted", label: "Submitted", icon: Send, description: "Submitted for approval" }
    ];

    if (purpose === "Purchase") {
      return [
        ...baseSteps,
        { key: "ordered", label: "Ordered", icon: ShoppingCart, description: "Purchase Order created" },
        { key: "received", label: "Received", icon: Package, description: "Items received" }
      ];
    } else if (purpose === "Material Transfer") {
      return [
        ...baseSteps,
        { key: "transferred", label: "Transferred", icon: Package, description: "Stock transferred" }
      ];
    } else if (purpose === "Material Issue") {
      return [
        ...baseSteps,
        { key: "issued", label: "Issued", icon: Package, description: "Items issued" }
      ];
    } else if (purpose === "Manufacture") {
      return [
        ...baseSteps,
        { key: "ordered", label: "Work Order", icon: ShoppingCart, description: "Work Order created" },
        { key: "manufactured", label: "Manufactured", icon: CheckCircle, description: "Items manufactured" }
      ];
    }

    return baseSteps;
  };

  const getCurrentStepIndex = () => {
    const steps = getWorkflowSteps();
    switch (status.toLowerCase()) {
      case "draft": return 0;
      case "submitted": return 1;
      case "ordered": 
      case "partially ordered": return 2;
      case "received":
      case "partially received":
      case "transferred":
      case "issued":
      case "manufactured": return 3;
      default: return 0;
    }
  };

  const steps = getWorkflowSteps();
  const currentStep = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const getAvailableActions = () => {
    const actions = [];
    
    if (status === "Draft") {
      actions.push(
        <Button key="submit" onClick={onSubmit}>
          <Send className="w-4 h-4 mr-2" />
          Submit
        </Button>
      );
    }
    
    if (["Draft", "Submitted"].includes(status)) {
      actions.push(
        <Button key="cancel" variant="destructive" onClick={onCancel}>
          Cancel
        </Button>
      );
    }
    
    if (status === "Submitted") {
      actions.push(
        <Button key="stop" variant="outline" onClick={onStop}>
          <Clock className="w-4 h-4 mr-2" />
          Stop
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const StepIcon = step.icon;
            
            return (
              <div key={step.key} className="flex items-center space-x-4">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${stepStatus === "completed" ? "bg-green-100 border-green-500 text-green-700" : ""}
                  ${stepStatus === "current" ? "bg-blue-100 border-blue-500 text-blue-700" : ""}
                  ${stepStatus === "pending" ? "bg-gray-100 border-gray-300 text-gray-500" : ""}
                `}>
                  <StepIcon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      stepStatus === "current" ? "text-blue-700" : 
                      stepStatus === "completed" ? "text-green-700" : "text-gray-500"
                    }`}>
                      {step.label}
                    </span>
                    {stepStatus === "completed" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Current Status:</span>
              <Badge className="ml-2" variant={
                status === "Draft" ? "secondary" :
                status === "Submitted" ? "default" :
                status.includes("Ordered") ? "default" :
                "default"
              }>
                {status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        {getAvailableActions().length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getAvailableActions()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialRequestWorkflow;
