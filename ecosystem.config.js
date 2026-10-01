module.exports = {
  apps: [
    {
      name: 'bplo-backend',
      script: 'server.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      time: true
    },
    {
      name: 'bplo-frontend',
      script: 'npm',
      args: 'run preview --prefix client -- --port 3000',
      watch: false,
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
