import { useState, useEffect } from "react";
import { createERPNextAPI } from "@/services/erpnextApi";

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const api = await createERPNextAPI();
      if (!api) return;

      const response = await api.getNotificationLogs(50);
      const notifications = response.data || [];
      const count = notifications.filter((n: any) => n.read === 0).length;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // Refresh count every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { unreadCount, loading, refetch: fetchCount };
};
