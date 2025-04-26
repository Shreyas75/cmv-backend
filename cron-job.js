const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected for cron job'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the User schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNo: Number,
  dob: Date,
  additionalComments: String,
});

const User = mongoose.model('User', userSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


cron.schedule('47 0 25 * *', async () => {
  console.log('Cron job started: Fetching user data and sending email');

  try {
    // Fetch all users from the database
    const users = await User.find({}, 'firstName lastName email phoneNo dob additionalComments createdAt');
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // Convert user data to CSV
    const fields = ['firstName', 'lastName', 'email', 'phoneNo', 'dob', 'additionalComments', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);

    // Create the /exports folder if it doesn't exist
    const exportsDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    // Save the CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(exportsDir, `users-${timestamp}.csv`);
    fs.writeFileSync(filePath, csv);
    console.log(`CSV file created at: ${filePath}`);

    // Send email with the CSV file as an attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'arjunchessid@gmail.com', // Replace with the recipient's email
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
    console.log('Email sent successfully with the CSV attachment.');
  } catch (error) {
    console.error('Error during cron job execution:', error.message);
  }
});