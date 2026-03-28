# 2Factor Support Request: SMS OTP Not Working - Only Voice Calls

## Account Details
- **API Key**: `55102e40-fdc9-11f0-a6b2-0200cd936042`
- **Account Balances**:
  - SMS Balance: **2189 credits** ✅
  - Voice Balance: **50 credits**
- **Approved Template**: `CMVQuizOTP`
- **Template Content**: `XXXX is your OTP for Chinmaya Mission Quiz. Valid for 5 minutes.`

---

## Problem Summary

**We purchased SMS OTP credits but ALL OTP requests result in VOICE CALLS instead of SMS messages.**

Every API endpoint we try returns `{"Status":"Success"}` but the user receives a **phone call**, not an SMS.

---

## All API Endpoints Tested (ALL FAILED - Got Voice Calls)

### Test 1: SMS AUTOGEN (Recommended by 2Factor docs)
```bash
curl "https://2factor.in/API/V1/55102e40-fdc9-11f0-a6b2-0200cd936042/SMS/918080791915/AUTOGEN"
```
**Response**: `{"Status":"Success","Details":"cd15f06e-cf8a-4397-bd48-784909a6f0bf"}`
**Result**: ❌ Received VOICE CALL, not SMS

### Test 2: SMS AUTOGEN3 (SMS-only, no voice fallback)
```bash
curl "https://2factor.in/API/V1/55102e40-fdc9-11f0-a6b2-0200cd936042/SMS/8080791915/AUTOGEN3"
```
**Response**: `{"Status":"Success","Details":"..."}`
**Result**: ❌ Received VOICE CALL, not SMS

### Test 3: SMS AUTOGEN3 with Template
```bash
curl "https://2factor.in/API/V1/55102e40-fdc9-11f0-a6b2-0200cd936042/SMS/8080791915/AUTOGEN3/CMVQuizOTP"
```
**Response**: `{"Status":"Success","Details":"..."}`
**Result**: ❌ Received VOICE CALL, not SMS

### Test 4: Transactional SMS with custom OTP and Template
```bash
curl "https://2factor.in/API/V1/55102e40-fdc9-11f0-a6b2-0200cd936042/SMS/8080791915/654321/CMVQuizOTP"
```
**Response**: `{"Status":"Success","Details":"12695980-9e6b-47cd-a4e3-c9153d47c84c"}`
**Result**: ❌ Received VOICE CALL saying "OTP is 654321", not SMS

### Test 5: SMS without template
```bash
curl "https://2factor.in/API/V1/55102e40-fdc9-11f0-a6b2-0200cd936042/SMS/8080791915/123456"
```
**Response**: `{"Status":"Success","Details":"..."}`
**Result**: ❌ Received VOICE CALL, not SMS

---

## What We've Verified

| Check | Status |
|-------|--------|
| SMS Credits Available | ✅ 2189 credits |
| API Key Valid | ✅ All requests return Success |
| Template Approved | ✅ CMVQuizOTP is approved |
| Using /SMS/ endpoint (NOT /VOICE/) | ✅ Confirmed |
| Phone number format correct | ✅ Tried with and without 91 prefix |
| Multiple endpoints tested | ✅ 5+ different endpoint formats |

---

## Code Implementation

Our current code in `src/services/smsOtpService.js`:

```javascript
// Using SMS AUTOGEN endpoint as per 2Factor documentation
const apiUrl = `https://2factor.in/API/V1/${this.apiKey}/SMS/91${cleanedPhone}/AUTOGEN`;

const response = await axios.get(apiUrl);
// Response: {"Status":"Success","Details":"session-id"}
// But user receives VOICE CALL, not SMS!
```

---

## Conclusion

**This is NOT a code issue.** We are correctly using the `/SMS/` endpoint, but 2Factor's backend is routing all OTPs to voice calls.

### Possible Causes (Need 2Factor to Check):
1. Account was created with Voice OTP as default channel
2. Account-level routing is set to Voice
3. DLT configuration is missing/incorrect causing SMS to fail silently and fallback to voice
4. SMS service is not enabled for this API key

---

## Request to 2Factor Support

Please:
1. **Enable SMS OTP delivery** for API key `55102e40-fdc9-11f0-a6b2-0200cd936042`
2. **Disable automatic voice fallback** - we only want SMS
3. **Check DLT configuration** - ensure SMS can be delivered
4. **Verify account settings** - confirm SMS routing is enabled

---

## Contact Information
- **Email**: [Your email]
- **Phone for testing**: 8080791915
- **Template Name**: CMVQuizOTP

---

## Test Phone Numbers Used
- 8080791915
- 8080157915

Both numbers receive voice calls instead of SMS when using any `/SMS/` endpoint.

---

## Timeline
- **Date**: January 30, 2026
- **Issue Duration**: Multiple hours of testing
- **Credits Purchased**: SMS OTP credits
- **Credits Being Used**: Voice credits (incorrectly)

---

## Screenshots/Evidence

### Balance Check:
```json
SMS Balance: {"Status":"Success","Details":"2189"}
Voice Balance: {"Status":"Success","Details":"50"}
```

### API Response (looks successful but delivers voice):
```json
{
  "Status": "Success",
  "Details": "cd15f06e-cf8a-4397-bd48-784909a6f0bf"
}
```

---

## Summary

We are calling `/SMS/` endpoints but receiving voice calls. This indicates an account-level configuration issue that only 2Factor support can resolve. Please configure our account for SMS-only OTP delivery.
