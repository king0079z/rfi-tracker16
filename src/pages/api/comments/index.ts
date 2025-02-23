import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { content, evaluationId, evaluatorId } = req.body
      const comment = await prisma.comment.create({
        data: {
          content,
          evaluationId: parseInt(evaluationId),
          evaluatorId: parseInt(evaluatorId),
        },
        include: {
          evaluator: true,
        },
      })
      return res.status(201).json(comment)
    } catch (error) {
      console.error('Error creating comment:', error)
      return res.status(500).json({ error: 'Error creating comment' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}