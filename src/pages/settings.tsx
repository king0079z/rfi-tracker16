import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  canAccessChat: boolean;
  canPrintReports: boolean;
  canExportData: boolean;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    chatEnabled: true,
    directDecisionEnabled: true,
    printEnabled: true,
    exportEnabled: true,
  });

  const fetchSettings = async (token: string) => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          chatEnabled: data.chatEnabled,
          directDecisionEnabled: data.directDecisionEnabled,
          printEnabled: data.printEnabled,
          exportEnabled: data.exportEnabled,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    }
  };

  const handleSettingChange = async (setting: 'chatEnabled' | 'directDecisionEnabled' | 'printEnabled' | 'exportEnabled', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Store the previous state
      const previousSettings = { ...settings };

      // Optimistically update the UI
      setSettings(prev => ({ ...prev, [setting]: value }));

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          [setting]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Settings updated successfully');
      } else {
        // Revert to previous state if the request fails
        setSettings(previousSettings);
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      // Revert to previous state on error
      setSettings(settings);
      console.error('Error updating settings:', error);
      toast.error('Error updating settings');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('User role updated successfully');
      } else {
        toast.error(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error updating user role');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!(payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com')) {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }

    fetchSettings(token);

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'You do not have permission to access this page');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Error loading users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleUserPermissionChange = async (userId: number, permission: 'canAccessChat' | 'canPrintReports' | 'canExportData', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permission, value }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, [permission]: value } : user
        ));
        toast.success('User permissions updated successfully');
      } else {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, [permission]: !value } : user
        ));
        toast.error(data.message || 'Failed to update user permissions');
      }
    } catch (error) {
      console.error('Error updating user permissions:', error);
      toast.error('Error updating user permissions');
      setUsers(users.map(user => 
        user.id === userId ? { ...user, [permission]: !value } : user
      ));
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure global system features and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Vendor Chat</h3>
                    <p className="text-sm text-gray-500">
                      Enable or disable chat functionality globally
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatEnabled}
                    onCheckedChange={(checked) => handleSettingChange('chatEnabled', checked)}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">User Management</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage user roles and permissions
                  </p>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Chat Access</TableHead>
                          <TableHead>Print Reports</TableHead>
                          <TableHead>Export Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                                  <SelectItem value="DECISION_MAKER">Decision Maker</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canAccessChat}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canAccessChat', checked);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canPrintReports}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canPrintReports', checked);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canExportData}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canExportData', checked);
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Direct Decision Making</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable direct decision making functionality
                  </p>
                </div>
                <Switch
                  checked={settings.directDecisionEnabled}
                  onCheckedChange={(checked) => handleSettingChange('directDecisionEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Print Reports</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable report printing functionality
                  </p>
                </div>
                <Switch
                  checked={settings.printEnabled}
                  onCheckedChange={(checked) => handleSettingChange('printEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Export Data</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable data export functionality
                  </p>
                </div>
                <Switch
                  checked={settings.exportEnabled}
                  onCheckedChange={(checked) => handleSettingChange('exportEnabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}