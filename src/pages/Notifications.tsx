
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Trash2,
  MarkAsRead
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Stock Count Completed",
      message: "Stock count for Warehouse A has been completed successfully.",
      type: "success",
      timestamp: "2024-01-15 14:30:00",
      read: false
    },
    {
      id: "2",
      title: "Low Stock Alert",
      message: "Item RAW-MAT-001 is below minimum stock level.",
      type: "warning",
      timestamp: "2024-01-15 13:45:00",
      read: false
    },
    {
      id: "3",
      title: "Quality Check Failed",
      message: "Quality inspection QI-004 has failed. Immediate attention required.",
      type: "error",
      timestamp: "2024-01-15 12:20:00",
      read: true
    },
    {
      id: "4",
      title: "New Purchase Order",
      message: "Purchase Order PO-001 has been received and is ready for processing.",
      type: "info",
      timestamp: "2024-01-15 11:15:00",
      read: true
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "error": return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCardStyle = (type: string) => {
    switch (type) {
      case "success": return "border-l-4 border-l-green-500";
      case "warning": return "border-l-4 border-l-yellow-500";
      case "error": return "border-l-4 border-l-red-500";
      default: return "border-l-4 border-l-blue-500";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount} unread</Badge>
            )}
          </div>
          <Button onClick={markAllAsRead} variant="outline">
            <MarkAsRead className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`${getCardStyle(notification.type)} ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <MarkAsRead className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-500">{notification.timestamp}</p>
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
