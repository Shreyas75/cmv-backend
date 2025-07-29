# CMV Backend API Reference

## 🎯 Overview
The CM## 📊 Admin Route Usage Examples

### **Donation Management**
```
GET /api/admin/export/donations
GET /api/admin/export/donations?startDate=2025-01-01&endDate=2025-12-31
GET /api/admin/export/donations?status=completed&minAmount=1000
GET /api/admin/stats/donations
GET /api/admin/donations/recent?page=2&limit=20
```

### **CGCC 2025 Management**
```
GET /api/cgcc2025/stats              # Get registration statistics
GET /api/cgcc2025/export             # Export all registrations as CSV
```

## 📥 Available Export Filters

### **Donation Filters**
- `startDate` - Filter donations from this date (YYYY-MM-DD)
- `endDate` - Filter donations until this date (YYYY-MM-DD)
- `status` - Filter by status (pending, completed, failed)
- `minAmount` - Minimum donation amount
- `maxAmount` - Maximum donation amount
- `reasonForDonation` - Filter by donation reason

### **CGCC 2025 Registration**
The registration endpoint accepts the following JSON structure:
```json
{
  "registrationVia": "Balavihar Centre",        // "Balavihar Centre" | "School" | "Other"
  "otherSpecify": "Community Center",           // Required only if registrationVia is "Other"
  "firstName": "John",                          // Required: Student's first name
  "middleName": "Kumar",                        // Optional: Student's middle name
  "lastName": "Doe",                            // Required: Student's last name
  "schoolName": "ABC High School",              // Required: Name of the school
  "standard": "10th",                           // "1st" to "12th"
  "parentName": "Jane Doe",                     // Required: Parent/Guardian's name
  "mobileNo": "9876543210",                     // Required: 10-digit Indian mobile (6-9 start)
  "emailAddress": "john.doe@example.com",       // Required: Valid email address
  "dateOfBirth": "2010-05-15"                   // Required: YYYY-MM-DD format
}
```multiple systems including donation management, CGCC 2025 registration, and admin export capabilities.

## 📋 Available Features

### 1. **Donation Submission** (Public)
- Secure donation form with comprehensive validation
- Email notifications to donors
- Rate limiting protection
- Input sanitization and XSS prevention

### 2. **CGCC 2025 Registration** (Public)
- Chinmaya Gita Chanting Competition 2025 registrations
- Student registration with parent details
- Duplicate prevention and validation
- Rate limiting protection

### 3. **Admin Export System** (Simple access like export user data)
- CSV export with filtering options
- Statistics and analytics for both donations and CGCC registrations
- Paginated listing capabilities
- Same simple access as existing admin features


## 🔗 API Endpoints

### **Public Donation Endpoint**
```
POST /api/donations
```

### **Public CGCC 2025 Registration**
```
POST /api/cgcc2025/register
```

### **Admin-Only Endpoints** (Simple GET requests - no auth required)
```
# Donation Management
GET /api/admin/export/donations      # Export donations CSV with optional filters
GET /api/admin/stats/donations       # Get donation statistics  
GET /api/admin/donations/recent      # Get paginated recent donations

# CGCC 2025 Management
GET /api/cgcc2025/stats              # Get registration statistics
GET /api/cgcc2025/export             # Export registrations CSV
```

## � Admin Route Usage Examples

### **Export Donations (with optional filters)**
```
GET /api/admin/export/donations
GET /api/admin/export/donations?startDate=2025-01-01&endDate=2025-12-31
GET /api/admin/export/donations?status=completed&minAmount=1000
```

### **Get Donation Statistics**
```
GET /api/admin/stats/donations
```

### **Get Recent Donations (paginated)**
```
GET /api/admin/donations/recent
GET /api/admin/donations/recent?page=2&limit=20
```

## 📥 Available Export Filters

- `startDate` - Filter donations from this date (YYYY-MM-DD)
- `endDate` - Filter donations until this date (YYYY-MM-DD)
- `status` - Filter by status (pending, completed, failed)
- `minAmount` - Minimum donation amount
- `maxAmount` - Maximum donation amount
- `reasonForDonation` - Filter by donation reason

## 🔧 Important Implementation Notes

### **1. Donation Form Validation Rules**
- **Email**: Must be valid email format
- **Phone**: Exactly 10 digits
- **Pin Code**: Exactly 6 digits
- **Amount**: Must be positive number
- **Transaction ID**: Must be unique (backend validates)
- **State**: Must be valid Indian state

### **2. CGCC 2025 Registration Validation Rules**
- **registrationVia**: Must be "Balavihar Centre", "School", or "Other"
- **otherSpecify**: Required and non-empty only when registrationVia is "Other"
- **firstName, lastName, schoolName, parentName**: Required, non-empty strings
- **middleName**: Optional string
- **standard**: Must be one of "1st" through "12th"
- **mobileNo**: Must match ^[6-9]\d{9}$ (Indian mobile format)
- **emailAddress**: Must be valid email format
- **dateOfBirth**: Must be valid date, not in the future
- **Duplicate Prevention**: Prevents duplicate registrations by email + mobile combination

