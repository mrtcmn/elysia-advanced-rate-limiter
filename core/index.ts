// Types
export type {
  AlgorithmConfig,
  AlgorithmFn,
  FixedWindowConfig,
  KeyResolver,
  RateLimiterOptions,
  RateLimitResult,
  RateLimitStore,
  SlidingWindowConfig,
  StoredState,
  TokenBucketConfig,
} from "./types";

// Algorithms
export { tokenBucket } from "./algorithms/token-bucket";
export { slidingWindow } from "./algorithms/sliding-window";
export { fixedWindow } from "./algorithms/fixed-window";

// Store adapters
export { MemoryStore } from "./adapters/memory-store";
export type { MemoryStoreOptions } from "./adapters/memory-store";
export { RedisStore } from "./adapters/redis-store";
export type { RedisClient } from "./adapters/redis-store";
export { ResilientStore } from "./adapters/resilient-store";

// Key resolvers
export { ipResolver } from "../resolvers/ip-resolver";
export type { IpResolverOptions } from "../resolvers/ip-resolver";
export { userResolver } from "../resolvers/user-resolver";
export { composeResolvers } from "../resolvers/compose";
