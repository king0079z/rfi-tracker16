import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface ExportButtonProps {
  vendorId?: string;
  hidden?: boolean;
}

export function ExportButton({ vendorId, hidden }: ExportButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasPermission(false);
          return;
        }

        // Check user permissions
        const userResponse = await fetch('/api/auth/login', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          setHasPermission(false);
          return;
        }
        const userData = await userResponse.json();

        // Check global settings
        const settingsResponse = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!settingsResponse.ok) {
          setHasPermission(false);
          return;
        }
        const settingsData = await settingsResponse.json();

        // User must have permission AND the feature must be enabled globally
        const canExport = userData.canExportData && settingsData.exportEnabled;
        setHasPermission(canExport);
        console.log('Export permission updated:', canExport);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };

    // Initial check
    checkPermissions();

    // Set up an interval to check permissions periodically
    const intervalId = setInterval(checkPermissions, 30000); // Check every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const validateToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    try {
      // Basic validation that it's a JWT token (xxx.yyy.zzz format)
      if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
        console.log('Invalid token format');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const token = validateToken();
      
      if (!token) {
        toast.error('Please log in to export evaluations');
        router.push('/login');
        return;
      }

      if (!hasPermission) {
        toast.error('You do not have permission to export data');
        return;
      }

      console.log('Starting export request...');
      const url = `/api/evaluations/export${vendorId ? `?vendorId=${vendorId}` : ''}`;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      console.log('Making request with headers:', JSON.stringify(headers, null, 2));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Received 401 unauthorized response');
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        console.error('Error data:', errorData);
        throw new Error(errorData.error || `Export failed: ${response.statusText}`);
      }

      // Convert the response to blob
      const blob = await response.blob();
      console.log('Received blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('No data received from server');
      }

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename=(.+)\.xlsx/);
      const filename = filenameMatch ? filenameMatch[1] + '.xlsx' : 'vendor-evaluations.xlsx';

      // Create a download link and trigger the download
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url2);
      document.body.removeChild(a);

      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting evaluations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  // If hidden prop is true or user doesn't have permission, don't render anything
  if (hidden || !hasPermission) {
    return null;
  }

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      size="sm" 
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? 'Exporting...' : 'Export'}
    </Button>
  );
}