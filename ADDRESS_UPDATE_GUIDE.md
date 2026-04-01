# Address Components Implementation Guide

## Overview

The Chinmaya Mission Vasai backend now supports **enhanced address capture** with optional component fields. This allows donors to provide more structured address information while maintaining backward compatibility with the existing flat address field.

---

## Backend Changes

### New Optional Fields

Three new optional fields have been added to the Donation model:

| Field | Type | Required | Max Length | Example |
|-------|------|----------|------------|---------|
| `address` | String | ✅ Yes | - | "123 Main Street" |
| `houseNumber` | String | ❌ Optional | - | "123-A" |
| `area` | String | ❌ Optional | - | "Vasai East" |
| `city` | String | ✅ Yes | - | "Vasai" |
| `state` | String | ✅ Yes | - | "Maharashtra" |
| `pinCode` | String | ✅ Yes | 6 digits | "401201" |
| `country` | String | ❌ Optional | - | "India" |

### How It Works

**Flat Address (Current - Still Required):**
```
address: "123-A Main Street, Vasai East"
```

**Structured Address (New - Optional):**
```
houseNumber: "123-A",
area: "Vasai East",
address: "Main Street",
city: "Vasai",
state: "Maharashtra",
pinCode: "401201",
country: "India"
```

### Backend Usage

All fields are now automatically handled:
- ✅ **Validation**: houseNumber and area are optional strings
- ✅ **Storage**: Both flat and component addresses stored in database
- ✅ **Receipt PDF**: Displays components as separate lines if provided
- ✅ **CSV Export**: Includes separate columns for each component

---

## Frontend Implementation

### Step 1: Update TypeScript Interface

```typescript
interface DonationRequest {
  fullName: string;
  email: string;
  phoneNumber: string;        // 10 digits
  amount: number;
  state: string;
  city: string;
  pinCode: string;            // 6 digits
  address: string;            // Required: flat address
  houseNumber?: string;       // NEW: Optional house/flat number
  area?: string;              // NEW: Optional area/locality name
  country?: string;           // Optional, defaults to 'India'
  seek80G: 'yes' | 'no';
  reasonForDonation: string;
  purpose?: string;
  panCardNumber?: string;
}
```

### Step 2: Update Donation Form

#### Option A: Show All Fields Together (Recommended)

```jsx
import React, { useState } from 'react';

const AddressSection = ({ formData, handleChange }) => {
  return (
    <div className="address-section">
      <h3>Address Details</h3>
      
      {/* House Number (Optional) */}
      <div className="form-group">
        <label>House Number / Flat Number</label>
        <input
          type="text"
          name="houseNumber"
          value={formData.houseNumber || ''}
          onChange={handleChange}
          placeholder="e.g., 123-A, Flat 5"
        />
        <small>Optional: House or flat number</small>
      </div>

      {/* Area (Optional) */}
      <div className="form-group">
        <label>Area / Locality / Neighborhood</label>
        <input
          type="text"
          name="area"
          value={formData.area || ''}
          onChange={handleChange}
          placeholder="e.g., Vasai East, Sector 10"
        />
        <small>Optional: Area or locality name</small>
      </div>

      {/* Street Address (Required) */}
      <div className="form-group">
        <label>Street Address *</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g., Main Street, Plot 45"
          rows="2"
          required
        />
        <small>Required: Full street address</small>
      </div>

      {/* City (Required) */}
      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City name"
            required
          />
        </div>

        {/* State (Required) */}
        <div className="form-group">
          <label>State *</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          >
            {/* List of Indian states */}
          </select>
        </div>
      </div>

      {/* Pin Code (Required) */}
      <div className="form-row">
        <div className="form-group">
          <label>Pin Code *</label>
          <input
            type="text"
            name="pinCode"
            value={formData.pinCode}
            onChange={handleChange}
            placeholder="6 digits"
            maxLength="6"
            required
          />
        </div>

        {/* Country (Optional) */}
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            name="country"
            value={formData.country || 'India'}
            onChange={handleChange}
            placeholder="Country name"
          />
          <small>Optional, defaults to 'India'</small>
        </div>
      </div>
    </div>
  );
};

export default AddressSection;
```

