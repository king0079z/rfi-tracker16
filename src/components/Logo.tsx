import { Building2 } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-violet-100 p-2 rounded-lg">
        <Building2 className="h-6 w-6 text-violet-600" />
      </div>
      <span className="font-bold text-lg">RFI Vendor Tracker</span>
    </div>
  )
}