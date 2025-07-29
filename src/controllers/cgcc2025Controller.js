const CGCC2025Registration = require('../models/CGCC2025Registration');
const logger = require('../utils/logger');

class CGCC2025Controller {
  async register(req, res) {
    try {
      const {
        registrationVia,
        otherSpecify,
        firstName,
        middleName,
        lastName,
        schoolName,
        standard,
        parentName,
        mobileNo,
        emailAddress,
        dateOfBirth
      } = req.body;

      // Input validation
      const errors = [];

      // Required field validations
      if (!registrationVia) {
        errors.push({ field: 'registrationVia', message: 'Registration via is required' });
      } else if (!['Balavihar Centre', 'School', 'Other'].includes(registrationVia)) {
        errors.push({ field: 'registrationVia', message: 'Registration via must be Balavihar Centre, School, or Other' });
      }

      // Conditional validation for otherSpecify
      if (registrationVia === 'Other' && (!otherSpecify || !otherSpecify.trim())) {
        errors.push({ field: 'otherSpecify', message: 'Please specify other registration method when selecting Other' });
      }

      if (!firstName || !firstName.trim()) {
        errors.push({ field: 'firstName', message: 'First name is required' });
      }

      if (!lastName || !lastName.trim()) {
        errors.push({ field: 'lastName', message: 'Last name is required' });
      }

      if (!schoolName || !schoolName.trim()) {
        errors.push({ field: 'schoolName', message: 'School name is required' });
      }

      if (!standard) {
        errors.push({ field: 'standard', message: 'Standard is required' });
      } else if (!['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].includes(standard)) {
        errors.push({ field: 'standard', message: 'Standard must be between 1st and 12th' });
      }

      if (!parentName || !parentName.trim()) {
        errors.push({ field: 'parentName', message: 'Parent/Guardian name is required' });
      }

      // Mobile number validation
      if (!mobileNo) {
        errors.push({ field: 'mobileNo', message: 'Mobile number is required' });
      } else if (!/^[6-9]\d{9}$/.test(mobileNo)) {
        errors.push({ field: 'mobileNo', message: 'Please enter a valid 10-digit Indian mobile number starting with 6-9' });
      }

      // Email validation
      if (!emailAddress) {
        errors.push({ field: 'emailAddress', message: 'Email address is required' });
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress)) {
        errors.push({ field: 'emailAddress', message: 'Please enter a valid email address' });
      }

      // Date of birth validation
      if (!dateOfBirth) {
        errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
      } else {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          errors.push({ field: 'dateOfBirth', message: 'Please enter a valid date of birth' });
        } else if (dob > new Date()) {
          errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
        }
      }

      // If validation errors exist, return them
      if (errors.length > 0) {
        logger.warn(`CGCC 2025 registration validation failed from ${req.ip}: ${errors.map(e => e.message).join(', ')}`);
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please check your input.',
          errors
        });
      }

      // Check for duplicate registration (email + mobile combination)
      const existingRegistration = await CGCC2025Registration.findOne({
        $or: [
          { emailAddress: emailAddress.toLowerCase() },
          { mobileNo: mobileNo },
          { emailAddress: emailAddress.toLowerCase(), mobileNo: mobileNo }
        ]
      });

      if (existingRegistration) {
        logger.warn(`CGCC 2025 duplicate registration attempt from ${req.ip}: ${emailAddress}`);
        return res.status(400).json({
          success: false,
          message: 'Registration already exists with this email address or mobile number',
          errors: [
            { field: 'emailAddress', message: 'A registration with this email or mobile number already exists' }
          ]
        });
      }

      // Create new registration
      const registrationData = {
        registrationVia,
        otherSpecify: registrationVia === 'Other' ? otherSpecify : undefined,
        firstName: firstName.trim(),
        middleName: middleName ? middleName.trim() : '',
        lastName: lastName.trim(),
        schoolName: schoolName.trim(),
        standard,
        parentName: parentName.trim(),
        mobileNo,
        emailAddress: emailAddress.toLowerCase().trim(),
        dateOfBirth: new Date(dateOfBirth),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      const registration = new CGCC2025Registration(registrationData);
      const savedRegistration = await registration.save();

      logger.info(`CGCC 2025 registration successful: ${savedRegistration.registrationId} for ${savedRegistration.participantName} from ${req.ip}`);

      // Success response
      return res.status(201).json({
        success: true,
        message: 'Registration successful for CGCC 2025',
        data: {
          registrationId: savedRegistration.registrationId,
          participantName: savedRegistration.participantName,
          registrationDate: savedRegistration.registrationDate.toISOString(),
          competitionYear: savedRegistration.competitionYear
        }
      });

    } catch (error) {
      logger.error('CGCC 2025 registration error:', error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: 'Registration already exists with this information',
          errors: [
            { field, message: `A registration with this ${field} already exists` }
          ]
        });
      }

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.',
        errors: [
          { field: 'server', message: 'Registration could not be processed at this time' }
        ]
      });
    }
  }

  // Get registration statistics (admin only)
  async getStats(req, res) {
    try {
      const totalRegistrations = await CGCC2025Registration.countDocuments();
      
      const standardStats = await CGCC2025Registration.aggregate([
        {
          $group: {
            _id: '$standard',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const registrationViaStats = await CGCC2025Registration.aggregate([
        {
          $group: {
            _id: '$registrationVia',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentRegistrations = await CGCC2025Registration.find()
        .sort({ registrationDate: -1 })
        .limit(10)
        .select('registrationId participantName schoolName standard registrationDate')
        .lean();

      logger.info(`CGCC 2025 stats accessed from ${req.ip}`);

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRegistrations,
            lastUpdated: new Date().toISOString()
          },
          standardBreakdown: standardStats,
          registrationViaBreakdown: registrationViaStats,
          recentRegistrations
        }
      });

    } catch (error) {
      logger.error('CGCC 2025 stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get registration statistics'
      });
    }
  }

  // Export registrations as CSV (admin only)
  async exportRegistrations(req, res) {
    try {
      const registrations = await CGCC2025Registration.find()
        .sort({ registrationDate: -1 })
        .lean();

      if (registrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No registrations found to export'
        });
      }

      // Convert to CSV format
      const csvHeaders = [
        'Registration ID',
        'Participant Name',
        'First Name',
        'Middle Name',
        'Last Name',
        'School Name',
        'Standard',
        'Parent Name',
        'Mobile Number',
        'Email Address',
        'Date of Birth',
        'Registration Via',
        'Other Specify',
        'Registration Date',
        'IP Address'
      ];

      const csvRows = registrations.map(reg => [
        reg.registrationId,
        reg.participantName,
        reg.firstName,
        reg.middleName || '',
        reg.lastName,
        reg.schoolName,
        reg.standard,
        reg.parentName,
        reg.mobileNo,
        reg.emailAddress,
        reg.dateOfBirth.toISOString().split('T')[0],
        reg.registrationVia,
        reg.otherSpecify || '',
        reg.registrationDate.toLocaleString('en-IN'),
        reg.ipAddress
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `cgcc2025-registrations-${timestamp}.csv`;

      logger.info(`CGCC 2025 registrations exported (${registrations.length} records) from ${req.ip}`);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csvContent);

    } catch (error) {
      logger.error('CGCC 2025 export error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export registrations'
      });
    }
  }
}

module.exports = new CGCC2025Controller();
