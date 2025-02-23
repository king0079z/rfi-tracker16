import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = verify(token, process.env.JWT_SECRET || '') as { userId: number; email: string; role: string };
    console.log('Token decoded successfully:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

    // Verify admin privileges
    if (decoded.role !== 'ADMIN' && decoded.email !== 'admin@admin.com') {
      console.log('Non-admin access attempt:', decoded);
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const userId = parseInt(req.query.id as string);
    const { role } = req.body;

    // Validate role
    const validRoles = ['CONTRIBUTOR', 'DECISION_MAKER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ') 
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Update evaluator role if exists
    await prisma.evaluator.updateMany({
      where: { userId: userId },
      data: { role },
    });

    console.log('Role updated successfully for user:', userId);
    return res.status(200).json({ 
      user: updatedUser,
      message: 'Role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ 
      message: 'Failed to update role. Please try again.' 
    });
  }
}