import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: number;
    email: string;
    role: string;
    evaluatorId?: number;
    name?: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Check JWT secret
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Try to get token from different sources
      let token: string | undefined;

      // 1. Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      // 2. Check cookies if no token in header
      if (!token && req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) {
        console.error('No token found in request');
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        const decoded = verify(token, process.env.JWT_SECRET) as any;
        
        // Validate token payload
        if (!decoded.userId || !decoded.email || !decoded.role) {
          console.error('Invalid token payload:', decoded);
          return res.status(401).json({ error: 'Invalid token' });
        }

        // Set user information in request
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          evaluatorId: decoded.evaluatorId,
          name: decoded.name,
        };

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.error('Token expired');
          return res.status(401).json({ error: 'Token expired' });
        }

        return handler(req, res);
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}