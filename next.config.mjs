/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  // tu configuración de Next.js existente podría ir aquí
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/operator/:path*',
        destination: 'https://solicitud-permisos.sao6.com.co/api/operator/:path*',
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default pwaConfig(nextConfig);
