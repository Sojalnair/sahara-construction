# Implementation Plan: Biometric Authentication

## Overview

This implementation plan breaks down the biometric authentication feature into discrete coding tasks. The approach follows an incremental strategy: backend infrastructure first, then core WebAuthn functionality, followed by frontend integration, and finally credential management. Each task builds on previous work, with property-based tests integrated throughout to catch errors early.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - Install `@simplewebauthn/server` (v10.0.0+) for backend WebAuthn operations
  - Install `@simplewebauthn/browser` (v10.0.0+) for frontend WebAuthn helpers
  - Install `fast-check` (v3.0.0+) as dev dependency for property-based testing
  - Create directory structure: `models/Credential.js`, `services/webauthnService.js`, `controllers/webauthnController.js`, `routes/webauthnRoutes.js`
  - Create frontend directory: `client/src/components/biometric/`
  - _Requirements: All requirements depend on proper setup_

- [x] 2. Create Credential database model
  - [x] 2.1 Implement Credential schema in `models/Credential.js`
    - Define schema with fields: userId, userType, credentialId (Buffer), publicKey (Buffer), counter, transports, aaguid, deviceInfo, lastUsedAt
    - Add indexes for userId/userType and credentialId
    - Add timestamps (createdAt, updatedAt)
    - _Requirements: 1.3, 2.3, 7.2, 7.3, 12.2_

  - [ ]* 2.2 Write property test for credential storage
    - **Property 2: Credential Storage Completeness**
    - **Validates: Requirements 1.3, 2.3, 7.2, 7.3**

- [x] 3. Implement challenge store
  - [x] 3.1 Create in-memory challenge store in `services/challengeStore.js`
    - Implement Map-based storage with automatic expiration (5 minutes)
    - Methods: storeChallenge(), getChallenge(), deleteChallenge()
    - Add cleanup interval to remove expired challenges
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.2 Write unit tests for challenge store
    - Test challenge storage and retrieval
    - Test automatic expiration
    - Test cleanup of expired challenges
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Implement WebAuthn service core functionality
  - [x] 4.1 Create WebAuthnService class in `services/webauthnService.js`
    - Import @simplewebauthn/server functions
    - Set up RP (Relying Party) configuration with app name and origin
    - Implement generateRegistrationOptions() method
    - Implement verifyRegistrationResponse() method
    - _Requirements: 1.2, 2.2, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.2 Write property test for registration challenge generation
    - **Property 1: Challenge Generation for Registration**
    - **Validates: Requirements 1.2, 2.2, 6.1**

  - [ ]* 4.3 Write property test for platform authenticator configuration
    - **Property 4: Platform Authenticator Configuration**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 4.4 Write unit tests for registration options
    - Test ES256 and RS256 algorithm support
    - Test registration options structure
    - _Requirements: 8.3, 8.4_

- [x] 5. Implement WebAuthn authentication methods
  - [x] 5.1 Add authentication methods to WebAuthnService
    - Implement generateAuthenticationOptions() method
    - Implement verifyAuthenticationResponse() method with signature validation
    - Implement counter validation logic
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 6.2, 6.3, 6.4, 6.5, 13.3, 13.4_

  - [ ]* 5.2 Write property test for authentication challenge generation
    - **Property 7: Challenge Generation for Authentication**
    - **Validates: Requirements 3.2, 4.2, 6.2**

  - [ ]* 5.3 Write property test for challenge validation
    - **Property 8: Challenge Validation**
    - **Validates: Requirements 6.3**

  - [ ]* 5.4 Write property test for signature validation
    - **Property 9: Signature Validation**
    - **Validates: Requirements 3.3, 4.3, 6.4**

  - [ ]* 5.5 Write property test for origin validation
    - **Property 10: Origin Validation**
    - **Validates: Requirements 6.5**

  - [ ]* 5.6 Write property test for counter increment validation
    - **Property 13: Counter Increment Validation**
    - **Validates: Requirements 13.3, 13.4**

