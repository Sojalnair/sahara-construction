/**
 * WebAuthn Client Helper
 * Utility functions for WebAuthn operations in the browser
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

class WebAuthnClient {
  /**
   * Check if WebAuthn is supported in the browser
   */
  static isSupported() {
    return window.PublicKeyCredential !== undefined;
  }

  /**
   * Check if platform authenticator is available
   */
  static async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking platform authenticator:', error);
      return false;
    }
  }

  /**
   * Register a new credential
   * @param {Object} options - Registration options from server
   * @returns {Promise<Object>} Registration response
   */
  static async register(options) {
    try {
      // Use SimpleWebAuthn browser helper
      const response = await startRegistration(options);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Authenticate with credential
   * @param {Object} options - Authentication options from server
   * @returns {Promise<Object>} Authentication response
   */
  static async authenticate(options) {
    try {
      // Use SimpleWebAuthn browser helper
      const response = await startAuthentication(options);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format WebAuthn errors into user-friendly messages
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  static formatError(error) {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    let userMessage = '';

    switch (errorName) {
      case 'NotSupportedError':
        userMessage = 'Your browser doesn\'t support biometric authentication. Please use traditional login.';
        break;
      case 'NotAllowedError':
        userMessage = 'Biometric authentication was cancelled. Please try again or use traditional login.';
        break;
      case 'InvalidStateError':
        userMessage = 'This biometric credential is already registered.';
        break;
      case 'SecurityError':
        userMessage = 'Security error. Please ensure you\'re using HTTPS.';
        break;
      case 'AbortError':
        userMessage = 'Authentication timed out. Please try again.';
        break;
      case 'NetworkError':
        userMessage = 'Network error. Please check your connection and try again.';
        break;
      default:
        if (errorMessage.includes('timeout')) {
          userMessage = 'Request timed out. Please try again.';
        } else if (errorMessage.includes('cancel')) {
          userMessage = 'Authentication was cancelled.';
        } else {
          userMessage = 'Biometric authentication failed. Please try traditional login.';
        }
    }

    const formattedError = new Error(userMessage);
    formattedError.originalError = error;
    return formattedError;
  }

  /**
   * Store credential ID locally for quick access
   */
  static storeCredentialId(credentialId) {
    try {
      localStorage.setItem('webauthn_credential_id', credentialId);
    } catch (error) {
      console.error('Error storing credential ID:', error);
    }
  }

  /**
   * Get stored credential ID
   */
  static getStoredCredentialId() {
    try {
      return localStorage.getItem('webauthn_credential_id');
    } catch (error) {
      console.error('Error getting credential ID:', error);
      return null;
    }
  }

  /**
   * Clear stored credential ID
   */
  static clearStoredCredentialId() {
    try {
      localStorage.removeItem('webauthn_credential_id');
    } catch (error) {
      console.error('Error clearing credential ID:', error);
    }
  }

  /**
   * Store multiple credential IDs (for users with multiple devices)
   */
  static storeCredentialIds(credentialIds) {
    try {
      localStorage.setItem('webauthn_credential_ids', JSON.stringify(credentialIds));
    } catch (error) {
      console.error('Error storing credential IDs:', error);
    }
  }

  /**
   * Get all stored credential IDs
   */
  static getStoredCredentialIds() {
    try {
      const stored = localStorage.getItem('webauthn_credential_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting credential IDs:', error);
      return [];
    }
  }
}

export default WebAuthnClient;
