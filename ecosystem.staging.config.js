module.exports = {
  apps: [
    {
      name: 'cmv-staging-server',
      script: 'server.js',
      instances: 1, // Single instance for staging/testing
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5002
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      watch: false,
      max_memory_restart: '512M', // Lower memory limit for staging
      error_file: './logs/staging-err.log',
      out_file: './logs/staging-out.log',
      log_file: './logs/staging-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 15, // Higher restarts for testing
      min_uptime: '5s', // Lower uptime for faster testing
      restart_delay: 1000 // 1 second delay between restarts
    },
    {
      name: 'cmv-staging-cron',
      script: 'cron-job.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_staging: {
        NODE_ENV: 'staging'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: false,
      cron_restart: '0 2 * * *', // Daily at 2 AM for testing
      error_file: './logs/staging-cron-err.log',
      out_file: './logs/staging-cron-out.log',
      log_file: './logs/staging-cron-combined.log',
      time: true,
      autorestart: true
    }
  ]
};