- [x] 6. Implement credential management methods
  - [x] 6.1 Add credential management to WebAuthnService
    - Implement getCredentialsForUser() method
    - Implement deleteCredential() method
    - Implement getCredentialById() method
    - _Requirements: 5.1, 5.3, 12.5_

  - [ ]* 6.2 Write property test for credential deletion
    - **Property 16: Credential Deletion**
    - **Validates: Requirements 5.3**

  - [ ]* 6.3 Write property test for multi-credential authentication
    - **Property 12: Multi-Credential Authentication**
    - **Validates: Requirements 12.5**

- [x] 7. Checkpoint - Ensure service layer tests pass
  - Run all service layer tests
  - Verify all property tests pass with 100+ iterations
  - Ask the user if questions arise

- [x] 8. Implement WebAuthn controller for registration
  - [x] 8.1 Create WebAuthnController in `controllers/webauthnController.js`
    - Implement startRegistration() handler
    - Implement finishRegistration() handler
    - Add error handling for all registration errors
    - Store device info (user agent, platform) on registration
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 10.1, 10.2, 12.2_

  - [ ]* 8.2 Write property test for device metadata storage
    - **Property 5: Device Metadata Storage**
    - **Validates: Requirements 12.2**

  - [ ]* 8.3 Write property test for counter initialization
    - **Property 6: Counter Initialization**
    - **Validates: Requirements 13.1**

  - [ ]* 8.4 Write unit tests for registration endpoints
    - Test successful registration flow
    - Test error cases (invalid data, expired challenge)
    - _Requirements: 10.1, 10.2_

- [x] 9. Implement WebAuthn controller for authentication
  - [x] 9.1 Add authentication handlers to WebAuthnController
    - Implement startAuthentication() handler
    - Implement finishAuthentication() handler
    - Generate JWT token on successful authentication
    - Update credential counter and lastUsedAt on success
    - Add error handling for all authentication errors
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 10.3, 10.4, 13.5_

  - [ ]* 9.2 Write property test for JWT token issuance
    - **Property 11: JWT Token Issuance**
    - **Validates: Requirements 3.4, 4.4**

  - [ ]* 9.3 Write property test for counter update
    - **Property 14: Counter Update**
    - **Validates: Requirements 13.5**

  - [ ]* 9.4 Write unit tests for authentication endpoints
    - Test successful authentication flow
    - Test error cases (invalid signature, counter failure)
    - _Requirements: 10.3, 10.4_

