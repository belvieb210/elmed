const portApi = process.env.PORT_API || "4000";
const portWeb = process.env.PORT_WEB || "3000";

module.exports = {
  apps: [
    {
      name: "elmed-api",
      cwd: "/var/www/elmed/backend",
      script: "dist/serveur.js",
      env: {
        NODE_ENV: "production",
        PORT_API: portApi,
      },
    },
    {
      name: "elmed-web",
      cwd: "/var/www/elmed/frontend",
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${portWeb}`,
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_URL_API: "/api",
        PORT_WEB: portWeb,
      },
    },
  ],
};
