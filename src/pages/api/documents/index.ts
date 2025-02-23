import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { vendorId } = req.query
      
      if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' })
      }

      const documents = await prisma.document.findMany({
        where: {
          vendorId: Number(vendorId),
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      })

      res.json(documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
      res.status(500).json({ error: 'Error fetching documents' })
    }
  } else if (req.method === 'POST') {
    try {
      const { name, url, type, domain, vendorId } = req.body

      const document = await prisma.document.create({
        data: {
          name,
          url,
          type,
          domain,
          vendorId: Number(vendorId),
        },
      })

      res.json(document)
    } catch (error) {
      console.error('Error creating document:', error)
      res.status(500).json({ error: 'Error creating document' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}