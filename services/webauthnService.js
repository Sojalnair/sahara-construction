/**
 * WebAuthn Service
 * Handles WebAuthn registration and authentication operations
 */

const {
  generateRegistrationOptions: generateOptions,
  verifyRegistrationResponse: verifyResponse,
  generateAuthenticationOptions: generateAuthOptions,
  verifyAuthenticationResponse: verifyAuthResponse
} = require('@simplewebauthn/server');
const { getConfig } = require('../config/env');
const Credential = require('../models/Credential');

class WebAuthnService {
  constructor() {
    const config = getConfig();
    
    // Relying Party (RP) configuration
    this.rpName = process.env.WEBAUTHN_RP_NAME || 'Sahara Construction';
    this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
    this.origin = process.env.WEBAUTHN_ORIGIN || `http://localhost:${config.port}`;
    
    // Supported algorithms (ES256 preferred, RS256 as fallback)
    this.supportedAlgorithms = [-7, -257]; // ES256, RS256
  }

  /**
   * Generate registration options for a user
   * @param {Object} user - User object with id, name, email/phone
   * @param {string} userType - "admin" or "employee"
   * @returns {Promise<Object>} Registration options
   */
  async generateRegistrationOptions(user, userType) {
    // Get existing credentials for this user to exclude them
    const existingCredentials = await Credential.find({
      userId: user.id || user._id,
      userType: userType === 'admin' ? 'User' : 'Employee'
    });

    const excludeCredentials = existingCredentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports
    }));

    // Generate user handle (unique identifier)
    const userHandle = `${userType}-${user.id || user._id}`;

    const options = await generateOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userHandle,
      userName: user.email || user.phone || user.name,
      userDisplayName: user.name,
      timeout: 60000, // 60 seconds
      attestationType: 'none', // We don't need attestation for platform authenticators
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Platform authenticators only (Face ID, Touch ID, etc.)
        userVerification: 'required', // Always require biometric/PIN
        residentKey: 'preferred', // Prefer discoverable credentials
        requireResidentKey: false
      },
      supportedAlgorithmIDs: this.supportedAlgorithms
    });

    return options;
  }

  /**
   * Verify registration response from authenticator
   * @param {Object} response - Registration response from client
   * @param {string} expectedChallenge - Expected challenge value
   * @param {string} expectedOrigin - Expected origin (optional, uses default if not provided)
   * @returns {Promise<Object>} Verification result with credential data
   */
  async verifyRegistrationResponse(response, expectedChallenge, expectedOrigin = null) {
    const verification = await verifyResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin || this.origin,
      expectedRPID: this.rpID,
      requireUserVerification: true
    });

    if (!verification.verified) {
      throw new Error('Registration verification failed');
    }

    return {
      verified: true,
      registrationInfo: verification.registrationInfo
    };
  }

  /**
   * Generate authentication options
   * @param {Array} credentials - Array of credential objects from database
   * @returns {Promise<Object>} Authentication options
   */
  async generateAuthenticationOptions(credentials) {
    // Map credentials to the format expected by SimpleWebAuthn
    const allowCredentials = credentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports || ['internal']
    }));

    const options = await generateAuthOptions({
      rpID: this.rpID,
      timeout: 60000, // 60 seconds
      allowCredentials,
      userVerification: 'required' // Always require biometric/PIN
    });

    return options;
  }

  /**
   * Verify authentication response
   * @param {Object} response - Authentication response from client
   * @param {Object} credential - Credential object from database
   * @param {string} expectedChallenge - Expected challenge value
   * @param {string} expectedOrigin - Expected origin (optional)
   * @returns {Promise<Object>} Verification result with new counter
   */
  async verifyAuthenticationResponse(response, credential, expectedChallenge, expectedOrigin = null) {
    // Prepare authenticator data for verification
    const authenticator = {
      credentialID: credential.credentialId,
      credentialPublicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports
    };

    const verification = await verifyAuthResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin || this.origin,
      expectedRPID: this.rpID,
      authenticator,
      requireUserVerification: true
    });

    if (!verification.verified) {
      throw new Error('Authentication verification failed');
    }

    // Validate counter increment (clone detection)
    const { authenticationInfo } = verification;
    const newCounter = authenticationInfo.newCounter;

    // If stored counter is > 0, new counter must be greater
    if (credential.counter > 0 && newCounter <= credential.counter) {
      throw new Error('Counter validation failed - possible cloned authenticator');
    }

    return {
      verified: true,
      newCounter,
      authenticationInfo
    };
  }

  /**
   * Get all credentials for a user
   * @param {string} userId - User ID
   * @param {string} userType - "admin" or "employee"
   * @returns {Promise<Array>} Array of credentials
   */
  async getCredentialsForUser(userId, userType) {
    const modelType = userType === 'admin' ? 'User' : 'Employee';
    
    const credentials = await Credential.find({
      userId,
      userType: modelType
    }).sort({ createdAt: -1 });

    return credentials;
  }

  /**
   * Delete a credential
   * @param {string} credentialId - Credential ID (base64url string)
   * @param {string} userId - User ID
   * @param {string} userType - "admin" or "employee"
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteCredential(credentialId, userId, userType) {
    const modelType = userType === 'admin' ? 'User' : 'Employee';
    
    // Convert base64url string to Buffer for comparison
    const credentialIdBuffer = Buffer.from(credentialId, 'base64url');
    
    const result = await Credential.deleteOne({
      credentialId: credentialIdBuffer,
      userId,
      userType: modelType
    });

    return result.deletedCount > 0;
  }

  /**
   * Get credential by ID
   * @param {Buffer|string} credentialId - Credential ID (Buffer or base64url string)
   * @returns {Promise<Object|null>} Credential object or null
   */
  async getCredentialById(credentialId) {
    // Handle both Buffer and string inputs
    const credentialIdBuffer = Buffer.isBuffer(credentialId)
      ? credentialId
      : Buffer.from(credentialId, 'base64url');

    const credential = await Credential.findOne({
      credentialId: credentialIdBuffer
    });

    return credential;
  }
}

module.exports = new WebAuthnService();
