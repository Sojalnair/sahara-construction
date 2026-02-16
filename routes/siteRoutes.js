const express = require('express');
const {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
  assignSupervisor,
  addIncomePayment,
  getSiteFinancials
} = require('../controllers/siteController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// Public route for employees to view active sites
router.get('/public/active', async (req, res) => {
  try {
    const Site = require('../models/Site');
    const sites = await Site.find({ status: 'Active' })
      .select('name location status')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: sites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

router.post('/', authenticate, checkRole('Admin'), createSite);
router.get('/', authenticate, getSites);
router.get('/:id', authenticate, getSiteById);
router.put('/:id', authenticate, checkRole('Admin'), updateSite);
router.delete('/:id', authenticate, checkRole('Admin'), deleteSite);
router.post('/:id/assign-supervisor', authenticate, checkRole('Admin'), assignSupervisor);
router.post('/:id/income', authenticate, checkRole('Admin'), addIncomePayment);
router.get('/:id/financials', authenticate, getSiteFinancials);

module.exports = router;
