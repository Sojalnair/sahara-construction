import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CredentialManagement from './CredentialManagement';
import WebAuthnClient from '../../utils/webauthnClient';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock WebAuthnClient
vi.mock('../../utils/webauthnClient', () => ({
  default: {
    isSupported: vi.fn(),
    isPlatformAuthenticatorAvailable: vi.fn(),
    register: vi.fn(),
    storeCredentialId: vi.fn(),
    getStoredCredentialId: vi.fn(),
    clearStoredCredentialId: vi.fn(),
  }
}));

// Mock window.alert
global.alert = vi.fn();

describe('CredentialManagement Component', () => {
  const mockCredentials = [
    {
      id: 'cred1',
      credentialId: 'credential1',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        platform: 'iOS'
      },
      createdAt: '2024-01-15T10:00:00Z',
      lastUsedAt: '2024-01-20T15:30:00Z'
    },
    {
      id: 'cred2',
      credentialId: 'credential2',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'macOS'
      },
      createdAt: '2024-01-10T08:00:00Z',
      lastUsedAt: null
    }
  ];

  let mockAxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.alert.mockClear();

    // Setup default axios mock
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() }
      }
    };

    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('Loading and Display', () => {
    it('shows loading state initially', () => {
      mockAxiosInstance.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CredentialManagement />);

      expect(screen.getByText(/Loading credentials.../i)).toBeInTheDocument();
    });

    it('displays list of credentials after loading', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
        expect(screen.getByText(/💻 Mac/i)).toBeInTheDocument();
      });

      // Check registration dates are displayed
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 10, 2024/i)).toBeInTheDocument();

      // Check last used date is displayed for first credential
      expect(screen.getByText(/Jan 20, 2024/i)).toBeInTheDocument();
    });

    it('displays empty state when no credentials exist', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: [] }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
        expect(screen.getByText(/Register a device to enable biometric login/i)).toBeInTheDocument();
      });
    });

    it('displays error message when loading fails', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: {
          data: { message: 'Unauthorized' }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
      });
    });

    it('formats device info correctly for different platforms', async () => {
      const platformCredentials = [
        {
          id: 'cred1',
          deviceInfo: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'cred2',
          deviceInfo: { userAgent: 'Mozilla/5.0 (Linux; Android 11)' },
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'cred3',
          deviceInfo: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'cred4',
          deviceInfo: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
          createdAt: '2024-01-15T10:00:00Z'
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: platformCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPad/i)).toBeInTheDocument();
        expect(screen.getByText(/📱 Android Device/i)).toBeInTheDocument();
        expect(screen.getByText(/💻 Windows PC/i)).toBeInTheDocument();
        expect(screen.getByText(/💻 Linux PC/i)).toBeInTheDocument();
      });
    });
  });

  describe('Credential Deletion', () => {
    it('shows confirmation dialog when delete button is clicked', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Confirmation dialog should appear
      expect(screen.getByText(/Remove Biometric Credential\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    it('successfully deletes credential when confirmed', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      mockAxiosInstance.delete.mockResolvedValue({
        data: { success: true }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/auth/webauthn/credentials/cred1');
      });

      // Credential should be removed from list
      await waitFor(() => {
        expect(screen.queryByText(/📱 iPhone/i)).not.toBeInTheDocument();
      });
    });

    it('cancels deletion when cancel button is clicked', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Confirmation dialog should disappear
      await waitFor(() => {
        expect(screen.queryByText(/Remove Biometric Credential\?/i)).not.toBeInTheDocument();
      });

      // Delete API should not be called
      expect(mockAxiosInstance.delete).not.toHaveBeenCalled();
    });

    it('shows warning when deleting last credential', async () => {
      const singleCredential = [mockCredentials[0]];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: singleCredential }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/This is your only registered credential/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButton);

      // Confirmation dialog should show warning
      expect(screen.getByText(/This is your last credential/i)).toBeInTheDocument();
    });

    it('shows alert after deleting last credential', async () => {
      const singleCredential = [mockCredentials[0]];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: singleCredential }
        }
      });

      mockAxiosInstance.delete.mockResolvedValue({
        data: { success: true }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('traditional login')
        );
      });
    });

    it('clears stored credential ID when deleting the stored credential', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      mockAxiosInstance.delete.mockResolvedValue({
        data: { success: true }
      });

      WebAuthnClient.getStoredCredentialId.mockReturnValue('cred1');

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button for first credential
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(WebAuthnClient.clearStoredCredentialId).toHaveBeenCalled();
      });
    });

    it('handles deletion errors gracefully', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      mockAxiosInstance.delete.mockRejectedValue({
        response: {
          data: { message: 'Failed to delete credential' }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete credential/i)).toBeInTheDocument();
      });
    });
  });

  describe('Adding New Credential', () => {
    it('successfully registers new credential', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { credentials: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { credentials: [mockCredentials[0]] }
          }
        });

      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { challenge: 'challenge123' }
          }
        })
        .mockResolvedValueOnce({
          data: { success: true }
        });

      WebAuthnClient.isSupported.mockReturnValue(true);
      WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);
      WebAuthnClient.register.mockResolvedValue({
        id: 'newcred123',
        rawId: 'newcred123',
        response: {}
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
      });

      // Click add new button
      const addButton = screen.getByRole('button', { name: /Register New Device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/webauthn/register/start');
      });

      await waitFor(() => {
        expect(WebAuthnClient.register).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('registered successfully')
        );
      });

      // Credentials should be reloaded
      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      });
    });

    it('shows error when WebAuthn is not supported', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: [] }
        }
      });

      WebAuthnClient.isSupported.mockReturnValue(false);

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
      });

      // Click add new button
      const addButton = screen.getByRole('button', { name: /Register New Device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/doesn't support biometric authentication/i)).toBeInTheDocument();
      });
    });

    it('shows error when platform authenticator is not available', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: [] }
        }
      });

      WebAuthnClient.isSupported.mockReturnValue(true);
      WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(false);

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
      });

      // Click add new button
      const addButton = screen.getByRole('button', { name: /Register New Device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/No biometric authenticator found/i)).toBeInTheDocument();
      });
    });

    it('disables add button during registration', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: [] }
        }
      });

      mockAxiosInstance.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      WebAuthnClient.isSupported.mockReturnValue(true);
      WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
      });

      // Click add new button
      const addButton = screen.getByRole('button', { name: /Register New Device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/⏳ Registering.../i)).toBeInTheDocument();
        expect(addButton).toBeDisabled();
      });
    });

    it('handles registration errors gracefully', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: [] }
        }
      });

      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      WebAuthnClient.isSupported.mockReturnValue(true);
      WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/No biometric credentials registered/i)).toBeInTheDocument();
      });

      // Click add new button
      const addButton = screen.getByRole('button', { name: /Register New Device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('allows dismissing error messages', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Test error'));

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('disables delete buttons when confirmation dialog is open', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click first delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // All delete buttons should be disabled
      await waitFor(() => {
        deleteButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    it('closes confirmation dialog when overlay is clicked', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { credentials: mockCredentials }
        }
      });

      render(<CredentialManagement />);

      await waitFor(() => {
        expect(screen.getByText(/📱 iPhone/i)).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(deleteButtons[0]);

      // Click overlay
      const overlay = document.querySelector('.confirmation-modal .modal-overlay');
      fireEvent.click(overlay);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/Remove Biometric Credential\?/i)).not.toBeInTheDocument();
      });
    });
  });
});
