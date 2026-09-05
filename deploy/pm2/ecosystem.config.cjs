module.exports = {
  apps: [
    {
      name: "elmed-api",
      cwd: "/var/www/elmed/backend",
      script: "dist/serveur.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "elmed-web",
      cwd: "/var/www/elmed/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_URL_API: "/api",
      },
    },
  ],
};
