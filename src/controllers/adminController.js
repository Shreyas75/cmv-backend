const donationExportService = require('../services/donationExportService');
const logger = require('../utils/logger');

// No authentication needed - same as export user data
class AdminController {
  // Export donations as CSV download
  async exportDonations(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount,
        reasonForDonation: req.query.reasonForDonation
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );
      
      const result = await donationExportService.exportDonationsToCSV(filters);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.message
        });
      }
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      
      logger.info(`Admin exported ${result.count} donations from ${req.ip}`);
      
      return res.status(200).send(result.csv);
      
    } catch (error) {
      logger.error('Admin export error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to export donations data'
      });
    }
  }
  
  // Get donation statistics
  async getDonationStats(req, res) {
    try {
      const stats = await donationExportService.getDonationStats();
      
      logger.info(`Admin accessed donation stats from ${req.ip}`);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Admin stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get donation statistics'
      });
    }
  }
  
  // Get recent donations (paginated)
  async getRecentDonations(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      const Donation = require('../models/Donation');
      
      const [donations, total] = await Promise.all([
        Donation.find({})
          .select('-__v -panCardNumber') // Exclude sensitive data
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Donation.countDocuments({})
      ]);
      
      logger.info(`Admin accessed recent donations (page ${page}) from ${req.ip}`);
      
      return res.status(200).json({
        success: true,
        data: {
          donations,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      logger.error('Admin recent donations error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get recent donations'
      });
    }
  }
}

module.exports = { AdminController: new AdminController() };
