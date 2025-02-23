import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GET method to retrieve errors
    if (req.method === 'GET') {
      const { resolved, limit = 10, offset = 0 } = req.query;

      const where = resolved !== undefined ? { resolved: resolved === 'true' } : {};
      
      const errors = await prisma.deploymentError.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await prisma.deploymentError.count({ where });

      return res.status(200).json({
        errors,
        total,
        page: Math.floor(Number(offset) / Number(limit)) + 1,
        totalPages: Math.ceil(total / Number(limit)),
      });
    }

    // POST method to log new error
    if (req.method === 'POST') {
      const {
        errorMessage,
        errorStack,
        errorCode,
        environment,
        component,
        metadata,
      } = req.body;

      if (!errorMessage || !environment) {
        return res.status(400).json({
          error: 'Missing required fields: errorMessage and environment are required',
        });
      }

      const error = await prisma.deploymentError.create({
        data: {
          errorMessage,
          errorStack,
          errorCode,
          environment,
          component,
          metadata: metadata || {},
        },
      });

      console.error(`Deployment Error Logged [${environment}]: ${errorMessage}`);
      if (errorStack) {
        console.error('Stack:', errorStack);
      }

      return res.status(201).json(error);
    }
  } catch (error) {
    console.error('Error handling deployment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}