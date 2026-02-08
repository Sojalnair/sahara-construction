/**
 * Unit Tests for WebAuthn Client Helper
 * Tests browser support detection, localStorage operations, and error formatting
 * 
 * Requirements: 1.5, 2.5, 3.5, 4.5
 */

import WebAuthnClient from './webauthnClient';

// Mock the @simplewebauthn/browser module
jest.mock('@simplewebauthn/browser', () => ({
  startRegistration: jest.fn(),
  startAuthentication: jest.fn()
}));

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

describe('WebAuthnClient Unit Tests', () => {
  // Store original window properties
  let originalPublicKeyCredential;
  let originalLocalStorage;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Save original values
    originalPublicKeyCredential = window.PublicKeyCredential;
    originalLocalStorage = window.localStorage;

    // Mock localStorage
    const localStorageMock = {
      store: {},
      getItem: jest.fn((key) => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock.store[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.store = {};
      })
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    if (originalPublicKeyCredential !== undefined) {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: originalPublicKeyCredential,
        writable: true,
        configurable: true
      });
    } else {
      delete window.PublicKeyCredential;
    }

    // Restore console.error
    console.error.mockRestore();
  });

  describe('Browser Support Detection', () => {
    it('should return true when PublicKeyCredential is available', () => {
      // Mock PublicKeyCredential as available
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: {},
        writable: true,
        configurable: true
      });

      expect(WebAuthnClient.isSupported()).toBe(true);
    });

    it('should return false when PublicKeyCredential is undefined', () => {
      // Remove PublicKeyCredential
      delete window.PublicKeyCredential;

      expect(WebAuthnClient.isSupported()).toBe(false);
    });

    it('should return false when PublicKeyCredential is null', () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: null,
        writable: true,
        configurable: true
      });

      expect(WebAuthnClient.isSupported()).toBe(false);
    });

    it('should check platform authenticator availability when supported', async () => {
      // Mock PublicKeyCredential with isUserVerifyingPlatformAuthenticatorAvailable
      const mockIsAvailable = jest.fn().mockResolvedValue(true);
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: {
          isUserVerifyingPlatformAuthenticatorAvailable: mockIsAvailable
        },
        writable: true,
        configurable: true
      });

      const result = await WebAuthnClient.isPlatformAuthenticatorAvailable();

      expect(result).toBe(true);
      expect(mockIsAvailable).toHaveBeenCalled();
    });

    it('should return false when platform authenticator is not available', async () => {
      const mockIsAvailable = jest.fn().mockResolvedValue(false);
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: {
          isUserVerifyingPlatformAuthenticatorAvailable: mockIsAvailable
        },
        writable: true,
        configurable: true
      });

      const result = await WebAuthnClient.isPlatformAuthenticatorAvailable();

      expect(result).toBe(false);
    });

    it('should return false when WebAuthn is not supported', async () => {
      delete window.PublicKeyCredential;

      const result = await WebAuthnClient.isPlatformAuthenticatorAvailable();

      expect(result).toBe(false);
    });

    it('should handle errors when checking platform authenticator', async () => {
      const mockIsAvailable = jest.fn().mockRejectedValue(new Error('Check failed'));
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: {
          isUserVerifyingPlatformAuthenticatorAvailable: mockIsAvailable
        },
        writable: true,
        configurable: true
      });

      const result = await WebAuthnClient.isPlatformAuthenticatorAvailable();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking platform authenticator:',
        expect.any(Error)
      );
    });
  });

  describe('localStorage Operations', () => {
    describe('Single Credential ID', () => {
      it('should store credential ID in localStorage', () => {
        const credentialId = 'test-credential-id-123';

        WebAuthnClient.storeCredentialId(credentialId);

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'webauthn_credential_id',
          credentialId
        );
        expect(localStorage.store['webauthn_credential_id']).toBe(credentialId);
      });

      it('should retrieve stored credential ID', () => {
        const credentialId = 'test-credential-id-456';
        localStorage.store['webauthn_credential_id'] = credentialId;

        const result = WebAuthnClient.getStoredCredentialId();

        expect(result).toBe(credentialId);
        expect(localStorage.getItem).toHaveBeenCalledWith('webauthn_credential_id');
      });

      it('should return null when no credential ID is stored', () => {
        const result = WebAuthnClient.getStoredCredentialId();

        expect(result).toBeNull();
      });

      it('should clear stored credential ID', () => {
        localStorage.store['webauthn_credential_id'] = 'test-id';

        WebAuthnClient.clearStoredCredentialId();

        expect(localStorage.removeItem).toHaveBeenCalledWith('webauthn_credential_id');
        expect(localStorage.store['webauthn_credential_id']).toBeUndefined();
      });

      it('should handle localStorage errors when storing credential ID', () => {
        localStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        // Should not throw
        expect(() => {
          WebAuthnClient.storeCredentialId('test-id');
        }).not.toThrow();

        expect(console.error).toHaveBeenCalledWith(
          'Error storing credential ID:',
          expect.any(Error)
        );
      });

      it('should handle localStorage errors when getting credential ID', () => {
        localStorage.getItem.mockImplementation(() => {
          throw new Error('Storage access denied');
        });

        const result = WebAuthnClient.getStoredCredentialId();

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          'Error getting credential ID:',
          expect.any(Error)
        );
      });

      it('should handle localStorage errors when clearing credential ID', () => {
        localStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage access denied');
        });

        // Should not throw
        expect(() => {
          WebAuthnClient.clearStoredCredentialId();
        }).not.toThrow();

        expect(console.error).toHaveBeenCalledWith(
          'Error clearing credential ID:',
          expect.any(Error)
        );
      });
    });

    describe('Multiple Credential IDs', () => {
      it('should store multiple credential IDs as JSON', () => {
        const credentialIds = ['id-1', 'id-2', 'id-3'];

        WebAuthnClient.storeCredentialIds(credentialIds);

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'webauthn_credential_ids',
          JSON.stringify(credentialIds)
        );
      });

      it('should retrieve multiple credential IDs', () => {
        const credentialIds = ['id-1', 'id-2', 'id-3'];
        localStorage.store['webauthn_credential_ids'] = JSON.stringify(credentialIds);

        const result = WebAuthnClient.getStoredCredentialIds();

        expect(result).toEqual(credentialIds);
      });

      it('should return empty array when no credential IDs are stored', () => {
        const result = WebAuthnClient.getStoredCredentialIds();

        expect(result).toEqual([]);
      });

      it('should return empty array when stored data is invalid JSON', () => {
        localStorage.store['webauthn_credential_ids'] = 'invalid-json{';

        const result = WebAuthnClient.getStoredCredentialIds();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Error getting credential IDs:',
          expect.any(Error)
        );
      });

      it('should handle localStorage errors when storing credential IDs', () => {
        localStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        expect(() => {
          WebAuthnClient.storeCredentialIds(['id-1', 'id-2']);
        }).not.toThrow();

        expect(console.error).toHaveBeenCalledWith(
          'Error storing credential IDs:',
          expect.any(Error)
        );
      });

      it('should handle empty array of credential IDs', () => {
        WebAuthnClient.storeCredentialIds([]);

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'webauthn_credential_ids',
          '[]'
        );

        const result = WebAuthnClient.getStoredCredentialIds();
        expect(result).toEqual([]);
      });
    });
  });

  describe('Error Message Formatting', () => {
    it('should format NotSupportedError', () => {
      const error = new Error('Not supported');
      error.name = 'NotSupportedError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        "Your browser doesn't support biometric authentication. Please use traditional login."
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format NotAllowedError', () => {
      const error = new Error('Not allowed');
      error.name = 'NotAllowedError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Biometric authentication was cancelled. Please try again or use traditional login.'
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format InvalidStateError', () => {
      const error = new Error('Invalid state');
      error.name = 'InvalidStateError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'This biometric credential is already registered.'
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format SecurityError', () => {
      const error = new Error('Security error');
      error.name = 'SecurityError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        "Security error. Please ensure you're using HTTPS."
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format AbortError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Authentication timed out. Please try again.'
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format NetworkError', () => {
      const error = new Error('Network error');
      error.name = 'NetworkError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Network error. Please check your connection and try again.'
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should format timeout error from message', () => {
      const error = new Error('Request timeout occurred');
      error.name = 'UnknownError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Request timed out. Please try again.'
      );
    });

    it('should format cancel error from message', () => {
      const error = new Error('User cancelled the operation');
      error.name = 'UnknownError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Authentication was cancelled.'
      );
    });

    it('should format unknown error with generic message', () => {
      const error = new Error('Some unknown error');
      error.name = 'UnknownError';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Biometric authentication failed. Please try traditional login.'
      );
    });

    it('should handle error without name property', () => {
      const error = new Error('Error without name');
      delete error.name;

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Biometric authentication failed. Please try traditional login.'
      );
      expect(formatted.originalError).toBe(error);
    });

    it('should handle error without message property', () => {
      const error = new Error();
      error.name = 'SomeError';
      error.message = '';

      const formatted = WebAuthnClient.formatError(error);

      expect(formatted.message).toBe(
        'Biometric authentication failed. Please try traditional login.'
      );
    });

    it('should preserve original error for debugging', () => {
      const originalError = new Error('Original error details');
      originalError.name = 'TestError';
      originalError.stack = 'Error stack trace...';

      const formatted = WebAuthnClient.formatError(originalError);

      expect(formatted.originalError).toBe(originalError);
      expect(formatted.originalError.stack).toBe('Error stack trace...');
    });
  });

  describe('Registration Method', () => {
    it('should call startRegistration with options', async () => {
      const mockOptions = {
        challenge: 'test-challenge',
        rp: { name: 'Test App', id: 'localhost' },
        user: { id: 'user-123', name: 'Test User', displayName: 'Test' }
      };
      const mockResponse = {
        id: 'credential-id',
        rawId: 'raw-credential-id',
        response: { attestationObject: 'attestation', clientDataJSON: 'client-data' }
      };

      startRegistration.mockResolvedValue(mockResponse);

      const result = await WebAuthnClient.register(mockOptions);

      expect(startRegistration).toHaveBeenCalledWith(mockOptions);
      expect(result).toEqual(mockResponse);
    });

    it('should format errors from startRegistration', async () => {
      const mockError = new Error('Registration failed');
      mockError.name = 'NotAllowedError';

      startRegistration.mockRejectedValue(mockError);

      await expect(WebAuthnClient.register({})).rejects.toThrow(
        'Biometric authentication was cancelled. Please try again or use traditional login.'
      );
    });

    it('should preserve original error in formatted error', async () => {
      const mockError = new Error('Registration failed');
      mockError.name = 'SecurityError';

      startRegistration.mockRejectedValue(mockError);

      try {
        await WebAuthnClient.register({});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.originalError).toBe(mockError);
      }
    });
  });

  describe('Authentication Method', () => {
    it('should call startAuthentication with options', async () => {
      const mockOptions = {
        challenge: 'test-challenge',
        allowCredentials: [{ id: 'cred-1', type: 'public-key' }]
      };
      const mockResponse = {
        id: 'credential-id',
        rawId: 'raw-credential-id',
        response: { authenticatorData: 'auth-data', signature: 'signature' }
      };

      startAuthentication.mockResolvedValue(mockResponse);

      const result = await WebAuthnClient.authenticate(mockOptions);

      expect(startAuthentication).toHaveBeenCalledWith(mockOptions);
      expect(result).toEqual(mockResponse);
    });

    it('should format errors from startAuthentication', async () => {
      const mockError = new Error('Authentication failed');
      mockError.name = 'AbortError';

      startAuthentication.mockRejectedValue(mockError);

      await expect(WebAuthnClient.authenticate({})).rejects.toThrow(
        'Authentication timed out. Please try again.'
      );
    });

    it('should preserve original error in formatted error', async () => {
      const mockError = new Error('Authentication failed');
      mockError.name = 'NetworkError';

      startAuthentication.mockRejectedValue(mockError);

      try {
        await WebAuthnClient.authenticate({});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.originalError).toBe(mockError);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle storing very long credential IDs', () => {
      const longId = 'a'.repeat(10000);

      expect(() => {
        WebAuthnClient.storeCredentialId(longId);
      }).not.toThrow();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webauthn_credential_id',
        longId
      );
    });

    it('should handle storing empty string credential ID', () => {
      WebAuthnClient.storeCredentialId('');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webauthn_credential_id',
        ''
      );
    });

    it('should handle storing special characters in credential ID', () => {
      const specialId = 'id-with-special-chars-!@#$%^&*()_+-=[]{}|;:,.<>?';

      WebAuthnClient.storeCredentialId(specialId);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webauthn_credential_id',
        specialId
      );
    });

    it('should handle large arrays of credential IDs', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => `id-${i}`);

      WebAuthnClient.storeCredentialIds(largeArray);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webauthn_credential_ids',
        JSON.stringify(largeArray)
      );
    });

    it('should handle null values gracefully', () => {
      localStorage.store['webauthn_credential_id'] = null;

      const result = WebAuthnClient.getStoredCredentialId();

      expect(result).toBeNull();
    });
  });
});
