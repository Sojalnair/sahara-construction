import { useState, useEffect } from 'react';
import axios from 'axios';
import WebAuthnClient from '../../utils/webauthnClient';

// API Base URL - same as other components
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
 * CredentialManagement Component
 * Allows users to view and manage their biometric credentials
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
function CredentialManagement() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // credentialId to delete

  useEffect(() => {
    loadCredentials();
  }, []);

  /**
   * Load credentials from API
   * Requirement 5.1: Display list of all registered credentials
   */
  async function loadCredentials() {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/auth/webauthn/credentials');
      
      if (response.data.success) {
        setCredentials(response.data.data.credentials || []);
      } else {
        throw new Error(response.data.message || 'Failed to load credentials');
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle credential deletion
   * Requirement 5.2: Prompt for confirmation before deletion
   * Requirement 5.3: Delete credential from database
   * Requirement 5.4: Warn when deleting last credential
   */
  async function handleDelete(credentialId) {
    try {
      const response = await api.delete(`/auth/webauthn/credentials/${credentialId}`);
      
      if (response.data.success) {
        // Remove from local state
        setCredentials(prev => prev.filter(c => c.id !== credentialId));
        
        // Clear confirmation dialog
        setDeleteConfirm(null);
        
        // If this was the stored credential ID, clear it
        if (WebAuthnClient.getStoredCredentialId() === credentialId) {
          WebAuthnClient.clearStoredCredentialId();
        }
        
        // Show success message if it was the last credential
        // Requirement 5.4: Inform user they'll need traditional login
        if (credentials.length === 1) {
          alert('Last biometric credential removed. You will need to use traditional login on your next sign-in.');
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete credential');
      }
    } catch (err) {
      console.error('Error deleting credential:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete credential');
      setDeleteConfirm(null);
    }
  }

  /**
   * Handle adding new credential
   * Requirement 5.5: Allow users to register new credentials
   */
  async function handleAddNew() {
    setRegistering(true);
    setError('');

    try {
      // Check if WebAuthn is supported
      if (!WebAuthnClient.isSupported()) {
        throw new Error('Your browser doesn\'t support biometric authentication.');
      }

      // Check if platform authenticator is available
      const available = await WebAuthnClient.isPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('No biometric authenticator found on this device.');
      }

      // Step 1: Start registration
      const startResponse = await api.post('/auth/webauthn/register/start');
      
      if (!startResponse.data.success) {
        throw new Error(startResponse.data.message || 'Failed to start registration');
      }

      const options = startResponse.data.data;

      // Step 2: Use WebAuthn API to create credential
      const credential = await WebAuthnClient.register(options);

      // Step 3: Finish registration
      const finishResponse = await api.post('/auth/webauthn/register/finish', credential);

      if (!finishResponse.data.success) {
        throw new Error(finishResponse.data.message || 'Failed to complete registration');
      }

      // Step 4: Store credential ID locally
      WebAuthnClient.storeCredentialId(credential.id);

      // Reload credentials list
      await loadCredentials();
      
      alert('New biometric credential registered successfully!');

    } catch (err) {
      console.error('Biometric registration error:', err);
      setError(err.message || 'Failed to register biometric credential. Please try again.');
    } finally {
      setRegistering(false);
    }
  }

  /**
   * Show confirmation dialog for deletion
   * Requirement 5.2: Prompt for confirmation before deletion
   */
  function confirmDelete(credentialId) {
    setDeleteConfirm(credentialId);
  }

  /**
   * Cancel deletion
   */
  function cancelDelete() {
    setDeleteConfirm(null);
  }

  /**
   * Format device information for display
   * Requirement 5.1: Show device info for each credential
   */
  function formatDeviceInfo(deviceInfo) {
    if (!deviceInfo) return 'Unknown Device';
    
    const userAgent = deviceInfo.userAgent || '';
    
    // Try to extract meaningful device info from user agent
    if (userAgent.includes('iPhone')) return '📱 iPhone';
    if (userAgent.includes('iPad')) return '📱 iPad';
    if (userAgent.includes('Android')) return '📱 Android Device';
    if (userAgent.includes('Macintosh')) return '💻 Mac';
    if (userAgent.includes('Windows')) return '💻 Windows PC';
    if (userAgent.includes('Linux')) return '💻 Linux PC';
    
    return deviceInfo.platform || 'Unknown Device';
  }

  if (loading) {
    return (
      <div className="credential-management">
        <div className="loading-message">
          <span className="loading-spinner">⏳</span>
          <p>Loading credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credential-management">
      <div className="credential-header">
        <h3>🔐 Biometric Authentication</h3>
        <p>Manage your registered devices</p>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={() => setError('')} className="dismiss-btn">Dismiss</button>
        </div>
      )}
      
      <div className="credentials-list">
        {credentials.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🔓</p>
            <p className="empty-text">No biometric credentials registered</p>
            <p className="empty-subtext">Register a device to enable biometric login</p>
          </div>
        ) : (
          <>
            {credentials.map((cred) => (
              <div key={cred.id} className="credential-card">
                <div className="credential-info">
                  <div className="device-name">
                    <strong>{formatDeviceInfo(cred.deviceInfo)}</strong>
                  </div>
                  <div className="credential-details">
                    <small className="detail-item">
                      <span className="detail-label">Registered:</span>
                      <span className="detail-value">
                        {new Date(cred.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </small>
                    {cred.lastUsedAt && (
                      <small className="detail-item">
                        <span className="detail-label">Last used:</span>
                        <span className="detail-value">
                          {new Date(cred.lastUsedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </small>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => confirmDelete(cred.id)} 
                  className="delete-btn"
                  disabled={deleteConfirm !== null}
                >
                  Remove
                </button>
              </div>
            ))}
            
            {/* Warning when only one credential remains */}
            {credentials.length === 1 && (
              <div className="warning-message">
                <span className="warning-icon">⚠️</span>
                <p>This is your only registered credential. If you remove it, you'll need to use traditional login.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="credential-actions">
        <button 
          onClick={handleAddNew} 
          className="add-credential-btn"
          disabled={registering}
        >
          {registering ? '⏳ Registering...' : '➕ Register New Device'}
        </button>
      </div>
      
      {/* Confirmation Dialog */}
      {deleteConfirm && (
        <div className="confirmation-modal">
          <div className="modal-overlay" onClick={cancelDelete}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h4>⚠️ Remove Biometric Credential?</h4>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove this biometric credential?</p>
              {credentials.length === 1 && (
                <p className="warning-text">
                  <strong>Warning:</strong> This is your last credential. You will need to use traditional login on your next sign-in.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                className="confirm-btn danger"
              >
                Remove
              </button>
              <button 
                onClick={cancelDelete} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CredentialManagement;
