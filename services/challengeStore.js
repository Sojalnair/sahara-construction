/**
 * Challenge Store
 * In-memory storage for WebAuthn challenges with automatic expiration
 * 
 * In production, consider using Redis for distributed systems
 */

const { v4: uuidv4 } = require('crypto');

class ChallengeStore {
  constructor() {
    this.challenges = new Map();
    this.EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Store a challenge with automatic expiration
   * @param {Object} data - Challenge data
   * @param {string} data.challenge - Base64url encoded challenge
   * @param {string} data.userId - User ID
   * @param {string} data.userType - "admin" or "employee"
   * @param {string} data.type - "registration" or "authentication"
   * @returns {string} challengeId - Unique identifier for this challenge
   */
  storeChallenge(data) {
    const challengeId = uuidv4();
    const now = Date.now();
    
    this.challenges.set(challengeId, {
      ...data,
      createdAt: now,
      expiresAt: now + this.EXPIRATION_TIME
    });
    
    return challengeId;
  }

  /**
   * Retrieve a challenge by ID
   * @param {string} challengeId - Challenge identifier
   * @returns {Object|null} Challenge data or null if not found/expired
   */
  getChallenge(challengeId) {
    const data = this.challenges.get(challengeId);
    
    if (!data) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > data.expiresAt) {
      this.challenges.delete(challengeId);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a challenge (should be called after successful verification)
   * @param {string} challengeId - Challenge identifier
   * @returns {boolean} True if deleted, false if not found
   */
  deleteChallenge(challengeId) {
    return this.challenges.delete(challengeId);
  }

  /**
   * Get challenge by user and type (for authentication flow)
   * @param {string} userId - User ID
   * @param {string} userType - "admin" or "employee"
   * @param {string} type - "registration" or "authentication"
   * @returns {Object|null} Challenge data or null if not found
   */
  getChallengeByUser(userId, userType, type) {
    for (const [challengeId, data] of this.challenges.entries()) {
      if (
        data.userId === userId &&
        data.userType === userType &&
        data.type === type &&
        Date.now() <= data.expiresAt
      ) {
        return { challengeId, ...data };
      }
    }
    return null;
  }

  /**
   * Clean up expired challenges
   * Runs periodically to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [challengeId, data] of this.challenges.entries()) {
      if (now > data.expiresAt) {
        this.challenges.delete(challengeId);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[ChallengeStore] Cleaned up ${deletedCount} expired challenges`);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanup() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
    
    // Ensure cleanup runs on process exit
    process.on('SIGTERM', () => this.stopCleanup());
    process.on('SIGINT', () => this.stopCleanup());
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get statistics about stored challenges
   * @returns {Object} Statistics
   */
  getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    
    for (const data of this.challenges.values()) {
      if (now <= data.expiresAt) {
        active++;
      } else {
        expired++;
      }
    }
    
    return {
      total: this.challenges.size,
      active,
      expired
    };
  }

  /**
   * Clear all challenges (for testing)
   */
  clear() {
    this.challenges.clear();
  }
}

// Export singleton instance
module.exports = new ChallengeStore();
