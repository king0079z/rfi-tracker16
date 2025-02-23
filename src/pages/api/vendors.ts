import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const vendors = await prisma.vendor.findMany({
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
        },
        orderBy: {
          name: 'asc',
        },
      })

      // Calculate average weighted score for each vendor
      const vendorsWithScore = vendors.map(vendor => {
        const scores = vendor.evaluations.map(e => e.overallScore)
        const averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null

        return {
          ...vendor,
          averageScore
        }
      })

      return res.status(200).json(vendorsWithScore)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      return res.status(500).json({ error: 'Failed to fetch vendors' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, contacts, scopes } = req.body

      if (!name || !contacts || !scopes || scopes.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Validate scopes
      const validScopes = ['Media', 'AI']
      const invalidScopes = scopes.filter((scope: string) => !validScopes.includes(scope))
      if (invalidScopes.length > 0) {
        return res.status(400).json({ error: `Invalid scopes: ${invalidScopes.join(', ')}` })
      }

      const newVendor = await prisma.vendor.create({
        data: {
          name,
          contacts,
          scopes,
          rfiStatus: 'Pending',
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

      return res.status(201).json(newVendor)
    } catch (error) {
      console.error('Error creating vendor:', error)
      return res.status(500).json({ error: 'Failed to create vendor' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, rfiReceived, rfiStatus } = req.body
      
      if (!id) {
        return res.status(400).json({ error: 'Vendor ID is required' })
      }

      const updatedVendor = await prisma.vendor.update({
        where: { id: parseInt(id) },
        data: {
          rfiReceived,
          rfiReceivedAt: rfiReceived ? new Date() : null,
          rfiStatus,
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

      // Calculate average score for the updated vendor
      const scores = updatedVendor.evaluations.map(e => e.overallScore)
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null

      return res.status(200).json({
        ...updatedVendor,
        averageScore
      })
    } catch (error) {
      console.error('Error updating vendor:', error)
      return res.status(500).json({ error: 'Failed to update vendor' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}