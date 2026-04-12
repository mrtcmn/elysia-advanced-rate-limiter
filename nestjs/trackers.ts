export interface UserTrackerOptions {
  /**
   * Cookie name to look for a JWT session token.
   * @default "better-auth.session_token"
   */
  cookieName?: string;

  /**
   * Custom JWT parser. Receives the raw token, returns a user ID or null.
   * Default: decodes JWT payload and extracts sub/userId/id.
   */
  parseJwt?: (token: string) => string | null;

  /**
   * Fall back to IP-based tracking when no user identity is found.
   * @default true
   */
  fallbackToIp?: boolean;
}

function defaultParseJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return (payload.sub ?? payload.userId ?? payload.id) as string | null;
  } catch {
    return null;
  }
}

function extractIp(req: any): string {
  const cfIp = req.headers?.["cf-connecting-ip"];
  if (cfIp) return cfIp;

  const realIp = req.headers?.["x-real-ip"];
  if (realIp) return realIp;

  const xff = req.headers?.["x-forwarded-for"];
  if (xff) {
    const first = typeof xff === "string" ? xff.split(",")[0]?.trim() : xff[0];
    if (first) return first;
  }

  return req.ip ?? req.socket?.remoteAddress ?? "anonymous";
}

/**
 * NestJS-compatible tracker that identifies users from JWT/session,
 * with optional IP fallback.
 *
 * Works with Express and Fastify request objects.
 *
 * @example
 * ```ts
 * ThrottlerModule.forRoot({
 *   getTracker: userTracker({ cookieName: "session", fallbackToIp: true }),
 * })
 * ```
 */
export function userTracker(options: UserTrackerOptions = {}): (req: any) => string {
  const cookieName = options.cookieName ?? "better-auth.session_token";
  const parseJwt = options.parseJwt ?? defaultParseJwt;
  const fallbackToIp = options.fallbackToIp ?? true;

  return (req: any): string => {
    // Try Authorization header
    const auth: string | undefined = req.headers?.["authorization"];
    if (auth?.startsWith("Bearer ")) {
      const userId = parseJwt(auth.slice(7));
      if (userId) return `user:${userId}`;
    }

    // Try cookie
    const cookieHeader: string | undefined =
      typeof req.cookies === "object"
        ? req.cookies?.[cookieName]
        : req.headers?.["cookie"];

    if (cookieHeader) {
      let token: string | undefined;

      if (typeof req.cookies === "object") {
        // Express with cookie-parser / Fastify cookie
        token = req.cookies[cookieName];
      } else {
        // Raw cookie header
        const match = cookieHeader
          .split(";")
          .map((c: string) => c.trim())
          .find((c: string) => c.startsWith(`${cookieName}=`));
        if (match) {
          token = match.split("=").slice(1).join("=");
        }
      }

      if (token) {
        const userId = parseJwt(token);
        if (userId) return `user:${userId}`;
      }
    }

    if (fallbackToIp) return extractIp(req);
    return "anonymous";
  };
}
