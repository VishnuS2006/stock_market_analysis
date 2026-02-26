const Company = require('../models/Company');

exports.getProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select('-password');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const company = await Company.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
