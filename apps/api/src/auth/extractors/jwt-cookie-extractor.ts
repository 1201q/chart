import { Request } from 'express';

/**
 * Custom JWT extractor that supports both cookie-based and header-based authentication.
 * Prioritizes cookies for security, but falls back to Authorization header for backward compatibility.
 *
 * @param req Express request object
 * @returns JWT token string or null if not found
 */
export const jwtCookieOrHeaderExtractor = (req: Request): string | null => {
  // Priority 1: Cookie-based AT (new approach - more secure)
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  // Priority 2: Header-based AT (legacy support for backward compatibility)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};
