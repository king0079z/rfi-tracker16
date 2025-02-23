import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!(decoded?.role === 'ADMIN' || decoded?.email === 'admin@admin.com')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const userId = parseInt(req.query.id as string);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { permission, value } = req.body;
    if (!['canAccessChat', 'canMakeDirectDecision', 'canPrintReports', 'canExportData'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission type' });
    }

    // Update user permissions
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [permission]: value,
      },
      select: {
        id: true,
        email: true,
        role: true,
        canAccessChat: true,
        canMakeDirectDecision: true,
        canPrintReports: true,
        canExportData: true,
      },
    });

    console.log(`Updated permissions for user ${userId}: ${permission} = ${value}`);
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user permissions:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
}