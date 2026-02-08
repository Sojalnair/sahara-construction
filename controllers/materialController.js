const Material = require('../models/Material');

// Add material
exports.addMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get materials
exports.getMaterials = async (req, res) => {
  try {
    const { site, category, isStockLow } = req.query;
    const filter = {};
    
    if (site) filter.site = site;
    if (category) filter.category = category;
    if (isStockLow !== undefined) filter.isStockLow = isStockLow === 'true';

    const materials = await Material.find(filter).populate('site', 'name location');

    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('site', 'name location');
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