- [x] 10. Implement credential management endpoints
  - [x] 10.1 Add credential management handlers to WebAuthnController
    - Implement listCredentials() handler (requires authentication)
    - Implement deleteCredential() handler (requires authentication)
    - Add authorization checks (users can only manage their own credentials)
    - _Requirements: 5.1, 5.2, 5.3, 10.5, 10.6_

  - [ ]* 10.2 Write property test for credential list completeness
    - **Property 15: Credential List Completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 10.3 Write unit tests for credential management
    - Test listing credentials
    - Test deleting credentials
    - Test authorization (cannot delete other user's credentials)
    - _Requirements: 10.5, 10.6_

- [x] 11. Create WebAuthn routes
  - [x] 11.1 Implement routes in `routes/webauthnRoutes.js`
    - POST /api/auth/webauthn/register/start (requires authentication)
    - POST /api/auth/webauthn/register/finish (requires authentication)
    - POST /api/auth/webauthn/authenticate/start (public)
    - POST /api/auth/webauthn/authenticate/finish (public)
    - GET /api/auth/webauthn/credentials (requires authentication)
    - DELETE /api/auth/webauthn/credentials/:credentialId (requires authentication)
    - Add input validation middleware
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 11.2 Write property test for error response format
    - **Property 17: Error Response Format**
    - **Validates: Requirements 10.7**

  - [ ]* 11.3 Write integration tests for all endpoints
    - Test complete registration flow
    - Test complete authentication flow
    - Test credential management flow
    - _Requirements: All API requirements_

- [x] 12. Wire backend routes into Express app
  - [x] 12.1 Register WebAuthn routes in `server.js`
    - Import webauthnRoutes
    - Mount at /api/auth/webauthn
    - Ensure routes are registered after auth middleware setup
    - _Requirements: All backend requirements_

- [x] 13. Checkpoint - Ensure backend tests pass
  - Run all backend tests (unit, property, integration)
  - Test API endpoints with Postman or curl
  - Verify error handling works correctly
  - Ask the user if questions arise

- [-] 14. Create WebAuthn client helper utility
  - [x] 14.1 Implement WebAuthnClient in `client/src/utils/webauthnClient.js`
    - Import @simplewebauthn/browser functions
    - Implement isSupported() method
    - Implement isPlatformAuthenticatorAvailable() method
    - Implement register() method with base64url conversion
    - Implement authenticate() method with base64url conversion
    - Implement localStorage helpers for credential ID storage
    - Add comprehensive error handling with user-friendly messages
    - _Requirements: 1.5, 2.5, 3.5, 4.5, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x]* 14.2 Write unit tests for WebAuthn client
    - Test browser support detection
    - Test base64url encoding/decoding
    - Test localStorage operations
    - Test error message formatting
    - _Requirements: 1.5, 2.5, 3.5, 4.5_

- [ ] 15. Update Login component for biometric authentication
  - [x] 15.1 Modify `client/src/App.jsx` Login component
    - Add state for biometric availability
    - Add useEffect to check biometric support on mount
    - Add "Login with Biometrics" button (shown only if available)
    - Implement handleBiometricLogin() function
    - Keep traditional login forms visible at all times
    - Add loading states during biometric authentication
    - Add error display for biometric failures
    - _Requirements: 3.1, 3.6, 4.1, 4.6, 9.1, 9.2, 11.1, 11.2_

  - [ ]* 15.2 Write unit tests for Login component updates
    - Test biometric button visibility logic
    - Test biometric login flow
    - Test fallback to traditional login
    - _Requirements: 3.1, 3.6, 4.1, 4.6, 9.1_

- [ ] 16. Create BiometricRegistration component
  - [x] 16.1 Implement BiometricRegistration in `client/src/components/biometric/BiometricRegistration.jsx`
    - Create modal/dialog component for registration prompt
    - Add "Register Biometric" and "Skip" buttons
    - Implement handleRegister() function calling backend APIs
    - Store credential ID in localStorage on success
    - Add loading and error states
    - Show success message on completion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 16.2 Write unit tests for BiometricRegistration component
    - Test registration flow
    - Test skip functionality
    - Test error handling
    - _Requirements: 1.1, 1.5, 2.1, 2.5_

- [ ] 17. Integrate BiometricRegistration into post-login flow
  - [x] 17.1 Update App.jsx to show registration prompt
    - Add state to track if registration prompt should be shown
    - Show BiometricRegistration after successful traditional login
    - Check if user already has credentials before showing prompt
    - Allow users to dismiss/skip registration
    - _Requirements: 1.1, 2.1, 9.3_

  - [ ]* 17.2 Write integration tests for post-login registration
    - Test registration prompt appears after first login
    - Test registration prompt doesn't appear if credentials exist
    - Test skip functionality
    - _Requirements: 1.1, 2.1, 9.3_

- [ ] 18. Create CredentialManagement component
  - [x] 18.1 Implement CredentialManagement in `client/src/components/biometric/CredentialManagement.jsx`
    - Create UI to display list of registered credentials
    - Show device info, registration date, last used date for each credential
    - Add "Remove" button for each credential with confirmation dialog
    - Add "Register New Device" button
    - Implement loadCredentials() to fetch from API
    - Implement handleDelete() to remove credentials
    - Show warning when deleting last credential
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 18.2 Write unit tests for CredentialManagement component
    - Test credential list display
    - Test delete confirmation
    - Test last credential warning
    - Test add new credential flow
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 19. Add CredentialManagement to user settings
  - [x] 19.1 Integrate CredentialManagement into settings/profile page
    - Add "Biometric Authentication" section to user settings
    - Mount CredentialManagement component
    - Add navigation/routing if needed
    - _Requirements: 5.1, 5.5_

