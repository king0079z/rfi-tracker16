import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only decision makers can clear vendor data
  if (req.user.role !== 'DECISION_MAKER') {
    return res.status(403).json({ message: 'Only decision makers can clear vendor data' });
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const vendorId = Number(id);

      if (!id || isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      // First verify the vendor exists and get its current data
      const existingVendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { 
          id: true,
          name: true 
        }
      });

      if (!existingVendor) {
        console.error(`Vendor not found for ID: ${vendorId}`);
        return res.status(404).json({ message: 'Vendor not found' });
      }

      console.log(`Starting data clear for vendor: ${existingVendor.name} (ID: ${vendorId})`);

      // Use a transaction to ensure all operations complete or none do
      const result = await prisma.$transaction(async (tx) => {
        // 1. Delete chat notifications first (due to foreign key constraints)
        const deletedNotifications = await tx.chatNotification.deleteMany({
          where: {
            message: {
              vendorId: vendorId
            }
          }
        });
        console.log(`Deleted ${deletedNotifications.count} chat notifications`);

        // 2. Delete chat messages
        const deletedMessages = await tx.chatMessage.deleteMany({
          where: {
            vendorId: vendorId
          }
        });
        console.log(`Deleted ${deletedMessages.count} chat messages`);

        // 3. Delete votes - using deleteMany to handle potential duplicates
        const deletedVotes = await tx.vendorVote.deleteMany({
          where: {
            vendorId: vendorId
          }
        });
        console.log(`Deleted ${deletedVotes.count} votes`);

        // 4. Delete evaluation scores
        const deletedScores = await tx.evaluationScore.deleteMany({
          where: {
            vendorId: vendorId
          }
        });
        console.log(`Deleted ${deletedScores.count} evaluation scores`);

        // 5. Reset vendor's data while preserving the name and id
        const updatedVendor = await tx.vendor.update({
          where: {
            id: vendorId
          },
          data: {
            finalDecision: null,
            evaluationSummary: null,
            rfiStatus: 'IN_PROGRESS',
            rfiReceived: false,
            rfiReceivedAt: null
          }
        });

        return {
          notifications: deletedNotifications.count,
          messages: deletedMessages.count,
          votes: deletedVotes.count,
          scores: deletedScores.count,
          vendor: updatedVendor
        };
      });

      console.log(`Successfully cleared data for vendor ${existingVendor.name}:`, result);

      // Verify that all votes were actually deleted
      const remainingVotes = await prisma.vendorVote.count({
        where: { vendorId: vendorId }
      });

      if (remainingVotes > 0) {
        console.error(`Warning: ${remainingVotes} votes still remain for vendor ${vendorId}`);
        // Force delete any remaining votes
        await prisma.vendorVote.deleteMany({
          where: { vendorId: vendorId }
        });
      }

      return res.status(200).json({ 
        message: 'Vendor data cleared successfully',
        vendor: {
          id: result.vendor.id,
          name: result.vendor.name
        },
        deletedCounts: {
          notifications: result.notifications,
          messages: result.messages,
          votes: result.votes,
          scores: result.scores
        }
      });
    } catch (error) {
      console.error('Error clearing vendor data:', error);
      return res.status(500).json({ 
        message: 'Internal server error while clearing vendor data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);