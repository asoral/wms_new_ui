
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Package } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { 
      variant: "default" | "destructive" | "outline" | "secondary", 
      icon: any 
    }> = {
      'Draft': { variant: 'secondary', icon: Clock },
      'Open': { variant: 'default', icon: Package },
      'Submitted': { variant: 'default', icon: Clock },
      'Completed': { variant: 'outline', icon: CheckCircle },
      'Closed': { variant: 'outline', icon: CheckCircle },
      'Cancelled': { variant: 'destructive', icon: AlertTriangle },
      'Stopped': { variant: 'destructive', icon: AlertTriangle },
      'To Deliver': { variant: 'default', icon: Package },
      'To Deliver and Bill': { variant: 'default', icon: Package },
      'Partially Delivered': { variant: 'outline', icon: Package },
      'Ordered': { variant: 'outline', icon: CheckCircle },
      'Received': { variant: 'outline', icon: CheckCircle },
    };
    
    return statusMap[status] || { variant: 'secondary', icon: AlertTriangle };
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  const badgeVariant = variant || config.variant;
  
  return (
    <Badge variant={badgeVariant} className="flex items-center space-x-1">
      <IconComponent className="w-3 h-3" />
      <span>{status}</span>
    </Badge>
  );
};

export default StatusBadge;
