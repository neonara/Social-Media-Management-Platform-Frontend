"use client";

interface ValidationResult {
  isValid: boolean;
  user?: {
    id: number;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    roles: {
      is_administrator: boolean;
      is_superadministrator: boolean;
      is_moderator: boolean;
      is_community_manager: boolean;
      is_client: boolean;
    };
  };
  error?: string;
}

interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
}

class TokenValidationCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get cached validation result for a token
   */
  getCachedValidation(token: string): ValidationResult | null {
    const entry = this.cache.get(token);

    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(token);
      return null;
    }

    console.log("Token validation cache hit");
    return entry.result;
  }

  /**
   * Cache validation result for a token
   */
  setCachedValidation(token: string, result: ValidationResult): void {
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
    };

    this.cache.set(token, entry);

    // Clean up expired entries periodically
    this.cleanupExpiredEntries();
  }

  /**
   * Clear all cached validation results
   */
  clearCache(): void {
    this.cache.clear();
    console.log("Token validation cache cleared");
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [token, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(token);
      }
    }
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export a singleton instance
export const tokenValidationCache = new TokenValidationCache();
