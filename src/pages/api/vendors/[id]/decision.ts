import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only decision makers can make direct decisions
  if (req.user.role !== 'DECISION_MAKER') {
    return res.status(403).json({ message: 'Only decision makers can make vendor decisions' });
  }

  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const { decision } = req.body;

      if (!id || !decision || !['ACCEPTED', 'REJECTED'].includes(decision)) {
        return res.status(400).json({ message: 'Invalid decision value' });
      }

      const vendor = await prisma.vendor.update({
        where: { id: Number(id) },
        data: {
          finalDecision: decision,
          rfiStatus: 'COMPLETED'
        },
      });

      return res.status(200).json(vendor);
    } catch (error) {
      console.error('Error updating vendor decision:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);