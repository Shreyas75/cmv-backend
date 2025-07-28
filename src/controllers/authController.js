const otpService = require('../services/otpService');

class AuthController {
  async sendOTPEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await otpService.sendOTPEmail(email);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { identifier, otp } = req.body;

      if (!identifier || !otp) {
        return res.status(400).json({ 
          success: false, 
          error: 'Identifier and OTP are required' 
        });
      }

      const result = otpService.verifyOTP(identifier, otp);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async adminLogin(req, res) {
    try {
      const { username, password } = req.body;

      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        res.status(200).json({ success: true, message: 'Login successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
