module.exports = {
  apps: [
    {
      name: 'cmv-server',
      script: 'src/server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'cmv-cron',
      script: 'src/jobs/emailExportJob.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: false,
      cron_restart: '0 0 25 * *', // 25th of every month at midnight
      error_file: './logs/cron-err.log',
      out_file: './logs/cron-out.log',
      log_file: './logs/cron-combined.log',
      time: true,
      autorestart: true
    }
  ]
};
  