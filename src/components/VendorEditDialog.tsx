import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface VendorEditDialogProps {
  vendor: {
    id: number;
    name: string;
    scopes: string[];
    chatEnabled?: boolean;
    directDecisionEnabled?: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: () => void;
}

interface VendorUpdateData {
  name?: string;
  scopes?: string[];
}

export function VendorEditDialog({
  vendor,
  open,
  onOpenChange,
  onVendorUpdated,
}: VendorEditDialogProps) {
  const [selectedScopes, setSelectedScopes] = useState<string[]>(vendor.scopes);
  const [vendorName, setVendorName] = useState(vendor.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleScopeChange = (scope: string) => {
    setSelectedScopes((current) => {
      if (current.includes(scope)) {
        return current.filter((s) => s !== scope);
      }
      return [...current, scope];
    });
  };

  const handleUpdate = async () => {
    try {
      if (!vendorName.trim()) {
        toast.error('Vendor name cannot be empty');
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/vendors/${vendor.id}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'UPDATE_VENDOR',
          data: {
            name: vendorName.trim(),
            scopes: selectedScopes,
            // Preserve existing settings
            chatEnabled: vendor.chatEnabled,
            directDecisionEnabled: vendor.directDecisionEnabled,
          },
        }),
      });

      if (response.ok) {
        toast.success('Vendor updated successfully');
        onVendorUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update vendor');
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Error updating vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScope = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/vendors/${vendor.id}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'UPDATE_SCOPE',
          scopes: selectedScopes,
        }),
      });

      if (response.ok) {
        toast.success('Vendor scopes updated successfully');
        onVendorUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update vendor scopes');
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Error updating vendor scopes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearEvaluations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/vendors/${vendor.id}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'CLEAR_EVALUATIONS',
        }),
      });

      if (response.ok) {
        toast.success('Vendor evaluations cleared successfully');
        onVendorUpdated();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to clear evaluations');
      }
    } catch (error) {
      console.error('Error clearing evaluations:', error);
      toast.error('Error clearing evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/vendors/${vendor.id}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'CLEAR_CHAT',
        }),
      });

      if (response.ok) {
        toast.success('Vendor chat history cleared successfully');
        onVendorUpdated();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to clear chat history');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Error clearing chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/vendors/${vendor.id}/manage`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Vendor deleted successfully');
        onVendorUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Error deleting vendor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="sticky top-0 z-20 bg-background pb-4">
          <DialogTitle>Edit Vendor: {vendor.name}</DialogTitle>
          <DialogDescription>
            Modify vendor scopes and manage vendor data
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Vendor Name</h4>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter vendor name"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Vendor Scopes</h4>
              <div className="flex flex-wrap gap-2">
                {['Media', 'AI', 'Consulting', 'Technology', 'Integration', 'Cloud'].map((scope) => (
                  <Button
                    key={scope}
                    variant={selectedScopes.includes(scope) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange(scope)}
                    disabled={isLoading}
                  >
                    {scope}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Data Management</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearEvaluations}
                  disabled={isLoading}
                >
                  Clear All Evaluations
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearChat}
                  disabled={isLoading}
                >
                  Clear Chat History
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteVendor}
                  disabled={isLoading}
                >
                  Delete Vendor
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-20 bg-background pt-4">
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isLoading || selectedScopes.length === 0 || !vendorName.trim()}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}