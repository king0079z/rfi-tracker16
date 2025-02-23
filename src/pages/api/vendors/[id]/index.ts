import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid vendor ID' })
  }

  if (req.method === 'GET') {
    try {
      // Get the token from the Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization token provided' })
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { evaluatorId: number; role: string }

      const vendor = await prisma.vendor.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          evaluations: {
            select: {
              id: true,
              overallScore: true,
              domain: true,
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' })
      }

      // Calculate average score
      const scores = vendor.evaluations.map(e => e.overallScore)
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null

      // Get user from database to check their chat access
      const user = await prisma.user.findFirst({
        where: {
          evaluator: {
            id: decoded.evaluatorId
          }
        }
      })

      // Check if chat is enabled for this user
      const chatEnabled = vendor.chatEnabled && (user?.canAccessChat ?? true)

      return res.status(200).json({
        ...vendor,
        averageScore,
        chatEnabled
      })
    } catch (error) {
      console.error('Error fetching vendor:', error)
      return res.status(500).json({ error: 'Failed to fetch vendor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}