# CMV Backend API Reference

## 🎯 Overview
The CMV backend provides multiple systems including donation management, CGCC 2025 registration, event management with multiple image support, and admin export capabilities.

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

### 3. **Event Management** (Public)
- **Upcoming Events**: Support for single or multiple images per event
- **Featured Events**: Event highlighting and management
- **Archived Events**: Historical event storage
- Full CRUD operations for all event types

### 4. **Admin Export System** (Simple access like export user data)
- CSV export with filtering options
- Statistics and analytics for donations and CGCC registrations
- Event management capabilities
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

### **Event Management Endpoints**
```
# Upcoming Events (Now supports multiple images!)
GET /api/upcoming-events           # Get all upcoming events
GET /api/upcoming-events/:id       # Get specific event by ID
POST /api/upcoming-events          # Create new event (single or multiple images)
PUT /api/upcoming-events/:id       # Update existing event
DELETE /api/upcoming-events/:id    # Delete event

# Featured Events
GET /api/featured-events           # Get all featured events
POST /api/featured-events          # Create new featured event
DELETE /api/featured-events/:id    # Delete featured event

# Archived Events
GET /api/archived-events           # Get all archived events
POST /api/archived-events          # Create new archived event
DELETE /api/archived-events/:id    # Delete archived event
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

## 📊 Event Management Usage Examples

### **Creating Events with Multiple Images**

**Single Image (Backward Compatible):**
```json
{
  "eventName": "Bhagavad Gita Study Circle",
  "description": "Weekly study sessions on the Bhagavad Gita",
  "schedule": "Every Sunday 10:00 AM - 12:00 PM",
  "highlights": ["Expert guidance", "Group discussions", "Practical applications"],
  "contact": "contact@cmvellore.org",
  "image": "https://example.com/gita-study.jpg"
}
```

**Multiple Images (New Feature):**
```json
{
  "eventName": "Chinmaya Mission Annual Festival",
  "description": "Grand celebration with cultural programs, spiritual discourses, and community activities",
  "schedule": "December 15-17, 2025",
  "highlights": ["Cultural performances", "Spiritual discourses", "Food stalls", "Children's activities"],
  "contact": "events@cmvellore.org",
  "images": [
    "https://example.com/festival-main.jpg",
    "https://example.com/cultural-performance.jpg",
    "https://example.com/spiritual-discourse.jpg",
    "https://example.com/childrens-activities.jpg"
  ]
}
```

**Mixed Approach (Both single and multiple images):**
```json
{
  "eventName": "Meditation Workshop",
  "description": "Learn various meditation techniques",
  "schedule": "January 20, 2025 - 9:00 AM to 5:00 PM",
  "highlights": ["Guided meditation", "Breathing techniques", "Q&A session"],
  "contact": "meditation@cmvellore.org",
  "image": "https://example.com/main-meditation.jpg",
  "images": [
    "https://example.com/meditation-hall.jpg",
    "https://example.com/meditation-techniques.jpg"
  ]
}
```

### **Response Format (with multiple images):**
```json
{
  "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
  "eventName": "Chinmaya Mission Annual Festival",
  "description": "Grand celebration with cultural programs...",
  "schedule": "December 15-17, 2025",
  "highlights": ["Cultural performances", "Spiritual discourses"],
  "contact": "events@cmvellore.org",
  "image": "https://example.com/main-image.jpg",
  "images": [
    "https://example.com/festival-main.jpg",
    "https://example.com/cultural-performance.jpg",
    "https://example.com/spiritual-discourse.jpg"
  ],
  "allImages": [
    "https://example.com/main-image.jpg",
    "https://example.com/festival-main.jpg",
    "https://example.com/cultural-performance.jpg",
    "https://example.com/spiritual-discourse.jpg"
  ],
  "createdAt": "2025-07-30T10:30:00.000Z",
  "updatedAt": "2025-07-30T10:30:00.000Z"
}
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
```

## 🔧 Important Implementation Notes

### **1. Donation Form Validation Rules**
- **Email**: Must be valid email format
- **Phone**: Exactly 10 digits
- **Pin Code**: Exactly 6 digits
- **Amount**: Must be positive number
- **Transaction ID**: Must be unique (backend validates)
- **State**: Must be valid Indian state

### **2. Event Image Validation Rules**
- **Single Image**: `image` field accepts one valid image URL
- **Multiple Images**: `images` array accepts multiple valid image URLs
- **Requirements**: At least one image is required (either `image` or `images` array)
- **Format**: URLs must end with .jpg, .jpeg, .png, .gif, or .webp
- **Protocol**: Must start with http:// or https://
- **Backward Compatibility**: Existing events with single `image` field continue to work

### **3. CGCC 2025 Registration Validation Rules**
- **registrationVia**: Must be "Balavihar Centre", "School", or "Other"
- **otherSpecify**: Required and non-empty only when registrationVia is "Other"
- **firstName, lastName, schoolName, parentName**: Required, non-empty strings
- **middleName**: Optional string
- **standard**: Must be one of "1st" through "12th"
- **mobileNo**: Must match ^[6-9]\d{9}$ (Indian mobile format)
- **emailAddress**: Must be valid email format
- **dateOfBirth**: Must be valid date, not in the future
- **Duplicate Prevention**: Prevents duplicate registrations by email + mobile combination

### **4. Security Considerations**
- Rate limiting: 5 requests per 15 minutes per IP for donations
- Rate limiting: 10 requests per 15 minutes per IP for CGCC registrations
- Input sanitization automatically applied
- Image URL validation for security
- PAN numbers are hashed before storage (donations)
- All registration attempts logged for audit

### **5. Error Handling**
- **400**: Validation errors (missing/invalid fields, invalid image URLs)
- **404**: Resource not found (for GET, PUT, DELETE by ID)
- **409**: Duplicate transaction ID (donations) or duplicate registration (CGCC)
- **429**: Rate limit exceeded
- **500**: Server error

### **6. Success Response Formats**

**Event Creation Success:**
```json
{
  "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
  "eventName": "Event Name",
  "allImages": ["url1", "url2", "url3"],
  "createdAt": "2025-07-30T10:30:00.000Z"
}
```

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

### **7. CSV Export Columns**

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

## 🆕 **New Multiple Images Feature**

### **Key Benefits:**
- ✅ **Backward Compatible**: Existing single image events continue to work
- ✅ **Flexible**: Support both single and multiple images
- ✅ **Comprehensive**: `allImages` virtual field combines all images
- ✅ **Validated**: All image URLs are validated for format and security
- ✅ **CRUD Complete**: Full create, read, update, delete support

### **Frontend Integration Tips:**
- Use `allImages` field to display all images (recommended)
- For new events, prefer `images` array over single `image`
- Handle both formats for maximum compatibility
- Validate image URLs on frontend before submission

---

*This backend provides production-ready systems for donations, CGCC 2025 registrations, and event management with multiple image support. All systems follow the same simple admin access pattern as existing features.*
