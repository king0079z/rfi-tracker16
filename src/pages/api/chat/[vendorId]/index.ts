import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { AuthenticatedRequest, withAuth } from '@/lib/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { vendorId } = req.query
  const vId = parseInt(vendorId as string)

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user has chat access
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        role: true, 
        name: true,
        canAccessChat: true
      },
    })

    if (!user?.canAccessChat) {
      return res.status(403).json({ error: 'Chat access is disabled for this user' })
    }

    if (req.method === 'GET') {
      const messages = await prisma.chatMessage.findMany({
        where: { vendorId: vId },
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

      return res.json(messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender.id,
        senderName: msg.sender.name,
        createdAt: msg.createdAt,
      })))
    }

    if (req.method === 'POST') {
      const { content } = req.body
      const userId = req.user.userId

      if (user?.role !== 'DECISION_MAKER') {
        return res.status(403).json({ error: 'Only decision makers can send messages' })
      }

      // Create the message
      const message = await prisma.chatMessage.create({
        data: {
          content,
          vendorId: vId,
          senderId: userId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Get all decision makers with chat access
      const decisionMakers = await prisma.user.findMany({
        where: {
          role: 'DECISION_MAKER',
          canAccessChat: true,
        },
      })

      // Create notifications for all decision makers except the sender
      await prisma.chatNotification.createMany({
        data: decisionMakers
          .filter(dm => dm.id !== userId)
          .map(dm => ({
            messageId: message.id,
            userId: dm.id,
          })),
      })

      return res.status(201).json({
        id: message.id,
        content: message.content,
        senderId: message.sender.id,
        senderName: message.sender.name,
        createdAt: message.createdAt,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Chat API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withAuth(handler)