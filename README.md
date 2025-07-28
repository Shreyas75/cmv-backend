# CMV Backend

A Node.js/Express backend API for CMV (Community Management and Volunteering) platform with event management, user registration, and automated data export features.

## Features

- **Event Management**: CRUD operations for carousel items, upcoming events, featured events, and archived events
- **User Registration**: Volunteer registration with OTP verification
- **Image Upload**: Integration with Cloudinary for image storage
- **Data Export**: CSV export functionality with automated monthly email reports
- **Admin Authentication**: Basic admin login system
- **Email Services**: OTP verification and automated reporting via email

## Project Structure

```
cmv-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB connection
│   │   └── email.js     # Email transporter setup
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── carouselController.js
│   │   ├── upcomingEventController.js
│   │   ├── featuredEventController.js
│   │   ├── archivedEventController.js
│   │   └── utilityController.js
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── CarouselItem.js
│   │   ├── UpcomingEvent.js
│   │   ├── FeaturedEvent.js
│   │   └── ArchivedEvent.js
│   ├── routes/          # Express routes
│   │   ├── index.js     # Main router
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── carouselRoutes.js
│   │   ├── upcomingEventRoutes.js
│   │   ├── featuredEventRoutes.js
│   │   ├── archivedEventRoutes.js
│   │   └── utilityRoutes.js
│   ├── services/        # Business logic services
│   │   ├── otpService.js
│   │   ├── cloudinaryService.js
│   │   └── exportService.js
│   ├── middleware/      # Custom middleware
│   │   └── errorHandler.js
│   ├── jobs/           # Background jobs
│   │   └── emailExportJob.js
│   ├── utils/          # Utility functions
│   ├── app.js          # Application entry point
│   └── server.js       # Server setup (for dev mode)
├── exports/            # CSV export files
├── logs/              # Log files (production)
├── .env.sample        # Environment variables template
├── .gitignore
├── Dockerfile
├── ecosystem.config.js # PM2 configuration
├── package.json
└── README.md
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.sample` to `.env` and configure your environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm start` - Start production server with cron jobs
- `npm run dev` - Start development server without cron jobs  
- `npm run cron` - Run only the cron job for email exports

## Environment Variables

Create a `.env` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
ADMIN_USERNAME=admin_username
ADMIN_PASSWORD=admin_password
PORT=5001
```

## API Endpoints

### Authentication
- `POST /api/send-otp-email` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP
- `POST /api/admin/login` - Admin login

### User Management  
- `POST /api/volunteer` - Register volunteer
- `POST /api/submit-user-details` - Submit user details

### Event Management
- `GET/POST/DELETE /api/carousel-items` - Carousel items CRUD
- `GET/POST/DELETE /api/upcoming-events` - Upcoming events CRUD
- `GET/POST/DELETE /api/featured-events` - Featured events CRUD
- `GET/POST/DELETE /api/archived-events` - Archived events CRUD
- `GET /api/archived-events/:id` - Get single archived event

### Utilities
- `POST /api/upload-image` - Upload image to Cloudinary
- `GET /api/export-user-data` - Export user data as CSV

### Health Check
- `GET /health` - Server health status

## Deployment

### Using Docker
```bash
docker build -t cmv-backend .
docker run -p 5001:5001 --env-file .env cmv-backend
```

### Using PM2
```bash
pm2 start ecosystem.config.js
```

## Features Removed/Improved

- ✅ Removed all debugging console.log statements
- ✅ Organized code into proper MVC structure
- ✅ Separated concerns into services, controllers, and routes
- ✅ Added proper error handling middleware
- ✅ Improved code organization and readability
- ✅ Added proper validation and error responses
- ✅ Structured configuration files
- ✅ Enhanced Docker and PM2 configurations
- ✅ Added comprehensive logging setup
- ✅ Improved security with non-root user in Docker
