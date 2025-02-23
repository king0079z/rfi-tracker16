import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only decision makers can update vendor status
  if (req.user.role !== 'DECISION_MAKER') {
    return res.status(403).json({ message: 'Only decision makers can update vendor status' });
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { status, finalScore } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const vendor = await prisma.vendor.update({
        where: { id: Number(id) },
        data: {
          rfiStatus: status,
        },
      });

      return res.status(200).json(vendor);
    } catch (error) {
      console.error('Error updating vendor status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);