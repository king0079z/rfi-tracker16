import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import { decodeToken } from '@/lib/tokenUtils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, RefreshCw, Building2, Users, Mail, Info, AlertCircle, ChevronRight, FileDown, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from '@/components/Header'
import { Skeleton } from '@/components/ui/skeleton'
import { VendorEvaluation } from '@/components/VendorEvaluation'
import { VendorEditDialog } from '@/components/VendorEditDialog'
import { AddVendorDialog } from '@/components/AddVendorDialog'
import { VendorActions } from '@/components/VendorActions'

interface Evaluator {
  id: string
  name: string
  role: string
  email: string
}

interface Evaluation {
  id: number
  overallScore: number
  domain: string
  weight: number
  evaluator: Evaluator
}

interface Vendor {
  id: number
  name: string
  scopes: string[]
  contacts: string[]
  rfiReceived: boolean
  rfiReceivedAt: string | null
  rfiStatus: string | null
  createdAt: string
  updatedAt: string
  averageScore: number | null
  finalDecision?: string | null
  evaluations?: Evaluation[]
  evaluationSummary?: {
    totalWeight: number
    averageScore: number
    evaluationsCount: number
    uniqueEvaluators: number
    evaluators: Evaluator[]
  }
}

interface Stats {
  total: number
  mediaAndAI: number
  totalMedia: number
  totalAI: number
  totalContacts: number
}

