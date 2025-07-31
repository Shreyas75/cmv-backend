const crypto = require('crypto');
const { createTransporter } = require('../config/email');

class OTPService {
  constructor() {
    this.otpStore = {};
    this.transporter = createTransporter();
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOTPEmail(email) {
    const otp = this.generateOTP();
    
    // Store OTP with expiration (5 minutes)
    this.otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    await this.transporter.sendMail({
      from: `"Chinmaya Mission Vasai" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    return { success: true, message: 'OTP sent to email' };
  }

  verifyOTP(identifier, otp) {
    const storedOtp = this.otpStore[identifier];

    if (!storedOtp) {
      return { success: false, error: 'OTP not found or expired' };
    }

    if (storedOtp.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete this.otpStore[identifier];
      return { success: false, error: 'OTP expired. Please request a new one.' };
    }

    // OTP is valid, clear it
    delete this.otpStore[identifier];
    return { success: true, message: 'OTP verified successfully' };
  }
}

module.exports = new OTPService();
