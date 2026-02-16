const Site = require('../models/Site');
const User = require('../models/User');

// Create site
exports.createSite = async (req, res) => {
  try {
    const site = await Site.create(req.body);
    res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all sites
exports.getSites = async (req, res) => {
  try {
    const { status, supervisor } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supervisor) filter.supervisor = supervisor;

    const sites = await Site.find(filter)
      .populate('supervisor', 'name email')
      .populate('assignedEmployees', 'name phone role');
    
    res.status(200).json({ success: true, count: sites.length, data: sites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get site by ID
exports.getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('supervisor', 'name email')
      .populate('assignedEmployees', 'name phone role');
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update site
exports.updateSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete site
exports.deleteSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    
    res.status(200).json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign supervisor
exports.assignSupervisor = async (req, res) => {
  try {
    const { supervisorId } = req.body;
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'Supervisor') {
      return res.status(400).json({ success: false, message: 'Invalid supervisor' });
    }

    site.supervisor = supervisorId;
    await site.save();

    if (!supervisor.assignedSites.includes(site._id)) {
      supervisor.assignedSites.push(site._id);
      await supervisor.save();
    }

    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add income payment to site
exports.addIncomePayment = async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const receivedBy = req.user?.name || 'Admin';

    site.incomePayments.push({
      amount: parseFloat(amount),
      date: date || new Date(),
      description: description || 'Payment received',
      receivedBy
    });

    site.totalIncome += parseFloat(amount);
    await site.save();

    res.status(200).json({ 
      success: true, 
      message: 'Income payment added successfully',
      data: site 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get site financial summary
exports.getSiteFinancials = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const financials = {
      siteName: site.name,
      totalIncome: site.totalIncome || 0,
      totalExpenses: site.totalExpenses || 0,
      profit: (site.totalIncome || 0) - (site.totalExpenses || 0),
      incomePayments: site.incomePayments || [],
      status: site.status
    };

    res.status(200).json({ success: true, data: financials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
