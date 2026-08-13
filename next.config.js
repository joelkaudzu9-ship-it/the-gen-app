// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable standalone output
  output: 'standalone',
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Disable static generation for specific pages
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig