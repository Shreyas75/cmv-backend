class Logger {
  static info(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    console.error(`❌ ${message}`, ...args);
  }

  static warn(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  static success(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${message}`, ...args);
    }
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
      console.log(`🐛 ${message}`, ...args);
    }
  }
}

module.exports = Logger;
