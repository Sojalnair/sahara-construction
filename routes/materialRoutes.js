const express = require('express');
const {
  addMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materialController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, checkRole('Admin', 'Accountant'), addMaterial);
router.get('/', authenticate, getMaterials);
router.get('/:id', authenticate, getMaterialById);
router.put('/:id', authenticate, checkRole('Admin', 'Accountant'), updateMaterial);
router.delete('/:id', authenticate, checkRole('Admin'), deleteMaterial);

module.exports = router;
