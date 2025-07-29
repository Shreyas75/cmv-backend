const Donation = require('../models/Donation');
const { Parser } = require('json2csv');
const logger = require('../utils/logger');

class DonationExportService {
  async exportDonationsToCSV(filters = {}) {
    try {
      // Build query based on filters
      let query = {};
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }
      
      // Status filter
      if (filters.status) {
        query.status = filters.status;
      }
      
      // Amount range filter
      if (filters.minAmount || filters.maxAmount) {
        query.amount = {};
        if (filters.minAmount) {
          query.amount.$gte = Number(filters.minAmount);
        }
        if (filters.maxAmount) {
          query.amount.$lte = Number(filters.maxAmount);
        }
      }
      
      // Reason filter
      if (filters.reasonForDonation) {
        query.reasonForDonation = filters.reasonForDonation;
      }
      
      // Fetch donations from database
      const donations = await Donation.find(query)
        .select('-__v -panCardNumber') // Exclude sensitive data and version key
        .sort({ createdAt: -1 })
        .lean();
      
      if (donations.length === 0) {
        return { success: false, message: 'No donations found for the given criteria' };
      }
      
      // Transform data for CSV export
      const transformedData = donations.map(donation => ({
        'Donation Reference': donation.donationRef,
        'Full Name': donation.fullName,
        'Email': donation.email,
        'Phone Number': donation.phoneNumber,
        'State': donation.state,
        'City': donation.city,
        'Pin Code': donation.pinCode,
        'Address': donation.address,
        'Seek 80G Certificate': donation.seek80G,
        'Amount (Rs.)': donation.amount,
        'Transaction ID': donation.transactionId,
        'Reason for Donation': donation.reasonForDonation,
        'Purpose': donation.purpose || '',
        'Status': donation.status,
        'IP Address': donation.ipAddress || '',
        'Created Date': new Date(donation.createdAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        'Updated Date': new Date(donation.updatedAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
      
      // Define CSV fields
      const fields = [
        'Donation Reference',
        'Full Name',
        'Email',
        'Phone Number',
        'State',
        'City',
        'Pin Code',
        'Address',
        'Seek 80G Certificate',
        'Amount (Rs.)',
        'Transaction ID',
        'Reason for Donation',
        'Purpose',
        'Status',
        'IP Address',
        'Created Date',
        'Updated Date'
      ];
      
      // Generate CSV
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transformedData);
      
      logger.info(`Exported ${donations.length} donations to CSV`);
      
      return {
        success: true,
        csv,
        count: donations.length,
        filename: this.generateFilename(filters)
      };
      
    } catch (error) {
      logger.error('Error exporting donations to CSV:', error);
      throw new Error('Failed to export donations data');
    }
  }
  
  generateFilename(filters = {}) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let filename = `donations-export-${timestamp}`;
    
    if (filters.status) {
      filename += `-${filters.status}`;
    }
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).toISOString().split('T')[0];
      const end = new Date(filters.endDate).toISOString().split('T')[0];
      filename += `-${start}-to-${end}`;
    }
    
    return `${filename}.csv`;
  }
  
  async getDonationStats() {
    try {
      const stats = await Donation.aggregate([
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      // Get reason-wise breakdown
      const reasonStats = await Donation.aggregate([
        {
          $group: {
            _id: '$reasonForDonation',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);
      
      return {
        summary: stats[0] || {
          totalDonations: 0,
          totalAmount: 0,
          avgAmount: 0,
          pendingCount: 0,
          completedCount: 0,
          failedCount: 0
        },
        reasonBreakdown: reasonStats
      };
      
    } catch (error) {
      logger.error('Error getting donation stats:', error);
      throw new Error('Failed to get donation statistics');
    }
  }
}

module.exports = new DonationExportService();
