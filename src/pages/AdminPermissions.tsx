import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, UserX, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';

interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

const AdminPermissions = () => {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<'view_valuations' | 'view_sensitive_data' | 'admin_access' | ''>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const permissionTypes = [
    { value: 'view_valuations', label: 'View Valuations', description: 'Access to view item valuation data' },
    { value: 'view_sensitive_data', label: 'View Sensitive Data', description: 'Access to sensitive information' },
    { value: 'admin_access', label: 'Admin Access', description: 'Full administrative privileges' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .order('granted_at', { ascending: false });

      if (permissionsError) throw permissionsError;

      // Load user profiles  
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (profilesError) throw profilesError;

      setUserPermissions(permissions || []);
      setUserProfiles(profiles || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const grantPermission = async () => {
    if (!selectedUserId || !selectedPermission) {
      toast({
        title: 'Validation Error',
        description: 'Please select both user and permission type',
        variant: 'destructive'
      });
      return;
    }

    try {
      const expiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;
      
      const { error } = await supabase.rpc('grant_user_permission', {
        p_user_id: selectedUserId,
        p_permission: selectedPermission as 'view_valuations' | 'view_sensitive_data' | 'admin_access',
        p_expires_at: expiresAt
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission granted successfully'
      });

      setShowGrantDialog(false);
      setSelectedUserId('');
      setSelectedPermission('');
      setExpiryDate('');
      loadData();
    } catch (error) {
      console.error('Error granting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant permission',
        variant: 'destructive'
      });
    }
  };

  const revokePermission = async (userId: string, permission: string) => {
    try {
      const { error } = await supabase.rpc('revoke_user_permission', {
        p_user_id: userId,
        p_permission: permission as 'view_valuations' | 'view_sensitive_data' | 'admin_access'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission revoked successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke permission',
        variant: 'destructive'
      });
    }
  };

  const getUserEmail = (userId: string) => {
    const profile = userProfiles.find(p => p.id === userId);
    return profile?.email || 'Unknown';
  };

  const getUserName = (userId: string) => {
    const profile = userProfiles.find(p => p.id === userId);
    return profile?.full_name || profile?.email || 'Unknown';
  };

  const getPermissionLabel = (permission: string) => {
    const perm = permissionTypes.find(p => p.value === permission);
    return perm?.label || permission;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user permissions and access control
          </p>
        </div>
        
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Grant Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant User Permission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-select">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {userProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="permission-select">Permission Type</Label>
                <Select value={selectedPermission} onValueChange={(value) => setSelectedPermission(value as 'view_valuations' | 'view_sensitive_data' | 'admin_access' | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionTypes.map(perm => (
                      <SelectItem key={perm.value} value={perm.value}>
                        <div>
                          <div className="font-medium">{perm.label}</div>
                          <div className="text-sm text-muted-foreground">{perm.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry-date"
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={grantPermission}>
                  Grant Permission
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {userPermissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No permissions granted yet
            </p>
          ) : (
            <div className="space-y-4">
              {userPermissions.map(permission => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">{getUserName(permission.user_id)}</h3>
                        <p className="text-sm text-muted-foreground">{getUserEmail(permission.user_id)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                        {getPermissionLabel(permission.permission)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Granted: {new Date(permission.granted_at).toLocaleDateString()}
                      </p>
                      {permission.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(permission.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {permission.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokePermission(permission.user_id, permission.permission)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissions;