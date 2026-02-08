import { useState } from 'react';
import axios from 'axios';
import WebAuthnClient from '../../utils/webauthnClient';

// API Base URL - same as App.jsx
const API_URL = import.meta.env.VITE_API_URL || 'https://sahara-construction.onrender.com/api';

// Axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * BiometricRegistration Component
 * Prompts user to register biometric credential after login
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 */
function BiometricRegistration({ user, onComplete, onSkip }) {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Handle biometric registration
   * Implements the complete registration flow:
   * 1. Request registration options from server
   * 2. Use WebAuthn API to create credential
   * 3. Send credential to server for verification and storage
   * 4. Store credential ID locally
   */
  async function handleRegister() {
    setRegistering(true);
    setError('');
    setSuccess(false);

    try {
      // Check if WebAuthn is supported
      if (!WebAuthnClient.isSupported()) {
        throw new Error('Your browser doesn\'t support biometric authentication. Please use a modern browser.');
      }

      // Check if platform authenticator is available
      const available = await WebAuthnClient.isPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('No biometric authenticator found on this device. Please ensure Face ID, Touch ID, fingerprint, or Windows Hello is set up.');
      }

      // Step 1: Start registration - get challenge and options from server
      // Requirements: 1.2, 2.2
      const startResponse = await api.post('/auth/webauthn/register/start');
      
      if (!startResponse.data.success) {
        throw new Error(startResponse.data.message || 'Failed to start registration');
      }

      const options = startResponse.data.data;

      // Step 2: Use WebAuthn API to create credential
      // This will prompt the user for biometric authentication
      // Requirements: 1.2, 2.2
      const credential = await WebAuthnClient.register(options);

      // Step 3: Finish registration - send credential to server for verification
      // Requirements: 1.3, 2.3
      const finishResponse = await api.post('/auth/webauthn/register/finish', credential);

      if (!finishResponse.data.success) {
        throw new Error(finishResponse.data.message || 'Failed to complete registration');
      }

      // Step 4: Store credential ID locally for quick access
      // This allows the login page to show the biometric login button
      // Requirements: 1.4, 2.4
      WebAuthnClient.storeCredentialId(credential.id);

      // Show success message
      setSuccess(true);
      
      // Wait a moment to show success message, then complete
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err) {
      console.error('Biometric registration error:', err);
      
      // Display user-friendly error message
      // Requirements: 1.5, 2.5
      const errorMessage = err.message || 'Failed to register biometric credential. Please try again.';
      setError(errorMessage);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="biometric-registration-modal">
      <div className="modal-overlay" onClick={onSkip}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>🔐 Enable Biometric Login</h3>
        </div>
        
        <div className="modal-body">
          {success ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>Biometric authentication enabled successfully!</p>
              <p className="success-subtext">You can now use Face ID, Touch ID, or fingerprint to log in.</p>
            </div>
          ) : (
            <>
              <p className="modal-description">
                Use Face ID, Touch ID, fingerprint, or Windows Hello for faster and more secure login.
              </p>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span>Quick and convenient login</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔒</span>
                  <span>Enhanced security</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📱</span>
                  <span>Works on all your devices</span>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {registering && (
                <div className="loading-message">
                  <span className="loading-spinner">⏳</span>
                  <p>Please complete the biometric verification on your device...</p>
                </div>
              )}
            </>
          )}
        </div>
        
        {!success && (
          <div className="modal-actions">
            <button 
              onClick={handleRegister} 
              disabled={registering}
              className="primary-btn"
            >
              {registering ? 'Registering...' : 'Register Biometric'}
            </button>
            <button 
              onClick={onSkip} 
              className="secondary-btn"
              disabled={registering}
            >
              Skip for Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BiometricRegistration;
