import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins and decision makers can access evaluator information
  if (req.user.role !== 'ADMIN' && req.user.role !== 'DECISION_MAKER') {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (req.method === 'GET') {
    try {
      const evaluators = await prisma.evaluator.findMany({
        include: {
          evaluations: true,
          user: {
            select: {
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      // Convert role to string for existing evaluators without user
      const evaluatorsWithRole = evaluators.map(evaluator => ({
        ...evaluator,
        role: evaluator.user?.role || evaluator.role,
      }));
      return res.status(200).json(evaluators);
    } catch (error) {
      console.error('Error fetching evaluators:', error);
      return res.status(500).json({ message: 'Error fetching evaluators' });
    }
  }

  // Only admins can create evaluators
  if (req.method === 'POST' && req.user.role === 'ADMIN') {
    try {
      const { name, email, password, role } = req.body;

      // Create user first
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password,
          role,
          evaluator: {
            create: {
              name,
              email,
              role,
            },
          },
        },
        include: {
          evaluator: true,
        },
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating evaluator:', error);
      return res.status(500).json({ message: 'Error creating evaluator' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);