import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface AddVendorDialogProps {
  onVendorAdded: () => void
}

export function AddVendorDialog({ onVendorAdded }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contacts, setContacts] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!name || !contacts || scopes.length === 0) {
        toast.error('Please fill in all required fields and select at least one scope')
        return
      }

      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          contacts: contacts.split(',').map(email => email.trim()),
          scopes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add vendor')
      }

      toast.success('Vendor added successfully')
      setOpen(false)
      onVendorAdded()
      
      // Reset form
      setName('')
      setContacts('')
      setScopes([])
    } catch (error) {
      console.error('Error adding vendor:', error)
      toast.error('Failed to add vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Vendor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter vendor name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contacts">Contact Emails</Label>
            <Input
              id="contacts"
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              placeholder="Enter email addresses (comma-separated)"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Scopes</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="media"
                  checked={scopes.includes('Media')}
                  onCheckedChange={(checked) => {
                    setScopes(prev => 
                      checked 
                        ? [...prev, 'Media']
                        : prev.filter(scope => scope !== 'Media')
                    )
                  }}
                />
                <Label htmlFor="media">Media</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ai"
                  checked={scopes.includes('AI')}
                  onCheckedChange={(checked) => {
                    setScopes(prev => 
                      checked 
                        ? [...prev, 'AI']
                        : prev.filter(scope => scope !== 'AI')
                    )
                  }}
                />
                <Label htmlFor="ai">AI</Label>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Adding...' : 'Add Vendor'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}