import { NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (!req.user) {
    console.error('Evaluations API: Unauthorized access attempt')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    console.error(`Evaluations API: Invalid method ${req.method}`)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const vendorId = parseInt(req.query.vendorId as string)
    const { role, evaluatorId } = req.user
    
    if (isNaN(vendorId)) {
      console.error(`Evaluations API: Invalid vendor ID ${req.query.vendorId}`)
      return res.status(400).json({ error: 'Invalid vendor ID' })
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      console.error(`Evaluations API: Vendor not found ID=${vendorId}`)
      return res.status(404).json({ error: 'Vendor not found' })
    }

    let evaluations;

    // All authenticated users can see evaluations based on their role
    if (role === 'CONTRIBUTOR') {
      evaluations = await prisma.evaluation.findMany({
        where: {
          vendorId: vendorId,
          evaluatorId: evaluatorId
        },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Decision makers and admins can see all evaluations
      evaluations = await prisma.evaluation.findMany({
        where: {
          vendorId: vendorId
        },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    // Calculate total weight and other metrics
    const evaluationSummary = evaluations.reduce((acc, evaluation) => {
      return {
        totalWeight: (acc.totalWeight || 0) + (evaluation.weight || 0),
        totalScore: (acc.totalScore || 0) + (evaluation.overallScore || 0),
        count: (acc.count || 0) + 1,
        evaluators: [...(acc.evaluators || []), evaluation.evaluator]
      }
    }, { totalWeight: 0, totalScore: 0, count: 0, evaluators: [] });

    const uniqueEvaluators = Array.from(new Set(evaluationSummary.evaluators.map(e => e.id)))
      .map(id => evaluationSummary.evaluators.find(e => e.id === id))
      .filter(Boolean);

    return res.status(200).json({
      evaluations,
      summary: {
        totalWeight: evaluationSummary.totalWeight,
        averageScore: evaluationSummary.count > 0 ? evaluationSummary.totalScore / evaluationSummary.count : 0,
        evaluationsCount: evaluationSummary.count,
        uniqueEvaluators: uniqueEvaluators.length,
        evaluators: uniqueEvaluators
      }
    })
  } catch (error: any) {
    console.error('Error fetching evaluations:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch evaluations',
      details: process.env.NODE_ENV === 'development' ? error.message || 'Unknown error' : undefined
    })
  }
}

export default withAuth(handler)