import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VendorVoting } from '@/components/VendorVoting'
import { Loader2, Send } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Message {
  id: number
  content: string
  senderId: number
  senderName: string
  createdAt: string
}

interface VendorChatProps {
  vendorId: number
  vendorName: string
  isOpen: boolean
  onClose: () => void
}

export function VendorChat({ vendorId, vendorName, isOpen, onClose }: VendorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [reconnectCount, setReconnectCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const notificationSound = useRef<HTMLAudioElement | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const lastHeartbeatRef = useRef<number>(Date.now())
  const heartbeatCheckInterval = useRef<NodeJS.Timeout>()
  const connectionMonitorInterval = useRef<NodeJS.Timeout>()
  const MAX_RECONNECT_ATTEMPTS = 10
  const HEARTBEAT_TIMEOUT = 20000
  const BASE_RECONNECT_DELAY = 1000
  const MAX_RECONNECT_DELAY = 10000

  useEffect(() => {
    const audio = new Audio('/notification.mp3')
    audio.load()
    notificationSound.current = audio

    if (isOpen) {
      fetchMessages()
      setupSSE()
      inputRef.current?.focus()
    }

    return () => {
      cleanup()
    }
  }, [isOpen])

  const cleanup = () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    if (heartbeatCheckInterval.current) clearInterval(heartbeatCheckInterval.current)
    if (connectionMonitorInterval.current) clearInterval(connectionMonitorInterval.current)
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
    setMessages([]) // Clear messages when cleaning up
  }

  const clearVendorData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`/api/vendors/${vendorId}/clear-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to clear vendor data')

      // Clear local messages
      setMessages([])
      
      // Force refresh of voting data by fetching it again
      await fetchVoteStats()

      // Verify vendor data after clearing
      const verifyResponse = await fetch(`/api/vendors/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify vendor data after clearing')
      }

      toast({
        title: 'Success',
        description: 'Vendor data cleared successfully',
      })
    } catch (error) {
      console.error('Error clearing vendor data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear vendor data',
        variant: 'destructive',
      })
    }
  }

  const setupConnectionMonitor = () => {
    if (connectionMonitorInterval.current) {
      clearInterval(connectionMonitorInterval.current)
    }

    connectionMonitorInterval.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current
      if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
        console.log('Connection monitor: Connection lost, initiating reconnect...')
        reconnect()
      }
    }, 5000)
  }

  const reconnect = () => {
    cleanup()
    
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus('disconnected')
      toast({
        title: 'Connection Failed',
        description: 'Maximum reconnection attempts reached. Please refresh the page.',
        variant: 'destructive',
      })
      return
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    )

    reconnectAttempts.current++
    setReconnectCount(reconnectAttempts.current)

    toast({
      title: 'Reconnecting...',
      description: `Attempt ${reconnectAttempts.current} of ${MAX_RECONNECT_ATTEMPTS}`,
    })

    reconnectTimeoutRef.current = setTimeout(() => {
      setupSSE()
    }, delay)
  }

  const setupSSE = () => {
    cleanup()
    setConnectionStatus('connecting')

    const token = localStorage.getItem('token')
    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication token not found. Please log in again.',
        variant: 'destructive',
      })
      return
    }

    try {
      eventSourceRef.current = new EventSource(`/api/chat/${vendorId}/stream?token=${token}`)

      eventSourceRef.current.onopen = () => {
        setConnectionStatus('connected')
        lastHeartbeatRef.current = Date.now()
        setupConnectionMonitor()
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'connected' || data.type === 'heartbeat') {
            lastHeartbeatRef.current = Date.now()
            if (data.type === 'connected') setConnectionStatus('connected')
            return
          }

          if (data.type === 'error') {
            console.error('Server reported error:', data.message)
            toast({
              title: 'Error',
              description: data.message,
              variant: 'destructive',
            })
            return
          }

          if (data.type === 'message') {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev
              const newMessages = [...prev, data].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              return newMessages
            })

            if (data.senderId !== parseInt(localStorage.getItem('userId') || '0')) {
              notificationSound.current?.play().catch(console.warn)
              toast({
                title: `New message from ${data.senderName}`,
                description: data.content,
                duration: 3000,
              })
            }
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE Connection Error:', error)
        
        // Check if the connection was never established
        if (connectionStatus === 'connecting') {
          toast({
            title: 'Connection Failed',
            description: 'Unable to establish chat connection. Retrying...',
            variant: 'destructive',
          })
        }
        
        setConnectionStatus('disconnected')
        
        // Add a small delay before reconnecting to prevent rapid reconnection attempts
        setTimeout(() => {
          if (eventSourceRef.current) {
            reconnect()
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error setting up SSE:', error)
      setConnectionStatus('disconnected')
      reconnect()
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`/api/chat/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load messages')
      
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load chat messages',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSubmitting) return

    if (connectionStatus !== 'connected') {
      toast({
        title: 'Error',
        description: 'Chat connection is not active. Please wait for reconnection.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`/api/chat/${vendorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error('Failed to send message')
      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{vendorName}</span>
              <span className={`h-2 w-2 rounded-full ${getConnectionStatusColor()}`} />
              {connectionStatus !== 'connected' && (
                <span className="text-sm text-muted-foreground">
                  Reconnecting ({reconnectCount}/{MAX_RECONNECT_ATTEMPTS})
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[calc(90vh-80px)]">
          <div className="flex-1 flex flex-col h-full p-6 pt-2">
            {connectionStatus === 'disconnected' && reconnectCount >= MAX_RECONNECT_ATTEMPTS && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Connection lost. Please refresh the page to reconnect.
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea 
              className="flex-1 pr-4 mb-4" 
              ref={scrollRef}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {messages.map((message, index) => {
                    const showSender = index === 0 || 
                      messages[index - 1].senderId !== message.senderId ||
                      new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;

                    const isCurrentUser = message.senderId === parseInt(localStorage.getItem('userId') || '0')

                    return (
                      <div key={message.id} 
                           className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        {!isCurrentUser && (
                          <Avatar className="w-8 h-8 mt-1">
                            <span className="text-xs">{message.senderName.substring(0, 2).toUpperCase()}</span>
                          </Avatar>
                        )}
                        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          {showSender && !isCurrentUser && (
                            <div className="text-sm font-semibold mb-1">{message.senderName}</div>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={connectionStatus === 'connected' ? "Type your message..." : "Reconnecting..."}
                className="flex-1"
                disabled={isSubmitting || connectionStatus !== 'connected'}
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || connectionStatus !== 'connected' || !newMessage.trim()}
                className="px-6"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>

          <Separator orientation="vertical" className="h-full" />

          <div className="w-[350px] p-6 overflow-auto">
            <VendorVoting vendorId={vendorId} vendorName={vendorName} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}