# 2Factor: Getting Voice Calls Instead of SMS - SOLUTION

## 🔴 Problem
You purchased **SMS OTP credits** but you're getting **Voice OTP calls** instead of SMS messages.

---

## ✅ SOLUTION: Use the Correct API Endpoint

The issue is **NOT a setting** - it's about which **API endpoint** you're calling!

2Factor has **DIFFERENT endpoints** for SMS vs Voice:

### 📱 For SMS OTP (What you want):
```
https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN
```

### 📞 For Voice OTP (What you're getting):
```
https://2factor.in/API/V1/{api_key}/VOICE/{phone_number}/AUTOGEN
```

---

## 🎯 The Key Difference

Look at the URL path carefully:

| Channel | Endpoint Path | Result |
|---------|---------------|--------|
| **SMS** | `/SMS/` | Text message 📱 |
| **VOICE** | `/VOICE/` | Phone call 📞 |

**You're probably using `/VOICE/` in your code instead of `/SMS/`**

---

## 🔍 How to Fix It

### Step 1: Check Your Code

Look for the API call in your code. It probably looks like this:

**❌ WRONG (gives you voice calls):**
```javascript
const url = `https://2factor.in/API/V1/${apiKey}/VOICE/91${phone}/AUTOGEN`;
```

**✅ CORRECT (gives you SMS):**
```javascript
const url = `https://2factor.in/API/V1/${apiKey}/SMS/91${phone}/AUTOGEN`;
```

### Step 2: Update the Endpoint

**Find and replace:**
- Find: `/VOICE/`
- Replace with: `/SMS/`

That's it! Your OTPs will now come via SMS instead of voice calls.

---

## 📋 Complete Working Examples

### ✅ AUTOGEN Method (SMS)

#### Send SMS OTP:
```bash
curl -X GET "https://2factor.in/API/V1/YOUR_API_KEY/SMS/919876543210/AUTOGEN"
```

Response:
```json
{
  "Status": "Success",
  "Details": "5D6EBEE6-EC04-4776-846D"
}
```

#### Verify OTP:
```bash
curl -X GET "https://2factor.in/API/V1/YOUR_API_KEY/SMS/VERIFY/5D6EBEE6-EC04-4776-846D/123456"
```

---

### ✅ Custom OTP Method (SMS)

#### Send Custom SMS OTP:
```bash
curl -X POST "https://2factor.in/API/V1/YOUR_API_KEY/SMS/919876543210/123456"
```

---

## 💻 Updated Code Examples

### Node.js/JavaScript

**SMS OTP Service:**
```javascript
// services/twoFactorService.js
const fetch = require('node-fetch');

class TwoFactorService {
  constructor() {
    this.apiKey = process.env.TWO_FACTOR_API_KEY;
    this.baseUrl = 'https://2factor.in/API/V1';
  }

  /**
   * Send SMS OTP using AUTOGEN
   */
  async sendSMSOTP(phone) {
    try {
      // ✅ CORRECT: Use /SMS/ for text messages
      const url = `${this.baseUrl}/${this.apiKey}/SMS/91${phone}/AUTOGEN`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (data.Status === 'Success') {
        return {
          success: true,
          sessionId: data.Details,
          message: 'SMS OTP sent successfully'
        };
      } else {
        throw new Error(data.Details || 'Failed to send OTP');
      }

    } catch (error) {
      console.error('2Factor SMS Error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to send SMS OTP'
      };
    }
  }

  /**
   * Send Voice OTP (if you want voice instead)
   */
  async sendVoiceOTP(phone) {
    try {
      // For voice calls, use /VOICE/
      const url = `${this.baseUrl}/${this.apiKey}/VOICE/91${phone}/AUTOGEN`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (data.Status === 'Success') {
        return {
          success: true,
          sessionId: data.Details,
          message: 'Voice OTP sent successfully'
        };
      } else {
        throw new Error(data.Details || 'Failed to send voice OTP');
      }

    } catch (error) {
      console.error('2Factor Voice Error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to send voice OTP'
      };
    }
  }

