const Logger = require('../utils/logger');

const corsLogger = (req, res, next) => {
  // Only log CORS issues in development mode
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_CORS === 'true') {
    const origin = req.headers.origin;
    const method = req.method;
    
    // Only log if there might be a CORS issue
    if (origin && method === 'OPTIONS') {
      Logger.debug(`CORS Preflight: ${method} from ${origin}`);
    } else if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      Logger.debug(`External request: ${method} from ${origin}`);
    }
  }
  
  next();
};

module.exports = corsLogger;
