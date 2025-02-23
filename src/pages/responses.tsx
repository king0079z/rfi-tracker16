import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { ExportButton } from '@/components/ExportButton'

interface Response {
  id: string
  vendorName: string
  evaluatorName: string
  submittedAt: string
  score: number
  status: string
  vendorId: string
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.role !== 'ADMIN') {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      router.push('/login')
      return
    }

    const fetchResponses = async () => {
      try {
        const response = await fetch('/api/admin/evaluations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 403) {
            toast.error('You do not have permission to access this page');
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch responses');
        }
        const data = await response.json();
        setResponses(data);
      } catch (error) {
        console.error('Error fetching responses:', error);
        toast.error('Error loading responses');
      } finally {
        setLoading(false);
      }
    }

    fetchResponses()
  }, [router])

  const handleViewResponse = (vendorId: string) => {
    router.push(`/evaluations/${vendorId}`);
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Responses</h1>
        <ExportButton />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responses.map((response) => (
          <Card key={response.id} className="relative">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{response.vendorName}</span>
                <div className="flex gap-2">
                  <ExportButton vendorId={response.vendorId} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewResponse(response.vendorId)}
                    title="View Response"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Evaluator:</span> {response.evaluatorName}</p>
                <p><span className="font-medium">Submitted:</span> {new Date(response.submittedAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Score:</span> {response.score}</p>
                <p><span className="font-medium">Status:</span> {response.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}