import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verify(token, process.env.JWT_SECRET || '') as { role: string; email: string };
    if (decoded.role !== 'ADMIN' && decoded.email !== 'admin@admin.com') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get all evaluations with vendor and evaluator details
    const evaluations = await prisma.evaluation.findMany({
      include: {
        vendor: true,
        evaluator: true,
      },
    });

    const formattedEvaluations = evaluations.map(evaluation => ({
      id: evaluation.id,
      vendorName: evaluation.vendor.name,
      evaluatorName: evaluation.evaluator.name,
      submittedAt: evaluation.createdAt,
      score: 0, // TODO: Implement proper scoring logic
      status: evaluation.status || 'PENDING',
    }));

    return res.status(200).json(formattedEvaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}