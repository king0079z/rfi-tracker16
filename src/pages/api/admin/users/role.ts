import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.status(200).json({ role: req.user.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);