### **3. Security Considerations**
- Rate limiting: 5 requests per 15 minutes per IP for donations
- Rate limiting: 3 requests per 15 minutes per IP for CGCC registrations
- Input sanitization automatically applied
- PAN numbers are hashed before storage (donations)
- All registration attempts logged for audit

### **4. Error Handling**
- **400**: Validation errors (missing/invalid fields)
- **409**: Duplicate transaction ID (donations) or duplicate registration (CGCC)
- **429**: Rate limit exceeded
- **500**: Server error

### **5. Success Response Formats**

**Donation Success Response:**
```json
{
  "donationId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "donationRef": "CMV1722160123456789"
}
```

**CGCC 2025 Registration Success Response:**
```json
{
  "success": true,
  "message": "Registration successful for CGCC 2025",
  "data": {
    "registrationId": "CGCC202517537968478593305",
    "participantName": "John Kumar Doe",
    "registrationDate": "2025-07-29T13:47:27.861Z",
    "competitionYear": 2025
  }
}
```

**CGCC 2025 Error Response:**
```json
{
  "success": false,
  "message": "Validation error message or duplicate registration message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific field error message"
    }
  ]
}
```

### **6. CSV Export Columns**

**Donation Export:**
- Donation Reference, Full Name, Email, Phone Number
- State, City, Pin Code, Address
- Seek 80G Certificate, Amount (Rs.), Transaction ID
- Reason for Donation, Purpose, Status
- IP Address, Created Date, Updated Date

**CGCC 2025 Registration Export:**
- Registration ID, Participant Name, First Name, Middle Name, Last Name
- School Name, Standard, Parent Name, Mobile Number, Email Address
- Date of Birth, Registration Via, Other Specify
- Registration Date, IP Address

---

*This backend provides production-ready systems for donations and CGCC 2025 registrations with the same simple admin access pattern as your existing user export feature.*
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Donation submitted successfully! Reference: ${result.donationRef}`);
        // Reset form or redirect
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error || 'Submission failed'}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <input
        type="tel"
        placeholder="Phone Number (10 digits)"
        pattern="[0-9]{10}"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
        required
      />
      
      <select
        value={formData.state}
        onChange={(e) => setFormData({...formData, state: e.target.value})}
        required
      >
        <option value="">Select State</option>
        <option value="Karnataka">Karnataka</option>
        <option value="Maharashtra">Maharashtra</option>
        {/* Add all Indian states */}
      </select>
      
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData({...formData, city: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Pin Code (6 digits)"
        pattern="[0-9]{6}"
        value={formData.pinCode}
        onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
        required
      />
      
      <select
        value={formData.seek80G}
        onChange={(e) => setFormData({...formData, seek80G: e.target.value})}
        required
      >
        <option value="no">No 80G Certificate</option>
        <option value="yes">Yes, I need 80G Certificate</option>
      </select>
      
      <input
        type="number"
        placeholder="Amount (₹)"
        min="1"
        value={formData.amount}
        onChange={(e) => setFormData({...formData, amount: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Transaction ID (UPI Reference)"
        value={formData.transactionId}
        onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
        required
      />
      
      <select
        value={formData.reasonForDonation}
        onChange={(e) => setFormData({...formData, reasonForDonation: e.target.value})}
        required
      >
        <option value="">Select Reason</option>
        <option value="Gurudakshina">Gurudakshina</option>
        <option value="General Donation">General Donation</option>
        <option value="Event Sponsorship">Event Sponsorship</option>
        <option value="Building Fund">Building Fund</option>
        <option value="Educational Support">Educational Support</option>
        <option value="Community Service">Community Service</option>
        <option value="Special Occasion">Special Occasion</option>
        <option value="Other">Other</option>
      </select>
      
      <textarea
        placeholder="Purpose (Optional)"
        value={formData.purpose}
        onChange={(e) => setFormData({...formData, purpose: e.target.value})}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Donation'}
      </button>
      
      {message && <div className={message.includes('✅') ? 'success' : 'error'}>{message}</div>}
    </form>
  );
};
```

### **2. Admin Export Component**

