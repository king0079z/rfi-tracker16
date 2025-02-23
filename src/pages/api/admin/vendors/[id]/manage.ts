import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
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

    const vendorId = parseInt(req.query.id as string);

    if (req.method === 'DELETE') {
      // Delete all related data first
      await prisma.$transaction([
        prisma.chatMessage.deleteMany({
          where: { vendorId },
        }),
        prisma.vendorVote.deleteMany({
          where: { vendorId },
        }),
        prisma.document.deleteMany({
          where: { vendorId },
        }),
        prisma.comment.deleteMany({
          where: {
            evaluation: {
              vendorId,
            },
          },
        }),
        prisma.evaluation.deleteMany({
          where: { vendorId },
        }),
        prisma.vendor.delete({
          where: { id: vendorId },
        }),
      ]);

      return res.status(200).json({ message: 'Vendor deleted successfully' });
    }

    if (req.method === 'PUT') {
      const { action, scopes } = req.body;

      if (action === 'UPDATE_VENDOR') {
        const { data } = req.body;
        const updatedVendor = await prisma.vendor.update({
          where: { id: vendorId },
          data: {
            name: data.name,
            scopes: data.scopes,
            chatEnabled: data.chatEnabled,
            directDecisionEnabled: data.directDecisionEnabled,
          },
        });
        return res.status(200).json(updatedVendor);
      }

      if (action === 'UPDATE_SCOPE') {
        const updatedVendor = await prisma.vendor.update({
          where: { id: vendorId },
          data: { scopes },
        });
        return res.status(200).json(updatedVendor);
      }

      if (action === 'CLEAR_EVALUATIONS') {
        await prisma.$transaction([
          prisma.comment.deleteMany({
            where: {
              evaluation: {
                vendorId,
              },
            },
          }),
          prisma.evaluation.deleteMany({
            where: { vendorId },
          }),
        ]);
        return res.status(200).json({ message: 'Evaluations cleared successfully' });
      }

      if (action === 'CLEAR_CHAT') {
        await prisma.$transaction([
          // First delete chat notifications that reference the messages
          prisma.chatNotification.deleteMany({
            where: {
              message: {
                vendorId
              }
            }
          }),
          // Then delete the chat messages
          prisma.chatMessage.deleteMany({
            where: { vendorId },
          })
        ]);
        return res.status(200).json({ message: 'Chat history cleared successfully' });
      }

      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error managing vendor:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}