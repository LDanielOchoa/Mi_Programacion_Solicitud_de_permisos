const nextConfig = {
  experimental: {
    appDir: true,
    outputFileTracing: true,
    optimizeCss: false, // evalúa si quieres dejarlo en false en prod
  },

  productionBrowserSourceMaps: true, // Esto genera source maps en prod, útil para debugging remoto pero aumenta tamaño

  webpack: (config, { isServer, dev }) => {
    // Excluir algunas librerías en el servidor
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "chart.js",
        "recharts",
        "nodemailer",
      ];
    }

    // Optimizar splitChunks para mejor cacheo
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
      },
    };

    // Opcional: controlar devtool según entorno para evitar eval-source-map en prod
    if (!dev) {
      config.devtool = false; // Desactiva devtool en producción para bundles limpios
    }

    return config;
  },

  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
