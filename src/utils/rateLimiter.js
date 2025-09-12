/**
 * Simple in-memory rate limiting utility for file uploads
 * Prevents users from making too many upload attempts in a short time
 */

class RateLimiter {
  constructor(options = {}) {
    this.attempts = {};
    this.maxAttempts = options.maxAttempts || 5;
    this.resetTimeMs = options.resetTimeMs || 60000; // 1 minute default
    
    // Cleanup old entries periodically to prevent memory leaks
    setInterval(this.cleanup.bind(this), 60000);
  }
  
  /**
   * Check if a user has exceeded their rate limit
   * @param {string} userId - Unique identifier for the user
   * @returns {Object} Result with allowed flag and time to reset if blocked
   */
  checkLimit(userId) {
    if (!userId) return { allowed: true }; // Skip rate limiting if no user ID
    
    const now = Date.now();
    
    // Initialize or clean up old entries
    if (!this.attempts[userId] || (now - this.attempts[userId].timestamp > this.resetTimeMs)) {
      this.attempts[userId] = {
        count: 0,
        timestamp: now
      };
    }
    
    // Check if limit exceeded
    if (this.attempts[userId].count >= this.maxAttempts) {
      return {
        allowed: false,
        timeToReset: Math.ceil((this.attempts[userId].timestamp + this.resetTimeMs - now) / 1000)
      };
    }
    
    // Increment counter
    this.attempts[userId].count++;
    return { allowed: true };
  }
  
  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    Object.keys(this.attempts).forEach(userId => {
      if (now - this.attempts[userId].timestamp > this.resetTimeMs) {
        delete this.attempts[userId];
      }
    });
  }
}

// Create a singleton instance for use across the application
const uploadLimiter = new RateLimiter({
  maxAttempts: 10,      // Allow 10 attempts
  resetTimeMs: 300000   // Reset after 5 minutes
});

export default uploadLimiter;