  /**
   * Verify OTP (works for both SMS and Voice)
   */
  async verifyOTP(sessionId, otp) {
    try {
      // Verify endpoint is same for both SMS and Voice
      const url = `${this.baseUrl}/${this.apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (data.Status === 'Success' && data.Details === 'OTP Matched') {
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        return {
          success: false,
          message: data.Details || 'Invalid OTP'
        };
      }

    } catch (error) {
      console.error('2Factor Verify Error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to verify OTP'
      };
    }
  }
}

module.exports = new TwoFactorService();
```

### Python

```python
import requests

class TwoFactorService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://2factor.in/API/V1"
    
    def send_sms_otp(self, phone):
        """Send SMS OTP using AUTOGEN"""
        # ✅ CORRECT: Use /SMS/ for text messages
        url = f"{self.base_url}/{self.api_key}/SMS/91{phone}/AUTOGEN"
        
        response = requests.get(url)
        data = response.json()
        
        if data.get("Status") == "Success":
            return {
                "success": True,
                "session_id": data.get("Details"),
                "message": "SMS OTP sent successfully"
            }
        else:
            return {
                "success": False,
                "message": data.get("Details", "Failed to send OTP")
            }
    
    def verify_otp(self, session_id, otp):
        """Verify OTP"""
        url = f"{self.base_url}/{self.api_key}/SMS/VERIFY/{session_id}/{otp}"
        
        response = requests.get(url)
        data = response.json()
        
        if data.get("Status") == "Success" and data.get("Details") == "OTP Matched":
            return {
                "success": True,
                "message": "OTP verified successfully"
            }
        else:
            return {
                "success": False,
                "message": data.get("Details", "Invalid OTP")
            }

# Usage
service = TwoFactorService("YOUR_API_KEY")
result = service.send_sms_otp("9876543210")
print(result)
```

### PHP

```php
<?php
class TwoFactorService {
    private $apiKey;
    private $baseUrl = "https://2factor.in/API/V1";
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    public function sendSMSOTP($phone) {
        // ✅ CORRECT: Use /SMS/ for text messages
        $url = "{$this->baseUrl}/{$this->apiKey}/SMS/91{$phone}/AUTOGEN";
        
        $response = file_get_contents($url);
        $data = json_decode($response, true);
        
        if ($data['Status'] === 'Success') {
            return [
                'success' => true,
                'session_id' => $data['Details'],
                'message' => 'SMS OTP sent successfully'
            ];
        } else {
            return [
                'success' => false,
                'message' => $data['Details'] ?? 'Failed to send OTP'
            ];
        }
    }
    
    public function verifyOTP($sessionId, $otp) {
        $url = "{$this->baseUrl}/{$this->apiKey}/SMS/VERIFY/{$sessionId}/{$otp}";
        
        $response = file_get_contents($url);
        $data = json_decode($response, true);
        
        if ($data['Status'] === 'Success' && $data['Details'] === 'OTP Matched') {
            return [
                'success' => true,
                'message' => 'OTP verified successfully'
            ];
        } else {
            return [
                'success' => false,
                'message' => $data['Details'] ?? 'Invalid OTP'
            ];
        }
    }
}

// Usage
$service = new TwoFactorService("YOUR_API_KEY");
$result = $service->sendSMSOTP("9876543210");
print_r($result);
?>
```

---

## 🎯 Quick Test

Test which endpoint you're using:

### Test SMS:
```bash
curl "https://2factor.in/API/V1/YOUR_API_KEY/SMS/91YOUR_PHONE/AUTOGEN"
```
**Result:** You should get a text message 📱

### Test Voice:
```bash
curl "https://2factor.in/API/V1/YOUR_API_KEY/VOICE/91YOUR_PHONE/AUTOGEN"
```
**Result:** You should get a phone call 📞

---

## 💡 Important Notes

1. **No Dashboard Setting**: There's NO setting in 2Factor dashboard to switch between SMS/Voice. It's purely based on the API endpoint you call.

2. **Credits Are Separate**: 
   - SMS credits are used for `/SMS/` endpoint
   - Voice credits are used for `/VOICE/` endpoint
   - Make sure you have SMS credits purchased

3. **Template Still Works**: Your approved SMS template will work fine once you use the correct `/SMS/` endpoint

4. **Same Verification**: The verification endpoint (`/SMS/VERIFY/`) works for BOTH SMS and Voice OTPs

---

## ✅ Checklist

- [ ] Replace `/VOICE/` with `/SMS/` in your code
- [ ] Verify you have SMS credits (not just voice credits)
- [ ] Test with your phone number
- [ ] Check you're using the correct API key
- [ ] Ensure phone number has country code (91 for India)

---

## 🔍 Still Getting Voice Calls?

If you've changed to `/SMS/` and still getting voice calls, check:

1. **Search your entire codebase** for `/VOICE/` - you might have it in multiple places
2. **Clear any caches** - restart your server
3. **Check if you have SMS credits** - login to 2Factor dashboard and verify balance
4. **Contact 2Factor support** - support@2factor.in if issue persists

---

## 📞 2Factor Support

- **Email**: support@2factor.in
- **Dashboard**: https://2factor.in/CP/menu.php
- **Documentation**: https://2factor.in/API/DOCS/

---

## Summary

**The fix is simple:**

Change this:
```
/VOICE/  ❌
```

To this:
```
/SMS/  ✅
```

That's all! No settings to change, no dashboard configuration - just use the correct API endpoint! 🎉