#### Option B: Two-Step Address Input

```jsx
const AddressForm = ({ formData, handleChange }) => {
  const [useComponents, setUseComponents] = useState(false);

  return (
    <div className="address-form">
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={useComponents}
            onChange={(e) => setUseComponents(e.target.checked)}
          />
          Provide detailed address components?
        </label>
      </div>

      {useComponents ? (
        // Detailed component form
        <>
          <div className="form-row">
            <input
              name="houseNumber"
              placeholder="House No. (optional)"
              value={formData.houseNumber || ''}
              onChange={handleChange}
            />
            <input
              name="area"
              placeholder="Area (optional)"
              value={formData.area || ''}
              onChange={handleChange}
            />
          </div>
          <textarea
            name="address"
            placeholder="Street Address *"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </>
      ) : (
        // Simple flat address
        <textarea
          name="address"
          placeholder="Enter full address *"
          value={formData.address}
          onChange={handleChange}
          required
        />
      )}

      {/* Rest of address fields (City, State, etc.) */}
    </div>
  );
};
```

### Step 3: Form Data Preparation

```javascript
// When submitting the donation form:
const donationData = {
  fullName: formData.fullName,
  email: formData.email,
  phoneNumber: formData.phoneNumber,
  amount: Number(formData.amount),
  state: formData.state,
  city: formData.city,
  pinCode: formData.pinCode,
  address: formData.address,           // Required
  houseNumber: formData.houseNumber,   // Optional
  area: formData.area,                 // Optional
  country: formData.country,           // Optional
  seek80G: formData.seek80G,
  reasonForDonation: formData.reasonForDonation,
  purpose: formData.purpose,
  panCardNumber: formData.panCardNumber
};

// Send to backend
const response = await fetch('/api/mswipe/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(donationData)
});
```

### Step 4: Validation

```javascript
const validateAddressFields = (data) => {
  const errors = [];

  // Required flat address
  if (!data.address || !data.address.trim()) {
    errors.push('Street address is required');
  }

  // Optional house number (type check only if provided)
  if (data.houseNumber && typeof data.houseNumber !== 'string') {
    errors.push('House number must be text');
  }

  // Optional area (type check only if provided)
  if (data.area && typeof data.area !== 'string') {
    errors.push('Area must be text');
  }

  // Required city
  if (!data.city || !data.city.trim()) {
    errors.push('City is required');
  }

  // Required state
  if (!data.state) {
    errors.push('State is required');
  }

  // Required pincode (6 digits)
  if (!data.pinCode || !/^[0-9]{6}$/.test(data.pinCode)) {
    errors.push('Valid 6-digit pin code is required');
  }

  // Optional country
  if (data.country && typeof data.country !== 'string') {
    errors.push('Country must be text');
  }

  return errors;
};
```

---

## Donation Receipt Display

### PDF Receipt Output

When a donation with address components is received, the receipt PDF displays:

```
ADDRESS DETAILS
─────────────────────────
House No:          123-A
Area:              Vasai East
Address:           Main Street
City:              Vasai
State:             Maharashtra
Pincode:           401201
Country:           India
```

### Backward Compatibility

Old donations with only flat address display as:

```
ADDRESS DETAILS
─────────────────────────
Address:           123 Main Street, Vasai
City:              Vasai
State:              Maharashtra
Pincode:           401201
Country:           India
```

---

## CSV Export

### Column Order

The admin CSV export now includes separate columns:

```
Donation Reference | Full Name | Email | Phone | House Number | Area | Address | City | State | Pin Code | Country | ...
```

**Example Row:**
```
CMV1234567890 | John Doe | john@email.com | 9876543210 | 123-A | Vasai East | Main Street | Vasai | Maharashtra | 401201 | India
```

---

## API Request Examples

### Example 1: With Address Components

```bash
curl -X POST http://localhost:5002/api/mswipe/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "9876543210",
    "amount": 1000,
    "state": "Maharashtra",
    "city": "Vasai",
    "pinCode": "401201",
    "address": "Main Street",
    "houseNumber": "123-A",
    "area": "Vasai East",
    "country": "India",
    "seek80G": "no",
    "reasonForDonation": "General Donation"
  }'
```

