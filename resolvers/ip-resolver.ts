import type { KeyResolver } from "../core/types";

export interface IpResolverOptions {
  /**
   * Number of trusted proxy hops in front of the application.
   * When set, the client IP is extracted from the Nth-from-right entry
   * in x-forwarded-for, which prevents spoofing via injected headers.
   *
   * Examples:
   *   0 (default) — take the leftmost (first) IP (legacy behavior, spoofable)
   *   1 — one proxy (e.g., nginx): take the last IP
   *   2 — two proxies (e.g., CDN → load balancer): take the 2nd-from-right
   */
  trustedProxyDepth?: number;
}

/**
 * Resolves client IP with a secure priority order:
 *
 * 1. cf-connecting-ip — set by Cloudflare, cannot be spoofed by clients
 * 2. x-real-ip — set by nginx/similar, trusted when configured correctly
 * 3. x-forwarded-for — parsed with trustedProxyDepth to prevent spoofing
 * 4. 'anonymous' — fallback for direct connections without proxy headers
 */
export function ipResolver(options: IpResolverOptions = {}): KeyResolver {
  const depth = options.trustedProxyDepth ?? 0;

  return (request: Request): string => {
    // Prefer proxy-set headers that clients cannot spoof
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp;

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;

    // Fall back to x-forwarded-for with depth-based extraction
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const ips = xff.split(",").map((ip) => ip.trim()).filter(Boolean);
      if (ips.length > 0) {
        if (depth > 0) {
          const index = Math.max(0, ips.length - depth);
          return ips[index]!;
        }
        return ips[0]!;
      }
    }

    return "anonymous";
  };
}
