const mongoose = require('mongoose');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createTransporter } = require('../config/email');
const exportService = require('../services/exportService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const transporter = createTransporter();

// Schedule cron job to run monthly on the 25th at 12:47 AM
cron.schedule('47 0 25 * *', async () => {
  try {
    // Get CSV data
    const csv = await exportService.exportUserDataToCSV();
    
    if (csv === "No users found in the database.") {
      return;
    }

    // Create the /exports folder if it doesn't exist
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    // Save the CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(exportsDir, `users-${timestamp}.csv`);
    fs.writeFileSync(filePath, csv);

    // Send email with the CSV file as an attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Use admin email or fallback to sender
      subject: 'Monthly User Data Export',
      text: 'Please find attached the monthly user data export.',
      attachments: [
        {
          filename: `users-${timestamp}.csv`,
          path: filePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Log error but don't crash the process
  }
});

module.exports = {};
