const express = require('express');
const {
  startRegistration,
  finishRegistration,
  startAuthentication,
  finishAuthentication,
  listCredentials,
  deleteCredential
} = require('../controllers/webauthnController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Registration endpoints (require authentication)
 */
router.post('/register/start', authenticate, startRegistration);
router.post('/register/finish', authenticate, finishRegistration);

/**
 * Authentication endpoints (public)
 */
router.post('/authenticate/start', startAuthentication);
router.post('/authenticate/finish', finishAuthentication);

/**
 * Credential management endpoints (require authentication)
 */
router.get('/credentials', authenticate, listCredentials);
router.delete('/credentials/:credentialId', authenticate, deleteCredential);

module.exports = router;
