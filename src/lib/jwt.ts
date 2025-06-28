// src/lib/jwt.ts
// THIS IS A MOCK JWT UTILITY FOR DEMONSTRATION PURPOSES.
// DO NOT USE IN PRODUCTION. In production, you would use a proper JWT library
// and a secure secret/key managed by your backend/IdP.

const MOCK_JWT_SECRET = 'your-super-secret-key-that-is-not-for-production-use'; // DO NOT USE IN PRODUCTION

interface JwtPayload {
  userId: string;
  role: string; // e.g., 'admin', 'user', 'gtas_analyst'
  exp: number; // Expiration time (Unix timestamp)
}

// Function to simulate signing a JWT
export const signMockJwt = (payload: Omit<JwtPayload, 'exp'>, expiresInMinutes: number = 60): string => {
  const issuedAt = Math.floor(Date.now() / 1000); // Current Unix timestamp
  const expiration = issuedAt + (expiresInMinutes * 60); // Expiration in seconds

  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = { ...payload, exp: expiration, iat: issuedAt };

  // For a real JWT, you'd base64url encode header and claims, then sign
  // with a cryptographic library using the secret.
  // Here, we just base64 encode them for simplicity in mocking.
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedClaims = btoa(JSON.stringify(claims));

  // The "signature" is just a simple hash or static string for mocking
  // In real life, it's a cryptographic signature.
  const signature = btoa(MOCK_JWT_SECRET + encodedHeader + encodedClaims); // Very insecure mock signature

  return `${encodedHeader}.${encodedClaims}.${signature}`;
};

// Function to simulate verifying a JWT
export const verifyMockJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null; // Invalid token format
    }

    const [encodedHeader, encodedClaims, encodedSignature] = parts;

    // Simulate signature validation
    if (encodedSignature !== btoa(MOCK_JWT_SECRET + encodedHeader + encodedClaims)) {
      console.warn('Mock JWT: Signature mismatch.');
      return null; // Signature doesn't match (mock verification)
    }

    const claims: JwtPayload = JSON.parse(atob(encodedClaims));

    // Check expiration
    if (claims.exp * 1000 < Date.now()) {
      console.warn('Mock JWT: Token expired.');
      return null; // Token expired
    }

    return claims;
  } catch (error) {
    console.error('Error verifying mock JWT:', error);
    return null; // Invalid token
  }
};