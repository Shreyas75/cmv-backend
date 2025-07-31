const crypto = require('crypto');
const { createTransporter } = require('../config/email');

class OTPService {
  constructor() {
    this.otpStore = {};
    // Don't cache transporter - create fresh each time
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

    // Create fresh transporter to use latest config
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Chinmaya Mission Vasai" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code - Chinmaya Mission Vasai',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.\n\n${process.env.EMAIL_SIGNATURE || 'Best regards,\nChinmaya Mission Vasai'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">Chinmaya Mission Vasai</h2>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #d4af37;">${otp}</strong></p>
          <p>This code is valid for 5 minutes.</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            Chinmaya Mission Vasai<br>
            Website: https://chinmayamissionvasai.com<br>
            Email: info@chinmayamissionvasai.com
          </p>
        </div>
      `
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
