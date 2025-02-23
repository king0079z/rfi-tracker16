import { NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!req.user) {
    console.error('Print report attempt without authentication')
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    // Check if printing is enabled in admin settings
    const adminSettings = await prisma.adminSettings.findFirst({
      where: { id: 1 }
    })

    if (!adminSettings?.printEnabled) {
      console.error('Print functionality is disabled by admin')
      return res.status(403).json({ message: 'Print functionality is currently disabled' })
    }

    // Check user's print permission
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    if (!user?.canPrintReports) {
      console.error(`User ${user?.email} attempted to print without permission`)
      return res.status(403).json({ message: 'You do not have permission to print reports' })
    }

    const vendors = await prisma.vendor.findMany({
      where: {
        NOT: {
          rfiStatus: null
        }
      },
      include: {
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true
              }
            },
            comments: {
              include: {
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        },
        votes: true,
        documents: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
      },
      orderBy: {
        name: 'asc'
      }
    })

    if (!vendors || vendors.length === 0) {
      console.log('No vendors found in the database')
      return res.status(200).json([])
    }

    console.log(`Successfully retrieved print report data for ${vendors.length} vendors`)
    return res.status(200).json(vendors)
  } catch (error) {
    console.error('Error fetching print report data:', error)
    return res.status(500).json({ 
      message: 'Error fetching report data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export default withAuth(handler)