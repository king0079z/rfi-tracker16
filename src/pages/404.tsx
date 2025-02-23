import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  const [slotInfo, setSlotInfo] = useState({
    hostname: '',
    slotName: ''
  })

  useEffect(() => {
    setSlotInfo({
      hostname: process.env.AZURE_WEBSITE_HOSTNAME || window.location.hostname,
      slotName: process.env.WEBSITE_SLOT_NAME || 'production'
    })
  }, [])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The requested page or deployment slot is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Current environment:</p>
              <p>Hostname: {slotInfo.hostname}</p>
              <p>Slot: {slotInfo.slotName}</p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}