### Example 2: Without Address Components (Flat)

```bash
curl -X POST http://localhost:5002/api/mswipe/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phoneNumber": "9876543211",
    "amount": 5000,
    "state": "Karnataka",
    "city": "Bangalore",
    "pinCode": "560001",
    "address": "123-A Main Street, Vasai East",
    "seek80G": "yes",
    "reasonForDonation": "Building Fund",
    "panCardNumber": "ABCDE1234F"
  }'
```

---

## Migration Strategy

### For Existing Donations
- ✅ All existing flat address donations continue to work
- ✅ No database migration required
- ✅ CSV exports show empty values for houseNumber and area columns

### For New Donations
- ✅ If provided: houseNumber and area are stored separately
- ✅ If not provided: Only flat address is stored (backward compatible)
- ✅ Receipt PDF smartly displays components if available

---

## Testing Checklist

- [ ] Test donation with ONLY flat address (backward compatible)
- [ ] Test donation with BOTH flat AND component addresses
- [ ] Verify receipt PDF shows split address sections when components provided
- [ ] Verify receipt PDF shows flat address when components not provided
- [ ] Export CSV and confirm new columns appear with correct data
- [ ] Verify old donations in CSV show empty values for new columns
- [ ] Test form validation for required vs optional fields
- [ ] Verify API accepts requests with and without address components

---

## Frontend Integration Points

| Feature | New Fields Used | Impact |
|---------|-----------------|--------|
| Donation Form | houseNumber, area | Optional inputs in address section |
| Form Validation | houseNumber, area | Type checks (string, optional) |
| Receipt Download | houseNumber, area | Enhanced display in PDF |
| CSV Export | houseNumber, area | New columns in admin export |
| Address Storage | houseNumber, area | Separate DB fields |

---

## Code Examples (Complete React Component)

```jsx
import React, { useState } from 'react';

const DonationFormWithAddressComponents = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    amount: '',
    state: 'Maharashtra',
    city: '',
    pinCode: '',
    address: '',
    houseNumber: '',  // NEW
    area: '',         // NEW
    country: 'India',
    seek80G: 'no',
    reasonForDonation: 'General Donation',
    purpose: '',
    panCardNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare donation data (all optional fields can be undefined)
    const donationData = {
      ...formData,
      amount: Number(formData.amount),
      houseNumber: formData.houseNumber || undefined,
      area: formData.area || undefined,
      panCardNumber: formData.panCardNumber || undefined,
      purpose: formData.purpose || undefined
    };

    try {
      const response = await fetch('/api/mswipe/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('pendingDonationRef', result.donationRef);
        window.location.href = result.paymentUrl;
      } else {
        alert('Error: ' + (result.error || 'Registration failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="donation-form">
      <h2>Make a Donation</h2>

      {/* Donor Information */}
      <div className="form-group">
        <label>Full Name *</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      {/* Address Section */}
      <fieldset className="address-section">
        <legend>Address Information</legend>

        <div className="form-group">
          <label>House Number / Flat Number</label>
          <input
            type="text"
            name="houseNumber"
            value={formData.houseNumber}
            onChange={handleChange}
            placeholder="e.g., 123-A, Flat 5"
          />
          <small>Optional</small>
        </div>

        <div className="form-group">
          <label>Area / Locality</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="e.g., Vasai East"
          />
          <small>Optional</small>
        </div>

        <div className="form-group">
          <label>Street Address *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Main Street, Plot 45"
            rows="2"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Pin Code *</label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              maxLength="6"
              pattern="[0-9]{6}"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="India"
          />
          <small>Optional, defaults to 'India'</small>
        </div>
      </fieldset>

      <button type="submit" className="submit-btn">
        Proceed to Payment
      </button>
    </form>
  );
};

export default DonationFormWithAddressComponents;
```

---

## Support

For questions or issues with address component implementation, please refer to:
- Backend: [MSWIPE_INTEGRATION_GUIDE.md](MSWIPE_INTEGRATION_GUIDE.md)
- Frontend: [FRONTEND_MSWIPE_GUIDE.md](FRONTEND_MSWIPE_GUIDE.md)
- API: `/api/mswipe/initiate` endpoint documentation
