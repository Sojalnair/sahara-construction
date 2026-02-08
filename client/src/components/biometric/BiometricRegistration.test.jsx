import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BiometricRegistration from './BiometricRegistration';
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
  }
}));

describe('BiometricRegistration Component', () => {
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin'
  };

  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the registration modal with correct content', () => {
    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    expect(screen.getByText(/Enable Biometric Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Use Face ID, Touch ID, fingerprint, or Windows Hello/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick and convenient login/i)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced security/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Biometric/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip for Now/i })).toBeInTheDocument();
  });

  it('calls onSkip when skip button is clicked', () => {
    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const skipButton = screen.getByRole('button', { name: /Skip for Now/i });
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when overlay is clicked', () => {
    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('shows error when WebAuthn is not supported', async () => {
    WebAuthnClient.isSupported.mockReturnValue(false);

    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const registerButton = screen.getByRole('button', { name: /Register Biometric/i });
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/doesn't support biometric authentication/i)).toBeInTheDocument();
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('shows error when platform authenticator is not available', async () => {
    WebAuthnClient.isSupported.mockReturnValue(true);
    WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(false);

    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const registerButton = screen.getByRole('button', { name: /Register Biometric/i });
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/No biometric authenticator found/i)).toBeInTheDocument();
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('successfully registers biometric credential', async () => {
    // Mock successful flow
    WebAuthnClient.isSupported.mockReturnValue(true);
    WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);
    
    const mockCredential = {
      id: 'credential123',
      rawId: 'credential123',
      response: {},
      type: 'public-key'
    };

    const mockAxiosCreate = {
      post: vi.fn()
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { challenge: 'challenge123', rp: {}, user: {} }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { credential: mockCredential }
          }
        }),
      interceptors: {
        request: { use: vi.fn() }
      }
    };

    axios.create.mockReturnValue(mockAxiosCreate);
    WebAuthnClient.register.mockResolvedValue(mockCredential);

    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const registerButton = screen.getByRole('button', { name: /Register Biometric/i });
    fireEvent.click(registerButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Please complete the biometric verification/i)).toBeInTheDocument();
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/enabled successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should store credential ID
    expect(WebAuthnClient.storeCredentialId).toHaveBeenCalledWith('credential123');

    // Should call onComplete after delay
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it('handles registration errors gracefully', async () => {
    WebAuthnClient.isSupported.mockReturnValue(true);
    WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);

    const mockAxiosCreate = {
      post: vi.fn().mockRejectedValue(new Error('Network error')),
      interceptors: {
        request: { use: vi.fn() }
      }
    };

    axios.create.mockReturnValue(mockAxiosCreate);

    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const registerButton = screen.getByRole('button', { name: /Register Biometric/i });
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('disables buttons during registration', async () => {
    WebAuthnClient.isSupported.mockReturnValue(true);
    WebAuthnClient.isPlatformAuthenticatorAvailable.mockResolvedValue(true);

    const mockAxiosCreate = {
      post: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      interceptors: {
        request: { use: vi.fn() }
      }
    };

    axios.create.mockReturnValue(mockAxiosCreate);

    render(
      <BiometricRegistration 
        user={mockUser} 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip} 
      />
    );

    const registerButton = screen.getByRole('button', { name: /Register Biometric/i });
    const skipButton = screen.getByRole('button', { name: /Skip for Now/i });

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(registerButton).toBeDisabled();
      expect(skipButton).toBeDisabled();
      expect(screen.getByText(/Registering.../i)).toBeInTheDocument();
    });
  });
});
