import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only decision makers can manage vendors
  if (req.user.role !== 'DECISION_MAKER') {
    return res.status(403).json({ message: 'Only decision makers can manage vendors' });
  }

  if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      const vendorId = Number(id);
      const { name } = req.body;

      if (!id || isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Valid vendor name is required' });
      }

      // First check if the vendor exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { id: vendorId }
      });

      if (!existingVendor) {
        console.error(`Vendor not found for ID: ${vendorId}`);
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Check if the new name is already taken by another vendor
      const duplicateVendor = await prisma.vendor.findFirst({
        where: {
          name: name.trim(),
          id: { not: vendorId } // exclude current vendor from check
        }
      });

      if (duplicateVendor) {
        return res.status(400).json({ 
          message: 'A vendor with this name already exists' 
        });
      }

      console.log(`Updating vendor ${existingVendor.id} name from "${existingVendor.name}" to "${name}"`);

      // Update the vendor using a transaction to ensure data consistency
      const updatedVendor = await prisma.$transaction(async (tx) => {
        // Update the vendor name
        const vendor = await tx.vendor.update({
          where: { id: vendorId },
          data: { name: name.trim() },
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
            },
            votes: true,
            chatMessages: true
          }
        });

        return vendor;
      });

      // Calculate average score for the updated vendor
      const scores = updatedVendor.evaluations.map(e => e.overallScore);
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

      console.log(`Successfully updated vendor ${vendorId} name to "${name}"`);

      return res.status(200).json({
        ...updatedVendor,
        averageScore
      });
    } catch (error) {
      console.error('Error updating vendor:', error);
      return res.status(500).json({ 
        message: 'Internal server error while updating vendor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);