export default function Home() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [scopeFilter, setScopeFilter] = useState('Media')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  const isScoreVisible = userRole === 'ADMIN' || userRole === 'DECISION_MAKER'

  const handleExport = async (vendorId?: number) => {
    try {
      setIsExporting(true)
      const queryParams = vendorId ? `?vendorId=${vendorId}` : ''
      const response = await fetch(`/api/evaluations/export${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : 'vendor-evaluations.xlsx'

      // Create blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting evaluations:', error)
    } finally {
      setIsExporting(false)
    }
  }
  const isAdmin = userRole === 'ADMIN' || userEmail === 'admin@admin.com'
  const [stats, setStats] = useState<Stats>({
    total: 0,
    mediaAndAI: 0,
    totalMedia: 0,
    totalAI: 0,
    totalContacts: 0,
  })

  const calculateStats = (vendorsList: Vendor[]) => {
    const mediaAndAICount = vendorsList.filter((v) => 
      v.scopes.includes('Media') && v.scopes.includes('AI')
    ).length
    const totalMediaCount = vendorsList.filter((v) => v.scopes.includes('Media')).length
    const totalAICount = vendorsList.filter((v) => v.scopes.includes('AI')).length

    const newStats = {
      total: vendorsList.length,
      mediaAndAI: mediaAndAICount,
      totalMedia: totalMediaCount,
      totalAI: totalAICount,
      totalContacts: vendorsList.reduce((acc, v) => acc + v.contacts.length, 0),
    }
    setStats(newStats)
  }

  const seedVendors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seed-vendors', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to seed vendors')
      }
      // Refresh the vendors list
      const vendorsResponse = await fetch('/api/vendors')
      const data = await vendorsResponse.json()
      setVendors(data)
      setFilteredVendors(data)
      calculateStats(data)
    } catch (error) {
      console.error('Error seeding vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is authenticated and get role
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Use the new token utility to decode and validate the token
    const decoded = decodeToken(token)
    if (!decoded) {
      console.error('Invalid token')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }

    setUserRole(decoded.role)
    setUserEmail(decoded.email)

    const fetchVendors = async () => {
      try {
        setIsInitialLoading(true)
        const response = await fetch('/api/vendors')
        const data = await response.json()
        setVendors(data)
        setFilteredVendors(data)
        calculateStats(data)
      } catch (error) {
        console.error('Error fetching vendors:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchVendors()
  }, [])

  useEffect(() => {
    let filtered = [...vendors]

    if (scopeFilter !== 'all') {
      filtered = filtered.filter((vendor) => 
        vendor.scopes.includes(scopeFilter)
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.contacts.some((contact) =>
            contact.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Sort vendors by RFI status and last update
    filtered.sort((a, b) => {
      // First priority: RFI Received status
      if (a.rfiReceived && !b.rfiReceived) return -1;
      if (!a.rfiReceived && b.rfiReceived) return 1;

      // Second priority: RFI Status (Completed > In Progress > Under Review > null)
      const statusPriority = {
        'Completed': 3,
        'In Progress': 2,
        'Under Review': 1,
        null: 0
      };
      const aStatusPriority = statusPriority[a.rfiStatus as keyof typeof statusPriority] || 0;
      const bStatusPriority = statusPriority[b.rfiStatus as keyof typeof statusPriority] || 0;
      if (aStatusPriority !== bStatusPriority) {
        return bStatusPriority - aStatusPriority;
      }

      // Third priority: Updated date
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setFilteredVendors(filtered)
  }, [scopeFilter, searchTerm, vendors])

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'Media':
        return 'bg-blue-500'
      case 'AI':
        return 'bg-green-500'
      case 'Consulting':
        return 'bg-purple-500'
      case 'Technology':
        return 'bg-orange-500'
      case 'Integration':
        return 'bg-pink-500'
      case 'Cloud':
        return 'bg-cyan-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDialogOpen(true)
  }

  const handleUpdateRFIStatus = async (vendorId: number, rfiReceived: boolean, rfiStatus: string | null) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: vendorId,
          rfiReceived,
          rfiStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update vendor')
      }

      const updatedVendor = await response.json()
      
      // Update vendors list
      setVendors(vendors.map(v => v.id === vendorId ? updatedVendor : v))
      setSelectedVendor(updatedVendor)
    } catch (error) {
      console.error('Error updating vendor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white">
      <Header />
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RFI Vendor Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Track and manage vendor information across different scopes
            </p>
          </div>
          <div className="flex items-center gap-2">

            {isAdmin && (
              <AddVendorDialog
                onVendorAdded={() => {
                  // Refresh vendors list
                  const fetchVendors = async () => {
                    try {
                      const response = await fetch('/api/vendors')
                      const data = await response.json()
                      setVendors(data)
                      setFilteredVendors(data)
                      calculateStats(data)
                    } catch (error) {
                      console.error('Error fetching vendors:', error)
                    }
                  }
                  fetchVendors()
                }}
              />
            )}
            <Button
              onClick={seedVendors}
              disabled={isLoading}
              className="flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Initialize Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isInitialLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-8 w-[60px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Vendors</p>
                      <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">
                      <Building2 className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Media & AI Vendors</p>
                      <p className="text-3xl font-bold mt-1">{stats.mediaAndAI}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-500">Media</Badge>
                      <Badge className="bg-green-500">AI</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalContacts}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Capability Distribution</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-blue-500">{stats.totalMedia}</Badge>
                        <span className="text-sm text-gray-600">Media Vendors</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-green-500">{stats.totalAI}</Badge>
                        <span className="text-sm text-gray-600">AI Vendors</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <Badge className="bg-blue-500">M</Badge>
                          <Badge className="bg-green-500">AI</Badge>
                        </div>
                        <span className="text-sm text-gray-600">Both Capabilities</span>
                        <span className="text-sm font-medium ml-auto">{stats.mediaAndAI}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
            <CardDescription>
              Browse and search through all registered vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="md:w-1/3">
                <Select
                  value={scopeFilter}
                  onValueChange={(value) => setScopeFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scopes</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Integration">Integration</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-2/3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {isScoreVisible && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExport()}
                    disabled={isExporting}
                    className="shrink-0"
                    title="Export all evaluations"
                  >
                    <FileDown className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
            </div>

            {isInitialLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No vendors found matching your criteria. Try adjusting your search or filters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Vendor Name</TableHead>
                      <TableHead className="w-[150px]">Scopes</TableHead>
                      <TableHead className="w-[150px]">RFI Status</TableHead>
                      <TableHead className="w-[150px]">Final Decision</TableHead>
                      <TableHead className="w-[150px]">Added</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow 
                        key={vendor.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleVendorClick(vendor)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{vendor.name}</span>
                            {isScoreVisible && (
                              <div className="flex items-center gap-2">
                                {vendor.averageScore !== null && (
                                  <Badge variant="secondary" className="ml-2">
                                    Score: {vendor.averageScore.toFixed(2)}%
                                  </Badge>
                                )}
                                {vendor.evaluations && vendor.evaluations.length > 0 && (
                                  <div className="flex -space-x-2">
                                    {Array.from(new Set(vendor.evaluations.map((e: any) => e.evaluator?.id))).map((evaluatorId: string) => {
                                      const evaluation = vendor.evaluations?.find((e: any) => e.evaluator?.id === evaluatorId);
                                      if (!evaluation?.evaluator?.email) return null;
                                      const initials = evaluation.evaluator.name 
                                        ? evaluation.evaluator.name.split(' ').map(part => part[0]?.toUpperCase()).join('').slice(0, 2)
                                        : evaluation.evaluator.email.split('@')[0].split('.').map(part => part[0]?.toUpperCase()).join('').slice(0, 2);
                                      return (
                                        <Avatar key={evaluatorId} className="h-6 w-6 border-2 border-background">
                                          <AvatarImage 
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${evaluation.evaluator.email}&backgroundColor=2563eb`}
                                            alt={evaluation.evaluator.name || evaluation.evaluator.email}
                                          />
                                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {initials}
                                          </AvatarFallback>
                                        </Avatar>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {vendor.scopes.map((scope) => (
                              <Badge key={scope} className={getScopeBadgeColor(scope)}>
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Badge
                              className={
                                vendor.rfiReceived
                                  ? 'bg-green-500'
                                  : 'bg-gray-500'
                              }
                            >
                              {vendor.rfiReceived ? 'Received' : 'Not Received'}
                            </Badge>
                            {vendor.rfiStatus && (
                              <Badge className="bg-blue-500">
                                {vendor.rfiStatus}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.finalDecision ? (
                            <Badge className={vendor.finalDecision === 'ACCEPTED' ? 'bg-green-500' : 'bg-red-500'}>
                              {vendor.finalDecision === 'ACCEPTED' ? '✓ Accepted' : '✗ Rejected'}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(vendor.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isScoreVisible && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <VendorActions vendorId={vendor.id} vendorName={vendor.name} />
                              </div>
                            )}
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedVendor(vendor);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      {selectedVendor && (
        <VendorEditDialog
          vendor={selectedVendor}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onVendorUpdated={() => {
            // Refresh vendors list
            const fetchVendors = async () => {
              try {
                const response = await fetch('/api/vendors');
                const data = await response.json();
                setVendors(data);
                setFilteredVendors(data);
                calculateStats(data);
              } catch (error) {
                console.error('Error fetching vendors:', error);
              }
            };
            fetchVendors();
          }}
        />
      )}

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              {selectedVendor?.name}
              <div className="flex gap-1 flex-wrap">
                {selectedVendor?.scopes.map((scope) => (
                  <Badge key={scope} className={getScopeBadgeColor(scope)}>
                    {scope}
                  </Badge>
                ))}
              </div>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Detailed vendor information
              <div className="flex items-center gap-2 ml-auto">
                {isScoreVisible && selectedVendor?.averageScore !== null && selectedVendor?.averageScore !== undefined && (
                  <Badge variant="secondary">
                    Overall Score: {selectedVendor?.averageScore.toFixed(2)}%
                  </Badge>
                )}
                {isScoreVisible && selectedVendor?.evaluations && selectedVendor.evaluations.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleExport(selectedVendor.id);
                    }}
                    disabled={isExporting}
                    className="h-8 w-8"
                    title="Export vendor evaluations"
                  >
                    <FileDown className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                <div className="grid gap-2">
                  {selectedVendor?.contacts.map((contact, index) => (
                    <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a
                        href={`mailto:${contact}`}
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">RFI Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">RFI Status</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={selectedVendor?.rfiReceived ? "default" : "outline"}
                        size="sm"
                        onClick={() => selectedVendor && handleUpdateRFIStatus(selectedVendor.id, true, selectedVendor.rfiStatus)}
                        disabled={isLoading}
                        className="shadow-sm"
                      >
                        Received
                      </Button>
                      <Button
                        variant={!selectedVendor?.rfiReceived ? "default" : "outline"}
                        size="sm"
                        onClick={() => selectedVendor && handleUpdateRFIStatus(selectedVendor.id, false, null)}
                        disabled={isLoading}
                        className="shadow-sm"
                      >
                        Not Received
                      </Button>
                    </div>
                  </div>
                  {selectedVendor?.rfiReceived && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">RFI Progress</span>
                      <Select
                        value={selectedVendor.rfiStatus || ""}
                        onValueChange={(value) => selectedVendor && handleUpdateRFIStatus(selectedVendor.id, true, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedVendor?.rfiReceivedAt && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Received Date</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedVendor.rfiReceivedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {isScoreVisible && selectedVendor?.evaluations && selectedVendor.evaluations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Evaluation Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Evaluations</span>
                      <span className="text-sm font-medium">{selectedVendor.evaluations.length}</span>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg space-y-2">
                      <span className="text-sm text-gray-600">Evaluators</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.from(new Set(selectedVendor.evaluations?.map(e => e.evaluator.id) || [])).map(evaluatorId => {
                          const evaluator = selectedVendor.evaluations?.find(e => e.evaluator.id === evaluatorId)?.evaluator;
                          if (!evaluator) return null;
                          return (
                            <div key={evaluator.id} className="flex items-center gap-2 bg-white p-1.5 rounded-md border">
                              <Avatar className="h-6 w-6">
                                <AvatarImage 
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${evaluator.email}&radius=50&backgroundColor=2563eb&chars=2&size=128`}
                                  alt={evaluator.name || evaluator.email}
                                />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {evaluator.name 
                                    ? evaluator.name.split(' ').map(part => part[0]?.toUpperCase()).join('').slice(0, 2)
                                    : evaluator.email.split('@')[0].split('.').map(part => part[0]?.toUpperCase()).join('').slice(0, 2)
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{evaluator.name}</span>
                                <span className="text-xs text-gray-500">{evaluator.role.toLowerCase()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Added</span>
                    <span className="text-sm font-medium">
                      {formatDate(selectedVendor?.createdAt || '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium">
                      {formatDate(selectedVendor?.updatedAt || '')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                {selectedVendor && (
                  <VendorEvaluation
                    vendorId={selectedVendor.id}
                    vendorName={selectedVendor.name}
                    scopes={selectedVendor.scopes}
                    onEvaluationSubmitted={() => {
                      // Refresh both the vendor list and the selected vendor data
                      const fetchVendors = async () => {
                        try {
                          const response = await fetch('/api/vendors')
                          const data = await response.json()
                          setVendors(data)
                          setFilteredVendors(data)
                          calculateStats(data)
                          
                          // Update selected vendor with new data
                          const updatedVendor = data.find((v: any) => v.id === selectedVendor.id)
                          if (updatedVendor) {
                            setSelectedVendor(updatedVendor)
                          }
                        } catch (error) {
                          console.error('Error fetching vendors:', error)
                        }
                      }
                      fetchVendors()
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}