import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
}

const HEARTBEAT_INTERVAL = 15000 // 15 seconds
const MESSAGE_CHECK_INTERVAL = 1000 // 1 second
const CONNECTION_TIMEOUT = 120000 // 2 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    console.error('Stream Error: Invalid method')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Enable CORS for SSE
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Keep-Alive', `timeout=${CONNECTION_TIMEOUT / 1000}`)

  try {
    const { vendorId, token } = req.query
    const vId = parseInt(vendorId as string)

    if (!token) {
      console.error('Stream Error: Missing authentication token')
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!process.env.JWT_SECRET) {
      console.error('Stream Error: JWT_SECRET is not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Verify token and user permissions
    let userId: number
    try {
      const decoded = verify(token as string, process.env.JWT_SECRET) as any
      if (!decoded.userId || !decoded.role) {
        console.error('Stream Error: Invalid token payload')
        return res.status(401).json({ error: 'Invalid token' })
      }
      userId = decoded.userId

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          role: true,
          canAccessChat: true
        },
      })

      if (!user) {
        console.error('Stream Error: User not found')
        return res.status(404).json({ error: 'User not found' })
      }

      if (!user.canAccessChat) {
        console.error('Stream Error: Chat access disabled for user')
        return res.status(403).json({ error: 'Chat access is disabled for this user' })
      }

      if (user.role !== 'DECISION_MAKER') {
        console.error('Stream Error: Unauthorized role access attempt')
        return res.status(403).json({ error: 'Only decision makers can access chat' })
      }
    } catch (verifyError) {
      console.error('Stream Error: Token verification failed', verifyError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vId }
    })

    if (!vendor) {
      console.error(`Stream Error: Vendor not found ID=${vId}`)
      return res.status(404).json({ error: 'Vendor not found' })
    }

    let isConnectionActive = true
    let lastCheckTime = new Date()
    let lastHeartbeatTime = Date.now()

    // Function to send message to client
    const sendMessage = (data: any) => {
      if (isConnectionActive && !res.writableEnded && res.writable) {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`)
          res.flushHeaders()
        } catch (error: any) {
          console.error('Error sending message:', error)
          isConnectionActive = false
        }
      }
    }

    // Send initial connection confirmation
    sendMessage({ 
      type: 'connected', 
      timestamp: new Date().toISOString(),
      userId: userId,
      vendorId: vId
    })

    // Message checking interval
    const messageInterval = setInterval(async () => {
      if (!isConnectionActive || res.writableEnded || !res.writable) {
        cleanup()
        return
      }

      try {
        const messages = await prisma.chatMessage.findMany({
          where: {
            vendorId: vId,
            createdAt: {
              gt: lastCheckTime,
            },
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        if (messages.length > 0) {
          messages.forEach(message => {
            sendMessage({
              type: 'message',
              id: message.id,
              content: message.content,
              senderId: message.sender.id,
              senderName: message.sender.name,
              createdAt: message.createdAt,
            })
          })
          lastCheckTime = messages[messages.length - 1].createdAt
        }
      } catch (error: any) {
        console.error('SSE Message Check Error:', error)
        sendMessage({ 
          type: 'error', 
          message: 'Error fetching messages',
          timestamp: new Date().toISOString(),
          details: process.env.NODE_ENV === 'development' ? error.message || 'Unknown error' : undefined
        })
      }
    }, MESSAGE_CHECK_INTERVAL)

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      if (!isConnectionActive || res.writableEnded || !res.writable) {
        cleanup()
        return
      }

      const now = Date.now()
      if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
        sendMessage({ 
          type: 'heartbeat', 
          timestamp: new Date().toISOString(),
          userId: userId,
          vendorId: vId
        })
        lastHeartbeatTime = now
      }
    }, HEARTBEAT_INTERVAL)

    // Connection monitoring interval
    const monitorInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastHeartbeatTime > HEARTBEAT_INTERVAL * 3) {
        console.log('Connection timeout detected')
        cleanup()
      }
      
      // Check if connection has exceeded maximum duration
      if (now - lastHeartbeatTime > CONNECTION_TIMEOUT) {
        console.log('Maximum connection duration reached')
        sendMessage({
          type: 'info',
          message: 'Connection timeout reached. Please reconnect.',
          timestamp: new Date().toISOString()
        })
        cleanup()
      }
    }, HEARTBEAT_INTERVAL)

    // Cleanup function
    const cleanup = () => {
      isConnectionActive = false
      clearInterval(messageInterval)
      clearInterval(heartbeatInterval)
      clearInterval(monitorInterval)
      if (!res.writableEnded) {
        res.end()
      }
    }

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected')
      cleanup()
    })

    // Handle connection timeout
    req.on('timeout', () => {
      console.log('Connection timeout')
      cleanup()
    })

    // Handle errors
    req.on('error', (error: any) => {
      console.error('SSE Request Error:', error)
      cleanup()
    })

    // Handle response errors
    res.on('error', (error: any) => {
      console.error('SSE Response Error:', error)
      cleanup()
    })

  } catch (error: any) {
    console.error('Stream Initialization Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message || 'Unknown error' : undefined
    })
  }
}