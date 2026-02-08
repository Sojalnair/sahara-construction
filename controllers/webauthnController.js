/**
 * WebAuthn Controller
 * Handles HTTP requests for WebAuthn operations
 */

const webauthnService = require('../services/webauthnService');
const challengeStore = require('../services/challengeStore');
const Credential = require('../models/Credential');

/**
 * POST /api/auth/webauthn/register/start
 * Initiate credential registration
 */
exports.startRegistration = async (req, res) => {
  try {
    // User is authenticated via JWT middleware
    const user = req.user;
    const userType = user.role === 'Admin' || user.role === 'Supervisor' || user.role === 'Accountant' ? 'admin' : 'employee';

    // Generate registration options
    const options = await webauthnService.generateRegistrationOptions(user, userType);

    // Store challenge for verification
    const challengeId = challengeStore.storeChallenge({
      challenge: options.challenge,
      userId: user._id.toString(),
      userType,
      type: 'registration'
    });

    // Return options to client (include challengeId for later verification)
    res.status(200).json({
      success: true,
      data: {
        options,
        challengeId
      }
    });
  } catch (error) {
    console.error('Error starting registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start registration'
    });
  }
};

/**
 * POST /api/auth/webauthn/register/finish
 * Complete credential registration
 */
exports.finishRegistration = async (req, res) => {
  try {
    const user = req.user;
    const { response, challengeId } = req.body;

    if (!response || !challengeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: response, challengeId'
      });
    }

    // Retrieve and validate challenge
    const challengeData = challengeStore.getChallenge(challengeId);
    if (!challengeData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge'
      });
    }

    // Verify the challenge belongs to this user
    if (challengeData.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Challenge does not belong to this user'
      });
    }

    // Verify registration response
    const verification = await webauthnService.verifyRegistrationResponse(
      response,
      challengeData.challenge
    );

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Registration verification failed'
      });
    }

    // Extract credential data
    const { registrationInfo } = verification;
    const { credentialID, credentialPublicKey, counter, aaguid } = registrationInfo;

    // Get device info from request
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const platform = req.headers['sec-ch-ua-platform'] || 'Unknown';

    // Store credential in database
    const credential = await Credential.create({
      userId: user._id,
      userType: challengeData.userType === 'admin' ? 'User' : 'Employee',
      credentialId: credentialID,
      publicKey: credentialPublicKey,
      counter,
      transports: response.response?.transports || ['internal'],
      aaguid,
      deviceInfo: {
        userAgent,
        platform: platform.replace(/"/g, ''),
        registeredAt: new Date()
      }
    });

    // Delete used challenge
    challengeStore.deleteChallenge(challengeId);

    res.status(201).json({
      success: true,
      message: 'Biometric credential registered successfully',
      data: {
        credentialId: credentialID.toString('base64url'),
        deviceInfo: credential.deviceInfo
      }
    });
  } catch (error) {
    console.error('Error finishing registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete registration'
    });
  }
};

/**
 * POST /api/auth/webauthn/authenticate/start
 * Initiate authentication
 */
exports.startAuthentication = async (req, res) => {
  try {
    const { credentialIds } = req.body;

    if (!credentialIds || !Array.isArray(credentialIds) || credentialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: credentialIds (array)'
      });
    }

    // Fetch credentials from database
    const credentials = [];
    for (const credId of credentialIds) {
      const cred = await webauthnService.getCredentialById(credId);
      if (cred) {
        credentials.push(cred);
      }
    }

    if (credentials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid credentials found'
      });
    }

    // Generate authentication options
    const options = await webauthnService.generateAuthenticationOptions(credentials);

    // Store challenge for verification
    const challengeId = challengeStore.storeChallenge({
      challenge: options.challenge,
      userId: credentials[0].userId.toString(),
      userType: credentials[0].userType === 'User' ? 'admin' : 'employee',
      type: 'authentication'
    });

    res.status(200).json({
      success: true,
      data: {
        options,
        challengeId
      }
    });
  } catch (error) {
    console.error('Error starting authentication:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start authentication'
    });
  }
};

/**
 * POST /api/auth/webauthn/authenticate/finish
 * Complete authentication
 */
exports.finishAuthentication = async (req, res) => {
  try {
    const { response, challengeId } = req.body;

    if (!response || !challengeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: response, challengeId'
      });
    }

    // Retrieve and validate challenge
    const challengeData = challengeStore.getChallenge(challengeId);
    if (!challengeData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge'
      });
    }

    // Get credential from database
    const credential = await webauthnService.getCredentialById(response.id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    // Verify authentication response
    try {
      const verification = await webauthnService.verifyAuthenticationResponse(
        response,
        credential,
        challengeData.challenge
      );

      if (!verification.verified) {
        return res.status(401).json({
          success: false,
          message: 'Authentication verification failed'
        });
      }

      // Update credential counter and lastUsedAt
      credential.counter = verification.newCounter;
      credential.lastUsedAt = new Date();
      await credential.save();

      // Delete used challenge
      challengeStore.deleteChallenge(challengeId);

      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const { getConfig } = require('../config/env');
      const config = getConfig();

      // Fetch full user data
      const User = require('../models/User');
      const Employee = require('../models/Employee');
      
      let user;
      if (credential.userType === 'User') {
        user = await User.findById(credential.userId);
      } else {
        user = await Employee.findById(credential.userId);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate token
      const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpire });

      // Return user data based on type
      if (credential.userType === 'User') {
        res.status(200).json({
          success: true,
          message: 'Authentication successful',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            token
          }
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Authentication successful',
          data: {
            employee: {
              _id: user._id,
              name: user.name,
              phone: user.phone,
              role: user.role,
              salaryType: user.salaryType,
              salaryAmount: user.salaryAmount,
              isActive: user.isActive
            }
          }
        });
      }
    } catch (error) {
      // Log security events for failed authentication
      console.error('[SECURITY] Authentication failed:', {
        credentialId: credential.credentialId.toString('base64url'),
        userId: credential.userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Error finishing authentication:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete authentication'
    });
  }
};

/**
 * GET /api/auth/webauthn/credentials
 * List user's credentials
 */
exports.listCredentials = async (req, res) => {
  try {
    const user = req.user;
    const userType = user.role === 'Admin' || user.role === 'Supervisor' || user.role === 'Accountant' ? 'admin' : 'employee';

    // Fetch credentials
    const credentials = await webauthnService.getCredentialsForUser(user._id.toString(), userType);

    // Format credentials for response (don't send sensitive data)
    const formattedCredentials = credentials.map(cred => ({
      id: cred.credentialId.toString('base64url'),
      deviceInfo: cred.deviceInfo,
      createdAt: cred.createdAt,
      lastUsedAt: cred.lastUsedAt,
      transports: cred.transports
    }));

    res.status(200).json({
      success: true,
      data: {
        credentials: formattedCredentials,
        count: formattedCredentials.length
      }
    });
  } catch (error) {
    console.error('Error listing credentials:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list credentials'
    });
  }
};

/**
 * DELETE /api/auth/webauthn/credentials/:credentialId
 * Delete a credential
 */
exports.deleteCredential = async (req, res) => {
  try {
    const user = req.user;
    const { credentialId } = req.params;
    const userType = user.role === 'Admin' || user.role === 'Supervisor' || user.role === 'Accountant' ? 'admin' : 'employee';

    if (!credentialId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: credentialId'
      });
    }

    // Delete credential (service checks ownership)
    const deleted = await webauthnService.deleteCredential(credentialId, user._id.toString(), userType);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or already deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete credential'
    });
  }
};
