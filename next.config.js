const { GenerateSW } = require("workbox-webpack-plugin");

const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Only include in production builds on the client side
      if (!config.plugins.find((plugin) => plugin.constructor.name === "GenerateSW")) {
        config.plugins.push(
          new GenerateSW({
            swDest: "service-worker.js",
            clientsClaim: true,
            skipWaiting: true,
            include: [/\.html$/, /\.js$/, /\.css$/],
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
          })
        );
      }
    }
    return config;
  },
};

module.exports = nextConfig;
