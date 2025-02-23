import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const vendorId = parseInt(req.query.id as string);

  if (isNaN(vendorId)) {
    return res.status(400).json({ error: 'Invalid vendor ID' });
  }

  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    decodedToken = verify(token, process.env.JWT_SECRET) as any;
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const userId = decodedToken.userId;

      // Get all votes for the vendor with user information
      const votes = await prisma.vendorVote.findMany({
        where: { vendorId },
        include: {
          user: {
            select: {
              name: true,
              role: true
            }
          }
        }
      });

      // Get vendor's final decision
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { finalDecision: true },
      });

      // Calculate stats
      const totalVotes = votes.length;
      const acceptVotes = votes.filter(v => v.vote === 'ACCEPT').length;
      const rejectVotes = votes.filter(v => v.vote === 'REJECT').length;
      
      // Get user's vote if userId provided
      const userVote = votes.find(v => v.userId === userId)?.vote || null;

      // Format votes with user information
      const voterInfo = votes.map(vote => ({
        name: vote.user.name,
        role: vote.user.role,
        vote: vote.vote
      }));

      return res.status(200).json({
        totalVotes,
        acceptVotes,
        rejectVotes,
        userVote,
        finalDecision: vendor?.finalDecision || null,
        voters: voterInfo
      });
    } catch (error) {
      console.error('Error fetching vote stats:', error);
      return res.status(500).json({ error: 'Failed to fetch vote statistics' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const userId = decodedToken.userId;

      // Delete the user's vote
      await prisma.vendorVote.delete({
        where: {
          vendorId_userId: {
            vendorId,
            userId,
          },
        },
      });

      // Recalculate voting results
      const votes = await prisma.vendorVote.findMany({
        where: { vendorId },
      });

      const totalVotes = votes.length;
      const acceptVotes = votes.filter(v => v.vote === 'ACCEPT').length;
      const acceptPercentage = totalVotes > 0 ? (acceptVotes / totalVotes) * 100 : 0;

      // Update vendor's final decision based on remaining votes
      if (totalVotes >= 3) {
        const finalDecision = acceptPercentage > 50 ? 'ACCEPTED' : 'REJECTED';
        await prisma.vendor.update({
          where: { id: vendorId },
          data: { 
            finalDecision,
            rfiStatus: 'COMPLETED'
          },
        });
      } else {
        // If less than 3 votes, clear the final decision
        await prisma.vendor.update({
          where: { id: vendorId },
          data: { 
            finalDecision: null,
            rfiStatus: 'IN_PROGRESS'
          },
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error clearing vendor vote:', error);
      return res.status(500).json({ error: 'Failed to clear vote' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { vote } = req.body;
      const userId = decodedToken.userId;

      if (!vote || !['ACCEPT', 'REJECT'].includes(vote)) {
        return res.status(400).json({ error: 'Invalid vote value' });
      }

      // Create or update vote
      const vendorVote = await prisma.vendorVote.upsert({
        where: {
          vendorId_userId: {
            vendorId,
            userId,
          },
        },
        update: {
          vote,
        },
        create: {
          vendorId,
          userId,
          vote,
        },
      });

      // Calculate voting results
      const votes = await prisma.vendorVote.findMany({
        where: { vendorId },
      });

      const totalVotes = votes.length;
      const acceptVotes = votes.filter(v => v.vote === 'ACCEPT').length;
      const acceptPercentage = (acceptVotes / totalVotes) * 100;

      // Update vendor's final decision if more than 50% votes are in
      if (totalVotes >= 3) { // Minimum 3 votes needed
        const finalDecision = acceptPercentage > 50 ? 'ACCEPTED' : 'REJECTED';
        await prisma.vendor.update({
          where: { id: vendorId },
          data: { 
            finalDecision,
            rfiStatus: 'COMPLETED' // Automatically set RFI status to COMPLETED when final decision is made
          },
        });
      }

      return res.status(200).json({ success: true, vote: vendorVote });
    } catch (error) {
      console.error('Error in vendor vote API:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}