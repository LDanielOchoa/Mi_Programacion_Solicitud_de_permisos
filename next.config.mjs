const nextConfig = {
  // Configuración básica y segura
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // Headers básicos para cache
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Configuración de imágenes básica
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Configuración experimental mínima
  experimental: {
    optimizeCss: false, // Desactivar para evitar problemas
  },

  // Webpack básico sin optimizaciones complejas
  webpack: (config, { dev, isServer }) => {
    // Solo configuraciones básicas
    if (isServer) {
      config.externals = [...(config.externals || [])];
    }

    // Resolver SVGs de manera simple
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
