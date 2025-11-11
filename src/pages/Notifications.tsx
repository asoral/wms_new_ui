
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Check,
  Loader2
} from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/utils/security";

interface Notification {
  name: string;
  subject: string;
  email_content: string;
  document_type?: string;
  document_name?: string;
  type?: string;
  read: number;
  creation: string;
  modified: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const api = await createERPNextAPI();
      if (!api) {
        toast({
          title: "Error",
          description: "Failed to connect to ERPNext",
          variant: "destructive",
        });
        return;
      }

      const response = await api.getNotificationLogs(50);
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type?: string) => {
    if (!type) return <Info className="w-5 h-5 text-primary" />;
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes("success") || lowerType.includes("alert")) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (lowerType.includes("warning")) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else if (lowerType.includes("error") || lowerType.includes("fail")) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Info className="w-5 h-5 text-primary" />;
  };

  const getCardStyle = (type?: string) => {
    if (!type) return "border-l-4 border-l-primary";
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes("success") || lowerType.includes("alert")) {
      return "border-l-4 border-l-green-500";
    } else if (lowerType.includes("warning")) {
      return "border-l-4 border-l-yellow-500";
    } else if (lowerType.includes("error") || lowerType.includes("fail")) {
      return "border-l-4 border-l-red-500";
    }
    return "border-l-4 border-l-primary";
  };

  const markAsRead = async (name: string) => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      await api.markNotificationAsRead(name);
      setNotifications(prev =>
        prev.map(notif =>
          notif.name === name ? { ...notif, read: 1 } : notif
        )
      );
      toast({
        title: "Marked as read",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };


  const markAllAsRead = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      const unreadNotifications = notifications.filter(n => n.read === 0);
      await Promise.all(
        unreadNotifications.map(notif => api.markNotificationAsRead(notif.name))
      );
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: 1 }))
      );
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const unreadCount = notifications.filter(n => n.read === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.name} 
                className={`${getCardStyle(notification.type)} ${notification.read === 0 ? 'bg-accent' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-medium text-foreground ${notification.read === 0 ? 'font-semibold' : ''}`}>
                          {notification.subject}
                          {notification.document_type && notification.document_name && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({notification.document_type}: {notification.document_name})
                            </span>
                          )}
                        </h3>
                        {notification.read === 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.name)}
                            className="ml-4"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {notification.email_content && (
                        <div 
                          className="text-muted-foreground mb-2 text-sm"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(notification.email_content) }}
                        />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(notification.creation)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
