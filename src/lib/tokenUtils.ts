interface DecodedToken {
  role: string;
  email: string;
  userId: number;
  evaluatorId?: number;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    // Split the token and get the payload part
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the base64 payload using browser-safe approach
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // Validate the required fields
    if (!payload || typeof payload !== 'object' || !payload.role || !payload.email || !payload.userId) {
      return null;
    }

    return {
      role: payload.role,
      email: payload.email,
      userId: payload.userId,
      evaluatorId: payload.evaluatorId
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    return decoded !== null;
  } catch {
    return false;
  }
}