```jsx
// Admin Export Component
import React, { useState } from 'react';

const AdminExport = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    reasonForDonation: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const exportCSV = async () => {
    setLoading(true);
    
    // Build query parameters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    try {
      const response = await fetch(`/api/admin/export/donations?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('✅ CSV exported successfully!');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/stats/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Export Panel</h2>
      
      {/* Admin Credentials */}
      <div className="credentials">
        <input
          type="text"
          placeholder="Admin Username"
          value={credentials.username}
          onChange={(e) => setCredentials({...credentials, username: e.target.value})}
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        />
      </div>
      
      {/* Export Filters */}
      <div className="filters">
        <h3>Export Filters</h3>
        <input
          type="date"
          placeholder="Start Date"
          value={filters.startDate}
          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
        />
        <input
          type="date"
          placeholder="End Date"
          value={filters.endDate}
          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="number"
          placeholder="Min Amount"
          value={filters.minAmount}
          onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
        />
        <input
          type="number"
          placeholder="Max Amount"
          value={filters.maxAmount}
          onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="actions">
        <button onClick={exportCSV} disabled={loading}>
          {loading ? 'Exporting...' : '📥 Export CSV'}
        </button>
        <button onClick={getStats} disabled={loading}>
          {loading ? 'Loading...' : '📊 Get Statistics'}
        </button>
      </div>
      
      {/* Statistics Display */}
      {stats && (
        <div className="stats">
          <h3>📊 Donation Statistics</h3>
          <div>Total Donations: {stats.summary.totalDonations}</div>
          <div>Total Amount: ₹{stats.summary.totalAmount.toLocaleString('en-IN')}</div>
          <div>Average Amount: ₹{Math.round(stats.summary.avgAmount).toLocaleString('en-IN')}</div>
          <div>Pending: {stats.summary.pendingCount}</div>
          <div>Completed: {stats.summary.completedCount}</div>
          <div>Failed: {stats.summary.failedCount}</div>
          
          {stats.reasonBreakdown.length > 0 && (
            <div>
              <h4>Breakdown by Reason:</h4>
              {stats.reasonBreakdown.map((reason, index) => (
                <div key={index}>
                  {reason._id}: {reason.count} (₹{reason.totalAmount.toLocaleString('en-IN')})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### **3. Vanilla JavaScript Implementation**

```javascript
// For non-React applications
class DonationManager {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async submitDonation(formData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }
    } catch (error) {
      throw error;
    }
  }

  async exportDonations(credentials, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${this.baseUrl}/api/admin/export/donations?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      const blob = await response.blob();
      this.downloadBlob(blob, `donations-export-${new Date().toISOString().split('T')[0]}.csv`);
      return true;
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  async getDonationStats(credentials) {
    const response = await fetch(`${this.baseUrl}/api/admin/stats/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Usage
const donationManager = new DonationManager('https://your-domain.com');

// Submit donation
donationManager.submitDonation(formData)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));

// Export donations
donationManager.exportDonations(
  { username: 'admin', password: 'password' },
  { startDate: '2025-01-01', status: 'completed' }
);
```

## 🔧 Important Implementation Notes

### **1. Validation Rules**
- **Email**: Must be valid email format
- **Phone**: Exactly 10 digits
- **Pin Code**: Exactly 6 digits
- **Amount**: Must be positive number
- **Transaction ID**: Must be unique (backend validates)
- **State**: Must be valid Indian state

### **2. Security Considerations**
- Rate limiting: 5 requests per 15 minutes per IP
- Input sanitization automatically applied
- Admin routes require authentication
- PAN numbers are hashed before storage

### **3. Error Handling**
- **400**: Validation errors (missing/invalid fields)
- **409**: Duplicate transaction ID
- **401**: Invalid admin credentials
- **429**: Rate limit exceeded
- **500**: Server error

### **4. Success Response Format**
```json
{
  "donationId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "donationRef": "CMV1722160123456789"
}
```

### **5. CSV Export Columns**
- Donation Reference, Full Name, Email, Phone Number
- State, City, Pin Code, Address
- Seek 80G Certificate, Amount (Rs.), Transaction ID
- Reason for Donation, Purpose, Status
- IP Address, Created Date, Updated Date

## 🎨 Styling Recommendations

### **Form Styling**
```css
.donation-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

input, select, textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #007bff;
}

.submit-btn {
  background: #007bff;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

.submit-btn:hover {
  background: #0056b3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success {
  color: #155724;
  background: #d4edda;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.error {
  color: #721c24;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
```

## 🚀 Quick Start Checklist

1. **Set up form validation** with the required fields
2. **Implement rate limiting handling** on frontend
3. **Add loading states** for better UX
4. **Create error message display** system
5. **Test with invalid data** to verify validation
6. **Implement admin authentication** securely
7. **Add CSV download functionality** for admin
8. **Test file download** in different browsers
9. **Style forms** for good user experience
10. **Add success confirmations** and thank you messages

## 📞 Support

For integration issues or questions about the API, check the backend logs or contact the development team. All endpoints return proper HTTP status codes and JSON error messages for easy debugging.

---

*This backend provides a production-ready donation system with comprehensive validation, security measures, and admin capabilities. Follow this guide to integrate seamlessly with your frontend application.*
