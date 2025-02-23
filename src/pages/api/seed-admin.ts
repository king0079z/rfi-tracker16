import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Delete existing admin user if exists (to ensure clean state)
    await prisma.user.deleteMany({
      where: {
        email: 'admin@admin.com',
      },
    });

    // Create admin user
    const hashedPassword = await hash('a5013463', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Admin User',
      },
    });

    const { password: _, ...adminWithoutPassword } = adminUser;
    return res.status(201).json({
      message: 'Admin user created successfully',
      user: adminWithoutPassword,
    });
  } catch (error) {
    console.error('Error seeding admin user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}