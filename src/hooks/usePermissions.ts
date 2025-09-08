import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

export type PermissionType = 'view_valuations' | 'view_sensitive_data' | 'admin_access';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<PermissionType>>(new Set());
  const [loading, setLoading] = useState(true);

  const checkPermission = async (permission: PermissionType): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('current_user_has_permission', {
        p_permission: permission
      });
      
      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const hasPermission = (permission: PermissionType): boolean => {
    return permissions.has(permission);
  };

  const loadUserPermissions = async () => {
    if (!user) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const permissionTypes: PermissionType[] = ['view_valuations', 'view_sensitive_data', 'admin_access'];
    const userPermissions = new Set<PermissionType>();

    // Check each permission
    for (const permission of permissionTypes) {
      const hasAccess = await checkPermission(permission);
      if (hasAccess) {
        userPermissions.add(permission);
      }
    }

    setPermissions(userPermissions);
    setLoading(false);
  };

  useEffect(() => {
    loadUserPermissions();
  }, [user]);

  return {
    permissions,
    hasPermission,
    checkPermission,
    loading,
    refreshPermissions: loadUserPermissions
  };
};