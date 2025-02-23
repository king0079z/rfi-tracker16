import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify admin token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('No token provided in settings request');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!(decoded?.role === 'ADMIN' || decoded?.email === 'admin@admin.com')) {
      console.error(`Unauthorized access attempt by user: ${decoded?.email}`);
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.method === 'GET') {
      try {
        const settings = await prisma.adminSettings.upsert({
          where: { id: 1 },
          update: {},
          create: {
            id: 1,
            chatEnabled: true,
            directDecisionEnabled: true,
            printEnabled: true,
            exportEnabled: true,
          },
        });
        return res.status(200).json(settings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ message: 'Error fetching settings' });
      }
    }

    if (req.method === 'PUT') {
      const { chatEnabled, directDecisionEnabled, printEnabled, exportEnabled } = req.body;

      if (
        typeof chatEnabled !== 'boolean' || 
        typeof directDecisionEnabled !== 'boolean' ||
        typeof printEnabled !== 'boolean' ||
        typeof exportEnabled !== 'boolean'
      ) {
        console.error('Invalid settings data received:', req.body);
        return res.status(400).json({ message: 'Invalid settings data' });
      }

      try {
        const settings = await prisma.adminSettings.upsert({
          where: { id: 1 },
          update: {
            chatEnabled,
            directDecisionEnabled,
            printEnabled,
            exportEnabled,
          },
          create: {
            id: 1,
            chatEnabled,
            directDecisionEnabled,
            printEnabled,
            exportEnabled,
          },
        });

        console.log('Settings updated successfully:', settings);
        return res.status(200).json(settings);
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ message: 'Error updating settings' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in admin settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}