- [ ] 20. Add comprehensive error handling UI
  - [~] 20.1 Create error display components
    - Create reusable ErrorMessage component for biometric errors
    - Map WebAuthn error codes to user-friendly messages
    - Add retry buttons where appropriate
    - Ensure traditional login is always accessible
    - _Requirements: 1.5, 2.5, 3.5, 4.5, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ]* 20.2 Write unit tests for error handling
    - Test all error message mappings
    - Test retry functionality
    - Test fallback to traditional login
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 21. Add CSS styling for biometric components
  - [~] 21.1 Style biometric UI components
    - Style "Login with Biometrics" button with biometric icon
    - Style BiometricRegistration modal
    - Style CredentialManagement list and cards
    - Style error messages and loading states
    - Ensure responsive design for mobile devices
    - _Requirements: All UI requirements_

- [~] 22. Checkpoint - Ensure frontend tests pass
  - Run all frontend tests
  - Test biometric flow in browser (requires HTTPS)
  - Test on multiple devices if possible
  - Verify error handling works correctly
  - Ask the user if questions arise

- [ ] 23. Add security logging for critical events
  - [~] 23.1 Implement security event logging
    - Log counter validation failures
    - Log origin mismatches
    - Log invalid signature attempts
    - Log repeated failed authentication attempts
    - Include userId, credentialId, IP address, user agent in logs
    - _Requirements: 6.3, 6.4, 6.5, 13.4_

  - [ ]* 23.2 Write unit tests for security logging
    - Test that security events are logged
    - Test log format and content
    - _Requirements: 6.3, 6.4, 6.5, 13.4_

- [~] 24. Write property test for multiple credential support
  - [ ]* 24.1 Write property test for multiple credentials
    - **Property 3: Multiple Credential Support**
    - **Validates: Requirements 1.4, 2.4, 12.1**

- [~] 25. Write property tests for serialization round-trips
  - [ ]* 25.1 Write property test for registration options serialization
    - **Property 18: Registration Options Serialization**
    - **Validates: Requirements 1.2, 2.2**

  - [ ]* 25.2 Write property test for authentication options serialization
    - **Property 19: Authentication Options Serialization**
    - **Validates: Requirements 3.2, 4.2**

- [ ] 26. Add environment configuration
  - [~] 26.1 Update environment configuration
    - Add WEBAUTHN_RP_NAME to .env (e.g., "Sahara Construction")
    - Add WEBAUTHN_RP_ID to .env (e.g., "localhost" or "yourdomain.com")
    - Add WEBAUTHN_ORIGIN to .env (e.g., "http://localhost:5173" or "https://yourdomain.com")
    - Update config/env.js to include WebAuthn config
    - Document configuration in README
    - _Requirements: All requirements_

- [ ] 27. Update API documentation
  - [~] 27.1 Document WebAuthn endpoints
    - Document all 6 WebAuthn endpoints with request/response examples
    - Document error codes and messages
    - Add examples for registration and authentication flows
    - Update README or create API.md
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [~] 28. Final checkpoint - End-to-end testing
  - Test complete registration flow (admin and employee)
  - Test complete authentication flow (admin and employee)
  - Test multi-device support
  - Test credential management
  - Test error handling and edge cases
  - Test on multiple browsers/platforms if possible
  - Verify all property tests pass with 100+ iterations
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- WebAuthn requires HTTPS in production (localhost works for development)
- Test on actual devices with biometric hardware for best results
- Consider using ngrok or similar for testing on mobile devices during development
